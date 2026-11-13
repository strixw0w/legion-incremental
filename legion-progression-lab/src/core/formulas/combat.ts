/**
 * Combat primitives (spec/formulas/combat.md v2). All coefficients are content candidates.
 *
 * hitChance(A, R): R = 0 -> 1. A = 0 -> floor. Otherwise
 *   ratio = R / A; pow = ratio^k by repeated multiplication (k integer 1..8, no Math.pow);
 *   h = 1 - (1 - hAtReqBp/10000) * pow; result = min(1, max(floorBp/10000, h)).
 *   Monotonic non-decreasing in A, 90% at A = R for hAtReqBp = 9000, tends to 1 as A grows.
 * mitigationRatio(D, K) = K / (K + D) as an exact integer ratio { num: K, den: K + D } (v2).
 * mitigationFactor(D, K) = the same ratio as a binary64 number, for display and reports only.
 * critChanceEffective(bp) = min(bp, 10000); overcap = max(0, bp - 10000) (R-A2: may reach exactly 100%).
 *
 * damagePerHit (v2, exact): every input is an integer or an integer ratio, and
 *   V = (rawMilli / 1000) * (c / 10000) * (num / den),  c = critMultBp if crit else 10000,
 *   result = max(minDamage, floor(V + 1/2))
 * is computed with exact integer arithmetic (no binary64 rounding anywhere), so a mathematically exact
 * half rounds up. NUMERIC_LIMIT only if the rounded result exceeds 2^53 - 1. See evaluation notes below.
 * hitsToKill(hp, damage) = ceil(hp / damage), integers >= 1.
 */
import { fail } from '../errors.ts';
import { assertProbabilityBp, BP_SCALE } from '../numeric/basisPoints.ts';
import { roundHalfUp } from '../numeric/rounding.ts';
import { evaluateStat, type StatCategory, type StatSource } from './stats.ts';
import { addSafe, assertNonNegativeSafeInt, assertSafeInt, assertSafeIntInRange, ceilDiv, divRem, mulDivRem } from '../numeric/safeInt.ts';

export interface HitCurve {
  readonly hAtReqBp: number;
  readonly floorBp: number;
  readonly k: number;
}

export function assertHitCurve(curve: HitCurve): HitCurve {
  const h = assertProbabilityBp(curve.hAtReqBp, 'hAtReqBp');
  const f = assertProbabilityBp(curve.floorBp, 'floorBp');
  assertSafeIntInRange(curve.k, 1, 8, 'k');
  if (f > h) fail('INVALID_NUMBER', 'floorBp must be <= hAtReqBp', { floorBp: f, hAtReqBp: h });
  return curve;
}

export function hitChance(accuracy: number, requirement: number, curve: HitCurve): number {
  const a = assertNonNegativeSafeInt(accuracy, 'accuracy');
  const r = assertNonNegativeSafeInt(requirement, 'requirement');
  assertHitCurve(curve);
  if (r === 0) return 1;
  const floor = curve.floorBp / BP_SCALE;
  if (a === 0) return floor;
  const ratio = r / a;
  let pow = 1;
  for (let i = 0; i < curve.k; i += 1) pow *= ratio;
  const h = 1 - (1 - curve.hAtReqBp / BP_SCALE) * pow;
  return Math.min(1, Math.max(floor, h));
}

/** An exact non-negative ratio num / den of safe integers. */
export interface Ratio {
  readonly num: number;
  readonly den: number;
}

/** Mitigation K / (K + D) as an exact ratio. D >= 0, K >= 1 (diminishing, never 0, 1/2 at D = K). */
export function mitigationRatio(defence: number, k: number): Ratio {
  const d = assertNonNegativeSafeInt(defence, 'defence');
  const kk = assertSafeInt(k, 'K');
  if (kk < 1) fail('INVALID_NUMBER', 'K must be >= 1', { K: kk });
  return { num: kk, den: addSafe(kk, d) };
}

/** The mitigation ratio as a binary64 number. Display and reports only; damage uses mitigationRatio. */
export function mitigationFactor(defence: number, k: number): number {
  const r = mitigationRatio(defence, k);
  return r.num / r.den;
}

export function critChanceEffective(critChanceBp: number): { effectiveBp: number; overcapBp: number } {
  const bp = assertNonNegativeSafeInt(critChanceBp, 'critChanceBp');
  return { effectiveBp: Math.min(bp, BP_SCALE), overcapBp: Math.max(0, bp - BP_SCALE) };
}

/** Raw damage is given in thousandths: rawMilli = 6500 means 6.5 (combat.md v2, "Inputs"). */
export const RAW_SCALE = 1000;
const DAMAGE_DEN = RAW_SCALE * BP_SCALE; // 10^7: rawMilli / 1000 * c / 10000 = rawMilli * c / 10^7
const HALF_DAMAGE_DEN = DAMAGE_DEN / 2; // 5 * 10^6, an integer, so the half-up test needs no fraction

export interface DamageInput {
  /** Raw damage of a landed hit, in thousandths; safe integer >= 1. */
  readonly rawMilli: number;
  readonly crit: boolean;
  /** Crit multiplier in basis points; safe integer >= 10000 (checked even when crit is false). */
  readonly critMultBp: number;
  /** Mitigation as an exact ratio with 1 <= num <= den (from mitigationRatio). */
  readonly mitigation: Ratio;
  /** Damage floor for landed hits; safe integer >= 1. */
  readonly minDamage: number;
}

/**
 * Exact damage per landed hit. With c = critMultBp (crit) or 10000 (no crit), the exact value is
 *   V = rawMilli * c * num / (10^7 * den).
 * Evaluation, mitigation first so no intermediate exceeds rawMilli or the result:
 *   1. rawMilli * num = Q1 * den + R1                 (mulDivRem; Q1 <= rawMilli because num <= den)
 *   2. Q1 * c = G * 10^7 + R2                          (mulDivRem; G <= V)
 *   3. R1 * c = H * den + R3                           (mulDivRem; H < c)
 *   So V = G + (R2 + H)/10^7 + R3/(10^7 * den). With R2 + H = carry * 10^7 + n (0 <= n < 10^7):
 *   floor(V) = G + carry, and the fractional part (n + R3/den) / 10^7 is >= 1/2 exactly when n >= 5 * 10^6
 *   (n is an integer and 0 <= R3/den < 1). R3 itself is therefore never needed.
 */
export function damagePerHit(input: DamageInput): number {
  if (input === null || typeof input !== 'object') fail('INVALID_NUMBER', 'damage input must be an object');
  const raw = assertSafeInt(input.rawMilli, 'rawMilli');
  if (raw < 1) fail('INVALID_NUMBER', 'rawMilli must be >= 1 (the floor applies only to landed damaging hits)', { rawMilli: raw });
  if (typeof input.crit !== 'boolean') fail('INVALID_NUMBER', 'crit must be a boolean');
  const mult = assertSafeInt(input.critMultBp, 'critMultBp');
  if (mult < BP_SCALE) fail('INVALID_NUMBER', 'critMultBp must be >= 10000', { critMultBp: mult });
  const mit = input.mitigation as unknown;
  if (mit === null || typeof mit !== 'object') fail('INVALID_NUMBER', 'mitigation must be a ratio { num, den }');
  const num = assertSafeInt((mit as Ratio).num, 'mitigation.num');
  const den = assertSafeInt((mit as Ratio).den, 'mitigation.den');
  if (num < 1 || den < num) fail('INVALID_NUMBER', 'mitigation must satisfy 1 <= num <= den', { num, den });
  const minDamage = assertSafeInt(input.minDamage, 'minDamage');
  if (minDamage < 1) fail('INVALID_NUMBER', 'minDamage must be >= 1', { minDamage });

  const c = input.crit ? mult : BP_SCALE;
  const step1 = mulDivRem(raw, num, den);
  const whole = mulDivRem(step1.q, c, DAMAGE_DEN);
  const h = divRem(mulDivRem(step1.r, c, den).q, DAMAGE_DEN); // H = h.q * 10^7 + h.r
  const t = whole.r + h.r; // < 2 * 10^7
  const carry = t >= DAMAGE_DEN ? addSafe(h.q, 1) : h.q;
  const n = t >= DAMAGE_DEN ? t - DAMAGE_DEN : t;
  let result = addSafe(whole.q, carry);
  if (n >= HALF_DAMAGE_DEN) result = addSafe(result, 1);
  return Math.max(minDamage, result);
}

/**
 * Attack quantisation (combat.md v2, "Attack quantisation", added in S1).
 * The attack stat is evaluated in thousandths (base and flat sources are integer thousandths); the only binary64
 * steps are the stats.md v2 category factors. rawMilli = roundHalfUp(value), exact for the binary64 value, with no
 * multiplication by 1000. A value that rounds to 0 cannot land a damaging hit (INVALID_NUMBER).
 */
export function attackRawMilli(baseMilli: number, sources: readonly StatSource[], categories: readonly StatCategory[]): { value: number; rawMilli: number } {
  const value = evaluateStat(baseMilli, sources, categories).value; // finite, in [0, 2^53 - 1] (stats.md v2)
  const rawMilli = roundHalfUp(value);
  if (rawMilli < 1) fail('INVALID_NUMBER', 'attack too low to land a damaging hit (rounds to 0 thousandths)', { value });
  return { value, rawMilli };
}

export function hitsToKill(hp: number, damage: number): number {
  const h = assertSafeInt(hp, 'hp');
  const d = assertSafeInt(damage, 'damage');
  if (h < 1) fail('INVALID_NUMBER', 'hp must be >= 1', { hp: h });
  if (d < 1) fail('INVALID_NUMBER', 'damage must be >= 1', { damage: d });
  return ceilDiv(h, d);
}
