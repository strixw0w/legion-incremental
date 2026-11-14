# S3-E04-gather-vs-fight

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** What does moving recruits from combat into gathering and smithing cost and buy (hero and legion EXP, conquest, materials, crafted items), and do the O06 affinities change the outcome (no-affinity control)?

**Design.** Campaigns with 0 (POL3-CONQ and the S2 control), 2 after the roster is full (POL3-COMBAT), 2 from joining (POL3-BAL) and 3 (POL3-PROF) recruits in production, PR-BAL and PR-OPT; POL3-BAL and POL3-PROF also with the affinity set to 0. 100 replicates.

**Seeds:** root `s3-e04`, 100 replicates per cell. **Semantic fingerprint:** `c811c99258b43ae6838ceaee2021ebbd2077f6c05f7858eabfbe647ef75470c3` (manifest SHA-256 `31919be3f701b030ded83c016fdad5ac1396abe791d2a150667abd4016a673c4`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL2-SQUAD-W|S2-control | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-CONQ | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-COMBAT | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-PROF | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL2-SQUAD-W|S2-control | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-CONQ | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-COMBAT | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-PROF | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-BAL|no-affinity | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-PROF|no-affinity | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | expTotal | legionExpTotal | conquestScore | finalLevel | crafted | craftedCopper | logsPerHour | orePerHour | planksPerHour | barsPerHour | heroDamageShare | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PR-BAL|POL2-SQUAD-W|S2-control | model-output (control) | 44280 / 44434 / 44544 | 174460 / 175076 / 175516 | 3001002160 / 3001002167 / 3001002172 | 36 / 37 / 37 | — | — | — | — | — | — | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| PR-BAL|POL3-CONQ | model-output (realistic) | 44280 / 44434 / 44544 | 174460 / 175076 / 175516 | 3001002160 / 3001002167 / 3001002172 | 36 / 37 / 37 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| PR-BAL|POL3-COMBAT | model-output (realistic) | 29936 / 30068 / 30200 | 60940 / 61204 / 61468 | 3001001508 / 3001001514 / 3001001520 | 31 / 31 / 31 | 7 / 7 / 7 | 2 / 2 / 2 | 2052 / 2054 / 2058 | 12 / 12 / 12 | 15 / 15 / 15 | 6 / 6 / 6 | 0.55 / 0.56 / 0.56 | 0 / 0 / 0 |
| PR-BAL|POL3-BAL | model-output (realistic) | 29694 / 29826 / 29958 | 59096 / 59360 / 59624 | 3001001497 / 3001001503 / 3001001509 | 31 / 31 / 31 | 8 / 8 / 8 | 2 / 2 / 2 | 2310 / 2315 / 2318 | 24 / 24 / 24 | 17 / 17 / 17 | 12 / 12 / 12 | 0.57 / 0.57 / 0.57 | 0 / 0 / 0 |
| PR-BAL|POL3-PROF | model-output (realistic) | 16068 / 16156 / 16266 | 16068 / 16156 / 16266 | 3001000912 / 3001000916 / 3001000921 | 25 / 25 / 25 | 10 / 10 / 10 | 5 / 5 / 5 | 3057 / 3059 / 3062 | 1958 / 1969 / 1975 | 13 / 13 / 13 | 14 / 14 / 14 | 1 / 1 / 1 | 0 / 0 / 0 |
| PR-OPT|POL2-SQUAD-W|S2-control | model-output (control) | 70680 / 70834 / 70944 | 280060 / 280676 / 281116 | 3001003360 / 3001003367 / 3001003372 | 44 / 44 / 44 | — | — | — | — | — | — | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| PR-OPT|POL3-CONQ | model-output (realistic) | 70680 / 70834 / 70944 | 280060 / 280676 / 281116 | 3001003360 / 3001003367 / 3001003372 | 44 / 44 / 44 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| PR-OPT|POL3-COMBAT | model-output (realistic) | 49076 / 49296 / 49494 | 99220 / 99660 / 100056 | 3001002378 / 3001002388 / 3001002397 | 38 / 38 / 38 | 7 / 7 / 7 | 2 / 2 / 2 | 2326.67 / 2328.67 / 2332 | 8 / 8 / 8 | 10 / 10 / 10 | 4 / 4 / 4 | 0.55 / 0.56 / 0.56 | 0 / 0 / 0 |
| PR-OPT|POL3-BAL | model-output (realistic) | 48834 / 49076 / 49252 | 97376 / 97860 / 98212 | 3001002367 / 3001002378 / 3001002386 | 38 / 38 / 38 | 8 / 8 / 8 | 2 / 2 / 2 | 2644 / 2647.33 / 2649.33 | 16 / 16 / 16 | 11.33 / 11.33 / 11.33 | 8 / 8 / 8 | 0.56 / 0.56 / 0.56 | 0 / 0 / 0 |
| PR-OPT|POL3-PROF | model-output (realistic) | 27618 / 27750 / 27882 | 27618 / 27750 / 27882 | 3001001437 / 3001001443 / 3001001449 | 30 / 30 / 31 | 10 / 10 / 10 | 5 / 5 / 5 | 3283.33 / 3284.67 / 3286.67 | 2305.33 / 2313.33 / 2317.33 | 8.67 / 8.67 / 8.67 | 9.33 / 9.33 / 9.33 | 1 / 1 / 1 | 0 / 0 / 0 |
| PR-BAL|POL3-BAL|no-affinity | model-output (realistic) | 29694 / 29826 / 29958 | 59096 / 59360 / 59624 | 3001001497 / 3001001503 / 3001001509 | 31 / 31 / 31 | 8 / 8 / 8 | 2 / 2 / 2 | 1954 / 1958 / 1963 | 24 / 24 / 25 | 17 / 17 / 17 | 12 / 12 / 12 | 0.57 / 0.57 / 0.57 | 0 / 0 / 0 |
| PR-BAL|POL3-PROF|no-affinity | model-output (realistic) | 16068 / 16156 / 16266 | 16068 / 16156 / 16266 | 3001000912 / 3001000916 / 3001000921 | 25 / 25 / 25 | 10 / 10 / 10 | 5 / 5 / 5 | 3056 / 3059 / 3061 | 1961 / 1972 / 1977 | 13 / 13 / 13 | 14 / 14 / 14 | 1 / 1 / 1 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

1200 runs, 211828812 checks, **0 violations**.

## Notes and limitations

- The S2 control (POL2-SQUAD-W, industry off) runs on the S3 content, whose S2 part is identical (tested).
- Affinity strength is a candidate (O06); the no-affinity cells are the required control.

