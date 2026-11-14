# S3-E10-pacing-levers

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Direction E: how sensitive are level, zone, recruit and first-craft timings to each pacing lever varied alone (EXP curve, enemy HP of one zone, recruit milestone, kill gates, equipment costs)?

**Design.** PR-BAL campaigns of POL3-BAL; each variant changes one lever around the control. Enemy HP is changed per zone, never uniformly. 50 replicates.

**Seeds:** root `s3-e10`, 50 replicates per cell. **Semantic fingerprint:** `a174fad5eb38c6ca1a5534b92c6bb052c09e065a5da35337e9422bc9902efa26` (manifest SHA-256 `b73988eefcdd40a975c8035921ea5de931ac6dfb774fa3aedb20fdd3c3d19c36`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-xp-a8|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-xp-a12|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-xp-p18|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-z2hp125|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-z3hp125|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-gate1-75|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-gate1-125|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-gate2-90|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-gate2-150|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-equip-x0.5|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | pace-equip-x2|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | quest-20|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | quest-60|POL3-BAL | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | minToL5 | minToL10 | zone2FirstVisitMin | zone3FirstVisitMin | firstRecruitMin | recruit2Min | recruit3Min | firstUsefulCraftMin | expTotal | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 7.94 / 7.98 / 8.02 | 3.92 / 3.96 / 3.98 | 9.24 / 9.28 / 9.34 | 2.05 / 2.09 / 2.11 | 4.81 / 4.85 / 4.89 | 10.45 / 10.49 / 10.56 | 10.72 / 10.78 / 10.84 | 29694 / 29848 / 29958 | 0 / 0 / 0 |
| pace-xp-a8|POL3-BAL | model-output (realistic) | 1.92 / 1.96 / 1.98 | 6.68 / 6.72 / 6.75 | 3.83 / 3.88 / 3.90 | 8.98 / 9.03 / 9.07 | 2.00 / 2.04 / 2.06 | 4.68 / 4.72 / 4.74 | 10.11 / 10.16 / 10.22 | 10.38 / 10.43 / 10.49 | 30926 / 31124 / 31212 | 0 / 0 / 0 |
| pace-xp-a12|POL3-BAL | model-output (realistic) | 2.53 / 2.57 / 2.61 | 9.61 / 9.68 / 9.76 | 3.94 / 3.98 / 4.02 | 9.43 / 9.49 / 9.58 | 2.09 / 2.13 / 2.15 | 4.89 / 4.94 / 4.98 | 10.69 / 10.78 / 10.86 | 10.99 / 11.08 / 11.15 | 28594 / 28704 / 28792 | 0 / 0 / 0 |
| pace-xp-p18|POL3-BAL | model-output (realistic) | 2.61 / 2.65 / 2.69 | 11.03 / 11.09 / 11.17 | 3.94 / 3.98 / 4.02 | 9.62 / 9.68 / 9.75 | 2.09 / 2.13 / 2.15 | 4.89 / 4.95 / 4.99 | 10.95 / 11.01 / 11.09 | 11.26 / 11.33 / 11.42 | 27010 / 27098 / 27186 | 0 / 0 / 0 |
| pace-z2hp125|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 8.64 / 8.71 / 8.77 | 3.92 / 3.96 / 3.98 | 10.07 / 10.16 / 10.23 | 2.05 / 2.09 / 2.11 | 4.96 / 5.00 / 5.04 | 11.29 / 11.38 / 11.46 | 11.57 / 11.65 / 11.74 | 29122 / 29276 / 29386 | 0 / 0 / 0 |
| pace-z3hp125|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 7.94 / 7.98 / 8.02 | 3.92 / 3.96 / 3.98 | 9.24 / 9.28 / 9.34 | 2.05 / 2.09 / 2.11 | 4.81 / 4.85 / 4.89 | 10.65 / 10.71 / 10.76 | 10.93 / 11.00 / 11.06 | 25206 / 25316 / 25448 | 0 / 0 / 0 |
| pace-gate1-75|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 7.82 / 7.86 / 7.92 | 3.30 / 3.34 / 3.36 | 8.75 / 8.79 / 8.85 | 2.05 / 2.09 / 2.11 | 4.61 / 4.66 / 4.70 | 10.33 / 10.39 / 10.46 | 10.61 / 10.66 / 10.74 | 29770 / 29902 / 30056 | 0 / 0 / 0 |
| pace-gate1-125|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 8.05 / 8.12 / 8.16 | 4.55 / 4.59 / 4.61 | 9.73 / 9.80 / 9.84 | 2.05 / 2.09 / 2.11 | 5.03 / 5.08 / 5.11 | 10.63 / 10.69 / 10.76 | 10.91 / 10.97 / 11.04 | 29552 / 29728 / 29860 | 0 / 0 / 0 |
| pace-gate2-90|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 8.39 / 8.43 / 8.47 | 3.92 / 3.96 / 3.98 | 8.12 / 8.16 / 8.21 | 2.05 / 2.09 / 2.11 | 4.81 / 4.85 / 4.89 | 10.47 / 10.54 / 10.62 | 10.75 / 10.82 / 10.90 | 29702 / 29878 / 30010 | 0 / 0 / 0 |
| pace-gate2-150|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 7.94 / 7.98 / 8.02 | 3.92 / 3.96 / 3.98 | 10.37 / 10.40 / 10.46 | 2.05 / 2.09 / 2.11 | 4.81 / 4.85 / 4.89 | 10.03 / 10.07 / 10.12 | 10.37 / 10.40 / 10.46 | 29708 / 29928 / 30038 | 0 / 0 / 0 |
| pace-equip-x0.5|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 7.94 / 7.98 / 8.02 | 3.92 / 3.96 / 3.98 | 9.24 / 9.28 / 9.34 | 2.05 / 2.09 / 2.11 | 4.81 / 4.85 / 4.89 | 10.45 / 10.49 / 10.56 | 10.65 / 10.70 / 10.77 | 29760 / 29892 / 30046 | 0 / 0 / 0 |
| pace-equip-x2|POL3-BAL | model-output (realistic) | 2.29 / 2.33 / 2.35 | 7.94 / 7.98 / 8.02 | 3.92 / 3.96 / 3.98 | 9.24 / 9.28 / 9.34 | 2.05 / 2.09 / 2.11 | 4.81 / 4.85 / 4.89 | 10.45 / 10.49 / 10.56 | 10.86 / 10.91 / 10.98 | 29606 / 29738 / 29870 | 0 / 0 / 0 |
| quest-20|POL3-BAL | model-output (realistic) | 1.91 / 1.95 / 1.99 | 7.54 / 7.60 / 7.67 | 3.54 / 3.58 / 3.62 | 8.84 / 8.90 / 8.97 | 1.15 / 1.19 / 1.21 | 4.43 / 4.49 / 4.53 | 10.04 / 10.11 / 10.18 | 10.31 / 10.39 / 10.45 | 30002 / 30134 / 30244 | 0 / 0 / 0 |
| quest-60|POL3-BAL | model-output (realistic) | 2.41 / 2.45 / 2.47 | 8.25 / 8.30 / 8.36 | 4.21 / 4.26 / 4.29 | 9.56 / 9.60 / 9.67 | 2.87 / 2.93 / 2.95 | 5.12 / 5.17 / 5.21 | 10.75 / 10.83 / 10.90 | 11.03 / 11.12 / 11.19 | 29430 / 29584 / 29716 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

700 runs, 111899418 checks, **0 violations**.

## Notes and limitations

- Sensitivity only: no lever is recommended and no target is moved (owner S3 section 8 E).

