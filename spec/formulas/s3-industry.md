# S3 industry formulas — v1

**Version 1, 2026-11-14. Status: candidate.** Implements planning/S3_SPECIFICATION.md §2–§8 (legion-progression-lab). Fixtures: `industry-rules.v1.json`, `equipment-ops.v1.json`, `production-queue.v1.json`, checked by `spec/oracle/s3_oracle.py`. All arithmetic is on integers; `floor` and `ceil` are exact.

## 1. Profession level and efficiency
- Profession level: the combat EXP table applied to the profession's cumulative EXP (level 1 at 0 EXP; level n+1 once the first n thresholds are covered).
- Efficiency (bp) = `(level - 1) x efficiencyPerLevelBp + toolEfficiency + affinity`, where `toolEfficiency` is the equipped tool's efficiency at its enhancement (§3) and `affinity = affinityBp` when the character holds the class whose affinity is this profession (Warrior: Mining, Archer: Smithing, Mage: Woodcutting), else 0.

## 2. Gathering
- One action lasts `actionMs`. Its yield numerator is `baseYieldMilli x (10000 + efficiency)`, with the efficiency captured at the action's start.
- Units deposited at the end of the action: with remainder `r` (per character and resource, starting at 0), `total = r + numerator`; `units = floor(total / 10^7)`; the new remainder is `total mod 10^7`.

## 3. Equipment
- Stats at enhancement `e`: each base stat `s` becomes `floor(s x (10000 + stepBp x e) / 10000)`.
- Enhancement from `e` to `e + 1` costs gold `goldBase x (e + 1)^2` and `(e + 1)` units of the tier's material; a tier without a declared material is invalid content.
- Character modifiers: the sum over equipped non-tool items of attack, HP, defence and crit at their enhancement. For the hero only, a weapon bonus `exclusiveWeaponBp` scales the summed attack: `floor(attack x (10000 + exclusiveWeaponBp) / 10000)`. Tools add no combat stats.
- A weapon is compatible when it lists the holder's class (a universal weapon lists every class and `none`).
- Auto-equip score: `attack + 1000 x defence + 200 x HP + crit + efficiency`, all at the item's enhancement; an empty slot scores -1. For each slot in the order weapon, helmet, chestplate, leggings, boots, accessory, pickaxe, axe, hammer, the highest-scoring compatible inventory item is chosen when it scores strictly more than the current one; ties go to the lowest item number.
- A recipe that consumes a lower-tier same-slot item accepts an item only if it is in the inventory (an equipped item: `ITEM_EQUIPPED`; consumed or salvaged: `ITEM_UNAVAILABLE`), unprotected (`ITEM_PROTECTED`), and of the same slot with a lower tier order (`CONSUME_ITEM_INVALID`); checked in that order.
- Salvage returns `floor(qty x salvageReturnBp / 10000)` of each declared recoverable line; zero lines are omitted.

## 4. Production queue (O10)
- A job holds a recipe, a quantity, its enqueue time and a state. A unit lasts `ceil(unitMs x 10000 / (10000 + smith efficiency))`, captured at the unit's start.
- **Same moment (D-07):** session boundaries; then completions (a gathering action or unit ends); then credits (deposits; unit settlements, in character-ID order); then the scheduling pass; then policy commands (in the order given), each of which may queue another pass.
- **Pass:** every assigned smith with no work, in acquisition order, scans the queued and paused jobs in FIFO order (enqueue time, then job number; the round-robin arm orders first by units already served). For each job: if it holds no reservation, the inputs of one unit (the reserve-all arm: of all remaining units) must be available; if not, the job becomes paused-shortage (logged when its state or shortage resource changes) and the scan continues; otherwise they move from available to reserved. The smith starts one unit of the first job that can start (logged: resumed, if it was paused; then started).
- **Settlement:** the reserved inputs of one unit are consumed and the outputs credited; the job's completed count rises; it becomes complete at its quantity, else queued; a pass follows.
- **Interruption:** cancelling a job, reassigning its smith or a session end abandons the unit in progress: its completion goes stale and (per-unit arms) its reservation returns to available; the job becomes cancelled (cancel) or queued. A cancelled job holding reservations (reserve-all) releases them all. A session end releases every unit; the next session start runs a pass.

## 5. Effective damage (direction H)
- In a batch where the enemy survives, every blow counts in full. In the lethal batch, the HP removed `H` is shared among the blows in proportion to their damage `d_i` (total `D > H`): `share_i = floor(d_i x H / D)`, and the `H - sum(share)` leftover units go one each to the blows with the largest `(d_i x H) mod D`, ties to the earlier blow. If `D <= H`, every blow counts in full. The shares sum exactly to `min(H, D)`.

---

## v1.2 (S3 acceptance addendum, 2026-11-14) — a dead hero cannot craft
Fixtures unchanged (crafting eligibility is tested by the engine tests `test/s3_acceptance.crafting.test.ts`).

### 6a. Crafting eligibility, completed (owner S3.1 final acceptance §2)
Section 6 of v1.1 applies, with one more refusal, checked after "knocked out": the hero while dead (`HeroState.status = 'dead'`, from `HeroDied` until `HeroRespawned`) -> `CRAFTER_DEAD`. Recruit knockouts stay `CRAFTER_KNOCKED_OUT`. Explicitly allowed (none is an encounter or production, and the instant craft interrupts none of them): the hero travelling between zones, a pending engagement (walking to a target; the encounter starts on arrival), and regeneration (resting, or regenerating while idle). A boss fight is an encounter (`CHARACTER_BUSY`). The crafting menu (`qualified`), the engine's defensive guard and monitor I20 apply the same contract.

---

## v1.1 (S3.1, 2026-11-14) — corrections after the independent S3 review
Fixtures: `recipe-validation.v1.json` (new), `industry-rules.v1.json` (fixture version 2: fractional shares added); `equipment-ops` and `production-queue` unchanged (their sections did not change).

### 6. Crafting eligibility (owner S3.1 §2; S3.1-R01)
Instant crafting is an account menu action by a named crafter, refused (never interrupting anything) unless the crafter is free. Checked in this order after the recipe: in the reserve -> `CRAFTER_IN_RESERVE`; knocked out -> `CRAFTER_KNOCKED_OUT`; in an encounter -> `CHARACTER_BUSY`; another productive activity (a gathering action or production unit in progress, a gathering or independent-combat assignment, or the hero gathering) -> `CRAFTER_WORKING`; then the Smithing level, the consumed item and the materials as in v1. Reserve characters therefore never gain profession EXP. Equipping, unequipping and auto-equipping a reserve character stay allowed (they are not production).

### 7. Recipe validation (owner S3.1 §3), before play
For every recipe:
1. No resource appears more than once in its inputs, its outputs (timed) or its recoverable list (item).
2. Item recipes: for every resource, the summed recoverable quantity does not exceed the summed input quantity, and a recoverable resource must be an input.
3. Timed recipes: for every resource that is both an input and an output, the output is strictly smaller than the input (no self-amplifying recipe).
4. Intermediates stay safe integers: each line quantity x 1000 (the largest job's reservation) and x 10000 (salvage), the unit time x 10000.
Material checks at play time sum lines that name the same resource. Per-recipe rules cannot prove that a whole economy of interconnected recipes has no profitable cycle; the recycle search (S3-E06, S3.1-E06) covers that.

### 5a. Effective damage, fractional attribution (replaces the integer rounding of §5 for analysis)
In the lethal batch, with blows `d_i`, total `D` and HP removed `H`: if `D <= H` every blow counts in full; otherwise `share_i = (d_i x H) / D`, computed as one exact integer product (refused if it leaves the safe integer range) and one correctly rounded division. A share depends only on its own blow, so it is independent of order and identical attackers receive identical shares. Precision: per kill, `|sum(share_i) - H| <= 1e-9 x max(1, H)`; run totals are compared with a relative tolerance of 1e-6. Authoritative combat damage and enemy HP stay integers; the v1 integer attribution is kept, labelled legacy, for comparison with S3 results.
