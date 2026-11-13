import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { accrue, accruePerHour, MAX_DEN, PER_HOUR_DEN, ZERO_PER_HOUR_STATE, type PerHourState } from '../src/core/numeric/remainder.ts';
import { MAX_SAFE } from '../src/core/numeric/safeInt.ts';

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

function runPerHour(rate: number, parts: number[], start: PerHourState = ZERO_PER_HOUR_STATE): { granted: number; state: PerHourState } {
  let state = start;
  let granted = 0;
  for (const p of parts) {
    const r = accruePerHour(state, rate, p);
    granted += r.granted;
    state = r.state;
  }
  return { granted, state };
}

describe('exact remainder accumulator', () => {
  it('splitting an interval never changes the total or the remainder (G1)', () => {
    const whole = accrue(0, 3, 10, 7);
    let rem = 0;
    let granted = 0;
    for (const part of [3, 0, 4, 2, 1]) {
      const r = accrue(rem, 3, part, 7);
      granted += r.granted;
      rem = r.rem;
    }
    expect({ granted, rem }).toEqual(whole);
    expect(whole).toEqual({ granted: 4, rem: 2 });
  });

  it('a zero-duration interval changes nothing (G2)', () => {
    expect(accrue(5, 3, 0, 7)).toEqual({ granted: 0, rem: 5 });
    expect(accruePerHour({ msRem: 123, milliRem: 456 }, 999, 0)).toEqual({ granted: 0, state: { msRem: 123, milliRem: 456 } });
  });

  it('per-hour chain: one hour at 1.5 units/hour, split three different ways', () => {
    const expected = { granted: 1, state: { msRem: 0, milliRem: 500 } };
    expect(runPerHour(1500, [3_600_000])).toEqual(expected);
    expect(runPerHour(1500, [1, 3_599_999])).toEqual(expected);
    expect(runPerHour(1500, Array.from({ length: 3600 }, () => 1000))).toEqual(expected);
  });

  it('settling every millisecond equals settling once (no gain from frequent rejoining)', () => {
    const rate = 7_777; // 7.777 units per hour
    const once = runPerHour(rate, [600_000]);
    const everyMs = runPerHour(rate, Array.from({ length: 600_000 }, () => 1));
    expect(everyMs).toEqual(once);
  });

  it('persisted remainders survive a save/load round trip and complete later units', () => {
    const first = runPerHour(1500, [1_800_000]); // 750 milli, not yet a unit
    const saved = JSON.parse(JSON.stringify(first.state)) as PerHourState;
    const second = runPerHour(1500, [1_800_000], saved);
    expect(first.granted + second.granted).toBe(runPerHour(1500, [3_600_000]).granted);
    expect(second.state).toEqual(runPerHour(1500, [3_600_000]).state);
  });

  it('assignment switching: separate keys never leak into each other', () => {
    // Two streams accrue into separate remainders; interleaving does not change either total.
    let a = ZERO_PER_HOUR_STATE;
    let b = ZERO_PER_HOUR_STATE;
    let ga = 0;
    let gb = 0;
    for (let i = 0; i < 10; i += 1) {
      const ra = accruePerHour(a, 1234, 360_000);
      a = ra.state;
      ga += ra.granted;
      const rb = accruePerHour(b, 4321, 360_000);
      b = rb.state;
      gb += rb.granted;
    }
    expect({ granted: ga, state: a }).toEqual(runPerHour(1234, [3_600_000]));
    expect({ granted: gb, state: b }).toEqual(runPerHour(4321, [3_600_000]));
  });

  it('large balances: results near 2^53 are exact and beyond it are refused', () => {
    expect(accrue(0, MAX_DEN - 1, MAX_SAFE, MAX_DEN)).toEqual({ granted: 9_007_199_120_523_263, rem: 1 });
    expect(accrue(0, 1, MAX_SAFE, 1)).toEqual({ granted: MAX_SAFE, rem: 0 });
    expect(code(() => accrue(0, 2, MAX_SAFE, 1))).toBe('NUMERIC_LIMIT');
  });

  it('refuses invalid parameters', () => {
    expect(code(() => accrue(0, 1, 1, MAX_DEN + 1))).toBe('INVALID_DENOMINATOR');
    expect(code(() => accrue(0, 1, 1, 0))).toBe('INVALID_DENOMINATOR');
    expect(code(() => accrue(7, 1, 1, 7))).toBe('INVALID_STATE');
    expect(code(() => accrue(0, -1, 1, 7))).toBe('INVALID_NUMBER');
    expect(code(() => accrue(0, 1, 1.5, 7))).toBe('INVALID_NUMBER');
  });
});

describe('per-hour chain v2 (S0.1): one exact division, no intermediate overflow', () => {
  const M = MAX_SAFE;

  it('S0 review reproduction: 2 h at rate 2^53 - 1 in one call equals two 1 h calls', () => {
    const expected = { granted: 18_014_398_509_481, state: { msRem: 0, milliRem: 982 } };
    expect(accruePerHour(ZERO_PER_HOUR_STATE, M, 7_200_000)).toEqual(expected);
    expect(runPerHour(M, [3_600_000, 3_600_000])).toEqual(expected);
  });

  it('the largest representable grant succeeds in one call and in parts; one more millisecond is refused', () => {
    expect(accruePerHour(ZERO_PER_HOUR_STATE, M, PER_HOUR_DEN)).toEqual({ granted: M, state: { msRem: 0, milliRem: 0 } });
    expect(runPerHour(M, [1, PER_HOUR_DEN - 1])).toEqual({ granted: M, state: { msRem: 0, milliRem: 0 } });
    expect(code(() => accruePerHour(ZERO_PER_HOUR_STATE, M, PER_HOUR_DEN + 1))).toBe('NUMERIC_LIMIT');
    expect(code(() => accruePerHour(ZERO_PER_HOUR_STATE, M, M))).toBe('NUMERIC_LIMIT');
  });

  it('a full state plus the largest grant still fits exactly', () => {
    // carried = 999*3.6e6 + 3,599,999 = 3.6e9 - 1; plus M*3.6e9 gives M*3.6e9 + 3.6e9 - 1 -> M units, rest 3.6e9 - 1.
    expect(accruePerHour({ msRem: 3_599_999, milliRem: 999 }, M, PER_HOUR_DEN)).toEqual({ granted: M, state: { msRem: 3_599_999, milliRem: 999 } });
  });

  it('refuses malformed states before doing any arithmetic', () => {
    expect(code(() => accruePerHour({ msRem: 3_600_000, milliRem: 0 }, 1, 1))).toBe('INVALID_STATE');
    expect(code(() => accruePerHour({ msRem: 0, milliRem: 1000 }, 1, 1))).toBe('INVALID_STATE');
    expect(code(() => accruePerHour({ msRem: 1.5, milliRem: 0 }, 1, 1))).toBe('INVALID_NUMBER');
    expect(code(() => accruePerHour(null as unknown as PerHourState, 1, 1))).toBe('INVALID_STATE');
    expect(code(() => accruePerHour([0, 0] as unknown as PerHourState, 1, 1))).toBe('INVALID_STATE');
    expect(code(() => accruePerHour(ZERO_PER_HOUR_STATE, -1, 1))).toBe('INVALID_NUMBER');
  });
});

