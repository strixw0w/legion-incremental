# S2 evidence — from a single hero to a legion

**Increment:** S2, authorised by the owner's "S1.1 Acceptance and S2 Authorisation" (§6–§12), after the S1 checkpoint and the L1 ledger gates.

**Date:** 2026-11-13.

**Status:**
- **Uncommitted.** S2 (and L1) await independent review and owner acceptance. S2 is not committed as an approved checkpoint.
- **Not pushed.** The GitHub remote is public.
- **S3 not started.** Old workspaces not deleted.

**Labels:**
- Every S2 number is a candidate (`content/w1-slice-s2.candidate.v0.2.0.json`); the S1 content and EXP curve are unchanged.
- Every result is model output from candidate inputs. Nothing is live-validated or approved. No coefficient is promoted.
- ORC2-SEARCH uses hindsight and reports the best feasible outcome found within its budget: **never a proven optimum, never an upper bound.**
- Everything here was run on this machine (Windows, Node 24.22.3). **No independent verification of S2 or L1 has happened yet.**

**Engineering gates:** **All engineering gates pass.** (873 default tests, 9 statistical tests, 340 fixture cases, 16 oracle groups, 20 planted S2 bugs, 10 experiments MATCH, B0 and B1 pass.)

---

## 1. Checkpoint and prerequisites
- **S1 checkpoint:** commit `a7d8476a322b5ededd841c6389b67a944499849f`, tag `s1-checkpoint` (tag object `92fa8a446f623332225312d989c87270b964838f`), tree `4150c5a19bcce051c00e3c7bbf89e41cef09a331`; S1 + S1.1 with the owner resolutions (`planning/S1_1_OWNER_RESOLUTIONS.md`) and the acceptance addendum (`planning/S1_1_ACCEPTANCE_ADDENDUM.md`; estimator v1.2, impossible victory). Evidence: `evidence/s1-checkpoint/`, `evidence/s1.1-addendum/`. Not pushed.
- **L1 ledger:** `evidence/l1/L1_REPORT.md`. Gates G1–G4 pass (differential 1,000,000 operations with 0 mismatches; gameplay regression 7 of 7 MATCH; 12 of 12 planted bugs detected; W-day 116.6 × faster than the reference, flat latency). The lab default ledger stays `reference`; S2 experiments use the persistent ledger, as pre-registered, and are cross-checked on the reference (§5).

## 2. What S2 contains (scope as authorised)
Specification `planning/S2_SPECIFICATION.md` v1.0; candidate rules `planning/S2_RESOLUTIONS.md` v1.0 (S2-R01 … R20, **proposed, awaiting the owner**); formal rules for the oracle `spec/formulas/s2-legion.md` v1.

| Area | Implementation |
|---|---|
| Stable identities | `hero`, `rec:<n>` in acquisition order (never reused), `rare:<key>`; random streams keyed by identity |
| Roster | Quest Q1 (40 zone-1 kills) grants `rec:1`, slot 1 and deploy cap 1; slots 2 and 3 and caps 2 and 3 at zone 2 and 3 access; recruits bought for 150 / 400 gold in one ledger transaction; non-productive reserve; rare heroes: identity, unique grant, duplicate → shard, reserve when slots are full, never an extra slot |
| Classes and progression | Warrior / Archer / Mage; hero class from level 5; first choice free, later 100 gold; individual levels, EXP and attributes; per-character mastery per class (only the held class gains); per-character and account class records, tracked and **not applied**; talents (1 point per level, 2 per class), respec with a 60 s cooldown for the current class only; level, EXP and HP fraction kept on a class change |
| Abilities | One per class; recruits cast automatically; the hero only by command (attentive policies) |
| Squad combat | Every member on its own interval; simultaneous resolution; threat order (Warriors, then the hero, then others); individual HP; knockouts, recovery after 20 s or at the end of the encounter, immediately at the hero's respawn; damage contribution per character |
| Workers | Independent numerical fight streams with their own encounter IDs (`w:<id>:<n>`) and hit, crit and loot streams; recovery 30 s; 3 knockouts in 5 min stop the worker with a reason; stop at session end, resume at session start |
| Exclusive assignments | squad / worker / idle / reserve, one at a time; per-character epochs make old work stale; switching never credits a cancelled fight |
| Credit | One atomic operation per accepted claim: one reward roll on the stream's own loot generator; the enemy's full EXP to every eligible character; mastery to the held class; zone kill and quest once; identity committed. Duplicate, conflicting and unknown claims change nothing |
| Estimators | Worker: estimator v1.2 on the worker's own stats; squad: estimator s2.0, labelled approximate, assumptions exposed, structural impossibility distinguished from no hit chance and from unsafe |
| Policies | Realistic POL2 (observation only), S1.1 recovery rules generalised (S1.1-R01: a block also lifts after a squad capability change); single-hero S1.1 policies kept as controls; ORC2-SEARCH bounded hindsight search |
| Time categories | automation, manual combat, resting, travelling, waiting, idle, offline; connected time and elapsed calendar time. None is called "active player input" |

Out of scope and not built: gathering, Smithing, equipment, Monuments, Bestiary, Feats, account class bonuses, research, offline progress, advanced classes, full W1, final bosses, monetisation, Roblox, dashboard.

## 3. Engineering gates (pre-registration §5; these decide acceptance)
| Gate | Check | Result | Detail |
|---|---|---|---|
| 1 | Type check | **pass** | `tsc --noEmit`, strict |
| 1 | Default tests | **873 / 873 pass** | includes 48 S2 tests and the A0 equivalence tests |
| 1 | Statistical tests | **9 / 9 pass** | unchanged S1 statistical suite |
| 1 | Fixtures | **340 cases, 0 problems** | 14 new S2 cases (squad-fight 7, legion-credit 7) |
| 1 | Independent oracles | **16 groups, 0 failing** | new S2 group: squad fights and multi-character credit |
| 1 | Schemas | **3 / 3 in sync** | fixture schema gains two family names |
| 2 | B0 control A0 | **PASS** | 148 summaries, 0 differ; identical event logs in 4 / 4 cells |
| 2 | B1 invariants | **PASS** | 14,050 runs, 751,927,546 checks, 0 violations; 148 / 148 engineering hypotheses pass |
| 3 | Determinism | **pass** | re-run identical true, fingerprint identical true, second seed root differs in 600/600 runs, KS rejections 0/78; re-run identical true, fingerprint identical true, second seed root differs in 1200/1200 runs, KS rejections 0/216 (S2-E05, S2-E01) |
| 4 | Mutation checks | **20 / 20 detected (run 1: 18 / 20)** | multi-character credit, eligibility, exclusivity, mastery, knockouts, workers, commands, estimator, policy; files restored: True. L1: 12 / 12 |
| 5 | exp2 --verify | **10 / 10 MATCH** | every S2 experiment re-run on the persistent ledger |
| 5 | Reference-ledger cross-check | **10 / 10 MATCH** | one cell per experiment re-run on the reference ledger |
| 6 | Frozen simulator, archive, old workspaces | **unchanged** | combined fingerprint 1275f219…ce64d (M0 value) |

- **Mutation runs:** run 1 found two gaps (EXP divided only in the level arithmetic; the generalised zone-block rule untested); the monitor and tests were strengthened (`mutation-check-run1.txt`). Run 2 detected 20 of 20 (`mutation-check-run2.txt`). The credit's per-character award was then extracted into one shared function (used by the engine and the fixtures), and the final run on the final code detected 20 of 20 (`mutation-check.txt`). The planted bugs are listed in `repro/s2/mutation_check.py`.

## 4. Reward invariants (owner §7) — how they are enforced and checked
- **Engine:** the eligible set is fixed at the kill and stored in the pending claim (it is never taken from the event); the credit is classified before any draw; everything is applied in one state assignment; the account loot stream is rolled once per credited squad kill; a worker's kill rolls its own stream.
- **Invariant monitor** (`src/experiments/legionMetrics.ts`), attached to every S2 experiment run, with independent shadow bookkeeping:
  - I1 eligibility;
  - I2 full EXP per award;
  - I3 nobody else gains, and level progress moves by exactly the EXP awarded;
  - I4 loot once (replaying one roll on a shadow stream reproduces the logged rewards and the engine's stream state);
  - I5 zone kill and quest once;
  - I6 identity once;
  - I7 mastery only in the held class, unchanged by class / talent / respec / assignment changes, records = maximum mastery level;
  - I8 exclusivity.
- **Result:** 14,050 experiment runs, 751,927,546 checks, **0 violations**.
- **Tests:** `test/s2.legion.test.ts` (37 tests: exact scenarios for knockout in and before the killing batch, threat order, recovery, joining and leaving mid-encounter, refused loadout commands, mastery abuse, workers, duplicate / conflicting / unknown / atomic credit, estimators, determinism, forks, search isolation, ledger equivalence, time categories) and `test/s2.invariants.test.ts` (11 tests: every POL2 policy, ×3 enemy damage, assignment flipping at every decision across two sessions, squad sizes 0–3 at a matched state).
- **Switching boundaries (owner §7):** the flipping policy changes every recruit's assignment at every decision: attack, death, credit, level-up and session boundaries (credits are atomic, so no decision can fall between a kill and its credit; policy decisions run after them in the same step). 0 violations, every kill credited once.

## 5. Pre-registration
- The plan `manifests/s2/PREREGISTRATION.md` was hashed before implementation (`f4d70eed…9d39`, registered 2026-11-13T21:15:00Z) and is unchanged.
- The 10 manifests were generated from it (`repro/s2/make-manifests.ts`) and hashed at 2026-11-13T22:15:33Z, before any S2 experiment ran (`evidence/s2/manifest-registration.txt`). The runner refuses unregistered or changed manifests.
- **Disclosed:** during development the engine and policies were exercised on single seeds (and a one-replicate smoke run of every cell, errors and timing only) before the manifests were hashed. The targets come from the earlier plan and were not changed.
- S2-E03 (credit invariants) has no manifest of its own: as pre-registered it is the monitor over every S2 run plus the tests (B1).
- **One interpretation fixed in the manifests before running:** H-S2-04 compares each switching cell with the better of the two set-and-forget cells (all-squad, all-workers).

## 6. Results (all model output; full tables in `evidence/s2/analysis.txt` and `evidence/s2/experiments/`)

### B0 — control A0 (gate)
**PASS.** S2-E00 (the S2 engine, hero alone, S2 off; 4 cells × 200 replicates on the S1-E01 seeds) against S1.1-E01: 148 metric summaries compared, 0 differ, and the combined event-log digest is identical in 4 of 4 cells.

### Targets (B2; a miss does not block acceptance)
| Hypothesis | Pre-registered target | Result |
|---|---|---|
| H-S2-01 first recruit in 2–5 active min | p50 in [2, 5] | **Pass** in 18 / 18 cells: 2.09 min at Q1 = 40 in every policy and profile (the hero alone farms zone 1 until the quest, so the policy cannot change it). S2-E08 sweep: 1.41 min (Q25), 2.09 (Q40), 2.93 (Q60) |
| H-S2-03 hero damage share 30–60% (mixed composition, passive) | p50 in [0.30, 0.60] | **Miss** in 3 / 3: Warrior hero 0.141, Archer 0.200, Mage 0.185. Closest variants: attentive Archer hero with three Warriors 0.381, attentive Mage hero with three Warriors 0.364 (inside the band); best passive: Archer hero with three Warriors 0.276 |
| H-S2-04 switching gains ≤ 5% over set-and-forget | mean legion EXP gain ≤ 0.05 | **Pass** (no abuse): switching every 1 / 5 / 30 min gives −35.8% / −36.4% / −35.2% against all-squad (174,972); it beats all-workers (45,127). Switching earns more gold per hour (14,476–17,359 vs 12,136) |
| H-S2-05 no mastery from switching without training | engineering | **Pass**: 0 mastery and 0 records after 1, 5 and 20 cycles (4, 20 and 80 accepted switches); with training, mastery equals the combat EXP exactly |
| H-S2-06 full personal EXP per eligible member | engineering | **Pass**: 0 violations in every run |
| H-S2-02 loot per credited squad kill independent of k = 0–3 | engineering | **Pass**: monitor I4 in every S2-E01 run (k = 0..3) and every other run |

### H-S2-07 / B6 — how recruits change timing (p50, against the S1.1 control POL-FRONTIER)
| Metric | S1.1 control | POL2-SQUAD-W | POL2-MIXED | POL2-WORKERS |
|---|---|---|---|---|
| Level 5 (min) | 2.45 | 2.33 | 2.33 | 2.45 |
| Level 10 (min) | 14.16 | 7.38 | 7.99 | 11.24 |
| Zone 2 first visit (min) | 5.08 | 3.96 | 3.96 | 3.88 |
| Zone 3 first visit (min) | 38.14 | 8.37 | 9.29 | 24.92 |
| Hero level at 45 min | 17 | 32 | 25 | 20 |

The S1 targets, re-reported for the 14 S2 realistic cells (unchanged, role "reported"): first kill, level 2 after 1–3 kills, zone-1 TTK and the zone-gate ratio stay inside their ranges; zone-2 TTK (4 of 14 inside), zone-3 TTK (0 of 14: 1–4 s against 5–15 s), first new zone in 5–10 min (0 of 14: 3.9–4.8 min), level 5 in 3–5 min (0 of 14: 2.3–2.5 min, already early in S1.1) and level 10 in 10–20 min (4 of 14: 7.4–11.3 min) fall outside.

### B3 — squad versus workers (S2-E05), per objective; no single best is declared
| Objective (PR-BAL / PR-OPT means) | POL2-SQUAD | POL2-WORKERS | POL2-MIXED |
|---|---|---|---|
| Hero EXP | **44,412 / 70,812** | 13,109 / 22,855 | 25,346 / 43,364 |
| Legion EXP | **174,987 / 280,587** | 45,128 / 81,658 | 73,518 / 129,702 |
| Gold earned per hour | 12,136 / 12,891 | 12,775 / 15,492 | **13,666 / 16,262** |
| Zone 3 first visit (min) | **8.4 / 8.4** | 24.9 / 24.9 | 9.3 / 9.3 |
| Conquest score (zones, gate, total kills) | lowest | **highest** (worker kills count) | middle |

### B4 — hindsight search (S2-E09; best feasible found, never an upper bound)
- Hero EXP and legion EXP: the search chose the all-squad frontier plan at every decision and matched POL2-SQUAD exactly (ratio 1.000): within its candidate set and 10-minute horizon it found nothing better than the realistic policy.
- Gold held: the search (12,007) beat POL2-SQUAD (ratio 1.037) but **lost** to POL2-MIXED (0.916) and POL2-WORKERS (0.982): a bounded, myopic search is not an upper bound, here visibly.
- Conquest: equal zone access in every plan; the score then counts kills, where worker plans lead.
- Budget: 186–341 forks and 18–31 decisions per run on average; never exhausted.

### B5 — estimators against realisation (S2-E10; no accuracy target)
- **Hero alone (estimator v1.2):** median |error| 0.1–0.3%, max 0.7%, in every reliability class.
- **Squads (estimator s2.0, approximate):** median |error| 8.9–12.8% by squad size; it over-predicts where knockouts are expected (level 1, zone 3, one Warrior: predicted 288 kills/h, realised 146; +97%) and under-predicts fast squads by up to 21% (its spawn bound is conservative).
- **Workers:** "reliable" cells within 0.1%. "Unsafe" cells (AUTO_FARM_STOP_EXPECTED) are not production forecasts: the worker is stopped after repeated knockouts and, in this diagnostic, never reassigned, so realised rates are far lower (up to +919% error). One "approximate" worker cell (level 5, zone 2, SURVIVAL_LIMITED) over-predicts by 382% for the same reason.
- Estimates are labelled and never called results.

### Other experiments
- **S2-E01 deploy scaling (PR-BAL, p50):** legion EXP 13,062 / 50,230 / 118,052 / 174,988 for k = 0 / 1 / 2 / 3; hero damage share 1.00 / 0.55 / 0.29 / 0.19; level at 60 min 23 / 29 / 35 / 37; matched level-10 zone-2 kills per hour 1,032 / 1,596 / 2,390 / 2,390 (spawn-limited from k = 2).
- **S2-E07 knockout sensitivity:** **uninformative at these settings.** With every recruit deployed, enemy damage ×0.5, ×1, ×1.5 and ×2 all give 0 knockouts, 0 deaths and identical progression: the squad kills before damage matters. The variants were applied (different content hashes and event logs).
- **S2-E04 class-switch abuse:** see H-S2-05 above; with training the account records reach 5 / 15 / 26 levels in total, exactly from the combat EXP earned while holding each class.

## 7. Balance findings (model output; for the owner, not acted on)
1. **Full personal EXP plus squad kill speed multiplies progression.** With three recruits the hero reaches level 10 in about 7.4 min (S1.1: 14.2) and zone 3 in 8.4 min (S1.1: 38.1); the hero earns about 5.4 × the S1.1 hero's EXP in 60 min (44,412 vs 8,200), and the legion about 21 × (174,987). Most single-hero S1 pacing targets are now missed on the fast side.
2. **The hero becomes a minor damage source** (14–20% passive with three recruits); the 30–60% band (R02.03) is reached only by an attentive caster hero with a low-damage squad.
3. **Workers are weak against squads** for EXP (legion EXP 26% of all-squad) but earn slightly more gold per hour; mixed is the best gold plan in these runs.
4. **Enemy danger is irrelevant to a full squad in zones 1–3** (S2-E07): knockout and recovery rules are barely exercised by realistic play at these numbers.
5. **First recruit timing is fixed by the quest size** (about 3 s per kill): 25 / 40 / 60 kills → 1.4 / 2.1 / 2.9 min.
6. **The squad estimator is useful but approximate** (about ±10% typical, larger with knockouts); the worker estimator flags unsafe zones correctly but does not forecast stopped workers.

## 8. Limitations and red flags
- **Candidate rules awaiting the owner:** S2-R01 … R20 (threat order, knockout recovery, eligibility, workers, talents, costs) are proposed, not approved.
- **Engine rules added in S2 not covered by an approved document:** deployed recruits regenerate with the hero between fights at the hero's rate per second of their own maximum HP, rounded down, at least 1; the hero's ability cooldown starts at the command and a cast is lost if the encounter ends first; a worker does not regenerate between fights.
- **Policies are simple and fixed:** one composition (Archer hero; Warrior, Archer, Mage), one talent priority, buys every recruit, deploys in acquisition order. They are not tuned per class (owner §9).
- **ORC2-SEARCH:** 12 candidates, 10-minute horizon; it never re-plans between decision points and uses hindsight. Its gaps are lower bounds only.
- **Variance:** many early metrics are identical across replicates (for example the first recruit at 2.09 min), because the early hero fight is nearly deterministic in this content (common random numbers; hit chance near certain). KS tests in the determinism check are therefore degenerate for those metrics.
- **S2-E07** did not exercise knockouts (above). **S2-E10** worker cells do not reassign a stopped worker, which inflates the worker estimate's error for unsafe zones.
- **Conquest score** is a declared composite (zones, gate, total kills); within equal zone access it rewards kill counts, which favours workers. Zone first-visit times are the better conquest measure here.
- **Not independently verified:** all results come from this machine; the L1 and S2 tests, oracles and experiments have not been re-run by a reviewer.

## 9. Changes to earlier code (S1 behaviour unchanged)
- `src/experiments/metrics.ts`: reconciles `LegionSpend` / `LegionGrant` entries (never logged by S1).
- `src/spec/fixtureSchema.ts`, `fixtureRunner.ts`, `test/fixtures.conformance.test.ts`, `spec/oracle/check_all.py`, `spec/schema/fixture.schema.json`: the two new fixture families.
- L1 changes are listed in `evidence/l1/L1_REPORT.md` and the changelog.
- The S1.1 control is unchanged: B0 reproduces S1.1-E01 exactly, and the S1.1 experiments MATCH on the persistent ledger.

## 10. Reproduction
```
cd legion-progression-lab
npm ci
npx tsc --noEmit -p tsconfig.json
npx vitest run --config vitest.config.ts
npx vitest run --config vitest.stats.config.ts
node src/cli/fixtures-check.ts
python -I ../spec/oracle/check_all.py
# copy evidence/s2/experiments/* to results/s2/ (and evidence/s1.1/experiments/* to results/s1.1/), then:
node src/cli/exp2.ts manifests/s2/S2-E05-squad-vs-workers.json --verify
node src/cli/exp2-crosscheck.ts manifests/s2/S2-E05-squad-vs-workers.json --cell 0 --ledger reference
node src/cli/s2-analyse.ts
python -I repro/s2/mutation_check.py <lab dir> <node dir> s2
```

## 11. Files
- Planning: `planning/S2_SPECIFICATION.md`, `planning/S2_RESOLUTIONS.md`, `planning/L1_LEDGER_SPECIFICATION.md`.
- Sources: `src/engine/legion*.ts`, `src/engine/squadEstimator.ts`, `src/model/legion*.ts`, `src/policy/legion*.ts`, `src/experiments/legion*.ts`, `src/cli/exp2*.ts`, `src/cli/s2-*.ts`, `src/spec/s2Fixtures.ts`.
- Fixtures and oracle: `spec/fixtures/squad-fight.v1.json`, `spec/fixtures/legion-credit.v1.json`, `spec/oracle/s2_oracle.py`, `spec/formulas/s2-legion.md`.
- Pre-registration: `manifests/s2/`. Results: `evidence/s2/experiments/<id>/` (semantic, fingerprint, environment, report, quantiles, sample event traces). Analyses: `evidence/s2/analysis.txt`, `evidence/s2/experiments/analysis-gates.json`.
- Captured outputs: the files listed in the appendices.

---

## Appendix A. Type check (`typecheck.txt`)

```
$ npx tsc --noEmit -p tsconfig.json
exit code 0
```

## Appendix B. Default test suite, verbose (`test-output.txt`)

```

 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/combat.test.ts > hit chance > is 1 without a requirement and 90% at the requirement (candidate curve) 2ms
 ✓ test/combat.test.ts > hit chance > is monotonic non-decreasing in accuracy and stays inside [floor, 1] 121ms
 ✓ test/ledger.persistent.test.ts > persistent ordered map (AVL, path copying) > keeps the AVL invariants and ascending order under random inserts and replacements 32ms
 ✓ test/ledger.persistent.test.ts > persistent ordered map (AVL, path copying) > never changes an old root: every earlier version still describes its own map 73ms
 ✓ test/rng.test.ts > stream identity > is injective: different field tuples never share an encoding 77ms
 ✓ test/rng.test.ts > stream identity > refuses empty, oversized, ill-formed or badly counted identities 1ms
 ✓ test/rng.test.ts > stream identity > never yields the all-zero state, and applies the fallback rule exactly 36ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > matches exact BigInt arithmetic for any valid inputs 192ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > addSafe: exact result, or NUMERIC_LIMIT exactly when out of range 255ms
 ✓ test/xp.property.test.ts > EXP award properties > two awards in sequence equal one combined award (multi-level awards are unambiguous) 265ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > G1: any partition of the steps gives the same total and remainder 289ms
 ✓ test/xp.property.test.ts > EXP award properties > total EXP is conserved: thresholds consumed + leftover = award 249ms
 ✓ test/combat.test.ts > hit chance > refuses inconsistent curves 0ms
 ✓ test/combat.test.ts > mitigation, crit and damage > mitigation is diminishing and never reaches zero 72ms
 ✓ test/combat.test.ts > mitigation, crit and damage > crit chance may reach exactly 100%; the excess is reported, not applied (R-A2) 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > damage per landed hit is an integer, rounds exact halves up, and has a floor 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > hits-to-kill never increases when damage increases (breakpoints are exact) 342ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulSafe: exact result, or NUMERIC_LIMIT exactly when out of range 297ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > divRem is exact for every non-negative safe dividend 217ms
 ✓ test/rng.test.ts > generator and sampling > replays exactly: the same stream gives the same sequence 31ms
 ✓ test/rng.test.ts > generator and sampling > produces unsigned 32-bit integers and never reaches the zero state 628ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > roundHalfUp equals exact floor(x + 1/2) for any finite double in the safe range 115ms
 ✓ test/rng.test.ts > generator and sampling > Bernoulli always consumes exactly one draw, including p = 0 and p = 1 1ms
 ✓ test/rng.test.ts > generator and sampling > computes thresholds exactly and refuses unrepresentable probabilities 1ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt stays inside [lo, hi] and reports how many draws it used 165ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > one call matches the BigInt reference for any state, rate and duration; NUMERIC_LIMIT exactly when the grant is unsafe 541ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt boundary behaviour: span 1, span 2^32, refusals 1ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses sparse array (S0 accepted it) at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array with a hole at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses undefined word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses three words at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses five words at every entry point 35ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses fractional word at every entry point 1ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses negative word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses word of 2^32 at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses string word at every entry point 1ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array-like object at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses typed array at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses the all-zero state at every entry point (S0 accepted it in nextU32, bernoulli and uniformInt) 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > validates the state before other arguments 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > a caller mutating a returned state cannot smuggle the zero state in 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > stateFromDigest accepts only a 32-byte Uint8Array 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > valid states are unaffected: a hand-derived step is unchanged 0ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > one award matches unbounded integer arithmetic (no NUMERIC_LIMIT is ever needed) 636ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > baseline timeline: first kill at 8,000 + 2 x 1,200 = 10,400 ms; first swing lands on arrival (next pass) 32ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > simultaneous lethal blows: both die, the kill is still credited, the hero respawns without loss 7ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > retaliation at the moment the enemy dies lands, and the enemy still dies 5ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > hero death cancels the pending swing (stale) and frees the enemy at full HP 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > stale events from a previous encounter never reach the next one 7ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > respawn: with one slot the hero waits, then engages a new instance with a new ID 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > target invalidation: travelling away during the walk frees the reserved enemy and cancels the arrival 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > identical timestamps resolve in phase order: kill, credit, level-up, recompute, next engagement, policy 5ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > a multi-level award emits one LevelUp per level in order; stats apply to the next swing; HP rises by the max-HP gain 51ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulDivRem: exact quotient and remainder for any safe inputs, NUMERIC_LIMIT exactly when the quotient is unsafe (S0.1) 529ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G1: any partition of a duration gives the same total and state, for rates up to 2^53 - 1 633ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > covers every S0, S1 and S1.1 family with unique case IDs, boundary and failure cases, and derivations 21ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.keys.001 (normal) 7ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nested.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.numbers.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.strings.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nan.001 (failure) 10ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.infinity.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.key-ascii.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.basic.001 (normal) 166ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > S0 review reproduction: 100 * 1.005 = 100.5 rounds up to 101 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > exact halves through mitigation ratios that binary64 cannot represent round up 1ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > values just below a half round down, even one part in 10^12 below 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > matches exact integer arithmetic for any valid input; NUMERIC_LIMIT exactly when the result is unsafe 1225ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > key replacement: a new balance in the new snapshot, the old one untouched 44ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > adversarial keys: FNV-1a 32-bit collisions, long shared prefixes, Unicode and NUL are all distinct keys 1549ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > serialization is independent of insertion history (commutative transactions in any order) 4ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > validated reconstruction: round trip, then replays and conflicts behave exactly as before saving 3ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > validated reconstruction refuses every corruption (INVALID_STATE, no ledger) 2ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > mutation protection: the tree is unreachable from the public ledger; views expose nothing writable 0ms
 ✓ test/ledger.persistent.test.ts > persistent ledger: specific properties > a randomly built persistent ledger keeps its tree invariants (balances and committed) 16ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.both-die.001 (boundary) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.retaliation-at-death.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.hero-dies.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.mitigation.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.min-damage.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit-half.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.session-end.001 (boundary) 16ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.instant-attack.001 (boundary) 16ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-walk.001 (boundary) 14ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.slow-hero.001 (normal) 38ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-attack.001 (failure) 10ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > applies mitigation first, so no intermediate overflows when the result fits 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > is monotonic: more raw damage, a larger crit multiplier or less defence never lowers damage 129ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > mitigationRatio is exact and agrees with the display factor 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > refuses malformed damage inputs 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-hp.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.no-requirement.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.at-requirement.001 (normal) 10ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.overcap.001 (boundary) 19ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.plain.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.crit-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.mitigated.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.floor.001 (boundary) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-below-half.001 (boundary) 8ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.below-half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.min-damage.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.huge-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.overflow.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.not-safe.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-ratio.001 (failure) 34ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-crit-flag.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.001 (normal) 17ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.overflow.001 (failure) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.integer.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.below-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.binary64-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.half-milli.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.too-low.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.zero.001 (failure) 17ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.range.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.breakpoint.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.overkill.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-hp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-dmg.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.valid.001 (normal) 25ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.range-edge.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-hash.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.out-of-range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.duplicate-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.hit-floor.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.table-length.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unknown-field.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unlabelled.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-id.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.exact-duplicate.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.conflict-before-genuine.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.unknown.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.exp-only.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.boss.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.interleaved.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.harmless.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.hand-chain.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.simultaneous.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.dies-first.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.crits-survival.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.spawn-bound.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.regen-gap.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.swing-budget.001 (failure) 120ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G3: a timeline of rate changes, each segment split arbitrarily, equals the exact integral 471ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/s0-core.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp-sweep.index.json stays inside the lab and never references the frozen baseline 0ms
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
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/w1-slice-s2.candidate.v0.2.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/w1-slice.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E01-calibration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E02-estimator.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E03-earlier-zone-audit.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E04-survival.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E05-gate-pacing.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E06-drop-correctness-b.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E06-drop-correctness.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E07-determinism.json stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E08-policy-bound.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E01-base-attribution.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E02-estimator.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E03-earlier-zone-audit.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E04-survival-policies.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E05-drops-quantities.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E06-determinism.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E07-policy-comparison.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/preregistration.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E00-control-a0.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E01-deploy-scaling.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E02-hero-damage-share.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E04-class-switch-abuse.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E05-squad-vs-workers.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E06-assignment-switching.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E07-knockout-sensitivity.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E08-first-recruit-timing.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E09-hindsight-search.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s2/S2-E10-estimator-vs-realisation.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > package.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > repro/s2/make-manifests.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench/hamtLedger.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench-ledger-l1.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench-ledger.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-sweep.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-table.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/curve-preview.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp-worker.ts stays inside the lab and never references the frozen baseline 32ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp.ts stays inside the lab and never references the frozen baseline 5ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp2-crosscheck.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp2-worker.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp2.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/export-schemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/fixtures-check.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/ledger-differential.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/paths.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-analyse.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-content.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-traces.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s2-analyse.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s2-content.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/arrays.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/labels.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/schema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/validate.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/errors.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/combat.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/stats.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/xp.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/hash/canonicalJson.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/differential.ts stays inside the lab and never references the frozen baseline 0ms
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
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/legionCredit.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/legionObservation.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/observation.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/queue.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/rewards.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/simulation.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/squadEstimator.ts stays inside the lab and never references the frozen baseline 12ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/jobs.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionJobs.ts stays inside the lab and never references the frozen baseline 3ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionManifest.ts stays inside the lab and never references the frozen baseline 12ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > any split of an award gives the same final state and the same ordered level-ups 1014ms
 ✓ test/s1.experiments.test.ts > summary statistics > quantiles are nearest-rank observed values; "not reached" sorts above every number 38ms
 ✓ test/s1.experiments.test.ts > summary statistics > the exact binomial interval covers at least 99.9% and is tight 48ms
 ✓ test/stats.test.ts > stat stacking > adds within a category and multiplies across categories 2ms
 ✓ test/stats.test.ts > stat stacking > the breakdown reproduces the applied value exactly 33ms
 ✓ test/stats.test.ts > stat stacking > source order does not change the result 0ms
 ✓ test/stats.test.ts > stat stacking > inactive categories are neutral; unknown or duplicate entries are refused 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > S0 review reproduction: an active factor of exactly 1 preserves 2^53 - 1 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > neutral factors are an exact identity for any base, any number of them, in any position 97ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionMetrics.ts stays inside the lab and never references the frozen baseline 13ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/legionSummary.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/manifest.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/metrics.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/patch.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/report.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/stats.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/summary.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/content.ts stays inside the lab and never references the frozen baseline 1ms
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
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureSchema.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/s1Fixtures.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/s2Fixtures.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/canonicalJson.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/combat.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/content.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/fixtures.conformance.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/fixtures.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/reference.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/s1.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/s2.ts stays inside the lab and never references the frozen baseline 19ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/isolation.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.contract.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.differential.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.persistent.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/purity.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.test.ts stays inside the lab and never references the frozen baseline 1ms
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
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/schemaDrift.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/rng.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/s1.drops.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > tsconfig.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.stats.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > settling at any cadence equals settling once, from any persisted state (save/load round trip included) 137ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > starts in zone 1 (visited, checkpoint known); other zones have every flag off 28ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a kill gate unlocks access only; the visit and checkpoint come from arriving, at the same arrival 37ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > flag invariants hold after every event: visited implies access; checkpoint implies visited 1271ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.impossible-over-budget.001 (failure) 373ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > W2 hooks from the candidate content pack stay neutral, however large their sources 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > never returns NaN or Infinity: every result is finite and inside [0, 2^53 - 1], or the call is refused 405ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses out-of-range partial and final values (S0 returned Infinity and NaN for these) 22ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > applies categories in ascending id order, whatever order they are listed in 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses sparse, missing or malformed entries with INVALID_CONTENT 0ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > refuses travel and teleport that break the rules, with the documented reason codes 162ms
 ✓ test/remainder.test.ts > exact remainder accumulator > splitting an interval never changes the total or the remainder (G1) 2ms
 ✓ test/remainder.test.ts > exact remainder accumulator > a zero-duration interval changes nothing (G2) 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > per-hour chain: one hour at 1.5 units/hour, split three different ways 3ms
 ✓ test/remainder.test.ts > exact remainder accumulator > settling every millisecond equals settling once (no gain from frequent rejoining) 222ms
 ✓ test/remainder.test.ts > exact remainder accumulator > persisted remainders survive a save/load round trip and complete later units 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > assignment switching: separate keys never leak into each other 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > large balances: results near 2^53 are exact and beyond it are refused 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > refuses invalid parameters 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > S0 review reproduction: 2 h at rate 2^53 - 1 in one call equals two 1 h calls 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > the largest representable grant succeeds in one call and in parts; one more millisecond is refused 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > a full state plus the largest grant still fits exactly 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > refuses malformed states before doing any arithmetic 0ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a rejected command changes nothing: the run is identical to one that never sent it 369ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > balances are never negative and always equal the sum of committed nets (conservation) 225ms
 ✓ test/purity.test.ts > purity of the deterministic core > finds the pure modules 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/arrays.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/labels.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/schema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/validate.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/errors.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/combat.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/stats.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/xp.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/hash/canonicalJson.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/differential.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/implementations.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/ledger.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/persistentLedger.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/persistentMap.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/basisPoints.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/remainder.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/rounding.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/safeInt.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/sample.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/streamId.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/xoshiro128ss.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/exportedSchemas.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureRunner.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureSchema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/s1Fixtures.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/s2Fixtures.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/report/curvePreview.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/content.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/legionContent.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/legionTypes.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/types.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/commands.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/credit.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/estimator-s1.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/estimator.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legion.ts uses no clock, ambient RNG, process, timers or I/O 2ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legionCommands.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legionCredit.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/legionObservation.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/observation.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/queue.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/rewards.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/simulation.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/squadEstimator.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/legionRealistic.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/legionSearch.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/oracle.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/realistic.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/jobs.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionJobs.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionManifest.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionMetrics.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/legionSummary.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/manifest.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/metrics.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/patch.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/report.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/stats.ts uses no clock, ambient RNG, process, timers or I/O 37ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/summary.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.possible-over-budget.001 (boundary) 559ms
 ✓ test/s1.experiments.test.ts > summary statistics > KS: identical samples do not differ; shifted samples do 1ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > a campaign job is deterministic and reports the named metrics 890ms
 ✓ test/canonicalJson.test.ts > canonical JSON > sorts keys and removes whitespace 2ms
 ✓ test/canonicalJson.test.ts > canonical JSON > is independent of key insertion order 47ms
 ✓ test/canonicalJson.test.ts > canonical JSON > formats numbers exactly as ECMAScript does (and -0 as 0) 90ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > teleport to a discovered checkpoint takes teleportMs and is free 81ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > opens after the zone 3 kill gate count and is cleared inside the timer; the clear is credited once 51ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > replaying every transaction again changes nothing (no repeated claims) 152ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > the gate-completion decision carries "gate-completed" together with "kill" (the reviewer saw only "kill") 850ms
 ✓ test/canonicalJson.test.ts > canonical JSON > refuses values that have no unambiguous canonical form 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-done.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-wrong-zone.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-unknown.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-busy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.rest-in-boss.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.end-session.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-dead.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-closed.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-unknown.001 (failure) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > legion-credit > s2.credit.worker-stream.001 (normal) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.fraction.001 (failure) 0ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.slime.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.always-never.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.draw-alignment.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.nothing.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.bad-chance.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.qty-three.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.same-resource-twice.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.utf8.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.empty.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.surrogate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.state.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.first-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.second-half.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.all-zero.001 (failure) 0ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.d6.001 (normal) 30ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.negative.001 (failure) 16ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.not-array.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.ko-in-killing-batch.001 (boundary) 161ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > kill + level-up + gate unlock at the same moment reach the policy together, in the canonical order 4ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a death and a kill at the same moment (both blows land) reach the policy together 4ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a boss clear reaches the policy as "boss-cleared" with its kill 11ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > the auto-farm stop reaches the policy at the death that caused it 32ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > decisions at different moments stay separate: one decision per kill moment, and a scheduled future decision runs 112ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.ko-before-kill.001 (boundary) 6ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.threat-then-hero.001 (normal) 9ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.classless-hero-before-archer.001 (normal) 8ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.full-squad-l10.001 (normal) 63ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.mage-hero-two-recruits.001 (normal) 4ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > squad-fight > s2.squad.invalid-enemy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.stack.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-bp.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inexact.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.unknown-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.duplicate-source.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-factor.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-flat.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.w2-hooks.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.order.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.range.largest.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.final.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.intermediate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.many.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.bad-active.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.null-source.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive-negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.candidate.001 (normal) 1ms
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
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-state.001 (failure) 19ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.large.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.near-max.exhausted.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.max-award.multi.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.sequence.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.at-end-with-exp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.guard.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-guard.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.null-threshold.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.unsafe.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.bad-table.001 (failure) 1ms
 ✓ test/ledger.test.ts > ledger > aggregates lines per bucket before validating 3ms
 ✓ test/ledger.test.ts > ledger > is atomic: a failing line changes nothing, and the input ledger is never mutated 1ms
 ✓ test/ledger.test.ts > ledger > replays an identical transaction without applying it twice 0ms
 ✓ test/ledger.test.ts > ledger > identical payloads replay regardless of object key order (canonical hashing) 0ms
 ✓ test/ledger.test.ts > ledger > refuses the same txId with a different payload 0ms
 ✓ test/ledger.test.ts > ledger > a failed transaction is not recorded and can succeed later 0ms
 ✓ test/ledger.test.ts > ledger > refuses overflow, including overflow while aggregating 0ms
 ✓ test/ledger.test.ts > ledger > refuses malformed transactions 1ms
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
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a policy that keeps causing new triggers at one moment is stopped as a cascade, not looped forever 4ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > ORC-BRUTE re-plans (forks every accessible zone) at the zone 2 gate completion 304ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > an injected exact duplicate after an ordinary kill is rejected: no EXP, kill, gold, drop or random draw twice 154ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > passes every unchanged ledger fixture (spec/fixtures/ledger.v1.json) 6ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C4: aggregates lines with checked addition before validating 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C2: a replay returns the original receipt with replayed = true and leaves the ledger unchanged (same object) 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C3: the same txId with a different payload is TX_CONFLICT, ledger unchanged 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C4: NEGATIVE_BALANCE and NUMERIC_LIMIT, exact 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C12: the same validation codes 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C6: a failing transaction is atomic: the input ledger and earlier snapshots are unchanged 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C1: full history: every committed transaction stays, in every later snapshot 12ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C7: only genuine ledgers of this implementation are accepted 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C8: every exposed object is frozen and cannot be altered 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C9: branches from any snapshot are isolated; replay and conflict are judged per branch 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: reference > C10: both implementations give byte-identical canonical serializations for the same history 1ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > passes every unchanged ledger fixture (spec/fixtures/ledger.v1.json) 2ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C4: aggregates lines with checked addition before validating 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C2: a replay returns the original receipt with replayed = true and leaves the ledger unchanged (same object) 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C3: the same txId with a different payload is TX_CONFLICT, ledger unchanged 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C4: NEGATIVE_BALANCE and NUMERIC_LIMIT, exact 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C12: the same validation codes 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C6: a failing transaction is atomic: the input ledger and earlier snapshots are unchanged 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C1: full history: every committed transaction stays, in every later snapshot 5ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C7: only genuine ledgers of this implementation are accepted 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C8: every exposed object is frozen and cannot be altered 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C9: branches from any snapshot are isolated; replay and conflict are judged per branch 0ms
 ✓ test/ledger.contract.test.ts > ledger contract: persistent > C10: both implementations give byte-identical canonical serializations for the same history 0ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > kill rewards are credited exactly once per kill, with one ledger transaction per kill 2473ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > the timer is half-open: a lethal hit exactly at the timer is too late 15ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > death in the boss fight fails it with no loss; the gate stays open for a retry 29ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > auto-farm never starts the boss, and StartBoss is refused while auto-farm is on 573ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > orderTriggers removes repeats and follows TRIGGER_ORDER, unknown triggers last and alphabetical 0ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > the reviewer scenario: the S1 control resumes and dies 124 times; the corrected fixed policy stops after 3 deaths and reports why 119ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > the run continues normally after a rejected duplicate (later kills are credited) 43ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a duplicate processed BEFORE the genuine event credits once; the genuine one is then the replay 2ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a conflicting duplicate (other zone, or the boss flag) is rejected explicitly, before or after the genuine one 2ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a credit for an encounter that never ended in a kill is rejected as unknown 1ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > an EXP-only encounter (no gold, no drops, so no ledger transaction) has full replay protection 3ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a duplicated boss credit grants the boss EXP and gold once and completes the gate once 70ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > replay after branching: a branch keeps its own history, rejects replays, and never sees the other branch 6ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > is atomic: if any part of the credit fails, nothing of it is applied 5ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > accepts only a registered claim, exactly once, and classifies every rejection 1ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > is persistent: committing never changes an earlier registry value, and branches do not share new commits 0ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > refuses to register the same kill twice (an engine error, never a gameplay outcome) 1ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > session boundary: a lethal swing exactly at the session end is not resolved; one ms later it is 83ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > nothing happens between sessions; the next session re-engages with the entry walk; time adds up 35ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > an idle hero with no commands does nothing and earns nothing 2ms
 ✓ test/s1.events.test.ts > kill reward draws (s1-combat-loop.md section 10) > every drop entry uses exactly one draw, even at 0%, so later entries stay aligned 6ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > POL-STAY: identical event log and S1 metrics on 3 seeds (45 min) 2124ms
 ✓ test/runtime.test.ts > pinned runtime > runs on the pinned Node 24 LTS version 2ms
 ✓ test/runtime.test.ts > pinned runtime > package.json pins exact dependency versions and the engine 1ms
 ✓ test/xp.test.ts > XP table > builds the candidate table (values independently confirmed by xp_oracle.py) 2ms
 ✓ test/xp.test.ts > XP table > is non-decreasing with every threshold >= 1 0ms
 ✓ test/xp.test.ts > XP table > refuses invalid curves, empty tables and unsafe thresholds 1ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > cumulative EXP can leave the safe range while every single threshold is safe 0ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > reports separate approximate limits for the candidate curve 1ms
 ✓ test/xp.test.ts > EXP awards > applies multi-level awards in order and keeps the leftover 1ms
 ✓ test/xp.test.ts > EXP awards > never discards EXP: an award past the table end is refused as a whole 1ms
 ✓ test/xp.test.ts > EXP awards > refuses invalid state and runaway loops 1ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > S0 review reproduction: an award of 2 one EXP short of a 2^53 - 1 threshold 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > awards up to 2^53 - 1 cross large thresholds exactly and conserve EXP 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > keeps table-exhaustion, guard and ordering behaviour 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > is atomic: a refused award leaves the caller state object untouched 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > refuses sparse or malformed tables and states (S0 accepted new Array(2)) 0ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > POL-STAY leaves a zone that stopped it, farms a safer one, and does not return while its level is unchanged 33ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > a level-up lifts the block: the realistic policy retries the zone only after levelling past the stop level 221ms
 ✓ test/numeric.test.ts > safe integers > adds up to the limit and refuses one past it 2ms
 ✓ test/numeric.test.ts > safe integers > refuses non-integers, NaN, Infinity and unsafe inputs 1ms
 ✓ test/numeric.test.ts > safe integers > normalises -0 to +0 0ms
 ✓ test/numeric.test.ts > safe integers > checks intermediate products, not only final results 0ms
 ✓ test/numeric.test.ts > safe integers > divides exactly near 2^53 where floating division rounds 1ms
 ✓ test/numeric.test.ts > roundHalfUp > fixes both failure cases of floor(x + 0.5) 0ms
 ✓ test/numeric.test.ts > roundHalfUp > rounds halves up, including negatives 0ms
 ✓ test/numeric.test.ts > roundHalfUp > refuses non-finite input and results beyond the safe range 0ms
 ✓ test/content.test.ts > S0 content pack > validates, and its recorded table hash matches the artifact 13ms
 ✓ test/content.test.ts > S0 content pack > detects a tampered table 2ms
 ✓ test/content.test.ts > S0 content pack > every numeric value in the pack is labelled candidate (nothing is approved yet) 0ms
 ✓ test/content.test.ts > S0 content pack > a derived value is never stronger than its weakest input 0ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > with no safer zone it stops, turns auto-farm off and reports NO_SAFE_ZONE (and stops dying) 3ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > POL-BEST-SHOWN never farms a blocked zone 137ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/fixture.schema.json matches the zod source 2ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/content-pack-s0.schema.json matches the zod source 1ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/xp-table.schema.json matches the zod source 1ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > corrected policies rest below 30% HP between fights; the S1 control never does 258ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > manual retry: re-enabling auto-farm after the stop is accepted, clears the reason, and the next death in the window stops it again 7ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > the death window is (t - window, t]: a death exactly window ms earlier no longer counts 1ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > turning auto-farm off cancels the automatic walk to the next target: no extra kill, the target is released, its events go stale 5ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > turning auto-farm off mid-fight ends an automatic encounter without a kill; the enemy is free at full HP 5ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a manual encounter continues when auto-farm is turned off, and the hero can engage manually again 5ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > an idle hero regenerates after a manual kill (S1 did not start regeneration there) 5ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a hero that starts a session hurt regenerates while idle 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a manual Engage still waiting for an enemy ends with the session: no fight in the next session without a command 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > between sessions only world spawns are maintained: no reward, EXP, kill, credit or hero change 2ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > zero hit chance: 0 kills/h, no finite TTK, unreachable (the S1 estimator showed 2,400 kills/h and 0 s) 34ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > a tiny hit chance that cannot resolve within the swing budget is unreachable, not efficient 57ms
 ✓ test/s1.determinism.test.ts > determinism > the same inputs give the same event log hash and metrics; another seed gives a different log 3745ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > POL-FRONTIER: identical event log and S1 metrics on 3 seeds (45 min) 902ms
 ✓ test/s1.determinism.test.ts > determinism > a fork continues exactly like the original run 218ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-SQUAD: 2 seeds x 45 min 3494ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-STAY: identical event log after mapping IDs back 252ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > pre-registered hypotheses are evaluated exactly as written, and the semantic result fingerprints stably 5ms
 ✓ test/s1.experiments.test.ts > ORC-BRUTE (oracle upper bound) > is deterministic and never earns less EXP than staying in zone 1 for the whole session 2452ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-FRONTIER: identical event log after mapping IDs back 283ms
 ✓ test/ledger.differential.test.ts > ledger differential: reference vs persistent > agree on every step of random sequences with replays, conflicts, failures and branch switches 5620ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > high enemy HP with crits stops at the work budget quickly 1578ms
 ✓ test/ledger.differential.test.ts > ledger differential: reference vs persistent > the generator exercises every operation kind and outcome 240ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-BEST-SHOWN: identical event log after mapping IDs back 668ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > POL-BEST-SHOWN: identical event log and S1 metrics on 3 seeds (45 min) 1474ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-SQUAD-W: 2 seeds x 45 min 1247ms
 ✓ test/s1.determinism.test.ts > rate estimator > the swing distribution is a probability distribution and exact when nothing is random 0ms
 ✓ test/s1.determinism.test.ts > rate estimator > equals the stepper exactly where it should: no crits, no retaliation, no spawn limit 147ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies import nothing but model types 1ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > the observation exposes no RNG state, queue, ledger internals or enemy instance timers 4ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies never receive the engine handle 3ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > a hero who always dies before dealing lethal damage: exactly 0 kills per life, unreachable 5ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > with crits, a nearly impossible zone is "unsafe" with a vanishing rate (base L1 zone 3) 0ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > an enemy that cannot hurt the hero: unlimited kills per life, no deaths, reliable 0ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > survival chain, hand-derived: 3 swings per kill, 1 enemy hit per fight, 3 hits to die -> 2 kills per life 2ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > survival chain: a lethal hit landing at the kill moment still credits the kill 2ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > S1.1 addendum: an impossible fight beyond the survival budget is exactly 0 kills/h and unreachable (v1.1 showed 0.0176) 441ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > the S1 control estimator is unchanged (pinned to S1-E02 values) 0ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > three materials per kill: quantities match the ledger; events count successful entries 6ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > two entries for the same resource: two events and the summed quantity per kill 4ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > production rates use quantities; drop-event rates are reported separately 64ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > the metrics recorder refuses a run whose metrics do not match the ledger 3ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > structured drops keep the entry index, and the log encoding round-trips 1ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > the S1.1 drops job checks each entry and the per-resource quantity against the ledger (qty-test variant) 45ms
 ✓ test/s2.legion.test.ts > control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly > CTL-FRONTIER-S1: identical event log and S1 metrics on 3 seeds (45 min) 484ms
 ✓ test/s2.legion.test.ts > roster: identities, quest Q1, purchases, slots, deploy cap, rare heroes > Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 206ms
 ✓ test/s2.legion.test.ts > roster: identities, quest Q1, purchases, slots, deploy cap, rare heroes > refused purchases and assignments change nothing (gold, free slot, deploy cap) 7ms
 ✓ test/s2.legion.test.ts > roster: identities, quest Q1, purchases, slots, deploy cap, rare heroes > a rare hero never adds a productive slot; extras wait in reserve; a duplicate gives one shard 4ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > a member knocked out IN the killing batch is eligible (simultaneous blows): full EXP to hero and recruit 4ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > a member knocked out BEFORE the killing batch gets nothing; its pending blows are discarded; the hero gets full EXP 5ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > threat order: the Warrior is targeted first; once knocked out it is never targeted, the hero is next 9ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > recovery: 20 s after the knockout, but not before the encounter in progress ends 6ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > recovery is immediate when the hero respawns 7ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > leaving the squad mid-encounter takes effect at once: pending blows go stale and the member is not eligible 3ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > joining mid-encounter counts from the next engagement only 4ms
 ✓ test/s2.legion.test.ts > squad combat, eligibility and knockouts (exact scenarios) > class, talent and respec commands are refused while the character is in an encounter, with no effect 6ms
 ✓ test/s2.legion.test.ts > classes, mastery, records and talents (owner §8; H-S2-05) > switching without training never creates mastery or records; a level-50 switch gives mastery level 1, not 50 5ms
 ✓ test/s2.legion.test.ts > classes, mastery, records and talents (owner §8; H-S2-05) > with training only the held class gains mastery, by the combat EXP; switching back restores that class talents 23ms
 ✓ test/s2.legion.test.ts > classes, mastery, records and talents (owner §8; H-S2-05) > the hero chooses a class from level 5 only; the first choice is free, later ones cost gold; level, EXP and HP fraction are kept 6ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > own encounter IDs and loot stream: worker kills never touch the account loot stream; zone kills and quest advance 21ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > three knockouts within five minutes stop the worker with a reason; it becomes idle and the stop is remembered 7ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > workers stop at a session end and resume at the next session start (no offline progress in S2) 9ms
 ✓ test/s2.legion.test.ts > independent combat workers (S2-R17) > reassigning a worker mid-fight cancels the fight: no credit for it, its blows go stale 6ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > an exact duplicate after the genuine credit is rejected (CREDIT_REPLAYED) and changes no character, balance, counter or stream 9ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > an exact duplicate before the genuine credit (the genuine one is then the replay) is rejected (CREDIT_REPLAYED) and changes no character, balance, counter or stream 8ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > a claim with another stream for the same encounter is rejected (CREDIT_CONFLICT) and changes no character, balance, counter or stream 7ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > an unknown encounter is rejected (CREDIT_UNKNOWN) and changes no character, balance, counter or stream 7ms
 ✓ test/s2.legion.test.ts > multi-character credit identity (owner §7) > is atomic: a credit that fails (ledger at its numeric limit) applies nothing to any character 1ms
 ✓ test/s2.legion.test.ts > estimators (owner §11) > hero alone: the squad estimate is estimator v1.2 unchanged 0ms
 ✓ test/s2.legion.test.ts > estimators (owner §11) > a squad estimate is labelled approximate and exposes its assumptions 1ms
 ✓ test/s2.legion.test.ts > estimators (owner §11) > impossible is structural (unreachable, DIES_BEFORE_KILL), distinct from no hit chance and from merely unsafe 6ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > same seed, same log; another seed, another log 149ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > a fork continues exactly like the original run 138ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > the reference and persistent ledgers give the same legion run 97ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > ORC2-SEARCH forks never leak into the real run: replaying its chosen plan reproduces the log exactly 2308ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > S1.1-R01 generalised: a zone block lifts after a level-up OR a later squad capability change, not before 0ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > realistic S2 policies import nothing from the engine (they see only the observation) 1ms
 ✓ test/s2.legion.test.ts > determinism, forks, search isolation and the observation boundary > time categories add up to the elapsed time and none is called active player input 85ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-WORKERS: 2 seeds x 45 min 4856ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-MIXED: 2 seeds x 45 min 4144ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > POL2-SQUAD-ATT: 2 seeds x 45 min 1830ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > harsher enemies (x3 damage): knockouts, hero deaths and worker stops happen, and still no violation 5489ms
 ✓ test/s2.invariants.test.ts > the reward-invariant monitor finds no violation (B1) > switching every recruit between squad and workers at EVERY decision (all boundaries) credits each kill once 476ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 0: account gold per credited kill equals the enemy's, every eligible member gets full EXP 70ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 1: account gold per credited kill equals the enemy's, every eligible member gets full EXP 88ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 2: account gold per credited kill equals the enemy's, every eligible member gets full EXP 151ms
 ✓ test/s2.invariants.test.ts > H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels) > squad of 3: account gold per credited kill equals the enemy's, every eligible member gets full EXP 172ms

 Test Files  29 passed (29)
      Tests  873 passed (873)
   Start at  22:28:00
   Duration  25.59s (transform 16.88s, setup 0ms, import 28.61s, tests 68.87s, environment 4ms)
```

## Appendix C. Statistical tests (`test-stats-output.txt`)

```

 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > high and low bytes of nextU32 are uniform (chi-square, 256 buckets) 200ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 5000 bp has the correct success rate (binomial interval) 290ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 100 bp has the correct success rate (binomial interval) 303ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 20 bp has the correct success rate (binomial interval) 287ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt(1, 6) is unbiased (chi-square, df = 5) 281ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt with span 2^31 + 1 rejects about half of all draws, and stays unbiased across halves 131ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-a) 4432ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > streams with adjacent counters are not correlated (chi-square on paired top bits, df = 3) 4594ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-b) 4649ms

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  22:28:28
   Duration  9.59s (transform 133ms, setup 0ms, import 359ms, tests 15.17s, environment 0ms)
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
| ledger | spec/fixtures/ledger.v1.json | 15 | 2 | 4 | 9 | 15 |
| legion-credit | spec/fixtures/legion-credit.v1.json | 7 | 2 | 2 | 3 | 7 |
| numeric | spec/fixtures/numeric.v1.json | 40 | 6 | 20 | 14 | 40 |
| remainder | spec/fixtures/remainder.v2.json | 33 | 9 | 12 | 12 | 33 |
| rewards | spec/fixtures/rewards.v1.json | 7 | 2 | 4 | 1 | 7 |
| rng | spec/fixtures/rng.v1.json | 46 | 11 | 15 | 20 | 46 |
| squad-fight | spec/fixtures/squad-fight.v1.json | 7 | 4 | 2 | 1 | 7 |
| stats | spec/fixtures/stats.v2.json | 20 | 3 | 6 | 11 | 20 |
| xp | spec/fixtures/xp.v2.json | 30 | 6 | 10 | 14 | 30 |
total cases: 340; problems: 0
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
oracle summary: 16 groups, 0 failing
```

## Appendix G. Experiment re-verification (exp2 --verify) (`exp-verify.txt`)

```
# exp2 --verify of every S2 manifest (L1 persistent ledger; re-run and compare the stored semantic fingerprint)
S2-E00-control-a0: stored bdebfcd69b2e811153a52943bac6fd9bda1c41eef7fb81f847658998b7466457
S2-E00-control-a0: rerun  bdebfcd69b2e811153a52943bac6fd9bda1c41eef7fb81f847658998b7466457 (ledger persistent)
S2-E00-control-a0: MATCH (5665 ms, 15 workers)
S2-E01-deploy-scaling: stored 6c434caa321dfcb56a6245d80e94a5c73226fb481d9ed8dad9edff7c5897fb58
S2-E01-deploy-scaling: rerun  6c434caa321dfcb56a6245d80e94a5c73226fb481d9ed8dad9edff7c5897fb58 (ledger persistent)
S2-E01-deploy-scaling: MATCH (39660 ms, 15 workers)
S2-E02-hero-damage-share: stored ca7de4c25f6653d56a5d59cb833fced9e4b121bb98a3fc66f875682678ff7ad0
S2-E02-hero-damage-share: rerun  ca7de4c25f6653d56a5d59cb833fced9e4b121bb98a3fc66f875682678ff7ad0 (ledger persistent)
S2-E02-hero-damage-share: MATCH (51958 ms, 15 workers)
S2-E04-class-switch-abuse: stored ca0dd467f43a183ac9e273808e14ea92491a65933e01b3b3759dd884eb71e42a
S2-E04-class-switch-abuse: rerun  ca0dd467f43a183ac9e273808e14ea92491a65933e01b3b3759dd884eb71e42a (ledger persistent)
S2-E04-class-switch-abuse: MATCH (3173 ms, 15 workers)
S2-E05-squad-vs-workers: stored c5bbd0865c8183a3ba30d259da00a1acaaee581c0612de76bb49de0623c538a3
S2-E05-squad-vs-workers: rerun  c5bbd0865c8183a3ba30d259da00a1acaaee581c0612de76bb49de0623c538a3 (ledger persistent)
S2-E05-squad-vs-workers: MATCH (39519 ms, 15 workers)
S2-E06-assignment-switching: stored 73f1f181b2fbdb607ad9d70b7c9c2e2eba8dc7c2a1362bb9191b940563e1c431
S2-E06-assignment-switching: rerun  73f1f181b2fbdb607ad9d70b7c9c2e2eba8dc7c2a1362bb9191b940563e1c431 (ledger persistent)
S2-E06-assignment-switching: MATCH (26095 ms, 15 workers)
S2-E07-knockout-sensitivity: stored acb0c1a54dca30c0a0033eaaa7c0a4cdfe009188d961f5415d8be37a11d30569
S2-E07-knockout-sensitivity: rerun  acb0c1a54dca30c0a0033eaaa7c0a4cdfe009188d961f5415d8be37a11d30569 (ledger persistent)
S2-E07-knockout-sensitivity: MATCH (16530 ms, 15 workers)
S2-E08-first-recruit-timing: stored 48c130a5637ec47472a7274560587761087ee091515a08e73edb4e865cad91a4
S2-E08-first-recruit-timing: rerun  48c130a5637ec47472a7274560587761087ee091515a08e73edb4e865cad91a4 (ledger persistent)
S2-E08-first-recruit-timing: MATCH (72280 ms, 15 workers)
S2-E09-hindsight-search: stored 0dc8463e65cdac3cb642b9a6de22e8ca4ea1a4db6d1764f565ce8d74d0c2cc00
S2-E09-hindsight-search: rerun  0dc8463e65cdac3cb642b9a6de22e8ca4ea1a4db6d1764f565ce8d74d0c2cc00 (ledger persistent)
S2-E09-hindsight-search: MATCH (245573 ms, 15 workers)
S2-E10-estimator-vs-realisation: stored 39c2be19a10fa054003709ff1c7d2a6072ad9abe347356034c12109247a4add2
S2-E10-estimator-vs-realisation: rerun  39c2be19a10fa054003709ff1c7d2a6072ad9abe347356034c12109247a4add2 (ledger persistent)
S2-E10-estimator-vs-realisation: MATCH (41240 ms, 15 workers)
```

## Appendix H. Reference-ledger cross-check (`reference-ledger-crosscheck.txt`)

```
# Reference-ledger cross-check (pre-registration section 1): one cell per experiment re-run on the reference ledger; cell 0 of each experiment, except S2-E09 where cell 4 (the first realistic cell) is used because the search cells fork hundreds of times per run
S2-E00-control-a0 cell 0 (a10-p1.6-g100|PR-NEW|POL-STAY), 200 runs on the reference ledger: MATCH (1530 ms)
  cell fingerprint stored 1e7b26aa0c625988ea51f102b5259d388ff03d09ee8852af350fd9f76324cbb6
  cell fingerprint rerun  1e7b26aa0c625988ea51f102b5259d388ff03d09ee8852af350fd9f76324cbb6
S2-E01-deploy-scaling cell 0 (a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0), 100 runs on the reference ledger: MATCH (2190 ms)
  cell fingerprint stored 8cfeaa62cbd69c2881e2c15b9e39812f76ab162086961e5b583bb99e459dd897
  cell fingerprint rerun  8cfeaa62cbd69c2881e2c15b9e39812f76ab162086961e5b583bb99e459dd897
S2-E02-hero-damage-share cell 0 (a10-p1.6-g100|L10-Z2|hero-warrior|all-W|passive), 100 runs on the reference ledger: MATCH (2798 ms)
  cell fingerprint stored c266b361cc01c9415037cb74e6d0d3f267fb38981db1e1e234542d65f0d95866
  cell fingerprint rerun  c266b361cc01c9415037cb74e6d0d3f267fb38981db1e1e234542d65f0d95866
S2-E04-class-switch-abuse cell 0 (a10-p1.6-g100|L50|cycles-1|no-train), 100 runs on the reference ledger: MATCH (361 ms)
  cell fingerprint stored 08b85ba9c93225d613eedb8e97a71da00f505354c051417f43c87c82daa38a3a
  cell fingerprint rerun  08b85ba9c93225d613eedb8e97a71da00f505354c051417f43c87c82daa38a3a
S2-E05-squad-vs-workers cell 0 (a10-p1.6-g100|PR-BAL|POL2-SQUAD), 100 runs on the reference ledger: MATCH (5856 ms)
  cell fingerprint stored 7af8444e1a7643d9d21569cab9386566bd53f08eff71d01f46a8aa4fea15499c
  cell fingerprint rerun  7af8444e1a7643d9d21569cab9386566bd53f08eff71d01f46a8aa4fea15499c
S2-E06-assignment-switching cell 0 (a10-p1.6-g100|PR-BAL|POL2-SQUAD), 100 runs on the reference ledger: MATCH (6034 ms)
  cell fingerprint stored f019560704b3539b42af456450e96ebc7bf87abd728b2f8b401b1511ae296e82
  cell fingerprint rerun  f019560704b3539b42af456450e96ebc7bf87abd728b2f8b401b1511ae296e82
S2-E07-knockout-sensitivity cell 0 (a10-p1.6-g100|PR-BAL|POL2-SQUAD), 100 runs on the reference ledger: MATCH (6107 ms)
  cell fingerprint stored 5c361d953710a22ca3bb830731593a0b37b503f7accdb36480c5d749c8eb2b1a
  cell fingerprint rerun  5c361d953710a22ca3bb830731593a0b37b503f7accdb36480c5d749c8eb2b1a
S2-E08-first-recruit-timing cell 0 (a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q25), 100 runs on the reference ledger: MATCH (4341 ms)
  cell fingerprint stored 1f750ecdc052851711de8ab342e72092d8e95e5008174ca749ecaa764d2a3a9f
  cell fingerprint rerun  1f750ecdc052851711de8ab342e72092d8e95e5008174ca749ecaa764d2a3a9f
S2-E09-hindsight-search cell 4 (a10-p1.6-g100|PR-BAL|POL2-SQUAD), 50 runs on the reference ledger: MATCH (3460 ms)
  cell fingerprint stored 5f77af6a0d742e18239bf694562de66befff9ebb02c39ebba93d7f3fe9a9e5fa
  cell fingerprint rerun  5f77af6a0d742e18239bf694562de66befff9ebb02c39ebba93d7f3fe9a9e5fa
S2-E10-estimator-vs-realisation cell 0 (a10-p1.6-g100|L1-Z1|squad-0), 100 runs on the reference ledger: MATCH (1091 ms)
  cell fingerprint stored ac114ab4a32d85dc3c6635d7e7fc18a1113d6a53259764fba171f97c91dfb7c7
  cell fingerprint rerun  ac114ab4a32d85dc3c6635d7e7fc18a1113d6a53259764fba171f97c91dfb7c7
```

## Appendix I. Determinism (`determinism.txt`)

```
# Determinism (gate 3): identical re-run, a second seed root, two-sample KS tests (alpha 0.001) per cell and manifest metric
S2-E05-squad-vs-workers: determinism rerun identical=true fingerprint=true; second root differs in 600/600; KS rejections 0/78
S2-E01-deploy-scaling: determinism rerun identical=true fingerprint=true; second root differs in 1200/1200; KS rejections 0/216
```

## Appendix J. S2 mutation check (final) (`mutation-check.txt`)

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
- M1 [src/engine/legion.ts] squad EXP is divided among the eligible characters: detected by 14 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 97ms
- M2 [src/engine/legion.ts] the account loot stream is rolled once per eligible character: detected by 17 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 114ms
- M3 [src/engine/legion.ts] a member knocked out before the killing batch still receives EXP: detected by 4 failing test(s); e.g. × a member knocked out BEFORE the killing batch gets nothing; its pending blows are discarded; the hero gets full EXP 7ms
- M4 [src/engine/legion.ts] every deployed character is eligible, even one that joined mid-encounter: detected by 4 failing test(s); e.g. × joining mid-encounter counts from the next engagement only 7ms
- M5 [src/engine/legion.ts] leaving the squad does not cancel the member's pending blows: detected by 1 failing test(s); e.g. × leaving the squad mid-encounter takes effect at once: pending blows go stale and the member is not eligible 6ms
- M6 [src/engine/legion.ts] reassigning a worker does not cancel its fight (it can fight in two places): detected by 2 failing test(s); e.g. × reassigning a worker mid-fight cancels the fight: no credit for it, its blows go stale 8ms
- M7 [src/engine/legion.ts] mastery is granted to every class, not only the held one: detected by 19 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 116ms
- M8 [src/engine/legion.ts] a class change copies the old class's mastery into the new one: detected by 1 failing test(s); e.g. × with training only the held class gains mastery, by the combat EXP; switching back restores that class talents 16ms
- M9 [src/engine/legion.ts] a knocked-out member keeps being targeted: detected by 2 failing test(s); e.g. × threat order: the Warrior is targeted first; once knocked out it is never targeted, the hero is next 8ms
- M10 [src/engine/legion.ts] a knocked-out member recovers at the timer even during the encounter: detected by 1 failing test(s); e.g. × recovery: 20 s after the knockout, but not before the encounter in progress ends 6ms
- M11 [src/engine/legion.ts] workers never stop after repeated knockouts: detected by 1 failing test(s); e.g. × three knockouts within five minutes stop the worker with a reason; it becomes idle and the stop is remembered 8ms
- M12 [src/engine/legionCredit.ts] a committed legion claim stays pending (duplicates credited again): detected by 2 failing test(s); e.g. × an exact duplicate after the genuine credit is rejected (CREDIT_REPLAYED) and changes no character, balance, counter or stream 5ms
- M13 [src/engine/legionCredit.ts] the stream is not part of the claim identity: detected by 1 failing test(s); e.g. × a claim with another stream for the same encounter is rejected (CREDIT_CONFLICT) and changes no character, balance, counter or stream 9ms
- M14 [src/engine/legionCommands.ts] class changes are allowed during combat: detected by 1 failing test(s); e.g. × class, talent and respec commands are refused while the character is in an encounter, with no effect 8ms
- M15 [src/engine/legionCommands.ts] the deploy cap is not enforced: detected by 1 failing test(s); e.g. × refused purchases and assignments change nothing (gold, free slot, deploy cap) 7ms
- M16 [src/engine/legionCommands.ts] a recruit can be bought without enough gold: detected by 1 failing test(s); e.g. × refused purchases and assignments change nothing (gold, free slot, deploy cap) 6ms
- M17 [src/engine/legion.ts] a rare hero takes a productive slot beyond the limit (extra slot): detected by 1 failing test(s); e.g. × a rare hero never adds a productive slot; extras wait in reserve; a duplicate gives one shard 6ms
- M18 [src/engine/squadEstimator.ts] the squad estimator calls a structurally impossible fight merely unsafe: detected by 1 failing test(s); e.g. × impossible is structural (unreachable, DIES_BEFORE_KILL), distinct from no hit chance and from merely unsafe 7ms
- M19 [src/engine/legion.ts] a worker kill consumes the account loot stream instead of the worker's: detected by 6 failing test(s); e.g. × own encounter IDs and loot stream: worker kills never touch the account loot stream; zone kills and quest advance 15ms
- M20 [src/policy/legionRealistic.ts] the realistic policy never lifts a zone block after a squad capability change (S1.1-R01): detected by 1 failing test(s); e.g. × S1.1-R01 generalised: a zone block lifts after a level-up OR a later squad capability change, not before 4ms
```

## Appendix K. S2 mutation check (run 1, before the tests were strengthened) (`mutation-check-run1.txt`)

```
M1: NOT DETECTED (0 failing) restored=True | squad EXP is divided among the eligible characters
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
M20: NOT DETECTED (0 failing) restored=True | the realistic policy never lifts a zone block after a squad capability change (S1.1-R01)

S2 mutation check: 20 planted bugs, 18 detected, 2 not detected; all files restored: True
- M1 [src/engine/legion.ts] squad EXP is divided among the eligible characters: NOT detected by 0 failing test(s)
- M2 [src/engine/legion.ts] the account loot stream is rolled once per eligible character: detected by 17 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 129ms
- M3 [src/engine/legion.ts] a member knocked out before the killing batch still receives EXP: detected by 4 failing test(s); e.g. × a member knocked out BEFORE the killing batch gets nothing; its pending blows are discarded; the hero gets full EXP 8ms
- M4 [src/engine/legion.ts] every deployed character is eligible, even one that joined mid-encounter: detected by 4 failing test(s); e.g. × joining mid-encounter counts from the next engagement only 8ms
- M5 [src/engine/legion.ts] leaving the squad does not cancel the member's pending blows: detected by 1 failing test(s); e.g. × leaving the squad mid-encounter takes effect at once: pending blows go stale and the member is not eligible 7ms
- M6 [src/engine/legion.ts] reassigning a worker does not cancel its fight (it can fight in two places): detected by 2 failing test(s); e.g. × reassigning a worker mid-fight cancels the fight: no credit for it, its blows go stale 8ms
- M7 [src/engine/legion.ts] mastery is granted to every class, not only the held one: detected by 19 failing test(s); e.g. × Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each 130ms
- M8 [src/engine/legion.ts] a class change copies the old class's mastery into the new one: detected by 1 failing test(s); e.g. × with training only the held class gains mastery, by the combat EXP; switching back restores that class talents 20ms
- M9 [src/engine/legion.ts] a knocked-out member keeps being targeted: detected by 2 failing test(s); e.g. × threat order: the Warrior is targeted first; once knocked out it is never targeted, the hero is next 9ms
- M10 [src/engine/legion.ts] a knocked-out member recovers at the timer even during the encounter: detected by 1 failing test(s); e.g. × recovery: 20 s after the knockout, but not before the encounter in progress ends 7ms
- M11 [src/engine/legion.ts] workers never stop after repeated knockouts: detected by 1 failing test(s); e.g. × three knockouts within five minutes stop the worker with a reason; it becomes idle and the stop is remembered 10ms
- M12 [src/engine/legionCredit.ts] a committed legion claim stays pending (duplicates credited again): detected by 2 failing test(s); e.g. × an exact duplicate after the genuine credit is rejected (CREDIT_REPLAYED) and changes no character, balance, counter or stream 7ms
- M13 [src/engine/legionCredit.ts] the stream is not part of the claim identity: detected by 1 failing test(s)
```

## Appendix L. Pre-registered analyses B0-B6 (`analysis.txt`)

```
B0 (gate) control A0 against S1.1-E01
  148 metric summaries compared, 0 differ; event-log digests identical in 4/4 cells -> PASS

B1 (gate) invariants H-S2-02, H-S2-05, H-S2-06 in every run
  invariant monitor: 14050 runs, 751927546 checks, 0 violations; engineering hypotheses 148/148 pass -> PASS

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
  gold: search 12006.6 vs POL2-SQUAD 11581.8 -> ratio 1.037
  gold: search 12006.6 vs POL2-WORKERS 12225.1 -> ratio 0.982
  gold: search 12006.6 vs POL2-MIXED 13114.2 -> ratio 0.916
  conquest: search 3001006129.6 vs POL2-SQUAD 3001002165.3 -> ratio 1.000
  conquest: search 3001006129.6 vs POL2-WORKERS 3001005564.3 -> ratio 1.000
  conquest: search 3001006129.6 vs POL2-MIXED 3001004415.5 -> ratio 1.000
  a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp: forks 341.4, decisions 30.7, budget exhausted in 0% of runs
  a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp: forks 341.4, decisions 30.7, budget exhausted in 0% of runs
  a10-p1.6-g100|PR-BAL|ORC2-SEARCH-gold: forks 225, decisions 22, budget exhausted in 0% of runs
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

wrote results/s2/analysis-gates.json
```

## Appendix M. Manifest registration (`manifest-registration.txt`)

```
2026-11-13T22:15:33Z d7b99c07302d657d manifests/s2/S2-E00-control-a0.json
2026-11-13T22:15:33Z 1f2b6f01c15e2fde manifests/s2/S2-E01-deploy-scaling.json
2026-11-13T22:15:33Z 02ad2d3f4702657d manifests/s2/S2-E02-hero-damage-share.json
2026-11-13T22:15:33Z 9c5055132290d80e manifests/s2/S2-E04-class-switch-abuse.json
2026-11-13T22:15:33Z 53807463b09c637c manifests/s2/S2-E05-squad-vs-workers.json
2026-11-13T22:15:33Z b433a0b06b5ddd11 manifests/s2/S2-E06-assignment-switching.json
2026-11-13T22:15:33Z c3f4bf71bcff2c15 manifests/s2/S2-E07-knockout-sensitivity.json
2026-11-13T22:15:33Z f2519f9195cffa97 manifests/s2/S2-E08-first-recruit-timing.json
2026-11-13T22:15:33Z 0ee1b60ddd808113 manifests/s2/S2-E09-hindsight-search.json
2026-11-13T22:15:33Z 383926bb5e957ac4 manifests/s2/S2-E10-estimator-vs-realisation.json
plan document unchanged: f4d70eed1b6ed80c
```

## Appendix N. Frozen simulator, archive and old workspaces (`frozen-check.txt`)

```
Frozen simulator, Original v1 archive and old workspace check after S2 (2026-11-13T22:43:59Z)
Frozen workspace files: 3012 (M0: 3012)
path/size/mtime list vs M0 start: IDENTICAL
content SHA-256 list vs M0 start: IDENTICAL
combined fingerprint: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d (M0: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d)
frozen HEAD: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; Original v1 working files: 12 (M0: 12)
archive master 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; archive/increment6-original-v1 8d80a440d9818c961713b767f696764b3f18db66; remotes 0
old Legion workspace: 16 files IDENTICAL to the copy-time hashes
All git reads used GIT_OPTIONAL_LOCKS=0; nothing was written to these locations.
```

## Appendix O. Git status (`git-status.txt`)

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
?? legion-progression-lab/evidence/s2/schemas-check.txt
?? legion-progression-lab/evidence/s2/test-output.txt
?? legion-progression-lab/evidence/s2/test-stats-output.txt
?? legion-progression-lab/evidence/s2/tool-versions.txt
?? legion-progression-lab/evidence/s2/typecheck.txt
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
?? legion-progression-lab/planning/S2_RESOLUTIONS.md
?? legion-progression-lab/planning/S2_SPECIFICATION.md
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
?? legion-progression-lab/src/core/ledger/differential.ts
?? legion-progression-lab/src/core/ledger/implementations.ts
?? legion-progression-lab/src/core/ledger/persistentLedger.ts
?? legion-progression-lab/src/core/ledger/persistentMap.ts
?? legion-progression-lab/src/engine/legion.ts
?? legion-progression-lab/src/engine/legionCommands.ts
?? legion-progression-lab/src/engine/legionCredit.ts
?? legion-progression-lab/src/engine/legionObservation.ts
?? legion-progression-lab/src/engine/squadEstimator.ts
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
?? legion-progression-lab/test/s2.invariants.test.ts
?? legion-progression-lab/test/s2.legion.test.ts
?? spec/fixtures/legion-credit.v1.json
?? spec/fixtures/squad-fight.v1.json
?? spec/formulas/s2-legion.md
?? spec/oracle/s2_oracle.py

$ git diff --stat s1-checkpoint
 legion-progression-lab/CHANGELOG.md                | 23 ++++++++++
 legion-progression-lab/PROVENANCE.md               |  8 ++++
 legion-progression-lab/README.md                   | 10 ++++-
 legion-progression-lab/src/cli/exp.ts              |  8 +++-
 legion-progression-lab/src/core/ledger/ledger.ts   |  3 +-
 legion-progression-lab/src/engine/simulation.ts    |  8 ++--
 legion-progression-lab/src/experiments/jobs.ts     | 15 ++++---
 legion-progression-lab/src/experiments/metrics.ts  |  9 ++++
 legion-progression-lab/src/spec/fixtureRunner.ts   | 49 ++++++++++++--------
 legion-progression-lab/src/spec/fixtureSchema.ts   |  2 +-
 .../test/fixtures.conformance.test.ts              |  2 +-
 spec/formulas/ledger.md                            | 52 ++++++++++++++++++++++
 spec/oracle/check_all.py                           |  1 +
 spec/schema/fixture.schema.json                    |  4 +-
 14 files changed, 159 insertions(+), 35 deletions(-)
```

## Appendix P. Tool versions (`tool-versions.txt`)

```
Captured: 2026-11-13T22:28:39Z
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
package-lock.json sha256: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6 (S0: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6)
```
