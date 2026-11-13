/**
 * Sampling primitives (spec/formulas/rng.md v1).
 *
 * Bernoulli: one trial consumes exactly one draw u and succeeds iff u < T.
 *   from basis points: T = floor(bp * 2^32 / 10000), exact;  from a probability p: T = floor(p * 2^32).
 *   A non-zero probability below 2^-32 is refused (PROBABILITY_TOO_SMALL).
 * uniformInt(lo, hi), inclusive: span = hi - lo + 1 <= 2^32; limit = span * floor(2^32 / span);
 *   draw u; accept if u < limit and return lo + (u mod span); otherwise draw again. Guard: 1000 attempts.
 * Every function validates its RNG state argument first (assertRngState), so an invalid or all-zero state
 * is refused before any other check (S0.1).
 */
import { fail } from '../errors.ts';
import { assertProbabilityBp, BP_SCALE } from '../numeric/basisPoints.ts';
import { assertSafeInt, divRem, mulSafe, TWO_POW_32 } from '../numeric/safeInt.ts';
import { assertRngState, nextU32, type RngState } from './xoshiro128ss.ts';

export const MIN_NONZERO_PROBABILITY = 2 ** -32;
export const UNIFORM_INT_GUARD = 1000;

export function thresholdFromBp(bp: number): number {
  let b: number;
  try {
    b = assertProbabilityBp(bp);
  } catch {
    return fail('INVALID_PROBABILITY', 'probability in bp must be an integer in [0, 10000]', { bp: String(bp) });
  }
  return divRem(mulSafe(b, TWO_POW_32), BP_SCALE).q;
}

export function thresholdFromProb(p: number): number {
  if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) {
    fail('INVALID_PROBABILITY', 'probability must be a finite number in [0, 1]', { p: String(p) });
  }
  if (p > 0 && p < MIN_NONZERO_PROBABILITY) {
    fail('PROBABILITY_TOO_SMALL', 'non-zero probability below 2^-32 cannot be represented', { p });
  }
  return Math.floor(p * TWO_POW_32);
}

function assertThreshold(threshold: number): number {
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > TWO_POW_32) {
    fail('INVALID_PROBABILITY', 'threshold must be an integer in [0, 2^32]', { threshold });
  }
  return threshold;
}

export function bernoulli(state: RngState, threshold: number): [boolean, RngState] {
  const s = assertRngState(state);
  const t = assertThreshold(threshold);
  const [u, next] = nextU32(s);
  return [u < t, next];
}

export interface UniformIntResult {
  readonly value: number;
  readonly state: RngState;
  readonly draws: number;
}

export function uniformInt(state: RngState, lo: number, hi: number): UniformIntResult {
  const start = assertRngState(state);
  const low = assertSafeInt(lo, 'lo');
  const high = assertSafeInt(hi, 'hi');
  if (low > high) fail('INVALID_RANGE', 'lo must be <= hi', { lo: low, hi: high });
  const span = high - low + 1; // exact whenever it is <= 2^32; beyond that it is refused anyway
  if (!(span <= TWO_POW_32)) fail('RANGE_TOO_LARGE', 'range size must be <= 2^32', { lo: low, hi: high });
  const limit = divRem(TWO_POW_32, span).q * span;
  let s = start;
  for (let attempt = 1; attempt <= UNIFORM_INT_GUARD; attempt += 1) {
    const [u, next] = nextU32(s);
    s = next;
    if (u < limit) return { value: low + (u % span), state: s, draws: attempt };
  }
  return fail('RNG_REJECTION_GUARD', `no acceptance in ${UNIFORM_INT_GUARD} attempts`, { lo: low, hi: high });
}
