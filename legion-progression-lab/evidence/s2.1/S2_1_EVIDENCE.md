# S2.1 evidence — focused acceptance pass after the independent L1/S2 review

**Increment:** S2.1, authorised by the owner's "Independent L1/S2 Review and S2.1 Authorisation" (L1 and S2 conditionally accepted).

**Date:** 2026-11-13.

**Status:**
- **Uncommitted.** L1, S2 and S2.1 await the focused acceptance review.
- **Not pushed.** The GitHub remote is public.
- **S3 not started**; old workspaces not deleted.

**Labels:**
- No content, coefficient, target or policy parameter changed in S2.1.
- Every result is model output from candidate inputs. Nothing is live-validated or approved.

**Engineering gates:** **All engineering gates pass.** (926 default tests, 9 statistical tests, 356 fixture cases, 17 oracle groups; planted bugs S2.1 13/13, S2 20/20, L1 12/12; 12 / 12 experiments MATCH.)

---

## 1. Independent verification recorded (not overstated)
As stated by the owner (review §1):
- **The reviewer independently verified:**
  - the S2 ZIP hash and all 577 files;
  - all 11 registered S2 plan and manifest hashes;
  - the Python oracles: 16 groups, 0 failures, with eight content cases hand-only and the preview check skipped;
  - all 200 base and 1,800 sweep EXP thresholds;
  - the S2 scope;
  - an extra 20,000-operation reference-versus-persistent ledger differential (4 seeds, 200 comparisons, 0 mismatches);
  - all 100 replicates of S2-E05 cell 0, whose semantic cell matched exactly (fingerprint `7af8444e…499c`). This ran on Linux with Node 22.16.0, with schema-only dependencies bypassed and the engine, metrics and policy code unchanged.
- **Not independently executed:** the complete Vitest suite and the full million-operation differential.
- **Everything below** was run on this machine (Windows, Node 24.22.3). It is not independently verified.
- **On the monitor counts:** the invariant-monitor check counts are repeated evaluations of the same invariants across model runs. They are not independently designed test scenarios.

## 2. The three defects, reproduced before and after (`repro/s2.1/defects.mjs`)
- The same script was run on the original S2 package (extracted from the S2 ZIP, `500f830b…d4675`, verified against its manifest) and on this tree.
- Complete outputs: `repro/original-S2-package.json.txt` and `repro/corrected-S2.1.json.txt`.

| Defect | Scenario (the reviewer's) | Original S2 | Corrected S2.1 |
|---|---|---|---|
| §2 Worker access | Hero in zone 1, `unlockAllZones`, level-10 Warrior recruit idle; assign to zone 2 at the session start; 60 s | Zone 2 accessible, **not visited**; assignment **accepted**; **15 worker kills** (the reviewer saw 14 with another seed) | Assignment **refused** (`ZONE_NOT_VISITED`); 0 worker kills; the recruit stays idle |
| §3 Ledger reconstruction | Credit M, debit M, credit M (txIds a, z, b), M = 2^53 − 1; reconstruct the serialization | Chronological balance M; reconstruction **refused with NUMERIC_LIMIT** | Reconstruction **accepted**; balance M; content identical |
| §4 Worker estimator | Level-1 Mage worker in zone 1; certain hits, no crits; enemy HP 25, attack 1,000,000 milli, first attack 1 ms, interval 1,000 ms | Estimate 0 kills/h, win chance 0, **"unreachable", DIES_BEFORE_KILL**; the worker's swing (8) and Fireball (30) at 1,500 ms kill the enemy; 1 kill and 1 knockout in 30 s | Estimate **"unresolved"** (ABILITY_DEPENDENT, BASIC_ATTACKS_DIE_BEFORE_KILL, ABILITY_NOT_MODELLED); the same kill and knockout |

## 3. The corrections
### 3.1 Worker assignment access (D-01; S2-R17 as approved)
- **Command:** `Assign … worker` needs a zone that is accessible AND visited by the hero (`ZONE_NOT_ACCESSIBLE`, then `ZONE_NOT_VISITED`).
- **Hero only:**
  - workers never visit zones or discover checkpoints;
  - worker kills still count for kill gates, and a completed gate grants access only.
- **Observation and policies:**
  - the observation shows worker estimates for every accessible zone as previews, with `workerZoneAvailability` marking unvisited zones unavailable;
  - realistic policies (and so ORC2-SEARCH, which runs them) consider available zones only, and never send a worker to an "unresolved" zone.
- **Diagnostics:** explicit `visitedZones` may mark zones visited (each must be accessible). A diagnostic worker in a zone that is not accessible and visited is refused at construction (`INVALID_STATE`).
- **Engine:** refuses to start a worker fight in such a zone even if the state were corrupted.
- **Monitor:** a new check, I9, verifies every worker assignment and fight at every assignment, fight start, encounter start and credit.
- **Reserve swaps (S2-R18 as approved):** moving a character into or out of the reserve is refused while it is in an encounter (`CHARACTER_BUSY`).
- **Tests:** `test/s2_1.worker-access.test.ts`, 12 tests:
  1. accessible but unvisited;
  2. visited;
  3. a worker completing a gate while the hero is elsewhere (access only, no visit, no checkpoint, assignment there refused);
  4. before and after the first hero visit;
  5. diagnostic initialisation and four invalid diagnostic states;
  6. travel and session boundaries;
  7. policies use available zones only, with previews marked;
  8. random command sequences (6 seeds) never construct an invalid assignment;
  9. the monitor detects one if constructed;
  10. the engine guard;
  11. the reserve rule, for squad members and workers (2 tests).

### 3.2 Ledger reconstruction (`spec/formulas/ledger.md` v1.2)
- **The fix:** conservation is summed exactly with BigInt, so the summing order cannot matter.
  - Each delta and each balance must still be a safe integer.
  - Invalid input is `INVALID_STATE`; `NUMERIC_LIMIT` remains only the live `applyTx` refusal.
- **Unchanged:** `applyTx`, the AVL trees, serialization, replay receipts and conflict detection.
- **Documented:**
  - reconstruction establishes structure and conservation, **not authenticity** (a forged self-consistent history is accepted);
  - Luau has no BigInt, so a game reconstruction needs a multi-limb accumulator, separate positive and negative sums, or chronological replay, tested against the same fixtures.
- **Tests:** `test/ledger.reconstruction.test.ts` (8): the reproduction, every txId order, large turnover on independent resources and reserved buckets, replay and conflict after reconstruction, branched histories, six corruptions refused for the right reason, a forged history accepted (documented), and a randomised property test with near-limit turnover.
- **Extended differential:** 1,000,000 operations over 50 seeds with near-limit turnover (3,320 accepted near-limit transactions in 10 sampled seeds; in all 10 of their final ledgers the canonical-order partial sums leave the safe range, the condition that S2 refused), 2000 content comparisons and 4000 serialize-and-reconstruct round trips: **0 mismatches** (`ledger-differential.txt`).

### 3.3 Worker estimator (`spec/formulas/s2-legion.md` v1.1 §6; `src/engine/workerFeasibility.ts`)
- **Feasibility bound:** an ability-aware structural bound (every swing and cast assumed to land at maximum, from full HP, until the worker would be knocked out) decides impossibility.
- **Classification of a classed worker's estimate:**
  - basic attacks win: the estimate is kept as conservative (abilities only add damage) and labelled;
  - bound below HP: "unreachable", proven (ABILITY_INCLUDED_IN_BOUND);
  - otherwise: **"unresolved"** (ABILITY_DEPENDENT); production is not estimated and never claimed impossible.
- **Labelling:** ability omission is labelled at every reliability, not only "reliable".
- **Practical recommendations:** policies do not recommend "unresolved" zones. The ability is ready at the first fight after each recovery and then on cooldown, so such zones yield about one kill per knockout cycle; continuous-farming rates and realistic stops stay separate (the "unsafe" label still flags expected stops).
- **Not built:** a full exact ability-aware estimator (bounded, as the owner allowed).
- **Tests:** `test/s2_1.worker-estimator.test.ts`, the four owner cases:
  1. an ability makes an impossible fight winnable;
  2. an ability is unavailable because of its cooldown, so the second fight is lost, and a fight needing two casts is proven impossible;
  3. an ability cannot overcome lethal retaliation (0 kills);
  4. an ability changes efficiency, not reachability (the estimate is conservative: realised kills exceed it).

  Plus labelling consistency for every class, level and zone, classless workers equal to v1.2, and policies avoiding unresolved and unreachable zones.

### 3.4 Numerical domain (owner §8)
- The S2 content compiler now checks every class-stat and ability intermediate at the maximum level, with every talent at its cap: the max-HP numerator, the defence product, the attack value and the ability numerator.
- Content that would leave the safe-integer range is refused (`INVALID_CONTENT`). The candidate pack passes. Tests cover both.

## 4. Engineering gates (pre-registration §4)
| Gate | Check | Result | Detail |
|---|---|---|---|
| 1 | Type check | **pass** | strict |
| 1 | Default tests | **926 / 926 pass** | includes 27 new S2.1 tests (worker access 12, estimator 7, reconstruction 8) |
| 1 | Statistical tests | **9 / 9 pass** | unchanged suite |
| 1 | Fixtures | **356 cases, 0 problems** | 16 new: worker-feasibility 8, ledger-reconstruction 8; existing fixtures unchanged |
| 1 | Independent oracles | **17 groups, 0 failing** | new group: S2.1 families |
| 1 | Schemas | **3 / 3 in sync** | fixture schema gains two family names |
| 2 | Defect reproductions | **wrong before, correct after** | all three reviewer cases, on the original S2 package and on S2.1 |
| 3 | Ledger differential, near-limit turnover + reconstruction | **0 mismatches** | 1,000,000 operations, 2000 comparisons, 4000 reconstructions |
| 4 | C0 control A0 | **PASS** | S2-E00 identical in the audit; B0 re-passes |
| 4 | C1 invariants I1-I9 | **PASS** | 20,050 runs, 919,230,389 repeated checks, 0 violations |
| 4 | H-S2.1-01 | **PASS** | 0 unreachable cells in S2.1-E02 (vacuous there; exercised by tests and fixtures) |
| 5 | Mutation checks | **S2.1 13/13; S2 20/20; L1 12/12** | every file restored: True, True, True |
| 6 | Determinism | **pass** | re-run identical true, fingerprint true, second seed differs in 3600/3600, KS rejections 0/216 (S2.1-E02) |
| 7 | exp2 --verify | **12 / 12 MATCH** | S2.1-E02, S2.1-E03 and the 10 audit experiments |
| 7 | Reference-ledger cross-check | **2 / 2 MATCH** | cell 0 of each new S2.1 experiment |
| 8 | Frozen simulator, archive, old workspaces | **unchanged** | M0 fingerprint |

## 5. Pre-registration
- **The plan:** `manifests/s2.1/PREREGISTRATION.md` was hashed (`0bb0748d…2471`) before any corrected comparison ran (`plan-registration.txt`).
- **The manifests:** both new manifests were hashed before they ran (`manifest-registration.txt`).
- **The audit:** it re-ran the 10 registered S2 manifests unchanged (their hashes were verified, 10 of 10).
- **Disclosed:**
  - the three defect reproductions and the regression tests were run during development, before registration;
  - the expected-affected list in the plan was written before the audit ran;
  - 17 cells differed from that expectation (§6.1).

## 6. Results (model output; full outputs in the appendices)
### 6.1 Impact audit — which historical S2 results remain valid (S2.1-E01)
- **Registered rule** (byte-identical semantic summary): **98 of 140 cells unaffected**, 42 affected.
- **Of the 42 affected:**
  - **41 differ only in `invariantChecks`**, the monitor's own count, which rises because S2.1 adds check I9 wherever a worker exists. Their event logs and every result metric are identical, so their S2 results remain valid.
  - **1 cell changed behaviour:** S2-E09 `ORC2-SEARCH-gold`. In S2 its look-ahead had sent workers to zone 3 before the hero visited it; that is now refused. Gold held 12,007 → 12,208, legion EXP 45,367 → 46,460. It still loses to POL2-MIXED for gold.
- **Unaffected:** every realistic campaign cell (POL2-SQUAD, -SQUAD-W, -WORKERS, -MIXED, switching), every matched cell, the A0 control and S2-E10. **No realistic policy ever assigned a worker to an unvisited zone in S2**, and no S2-E10 displayed prediction changed, because S2-E10 had no Mage or Archer worker.
- **Against the expectation written before the run** (registered rule): 17 differences.
  - POL2-SQUAD-W (S2-E08) and the hero-EXP and legion-EXP searches were expected to be affected, but are identical.
  - The classless S2-E10 worker cells were expected to be identical, but differ in the monitor count only.
- **Why identical cells need no re-interpretation:** nothing in them depended on the corrected rules. Their historical results are the corrected results.

### 6.2 Corrected S2 analyses (B0–B6 on the audit results; `analysis-s2-on-audit.txt`)
- **Unchanged:**
  - B0 still PASSES (148 summaries identical; identical event logs);
  - B1 PASSES (0 violations);
  - H-S2-01 to H-S2-04;
  - B3 (squad against workers): every value is identical, since all realistic policy cells are behaviourally unaffected;
  - B5 and B6.
- **B4 changes only for the gold search:**
  - it now holds 12,208 gold (was 12,007);
  - against POL2-SQUAD 1.054 (was 1.037), against POL2-WORKERS 0.999 (was 0.982), against POL2-MIXED 0.931 (was 0.916);
  - the conclusion stands: the bounded search is not an upper bound, and it loses to the realistic mixed policy for gold.
- **Independent combat workers, reassessed after the visitation correction:** the realistic worker and mixed strategies never assigned a worker to an unvisited zone in any S2 run. Their S2 results stand: workers trail squads for EXP, mixed earns the most gold.

### 6.3 Ability-aware worker estimates (S2.1-E02)
- **Classification of the 36 cells:**

  | Worker | Classification counts |
  |---|---|
  | Classless | reliable 2, approximate 3, unsafe 4 |
  | Warrior | approximate 6, unsafe 3 |
  | Archer | approximate 5, unsafe 4 |
  | Mage | approximate 5, unsafe 3, **unresolved 1** |

- **H-S2.1-01 (engineering):** **PASS**, but **vacuous**: no S2.1-E02 cell was classified "unreachable" (0 cells), so no proven impossibility could be contradicted there. The rule is exercised by the deterministic tests and fixtures (lethal retaliation, cooldown-limited: unreachable, 0 kills).
- **H-S2.1-02 (reported):** the one "unresolved" cell is a **level-1 Mage worker in zone 3, with the candidate content**. It realises about 6 kills per hour through Fireball; the S2 estimator would have called it "unreachable". The defect therefore occurs in the real candidate content, not only in the constructed case.
- **Estimate against realisation:**
  - reliable: median |error| 0.0%;
  - approximate: median 12.4%, max 382%;
  - unsafe: median 422%, max 903%.

  The "unsafe" values are not production forecasts: the worker is stopped after repeated knockouts and never reassigned in this diagnostic.

### 6.4 Knockout diagnostic (S2.1-E03)
- **18 of 24 cells generate knockouts** (p50 ≥ 1 per hour, the threshold fixed before running), so the diagnostic is **informative**, unlike S2-E07.
- **Where knockouts happen:** at level 1 and level 5 in zones 2 and 3, mostly with squads of 1–2, rising to 34–52 per hour.
- **Where they do not:** at level 5 in zone 2 with 2–3 recruits, and at level 1 in zone 2 with 3 recruits, the squad kills before damage matters (0 knockouts), even at ×2 enemy damage.
- **Hero deaths** (6–8 per hour) appear only in zone 3 with weak squads.
- Full table in Appendix L. This calibrates the ranges for the S3 matrix (`planning/S3_EXPERIMENT_DIRECTIONS.md` F).

## 7. Owner resolutions, L1 direction, balance
- **Owner resolutions:** `planning/S2_OWNER_RESOLUTIONS.md` v1.0 records S2-R01 to R20 with the owner's interpretations, plus:
  - trainer- and town-based class change and respec (the instant headless approximation is documented);
  - recruit regeneration and worker healing as candidates;
  - no advantageous recovery-timer resets on reconnect (S5);
  - ability cancellation and cooldown behaviour;
  - the 30–60% band as a candidate target;
  - hero damage to remain relevant.

  `S2_RESOLUTIONS.md` stays as the historical proposal, with a pointer.
- **L1:** the persistent ledger is used for S2.1 after the reconstruction fix passed its tests, differential and mutation checks. The reference ledger is kept for differentials and controls. Month-scale memory and serialization limits are recorded as unresolved. No L2.
- **Balance:** no retuning; content preserved. The S3 directions A–H are prepared in `planning/S3_EXPERIMENT_DIRECTIONS.md`, including a knockout matrix with thresholds fixed before any run. Not implemented.

## 8. Limitations
- **H-S2.1-01 is vacuous in S2.1-E02:** the candidate content gives no proven-impossible worker cell at these levels and zones. Proven impossibility is exercised by the deterministic tests and fixtures (lethal retaliation: 0 kills), not by the experiment.
- **The "unresolved" label gives no production number.** It deliberately makes no forecast; a bounded exact ability-aware estimator was not built.
- **Diagnostic designs:** E02 and S2-E10 do not reassign a stopped worker, which inflates "unsafe" errors.
- **E03** is a calibration diagnostic for the S3 matrix, not the matrix itself.
- **Inherited S2 limitations remain:** candidate rules and numbers; simple fixed policies; the search's bounds; low variance in early metrics.

## 9. Repository state
- **The S1 checkpoint** `a7d8476` (tag `s1-checkpoint`) is HEAD. L1, S2 and S2.1 are uncommitted on top of it (`git-status.txt`; `s2.1-vs-s1-checkpoint.patch`, which excludes evidence).
- **Preserved:** the S2 evidence (`evidence/s2/`) and the S2 results are not modified. The audit wrote to `results/s2.1/audit/` (copied to `evidence/s2.1/experiments/audit/`).
- **Frozen check:** `frozen-check.txt`.

## 10. Reproduction
```
cd legion-progression-lab && npm ci
npx tsc --noEmit -p tsconfig.json && npx vitest run --config vitest.config.ts && npx vitest run --config vitest.stats.config.ts
node src/cli/fixtures-check.ts && python -I ../spec/oracle/check_all.py
node repro/s2.1/defects.mjs .                      # and on the original S2 package's lab folder
node src/cli/ledger-differential.ts --extremes --reconstruct
# copy evidence/s2.1/experiments/* to results/s2.1/ (audit/ included) and evidence/s2/experiments/* to results/s2/, then:
node src/cli/exp2.ts manifests/s2.1/S2.1-E02-worker-estimator.json --verify
node src/cli/exp2.ts manifests/s2/S2-E05-squad-vs-workers.json --verify --results-dir results/s2.1/audit
node src/cli/s21-analyse.ts
python -I repro/s2/mutation_check.py <lab dir> <node dir> s2.1
```

---

## Appendix A. Type check (`typecheck.txt`)

```
$ npx tsc --noEmit -p tsconfig.json
exit code 0
```

## Appendix B. Default test suite, verbose (`test-output.txt`)

```

 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/fixture.schema.json matches the zod source 2ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/content-pack-s0.schema.json matches the zod source 1ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/xp-table.schema.json matches the zod source 0ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > addSafe: exact result, or NUMERIC_LIMIT exactly when out of range 47ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulSafe: exact result, or NUMERIC_LIMIT exactly when out of range 54ms
 ✓ test/combat.test.ts > hit chance > is 1 without a requirement and 90% at the requirement (candidate curve) 2ms
 ✓ test/combat.test.ts > hit chance > is monotonic non-decreasing in accuracy and stays inside [floor, 1] 57ms
 ✓ test/combat.test.ts > hit chance > refuses inconsistent curves 0ms
 ✓ test/combat.test.ts > mitigation, crit and damage > mitigation is diminishing and never reaches zero 46ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > matches exact BigInt arithmetic for any valid inputs 68ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > G1: any partition of the steps gives the same total and remainder 54ms
 ✓ test/xp.property.test.ts > EXP award properties > two awards in sequence equal one combined award (multi-level awards are unambiguous) 74ms
 ✓ test/xp.property.test.ts > EXP award properties > total EXP is conserved: thresholds consumed + leftover = award 53ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > divRem is exact for every non-negative safe dividend 81ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > roundHalfUp equals exact floor(x + 1/2) for any finite double in the safe range 43ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > one call matches the BigInt reference for any state, rate and duration; NUMERIC_LIMIT exactly when the grant is unsafe 212ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > one award matches unbounded integer arithmetic (no NUMERIC_LIMIT is ever needed) 262ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > covers every S0, S1 and S1.1 family with unique case IDs, boundary and failure cases, and derivations 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.keys.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nested.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.numbers.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.strings.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.infinity.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.key-ascii.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.basic.001 (normal) 22ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.both-die.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.retaliation-at-death.001 (boundary) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.hero-dies.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.mitigation.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.min-damage.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit-half.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.session-end.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.instant-attack.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-walk.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.slow-hero.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-attack.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-hp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.no-requirement.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.at-requirement.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.above.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.below.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.floor.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.zero-accuracy.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.bad-curve.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.small.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.normal.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.cap.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.overcap.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.plain.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.crit-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.mitigated.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.floor.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.zero-raw.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-mult.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-mitigation.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.third.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.five-sixths.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half-mitigation.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.k100-d25.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-below-half.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.below-half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.min-damage.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.huge-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.overflow.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.not-safe.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-ratio.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-crit-flag.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.integer.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.below-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.binary64-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.half-milli.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.too-low.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.breakpoint.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.overkill.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-hp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-dmg.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.valid.001 (normal) 4ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.range-edge.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-hash.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.out-of-range.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.duplicate-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.hit-floor.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.table-length.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unknown-field.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unlabelled.001 (failure) 17ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-id.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.exact-duplicate.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.conflict-before-genuine.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.unknown.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.exp-only.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.boss.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.interleaved.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.harmless.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.hand-chain.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.simultaneous.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.dies-first.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.crits-survival.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.spawn-bound.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.regen-gap.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.swing-budget.001 (failure) 29ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > the gate-completion decision carries "gate-completed" together with "kill" (the reviewer saw only "kill") 112ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > kill + level-up + gate unlock at the same moment reach the policy together, in the canonical order 7ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a death and a kill at the same moment (both blows land) reach the policy together 3ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a boss clear reaches the policy as "boss-cleared" with its kill 3ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > the auto-farm stop reaches the policy at the death that caused it 3ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > decisions at different moments stay separate: one decision per kill moment, and a scheduled future decision runs 4ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a policy that keeps causing new triggers at one moment is stopped as a cascade, not looped forever 3ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > ORC-BRUTE re-plans (forks every accessible zone) at the zone 2 gate completion 66ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > orderTriggers removes repeats and follows TRIGGER_ORDER, unknown triggers last and alphabetical 0ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > the reviewer scenario: the S1 control resumes and dies 124 times; the corrected fixed policy stops after 3 deaths and reports why 54ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulDivRem: exact quotient and remainder for any safe inputs, NUMERIC_LIMIT exactly when the quotient is unsafe (S0.1) 399ms
 ✓ test/s1.experiments.test.ts > summary statistics > quantiles are nearest-rank observed values; "not reached" sorts above every number 3ms
 ✓ test/s1.experiments.test.ts > summary statistics > the exact binomial interval covers at least 99.9% and is tight 14ms
 ✓ test/s1.experiments.test.ts > summary statistics > KS: identical samples do not differ; shifted samples do 1ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > a campaign job is deterministic and reports the named metrics 257ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G1: any partition of a duration gives the same total and state, for rates up to 2^53 - 1 317ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > baseline timeline: first kill at 8,000 + 2 x 1,200 = 10,400 ms; first swing lands on arrival (next pass) 30ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > simultaneous lethal blows: both die, the kill is still credited, the hero respawns without loss 9ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > retaliation at the moment the enemy dies lands, and the enemy still dies 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > hero death cancels the pending swing (stale) and frees the enemy at full HP 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > stale events from a previous encounter never reach the next one 18ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > respawn: with one slot the hero waits, then engages a new instance with a new ID 5ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > target invalidation: travelling away during the walk frees the reserved enemy and cancels the arrival 5ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > identical timestamps resolve in phase order: kill, credit, level-up, recompute, next engagement, policy 2ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > a multi-level award emits one LevelUp per level in order; stats apply to the next swing; HP rises by the max-HP gain 2ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > kill rewards are credited exactly once per kill, with one ledger transaction per kill 422ms
 ✓ test/combat.test.ts > mitigation, crit and damage > crit chance may reach exactly 100%; the excess is reported, not applied (R-A2) 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > damage per landed hit is an integer, rounds exact halves up, and has a floor 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > hits-to-kill never increases when damage increases (breakpoints are exact) 51ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > S0 review reproduction: 100 * 1.005 = 100.5 rounds up to 101 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > exact halves through mitigation ratios that binary64 cannot represent round up 1ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > values just below a half round down, even one part in 10^12 below 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > matches exact integer arithmetic for any valid input; NUMERIC_LIMIT exactly when the result is unsafe 509ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > session boundary: a lethal swing exactly at the session end is not resolved; one ms later it is 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > nothing happens between sessions; the next session re-engages with the entry walk; time adds up 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > an idle hero with no commands does nothing and earns nothing 2ms
 ✓ test/s1.events.test.ts > kill reward draws (s1-combat-loop.md section 10) > every drop entry uses exactly one draw, even at 0%, so later entries stay aligned 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.impossible-over-budget.001 (failure) 231ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > starts in zone 1 (visited, checkpoint known); other zones have every flag off 27ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a kill gate unlocks access only; the visit and checkpoint come from arriving, at the same arrival 38ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > flag invariants hold after every event: visited implies access; checkpoint implies visited 187ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > POL-STAY leaves a zone that stopped it, farms a safer one, and does not return while its level is unchanged 35ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > a level-up lifts the block: the realistic policy retries the zone only after levelling past the stop level 70ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > applies mitigation first, so no intermediate overflows when the result fits 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > is monotonic: more raw damage, a larger crit multiplier or less defence never lowers damage 55ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > mitigationRatio is exact and agrees with the display factor 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > refuses malformed damage inputs 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G3: a timeline of rate changes, each segment split arbitrarily, equals the exact integral 126ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > refuses travel and teleport that break the rules, with the documented reason codes 5ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a rejected command changes nothing: the run is identical to one that never sent it 97ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > settling at any cadence equals settling once, from any persisted state (save/load round trip included) 57ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > any split of an award gives the same final state and the same ordered level-ups 462ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > teleport to a discovered checkpoint takes teleportMs and is free 12ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > opens after the zone 3 kill gate count and is cleared inside the timer; the clear is credited once 4ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > the timer is half-open: a lethal hit exactly at the timer is too late 3ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > death in the boss fight fails it with no loss; the gate stays open for a retry 2ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > auto-farm never starts the boss, and StartBoss is refused while auto-farm is on 105ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > POL-STAY: identical event log and S1 metrics on 3 seeds (45 min) 516ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.possible-over-budget.001 (boundary) 237ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > with no safer zone it stops, turns auto-farm off and reports NO_SAFE_ZONE (and stops dying) 2ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > POL-BEST-SHOWN never farms a blocked zone 73ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > corrected policies rest below 30% HP between fights; the S1 control never does 161ms
 ✓ test/ledger.persistent.test.ts > persistent ordered map (AVL, path copying) > keeps the AVL invariants and ascending order under random inserts and replacements 20ms
 ✓ test/ledger.persistent.test.ts > persistent ordered map (AVL, path copying) > never changes an old root: every earlier version still describes its own map 30ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > key replacement: a new balance in the new snapshot, the old one untouched 2ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > adversarial keys: FNV-1a 32-bit collisions, long shared prefixes, Unicode and NUL are all distinct keys 938ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-locked.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-ok.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-far.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-here.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-unknown.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.no-session.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.dead.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.busy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.teleport-undiscovered.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.teleport-ok.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.teleport-unknown.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.autofarm-elsewhere.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.autofarm-off-closed.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.autofarm-off-dead.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.engage-busy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-locked.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-autofarm.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-ok.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-resting.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-done.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-wrong-zone.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-unknown.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-busy.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.rest-in-boss.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.end-session.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-dead.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-closed.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-unknown.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.review-turnover.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.txid-orders.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.independent-resources.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.refused-steps.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.valid-serialized.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.corrupted-balance.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.receipt-out-of-range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger-reconstruction > s2.1.reconstruction.missing-resource.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.grant-spend.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.aggregate.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.atomic.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.replay.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.conflict.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.failed-not-recorded.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.aggregate-overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.reserve.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.net-zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.zero-delta.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.resource-id.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.field.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.empty.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.squad-full-exp.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.duplicate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.stream-conflict.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.worker-stream.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.class-switch.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.partial-eligibility.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.unknown.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.nonint.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.negzero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.sub.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.sub.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.mul.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.mul.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldiv.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldiv.intermediate-overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.naive-bug.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.naive-bug.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.half-below-2p52.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.max-safe.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.inf.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.small.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.safe-product.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.wide.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.wide.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.per-hour.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.exact-carry.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.bad-d.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.fraction.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.zero-steps.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.efficiency.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.efficiency.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.huge-product.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.max-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.den-too-large.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.den-zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.bad-rem.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.tiny.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.persisted.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.large.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-granted.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-granted.split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.slow-max-duration.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.overflow.split.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-inputs.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.rate-change.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.rate-change.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.carry.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.003 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-rate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.slime.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.always-never.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.draw-alignment.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.nothing.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.bad-chance.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.qty-three.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.same-resource-twice.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.utf8.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.empty.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.surrogate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.state.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.first-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.second-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.all-zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a0.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a1.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.b0.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.one.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.full.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.over.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.min.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.too-small.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.never.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.always.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.d6.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.span1.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.full.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.worst.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.negative.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.inverted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.too-large.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.nonint.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.max-words.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.short.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.null.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.too-big.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.not-array.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.ko-in-killing-batch.001 (boundary) 32ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.ko-before-kill.001 (boundary) 4ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.threat-then-hero.001 (normal) 22ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > serialization is independent of insertion history (commutative transactions in any order) 4ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > validated reconstruction: round trip, then replays and conflicts behave exactly as before saving 2ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > validated reconstruction refuses every corruption (INVALID_STATE, no ledger) 2ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > mutation protection: the tree is unreachable from the public ledger; views expose nothing writable 0ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > a randomly built persistent ledger keeps its tree invariants (balances and committed) 15ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.classless-hero-before-archer.001 (normal) 8ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.full-squad-l10.001 (normal) 6ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.mage-hero-two-recruits.001 (normal) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.invalid-enemy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.stack.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-bp.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inexact.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.unknown-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.duplicate-source.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-factor.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-flat.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.w2-hooks.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.order.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.range.largest.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.final.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.intermediate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.many.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.bad-active.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.null-source.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive-negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.ability-makes-winnable.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.bound-equals-hp.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.cooldown-limits.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.lethal-retaliation.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.efficiency-only.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.classless.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.warrior-l5.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > worker-feasibility > s2.1.feasibility.invalid-enemy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.candidate.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.geometric.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.constant.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-a.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-g.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-length.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.multi-level.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.none.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.table-end.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.zero-at-end.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exhausted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exhausted.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.guard.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-state.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.large.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.near-max.exhausted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.max-award.multi.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.sequence.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.at-end-with-exp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.guard.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-guard.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.null-threshold.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.unsafe.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.bad-table.001 (failure) 0ms
 ✓ test/s1.determinism.test.ts > determinism > the same inputs give the same event log hash and metrics; another seed gives a different log 1097ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > balances are never negative and always equal the sum of committed nets (conservation) 211ms
 ✓ test/rng.test.ts > stream identity > is injective: different field tuples never share an encoding 43ms
 ✓ test/rng.test.ts > stream identity > refuses empty, oversized, ill-formed or badly counted identities 1ms
 ✓ test/rng.test.ts > stream identity > never yields the all-zero state, and applies the fallback rule exactly 6ms
 ✓ test/rng.test.ts > generator and sampling > replays exactly: the same stream gives the same sequence 1ms
 ✓ test/rng.test.ts > generator and sampling > produces unsigned 32-bit integers and never reaches the zero state 277ms
 ✓ test/canonicalJson.test.ts > canonical JSON > sorts keys and removes whitespace 2ms
 ✓ test/canonicalJson.test.ts > canonical JSON > is independent of key insertion order 55ms
 ✓ test/canonicalJson.test.ts > canonical JSON > formats numbers exactly as ECMAScript does (and -0 as 0) 43ms
 ✓ test/canonicalJson.test.ts > canonical JSON > refuses values that have no unambiguous canonical form 1ms
 ✓ test/rng.test.ts > generator and sampling > Bernoulli always consumes exactly one draw, including p = 0 and p = 1 0ms
 ✓ test/rng.test.ts > generator and sampling > computes thresholds exactly and refuses unrepresentable probabilities 1ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt stays inside [lo, hi] and reports how many draws it used 44ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt boundary behaviour: span 1, span 2^32, refusals 1ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses sparse array (S0 accepted it) at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array with a hole at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses undefined word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses three words at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses five words at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses fractional word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses negative word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses word of 2^32 at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses string word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array-like object at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses typed array at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses the all-zero state at every entry point (S0 accepted it in nextU32, bernoulli and uniformInt) 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > validates the state before other arguments 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > a caller mutating a returned state cannot smuggle the zero state in 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > stateFromDigest accepts only a 32-byte Uint8Array 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > valid states are unaffected: a hand-derived step is unchanged 0ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > replaying every transaction again changes nothing (no repeated claims) 85ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > 1. accessible but never visited: refused (ZONE_NOT_VISITED), no worker fight, nothing changes 15ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > 2. a zone the hero has visited: accepted, and the worker fights there 17ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > 3. a worker completing a kill gate while the hero is elsewhere grants access only: no visit, no checkpoint, no assignment there 92ms
 ✓ test/remainder.test.ts > exact remainder accumulator > splitting an interval never changes the total or the remainder (G1) 2ms
 ✓ test/remainder.test.ts > exact remainder accumulator > a zero-duration interval changes nothing (G2) 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > per-hour chain: one hour at 1.5 units/hour, split three different ways 4ms
 ✓ test/remainder.test.ts > exact remainder accumulator > settling every millisecond equals settling once (no gain from frequent rejoining) 206ms
 ✓ test/remainder.test.ts > exact remainder accumulator > persisted remainders survive a save/load round trip and complete later units 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > assignment switching: separate keys never leak into each other 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > large balances: results near 2^53 are exact and beyond it are refused 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > refuses invalid parameters 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > S0 review reproduction: 2 h at rate 2^53 - 1 in one call equals two 1 h calls 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > the largest representable grant succeeds in one call and in parts; one more millisecond is refused 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > a full state plus the largest grant still fits exactly 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > refuses malformed states before doing any arithmetic 0ms
 ✓ test/s1.determinism.test.ts > determinism > a fork continues exactly like the original run 160ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > POL-FRONTIER: identical event log and S1 metrics on 3 seeds (45 min) 558ms
 ✓ test/stats.test.ts > stat stacking > adds within a category and multiplies across categories 2ms
 ✓ test/stats.test.ts > stat stacking > the breakdown reproduces the applied value exactly 35ms
 ✓ test/stats.test.ts > stat stacking > source order does not change the result 0ms
 ✓ test/stats.test.ts > stat stacking > inactive categories are neutral; unknown or duplicate entries are refused 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > S0 review reproduction: an active factor of exactly 1 preserves 2^53 - 1 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > neutral factors are an exact identity for any base, any number of them, in any position 38ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > W2 hooks from the candidate content pack stay neutral, however large their sources 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > never returns NaN or Infinity: every result is finite and inside [0, 2^53 - 1], or the call is refused 243ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses out-of-range partial and final values (S0 returned Infinity and NaN for these) 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > applies categories in ascending id order, whatever order they are listed in 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses sparse, missing or malformed entries with INVALID_CONTENT 0ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > 4. refused before the hero first visits the zone, accepted right after the visit 8ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > 5. diagnostic initialisation: explicit visited zones are honoured; invalid set-ups are refused at construction 29ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > 6. eligibility survives travel and session boundaries: a valid worker keeps working in its zone; nothing invalid appears 14ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > realistic policies only recommend available jobs; previews of unvisited zones are marked unavailable 31ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > random command sequences cannot construct an invalid worker assignment (monitor I9, 6 seeds) 75ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/s0-core.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp-sweep.index.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/w1-slice-s2.candidate.v0.2.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/w1-slice.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E01-calibration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E02-estimator.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E03-earlier-zone-audit.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E04-survival.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E05-gate-pacing.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E06-drop-correctness-b.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E06-drop-correctness.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E07-determinism.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E08-policy-bound.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E01-base-attribution.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E02-estimator.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E03-earlier-zone-audit.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E04-survival-policies.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E05-drops-quantities.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E06-determinism.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E07-policy-comparison.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E00-control-a0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E01-deploy-scaling.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E02-hero-damage-share.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E04-class-switch-abuse.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E05-squad-vs-workers.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E06-assignment-switching.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E07-knockout-sensitivity.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E08-first-recruit-timing.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E09-hindsight-search.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E10-estimator-vs-realisation.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2.1/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2.1/S2.1-E02-worker-estimator.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2.1/S2.1-E03-knockout-diagnostic.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > package.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > repro/s2/make-manifests.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > repro/s2.1/make-manifests.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench/hamtLedger.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench-ledger-l1.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench-ledger.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-sweep.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-table.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/curve-preview.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp-worker.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp2-crosscheck.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp2-worker.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp2.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/export-schemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/fixtures-check.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/ledger-differential.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/paths.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-analyse.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-content.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-traces.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s2-analyse.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s2-content.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s21-analyse.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/arrays.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/labels.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/schema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/validate.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/errors.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/combat.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/stats.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/xp.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/hash/canonicalJson.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/differential.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/implementations.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/ledger.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/persistentLedger.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/persistentMap.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/basisPoints.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/remainder.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/rounding.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/safeInt.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/sample.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/streamId.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/xoshiro128ss.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/commands.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/credit.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/estimator-s1.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/estimator.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/legion.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/legionCommands.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/legionCredit.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/legionObservation.ts stays inside the lab and never references the frozen baseline 4ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/observation.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/queue.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/rewards.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/simulation.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/squadEstimator.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/workerFeasibility.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/jobs.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionJobs.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionManifest.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionMetrics.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionSummary.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/manifest.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/metrics.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/patch.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/report.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/stats.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/summary.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/content.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/legionContent.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/legionTypes.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/types.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/legionRealistic.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/legionSearch.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/oracle.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/realistic.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/report/curvePreview.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/exportedSchemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureRunner.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureSchema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/s1Fixtures.ts stays inside the lab and never references the frozen baseline 4ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/s2Fixtures.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/canonicalJson.test.ts stays inside the lab and never references the frozen baseline 8ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/combat.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/content.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/fixtures.conformance.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/fixtures.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/reference.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/s1.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/s2.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/isolation.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.contract.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.differential.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.persistent.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.reconstruction.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/purity.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/rng.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/runtime.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.determinism.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.events.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.experiments.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.gates.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1_1.behaviour.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1_1.credit.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s2.invariants.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s2.legion.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s2_1.worker-access.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s2_1.worker-estimator.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/schemaDrift.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/rng.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/s1.drops.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > tsconfig.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.stats.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > the monitor detects a worker in an unvisited zone if one were ever constructed (I9) 4ms
 ✓ test/s2_1.worker-access.test.ts > worker assignments need an accessible AND visited zone (D-01) > the engine refuses to start a worker fight in an unvisited zone even if the state were corrupted 4ms
 ✓ test/s2_1.worker-access.test.ts > reserve swaps happen outside encounters only (S2-R18 as approved) > a squad member in an encounter cannot be moved to the reserve; outside the encounter it can 34ms
 ✓ test/s2_1.worker-access.test.ts > reserve swaps happen outside encounters only (S2-R18 as approved) > a worker in a fight cannot be moved to the reserve 5ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-STAY: identical event log after mapping IDs back 194ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-SQUAD: 2 seeds x 45 min 1316ms
 ✓ test/s2_1.worker-estimator.test.ts > ability-aware worker classification (S2.1) > 1. an ability makes an otherwise impossible fight winnable: "unresolved", never "unreachable"; the engine confirms the kill 45ms
 ✓ test/s2_1.worker-estimator.test.ts > ability-aware worker classification (S2.1) > 2. an ability on cooldown is unavailable: the next fight is lost, and a fight needing two casts before the knockout is proven impossible 11ms
 ✓ test/s2_1.worker-estimator.test.ts > ability-aware worker classification (S2.1) > 3. an ability that cannot overcome lethal retaliation: proven unreachable, and no kill happens 7ms
 ✓ test/s2_1.worker-estimator.test.ts > ability-aware worker classification (S2.1) > 4. an ability that changes efficiency but not reachability: the basic-attack estimate is kept, labelled, and conservative 63ms
 ✓ test/purity.test.ts > purity of the deterministic core > finds the pure modules 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/arrays.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/labels.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/schema.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/validate.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/errors.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/combat.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/stats.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/xp.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/hash/canonicalJson.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/differential.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/implementations.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/ledger.ts uses no clock, ambient RNG, process, timers or I/O 6ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/persistentLedger.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/persistentMap.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/basisPoints.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/remainder.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/rounding.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/safeInt.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/sample.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/streamId.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/xoshiro128ss.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/exportedSchemas.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureRunner.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureSchema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/s1Fixtures.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/s2Fixtures.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/report/curvePreview.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/content.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/legionContent.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/legionTypes.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/types.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/commands.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/credit.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/estimator-s1.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/estimator.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legion.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legionCommands.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legionCredit.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legionObservation.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/observation.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/queue.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/rewards.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/simulation.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/squadEstimator.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/workerFeasibility.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/legionRealistic.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/legionSearch.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/oracle.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/realistic.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/jobs.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionJobs.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionManifest.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionMetrics.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionSummary.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/manifest.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/metrics.ts uses no clock, ambient RNG, process, timers or I/O 10ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/patch.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/report.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/stats.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/summary.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/s2_1.worker-estimator.test.ts > ability-aware worker classification (S2.1) > ability omissions are exposed whatever the reliability; classless workers keep estimator v1.2 unchanged 17ms
 ✓ test/s2_1.worker-estimator.test.ts > ability-aware worker classification (S2.1) > realistic policies never send a worker to an "unresolved" or "unreachable" zone 0ms
 ✓ test/s2_1.worker-estimator.test.ts > numerical domain of the S2 class-stat and ability formulas (S2.1) > the candidate pack is inside the domain; a pack whose intermediates exceed 2^53 - 1 is refused as content 13ms
 ✓ test/xp.test.ts > XP table > builds the candidate table (values independently confirmed by xp_oracle.py) 2ms
 ✓ test/xp.test.ts > XP table > is non-decreasing with every threshold >= 1 0ms
 ✓ test/xp.test.ts > XP table > refuses invalid curves, empty tables and unsafe thresholds 1ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > cumulative EXP can leave the safe range while every single threshold is safe 0ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > reports separate approximate limits for the candidate curve 1ms
 ✓ test/xp.test.ts > EXP awards > applies multi-level awards in order and keeps the leftover 0ms
 ✓ test/xp.test.ts > EXP awards > never discards EXP: an award past the table end is refused as a whole 0ms
 ✓ test/xp.test.ts > EXP awards > refuses invalid state and runaway loops 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > S0 review reproduction: an award of 2 one EXP short of a 2^53 - 1 threshold 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > awards up to 2^53 - 1 cross large thresholds exactly and conserve EXP 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > keeps table-exhaustion, guard and ordering behaviour 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > is atomic: a refused award leaves the caller state object untouched 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > refuses sparse or malformed tables and states (S0 accepted new Array(2)) 0ms
 ✓ test/ledger.test.ts > ledger > aggregates lines per bucket before validating 3ms
 ✓ test/ledger.test.ts > ledger > is atomic: a failing line changes nothing, and the input ledger is never mutated 1ms
 ✓ test/ledger.test.ts > ledger > replays an identical transaction without applying it twice 0ms
 ✓ test/ledger.test.ts > ledger > identical payloads replay regardless of object key order (canonical hashing) 0ms
 ✓ test/ledger.test.ts > ledger > refuses the same txId with a different payload 0ms
 ✓ test/ledger.test.ts > ledger > a failed transaction is not recorded and can succeed later 0ms
 ✓ test/ledger.test.ts > ledger > refuses overflow, including overflow while aggregating 0ms
 ✓ test/ledger.test.ts > ledger > refuses malformed transactions 1ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > S0 review reproduction: mutating a returned receipt cannot change the replay receipt 1ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > committed history cannot be cleared or rewritten through the returned ledger (S0 allowed a double grant) 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > balances cannot be overwritten through the returned ledger 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > every reachable object is frozen, including replay receipts 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > only ledgers made by emptyLedger or applyTx are accepted 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > refuses sparse or malformed line lists with INVALID_TX (S0 raised INVALID_JSON_VALUE) 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > values stay readable: entries can be read, iterated and copied 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > S0.1 review reproduction: mixing the balances of one genuine ledger with the history of another is refused 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > frozen shallow copies of genuine ledgers are refused, as are maps forged through the map constructor 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > every earlier genuine ledger is an independent branch starting point 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > replay and conflict detection follow each branch’s own history 1ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-FRONTIER: identical event log after mapping IDs back 228ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > passes every unchanged ledger fixture (spec/fixtures/ledger.v1.json) 6ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C4: aggregates lines with checked addition before validating 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C2: a replay returns the original receipt with replayed = true and leaves the ledger unchanged (same object) 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C3: the same txId with a different payload is TX_CONFLICT, ledger unchanged 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C4: NEGATIVE_BALANCE and NUMERIC_LIMIT, exact 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C12: the same validation codes 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C6: a failing transaction is atomic: the input ledger and earlier snapshots are unchanged 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C1: full history: every committed transaction stays, in every later snapshot 12ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C7: only genuine ledgers of this implementation are accepted 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C8: every exposed object is frozen and cannot be altered 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C9: branches from any snapshot are isolated; replay and conflict are judged per branch 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C10: both implementations give byte-identical canonical serializations for the same history 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > passes every unchanged ledger fixture (spec/fixtures/ledger.v1.json) 2ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C4: aggregates lines with checked addition before validating 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C2: a replay returns the original receipt with replayed = true and leaves the ledger unchanged (same object) 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C3: the same txId with a different payload is TX_CONFLICT, ledger unchanged 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C4: NEGATIVE_BALANCE and NUMERIC_LIMIT, exact 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C12: the same validation codes 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C6: a failing transaction is atomic: the input ledger and earlier snapshots are unchanged 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C1: full history: every committed transaction stays, in every later snapshot 6ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C7: only genuine ledgers of this implementation are accepted 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C8: every exposed object is frozen and cannot be altered 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C9: branches from any snapshot are isolated; replay and conflict are judged per branch 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C10: both implementations give byte-identical canonical serializations for the same history 0ms
 ✓ test/content.test.ts > S0 content pack > validates, and its recorded table hash matches the artifact 12ms
 ✓ test/content.test.ts > S0 content pack > detects a tampered table 2ms
 ✓ test/content.test.ts > S0 content pack > every numeric value in the pack is labelled candidate (nothing is approved yet) 0ms
 ✓ test/content.test.ts > S0 content pack > a derived value is never stronger than its weakest input 0ms
 ✓ test/numeric.test.ts > safe integers > adds up to the limit and refuses one past it 2ms
 ✓ test/numeric.test.ts > safe integers > refuses non-integers, NaN, Infinity and unsafe inputs 0ms
 ✓ test/numeric.test.ts > safe integers > normalises -0 to +0 0ms
 ✓ test/numeric.test.ts > safe integers > checks intermediate products, not only final results 0ms
 ✓ test/numeric.test.ts > safe integers > divides exactly near 2^53 where floating division rounds 1ms
 ✓ test/numeric.test.ts > roundHalfUp > fixes both failure cases of floor(x + 0.5) 0ms
 ✓ test/numeric.test.ts > roundHalfUp > rounds halves up, including negatives 0ms
 ✓ test/numeric.test.ts > roundHalfUp > refuses non-finite input and results beyond the safe range 0ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > an injected exact duplicate after an ordinary kill is rejected: no EXP, kill, gold, drop or random draw twice 18ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > the run continues normally after a rejected duplicate (later kills are credited) 15ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a duplicate processed BEFORE the genuine event credits once; the genuine one is then the replay 1ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a conflicting duplicate (other zone, or the boss flag) is rejected explicitly, before or after the genuine one 2ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a credit for an encounter that never ended in a kill is rejected as unknown 1ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > an EXP-only encounter (no gold, no drops, so no ledger transaction) has full replay protection 4ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a duplicated boss credit grants the boss EXP and gold once and completes the gate once 5ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > replay after branching: a branch keeps its own history, rejects replays, and never sees the other branch 4ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > is atomic: if any part of the credit fails, nothing of it is applied 2ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > accepts only a registered claim, exactly once, and classifies every rejection 0ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > is persistent: committing never changes an earlier registry value, and branches do not share new commits 0ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > refuses to register the same kill twice (an engine error, never a gameplay outcome) 0ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > pre-registered hypotheses are evaluated exactly as written, and the semantic result fingerprints stably 5ms
 ✓ test/s1.experiments.test.ts > ORC-BRUTE (oracle upper bound) > is deterministic and never earns less EXP than staying in zone 1 for the whole session 1259ms
 ✓ test/runtime.test.ts > pinned runtime > runs on the pinned Node 24 LTS version 1ms
 ✓ test/runtime.test.ts > pinned runtime > package.json pins exact dependency versions and the engine 1ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > manual retry: re-enabling auto-farm after the stop is accepted, clears the reason, and the next death in the window stops it again 3ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > the death window is (t - window, t]: a death exactly window ms earlier no longer counts 0ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > turning auto-farm off cancels the automatic walk to the next target: no extra kill, the target is released, its events go stale 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > turning auto-farm off mid-fight ends an automatic encounter without a kill; the enemy is free at full HP 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a manual encounter continues when auto-farm is turned off, and the hero can engage manually again 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > an idle hero regenerates after a manual kill (S1 did not start regeneration there) 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a hero that starts a session hurt regenerates while idle 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a manual Engage still waiting for an enemy ends with the session: no fight in the next session without a command 4ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > between sessions only world spawns are maintained: no reward, EXP, kill, credit or hero change 4ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > zero hit chance: 0 kills/h, no finite TTK, unreachable (the S1 estimator showed 2,400 kills/h and 0 s) 25ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > a tiny hit chance that cannot resolve within the swing budget is unreachable, not efficient 49ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > high enemy HP with crits stops at the work budget quickly 1126ms
 ✓ test/ledger.differential.test.ts > ledger differential: reference vs persistent > agree on every step of random sequences with replays, conflicts, failures and branch switches 2098ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-BEST-SHOWN: identical event log after mapping IDs back 346ms
 ✓ test/s1.determinism.test.ts > rate estimator > the swing distribution is a probability distribution and exact when nothing is random 0ms
 ✓ test/s1.determinism.test.ts > rate estimator > equals the stepper exactly where it should: no crits, no retaliation, no spawn limit 77ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies import nothing but model types 1ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > the observation exposes no RNG state, queue, ledger internals or enemy instance timers 2ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies never receive the engine handle 1ms
 ✓ test/ledger.differential.test.ts > ledger differential: reference vs persistent > the generator exercises every operation kind and outcome 103ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > POL-BEST-SHOWN: identical event log and S1 metrics on 3 seeds (45 min) 869ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-SQUAD-W: 2 seeds x 45 min 711ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > a hero who always dies before dealing lethal damage: exactly 0 kills per life, unreachable 2ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > with crits, a nearly impossible zone is "unsafe" with a vanishing rate (base L1 zone 3) 0ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > an enemy that cannot hurt the hero: unlimited kills per life, no deaths, reliable 0ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > survival chain, hand-derived: 3 swings per kill, 1 enemy hit per fight, 3 hits to die -> 2 kills per life 1ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > survival chain: a lethal hit landing at the kill moment still credits the kill 1ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > S1.1 addendum: an impossible fight beyond the survival budget is exactly 0 kills/h and unreachable (v1.1 showed 0.0176) 220ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > the S1 control estimator is unchanged (pinned to S1-E02 values) 0ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > three materials per kill: quantities match the ledger; events count successful entries 3ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > two entries for the same resource: two events and the summed quantity per kill 3ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > production rates use quantities; drop-event rates are reported separately 30ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > the metrics recorder refuses a run whose metrics do not match the ledger 1ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > structured drops keep the entry index, and the log encoding round-trips 0ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > the S1.1 drops job checks each entry and the per-resource quantity against the ledger (qty-test variant) 20ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > CTL-FRONTIER-S1: identical event log and S1 metrics on 3 seeds (45 min) 236ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > the reviewer reproduction: credit M, debit M, credit M (txIds a, z, b) reconstructs to balance M 4ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > every lexicographic order of the transaction IDs is accepted (the canonical summing order never matters) 2ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > large positive and negative cumulative turnover, independent resources and reserved buckets 7ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > after reconstruction, an exact replay returns the original receipt and a different payload is TX_CONFLICT 1ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > branched histories each reconstruct to their own content 2ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > corrupted balances and receipts are still refused, as invalid input (INVALID_STATE), never as NUMERIC_LIMIT 1ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > a self-consistent but forged history is accepted: reconstruction checks structure and conservation, not authenticity 0ms
 ✓ test/ledger.reconstruction.test.ts > validated reconstruction at numerical boundaries (S2.1) > randomised: every valid history with near-limit turnover survives serialization and reconstruction, in both implementations 2505ms
 ✓ test/s2.legion.test.ts > roster: identities, quest Q1, purchases, slots, deploy cap, rare heroes > Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 102ms
 ✓ test/s2.legion.test.ts > roster: identities, quest Q1, purchases, slots, deploy cap, rare heroes > refused purchases and assignments change nothing (gold, free slot, deploy cap) 4ms
 ✓ test/s2.legion.test.ts > roster: identities, quest Q1, purchases, slots, deploy cap, rare heroes > a rare hero never adds a productive slot; extras wait in reserve; a duplicate gives one shard 2ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > a member knocked out IN the killing batch is eligible (simultaneous blows): full EXP to hero and recruit 2ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > a member knocked out BEFORE the killing batch gets nothing; its pending blows are discarded; the hero gets full EXP 2ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > threat order: the Warrior is targeted first; once knocked out it is never targeted, the hero is next 5ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > recovery: 20 s after the knockout, but not before the encounter in progress ends 2ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > recovery is immediate when the hero respawns 4ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > leaving the squad mid-encounter takes effect at once: pending blows go stale and the member is not eligible 2ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > joining mid-encounter counts from the next engagement only 3ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > class, talent and respec commands are refused while the character is in an encounter, with no effect 4ms
 ✓ test/s2.legion.test.ts > classes, mastery, records and talents (owner §8; H-S2-05) > switching without training never creates mastery or records; a level-50 switch gives mastery level 1, not 50 3ms
 ✓ test/s2.legion.test.ts > classes, mastery, records and talents (owner §8; H-S2-05) > with training only the held class gains mastery, by the combat EXP; switching back restores that class talents 12ms
 ✓ test/s2.legion.test.ts > classes, mastery, records and talents (owner §8; H-S2-05) > the hero chooses a class from level 5 only; the first choice is free, later ones cost gold; level, EXP and HP fraction are kept 3ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > own encounter IDs and loot stream: worker kills never touch the account loot stream; zone kills and quest advance 11ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > three knockouts within five minutes stop the worker with a reason; it becomes idle and the stop is remembered 4ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > workers stop at a session end and resume at the next session start (no offline progress in S2) 4ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > reassigning a worker mid-fight cancels the fight: no credit for it, its blows go stale 4ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > an exact duplicate after the genuine credit is rejected (CREDIT_REPLAYED) and changes no character, balance, counter or stream 4ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > an exact duplicate before the genuine credit (the genuine one is then the replay) is rejected (CREDIT_REPLAYED) and changes no character, balance, counter or stream 4ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > a claim with another stream for the same encounter is rejected (CREDIT_CONFLICT) and changes no character, balance, counter or stream 4ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > an unknown encounter is rejected (CREDIT_UNKNOWN) and changes no character, balance, counter or stream 4ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > is atomic: a credit that fails (ledger at its numeric limit) applies nothing to any character 1ms
 ✓ test/s2.legion.test.ts > estimators (owner §11) > hero alone: the squad estimate is estimator v1.2 unchanged 0ms
 ✓ test/s2.legion.test.ts > estimators (owner §11) > a squad estimate is labelled approximate and exposes its assumptions 0ms
 ✓ test/s2.legion.test.ts > estimators (owner §11) > impossible is structural (unreachable, DIES_BEFORE_KILL), distinct from no hit chance and from merely unsafe 3ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > same seed, same log; another seed, another log 89ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > a fork continues exactly like the original run 90ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > the reference and persistent ledgers give the same legion run 61ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > ORC2-SEARCH forks never leak into the real run: replaying its chosen plan reproduces the log exactly 582ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > S1.1-R01 generalised: a zone block lifts after a level-up OR a later squad capability change, not before 0ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > realistic S2 policies import nothing from the engine (they see only the observation) 0ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > time categories add up to the elapsed time and none is called active player input 17ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-WORKERS: 2 seeds x 45 min 1544ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-MIXED: 2 seeds x 45 min 1017ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-SQUAD-ATT: 2 seeds x 45 min 518ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > harsher enemies (x3 damage): knockouts, hero deaths and worker stops happen, and still no violation 1569ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > switching every recruit between squad and workers at EVERY decision (all boundaries) credits each kill once 156ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 0: account gold per credited kill equals the enemy's, every eligible member gets full EXP 18ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 1: account gold per credited kill equals the enemy's, every eligible member gets full EXP 35ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 2: account gold per credited kill equals the enemy's, every eligible member gets full EXP 51ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 3: account gold per credited kill equals the enemy's, every eligible member gets full EXP 59ms

 Test Files  32 passed (32)
      Tests  926 passed (926)
   Start at  23:34:18
   Duration  7.76s (transform 2.27s, setup 0ms, import 6.85s, tests 28.56s, environment 3ms)
```

## Appendix C. Statistical tests (`test-stats-output.txt`)

```

 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > high and low bytes of nextU32 are uniform (chi-square, 256 buckets) 83ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 5000 bp has the correct success rate (binomial interval) 137ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 100 bp has the correct success rate (binomial interval) 131ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 20 bp has the correct success rate (binomial interval) 136ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt(1, 6) is unbiased (chi-square, df = 5) 117ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-a) 1663ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt with span 2^31 + 1 rejects about half of all draws, and stays unbiased across halves 59ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > streams with adjacent counters are not correlated (chi-square on paired top bits, df = 3) 1280ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-b) 1628ms

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  23:33:55
   Duration  3.52s (transform 78ms, setup 0ms, import 180ms, tests 5.24s, environment 0ms)
```

## Appendix D. Fixture conformance (`fixtures-check.txt`)

```
| Family | File | Cases | Normal | Boundary | Failure | Passed |
|---|---|---|---|---|---|---|
| canonical-json | spec/fixtures/canonical-json.v1.json | 7 | 2 | 2 | 3 | 7 |
| combat-loop | spec/fixtures/combat-loop.v1.json | 14 | 5 | 7 | 2 | 14 |
| combat | spec/fixtures/combat.v2.json | 59 | 13 | 28 | 18 | 59 |
| content | spec/fixtures/content.v1.json | 10 | 1 | 1 | 8 | 10 |
| credits | spec/fixtures/credits.v1.json | 6 | 1 | 1 | 4 | 6 |
| estimator | spec/fixtures/estimator.v1.json | 10 | 2 | 5 | 3 | 10 |
| gates | spec/fixtures/gates.v1.json | 29 | 5 | 4 | 20 | 29 |
| ledger-reconstruction | spec/fixtures/ledger-reconstruction.v1.json | 8 | 2 | 2 | 4 | 8 |
| ledger | spec/fixtures/ledger.v1.json | 15 | 2 | 4 | 9 | 15 |
| legion-credit | spec/fixtures/legion-credit.v1.json | 7 | 2 | 2 | 3 | 7 |
| numeric | spec/fixtures/numeric.v1.json | 40 | 6 | 20 | 14 | 40 |
| remainder | spec/fixtures/remainder.v2.json | 33 | 9 | 12 | 12 | 33 |
| rewards | spec/fixtures/rewards.v1.json | 7 | 2 | 4 | 1 | 7 |
| rng | spec/fixtures/rng.v1.json | 46 | 11 | 15 | 20 | 46 |
| squad-fight | spec/fixtures/squad-fight.v1.json | 7 | 4 | 2 | 1 | 7 |
| stats | spec/fixtures/stats.v2.json | 20 | 3 | 6 | 11 | 20 |
| worker-feasibility | spec/fixtures/worker-feasibility.v1.json | 8 | 3 | 2 | 3 | 8 |
| xp | spec/fixtures/xp.v2.json | 30 | 6 | 10 | 14 | 30 |
total cases: 356; problems: 0
```

## Appendix E. Schema check (`schemas-check.txt`)

```
OK    spec/schema/fixture.schema.json
OK    spec/schema/content-pack-s0.schema.json
OK    spec/schema/xp-table.schema.json
```

## Appendix F. Independent oracles (`oracle-check.txt`)

```
rng_oracle: 46 cases checked, 0 mismatches (<REPO>\spec\fixtures\rng.v1.json)
xp_oracle fixtures: 30 cases checked, 0 mismatches (<REPO>\spec\fixtures\xp.v2.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.candidate.v0.1.0.json)
exact_oracle numeric: 40 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\numeric.v1.json)
exact_oracle remainder: 33 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\remainder.v2.json)
exact_oracle stats: 20 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\stats.v2.json)
exact_oracle combat: 59 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\combat.v2.json)
exact_oracle ledger: 15 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\ledger.v1.json)
exact_oracle canonical-json: 7 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\canonical-json.v1.json)
exact_oracle content: 2 cases checked, 8 hand-only, 0 mismatches (<REPO>\spec\fixtures\content.v1.json)
s1_oracle combat-loop: 14 cases checked, 0 mismatches (<REPO>\spec\fixtures\combat-loop.v1.json)
s1_oracle gates: 29 cases checked, 0 mismatches (<REPO>\spec\fixtures\gates.v1.json)
s1_oracle rewards: 7 cases checked, 0 mismatches (<REPO>\spec\fixtures\rewards.v1.json)
s1_oracle credits: 6 cases checked, 0 mismatches (<REPO>\spec\fixtures\credits.v1.json)
s1_oracle estimator: 10 cases checked, 0 mismatches (<REPO>\spec\fixtures\estimator.v1.json)
s2_oracle squad-fight: 7 cases checked, 0 mismatches (<REPO>\spec\fixtures\squad-fight.v1.json)
s2_oracle legion-credit: 7 cases checked, 0 mismatches (<REPO>\spec\fixtures\legion-credit.v1.json)
s2_oracle worker-feasibility: 8 cases checked, 0 mismatches (<REPO>\spec\fixtures\worker-feasibility.v1.json)
s2_oracle ledger-reconstruction: 8 cases checked, 0 mismatches (<REPO>\spec\fixtures\ledger-reconstruction.v1.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a8-p1.6.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a8-p1.8.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a8-p2.0.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a10-p1.6.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a10-p1.8.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a10-p2.0.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a12-p1.6.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a12-p1.8.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a12-p2.0.v0.1.0.json)
xp_oracle preview: main rows + 9 sweep variants checked, 0 problems (<REPO>\legion-progression-lab\results\s0\S0-R01-curve-preview\semantic.json)
== rng fixtures
== xp fixtures
== xp table artifact
== exact families
== S1 / S1.1 families
== S2 families
== S2.1 families
== xp sweep table a=8 p=1.6
== xp sweep table a=8 p=1.8
== xp sweep table a=8 p=2
== xp sweep table a=10 p=1.6
== xp sweep table a=10 p=1.8
== xp sweep table a=10 p=2
== xp sweep table a=12 p=1.6
== xp sweep table a=12 p=1.8
== xp sweep table a=12 p=2
== S0-R01 preview
oracle summary: 17 groups, 0 failing
```

## Appendix G. Defect reproductions: original S2 package (`repro/original-S2-package.json.txt`)

```
{
  "lab": "legion-incremental-S2-review/legion-progression-lab",
  "workerAccess": {
    "zone2AccessUnlocked": true,
    "zone2Visited": false,
    "assignmentAccepted": true,
    "rejected": {},
    "workerKills": 15,
    "assignment": {
      "kind": "worker",
      "zoneOrder": 2
    }
  },
  "ledgerReconstruction": {
    "chronologicalFinalBalance": 9007199254740991,
    "reconstruction": {
      "ok": false,
      "error": "NUMERIC_LIMIT"
    }
  },
  "workerEstimator": {
    "mageRawAttackMilli": 7500,
    "fireballRawMilli": 30000,
    "estimate": {
      "killsPerHour": 0,
      "winChanceFromFullHp": 0,
      "reliability": "unreachable",
      "reasons": [
        "DIES_BEFORE_KILL"
      ]
    },
    "firstFightBlows": [
      [
        1500,
        "swing",
        8
      ],
      [
        1500,
        "ability",
        30
      ]
    ],
    "realisedKillsIn30s": 1,
    "knockoutsIn30s": 1
  }
}
```

## Appendix H. Defect reproductions: corrected S2.1 (`repro/corrected-S2.1.json.txt`)

```
{
  "lab": "legion-incremental/legion-progression-lab",
  "workerAccess": {
    "zone2AccessUnlocked": true,
    "zone2Visited": false,
    "assignmentAccepted": false,
    "rejected": {
      "ZONE_NOT_VISITED": 1
    },
    "workerKills": 0,
    "assignment": {
      "kind": "idle"
    }
  },
  "ledgerReconstruction": {
    "chronologicalFinalBalance": 9007199254740991,
    "reconstruction": {
      "ok": true,
      "finalBalance": 9007199254740991,
      "sameContent": true
    }
  },
  "workerEstimator": {
    "mageRawAttackMilli": 7500,
    "fireballRawMilli": 30000,
    "estimate": {
      "killsPerHour": 0,
      "winChanceFromFullHp": 0,
      "reliability": "unresolved",
      "reasons": [
        "ABILITY_DEPENDENT",
        "BASIC_ATTACKS_DIE_BEFORE_KILL",
        "ABILITY_NOT_MODELLED"
      ]
    },
    "firstFightBlows": [
      [
        1500,
        "swing",
        8
      ],
      [
        1500,
        "ability",
        30
      ]
    ],
    "realisedKillsIn30s": 1,
    "knockoutsIn30s": 1
  }
}
```

## Appendix I. Ledger differential with near-limit turnover and reconstruction (`ledger-differential.txt`)

```
differential: 1000000 operations over 50 seeds, 2000 full-content comparisons, 4000 reconstructions, 0 mismatches (7938 ms)
operations: {"multi":100207,"extreme":49839,"conflict":80448,"debit":150405,"credit":309327,"branch":59876,"invalid":39875,"overflow":30004,"replay":99697,"reserve":80322}
outcomes: {"NEGATIVE_BALANCE":49271,"ok":753345,"INVALID_TX":45151,"NUMERIC_LIMIT":73339,"TX_CONFLICT":9357,"replayed":9661}
exit 0
# Coverage of near-limit turnover (10 seeds, generator with extremes, persistent ledger alone): accepted near-limit transactions, and final ledgers whose canonical-order partial sums leave the safe-integer range (the S2 refusal condition)
{"seeds":10,"acceptedExtremeTransactions":3320,"finalLedgersWhoseCanonicalOrderPartialSumsLeaveTheSafeRange":10}
```

## Appendix J. Experiment re-verification (exp2 --verify) (`exp-verify.txt`)

```
# exp2 --verify: S2.1 experiments and the S2.1-E01 audit (re-run with the corrected engine, compared with the stored S2.1 fingerprints)
S2.1-E02-worker-estimator: MATCH (22894 ms, 15 workers)
S2.1-E03-knockout-diagnostic: MATCH (16015 ms, 15 workers)
S2-E00-control-a0: MATCH (4462 ms, 15 workers)
S2-E01-deploy-scaling: MATCH (26534 ms, 15 workers)
S2-E02-hero-damage-share: MATCH (35680 ms, 15 workers)
S2-E04-class-switch-abuse: MATCH (2393 ms, 15 workers)
S2-E05-squad-vs-workers: MATCH (33815 ms, 15 workers)
S2-E06-assignment-switching: MATCH (21204 ms, 15 workers)
S2-E07-knockout-sensitivity: MATCH (14235 ms, 15 workers)
S2-E08-first-recruit-timing: MATCH (70078 ms, 15 workers)
S2-E09-hindsight-search: MATCH (233444 ms, 15 workers)
S2-E10-estimator-vs-realisation: MATCH (39356 ms, 15 workers)
```

## Appendix K. Reference-ledger cross-check (`reference-ledger-crosscheck.txt`)

```
# Reference-ledger cross-check: cell 0 of each new S2.1 experiment re-run on the reference ledger
S2.1-E02-worker-estimator cell 0 (a10-p1.6-g100|L1-Z1|worker-classless), 100 runs on the reference ledger: MATCH (1681 ms)
  cell fingerprint stored d04c41aa300ff336bcc4da1719f20b0c03a36180b0f89b8412afb554b577bd58
  cell fingerprint rerun  d04c41aa300ff336bcc4da1719f20b0c03a36180b0f89b8412afb554b577bd58
S2.1-E03-knockout-diagnostic cell 0 (a10-p1.6-g100|L1-Z2|squad-1), 100 runs on the reference ledger: MATCH (1207 ms)
  cell fingerprint stored 9be5dfb9ae242e548b57721bd817108825ca846be9c969efce369d7c0458af53
  cell fingerprint rerun  9be5dfb9ae242e548b57721bd817108825ca846be9c969efce369d7c0458af53
```

## Appendix L. S2.1 analyses (audit, invariants, worker estimates, knockout diagnostic) (`analysis.txt`)

```
S2.1-E01 impact audit: every S2 cell re-run with the corrected engine (same manifests, seeds and replicates)
  S2-E00-control-a0: 4 identical, 0 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E01-deploy-scaling: 12 identical, 0 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E02-hero-damage-share: 24 identical, 0 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E04-class-switch-abuse: 6 identical, 0 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E05-squad-vs-workers: 2 identical, 4 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E06-assignment-switching: 1 identical, 4 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E07-knockout-sensitivity: 4 identical, 0 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E08-first-recruit-timing: 6 identical, 12 differ only in the monitor's own check count, 0 behaviourally changed
  S2-E09-hindsight-search: 3 identical, 3 differ only in the monitor's own check count, 1 behaviourally changed: PR-BAL|ORC2-SEARCH-gold
  S2-E10-estimator-vs-realisation: 36 identical, 18 differ only in the monitor's own check count, 0 behaviourally changed
  total: 140 cells. Registered rule: 98 unaffected, 42 affected.
  of the 42 affected: 41 differ ONLY in the invariant monitor's own check count (the new I9 check; identical event logs and results), 1 changed behaviour
  differences from the expectation stated before running (registered rule): 17
    S2-E08-first-recruit-timing a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q25: expected affected, observed unaffected
    S2-E08-first-recruit-timing a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q25: expected affected, observed unaffected
    S2-E08-first-recruit-timing a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40: expected affected, observed unaffected
    S2-E08-first-recruit-timing a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40: expected affected, observed unaffected
    S2-E08-first-recruit-timing a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q60: expected affected, observed unaffected
    S2-E08-first-recruit-timing a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q60: expected affected, observed unaffected
    S2-E09-hindsight-search a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp: expected affected, observed unaffected
    S2-E09-hindsight-search a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp: expected affected, observed unaffected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L1-Z1|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L1-Z2|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L1-Z3|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L5-Z1|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L5-Z2|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L5-Z3|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L10-Z1|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L10-Z2|worker-classless: expected unaffected, observed affected
    S2-E10-estimator-vs-realisation a10-p1.6-g100|L10-Z3|worker-classless: expected unaffected, observed affected

  behaviourally changed cells, original -> corrected (means):
    S2-E09 PR-BAL|ORC2-SEARCH-gold: legionExpTotal 45366.6 -> 46459.5, expTotal 13550.2 -> 13845.1, goldPerHour 12556.6 -> 12758.2, goldHeld 12006.6 -> 12208.2, workerKillsPerHour 4218.0 -> 4199.5, squadKillsPerHour 1615.4 -> 1612.1, zone3FirstVisitMin n/a -> 54.2, recruitLevelMean 21.0 -> 21.2, killsPerHour 5833.4 -> 5811.6 (41 metric summaries differ)

C1 (gate) invariant monitor I1-I9 over every S2.1 run: 20050 runs, 919230389 checks (repeated evaluations, not independent scenarios), 0 violations -> PASS

H-S2.1-01 (engineering) proven impossibility never contradicted: 0 unreachable cells, 0 with any realised worker kill -> PASS
H-S2.1-02 (reported) unresolved (ability-dependent) cells: 1: L1-Z3|worker-mage realised 6 kills/h
S2.1-E02 worker estimates by reliability (cells with realised kills):
  approximate: 19 cells, median |error| 12.4%, max |error| 382.1%
  unsafe: 13 cells, median |error| 422.2%, max |error| 903.0%
  reliable: 2 cells, median |error| 0.0%, max |error| 0.1%
  unresolved: 1 cells, median |error| 100%, max |error| 100%
  classification counts: approximate 19, unsafe 14, reliable 2, unresolved 1

C7 knockout diagnostic (S2.1-E03): 18 of 24 cells generate knockouts (p50 >= 1/h) -> informative
  base|L1-Z2|squad-1: knockouts/h 34, hero deaths/h 0, kills/h 592
  base|L1-Z2|squad-2: knockouts/h 12, hero deaths/h 0, kills/h 1146
  base|L1-Z2|squad-3: knockouts/h 0, hero deaths/h 0, kills/h 1452
  base|L1-Z3|squad-1: knockouts/h 8, hero deaths/h 6, kills/h 18
  base|L1-Z3|squad-2: knockouts/h 6, hero deaths/h 6, kills/h 36
  base|L1-Z3|squad-3: knockouts/h 52, hero deaths/h 6, kills/h 578
  base|L5-Z2|squad-1: knockouts/h 10, hero deaths/h 0, kills/h 1134
  base|L5-Z2|squad-2: knockouts/h 0, hero deaths/h 0, kills/h 1722
  base|L5-Z2|squad-3: knockouts/h 0, hero deaths/h 0, kills/h 1966
  base|L5-Z3|squad-1: knockouts/h 20, hero deaths/h 8, kills/h 204
  base|L5-Z3|squad-2: knockouts/h 30, hero deaths/h 0, kills/h 828
  base|L5-Z3|squad-3: knockouts/h 20, hero deaths/h 0, kills/h 1078
  base-dmg2|L1-Z2|squad-1: knockouts/h 12, hero deaths/h 6, kills/h 112
  base-dmg2|L1-Z2|squad-2: knockouts/h 24, hero deaths/h 0, kills/h 1104
  base-dmg2|L1-Z2|squad-3: knockouts/h 0, hero deaths/h 0, kills/h 1452
  base-dmg2|L1-Z3|squad-1: knockouts/h 6, hero deaths/h 6, kills/h 6
  base-dmg2|L1-Z3|squad-2: knockouts/h 6, hero deaths/h 6, kills/h 18
  base-dmg2|L1-Z3|squad-3: knockouts/h 8, hero deaths/h 6, kills/h 48
  base-dmg2|L5-Z2|squad-1: knockouts/h 20, hero deaths/h 0, kills/h 1092
  base-dmg2|L5-Z2|squad-2: knockouts/h 0, hero deaths/h 0, kills/h 1722
  base-dmg2|L5-Z2|squad-3: knockouts/h 0, hero deaths/h 0, kills/h 1966
  base-dmg2|L5-Z3|squad-1: knockouts/h 8, hero deaths/h 6, kills/h 42
  base-dmg2|L5-Z3|squad-2: knockouts/h 44, hero deaths/h 0, kills/h 742
  base-dmg2|L5-Z3|squad-3: knockouts/h 32, hero deaths/h 0, kills/h 1034

wrote results/s2.1/analysis.json
```

## Appendix M. S2 analyses B0-B6 on the corrected (audit) results (`analysis-s2-on-audit.txt`)

```
B0 (gate) control A0 against S1.1-E01
  148 metric summaries compared, 0 differ; event-log digests identical in 4/4 cells -> PASS

B1 (gate) invariants H-S2-02, H-S2-05, H-S2-06 in every run
  invariant monitor: 14050 runs, 824963899 checks, 0 violations; engineering hypotheses 148/148 pass -> PASS

B2 targets (a miss does not block acceptance)
  H-S2-01 first recruit in [2, 5] min (p50): 18/18 cells pass
    a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40: 2.09 min pass
    a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40: 2.09 min pass
    a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3: 2.09 min pass
    a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1: 2.09 min pass
    a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2: 2.09 min pass
    a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-SQUAD: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-WORKERS: 2.09 min pass
    a10-p1.6-g100|PR-BAL|POL2-MIXED: 2.09 min pass
    a10-p1.6-g100|PR-OPT|POL2-SQUAD: 2.09 min pass
    a10-p1.6-g100|PR-OPT|POL2-WORKERS: 2.09 min pass
    a10-p1.6-g100|PR-OPT|POL2-MIXED: 2.09 min pass
  H-S2-03 hero damage share in [0.30, 0.60] (p50, mixed, passive): 0/3 pass
    a10-p1.6-g100|L10-Z2|hero-warrior|mixed|passive: 0.141 miss
    a10-p1.6-g100|L10-Z2|hero-archer|mixed|passive: 0.200 miss
    a10-p1.6-g100|L10-Z2|hero-mage|mixed|passive: 0.185 miss
  H-S2-04 switching gain over the better set-and-forget (squad 174972, workers 45127 mean legion EXP):
    a10-p1.6-g100|PR-BAL|POL2-SWITCH-1min: gain -35.84% pass
    a10-p1.6-g100|PR-BAL|POL2-SWITCH-5min: gain -36.36% pass
    a10-p1.6-g100|PR-BAL|POL2-SWITCH-30min: gain -35.19% pass

B3 squad versus workers, per objective (no single best across objectives)
  PR-BAL hero EXP: POL2-SQUAD 44411.8, POL2-WORKERS 13109.2, POL2-MIXED 25345.9 -> best POL2-SQUAD
  PR-BAL legion EXP: POL2-SQUAD 174987.1, POL2-WORKERS 45128.2, POL2-MIXED 73518.3 -> best POL2-SQUAD
  PR-BAL gold earned per hour: POL2-SQUAD 12135.9, POL2-WORKERS 12775.3, POL2-MIXED 13665.6 -> best POL2-MIXED
  PR-BAL gold held: POL2-SQUAD 11585.9, POL2-WORKERS 12225.3, POL2-MIXED 13115.6 -> best POL2-MIXED
  PR-BAL conquest score: POL2-SQUAD 3001002166.0, POL2-WORKERS 3001005563.6, POL2-MIXED 3001004415.2 -> best POL2-WORKERS
  PR-BAL zone 3 first visit (min): POL2-SQUAD 8.4, POL2-WORKERS 24.9, POL2-MIXED 9.3 -> best POL2-SQUAD
  PR-OPT hero EXP: POL2-SQUAD 70811.8, POL2-WORKERS 22855.0, POL2-MIXED 43363.7 -> best POL2-SQUAD
  PR-OPT legion EXP: POL2-SQUAD 280587.1, POL2-WORKERS 81658.2, POL2-MIXED 129702.0 -> best POL2-SQUAD
  PR-OPT gold earned per hour: POL2-SQUAD 12890.6, POL2-WORKERS 15491.5, POL2-MIXED 16262.2 -> best POL2-MIXED
  PR-OPT gold held: POL2-SQUAD 18785.9, POL2-WORKERS 22687.2, POL2-MIXED 23843.2 -> best POL2-MIXED
  PR-OPT conquest score: POL2-SQUAD 3001003366.0, POL2-WORKERS 3001008222.4, POL2-MIXED 3001006787.5 -> best POL2-WORKERS
  PR-OPT zone 3 first visit (min): POL2-SQUAD 8.4, POL2-WORKERS 24.9, POL2-MIXED 9.3 -> best POL2-SQUAD

B4 hindsight search (best feasible found; never an upper bound)
  heroExp: search 44396.6 vs POL2-SQUAD 44396.6 -> ratio 1
  heroExp: search 44396.6 vs POL2-WORKERS 13090.5 -> ratio 3.392
  heroExp: search 44396.6 vs POL2-MIXED 25328.3 -> ratio 1.753
  legionExp: search 174926.4 vs POL2-SQUAD 174926.4 -> ratio 1
  legionExp: search 174926.4 vs POL2-WORKERS 45125.9 -> ratio 3.876
  legionExp: search 174926.4 vs POL2-MIXED 73491.7 -> ratio 2.380
  gold: search 12208.2 vs POL2-SQUAD 11581.8 -> ratio 1.054
  gold: search 12208.2 vs POL2-WORKERS 12225.1 -> ratio 0.999
  gold: search 12208.2 vs POL2-MIXED 13114.2 -> ratio 0.931
  conquest: search 3001006129.6 vs POL2-SQUAD 3001002165.3 -> ratio 1.000
  conquest: search 3001006129.6 vs POL2-WORKERS 3001005564.3 -> ratio 1.000
  conquest: search 3001006129.6 vs POL2-MIXED 3001004415.5 -> ratio 1.000
  a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp: forks 341.4, decisions 30.7, budget exhausted in 0% of runs
  a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp: forks 341.4, decisions 30.7, budget exhausted in 0% of runs
  a10-p1.6-g100|PR-BAL|ORC2-SEARCH-gold: forks 215.0, decisions 21.0, budget exhausted in 0% of runs
  a10-p1.6-g100|PR-BAL|ORC2-SEARCH-conquest: forks 186, decisions 18, budget exhausted in 0% of runs

B5 estimator against realisation (no accuracy target)
  squad of 0 approximate: 1 cells, median |error| 0.1%, max |error| 0.1%, mean signed 0.1%
  squad of 0 reliable: 4 cells, median |error| 0.2%, max |error| 0.4%, mean signed 0.2%
  squad of 0 unsafe: 3 cells, median |error| 0.3%, max |error| 0.7%, mean signed 0.2%
  squad of 1 approximate: 9 cells, median |error| 10.1%, max |error| 97.0%, mean signed 17.0%
  squad of 2 approximate: 9 cells, median |error| 8.9%, max |error| 44.6%, mean signed -2.8%
  squad of 3 approximate: 9 cells, median |error| 12.8%, max |error| 15.3%, mean signed -7.7%
  worker approximate: 9 cells, median |error| 5.9%, max |error| 382.0%, mean signed 61.6%
  worker reliable: 2 cells, median |error| 0.1%, max |error| 0.1%, mean signed 0.1%
  worker unsafe: 6 cells, median |error| 422.2%, max |error| 919.3%, mean signed 507.5%
  cells where both the estimate and the realisation are 0: 0

B6 / H-S2-07 recruit-dependent timing against the S1.1 control (p50)
  PR-NEW S1.1 POL-FRONTIER: minToL5 2.45, minToL10 14.16, zone2FirstVisitMin 5.08, zone3FirstVisitMin 38.14, levelAt45 17
  PR-NEW POL2-SQUAD-W (Q40): minToL5 2.33, minToL10 7.38, zone2FirstVisitMin 3.96, zone3FirstVisitMin 8.37, levelAt45 32
  PR-NEW POL2-WORKERS (Q40): minToL5 2.45, minToL10 11.24, zone2FirstVisitMin 3.88, zone3FirstVisitMin 24.92, levelAt45 20
  PR-NEW POL2-MIXED (Q40): minToL5 2.33, minToL10 7.99, zone2FirstVisitMin 3.96, zone3FirstVisitMin 9.29, levelAt45 25
  PR-BAL S1.1 POL-FRONTIER: minToL5 2.45, minToL10 14.16, zone2FirstVisitMin 5.08, zone3FirstVisitMin 38.14, levelAt45 17
  PR-BAL POL2-SQUAD-W (Q40): minToL5 2.33, minToL10 7.38, zone2FirstVisitMin 3.96, zone3FirstVisitMin 8.37, levelAt45 32
  PR-BAL POL2-WORKERS (Q40): minToL5 2.45, minToL10 11.24, zone2FirstVisitMin 3.88, zone3FirstVisitMin 24.92, levelAt45 20
  PR-BAL POL2-MIXED (Q40): minToL5 2.33, minToL10 7.99, zone2FirstVisitMin 3.96, zone3FirstVisitMin 9.29, levelAt45 25

wrote results/s2.1/audit/analysis-gates.json
```

## Appendix N. Determinism (`determinism.txt`)

```
# Determinism: identical re-run, second seed root, KS tests (alpha 0.001)
S2.1-E02-worker-estimator: determinism rerun identical=true fingerprint=true; second root differs in 3600/3600; KS rejections 0/216
```

## Appendix O. Mutation check S2.1 (`mutation-check-s2.1.txt`)

```
V1: DETECTED (4 failing) restored=True | worker assignment ignores the hero-visited requirement (D-01)
V2: DETECTED (1 failing) restored=True | realistic policies offer workers unvisited zones
V3: DETECTED (1 failing) restored=True | a diagnostic set-up may start a worker in an unvisited zone
V4: DETECTED (1 failing) restored=True | the monitor does not check worker eligibility (I9)
V5: DETECTED (2 failing) restored=True | reserve swaps are allowed during encounters
V6: DETECTED (9 failing) restored=True | reconstruction sums conservation with a bounded safe-integer accumulator again (the S2 defect)
V7: DETECTED (8 failing) restored=True | the feasibility bound leaves out the class ability
V8: DETECTED (1 failing) restored=True | a bound exactly equal to the enemy HP is treated as impossible
V9: DETECTED (4 failing) restored=True | ability-dependent fights are still reported as unreachable (the S2 defect)
V10: DETECTED (2 failing) restored=True | ability omission is reported only for reliable estimates (the S2 behaviour)
V11: DETECTED (1 failing) restored=True | no numerical-domain check of the class-stat intermediates
V12: DETECTED (1 failing) restored=True | the engine starts a worker fight in an unvisited zone if the state allows it
V13: DETECTED (1 failing) restored=True | realistic policies send workers to ability-dependent (unresolved) zones

S2.1 mutation check: 13 planted bugs, 13 detected, 0 not detected; all files restored: True
- V1 [src/engine/legionCommands.ts] worker assignment ignores the hero-visited requirement (D-01): detected by 4 failing test(s); e.g. × 1. accessible but never visited: refused (ZONE_NOT_VISITED), no worker fight, nothing changes 15ms
- V2 [src/policy/legionRealistic.ts] realistic policies offer workers unvisited zones: detected by 1 failing test(s); e.g. × realistic policies only recommend available jobs; previews of unvisited zones are marked unavailable 15ms
- V3 [src/engine/legion.ts] a diagnostic set-up may start a worker in an unvisited zone: detected by 1 failing test(s); e.g. × 5. diagnostic initialisation: explicit visited zones are honoured; invalid set-ups are refused at construction 7ms
- V4 [src/experiments/legionMetrics.ts] the monitor does not check worker eligibility (I9): detected by 1 failing test(s); e.g. × the monitor detects a worker in an unvisited zone if one were ever constructed (I9) 5ms
- V5 [src/engine/legionCommands.ts] reserve swaps are allowed during encounters: detected by 2 failing test(s); e.g. × a squad member in an encounter cannot be moved to the reserve; outside the encounter it can 10ms
- V6 [src/core/ledger/persistentLedger.ts] reconstruction sums conservation with a bounded safe-integer accumulator again (the S2 defect): detected by 9 failing test(s); e.g. × the reviewer reproduction: credit M, debit M, credit M (txIds a, z, b) reconstructs to balance M 5ms
- V7 [src/engine/workerFeasibility.ts] the feasibility bound leaves out the class ability: detected by 8 failing test(s); e.g. × 1. an ability makes an otherwise impossible fight winnable: "unresolved", never "unreachable"; the engine confirms the kill 28ms
- V8 [src/engine/workerFeasibility.ts] a bound exactly equal to the enemy HP is treated as impossible: detected by 1 failing test(s); e.g. × s2.1.feasibility.bound-equals-hp.001 (boundary) 5ms
- V9 [src/engine/workerFeasibility.ts] ability-dependent fights are still reported as unreachable (the S2 defect): detected by 4 failing test(s); e.g. × 1. an ability makes an otherwise impossible fight winnable: "unresolved", never "unreachable"; the engine confirms the kill 27ms
- V10 [src/engine/workerFeasibility.ts] ability omission is reported only for reliable estimates (the S2 behaviour): detected by 2 failing test(s); e.g. × 4. an ability that changes efficiency but not reachability: the basic-attack estimate is kept, labelled, and conservative 6ms
- V11 [src/model/legionContent.ts] no numerical-domain check of the class-stat intermediates: detected by 1 failing test(s); e.g. × the candidate pack is inside the domain; a pack whose intermediates exceed 2^53 - 1 is refused as content 7ms
- V12 [src/engine/legion.ts] the engine starts a worker fight in an unvisited zone if the state allows it: detected by 1 failing test(s); e.g. × the engine refuses to start a worker fight in an unvisited zone even if the state were corrupted 7ms
- V13 [src/policy/legionRealistic.ts] realistic policies send workers to ability-dependent (unresolved) zones: detected by 1 failing test(s); e.g. × realistic policies never send a worker to an "unresolved" or "unreachable" zone 9ms
```

## Appendix P. Mutation check S2 (final code) (`mutation-check-s2.txt`)

```
M1: DETECTED (14 failing) restored=True | squad EXP is divided among the eligible characters
M2: DETECTED (17 failing) restored=True | the account loot stream is rolled once per eligible character
M3: DETECTED (4 failing) restored=True | a member knocked out before the killing batch still receives EXP
M4: DETECTED (4 failing) restored=True | every deployed character is eligible, even one that joined mid-encounter
M5: DETECTED (1 failing) restored=True | leaving the squad does not cancel the member's pending blows
M6: DETECTED (2 failing) restored=True | reassigning a worker does not cancel its fight (it can fight in two places)
M7: DETECTED (19 failing) restored=True | mastery is granted to every class, not only the held one
M8: DETECTED (1 failing) restored=True | a class change copies the old class's mastery into the new one
M9: DETECTED (2 failing) restored=True | a knocked-out member keeps being targeted
M10: DETECTED (1 failing) restored=True | a knocked-out member recovers at the timer even during the encounter
M11: DETECTED (1 failing) restored=True | workers never stop after repeated knockouts
M12: DETECTED (2 failing) restored=True | a committed legion claim stays pending (duplicates credited again)
M13: DETECTED (1 failing) restored=True | the stream is not part of the claim identity
M14: DETECTED (1 failing) restored=True | class changes are allowed during combat
M15: DETECTED (1 failing) restored=True | the deploy cap is not enforced
M16: DETECTED (1 failing) restored=True | a recruit can be bought without enough gold
M17: DETECTED (1 failing) restored=True | a rare hero takes a productive slot beyond the limit (extra slot)
M18: DETECTED (1 failing) restored=True | the squad estimator calls a structurally impossible fight merely unsafe
M19: DETECTED (6 failing) restored=True | a worker kill consumes the account loot stream instead of the worker's
M20: DETECTED (1 failing) restored=True | the realistic policy never lifts a zone block after a squad capability change (S1.1-R01)

S2 mutation check: 20 planted bugs, 20 detected, 0 not detected; all files restored: True
- M1 [src/engine/legion.ts] squad EXP is divided among the eligible characters: detected by 14 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 96ms
- M2 [src/engine/legion.ts] the account loot stream is rolled once per eligible character: detected by 17 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 118ms
- M3 [src/engine/legion.ts] a member knocked out before the killing batch still receives EXP: detected by 4 failing test(s); e.g. × a member knocked out BEFORE the killing batch gets nothing; its pending blows are discarded; the hero gets full EXP 7ms
- M4 [src/engine/legion.ts] every deployed character is eligible, even one that joined mid-encounter: detected by 4 failing test(s); e.g. × joining mid-encounter counts from the next engagement only 7ms
- M5 [src/engine/legion.ts] leaving the squad does not cancel the member's pending blows: detected by 1 failing test(s); e.g. × leaving the squad mid-encounter takes effect at once: pending blows go stale and the member is not eligible 6ms
- M6 [src/engine/legion.ts] reassigning a worker does not cancel its fight (it can fight in two places): detected by 2 failing test(s); e.g. × reassigning a worker mid-fight cancels the fight: no credit for it, its blows go stale 8ms
- M7 [src/engine/legion.ts] mastery is granted to every class, not only the held one: detected by 19 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 109ms
- M8 [src/engine/legion.ts] a class change copies the old class's mastery into the new one: detected by 1 failing test(s); e.g. × with training only the held class gains mastery, by the combat EXP; switching back restores that class talents 16ms
- M9 [src/engine/legion.ts] a knocked-out member keeps being targeted: detected by 2 failing test(s); e.g. × threat order: the Warrior is targeted first; once knocked out it is never targeted, the hero is next 8ms
- M10 [src/engine/legion.ts] a knocked-out member recovers at the timer even during the encounter: detected by 1 failing test(s); e.g. × recovery: 20 s after the knockout, but not before the encounter in progress ends 7ms
- M11 [src/engine/legion.ts] workers never stop after repeated knockouts: detected by 1 failing test(s); e.g. × three knockouts within five minutes stop the worker with a reason; it becomes idle and the stop is remembered 8ms
- M12 [src/engine/legionCredit.ts] a committed legion claim stays pending (duplicates credited again): detected by 2 failing test(s); e.g. × an exact duplicate after the genuine credit is rejected (CREDIT_REPLAYED) and changes no character, balance, counter or stream 4ms
- M13 [src/engine/legionCredit.ts] the stream is not part of the claim identity: detected by 1 failing test(s); e.g. × a claim with another stream for the same encounter is rejected (CREDIT_CONFLICT) and changes no character, balance, counter or stream 8ms
- M14 [src/engine/legionCommands.ts] class changes are allowed during combat: detected by 1 failing test(s); e.g. × class, talent and respec commands are refused while the character is in an encounter, with no effect 9ms
- M15 [src/engine/legionCommands.ts] the deploy cap is not enforced: detected by 1 failing test(s); e.g. × refused purchases and assignments change nothing (gold, free slot, deploy cap) 7ms
- M16 [src/engine/legionCommands.ts] a recruit can be bought without enough gold: detected by 1 failing test(s); e.g. × refused purchases and assignments change nothing (gold, free slot, deploy cap) 6ms
- M17 [src/engine/legion.ts] a rare hero takes a productive slot beyond the limit (extra slot): detected by 1 failing test(s); e.g. × a rare hero never adds a productive slot; extras wait in reserve; a duplicate gives one shard 6ms
- M18 [src/engine/squadEstimator.ts] the squad estimator calls a structurally impossible fight merely unsafe: detected by 1 failing test(s); e.g. × impossible is structural (unreachable, DIES_BEFORE_KILL), distinct from no hit chance and from merely unsafe 7ms
- M19 [src/engine/legion.ts] a worker kill consumes the account loot stream instead of the worker's: detected by 6 failing test(s); e.g. × own encounter IDs and loot stream: worker kills never touch the account loot stream; zone kills and quest advance 15ms
- M20 [src/policy/legionRealistic.ts] the realistic policy never lifts a zone block after a squad capability change (S1.1-R01): detected by 1 failing test(s); e.g. × S1.1-R01 generalised: a zone block lifts after a level-up OR a later squad capability change, not before 4ms
```

## Appendix Q. Mutation check L1 (final code) (`mutation-check-l1.txt`)

```
P1: DETECTED (3 failing) restored=True | the tree never rebalances (left-heavy case)
P2: DETECTED (14 failing) restored=True | key replacement keeps the old value
P3: DETECTED (7 failing) restored=True | lookup descends the wrong way
P4: DETECTED (5 failing) restored=True | tree nodes are not frozen (mutable shared structure)
P5: DETECTED (5 failing) restored=True | an overdraft is skipped instead of refused (partial application)
P6: DETECTED (4 failing) restored=True | a replay returns a new empty receipt, not the original
P7: DETECTED (7 failing) restored=True | a conflicting payload is treated as a replay
P8: DETECTED (5 failing) restored=True | canonical serialization keeps insertion order for balances
P9: DETECTED (1 failing) restored=True | reconstruction skips the conservation check
P10: DETECTED (1 failing) restored=True | any object is accepted as a ledger (no identity check)
P11: DETECTED (2 failing) restored=True | the ledger object is not frozen
P12: DETECTED (1 failing) restored=True | reconstruction accepts keys out of order

L1 mutation check: 12 planted bugs, 12 detected, 0 not detected; all files restored: True
- P1 [src/core/ledger/persistentMap.ts] the tree never rebalances (left-heavy case): detected by 3 failing test(s); e.g. × keeps the AVL invariants and ascending order under random inserts and replacements 14ms
- P2 [src/core/ledger/persistentMap.ts] key replacement keeps the old value: detected by 14 failing test(s); e.g. × agree on every step of random sequences with replays, conflicts, failures and branch switches 42ms
- P3 [src/core/ledger/persistentMap.ts] lookup descends the wrong way: detected by 7 failing test(s); e.g. × agree on every step of random sequences with replays, conflicts, failures and branch switches 36ms
- P4 [src/core/ledger/persistentMap.ts] tree nodes are not frozen (mutable shared structure): detected by 5 failing test(s); e.g. × keeps the AVL invariants and ascending order under random inserts and replacements 8ms
- P5 [src/core/ledger/persistentLedger.ts] an overdraft is skipped instead of refused (partial application): detected by 5 failing test(s); e.g. × agree on every step of random sequences with replays, conflicts, failures and branch switches 14ms
- P6 [src/core/ledger/persistentLedger.ts] a replay returns a new empty receipt, not the original: detected by 4 failing test(s); e.g. × agree on every step of random sequences with replays, conflicts, failures and branch switches 24ms
- P7 [src/core/ledger/persistentLedger.ts] a conflicting payload is treated as a replay: detected by 7 failing test(s); e.g. × agree on every step of random sequences with replays, conflicts, failures and branch switches 28ms
- P8 [src/core/ledger/persistentLedger.ts] canonical serialization keeps insertion order for balances: detected by 5 failing test(s); e.g. × agree on every step of random sequences with replays, conflicts, failures and branch switches 15ms
- P9 [src/core/ledger/persistentLedger.ts] reconstruction skips the conservation check: detected by 1 failing test(s); e.g. × validated reconstruction refuses every corruption (INVALID_STATE, no ledger) 4ms
- P10 [src/core/ledger/persistentLedger.ts] any object is accepted as a ledger (no identity check): detected by 1 failing test(s); e.g. × C7: only genuine ledgers of this implementation are accepted 3ms
- P11 [src/core/ledger/persistentLedger.ts] the ledger object is not frozen: detected by 2 failing test(s); e.g. × mutation protection: the tree is unreachable from the public ledger; views expose nothing writable 2ms
- P12 [src/core/ledger/persistentLedger.ts] reconstruction accepts keys out of order: detected by 1 failing test(s); e.g. × validated reconstruction refuses every corruption (INVALID_STATE, no ledger) 4ms
```

## Appendix R. Plan and manifest registration (`registration.txt`)

```
plan document registered: 2026-11-13T23:06:49Z 0bb0748ddba4efb0a25e8df16efb0d81d043099cf4dde56a4ba8dfa6b7f52471
2026-11-13T23:07:48Z 5ed8366ec99c2562 manifests/s2.1/S2.1-E02-worker-estimator.json
2026-11-13T23:07:48Z 0def5e9ce79cdefb manifests/s2.1/S2.1-E03-knockout-diagnostic.json
S2 manifests unchanged for the audit: 10 / 10
```

## Appendix S. Frozen simulator, archive and old workspaces (`frozen-check.txt`)

```
Frozen simulator, Original v1 archive and old workspace check after S2.1 (2026-11-13T23:34:37Z)
Frozen workspace files: 3012 (M0: 3012)
path/size/mtime list vs M0 start: IDENTICAL
content SHA-256 list vs M0 start: IDENTICAL
combined fingerprint: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d (M0: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d)
frozen HEAD: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; Original v1 working files: 12 (M0: 12)
archive master 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; archive/increment6-original-v1 8d80a440d9818c961713b767f696764b3f18db66; remotes 0
old Legion workspace: 16 files IDENTICAL to the copy-time hashes
All git reads used GIT_OPTIONAL_LOCKS=0; nothing was written to these locations.
```

## Appendix T. Git status (`git-status.txt`)

```
$ git log --oneline -5
a7d8476 S1 checkpoint: S1 single-character simulation + S1.1 corrections + acceptance addendum
ad11a50 S0 checkpoint: S0 + S0.1 hardening + final ledger identity correction
0209d93 M0 resolution and review corrections (v1.1); repository verification; Rojo 7.7.1
3aced25 M0 import: design pack v1.0, M0 planning documents (as reviewed), Rojo starter

$ git tag -n1
s0-checkpoint   S0 checkpoint (S0 + S0.1 + final ledger correction), accepted by the owner after independent review. Local only; not pushed.
s1-checkpoint   S1 checkpoint (S1 + S1.1 + acceptance addendum), accepted by the owner after independent review. Local only; not pushed.

$ git status --porcelain=v1 --untracked-files=all
 M legion-progression-lab/CHANGELOG.md
 M legion-progression-lab/PROVENANCE.md
 M legion-progression-lab/README.md
 M legion-progression-lab/src/cli/exp.ts
 M legion-progression-lab/src/core/ledger/ledger.ts
 M legion-progression-lab/src/engine/simulation.ts
 M legion-progression-lab/src/experiments/jobs.ts
 M legion-progression-lab/src/experiments/metrics.ts
 M legion-progression-lab/src/model/types.ts
 M legion-progression-lab/src/spec/fixtureRunner.ts
 M legion-progression-lab/src/spec/fixtureSchema.ts
 M legion-progression-lab/test/fixtures.conformance.test.ts
 M spec/formulas/ledger.md
 M spec/oracle/check_all.py
 M spec/schema/fixture.schema.json
?? legion-progression-lab/content/w1-slice-s2.candidate.v0.2.0.json
?? legion-progression-lab/evidence/l1/L1_REPORT.md
?? legion-progression-lab/evidence/l1/benchmark.json
?? legion-progression-lab/evidence/l1/differential.json
?? legion-progression-lab/evidence/l1/gameplay-regression-persistent.txt
?? legion-progression-lab/evidence/l1/mutation-check-run1.txt
?? legion-progression-lab/evidence/l1/mutation-check.txt
?? legion-progression-lab/evidence/s1-checkpoint/CHECKPOINT.md
?? legion-progression-lab/evidence/s1-checkpoint/frozen-check.txt
?? legion-progression-lab/evidence/s2.1/S2_1_EVIDENCE.md
?? legion-progression-lab/evidence/s2.1/analysis-s2-on-audit.txt
?? legion-progression-lab/evidence/s2.1/analysis.txt
?? legion-progression-lab/evidence/s2.1/determinism.txt
?? legion-progression-lab/evidence/s2.1/exp-verify.txt
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/determinism.json
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/report.md
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E02-worker-estimator/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/report.md
?? legion-progression-lab/evidence/s2.1/experiments/S2.1-E03-knockout-diagnostic/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/analysis.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E00-control-a0/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E01-deploy-scaling/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E02-hero-damage-share/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E04-class-switch-abuse/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E04-class-switch-abuse/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E04-class-switch-abuse/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E04-class-switch-abuse/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E04-class-switch-abuse/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E05-squad-vs-workers/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E06-assignment-switching/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E07-knockout-sensitivity/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E08-first-recruit-timing/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/events.cell-4.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/events.cell-5.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/events.cell-6.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E09-hindsight-search/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/environment.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/fingerprint.txt
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/quantiles.csv
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/report.md
?? legion-progression-lab/evidence/s2.1/experiments/audit/S2-E10-estimator-vs-realisation/semantic.json
?? legion-progression-lab/evidence/s2.1/experiments/audit/analysis-gates.json
?? legion-progression-lab/evidence/s2.1/experiments/ledger-differential.json
?? legion-progression-lab/evidence/s2.1/fixtures-check.txt
?? legion-progression-lab/evidence/s2.1/frozen-check.txt
?? legion-progression-lab/evidence/s2.1/git-status.txt
?? legion-progression-lab/evidence/s2.1/ledger-differential.txt
?? legion-progression-lab/evidence/s2.1/manifest-registration.txt
?? legion-progression-lab/evidence/s2.1/mutation-check-l1.txt
?? legion-progression-lab/evidence/s2.1/mutation-check-s2.1.txt
?? legion-progression-lab/evidence/s2.1/mutation-check-s2.txt
?? legion-progression-lab/evidence/s2.1/oracle-check.txt
?? legion-progression-lab/evidence/s2.1/plan-registration.txt
?? legion-progression-lab/evidence/s2.1/reference-ledger-crosscheck.txt
?? legion-progression-lab/evidence/s2.1/registration.txt
?? legion-progression-lab/evidence/s2.1/repro/corrected-S2.1.json.txt
?? legion-progression-lab/evidence/s2.1/repro/original-S2-package.json.txt
?? legion-progression-lab/evidence/s2.1/schemas-check.txt
?? legion-progression-lab/evidence/s2.1/test-output.txt
?? legion-progression-lab/evidence/s2.1/test-stats-output.txt
?? legion-progression-lab/evidence/s2.1/tool-versions.txt
?? legion-progression-lab/evidence/s2.1/typecheck.txt
?? legion-progression-lab/evidence/s2/S2_EVIDENCE.md
?? legion-progression-lab/evidence/s2/analysis.txt
?? legion-progression-lab/evidence/s2/determinism.txt
?? legion-progression-lab/evidence/s2/exp-verify.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E00-control-a0/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/determinism.json
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E01-deploy-scaling/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E02-hero-damage-share/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E04-class-switch-abuse/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E04-class-switch-abuse/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E04-class-switch-abuse/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E04-class-switch-abuse/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E04-class-switch-abuse/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/determinism.json
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E05-squad-vs-workers/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E06-assignment-switching/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E07-knockout-sensitivity/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E08-first-recruit-timing/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/events.cell-4.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/events.cell-5.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/events.cell-6.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E09-hindsight-search/semantic.json
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/environment.json
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/events.cell-0.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/events.cell-1.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/events.cell-2.sample.jsonl
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/fingerprint.txt
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/quantiles.csv
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/report.md
?? legion-progression-lab/evidence/s2/experiments/S2-E10-estimator-vs-realisation/semantic.json
?? legion-progression-lab/evidence/s2/experiments/analysis-gates.json
?? legion-progression-lab/evidence/s2/fixtures-check.txt
?? legion-progression-lab/evidence/s2/frozen-check.txt
?? legion-progression-lab/evidence/s2/git-status.txt
?? legion-progression-lab/evidence/s2/manifest-registration.txt
?? legion-progression-lab/evidence/s2/mutation-check-run1.txt
?? legion-progression-lab/evidence/s2/mutation-check-run2.txt
?? legion-progression-lab/evidence/s2/mutation-check.txt
?? legion-progression-lab/evidence/s2/oracle-check.txt
?? legion-progression-lab/evidence/s2/reference-ledger-crosscheck.txt
?? legion-progression-lab/evidence/s2/s2-vs-s1-checkpoint.patch
?? legion-progression-lab/evidence/s2/schemas-check.txt
?? legion-progression-lab/evidence/s2/test-output.txt
?? legion-progression-lab/evidence/s2/test-stats-output.txt
?? legion-progression-lab/evidence/s2/tool-versions.txt
?? legion-progression-lab/evidence/s2/typecheck.txt
?? legion-progression-lab/manifests/s2.1/PREREGISTRATION.md
?? legion-progression-lab/manifests/s2.1/S2.1-E02-worker-estimator.json
?? legion-progression-lab/manifests/s2.1/S2.1-E03-knockout-diagnostic.json
?? legion-progression-lab/manifests/s2.1/preregistration.json
?? legion-progression-lab/manifests/s2/PREREGISTRATION.md
?? legion-progression-lab/manifests/s2/S2-E00-control-a0.json
?? legion-progression-lab/manifests/s2/S2-E01-deploy-scaling.json
?? legion-progression-lab/manifests/s2/S2-E02-hero-damage-share.json
?? legion-progression-lab/manifests/s2/S2-E04-class-switch-abuse.json
?? legion-progression-lab/manifests/s2/S2-E05-squad-vs-workers.json
?? legion-progression-lab/manifests/s2/S2-E06-assignment-switching.json
?? legion-progression-lab/manifests/s2/S2-E07-knockout-sensitivity.json
?? legion-progression-lab/manifests/s2/S2-E08-first-recruit-timing.json
?? legion-progression-lab/manifests/s2/S2-E09-hindsight-search.json
?? legion-progression-lab/manifests/s2/S2-E10-estimator-vs-realisation.json
?? legion-progression-lab/manifests/s2/preregistration.json
?? legion-progression-lab/planning/L1_LEDGER_SPECIFICATION.md
?? legion-progression-lab/planning/S2_OWNER_RESOLUTIONS.md
?? legion-progression-lab/planning/S2_RESOLUTIONS.md
?? legion-progression-lab/planning/S2_SPECIFICATION.md
?? legion-progression-lab/planning/S3_EXPERIMENT_DIRECTIONS.md
?? legion-progression-lab/repro/s2.1/defects.mjs
?? legion-progression-lab/repro/s2.1/make-manifests.ts
?? legion-progression-lab/repro/s2.1/make_fixture_drafts.py
?? legion-progression-lab/repro/s2/make-manifests.ts
?? legion-progression-lab/repro/s2/make_fixture_drafts.py
?? legion-progression-lab/repro/s2/mutation_check.py
?? legion-progression-lab/src/cli/bench-ledger-l1.ts
?? legion-progression-lab/src/cli/exp2-crosscheck.ts
?? legion-progression-lab/src/cli/exp2-worker.ts
?? legion-progression-lab/src/cli/exp2.ts
?? legion-progression-lab/src/cli/ledger-differential.ts
?? legion-progression-lab/src/cli/s2-analyse.ts
?? legion-progression-lab/src/cli/s2-content.ts
?? legion-progression-lab/src/cli/s21-analyse.ts
?? legion-progression-lab/src/core/ledger/differential.ts
?? legion-progression-lab/src/core/ledger/implementations.ts
?? legion-progression-lab/src/core/ledger/persistentLedger.ts
?? legion-progression-lab/src/core/ledger/persistentMap.ts
?? legion-progression-lab/src/engine/legion.ts
?? legion-progression-lab/src/engine/legionCommands.ts
?? legion-progression-lab/src/engine/legionCredit.ts
?? legion-progression-lab/src/engine/legionObservation.ts
?? legion-progression-lab/src/engine/squadEstimator.ts
?? legion-progression-lab/src/engine/workerFeasibility.ts
?? legion-progression-lab/src/experiments/legionJobs.ts
?? legion-progression-lab/src/experiments/legionManifest.ts
?? legion-progression-lab/src/experiments/legionMetrics.ts
?? legion-progression-lab/src/experiments/legionSummary.ts
?? legion-progression-lab/src/model/legionContent.ts
?? legion-progression-lab/src/model/legionTypes.ts
?? legion-progression-lab/src/policy/legionRealistic.ts
?? legion-progression-lab/src/policy/legionSearch.ts
?? legion-progression-lab/src/spec/s2Fixtures.ts
?? legion-progression-lab/test/helpers/s2.ts
?? legion-progression-lab/test/ledger.contract.test.ts
?? legion-progression-lab/test/ledger.differential.test.ts
?? legion-progression-lab/test/ledger.persistent.test.ts
?? legion-progression-lab/test/ledger.reconstruction.test.ts
?? legion-progression-lab/test/s2.invariants.test.ts
?? legion-progression-lab/test/s2.legion.test.ts
?? legion-progression-lab/test/s2_1.worker-access.test.ts
?? legion-progression-lab/test/s2_1.worker-estimator.test.ts
?? spec/fixtures/ledger-reconstruction.v1.json
?? spec/fixtures/legion-credit.v1.json
?? spec/fixtures/squad-fight.v1.json
?? spec/fixtures/worker-feasibility.v1.json
?? spec/formulas/s2-legion.md
?? spec/oracle/s2_oracle.py

$ git diff --stat s1-checkpoint
 legion-progression-lab/CHANGELOG.md                | 47 +++++++++++++
 legion-progression-lab/PROVENANCE.md               | 13 ++++
 legion-progression-lab/README.md                   | 10 ++-
 legion-progression-lab/src/cli/exp.ts              |  8 ++-
 legion-progression-lab/src/core/ledger/ledger.ts   |  3 +-
 legion-progression-lab/src/engine/simulation.ts    |  8 ++-
 legion-progression-lab/src/experiments/jobs.ts     | 15 ++--
 legion-progression-lab/src/experiments/metrics.ts  |  9 +++
 legion-progression-lab/src/model/types.ts          |  4 +-
 legion-progression-lab/src/spec/fixtureRunner.ts   | 55 ++++++++++-----
 legion-progression-lab/src/spec/fixtureSchema.ts   |  2 +-
 .../test/fixtures.conformance.test.ts              |  2 +-
 spec/formulas/ledger.md                            | 80 ++++++++++++++++++++++
 spec/oracle/check_all.py                           |  2 +
 spec/schema/fixture.schema.json                    |  6 +-
 15 files changed, 228 insertions(+), 36 deletions(-)
```

## Appendix U. Tool versions (`tool-versions.txt`)

```
Captured: 2026-11-13T23:34:02Z
node v24.22.3
npm 11.19.1
typescript Version 7.0.2
vitest vitest/4.1.12 win32-x64 node-v24.22.3
Python 3.12.9
git version 2.53.0.windows.1
OS: MINGW64_NT-10.0-26300 3.6.6-1cdd4371.x86_64 x86_64
CPUs: 16
package-lock.json sha256: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6 (S0: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6)
```
