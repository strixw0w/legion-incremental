# S1-E03-earlier-zone-audit

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Is an earlier zone ever better, and is the newest zone worth entering?

**Design.** PR-OPT session with POL-STAY; at the first visit of zones 2 and 3 (matched state), every accessible zone gets its displayed estimate and a 15-minute fork farming that zone (ORC-FORK, oracle/diagnostic; travel time included). 200 replicates.

**Seeds:** root `S1-E03`, 200 replicates per cell (replicate i uses `S1-E03#rep-i`).

**Semantic fingerprint:** `f231bbf2cffb42bf3cc6fff801380b14db6bf0b5bf2eef7c5c5659a75422be7d` (manifest SHA-256 `4bd7068129aecb392ec5ce24f543b805f98291831e3eac4d337808bc86d26202`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |
|---|---|---|---|---|---|---|
| H-S1-10 | Prior zones can be better EXP/h for some builds; the newest zone is still worth entering (reported, no pass/fail; the owner decides) | reported | p50 >= 0 EXP/h | base|PR-OPT|POL-STAY | 5984 | reported |

*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | visit2.atMin | visit2.level | visit2.z1.forkExpPerHour | visit2.z2.forkExpPerHour | visit3.atMin | visit3.level | visit3.z1.forkExpPerHour | visit3.z2.forkExpPerHour | visit3.z3.forkExpPerHour |
|---|---|---|---|---|---|---|---|---|---|---|
| base|PR-OPT|POL-STAY | model-output (realistic) | 5.02 / 5.08 / 5.12 | 6 / 6 / 6 | 6384 / 6448 / 6512 | 7080 / 7160 / 7240 | 16.18 / 16.29 / 16.39 | 10 / 10 / 10 | 9088 / 9088 / 9088 | 8360 / 8400 / 8400 | 5896 / 5984 / 6072 |

## Earlier-zone audit (H-S1-10)

| Cell | At first visit of zone | Replicates | Earlier zone beats newest (fork, model-output) | Earlier zone beats newest (estimate) | Estimate and fork agree | Tag |
|---|---|---|---|---|---|---|
| base|PR-OPT|POL-STAY | 2 | 200 | 0% | 100% | 0% | HYPOTHESIS |
| base|PR-OPT|POL-STAY | 3 | 200 | 100% | 100% | 100% | CONFIRMED IN MODEL |

## Notes and limitations

- S1 is a single-character diagnostic model (experiment plan principle 10): no recruits, classes, abilities, gear, sinks, offline progress or Monuments; gold and materials only accumulate.
- All inputs are candidates (content w1-slice.candidate.v0.1.0 and the S1 resolutions S1-R01..R17); every output is model-output, not live-validated.
- Engagement overhead and walk times are the most uncertain inputs (to be measured in M2).
- A fork result is CONFIRMED IN MODEL only when the estimate and the fork pick the same best zone in at least 90% of replicates; otherwise HYPOTHESIS (experiment plan 9.1).

