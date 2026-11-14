/**
 * L1 randomised differential test: random operation sequences, with branching, applied to the reference and the
 * persistent ledger; every step must give the same result (or the same error code) and the same canonical content.
 * The large run (50 seeds x 20,000 operations) is src/cli/ledger-differential.ts; this is the per-commit version.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LEDGER_IMPLEMENTATIONS } from '../src/core/ledger/implementations.ts';
import { generateOps, runDifferential } from '../src/core/ledger/differential.ts';

describe('ledger differential: reference vs persistent', () => {
  it('agree on every step of random sequences with replays, conflicts, failures and branch switches', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 - 1 }), fc.integer({ min: 1, max: 120 }), (seed, n) => {
        const report = runDifferential(generateOps(seed, n), LEDGER_IMPLEMENTATIONS.reference, LEDGER_IMPLEMENTATIONS.persistent, { compareEvery: 1 });
        expect(report.mismatches).toEqual([]);
        expect(report.steps).toBe(n);
      }),
      { numRuns: 300 },
    );
  });

  it('the generator exercises every operation kind and outcome', () => {
    const report = runDifferential(generateOps(12345, 3000), LEDGER_IMPLEMENTATIONS.reference, LEDGER_IMPLEMENTATIONS.persistent, { compareEvery: 50 });
    expect(report.mismatches).toEqual([]);
    for (const k of ['credit', 'debit', 'multi', 'reserve', 'overflow', 'invalid', 'replay', 'conflict', 'branch']) expect(report.opCounts[k] ?? 0, k).toBeGreaterThan(0);
    for (const o of ['ok', 'replayed', 'TX_CONFLICT', 'NEGATIVE_BALANCE', 'NUMERIC_LIMIT', 'INVALID_TX']) expect(report.outcomeCounts[o] ?? 0, o).toBeGreaterThan(0);
  });
});
