import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { applyTx, BUCKETS, emptyLedger, type Bucket, type Ledger, type Tx } from '../src/core/ledger/ledger.ts';
import { safeIntArb } from './helpers/reference.ts';

const RESOURCES = ['res.gold', 'res.mat.slime_gel', 'res.mat.copper_ore'];
const lineArb = fc.record({
  resourceId: fc.constantFrom(...RESOURCES),
  bucket: fc.constantFrom<Bucket>(...BUCKETS),
  delta: fc.oneof(safeIntArb(-50, 50), safeIntArb(-1_000_000, 1_000_000)).filter((d) => d !== 0),
});
const txArb = fc.array(fc.array(lineArb, { minLength: 1, maxLength: 5 }), { minLength: 1, maxLength: 60 });

function run(ledger: Ledger, txs: Tx[]): { ledger: Ledger; committed: Tx[]; nets: Map<string, number> } {
  let current = ledger;
  const committed: Tx[] = [];
  const nets = new Map<string, number>();
  for (const tx of txs) {
    try {
      const out = applyTx(current, tx);
      if (!out.result.replayed) {
        committed.push(tx);
        for (const n of out.result.nets) nets.set(`${n.resourceId}|${n.bucket}`, (nets.get(`${n.resourceId}|${n.bucket}`) ?? 0) + n.delta);
      }
      current = out.ledger;
    } catch (e) {
      if (!(e instanceof LabError)) throw e;
    }
  }
  return { ledger: current, committed, nets };
}

describe('ledger properties over random transaction sequences', () => {
  it('balances are never negative and always equal the sum of committed nets (conservation)', () => {
    fc.assert(
      fc.property(txArb, (lineSets) => {
        const txs: Tx[] = lineSets.map((lines, i) => ({ txId: `tx.${i}`, purpose: 'random', lines }));
        const { ledger, nets } = run(emptyLedger(), txs);
        for (const r of RESOURCES) {
          for (const b of BUCKETS) {
            const bal = ledger.balances.get(r)?.[b] ?? 0;
            expect(bal).toBeGreaterThanOrEqual(0);
            expect(bal).toBe(nets.get(`${r}|${b}`) ?? 0);
          }
        }
      }),
      { seed: 20261113, numRuns: 500 },
    );
  });

  it('replaying every transaction again changes nothing (no repeated claims)', () => {
    fc.assert(
      fc.property(txArb, (lineSets) => {
        const txs: Tx[] = lineSets.map((lines, i) => ({ txId: `tx.${i}`, purpose: 'random', lines }));
        const first = run(emptyLedger(), txs);
        const again = run(first.ledger, first.committed);
        expect(again.committed.length).toBe(0);
        expect([...again.ledger.balances.entries()]).toEqual([...first.ledger.balances.entries()]);
      }),
      { seed: 20261113, numRuns: 300 },
    );
  });
});
