# S2.1-E02-worker-estimator

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** With the ability-aware classification, does any worker estimate claim impossibility that realisation contradicts, and how do the corrected estimates compare with realised production?

**Design.** One worker of each class (classless, Warrior, Archer, Mage) x levels 1 / 5 / 10 (frozen) x zones 1-3; the hero farms the same zone continuously (Archer hero from level 5); the worker is never reassigned after a stop; 30 min, 100 replicates.

**Seeds:** root `S2.1-E02`, 100 replicates per cell. **Semantic fingerprint:** `93813b926d1cd825b7ae20c6e9d751bf654d6adfc18fad594978fcd886a6e6f1` (manifest SHA-256 `5ed8366ec99c256250992afed9249b693bd3136e276e1faaf74c579cc1e8430e`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|worker-archer | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|worker-mage | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|worker-mage | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | workerKillsPerHour | predictedWorkerKillsPerHour | predictedWorkerReliability | workerStops | memberKnockoutsPerHour | invariantViolations |
|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z1|worker-classless | model-output (diagnostic) | 840 / 844 / 848 | 838.61 / 838.61 / 838.61 | 1 / 1 / 1 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|worker-classless | model-output (diagnostic) | 24 / 26 / 28 | 201.71 / 201.71 / 201.71 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|worker-classless | model-output (diagnostic) | 0 / 0 / 0 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|worker-classless | model-output (diagnostic) | 1358 / 1364 / 1368 | 1363.64 / 1363.64 / 1363.64 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|worker-classless | model-output (diagnostic) | 90 / 90 / 90 | 433.88 / 433.88 / 433.88 | 1 / 1 / 1 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|worker-classless | model-output (diagnostic) | 6 / 6 / 8 | 62.79 / 62.79 / 62.79 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|worker-classless | model-output (diagnostic) | 2398 / 2398 / 2398 | 2400 / 2400 / 2400 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|worker-classless | model-output (diagnostic) | 774 / 774 / 774 | 770.15 / 770.15 / 770.15 | 1 / 1 / 1 | 0 / 0 / 0 | 18 / 18 / 18 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|worker-classless | model-output (diagnostic) | 18 / 18 / 18 | 152.04 / 152.04 / 152.04 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|worker-warrior | model-output (diagnostic) | 838 / 840 / 844 | 800.12 / 800.12 / 800.12 | 1 / 1 / 1 | 0 / 0 / 0 | 8 / 8 / 8 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|worker-warrior | model-output (diagnostic) | 36 / 38 / 42 | 187.44 / 187.44 / 187.44 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|worker-warrior | model-output (diagnostic) | 6 / 6 / 6 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|worker-warrior | model-output (diagnostic) | 1350 / 1350 / 1350 | 1285.71 / 1285.71 / 1285.71 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|worker-warrior | model-output (diagnostic) | 558 / 560 / 560 | 445.17 / 445.17 / 445.17 | 1 / 1 / 1 | 0 / 0 / 0 | 18 / 18 / 18 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|worker-warrior | model-output (diagnostic) | 18 / 18 / 18 | 93.99 / 93.99 / 93.99 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|worker-warrior | model-output (diagnostic) | 1392 / 1400 / 1412 | 1316.27 / 1316.27 / 1316.27 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|worker-warrior | model-output (diagnostic) | 830 / 830 / 834 | 600.09 / 600.09 / 600.09 | 1 / 1 / 1 | 0 / 0 / 0 | 8 / 8 / 8 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|worker-warrior | model-output (diagnostic) | 58 / 60 / 60 | 201.11 / 201.11 / 201.11 | 1 / 1 / 1 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|worker-archer | model-output (diagnostic) | 1148 / 1158 / 1168 | 993.41 / 993.41 / 993.41 | 1 / 1 / 1 | 0 / 0 / 0 | 8 / 8 / 8 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|worker-archer | model-output (diagnostic) | 52 / 54 / 56 | 246.12 / 246.12 / 246.12 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|worker-archer | model-output (diagnostic) | 6 / 6 / 6 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|worker-archer | model-output (diagnostic) | 1708 / 1716 / 1724 | 1531.91 / 1531.91 / 1531.91 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|worker-archer | model-output (diagnostic) | 762 / 774 / 792 | 519.18 / 519.18 / 519.18 | 1 / 1 / 1 | 0 / 0 / 0 | 18 / 20 / 20 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|worker-archer | model-output (diagnostic) | 18 / 18 / 20 | 123.64 / 123.64 / 123.64 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|worker-archer | model-output (diagnostic) | 2398 / 2398 / 2398 | 2400 / 2400 / 2400 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|worker-archer | model-output (diagnostic) | 1098 / 1106 / 1116 | 939.96 / 939.96 / 939.96 | 1 / 1 / 1 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|worker-archer | model-output (diagnostic) | 60 / 60 / 62 | 275.63 / 275.63 / 275.63 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|worker-mage | model-output (diagnostic) | 1370 / 1370 / 1370 | 1200 / 1200 / 1200 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|worker-mage | model-output (diagnostic) | 26 / 28 / 32 | 166.07 / 166.07 / 166.07 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|worker-mage | model-output (diagnostic) | 6 / 6 / 6 | 0 / 0 / 0 | 4 / 4 / 4 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|worker-mage | model-output (diagnostic) | 1380 / 1384 / 1390 | 1230.77 / 1230.77 / 1230.77 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|worker-mage | model-output (diagnostic) | 102 / 102 / 102 | 410.25 / 410.25 / 410.25 | 1 / 1 / 1 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|worker-mage | model-output (diagnostic) | 18 / 18 / 18 | 66.05 / 66.05 / 66.05 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|worker-mage | model-output (diagnostic) | 2398 / 2398 / 2398 | 2400 / 2400 / 2400 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|worker-mage | model-output (diagnostic) | 908 / 910 / 912 | 691.47 / 691.47 / 691.47 | 1 / 1 / 1 | 0 / 0 / 0 | 14 / 14 / 14 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|worker-mage | model-output (diagnostic) | 24 / 24 / 28 | 159.28 / 159.28 / 159.28 | 2 / 2 / 2 | 1 / 1 / 1 | 6 / 6 / 6 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

3600 runs, 64254470 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z1|worker-classless | 0 | 897.7 | reliable | 899.4 | -0.2% | 838.6 | 844.4 | -0.7% |
| a10-p1.6-g100|L1-Z2|worker-classless | 0 | 265.6 | unsafe | 265.8 | -0.1% | 201.7 | 25.7 | 684.3% |
| a10-p1.6-g100|L1-Z3|worker-classless | 0 | 0.0 | unsafe | 0 | not reached% | 0.0 | 0 | not reached% |
| a10-p1.6-g100|L5-Z1|worker-classless | 0 | 1531.9 | reliable | 1524.5 | 0.5% | 1363.6 | 1363.6 | 0.0% |
| a10-p1.6-g100|L5-Z2|worker-classless | 0 | 611.8 | approximate | 610.6 | 0.2% | 433.9 | 90 | 382.1% |
| a10-p1.6-g100|L5-Z3|worker-classless | 0 | 181.2 | unsafe | 180.0 | 0.7% | 62.8 | 6.3 | 903.0% |
| a10-p1.6-g100|L10-Z1|worker-classless | 0 | 2400 | reliable | 2390 | 0.4% | 2400 | 2398 | 0.1% |
| a10-p1.6-g100|L10-Z2|worker-classless | 0 | 1031.6 | reliable | 1030.9 | 0.1% | 770.1 | 774 | -0.5% |
| a10-p1.6-g100|L10-Z3|worker-classless | 0 | 360.8 | unsafe | 360.2 | 0.2% | 152.0 | 18.1 | 741.9% |
| a10-p1.6-g100|L1-Z1|worker-warrior | 0 | 897.7 | reliable | 899.4 | -0.2% | 800.1 | 840.5 | -4.8% |
| a10-p1.6-g100|L1-Z2|worker-warrior | 0 | 265.6 | unsafe | 265.8 | -0.1% | 187.4 | 39.0 | 380.1% |
| a10-p1.6-g100|L1-Z3|worker-warrior | 0 | 0.0 | unsafe | 0 | not reached% | 0.0 | 6 | -100.0% |
| a10-p1.6-g100|L5-Z1|worker-warrior | 0 | 1531.9 | reliable | 1524.5 | 0.5% | 1285.7 | 1350 | -4.8% |
| a10-p1.6-g100|L5-Z2|worker-warrior | 0 | 611.8 | approximate | 610.6 | 0.2% | 445.2 | 559.4 | -20.4% |
| a10-p1.6-g100|L5-Z3|worker-warrior | 0 | 181.2 | unsafe | 180.0 | 0.7% | 94.0 | 18 | 422.2% |
| a10-p1.6-g100|L10-Z1|worker-warrior | 0 | 2400 | reliable | 2390 | 0.4% | 1316.3 | 1401.6 | -6.1% |
| a10-p1.6-g100|L10-Z2|worker-warrior | 0 | 1031.6 | reliable | 1030.9 | 0.1% | 600.1 | 831 | -27.8% |
| a10-p1.6-g100|L10-Z3|worker-warrior | 0 | 360.8 | unsafe | 360.2 | 0.2% | 201.1 | 59.8 | 236.5% |
| a10-p1.6-g100|L1-Z1|worker-archer | 0 | 897.7 | reliable | 899.4 | -0.2% | 993.4 | 1158.1 | -14.2% |
| a10-p1.6-g100|L1-Z2|worker-archer | 0 | 265.6 | unsafe | 265.8 | -0.1% | 246.1 | 53.6 | 359.5% |
| a10-p1.6-g100|L1-Z3|worker-archer | 0 | 0.0 | unsafe | 0 | not reached% | 0.0 | 6 | -100.0% |
| a10-p1.6-g100|L5-Z1|worker-archer | 0 | 1531.9 | reliable | 1524.5 | 0.5% | 1531.9 | 1716.1 | -10.7% |
| a10-p1.6-g100|L5-Z2|worker-archer | 0 | 611.8 | approximate | 610.6 | 0.2% | 519.2 | 776 | -33.1% |
| a10-p1.6-g100|L5-Z3|worker-archer | 0 | 181.2 | unsafe | 180.0 | 0.7% | 123.6 | 18.3 | 574.9% |
| a10-p1.6-g100|L10-Z1|worker-archer | 0 | 2400 | reliable | 2390 | 0.4% | 2400 | 2398 | 0.1% |
| a10-p1.6-g100|L10-Z2|worker-archer | 0 | 1031.6 | reliable | 1030.9 | 0.1% | 940.0 | 1107.7 | -15.1% |
| a10-p1.6-g100|L10-Z3|worker-archer | 0 | 360.8 | unsafe | 360.2 | 0.2% | 275.6 | 60.6 | 354.7% |
| a10-p1.6-g100|L1-Z1|worker-mage | 0 | 897.7 | reliable | 899.4 | -0.2% | 1200 | 1370 | -12.4% |
| a10-p1.6-g100|L1-Z2|worker-mage | 0 | 265.6 | unsafe | 265.8 | -0.1% | 166.1 | 28.0 | 492.7% |
| a10-p1.6-g100|L1-Z3|worker-mage | 0 | 0.0 | unsafe | 0 | not reached% | 0 | 6 | -100% |
| a10-p1.6-g100|L5-Z1|worker-mage | 0 | 1531.9 | reliable | 1524.5 | 0.5% | 1230.8 | 1384.8 | -11.1% |
| a10-p1.6-g100|L5-Z2|worker-mage | 0 | 611.8 | approximate | 610.6 | 0.2% | 410.3 | 102 | 302.2% |
| a10-p1.6-g100|L5-Z3|worker-mage | 0 | 181.2 | unsafe | 180.0 | 0.7% | 66.0 | 18 | 266.9% |
| a10-p1.6-g100|L10-Z1|worker-mage | 0 | 2400 | reliable | 2390 | 0.4% | 2400 | 2398 | 0.1% |
| a10-p1.6-g100|L10-Z2|worker-mage | 0 | 1031.6 | reliable | 1030.9 | 0.1% | 691.5 | 909.7 | -24.0% |
| a10-p1.6-g100|L10-Z3|worker-mage | 0 | 360.8 | unsafe | 360.2 | 0.2% | 159.3 | 24.8 | 541.2% |

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. No content, coefficient, target or policy parameter changed in S2.1.
- Engine: S2 with the S2.1 corrections (worker access requires a visited zone; ability-aware worker classification; exact ledger reconstruction; reserve swaps outside encounters; monitor I9).
- The hero starts in, and farms, the cell zone, so the zone is visited; workers work in that zone.
- H-S2.1-01 (engineering, analysis C6): every cell whose displayed worker estimate is unreachable (predictedWorkerReliability = 3) realises 0 worker kills. H-S2.1-02 (reported): unresolved cells (code 4) and their realised kills.
- predictedWorkerReliability codes: 0 reliable, 1 approximate, 2 unsafe, 3 unreachable, 4 unresolved.

