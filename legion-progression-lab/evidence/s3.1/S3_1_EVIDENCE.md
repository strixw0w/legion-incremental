# S3.1 evidence: correctness and economic calibration

**Increment:** S3.1, authorised by the owner's "Independent S3 Review and S3.1 Authorisation" (2026-11-14). S3 is conditionally accepted, subject to this increment.

**Date:** 2026-11-14.

**Status:**
- **S3 and S3.1 are uncommitted**, on top of the S2 checkpoint (`732f3da`, tag `s2-checkpoint`). They await independent review and owner acceptance.
- **Not pushed.** The GitHub remote is public.
- **S4 not started.** No old workspace was deleted.

**Labels:**
- Every S3.1 input number is a `candidate`. Every result is a model output from candidate inputs. Nothing is approved or live-validated.
- **No coefficient is promoted.** The S3 content (`content/w1-slice-s3.candidate.v0.3.0.json`), the S3 manifests, results and fingerprints, and every earlier increment's content and results are unchanged (§10, preservation-check.txt). Candidate variants are named patches on the frozen S3 content, never a new baseline.

**Engineering gates:** **all pass.**
- Type check; 1,116 default tests and 9 statistical tests; 422 fixture cases with 0 problems; 18 oracle groups with 0 failing; 3 schemas in sync.
- 16 of 16 new planted bugs and 21 of 21 S3 planted bugs detected.
- 8 of 8 S3.1 experiments re-verified MATCH; the determinism and reference-ledger checks pass; 19 of 19 historical experiments MATCH.
- The S3 regression changes are fully attributed to S3.1-R01 (75 of 75 cells).
- The monitor found 0 violations in 11,250 S3.1 runs.
- 24 of 24 registered files are unchanged, and 0 S3 package artefacts changed.

**Candidate balance targets:**
- H-S3.1-01 (first craft in 5–10 min) passes in 13 of 20 cells.
- H-S3.1-02 (meaningful upgrade in 15–25 min) **misses in all 20**: the upgrades come earlier.
- H-S3.1-03 (Copper cuts time-to-kill by 25%) passes in the informative range and is not informative in zone 2.
- H-S3.1-05 (payback): **none within the horizon** for any start or policy version.

No target was moved after the results.

---

## 0. In plain words (for the owner)
- **The three review findings are fixed and tested.**
  - **Crafting:** a character in the reserve, knocked out, fighting, or busy gathering, smithing or working cannot craft any more. Crafting never interrupts anything. A reserve character's equipment can still be managed.
  - **Recipes:** a recipe that lists the same material twice, or gives back more than it takes, is now rejected when the content loads. The exact recipe the reviewer used to create planks from nothing is refused.
  - **Damage shares:** "who did the damage" is now split in a way that does not depend on the order of the squad. The old method is kept beside it for comparison.
- **The corrections barely move the S3 results.** All S3 experiments that craft were re-run.
  - The changes are tiny: total EXP moved by at most 0.02%.
  - One strategy's first craft moved from 2.4 to 2.6 minutes.
  - No S3 pass/miss outcome changed (185 of 185 the same).
  - **Cause check:** putting the old crafting rule back temporarily reproduced every original S3 result exactly. So the fix alone explains all the changes.
  - In S3, characters who were busy could also craft instantly (in every example found, a smith in the middle of a job). That happened 7,232 times in total, about once per run, and S3.1 forbids it.
- **A demand-aware strategy changes the picture of industry a lot.**
  - The S3 strategies gave recruits fixed jobs for the whole session. They collected 2,000–5,000 units of material but used only 42–90 of them, and the smiths had nothing to make for most of the hour. **The problem was never production capacity. It was that nobody asked for anything.**
  - The new strategy (POL3-DEMAND) gathers only what the next useful upgrade needs and sends workers back to fighting.
    - At 60 minutes it loses 17.6% of the legion's combat EXP against pure combat, where the S3 strategies lost 65–91%.
    - It crafts about 49 items instead of 5–11.
- **But equipment still never pays for itself in this content.**
  - Even over three hours, pure combat stays ahead.
  - The reason is the content, not the gear. After about 30–45 minutes everyone out-levels zone 3, the last zone in the S3 slice, and kills enemies as fast as they appear. More damage then changes nothing, so the time spent on industry is never won back.
  - Measuring payback properly needs content where enemies keep pace with the player. That is outside S3.1 (no Iron, no new zones).
- **A mistake in the new strategy was found after the results and is reported, not hidden.**
  - When nothing was left to build, the strategy sometimes left a recruit gathering for the rest of the session, building a useless stockpile.
  - A corrected copy (POL3-DEMAND2) was registered before it ran. It removes the stockpile completely (from as many as 3,201 unused units to 3–11) and makes several sensitivity results sensible again.
  - The registered results are kept exactly as they were.
- **Copper is stronger than S3 suggested.** In a fight that is not already instant, a full Copper set cuts time-to-kill by 26% against Wood, which meets the 25% candidate target. S3's weak result came mostly from fights that were already near-instant.
- **First items:** the first crafted item arrives in 2.6–10.8 minutes. That is inside the 5–10 minute candidate band for most strategies. The first *meaningful* upgrade arrives at the same moment, because the first weapon on an empty-handed character is always a big jump. So the 15–25 minute band for a meaningful upgrade is missed by being too early.
- **Hero power with a full squad of three recruits:**
  - The hero does 14–24% of the effective damage when playing passively, and 19–32% when the player uses abilities.
  - Raising the hero's base attack by 25% adds only about 2% hero EXP in a campaign. Doubling it adds 6.5%.
- **Decisions for the owner** are listed in §11.

## 1. Verification recorded (not overstated)
**What was checked, and by whom.** Everything in this package was built and checked by the implementing agent, on the owner's machine:
- the tests, fixtures, Python oracle, monitor, mutation checks, attribution check, determinism and reference-ledger checks, and historical regression.

**What is not independent.**
- The Python oracle is a second implementation, but **the same author wrote it** from the same specification (`spec/formulas/s3-industry.md` v1.1).
- The fresh-extraction check of the archive re-runs the same code on the same machine and platform.
- **Nothing in S3.1 has been independently verified.**

**The only independent work.** The owner's S3 review (which found blockers A and B and measurement C). It covered S3, not S3.1.

**What S3.1 adds on top of that review:**
- the reviewer's exact reproductions, run before and after (§2);
- mutation checks for each new defect (§10);
- the attribution check (§5).

## 2. The review findings: before and after (owner §2–§4)
`node repro/s3.1/defects.mjs <lab>` was run on the S3 package's lab folder (before) and on this tree (after). Outputs: `repro/original-S3-package.json.txt` and `repro/corrected-S3.1.json.txt`.

| Reproduction | S3 package | S3.1 |
|---|---|---|
| A. Reserve recruit with 4 planks crafts a club | accepted; item created; 4 smithing EXP; monitor silent | refused `CRAFTER_IN_RESERVE`; no item; 0 EXP |
| A. Gatherer mid-action crafts | accepted, item, EXP | refused `CRAFTER_WORKING` |
| A. Smith mid-unit crafts | accepted, item, EXP | refused `CRAFTER_WORKING` |
| A. Independent combat worker crafts | accepted, item, EXP | refused `CRAFTER_WORKING` |
| A. Knocked-out recruit crafts | accepted, item, EXP | refused `CRAFTER_KNOCKED_OUT` |
| B. Recoverable plank listed three times (1 each) on a 2-plank recipe | content accepted; craft + salvage turns 2 planks into 3 | content refused (`INVALID_CONTENT`: recoverable plank exceeds its input, summed 3 against 2) |
| B. Duplicate inputs in a timed recipe | content accepted | refused |
| C. Equal remainders `[1, 0]` / permuted order | legacy integer shares depend on order (`[2,1,0]` against `[1,1,1]` for the same damage) | legacy kept unchanged; fractional shares `[0.5, 0.5]`, identical under permutation |

## 3. The corrections

### A. Crafting eligibility (S3.1-R01; owner §2)
**The rule (`planning/S3_1_RESOLUTIONS.md` R01).** Instant crafting is an account menu action by a named crafter, who must be free. It is **refused, never interrupting anything**, when the crafter:
- is in the reserve;
- is knocked out;
- is in an encounter;
- or has another productive activity: a gathering action or production unit in progress, a gathering or independent-combat assignment, or (for the hero) gathering.

**Who may craft.** An assigned smith between units, an idle recruit, and a squad member or the hero between fights. The alternatives, interrupting work or exempting crafting, were rejected (R01's reasons column).

**Where it is enforced.**
- `crafterBlocker` in `src/engine/industry.ts` is applied in command validation.
- The engine refuses an ineligible crafter even if validation were bypassed (`legion.ts`).
- The crafting menu lists only eligible crafters (`qualified`). It also shows `levelQualified` so a player can see who could craft once free.
- Monitor **I20** re-states the rule independently at every craft.

**What still works.** Reserve characters' equipment can be inspected, equipped, unequipped and auto-equipped (tested). Reserve characters gain no profession EXP. A reserve character that becomes productive again receives no stale reward (tested).

**Policies.** Crafter observations and policy recommendations exclude ineligible characters. All POL3 strategies choose crafters from the corrected menu.

### B. Aggregate recipe validation (S3.1-R02; owner §3; spec v1.1 §7)
**What the content compiler checks now:**
- No resource may appear twice in one input, output or recoverable list.
- The summed recoverable quantity of a resource must not exceed its summed input.
- A timed recipe must return strictly less of any input it also outputs (no self-amplification).
- Intermediates are checked: plank and bar recipes against their raw inputs.
- The integer domain is checked at the extremes: node yields at maximum efficiency, exclusive weapon bonuses, and character stats at maximum level with maximum modifiers for each class.

**Input checks.** The engine's input check sums lines that name the same resource (`shortInput`), and does not rely on content validation for this.

**Salvage bound.** Monitor **I21** bounds every salvage by the inputs actually debited by that item's craft.

**Recycle search.** The S3 multi-recipe recycle search is kept, and its default run is identical to S3-E06. S3.1-E07 extends it to timed conversions and every candidate variant (§6.1).

### C. Order-independent effective damage (S3.1-R03; owner §4; spec v1.1 §5a)
**The new method.** Each contributor's effective share of a lethal hit is `d_i × H / D`, computed as a fraction (no rounding, so no order dependence).
- **Precision contract:** |Σ shares − H| ≤ 1e-9 × max(1, H).
- **Number range:** the product `d × H` must be a safe integer, or the function throws. This is tested at the boundary.

**Kept and tested.**
- Combat stays integer: hit points, damage and kills are unchanged.
- The S3 integer largest-remainder attribution is kept unchanged as `legacy`.
- Property test: random damages and permutations give identical fractional shares.
- Every S3.1 run checks the precision contract: 152 of 152 cells pass (§10).

## 4. Owner resolutions (owner §5)
- **`planning/S3_OWNER_RESOLUTIONS.md` v1.0** records the owner's decisions on S3-R01 … R28: accepted, accepted with refinements, or candidate. R16–R17 are subject to S3.1-R01; R18 is corrected by S3.1-R03.
- **`planning/S3_1_RESOLUTIONS.md` v1.0** records the new S3.1 rules, R01–R12, each with its source and alternatives: crafting eligibility, recipe validation, fractional attribution, the four first-craft milestones, capacity and utilisation, excess gathering, shortage types, equipment value and payback.
- **No coefficient is promoted.**

## 5. Regression controls (S3.1-E01) and why these
**What was re-run.**
- **The S3 manifests whose strategies craft:** S3-E04, E07, E08, E09, E10 and E12. The corrected crafter rule can change them.
- **Three cheap controls that never craft:** S3-E02, E03 and E05. They must be identical.
- These were re-run with the final corrected code into `results/s3.1/audit/`. The stored S3 results were never overwritten.

**Not re-run:** S3-E11 and its widened matrix (no crafting and no equipment changes; 22,400 runs), as registered.

**S2.1 control.** Every S1.1, S2 and S2.1 experiment was re-run with the final code against the same baselines as S3 (§10). This is because S3.1 touched shared code (`legionContent.ts` StatMods, `industry.ts`).

| S3 experiment | Cells | Identical | Changed | Largest change |
|---|---|---|---|---|
| S3-E02, E03, E05 (no crafting) | 44 | **44** (fingerprints identical) | 0 | — |
| S3-E04, E07, E08, E09, E10, E12 | 75 | 16 | 59 | legion EXP mean ≤ 0.018%; hero EXP ≤ 0.074% (p50); first useful craft for POL3-EQUIP 2.39 → 2.56 min |

**No S3 hypothesis outcome changed:** 185 of 185 per-cell outcomes are the same.

**Attribution check** (`repro/s3.1/attribution_check.py`, output `attribution-check.txt`).
- **Method.** The S3 crafter rule was restored temporarily in the corrected tree: the eligibility check blocks only a crafter in an encounter, and the menu lists everyone with the level. The six changed manifests were then re-run, and the files restored and re-hashed.
- **Result.** **All 75 cells are identical to the stored S3 results**: event-log digests and every metric except the monitor's own counts. So every S3.1 change to the S3 results is caused by S3.1-R01 alone. The other corrections change nothing in the S3 campaigns: recipe validation, input summing, fractional attribution, the new item fields and the new monitor checks.
- **What S3 actually did.** With I20 left on, it counted **7,232 S3 crafts by characters S3.1 refuses**, about one per run. The examples shown were all assigned smiths crafting with a production unit in progress.

## 6. Experiments (pre-registered: `manifests/s3.1/`, plan SHA-256 `4a49373c…8915`, registered 2026-11-14T14:10:07Z)
**Disclosure before registration** (PREREGISTRATION.md):
- the reviewer reproductions;
- one 60-minute POL3-DEMAND development run;
- an engineering smoke run.

**The four kinds of change are kept separate** (PREREGISTRATION.md §1): engineering corrections, measurement corrections, policy improvements and candidate content.

**Order of running:** E01, E07, E03, E02, E04, E05, E08 and E06, then amendment 01 (E09 and E10, §6.6).

Full tables: `analysis.txt` (machine-readable: `analysis.json`).

### 6.1 S3.1-E07: recycle loops with timed production
A depth-4 search over craft, enhance, salvage and the timed plank and bar conversions was run from four stocks, including a raw-materials-only stock, on the control and every candidate variant. Every quantity was converted to raw-material equivalents.

**Result:** 0 raw breaks and 0 content breaks in all 8 runs, with 12,556–18,066 states each.

### 6.2 S3.1-E02: policies, capacity and first craft (original content; 100 replicates)
**Legion combat EXP against POL3-CONQ (pure combat).** Means; hero EXP in brackets.

| Strategy | PR-NEW (45 min) | PR-BAL (60 min) | PR-OPT (90 min) | Items crafted |
|---|---|---|---|---|
| POL3-COMBAT | −65.2% (−33.6%) | −65.0% (−32.3%) | −64.5% (−30.4%) | 7 |
| POL3-EQUIP | −80.7% (−55.8%) | −77.3% (−50.9%) | −72.7% (−43.1%) | 11 |
| POL3-PROF | −91.1% (−65.2%) | −90.8% (−63.6%) | −90.1% (−60.8%) | 10 |
| POL3-BAL | −67.0% (−34.9%) | −66.1% (−32.9%) | −65.2% (−30.8%) | 8 |
| POL3-EARLY | −89.2% (−78.5%) | −89.7% (−79.5%) | −90.1% (−80.4%) | 5 |
| **POL3-DEMAND** | **−23.1% (−14.8%)** | **−17.6% (−10.4%)** | **−12.7% (−6.5%)** | **48.7** |

**Capacity against demand (owner §7; PR-BAL, means; definitions R08–R10).**

| Strategy | Gathering min | Gathering utilisation | Gathered | Consumed (raw) | Excess | Reassignable min | Smith utilisation | Smith idle, input shortage | Smith idle, no demand |
|---|---|---|---|---|---|---|---|---|---|
| POL3-COMBAT | 50.8 | 86% | 2,066 | 42 | 2,024 | 48.8 | 2.7% | 0.6 min | 48.8 min |
| POL3-EQUIP | 53.0 | 87% | 2,223 | 90 | 2,133 | 50.8 | 4.1% | 4.1 | 51.4 |
| POL3-PROF | 104.2 | 86% | 5,027 | 60 | 4,967 | 101.0 | 2.2% | 7.9 | 44.8 |
| POL3-BAL | 49.5 | 87% | 2,338 | 58 | 2,280 | 46.7 | 2.6% | 7.0 | 46.7 |
| POL3-EARLY | 0 | — | 28 | 28 | 0 | 0 | 0.4% | **54.3** | 0.3 |
| POL3-DEMAND | 17.8 | 87% | 599 | 245 | 353 | 8.2 | **46.7%** | 7.0 | 0.7 |

**Reading the capacity table:**
- **Fixed roles are not starved of capacity.** Their gatherers work 86–87% of their assigned time, but 97–99% of what they gather is never used. Their smiths sit idle for want of demand (no open job) for 45–51 of about 55 assigned minutes.
- **POL3-EARLY is the opposite case:** a true input shortage (54 minutes waiting for inputs).
- **POL3-DEMAND keeps its smith busy 11–21 times as much of the time** (47% against 2–4%), and gathers 12–29% as much.
- **This supports the owner's instruction not to cut yields 70–120×.** The S3 oversupply came from missing demand, not from yield.

**No-affinity control (PR-BAL).** Without class affinity:
- POL3-DEMAND earns **+2.2%** more legion EXP (147,454 against 144,219) and gathers 314 units instead of 599;
- POL3-BAL changes by −0.0%.

So the affinity bonuses give no measurable benefit with either policy.

**First-craft milestones** (p50, active minutes; identical at the three profiles; definitions R04–R07).

| Strategy | First craft (R04) | First meaningful upgrade (R06) | First Copper combat item equipped (R07) |
|---|---|---|---|
| POL3-COMBAT | 9.5 | 9.5 | 11.0 |
| POL3-EQUIP | 2.6 | 2.6 | not reached |
| POL3-PROF | 6.3 | 6.5 | 15.0 |
| POL3-BAL | 10.8 | 10.8 | 12.2 |
| POL3-EARLY | 5.7 | 5.7 | not reached |
| POL3-DEMAND | 6.4 | 6.6 | 10.2 |

**H-S3.1-01 (first craft in [5, 10] min):** 13 pass and 7 miss across 20 crafting cells:
- POL3-EQUIP misses as too early (2.6 min);
- POL3-BAL misses as too late (10.8 min);
- POL3-DEMAND passes everywhere.

**H-S3.1-02 (meaningful upgrade in [15, 25] min):** **0 of 20.** Every meaningful upgrade comes earlier (2.6–10.8 min), because R06 counts a ≥ 10% gain in damage per second or hits survived, and the first weapon on an unarmed character always clears that bar. The candidate target and the R06 definition do not fit together. This is reported as a miss; nothing was moved (§11, decision 2).

### 6.3 S3.1-E03: equipment strength in an informative range (matched squads, 20 min, 100 replicates)
**Zone 3 (Archer hero level 7 and a level-7 Warrior)** is informative: Wood-full TTK p50 is 3.5 s, at least the registered 3 s.

| Gear | TTK p50 (s) | Kills/h | Effective DPS | Knockouts/h |
|---|---|---|---|---|
| none | 4.0 | 539 | 18.0 | 29.9 |
| Wood weapon / armour / full | 3.5 / 4.0 / 3.5 | 680 / 558 / 694 | 22.7 / 18.6 / 23.2 | 24 / 24 / 18 |
| Wood full +1 / +2 / +5 | 3.5 / 3.9 / 3.0 | 697 / 714 / 780 | 23.3 / 23.8 / 26.0 | 18 / 18 / 15 |
| Copper weapon / armour / full | 2.6 / 4.0 / 2.6 | 844 / 584 / 873 | 28.2 / 19.5 / 29.1 | 20.9 / 18.6 / 12 |
| Copper full +1 | 2.6 | 877 | 29.3 | 12 |

**H-S3.1-03 (Copper full cuts TTK by ≥ 25% against Wood full) passes for the control and every variant:**

| Variant | TTK cut | DPS gain |
|---|---|---|
| control | 25.7% | 25.7% |
| cu-off125 | 31.4% | 29.2% |
| cu-off150 | 31.4% | 36.1% |
| cu-offdef | 31.4% | 37.6% |
| wpn-pct | 25.7% | 26.9% |

**H-S3.1-04 holds.** One enhancement level leaves TTK p50 unchanged and adds +0.5% DPS, well under half the tier cut. +2 adds +2.9% and +5 adds +12.3%.

**Armour.** The Copper weapon carries almost all of the offensive gain. Armour lowers knockouts (29.9 per hour with no gear, 18.6 with Copper armour, 12 with the full Copper set).

**Zone 2 (level-3 hero and Warrior) is not informative.** Wood-full TTK p50 is 1.3 s, near the floor. Copper-full DPS gains there:

| Variant | DPS gain in zone 2 |
|---|---|
| control | +18.3% |
| cu-off150 | +25.7% |
| wpn-pct | +5.5% (low-level base attack is small) |

**What this changes about S3.** S3 found Copper was "not a big enough step" (a 13% TTK cut at zone 3, level 10). That was largely a time-to-kill floor effect. In a range where fights last several seconds, the control already meets the 25% candidate target.

### 6.4 S3.1-E04 and E10: candidate content in campaigns (PR-OPT, 90 min, 50 replicates; change in legion EXP against the same policy on the control)

| Variant | POL3-BAL | POL3-DEMAND (registered) | POL3-DEMAND2 (amendment 01) | Copper equipped first, DEMAND (min) | Excess gathered, DEMAND → DEMAND2 |
|---|---|---|---|---|---|
| control | 0 | 0 | 0 | 10.2 | 337 → 4 |
| cu-off150 | **+12.3%** | −1.4% | −3.3% | 14.6 | 6 → 3 |
| cu-offdef | +12.3% | −4.2% | −2.5% | 14.6 | 185 → 4 |
| wpn-pct | **+32.4%** | +2.3% | +1.1% | 10.3 | 205 → 3 |
| oldmat | +0.0% | −2.4% | −5.8% | 10.2 | 75 → 4 |
| yield050 (sensitivity) | — | −29.7% | **−6.0%** | 12.9 | 1,509 → 4 |
| smith075 (sensitivity) | — | −22.0% | **+0.6%** | 10.2 | 3,201 → 3 |
| cost150 (sensitivity) | — | −12.4% | −14.8% | 12.0 | 13 → 11 |

**What the content variants do:**
- **Stronger or percentage weapons help a fixed-role strategy.** POL3-BAL with `wpn-pct` gains +32%. A likely reason, not verified, is that its fighters stay below the kill-rate ceiling, where gear still matters.
- **They do not help a demand-aware strategy.** POL3-DEMAND probably reaches the zone-3 kill-rate ceiling (§6.5) early in the 90 minutes, where more damage changes nothing.
- **Stronger Copper delays the first Copper item for POL3-DEMAND,** from 10.2 to 14.6 min, so the policy's order of investment changed. This was not investigated further.
- **`oldmat` keeps earlier materials in use.** After Copper, 47 planks and 18 gel are consumed instead of 31 and 10. It costs 2.4–5.8% EXP.

**The registered sensitivity results for POL3-DEMAND were dominated by the stop-rule defect (§6.6).** With POL3-DEMAND2:
- half the gathering yield costs 6%, not 30%;
- 25% faster smithing changes nothing, instead of −22%;
- 50% dearer equipment costs about 15%.

Use E10 for the sensitivity conclusions.

**Gear lifetime and production** (POL3-DEMAND control): items stay equipped for 39.9 min on average; 48.8 items crafted, 23.8 of them Copper; smith utilisation 47%.

### 6.5 S3.1-E05 and E08: investment and payback (owner §10)
**Legion EXP against POL3-CONQ** (means; 100 replicates in E05, 50 in E08).

| Strategy | Start | 15 min | 30 min | 60 min | 90 min | 180 min |
|---|---|---|---|---|---|---|
| POL3-BAL | fresh / mid-game | −64.2% / −73.3% | −67.4% / −74.4% | −66.1% / −71.4% | −65.2% / −69.3% | — |
| POL3-PROF | fresh / mid-game | −88.8% / −91.8% | −91.2% / −93.0% | −90.8% / −92.4% | −90.1% / −91.7% | — |
| POL3-DEMAND | fresh / mid-game | −78.8% / −74.1% | −35.4% / −61.0% | −16.2% / −27.3% | −11.4% / −17.6% | −7.8% / −8.4% |

**Other measures at 90 min (fresh start).**

| Measure | POL3-DEMAND | POL3-CONQ |
|---|---|---|
| Gold earned | 18,132 | 19,337 |
| Items equipped | 25 | 0 |
| Equipment value (R11) | 0.57 | 0 |
| Materials held | 467 | 0 |
| Profession levels | 36.6 | 12 |

Every strategy has the same 3 zones open.

**H-S3.1-05 (payback, R12): none within the horizon.** This holds for legion EXP and hero EXP, from both starts, at 90 min (E05) and at 180 min (E08).

**Why payback cannot happen in this content.**
- From 30 min on, POL3-CONQ earns exactly 52,800 legion EXP (mean) every 15 minutes, while its characters rise from level 26 to 58.
- In the mid-game start, POL3-DEMAND earns the same 52,800 per 15 minutes once its industry stops, with 25 items equipped.
- Both outgrow zone 3, the last zone of the S3 slice, and kill as fast as encounters arrive (zone-3 TTK about 1 s for POL3-CONQ). At that ceiling neither equipment nor levels raise the kill rate.
- So the minutes spent on industry early on are never recovered. The gap only shrinks in relative terms as the total grows.

This is a property of the three-zone content horizon. It cannot be fixed by gear coefficients in S3.1 without breaking the "no Iron, no new zones" scope (§11, decision 1).

### 6.6 Amendment 01 (after the results): the POL3-DEMAND stop rule (S3.1-E09 and E10)
**What was found.** The registered E08 fresh-start results showed POL3-DEMAND still gathering after it had stopped crafting:
- materials held rose from 86 at 30 min to 1,175 at 165 min;
- profession levels kept rising;
- the late EXP rate was 4% below POL3-CONQ's.

**The cause.** When no candidate upgrade remains, version 1 computes no material need, so its stop rule never releases an assigned gatherer.

**What was done** (`manifests/s3.1/AMENDMENT-01.md`, registered 2026-11-14T14:45:26Z, before the follow-up ran):
- **POL3-DEMAND2** (version 1.1) corrects only that case. No constant changes.
- **POL3-DEMAND is unchanged.**
- **S3.1-E09** repeats E08 with POL3-DEMAND2 added; **S3.1-E10** repeats E04's POL3-DEMAND cells with POL3-DEMAND2 added. Both use the original seeds and cells.
- **Built-in check:** the shared cells reproduce E08 (4 of 4) and E04 (8 of 8) exactly.
- Test: `test/s3_1.policy.test.ts`. Planted bug X16 (§10).

| E09 (180 min) | Legion EXP vs CONQ at 180 min | Late rate (90–180 min) vs CONQ | Materials held at 30 / 90 / 165 min | Excess gathered | Reassignable gathering |
|---|---|---|---|---|---|
| POL3-DEMAND, fresh | −7.8% | −4.0% | 86 / 534 / 1,175 | 1,311 | 26.2 min |
| **POL3-DEMAND2, fresh** | **−4.0%** | **0.0%** | 3 / 3 / 3 | 3 | 0.1 min |
| POL3-DEMAND, mid-game | −8.4% | 0.0% | 11 / 11 / 11 | 11 | 0.3 min |
| POL3-DEMAND2, mid-game | −9.1% | 0.0% | 7 / 7 / 7 | 7 | 0.2 min |

**H-S3.1-05 for POL3-DEMAND2: none within the horizon** from either start.

**What the correction changes:**
- It removes the stockpile in every cell.
- It closes the fresh-start late-rate gap.
- It costs 0.7 points in the mid-game start. There the early return of a gatherer delays later upgrades, giving −64.9% against −60.3% at 30 min.

**The registered conclusions stand.** POL3-DEMAND2 is reported beside them as a follow-up.

### 6.7 S3.1-E06: hero power with a full squad (owner §11; 50 replicates)
**Matched setup.** Zone 3, the hero and three recruits (Warrior, Archer, Mage) all at level 10 in full Wood +0, fixed-zone policy, 20 min. Fractional effective shares of all damage are shown, with an equal share being 25%.

**Hero effective share, passive / attentive:**

| Hero | control | ×1.25 | ×1.5 | ×2.0 | combined C |
|---|---|---|---|---|---|
| Archer | 23.9% / 32.3% | 26.5% / 35.6% | 30.2% / 39.4% | 35.3% / 44.1% | 26.5% / 36.5% |
| Warrior | 14.4% / 19.1% | 17.2% / 22.2% | 19.2% / 24.7% | 22.8% / 28.7% | 17.2% / 26.8% |
| Mage | 16.7% / 25.2% | 19.9% / 28.5% | 22.8% / 31.6% | 29.8% / 37.8% | 19.9% / 30.2% |

**Hero effective damage per second against the control.**
- ×1.25: +10% to +23%.
- ×2.0: +40% to +94%.
- Combined C: equal to ×1.25 when passive, because its ability terms act only when abilities are used. Attentive, the Warrior gains +55%.

**Abilities.** The ability share of all damage when attentive: Archer 11.5%, Warrior 4.8%, Mage 9.8% (control).

**Raw against fractional effective shares.** They differ by at most 4.6 points (Mage hero ×2.0, passive: 25.2% raw against 29.8% effective). Hero overkill is 10–39%.

**Campaigns: POL3-CONQ with three deployed (PR-BAL, 60 min).**

| Variant | Hero EXP against the control | Level 10 p50 |
|---|---|---|
| control | — | 7.4 min |
| ×1.25 | +2.1% | 6.8 min |
| ×1.5 | +3.7% | 6.5 min |
| ×2.0 | +6.5% | 5.8 min |

Attentive play adds 0.7–2.2% hero EXP across the variants. **No variant is applied to the historical control.**

## 7. Hypotheses
| ID | Role | Outcome |
|---|---|---|
| H-S3.1-01 first craft in [5, 10] min | candidate target | **13 pass / 7 miss** (POL3-EQUIP early; POL3-BAL late) |
| H-S3.1-02 meaningful upgrade in [15, 25] min | candidate target | **0 / 20, miss** (all earlier) |
| H-S3.1-03 Copper full cuts TTK ≥ 25% (informative range) | diagnostic candidate | **pass** at zone 3 for the control and all four variants; zone 2 **not informative** |
| H-S3.1-04 one enhancement level cuts less than half the tier cut | reported | **holds** |
| H-S3.1-05 payback | reported | **none within the horizon** (both starts, 90 and 180 min; POL3-DEMAND2 too) |
| H-S3.1-06 monitor 0 violations; fractional precision | engineering | **pass**: 0 violations in 11,250 S3.1 runs (1.51 billion checks); 152 / 152 cells within precision |

## 8. Candidate findings, reported by kind (owner §14)
- **Engineering:**
  - Blockers A and B are closed.
  - The S3 campaigns contained about one ineligible craft per run, always a smith mid-unit in the examples. Fixing it changed no S3 conclusion.
- **Measurement:**
  - The fractional attribution differs from raw shares by at most a few points.
  - Capacity was never the S3 bottleneck; demand was.
  - The S3 Copper weakness was largely a time-to-kill floor.
- **Policy:**
  - Demand-driven production removes most of the industry cost: legion EXP −12.7% to −23.1% against −65% to −91% for fixed roles.
  - Version 1 had a stop-rule defect; version 1.1 fixes it.
  - Class affinity adds nothing measurable.
- **Content (candidates only):**
  - The control Copper step already meets 25% in the informative range.
  - Percentage weapons keep gear relevant for low-level, fixed-role play.
  - Earlier-material recipes keep planks and gel in use at a small cost.
  - No content change can show payback while the slice ends at zone 3.

**Missed hypotheses:** H-S3.1-01 (7 cells), H-S3.1-02 (all), H-S3.1-05 (all). H-S3.1-03 is not informative in zone 2.

## 9. L2 (owner §13)
`planning/L2_DESIGN_UPDATE.md` v1.1 §4 distinguishes:
- a **monotone producer ID** (one high-water mark per producer);
- **settled ranges with gaps** (needed once out-of-order or partial settlement exists).

It lists what the replay contract must specify later. **No L2 code was written.**

## 10. Engineering checks
| Check | Result | File |
|---|---|---|
| Type check | pass | typecheck.txt |
| Default tests | **1,116 passed** (36 files) | test-output.txt |
| Statistical tests | **9 passed** | test-stats-output.txt |
| Fixture conformance | **422 cases, 0 problems**; new family recipe-validation (13), industry-rules fixture version 2 (26) | fixtures-check.txt |
| Python oracle | **18 groups, 0 failing**; S3 and S3.1 families 66 cases, 0 mismatches | oracle-check.txt |
| Schemas | 3 in sync | schemas-check.txt |
| Fixture generators | `repro/s3/make_fixtures.py` restored byte-identical to S3 and reproduces the S3 fixtures; `repro/s3.1/make_fixtures.py` reproduces this tree's four files | fixture-generation-check.txt |
| Reviewer reproductions | all reproduce on the S3 package and are refused or corrected here (§2) | repro/ |
| Planted bugs, S3.1 (X1–X16) | **16 / 16 detected**, every file restored and re-hashed | mutation-check-s3.1.txt |
| Planted bugs, S3 re-run on the corrected code | **21 / 21 detected**. W17 was left out: it planted a bug in the S3 per-line recoverable check, which S3.1 replaced; the same bug is planted in the new code as X9 | mutation-check-s3-rerun.txt |
| `exp3 --verify`, final code | **8 / 8 S3.1 experiments MATCH** (E02–E06, E08 and the amendment's E09, E10) | gates-run.txt |
| Determinism (S3.1-E02) | re-run identical, fingerprint identical; second seed root differs in 2,300 / 2,300 runs; KS rejections 0 / 276 | gates-run.txt |
| Reference ledger (S3.1-E05) | fingerprint identical to the persistent ledger (`d66c8253…71ffc`) | gates-run.txt, reference-ledger/ |
| Regression controls (S3.1-E01) | 9 S3 manifests; 44 / 44 cells of the non-crafting controls identical; 59 of 75 crafting cells changed, all explained; 185 / 185 S3 hypothesis outcomes unchanged | analysis.txt, experiments/audit/ |
| Attribution | 75 / 75 cells identical with the S3 crafter rule restored; 7,232 S3 crafts by characters S3.1 refuses | attribution-check.txt |
| Historical regression, final code | **19 / 19 MATCH** (S1.1 7; S2 10 against the S2.1 audit baseline; S2.1-E02 against its v1.3 re-run; S2.1-E03) | historical-regression.txt |
| Invariant monitor (I1–I21) | 0 violations in 11,250 S3.1 runs (1.51 billion checks) | analysis.txt |
| Recycle search (S3.1-E07) | 0 breaks in 8 runs | S3.1-E07-recycle-*.json |
| Amendment 01 built-in check | E09 reproduces E08 4 / 4; E10 reproduces E04 8 / 8 | analysis.txt |
| Registration | 24 / 24 registered files unchanged (S3.1: plan, 6 manifests, 2 amendment manifests and their document; S3: 13) | registration-check.txt |
| Preservation | 0 of 658 S3-package artefacts changed: S3 manifests, all content, evidence/s3, earlier evidence and manifests, S3 planning, repro/s3 and the unchanged fixture families. results/s3 matches the S3 package copies (22 files) | preservation-check.txt |
| Frozen simulator, archive, old workspace | identical to M0 / to the S3 check | frozen-check.txt |
| Git | HEAD `732f3da` (s2-checkpoint); S3 and S3.1 uncommitted; nothing pushed | git-status.txt |

**Files in evidence/s3.1/:**
- S3_1_EVIDENCE.md (this file).
- analysis.txt and analysis.json.
- experiments/: every S3.1 result, including the amendment's E09 and E10, and audit/ (the S3 regression re-runs). Each has semantic.json, fingerprint.txt, environment.json, report.md, quantiles.csv and sample event logs.
- reference-ledger/.
- repro/: the reviewer reproductions, before and after.
- attribution-check.txt and historical-regression.txt.
- Run logs: runs.txt, amendment-01-runs.txt and gates-run.txt.
- S3.1-E07-recycle-*.json.
- mutation-check-s3.1.txt and mutation-check-s3-rerun.txt.
- Suite outputs: test-output.txt, test-stats-output.txt, typecheck.txt, fixtures-check.txt, fixture-generation-check.txt, schemas-check.txt, oracle-check.txt and tool-versions.txt.
- State checks: registration-check.txt, preservation-check.txt, frozen-check.txt and git-status.txt.
- s3.1-vs-s2-checkpoint.patch: the complete S3 + S3.1 change against the S2 checkpoint, evidence excluded, local paths redacted.
- s3.1-vs-s3-package.txt: every file added or changed since the S3 review package (26 added, 26 changed, 0 removed).

## 11. Decisions for the owner
1. **Content horizon for payback.** In the S3 slice every strategy reaches the zone-3 kill-rate ceiling within about 30–45 minutes. After that, equipment cannot pay back, whatever its coefficients.
   - Should the payback question wait for content where enemies keep pace (later zones or tiers), or should a matched under-levelled diagnostic be registered next?
   - Mandatory equipment gates were **not** used and are not recommended.
2. **The meaningful-upgrade target.** H-S3.1-02 measures the first ≥ 10% gain, which the first weapon always provides. Options:
   - keep the definition and move the band earlier;
   - redefine it as the first upgrade over a crafted item;
   - give characters a starting weapon.
3. **POL3-DEMAND2 as the industrial reference policy** for the next increment's registration, with POL3-DEMAND and the six S3 strategies kept as historical controls.
4. **Copper.** In the informative range, the control step (−25.7% TTK) already meets the candidate target. Should the offence variants stay candidates only?
5. **Percentage weapons (`wpn-pct`).** They helped the fixed-role strategy greatly (+32%) and the demand policy little (+1–2%). Should they be studied further as a way to keep gear relevant against level growth?
6. **Hero power.** Base attack ×1.25 gives a modest +2% hero EXP with a full squad. ×1.5–×2.0 raises the passive share to 19–35%. Which band fits "a modest hero advantage with meaningful manual abilities"?

## 12. Limitations
- **R09 deviation.** Excess gathering is measured for every policy as "gathered and never consumed", the fixed-role form of R09. The plan-based form for POL3-DEMAND (gathering beyond the plan when the role was chosen) was not implemented. The numbers are comparable across policies, but the measure is not R09's exact text for POL3-DEMAND.
- **Post-results policy.** POL3-DEMAND2 was designed after seeing the results. Its results are a registered follow-up, not a pre-registered test.
- **Content ceiling.** Payback, gear lifetime and equipment value after about 45 minutes are dominated by the zone-3 kill-rate ceiling.
- **Coarse TTK.** TTK p50 has coarse steps near a few seconds (for example, +1 enhancement leaves it unchanged), so DPS is reported beside it.
- **Narrow matched setups.** The E03 and E06 matched setups each cover one zone and level pair (E03 zone 2 is not informative). The hero-power campaigns use POL3-CONQ only.
- **Same profile timeline.** First-craft milestones are identical across PR-NEW, PR-BAL and PR-OPT because they are measured in active minutes and the early policy decisions do not depend on the profile.
- **Not independent.** One platform, one machine, one author for the code and the oracle (§1).
- **Not covered.** Hero gathering is not used by POL3-DEMAND. ORC3-SEARCH was not extended.

## 13. Package
- **Archive:** `Documents/Legion-Reviews/legion-S3.1-review-2026-11-14.zip` (folder `legion-incremental-S3.1-review/`).
- **What it holds:** the canonical repository working tree, with `MANIFEST.txt` giving the SHA-256 and size of every file.
- **Excluded:** `.git/`, `node_modules/` and `legion-progression-lab/results/`. Copies of the results are in `evidence/s3.1/experiments/` and `evidence/s3/experiments/`.
- **Archive check:** the archive was verified from a fresh extraction. Every file was checked against MANIFEST.txt, then an offline install, the suites and oracle, selected `--verify` runs, the defect reproductions, the timed recycle search and the analysis were run there. The results and the archive's SHA-256 are in `legion-S3.1-review-2026-11-14.verification.txt` beside the archive.
- **Not done:** nothing is committed or pushed, S4 is not started, and no workspace was deleted.
