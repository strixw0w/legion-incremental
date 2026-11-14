# S2 pre-registration — experiment plan

**Registered before S2 implementation began** (owner "S1.1 Acceptance and S2 Authorisation" §6: "Before implementation, create a concise S2 specification and preregister the experiments").

**What is registered when:**
- This document's hash is recorded in `preregistration.json` now.
- The machine-readable manifests encode this plan. They are written once the engine exists, and registered (hashed) **before any S2 experiment runs**.
- A manifest may make this plan concrete (variant names, replicate counts within the stated ranges). It may not change a hypothesis, target, metric definition or analysis rule. Any deviation is an amendment, registered before it runs and reported.

**Basis:**
- `planning/S2_SPECIFICATION.md` v1.0;
- `planning/S2_RESOLUTIONS.md` v1.0;
- experiment plan §8 (S2) and §9.2–9.3.

**Labels:**
- Content: `content/w1-slice-s2.candidate.v0.2.0.json`. It is the S1 content unchanged, plus S2 sections; every value is a candidate.
- Every result is model output. Targets are never moved after results, and no class is tuned until an experiment passes (owner §9).

## 1. Profiles and seeds
- **Profiles:** single sessions, as in S1: PR-NEW 45 min, PR-BAL 60 min, PR-OPT 90 min. No offline time.
- **Seeds:** common random numbers within each experiment (`<root>#rep-<i>`); 100–200 replicates per cell (search: 50).
- **Ledger:** the L1 persistent ledger once its gates pass; one cell per experiment is re-run on the reference ledger and must give identical fingerprints.

## 2. Experiments
| ID | Question | Design |
|---|---|---|
| S2-E00 | Control A0: does the S2 engine reproduce S1.1 for the hero alone? | S1.1 policies POL-STAY / POL-FRONTIER, hero only, S2 features off, PR-NEW / PR-BAL, S1-E01 seeds; compared with S1.1-E01 |
| S2-E01 | Deploy scaling 0–3 | Realistic squad policy with at most k ∈ {0, 1, 2, 3} deployed (mixed classes), PR-BAL and PR-OPT. Also frozen-level matched cells (level 10, zone 2, squad sizes 0–3) |
| S2-E02 | Hero damage share by build | Matched state: every character level 10, zone 2, frozen. Hero class ∈ {Warrior, Archer, Mage} × recruit composition ∈ {all-W, all-A, all-M, mixed}. Hero ability passive vs attentive. 30 min |
| S2-E03 | Credit invariants | All S2-E01 and S2-E05 runs are checked per kill (the engine's invariant monitor), plus property and scenario tests |
| S2-E04 | Class-switch abuse | Matched state: level-50 characters cycle every class 1–20 times, with and without training between switches |
| S2-E05 | Squad vs workers | Policies: all recruits in the squad / all as workers / one deployed and the rest workers. PR-BAL and PR-OPT. Objectives reported separately: hero EXP, legion EXP, gold, conquest |
| S2-E06 | Assignment switching | Squad↔worker switching every 1, 5 or 30 min, against set-and-forget, PR-BAL |
| S2-E07 | Knockout sensitivity | Enemy damage ×0.5 / ×1 / ×1.5 / ×2, full squad policy, PR-BAL |
| S2-E08 | First recruit timing | Quest Q1 size ∈ {25, 40, 60} × realistic policies, PR-NEW and PR-BAL |
| S2-E09 | Hindsight search | ORC2-SEARCH for each objective (hero EXP, legion EXP, gold, conquest), against the realistic policies, PR-BAL, 50 replicates, declared budgets |
| S2-E10 | Squad estimator vs realisation | Frozen levels 1/5/10 × zones 1–3 × squad sizes 0–3, continuous-farming reference, against the squad estimator; and the worker estimator against worker realisation |

## 3. Hypotheses
| ID | Statement | Role | Pre-registered target |
|---|---|---|---|
| H-S2-01 | First recruit in 2–5 active minutes (R03.03) | target | p50 of `firstRecruitMin` in [2, 5] (S2-E08 at N = 40, and S2-E01 realistic cells) |
| H-S2-02 | Loot per kill is independent of the deployed count | engineering | Gold and loot draws per credited squad kill equal the enemy's values exactly, in every run, for k = 0–3 |
| H-S2-03 | The hero's damage share is 30–60% for balanced builds (R02.03; band unapproved) | target | p50 of `heroDamageShare` in [0.30, 0.60] for the mixed composition, each hero class, passive |
| H-S2-04 | Switching gains at most 5% over set-and-forget in 1 h | target | Mean legion EXP: (switching / set-and-forget − 1) ≤ 0.05 for every switching period |
| H-S2-05 | No mastery gain from switching without training | engineering | Account class records and every character's mastery unchanged after any number of switches without combat; with training, only the held class gains |
| H-S2-06 | Full personal EXP per eligible member | engineering | Every eligible member's EXP gain per kill equals the enemy's EXP, in every run; ineligible members gain 0 |
| H-S2-07 | How recruits change level-5 and zone timing (S1 H-S1-05, 07a, 07b) | reported | `minToL5`, `minToL10`, zone first visits, against the S1.1 control |

The S1 targets H-S1-01 … 07b are also reported, unchanged, for the S2 realistic policies.

## 4. Pre-registered analyses
- **B0 (gate).** S2-E00 metric summaries equal S1.1-E01's `POL-*|est-s1.1` summaries for every metric present in both.
- **B1 (gate).** Invariants H-S2-02, H-S2-05 and H-S2-06 hold in every run and test. The invariant monitor reports 0 violations.
- **B2.** Targets H-S2-01, 03 and 04 are reported as pass, miss or not reached, with the closest variant. A miss does not block acceptance.
- **B3.** Squad versus workers is reported per objective. No single "best" is declared across objectives.
- **B4.** Search results are reported as the "best feasible found", with their budgets and access to hindsight declared. Gaps to realistic policies are lower bounds on the true gap, never upper bounds.
- **B5.** The estimator's predicted versus realised production is reported per cell with its reliability. No accuracy target is set for the squad estimator (owner §11).
- **B6.** Recruit-dependent changes to level-5 and zone timings are compared with the S1.1 control.

## 5. Engineering gates for S2 acceptance (separate from balance results)
1. Type check; default and statistical tests; fixtures; independent oracles (new families for multi-character credit and squad fights); schemas.
2. B0 and B1.
3. Determinism: identical re-runs, different second seeds, KS tests.
4. Mutation checks: planted bugs in multi-character credit, eligibility, assignment exclusivity, class mastery and knockout are each detected.
5. `exp:verify` MATCH for every S2 experiment, and a reference-ledger cross-check.
6. Frozen simulator, archive and old workspaces unchanged.
