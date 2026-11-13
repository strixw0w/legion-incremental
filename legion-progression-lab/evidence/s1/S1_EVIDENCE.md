# S1 evidence — single-character diagnostic simulation

**Increment:** S1, authorised in `planning/S0_FINAL_REVIEW_RESOLUTION.md` §4.

**Date:** 2026-11-13.

**Status:**
- **Uncommitted.** It awaits independent review and owner acceptance; S1 is not committed as a checkpoint.
- **Not pushed.** The GitHub remote is public.
- **S2 not started.**

**Labels:**
- Every input is `candidate`, and every result is `model-output`.
- Nothing is live-validated or approved.
- Oracle rows are upper-bound diagnostics, never targets.

---

## 1. Final S0 review resolution and checkpoint
- **Final ledger correction.** After the S0.1 review, a frozen object mixing two genuine ledgers was accepted (balance 10 instead of 5).
  - **Fix:** a module-private `WeakSet` of genuine ledgers.
  - **Tests:** 4 regression tests.
  - **Planted bugs:** 4 of 4 were detected.
  - **Evidence:** `evidence/s0.1-final/`.
- **Checkpoint commit:** `ad11a508fd715b08705c5ee72f215f92183f0993` (S0 + S0.1 + correction, 155 files).
  - Local annotated tag `s0-checkpoint`, tag object `87654918e81b94d4160eee6ad56d79d8cc46bfd5`; tree `f5371311ee726268ea64f2e039ea80caa0103282`.
  - **Not pushed.**
  - Record: `evidence/s0-checkpoint/CHECKPOINT.md`, including test results, the diff, and the frozen-simulator and archive checks.
- **Verification at the checkpoint:**
  - 463 default tests and 7 statistical tests;
  - 252 fixture cases;
  - 5 oracle groups, 0 failing;
  - the S0-R01 fingerprint unchanged.

  As the owner instructed, these Vitest results are this machine's, not independently re-run.

## 2. What S1 adds
| Area | Files | Spec |
|---|---|---|
| Attack quantisation (owner §5) | `src/core/formulas/combat.ts` `attackRawMilli` | `combat.md` (still v2) "Attack quantisation" |
| Model | `src/model/content.ts` (schema, validation, compilation), `src/model/types.ts` | `s1-combat-loop.md` v1, `gates.md` v1 |
| Engine | `src/engine/queue.ts`, `simulation.ts`, `commands.ts`, `rewards.ts`, `estimator.ts`, `observation.ts` | as above |
| Policies | `src/policy/realistic.ts` (POL-STAY, POL-FRONTIER, POL-BEST-SHOWN, POL-FIXED), `src/policy/oracle.ts` (ORC-BRUTE) | experiment plan §4; S1-R16 |
| Experiments | `src/experiments/` (manifest, patch, jobs, metrics, stats, summary, report); `src/cli/exp.ts`, `exp-worker.ts` | experiment plan §6; architecture §14 |
| Content | `content/w1-slice.candidate.v0.1.0.json` (fingerprint `cb130aba…8ec6`), 9 sweep tables + index | M1 plan v1.0 §6 inputs |
| Fixtures and oracle | `spec/fixtures/combat-loop.v1.json` (14), `gates.v1.json` (25), `rewards.v1.json` (5), `combat.v2.json` +8; `spec/oracle/s1_oracle.py` | |
| Benchmark | `src/cli/bench-ledger.ts`, `src/cli/bench/hamtLedger.ts` (benchmark-only prototype) | `planning/S1_LEDGER_BENCHMARK_PROPOSAL.md`; budgets pre-registered |
| Tools | `src/cli/s1-traces.ts`, `s1-analyse.ts`, `build-xp-sweep.ts`, `s1-content.ts` | |
| Decisions | `planning/S1_RESOLUTIONS.md`: 17 proposed candidate rules (S1-R01 … R17) where the approved documents are silent | |

**Out of scope, not built:**
- recruits;
- classes;
- abilities;
- gear or crafting;
- sinks;
- professions;
- Monuments, Bestiary or Feats;
- offline progress;
- full bosses;
- zones 4–10;
- monetisation;
- Roblox or Luau;
- a dashboard.

Gold and materials only accumulate.

## 3. Damage quantisation boundary (owner §5)
1. **Attack is a stat in thousandths.**
   - The base and flat sources are integer thousandths.
   - The only binary64 steps are the `stats.md` v2 category factors.
   - `rawMilli = roundHalfUp(v)` is exact for the binary64 value v. No ×1000 multiplication is performed.
2. **Limits:**
   - v ≤ 2^53 − 1 (`NUMERIC_LIMIT`);
   - `rawMilli ≥ 1` (`INVALID_NUMBER`, "attack too low to land a damaging hit").
3. **Exactness boundary.**
   - **(a) Quantising the binary64 value.** `rawMilli` is a defined function of that value, not of an ideal real.
     - Fixture `combat.attack.binary64-half.001`: 999,990,001,923 thousandths with +13 bp is exactly …925.4999, but binary64 gives …925.5, so `rawMilli` is …926.
   - **(b) Damage.** Given integer inputs, `damagePerHit` is exact (combat v2). Authoritative damage uses exact mitigation fractions, `mitigationRatio(D, K)`.
4. **Fixtures:** 8 `attackRawMilli` cases, checked by `exact_oracle.py`. It replays the binary64 factors with Python floats, then applies an exact `Fraction` half-up.
5. **Luau:** the same binary64 factor order, then the same exact `roundHalfUp`.

## 4. Event semantics and adversarial scenarios (owner §6)
Implemented and tested before any experiment ran. Spec: `s1-combat-loop.md` v1 and `gates.md` v1. Traces are in `evidence/s1/traces/`.

| Scenario (owner §6) | Rule | Test (file › name) | Trace |
|---|---|---|---|
| Simultaneous lethal attacks | Both blows come from the pre-batch state: both die, the kill is credited, the hero respawns with no loss | `s1.events` › simultaneous lethal blows; fixture `s1.fight.both-die.001` | 01 |
| Retaliation at the moment an enemy dies | The blow lands | `s1.events` › retaliation at the moment…; fixture `s1.fight.retaliation-at-death.001` | 02 |
| Hero death and cancelled attacks | The epoch rises, the pending swing is stale, and the enemy is freed at full HP | `s1.events` › hero death cancels…; fixture `s1.fight.hero-dies.001` | 03 |
| Stale events from previous encounters | Discarded and counted; every enemy hit belongs to the open encounter | `s1.events` › stale events… | 08 |
| Enemy respawn and target invalidation | A waiting hero engages the new instance (new ID); travel during a walk frees the reserved enemy and discards the arrival | `s1.events` › respawn…, › target invalidation… | 06 |
| Multiple events with identical timestamps | Phase order: COMPLETE → CREDIT → PROGRESS → RECOMPUTE → START → POLICY; the log is in key order; same-moment rescheduling uses passes | `s1.events` › identical timestamps…; › baseline timeline (first swing in pass 1) | 05 |
| Exactly-once kill rewards | One `KillCredited` and one ledger transaction per kill, ID `kill:<encounterId>:<instanceId>`; 0 duplicate credits | `s1.events` › kill rewards are credited exactly once | |
| Rewards at session boundaries | Half-open session: a lethal swing exactly at `tEnd` is never resolved, at `tEnd + 1` it is; nothing happens offline; time categories add up | `s1.events` › session boundary…, › nothing happens between sessions…; fixture `s1.fight.session-end.001` | 04 |
| Level-ups changing stats during work | One `LevelUp` per level at the same t, then RECOMPUTE, before the next engagement; the next swing uses the new attack; HP rises by the max-HP gain | `s1.events` › a multi-level award… | 05 |
| No entity-ID advantage | Renaming and permuting every content ID (zones, enemies, checkpoints, gates, resources) gives an identical event log after mapping back, for POL-STAY, POL-FRONTIER and POL-BEST-SHOWN | `s1.determinism` › metamorphic… (3 tests) | |
| Active-only gate | Automation never starts the boss; `StartBoss` is refused while auto-farm is on; the timer is half-open; a failure costs nothing | `s1.gates` › prototype miniboss stub (4 tests) | 07 |

**Where the approved documents were silent:** the rule was recorded as a proposed candidate (S1-R01 … R17), with its consequence (`planning/S1_RESOLUTIONS.md`). No gameplay rule was invented silently.

## 5. Engineering gates (these decide acceptance)
| Gate | Result | Evidence |
|---|---|---|
| Type check | clean | `typecheck.txt` |
| Default tests, including all S1 invariant, adversarial, metamorphic, gate, boss, determinism and estimator tests | 626 of 626 passed | `test-output.txt`, `test-results.json` |
| Statistical tests (RNG; S1 drop rolls over 200,000 kills, 2 seeds) | 9 of 9 passed | `test-stats-output.txt` |
| Fixture conformance, S0 and S1 families | 304 cases, 0 problems | `fixtures-check.txt` |
| Independent Python oracles (S0 groups, S1 families, 9 sweep tables, curve preview) | 15 groups, 0 failing | `oracle-check.txt` |
| Exported schemas match the zod source | 3 of 3 OK | `schemas-check.txt` |
| S0-R01 curve fingerprint unchanged, run twice | S0-R01 semantic.json identical across both runs: yes; S0-R01 semantic.json identical to S0 evidence: yes; S0-R01 semantic fingerprint: 24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9 | `curve-preview-*.txt` |
| S1-E06 drop correctness (as registered) | 6 of 6 counts inside the 99.9% interval; ledger mismatches 0; under-sampled (see §6) | `experiments/S1-E06-drop-correctness/` |
| S1-E06b drop correctness (amendment 01: over 100,000 kills per zone, independent seeds) | 6 of 6 inside; kills per zone 239,500, 239,500, 136,073; ledger mismatches 0 | `experiments/S1-E06-drop-correctness-b/` |
| S1-E07 determinism | re-run event logs identical: yes (800 runs); semantic fingerprints identical: yes; second-root runs that differ: 800 of 800; KS rejections at alpha 0.001: 0 of 16 | `experiments/S1-E07-determinism/` |
| `exp:verify`: every experiment re-run reproduces its semantic fingerprint | 9 of 9 MATCH, 0 MISMATCH | `exp-verify.txt` |
| Negative controls: planted bugs in critical S1 rules | 14 of 14 detected; 14 of 14 files restored with identical hashes | `mutation-check.txt` (table below) |

**Planted bugs** (each run separately against the full default suite):

| # | File | Planted bug (rule it breaks) | Tests failed | Restored, hash identical |
|---|---|---|---|---|
| 1 | `src/engine/simulation.ts` | sequential instead of simultaneous blows: a dying enemy no longer retaliates (9.3 rule 1) | 5 | yes |
| 2 | `src/engine/simulation.ts` | events of closed encounters are no longer discarded (9.3 rule 2) | 28 | yes |
| 3 | `src/engine/simulation.ts` | events from an old hero epoch are no longer discarded (9.3 rule 2) | 12 | yes |
| 4 | `src/engine/simulation.ts` | session end processed with the attacks (COMPLETE) instead of before them (9.3 rule 3) | 1 | yes |
| 5 | `src/engine/simulation.ts` | each kill counted twice towards the zone gate (credit once, 9.3 rule 6) | 1 | yes |
| 6 | `src/engine/simulation.ts` | swing cooldown ignored: first swing always on arrival (S1-R03) | 2 | yes |
| 7 | `src/engine/simulation.ts` | kill gate also grants the visit and checkpoint (D-01 separate flags) | 1 | yes |
| 8 | `src/engine/simulation.ts` | stats recomputed after the next engagement starts (phase order 9.2) | 1 | yes |
| 9 | `src/engine/simulation.ts` | level-up fully heals instead of adding the max-HP gain (S1-R10) | 1 | yes |
| 10 | `src/engine/commands.ts` | active-only check removed: StartBoss allowed while auto-farming (D-01, R10.03) | 2 | yes |
| 11 | `src/engine/commands.ts` | travel adjacency check removed (S1-R13) | 2 | yes |
| 12 | `src/engine/rewards.ts` | a 0% drop entry skips its draw (one draw per entry, rng.md) | 2 | yes |
| 13 | `src/model/content.ts` | zones ordered by ID instead of by order (no entity-ID advantage) | 3 | yes |
| 14 | `src/engine/estimator.ts` | estimator ignores the walk overlapping the swing cooldown | 1 | yes |

These Vitest results come from this machine (Node 24.22.3, Windows); they have not been independently re-run. The reviewer can re-run them with `npm ci` and the commands in §11.

**First mutation run (kept as `mutation-check-run1.txt`):**
- 13 of 14 planted bugs were detected.
- Bug #12 ("a 0% drop entry skips its draw") caused 0 failures. The one-draw-per-entry rule was only tested with 0% and 100% entries, where a skipped draw is invisible.
- **Fix:** a draw-alignment fixture (`s1.rewards.draw-alignment.001`, filled by `s1_oracle.py`) and a unit test re-deriving the draws were added.
- **Re-run:** all 14 detected (table above). Several bugs are caught by a single test, so those rules have thin but present coverage.

## 6. Pre-registration
- **What was registered.** All eight manifests and `manifests/s1/PREREGISTRATION.md` were written and hashed into `manifests/s1/preregistration.json` before any S1 experiment or benchmark ran. That document covers hypotheses, gates, the S1-E01 winner rule, the H-S1-09 "named factor" rule and the benchmark budgets.
- **Enforcement.** `npm run exp` refuses an unregistered or changed manifest.
- **Why there is no Git order.** The owner said not to commit S1 before review, so the evidence is the hash register plus every run's start time, which is later than its registration. Every manifest can be checked against the register.
- **Registered:** 2026-11-13T18:16:28Z. Document SHA-256 `2ececaa560edda586f09ecf9d09f745a3af67bec991b53ce37042414b0e60689`.
- **One amendment.** It was registered before it ran, and is explained in `AMENDMENT-01.md`. S1-E06 under-sampled (fewer than 100,000 kills per zone) and shared seeds across zones. S1-E06b repeats it with a larger, independent sample under the same gate, and S1-E06 is reported unchanged.
- **Policy definition change.** One policy definition was changed after an engineering smoke run and **before** registration: POL-FRONTIER's survival criterion (S1-R16), recorded in `S1_RESOLUTIONS.md`.
- **Targets.** No target or pass range was changed after any result.

| Experiment | Manifest SHA-256 | Registered | Run started (environment.json) |
|---|---|---|---|
| S1-E01-calibration | `607ab4c4b33c133d…` | 2026-11-13T18:16:28Z | 2026-11-13T18:18:44.860Z |
| S1-E02-estimator | `43b88b4363d02c3f…` | 2026-11-13T18:16:28Z | 2026-11-13T18:17:59.308Z |
| S1-E03-earlier-zone-audit | `4bd7068129aecb39…` | 2026-11-13T18:16:28Z | 2026-11-13T18:23:42.503Z |
| S1-E04-survival | `6641a45f1ad79be9…` | 2026-11-13T18:16:28Z | 2026-11-13T18:21:42.259Z |
| S1-E05-gate-pacing | `070e8fd2231be90f…` | 2026-11-13T18:16:28Z | 2026-11-13T18:24:00.967Z |
| S1-E06-drop-correctness | `d2992ce562322cfe…` | 2026-11-13T18:16:28Z | 2026-11-13T18:16:42.981Z |
| S1-E07-determinism | `028bb7c3f50b7480…` | 2026-11-13T18:16:28Z | 2026-11-13T18:22:20.137Z |
| S1-E08-policy-bound | `0161ae21700c7bee…` | 2026-11-13T18:16:28Z | 2026-11-13T18:22:46.859Z |
| S1-E06-drop-correctness-b (amendment 01) | `d3e94a0d52b6e9ad…` | 2026-11-13T18:17:40Z | 2026-11-13T18:17:42.910Z |

## 7. Experiment results
Each experiment's full report, quantile CSV, semantic result, fingerprint and environment record are in `evidence/s1/experiments/<id>/`. Every number below is generated from those files.

### S1-E01 calibration (23,200 runs: 29 variants × 2 profiles × 2 policies × 200 replicates)
| ID | Hypothesis | Role | Pre-registered target | Pass | Miss | Not reached | Cells |
|---|---|---|---|---|---|---|---|
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | 116 | 0 | 0 | 116 |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | 112 | 4 | 0 | 116 |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | 116 | 0 | 0 | 116 |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | 116 | 0 | 0 | 116 |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | 80 | 0 | 36 | 116 |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | 80 | 36 | 0 | 116 |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | 82 | 0 | 34 | 116 |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | 52 | 64 | 0 | 116 |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | 56 | 60 | 0 | 116 |

**Base candidate.** p10/p50/p90 are near-identical across replicates. The only random inputs that move progression are 5% crits, because drops do not affect progression in S1.

| Cell (base candidate a10-p1.6-g100) | First kill s p90 | Kills to L2 p50 | Min to L5 p50 | Min to L10 p50 | Zone 2 first visit min p50 | Zone 3 first visit min p50 | TTK zone 1 / 2 / 3 at first visit, s p50 | Deaths/h p50 |
|---|---|---|---|---|---|---|---|---|
| PR-NEW / POL-FRONTIER | 10.40 | 3 | 2.45 | 14.16 | 5.08 | 38.14 | 2.40 / 4.80 / 6 | 0 |
| PR-NEW / POL-STAY | 10.40 | 3 | 2.45 | 14.03 | 5.08 | 16.30 | 2.40 / 4.80 / 9.60 | 36 |
| PR-BAL / POL-FRONTIER | 10.40 | 3 | 2.45 | 14.16 | 5.08 | 38.14 | 2.40 / 4.80 / 6 | 0 |
| PR-BAL / POL-STAY | 10.40 | 3 | 2.45 | 14.03 | 5.08 | 16.30 | 2.40 / 4.80 / 9.60 | 36 |

**S1-E01 winner (pre-registered rule, PR-BAL / POL-FRONTIER):**
- **8 of the 27 swept variants** ("pass 1"; the two slime-EXP check variants are excluded) tie on score 6/6 with distance 0: a10-p1.6-g100, a10-p1.6-g150, a12-p1.6-g100, a12-p1.6-g150, a8-p1.6-g100, a8-p1.6-g150, a8-p1.8-g100, a8-p1.8-g150.
- The ID tie-break selects **a10-p1.6-g100**, the base candidate. The next row scores 5/6.
- It is reported as the closest swept candidate, not promoted. The ranking was recomputed independently from `semantic.json` while assembling this document, and it matches `analysis-e01.txt`.

**Diagnostic H-S1-07a (level 5 in 3–5 min) and the trade-off it exposes:**
- The base candidate reaches level 5 at about 2.45 min, earlier than the range. The M1 plan's hand arithmetic predicted this.
- Of the swept variants, 12 land L5 inside 3–5 min at PR-BAL / POL-FRONTIER: a10-p1.8-g100, a10-p1.8-g150, a10-p1.8-g60, a10-p2.0-g100, a10-p2.0-g150, a10-p2.0-g60, a12-p1.8-g100, a12-p1.8-g150, a12-p1.8-g60, a12-p2.0-g100, a12-p2.0-g150, a12-p2.0-g60.
- **None of them are among the tied leaders.** With these slower curves, POL-FRONTIER reaches zone 3 at the very end of the 60-minute session or not at all.
  - H-S1-04 is therefore not reached in 12 of the 12, and H-S1-06 in 10.
  - Under these candidate inputs, the level-5 diagnostic and the zone 3 timing targets pull in opposite directions. No swept variant satisfies both.

**Other misses and "not reached" cells:**
- **H-S1-05** (zone 2 first visit in 5–10 min) misses in 36 cells. All are the g60 variants (9): a10-p1.6-g60, a10-p1.8-g60, a10-p2.0-g60, a12-p1.6-g60, a12-p1.8-g60, a12-p2.0-g60, a8-p1.6-g60, a8-p1.8-g60, a8-p2.0-g60.
  - Zone 2 is first visited at 3.26–3.42 min, **before** the 5-minute floor, because the 60-kill zone 1 gate opens it early.
  - Every 100- and 150-kill variant passes.
- **H-S1-02** (level 2 after 1–3 kills) misses only in the slime-EXP check variant a10-p1.6-g100-x3: 4 kills to level 2, in all 4 of its cells.
- **H-S1-04 and H-S1-06 "not reached"** (36 and 34 cells): every one is POL-FRONTIER, mostly with the steeper p1.8 and p2.0 curves.
  - The hero arrives in zone 3 too late in the session to record a zone 3 kill, or never arrives.
  - POL-STAY reaches zone 3 in 58 of its 58 cells.

### S1-E02 estimator vs stepper (9 cells × 200 replicates, fixed frozen levels; diagnostic set-up)
| ID | Hypothesis | Role | Pre-registered target | Pass | Miss | Not reached | Cells |
|---|---|---|---|---|---|---|---|
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | 5 | 3 | 1 | 9 |
| H-S1-08a | Overgeared earlier enemies become trivial: at hero damage >= zone 1 HP, TTK = 0 s (first swing) | target | p50 == 0 s | 1 | 0 | 0 | 1 |
| H-S1-08b | Overgeared earlier enemies become trivial: hits-to-kill = 1 | target | mean == 1 swings | 1 | 0 | 0 | 1 |

| Cell | Estimate kills/h (estimate) | Simulated mean kills/h (model-output) | Error | Within ±5% | Simulated deaths/h p50 | Auto-farm stops p50 |
|---|---|---|---|---|---|---|
| base|L1-Z1 | 906.1 | 898.3 | 0.87% | yes | 13 | 0 |
| base|L1-Z2 | 284.9 | 265.3 | 7.37% | no | 61 | 59 |
| base|L1-Z3 | 65.2 | 0 | undefined (simulated 0) | no | 124 | 122 |
| base|L5-Z1 | 1,363.6 | 1,360.6 | 0.23% | yes | 0 | 0 |
| base|L5-Z2 | 516.0 | 509.6 | 1.25% | yes | 34 | 32 |
| base|L5-Z3 | 149.4 | 91.5 | 63.28% | no | 88 | 86 |
| base|L10-Z1 | 2,400 | 2,395 | 0.21% | yes | 0 | 0 |
| base|L10-Z2 | 859.5 | 849 | 1.23% | yes | 19 | 0 |
| base|L10-Z3 | 233.4 | 204.6 | 14.08% | no | 68 | 66 |

**H-S1-09 under the pre-registered "named factor" rule (PREREGISTRATION §5):**
- **Within ±5%** (errors 0.2–1.3%):
  - the 4 cells where the estimator says attack speed limits the rate (L1-Z1, L5-Z1, L10-Z1, L10-Z2);
  - L5-Z2, which it flags as survival-limited but where the hero still manages about 15 kills per life.
- **Outside ±5%:** L1-Z2, L10-Z3, L5-Z3, L1-Z3.
  - All are flagged by the estimator itself as **survival**-limited, with about 5.0, 3.7, 1.9, 0.7 kills per life respectively.
  - In other words, the estimate holds until the hero manages only about 5 or fewer kills per life.
- **Named factor: the survival renewal approximation.**
  - The estimator divides max HP by the expected damage per kill and treats fractional kills per life as real.
  - In the stepper, a death mid-fight loses the whole fight, because the enemy is freed at full HP (S1-R07). Repeated deaths also stop auto-farm (D-03), which the estimator does not model.
- **The cell numbers show it:**
  - **L5-Z3:** about 1.9 kills per life by the renewal formula; simulated 86 auto-farm stops per hour against 88 deaths per hour.
  - **L1-Z3:** the hero cannot finish one goblin within a life, so the simulated rate is 0 and the error is undefined, while the estimator shows 65 kills/h.
- **Verdict:** these cells are **explained misses**. The estimator is accurate for steady, survivable farming and over-optimistic where survival dominates. That limits its use as a displayed rate in dangerous zones (R07.16).
- **H-S1-08:** passes. At level 10 the hero's attack equals the slime's 15 HP: 1 hit, 0 s TTK.

### S1-E03 earlier-zone audit (200 replicates, PR-OPT / POL-STAY, matched state, 15-minute forks)
| At first visit of | Time min p50 | Hero level p50 | Zone | Fork EXP/h p50 (model-output, 15-min fork) | Estimate EXP/h (estimate) | Fork deaths in 15 min p50 |
|---|---|---|---|---|---|---|
| zone 2 | 5.08 | 6 | 1 | 6,448 | 5,455 | 0 |
| zone 2 | 5.08 | 6 | 2 | 7,160 | 5,214 | 6 |
| zone 3 | 16.29 | 10 | 1 | 9,088 | 9,600 | 0 |
| zone 3 | 16.29 | 10 | 2 | 8,400 | 8,595 | 4 |
| zone 3 | 16.29 | 10 | 3 | 5,984 | 5,135 | 13 |

| At first visit of zone | Replicates | Earlier zone beats newest (fork) | Earlier zone beats newest (estimate) | Estimate and fork agree | Tag |
|---|---|---|---|---|---|
| 2 | 200 | 0% | 100% | 0% | HYPOTHESIS |
| 3 | 200 | 100% | 100% | 100% | CONFIRMED IN MODEL |

**H-S1-10 (reported, no pass/fail):**
- **At the zone 2 first visit:** the newest zone is better (forks: zone 2 about 7,160 against zone 1 about 6,450 EXP/h). The estimate disagrees, being pessimistic about zone 2 survival, so the result is tagged HYPOTHESIS.
- **At the zone 3 first visit (16 min, level 10):** both earlier zones beat zone 3 in every replicate, and zone 1 is best because one-hit kills give about 9,100 EXP/h. Estimate and fork agree: CONFIRMED IN MODEL.
- **Red flag (experiment plan 9.1):** with these candidate inputs, the newest zone (3) is never worth entering for EXP at its first visit. Neither the best realistic policy nor the oracle chooses zone 3 within 60 minutes (§8).

### S1-E04 survival sensitivity (12 variants × 2 policies × 200 replicates, PR-BAL)
| Enemy damage × / hero HP per level × | POL-STAY deaths/h p50 | POL-STAY auto-farm stops p50 | POL-STAY level at 60 min p50 | POL-FRONTIER deaths/h p50 | POL-FRONTIER zone 3 first visit min p50 |
|---|---|---|---|---|---|
| 0.5 / 0.75 | 24 | 21 | 19 | 0 | 36.45 |
| 0.5 / 1 | 21 | 12 | 19 | 0 | 36.30 |
| 0.5 / 1.25 | 18 | 7 | 19 | 0 | 36.28 |
| 1 / 0.75 | 42 | 40 | 18 | 0 | 38.45 |
| 1 / 1 | 36 | 34 | 18 | 0 | 38.12 |
| 1 / 1.25 | 32 | 29 | 18 | 0 | 37.78 |
| 1.5 / 0.75 | 61 | 59 | 17 | 0 | not reached |
| 1.5 / 1 | 53 | 51 | 17 | 0 | not reached |
| 1.5 / 1.25 | 47 | 45 | 17 | 0 | 54.89 |
| 2 / 0.75 | 79 | 77 | 16 | 0 | not reached |
| 2 / 1 | 70 | 68 | 16 | 0 | not reached |
| 2 / 1.25 | 62 | 60 | 17 | 0 | not reached |

**Reported, with no target registered:**
- **POL-STAY** keeps auto-farming wherever the newest zone is, and dies often once in zone 3: 18–79 deaths/h across the sweep. Almost every death past the third in a window triggers the D-03 auto-farm stop, which this policy simply re-enables.
- **POL-FRONTIER** never dies in any variant. It rests below 30% HP and waits for the displayed kills-per-life criterion. At enemy damage ×1.5–2 it often never reaches zone 3 within 60 min.
- **What drives it:** survival is set mainly by enemy damage. Changing HP per level by ±25% shifts POL-STAY deaths/h by only 11–17%.

### S1-E05 gate pacing (81 variants × 2 policies × 200 replicates, PR-OPT 90 min)
- **H-S1-06 overall:** 143 pass, 1 miss, 18 not reached, of 162 cells.
- **Misses:** a8-p1.6-g150-z80|PR-OPT|POL-STAY (ratio 0.95).
- **Not reached:** the hero did not first-visit zone 3 within 90 min.

**S1-E01 winner rows:**

| Cell | Ratio (zone 2→3) / (zone 1→2), p50 | Outcome |
|---|---|---|
| a10-p1.6-g100-z80|PR-OPT|POL-STAY | 1.57 | pass |
| a10-p1.6-g100-z80|PR-OPT|POL-FRONTIER | 6.51 | pass |
| a10-p1.6-g100-z120|PR-OPT|POL-STAY | 2.21 | pass |
| a10-p1.6-g100-z120|PR-OPT|POL-FRONTIER | 6.51 | pass |
| a10-p1.6-g100-z180|PR-OPT|POL-STAY | 3.03 | pass |
| a10-p1.6-g100-z180|PR-OPT|POL-FRONTIER | 6.51 | pass |

POL-FRONTIER's ratio does not depend on the zone 2 gate size. It waits until its displayed criteria allow zone 3, which happens after the gate is long complete, so the gate size is not the binding constraint for that policy.

### S1-E06 and S1-E06b drop correctness — see §5. S1-E07 determinism — see §5.

## 8. Realistic policies against the oracle (S1-E08)
| Policy | Tag | Total EXP p10 / p50 / p90 | Level at 60 min p50 | Zone 3 first visit min p50 | Deaths/h p50 | Kills/h p50 |
|---|---|---|---|---|---|---|
| POL-FRONTIER | model-output (realistic) | 8,178 / 8,200 / 8,244 | 19 | 38.12 | 0 | 694 |
| POL-STAY | model-output (realistic) | 6,990 / 7,034 / 7,100 | 18 | 16.28 | 36 | 467 |
| POL-BEST-SHOWN | model-output (realistic) | 9,280 / 9,320 / 9,380 | 20 | not reached (reached in 0 of 200 runs) | 4 | 1,790 |
| ORC-BRUTE | model-output (oracle) | 8,840 / 8,880 / 8,928 | 20 | not reached (reached in 0 of 200 runs) | 13 | 952 |

| Oracle / realistic (mean total EXP) | Ratio |
|---|---|
| ORC-BRUTE / POL-FRONTIER | 1.082 |
| ORC-BRUTE / POL-STAY | 1.261 |
| ORC-BRUTE / POL-BEST-SHOWN | 0.952 |

**Finding: the pre-registered ORC-BRUTE is not an upper bound.**
- POL-BEST-SHOWN, a realistic policy, earns more total EXP than ORC-BRUTE (ratio below 1).
- **Why:** ORC-BRUTE re-decides only at session start, at gate completions and every 5 minutes, and its lookahead forks farm one fixed zone to the session end. It therefore cannot exploit level-by-level zone switching, which POL-BEST-SHOWN does at every level-up.
- This is reported as found. The S1-E08 ratios against POL-FRONTIER and POL-STAY are lower bounds on the true realistic-to-optimal gap, not the gap itself.
- **Proposal (not implemented, needs approval):** a stronger oracle for S2, re-deciding at level-ups and using greedy rollouts.

## 9. Ledger benchmark (owner §7)
**Environment:** v24.22.3, win32 x64, 16 CPUs (AMD Ryzen 7 7800X3D 8-Core Processor). Measurements only; nothing is projected.

"Timed out" is the tool's label for any run that went over budget (owner §7: "timed out or unsuitable"). The stop reason recorded for that run is shown beside it. The latency and heap for a stopped run cover only the part it reached.
**Budgets** (pre-registered): 120 s and 2 GiB per run; up to 5 runs or 600 s per stage. Larger workloads are not run once a smaller one exceeds the budget.

**Production ledger (copy-on-commit; the correctness reference):**
| Workload | Workers × hours | Transactions | Status | Runs | Median time | Throughput (median tx/s) | Latency median / p99 at 10% → 50% → 100% of the workload (µs) | Heap at the last measured point (MB) | Replay lookup median (µs) | State size (canonical JSON) |
|---|---|---|---|---|---|---|---|---|---|---|
| W-small | 1 × 24 h | 2,880 | measured | 5 | 0.3 s | 9,685 | 12 / 154 → 82 / 1,219 → 160 / 556 | 12.0 | 4.1 | 0.2 MB |
| W-day | 10 × 24 h | 28,800 | measured | 5 | 36.0 s | 800 | 75 / 572 → 839 / 2,539 → 2,175 / 4,431 | 21.2 | 3.8 | 2.2 MB |
| W-week | 10 × 168 h | 201,600 | timed out (over budget) at 50,000 transactions; stopped by the wall-clock budget (120 s) | 1 | stopped at 122 s | 411 (partial) | 708 / 3,070 (only up to 10% was reached) | 18.4 at 10% | 3.8 | 3.9 MB |
| W-legion | — | 1,008,000 | not run: W-week already exceeded the budget | 0 | — | — | — | — | — | — |
| W-month | — | 4,320,000 | not run: W-week already exceeded the budget | 0 | — | — | — | — | — | — |

**Prototype (persistent hash trie; benchmark-only, not the production ledger):**
| Workload | Workers × hours | Transactions | Status | Runs | Median time | Throughput (median tx/s) | Latency median / p99 at 10% → 50% → 100% of the workload (µs) | Heap at the last measured point (MB) | Replay lookup median (µs) | State size (canonical JSON) |
|---|---|---|---|---|---|---|---|---|---|---|
| W-small | 1 × 24 h | 2,880 | measured | 5 | 0.0 s | 81,088 | 8 / 51 → 5 / 44 → 6 / 43 | 12.5 | 3.8 | — |
| W-day | 10 × 24 h | 28,800 | measured | 5 | 0.3 s | 108,761 | 5 / 30 → 5 / 31 → 5 / 30 | 26.8 | 3.0 | — |
| W-week | 10 × 168 h | 201,600 | measured | 5 | 1.6 s | 122,529 | 4 / 24 → 4 / 14 → 5 / 32 | 122.7 | 4.5 | — |
| W-legion | 50 × 168 h | 1,008,000 | measured | 5 | 8.9 s | 113,768 | 4 / 26 → 5 / 30 → 5 / 29 | 568.5 | 4.4 | — |
| W-month | 50 × 720 h | 4,320,000 | timed out (over budget) at 2,915,500 transactions; stopped by the heap budget (2 GiB) | 1 | stopped at 26 s | 112,335 (partial) | 4 / 27 → 5 / 27 (only up to 50% was reached) | 1,240.4 at 50% | 3.6 | — |

**Prototype equivalence:** 28,800 transactions, with replays and conflicts.
- Result mismatches against the production ledger: 0.
- Final balances equal: yes.
- Committed counts equal: yes.

**Effect on realistic S1 runtime** (measured: an S1 run's own kill-reward transactions replayed through a fresh production ledger; median of 3):

| Session | Kill transactions | Whole simulation | Ledger alone | Ledger share |
|---|---|---|---|---|
| 60 min, POL-FRONTIER | 696 | 42 ms | 16 ms | 37.7% |
| 600 min, POL-FRONTIER | 8,663 | 3,058 ms | 2,852 ms | 93.3% |

**Recommendation (owner decision; no change made):**
- **Suitable for S1.** The copy-on-commit ledger is fine for S1-sized runs: single sessions of at most 90 minutes, under about 2,000 transactions.
- **Not suitable beyond that.** Its per-transaction latency grows linearly with history, and a run grows quadratically.
  - The day-scale workload already costs over 30 s.
  - The week-scale workload exceeded the 120 s budget (see its row).
  - So it is **not suitable** for S5 offline settlement, 30-day S6 runs or realistic legion sizes.
- **The investigated alternative:**
  - The persistent-map prototype handled W-small to W-legion (about 1 million transactions) within the time budget, with near-flat latency (see its rows).
  - It matched the production ledger exactly on the equivalence workload, and it keeps old ledger values valid, so oracle branching stays cheap.
  - **It still exceeded the 2 GiB heap budget on W-month** (stopped at 2,915,500 of 4,320,000 transactions; see its row). Storing every committed transaction's payload hash and result forever does not scale to month-long, 50-worker runs either.
  - So month-scale simulation needs both structural sharing (time) and a bounded or compacted committed-ID history (memory). The bounded history is the M6 retention-window item.
- **Proposal:**
  - adopt a structurally shared committed index before S5, after owner approval;
  - design the committed-ID retention window (M6), with an explicit outcome for replays older than the window, before any month-scale run;
  - keep the current ledger as the correctness reference;
  - require the four properties of `S1_LEDGER_BENCHMARK_PROPOSAL.md` §5;
  - keep the identity rule.

## 10. Missed targets, red flags and limitations
**Balance targets missed or not reached.** These are reported and never moved, and a miss does not block acceptance (principle 9).
- **H-S1-07a (diagnostic):** level 5 arrives at about 2.45 min with the base candidate, before the 3–5 min range.
  - 12 swept variants with steeper curves bring it into range.
  - Each of them then fails a zone 3 timing target under POL-FRONTIER, so no swept variant satisfies both (§7).
- **H-S1-05:** misses only with the 60-kill zone 1 gate, where zone 2 opens at about 3.3 min, too early. The base candidate passes at about 5.1 min.
- **H-S1-02:** misses only in the slime-EXP-3 check variant (4 kills to level 2).
- **H-S1-04 and H-S1-06:** "not reached" only for POL-FRONTIER, which arrives in zone 3 late in the session or never.
- **H-S1-09:** 3 estimator cells miss by more than ±5%, and in a fourth (L1-Z3) the simulated hero gets no kills at all.
  - All 4 are survival-limited, with about 5 or fewer kills per life, and explained by a named factor (§7).
  - The estimator is not reliable for dangerous zones.

**Red flags for the owner** (experiment plan 9.1 and principle 4):
1. **Zone 3 is never worth entering for EXP at its first visit** (S1-E03). In S1-E08, the EXP-maximising realistic policy (POL-BEST-SHOWN) and the oracle never enter zone 3 (0 of 200 runs each). Only the policies that follow the unlock go there. The causes:
   - goblins hit hard relative to level-10 HP;
   - there is no regeneration while farming (S1-R11);
   - one-hit slime kills make zone 1 very efficient at level 10.

   R08.05 allows earlier zones to win, but "never worth entering" is the case the plan flags. The candidate levers are zone 3 damage and EXP, level-up healing (S1-R10), out-of-combat regeneration (S1-R11) and the slime's overkill efficiency.
2. **POL-STAY dies about 36 times per hour in zone 3** with the base candidate, with an auto-farm stop at nearly every death past the third in a window. A player who simply follows the unlock would experience this.
3. **ORC-BRUTE is not an upper bound** (§8).

**Limitations of the S1 model and evidence:**
- **Diagnostic only.** A single classless hero, with no recruits, gear, abilities, sinks, offline progress, Monuments, elites, accuracy requirements above 0, hero evasion or party play. Early pacing will change in S2–S4.
- **Unresolved rules.** 17 rules (S1-R01 … R17) are proposed candidates awaiting the owner. Each changes specific results, listed in `S1_RESOLUTIONS.md`.
- **Uncertain physical inputs.** Walk and engage times are the most uncertain inputs and are measured only in M2.
- **Low variance.** Results vary very little across seeds (5% crit is the only random progression input), so p10/p50/p90 are often equal. The replicates show robustness to crit luck, not to player variation.
- **Same author.** The oracles and fixtures were written by the same author as the lab, in a different language with different methods. Reviewers should spot-check `s1_oracle.py` against `s1-combat-loop.md`.
- **Not independently re-run.** The Vitest suite and the experiments have not been re-run by an independent party. Cross-platform reproduction is untested for S1.
- **Timings are machine-specific.** Benchmark timings come from one machine and are environment measurements.

## 11. Reproduction
```
cd legion-progression-lab
npm ci
npm run typecheck && npm test && npm run test:stats && npm run fixtures:check && npm run schemas:check && npm run oracle:check
npm run curve:preview          # twice; S0-R01 fingerprint unchanged
mkdir -p results/s1 && cp -r evidence/s1/experiments/S1-E* results/s1/   # fresh copy only: results/ is not in Git
npm run exp:verify -- manifests/s1/S1-E01-calibration.json      # likewise for every manifest in manifests/s1/
node src/cli/s1-traces.ts      # regenerate the traces
npm run bench:ledger           # staged benchmark (about 15 minutes on 16 cores)
```
| Experiment | Runs | Semantic fingerprint | `exp:verify` |
|---|---|---|---|
| S1-E01-calibration | 23,200 | `6c940a2cf5479d4b8b500eab847bb29e8da56251af9e34e61121fd0e18dda4d2` | MATCH |
| S1-E02-estimator | 1,800 | `dbf62290ba76c800e51e9f269f920ae79ed445b4e7b2ff3ee347902b9c7673ae` | MATCH |
| S1-E03-earlier-zone-audit | 200 | `f231bbf2cffb42bf3cc6fff801380b14db6bf0b5bf2eef7c5c5659a75422be7d` | MATCH |
| S1-E04-survival | 4,800 | `2eabbe1899e88ec9077620684adb35e285535cd0f512818da3f4e71a36302e46` | MATCH |
| S1-E05-gate-pacing | 32,400 | `c963e86f416f11dd72e893e224afb5e75fae5caa8f18ee06aed36ab5eec98e0e` | MATCH |
| S1-E06-drop-correctness | 150 | `b91e47e564b3e6cc336c080e26ef2e2334f3fbf436c6c391580cd78a9afc17b6` | MATCH |
| S1-E07-determinism | 800 | `9be940d7d7421210a4efb8248e2d5649203194f900964a68ce7440b42eee478b` | MATCH |
| S1-E08-policy-bound | 800 | `834208a76516056c19cb703e011dba5dc15eb4a32eedacda0900385cf22dde74` | MATCH |
| S1-E06-drop-correctness-b | 300 | `2d073232d8cb72f490f9eec7f8eec82b5f961c8d86990b4a9db45e0a55532388` | MATCH |

## 12. Repository state
- **Branch:** `main`. HEAD is the S0 checkpoint `ad11a508fd715b08705c5ee72f215f92183f0993` (tag `s0-checkpoint`). **S1 is uncommitted**, as instructed, and not pushed (the remote is public).
- **Changes since the checkpoint** (`git-status.txt`):
  - **17 tracked files modified:** changelog, README, provenance, package scripts, attack quantisation in `combat.ts` and `combat.md`, two new error codes, the fixture format and runner, the purity and conformance tests, the spec index, `combat.v2.json` (fixture version 3), the oracles and the exported fixture schema.
  - **145 untracked files:**
    - 62 S1 additions: model, engine, policies, experiments, CLI tools, S1 content and sweep tables, manifests, S1 specs, fixtures and oracle, tests, and `planning/S1_RESOLUTIONS.md`;
    - 80 files of S1 evidence (`evidence/s1/`);
    - the 3-file S0 checkpoint record (`evidence/s0-checkpoint/`). It records the checkpoint's own commit ID, so it could not be part of that commit.
- **Full diff:** `s1.patch` (79 file diffs: the 17 modified files against the checkpoint, plus the 62 new files outside `evidence/`).
- **Untouched outside the repository** (`frozen-check.txt`):
  - the frozen simulator: 3,012 files, combined fingerprint `1275f219…ce64d`, HEAD `74499ef`, 12 Original v1 files;
  - the Original v1 archive: `master` `74499ef`, `archive/increment6-original-v1` `8d80a44`, no remotes;
  - the old Legion workspace: 16 files.

---

# Appendices: complete outputs

Verbatim content of each named file in `evidence/s1/` (local paths redacted).

## Appendix A. Type check (`typecheck.txt`)

```text
$ npm run typecheck


> legion-progression-lab@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


[exit code: 0]
```

## Appendix B. Default test suite, verbose (`test-output.txt`)

```text
$ npx vitest run --config vitest.config.ts --reporter=verbose


 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/stats.test.ts > stat stacking > adds within a category and multiplies across categories 2ms
 ✓ test/stats.test.ts > stat stacking > the breakdown reproduces the applied value exactly 41ms
 ✓ test/stats.test.ts > stat stacking > source order does not change the result 0ms
 ✓ test/stats.test.ts > stat stacking > inactive categories are neutral; unknown or duplicate entries are refused 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > S0 review reproduction: an active factor of exactly 1 preserves 2^53 - 1 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > neutral factors are an exact identity for any base, any number of them, in any position 58ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > matches exact BigInt arithmetic for any valid inputs 108ms
 ✓ test/xp.property.test.ts > EXP award properties > two awards in sequence equal one combined award (multi-level awards are unambiguous) 138ms
 ✓ test/canonicalJson.test.ts > canonical JSON > sorts keys and removes whitespace 2ms
 ✓ test/canonicalJson.test.ts > canonical JSON > is independent of key insertion order 109ms
 ✓ test/combat.test.ts > hit chance > is 1 without a requirement and 90% at the requirement (candidate curve) 2ms
 ✓ test/combat.test.ts > hit chance > is monotonic non-decreasing in accuracy and stays inside [floor, 1] 81ms
 ✓ test/combat.test.ts > hit chance > refuses inconsistent curves 0ms
 ✓ test/combat.test.ts > mitigation, crit and damage > mitigation is diminishing and never reaches zero 85ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > addSafe: exact result, or NUMERIC_LIMIT exactly when out of range 75ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulSafe: exact result, or NUMERIC_LIMIT exactly when out of range 118ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > G1: any partition of the steps gives the same total and remainder 104ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/s0-core.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 3ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp-sweep.index.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/w1-slice.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 2ms
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
 ✓ test/isolation.test.ts > isolation of the Legion lab > package.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench/hamtLedger.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench-ledger.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-sweep.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-table.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/curve-preview.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp-worker.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/export-schemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/fixtures-check.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/paths.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-analyse.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-content.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-traces.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/arrays.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/labels.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/schema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/validate.ts stays inside the lab and never references the frozen baseline 5ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/errors.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/combat.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/stats.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/xp.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/hash/canonicalJson.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/ledger.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/basisPoints.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/remainder.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/rounding.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/safeInt.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/sample.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/streamId.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/xoshiro128ss.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/commands.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/estimator.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/observation.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/queue.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/rewards.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/simulation.ts stays inside the lab and never references the frozen baseline 26ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/jobs.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/manifest.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/metrics.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/patch.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/report.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/stats.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/summary.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/content.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/types.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/oracle.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/realistic.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/report/curvePreview.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/exportedSchemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureRunner.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureSchema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/s1Fixtures.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/canonicalJson.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/combat.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/content.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/fixtures.conformance.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/fixtures.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/reference.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/s1.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/isolation.test.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.property.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.test.ts stays inside the lab and never references the frozen baseline 3ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/purity.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.property.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/rng.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/runtime.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.determinism.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.events.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.experiments.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.gates.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/schemaDrift.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/rng.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/s1.drops.distribution.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats.test.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > tsconfig.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.stats.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/canonicalJson.test.ts > canonical JSON > formats numbers exactly as ECMAScript does (and -0 as 0) 77ms
 ✓ test/canonicalJson.test.ts > canonical JSON > refuses values that have no unambiguous canonical form 1ms
 ✓ test/xp.property.test.ts > EXP award properties > total EXP is conserved: thresholds consumed + leftover = award 116ms
 ✓ test/combat.test.ts > mitigation, crit and damage > crit chance may reach exactly 100%; the excess is reported, not applied (R-A2) 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > damage per landed hit is an integer, rounds exact halves up, and has a floor 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > hits-to-kill never increases when damage increases (breakpoints are exact) 116ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > divRem is exact for every non-negative safe dividend 134ms
 ✓ test/remainder.test.ts > exact remainder accumulator > splitting an interval never changes the total or the remainder (G1) 3ms
 ✓ test/remainder.test.ts > exact remainder accumulator > a zero-duration interval changes nothing (G2) 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > per-hour chain: one hour at 1.5 units/hour, split three different ways 3ms
 ✓ test/remainder.test.ts > exact remainder accumulator > settling every millisecond equals settling once (no gain from frequent rejoining) 368ms
 ✓ test/remainder.test.ts > exact remainder accumulator > persisted remainders survive a save/load round trip and complete later units 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > assignment switching: separate keys never leak into each other 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > large balances: results near 2^53 are exact and beyond it are refused 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > refuses invalid parameters 1ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > S0 review reproduction: 2 h at rate 2^53 - 1 in one call equals two 1 h calls 1ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > the largest representable grant succeeds in one call and in parts; one more millisecond is refused 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > a full state plus the largest grant still fits exactly 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > refuses malformed states before doing any arithmetic 0ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > balances are never negative and always equal the sum of committed nets (conservation) 316ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > replaying every transaction again changes nothing (no repeated claims) 128ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > W2 hooks from the candidate content pack stay neutral, however large their sources 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > never returns NaN or Infinity: every result is finite and inside [0, 2^53 - 1], or the call is refused 419ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses out-of-range partial and final values (S0 returned Infinity and NaN for these) 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > applies categories in ascending id order, whatever order they are listed in 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses sparse, missing or malformed entries with INVALID_CONTENT 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > covers every S0 and S1 family with unique case IDs, boundary and failure cases, and derivations 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.keys.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nested.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.numbers.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.strings.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.infinity.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.key-ascii.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.basic.001 (normal) 27ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.both-die.001 (boundary) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.retaliation-at-death.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.hero-dies.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.mitigation.001 (normal) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.min-damage.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit-half.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.session-end.001 (boundary) 15ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.instant-attack.001 (boundary) 6ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-walk.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.slow-hero.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-attack.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-hp.001 (failure) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-below-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.below-half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.large-den.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.min-damage.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.huge-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.overflow.002 (failure) 10ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.not-safe.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-ratio.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-crit-flag.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.bad-k.001 (failure) 6ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > one call matches the BigInt reference for any state, rate and duration; NUMERIC_LIMIT exactly when the grant is unsafe 353ms
 ✓ test/rng.test.ts > stream identity > is injective: different field tuples never share an encoding 60ms
 ✓ test/rng.test.ts > stream identity > refuses empty, oversized, ill-formed or badly counted identities 1ms
 ✓ test/rng.test.ts > stream identity > never yields the all-zero state, and applies the fallback rule exactly 8ms
 ✓ test/rng.test.ts > generator and sampling > replays exactly: the same stream gives the same sequence 15ms
 ✓ test/rng.test.ts > generator and sampling > produces unsigned 32-bit integers and never reaches the zero state 381ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > starts in zone 1 (visited, checkpoint known); other zones have every flag off 32ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a kill gate unlocks access only; the visit and checkpoint come from arriving, at the same arrival 40ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > flag invariants hold after every event: visited implies access; checkpoint implies visited 261ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > one award matches unbounded integer arithmetic (no NUMERIC_LIMIT is ever needed) 392ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.valid.001 (normal) 5ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.range-edge.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-hash.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.out-of-range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.duplicate-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.hit-floor.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.table-length.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unknown-field.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unlabelled.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-id.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-locked.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-ok.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-far.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-here.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-unknown.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.no-session.001 (failure) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-done.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-wrong-zone.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-unknown.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-busy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.rest-in-boss.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.end-session.001 (normal) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.inf.001 (failure) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.001 (normal) 12ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.negative.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.002 (normal) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.tiny.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.persisted.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.large.001 (boundary) 4ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-granted.001 (boundary) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.utf8.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.empty.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.surrogate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.state.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.first-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.second-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.all-zero.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a0.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a1.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.b0.001 (normal) 0ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.d6.001 (normal) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.candidate.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.geometric.001 (normal) 1ms
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
 ✓ test/rng.test.ts > generator and sampling > Bernoulli always consumes exactly one draw, including p = 0 and p = 1 11ms
 ✓ test/rng.test.ts > generator and sampling > computes thresholds exactly and refuses unrepresentable probabilities 1ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt stays inside [lo, hi] and reports how many draws it used 106ms
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
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null at every entry point 1ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses the all-zero state at every entry point (S0 accepted it in nextU32, bernoulli and uniformInt) 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > validates the state before other arguments 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > a caller mutating a returned state cannot smuggle the zero state in 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > stateFromDigest accepts only a 32-byte Uint8Array 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > valid states are unaffected: a hand-derived step is unchanged 0ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > refuses travel and teleport that break the rules, with the documented reason codes 7ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a rejected command changes nothing: the run is identical to one that never sent it 73ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > teleport to a discovered checkpoint takes teleportMs and is free 16ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > opens after the zone 3 kill gate count and is cleared inside the timer; the clear is credited once 4ms
 ✓ test/s1.experiments.test.ts > summary statistics > quantiles are nearest-rank observed values; "not reached" sorts above every number 3ms
 ✓ test/s1.experiments.test.ts > summary statistics > the exact binomial interval covers at least 99.9% and is tight 18ms
 ✓ test/s1.experiments.test.ts > summary statistics > KS: identical samples do not differ; shifted samples do 1ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > a campaign job is deterministic and reports the named metrics 292ms
 ✓ test/purity.test.ts > purity of the deterministic core > finds the pure modules 3ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/arrays.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/labels.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/schema.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/validate.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/errors.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/combat.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/stats.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/xp.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/hash/canonicalJson.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/ledger.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/basisPoints.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/remainder.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/rounding.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/safeInt.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/sample.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/streamId.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/xoshiro128ss.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/exportedSchemas.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureRunner.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureSchema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/s1Fixtures.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/report/curvePreview.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/content.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/types.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/commands.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/estimator.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/observation.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/queue.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/rewards.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/simulation.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/oracle.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/realistic.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/jobs.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/manifest.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/metrics.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/patch.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/report.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/stats.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/summary.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/ledger.test.ts > ledger > aggregates lines per bucket before validating 4ms
 ✓ test/ledger.test.ts > ledger > is atomic: a failing line changes nothing, and the input ledger is never mutated 1ms
 ✓ test/ledger.test.ts > ledger > replays an identical transaction without applying it twice 0ms
 ✓ test/ledger.test.ts > ledger > identical payloads replay regardless of object key order (canonical hashing) 0ms
 ✓ test/ledger.test.ts > ledger > refuses the same txId with a different payload 0ms
 ✓ test/ledger.test.ts > ledger > a failed transaction is not recorded and can succeed later 0ms
 ✓ test/ledger.test.ts > ledger > refuses overflow, including overflow while aggregating 0ms
 ✓ test/ledger.test.ts > ledger > refuses malformed transactions 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > S0 review reproduction: mutating a returned receipt cannot change the replay receipt 1ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > committed history cannot be cleared or rewritten through the returned ledger (S0 allowed a double grant) 1ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > balances cannot be overwritten through the returned ledger 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > every reachable object is frozen, including replay receipts 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > only ledgers made by emptyLedger or applyTx are accepted 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > refuses sparse or malformed line lists with INVALID_TX (S0 raised INVALID_JSON_VALUE) 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > values stay readable: entries can be read, iterated and copied 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > S0.1 review reproduction: mixing the balances of one genuine ledger with the history of another is refused 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > frozen shallow copies of genuine ledgers are refused, as are maps forged through the map constructor 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > every earlier genuine ledger is an independent branch starting point 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > replay and conflict detection follow each branch’s own history 1ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > the timer is half-open: a lethal hit exactly at the timer is too late 3ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > death in the boss fight fails it with no loss; the gate stays open for a retry 2ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > auto-farm never starts the boss, and StartBoss is refused while auto-farm is on 114ms
 ✓ test/xp.test.ts > XP table > builds the candidate table (values independently confirmed by xp_oracle.py) 2ms
 ✓ test/xp.test.ts > XP table > is non-decreasing with every threshold >= 1 0ms
 ✓ test/xp.test.ts > XP table > refuses invalid curves, empty tables and unsafe thresholds 0ms
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
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > S0 review reproduction: 100 * 1.005 = 100.5 rounds up to 101 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > exact halves through mitigation ratios that binary64 cannot represent round up 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > values just below a half round down, even one part in 10^12 below 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > matches exact integer arithmetic for any valid input; NUMERIC_LIMIT exactly when the result is unsafe 652ms
 ✓ test/numeric.test.ts > safe integers > adds up to the limit and refuses one past it 2ms
 ✓ test/numeric.test.ts > safe integers > refuses non-integers, NaN, Infinity and unsafe inputs 0ms
 ✓ test/numeric.test.ts > safe integers > normalises -0 to +0 0ms
 ✓ test/numeric.test.ts > safe integers > checks intermediate products, not only final results 0ms
 ✓ test/numeric.test.ts > safe integers > divides exactly near 2^53 where floating division rounds 1ms
 ✓ test/numeric.test.ts > roundHalfUp > fixes both failure cases of floor(x + 0.5) 0ms
 ✓ test/numeric.test.ts > roundHalfUp > rounds halves up, including negatives 0ms
 ✓ test/numeric.test.ts > roundHalfUp > refuses non-finite input and results beyond the safe range 0ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > baseline timeline: first kill at 8,000 + 2 x 1,200 = 10,400 ms; first swing lands on arrival (next pass) 38ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > simultaneous lethal blows: both die, the kill is still credited, the hero respawns without loss 6ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > retaliation at the moment the enemy dies lands, and the enemy still dies 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > hero death cancels the pending swing (stale) and frees the enemy at full HP 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > stale events from a previous encounter never reach the next one 9ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > respawn: with one slot the hero waits, then engages a new instance with a new ID 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > target invalidation: travelling away during the walk frees the reserved enemy and cancels the arrival 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > identical timestamps resolve in phase order: kill, credit, level-up, recompute, next engagement, policy 8ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > a multi-level award emits one LevelUp per level in order; stats apply to the next swing; HP rises by the max-HP gain 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > kill rewards are credited exactly once per kill, with one ledger transaction per kill 563ms
 ✓ test/content.test.ts > S0 content pack > validates, and its recorded table hash matches the artifact 15ms
 ✓ test/content.test.ts > S0 content pack > detects a tampered table 2ms
 ✓ test/content.test.ts > S0 content pack > every numeric value in the pack is labelled candidate (nothing is approved yet) 0ms
 ✓ test/content.test.ts > S0 content pack > a derived value is never stronger than its weakest input 0ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > session boundary: a lethal swing exactly at the session end is not resolved; one ms later it is 5ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > nothing happens between sessions; the next session re-engages with the entry walk; time adds up 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > an idle hero with no commands does nothing and earns nothing 2ms
 ✓ test/s1.events.test.ts > kill reward draws (s1-combat-loop.md section 10) > every drop entry uses exactly one draw, even at 0%, so later entries stay aligned 3ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G1: any partition of a duration gives the same total and state, for rates up to 2^53 - 1 423ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > roundHalfUp equals exact floor(x + 1/2) for any finite double in the safe range 83ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulDivRem: exact quotient and remainder for any safe inputs, NUMERIC_LIMIT exactly when the quotient is unsafe (S0.1) 587ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > applies mitigation first, so no intermediate overflows when the result fits 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > is monotonic: more raw damage, a larger crit multiplier or less defence never lowers damage 60ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > mitigationRatio is exact and agrees with the display factor 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > refuses malformed damage inputs 0ms
 ✓ test/runtime.test.ts > pinned runtime > runs on the pinned Node 24 LTS version 2ms
 ✓ test/runtime.test.ts > pinned runtime > package.json pins exact dependency versions and the engine 1ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/fixture.schema.json matches the zod source 2ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/content-pack-s0.schema.json matches the zod source 1ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/xp-table.schema.json matches the zod source 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G3: a timeline of rate changes, each segment split arbitrarily, equals the exact integral 91ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > settling at any cadence equals settling once, from any persisted state (save/load round trip included) 38ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > any split of an award gives the same final state and the same ordered level-ups 488ms
 ✓ test/s1.determinism.test.ts > determinism > the same inputs give the same event log hash and metrics; another seed gives a different log 968ms
 ✓ test/s1.determinism.test.ts > determinism > a fork continues exactly like the original run 116ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-STAY: identical event log after mapping IDs back 132ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > pre-registered hypotheses are evaluated exactly as written, and the semantic result fingerprints stably 6ms
 ✓ test/s1.experiments.test.ts > ORC-BRUTE (oracle upper bound) > is deterministic and never earns less EXP than staying in zone 1 for the whole session 870ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-FRONTIER: identical event log after mapping IDs back 154ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-BEST-SHOWN: identical event log after mapping IDs back 347ms
 ✓ test/s1.determinism.test.ts > rate estimator > the swing distribution is a probability distribution and exact when nothing is random 0ms
 ✓ test/s1.determinism.test.ts > rate estimator > equals the stepper exactly where it should: no crits, no retaliation, no spawn limit 87ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies import nothing but model types 1ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > the observation exposes no RNG state, queue, ledger internals or enemy instance timers 3ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies never receive the engine handle 2ms

 Test Files  22 passed (22)
      Tests  626 passed (626)
   Start at  18:57:27
   Duration  2.78s (transform 2.32s, setup 0ms, import 5.57s, tests 11.00s, environment 3ms)


[exit code: 0]
```

## Appendix C. Statistical tests (`test-stats-output.txt`)

```text
$ npx vitest run --config vitest.stats.config.ts --reporter=verbose


 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > high and low bytes of nextU32 are uniform (chi-square, 256 buckets) 112ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 5000 bp has the correct success rate (binomial interval) 202ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 100 bp has the correct success rate (binomial interval) 187ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 20 bp has the correct success rate (binomial interval) 164ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt(1, 6) is unbiased (chi-square, df = 5) 173ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-a) 2479ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt with span 2^31 + 1 rejects about half of all draws, and stays unbiased across halves 82ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > streams with adjacent counters are not correlated (chi-square on paired top bits, df = 3) 2197ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-b) 2628ms

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  18:57:37
   Duration  5.48s (transform 98ms, setup 0ms, import 262ms, tests 8.23s, environment 0ms)


[exit code: 0]
```

## Appendix D. Fixture conformance (`fixtures-check.txt`)

```text
$ node src/cli/fixtures-check.ts

| Family | File | Cases | Normal | Boundary | Failure | Passed |
|---|---|---|---|---|---|---|
| canonical-json | spec/fixtures/canonical-json.v1.json | 7 | 2 | 2 | 3 | 7 |
| combat-loop | spec/fixtures/combat-loop.v1.json | 14 | 5 | 7 | 2 | 14 |
| combat | spec/fixtures/combat.v2.json | 59 | 13 | 28 | 18 | 59 |
| content | spec/fixtures/content.v1.json | 10 | 1 | 1 | 8 | 10 |
| gates | spec/fixtures/gates.v1.json | 25 | 4 | 3 | 18 | 25 |
| ledger | spec/fixtures/ledger.v1.json | 15 | 2 | 4 | 9 | 15 |
| numeric | spec/fixtures/numeric.v1.json | 40 | 6 | 20 | 14 | 40 |
| remainder | spec/fixtures/remainder.v2.json | 33 | 9 | 12 | 12 | 33 |
| rewards | spec/fixtures/rewards.v1.json | 5 | 1 | 3 | 1 | 5 |
| rng | spec/fixtures/rng.v1.json | 46 | 11 | 15 | 20 | 46 |
| stats | spec/fixtures/stats.v2.json | 20 | 3 | 6 | 11 | 20 |
| xp | spec/fixtures/xp.v2.json | 30 | 6 | 10 | 14 | 30 |
total cases: 304; problems: 0

[exit code: 0]
```

## Appendix E. Schema check (`schemas-check.txt`)

```text
$ node src/cli/export-schemas.ts --check

OK    spec/schema/fixture.schema.json
OK    spec/schema/content-pack-s0.schema.json
OK    spec/schema/xp-table.schema.json

[exit code: 0]
```

## Appendix F. Independent oracles (`oracle-check.txt`)

```text
$ python -I spec/oracle/check_all.py

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
s1_oracle gates: 25 cases checked, 0 mismatches (<REPO>\spec\fixtures\gates.v1.json)
s1_oracle rewards: 5 cases checked, 0 mismatches (<REPO>\spec\fixtures\rewards.v1.json)
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
== S1 families
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
oracle summary: 15 groups, 0 failing

[exit code: 0]
```

## Appendix G. Experiment re-verification (exp:verify) (`exp-verify.txt`)

```text
S1-E01-calibration: stored 6c940a2cf5479d4b8b500eab847bb29e8da56251af9e34e61121fd0e18dda4d2
S1-E01-calibration: rerun  6c940a2cf5479d4b8b500eab847bb29e8da56251af9e34e61121fd0e18dda4d2
S1-E01-calibration: MATCH (137307 ms, 15 workers)
S1-E02-estimator: stored dbf62290ba76c800e51e9f269f920ae79ed445b4e7b2ff3ee347902b9c7673ae
S1-E02-estimator: rerun  dbf62290ba76c800e51e9f269f920ae79ed445b4e7b2ff3ee347902b9c7673ae
S1-E02-estimator: MATCH (18572 ms, 15 workers)
S1-E03-earlier-zone-audit: stored f231bbf2cffb42bf3cc6fff801380b14db6bf0b5bf2eef7c5c5659a75422be7d
S1-E03-earlier-zone-audit: rerun  f231bbf2cffb42bf3cc6fff801380b14db6bf0b5bf2eef7c5c5659a75422be7d
S1-E03-earlier-zone-audit: MATCH (3276 ms, 15 workers)
S1-E04-survival: stored 2eabbe1899e88ec9077620684adb35e285535cd0f512818da3f4e71a36302e46
S1-E04-survival: rerun  2eabbe1899e88ec9077620684adb35e285535cd0f512818da3f4e71a36302e46
S1-E04-survival: MATCH (35082 ms, 15 workers)
S1-E05-gate-pacing: stored c963e86f416f11dd72e893e224afb5e75fae5caa8f18ee06aed36ab5eec98e0e
S1-E05-gate-pacing: rerun  c963e86f416f11dd72e893e224afb5e75fae5caa8f18ee06aed36ab5eec98e0e
S1-E05-gate-pacing: MATCH (329896 ms, 15 workers)
S1-E06-drop-correctness: stored b91e47e564b3e6cc336c080e26ef2e2334f3fbf436c6c391580cd78a9afc17b6
S1-E06-drop-correctness: rerun  b91e47e564b3e6cc336c080e26ef2e2334f3fbf436c6c391580cd78a9afc17b6
S1-E06-drop-correctness: MATCH (2458 ms, 15 workers)
S1-E06-drop-correctness-b: stored 2d073232d8cb72f490f9eec7f8eec82b5f961c8d86990b4a9db45e0a55532388
S1-E06-drop-correctness-b: rerun  2d073232d8cb72f490f9eec7f8eec82b5f961c8d86990b4a9db45e0a55532388
S1-E06-drop-correctness-b: MATCH (8996 ms, 15 workers)
S1-E07-determinism: stored 9be940d7d7421210a4efb8248e2d5649203194f900964a68ce7440b42eee478b
S1-E07-determinism: rerun  9be940d7d7421210a4efb8248e2d5649203194f900964a68ce7440b42eee478b
S1-E07-determinism: MATCH (18882 ms, 15 workers)
S1-E08-policy-bound: stored 834208a76516056c19cb703e011dba5dc15eb4a32eedacda0900385cf22dde74
S1-E08-policy-bound: rerun  834208a76516056c19cb703e011dba5dc15eb4a32eedacda0900385cf22dde74
S1-E08-policy-bound: MATCH (52663 ms, 15 workers)
```

## Appendix H. S1 negative controls (mutation check) (`mutation-check.txt`)

```text
S1 negative controls (mutation check): each row plants one deliberate bug in a critical S1 rule, runs the default suite, then restores the file (SHA-256 verified).
Unmutated suite: 626 total, 0 failed.

| # | File | Planted bug (rule it breaks) | Tests failed | Restored, hash identical |
|---|---|---|---|---|
| 1 | `src/engine/simulation.ts` | sequential instead of simultaneous blows: a dying enemy no longer retaliates (9.3 rule 1) | 5 | yes |
| 2 | `src/engine/simulation.ts` | events of closed encounters are no longer discarded (9.3 rule 2) | 28 | yes |
| 3 | `src/engine/simulation.ts` | events from an old hero epoch are no longer discarded (9.3 rule 2) | 12 | yes |
| 4 | `src/engine/simulation.ts` | session end processed with the attacks (COMPLETE) instead of before them (9.3 rule 3) | 1 | yes |
| 5 | `src/engine/simulation.ts` | each kill counted twice towards the zone gate (credit once, 9.3 rule 6) | 1 | yes |
| 6 | `src/engine/simulation.ts` | swing cooldown ignored: first swing always on arrival (S1-R03) | 2 | yes |
| 7 | `src/engine/simulation.ts` | kill gate also grants the visit and checkpoint (D-01 separate flags) | 1 | yes |
| 8 | `src/engine/simulation.ts` | stats recomputed after the next engagement starts (phase order 9.2) | 1 | yes |
| 9 | `src/engine/simulation.ts` | level-up fully heals instead of adding the max-HP gain (S1-R10) | 1 | yes |
| 10 | `src/engine/commands.ts` | active-only check removed: StartBoss allowed while auto-farming (D-01, R10.03) | 2 | yes |
| 11 | `src/engine/commands.ts` | travel adjacency check removed (S1-R13) | 2 | yes |
| 12 | `src/engine/rewards.ts` | a 0% drop entry skips its draw (one draw per entry, rng.md) | 2 | yes |
| 13 | `src/model/content.ts` | zones ordered by ID instead of by order (no entity-ID advantage) | 3 | yes |
| 14 | `src/engine/estimator.ts` | estimator ignores the walk overlapping the swing cooldown | 1 | yes |

A count above 0 means the suite detected the planted bug.
```

## Appendix I. S0-R01 curve preview reproduction (`curve-preview-reproduction.txt`)

```text
S0-R01 semantic.json identical across both runs: yes
S0-R01 semantic.json identical to S0 evidence: yes
S0-R01 semantic fingerprint: 24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9
```

## Appendix J. S1-E01 analysis (`analysis-e01.txt`)

```text
H-S1-01 (target): pass 116, miss 0, not reached 0 of 116 cells
H-S1-02 (target): pass 112, miss 4, not reached 0 of 116 cells
H-S1-03a (target): pass 116, miss 0, not reached 0 of 116 cells
H-S1-03b (target): pass 116, miss 0, not reached 0 of 116 cells
H-S1-04 (target): pass 80, miss 0, not reached 36 of 116 cells
H-S1-05 (target): pass 80, miss 36, not reached 0 of 116 cells
H-S1-06 (target): pass 82, miss 0, not reached 34 of 116 cells
H-S1-07a (diagnostic): pass 52, miss 64, not reached 0 of 116 cells
H-S1-07b (diagnostic): pass 56, miss 60, not reached 0 of 116 cells

Base candidate a10-p1.6-g100:
  PR-NEW POL-FRONTIER: firstKillS 10.4/10.4/10.4 | killsToL2 3/3/3 | minToL5 2.4283333333333332/2.4483333333333333/2.4683333333333333 | minToL10 14.06/14.16/14.26 | z2visit 5.0216666666666665/5.081666666666667/5.121666666666667 | z3visit 37.97833333333333/38.138333333333335/38.278333333333336 | ttkZ1 2.4/2.4/2.4 | ttkZ2 4.8/4.8/4.8 | ttkZ3 6/6/6 | deaths/h 0/0/0
  PR-NEW POL-STAY: firstKillS 10.4/10.4/10.4 | killsToL2 3/3/3 | minToL5 2.4283333333333332/2.4483333333333333/2.4683333333333333 | minToL10 13.916666666666666/14.031666666666666/14.141666666666667 | z2visit 5.0216666666666665/5.081666666666667/5.121666666666667 | z3visit 16.186666666666667/16.301666666666666/16.411666666666665 | ttkZ1 2.4/2.4/2.4 | ttkZ2 4.8/4.8/4.8 | ttkZ3 9.6/9.6/9.6 | deaths/h 36/36/36
  PR-BAL POL-FRONTIER: firstKillS 10.4/10.4/10.4 | killsToL2 3/3/3 | minToL5 2.4283333333333332/2.4483333333333333/2.4683333333333333 | minToL10 14.06/14.16/14.26 | z2visit 5.0216666666666665/5.081666666666667/5.121666666666667 | z3visit 37.97833333333333/38.138333333333335/38.278333333333336 | ttkZ1 2.4/2.4/2.4 | ttkZ2 4.8/4.8/4.8 | ttkZ3 6/6/6 | deaths/h 0/0/0
  PR-BAL POL-STAY: firstKillS 10.4/10.4/10.4 | killsToL2 3/3/3 | minToL5 2.4283333333333332/2.4483333333333333/2.4683333333333333 | minToL10 13.916666666666666/14.031666666666666/14.141666666666667 | z2visit 5.0216666666666665/5.081666666666667/5.121666666666667 | z3visit 16.186666666666667/16.301666666666666/16.411666666666665 | ttkZ1 2.4/2.4/2.4 | ttkZ2 4.8/4.8/4.8 | ttkZ3 9.6/9.6/9.6 | deaths/h 36/36/36

Winner rule (PREREGISTRATION.md section 4), top 8 of 27:
  a10-p1.6-g100: score 6/6, distance 0
  a10-p1.6-g150: score 6/6, distance 0
  a12-p1.6-g100: score 6/6, distance 0
  a12-p1.6-g150: score 6/6, distance 0
  a8-p1.6-g100: score 6/6, distance 0
  a8-p1.6-g150: score 6/6, distance 0
  a8-p1.8-g100: score 6/6, distance 0
  a8-p1.8-g150: score 6/6, distance 0
```

## Appendix K. S1-E05 analysis (`analysis-e05.txt`)

```text
H-S1-06 overall: pass 143, miss 1, not reached 18 of 162
E01 winner: a10-p1.6-g100
  a10-p1.6-g100-z80|PR-OPT|POL-STAY: ratio p50 1.5652892561983471 -> pass
  a10-p1.6-g100-z80|PR-OPT|POL-FRONTIER: ratio p50 6.514981890023049 -> pass
  a10-p1.6-g100-z120|PR-OPT|POL-STAY: ratio p50 2.2121705174096973 -> pass
  a10-p1.6-g100-z120|PR-OPT|POL-FRONTIER: ratio p50 6.514981890023049 -> pass
  a10-p1.6-g100-z180|PR-OPT|POL-STAY: ratio p50 3.0287487749101603 -> pass
  a10-p1.6-g100-z180|PR-OPT|POL-FRONTIER: ratio p50 6.514981890023049 -> pass
```

## Appendix L. Frozen simulator and archive check (`frozen-check.txt`)

```text
Frozen simulator, Original v1 archive and old workspace check after S1 (2026-11-13T18:58:07Z)
Frozen workspace files: 3012 (M0: 3012)
path/size/mtime list vs M0 start: IDENTICAL
content SHA-256 list vs M0 start: IDENTICAL
combined fingerprint: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d (M0: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d)
frozen HEAD: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; Original v1 working files: 12 (M0: 12)
archive master 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; archive/increment6-original-v1 8d80a440d9818c961713b767f696764b3f18db66; remotes 0
old Legion workspace: 16 files IDENTICAL to the copy-time hashes
All git reads used GIT_OPTIONAL_LOCKS=0; nothing was written to these locations.
```

## Appendix M. Git status (`git-status.txt`)

```text
$ git log --oneline
ad11a50 S0 checkpoint: S0 + S0.1 hardening + final ledger identity correction
0209d93 M0 resolution and review corrections (v1.1); repository verification; Rojo 7.7.1
3aced25 M0 import: design pack v1.0, M0 planning documents (as reviewed), Rojo starter

$ git tag -n1
s0-checkpoint   S0 checkpoint (S0 + S0.1 + final ledger correction), accepted by the owner after independent review. Local only; not pushed.

$ git status --porcelain=v1 --untracked-files=all
 M legion-progression-lab/CHANGELOG.md
 M legion-progression-lab/PROVENANCE.md
 M legion-progression-lab/README.md
 M legion-progression-lab/package.json
 M legion-progression-lab/src/core/content/validate.ts
 M legion-progression-lab/src/core/errors.ts
 M legion-progression-lab/src/core/formulas/combat.ts
 M legion-progression-lab/src/spec/fixtureRunner.ts
 M legion-progression-lab/src/spec/fixtureSchema.ts
 M legion-progression-lab/test/fixtures.conformance.test.ts
 M legion-progression-lab/test/purity.test.ts
 M spec/README.md
 M spec/fixtures/combat.v2.json
 M spec/formulas/combat.md
 M spec/oracle/check_all.py
 M spec/oracle/exact_oracle.py
 M spec/schema/fixture.schema.json
?? legion-progression-lab/content/tables/xp-sweep.index.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a10-p1.6.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a10-p1.8.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a10-p2.0.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a12-p1.6.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a12-p1.8.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a12-p2.0.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a8-p1.6.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a8-p1.8.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a8-p2.0.v0.1.0.json
?? legion-progression-lab/content/w1-slice.candidate.v0.1.0.json
?? legion-progression-lab/evidence/s0-checkpoint/CHECKPOINT.md
?? legion-progression-lab/evidence/s0-checkpoint/checkpoint.diffstat.txt
?? legion-progression-lab/evidence/s0-checkpoint/checkpoint.patch
?? legion-progression-lab/evidence/s1/S1_EVIDENCE.md
?? legion-progression-lab/evidence/s1/analysis-e01.txt
?? legion-progression-lab/evidence/s1/analysis-e05.txt
?? legion-progression-lab/evidence/s1/curve-preview-reproduction.txt
?? legion-progression-lab/evidence/s1/curve-preview-run1.txt
?? legion-progression-lab/evidence/s1/curve-preview-run2.txt
?? legion-progression-lab/evidence/s1/exp-verify.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/semantic.json
?? legion-progression-lab/evidence/s1/experiments/ledger-benchmark/benchmark.json
?? legion-progression-lab/evidence/s1/fixtures-check.txt
?? legion-progression-lab/evidence/s1/frozen-check.txt
?? legion-progression-lab/evidence/s1/git-status-summary.txt
?? legion-progression-lab/evidence/s1/git-status.txt
?? legion-progression-lab/evidence/s1/mutation-check-run1.txt
?? legion-progression-lab/evidence/s1/mutation-check.txt
?? legion-progression-lab/evidence/s1/oracle-check.txt
?? legion-progression-lab/evidence/s1/s1.patch
?? legion-progression-lab/evidence/s1/schemas-check.txt
?? legion-progression-lab/evidence/s1/test-output.txt
?? legion-progression-lab/evidence/s1/test-results.json
?? legion-progression-lab/evidence/s1/test-stats-output.txt
?? legion-progression-lab/evidence/s1/tool-versions.txt
?? legion-progression-lab/evidence/s1/traces/01-simultaneous-lethal.jsonl
?? legion-progression-lab/evidence/s1/traces/02-retaliation-at-death.jsonl
?? legion-progression-lab/evidence/s1/traces/03-death-cancels-swing.jsonl
?? legion-progression-lab/evidence/s1/traces/04-session-boundary.jsonl
?? legion-progression-lab/evidence/s1/traces/05-multi-level-up.jsonl
?? legion-progression-lab/evidence/s1/traces/06-target-invalidation.jsonl
?? legion-progression-lab/evidence/s1/traces/07-boss-timer-half-open.jsonl
?? legion-progression-lab/evidence/s1/traces/08-base-POL-FRONTIER-opening.jsonl
?? legion-progression-lab/evidence/s1/typecheck.txt
?? legion-progression-lab/manifests/s1/AMENDMENT-01.md
?? legion-progression-lab/manifests/s1/PREREGISTRATION.md
?? legion-progression-lab/manifests/s1/S1-E01-calibration.json
?? legion-progression-lab/manifests/s1/S1-E02-estimator.json
?? legion-progression-lab/manifests/s1/S1-E03-earlier-zone-audit.json
?? legion-progression-lab/manifests/s1/S1-E04-survival.json
?? legion-progression-lab/manifests/s1/S1-E05-gate-pacing.json
?? legion-progression-lab/manifests/s1/S1-E06-drop-correctness-b.json
?? legion-progression-lab/manifests/s1/S1-E06-drop-correctness.json
?? legion-progression-lab/manifests/s1/S1-E07-determinism.json
?? legion-progression-lab/manifests/s1/S1-E08-policy-bound.json
?? legion-progression-lab/manifests/s1/preregistration.json
?? legion-progression-lab/planning/S1_RESOLUTIONS.md
?? legion-progression-lab/src/cli/bench-ledger.ts
?? legion-progression-lab/src/cli/bench/hamtLedger.ts
?? legion-progression-lab/src/cli/build-xp-sweep.ts
?? legion-progression-lab/src/cli/exp-worker.ts
?? legion-progression-lab/src/cli/exp.ts
?? legion-progression-lab/src/cli/s1-analyse.ts
?? legion-progression-lab/src/cli/s1-content.ts
?? legion-progression-lab/src/cli/s1-traces.ts
?? legion-progression-lab/src/engine/commands.ts
?? legion-progression-lab/src/engine/estimator.ts
?? legion-progression-lab/src/engine/observation.ts
?? legion-progression-lab/src/engine/queue.ts
?? legion-progression-lab/src/engine/rewards.ts
?? legion-progression-lab/src/engine/simulation.ts
?? legion-progression-lab/src/experiments/jobs.ts
?? legion-progression-lab/src/experiments/manifest.ts
?? legion-progression-lab/src/experiments/metrics.ts
?? legion-progression-lab/src/experiments/patch.ts
?? legion-progression-lab/src/experiments/report.ts
?? legion-progression-lab/src/experiments/stats.ts
?? legion-progression-lab/src/experiments/summary.ts
?? legion-progression-lab/src/model/content.ts
?? legion-progression-lab/src/model/types.ts
?? legion-progression-lab/src/policy/oracle.ts
?? legion-progression-lab/src/policy/realistic.ts
?? legion-progression-lab/src/spec/s1Fixtures.ts
?? legion-progression-lab/test/helpers/s1.ts
?? legion-progression-lab/test/s1.determinism.test.ts
?? legion-progression-lab/test/s1.events.test.ts
?? legion-progression-lab/test/s1.experiments.test.ts
?? legion-progression-lab/test/s1.gates.test.ts
?? legion-progression-lab/test/stats/s1.drops.distribution.test.ts
?? spec/fixtures/combat-loop.v1.json
?? spec/fixtures/gates.v1.json
?? spec/fixtures/rewards.v1.json
?? spec/formulas/gates.md
?? spec/formulas/s1-combat-loop.md
?? spec/oracle/s1_oracle.py

$ git diff --stat ad11a508fd715b08705c5ee72f215f92183f0993
 legion-progression-lab/CHANGELOG.md                |  86 +++++++++
 legion-progression-lab/PROVENANCE.md               |   7 +-
 legion-progression-lab/README.md                   |  16 +-
 legion-progression-lab/package.json                |   6 +-
 .../src/core/content/validate.ts                   |   4 +-
 legion-progression-lab/src/core/errors.ts          |   3 +
 legion-progression-lab/src/core/formulas/combat.ts |  15 ++
 legion-progression-lab/src/spec/fixtureRunner.ts   |  16 +-
 legion-progression-lab/src/spec/fixtureSchema.ts   |   4 +-
 .../test/fixtures.conformance.test.ts              |   4 +-
 legion-progression-lab/test/purity.test.ts         |   5 +-
 spec/README.md                                     |   6 +-
 spec/fixtures/combat.v2.json                       | 213 ++++++++++++++++++++-
 spec/formulas/combat.md                            |  47 ++++-
 spec/oracle/check_all.py                           |   6 +
 spec/oracle/exact_oracle.py                        |   7 +
 spec/schema/fixture.schema.json                    |  11 +-
 17 files changed, 428 insertions(+), 28 deletions(-)
```

## Appendix N. Tool versions (`tool-versions.txt`)

```text
Captured: 2026-11-13T18:57:16Z
node v24.22.3
npm 11.19.1
typescript Version 7.0.2
vitest vitest/4.1.12 win32-x64 node-v24.22.3
zod 4.6.7
fast-check 4.10.2
Python 3.12.9
git version 2.53.0.windows.1
OS: MINGW64_NT-10.0-26300 3.6.6-1cdd4371.x86_64 x86_64
CPUs: 16
package-lock.json sha256: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6 (unchanged from S0: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6)
```
