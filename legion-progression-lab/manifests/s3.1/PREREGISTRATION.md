# S3.1 pre-registration

**Version 1.0, 2026-11-14.** Registered before any S3.1 balance comparison ran (manifests/s3.1/preregistration.json holds the SHA-256 of this document and of every manifest). Owner: "Independent S3 Review and S3.1 Authorisation" §6–§14.

**Labels.** Every input number is a `candidate`; every output a `model-output`. The original S3 content (content/w1-slice-s3.candidate.v0.3.0.json, unchanged), manifests, results and fingerprints are the frozen comparison control. **No target moves after results; the S3 hypotheses keep their S3 outcomes.**

**Disclosure.** Before registration: the reviewer's findings were reproduced (repro/s3.1/defects.mjs); POL3-DEMAND was checked in one 60-minute development run (seed `probe31#rep-0`); an engineering smoke run (one replicate per cell, seed `smoke31#rep-0`, checking only that each cell runs and the monitor reports nothing) was run. No constant or target was set from them.

## 1. The four kinds of change (owner §14)
| Kind | What | Where |
|---|---|---|
| Engineering corrections | crafting eligibility (S3.1-R01); aggregate recipe validation and number domain (R02); monitor I20, I21 | engine, content compiler, monitor; tests, fixtures |
| Measurement corrections | fractional effective-damage attribution (R03; the integer one kept as legacy); capacity, utilisation, demand, stockpile, excess and shortage measures (R08–R10); first-craft milestones (R04–R07); equipment value (R11); payback (R12); progress snapshots | src/experiments/s31Metrics.ts, industryMetrics.ts; added to S3.1 manifests only |
| Policy improvements | POL3-DEMAND (planning/S3_1_POLICY.md); the six S3 strategies unchanged as controls (their crafter choice now follows the corrected eligibility, which is the correction itself) | src/policy/industryDemand.ts |
| Candidate content variants | §4 below, each a named variant on the frozen S3 content; never a new baseline | src/experiments/s3Patch.ts |

## 2. Regression controls (S3.1-E01; not a new manifest)
The corrected engine refuses crafts by ineligible characters, and the menu offers only eligible crafters, so the S3 campaigns whose strategies craft can change. Re-run into results/s3.1/audit/ (the stored S3 results are never overwritten): **S3-E04, E07, E08, E09, E10, E12** (they craft) and **S3-E02, E03, E05** (cheap controls that never craft: expected identical). **Not re-run:** S3-E11 and its widened matrix (no crafting, no equipment changes; 22,400 runs). Each re-run cell is classified as identical, or changed, and every change explained.

## 3. Experiments
| ID | Question | Design |
|---|---|---|
| S3.1-E02 | Fixed-role strategies against POL3-DEMAND on the original content: capacity, utilisation, realised demand, stockpiles, excess, shortage types, progression; first-craft milestones; no-affinity control | campaigns PR-NEW, PR-BAL, PR-OPT × the six S3 strategies and POL3-DEMAND; POL3-DEMAND and POL3-BAL also without affinity at PR-BAL; 100 replicates |
| S3.1-E03 | Equipment strength in an informative combat range | matched squads (zone 2: classless hero level 3 + level-3 Warrior; zone 3: Archer hero level 7 + level-7 Warrior), the realistic fixed-zone policy, 20 min; gear none / Wood weapon / Wood armour / Wood full / Wood full +1, +2, +5 / Copper weapon / Copper armour / Copper full / Copper full +1; candidate variants on the Copper (and percentage-weapon) configurations; 100 replicates |
| S3.1-E04 | Candidate content in campaigns: gear lifetime, earlier-material use, production | PR-OPT campaigns of POL3-DEMAND and POL3-BAL with each content variant; POL3-DEMAND also with moderate yield, smith-speed and cost sensitivity variants; 50 replicates |
| S3.1-E05 | Investment matrix (owner §10) | POL3-CONQ, POL3-BAL, POL3-PROF, POL3-DEMAND; fresh account PR-OPT (90 min) and the S3 matched mid-game start (hero level 8 in zone 2, zones 1–2 visited, two level-5 recruits, 600 gold; 90 min), snapshots at 15, 30 and 60 min, 100 replicates |
| S3.1-E08 | Long-horizon payback (owner §10; diagnostic) | POL3-CONQ and POL3-DEMAND for 180 min from both starts, snapshots every 15 min, 50 replicates (POL3-DEMAND returns its industrial recruits to combat once no useful upgrade remains) |
| S3.1-E06 | Hero power with a full squad (owner §11) | matched: zone 3, hero level 10 (Archer, Warrior or Mage) with three level-10 recruits (Warrior, Archer, Mage), everyone in full Wood +0, fixed-zone policy, passive and attentive, variants control, base ×1.25 / ×1.5 / ×2.0, combined C; 50 replicates. Campaigns: POL3-CONQ (three deployed) at PR-BAL, passive and attentive, the same variants, 50 replicates |
| S3.1-E07 | Recycle loops including timed production and every candidate variant | `node src/cli/s3-recycle.ts --depth 4 --with-timed [--params …]` on the control and each variant of §4 |

## 4. Candidate variants (on the frozen S3 content)
| Variant | Parameters | Meaning |
|---|---|---|
| `cu-off125` | `s3.copperOffenceScale` 1.25 | Copper weapons' attack and the ring's crit +25% |
| `cu-off150` | `s3.copperOffenceScale` 1.5 | the same, +50% |
| `cu-offdef` | `s3.copperOffenceScale` 1.5, `s3.copperDefenceScale` 1.5 | stronger Copper offence with Copper armour defence and HP +50% |
| `wpn-pct` | `s3.weaponPercent` on | weapons add a percentage of the level base attack (N milli becomes N bp), so gear keeps its value as levels rise |
| `oldmat` | `s3.oldMaterialRecipes` on | selected Copper recipes use earlier materials: weapons +1 plank, chestplate +2, leggings +1, ring +2 slime gel |
| `yield050` | `s3.nodeYieldScale` 0.5 | half the gathering yield (sensitivity) |
| `smith075` | `s3.unitTimeScale` 0.75 | timed units 25% faster (sensitivity) |
| `cost150` | `s3.equipCostScale` 1.5 | equipment recipes 50% dearer (sensitivity) |

## 5. Hypotheses and registered rules
| ID | Role | Statement | Where |
|---|---|---|---|
| H-S3.1-01 | candidate target | first simple crafted item (R04) p50 in [5, 10] active min, per crafting cell | S3.1-E02 |
| H-S3.1-02 | candidate target | first meaningful combat upgrade (R06) p50 in [15, 25] active min, per crafting cell | S3.1-E02 |
| H-S3.1-03 | diagnostic candidate (derived) | in the informative range, 1 − TTK(Copper full)/TTK(Wood full) ≥ 25%, per squad and variant; **informative** only if TTK(Wood full) p50 ≥ 3 s, else reported as not informative | S3.1-E03 |
| H-S3.1-04 | reported (derived) | one enhancement level cuts less than half the tier cut | S3.1-E03 |
| H-S3.1-05 | reported (derived) | payback (R12): the first snapshot at which POL3-DEMAND's mean legion EXP (and hero EXP) reaches POL3-CONQ's; "none within the horizon" if never | S3.1-E05, S3.1-E08 |
| H-S3.1-06 | engineering | monitor violations = 0 in every manifest; fractional attribution within precision in every run | all |

**Reported comparisons (no target):** S3.1-E02 every strategy against POL3-CONQ (progression) and against the fixed-role strategies (capacity, utilisation, excess); S3.1-E03 each configuration against Wood full and each variant against the control; S3.1-E04 each variant against the control per policy; S3.1-E05 every strategy against POL3-CONQ at each snapshot; S3.1-E06 raw against effective (fractional) hero share, each variant against the control, per class and mode.

**Engineering gates:** `--verify` matches every fingerprint; S3.1-E02 passes a determinism re-run with a second seed root (`s3.1-e02-second`); S3.1-E05 gives the same fingerprint with the reference ledger.

**Order of running:** E01 (regression controls), E07 (recycle), E03 (equipment), E02 (policies, capacity, first craft), E04 (candidate content), E05 and E08 (investment, payback), E06 (hero power).
