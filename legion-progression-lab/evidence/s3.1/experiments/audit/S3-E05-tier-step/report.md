# S3-E05-tier-step

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** How much does a tier upgrade cut time-to-kill on its tier, compared with one enhancement level (H-S3-02)?

**Design.** Matched squads (Archer hero and Warrior + Mage recruits at the same level, levels frozen) farming continuously in zone 2 (level 5) and zone 3 (level 10) for 20 minutes, everyone equipped with no gear, Wood +0/+1/+2/+5 or Copper +0/+1 in every slot. 100 replicates.

**Seeds:** root `s3-e05`, 100 replicates per cell. **Semantic fingerprint:** `9dc8165226511fc198338c19542c758d2c5106ea2c2f6b962cc8df5fd9cc8230` (manifest SHA-256 `c905e9ce25a4e697553f520b098007c1df527fbb074592a6f39bae649b4dff34`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z2-L5|none | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z2-L5|wood+0 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z2-L5|wood+1 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z2-L5|wood+2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z2-L5|wood+5 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z2-L5|copper+0 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z2-L5|copper+1 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z3-L10|none | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z3-L10|wood+0 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z3-L10|wood+1 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z3-L10|wood+2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z3-L10|wood+5 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z3-L10|copper+0 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | Z3-L10|copper+1 | 0 | pass |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z2-L5|none | 1 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z2-L5|wood+0 | 0.500 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z2-L5|wood+1 | 0.500 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z2-L5|wood+2 | 0.500 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z2-L5|wood+5 | 0 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z2-L5|copper+0 | 0 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z2-L5|copper+1 | 0 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z3-L10|none | 1.600 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z3-L10|wood+0 | 1.500 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z3-L10|wood+1 | 1.400 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z3-L10|wood+2 | 1.400 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z3-L10|wood+5 | 1.500 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z3-L10|copper+0 | 1.300 | reported |
| H-S3-02 | A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4) | reported | p50 >= 0 s (derived comparison reported separately) | Z3-L10|copper+1 | 1 | reported |

## Cells (p10 / p50 / p90)

| Cell | Tag | medianTtkS | killsPerHour | predictedTtkS | memberKnockoutsPerHour | deathsPerHour | heroDamageShare | invariantViolations |
|---|---|---|---|---|---|---|---|---|
| Z2-L5|none | model-output (diagnostic) | 1 / 1 / 1 | 1605 / 1611 / 1614 | 0.93 / 0.93 / 0.93 | 0 / 0 / 0 | 0 / 0 / 0 | 0.31 / 0.31 / 0.32 | 0 / 0 / 0 |
| Z2-L5|wood+0 | model-output (diagnostic) | 0.50 / 0.50 / 0.50 | 1773 / 1788 / 1803 | 0.64 / 0.64 / 0.64 | 0 / 0 / 0 | 0 / 0 / 0 | 0.32 / 0.32 / 0.32 | 0 / 0 / 0 |
| Z2-L5|wood+1 | model-output (diagnostic) | 0.50 / 0.50 / 0.50 | 1773 / 1788 / 1803 | 0.59 / 0.59 / 0.59 | 0 / 0 / 0 | 0 / 0 / 0 | 0.33 / 0.33 / 0.33 | 0 / 0 / 0 |
| Z2-L5|wood+2 | model-output (diagnostic) | 0.50 / 0.50 / 0.50 | 1773 / 1788 / 1803 | 0.57 / 0.57 / 0.57 | 0 / 0 / 0 | 0 / 0 / 0 | 0.32 / 0.32 / 0.33 | 0 / 0 / 0 |
| Z2-L5|wood+5 | model-output (diagnostic) | 0 / 0 / 0 | 2385 / 2385 / 2385 | 0.51 / 0.51 / 0.51 | 0 / 0 / 0 | 0 / 0 / 0 | 0.27 / 0.27 / 0.27 | 0 / 0 / 0 |
| Z2-L5|copper+0 | model-output (diagnostic) | 0 / 0 / 0 | 2385 / 2385 / 2385 | 0.42 / 0.42 / 0.42 | 0 / 0 / 0 | 0 / 0 / 0 | 0.27 / 0.27 / 0.27 | 0 / 0 / 0 |
| Z2-L5|copper+1 | model-output (diagnostic) | 0 / 0 / 0 | 2385 / 2385 / 2385 | 0.40 / 0.40 / 0.40 | 0 / 0 / 0 | 0 / 0 / 0 | 0.26 / 0.27 / 0.27 | 0 / 0 / 0 |
| Z3-L10|none | model-output (diagnostic) | 1.50 / 1.60 / 1.90 | 1089 / 1098 / 1107 | 1.88 / 1.88 / 1.88 | 9 / 9 / 9 | 0 / 0 / 0 | 0.33 / 0.33 / 0.33 | 0 / 0 / 0 |
| Z3-L10|wood+0 | model-output (diagnostic) | 1.50 / 1.50 / 1.50 | 1302 / 1311 / 1320 | 1.51 / 1.51 / 1.51 | 3 / 6 / 6 | 0 / 0 / 0 | 0.34 / 0.34 / 0.35 | 0 / 0 / 0 |
| Z3-L10|wood+1 | model-output (diagnostic) | 1.30 / 1.40 / 1.50 | 1401 / 1401 / 1404 | 1.46 / 1.46 / 1.46 | 0 / 0 / 0 | 0 / 0 / 0 | 0.30 / 0.30 / 0.30 | 0 / 0 / 0 |
| Z3-L10|wood+2 | model-output (diagnostic) | 1.30 / 1.40 / 1.50 | 1401 / 1401 / 1404 | 1.45 / 1.45 / 1.45 | 0 / 0 / 0 | 0 / 0 / 0 | 0.30 / 0.30 / 0.30 | 0 / 0 / 0 |
| Z3-L10|wood+5 | model-output (diagnostic) | 1.30 / 1.50 / 1.50 | 1419 / 1419 / 1422 | 1.35 / 1.35 / 1.35 | 0 / 0 / 0 | 0 / 0 / 0 | 0.31 / 0.31 / 0.31 | 0 / 0 / 0 |
| Z3-L10|copper+0 | model-output (diagnostic) | 1.30 / 1.30 / 1.30 | 1431 / 1434 / 1440 | 1.22 / 1.22 / 1.22 | 0 / 0 / 0 | 0 / 0 / 0 | 0.32 / 0.32 / 0.32 | 0 / 0 / 0 |
| Z3-L10|copper+1 | model-output (diagnostic) | 1 / 1 / 1.20 | 1443 / 1449 / 1455 | 1.16 / 1.16 / 1.16 | 0 / 0 / 0 | 0 / 0 / 0 | 0.32 / 0.32 / 0.32 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

1400 runs, 24003300 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| Z2-L5|none | 2 | 1483.7 | approximate | 1610.6 | -7.9% | not reached | not reached | — |
| Z2-L5|wood+0 | 2 | 1685.6 | approximate | 1788.1 | -5.7% | not reached | not reached | — |
| Z2-L5|wood+1 | 2 | 1718.7 | approximate | 1788.1 | -3.9% | not reached | not reached | — |
| Z2-L5|wood+2 | 2 | 1735.5 | approximate | 1788.1 | -2.9% | not reached | not reached | — |
| Z2-L5|wood+5 | 2 | 1790.1 | approximate | 2385 | -24.9% | not reached | not reached | — |
| Z2-L5|copper+0 | 2 | 1876.1 | approximate | 2385 | -21.3% | not reached | not reached | — |
| Z2-L5|copper+1 | 2 | 1897.5 | approximate | 2385 | -20.4% | not reached | not reached | — |
| Z3-L10|none | 2 | 1066.6 | approximate | 1099.2 | -3.0% | not reached | not reached | — |
| Z3-L10|wood+0 | 2 | 1195.3 | approximate | 1310.8 | -8.8% | not reached | not reached | — |
| Z3-L10|wood+1 | 2 | 1214.5 | approximate | 1401.3 | -13.3% | not reached | not reached | — |
| Z3-L10|wood+2 | 2 | 1220.0 | approximate | 1401.5 | -12.9% | not reached | not reached | — |
| Z3-L10|wood+5 | 2 | 1263.5 | approximate | 1420.5 | -11.1% | not reached | not reached | — |
| Z3-L10|copper+0 | 2 | 1324.9 | approximate | 1434.7 | -7.7% | not reached | not reached | — |
| Z3-L10|copper+1 | 2 | 1355.3 | approximate | 1448.5 | -6.4% | not reached | not reached | — |

## Notes and limitations

- TTK here is the realised median time-to-kill of the squad (continuous farming, no resting rule).
- Copper is the on-tier upgrade for zones 2-3 in the S3 slice; Wood +5 is the maximum enhancement.

