/**
 * EXP thresholds and awards (spec/formulas/xp.md v2).
 * v2 (S0.1): awards consume the remaining requirement of each level instead of adding the whole award
 * first, so no award fails on an intermediate sum; tables and states are validated as dense values.
 *
 * Indexing: T(L) is the EXP needed to go from level L to L + 1, for L >= 1. A table of length N
 * stores T(1)..T(N); the highest reachable level is N + 1.
 * Curve family "powerGeometric": T(L) = roundHalfUp(a * L^p * g^(L-1)), evaluated in doubles as
 * (a * Math.pow(L, p)) * Math.pow(g, L - 1). This is used ONLY to build a table artifact, which must
 * be independently verified (spec/oracle/xp_oracle.py) before use. Engines consume the integer table.
 *
 * State is (level, expIntoLevel); only single-level thresholds are ever compared. Cumulative EXP is
 * report-only and can leave the safe range long before any single threshold does.
 */
import { assertDenseArray, assertRecord } from '../arrays.ts';
import { fail } from '../errors.ts';
import { roundHalfUp } from '../numeric/rounding.ts';
import { assertNonNegativeSafeInt, assertSafeInt, MAX_SAFE } from '../numeric/safeInt.ts';

export interface XpCurve {
  readonly family: 'powerGeometric';
  readonly a: number;
  readonly p: number;
  readonly g: number;
}

export function assertXpCurve(curve: XpCurve): XpCurve {
  const ok =
    curve.family === 'powerGeometric' &&
    Number.isFinite(curve.a) &&
    curve.a > 0 &&
    Number.isFinite(curve.p) &&
    curve.p >= 0 &&
    Number.isFinite(curve.g) &&
    curve.g >= 1;
  if (!ok) fail('INVALID_TABLE', 'curve needs family powerGeometric, a > 0, p >= 0, g >= 1 (all finite)', { ...curve });
  return curve;
}

/** Real-valued curve, double precision, in the specified evaluation order. Report and table building only. */
export function xpCurveValue(curve: XpCurve, level: number): number {
  return curve.a * Math.pow(level, curve.p) * Math.pow(curve.g, level - 1);
}

export function buildXpTable(curve: XpCurve, length: number): number[] {
  assertXpCurve(curve);
  const n = assertSafeInt(length, 'length');
  if (n < 1) fail('INVALID_TABLE', 'table length must be >= 1', { length: n });
  const table: number[] = [];
  for (let level = 1; level <= n; level += 1) {
    const raw = xpCurveValue(curve, level);
    if (!Number.isFinite(raw)) fail('NUMERIC_LIMIT', 'curve value is not finite', { level });
    const t = roundHalfUp(raw);
    if (!Number.isSafeInteger(t)) fail('NUMERIC_LIMIT', 'threshold exceeds the safe integer range', { level });
    if (t < 1) fail('INVALID_TABLE', 'every threshold must be >= 1', { level, threshold: t });
    const prev = table[table.length - 1];
    if (prev !== undefined && t < prev) fail('INVALID_TABLE', 'thresholds must be non-decreasing', { level });
    table.push(t);
  }
  return table;
}

export function assertXpTable(table: readonly number[]): readonly number[] {
  const list = assertDenseArray(table, 'INVALID_TABLE', 'EXP table', 1);
  let prev = 0;
  for (let i = 0; i < list.length; i += 1) {
    const t = list[i];
    if (typeof t !== 'number' || !Number.isSafeInteger(t) || t < 1) fail('INVALID_TABLE', 'thresholds must be safe integers >= 1', { index: i });
    if (t < prev) fail('INVALID_TABLE', 'thresholds must be non-decreasing', { index: i });
    prev = t;
  }
  return table;
}

export interface CumulativeReport {
  /** C(L) = EXP to reach level L from level 1 (C(1) = 0), for L = 1..lastSafeCumulativeLevel. */
  readonly cumulative: readonly number[];
  /** Highest level L in 1..N+1 whose cumulative EXP is a safe integer. */
  readonly lastSafeCumulativeLevel: number;
  /** True when every C(L) for L = 1..N+1 is safe. */
  readonly cumulativeCompleteWithinTable: boolean;
}

export function cumulativeReport(table: readonly number[]): CumulativeReport {
  assertXpTable(table);
  const cumulative: number[] = [0];
  for (const t of table) {
    const prev = cumulative[cumulative.length - 1] ?? 0;
    const next = prev + t;
    if (!Number.isSafeInteger(next)) {
      return { cumulative, lastSafeCumulativeLevel: cumulative.length, cumulativeCompleteWithinTable: false };
    }
    cumulative.push(next);
  }
  return { cumulative, lastSafeCumulativeLevel: cumulative.length, cumulativeCompleteWithinTable: true };
}

export interface ExpState {
  readonly level: number;
  readonly expIntoLevel: number;
}

export interface ExpAwardResult extends ExpState {
  readonly levelUps: readonly number[];
}

/**
 * Applies an EXP award. Atomic: either the whole award is applied, or an error is thrown and the
 * caller's state is unchanged. EXP is never discarded or clamped.
 *
 * v2 evaluation (spec/formulas/xp.md v2): the award is spent level by level. At each level the remaining
 * requirement need = T(level) - expIntoLevel (exact, > 0) is compared with what is left of the award; only
 * if the remainder covers it is it subtracted. expIntoLevel + award is never formed, so the result is the
 * same as unbounded integer arithmetic and the only refusals are LEVEL_UP_GUARD and XP_TABLE_EXHAUSTED.
 */
export function applyExpAward(state: ExpState, award: number, table: readonly number[], maxLevelUps: number): ExpAwardResult {
  assertXpTable(table);
  const s = assertRecord(state, 'INVALID_STATE', 'EXP state');
  const level = assertSafeInt(s['level'], 'level');
  if (level < 1 || level > table.length + 1) fail('INVALID_STATE', 'level must be in [1, table length + 1]', { level });
  const into = assertNonNegativeSafeInt(s['expIntoLevel'], 'expIntoLevel');
  const threshold = table[level - 1];
  if (threshold !== undefined && into >= threshold) fail('INVALID_STATE', 'expIntoLevel must be below the current threshold', { level, into });
  const amount = assertNonNegativeSafeInt(award, 'award');
  const guard = assertSafeInt(maxLevelUps, 'maxLevelUps');
  if (guard < 1) fail('INVALID_NUMBER', 'maxLevelUps must be >= 1');

  let current = level;
  let progress = into; // EXP already inside the current level
  let left = amount; // part of the award not yet applied
  const levelUps: number[] = [];
  for (;;) {
    const t = table[current - 1];
    if (t === undefined) break; // level N + 1: no further threshold
    const need = t - progress; // 1..t, exact
    if (left < need) break;
    left -= need;
    progress = 0;
    current += 1;
    levelUps.push(current);
    if (levelUps.length > guard) fail('LEVEL_UP_GUARD', `more than ${guard} level-ups in one award`, { award: amount });
  }
  if (current === table.length + 1 && (progress > 0 || left > 0)) {
    fail('XP_TABLE_EXHAUSTED', 'award runs past the end of the EXP table; extend the table through content', {
      level: current,
      expIntoLevel: progress,
      unapplied: left,
    });
  }
  return { level: current, expIntoLevel: progress + left, levelUps }; // < T(current) <= 2^53 - 1, exact
}

export interface LimitEstimate {
  readonly level: number | null;
  readonly method: string;
}

/**
 * Report-only estimate of the first level whose single threshold would exceed 2^53 - 1, using the
 * double-precision curve (exponential then binary search over levels up to 2^53). Approximate.
 */
export function estimateFirstUnsafeThresholdLevel(curve: XpCurve): LimitEstimate {
  assertXpCurve(curve);
  const exceeds = (level: number): boolean => !(xpCurveValue(curve, level) <= MAX_SAFE);
  let hi = 1;
  while (!exceeds(hi)) {
    if (hi >= 2 ** 52) return { level: null, method: 'double curve search: no level below 2^53 exceeds the limit' };
    hi *= 2;
  }
  let lo = Math.floor(hi / 2);
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (exceeds(mid)) hi = mid;
    else lo = mid;
  }
  return { level: exceeds(1) ? 1 : hi, method: 'double curve, exponential + binary search (approximate, report-only)' };
}

/**
 * Report-only estimate of the first level L whose cumulative EXP C(L) would exceed 2^53 - 1.
 * g = 1: C(L) ~ a * (L-1)^(p+1) / (p+1) (integral approximation). g > 1: direct double summation.
 */
export function estimateFirstUnsafeCumulativeLevel(curve: XpCurve): LimitEstimate {
  assertXpCurve(curve);
  if (curve.g === 1) {
    const level = Math.ceil(Math.pow((MAX_SAFE * (curve.p + 1)) / curve.a, 1 / (curve.p + 1))) + 1;
    return { level, method: 'g = 1: integral approximation a*(L-1)^(p+1)/(p+1) (approximate, report-only)' };
  }
  let sum = 0;
  for (let level = 1; level < 1e7; level += 1) {
    sum += xpCurveValue(curve, level);
    if (!(sum <= MAX_SAFE)) return { level: level + 1, method: 'g > 1: double summation (approximate, report-only)' };
  }
  return { level: null, method: 'g > 1: double summation did not exceed the limit within 10^7 levels' };
}
