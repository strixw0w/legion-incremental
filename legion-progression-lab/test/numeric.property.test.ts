import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { roundHalfUp } from '../src/core/numeric/rounding.ts';
import { addSafe, divRem, MAX_SAFE, mulDivRem, mulSafe } from '../src/core/numeric/safeInt.ts';
import { MAX, refMulDivRem, refRoundHalfUp, safeIntArb } from './helpers/reference.ts';

const OPTIONS = { seed: 20261113, numRuns: 3000 };
const anySafe = safeIntArb(-MAX_SAFE, MAX_SAFE);

function outcome(fn: () => number): bigint | string {
  try {
    return BigInt(fn());
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
}

describe('safe-integer operations agree with exact BigInt arithmetic', () => {
  it('addSafe: exact result, or NUMERIC_LIMIT exactly when out of range', () => {
    fc.assert(
      fc.property(anySafe, anySafe, (a, b) => {
        const exact = BigInt(a) + BigInt(b);
        const expected = exact > MAX || exact < -MAX ? 'NUMERIC_LIMIT' : exact;
        expect(outcome(() => addSafe(a, b))).toBe(expected);
      }),
      OPTIONS,
    );
  });

  it('mulSafe: exact result, or NUMERIC_LIMIT exactly when out of range', () => {
    const near = fc.oneof(safeIntArb(-200_000_000, 200_000_000), anySafe);
    fc.assert(
      fc.property(near, near, (a, b) => {
        const exact = BigInt(a) * BigInt(b);
        const expected = exact > MAX || exact < -MAX ? 'NUMERIC_LIMIT' : exact;
        expect(outcome(() => mulSafe(a, b))).toBe(expected);
      }),
      OPTIONS,
    );
  });

  it('divRem is exact for every non-negative safe dividend', () => {
    fc.assert(
      fc.property(safeIntArb(0, MAX_SAFE), fc.oneof(safeIntArb(1, 1000), safeIntArb(1, MAX_SAFE)), (a, b) => {
        const { q, r } = divRem(a, b);
        expect(BigInt(q)).toBe(BigInt(a) / BigInt(b));
        expect(BigInt(r)).toBe(BigInt(a) % BigInt(b));
      }),
      OPTIONS,
    );
  });

  it('roundHalfUp equals exact floor(x + 1/2) for any finite double in the safe range', () => {
    const doubles = fc.oneof(
      fc.double({ min: -(2 ** 53), max: 2 ** 53, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
      safeIntArb(-1_000_000, 1_000_000).map((n) => n + 0.5),
    );
    fc.assert(
      fc.property(doubles, (x) => {
        expect(BigInt(roundHalfUp(x))).toBe(refRoundHalfUp(x));
      }),
      OPTIONS,
    );
  });

  it('mulDivRem: exact quotient and remainder for any safe inputs, NUMERIC_LIMIT exactly when the quotient is unsafe (S0.1)', () => {
    const factor = fc.oneof(safeIntArb(0, 1000), safeIntArb(0, 2 ** 26), safeIntArb(0, 2 ** 40), safeIntArb(0, MAX_SAFE), fc.constantFrom(0, 1, MAX_SAFE, MAX_SAFE - 1, 2 ** 52));
    const divisor = fc.oneof(safeIntArb(1, 1000), safeIntArb(1, 3_600_000_000), safeIntArb(1, MAX_SAFE), fc.constantFrom(1, 2, MAX_SAFE, MAX_SAFE - 1, 10_000_000));
    fc.assert(
      fc.property(factor, factor, divisor, (a, m, d) => {
        const ref = refMulDivRem(a, m, d);
        let got: { q: number; r: number } | string;
        try {
          got = mulDivRem(a, m, d);
        } catch (e) {
          if (!(e instanceof LabError)) throw e;
          got = e.code;
        }
        if (ref.q > MAX) expect(got).toBe('NUMERIC_LIMIT');
        else expect(got).toEqual({ q: Number(ref.q), r: Number(ref.r) });
      }),
      { seed: 20261113, numRuns: 20_000 },
    );
  });
});
