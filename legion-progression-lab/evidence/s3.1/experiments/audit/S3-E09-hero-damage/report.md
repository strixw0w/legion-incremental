# S3-E09-hero-damage

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Directions A-D and H: how do a hero base-damage multiplier, a stronger hero ability, their combination, and a hero-only weapon bonus change the hero damage share (raw and effective), the ability share, EXP and pacing, now that equipment exists?

**Design.** PR-BAL campaigns of POL3-BAL, passive and attentive, with hero-only variants: base attack x1.25 / x1.5 / x2.0 (A), ability multiplier +100% or cooldown -50% (B), x1.25 with +50% ability and -25% cooldown (C), hero weapon bonus +100% (D). Recruits unchanged. 50 replicates.

**Seeds:** root `s3-e09`, 50 replicates per cell. **Semantic fingerprint:** `2fd8fc536506d2583b112824e1bb90e455237812608beb257fc0e641dedc261a` (manifest SHA-256 `819aba175db31c6f36a74d59b3d6ca66b0580b5278b87d4aa7c41c98e215dd7c`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|POL3-BAL|attentive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-a125|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-a125|POL3-BAL|attentive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-a150|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-a150|POL3-BAL|attentive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-a200|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-a200|POL3-BAL|attentive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-b-mult|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-b-mult|POL3-BAL|attentive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-b-cd|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-b-cd|POL3-BAL|attentive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-c|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-c|POL3-BAL|attentive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-d|POL3-BAL|passive | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-d|POL3-BAL|attentive | 0 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100|POL3-BAL|attentive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-a125|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-a125|POL3-BAL|attentive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-a150|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-a150|POL3-BAL|attentive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-a200|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-a200|POL3-BAL|attentive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-b-mult|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-b-mult|POL3-BAL|attentive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-b-cd|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-b-cd|POL3-BAL|attentive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-c|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-c|POL3-BAL|attentive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-d|POL3-BAL|passive | 1 | pass |
| H-S3-10 | Per kill, effective contributions sum exactly to the HP removed (direction H) | engineering | mean == 1 share of runs | a10-p1.6-g100-d|POL3-BAL|attentive | 1 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | heroDamageShare | heroEffectiveShare | heroAbilityEffectiveShare | heroOverkillShare | expTotal | legionExpTotal | minToL5 | minToL10 | zone2FirstVisitMin | zone3FirstVisitMin | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|POL3-BAL|passive | model-output (realistic) | 0.57 / 0.57 / 0.57 | 0.56 / 0.56 / 0.56 | 0 / 0 / 0 | 0.22 / 0.22 / 0.23 | 29672 / 29804 / 29936 | 59052 / 59316 / 59580 | 2.31 / 2.33 / 2.35 | 7.92 / 7.99 / 8.06 | 3.94 / 3.96 / 3.98 | 9.23 / 9.29 / 9.38 | 0 / 0 / 0 |
| a10-p1.6-g100|POL3-BAL|attentive | model-output (realistic) | 0.64 / 0.64 / 0.64 | 0.60 / 0.60 / 0.60 | 0.13 / 0.13 / 0.14 | 0.37 / 0.37 / 0.38 | 33676 / 33786 / 33874 | 67192 / 67412 / 67588 | 2.31 / 2.33 / 2.35 | 7.45 / 7.48 / 7.52 | 3.94 / 3.96 / 3.98 | 8.68 / 8.72 / 8.76 | 0 / 0 / 0 |
| a10-p1.6-g100-a125|POL3-BAL|passive | model-output (realistic) | 0.61 / 0.61 / 0.61 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 | 0.30 / 0.30 / 0.31 | 31630 / 31806 / 31982 | 63100 / 63452 / 63804 | 2.05 / 2.07 / 2.11 | 7.41 / 7.47 / 7.51 | 3.68 / 3.70 / 3.74 | 8.69 / 8.73 / 8.78 | 0 / 0 / 0 |
| a10-p1.6-g100-a125|POL3-BAL|attentive | model-output (realistic) | 0.68 / 0.68 / 0.68 | 0.63 / 0.63 / 0.63 | 0.13 / 0.13 / 0.14 | 0.43 / 0.43 / 0.44 | 35524 / 35722 / 35920 | 70888 / 71284 / 71680 | 2.05 / 2.07 / 2.11 | 7.08 / 7.12 / 7.14 | 3.68 / 3.70 / 3.74 | 8.26 / 8.32 / 8.36 | 0 / 0 / 0 |
| a10-p1.6-g100-a150|POL3-BAL|passive | model-output (realistic) | 0.62 / 0.63 / 0.63 | 0.60 / 0.60 / 0.60 | 0 / 0 / 0 | 0.29 / 0.30 / 0.30 | 35414 / 35590 / 35810 | 70668 / 71020 / 71460 | 2.03 / 2.07 / 2.11 | 7.14 / 7.21 / 7.26 | 3.66 / 3.70 / 3.74 | 8.39 / 8.46 / 8.53 | 0 / 0 / 0 |
| a10-p1.6-g100-a150|POL3-BAL|attentive | model-output (realistic) | 0.70 / 0.70 / 0.70 | 0.65 / 0.66 / 0.66 | 0.13 / 0.14 / 0.14 | 0.45 / 0.46 / 0.46 | 38560 / 38758 / 38956 | 76960 / 77356 / 77752 | 2.03 / 2.07 / 2.11 | 6.91 / 6.96 / 7.04 | 3.66 / 3.70 / 3.74 | 8.07 / 8.15 / 8.21 | 0 / 0 / 0 |
| a10-p1.6-g100-a200|POL3-BAL|passive | model-output (realistic) | 0.65 / 0.65 / 0.65 | 0.65 / 0.65 / 0.65 | 0 / 0 / 0 | 0.31 / 0.31 / 0.31 | 42014 / 42102 / 42234 | 83868 / 84044 / 84308 | 1.49 / 1.51 / 1.51 | 6.18 / 6.25 / 6.28 | 3.12 / 3.14 / 3.14 | 7.16 / 7.23 / 7.27 | 0 / 0 / 0 |
| a10-p1.6-g100-a200|POL3-BAL|attentive | model-output (realistic) | 0.74 / 0.74 / 0.74 | 0.70 / 0.70 / 0.70 | 0.14 / 0.15 / 0.15 | 0.51 / 0.51 / 0.52 | 43598 / 43752 / 43840 | 87036 / 87344 / 87520 | 1.49 / 1.51 / 1.51 | 6.03 / 6.08 / 6.13 | 3.12 / 3.14 / 3.14 | 7.01 / 7.06 / 7.11 | 0 / 0 / 0 |
| a10-p1.6-g100-b-mult|POL3-BAL|passive | model-output (realistic) | 0.57 / 0.57 / 0.57 | 0.56 / 0.56 / 0.56 | 0 / 0 / 0 | 0.22 / 0.22 / 0.23 | 29672 / 29804 / 29936 | 59052 / 59316 / 59580 | 2.31 / 2.33 / 2.35 | 7.92 / 7.99 / 8.06 | 3.94 / 3.96 / 3.98 | 9.23 / 9.29 / 9.38 | 0 / 0 / 0 |
| a10-p1.6-g100-b-mult|POL3-BAL|attentive | model-output (realistic) | 0.67 / 0.67 / 0.67 | 0.61 / 0.61 / 0.61 | 0.15 / 0.15 / 0.15 | 0.44 / 0.44 / 0.44 | 33720 / 33852 / 33984 | 67280 / 67544 / 67808 | 2.31 / 2.33 / 2.35 | 7.45 / 7.48 / 7.52 | 3.94 / 3.96 / 3.98 | 8.68 / 8.72 / 8.76 | 0 / 0 / 0 |
| a10-p1.6-g100-b-cd|POL3-BAL|passive | model-output (realistic) | 0.57 / 0.57 / 0.57 | 0.56 / 0.56 / 0.56 | 0 / 0 / 0 | 0.22 / 0.22 / 0.23 | 29672 / 29804 / 29936 | 59052 / 59316 / 59580 | 2.31 / 2.33 / 2.35 | 7.92 / 7.99 / 8.06 | 3.94 / 3.96 / 3.98 | 9.23 / 9.29 / 9.38 | 0 / 0 / 0 |
| a10-p1.6-g100-b-cd|POL3-BAL|attentive | model-output (realistic) | 0.68 / 0.68 / 0.68 | 0.67 / 0.67 / 0.67 | 0.26 / 0.27 / 0.28 | 0.42 / 0.42 / 0.42 | 35876 / 36140 / 36426 | 71592 / 72120 / 72692 | 2.31 / 2.33 / 2.35 | 7.21 / 7.26 / 7.33 | 3.94 / 3.96 / 3.98 | 8.40 / 8.46 / 8.54 | 0 / 0 / 0 |
| a10-p1.6-g100-c|POL3-BAL|passive | model-output (realistic) | 0.61 / 0.61 / 0.61 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 | 0.30 / 0.30 / 0.31 | 31630 / 31806 / 31982 | 63100 / 63452 / 63804 | 2.05 / 2.07 / 2.11 | 7.41 / 7.47 / 7.51 | 3.68 / 3.70 / 3.74 | 8.69 / 8.73 / 8.78 | 0 / 0 / 0 |
| a10-p1.6-g100-c|POL3-BAL|attentive | model-output (realistic) | 0.70 / 0.71 / 0.71 | 0.64 / 0.65 / 0.65 | 0.19 / 0.19 / 0.19 | 0.48 / 0.48 / 0.48 | 37394 / 37614 / 37790 | 74628 / 75068 / 75420 | 2.05 / 2.07 / 2.11 | 6.96 / 6.99 / 7.02 | 3.68 / 3.70 / 3.74 | 8.09 / 8.14 / 8.19 | 0 / 0 / 0 |
| a10-p1.6-g100-d|POL3-BAL|passive | model-output (realistic) | 0.61 / 0.61 / 0.61 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 | 0.29 / 0.29 / 0.30 | 31300 / 31498 / 31630 | 62440 / 62836 / 63100 | 2.31 / 2.33 / 2.35 | 7.92 / 7.99 / 8.06 | 3.94 / 3.96 / 3.98 | 9.23 / 9.29 / 9.38 | 0 / 0 / 0 |
| a10-p1.6-g100-d|POL3-BAL|attentive | model-output (realistic) | 0.68 / 0.68 / 0.68 | 0.63 / 0.63 / 0.63 | 0.13 / 0.13 / 0.13 | 0.43 / 0.43 / 0.44 | 34644 / 34776 / 34974 | 69128 / 69392 / 69788 | 2.31 / 2.33 / 2.35 | 7.45 / 7.48 / 7.52 | 3.94 / 3.96 / 3.98 | 8.68 / 8.72 / 8.76 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

800 runs, 136690490 checks, **0 violations**.

## Notes and limitations

- Variants apply to the hero only (heroAdvantage hooks; 0 in the control). Raw damage is unchanged for historical comparison; effective damage follows S3-R18.
- No variant is a recommendation; the owner chooses directions after the results.

