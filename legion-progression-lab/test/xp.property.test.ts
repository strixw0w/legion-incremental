import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { applyExpAward, type ExpAwardResult } from '../src/core/formulas/xp.ts';
import { MAX, refAward, safeIntArb } from './helpers/reference.ts';

const OPTIONS = { seed: 20261113, numRuns: 2000 };

function tryAward(level: number, into: number, award: number, table: number[]): ExpAwardResult | string {
  try {
    return applyExpAward({ level, expIntoLevel: into }, award, table, 10_000);
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
}

const tableArb = fc.array(safeIntArb(1, 1000), { minLength: 1, maxLength: 40 }).map((xs) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted;
});

describe('EXP award properties', () => {
  it('two awards in sequence equal one combined award (multi-level awards are unambiguous)', () => {
    fc.assert(
      fc.property(tableArb, safeIntArb(0, 5000), safeIntArb(0, 5000), (table, a, b) => {
        const combined = tryAward(1, 0, a + b, table);
        const first = tryAward(1, 0, a, table);
        if (typeof first === 'string') {
          // If the first part is already refused, the combined award must be refused too.
          expect(typeof combined).toBe('string');
          return;
        }
        const second = tryAward(first.level, first.expIntoLevel, b, table);
        if (typeof combined === 'string') {
          expect(second).toBe(combined);
          return;
        }
        expect(typeof second).toBe('object');
        if (typeof second === 'object') {
          expect({ level: second.level, expIntoLevel: second.expIntoLevel }).toEqual({ level: combined.level, expIntoLevel: combined.expIntoLevel });
          expect([...first.levelUps, ...second.levelUps]).toEqual(combined.levelUps);
        }
      }),
      OPTIONS,
    );
  });

  it('total EXP is conserved: thresholds consumed + leftover = award', () => {
    fc.assert(
      fc.property(tableArb, safeIntArb(0, 20_000), (table, award) => {
        const r = tryAward(1, 0, award, table);
        if (typeof r === 'string') {
          expect(r).toBe('XP_TABLE_EXHAUSTED');
          expect(award).toBeGreaterThan(table.reduce((s, t) => s + t, 0));
          return;
        }
        const consumed = table.slice(0, r.level - 1).reduce((s, t) => s + t, 0);
        expect(consumed + r.expIntoLevel).toBe(award);
      }),
      OPTIONS,
    );
  });
});

describe('EXP award properties with thresholds up to 2^53 - 1 (S0.1)', () => {
  const M = 2 ** 53 - 1;
  const bigTable = fc
    .array(fc.oneof(safeIntArb(1, 1000), safeIntArb(1, 2 ** 40), safeIntArb(1, M), fc.constant(M)), { minLength: 1, maxLength: 8 })
    .map((xs) => [...xs].sort((a, b) => a - b));
  const bigAward = fc.oneof(safeIntArb(0, 1000), safeIntArb(0, M), fc.constant(M));

  it('one award matches unbounded integer arithmetic (no NUMERIC_LIMIT is ever needed)', () => {
    fc.assert(
      fc.property(bigTable, bigAward, safeIntArb(0, 1), (table, award, startAtTwo) => {
        const level = Math.min(1 + startAtTwo, table.length);
        const into = Math.floor((table[level - 1] ?? 1) / 2);
        const ref = refAward(table, level, into, award, 10_000);
        const got = tryAward(level, into, award, table);
        if (typeof ref === 'string') expect(got).toBe(ref);
        else expect(got).toEqual({ level: ref.level, expIntoLevel: Number(ref.expIntoLevel), levelUps: ref.levelUps });
      }),
      { seed: 20261113, numRuns: 10_000 },
    );
  });

  it('any split of an award gives the same final state and the same ordered level-ups', () => {
    fc.assert(
      fc.property(bigTable, fc.array(bigAward, { minLength: 2, maxLength: 5 }), (table, parts) => {
        const total = parts.reduce((s, p) => s + BigInt(p), 0n);
        fc.pre(total <= MAX);
        const combined = tryAward(1, 0, Number(total), table);
        let state: { level: number; expIntoLevel: number } = { level: 1, expIntoLevel: 0 };
        const ups: number[] = [];
        let failed: string | null = null;
        for (const p of parts) {
          const r = tryAward(state.level, state.expIntoLevel, p, table);
          if (typeof r === 'string') {
            failed = r;
            break;
          }
          state = { level: r.level, expIntoLevel: r.expIntoLevel };
          ups.push(...r.levelUps);
        }
        if (typeof combined === 'string') {
          // Only exhaustion can refuse here (guard 10,000 > table length); some part must then be refused too.
          expect(combined).toBe('XP_TABLE_EXHAUSTED');
          expect(failed).toBe('XP_TABLE_EXHAUSTED');
          return;
        }
        expect(failed).toBeNull();
        expect(state).toEqual({ level: combined.level, expIntoLevel: combined.expIntoLevel });
        expect(ups).toEqual(combined.levelUps);
      }),
      { seed: 20261113, numRuns: 5000 },
    );
  });
});

