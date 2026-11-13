/**
 * xoshiro128** 1.1 (Blackman and Vigna), 32-bit words. spec/formulas/rng.md v1.
 *
 *   result = rotl(s1 * 5, 7) * 9           (mod 2^32)
 *   t = s1 << 9
 *   s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = rotl(s3, 11)
 *
 * Pure: the state is an immutable 4-tuple; nextU32 returns the value and the next state.
 *
 * State boundary (S0.1): every exported function validates its state argument with assertRngState, which
 * accepts only a genuine array of exactly four own, defined unsigned 32-bit integers, not all zero. The step
 * itself (`step`) is module-private and is only ever called on a validated state, so there is no unchecked
 * entry point. A non-zero state can never step to the all-zero state (xoshiro's linear engine is a
 * bijection that fixes zero), so validated states stay valid.
 */
import { fail } from '../errors.ts';

export type RngState = readonly [number, number, number, number];

function isU32(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

export function assertRngState(state: unknown): RngState {
  if (!Array.isArray(state) || state.length !== 4) fail('INVALID_STATE', 'RNG state must be an array of four unsigned 32-bit integers');
  const words: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    if (!Object.hasOwn(state, i)) fail('INVALID_STATE', `RNG state word ${i} is missing`, { index: i });
    const w: unknown = (state as readonly unknown[])[i];
    if (!isU32(w)) fail('INVALID_STATE', `RNG state word ${i} must be an unsigned 32-bit integer`, { index: i });
    words.push(w);
  }
  const [a, b, c, d] = words as [number, number, number, number];
  if (a === 0 && b === 0 && c === 0 && d === 0) fail('RNG_ZERO_STATE', 'the all-zero state is not allowed');
  return [a, b, c, d];
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/** Module-private step. Precondition: `state` was returned by assertRngState (or by step itself). */
function step(state: RngState): [number, RngState] {
  const [s0, s1, s2, s3] = state;
  const result = Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
  const t = (s1 << 9) >>> 0;
  let n2 = (s2 ^ s0) >>> 0;
  let n3 = (s3 ^ s1) >>> 0;
  const n1 = (s1 ^ n2) >>> 0;
  const n0 = (s0 ^ n3) >>> 0;
  n2 = (n2 ^ t) >>> 0;
  n3 = rotl(n3, 11);
  return [result, [n0, n1, n2, n3]];
}

/** Validates the state, then returns the next output and the next state. */
export function nextU32(state: RngState): [number, RngState] {
  return step(assertRngState(state));
}
