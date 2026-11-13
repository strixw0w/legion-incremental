/**
 * Round half up (spec/formulas/numeric.md v1, section "roundHalfUp").
 *
 * The naive floor(x + 0.5) is wrong in two places: for x = 0.49999999999999994 it returns 1 (x + 0.5
 * rounds up to 1.0 before the floor), and for x = 2^52 + 1 it returns 2^52 + 2 (x + 0.5 rounds to even).
 * Here: for |x| >= 2^52 every double is already an integer and is returned unchanged; otherwise
 * f = floor(x) and d = x - f, which is exact in that range, and the result is f + (d >= 0.5 ? 1 : 0).
 */
import { fail } from '../errors.ts';
import { normZero, TWO_POW_52 } from './safeInt.ts';

export function roundHalfUp(x: number): number {
  if (typeof x !== 'number' || !Number.isFinite(x)) {
    fail('INVALID_NUMBER', 'roundHalfUp requires a finite number', { x: String(x) });
  }
  if (Math.abs(x) >= TWO_POW_52) return normZero(x);
  const f = Math.floor(x);
  const d = x - f;
  return normZero(d >= 0.5 ? f + 1 : f);
}

/** roundHalfUp, then require the result to be a safe integer (2^53 and beyond are refused). */
export function roundHalfUpToSafeInt(x: number): number {
  const r = roundHalfUp(x);
  if (!Number.isSafeInteger(r)) fail('NUMERIC_LIMIT', 'rounded value is outside the safe integer range', { x });
  return r;
}
