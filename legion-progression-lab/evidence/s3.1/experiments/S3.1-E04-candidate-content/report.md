# S3.1-E04-candidate-content

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** With each candidate content variant, how do progression, gear lifetime, earlier-material use and production change for POL3-DEMAND and POL3-BAL, and how sensitive is POL3-DEMAND to gathering yield, smith speed and equipment cost?

**Design.** PR-OPT (90 min) campaigns; POL3-DEMAND and POL3-BAL with the control and four candidate variants; POL3-DEMAND with three sensitivity variants. 50 replicates.

**Seeds:** root `s3.1-e04`, 50 replicates per cell. **Semantic fingerprint:** `fb571ab59cf933f5b41dc237fdb9f83cdf1ffac210d81fe51dc069bea97c1405` (manifest SHA-256 `73f7ca603f132cb2616cbca270c827a0e38f2b4588e0254a846bc198a916c1ec`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | oldmat|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|PR-OPT|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|PR-OPT|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|PR-OPT|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|PR-OPT|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | oldmat|PR-OPT|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | yield050|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | smith075|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cost150|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | oldmat|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|PR-OPT|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|PR-OPT|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|PR-OPT|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|PR-OPT|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | oldmat|PR-OPT|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | yield050|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | smith075|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cost150|PR-OPT|POL3-DEMAND | 1 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | legionExpTotal | expTotal | crafted | craftedCopper | firstCopperCombatEquippedMin | gearLifetimeMeanMin | planksAfterCopper | gelAfterCopper | equipmentValue | gatherUtilisation | smithUtilisation | excessGatheredUnits | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| control|PR-OPT|POL3-DEMAND | model-output (realistic) | 192420 / 258566 / 260066 | 64396 / 66774 / 67072 | 48 / 49 / 49 | 23 / 24 / 24 | 9.68 / 10.24 / 10.54 | 39.63 / 39.80 / 39.94 | 30 / 30 / 33 | 10 / 10 / 12 | 0.44 / 0.59 / 0.59 | 0.82 / 0.88 / 0.89 | 0.45 / 0.47 / 0.48 | 2 / 7 / 19 | 0 / 0 / 0 |
| cu-off150|PR-OPT|POL3-DEMAND | model-output (realistic) | 238774 / 255548 / 256418 | 63670 / 66940 / 67116 | 49 / 49 / 49 | 24 / 24 / 24 | 14.13 / 14.47 / 15.34 | 37.98 / 38.24 / 38.62 | 10 / 19 / 24 | 0 / 4 / 8 | 0.87 / 0.88 / 0.88 | 0.87 / 0.91 / 0.92 | 0.35 / 0.37 / 0.38 | 2 / 3 / 15 | 0 / 0 / 0 |
| cu-offdef|PR-OPT|POL3-DEMAND | model-output (realistic) | 192012 / 253238 / 254284 | 60888 / 66566 / 66808 | 47 / 49 / 49 | 22 / 24 / 24 | 14.13 / 14.47 / 15.34 | 37.78 / 38.01 / 38.64 | 10 / 19 / 24 | 0 / 4 / 8 | 0.66 / 0.88 / 0.88 | 0.85 / 0.91 / 0.92 | 0.09 / 0.40 / 0.40 | 2 / 3 / 10 | 0 / 0 / 0 |
| wpn-pct|PR-OPT|POL3-DEMAND | model-output (realistic) | 249952 / 261932 / 262850 | 65248 / 67754 / 67930 | 49 / 49 / 49 | 24 / 24 / 24 | 9.69 / 10.16 / 11.62 | 39.54 / 39.79 / 39.94 | 30 / 32 / 35 | 10 / 10 / 12 | 2.49 / 2.51 / 2.51 | 0.85 / 0.88 / 0.90 | 0.44 / 0.47 / 0.48 | 2 / 6 / 15 | 0 / 0 / 0 |
| oldmat|PR-OPT|POL3-DEMAND | model-output (realistic) | 232260 / 245544 / 256768 | 60092 / 63496 / 66468 | 49 / 49 / 49 | 24 / 24 / 24 | 9.68 / 10.20 / 10.51 | 39.50 / 39.62 / 39.77 | 46 / 46 / 49 | 18 / 18 / 20 | 0.57 / 0.59 / 0.59 | 0.80 / 0.88 / 0.90 | 0.44 / 0.47 / 0.49 | 3 / 11 / 24 | 0 / 0 / 0 |
| control|PR-OPT|POL3-BAL | model-output (realistic) | 97464 / 97860 / 98300 | 48878 / 49076 / 49296 | 8 / 8 / 8 | 2 / 2 / 2 | 12.09 / 12.18 / 12.25 | 52.36 / 52.41 / 52.47 | 0 / 0 / 0 | 0 / 0 / 0 | 0.33 / 0.33 / 0.33 | 0.82 / 0.85 / 0.89 | 0.02 / 0.02 / 0.02 | 3932 / 3937 / 3943 | 0 / 0 / 0 |
| cu-off150|PR-OPT|POL3-BAL | model-output (realistic) | 109520 / 109916 / 110356 | 54840 / 55038 / 55258 | 8 / 8 / 8 | 2 / 2 / 2 | 12.09 / 12.18 / 12.25 | 52.36 / 52.41 / 52.47 | 0 / 0 / 0 | 0 / 0 / 0 | 0.49 / 0.49 / 0.49 | 0.78 / 0.83 / 0.89 | 0.02 / 0.02 / 0.02 | 3929 / 3935 / 3940 | 0 / 0 / 0 |
| cu-offdef|PR-OPT|POL3-BAL | model-output (realistic) | 109520 / 109916 / 110356 | 54840 / 55038 / 55258 | 8 / 8 / 8 | 2 / 2 / 2 | 12.09 / 12.18 / 12.25 | 52.36 / 52.41 / 52.47 | 0 / 0 / 0 | 0 / 0 / 0 | 0.49 / 0.49 / 0.49 | 0.78 / 0.83 / 0.89 | 0.02 / 0.02 / 0.02 | 3929 / 3935 / 3940 | 0 / 0 / 0 |
| wpn-pct|PR-OPT|POL3-BAL | model-output (realistic) | 129408 / 129584 / 129892 | 64784 / 64872 / 65026 | 8 / 8 / 8 | 2 / 2 / 2 | 12.10 / 12.18 / 12.26 | 52.37 / 52.41 / 52.47 | 0 / 0 / 0 | 0 / 0 / 0 | 1.43 / 1.43 / 1.43 | 0.67 / 0.76 / 0.96 | 0.02 / 0.02 / 0.02 | 3932 / 3935 / 3940 | 0 / 0 / 0 |
| oldmat|PR-OPT|POL3-BAL | model-output (realistic) | 97464 / 97904 / 98256 | 48878 / 49098 / 49274 | 8 / 8 / 8 | 2 / 2 / 2 | 12.09 / 12.18 / 12.26 | 52.36 / 52.41 / 52.47 | 1 / 1 / 1 | 0 / 0 / 0 | 0.33 / 0.33 / 0.33 | 0.82 / 0.85 / 0.89 | 0.02 / 0.02 / 0.02 | 3928 / 3933 / 3939 | 0 / 0 / 0 |
| yield050|PR-OPT|POL3-DEMAND | model-output (realistic) | 100320 / 183452 / 184218 | 50846 / 63398 / 63584 | 39 / 44 / 45 | 14 / 19 / 20 | 12.47 / 12.66 / 13.46 | 42.36 / 43.43 / 44.50 | 29 / 30 / 32 | 6 / 10 / 12 | 0.32 / 0.44 / 0.44 | 0.80 / 0.80 / 0.86 | 0.06 / 0.32 / 0.33 | 1518 / 1542 / 1556 | 0 / 0 / 0 |
| smith075|PR-OPT|POL3-DEMAND | model-output (realistic) | 192212 / 193060 / 193916 | 65524 / 65782 / 66068 | 44 / 45 / 46 | 19 / 20 / 21 | 9.66 / 10.20 / 10.61 | 42.48 / 43.48 / 44.41 | 30 / 30 / 33 | 8 / 10 / 10 | 0.44 / 0.44 / 0.44 | 0.80 / 0.80 / 0.85 | 0.32 / 0.34 / 0.35 | 3293 / 3335 / 3355 | 0 / 0 / 0 |
| cost150|PR-OPT|POL3-DEMAND | model-output (realistic) | 211492 / 219222 / 228600 | 55124 / 57316 / 59692 | 49 / 49 / 49 | 24 / 24 / 24 | 11.40 / 11.93 / 12.61 | 38.65 / 38.91 / 39.11 | 47 / 47 / 50 | 12 / 15 / 18 | 0.59 / 0.61 / 0.61 | 0.79 / 0.82 / 0.85 | 0.47 / 0.49 / 0.51 | 3 / 11 / 21 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

650 runs, 247419611 checks, **0 violations**.

## Notes and limitations

- A promising candidate is reported separately with its variant ID; nothing replaces the S3 content.

