/**
 * L1 ledger contract (spec/formulas/ledger.md v1.1; planning/L1_LEDGER_SPECIFICATION.md §2 C1-C12). The SAME battery
 * runs against the reference copy-on-commit ledger and the persistent ledger, plus the unchanged ledger fixtures.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { LEDGER_IMPLEMENTATIONS, type LedgerImplementation } from '../src/core/ledger/implementations.ts';
import { balance, type Ledger, type Tx } from '../src/core/ledger/ledger.ts';
import { serializeLedger } from '../src/core/ledger/persistentLedger.ts';
import { MAX_SAFE } from '../src/core/numeric/safeInt.ts';
import { LAB_ROOT } from '../src/cli/paths.ts';
import { runLedgerCase } from '../src/spec/fixtureRunner.ts';

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
const IMPLS = Object.values(LEDGER_IMPLEMENTATIONS);
const fixtures = JSON.parse(readFileSync(resolve(LAB_ROOT, '..', 'spec', 'fixtures', 'ledger.v1.json'), 'utf8')) as { cases: { id: string; input: Record<string, unknown>; expected: unknown }[] };

describe.each(IMPLS.map((i) => [i.id, i] as const))('ledger contract: %s', (_id, L: LedgerImplementation) => {
  const apply = (l: Ledger, tx: Tx) => L.applyTx(l, tx);

  it('passes every unchanged ledger fixture (spec/fixtures/ledger.v1.json)', () => {
    expect(fixtures.cases.length).toBe(15);
    for (const c of fixtures.cases) expect(runLedgerCase(c.input, L), c.id).toEqual(c.expected);
  });

  it('C4: aggregates lines with checked addition before validating', () => {
    const { ledger, result } = apply(L.empty(), { txId: 'tx.1', purpose: 'deposit', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: -3 }, { resourceId: 'res.gold', bucket: 'available', delta: 5 }] });
    expect(balance(ledger, 'res.gold')).toBe(2);
    expect(result.nets).toEqual([{ resourceId: 'res.gold', bucket: 'available', delta: 2 }]);
  });

  it('C2: a replay returns the original receipt with replayed = true and leaves the ledger unchanged (same object)', () => {
    const a = apply(L.empty(), grant('tx.a', 5));
    const again = apply(a.ledger, grant('tx.a', 5));
    expect(again.ledger).toBe(a.ledger);
    expect(again.result).toEqual({ ...a.result, replayed: true });
    expect(a.result.replayed).toBe(false);
  });

  it('C3: the same txId with a different payload is TX_CONFLICT, ledger unchanged', () => {
    const a = apply(L.empty(), grant('tx.a', 5));
    const before = serializeLedger(a.ledger);
    expect(code(() => apply(a.ledger, grant('tx.a', 6)))).toBe('TX_CONFLICT');
    expect(serializeLedger(a.ledger)).toBe(before);
  });

  it('C4: NEGATIVE_BALANCE and NUMERIC_LIMIT, exact', () => {
    const a = apply(L.empty(), grant('tx.a', 5)).ledger;
    expect(code(() => apply(a, grant('tx.b', -6)))).toBe('NEGATIVE_BALANCE');
    const full = apply(L.empty(), grant('tx.max', MAX_SAFE)).ledger;
    expect(code(() => apply(full, grant('tx.over', 1)))).toBe('NUMERIC_LIMIT');
    expect(balance(apply(a, grant('tx.c', -5)).ledger, 'res.gold')).toBe(0);
  });

  it('C12: the same validation codes', () => {
    const e = L.empty();
    expect(code(() => apply(e, { txId: '', purpose: 'grant', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 1 }] }))).toBe('INVALID_TX');
    expect(code(() => apply(e, grant('tx.z', 0)))).toBe('INVALID_TX');
    expect(code(() => apply(e, grant('tx.f', 1.5)))).toBe('INVALID_NUMBER');
    expect(code(() => apply(e, grant('tx.r', 1, 'gold')))).toBe('INVALID_TX');
  });

  it('C6: a failing transaction is atomic: the input ledger and earlier snapshots are unchanged', () => {
    const s1 = apply(L.empty(), grant('tx.a', 5)).ledger;
    const s2 = apply(s1, grant('tx.b', 7, 'res.iron')).ledger;
    const before = [serializeLedger(s1), serializeLedger(s2)];
    expect(code(() => apply(s2, { txId: 'tx.c', purpose: 'craft', lines: [{ resourceId: 'res.iron', bucket: 'available', delta: -2 }, { resourceId: 'res.gold', bucket: 'available', delta: -9 }] }))).toBe('NEGATIVE_BALANCE');
    expect([serializeLedger(s1), serializeLedger(s2)]).toEqual(before);
    expect(s2.committed.has('tx.c')).toBe(false);
  });

  it('C1: full history: every committed transaction stays, in every later snapshot (S5 bounded: the last 256 stay)', () => {
    let l = L.empty();
    for (let i = 0; i < 300; i += 1) l = apply(l, grant(`tx.${i}`, 1)).ledger;
    expect(balance(l, 'res.gold')).toBe(300);
    if (L.id === 'bounded' || L.id === 'bounded-reference') {
      // Declared difference (planning/S5_SPECIFICATION.md §1): the window keeps the most recent transactions; an evicted
      // identity is not recognised by the ledger itself (exactly-once belongs to the identity that produced it).
      expect(l.committed.size).toBe(256);
      for (let i = 44; i < 300; i += 7) expect(apply(l, grant(`tx.${i}`, 1)).result.replayed).toBe(true);
      expect(apply(l, grant('tx.0', 1)).result.replayed).toBe(false);
      return;
    }
    expect(l.committed.size).toBe(300);
    for (let i = 0; i < 300; i += 7) expect(apply(l, grant(`tx.${i}`, 1)).result.replayed).toBe(true);
  });

  it('C7: only genuine ledgers of this implementation are accepted', () => {
    const real = apply(L.empty(), grant('tx.a', 5)).ledger;
    const other = IMPLS.find((x) => x.id !== L.id) as LedgerImplementation;
    expect(code(() => apply({ balances: real.balances, committed: real.committed } as Ledger, grant('tx.b', 1)))).toBe('INVALID_STATE');
    expect(code(() => apply(Object.freeze({ ...real }) as Ledger, grant('tx.b', 1)))).toBe('INVALID_STATE');
    expect(code(() => apply(other.empty(), grant('tx.b', 1)))).toBe('INVALID_STATE');
    expect(code(() => apply(null as unknown as Ledger, grant('tx.b', 1)))).toBe('INVALID_STATE');
  });

  it('C8: every exposed object is frozen and cannot be altered', () => {
    const { ledger, result } = apply(L.empty(), grant('tx.a', 5));
    expect(Object.isFrozen(ledger) && Object.isFrozen(ledger.balances) && Object.isFrozen(ledger.committed)).toBe(true);
    expect(Object.isFrozen(ledger.balances.get('res.gold')) && Object.isFrozen(ledger.committed.get('tx.a')) && Object.isFrozen(result) && Object.isFrozen(result.nets)).toBe(true);
    expect(() => {
      (ledger.balances.get('res.gold') as { available: number }).available = 99;
    }).toThrow(TypeError);
    expect((ledger.balances as unknown as { set?: unknown }).set).toBeUndefined();
    expect(balance(ledger, 'res.gold')).toBe(5);
  });

  it('C9: branches from any snapshot are isolated; replay and conflict are judged per branch', () => {
    const base = apply(L.empty(), grant('tx.base', 10)).ledger;
    const left = apply(base, grant('tx.x', 3)).ledger;
    const right = apply(base, grant('tx.x', 4)).ledger; // same txId, different payload, other branch: allowed
    expect([balance(left, 'res.gold'), balance(right, 'res.gold'), balance(base, 'res.gold')]).toEqual([13, 14, 10]);
    expect(apply(left, grant('tx.x', 3)).result.replayed).toBe(true);
    expect(code(() => apply(left, grant('tx.x', 4)))).toBe('TX_CONFLICT');
    expect(code(() => apply(right, grant('tx.x', 3)))).toBe('TX_CONFLICT');
    expect(base.committed.has('tx.x')).toBe(false);
    const late = apply(base, grant('tx.y', 1)).ledger; // branching from an older snapshot after others were built
    expect(late.committed.size).toBe(2);
  });

  it('C10: both implementations give byte-identical canonical serializations for the same history', () => {
    const txs = [grant('tx.b', 5, 'res.iron'), grant('tx.a', 3), { txId: 'tx.c', purpose: 'reserve', lines: [{ resourceId: 'res.iron', bucket: 'available', delta: -2 }, { resourceId: 'res.iron', bucket: 'reserved', delta: 2 }] } as Tx];
    const run = (impl: LedgerImplementation) => txs.reduce((l, tx) => impl.applyTx(l, tx).ledger, impl.empty());
    expect(serializeLedger(run(L))).toBe(serializeLedger(run(IMPLS.find((x) => x.id !== L.id) as LedgerImplementation)));
  });
});
