/**
 * Exact remainder accounting (spec/formulas/remainder.md v2; architecture v1.1 section 6.3).
 * v2 (S0.1): the per-hour chain is evaluated as one exact division, so it no longer fails on an
 * intermediate milli-unit total that does not fit, only on a granted amount that does not fit.
 *
 * accrue(rem, num, steps, den) returns, exactly,
 *   granted = floor((rem + num*steps) / den)   and   rem' = (rem + num*steps) mod den
 * for safe integers 0 <= rem < den, num >= 0, steps >= 0, 1 <= den <= 2^26.
 *
 * With steps = qs*den + j and num = a*den + b (0 <= j, b < den):
 *   granted = a*qs*den + a*j + b*qs + floor((b*j + rem) / den),   rem' = (b*j + rem) mod den.
 * b*j + rem < 2^52 is exact because den <= 2^26; every other term is part of `granted` and is
 * computed with checked arithmetic, so the only failure is a result that cannot be represented.
 *
 * G1 partition invariance: splitting `steps` into any parts, carrying `rem`, gives the same total
 * granted and the same final remainder, because this is exact integer arithmetic.
 * G2 zero duration: steps = 0 changes nothing.
 * G5 no epsilon: nothing is ever added before a floor.
 */
import { fail } from '../errors.ts';
import { assertRecord } from '../arrays.ts';
import { addSafe, assertNonNegativeSafeInt, assertSafeInt, divRem, mulDivRem, mulSafe, TWO_POW_26 } from './safeInt.ts';

export const MAX_DEN = TWO_POW_26;

export interface AccrueResult {
  readonly granted: number;
  readonly rem: number;
}

export function assertDenominator(den: unknown): number {
  const d = assertSafeInt(den, 'den');
  if (d < 1 || d > MAX_DEN) fail('INVALID_DENOMINATOR', `den must be in [1, ${MAX_DEN}]`, { den: d });
  return d;
}

export function accrue(rem: number, num: number, steps: number, den: number): AccrueResult {
  const d = assertDenominator(den);
  const r0 = assertNonNegativeSafeInt(rem, 'rem');
  if (r0 >= d) fail('INVALID_STATE', 'remainder must be < den', { rem: r0, den: d });
  const n = assertNonNegativeSafeInt(num, 'num');
  const s = assertNonNegativeSafeInt(steps, 'steps');

  const { q: qs, r: j } = divRem(s, d);
  const { q: a, r: b } = divRem(n, d);
  const tail = divRem(b * j + r0, d); // b*j + r0 < 2^52: exact

  let granted = mulSafe(mulSafe(a, qs), d);
  granted = addSafe(granted, mulSafe(a, j));
  granted = addSafe(granted, mulSafe(b, qs));
  granted = addSafe(granted, tail.q);
  return { granted, rem: tail.r };
}

/**
 * Standard per-hour chain (two conceptual stages): ms -> milli-units (den 3,600,000), then milli-units ->
 * units (den 1000). State is (msRem, milliRem).
 *
 * v2 evaluation: the two stages are one exact division by 3,600,000,000 = 3,600,000 * 1000, because
 *   X = milliRem * 3,600,000 + msRem + rate * dMs
 *   granted = floor(X / 3,600,000,000),  rest = X mod 3,600,000,000,
 *   milliRem' = floor(rest / 3,600,000),  msRem' = rest mod 3,600,000
 * is algebraically identical to the stage-by-stage chain (spec/formulas/remainder.md v2). rate * dMs is
 * never formed: mulDivRem gives floor(rate * dMs / D) and its remainder exactly, and the state is added
 * to that remainder (both < D, so the sum < 2D is exact). The only failure is granted > 2^53 - 1.
 */
export const MS_PER_HOUR = 3_600_000;
export const MILLI_PER_UNIT = 1000;
export const PER_HOUR_DEN = MS_PER_HOUR * MILLI_PER_UNIT; // 3_600_000_000, exact

export interface PerHourState {
  /** Stage-1 remainder, in [0, 3_600_000). */
  readonly msRem: number;
  /** Stage-2 remainder (milli-units not yet a whole unit), in [0, 1000). */
  readonly milliRem: number;
}

export const ZERO_PER_HOUR_STATE: PerHourState = Object.freeze({ msRem: 0, milliRem: 0 });

export interface PerHourResult {
  readonly granted: number;
  readonly state: PerHourState;
}

export function assertPerHourState(state: unknown): PerHourState {
  const s = assertRecord(state, 'INVALID_STATE', 'per-hour state');
  const msRem = assertNonNegativeSafeInt(s['msRem'], 'msRem');
  if (msRem >= MS_PER_HOUR) fail('INVALID_STATE', `msRem must be < ${MS_PER_HOUR}`, { msRem });
  const milliRem = assertNonNegativeSafeInt(s['milliRem'], 'milliRem');
  if (milliRem >= MILLI_PER_UNIT) fail('INVALID_STATE', `milliRem must be < ${MILLI_PER_UNIT}`, { milliRem });
  return { msRem, milliRem };
}

/** Accrues `dMs` milliseconds at an integer rate of `rateMilliPerHour` thousandths of a unit per hour. */
export function accruePerHour(state: PerHourState, rateMilliPerHour: number, dMs: number): PerHourResult {
  const { msRem, milliRem } = assertPerHourState(state);
  const rate = assertNonNegativeSafeInt(rateMilliPerHour, 'rateMilliPerHour');
  const ms = assertNonNegativeSafeInt(dMs, 'dMs');
  const carried = milliRem * MS_PER_HOUR + msRem; // < 3.6e9, exact
  const part = mulDivRem(rate, ms, PER_HOUR_DEN); // NUMERIC_LIMIT only if floor(rate * dMs / D) > 2^53 - 1
  const sum = part.r + carried; // < 2 * D, exact
  const wrap = sum >= PER_HOUR_DEN;
  const rest = wrap ? sum - PER_HOUR_DEN : sum;
  const granted = wrap ? addSafe(part.q, 1) : part.q;
  const split = divRem(rest, MS_PER_HOUR);
  return { granted, state: { msRem: split.r, milliRem: split.q } };
}
