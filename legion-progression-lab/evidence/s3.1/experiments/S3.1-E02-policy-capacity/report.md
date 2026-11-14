# S3.1-E02-policy-capacity

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** On the original content, how do the fixed-role S3 strategies and the demand-aware POL3-DEMAND compare in progression, gathering and smithing capacity, utilisation, realised demand, stockpiles, excess and shortage, and when do the first-craft milestones arrive? Does the affinity matter (no-affinity control)?

**Design.** Campaigns at PR-NEW (45 min), PR-BAL (60) and PR-OPT (90) for the six S3 strategies and POL3-DEMAND; POL3-DEMAND and POL3-BAL also with the affinity at 0 (PR-BAL). 100 replicates.

**Seeds:** root `s3.1-e02`, 100 replicates per cell. **Semantic fingerprint:** `f2796fea03c7d718ea7aed15468c32f4401ee8a026616e59d9ae3b010607c8a2` (manifest SHA-256 `19eb64fad29c0ea00a51396b6a81349fe86005a225157ad2b83489db62ac5b11`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-NEW|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-NEW|POL3-COMBAT | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-NEW|POL3-EQUIP | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-NEW|POL3-PROF | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-NEW|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-NEW|POL3-EARLY | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-NEW|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-COMBAT | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-EQUIP | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-PROF | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-EARLY | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-OPT|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-OPT|POL3-COMBAT | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-OPT|POL3-EQUIP | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-OPT|POL3-PROF | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-OPT|POL3-BAL | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-OPT|POL3-EARLY | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-OPT|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-DEMAND|no-affinity | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | PR-BAL|POL3-BAL|no-affinity | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-NEW|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-NEW|POL3-COMBAT | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-NEW|POL3-EQUIP | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-NEW|POL3-PROF | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-NEW|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-NEW|POL3-EARLY | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-NEW|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-COMBAT | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-EQUIP | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-PROF | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-EARLY | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-OPT|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-OPT|POL3-COMBAT | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-OPT|POL3-EQUIP | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-OPT|POL3-PROF | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-OPT|POL3-BAL | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-OPT|POL3-EARLY | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-OPT|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-DEMAND|no-affinity | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | PR-BAL|POL3-BAL|no-affinity | 1 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-NEW|POL3-COMBAT | 9.483 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-NEW|POL3-EQUIP | 2.555 | miss |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-NEW|POL3-PROF | 6.285 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-NEW|POL3-BAL | 10.803 | miss |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-NEW|POL3-EARLY | 5.742 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-NEW|POL3-DEMAND | 6.360 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-COMBAT | 9.483 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-EQUIP | 2.555 | miss |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-PROF | 6.285 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-BAL | 10.803 | miss |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-EARLY | 5.742 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-DEMAND | 6.360 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-OPT|POL3-COMBAT | 9.483 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-OPT|POL3-EQUIP | 2.555 | miss |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-OPT|POL3-PROF | 6.285 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-OPT|POL3-BAL | 10.803 | miss |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-OPT|POL3-EARLY | 5.742 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-OPT|POL3-DEMAND | 6.360 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-DEMAND|no-affinity | 6.360 | pass |
| H-S3.1-01 | First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8) | target | p50 in [5, 10] active min | PR-BAL|POL3-BAL|no-affinity | 10.805 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-NEW|POL3-COMBAT | 9.483 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-NEW|POL3-EQUIP | 2.555 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-NEW|POL3-PROF | 6.471 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-NEW|POL3-BAL | 10.803 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-NEW|POL3-EARLY | 5.742 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-NEW|POL3-DEMAND | 6.562 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-COMBAT | 9.483 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-EQUIP | 2.555 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-PROF | 6.471 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-BAL | 10.803 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-EARLY | 5.742 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-DEMAND | 6.562 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-OPT|POL3-COMBAT | 9.483 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-OPT|POL3-EQUIP | 2.555 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-OPT|POL3-PROF | 6.471 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-OPT|POL3-BAL | 10.803 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-OPT|POL3-EARLY | 5.742 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-OPT|POL3-DEMAND | 6.562 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-DEMAND|no-affinity | 6.562 | miss |
| H-S3.1-02 | First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target) | target | p50 in [15, 25] active min | PR-BAL|POL3-BAL|no-affinity | 10.805 | miss |

## Cells (p10 / p50 / p90)

| Cell | Tag | firstCraftAnyMin | firstMeaningfulUpgradeMin | firstCopperCombatEquippedMin | expTotal | legionExpTotal | gatherUtilisation | smithUtilisation | excessGatheredUnits | reassignableGatherMin | smithIdleNoDemandMin | smithIdleInputShortageMin | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PR-NEW|POL3-CONQ | model-output (realistic) | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 31102 / 31212 / 31300 | 121748 / 122188 / 122540 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-NEW|POL3-COMBAT | model-output (realistic) | 9.41 / 9.48 / 9.56 | 9.41 / 9.48 / 9.56 | 10.88 / 10.96 / 11.05 | 20586 / 20718 / 20806 | 42240 / 42504 / 42680 | 0.85 / 0.87 / 0.89 | 0.04 / 0.04 / 0.04 | 1346 / 1348 / 1353 | 33.70 / 33.75 / 33.85 | 33.68 / 33.75 / 33.83 | 0.63 / 0.64 / 0.68 | 0 / 0 / 0 |
| PR-NEW|POL3-EQUIP | model-output (realistic) | 2.54 / 2.56 / 2.58 | 2.54 / 2.56 / 2.58 | not reached / not reached / not reached | 13662 / 13750 / 13926 | 23386 / 23562 / 23914 | 0.86 / 0.87 / 0.87 | 0.06 / 0.06 / 0.06 | 1449 / 1452 / 1454 | 35.80 / 35.85 / 35.90 | 36.38 / 36.43 / 36.50 | 4.03 / 4.08 / 4.12 | 0 / 0 / 0 |
| PR-NEW|POL3-PROF | model-output (realistic) | 6.21 / 6.29 / 6.35 | 6.40 / 6.47 / 6.53 | 14.93 / 15.04 / 15.30 | 10766 / 10854 / 10942 | 10766 / 10854 / 10942 | 0.85 / 0.85 / 0.85 | 0.03 / 0.03 / 0.03 | 3355 / 3368 / 3375 | 70.79 / 71.03 / 71.15 | 29.53 / 29.80 / 29.90 | 7.78 / 7.87 / 8.15 | 0 / 0 / 0 |
| PR-NEW|POL3-BAL | model-output (realistic) | 10.72 / 10.80 / 10.86 | 10.72 / 10.80 / 10.86 | 12.12 / 12.18 / 12.28 | 20190 / 20300 / 20410 | 40088 / 40308 / 40528 | 0.85 / 0.88 / 0.90 | 0.04 / 0.04 / 0.04 | 1492 / 1497 / 1502 | 31.60 / 31.70 / 31.80 | 31.60 / 31.68 / 31.76 | 6.95 / 7.02 / 7.09 | 0 / 0 / 0 |
| PR-NEW|POL3-EARLY | model-output (realistic) | 5.56 / 5.74 / 5.95 | 5.56 / 5.74 / 5.95 | not reached / not reached / not reached | 6676 / 6696 / 6730 | 13192 / 13232 / 13300 | not reached / not reached / not reached | 0.00 / 0.01 / 0.01 | 0 / 0 / 0 | 0 / 0 / 0 | 0.28 / 0.28 / 0.28 | 38.95 / 39.13 / 39.67 | 0 / 0 / 0 |
| PR-NEW|POL3-DEMAND | model-output (realistic) | 6.28 / 6.36 / 6.42 | 6.47 / 6.56 / 6.62 | 9.71 / 10.23 / 10.60 | 25070 / 27174 / 27494 | 73076 / 100294 / 101592 | 0.83 / 0.88 / 0.90 | 0.45 / 0.47 / 0.48 | 2 / 9 / 1142 | 0.05 / 0.25 / 27.40 | 0.52 / 0.62 / 0.84 | 6.64 / 6.96 / 7.35 | 0 / 0 / 0 |
| PR-BAL|POL3-CONQ | model-output (realistic) | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 44302 / 44412 / 44500 | 174548 / 174988 / 175340 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-BAL|POL3-COMBAT | model-output (realistic) | 9.41 / 9.48 / 9.56 | 9.41 / 9.48 / 9.56 | 10.88 / 10.96 / 11.05 | 29914 / 30046 / 30200 | 60896 / 61160 / 61468 | 0.84 / 0.86 / 0.89 | 0.03 / 0.03 / 0.03 | 2022 / 2024 / 2028 | 48.70 / 48.75 / 48.85 | 48.68 / 48.75 / 48.83 | 0.63 / 0.64 / 0.68 | 0 / 0 / 0 |
| PR-BAL|POL3-EQUIP | model-output (realistic) | 2.54 / 2.56 / 2.58 | 2.54 / 2.56 / 2.58 | not reached / not reached / not reached | 21648 / 21758 / 21956 | 39358 / 39578 / 39974 | 0.86 / 0.87 / 0.87 | 0.04 / 0.04 / 0.04 | 2132 / 2134 / 2136 | 50.80 / 50.85 / 50.90 | 51.38 / 51.43 / 51.50 | 4.03 / 4.08 / 4.12 | 0 / 0 / 0 |
| PR-BAL|POL3-PROF | model-output (realistic) | 6.21 / 6.29 / 6.35 | 6.40 / 6.47 / 6.53 | 14.93 / 15.04 / 15.30 | 16068 / 16156 / 16244 | 16068 / 16156 / 16244 | 0.85 / 0.86 / 0.86 | 0.02 / 0.02 / 0.02 | 4953 / 4968 / 4976 | 100.78 / 101.03 / 101.19 | 44.53 / 44.80 / 44.90 | 7.78 / 7.87 / 8.15 | 0 / 0 / 0 |
| PR-BAL|POL3-BAL | model-output (realistic) | 10.72 / 10.80 / 10.86 | 10.72 / 10.80 / 10.86 | 12.12 / 12.18 / 12.28 | 29672 / 29804 / 29958 | 59052 / 59316 / 59624 | 0.84 / 0.86 / 0.89 | 0.03 / 0.03 / 0.03 | 2276 / 2281 / 2287 | 46.60 / 46.70 / 46.80 | 46.60 / 46.68 / 46.76 | 6.95 / 7.02 / 7.09 | 0 / 0 / 0 |
| PR-BAL|POL3-EARLY | model-output (realistic) | 5.56 / 5.74 / 5.95 | 5.56 / 5.74 / 5.95 | not reached / not reached / not reached | 9076 / 9096 / 9130 | 17992 / 18032 / 18100 | not reached / not reached / not reached | 0.00 / 0.00 / 0.00 | 0 / 0 / 0 | 0 / 0 / 0 | 0.28 / 0.28 / 0.28 | 53.95 / 54.13 / 54.67 | 0 / 0 / 0 |
| PR-BAL|POL3-DEMAND | model-output (realistic) | 6.28 / 6.36 / 6.42 | 6.47 / 6.56 / 6.62 | 9.71 / 10.23 / 10.60 | 38270 / 40374 / 40694 | 112676 / 153094 / 154392 | 0.82 / 0.88 / 0.90 | 0.45 / 0.47 / 0.48 | 2 / 9 / 1830 | 0.05 / 0.25 / 42.39 | 0.52 / 0.62 / 0.84 | 6.64 / 6.96 / 7.35 | 0 / 0 / 0 |
| PR-OPT|POL3-CONQ | model-output (realistic) | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 70702 / 70812 / 70900 | 280148 / 280588 / 280940 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-OPT|POL3-COMBAT | model-output (realistic) | 9.41 / 9.48 / 9.56 | 9.41 / 9.48 / 9.56 | 10.88 / 10.96 / 11.05 | 49054 / 49252 / 49472 | 99176 / 99572 / 100012 | 0.83 / 0.85 / 0.89 | 0.02 / 0.02 / 0.02 | 3460 / 3463 / 3468 | 78.70 / 78.75 / 78.85 | 78.68 / 78.75 / 78.83 | 0.63 / 0.64 / 0.68 | 0 / 0 / 0 |
| PR-OPT|POL3-EQUIP | model-output (realistic) | 2.54 / 2.56 / 2.58 | 2.54 / 2.56 / 2.58 | not reached / not reached / not reached | 40062 / 40304 / 40568 | 76186 / 76670 / 77198 | 0.86 / 0.86 / 0.86 | 0.03 / 0.03 / 0.03 | 3579 / 3582 / 3584 | 80.80 / 80.85 / 80.90 | 81.38 / 81.43 / 81.50 | 4.03 / 4.08 / 4.12 | 0 / 0 / 0 |
| PR-OPT|POL3-PROF | model-output (realistic) | 6.21 / 6.29 / 6.35 | 6.40 / 6.47 / 6.53 | 14.93 / 15.04 / 15.30 | 27574 / 27750 / 27882 | 27574 / 27750 / 27882 | 0.86 / 0.86 / 0.87 | 0.01 / 0.01 / 0.01 | 8321 / 8336 / 8344 | 160.78 / 161.07 / 161.18 | 74.53 / 74.80 / 74.90 | 7.78 / 7.87 / 8.15 | 0 / 0 / 0 |
| PR-OPT|POL3-BAL | model-output (realistic) | 10.72 / 10.80 / 10.86 | 10.72 / 10.80 / 10.86 | 12.12 / 12.18 / 12.28 | 48834 / 49010 / 49208 | 97376 / 97728 / 98124 | 0.83 / 0.85 / 0.89 | 0.02 / 0.02 / 0.02 | 3932 / 3937 / 3943 | 76.60 / 76.70 / 76.80 | 76.60 / 76.68 / 76.76 | 6.95 / 7.02 / 7.09 | 0 / 0 / 0 |
| PR-OPT|POL3-EARLY | model-output (realistic) | 5.56 / 5.74 / 5.95 | 5.56 / 5.74 / 5.95 | not reached / not reached / not reached | 13876 / 13896 / 13930 | 27592 / 27632 / 27700 | not reached / not reached / not reached | 0.00 / 0.00 / 0.00 | 0 / 0 / 0 | 0 / 0 / 0 | 0.28 / 0.28 / 0.28 | 83.95 / 84.13 / 84.67 | 0 / 0 / 0 |
| PR-OPT|POL3-DEMAND | model-output (realistic) | 6.28 / 6.36 / 6.42 | 6.47 / 6.56 / 6.62 | 9.71 / 10.23 / 10.60 | 64670 / 66774 / 67094 | 191876 / 258694 / 259992 | 0.80 / 0.88 / 0.90 | 0.45 / 0.47 / 0.48 | 2 / 9 / 3292 | 0.05 / 0.25 / 72.38 | 0.52 / 0.62 / 0.84 | 6.64 / 6.96 / 7.35 | 0 / 0 / 0 |
| PR-BAL|POL3-DEMAND|no-affinity | model-output (realistic) | 6.28 / 6.36 / 6.42 | 6.47 / 6.56 / 6.62 | 9.88 / 10.42 / 10.85 | 37938 / 39896 / 40166 | 141268 / 150134 / 151552 | 0.86 / 0.87 / 0.89 | 0.51 / 0.52 / 0.54 | 2 / 6 / 16 | 0.05 / 0.17 / 0.52 | 0.51 / 0.59 / 0.75 | 6.48 / 6.88 / 7.33 | 0 / 0 / 0 |
| PR-BAL|POL3-BAL|no-affinity | model-output (realistic) | 10.74 / 10.80 / 10.86 | 10.74 / 10.80 / 10.86 | 12.31 / 12.40 / 12.47 | 29650 / 29782 / 29936 | 59008 / 59272 / 59580 | 0.83 / 0.86 / 0.90 | 0.03 / 0.03 / 0.03 | 1917 / 1924 / 1927 | 46.35 / 46.50 / 46.60 | 46.33 / 46.42 / 46.50 | 6.92 / 6.98 / 7.05 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

2300 runs, 432548841 checks, **0 violations**.

## Notes and limitations

- The S3-E08 results and its missed hypothesis are preserved unchanged; these are new candidate metrics and targets, not a retroactive change.
- Capacity and utilisation follow S3.1-R08 to R10.

