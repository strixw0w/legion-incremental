# S4-E04-soft-caps

**Labels:** all values are `model-output` from `candidate` inputs (S4 permanent progression on the S3 industry and S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** How do Monument cost, marginal bonus, time to the next affordable level, return on investment and material milestones behave over seven days, does the soft cap move spending to alternatives without making earlier levels worthless, and does pooling the Monument bonuses change that?

**Design.** Seven days of one 60-minute session; POL4-MONUMENT and POL4-BALANCED on the control and on the additive-pooling sensitivity variant; POL4-MONUMENT in the arena. Snapshots after days 1-6. 30 replicates. The cost, marginal-bonus and ROI tables are derived from the content by src/cli/s4-analyse.ts.

**Seeds:** root `s4-e04`, 30 replicates per cell. **Semantic fingerprint:** `08078066770acb15763669eb63c5ea6a3aaebdd2eb82a5e2e8143faac7bac5d1` (manifest SHA-256 `c845b8bd685bc44bb0570774c976668c1c02ca6197ad240fe147139871538fc3`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | control|POL4-MONUMENT | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | pooled|POL4-MONUMENT | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | control|POL4-BALANCED | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | pooled|POL4-BALANCED | 0 | pass |
| H-S4-05 | Every S2, S3 and S4 invariant holds in every run (monitor I1-I28) | engineering | max == 0 violations | arena|POL4-MONUMENT | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | legionExpTotal | expTotal | conquestScore | killsPerHour | counter.goldEarned | goldHeld | monumentGoldSpent | permanentRewards | appliedAttackBp | appliedMonumentAttackBp | appliedHpBp | crafted | equipmentValue | professionLevelsSum | invariantViolations | level.power | level.vitality | level.industry | monumentPurchases | monumentPurchaseIntervalEarlyMin | monumentPurchaseIntervalLateMin | milestoneBlockedMin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| control|POL4-MONUMENT | model-output (realistic) | 1440864 / 1441392 / 1441744 | 361234 / 361366 / 361454 | 3001016567 / 3001016573 / 3001016577 | 114.26 / 114.30 / 114.32 | 98542 / 98578 / 98602 | 96628 / 96664 / 97497 | 507 / 1370 / 1370 | 31 / 31 / 32 | 2050 / 2050 / 2050 | 1200 / 2000 / 2000 | 1750 / 1750 / 1750 | 0 / 0 / 0 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 | 6 / 10 / 10 | 4 / 9 / 9 | 0 / 0 / 0 | 10 / 19 / 19 | 1.22 / 1.24 / 1.29 | 0.44 / 0.46 / 1.18 | 402.86 / 403.02 / 407.41 |
| pooled|POL4-MONUMENT | model-output (realistic) | 1440512 / 1440952 / 1441392 | 361146 / 361256 / 361366 | 3001016563 / 3001016568 / 3001016573 | 114.23 / 114.26 / 114.30 | 98518 / 98548 / 98578 | 96598 / 96640 / 97467 | 507 / 1370 / 1370 | 31 / 31 / 32 | 2050 / 2050 / 2050 | 1200 / 2000 / 2000 | 1750 / 1750 / 1750 | 0 / 0 / 0 | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 | 6 / 10 / 10 | 4 / 9 / 9 | 0 / 0 / 0 | 10 / 19 / 19 | 1.22 / 1.24 / 1.29 | 0.46 / 0.46 / 1.18 | 402.76 / 402.93 / 407.37 |
| control|POL4-BALANCED | model-output (realistic) | 1400544 / 1418824 / 1421242 | 352426 / 357032 / 357582 | 3001016174 / 3001016376 / 3001016401 | 111.54 / 112.94 / 113.11 | 96139 / 97396 / 97546 | 95283 / 96522 / 96690 | 306 / 306 / 507 | 38 / 38 / 39 | 2250 / 2250 / 2250 | 800 / 800 / 1200 | 1800 / 1800 / 1800 | 49 / 49 / 49 | 0.33 / 0.34 / 0.34 | 34 / 35 / 35 | 0 / 0 / 0 | 4 / 4 / 6 | 3 / 3 / 4 | 0 / 0 / 0 | 7 / 7 / 10 | 1.69 / 2.83 / 3.01 | 0.30 / 0.33 / 1.45 | 398.69 / 402.98 / 403.36 |
| pooled|POL4-BALANCED | model-output (realistic) | 1399958 / 1418420 / 1420972 | 352270 / 356922 / 357538 | 3001016174 / 3001016373 / 3001016399 | 111.54 / 112.92 / 113.10 | 96096 / 97366 / 97534 | 95240 / 96504 / 96669 | 306 / 306 / 507 | 38 / 38 / 39 | 2250 / 2250 / 2250 | 800 / 800 / 1200 | 1800 / 1800 / 1800 | 49 / 49 / 49 | 0.33 / 0.35 / 0.35 | 34 / 35 / 35 | 0 / 0 / 0 | 4 / 4 / 6 | 3 / 3 / 4 | 0 / 0 / 0 | 7 / 7 / 10 | 1.75 / 2.86 / 3.00 | 0.31 / 0.33 / 1.17 | 398.52 / 402.96 / 403.31 |
| arena|POL4-MONUMENT | model-output (diagnostic) | 561902 / 563970 / 564916 | 187990 / 188716 / 189024 | 3001008545 / 3001008578 / 3001008592 | 58.93 / 59.16 / 59.26 | 51270 / 51468 / 51552 | 51564 / 51762 / 51846 | 306 / 306 / 306 | 24 / 24 / 24 | 1600 / 1600 / 1600 | 800 / 800 / 800 | 1400 / 1400 / 1400 | 0 / 0 / 0 | 0 / 0 / 0 | 9 / 9 / 9 | 0 / 0 / 0 | 4 / 4 / 4 | 3 / 3 / 3 | 0 / 0 / 0 | 7 / 7 / 7 | 0.22 / 0.22 / 0.23 | 0.16 / 0.16 / 0.17 | 419.02 / 419.05 / 419.06 |

## Reward-invariant monitor (gate B1)

150 runs, 115443670 checks, **0 violations**.

## Notes and limitations

- Numerical stability: every level of every table is checked in the content compiler and by monitor I25.

