# S1-E02-estimator

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Does the analytic rate model (what a Command Centre would display) match simulated combat?

**Design.** Fixed hero levels 1, 5 and 10 (frozen) x zones 1-3, started in the zone with all zones unlocked (labelled diagnostic set-up), auto-farm for 60 min, 200 replicates; compare kills/h, EXP/h and TTK with the estimator.

**Seeds:** root `S1-E02`, 200 replicates per cell (replicate i uses `S1-E02#rep-i`).

**Semantic fingerprint:** `dbf62290ba76c800e51e9f269f920ae79ed445b4e7b2ff3ee347902b9c7673ae` (manifest SHA-256 `43b88b4363d02c3f7adbc243b0159281dd81dec10bf39a7dfb1c737e0fb06e22`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |
|---|---|---|---|---|---|---|
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L1-Z1 | 0.87 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L1-Z2 | 7.37 | miss |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L1-Z3 | not reached | not-reached |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L5-Z1 | 0.23 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L5-Z2 | 1.25 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L5-Z3 | 63.28 | miss |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L10-Z1 | 0.21 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L10-Z2 | 1.23 | pass |
| H-S1-09 | The estimator is accurate for steady farming: mean kills/h within +-5% of simulated, or the deviation is explained by a named factor | target | mean in [-5, 5] % | base|L10-Z3 | 14.08 | miss |
| H-S1-08a | Overgeared earlier enemies become trivial: at hero damage >= zone 1 HP, TTK = 0 s (first swing) | target | p50 == 0 s | base|L10-Z1 | 0 | pass |
| H-S1-08b | Overgeared earlier enemies become trivial: hits-to-kill = 1 | target | mean == 1 swings | base|L10-Z1 | 1 | pass |

*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | killsPerHour | expPerHour | medianTtkS | deathsPerHour | autoFarmStops | deathDowntimeS |
|---|---|---|---|---|---|---|---|
| base|L1-Z1 | model-output (diagnostic) | 894 / 898 / 902 | 3576 / 3592 / 3608 | 2.40 / 2.40 / 2.40 | 13 / 13 / 13 | 0 / 0 / 0 | 169 / 169 / 169 |
| base|L1-Z2 | model-output (diagnostic) | 261 / 265 / 270 | 2610 / 2650 / 2700 | 8.40 / 8.40 / 8.40 | 61 / 61 / 61 | 59 / 59 / 59 | 793 / 793 / 793 |
| base|L1-Z3 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 124 / 124 / 124 | 122 / 122 / 122 | 1608 / 1608 / 1608 |
| base|L5-Z1 | model-output (diagnostic) | 1356 / 1360 / 1365 | 5424 / 5440 / 5460 | 1.20 / 1.20 / 1.20 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L5-Z2 | model-output (diagnostic) | 508 / 510 / 510 | 5080 / 5100 / 5100 | 4.80 / 4.80 / 4.80 | 33 / 34 / 34 | 31 / 32 / 32 | 429 / 431.20 / 442 |
| base|L5-Z3 | model-output (diagnostic) | 90 / 91 / 94 | 1980 / 2002 / 2068 | 13.20 / 13.20 / 13.20 | 88 / 88 / 88 | 86 / 86 / 86 | 1144 / 1144 / 1144 |
| base|L10-Z1 | model-output (diagnostic) | 2395 / 2395 / 2395 | 9580 / 9580 / 9580 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| base|L10-Z2 | model-output (diagnostic) | 849 / 849 / 849 | 8490 / 8490 / 8490 | 2.40 / 2.40 / 2.40 | 19 / 19 / 19 | 0 / 0 / 0 | 247 / 247 / 247 |
| base|L10-Z3 | model-output (diagnostic) | 204 / 204 / 206 | 4488 / 4488 / 4532 | 9.60 / 9.60 / 9.60 | 68 / 68 / 68 | 66 / 66 / 66 | 884 / 884 / 884 |

## Estimator vs stepper (H-S1-09)

| Cell | Estimate kills/h (estimate) | Simulated mean kills/h (model-output) | Error | Within ±5% | Estimate TTK s | Simulated median TTK s | Estimate deaths/h | Limiting factor (estimate) |
|---|---|---|---|---|---|---|---|---|
| base|L1-Z1 | 906.1 | 898.3 | 0.87% | yes | 2.28 | 2.40 | 13.6 | attack |
| base|L1-Z2 | 284.9 | 265.3 | 7.37% | no | 8.04 | 8.40 | 56.9 | survival |
| base|L1-Z3 | 65.2 | 0 | not reached% | no | 22.49 | not reached | 89.5 | survival |
| base|L5-Z1 | 1363.6 | 1360.6 | 0.23% | yes | 1.14 | 1.20 | 0 | attack |
| base|L5-Z2 | 516.0 | 509.6 | 1.25% | yes | 4.58 | 4.80 | 33.7 | survival |
| base|L5-Z3 | 149.4 | 91.5 | 63.28% | no | 13.18 | 13.20 | 77.8 | survival |
| base|L10-Z1 | 2400 | 2395 | 0.21% | yes | 0 | 0 | 0 | attack |
| base|L10-Z2 | 859.5 | 849 | 1.23% | yes | 2.40 | 2.40 | 19.5 | attack |
| base|L10-Z3 | 233.4 | 204.6 | 14.08% | no | 9.53 | 9.60 | 63.0 | survival |

## Notes and limitations

- S1 is a single-character diagnostic model (experiment plan principle 10): no recruits, classes, abilities, gear, sinks, offline progress or Monuments; gold and materials only accumulate.
- All inputs are candidates (content w1-slice.candidate.v0.1.0 and the S1 resolutions S1-R01..R17); every output is model-output, not live-validated.
- Engagement overhead and walk times are the most uncertain inputs (to be measured in M2).
- Levels are frozen so each cell measures one steady state; EXP/h counts the EXP the kills would award.
- Hero level 10 attack = 6 + 9 = 15 = slime HP (H-S1-08 condition).

