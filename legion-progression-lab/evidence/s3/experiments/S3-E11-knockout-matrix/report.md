# S3-E11-knockout-matrix

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Direction F: where do knockouts and deaths appear across squad size, level/zone and enemy damage, with resting allowed and with continuous farming?

**Design.** Matched squads of 0-3 recruits (Warrior, Archer, Mage) at levels 1/5/10 in zones 1/2/3, enemy damage x1/x1.5/x2/x3, the realistic fixed-zone squad policy (rests) and continuous farming, 60 minutes (PR-BAL length), no equipment, 100 replicates. Squad size 0 is the single-hero control.

**Seeds:** root `s3-e11`, 100 replicates per cell. **Semantic fingerprint:** `aef44f828d9ac690c8ced8e2ac20f960b6e30d3af4e52ac862a3b243dc0ee582` (manifest SHA-256 `8ad11362c53baadd2cee46a540a437077093852c5047097bfa9a7b1e683c122e`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L1-Z1|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L5-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg15|L10-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L1-Z1|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L5-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L10-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L1-Z1|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L5-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L10-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-1|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-1|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L1-Z1|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-1|POL2-FIXED | 11 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-1|CONTINUOUS | 11 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L5-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-1|POL2-FIXED | 18 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-1|CONTINUOUS | 18 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-2|POL2-FIXED | 11 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-2|CONTINUOUS | 11 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L10-Z3|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-1|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-1|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L1-Z1|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-1|POL2-FIXED | 15 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-1|CONTINUOUS | 15 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L5-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-1|POL2-FIXED | 26 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-1|CONTINUOUS | 26 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-2|POL2-FIXED | 17 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-2|CONTINUOUS | 17 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg15|L10-Z3|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-1|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-1|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L1-Z1|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-1|POL2-FIXED | 21 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-1|CONTINUOUS | 21 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L5-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-1|POL2-FIXED | 29 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-1|CONTINUOUS | 32 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-2|POL2-FIXED | 20 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-2|CONTINUOUS | 20 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L10-Z3|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-1|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-1|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L1-Z1|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-1|POL2-FIXED | 26 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-1|CONTINUOUS | 27 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L5-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-1|POL2-FIXED | 20 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-1|CONTINUOUS | 42 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-2|POL2-FIXED | 29 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-2|CONTINUOUS | 30 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L10-Z3|squad-3|CONTINUOUS | 0 | miss |

## Cells (p10 / p50 / p90)

| Cell | Tag | memberKnockoutsPerHour | deathsPerHour | recoveryShare | autoFarmStops | killsPerHour | legionExpPerHour | invariantViolations |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z1|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 895 / 902 / 906 | 3580 / 3608 / 3624 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 13 / 13 / 13 | not reached / not reached / not reached | 0 / 0 / 0 | 894 / 898 / 902 | 3576 / 3592 / 3608 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-1|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-1|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 619 / 624 / 627 | 6190 / 6240 / 6270 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 34 / 34 / 35 | not reached / not reached / not reached | 32 / 32 / 33 | 605 / 612 / 615 | 6050 / 6120 / 6150 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 11 / 11 / 12 | 0 / 0 / 0 | 0.06 / 0.06 / 0.07 | 0 / 0 / 0 | 1126 / 1134 / 1138 | 21960 / 22150 / 22250 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 11 / 11 / 12 | 2 / 2 / 2 | 0.06 / 0.06 / 0.06 | 0 / 0 / 0 | 1128 / 1134 / 1139 | 22010 / 22160 / 22270 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 386 / 388 / 389 | 8492 / 8536 / 8558 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 59 / 60 / 60 | not reached / not reached / not reached | 57 / 58 / 58 | 360 / 360 / 361 | 7920 / 7920 / 7942 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 18 / 18 / 18 | 0 / 0 / 0 | 0.09 / 0.10 / 0.10 | 0 / 0 / 0 | 729 / 733 / 737 | 30734 / 30932 / 31174 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 17 / 18 / 18 | 6 / 7 / 7 | 0.08 / 0.09 / 0.09 | 0 / 0 / 0 | 725 / 730 / 736 | 30624 / 30888 / 31152 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 11 / 11 / 11 | 0 / 0 / 0 | 0.03 / 0.03 / 0.03 | 0 / 0 / 0 | 1183 / 1186 / 1191 | 76560 / 76824 / 77154 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 11 / 11 / 11 | 2 / 2 / 2 | 0.03 / 0.03 / 0.03 | 0 / 0 / 0 | 1183 / 1186 / 1190 | 76626 / 76846 / 77198 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 853 / 856 / 863 | 3412 / 3424 / 3452 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 26 / 26 / 26 | not reached / not reached / not reached | 24 / 24 / 24 | 843 / 847 / 850 | 3372 / 3388 / 3400 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-1|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-1|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L1-Z1|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 593 / 598 / 602 | 5930 / 5980 / 6020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 44 / 44 / 45 | not reached / not reached / not reached | 42 / 42 / 43 | 577 / 582 / 585 | 5770 / 5820 / 5850 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 14 / 15 / 15 | 0 / 0 / 0 | 0.08 / 0.08 / 0.08 | 0 / 0 / 0 | 1113 / 1119 / 1127 | 21590 / 21700 / 21900 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 14 / 15 / 15 | 3 / 3 / 4 | 0.07 / 0.08 / 0.08 | 0 / 0 / 0 | 1113 / 1121 / 1127 | 21600 / 21760 / 21900 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L5-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 357 / 359 / 360 | 7854 / 7898 / 7920 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 76 / 76 / 76 | not reached / not reached / not reached | 74 / 74 / 74 | 307 / 308 / 309 | 6754 / 6776 / 6798 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 26 / 26 / 27 | 0 / 0 / 0 | 0.14 / 0.14 / 0.15 | 0 / 0 / 0 | 701 / 706 / 710 | 28908 / 29194 / 29414 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 26 / 26 / 27 | 13 / 13 / 13 | 0.14 / 0.14 / 0.14 | 0 / 0 / 0 | 697 / 701 / 703 | 28930 / 29150 / 29260 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 16 / 17 / 17 | 0 / 0 / 0 | 0.04 / 0.05 / 0.05 | 0 / 0 / 0 | 1171 / 1175 / 1178 | 75020 / 75416 / 75680 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 16 / 17 / 17 | 4 / 4 / 4 | 0.04 / 0.04 / 0.05 | 0 / 0 / 0 | 1169 / 1173 / 1177 | 74998 / 75262 / 75680 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg15|L10-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 853 / 856 / 863 | 3412 / 3424 / 3452 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 26 / 26 / 26 | not reached / not reached / not reached | 24 / 24 / 24 | 843 / 847 / 850 | 3372 / 3388 / 3400 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-1|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-1|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L1-Z1|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 549 / 554 / 558 | 5490 / 5540 / 5580 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 62 / 62 / 63 | not reached / not reached / not reached | 60 / 60 / 61 | 521 / 527 / 532 | 5210 / 5270 / 5320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 21 / 21 / 22 | 0 / 0 / 0 | 0.11 / 0.12 / 0.12 | 0 / 0 / 0 | 1085 / 1091 / 1096 | 20750 / 20880 / 21010 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 21 / 21 / 22 | 7 / 7 / 8 | 0.10 / 0.10 / 0.11 | 0 / 0 / 0 | 1087 / 1094 / 1100 | 20860 / 21020 / 21160 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L5-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 327 / 329 / 330 | 7194 / 7238 / 7260 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 94 / 94 / 95 | not reached / not reached / not reached | 92 / 92 / 93 | 283 / 284 / 285 | 6226 / 6248 / 6270 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 29 / 29 / 29 | 0 / 0 / 0 | 0.16 / 0.16 / 0.16 | 0 / 0 / 0 | 655 / 660 / 663 | 26334 / 26598 / 26774 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 32 / 32 / 33 | 17 / 17 / 19 | 0.13 / 0.14 / 0.14 | 0 / 0 / 2 | 678 / 685 / 691 | 28072 / 28424 / 28732 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 20 / 20 / 20 | 0 / 0 / 0 | 0.06 / 0.06 / 0.06 | 0 / 0 / 0 | 1156 / 1160 / 1165 | 73722 / 73986 / 74382 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 20 / 20 / 20 | 6 / 6 / 6 | 0.05 / 0.05 / 0.05 | 0 / 0 / 0 | 1159 / 1162 / 1165 | 74118 / 74272 / 74492 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L10-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 816 / 819 / 826 | 3264 / 3276 / 3304 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 37 / 37 / 38 | not reached / not reached / not reached | 35 / 35 / 36 | 796 / 804 / 807 | 3184 / 3216 / 3228 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-1|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-1|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1352 | 10784 / 10800 / 10816 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L1-Z1|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 497 / 502 / 506 | 4970 / 5020 / 5060 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 80 / 81 / 82 | not reached / not reached / not reached | 78 / 79 / 80 | 464 / 470 / 476 | 4640 / 4700 / 4760 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 26 / 26 / 27 | 0 / 0 / 0 | 0.14 / 0.14 / 0.15 | 0 / 0 / 0 | 1045 / 1054 / 1064 | 19730 / 19950 / 20180 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 26 / 27 / 27 | 13 / 13 / 13 | 0.13 / 0.14 / 0.14 | 0 / 0 / 0 | 1051 / 1057 / 1063 | 19940 / 20100 / 20280 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L5-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1968 / 1977 | 78280 / 78720 / 79080 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 281 / 282 / 282 | 6182 / 6204 / 6204 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 123 / 123 / 123 | not reached / not reached / not reached | 121 / 121 / 121 | 246 / 246 / 248 | 5412 / 5412 / 5456 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 5 / 20 / 43 | 3 / 6 / 11 | 0.03 / 0.11 / 0.24 | 0 / 1 / 1 | 67 / 287 / 617 | 2706 / 11506 / 24772 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 41 / 42 / 42 | 41 / 42 / 42 | 0.23 / 0.23 / 0.23 | 39 / 40 / 40 | 590 / 595 / 600 | 23650 / 23826 / 24112 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 29 / 29 / 30 | 0 / 0 / 0 | 0.08 / 0.08 / 0.08 | 0 / 0 / 0 | 1116 / 1123 / 1129 | 69982 / 70488 / 70928 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 29 / 30 / 30 | 14 / 14 / 15 | 0.07 / 0.08 / 0.08 | 0 / 0 / 0 | 1113 / 1120 / 1124 | 69960 / 70378 / 70774 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L10-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1509 / 1517 / 1525 | 132792 / 133496 / 134200 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

9600 runs, 386161417 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z1|squad-0|POL2-FIXED | 0 | 897.7 | reliable | 900.9 | -0.4% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-0|CONTINUOUS | 0 | 897.7 | reliable | 898.1 | -0.0% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-1|POL2-FIXED | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-1|CONTINUOUS | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-2|POL2-FIXED | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-2|CONTINUOUS | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-3|POL2-FIXED | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-3|CONTINUOUS | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-0|POL2-FIXED | 0 | 611.8 | approximate | 623.2 | -1.8% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-0|CONTINUOUS | 0 | 611.8 | approximate | 611.5 | 0.0% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-1|POL2-FIXED | 1 | 1160.5 | approximate | 1133.3 | 2.4% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-1|CONTINUOUS | 1 | 1160.5 | approximate | 1133.5 | 2.4% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-2|POL2-FIXED | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-2|CONTINUOUS | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-3|POL2-FIXED | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-3|CONTINUOUS | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-0|POL2-FIXED | 0 | 360.8 | unsafe | 387.5 | -6.9% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-0|CONTINUOUS | 0 | 360.8 | unsafe | 360.2 | 0.2% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-1|POL2-FIXED | 1 | 779.5 | approximate | 732.8 | 6.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-1|CONTINUOUS | 1 | 779.5 | approximate | 730.4 | 6.7% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-2|POL2-FIXED | 2 | 1138.5 | approximate | 1186.5 | -4.0% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-2|CONTINUOUS | 2 | 1138.5 | approximate | 1186.4 | -4.0% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-3|POL2-FIXED | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-3|CONTINUOUS | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-0|POL2-FIXED | 0 | 848.1 | reliable | 857.2 | -1.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-0|CONTINUOUS | 0 | 848.1 | reliable | 847.2 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-1|POL2-FIXED | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-1|CONTINUOUS | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-2|POL2-FIXED | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-2|CONTINUOUS | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-3|POL2-FIXED | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L1-Z1|squad-3|CONTINUOUS | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-0|POL2-FIXED | 0 | 581.6 | unsafe | 598.0 | -2.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-0|CONTINUOUS | 0 | 581.6 | unsafe | 581.3 | 0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-1|POL2-FIXED | 1 | 1160.5 | approximate | 1119.7 | 3.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-1|CONTINUOUS | 1 | 1160.5 | approximate | 1120.6 | 3.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-2|POL2-FIXED | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-2|CONTINUOUS | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-3|POL2-FIXED | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L5-Z2|squad-3|CONTINUOUS | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-0|POL2-FIXED | 0 | 307.6 | unsafe | 358.8 | -14.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-0|CONTINUOUS | 0 | 307.6 | unsafe | 307.8 | -0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-1|POL2-FIXED | 1 | 779.5 | approximate | 705.4 | 10.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-1|CONTINUOUS | 1 | 779.5 | approximate | 700.4 | 11.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-2|POL2-FIXED | 2 | 1138.5 | approximate | 1174.9 | -3.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-2|CONTINUOUS | 2 | 1138.5 | approximate | 1173.2 | -3.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-3|POL2-FIXED | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg15|L10-Z3|squad-3|CONTINUOUS | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-0|POL2-FIXED | 0 | 848.1 | reliable | 857.2 | -1.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-0|CONTINUOUS | 0 | 848.1 | reliable | 847.2 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-1|POL2-FIXED | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-1|CONTINUOUS | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-2|POL2-FIXED | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-2|CONTINUOUS | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-3|POL2-FIXED | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L1-Z1|squad-3|CONTINUOUS | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-0|POL2-FIXED | 0 | 527.1 | unsafe | 553.6 | -4.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-0|CONTINUOUS | 0 | 527.1 | unsafe | 526.6 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-1|POL2-FIXED | 1 | 1160.5 | approximate | 1090.6 | 6.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-1|CONTINUOUS | 1 | 1160.5 | approximate | 1093.6 | 6.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-2|POL2-FIXED | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-2|CONTINUOUS | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-3|POL2-FIXED | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L5-Z2|squad-3|CONTINUOUS | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-0|POL2-FIXED | 0 | 284.0 | unsafe | 328.6 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-0|CONTINUOUS | 0 | 284.0 | unsafe | 283.9 | 0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-1|POL2-FIXED | 1 | 779.5 | approximate | 659.3 | 18.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-1|CONTINUOUS | 1 | 779.5 | approximate | 685.3 | 13.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-2|POL2-FIXED | 2 | 1138.5 | approximate | 1160.6 | -1.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-2|CONTINUOUS | 2 | 1138.5 | approximate | 1162.4 | -2.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-3|POL2-FIXED | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L10-Z3|squad-3|CONTINUOUS | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-0|POL2-FIXED | 0 | 802.4 | unsafe | 820.0 | -2.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-0|CONTINUOUS | 0 | 802.4 | unsafe | 802.3 | 0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-1|POL2-FIXED | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-1|CONTINUOUS | 1 | 1531.5 | approximate | 1350.0 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-2|POL2-FIXED | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-2|CONTINUOUS | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-3|POL2-FIXED | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L1-Z1|squad-3|CONTINUOUS | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-0|POL2-FIXED | 0 | 470.5 | unsafe | 501.8 | -6.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-0|CONTINUOUS | 0 | 470.5 | unsafe | 470.0 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-1|POL2-FIXED | 1 | 1160.5 | approximate | 1054.7 | 10.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-1|CONTINUOUS | 1 | 1160.5 | approximate | 1056.8 | 9.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-2|POL2-FIXED | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-2|CONTINUOUS | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-3|POL2-FIXED | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L5-Z2|squad-3|CONTINUOUS | 3 | 1699.4 | approximate | 1967.9 | -13.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-0|POL2-FIXED | 0 | 247.0 | unsafe | 281.6 | -12.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-0|CONTINUOUS | 0 | 247.0 | unsafe | 246.6 | 0.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-1|POL2-FIXED | 1 | 779.5 | approximate | 330.4 | 135.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-1|CONTINUOUS | 1 | 779.5 | approximate | 594.8 | 31.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-2|POL2-FIXED | 2 | 1138.5 | approximate | 1122.9 | 1.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-2|CONTINUOUS | 2 | 1138.5 | approximate | 1119.0 | 1.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-3|POL2-FIXED | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L10-Z3|squad-3|CONTINUOUS | 3 | 1321.1 | approximate | 1516.9 | -12.9% | not reached | not reached | — |

## Notes and limitations

- The matrix is informative only if at least 50% of the cells with recruits generate knockouts (registered rule, PREREGISTRATION.md section 4); otherwise its range is widened by a registered amendment before any conclusion.
- Thresholds of interest (reported, not targets): knockouts per hour 1, 5, 20; recovery share >= 10%; hero deaths per hour >= 1; auto-farm stops >= 1.

