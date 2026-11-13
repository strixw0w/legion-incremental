import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { critChanceEffective, damagePerHit, hitChance, hitsToKill, mitigationFactor, mitigationRatio, type DamageInput, type HitCurve } from '../src/core/formulas/combat.ts';
import { MAX_SAFE } from '../src/core/numeric/safeInt.ts';
import { MAX, refDamage, safeIntArb } from './helpers/reference.ts';

const CURVE: HitCurve = { hAtReqBp: 9000, floorBp: 1000, k: 2 };
const OPTIONS = { seed: 20261113, numRuns: 1500 };

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

describe('hit chance', () => {
  it('is 1 without a requirement and 90% at the requirement (candidate curve)', () => {
    expect(hitChance(10, 0, CURVE)).toBe(1);
    expect(hitChance(50, 50, CURVE)).toBeCloseTo(0.9, 12);
  });

  it('is monotonic non-decreasing in accuracy and stays inside [floor, 1]', () => {
    fc.assert(
      fc.property(safeIntArb(1, 10_000), safeIntArb(0, 100_000), safeIntArb(0, 100_000), (req, a1, a2) => {
        const lo = Math.min(a1, a2);
        const hi = Math.max(a1, a2);
        const hLo = hitChance(lo, req, CURVE);
        const hHi = hitChance(hi, req, CURVE);
        expect(hHi).toBeGreaterThanOrEqual(hLo);
        expect(hLo).toBeGreaterThanOrEqual(0.1);
        expect(hHi).toBeLessThanOrEqual(1);
      }),
      OPTIONS,
    );
  });

  it('refuses inconsistent curves', () => {
    expect(code(() => hitChance(10, 5, { hAtReqBp: 9000, floorBp: 9500, k: 2 }))).toBe('INVALID_NUMBER');
    expect(code(() => hitChance(10, 5, { hAtReqBp: 9000, floorBp: 1000, k: 9 }))).toBe('INVALID_NUMBER');
  });
});

describe('mitigation, crit and damage', () => {
  it('mitigation is diminishing and never reaches zero', () => {
    fc.assert(
      fc.property(safeIntArb(1, 1000), safeIntArb(0, 1_000_000), safeIntArb(0, 1_000_000), (k, d1, d2) => {
        const lo = Math.min(d1, d2);
        const hi = Math.max(d1, d2);
        expect(mitigationFactor(hi, k)).toBeLessThanOrEqual(mitigationFactor(lo, k));
        expect(mitigationFactor(hi, k)).toBeGreaterThan(0);
      }),
      OPTIONS,
    );
    expect(mitigationFactor(100, 100)).toBe(0.5);
  });

  it('crit chance may reach exactly 100%; the excess is reported, not applied (R-A2)', () => {
    expect(critChanceEffective(10_000)).toEqual({ effectiveBp: 10_000, overcapBp: 0 });
    expect(critChanceEffective(12_500)).toEqual({ effectiveBp: 10_000, overcapBp: 2_500 });
  });

  it('damage per landed hit is an integer, rounds exact halves up, and has a floor', () => {
    const one = { num: 1, den: 1 };
    expect(damagePerHit({ rawMilli: 7000, crit: true, critMultBp: 15_000, mitigation: one, minDamage: 1 })).toBe(11);
    expect(damagePerHit({ rawMilli: 1200, crit: false, critMultBp: 15_000, mitigation: { num: 3, den: 10 }, minDamage: 1 })).toBe(1);
    expect(code(() => damagePerHit({ rawMilli: 0, crit: false, critMultBp: 15_000, mitigation: one, minDamage: 1 }))).toBe('INVALID_NUMBER');
    expect(code(() => damagePerHit({ rawMilli: 2 ** 53, crit: false, critMultBp: 15_000, mitigation: one, minDamage: 1 }))).toBe('INVALID_NUMBER');
  });

  it('hits-to-kill never increases when damage increases (breakpoints are exact)', () => {
    fc.assert(
      fc.property(safeIntArb(1, 1_000_000), safeIntArb(1, 100_000), safeIntArb(1, 100_000), (hp, d1, d2) => {
        const lo = Math.min(d1, d2);
        const hi = Math.max(d1, d2);
        expect(hitsToKill(hp, hi)).toBeLessThanOrEqual(hitsToKill(hp, lo));
        expect(hitsToKill(hp, hi) * hi).toBeGreaterThanOrEqual(hp);
        expect((hitsToKill(hp, hi) - 1) * hi).toBeLessThan(hp);
      }),
      OPTIONS,
    );
    expect([hitsToKill(15, 7), hitsToKill(15, 8)]).toEqual([3, 2]);
  });
});

describe('exact damage v2 (S0.1)', () => {
  const M = MAX_SAFE;
  const hit = (rawMilli: number, crit: boolean, critMultBp: number, num: number, den: number, minDamage = 1): DamageInput => ({
    rawMilli,
    crit,
    critMultBp,
    mitigation: { num, den },
    minDamage,
  });
  function outcome(input: DamageInput): bigint | string {
    try {
      return BigInt(damagePerHit(input));
    } catch (e) {
      if (e instanceof LabError) return e.code;
      throw e;
    }
  }

  it('S0 review reproduction: 100 * 1.005 = 100.5 rounds up to 101', () => {
    expect(damagePerHit({ rawMilli: 100_000, crit: true, critMultBp: 10_050, mitigation: mitigationRatio(0, 100), minDamage: 1 })).toBe(101);
  });

  it('exact halves through mitigation ratios that binary64 cannot represent round up', () => {
    expect(damagePerHit(hit(100_000, true, 10_050, 1, 3))).toBe(34); // 33.5
    expect(damagePerHit(hit(120_000, true, 10_150, 5, 6))).toBe(102); // 101.5
    expect(damagePerHit(hit(200_000, true, 10_050, 3, 6))).toBe(101); // 100.5
    expect(damagePerHit(hit(375_000, true, 10_150, 100, 125))).toBe(305); // 304.5
  });

  it('values just below a half round down, even one part in 10^12 below', () => {
    expect(damagePerHit(hit(100_499, false, 15_000, 1, 1))).toBe(100);
    expect(damagePerHit(hit(2_499_999_842_499, false, 15_000, 1, 999_999_937))).toBe(2);
    expect(damagePerHit(hit(2_499_999_842_500, false, 15_000, 1, 999_999_937))).toBe(3);
  });

  it('matches exact integer arithmetic for any valid input; NUMERIC_LIMIT exactly when the result is unsafe', () => {
    const raw = fc.oneof(safeIntArb(1, 10_000_000), safeIntArb(1, M), fc.constantFrom(1, 500, 1500, 2500, M));
    const mult = fc.oneof(safeIntArb(10_000, 50_000), safeIntArb(10_000, M), fc.constantFrom(10_000, 10_050, 15_000, 20_000_000, M));
    const ratio = fc.oneof(safeIntArb(1, 100_000), safeIntArb(1, M)).chain((den) => fc.tuple(fc.oneof(safeIntArb(1, den), fc.constant(den), fc.constant(1)), fc.constant(den)));
    fc.assert(
      fc.property(raw, fc.boolean(), mult, ratio, safeIntArb(1, 5), (rawMilli, crit, critMultBp, [num, den], minDamage) => {
        const ref = refDamage(rawMilli, crit, critMultBp, num, den, minDamage);
        const got = outcome(hit(rawMilli, crit, critMultBp, num, den, minDamage));
        expect(got).toBe(ref > MAX ? 'NUMERIC_LIMIT' : ref);
      }),
      { seed: 20261113, numRuns: 20_000 },
    );
  });

  it('applies mitigation first, so no intermediate overflows when the result fits', () => {
    expect(damagePerHit(hit(M, true, 20_000_000, 1, 2))).toBe(M); // M/1000 * 2000 * 1/2 = M
    expect(code(() => damagePerHit(hit(M, true, 20_000_000, 1, 1)))).toBe('NUMERIC_LIMIT');
    expect(damagePerHit(hit(M, true, M, 1, M))).toBe(900_719_925); // M / 10^7
  });

  it('is monotonic: more raw damage, a larger crit multiplier or less defence never lowers damage', () => {
    fc.assert(
      fc.property(safeIntArb(1, 10_000_000), safeIntArb(0, 1000), safeIntArb(10_000, 30_000), safeIntArb(0, 1_000_000), safeIntArb(0, 1_000_000), (raw, extra, mult, d1, d2) => {
        const lo = Math.min(d1, d2);
        const hi = Math.max(d1, d2);
        const base = damagePerHit({ rawMilli: raw, crit: true, critMultBp: mult, mitigation: mitigationRatio(hi, 100), minDamage: 1 });
        expect(damagePerHit({ rawMilli: raw + extra, crit: true, critMultBp: mult, mitigation: mitigationRatio(hi, 100), minDamage: 1 })).toBeGreaterThanOrEqual(base);
        expect(damagePerHit({ rawMilli: raw, crit: true, critMultBp: mult + extra, mitigation: mitigationRatio(hi, 100), minDamage: 1 })).toBeGreaterThanOrEqual(base);
        expect(damagePerHit({ rawMilli: raw, crit: true, critMultBp: mult, mitigation: mitigationRatio(lo, 100), minDamage: 1 })).toBeGreaterThanOrEqual(base);
      }),
      OPTIONS,
    );
  });

  it('mitigationRatio is exact and agrees with the display factor', () => {
    expect(mitigationRatio(5, 100)).toEqual({ num: 100, den: 105 });
    expect(mitigationFactor(5, 100)).toBe(100 / 105);
    expect(code(() => mitigationRatio(M, 1))).toBe('NUMERIC_LIMIT');
    expect(code(() => mitigationRatio(5, 0))).toBe('INVALID_NUMBER');
  });

  it('refuses malformed damage inputs', () => {
    expect(code(() => damagePerHit(hit(6000, false, 9999, 1, 1)))).toBe('INVALID_NUMBER');
    expect(code(() => damagePerHit(hit(6000, false, 15_000, 3, 2)))).toBe('INVALID_NUMBER');
    expect(code(() => damagePerHit(hit(6000, false, 15_000, 0, 5)))).toBe('INVALID_NUMBER');
    expect(code(() => damagePerHit(hit(6000, false, 15_000, 1, 1, 0)))).toBe('INVALID_NUMBER');
    expect(code(() => damagePerHit({ ...hit(6000, false, 15_000, 1, 1), crit: 'yes' as unknown as boolean }))).toBe('INVALID_NUMBER');
    expect(code(() => damagePerHit({ ...hit(6000, false, 15_000, 1, 1), mitigation: 1 as unknown as DamageInput['mitigation'] }))).toBe('INVALID_NUMBER');
    expect(code(() => damagePerHit({ raw: 100, crit: true, critMultBp: 10_050, mitigation: 1, minDamage: 1 } as unknown as DamageInput))).toBe('INVALID_NUMBER');
  });
});

