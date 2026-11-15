# S4 permanent progression formulas — v1.1

**Version 1.1, 2026-11-15** (v1 2026-11-14). **Status: candidate.** This specification implements `planning/S4_SPECIFICATION.md` §2–§7 (legion-progression-lab).
- **v1.1** adds §9, the owner's three S4 acceptance corrections ("Independent S4 Review and L2 Authorisation" §2–§4). It also clarifies the regional mastery row in §4. **Nothing else changed.** Every v1 fixture still holds.
- **Fixtures:**
  - `permanent-rules.v1.json` (v1);
  - `permanent-acceptance.v1.json` (v1.1 §9).

  Both are checked by `spec/oracle/s4_oracle.py`.
- **Arithmetic:** integers throughout, except the attack evaluation, which follows the binary64 order of `stats.md` v2.

## 1. Monument cost and bonus tables
**Gold cost** from level L to L + 1, for L = 0 … maxLevel − 1:
- `cost(0) = baseGold`;
- `cost(L + 1) = ceil(cost(L) × (10000 + growthBp) / 10000)`.

**Validity.** Every cost, every product `cost × (10000 + growthBp)` and the summed cost must be safe integers. Otherwise the content is invalid.

**Bonus at level L** (bp):
- `bonusAt(0) = 0`;
- `bonusAt(L) = bonusAt(L − 1) + perLevelBp(tier holding L)`.

**Tiers.** The tier holding level L is the first tier with `L ≤ toLevel`. Tier ends increase, and the last tier ends at maxLevel. A later tier never gives more per level than an earlier one: this is the soft cap.

**Milestones.** Entering milestone level L costs `cost(L − 1)` gold plus its listed materials. Each material is listed at most once per milestone.

## 2. Purchases and Buy Max
**The price** of k levels from level L is:
- gold `Σ_{l=L}^{L+k−1} cost(l)`;
- materials: the sum of the milestone lists of levels L + 1 … L + k, per resource.

**Exact purchase of n levels.** It is refused unless all of these hold:
- the Monument is discovered;
- `1 ≤ n`;
- `L + n ≤ maxLevel`;
- the whole price is covered by the **available** balances (reserved production materials do not count).

On refusal nothing changes. Otherwise there is one transaction that debits the whole price.

**Buy Max** (the legal sequential contract): k is the largest number such that, for every j ≤ k:
- `L + j ≤ maxLevel`;
- the price of j levels is covered by the available balances.

Equivalently, walk upward and include each next level while its gold cost and milestone materials fit what is left. So an affordable milestone is crossed, and the walk stops before the first level that does not fit.

k = 0 is refused, with no partial purchase.

## 3. Bonus pools (applied once to every owned character)
Let the permanent sources in force be the granted rewards and the Monument levels.

**Sums per target:**
- `A` = Σ attack rewards;
- `M_a` = the Monument of Power's `bonusAt(level)`;
- `H` = Σ maxHp rewards;
- `M_h` = the Monument of Vitality's `bonusAt(level)`;
- `K` = Σ crit rewards;
- `P` = Σ ability rewards;
- `G` = Σ gather rewards plus the Monument of Industry's `bonusAt(level)`;
- `S` = Σ smith rewards plus the Monument of Industry's `bonusAt(level)`.

**Attack** (milli). From `stats.md` v2, with the base attack of combat v2 and S3 (level, weapon, hero variants):
- `A` joins the existing additive pool `cat.damage.additive`, together with the class and talent attack bp;
- `M_a` is the single source of the S1-registered category `cat.damage.monument`, active only when `M_a ≠ 0`;
- categories are evaluated in ascending ID order, each with one factor `(10000 + sum) / 10000`;
- `attackRawMilli = roundHalfUp(value)`.

**Max HP:**
- **classless:** `pool = baseHp` if `H = 0`, otherwise `max(1, roundDiv(baseHp × (10000 + H), 10000))`;
- **with a class:** `pool = max(1, roundDiv(baseHp × (10000 + classHpBp + talentHpBp + H), 10000))`;
- then `maxHp = pool` if `M_h = 0`, otherwise `max(1, roundDiv(pool × (10000 + M_h), 10000))`.

Here `roundDiv(a, b) = floor((2a + b) / (2b))`.

**Crit:** `min(baseCritBp + classCritBp + talentCritBp + equipmentCritBp + K, 10000)`.

**Ability:** the ability multiplier's bp sum gains `P`.

**Efficiency:** gathering efficiency gains `G` and smithing efficiency gains `S`. Both enter the S3 efficiency sum once, are captured at work start, and are never applied again at deposit.

**Neutral identity:** when every sum is 0, every stat equals the S3.1 stat.

## 4. Rewards and counters
**Every reward has a stable ID** and is granted at most once. It is earned when its condition holds:

| Condition | Earned when |
|---|---|
| counter | `counter ≥ threshold` |
| bestiary | the species' accepted credits `≥ kills` |
| emblem | the species' emblem copies `≥ 1` |
| regional completion | every listed species has at least 1 credit |
| regional mastery | every listed species has reached the **required rank**: Gold in the current slice (§9.3). v1 said "highest rank threshold", which is the Gold threshold only while Gold is the highest defined rank; v1.1 fixes the rank by name |
| class record | the account record of the class (highest mastery level) `≥ record` |

**Counters** are lifetime totals or high-water marks and never decrease:
- **from events:**
  - accepted kill credits;
  - gold from kill credits;
  - deposited raw units;
  - completed timed units;
  - crafts;
  - enhancements;
  - recruits acquired;
- **derived from monotone flags:**
  - zones visited;
  - kill gates completed;
  - boss cleared;
- **high-water marks:**
  - Σ levels of the hero and non-reserve recruits;
  - Σ profession levels of all owned characters.

**Grants.** An evaluation grants every earned, not-yet-granted reward in ascending ID order. Rewards are stat bonuses only, so one evaluation is complete.

**Emblem draws.** Each accepted kill credit of a species with `dropBp > 0` makes exactly one Bernoulli draw from the `bestiary.emblem` stream (`rng.md` thresholds).

## 9. S4 acceptance corrections (v1.1)
### 9.1 Checked authoritative counts (correction A)
**Covered counts:**
- lifetime counters;
- Bestiary kills;
- emblem copies;
- the Monument purchase count;
- the high-water sums;
- Monument price sums.

**The domain:** each count is an integer in `[0, 2^53 − 1]`.

**Every addition is checked:** `add(v, d)` needs both operands in the domain and gives `v + d` only when `v + d ≤ 2^53 − 1`.
- **Out of the domain** (negative, fractional or unsafe operands): `INVALID_NUMBER`.
- **Beyond the domain:** the operation is refused with `NUMERIC_LIMIT`.

**Nothing is clamped, and no progress is discarded.** The simulation refuses the whole step that contains the operation:
- **The step:** every event at one event key, the policy batch included.
- **The account state returns to the state before that step:** no kill reward, RNG advance, resource, EXP, entitlement or counter is partly committed.
- **The run then stops,** and a later `run` is refused.
- **A claim waiting for its credit stays waiting.** It is neither consumed nor lost.

**Lifetime turnover:** a lifetime counter is not a current balance, so a safe balance does not make a lifetime sum safe.
- **Example:** gold earned at `2^53 − 1 − g` plus a kill worth `g` gives exactly `2^53 − 1`.
- The next credit with gold > 0 is refused.

**Before a run,** a permanent state outside the domain is refused (`INVALID_STATE`) and never repaired:
- a negative, fractional or unsafe count;
- a Monument level outside `[0, maxLevel]`, or levels on an undiscovered Monument;
- an unknown granted reward;
- a missing Bestiary or Monument entry.

### 9.2 Canonical identity and effective application (correction B)
**Every bonus source has two parts:**
- **Canonical identity:** `sourceId`, `system`, `target` and `canonicalCategory` (the S4-R03 control category). These never depend on the content variant.
- **Effective application:** `appliedStat` and `appliedCategory`.

| Target | appliedStat | canonicalCategory | appliedCategory, control (`category`) | appliedCategory, `additive` pooling |
|---|---|---|---|---|
| attack | attack | `cat.damage.additive` | `cat.damage.additive` | `cat.damage.additive` |
| monumentAttack (Power) | attack | `cat.damage.monument` | `cat.damage.monument` | **`cat.damage.additive`** |
| maxHp | maxHp | `pool.hp` | `pool.hp` | `pool.hp` |
| monumentHp (Vitality) | maxHp | `factor.monument.hp` | `factor.monument.hp` | **`pool.hp`** |
| critChance, abilityPower, gather and smith efficiency | the same | `pool.crit`, `pool.ability`, `pool.efficiency.*` | the same | the same |

**The effective grouping** is one group per `(appliedStat, appliedCategory)`:
- groups are in first-appearance order (granted rewards in ascending ID order, then Monuments in content order);
- each group lists its source IDs and the exact sum of their bp.

**Reconstruction:** §3 evaluated with the applied categories reproduces every applied stat:
- attack sources enter `evaluateStat` in their `appliedCategory`;
- HP sources in `pool.hp` add to `H`, and those in `factor.monument.hp` add to `M_h`.

**Example:** ordinary attack 200 bp and Power 2,000 bp:
- the control has two groups (200 additive, 2,000 Monument);
- additive pooling has one group of 2,200 bp.

### 9.3 Regional mastery rank (correction C)
**Regional mastery** is earned when every species of the region has at least the kills of the **required rank**, matched by name.
- **Schema version 1 packs** (S4 v0.4.0) carry no field. The required rank is **Gold** (S4-R16).
- **Schema version 2 packs** (v0.4.1 onward) state `mastery.requiredRank`.

**Refused as `INVALID_CONTENT`:**
- a schema-2 region without `requiredRank`;
- a schema-1 region with it;
- an unknown rank name;
- a species that does not define the required rank;
- a region species with no Bestiary entry;
- a duplicate region.

**A rank added later never changes an existing condition,** because the rank is named, not "the highest". For example, adding Diamond 700 to Green Slime leaves Gold mastery at 600.
