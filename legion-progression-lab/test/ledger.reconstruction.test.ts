/**
 * S2.1 (owner L1/S2 review §3): validated reconstruction accepts every valid serialisable history, including large
 * cumulative turnover summed in canonical (txId) order, and still refuses every corruption.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { LEDGER_IMPLEMENTATIONS } from '../src/core/ledger/implementations.ts';
import { generateOps, runDifferential } from '../src/core/ledger/differential.ts';
import { balance, type Ledger, type Tx } from '../src/core/ledger/ledger.ts';
import { applyTxPersistent, emptyPersistentLedger, persistentLedgerInvariants, reconstructPersistentLedger, serializeLedger } from '../src/core/ledger/persistentLedger.ts';

const M = Number.MAX_SAFE_INTEGER;
const tx = (txId: string, delta: number, resourceId = 'res.gold', bucket: 'available' | 'reserved' = 'available'): Tx => ({ txId, purpose: 'review', lines: [{ resourceId, bucket, delta }] });
const apply = (txs: readonly Tx[], from: Ledger = emptyPersistentLedger()): Ledger => txs.reduce((l, t) => applyTxPersistent(l, t).ledger, from);
const roundTrip = (l: Ledger): Ledger => reconstructPersistentLedger(serializeLedger(l));
function error(fn: () => unknown): { code: string; message: string } | null {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return { code: e.code, message: e.message };
    throw e;
  }
  return null;
}

describe('validated reconstruction at numerical boundaries (S2.1)', () => {
  it('the reviewer reproduction: credit M, debit M, credit M (txIds a, z, b) reconstructs to balance M', () => {
    const l = apply([tx('a', M), tx('z', -M), tx('b', M)]);
    const back = roundTrip(l);
    expect(balance(back, 'res.gold')).toBe(M);
    expect(serializeLedger(back)).toBe(serializeLedger(l));
    expect(persistentLedgerInvariants(back)).toBeNull();
  });

  it('every lexicographic order of the transaction IDs is accepted (the canonical summing order never matters)', () => {
    const ids = ['a', 'm', 'z'];
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (const p of perms) {
      // chronological order is always +M, -M, +M; only the IDs (hence the canonical order) change
      const l = apply([tx(ids[p[0] as number] as string, M), tx(ids[p[1] as number] as string, -M), tx(ids[p[2] as number] as string, M)]);
      expect(serializeLedger(roundTrip(l))).toBe(serializeLedger(l));
    }
  });

  it('large positive and negative cumulative turnover, independent resources and reserved buckets', () => {
    const txs: Tx[] = [];
    for (let i = 0; i < 50; i += 1) {
      txs.push(tx(`t${String(99 - i).padStart(3, '0')}.in`, M - i, 'res.gold'), tx(`t${String(i).padStart(3, '0')}.out`, -(M - i), 'res.gold'));
      txs.push(tx(`r${i}.in`, M, 'res.iron', 'reserved'), tx(`r${i}.out`, -M, 'res.iron', 'reserved'));
    }
    txs.push(tx('final.gold', 7), tx('final.iron', M, 'res.iron', 'reserved'), { txId: 'multi', purpose: 'review', lines: [{ resourceId: 'res.wood', bucket: 'available', delta: M }, { resourceId: 'res.wood', bucket: 'reserved', delta: M - 1 }] });
    const l = apply(txs);
    const back = roundTrip(l);
    expect(serializeLedger(back)).toBe(serializeLedger(l));
    expect(balance(back, 'res.gold')).toBe(7);
    expect(balance(back, 'res.iron', 'reserved')).toBe(M);
    expect(balance(back, 'res.wood', 'reserved')).toBe(M - 1);
  });

  it('after reconstruction, an exact replay returns the original receipt and a different payload is TX_CONFLICT', () => {
    const l = roundTrip(apply([tx('a', M), tx('z', -M), tx('b', M)]));
    const again = applyTxPersistent(l, tx('z', -M));
    expect(again.result.replayed).toBe(true);
    expect(again.result.nets).toEqual([{ resourceId: 'res.gold', bucket: 'available', delta: -M }]);
    expect(again.ledger).toBe(l);
    expect(error(() => applyTxPersistent(l, tx('z', -1)))?.code).toBe('TX_CONFLICT');
    expect(error(() => applyTxPersistent(l, tx('new', 1)))?.code).toBe('NUMERIC_LIMIT'); // the balance itself stays bounded
  });

  it('branched histories each reconstruct to their own content', () => {
    const base = apply([tx('a', M), tx('b', -M)]);
    const left = apply([tx('c', M), tx('d', -5)], base);
    const right = apply([tx('c', 3), tx('e', M - 3)], base);
    expect(serializeLedger(roundTrip(left))).toBe(serializeLedger(left));
    expect(serializeLedger(roundTrip(right))).toBe(serializeLedger(right));
    expect(serializeLedger(roundTrip(base))).toBe(serializeLedger(base));
    expect(balance(roundTrip(left), 'res.gold')).toBe(M - 5);
    expect(balance(roundTrip(right), 'res.gold')).toBe(M);
  });

  it('corrupted balances and receipts are still refused, as invalid input (INVALID_STATE), never as NUMERIC_LIMIT', () => {
    const good = JSON.parse(serializeLedger(apply([tx('a', M), tx('z', -M), tx('b', M)])));
    const cases: [string, (d: any) => unknown, RegExp][] = [
      ['balance off by one', (d) => ({ ...d, balances: [[d.balances[0][0], { ...d.balances[0][1], available: M - 1 }]] }), /does not equal the sum/],
      ['balance above the safe range', (d) => ({ ...d, balances: [[d.balances[0][0], { ...d.balances[0][1], available: M + 1 }]] }), /non-negative safe integers/],
      ['receipt changed', (d) => ({ ...d, committed: d.committed.map(([id, r]: any) => [id, id === 'z' ? { ...r, nets: [[r.nets[0][0], r.nets[0][1], -M + 1]] } : r]) }), /does not equal the sum/],
      ['receipt delta beyond the safe range', (d) => ({ ...d, committed: d.committed.map(([id, r]: any) => [id, id === 'b' ? { ...r, nets: [[r.nets[0][0], r.nets[0][1], M + 2]] } : r]) }), /non-zero safe integer/],
      ['a receipt removed', (d) => ({ ...d, committed: d.committed.filter(([id]: any) => id !== 'z') }), /does not equal the sum/],
      ['turnover on a resource missing from balances', (d) => ({ ...d, committed: [...d.committed, ['zz', { payloadHash: 'a'.repeat(64), nets: [['res.iron', 'available', M]] }]] }), /missing from balances/],
    ];
    for (const [name, corrupt, why] of cases) {
      const e = error(() => reconstructPersistentLedger(corrupt(structuredClone(good))));
      expect(e?.code, name).toBe('INVALID_STATE');
      expect(e?.message, name).toMatch(why);
    }
  });

  it('a self-consistent but forged history is accepted: reconstruction checks structure and conservation, not authenticity', () => {
    const forged = { schema: 'legion.ledger.v1', balances: [['res.gold', { available: 5, reserved: 0 }]], committed: [['gift', { payloadHash: 'f'.repeat(64), nets: [['res.gold', 'available', 5]] }]] };
    expect(balance(reconstructPersistentLedger(forged), 'res.gold')).toBe(5);
  });

  it('randomised: every valid history with near-limit turnover survives serialization and reconstruction, in both implementations', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (seed) => {
        const r = runDifferential(generateOps(seed, 400, { extremes: true }), LEDGER_IMPLEMENTATIONS.reference, LEDGER_IMPLEMENTATIONS.persistent, { compareEvery: 20, reconstruct: true });
        expect(r.mismatches).toEqual([]);
        expect(r.reconstructions).toBeGreaterThan(0);
      }),
      { numRuns: 60 },
    );
  });
});
