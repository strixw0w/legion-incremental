# S1.1-E03-earlier-zone-audit

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Repeated with estimator v1.1: at the first visit of zones 2 and 3, does an earlier zone give more EXP/h, by fork and by the corrected estimate?

**Design.** As S1-E03: PR-OPT, base policy CTL-STAY-S1 (reaches the same first-visit states as S1-E03's POL-STAY with the same seeds), 15-minute CTL-FIXED-S1 forks per accessible zone, 200 replicates, S1-E03 seed root. Estimates from estimator v1.1.

**Seeds:** root `S1-E03`, 200 replicates per cell (replicate i uses `S1-E03#rep-i`).

**Semantic fingerprint:** `12a24bea05f61c4927c16287ac46b6511e29b80bb3b21d23a48f402e1cb49b6f` (manifest SHA-256 `fbad0dcee058864bb65a485f4a65c1deed80460c92c38453273865a10e0acf9a`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |
|---|---|---|---|---|---|---|
| H-S1-10 | Prior zones can be better EXP/h for some builds; the newest zone is still worth entering (reported, no pass/fail; the owner decides) | reported | p50 >= 0 EXP/h | base|PR-OPT|CTL-STAY-S1 | 5984 | reported |

*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | visit2.atMin | visit2.level | visit2.z1.forkExpPerHour | visit2.z2.forkExpPerHour | visit3.atMin | visit3.level | visit3.z1.forkExpPerHour | visit3.z2.forkExpPerHour | visit3.z3.forkExpPerHour |
|---|---|---|---|---|---|---|---|---|---|---|
| base|PR-OPT|CTL-STAY-S1 | model-output (control) | 5.02 / 5.08 / 5.12 | 6 / 6 / 6 | 6384 / 6448 / 6512 | 7080 / 7160 / 7240 | 16.18 / 16.29 / 16.39 | 10 / 10 / 10 | 9088 / 9088 / 9088 | 8360 / 8400 / 8400 | 5896 / 5984 / 6072 |

## Earlier-zone audit (H-S1-10)

| Cell | At first visit of zone | Replicates | Earlier zone beats newest (fork, model-output) | Earlier zone beats newest (estimate) | Estimate and fork agree | Tag |
|---|---|---|---|---|---|---|
| base|PR-OPT|CTL-STAY-S1 | 2 | 200 | 0% | 100% | 0% | HYPOTHESIS |
| base|PR-OPT|CTL-STAY-S1 | 3 | 200 | 100% | 100% | 100% | CONFIRMED IN MODEL |

## Notes and limitations

- S1.1 correction pass (owner review 'Independent S1 Review and S1.1 Authorisation'). Single-character diagnostic model; no recruits, classes, abilities, gear, sinks, offline progress or Monuments.
- All inputs are candidates (content w1-slice.candidate.v0.1.0, unchanged; owner resolutions S1-R01..R17; S1.1 rules S1.1-R01..R15); every output is model-output, not live-validated.
- Policies: POL-* are the corrected S1.1 realistic policies; CTL-*-S1 are the S1 decision logic kept as diagnostic controls; ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control, never an upper bound.
- Seeds: the same seed roots as the corresponding S1 experiments, so S1, controls and corrected policies face the same random draws.
- Fork EXP/h and first-visit states are expected to equal S1-E03 (same engine behaviour for the S1 logic); only the estimate columns can change.

