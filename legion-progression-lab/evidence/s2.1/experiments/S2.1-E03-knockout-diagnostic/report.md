# S2.1-E03-knockout-diagnostic

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Do matched squads at low levels in harder zones generate knockouts, so that knockout rules can be studied (S3 matrix calibration)?

**Design.** Matched squads, frozen levels 1 and 5, zones 2 and 3, squads of 1 / 2 / 3 (Warrior, Archer, Mage), enemy damage x1 and x2; the realistic fixed-zone squad logic (rests, respects stops), passive hero (Archer from level 5, classless at level 1); 30 min, 100 replicates.

**Seeds:** root `S2.1-E03`, 100 replicates per cell. **Semantic fingerprint:** `daf6403cfb3226c50eae27acc29fdb5b884105dd0517d9dd9a0cf331a458a962` (manifest SHA-256 `0def5e9ce79cdefbc7fd3cd4570caa1ad224a42a21ea3b09450452a9a8bccb73`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z2|squad-1 | 34 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z2|squad-2 | 12 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z2|squad-3 | 0 | miss |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z3|squad-1 | 8 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z3|squad-2 | 6 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z3|squad-3 | 52 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-1 | 10 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-2 | 0 | miss |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-3 | 0 | miss |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z3|squad-1 | 20 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z3|squad-2 | 30 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z3|squad-3 | 20 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z2|squad-1 | 12 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z2|squad-2 | 24 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z2|squad-3 | 0 | miss |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z3|squad-1 | 6 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z3|squad-2 | 6 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z3|squad-3 | 8 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-1 | 20 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-2 | 0 | miss |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-3 | 0 | miss |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z3|squad-1 | 8 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z3|squad-2 | 44 | pass |
| H-S2.1-03 | The cell generates knockouts (threshold fixed before running) | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z3|squad-3 | 32 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z2|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z3|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z3|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z3|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z3|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z3|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor (I1-I9) finds no violation | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z3|squad-3 | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | memberKnockoutsPerHour | deathsPerHour | killsPerHour | legionExpPerHour | heroDamageShare | invariantViolations |
|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z2|squad-1 | model-output (diagnostic) | 32 / 34 / 34 | 0 / 0 / 0 | 588 / 592 / 596 | 10840 / 10940 / 11040 | 0.55 / 0.56 / 0.56 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|squad-2 | model-output (diagnostic) | 12 / 12 / 12 | 0 / 0 / 0 | 1140 / 1146 / 1152 | 33480 / 33660 / 33880 | 0.27 / 0.27 / 0.27 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|squad-3 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 1446 / 1452 / 1460 | 57840 / 58080 / 58400 | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|squad-1 | model-output (diagnostic) | 6 / 8 / 12 | 6 / 6 / 6 | 12 / 18 / 30 | 528 / 748 / 1188 | 0.58 / 0.59 / 0.59 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|squad-2 | model-output (diagnostic) | 6 / 6 / 6 | 6 / 6 / 6 | 36 / 36 / 38 | 2112 / 2112 / 2200 | 0.29 / 0.29 / 0.30 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|squad-3 | model-output (diagnostic) | 50 / 52 / 54 | 2 / 6 / 10 | 572 / 578 / 584 | 46640 / 47212 / 47916 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-1 | model-output (diagnostic) | 10 / 10 / 12 | 0 / 0 / 0 | 1122 / 1134 / 1144 | 21860 / 22220 / 22420 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-2 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 1722 / 1722 / 1722 | 51660 / 51660 / 51660 | 0.30 / 0.30 / 0.30 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-3 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 1948 / 1966 / 1980 | 77920 / 78640 / 79200 | 0.20 / 0.20 / 0.21 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|squad-1 | model-output (diagnostic) | 8 / 20 / 40 | 6 / 8 / 12 | 80 / 204 / 414 | 3168 / 8008 / 16192 | 0.64 / 0.65 / 0.66 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|squad-2 | model-output (diagnostic) | 28 / 30 / 30 | 0 / 0 / 0 | 824 / 828 / 830 | 51524 / 51876 / 52228 | 0.31 / 0.31 / 0.31 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|squad-3 | model-output (diagnostic) | 20 / 20 / 20 | 0 / 0 / 0 | 1072 / 1078 / 1082 | 91740 / 92268 / 92752 | 0.22 / 0.22 / 0.22 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z2|squad-1 | model-output (diagnostic) | 8 / 12 / 36 | 6 / 6 / 12 | 72 / 112 / 352 | 1280 / 1960 / 6120 | 0.60 / 0.61 / 0.62 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z2|squad-2 | model-output (diagnostic) | 24 / 24 / 24 | 0 / 0 / 0 | 1100 / 1104 / 1108 | 31740 / 31880 / 32040 | 0.27 / 0.27 / 0.28 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z2|squad-3 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 1446 / 1452 / 1460 | 57840 / 58080 / 58400 | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z3|squad-1 | model-output (diagnostic) | 6 / 6 / 6 | 6 / 6 / 6 | 6 / 6 / 6 | 264 / 264 / 264 | 0.59 / 0.60 / 0.61 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z3|squad-2 | model-output (diagnostic) | 6 / 6 / 10 | 6 / 6 / 6 | 18 / 18 / 34 | 1056 / 1056 / 1936 | 0.28 / 0.29 / 0.30 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z3|squad-3 | model-output (diagnostic) | 6 / 8 / 14 | 6 / 6 / 6 | 36 / 48 / 82 | 2904 / 3872 / 6600 | 0.18 / 0.19 / 0.19 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-1 | model-output (diagnostic) | 20 / 20 / 22 | 0 / 0 / 0 | 1082 / 1092 / 1098 | 20660 / 20940 / 21100 | 0.59 / 0.59 / 0.60 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-2 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 1722 / 1722 / 1722 | 51660 / 51660 / 51660 | 0.30 / 0.30 / 0.30 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-3 | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 1948 / 1966 / 1980 | 77920 / 78640 / 79200 | 0.20 / 0.20 / 0.21 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z3|squad-1 | model-output (diagnostic) | 6 / 8 / 10 | 6 / 6 / 6 | 30 / 42 / 54 | 1188 / 1628 / 2068 | 0.64 / 0.65 / 0.65 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z3|squad-2 | model-output (diagnostic) | 42 / 44 / 44 | 0 / 0 / 0 | 736 / 742 / 746 | 44660 / 44968 / 45408 | 0.32 / 0.32 / 0.32 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z3|squad-3 | model-output (diagnostic) | 32 / 32 / 34 | 0 / 0 / 0 | 1022 / 1034 / 1042 | 86064 / 86988 / 88000 | 0.22 / 0.22 / 0.22 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

2400 runs, 30012020 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z2|squad-1 | 1 | 691.0 | approximate | 592 | 16.7% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z2|squad-2 | 2 | 1044.0 | approximate | 1145.5 | -8.9% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z2|squad-3 | 3 | 1254.5 | approximate | 1452.6 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z3|squad-1 | 1 | 288.1 | approximate | 19.6 | 1369.9% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z3|squad-2 | 2 | 488.9 | approximate | 37.7 | 1195.4% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z3|squad-3 | 3 | 636.5 | approximate | 566.9 | 12.3% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-1 | 1 | 1160.5 | approximate | 1133.6 | 2.4% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-2 | 2 | 1521.5 | approximate | 1722.0 | -11.6% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-3 | 3 | 1699.4 | approximate | 1965.1 | -13.5% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z3|squad-1 | 1 | 538.6 | approximate | 224.9 | 139.5% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z3|squad-2 | 2 | 824.5 | approximate | 827.5 | -0.4% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z3|squad-3 | 3 | 1001.1 | approximate | 1077.3 | -7.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z2|squad-1 | 1 | 691.0 | approximate | 169.2 | 308.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z2|squad-2 | 2 | 1044.0 | approximate | 1103.6 | -5.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z2|squad-3 | 3 | 1254.5 | approximate | 1452.6 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z3|squad-1 | 1 | 288.1 | approximate | 6 | 4701.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z3|squad-2 | 2 | 488.9 | approximate | 23.3 | 1996.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z3|squad-3 | 3 | 636.5 | approximate | 57.5 | 1006.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-1 | 1 | 1160.5 | approximate | 1090.9 | 6.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-2 | 2 | 1521.5 | approximate | 1722.0 | -11.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-3 | 3 | 1699.4 | approximate | 1965.1 | -13.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z3|squad-1 | 1 | 538.6 | approximate | 39.7 | 1256.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z3|squad-2 | 2 | 824.5 | approximate | 741.6 | 11.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z3|squad-3 | 3 | 1001.1 | approximate | 1032.4 | -3.0% | not reached | not reached | — |

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. No content, coefficient, target or policy parameter changed in S2.1.
- Engine: S2 with the S2.1 corrections (worker access requires a visited zone; ability-aware worker classification; exact ledger reconstruction; reserve swaps outside encounters; monitor I9).
- The hero starts in, and farms, the cell zone, so the zone is visited; workers work in that zone.
- The diagnostic is informative if at least 12 of the 24 cells pass H-S2.1-03 (analysis C7). The hero is classless at level 1 because a class needs level 5.

