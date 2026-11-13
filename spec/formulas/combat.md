# Combat primitives

## v2

Current version (S0.1, 2026-11-13). All coefficients remain content candidates (`s0-core.candidate.v0.1.0`: K = 100, hAtReqBp = 9000, floorBp = 1000, k = 2, minimum damage 1). S0 covers primitives only; the combat loop is S1 (architecture §9).

**Changes from v1:**
- Damage per hit is evaluated **exactly**, from integer inputs, with a single round-half-up at the end.
- Mitigation is available as an exact ratio.

**Impact:**
- **Inputs:** the damage inputs change shape (`rawMilli` and `mitigation: { num, den }` replace v1's binary64 `raw` and `mitigation`).
- **Results:** they change only where v1's binary64 arithmetic rounded a mathematically exact half (or a value within one binary64 step of a half) the wrong way. Examples: 100 × 1.005 = 100.5 gave 100 in v1 and gives 101 in v2. The `combat.dmg.*` boundary fixtures list the others found by a search over small inputs.
- **Unchanged:** hit chance, the display mitigation factor, crit chance and hits-to-kill.

### Hit chance (unchanged from v1)
See v1 below. It stays a binary64 probability, computed with division and repeated multiplication (no `pow`) in a fixed order, and is turned into an exact Bernoulli threshold by `rng.md`.

*Parity note:* IEEE-754 makes each step deterministic. A Luau kernel must use the same operation order and no fused multiply-add. The M2 parity runner should include the `combat.hit.*` cases with exact tolerance in addition to their current relative tolerance.

### Mitigation (exact ratio added in v2)
- `mitigationRatio(D, K) = { num: K, den: K + D }`, for D ≥ 0 and K ≥ 1 (otherwise `INVALID_NUMBER`). `K + D > 2^53 − 1` gives `NUMERIC_LIMIT`. The ratio is not reduced.
- `mitigationFactor(D, K) = K / (K + D)` as a binary64 number. It is unchanged from v1 and is for display and reports only. **Damage never uses it.**
- Mitigation is diminishing, never zero, and equals 1/2 at D = K.

### Critical hits (unchanged from v1)
- `critChanceEffective(bp) = min(bp, 10000)`, with `overcap = max(0, bp − 10000)` reported. Crit chance may reach exactly 100%. The excess has no effect, and there are no super-crit tiers at launch.
- `critMultBp ≥ 10000`; the crit factor is `critMultBp / 10000`.
- The crit roll is a Bernoulli trial at `effectiveBp` (`rng.md`).

### Damage per landed hit (changed in v2): evaluation contract
**Inputs (all exact):**
| Input | Meaning | Domain |
|---|---|---|
| `rawMilli` | raw damage of a landed hit in **thousandths** (6.5 → 6500) | safe integer ≥ 1 |
| `crit` | whether the hit is critical | boolean |
| `critMultBp` | crit multiplier in basis points (checked even when `crit` is false) | safe integer ≥ 10000 |
| `mitigation` | `{ num, den }`, normally `mitigationRatio(D, K)` | safe integers, `1 ≤ num ≤ den` |
| `minDamage` | damage floor for landed hits | safe integer ≥ 1 |

A violation gives `INVALID_NUMBER`.

**Value:** with `c = critMultBp` if `crit`, otherwise `c = 10000`:
```
V = (rawMilli / 1000) × (c / 10000) × (num / den)      exactly, as a rational number
result = max(minDamage, ⌊V + 1/2⌋)                     round half up, once, at the end
```
A mathematically exact half always rounds up. There is no binary64 rounding anywhere and no epsilon. `⌊V + 1/2⌋ > 2^53 − 1` gives `NUMERIC_LIMIT`, raised before the floor is applied.

**Evaluation without big integers.** Write `V = rawMilli·c·num / (10^7·den)` and apply mitigation first, so no intermediate exceeds `rawMilli` or the result:
1. `rawMilli·num = Q1·den + R1`, using `mulDivRem`. Since `num ≤ den`, `Q1 ≤ rawMilli`.
2. `Q1·c = G·10^7 + R2`, using `mulDivRem`. Here G ≤ V.
3. `R1·c = H·den + R3`, using `mulDivRem`. Here H < c.
4. Then `V = G + (R2 + H)/10^7 + R3/(10^7·den)`. Split `H = h₁·10^7 + h₀` and `t = R2 + h₀` (below 2·10^7). Then `carry = h₁ + (t ≥ 10^7 ? 1 : 0)` and `n = t mod 10^7`.
5. `⌊V⌋ = G + carry`. The fractional part `(n + R3/den)/10^7` is ≥ 1/2 **exactly when n ≥ 5·10^6**, because n is an integer, `0 ≤ R3/den < 1` and 5·10^6 is an integer. R3 is never needed.
6. `result = max(minDamage, ⌊V⌋ + (n ≥ 5·10^6 ? 1 : 0))`, with checked additions.

**Supported domain (precise):** every input in the table above. The only refusal is a result above 2^53 − 1.
- *Examples:* `rawMilli = 2^53 − 1` with a 2000× crit and mitigation 1/2 gives exactly 2^53 − 1. Any intermediate that would exceed the result is avoided by applying mitigation first.
- *Representation limit:* raw damage is at most (2^53 − 1)/1000 ≈ 9.0 × 10^12 per hit, before crit.

### Attack quantisation: derived attack → `rawMilli` (added in S1; combat stays v2)
This section replaces the S0.1 recommendation (`rawMilli = roundHalfUp(attack × 1000)`). The rule below avoids that extra binary64 multiplication.

**1. Attack is a stat measured in thousandths.**
- The attack stat's `base` and every flat attack source are integer thousandths of a damage point. Content fields end in `Milli`; for example, a base attack of 6 is `baseAttackMilli: 6000`.
- The derived attack value is `v = evaluateStat(baseMilli, sources, categories).value` (`stats.md` v2), so v is already in thousandths.
- The only binary64 operations are the category factors of `stats.md` v2, in ascending category-ID order. With no active non-neutral category, v is the exact integer `flatTotal`.

**2. Quantisation:** `rawMilli = roundHalfUp(v)` (`numeric.md`).
- `roundHalfUp` is exact for every finite binary64 v, and no multiplication by 1000 is performed. The quantisation therefore adds no rounding of its own; it rounds the binary64 value v half up.

**3. Limits:**
- v ≤ 2^53 − 1, otherwise `NUMERIC_LIMIT`, enforced by `stats.md` v2. Hence rawMilli ≤ 2^53 − 1.
- `rawMilli ≥ 1` is required for a damaging hit. A derived attack below 0.5 thousandths, which rounds to 0, gives `INVALID_NUMBER` ("attack too low to land a damaging hit").
- Content validation keeps every S1 attack ≥ 1 thousandth.

**4. Exactness boundary — two separate things:**
- **(a) Quantisation of the binary64 value.** `rawMilli` is a defined function of the binary64 value v, not of an idealised real. When v is large, the binary64 value can sit exactly on a half while the exact rational lies just below it.
  - Example: `combat.attack.binary64-half.001`. Base 999,990,001,923 with +13 bp is exactly …925.4999, but the binary64 value is …925.5, so `rawMilli` is …926.
  - This is deterministic, reproducible and specified. No epsilon is added.
- **(b) Exact damage given the quantised inputs.** Once `rawMilli`, `critMultBp` and the mitigation ratio are integers, `damagePerHit` is exact (above).

**5. Enemy attack.** It comes straight from content as an integer `attackMilli`. There is no stat evaluation and no quantisation.

**6. Defence** is an integer in S1: `baseDefence + defencePerLevel × (level − 1)`. It feeds `mitigationRatio(defence, K)`.

**7. Crit.** Chance and multiplier are integer basis points from content.

**Luau:** evaluate the same binary64 category factors in the same order, then the same exact `roundHalfUp`. No transcendental functions are involved.

**Fixtures:** operation `attackRawMilli` in `spec/fixtures/combat.v2.json` (fixture version 3), with these cases:
- integer values;
- an exact half produced by basis points;
- a value just below a half;
- the binary64-half case above;
- a half at 0.5 thousandths;
- zero and below-half refusals;
- the range limit.

The oracle replays the binary64 factors with Python floats and rounds the resulting double exactly with `Fraction`.

### Luau parity implications
- **Exactness.** Every operation is on integers below 2^53: `+`, `−`, comparisons, `x % 2`, halving, and `divRem` with its correction loops. A Luau kernel that follows the steps reproduces the integer result exactly, satisfying architecture §17.5: "damage ... integer-exact in both engines".
- **Parity fixtures.** The `combat.dmg.*` fixtures use exact tolerance and include:
  - exact halves through mitigation ratios that binary64 cannot represent (1/3, 5/6, 100/125);
  - a value 10^−12 below a half;
  - maximum-size inputs.
- **Binary64 parts.** Only hit chance and `mitigationFactor` remain binary64; neither feeds damage.

### Hits to kill (unchanged from v1)
`hitsToKill(hp, damage) = ceilDiv(hp, damage)`, with both safe integers ≥ 1 (otherwise `INVALID_NUMBER`).

Fixtures: `spec/fixtures/combat.v2.json`.
- **Fixture version 2:**
  - hit, mitigation-factor, crit and hits-to-kill cases are unchanged;
  - v1 damage cases are restated in v2 inputs with unchanged expected values;
  - `combat.dmg.overflow.001` is retired (it used v1's binary64 `raw = 2^53`) and replaced by `combat.dmg.not-safe.001` and `combat.dmg.overflow.002`;
  - new cases cover exact halves, near-halves, maximum inputs and `mitigationRatio`.

## v1 (superseded by v2 in S0.1; kept for history)

All coefficients are content candidates (`s0-core.candidate.v0.1.0`: K = 100, hAtReqBp = 9000, floorBp = 1000, k = 2, minimum damage 1). S0 covers primitives only; the combat loop is S1 (architecture §9).

### Hit chance (R02.08, R08.07)
`hitChance(A, R)`, for accuracy A ≥ 0 and requirement R ≥ 0 (safe integers). Curve parameters: `hAtReqBp`, `floorBp` (0 ≤ floorBp ≤ hAtReqBp ≤ 10000) and an integer k in 1..8 (otherwise `INVALID_NUMBER`).
- `R = 0` → 1.
- `A = 0` → `floorBp / 10000`.
- Otherwise, in this order:
  1. `ratio = R / A`.
  2. `pow = ratio^k`, by repeated multiplication (no `pow`).
  3. `h = 1 − (1 − hAtReqBp/10000) · pow`.
  4. Result `= min(1, max(floorBp/10000, h))`.

Properties: non-decreasing in A, equal to `hAtReqBp/10000` at A = R, tending to 1 as A grows, never below the floor.

### Mitigation (R08.08)
`mitigationFactor(D, K) = K / (K + D)`, for D ≥ 0 and K ≥ 1 (otherwise `INVALID_NUMBER`). It is diminishing, never zero, and equals 0.5 at D = K.

### Critical hits (R02.09, R08.09, R-A2)
- `critChanceEffective(bp) = min(bp, 10000)`, with `overcap = max(0, bp − 10000)` reported. Crit chance may reach exactly 100%. The excess has no effect. There are no super-crit tiers at launch.
- `critMultBp ≥ 10000`; the crit factor is `critMultBp / 10000`.
- The crit roll is a Bernoulli trial at `effectiveBp` (`rng.md`).

### Damage per landed hit
`damagePerHit(raw, crit, critMultBp, mitigation, minDamage)`, evaluated as:
```
x = raw
if crit: x = x × (critMultBp / 10000)
x = x × mitigation
result = max(minDamage, roundHalfUpToSafeInt(x))
```
- **Inputs:** `raw` must be finite and > 0, because the floor applies only to landed damaging hits; a miss never reaches this function. `mitigation ∈ (0, 1]` and `minDamage ≥ 1`. A violation gives `INVALID_NUMBER`.
- **Overflow:** a result above 2^53 − 1 gives `NUMERIC_LIMIT`.

### Hits to kill
`hitsToKill(hp, damage) = ceilDiv(hp, damage)`, with both safe integers ≥ 1 (otherwise `INVALID_NUMBER`). Damage and HP are integers, so breakpoints are exact. For example, at 15 HP: 7 damage → 3 hits, 8 damage → 2 hits.

Fixtures (v1): `spec/fixtures/combat.v1.json`, replaced in S0.1 by `combat.v2.json` (damage cases restated in v2 inputs; `combat.dmg.overflow.001` retired).
