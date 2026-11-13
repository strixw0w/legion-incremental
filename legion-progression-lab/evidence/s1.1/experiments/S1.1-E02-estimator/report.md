# S1.1-E02-estimator

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Is estimator v1.1 accurate where farming is survivable, honest where it is not, and better than the S1 estimator in dangerous zones? How does respecting the repeated-death stop change fixed-zone farming?

**Design.** The 9 S1-E02 cells (levels 1/5/10 x zones 1-3, frozen level) with the S1 continuous-farming reference (CTL-FIXED-S1, as in S1-E02) and with the corrected POL-FIXED; 60-minute sessions, 200 replicates, S1-E02 seed root. Estimator v1.1 and the S1 control estimator are both reported against the simulated mean.

**Seeds:** root `S1-E02`, 200 replicates per cell (replicate i uses `S1-E02#rep-i`).

**Semantic fingerprint:** `dd265cb69af9cf0f85b6b62227bbcee6ff5823d9c5b10faa47649b974c006639` (manifest SHA-256 `92d3f613d74292a2c999b362f60e861ac63f44beda04e8ae5edac926499d1a36`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |
|---|---|---|---|---|---|---|
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L1-Z1|CTL-FIXED-S1 | -0.07 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L1-Z2|CTL-FIXED-S1 | 0.12 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L1-Z3|CTL-FIXED-S1 | not reached | not-reached |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L5-Z1|CTL-FIXED-S1 | 0.23 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L5-Z2|CTL-FIXED-S1 | -0.00 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L5-Z3|CTL-FIXED-S1 | -0.06 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L10-Z1|CTL-FIXED-S1 | 0.21 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L10-Z2|CTL-FIXED-S1 | -0.09 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L10-Z3|CTL-FIXED-S1 | 0.37 | pass |
| H-S1-08a | Overgeared earlier enemies become trivial: at hero damage >= zone 1 HP, TTK = 0 s (first swing) | target | p50 == 0 s | base|L10-Z1|CTL-FIXED-S1 | 0 | pass |
| H-S1-08b | Overgeared earlier enemies become trivial: hits-to-kill = 1 | target | mean == 1 swings | base|L10-Z1|CTL-FIXED-S1 | 1 | pass |

*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | killsPerHour | expPerHour | medianTtkS | deathsPerHour | autoFarmStops | deathDowntimeS | policyStopReports | activeManualMin |
|---|---|---|---|---|---|---|---|---|---|
| base|L1-Z1|CTL-FIXED-S1 | model-output (diagnostic) | 894 / 898 / 902 | 3576 / 3592 / 3608 | 2.40 / 2.40 / 2.40 | 13 / 13 / 13 | 0 / 0 / 0 | 169 / 169 / 169 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L1-Z2|CTL-FIXED-S1 | model-output (diagnostic) | 261 / 265 / 270 | 2610 / 2650 / 2700 | 8.40 / 8.40 / 8.40 | 61 / 61 / 61 | 59 / 59 / 59 | 793 / 793 / 793 | 0 / 0 / 0 | 4.92 / 4.92 / 4.92 |
| base|L1-Z3|CTL-FIXED-S1 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 124 / 124 / 124 | 122 / 122 / 122 | 1608 / 1608 / 1608 | 0 / 0 / 0 | 10.17 / 10.17 / 10.17 |
| base|L5-Z1|CTL-FIXED-S1 | model-output (diagnostic) | 1356 / 1360 / 1365 | 5424 / 5440 / 5460 | 1.20 / 1.20 / 1.20 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L5-Z2|CTL-FIXED-S1 | model-output (diagnostic) | 508 / 510 / 510 | 5080 / 5100 / 5100 | 4.80 / 4.80 / 4.80 | 33 / 34 / 34 | 31 / 32 / 32 | 429 / 431.20 / 442 | 0 / 0 / 0 | 2.58 / 2.62 / 2.67 |
| base|L5-Z3|CTL-FIXED-S1 | model-output (diagnostic) | 90 / 91 / 94 | 1980 / 2002 / 2068 | 13.20 / 13.20 / 13.20 | 88 / 88 / 88 | 86 / 86 / 86 | 1144 / 1144 / 1144 | 0 / 0 / 0 | 7.17 / 7.17 / 7.17 |
| base|L10-Z1|CTL-FIXED-S1 | model-output (diagnostic) | 2395 / 2395 / 2395 | 9580 / 9580 / 9580 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L10-Z2|CTL-FIXED-S1 | model-output (diagnostic) | 849 / 849 / 849 | 8490 / 8490 / 8490 | 2.40 / 2.40 / 2.40 | 19 / 19 / 19 | 0 / 0 / 0 | 247 / 247 / 247 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L10-Z3|CTL-FIXED-S1 | model-output (diagnostic) | 204 / 204 / 206 | 4488 / 4488 / 4532 | 9.60 / 9.60 / 9.60 | 68 / 68 / 68 | 66 / 66 / 66 | 884 / 884 / 884 | 0 / 0 / 0 | 5.50 / 5.50 / 5.50 |
| base|L1-Z1|POL-FIXED | model-output (diagnostic) | 896 / 902 / 906 | 3584 / 3608 / 3624 | 2.40 / 2.40 / 2.40 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 3 / 3 / 3.17 |
| base|L1-Z2|POL-FIXED | model-output (diagnostic) | 297 / 299 / 300 | 2970 / 2990 / 3000 | 8.40 / 8.40 / 8.40 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 12.33 / 12.33 / 12.43 |
| base|L1-Z3|POL-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 3 / 3 / 3 | 1 / 1 / 1 | 3544 / 3544 / 3544 | 1 / 1 / 1 | 58.63 / 58.63 / 58.63 |
| base|L5-Z1|POL-FIXED | model-output (diagnostic) | 1356 / 1360 / 1365 | 5424 / 5440 / 5460 | 1.20 / 1.20 / 1.20 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L5-Z2|POL-FIXED | model-output (diagnostic) | 513 / 515 / 517 | 5130 / 5150 / 5170 | 4.80 / 4.80 / 4.80 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 7.67 / 7.67 / 7.75 |
| base|L5-Z3|POL-FIXED | model-output (diagnostic) | 3 / 3 / 3 | 66 / 66 / 66 | 13.20 / 13.20 / 13.20 | 3 / 3 / 3 | 1 / 1 / 1 | 3509.50 / 3509.50 / 3509.50 | 1 / 1 / 1 | 58.06 / 58.06 / 58.06 |
| base|L10-Z1|POL-FIXED | model-output (diagnostic) | 2395 / 2395 / 2395 | 9580 / 9580 / 9580 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L10-Z2|POL-FIXED | model-output (diagnostic) | 852 / 852 / 852 | 8520 / 8520 / 8520 | 2.40 / 2.40 / 2.40 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 4.50 / 4.50 / 4.50 |
| base|L10-Z3|POL-FIXED | model-output (diagnostic) | 245 / 246 / 246 | 5390 / 5412 / 5412 | 9.60 / 9.60 / 9.60 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 14.65 / 14.70 / 14.73 |

## Estimator vs stepper (H-S1-09)

| Cell | Estimate kills/h (estimate) | Simulated mean kills/h (model-output) | Error | Within ±5% | Estimate TTK s | Simulated median TTK s | Estimate deaths/h | Limiting factor (estimate) |
|---|---|---|---|---|---|---|---|---|
| base|L1-Z1|CTL-FIXED-S1 | 897.7 | 898.3 | -0.07% | yes | 2.28 | 2.40 | 13.7 | attack |
| base|L1-Z2|CTL-FIXED-S1 | 265.6 | 265.3 | 0.12% | yes | 8.04 | 8.40 | 61.7 | survival |
| base|L1-Z3|CTL-FIXED-S1 | 0.0 | 0 | not reached% | no | 22.49 | not reached | 124.1 | survival |
| base|L5-Z1|CTL-FIXED-S1 | 1363.6 | 1360.6 | 0.23% | yes | 1.14 | 1.20 | 0 | attack |
| base|L5-Z2|CTL-FIXED-S1 | 509.6 | 509.6 | -0.00% | yes | 4.58 | 4.80 | 34.0 | survival |
| base|L5-Z3|CTL-FIXED-S1 | 91.4 | 91.5 | -0.06% | yes | 13.18 | 13.20 | 88.7 | survival |
| base|L10-Z1|CTL-FIXED-S1 | 2400 | 2395 | 0.21% | yes | 0 | 0 | 0 | attack |
| base|L10-Z2|CTL-FIXED-S1 | 848.2 | 849 | -0.09% | yes | 2.40 | 2.40 | 19.7 | attack |
| base|L10-Z3|CTL-FIXED-S1 | 205.3 | 204.6 | 0.37% | yes | 9.53 | 9.60 | 68.2 | survival |
| base|L1-Z1|POL-FIXED | 897.7 | 901.2 | -0.39% | yes | 2.28 | 2.40 | 13.7 | attack |
| base|L1-Z2|POL-FIXED | 265.6 | 298.7 | -11.07% | no | 8.04 | 8.40 | 61.7 | survival |
| base|L1-Z3|POL-FIXED | 0.0 | 0 | not reached% | no | 22.49 | not reached | 124.1 | survival |
| base|L5-Z1|POL-FIXED | 1363.6 | 1360.6 | 0.23% | yes | 1.14 | 1.20 | 0 | attack |
| base|L5-Z2|POL-FIXED | 509.6 | 515.1 | -1.05% | yes | 4.58 | 4.80 | 34.0 | survival |
| base|L5-Z3|POL-FIXED | 91.4 | 3.2 | 2774.83% | no | 13.18 | 13.20 | 88.7 | survival |
| base|L10-Z1|POL-FIXED | 2400 | 2395 | 0.21% | yes | 0 | 0 | 0 | attack |
| base|L10-Z2|POL-FIXED | 848.2 | 852 | -0.44% | yes | 2.40 | 2.40 | 19.7 | attack |
| base|L10-Z3|POL-FIXED | 205.3 | 245.5 | -16.37% | no | 9.53 | 9.60 | 68.2 | survival |

## Notes and limitations

- S1.1 correction pass (owner review 'Independent S1 Review and S1.1 Authorisation'). Single-character diagnostic model; no recruits, classes, abilities, gear, sinks, offline progress or Monuments.
- All inputs are candidates (content w1-slice.candidate.v0.1.0, unchanged; owner resolutions S1-R01..R17; S1.1 rules S1.1-R01..R15); every output is model-output, not live-validated.
- Policies: POL-* are the corrected S1.1 realistic policies; CTL-*-S1 are the S1 decision logic kept as diagnostic controls; ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control, never an upper bound.
- Seeds: the same seed roots as the corresponding S1 experiments, so S1, controls and corrected policies face the same random draws.
- H-S1-09 is evaluated, unchanged, on the continuous-farming reference cells (the estimator assumes continuous farming, estimator.md v1.1).
- Pre-registered reading (PREREGISTRATION.md A5): every cell whose v1.1 reliability is 'unreachable' or 'unsafe' is listed with its simulated rate; the S1 estimator's error is reported alongside.

