import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { roundHalfUp, roundHalfUpToSafeInt } from '../src/core/numeric/rounding.ts';
import { addSafe, ceilDiv, divRem, MAX_SAFE, mulSafe, subSafe, TWO_POW_52 } from '../src/core/numeric/safeInt.ts';

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

describe('safe integers', () => {
  it('adds up to the limit and refuses one past it', () => {
    expect(addSafe(MAX_SAFE - 1, 1)).toBe(MAX_SAFE);
    expect(code(() => addSafe(MAX_SAFE, 1))).toBe('NUMERIC_LIMIT');
    expect(code(() => subSafe(-MAX_SAFE, 1))).toBe('NUMERIC_LIMIT');
  });

  it('refuses non-integers, NaN, Infinity and unsafe inputs', () => {
    expect(code(() => addSafe(1.5, 1))).toBe('INVALID_NUMBER');
    expect(code(() => addSafe(Number.NaN, 1))).toBe('INVALID_NUMBER');
    expect(code(() => mulSafe(Number.POSITIVE_INFINITY, 1))).toBe('INVALID_NUMBER');
    expect(code(() => addSafe(2 ** 53, 0))).toBe('INVALID_NUMBER');
  });

  it('normalises -0 to +0', () => {
    expect(Object.is(addSafe(-0, 0), 0)).toBe(true);
    expect(Object.is(mulSafe(-1, 0), 0)).toBe(true);
  });

  it('checks intermediate products, not only final results', () => {
    // (2^52 * 4) / 8 would be 2^51, but the intermediate 2^54 is refused.
    expect(code(() => divRem(mulSafe(TWO_POW_52, 4), 8))).toBe('NUMERIC_LIMIT');
    expect(mulSafe(94_906_265, 94_906_265)).toBe(9_007_199_136_250_225);
    expect(code(() => mulSafe(94_906_266, 94_906_266))).toBe('NUMERIC_LIMIT');
  });

  it('divides exactly near 2^53 where floating division rounds', () => {
    expect(divRem(MAX_SAFE, 3)).toEqual({ q: 3_002_399_751_580_330, r: 1 });
    expect(divRem(MAX_SAFE - 1, MAX_SAFE)).toEqual({ q: 0, r: MAX_SAFE - 1 }); // a/b rounds to 1.0
    expect(divRem(MAX_SAFE, MAX_SAFE - 1)).toEqual({ q: 1, r: 1 });
    expect(divRem(0, 7)).toEqual({ q: 0, r: 0 });
    expect(ceilDiv(15, 8)).toBe(2);
    expect(code(() => divRem(5, 0))).toBe('INVALID_NUMBER');
    expect(code(() => divRem(-1, 3))).toBe('INVALID_NUMBER');
  });
});

describe('roundHalfUp', () => {
  it('fixes both failure cases of floor(x + 0.5)', () => {
    expect(Math.floor(0.49999999999999994 + 0.5)).toBe(1); // the naive bug, demonstrated
    expect(roundHalfUp(0.49999999999999994)).toBe(0);
    expect(Math.floor(TWO_POW_52 + 1 + 0.5)).toBe(TWO_POW_52 + 2); // the naive bug, demonstrated
    expect(roundHalfUp(TWO_POW_52 + 1)).toBe(TWO_POW_52 + 1);
  });

  it('rounds halves up, including negatives', () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(2.4999)).toBe(2);
    expect(roundHalfUp(-2.5)).toBe(-2);
    expect(roundHalfUp(TWO_POW_52 - 0.5)).toBe(TWO_POW_52);
    expect(Object.is(roundHalfUp(-0.4), 0)).toBe(true);
  });

  it('refuses non-finite input and results beyond the safe range', () => {
    expect(code(() => roundHalfUp(Number.NaN))).toBe('INVALID_NUMBER');
    expect(roundHalfUpToSafeInt(MAX_SAFE)).toBe(MAX_SAFE);
    expect(code(() => roundHalfUpToSafeInt(2 ** 53))).toBe('NUMERIC_LIMIT');
  });
});
