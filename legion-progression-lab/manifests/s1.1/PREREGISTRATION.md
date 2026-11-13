# S1.1 pre-registration — regression and experiment plan

**Written and hashed before any S1.1 experiment ran.**

**Basis:**
- the owner's "Independent S1 Review and S1.1 Authorisation" §10;
- `planning/S1_OWNER_RESOLUTIONS.md` v1.0;
- `planning/S1_1_RESOLUTIONS.md` v1.0.

**Labels:**
- Every input is candidate content `w1-slice.candidate.v0.1.0`, unchanged, and the EXP curve is unchanged; it is the control.
- Every output is model output. Nothing is live-validated.

**Targets:** the S1 targets (H-S1-..), copied **unchanged** from the S1 manifests. They are never changed after results are seen. The progression curve is not retuned to meet them.

**Historical evidence.** The S1 manifests, results and fingerprints stay as they are (`manifests/s1/`, `evidence/s1/`). S1.1 results are new results in `results/s1.1/` and `evidence/s1.1/`, and are never presented as the original results.

## 1. Defect reproductions (before experiments)
`repro/s1.1/defects.mjs` runs the same scenarios against:
- the **original** implementation: the extracted S1 review package, ZIP SHA-256 `b255d94b…6d7fd3`, verified against its manifest;
- the **corrected** working tree.

| | Owner § | Scenario |
|---|---|---|
| D1 | §2 | An injected duplicate `KillCredited`, on 6 seeds |
| D2 | §3 | Fixed zone 3 at frozen level 1 |
| D3 | §4 | Triggers at both gate completions |
| D4 | §5 | Estimator with zero and tiny hit chance, and a hero who always dies first |
| D5 | §6 | 3 materials per kill, and two entries for one resource |
| D6 | §7 | Auto-farm off after the first kill |
| D7 | §7 audit | Regeneration after a manual kill |
| D8 | §7 audit | A manual Engage waiting at a session end |

## 2. Experiments
| ID | Kind | Design (seed root as in S1) | Runs | Purpose |
|---|---|---|---|---|
| S1.1-E01 | campaign | base (a10-p1.6-g100) × PR-NEW, PR-BAL × {CTL-STAY-S1, CTL-FRONTIER-S1, CTL-BEST-SHOWN-S1, POL-STAY, POL-FRONTIER, POL-BEST-SHOWN} × estimator {s1, s1.1}; 200 replicates; root S1-E01 | 4,800 | Base calibration cells, S1 reproduction (A1), attribution (A2), targets (A7) |
| S1.1-E02 | estimator | 9 cells (L1/5/10 × Z1–3, frozen) × {CTL-FIXED-S1, POL-FIXED}; 60 min; 200 replicates; root S1-E02 | 3,600 | Estimator v1.1 against the stepper; the S1 estimator alongside (A5) |
| S1.1-E03 | audit | PR-OPT, base policy CTL-STAY-S1, 15-min CTL-FIXED-S1 forks, estimator v1.1; 200 replicates; root S1-E03 | 200 | Matched-state earlier-zone audit, repeated (A1, A8) |
| S1.1-E04 | campaign | enemy damage ×0.5/×1/×1.5/×2 (HP per level ×1) × PR-BAL × the 6 policies; estimator v1.1; 200 replicates; root S1-E04 | 4,800 | Reckless S1 logic against corrected realistic recovery (A4) |
| S1.1-E05 | drops | base and qty-test drop table × zones 1–3 at level 100; 60 min; 100 replicates, seeds per cell | 600 | Drop probabilities per entry and awarded quantities against the ledger (A3) |
| S1.1-E06 | determinism | as S1-E07 with POL-FRONTIER, POL-STAY, POL-BEST-SHOWN; re-run and second root | 3 × 1,200 | Determinism of the corrected engine (A6) |
| S1.1-E07 | campaign | base, PR-BAL, 200 replicates, root S1-E08; POL-*, CTL-*-S1 × estimator {s1.1, s1}; ORC-BRUTE (one cell) | 2,600 | Policy comparison with corrected triggers (A1, A2) |

**Omitted re-runs, and why** (owner §10: "do not unnecessarily repeat the entire large parameter sweep"):
- **S1-E01's 29-variant sweep and S1-E05's 81-variant gate sweep are not repeated.**
  - The engine corrections do not change runs of the S1 decision logic. That claim is tested, not assumed: gate A1 on the base cells of E01, E03 and E07.
  - The policy correction is measured on the base cells (E01, E07) and across enemy damage (E04).
  - The sweeps tuned no number, and no retuning is allowed.
  - If A1 fails, the omitted sweeps are declared **not interpretable** and listed as requiring new results.
- **S1-E06** (under-sampled, superseded by S1-E06b in S1) is not repeated; E05 repeats S1-E06b.

## 3. Pre-registered analyses
- **A1 — S1 reproduction (engineering gate).** Every metric summary (n, reached, p10, p50, p90, mean, min, max) that exists in both must be **identical**:
  - S1.1-E01 `CTL-STAY-S1|est-s1` and `CTL-FRONTIER-S1|est-s1` equal S1-E01's `a10-p1.6-g100|…|POL-STAY` and `…|POL-FRONTIER`, profile by profile;
  - S1.1-E07 `CTL-*-S1|est-s1` equal S1-E08's `POL-*` rows;
  - S1.1-E03's visit and fork metrics equal S1-E03's (the estimate columns are excluded, because the estimator changed).

  Any difference is reported cell by cell and makes the affected old experiments "require new results".
- **A2 — Attribution.** For each policy family (STAY, FRONTIER, BEST-SHOWN) and profile, report the medians and means of the main metrics at each step. Each step changes one cause:

  | Step | What it is | Cause of the change from the previous step |
  |---|---|---|
  | L0 | the S1 published cell | (starting point) |
  | L1 | `CTL|est-s1` | bug fix |
  | L2 | `CTL|est-s1.1` | estimator correction (measurement correction) |
  | L3 | `POL|est-s1.1` | policy correction |

  - Main metrics: EXP, level at 60 min, zone visits, deaths/h, auto-farm stops, idle minutes.
  - `POL|est-s1` is reported as the cross-check for interaction.
  - ORC-BRUTE's change from S1-E08 to S1.1-E07 is a bug fix (triggers).
- **A3 — Drops (engineering gate).** In S1.1-E05:
  - every drop entry's success count lies inside its exact 99.9% binomial interval;
  - every run's awarded quantities equal the ledger (0 mismatches; the metrics recorder refuses any difference);
  - in the qty-test cells, quantity = 3 × entry-0 successes + 2 × entry-1 successes.
- **A4 — Survival comparison (reported, no target).** In S1.1-E04, for each damage level and policy pair, report deaths/h, auto-farm stops, policy stop reports, idle minutes, zone 3 first visit, level at 60 min and total EXP.
- **A5 — Estimator (H-S1-09 unchanged).**
  - H-S1-09 is evaluated on the CTL-FIXED-S1 cells; the estimator assumes continuous farming.
  - For every cell, report the v1.1 error, the S1 estimator's error, the v1.1 reliability and its reasons.
  - Report every cell whose simulated rate is 0 together with its v1.1 kills/h.
  - The POL-FIXED cells are reported as the effect of respecting the stop.
- **A6 — Determinism (engineering gate).** In S1.1-E06:
  - re-run digests and fingerprints identical;
  - every second-root run differs;
  - KS rejections reported.
- **A7 — Targets (reported, never moved).** H-S1-01 … 07b are evaluated in every S1.1-E01 cell.
  - The S1.1 result is the `POL-*|est-s1.1` cells.
  - Pass, miss or not reached is reported exactly.
  - A miss does not block acceptance (experiment plan principle 9).
- **A8 — Which old experiments remain interpretable.** Each S1 experiment is classified as "remains interpretable (as S1 logic)", "partly superseded" or "requires new results", using A1 and the attribution in A2.

## 4. Engineering gates for S1.1 acceptance (separate from balance results)
1. Type check clean; default and statistical test suites pass. The suites include the injected-duplicate, trigger, recovery, auto-farm, session, estimator and drop regression tests.
2. Every fixture passes. The independent Python oracles report 0 failures, including the new `credits` and `estimator` families and the extended `rewards` and `gates` families.
3. Exported schemas match their source.
4. The S0-R01 curve preview fingerprint is unchanged.
5. A1, A3 and A6 pass.
6. Mutation checks: planted bugs in each critical fix are detected and the source is restored.
7. `exp:verify` re-runs every S1.1 manifest with a MATCH.
8. The frozen simulator, the Original v1 archive and the old workspaces are unchanged.
