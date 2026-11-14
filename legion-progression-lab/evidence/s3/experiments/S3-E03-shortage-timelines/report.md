# S3-E03-shortage-timelines

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** When does a long job pause for inputs, for how long, and does it resume automatically as deposits arrive (O10), at different supply rates?

**Design.** One smith, one long job (60 planks or 20 copper bars), supply from 0-2 gatherers (with and without the Mage woodcutting affinity) after a starting stock. 15 minutes, per-unit FIFO. Deterministic; 3 replicates.

**Seeds:** root `s3-e03`, 3 replicates per cell. **Semantic fingerprint:** `99d9083575f0032f6b1efa3d649e38b93446be8312b3d86a08364c0ae5b6a157` (manifest SHA-256 `abb64d4e524d1bcb027cc503bb5ca9d5f48a23b2e6da31c9f4e6afa931165c83`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|supply-0|stock-40 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|supply-1-none | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|supply-1-mage | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|supply-2-none | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|miners-0 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|miners-1 | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | unitsPerHour | totalShortageMin | jobsPaused | jobsCompleted | lastJobCompletionMin | meanReservedUnits | invariantViolations |
|---|---|---|---|---|---|---|---|---|
| plank|supply-0|stock-40 | model-output (diagnostic) | 80 / 80 / 80 | 13.72 / 13.72 / 13.72 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 |
| plank|supply-1-none | model-output (diagnostic) | 240 / 240 / 240 | 1.33 / 1.33 / 1.33 | 37 / 37 / 37 | 1 / 1 / 1 | 5.02 / 5.02 / 5.02 | 0.49 / 0.49 / 0.49 | 0 / 0 / 0 |
| plank|supply-1-mage | model-output (diagnostic) | 240 / 240 / 240 | 0.47 / 0.47 / 0.47 | 18 / 18 / 18 | 1 / 1 / 1 | 4.16 / 4.16 / 4.16 | 0.49 / 0.49 / 0.49 | 0 / 0 / 0 |
| plank|supply-2-none | model-output (diagnostic) | 240 / 240 / 240 | 0 / 0 / 0 | 0 / 0 / 0 | 1 / 1 / 1 | 3.69 / 3.69 / 3.69 | 0.49 / 0.49 / 0.49 | 0 / 0 / 0 |
| bar|miners-0 | model-output (diagnostic) | 20 / 20 / 20 | 14.52 / 14.52 / 14.52 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | 0.06 / 0.06 / 0.06 | 0 / 0 / 0 |
| bar|miners-1 | model-output (diagnostic) | 80 / 80 / 80 | 0 / 0 / 0 | 0 / 0 / 0 | 1 / 1 / 1 | 1.87 / 1.87 / 1.87 | 0.25 / 0.25 / 0.25 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

18 runs, 177750 checks, **0 violations**.

## Notes and limitations

- A job pauses when its next unit is short and resumes at the deposit that covers it (same moment: deposit first, D-07).

