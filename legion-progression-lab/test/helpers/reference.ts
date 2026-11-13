/**
 * BigInt reference implementations, used ONLY by property tests to check the lab's bounded double
 * arithmetic against exact integer arithmetic. Not part of the lab and not an oracle for fixtures.
 */
import fc from 'fast-check';

export const MAX = 9_007_199_254_740_991n;

/** Integers in [min, max] (works beyond the 32-bit range). */
export function safeIntArb(min: number, max: number): fc.Arbitrary<number> {
  return fc.bigInt({ min: BigInt(min), max: BigInt(max) }).map(Number);
}

export function floorDiv(a: bigint, b: bigint): bigint {
  const q = a / b;
  return (a % b !== 0n) && ((a < 0n) !== (b < 0n)) ? q - 1n : q;
}

export function refAccrue(rem: number, num: number, steps: number, den: number): { granted: bigint; rem: bigint } {
  const total = BigInt(rem) + BigInt(num) * BigInt(steps);
  return { granted: total / BigInt(den), rem: total % BigInt(den) };
}

/** floor(a*m/d) and (a*m) mod d with unbounded integers. */
export function refMulDivRem(a: number, m: number, d: number): { q: bigint; r: bigint } {
  const p = BigInt(a) * BigInt(m);
  return { q: p / BigInt(d), r: p % BigInt(d) };
}

export const PER_HOUR_DEN = 3_600_000_000n;

/**
 * Per-hour accrual over a timeline of (rate, ms) pieces from a starting state, with unbounded integers:
 * X = milliRem*3,600,000 + msRem + sum(rate*ms); granted = floor(X / 3.6e9); the rest splits back into the state.
 */
export function refPerHour(state: { msRem: number; milliRem: number }, pieces: readonly (readonly [number, number])[]): { granted: bigint; msRem: number; milliRem: number } {
  let x = BigInt(state.milliRem) * 3_600_000n + BigInt(state.msRem);
  for (const [rate, ms] of pieces) x += BigInt(rate) * BigInt(ms);
  const rest = x % PER_HOUR_DEN;
  return { granted: x / PER_HOUR_DEN, msRem: Number(rest % 3_600_000n), milliRem: Number(rest / 3_600_000n) };
}

/** combat.md v2 damage with unbounded integers: floor(V + 1/2) for V = rawMilli*c*num / (10^7*den), then the floor. */
export function refDamage(rawMilli: number, crit: boolean, critMultBp: number, num: number, den: number, minDamage: number): bigint {
  const c = crit ? BigInt(critMultBp) : 10_000n;
  const n = BigInt(rawMilli) * c * BigInt(num);
  const d = 10_000_000n * BigInt(den);
  const rounded = (2n * n + d) / (2n * d);
  return rounded > BigInt(minDamage) ? rounded : BigInt(minDamage);
}

/** xp.md award with unbounded integers (the plain "add, then subtract thresholds" form). */
export function refAward(table: readonly number[], level: number, into: number, award: number, guard: number): { level: number; expIntoLevel: bigint; levelUps: number[] } | string {
  let total = BigInt(into) + BigInt(award);
  let current = level;
  const levelUps: number[] = [];
  while (current <= table.length && total >= BigInt(table[current - 1] ?? 0)) {
    total -= BigInt(table[current - 1] ?? 0);
    current += 1;
    levelUps.push(current);
    if (levelUps.length > guard) return 'LEVEL_UP_GUARD';
  }
  if (current === table.length + 1 && total > 0n) return 'XP_TABLE_EXHAUSTED';
  return { level: current, expIntoLevel: total, levelUps };
}

/** Exact value of a finite double as numerator / 2^shift (shift >= 0). */
export function exactDouble(x: number): { num: bigint; shift: bigint } {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const bits = view.getBigUint64(0);
  const sign = bits >> 63n ? -1n : 1n;
  const expBits = (bits >> 52n) & 0x7ffn;
  const frac = bits & 0xfffffffffffffn;
  const mantissa = expBits === 0n ? frac : frac | (1n << 52n);
  const exp = (expBits === 0n ? 1n : expBits) - 1075n;
  if (exp >= 0n) return { num: sign * (mantissa << exp), shift: 0n };
  return { num: sign * mantissa, shift: -exp };
}

/** floor(x + 1/2), exactly, for a finite double x. */
export function refRoundHalfUp(x: number): bigint {
  const { num, shift } = exactDouble(x);
  if (shift === 0n) return num;
  const den = 1n << shift;
  return floorDiv(2n * num + den, 2n * den);
}
