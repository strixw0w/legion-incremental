# S3.1-E05-investment

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** With identical starts and seeds, how do pure combat, POL3-BAL, POL3-PROF and POL3-DEMAND compare at 15, 30, 60 and 90 active minutes on combat EXP, gold, conquest, professions, equipment, materials, equipment value and production?

**Design.** Fresh account and the S3 matched mid-game start (labelled diagnostic), 90 min with snapshots at 15, 30 and 60 min. 100 replicates.

**Seeds:** root `s3.1-e05`, 100 replicates per cell. **Semantic fingerprint:** `d66c82532e47727388945167ce9c587645e7849654038762ee4abc6c01971ffc` (manifest SHA-256 `ce8eec54d97d6aa92e218b4b683bb00cee66966ea2cfb48fb895099d05cb51a9`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-PROF | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-PROF | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-DEMAND | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-PROF | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-PROF | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-DEMAND | 1 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | heroExpAt15 | legionExpAt15 | legionExpAt30 | legionExpAt60 | legionExpTotal | expTotal | goldHeld | goldEarned | conquestScore | equipmentValue | itemsEquipped | materialsHeld | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| fresh|POL3-CONQ | model-output (realistic) | 5516 / 5560 / 5604 | 19404 / 19580 / 19756 | 69036 / 69388 / 69740 | 174636 / 174988 / 175340 | 280236 / 280588 / 280940 | 70724 / 70812 / 70900 | 18762 / 18786 / 18810 | 19312 / 19336 / 19360 | 3001003362 / 3001003366 / 3001003370 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| midgame|POL3-CONQ | model-output (realistic) | 8460 / 8570 / 8658 | 32640 / 33080 / 33432 | 85440 / 85880 / 86232 | 191040 / 191480 / 191832 | 296640 / 297080 / 297432 | 74460 / 74570 / 74658 | 20540 / 20570 / 20594 | 20940 / 20970 / 20994 | 3001003450 / 3001003455 / 3001003459 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| fresh|POL3-BAL | model-output (realistic) | 3602 / 3646 / 3690 | 6912 / 7000 / 7088 | 22488 / 22664 / 22796 | 59140 / 59360 / 59624 | 97376 / 97772 / 98168 | 48834 / 49032 / 49230 | 12592 / 12646 / 12700 | 13342 / 13396 / 13450 | 3001002367 / 3001002376 / 3001002385 | 0.33 / 0.33 / 0.33 | 6 / 6 / 6 | 3932 / 3937 / 3943 | 0 / 0 / 0 |
| midgame|POL3-BAL | model-output (realistic) | 4478 / 4500 / 4544 | 8758 / 8802 / 8890 | 21848 / 22024 / 22156 | 54496 / 54804 / 55068 | 90884 / 91302 / 91676 | 45596 / 45816 / 45992 | 12668 / 12728 / 12776 | 13068 / 13128 / 13176 | 3001002138 / 3001002148 / 3001002156 | 0 / 0 / 0 | 0 / 0 / 0 | 4385 / 4388 / 4388 | 0 / 0 / 0 |
| fresh|POL3-PROF | model-output (realistic) | 2150 / 2200 / 2230 | 2150 / 2200 / 2230 | 6080 / 6124 / 6190 | 16068 / 16156 / 16266 | 27596 / 27772 / 27904 | 27596 / 27772 / 27904 | 7017 / 7065 / 7101 | 7567 / 7615 / 7651 | 3001001436 / 3001001444 / 3001001450 | 0.16 / 0.18 / 0.18 | 5 / 5 / 5 | 8323 / 8335 / 8343 | 0 / 0 / 0 |
| midgame|POL3-PROF | model-output (realistic) | 2700 / 2720 / 2750 | 2700 / 2720 / 2750 | 5984 / 6028 / 6116 | 14520 / 14608 / 14674 | 24596 / 24684 / 24794 | 24596 / 24684 / 24794 | 6998 / 7022 / 7052 | 7398 / 7422 / 7452 | 3001001298 / 3001001302 / 3001001307 | 0 / 0 / 0 | 3 / 3 / 3 | 7579 / 7583 / 7587 | 0 / 0 / 0 |
| fresh|POL3-DEMAND | model-output (realistic) | 2568 / 2638 / 2700 | 3912 / 4180 / 4392 | 33534 / 47544 / 48820 | 112968 / 153144 / 154420 | 192168 / 258744 / 260020 | 64860 / 66808 / 67094 | 17166 / 17694 / 17772 | 17716 / 18244 / 18322 | 3001003102 / 3001003185 / 3001003198 | 0.44 / 0.59 / 0.59 | 25 / 25 / 25 | 1 / 7 / 3292 | 0 / 0 / 0 |
| midgame|POL3-DEMAND | model-output (realistic) | 3532 / 3950 / 4258 | 7482 / 8624 / 9380 | 29148 / 33254 / 38438 | 134748 / 138854 / 144038 | 240348 / 244454 / 249638 | 61762 / 62922 / 64218 | 17071 / 17388 / 17743 | 17471 / 17788 / 18143 | 3001002917 / 3001002972 / 3001003031 | 0.57 / 0.57 / 0.59 | 25 / 25 / 25 | 1 / 8 / 29 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

800 runs, 190514195 checks, **0 violations**.

## Notes and limitations

- Large unspent inventories are not counted as progress; combat EXP is not the only measure (owner S3.1 section 10).

