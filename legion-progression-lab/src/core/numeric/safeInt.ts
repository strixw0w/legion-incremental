/**
 * Safe-integer arithmetic (spec/formulas/numeric.md v1).
 *
 * A safe integer is a double x with Number.isSafeInteger(x); -0 is normalised to +0.
 * Each operation is performed once in IEEE-754 and the result is checked. For integer inputs this
 * is sound: an exact result outside +/-(2^53 - 1) rounds to a double at or beyond +/-2^53, which
 * fails the check; an exact result inside the range is represented exactly.
 */
import { fail } from '../errors.ts';

export const MAX_SAFE = Number.MAX_SAFE_INTEGER; // 2^53 - 1 = 9_007_199_254_740_991
export const TWO_POW_26 = 67_108_864;
export const TWO_POW_32 = 4_294_967_296;
export const TWO_POW_52 = 4_503_599_627_370_496;

export function isSafeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

/** Turns -0 into +0; leaves every other number unchanged. */
export function normZero(value: number): number {
  return value === 0 ? 0 : value;
}

export function assertSafeInt(value: unknown, name = 'value'): number {
  if (!isSafeInt(value)) {
    fail('INVALID_NUMBER', `${name} must be a safe integer`, { name, value: String(value) });
  }
  return normZero(value);
}

export function assertNonNegativeSafeInt(value: unknown, name = 'value'): number {
  const v = assertSafeInt(value, name);
  if (v < 0) fail('INVALID_NUMBER', `${name} must be >= 0`, { name, value: v });
  return v;
}

export function assertSafeIntInRange(value: unknown, min: number, max: number, name = 'value'): number {
  const v = assertSafeInt(value, name);
  if (v < min || v > max) fail('INVALID_NUMBER', `${name} must be in [${min}, ${max}]`, { name, value: v });
  return v;
}

function checked(result: number, op: string, a: number, b: number): number {
  if (!Number.isSafeInteger(result)) {
    fail('NUMERIC_LIMIT', `${op} result is outside the safe integer range`, { op, a, b });
  }
  return normZero(result);
}

export function addSafe(a: number, b: number): number {
  const x = assertSafeInt(a, 'a');
  const y = assertSafeInt(b, 'b');
  return checked(x + y, 'add', x, y);
}

export function subSafe(a: number, b: number): number {
  const x = assertSafeInt(a, 'a');
  const y = assertSafeInt(b, 'b');
  return checked(x - y, 'sub', x, y);
}

export function mulSafe(a: number, b: number): number {
  const x = assertSafeInt(a, 'a');
  const y = assertSafeInt(b, 'b');
  return checked(x * y, 'mul', x, y);
}

/**
 * Exact integer division for a >= 0, b >= 1: returns q, r with a = q*b + r and 0 <= r < b.
 * Floating division alone can be off by one near 2^53, so q is corrected. A rounded product q*b
 * is only ever compared, never used, unless it is <= a (and therefore exact).
 */
export function divRem(a: number, b: number): { q: number; r: number } {
  const x = assertNonNegativeSafeInt(a, 'a');
  const y = assertSafeInt(b, 'b');
  if (y < 1) fail('INVALID_NUMBER', 'divisor must be >= 1', { b: y });
  let q = Math.floor(x / y);
  while (q > 0 && q * y > x) q -= 1;
  while ((q + 1) * y <= x) q += 1;
  return { q, r: x - q * y };
}

/** ceil(a / b) for a >= 0, b >= 1, exact. */
export function ceilDiv(a: number, b: number): number {
  const { q, r } = divRem(a, b);
  return r > 0 ? q + 1 : q;
}

/**
 * Exact q = floor(a * m / d) and r = (a * m) mod d for safe integers a >= 0, m >= 0, d >= 1
 * (spec/formulas/numeric.md "mulDivRem", added in S0.1). The product a * m (up to about 2^106) is never
 * formed, so the only failure is a quotient above 2^53 - 1 (NUMERIC_LIMIT); r < d always fits.
 *
 * If a * m is itself a safe integer, it is divided directly. Otherwise a = qa * d + b with 0 <= b < d,
 * so a * m / d = qa * m + b * m / d, where qa * m <= q is checked and b * m / d is computed bit by bit.
 */
export function mulDivRem(a: number, m: number, d: number): { q: number; r: number } {
  const x = assertNonNegativeSafeInt(a, 'a');
  const y = assertNonNegativeSafeInt(m, 'm');
  const z = assertSafeInt(d, 'd');
  if (z < 1) fail('INVALID_NUMBER', 'divisor must be >= 1', { d: z });
  const product = x * y; // exact whenever the true product is <= 2^53 - 1; otherwise it rounds to >= 2^53
  if (product <= MAX_SAFE) return divRem(product, z);
  const { q: qa, r: b } = divRem(x, z);
  const low = mulDivRemBelow(b, y, z);
  return { q: addSafe(mulSafe(qa, y), low.q), r: low.r };
}

/**
 * floor(b * m / d) and (b * m) mod d for 0 <= b < d, by binary long multiplication over the bits of m,
 * most significant first, keeping b * prefix = q * d + r with 0 <= r < d. Every intermediate value is a
 * safe integer (r < d, q <= prefix <= m), and every comparison and subtraction has an exact safe-integer
 * result, so binary64 evaluates each step exactly. At most 53 iterations.
 */
function mulDivRemBelow(b: number, m: number, d: number): { q: number; r: number } {
  if (b === 0 || m === 0) return { q: 0, r: 0 };
  const bits: number[] = [];
  for (let rest = m; rest > 0; rest = (rest - (rest % 2)) / 2) bits.push(rest % 2);
  let q = 0;
  let r = 0;
  for (let i = bits.length - 1; i >= 0; i -= 1) {
    q += q; // prefix doubles
    if (r >= d - r) {
      r -= d - r;
      q += 1;
    } else {
      r += r;
    }
    if (bits[i] === 1) {
      // prefix gains one: add b
      if (r >= d - b) {
        r -= d - b;
        q += 1;
      } else {
        r += b;
      }
    }
  }
  return { q, r };
}
