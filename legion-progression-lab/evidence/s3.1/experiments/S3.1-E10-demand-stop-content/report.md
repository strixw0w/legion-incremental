# S3.1-E10-demand-stop-content

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Amendment 01 (post-results follow-up): with the stop rule corrected (POL3-DEMAND2), how do the candidate content and sensitivity variants of S3.1-E04 change progression, production and excess gathering for the demand-aware policy?

**Design.** The POL3-DEMAND cells of S3.1-E04 (PR-OPT, 90 min, 50 replicates, the same seed root), with POL3-DEMAND2 added; the POL3-DEMAND cells reproduce S3.1-E04.

**Seeds:** root `s3.1-e04`, 50 replicates per cell. **Semantic fingerprint:** `04499f72a5685f917b4ace9c62fac300f0efa64e6041d3b247d136fb40d1f37a` (manifest SHA-256 `330298f7ebd25b16ad7d8b18df038c527589a527195dec802dff525a21c5182a`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | oldmat|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | yield050|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | smith075|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cost150|PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | oldmat|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | yield050|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | smith075|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cost150|PR-OPT|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | oldmat|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | yield050|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | smith075|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cost150|PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|PR-OPT|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|PR-OPT|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|PR-OPT|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|PR-OPT|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | oldmat|PR-OPT|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | yield050|PR-OPT|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | smith075|PR-OPT|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cost150|PR-OPT|POL3-DEMAND2 | 1 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | legionExpTotal | expTotal | crafted | craftedCopper | firstCopperCombatEquippedMin | gearLifetimeMeanMin | planksAfterCopper | gelAfterCopper | equipmentValue | gatherUtilisation | smithUtilisation | excessGatheredUnits | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| control|PR-OPT|POL3-DEMAND | model-output (realistic) | 192420 / 258566 / 260066 | 64396 / 66774 / 67072 | 48 / 49 / 49 | 23 / 24 / 24 | 9.68 / 10.24 / 10.54 | 39.63 / 39.80 / 39.94 | 30 / 30 / 33 | 10 / 10 / 12 | 0.44 / 0.59 / 0.59 | 0.82 / 0.88 / 0.89 | 0.45 / 0.47 / 0.48 | 2 / 7 / 19 | 0 / 0 / 0 |
| cu-off150|PR-OPT|POL3-DEMAND | model-output (realistic) | 238774 / 255548 / 256418 | 63670 / 66940 / 67116 | 49 / 49 / 49 | 24 / 24 / 24 | 14.13 / 14.47 / 15.34 | 37.98 / 38.24 / 38.62 | 10 / 19 / 24 | 0 / 4 / 8 | 0.87 / 0.88 / 0.88 | 0.87 / 0.91 / 0.92 | 0.35 / 0.37 / 0.38 | 2 / 3 / 15 | 0 / 0 / 0 |
| cu-offdef|PR-OPT|POL3-DEMAND | model-output (realistic) | 192012 / 253238 / 254284 | 60888 / 66566 / 66808 | 47 / 49 / 49 | 22 / 24 / 24 | 14.13 / 14.47 / 15.34 | 37.78 / 38.01 / 38.64 | 10 / 19 / 24 | 0 / 4 / 8 | 0.66 / 0.88 / 0.88 | 0.85 / 0.91 / 0.92 | 0.09 / 0.40 / 0.40 | 2 / 3 / 10 | 0 / 0 / 0 |
| wpn-pct|PR-OPT|POL3-DEMAND | model-output (realistic) | 249952 / 261932 / 262850 | 65248 / 67754 / 67930 | 49 / 49 / 49 | 24 / 24 / 24 | 9.69 / 10.16 / 11.62 | 39.54 / 39.79 / 39.94 | 30 / 32 / 35 | 10 / 10 / 12 | 2.49 / 2.51 / 2.51 | 0.85 / 0.88 / 0.90 | 0.44 / 0.47 / 0.48 | 2 / 6 / 15 | 0 / 0 / 0 |
| oldmat|PR-OPT|POL3-DEMAND | model-output (realistic) | 232260 / 245544 / 256768 | 60092 / 63496 / 66468 | 49 / 49 / 49 | 24 / 24 / 24 | 9.68 / 10.20 / 10.51 | 39.50 / 39.62 / 39.77 | 46 / 46 / 49 | 18 / 18 / 20 | 0.57 / 0.59 / 0.59 | 0.80 / 0.88 / 0.90 | 0.44 / 0.47 / 0.49 | 3 / 11 / 24 | 0 / 0 / 0 |
| yield050|PR-OPT|POL3-DEMAND | model-output (realistic) | 100320 / 183452 / 184218 | 50846 / 63398 / 63584 | 39 / 44 / 45 | 14 / 19 / 20 | 12.47 / 12.66 / 13.46 | 42.36 / 43.43 / 44.50 | 29 / 30 / 32 | 6 / 10 / 12 | 0.32 / 0.44 / 0.44 | 0.80 / 0.80 / 0.86 | 0.06 / 0.32 / 0.33 | 1518 / 1542 / 1556 | 0 / 0 / 0 |
| smith075|PR-OPT|POL3-DEMAND | model-output (realistic) | 192212 / 193060 / 193916 | 65524 / 65782 / 66068 | 44 / 45 / 46 | 19 / 20 / 21 | 9.66 / 10.20 / 10.61 | 42.48 / 43.48 / 44.41 | 30 / 30 / 33 | 8 / 10 / 10 | 0.44 / 0.44 / 0.44 | 0.80 / 0.80 / 0.85 | 0.32 / 0.34 / 0.35 | 3293 / 3335 / 3355 | 0 / 0 / 0 |
| cost150|PR-OPT|POL3-DEMAND | model-output (realistic) | 211492 / 219222 / 228600 | 55124 / 57316 / 59692 | 49 / 49 / 49 | 24 / 24 / 24 | 11.40 / 11.93 / 12.61 | 38.65 / 38.91 / 39.11 | 47 / 47 / 50 | 12 / 15 / 18 | 0.59 / 0.61 / 0.61 | 0.79 / 0.82 / 0.85 | 0.47 / 0.49 / 0.51 | 3 / 11 / 21 | 0 / 0 / 0 |
| control|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 247508 / 258936 / 260220 | 63856 / 66840 / 67134 | 49 / 49 / 49 | 24 / 24 / 24 | 9.68 / 10.24 / 10.54 | 39.62 / 39.77 / 39.91 | 30 / 30 / 33 | 10 / 10 / 12 | 0.57 / 0.59 / 0.59 | 0.86 / 0.88 / 0.90 | 0.45 / 0.47 / 0.48 | 2 / 3 / 7 | 0 / 0 / 0 |
| cu-off150|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 242358 / 255768 / 256814 | 63164 / 66962 / 67204 | 49 / 49 / 49 | 24 / 24 / 24 | 14.13 / 14.47 / 15.34 | 37.99 / 38.24 / 38.62 | 10 / 19 / 24 | 0 / 4 / 8 | 0.87 / 0.88 / 0.88 | 0.88 / 0.91 / 0.92 | 0.37 / 0.38 / 0.38 | 1 / 3 / 6 | 0 / 0 / 0 |
| cu-offdef|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 241064 / 253480 / 254218 | 63264 / 66588 / 66808 | 49 / 49 / 49 | 24 / 24 / 24 | 14.13 / 14.47 / 15.34 | 37.78 / 37.93 / 38.44 | 10 / 20 / 24 | 0 / 4 / 8 | 0.87 / 0.88 / 0.88 | 0.89 / 0.91 / 0.92 | 0.39 / 0.40 / 0.40 | 2 / 3 / 5 | 0 / 0 / 0 |
| wpn-pct|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 252796 / 262036 / 262982 | 65626 / 67754 / 67974 | 49 / 49 / 49 | 24 / 24 / 24 | 9.69 / 10.16 / 11.62 | 39.53 / 39.78 / 39.91 | 30 / 32 / 35 | 10 / 10 / 12 | 2.49 / 2.51 / 2.51 | 0.85 / 0.88 / 0.90 | 0.44 / 0.47 / 0.48 | 2 / 3 / 6 | 0 / 0 / 0 |
| oldmat|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 223908 / 242270 / 257042 | 57970 / 62682 / 66548 | 49 / 49 / 49 | 24 / 24 / 24 | 9.68 / 10.20 / 10.51 | 39.39 / 39.61 / 39.76 | 46 / 46 / 49 | 18 / 18 / 20 | 0.57 / 0.59 / 0.59 | 0.81 / 0.87 / 0.90 | 0.43 / 0.47 / 0.49 | 1 / 4 / 9 | 0 / 0 / 0 |
| yield050|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 235946 / 242770 / 244530 | 62114 / 64200 / 64398 | 49 / 49 / 49 | 24 / 24 / 24 | 12.47 / 12.66 / 13.46 | 38.52 / 38.77 / 38.91 | 29 / 30 / 32 | 6 / 10 / 12 | 0.57 / 0.57 / 0.59 | 0.86 / 0.88 / 0.90 | 0.32 / 0.33 / 0.34 | 4 / 4 / 5 | 0 / 0 / 0 |
| smith075|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 253068 / 259714 / 260914 | 65278 / 67006 / 67270 | 49 / 49 / 49 | 24 / 24 / 24 | 9.66 / 10.20 / 10.61 | 39.73 / 39.88 / 39.92 | 30 / 30 / 33 | 8 / 10 / 10 | 0.59 / 0.59 / 0.59 | 0.88 / 0.90 / 0.90 | 0.33 / 0.35 / 0.37 | 2 / 3 / 5 | 0 / 0 / 0 |
| cost150|PR-OPT|POL3-DEMAND2 | model-output (realistic) | 210154 / 219166 / 227480 | 54886 / 57234 / 59378 | 49 / 49 / 49 | 24 / 24 / 24 | 11.40 / 11.93 / 12.61 | 38.64 / 38.91 / 39.11 | 47 / 47 / 50 | 12 / 15 / 18 | 0.59 / 0.61 / 0.61 | 0.80 / 0.83 / 0.85 | 0.49 / 0.51 / 0.53 | 5 / 11 / 16 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

800 runs, 319533521 checks, **0 violations**.

## Notes and limitations

- Registered as amendment 01 after the registered results (manifests/s3.1/AMENDMENT-01.md); reported as a follow-up, never in place of a registered outcome.

