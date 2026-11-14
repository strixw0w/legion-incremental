/**
 * L1 persistent ledger: tree invariants, key replacement, adversarial keys, insertion-history independence, validated
 * reconstruction and mutation protection (planning/L1_LEDGER_SPECIFICATION.md §3 item 3).
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { applyTx, emptyLedger, balance, type Ledger, type Tx } from '../src/core/ledger/ledger.ts';
import {
  applyTxPersistent,
  emptyPersistentLedger,
  isPersistentLedger,
  ledgerContent,
  persistentLedgerInvariants,
  reconstructPersistentLedger,
  serializeLedger,
} from '../src/core/ledger/persistentLedger.ts';
import { checkInvariants, pentries, pget, pset, type PNode } from '../src/core/ledger/persistentMap.ts';

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}
const grant = (txId: string, delta: number, resourceId = 'res.gold'): Tx => ({ txId, purpose: 'grant', lines: [{ resourceId, bucket: 'available', delta }] });
const P = (txs: readonly Tx[], from: Ledger = emptyPersistentLedger()) => txs.reduce((l, tx) => applyTxPersistent(l, tx).ledger, from);

/** FNV-1a 32-bit, the hash the benchmark-only HAMT prototype uses. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Brute-force FNV-1a collisions among keys "<prefix><n>" (deterministic; a birthday search over about 2^17 keys). */
function fnvCollisions(prefix: string, wanted: number): [string, string][] {
  const seen = new Map<number, string>();
  const out: [string, string][] = [];
  for (let n = 0; out.length < wanted; n += 1) {
    const k = `${prefix}${n.toString(36)}`;
    const h = fnv1a(k);
    const prior = seen.get(h);
    if (prior !== undefined) out.push([prior, k]);
    else seen.set(h, k);
  }
  return out;
}

describe('persistent ordered map (AVL, path copying)', () => {
  it('keeps the AVL invariants and ascending order under random inserts and replacements', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.string({ maxLength: 6 }), fc.integer()), { maxLength: 400 }), (ops) => {
        let t: PNode<number> | null = null;
        const model = new Map<string, number>();
        for (const [k, v] of ops) {
          t = pset(t, k, v);
          model.set(k, v);
        }
        expect(checkInvariants(t)).toBeNull();
        expect([...pentries(t)]).toEqual([...model.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
      }),
      { numRuns: 200 },
    );
  });

  it('never changes an old root: every earlier version still describes its own map', () => {
    const versions: (PNode<number> | null)[] = [null];
    for (let i = 0; i < 500; i += 1) versions.push(pset(versions[versions.length - 1] ?? null, `k${(i * 7919) % 211}`, i));
    const replay = new Map<string, number>();
    versions.forEach((t, i) => {
      if (i > 0) replay.set(`k${((i - 1) * 7919) % 211}`, i - 1);
      expect(new Map(pentries(t))).toEqual(replay);
    });
  });
});

describe('persistent ledger: specific properties', () => {
  it('key replacement: a new balance in the new snapshot, the old one untouched', () => {
    const s1 = P([grant('tx.a', 5)]);
    const s2 = P([grant('tx.b', 3)], s1);
    expect([balance(s1, 'res.gold'), balance(s2, 'res.gold')]).toEqual([5, 8]);
    expect(persistentLedgerInvariants(s2)).toBeNull();
  });

  it('adversarial keys: FNV-1a 32-bit collisions, long shared prefixes, Unicode and NUL are all distinct keys', () => {
    const pairs = fnvCollisions('tx.', 6);
    for (const [a, b] of pairs) expect(fnv1a(a)).toBe(fnv1a(b));
    const resPairs = fnvCollisions('res.k', 3);
    const odd = ['tx.\u0000', 'tx.\u0000\u0000', 'tx.é', 'tx.é', 'tx.😀', `tx.${'a'.repeat(250)}`, `tx.${'a'.repeat(249)}b`];
    let l = emptyPersistentLedger();
    let r = emptyLedger();
    const txs: Tx[] = [];
    pairs.forEach(([a, b], i) => txs.push(grant(a, i + 1), grant(b, 100 + i)));
    resPairs.forEach(([a, b], i) => txs.push(grant(`tx.res.${i}`, 7, a), grant(`tx.res2.${i}`, 9, b)));
    odd.forEach((k, i) => txs.push(grant(k, 1000 + i)));
    for (const tx of txs) {
      l = applyTxPersistent(l, tx).ledger;
      r = applyTx(r, tx).ledger;
    }
    expect(l.committed.size).toBe(txs.length);
    for (const [a, b] of resPairs) expect([balance(l, a), balance(l, b)]).toEqual([7, 9]);
    pairs.forEach(([a, b], i) => {
      expect(applyTxPersistent(l, grant(a, i + 1)).result.replayed).toBe(true);
      expect(code(() => applyTxPersistent(l, grant(b, i + 1)))).toBe('TX_CONFLICT'); // b was committed with 100 + i
    });
    expect(serializeLedger(l)).toBe(serializeLedger(r));
    expect(persistentLedgerInvariants(l)).toBeNull();
  });

  it('serialization is independent of insertion history (commutative transactions in any order)', () => {
    const txs = Array.from({ length: 60 }, (_, i) => grant(`tx.${(i * 37) % 60}`, (i % 5) + 1, `res.r${i % 7}`));
    const forward = P(txs);
    const backward = P([...txs].reverse());
    const shuffled = P([...txs].sort((a, b) => (fnv1a(a.txId) < fnv1a(b.txId) ? -1 : 1)));
    expect(serializeLedger(backward)).toBe(serializeLedger(forward));
    expect(serializeLedger(shuffled)).toBe(serializeLedger(forward));
  });

  it('validated reconstruction: round trip, then replays and conflicts behave exactly as before saving', () => {
    const l = P([grant('tx.a', 5), grant('tx.b', 3, 'res.iron'), { txId: 'tx.c', purpose: 'reserve', lines: [{ resourceId: 'res.iron', bucket: 'available', delta: -1 }, { resourceId: 'res.iron', bucket: 'reserved', delta: 1 }] }, { txId: 'tx.zero', purpose: 'noop', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 2 }, { resourceId: 'res.gold', bucket: 'available', delta: -2 }] }]);
    const text = serializeLedger(l);
    const back = reconstructPersistentLedger(text);
    expect(isPersistentLedger(back)).toBe(true);
    expect(serializeLedger(back)).toBe(text);
    expect(reconstructPersistentLedger(ledgerContent(l)) && serializeLedger(reconstructPersistentLedger(ledgerContent(l)))).toBe(text);
    expect(applyTxPersistent(back, grant('tx.a', 5)).result.replayed).toBe(true);
    expect(code(() => applyTxPersistent(back, grant('tx.a', 6)))).toBe('TX_CONFLICT');
    expect(balance(applyTxPersistent(back, grant('tx.d', 1)).ledger, 'res.gold')).toBe(6);
    expect(persistentLedgerInvariants(back)).toBeNull();
    // A reference ledger's content reconstructs to the same persistent ledger.
    const ref = [grant('tx.a', 5), grant('tx.b', 3, 'res.iron')].reduce((x, tx) => applyTx(x, tx).ledger, emptyLedger());
    expect(serializeLedger(reconstructPersistentLedger(serializeLedger(ref)))).toBe(serializeLedger(ref));
  });

  it('validated reconstruction refuses every corruption (INVALID_STATE, no ledger)', () => {
    const good = JSON.parse(serializeLedger(P([grant('tx.a', 5), grant('tx.b', 3, 'res.iron')])));
    const variants: [string, (d: any) => unknown][] = [
      ['not JSON', () => '{nope'],
      ['wrong schema', (d) => ({ ...d, schema: 'legion.ledger.v0' })],
      ['extra field', (d) => ({ ...d, extra: 1 })],
      ['unsorted balances', (d) => ({ ...d, balances: [...d.balances].reverse() })],
      ['duplicate txId', (d) => ({ ...d, committed: [d.committed[0], d.committed[0], d.committed[1]] })],
      ['negative balance', (d) => ({ ...d, balances: d.balances.map(([id, b]: any) => [id, { ...b, available: -1 }]) })],
      ['fractional balance', (d) => ({ ...d, balances: d.balances.map(([id, b]: any) => [id, { ...b, available: b.available + 0.5 }]) })],
      ['conservation broken', (d) => ({ ...d, balances: d.balances.map(([id, b]: any) => [id, { ...b, available: b.available + 1 }]) })],
      ['missing resource for a net', (d) => ({ ...d, balances: d.balances.slice(1) })],
      ['bad payload hash', (d) => ({ ...d, committed: d.committed.map(([id, r]: any) => [id, { ...r, payloadHash: 'X'.repeat(64) }]) })],
      ['zero delta', (d) => ({ ...d, committed: d.committed.map(([id, r]: any) => [id, { ...r, nets: r.nets.map((n: any) => [n[0], n[1], 0]) }]) })],
      ['bad bucket', (d) => ({ ...d, committed: d.committed.map(([id, r]: any) => [id, { ...r, nets: r.nets.map((n: any) => [n[0], 'stash', n[2]]) }]) })],
      ['bad resource id', (d) => ({ ...d, balances: [['gold', { available: 0, reserved: 0 }], ...d.balances] })],
      ['empty txId', (d) => ({ ...d, committed: [['', d.committed[0][1]], ...d.committed.slice(1)] })],
      ['record field missing', (d) => ({ ...d, committed: d.committed.map(([id, r]: any) => [id, { nets: r.nets }]) })],
    ];
    for (const [name, corrupt] of variants) expect(code(() => reconstructPersistentLedger(corrupt(structuredClone(good)))), name).toBe('INVALID_STATE');
    // Refused for the right reason: key order and uniqueness are checked on the input itself, not only by the tree.
    const why = (d: unknown): string => {
      try {
        reconstructPersistentLedger(d);
      } catch (e) {
        if (e instanceof LabError) return e.message;
        throw e;
      }
      return 'accepted';
    };
    const g = structuredClone(good);
    expect(why({ ...g, balances: [...g.balances].reverse() })).toMatch(/strictly ascending resourceId order/);
    expect(why({ ...g, committed: [g.committed[0], g.committed[0], g.committed[1]] })).toMatch(/strictly ascending txId order/);
  });

  it('mutation protection: the tree is unreachable from the public ledger; views expose nothing writable', () => {
    const l = P([grant('tx.a', 5)]);
    expect(Object.getOwnPropertyNames(l.balances)).toEqual([]);
    expect(Object.getOwnPropertySymbols(l.balances)).toEqual([]);
    expect(JSON.stringify(l.balances)).toBe('{}');
    expect(() => {
      (l as { balances: unknown }).balances = new Map();
    }).toThrow(TypeError);
    expect(pget(null, 'x')).toBeUndefined();
  });

  it('a randomly built persistent ledger keeps its tree invariants (balances and committed)', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: 0, max: 40 }), fc.integer({ min: 1, max: 9 }), fc.integer({ min: 0, max: 5 })), { maxLength: 150 }), (ops) => {
        let l = emptyPersistentLedger();
        ops.forEach(([t, d, r]) => {
          try {
            l = applyTxPersistent(l, grant(`tx.${t}`, d, `res.r${r}`)).ledger;
          } catch (e) {
            if (!(e instanceof LabError)) throw e;
          }
        });
        expect(persistentLedgerInvariants(l)).toBeNull();
      }),
      { numRuns: 150 },
    );
  });
});
