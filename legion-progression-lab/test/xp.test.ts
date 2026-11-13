import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import {
  applyExpAward,
  buildXpTable,
  cumulativeReport,
  estimateFirstUnsafeCumulativeLevel,
  estimateFirstUnsafeThresholdLevel,
  type XpCurve,
} from '../src/core/formulas/xp.ts';

const CANDIDATE: XpCurve = { family: 'powerGeometric', a: 10, p: 1.6, g: 1 };

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

describe('XP table', () => {
  it('builds the candidate table (values independently confirmed by xp_oracle.py)', () => {
    expect(buildXpTable(CANDIDATE, 12)).toEqual([10, 30, 58, 92, 131, 176, 225, 279, 336, 398, 464, 533]);
  });

  it('is non-decreasing with every threshold >= 1', () => {
    const t = buildXpTable(CANDIDATE, 200);
    expect(t.every((v, i) => v >= 1 && (i === 0 || v >= (t[i - 1] ?? 0)))).toBe(true);
  });

  it('refuses invalid curves, empty tables and unsafe thresholds', () => {
    expect(code(() => buildXpTable({ ...CANDIDATE, a: 0 }, 3))).toBe('INVALID_TABLE');
    expect(code(() => buildXpTable({ ...CANDIDATE, g: 0.9 }, 3))).toBe('INVALID_TABLE');
    expect(code(() => buildXpTable(CANDIDATE, 0))).toBe('INVALID_TABLE');
    expect(code(() => buildXpTable({ family: 'powerGeometric', a: 1e16, p: 0, g: 1 }, 1))).toBe('NUMERIC_LIMIT');
  });
});

describe('thresholds vs cumulative EXP', () => {
  it('cumulative EXP can leave the safe range while every single threshold is safe', () => {
    const r = cumulativeReport([2 ** 52, 2 ** 52]);
    expect(r.cumulative).toEqual([0, 2 ** 52]);
    expect(r.lastSafeCumulativeLevel).toBe(2);
    expect(r.cumulativeCompleteWithinTable).toBe(false);
  });

  it('reports separate approximate limits for the candidate curve', () => {
    const t = estimateFirstUnsafeThresholdLevel(CANDIDATE);
    const c = estimateFirstUnsafeCumulativeLevel(CANDIDATE);
    expect(t.level).not.toBeNull();
    expect(c.level).not.toBeNull();
    // 10 * L^1.6 > 2^53 near L ~ 2.2e9; the cumulative total crosses far earlier.
    expect(t.level ?? 0).toBeGreaterThan(2e9);
    expect(t.level ?? 0).toBeLessThan(2.5e9);
    expect(c.level ?? 0).toBeLessThan(t.level ?? 0);
  });
});

describe('EXP awards', () => {
  const table = [10, 30, 58];

  it('applies multi-level awards in order and keeps the leftover', () => {
    expect(applyExpAward({ level: 1, expIntoLevel: 5 }, 35, table, 1000)).toEqual({ level: 3, expIntoLevel: 0, levelUps: [2, 3] });
    expect(applyExpAward({ level: 2, expIntoLevel: 0 }, 29, table, 1000)).toEqual({ level: 2, expIntoLevel: 29, levelUps: [] });
  });

  it('never discards EXP: an award past the table end is refused as a whole', () => {
    expect(applyExpAward({ level: 1, expIntoLevel: 0 }, 98, table, 1000)).toEqual({ level: 4, expIntoLevel: 0, levelUps: [2, 3, 4] });
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 0 }, 99, table, 1000))).toBe('XP_TABLE_EXHAUSTED');
    expect(code(() => applyExpAward({ level: 4, expIntoLevel: 0 }, 1, table, 1000))).toBe('XP_TABLE_EXHAUSTED');
  });

  it('refuses invalid state and runaway loops', () => {
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 10 }, 0, table, 1000))).toBe('INVALID_STATE');
    expect(code(() => applyExpAward({ level: 0, expIntoLevel: 0 }, 1, table, 1000))).toBe('INVALID_STATE');
    // v2: no intermediate sum, so this is refused only because the 1 EXP left over has no threshold to go into.
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 2 ** 53 - 2 }, 2, [2 ** 53 - 1], 1000))).toBe('XP_TABLE_EXHAUSTED');
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 0 }, 5, [1, 1, 1, 1, 1], 2))).toBe('LEVEL_UP_GUARD');
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 0 }, Number.NaN, table, 1000))).toBe('INVALID_NUMBER');
  });
});

describe('EXP awards v2 (S0.1): no intermediate overflow, dense inputs only', () => {
  const M = 2 ** 53 - 1;
  const table = [10, 30, 58];

  it('S0 review reproduction: an award of 2 one EXP short of a 2^53 - 1 threshold', () => {
    expect(applyExpAward({ level: 1, expIntoLevel: M - 1 }, 2, [M, M], 10)).toEqual({ level: 2, expIntoLevel: 1, levelUps: [2] });
    const a = applyExpAward({ level: 1, expIntoLevel: M - 1 }, 1, [M, M], 10);
    expect(applyExpAward(a, 1, [M, M], 10)).toEqual({ level: 2, expIntoLevel: 1, levelUps: [] });
  });

  it('awards up to 2^53 - 1 cross large thresholds exactly and conserve EXP', () => {
    // need 2, then M - 5, leaving 3: 1 + M = 3 + (M - 5) + 3.
    expect(applyExpAward({ level: 1, expIntoLevel: 1 }, M, [3, M - 5, M], 1000)).toEqual({ level: 3, expIntoLevel: 3, levelUps: [2, 3] });
  });

  it('keeps table-exhaustion, guard and ordering behaviour', () => {
    expect(code(() => applyExpAward({ level: 4, expIntoLevel: 5 }, 0, table, 1000))).toBe('XP_TABLE_EXHAUSTED');
    expect(applyExpAward({ level: 1, expIntoLevel: 0 }, 2, [1, 1, 1, 1, 1], 2)).toEqual({ level: 3, expIntoLevel: 0, levelUps: [2, 3] });
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 0 }, 3, [1, 1, 1, 1, 1], 2))).toBe('LEVEL_UP_GUARD');
    expect(applyExpAward({ level: 1, expIntoLevel: 0 }, 98, table, 1000).levelUps).toEqual([2, 3, 4]);
  });

  it('is atomic: a refused award leaves the caller state object untouched', () => {
    const state = { level: 1, expIntoLevel: 5 };
    const before = JSON.stringify(state);
    expect(code(() => applyExpAward(state, 1000, table, 1000))).toBe('XP_TABLE_EXHAUSTED');
    expect(code(() => applyExpAward(state, 98, table, 1))).toBe('LEVEL_UP_GUARD');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('refuses sparse or malformed tables and states (S0 accepted new Array(2))', () => {
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 0 }, 5, new Array(2) as number[], 5))).toBe('INVALID_TABLE');
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 0 }, 5, [10, undefined, 58] as unknown as number[], 5))).toBe('INVALID_TABLE');
    expect(code(() => cumulativeReport(new Array(3) as number[]))).toBe('INVALID_TABLE');
    expect(code(() => applyExpAward(null as unknown as { level: number; expIntoLevel: number }, 5, table, 5))).toBe('INVALID_STATE');
    expect(code(() => applyExpAward({ level: 1, expIntoLevel: 0 }, 5, table, 0))).toBe('INVALID_NUMBER');
  });
});

