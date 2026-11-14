# S3-E02-queue-contention

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** How do two to four jobs competing for one component or bar input share it under per-unit FIFO (O10), and how do the diagnostic reserve-all and round-robin arms compare (shortage time, locked reservations, throughput, completion order)?

**Design.** Queue cells without combat: 1-2 smiths, one gatherer supplying the shared input (a Mage woodcutter for logs; a Warrior miner with a wood pickaxe for ore), a small starting stock, and 2-4 identical jobs enqueued 1 s apart. 10 minutes. Deterministic (no random draws); 3 replicates confirm it.

**Seeds:** root `s3-e02`, 3 replicates per cell. **Semantic fingerprint:** `4a34b2de4c77cc25716355a9d4d29853f80b17b3553f3fd0550b1641277299fe` (manifest SHA-256 `31e778acb868d913ea33f62fa13f7a01b1657257c8278cfdde5d735f2ced1e72`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|fifo|smiths-1|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|fifo|smiths-1|jobs-3 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|fifo|smiths-1|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|fifo|smiths-2|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|fifo|smiths-2|jobs-3 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|fifo|smiths-2|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|reserve-all|smiths-1|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|reserve-all|smiths-1|jobs-3 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|reserve-all|smiths-1|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|reserve-all|smiths-2|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|reserve-all|smiths-2|jobs-3 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|reserve-all|smiths-2|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|round-robin|smiths-1|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|round-robin|smiths-1|jobs-3 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|round-robin|smiths-1|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|round-robin|smiths-2|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|round-robin|smiths-2|jobs-3 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | plank|round-robin|smiths-2|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|fifo|smiths-2|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|fifo|smiths-2|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|reserve-all|smiths-2|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|reserve-all|smiths-2|jobs-4 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|round-robin|smiths-2|jobs-2 | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | bar|round-robin|smiths-2|jobs-4 | 0 | pass |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|fifo|smiths-1|jobs-2 | 0 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|fifo|smiths-1|jobs-3 | 0 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|fifo|smiths-1|jobs-4 | 0 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|fifo|smiths-2|jobs-2 | 0.273 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|fifo|smiths-2|jobs-3 | 0.880 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|fifo|smiths-2|jobs-4 | 2.577 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|reserve-all|smiths-1|jobs-2 | 0.149 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|reserve-all|smiths-1|jobs-3 | 1.047 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|reserve-all|smiths-1|jobs-4 | 2.696 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|reserve-all|smiths-2|jobs-2 | 0.783 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|reserve-all|smiths-2|jobs-3 | 2.300 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|reserve-all|smiths-2|jobs-4 | 4.550 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|round-robin|smiths-1|jobs-2 | 0 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|round-robin|smiths-1|jobs-3 | 0 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|round-robin|smiths-1|jobs-4 | 0 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|round-robin|smiths-2|jobs-2 | 0.359 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|round-robin|smiths-2|jobs-3 | 2.208 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | plank|round-robin|smiths-2|jobs-4 | 5.422 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | bar|fifo|smiths-2|jobs-2 | 0.247 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | bar|fifo|smiths-2|jobs-4 | 1.876 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | bar|reserve-all|smiths-2|jobs-2 | 0.742 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | bar|reserve-all|smiths-2|jobs-4 | 3.517 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | bar|round-robin|smiths-2|jobs-2 | 0.247 | reported |
| H-S3-04 | Shortage time per arm (reported, no target) | reported | mean >= 0 min | bar|round-robin|smiths-2|jobs-4 | 3.619 | reported |

## Cells (p10 / p50 / p90)

| Cell | Tag | unitsPerHour | totalShortageMin | maxJobShortageMin | meanReservedUnits | firstJobCompletionMin | lastJobCompletionMin | completionSpreadMin | jobsPaused | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|
| plank|fifo|smiths-1|jobs-2 | model-output (diagnostic) | 120 / 120 / 120 | 0 / 0 / 0 | 0 / 0 / 0 | 0.26 / 0.26 / 0.26 | 0.65 / 0.65 / 0.65 | 1.28 / 1.28 / 1.28 | 0.63 / 0.63 / 0.63 | 0 / 0 / 0 | 0 / 0 / 0 |
| plank|fifo|smiths-1|jobs-3 | model-output (diagnostic) | 180 / 180 / 180 | 0 / 0 / 0 | 0 / 0 / 0 | 0.38 / 0.38 / 0.38 | 0.65 / 0.65 / 0.65 | 1.90 / 1.90 / 1.90 | 1.24 / 1.24 / 1.24 | 0 / 0 / 0 | 0 / 0 / 0 |
| plank|fifo|smiths-1|jobs-4 | model-output (diagnostic) | 240 / 240 / 240 | 0 / 0 / 0 | 0 / 0 / 0 | 0.50 / 0.50 / 0.50 | 0.65 / 0.65 / 0.65 | 2.50 / 2.50 / 2.50 | 1.85 / 1.85 / 1.85 | 0 / 0 / 0 | 0 / 0 / 0 |
| plank|fifo|smiths-2|jobs-2 | model-output (diagnostic) | 120 / 120 / 120 | 0.27 / 0.27 / 0.27 | 0.21 / 0.21 / 0.21 | 0.26 / 0.26 / 0.26 | 0.71 / 0.71 / 0.71 | 0.88 / 0.88 / 0.88 | 0.16 / 0.16 / 0.16 | 4 / 4 / 4 | 0 / 0 / 0 |
| plank|fifo|smiths-2|jobs-3 | model-output (diagnostic) | 180 / 180 / 180 | 0.88 / 0.88 / 0.88 | 0.52 / 0.52 / 0.52 | 0.39 / 0.39 / 0.39 | 0.71 / 0.71 / 0.71 | 1.62 / 1.62 / 1.62 | 0.91 / 0.91 / 0.91 | 11 / 11 / 11 | 0 / 0 / 0 |
| plank|fifo|smiths-2|jobs-4 | model-output (diagnostic) | 240 / 240 / 240 | 2.58 / 2.58 / 2.58 | 1.26 / 1.26 / 1.26 | 0.51 / 0.51 / 0.51 | 0.71 / 0.71 / 0.71 | 2.36 / 2.36 / 2.36 | 1.65 / 1.65 / 1.65 | 24 / 24 / 24 | 0 / 0 / 0 |
| plank|reserve-all|smiths-1|jobs-2 | model-output (diagnostic) | 120 / 120 / 120 | 0.15 / 0.15 / 0.15 | 0.15 / 0.15 / 0.15 | 1.42 / 1.42 / 1.42 | 0.65 / 0.65 / 0.65 | 1.43 / 1.43 / 1.43 | 0.78 / 0.78 / 0.78 | 1 / 1 / 1 | 0 / 0 / 0 |
| plank|reserve-all|smiths-1|jobs-3 | model-output (diagnostic) | 180 / 180 / 180 | 1.05 / 1.05 / 1.05 | 0.90 / 0.90 / 0.90 | 2.10 / 2.10 / 2.10 | 0.65 / 0.65 / 0.65 | 2.17 / 2.17 / 2.17 | 1.52 / 1.52 / 1.52 | 2 / 2 / 2 | 0 / 0 / 0 |
| plank|reserve-all|smiths-1|jobs-4 | model-output (diagnostic) | 240 / 240 / 240 | 2.70 / 2.70 / 2.70 | 1.65 / 1.65 / 1.65 | 2.76 / 2.76 / 2.76 | 0.65 / 0.65 / 0.65 | 2.90 / 2.90 / 2.90 | 2.25 / 2.25 / 2.25 | 3 / 3 / 3 | 0 / 0 / 0 |
| plank|reserve-all|smiths-2|jobs-2 | model-output (diagnostic) | 120 / 120 / 120 | 0.78 / 0.78 / 0.78 | 0.78 / 0.78 / 0.78 | 1.42 / 1.42 / 1.42 | 0.65 / 0.65 / 0.65 | 1.43 / 1.43 / 1.43 | 0.78 / 0.78 / 0.78 | 1 / 1 / 1 | 0 / 0 / 0 |
| plank|reserve-all|smiths-2|jobs-3 | model-output (diagnostic) | 180 / 180 / 180 | 2.30 / 2.30 / 2.30 | 1.52 / 1.52 / 1.52 | 2.10 / 2.10 / 2.10 | 0.65 / 0.65 / 0.65 | 2.17 / 2.17 / 2.17 | 1.52 / 1.52 / 1.52 | 2 / 2 / 2 | 0 / 0 / 0 |
| plank|reserve-all|smiths-2|jobs-4 | model-output (diagnostic) | 240 / 240 / 240 | 4.55 / 4.55 / 4.55 | 2.25 / 2.25 / 2.25 | 2.76 / 2.76 / 2.76 | 0.65 / 0.65 / 0.65 | 2.90 / 2.90 / 2.90 | 2.25 / 2.25 / 2.25 | 3 / 3 / 3 | 0 / 0 / 0 |
| plank|round-robin|smiths-1|jobs-2 | model-output (diagnostic) | 120 / 120 / 120 | 0 / 0 / 0 | 0 / 0 / 0 | 0.26 / 0.26 / 0.26 | 1.22 / 1.22 / 1.22 | 1.28 / 1.28 / 1.28 | 0.06 / 0.06 / 0.06 | 0 / 0 / 0 | 0 / 0 / 0 |
| plank|round-robin|smiths-1|jobs-3 | model-output (diagnostic) | 180 / 180 / 180 | 0 / 0 / 0 | 0 / 0 / 0 | 0.38 / 0.38 / 0.38 | 1.77 / 1.77 / 1.77 | 1.90 / 1.90 / 1.90 | 0.12 / 0.12 / 0.12 | 0 / 0 / 0 | 0 / 0 / 0 |
| plank|round-robin|smiths-1|jobs-4 | model-output (diagnostic) | 240 / 240 / 240 | 0 / 0 / 0 | 0 / 0 / 0 | 0.50 / 0.50 / 0.50 | 2.32 / 2.32 / 2.32 | 2.50 / 2.50 / 2.50 | 0.18 / 0.18 / 0.18 | 0 / 0 / 0 | 0 / 0 / 0 |
| plank|round-robin|smiths-2|jobs-2 | model-output (diagnostic) | 120 / 120 / 120 | 0.36 / 0.36 / 0.36 | 0.20 / 0.20 / 0.20 | 0.26 / 0.26 / 0.26 | 0.81 / 0.81 / 0.81 | 0.86 / 0.86 / 0.86 | 0.05 / 0.05 / 0.05 | 5 / 5 / 5 | 0 / 0 / 0 |
| plank|round-robin|smiths-2|jobs-3 | model-output (diagnostic) | 180 / 180 / 180 | 2.21 / 2.21 / 2.21 | 0.77 / 0.77 / 0.77 | 0.39 / 0.39 / 0.39 | 1.46 / 1.46 / 1.46 | 1.61 / 1.61 / 1.61 | 0.15 / 0.15 / 0.15 | 15 / 15 / 15 | 0 / 0 / 0 |
| plank|round-robin|smiths-2|jobs-4 | model-output (diagnostic) | 240 / 240 / 240 | 5.42 / 5.42 / 5.42 | 1.44 / 1.44 / 1.44 | 0.51 / 0.51 / 0.51 | 2.11 / 2.11 / 2.11 | 2.36 / 2.36 / 2.36 | 0.25 / 0.25 / 0.25 | 25 / 25 / 25 | 0 / 0 / 0 |
| bar|fifo|smiths-2|jobs-2 | model-output (diagnostic) | 72 / 72 / 72 | 0.25 / 0.25 / 0.25 | 0.14 / 0.14 / 0.14 | 0.23 / 0.23 / 0.23 | 0.68 / 0.68 / 0.68 | 0.74 / 0.74 / 0.74 | 0.06 / 0.06 / 0.06 | 4 / 4 / 4 | 0 / 0 / 0 |
| bar|fifo|smiths-2|jobs-4 | model-output (diagnostic) | 144 / 144 / 144 | 1.88 / 1.88 / 1.88 | 0.84 / 0.84 / 0.84 | 0.45 / 0.45 / 0.45 | 0.68 / 0.68 / 0.68 | 1.78 / 1.78 / 1.78 | 1.10 / 1.10 / 1.10 | 16 / 16 / 16 | 0 / 0 / 0 |
| bar|reserve-all|smiths-2|jobs-2 | model-output (diagnostic) | 72 / 72 / 72 | 0.74 / 0.74 / 0.74 | 0.63 / 0.63 / 0.63 | 0.80 / 0.80 / 0.80 | 0.69 / 0.69 / 0.69 | 1.20 / 1.20 / 1.20 | 0.51 / 0.51 / 0.51 | 2 / 2 / 2 | 0 / 0 / 0 |
| bar|reserve-all|smiths-2|jobs-4 | model-output (diagnostic) | 144 / 144 / 144 | 3.52 / 3.52 / 3.52 | 1.64 / 1.64 / 1.64 | 1.58 / 1.58 / 1.58 | 0.69 / 0.69 / 0.69 | 2.24 / 2.24 / 2.24 | 1.55 / 1.55 / 1.55 | 4 / 4 / 4 | 0 / 0 / 0 |
| bar|round-robin|smiths-2|jobs-2 | model-output (diagnostic) | 72 / 72 / 72 | 0.25 / 0.25 / 0.25 | 0.14 / 0.14 / 0.14 | 0.23 / 0.23 / 0.23 | 0.68 / 0.68 / 0.68 | 0.74 / 0.74 / 0.74 | 0.06 / 0.06 / 0.06 | 4 / 4 / 4 | 0 / 0 / 0 |
| bar|round-robin|smiths-2|jobs-4 | model-output (diagnostic) | 144 / 144 / 144 | 3.62 / 3.62 / 3.62 | 1.01 / 1.01 / 1.01 | 0.45 / 0.45 / 0.45 | 1.55 / 1.55 / 1.55 | 1.78 / 1.78 / 1.78 | 0.23 / 0.23 / 0.23 | 16 / 16 / 16 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

72 runs, 674499 checks, **0 violations**.

## Notes and limitations

- reserve-all and round-robin are diagnostic arms only; the approved default is per-unit FIFO (O10).
- Inputs arrive only from the one gatherer after the starting stock; outputs are never consumed.

