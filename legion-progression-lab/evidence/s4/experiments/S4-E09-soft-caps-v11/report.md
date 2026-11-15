# S4-E09-soft-caps-v11

**Labels:** all values are `model-output` from `candidate` inputs (S4 permanent progression on the S3 industry and S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Amendment 01 (post-results follow-up): with the corrected purchase rule, how do Monument cost, marginal bonus, time to the next affordable level and material milestones behave over seven days, and does pooling the Monument bonuses change that?

**Design.** S4-E04 with version 1.1 of POL4-MONUMENT and POL4-BALANCED added beside version 1. Same seeds and sessions as S4-E04. 30 replicates.

**Seeds:** root `s4-e04`, 30 replicates per cell. **Semantic fingerprint:** `1dbc6eb2338bb4ffc6f882d21b2f657eed4dbfb0cbb215e51e9b0427ade1b8e0` (manifest SHA-256 `cbe5fd198c9da32aef21cdd9a3dacbe38e59bc9fa0a6268add0d451fb5693cd0`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | control|POL4-MONUMENT | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | pooled|POL4-MONUMENT | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | control|POL4-BALANCED | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | pooled|POL4-BALANCED | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | arena|POL4-MONUMENT | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | control|POL4-MONUMENT2 | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | pooled|POL4-MONUMENT2 | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | control|POL4-BALANCED2 | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | pooled|POL4-BALANCED2 | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | arena|POL4-MONUMENT2 | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | legionExpTotal | expTotal | conquestScore | killsPerHour | counter.goldEarned | goldHeld | monumentGoldSpent | permanentRewards | appliedAttackBp | appliedMonumentAttackBp | appliedHpBp | crafted | equipmentValue | professionLevelsSum | invariantViolations | level.power | level.vitality | level.industry | monumentPurchases | monumentPurchaseIntervalEarlyMin | monumentPurchaseIntervalLateMin | milestoneBlockedMin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| control|POL4-MONUMENT | model-output (realistic) | 1440864 / 1441392 / 1441744 | 361234 / 361366 / 361454 | 3001016567 / 3001016573 / 3001016577 | 114.26 / 114.30 / 114.32 | 98542 / 98578 / 98602 | 96628 / 96664 / 97497 | 507 / 1370 / 1370 | 31 / 31 / 32 | 2050 / 2050 / 2050 | 1200 / 2000 / 2000 | 1750 / 1750 / 1750 | 0 / 0 / 0 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 | 6 / 10 / 10 | 4 / 9 / 9 | 0 / 0 / 0 | 10 / 19 / 19 | 1.22 / 1.24 / 1.29 | 0.44 / 0.46 / 1.18 | 402.86 / 403.02 / 407.41 |
| pooled|POL4-MONUMENT | model-output (realistic) | 1440512 / 1440952 / 1441392 | 361146 / 361256 / 361366 | 3001016563 / 3001016568 / 3001016573 | 114.23 / 114.26 / 114.30 | 98518 / 98548 / 98578 | 96598 / 96640 / 97467 | 507 / 1370 / 1370 | 31 / 31 / 32 | 2050 / 2050 / 2050 | 1200 / 2000 / 2000 | 1750 / 1750 / 1750 | 0 / 0 / 0 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 | 6 / 10 / 10 | 4 / 9 / 9 | 0 / 0 / 0 | 10 / 19 / 19 | 1.22 / 1.24 / 1.29 | 0.46 / 0.46 / 1.18 | 402.76 / 402.93 / 407.37 |
| control|POL4-BALANCED | model-output (realistic) | 1400544 / 1418824 / 1421242 | 352426 / 357032 / 357582 | 3001016174 / 3001016376 / 3001016401 | 111.54 / 112.94 / 113.11 | 96139 / 97396 / 97546 | 95283 / 96522 / 96690 | 306 / 306 / 507 | 38 / 38 / 39 | 2250 / 2250 / 2250 | 800 / 800 / 1200 | 1800 / 1800 / 1800 | 49 / 49 / 49 | 0.33 / 0.34 / 0.34 | 34 / 35 / 35 | 0 / 0 / 0 | 4 / 4 / 6 | 3 / 3 / 4 | 0 / 0 / 0 | 7 / 7 / 10 | 1.69 / 2.83 / 3.01 | 0.30 / 0.33 / 1.45 | 398.69 / 402.98 / 403.36 |
| pooled|POL4-BALANCED | model-output (realistic) | 1399958 / 1418420 / 1420972 | 352270 / 356922 / 357538 | 3001016174 / 3001016373 / 3001016399 | 111.54 / 112.92 / 113.10 | 96096 / 97366 / 97534 | 95240 / 96504 / 96669 | 306 / 306 / 507 | 38 / 38 / 39 | 2250 / 2250 / 2250 | 800 / 800 / 1200 | 1800 / 1800 / 1800 | 49 / 49 / 49 | 0.33 / 0.35 / 0.35 | 34 / 35 / 35 | 0 / 0 / 0 | 4 / 4 / 6 | 3 / 3 / 4 | 0 / 0 / 0 | 7 / 7 / 10 | 1.75 / 2.86 / 3.00 | 0.31 / 0.33 / 1.17 | 398.52 / 402.96 / 403.31 |
| arena|POL4-MONUMENT | model-output (diagnostic) | 561902 / 563970 / 564916 | 187990 / 188716 / 189024 | 3001008545 / 3001008578 / 3001008592 | 58.93 / 59.16 / 59.26 | 51270 / 51468 / 51552 | 51564 / 51762 / 51846 | 306 / 306 / 306 | 24 / 24 / 24 | 1600 / 1600 / 1600 | 800 / 800 / 800 | 1400 / 1400 / 1400 | 0 / 0 / 0 | 0 / 0 / 0 | 9 / 9 / 9 | 0 / 0 / 0 | 4 / 4 / 4 | 3 / 3 / 3 | 0 / 0 / 0 | 7 / 7 / 7 | 0.22 / 0.22 / 0.23 | 0.16 / 0.16 / 0.17 | 419.02 / 419.05 / 419.06 |
| control|POL4-MONUMENT2 | model-output (realistic) | 1440292 / 1440820 / 1441084 | 361080 / 361212 / 361278 | 3001016560 / 3001016566 / 3001016569 | 114.21 / 114.25 / 114.27 | 98500 / 98536 / 98554 | 93720 / 93756 / 97200 | 738 / 4242 / 4242 | 31 / 31 / 32 | 2050 / 2050 / 2050 | 800 / 2900 / 2900 | 1750 / 1750 / 1750 | 0 / 0 / 0 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 | 4 / 19 / 19 | 9 / 9 / 9 | 0 / 0 / 0 | 13 / 28 / 28 | 0.92 / 0.92 / 1.11 | 0.95 / 1.08 / 1.08 | 398.52 / 398.66 / 406.08 |
| pooled|POL4-MONUMENT2 | model-output (realistic) | 1439764 / 1440292 / 1440820 | 360948 / 361080 / 361212 | 3001016554 / 3001016560 / 3001016566 | 114.17 / 114.21 / 114.25 | 98464 / 98500 / 98536 | 93696 / 93738 / 97176 | 738 / 4242 / 4242 | 31 / 31 / 32 | 2050 / 2050 / 2050 | 800 / 2900 / 2900 | 1750 / 1750 / 1750 | 0 / 0 / 0 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 | 4 / 19 / 19 | 9 / 9 / 9 | 0 / 0 / 0 | 13 / 28 / 28 | 0.92 / 0.93 / 1.11 | 0.96 / 1.08 / 1.09 | 398.43 / 398.59 / 406.05 |
| control|POL4-BALANCED2 | model-output (realistic) | 1399392 / 1418398 / 1420558 | 352156 / 357032 / 357340 | 3001016168 / 3001016376 / 3001016390 | 111.50 / 112.94 / 113.03 | 96065 / 97396 / 97480 | 94857 / 96191 / 96275 | 655 / 655 / 1140 | 38 / 38 / 39 | 2250 / 2250 / 2250 | 800 / 800 / 1800 | 1800 / 1800 / 1800 | 49 / 49 / 49 | 0.33 / 0.34 / 0.34 | 34 / 35 / 35 | 0 / 0 / 0 | 4 / 4 / 9 | 4 / 4 / 4 | 4 / 4 / 4 | 12 / 12 / 17 | 1.15 / 1.41 / 1.94 | 0.33 / 0.37 / 0.42 | 399.61 / 403.07 / 403.22 |
| pooled|POL4-BALANCED2 | model-output (realistic) | 1401734 / 1418142 / 1420682 | 352422 / 357010 / 357384 | 3001016185 / 3001016375 / 3001016392 | 111.62 / 112.93 / 113.05 | 96148 / 97390 / 97492 | 94889 / 96155 / 96287 | 655 / 655 / 1140 | 38 / 38 / 39 | 2250 / 2250 / 2250 | 800 / 800 / 1800 | 1800 / 1800 / 1800 | 49 / 49 / 49 | 0.34 / 0.35 / 0.35 | 34 / 35 / 35 | 0 / 0 / 0 | 4 / 4 / 9 | 4 / 4 / 4 | 4 / 4 / 4 | 12 / 12 / 17 | 1.15 / 1.42 / 1.94 | 0.34 / 0.37 / 0.44 | 399.97 / 403.06 / 403.23 |
| arena|POL4-MONUMENT2 | model-output (diagnostic) | 562936 / 564102 / 564872 | 188386 / 188738 / 188980 | 3001008563 / 3001008579 / 3001008590 | 59.06 / 59.17 / 59.24 | 51378 / 51474 / 51540 | 51624 / 51720 / 51786 | 354 / 354 / 354 | 24 / 24 / 24 | 1600 / 1600 / 1600 | 800 / 800 / 800 | 1400 / 1400 / 1400 | 0 / 0 / 0 | 0 / 0 / 0 | 9 / 9 / 9 | 0 / 0 / 0 | 4 / 4 / 4 | 4 / 4 / 4 | 0 / 0 / 0 | 8 / 8 / 8 | 0.20 / 0.21 / 0.21 | 0.16 / 0.16 / 0.17 | 419.01 / 419.04 / 419.06 |

## Reward-invariant monitor (gate B1)

300 runs, 230870824 checks, **0 violations**.

## Notes and limitations

- Registered as amendment 01 after the registered results (manifests/s4/AMENDMENT-01.md); reported as a follow-up, never in place of a registered outcome. Cells shared with the original manifest must reproduce it exactly.
- Numerical stability: every level of every table is checked in the content compiler and by monitor I25.

