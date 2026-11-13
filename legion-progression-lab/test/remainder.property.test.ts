import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { accrue, accruePerHour, MAX_DEN, MILLI_PER_UNIT, MS_PER_HOUR, PER_HOUR_DEN, type PerHourState } from '../src/core/numeric/remainder.ts';
import { MAX_SAFE } from '../src/core/numeric/safeInt.ts';
import { MAX, refAccrue, refPerHour, safeIntArb } from './helpers/reference.ts';

const OPTIONS = { seed: 20261113, numRuns: 2000 };

const stateArb: fc.Arbitrary<PerHourState> = fc.record({ msRem: safeIntArb(0, MS_PER_HOUR - 1), milliRem: safeIntArb(0, MILLI_PER_UNIT - 1) });
// Rates and durations across the whole safe range, with extra weight on realistic and boundary values.
const rateArb = fc.oneof(safeIntArb(0, 10_000), safeIntArb(0, 10_000_000_000), safeIntArb(0, MAX_SAFE), fc.constantFrom(0, 1, MAX_SAFE, PER_HOUR_DEN));
const msArb = fc.oneof(safeIntArb(0, MS_PER_HOUR), safeIntArb(0, 30 * 24 * MS_PER_HOUR), safeIntArb(0, MAX_SAFE), fc.constantFrom(0, 1, PER_HOUR_DEN, MAX_SAFE));

function tryPerHour(state: PerHourState, rate: number, ms: number): { granted: number; state: PerHourState } | string {
  try {
    return accruePerHour(state, rate, ms);
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
}

/** Applies pieces in order, summing grants with unbounded integers; returns the error code of the first failing call. */
function runPieces(start: PerHourState, pieces: readonly (readonly [number, number])[]): { granted: bigint; state: PerHourState } | string {
  let state = start;
  let granted = 0n;
  for (const [rate, ms] of pieces) {
    const r = tryPerHour(state, rate, ms);
    if (typeof r === 'string') return r;
    granted += BigInt(r.granted);
    state = r.state;
  }
  return { granted, state };
}

describe('remainder accumulator properties', () => {
  it('matches exact BigInt arithmetic for any valid inputs', () => {
    const arb = safeIntArb(1, MAX_DEN).chain((den) =>
      fc.tuple(fc.constant(den), safeIntArb(0, den - 1), fc.oneof(safeIntArb(0, 1_000_000), safeIntArb(0, MAX_SAFE)), fc.oneof(safeIntArb(0, 100_000_000), safeIntArb(0, MAX_SAFE))),
    );
    fc.assert(
      fc.property(arb, ([den, rem, num, steps]) => {
        const ref = refAccrue(rem, num, steps, den);
        let got: { granted: number; rem: number } | string;
        try {
          got = accrue(rem, num, steps, den);
        } catch (e) {
          if (!(e instanceof LabError)) throw e;
          got = e.code;
        }
        if (ref.granted > MAX) expect(got).toBe('NUMERIC_LIMIT');
        else expect(got).toEqual({ granted: Number(ref.granted), rem: Number(ref.rem) });
      }),
      OPTIONS,
    );
  });

  it('G1: any partition of the steps gives the same total and remainder', () => {
    const arb = safeIntArb(1, MAX_DEN).chain((den) =>
      fc.tuple(fc.constant(den), safeIntArb(0, den - 1), safeIntArb(0, 10_000_000), fc.array(safeIntArb(0, 1_000_000_000), { minLength: 1, maxLength: 20 })),
    );
    fc.assert(
      fc.property(arb, ([den, rem, num, parts]) => {
        const total = parts.reduce((s, p) => s + p, 0);
        // Only representable totals: overflow behaviour is covered by the BigInt comparison above.
        fc.pre(refAccrue(rem, num, total, den).granted <= MAX);
        const once = accrue(rem, num, total, den);
        let r = rem;
        let granted = 0;
        for (const p of parts) {
          const step = accrue(r, num, p, den);
          granted += step.granted;
          r = step.rem;
        }
        expect({ granted, rem: r }).toEqual(once);
      }),
      OPTIONS,
    );
  });
});

describe('per-hour chain properties (remainder.md v2, S0.1)', () => {
  it('one call matches the BigInt reference for any state, rate and duration; NUMERIC_LIMIT exactly when the grant is unsafe', () => {
    fc.assert(
      fc.property(stateArb, rateArb, msArb, (state, rate, ms) => {
        const ref = refPerHour(state, [[rate, ms]]);
        const got = tryPerHour(state, rate, ms);
        if (ref.granted > MAX) expect(got).toBe('NUMERIC_LIMIT');
        else expect(got).toEqual({ granted: Number(ref.granted), state: { msRem: ref.msRem, milliRem: ref.milliRem } });
      }),
      { seed: 20261113, numRuns: 10_000 },
    );
  });

  it('G1: any partition of a duration gives the same total and state, for rates up to 2^53 - 1', () => {
    const arb = fc.tuple(stateArb, rateArb, fc.array(msArb, { minLength: 1, maxLength: 12 }));
    fc.assert(
      fc.property(arb, ([state, rate, parts]) => {
        const totalMs = parts.reduce((s, p) => s + BigInt(p), 0n);
        fc.pre(totalMs <= MAX);
        const ref = refPerHour(state, [[rate, Number(totalMs)]]);
        const once = tryPerHour(state, rate, Number(totalMs));
        const split = runPieces(
          state,
          parts.map((p) => [rate, p] as const),
        );
        if (ref.granted > MAX) {
          // The single call is refused; the parts cannot all be granted and summed within the safe range either.
          expect(once).toBe('NUMERIC_LIMIT');
          if (typeof split === 'string') expect(split).toBe('NUMERIC_LIMIT');
          else expect(split.granted > MAX).toBe(true);
          return;
        }
        expect(once).toEqual({ granted: Number(ref.granted), state: { msRem: ref.msRem, milliRem: ref.milliRem } });
        expect(split).toEqual({ granted: ref.granted, state: { msRem: ref.msRem, milliRem: ref.milliRem } });
      }),
      { seed: 20261113, numRuns: 5000 },
    );
  });

  it('G3: a timeline of rate changes, each segment split arbitrarily, equals the exact integral', () => {
    const segment = fc.tuple(rateArb, fc.array(fc.oneof(safeIntArb(0, MS_PER_HOUR), safeIntArb(0, 1_000_000_000)), { minLength: 1, maxLength: 6 }));
    fc.assert(
      fc.property(stateArb, fc.array(segment, { minLength: 1, maxLength: 6 }), (state, segments) => {
        const pieces = segments.flatMap(([rate, parts]) => parts.map((p) => [rate, p] as const));
        const ref = refPerHour(state, pieces);
        const got = runPieces(state, pieces);
        if (typeof got === 'string') {
          // A single piece can only fail if its own grant is unsafe, which implies the whole timeline is too.
          expect(got).toBe('NUMERIC_LIMIT');
          expect(ref.granted > MAX).toBe(true);
          return;
        }
        expect(got).toEqual({ granted: ref.granted, state: { msRem: ref.msRem, milliRem: ref.milliRem } });
      }),
      { seed: 20261113, numRuns: 3000 },
    );
  });

  it('settling at any cadence equals settling once, from any persisted state (save/load round trip included)', () => {
    fc.assert(
      fc.property(stateArb, safeIntArb(0, 1_000_000_000), fc.array(safeIntArb(0, 10_000_000), { minLength: 1, maxLength: 40 }), (state, rate, parts) => {
        let s = state;
        let granted = 0n;
        for (const p of parts) {
          const r = accruePerHour(JSON.parse(JSON.stringify(s)) as PerHourState, rate, p);
          granted += BigInt(r.granted);
          s = r.state;
        }
        const ref = refPerHour(state, [[rate, parts.reduce((a, b) => a + b, 0)]]);
        expect({ granted, state: s }).toEqual({ granted: ref.granted, state: { msRem: ref.msRem, milliRem: ref.milliRem } });
      }),
      OPTIONS,
    );
  });
});
