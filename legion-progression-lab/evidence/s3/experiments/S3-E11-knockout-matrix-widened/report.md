# S3-E11-knockout-matrix-widened

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Amendment 01 (direction F): with an under-levelled ladder and higher enemy damage, do enough cells generate knockouts for the matrix to be informative, and where?

**Design.** As S3-E11 (squads 0-3, fixed-zone policy with rests and continuous farming, 60 min, no equipment, 100 replicates), adding levels 3/7 in zones 2/3 at enemy damage x1/x2/x3/x4/x6 and the original ladder at x4/x6.

**Seeds:** root `s3-e11a`, 100 replicates per cell. **Semantic fingerprint:** `48197a0f1eb5d70ee521ce978abd36553d17c1a470d5e5728f42c484e65802d3` (manifest SHA-256 `0cbba1acf039fa62dde7024c4c04cc0cc8c72b1f67496890b784161df94bd89b`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L3-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100|L7-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L3-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|L7-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L3-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg3|L7-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L3-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L7-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L3-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L7-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L1-Z1|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L5-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg4|L10-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L1-Z1|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L5-Z2|squad-3|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-0|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-0|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-1|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-1|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-2|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-2|CONTINUOUS | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-3|POL2-FIXED | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | a10-p1.6-g100-dmg6|L10-Z3|squad-3|CONTINUOUS | 0 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-1|POL2-FIXED | 19 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-1|CONTINUOUS | 19 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L3-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-1|POL2-FIXED | 30 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-1|CONTINUOUS | 31 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-2|POL2-FIXED | 18 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-2|CONTINUOUS | 19 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-3|POL2-FIXED | 8 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100|L7-Z3|squad-3|CONTINUOUS | 8 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-1|POL2-FIXED | 31 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-1|CONTINUOUS | 35 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L3-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-1|POL2-FIXED | 4 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-1|CONTINUOUS | 50 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-2|POL2-FIXED | 35 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-2|CONTINUOUS | 35 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-3|POL2-FIXED | 17 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg2|L7-Z3|squad-3|CONTINUOUS | 17 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-1|POL2-FIXED | 43 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-1|CONTINUOUS | 41 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L3-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-1|POL2-FIXED | 4 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-1|CONTINUOUS | 66 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-2|POL2-FIXED | 43 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-2|CONTINUOUS | 45 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-3|POL2-FIXED | 22 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg3|L7-Z3|squad-3|CONTINUOUS | 22 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-1|POL2-FIXED | 4 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-1|CONTINUOUS | 48 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L3-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-1|POL2-FIXED | 3 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-1|CONTINUOUS | 81 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-2|POL2-FIXED | 53 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-2|CONTINUOUS | 49 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-3|POL2-FIXED | 28 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L7-Z3|squad-3|CONTINUOUS | 29 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-1|POL2-FIXED | 64 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-1|CONTINUOUS | 66 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L3-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-1|POL2-FIXED | 3 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-1|CONTINUOUS | 105 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-2|POL2-FIXED | 14 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-2|CONTINUOUS | 68 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-3|POL2-FIXED | 37 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L7-Z3|squad-3|CONTINUOUS | 36 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-1|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-1|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L1-Z1|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-1|POL2-FIXED | 32 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-1|CONTINUOUS | 34 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L5-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-1|POL2-FIXED | 5 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-1|CONTINUOUS | 52 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-2|POL2-FIXED | 36 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-2|CONTINUOUS | 38 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg4|L10-Z3|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-1|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-1|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L1-Z1|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-1|POL2-FIXED | 17 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-1|CONTINUOUS | 44 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-2|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-2|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L5-Z2|squad-3|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-0|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-0|CONTINUOUS | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-1|POL2-FIXED | 6 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-1|CONTINUOUS | 72 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-2|POL2-FIXED | 48 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-2|CONTINUOUS | 48 | pass |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-3|POL2-FIXED | 0 | miss |
| H-S3-05 | The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1 | diagnostic | p50 >= 1 knockouts per hour | a10-p1.6-g100-dmg6|L10-Z3|squad-3|CONTINUOUS | 0 | miss |

## Cells (p10 / p50 / p90)

| Cell | Tag | memberKnockoutsPerHour | deathsPerHour | recoveryShare | autoFarmStops | killsPerHour | legionExpPerHour | invariantViolations |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L3-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 394 / 395 / 396 | 3940 / 3950 / 3960 | 0 / 0 / 0 |
| a10-p1.6-g100|L3-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 46 / 46 / 47 | not reached / not reached / not reached | 44 / 44 / 45 | 376 / 377 / 378 | 3760 / 3770 / 3780 | 0 / 0 / 0 |
| a10-p1.6-g100|L3-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 19 / 19 / 19 | 0 / 0 / 0 | 0.11 / 0.11 / 0.11 | 0 / 0 / 0 | 832 / 833 / 834 | 15880 / 15900 / 15920 | 0 / 0 / 0 |
| a10-p1.6-g100|L3-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 19 / 19 / 19 | 6 / 6 / 6 | 0.10 / 0.10 / 0.11 | 0 / 0 / 0 | 840 / 840 / 841 | 16150 / 16160 / 16180 | 0 / 0 / 0 |
| a10-p1.6-g100|L3-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100|L3-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100|L3-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100|L3-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 264 / 266 / 267 | 5808 / 5852 / 5874 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 78 / 79 / 79 | not reached / not reached / not reached | 76 / 77 / 77 | 237 / 237 / 238 | 5214 / 5214 / 5236 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 30 / 30 / 31 | 0 / 0 / 0 | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 | 537 / 541 / 546 | 21824 / 22066 / 22286 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 31 / 31 / 31 | 15 / 15 / 15 | 0.16 / 0.16 / 0.16 | 0 / 0 / 0 | 540 / 543 / 545 | 22198 / 22308 / 22440 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 18 / 18 / 19 | 0 / 0 / 0 | 0.05 / 0.05 / 0.05 | 0 / 0 / 0 | 947 / 952 / 957 | 60522 / 60940 / 61292 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 18 / 19 / 19 | 5 / 5 / 5 | 0.05 / 0.05 / 0.05 | 0 / 0 / 0 | 946 / 952 / 957 | 60566 / 60962 / 61380 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 8 / 8 / 8 | 0 / 0 / 0 | 0.01 / 0.01 / 0.01 | 0 / 0 / 0 | 1266 / 1271 / 1275 | 110286 / 110660 / 111012 | 0 / 0 / 0 |
| a10-p1.6-g100|L7-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 8 / 8 / 8 | 1 / 1 / 1 | 0.01 / 0.01 / 0.01 | 0 / 0 / 0 | 1268 / 1272 / 1276 | 110418 / 110726 / 111100 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 333 / 334 / 335 | 3330 / 3340 / 3350 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 80 / 80 / 80 | not reached / not reached / not reached | 78 / 78 / 78 | 320 / 320 / 320 | 3200 / 3200 / 3200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 31 / 31 / 32 | 0 / 0 / 0 | 0.17 / 0.17 / 0.18 | 0 / 0 / 0 | 746 / 747 / 751 | 13680 / 13700 / 13780 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 35 / 35 / 35 | 17 / 17 / 17 | 0.16 / 0.16 / 0.16 | 0 / 0 / 0 | 786 / 787 / 788 | 14820 / 14850 / 14870 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L3-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 3 / 3 / 3 | not reached / not reached / not reached | 1 / 1 / 1 | 3 / 3 / 4 | 66 / 66 / 88 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 123 / 123 / 123 | not reached / not reached / not reached | 121 / 121 / 121 | 129 / 133 / 136 | 2838 / 2926 / 2992 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 3 / 4 / 7 | 3 / 3 / 4 | 0.02 / 0.02 / 0.04 | 1 / 1 / 1 | 24 / 34 / 61 | 924 / 1320 / 2376 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 49 / 50 / 50 | 49 / 49 / 49 | 0.27 / 0.27 / 0.28 | 47 / 47 / 47 | 424 / 428 / 432 | 16434 / 16610 / 16764 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 34 / 35 / 36 | 0 / 0 / 0 | 0.09 / 0.10 / 0.10 | 0 / 0 / 0 | 896 / 901 / 906 | 55704 / 56122 / 56474 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 35 / 35 / 36 | 17 / 17 / 18 | 0.09 / 0.09 / 0.09 | 0 / 0 / 0 | 888 / 893 / 897 | 55506 / 55858 / 56122 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 16 / 17 / 17 | 0 / 0 / 0 | 0.03 / 0.03 / 0.03 | 0 / 0 / 0 | 1244 / 1248 / 1253 | 107096 / 107492 / 107932 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|L7-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 16 / 17 / 17 | 4 / 5 / 5 | 0.03 / 0.03 / 0.03 | 0 / 0 / 0 | 1242 / 1246 / 1252 | 107008 / 107404 / 107910 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 289 / 290 / 291 | 2890 / 2900 / 2910 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 107 / 107 / 107 | not reached / not reached / not reached | 105 / 105 / 105 | 219 / 221 / 224 | 2190 / 2210 / 2240 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 43 / 43 / 44 | 0 / 0 / 0 | 0.24 / 0.24 / 0.24 | 0 / 0 / 0 | 712 / 714 / 716 | 12920 / 12980 / 13030 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 40 / 41 / 41 | 39 / 40 / 40 | 0.22 / 0.22 / 0.22 | 37 / 38 / 38 | 664 / 667 / 673 | 12060 / 12140 / 12250 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L3-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 1 | not reached / not reached / not reached | 0 / 0 / 0 | 174 / 175 / 176 | 3828 / 3850 / 3872 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 147 / 147 / 148 | not reached / not reached / not reached | 145 / 145 / 146 | 147 / 147 / 148 | 3234 / 3234 / 3256 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 3 / 4 / 6 | 3 / 3 / 3 | 0.01 / 0.02 / 0.03 | 1 / 1 / 1 | 18 / 24 / 37 | 726 / 946 / 1408 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 66 / 66 / 66 | 65 / 66 / 66 | 0.31 / 0.32 / 0.32 | 63 / 64 / 64 | 402 / 405 / 409 | 15510 / 15642 / 15796 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 42 / 43 / 43 | 0 / 0 / 0 | 0.12 / 0.12 / 0.12 | 0 / 0 / 0 | 831 / 835 / 841 | 50820 / 51150 / 51568 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 44 / 45 / 46 | 29 / 30 / 32 | 0.10 / 0.10 / 0.11 | 22 / 26 / 29 | 827 / 837 / 848 | 51062 / 51788 / 52558 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 21 / 22 / 23 | 0 / 0 / 0 | 0.04 / 0.04 / 0.04 | 0 / 0 / 0 | 1214 / 1219 / 1224 | 103818 / 104280 / 104852 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg3|L7-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 22 / 22 / 23 | 9 / 10 / 11 | 0.04 / 0.04 / 0.04 | 0 / 0 / 0 | 1215 / 1221 / 1226 | 104016 / 104588 / 105116 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 267 / 268 / 268 | 2670 / 2680 / 2680 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 120 / 120 / 120 | not reached / not reached / not reached | 118 / 118 / 118 | 241 / 241 / 242 | 2410 / 2410 / 2420 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 3 / 4 / 6 | 3 / 3 / 3 | 0.02 / 0.02 / 0.03 | 1 / 1 / 1 | 40 / 53 / 79 | 740 / 970 / 1430 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 48 / 48 / 48 | 47 / 47 / 48 | 0.26 / 0.27 / 0.27 | 45 / 45 / 46 | 642 / 646 / 650 | 11730 / 11850 / 11930 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L3-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 3 / 3 / 3 | not reached / not reached / not reached | 1 / 1 / 1 | 1 / 3 / 4 | 22 / 66 / 88 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 169 / 169 / 170 | not reached / not reached / not reached | 167 / 167 / 168 | 123 / 131 / 138 | 2706 / 2882 / 3036 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 3 / 3 / 3 | 3 / 3 / 3 | 0.01 / 0.01 / 0.02 | 1 / 1 / 1 | 12 / 13 / 16 | 462 / 506 / 594 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 81 / 81 / 81 | 80 / 81 / 81 | 0.34 / 0.34 / 0.35 | 78 / 79 / 79 | 348 / 353 / 360 | 13266 / 13420 / 13618 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 52 / 53 / 54 | 0 / 0 / 0 | 0.14 / 0.15 / 0.15 | 0 / 0 / 0 | 804 / 808 / 814 | 48928 / 49280 / 49654 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 48 / 49 / 50 | 46 / 47 / 48 | 0.13 / 0.13 / 0.14 | 44 / 45 / 46 | 756 / 762 / 768 | 45738 / 46200 / 46574 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 27 / 28 / 29 | 0 / 0 / 0 | 0.05 / 0.05 / 0.05 | 0 / 0 / 0 | 1176 / 1185 / 1192 | 99880 / 100650 / 101354 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L7-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 28 / 29 / 30 | 13 / 14 / 15 | 0.05 / 0.05 / 0.05 | 0 / 0 / 0 | 1192 / 1197 / 1202 | 101442 / 101926 / 102520 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 2 / 4 / 6 | not reached / not reached / not reached | 0 / 0 / 1 | 108 / 204 / 205 | 1080 / 2040 / 2050 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 149 / 149 / 149 | not reached / not reached / not reached | 147 / 147 / 147 | 149 / 149 / 149 | 1490 / 1490 / 1490 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 63 / 64 / 65 | 0 / 1 / 2 | 0.35 / 0.35 / 0.36 | 0 / 0 / 0 | 581 / 591 / 601 | 10090 / 10310 / 10540 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 66 / 66 / 67 | 66 / 66 / 66 | 0.33 / 0.33 / 0.33 | 64 / 64 / 64 | 587 / 591 / 594 | 10400 / 10500 / 10560 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1424 / 1430 / 1434 | 42720 / 42900 / 43020 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L3-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1756 / 1759 / 1761 | 70240 / 70360 / 70440 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 3 / 3 / 3 | not reached / not reached / not reached | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 202 / 202 / 202 | not reached / not reached / not reached | 200 / 200 / 200 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 3 / 3 / 3 | 3 / 3 / 3 | 0.01 / 0.01 / 0.01 | 1 / 1 / 1 | 9 / 9 / 9 | 330 / 330 / 330 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 104 / 105 / 105 | 104 / 104 / 105 | 0.35 / 0.35 / 0.35 | 102 / 102 / 103 | 315 / 315 / 316 | 11550 / 11550 / 11594 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 5 / 14 / 34 | 3 / 4 / 7 | 0.01 / 0.03 / 0.09 | 1 / 1 / 1 | 48 / 144 / 368 | 2926 / 8668 / 22000 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 68 / 68 / 69 | 67 / 68 / 69 | 0.15 / 0.15 / 0.15 | 65 / 66 / 67 | 691 / 696 / 701 | 41932 / 42196 / 42504 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 36 / 37 / 38 | 0 / 0 / 0 | 0.07 / 0.07 / 0.07 | 0 / 0 / 0 | 1128 / 1135 / 1142 | 95150 / 95810 / 96426 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L7-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 35 / 36 / 37 | 27 / 29 / 31 | 0.06 / 0.06 / 0.06 | 18 / 23 / 27 | 1112 / 1124 / 1135 | 93918 / 95062 / 96118 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 777 / 780 / 786 | 3108 / 3120 / 3144 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 48 / 48 / 49 | not reached / not reached / not reached | 46 / 46 / 47 | 753 / 760 / 764 | 3012 / 3040 / 3056 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-1|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1353 | 10784 / 10800 / 10824 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-1|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1353 | 10784 / 10800 / 10824 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L1-Z1|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 448 / 452 / 457 | 4480 / 4520 / 4570 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 103 / 104 / 105 | not reached / not reached / not reached | 101 / 102 / 103 | 394 / 400 / 406 | 3940 / 4000 / 4060 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 31 / 32 / 33 | 0 / 0 / 0 | 0.17 / 0.18 / 0.18 | 0 / 0 / 0 | 979 / 991 / 1003 | 18080 / 18360 / 18640 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 33 / 34 / 35 | 19 / 21 / 22 | 0.15 / 0.15 / 0.16 | 1 / 4 / 8 | 1004 / 1019 / 1031 | 18880 / 19250 / 19510 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1969 / 1981 | 78280 / 78760 / 79240 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L5-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1969 / 1981 | 78280 / 78760 / 79240 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 3 / 3 / 3 | not reached / not reached / not reached | 1 / 1 / 1 | 3 / 3 / 3 | 66 / 66 / 66 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 143 / 143 / 143 | not reached / not reached / not reached | 141 / 141 / 141 | 143 / 144 / 145 | 3146 / 3168 / 3190 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 3 / 5 / 10 | 3 / 3 / 5 | 0.02 / 0.03 / 0.05 | 1 / 1 / 1 | 32 / 54 / 107 | 1276 / 2156 / 4268 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 52 / 52 / 53 | 52 / 52 / 52 | 0.28 / 0.28 / 0.28 | 50 / 50 / 50 | 551 / 555 / 559 | 21934 / 22132 / 22308 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 36 / 36 / 37 | 0 / 0 / 0 | 0.10 / 0.10 / 0.10 | 0 / 0 / 0 | 1069 / 1079 / 1086 | 65846 / 66528 / 67100 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 38 / 38 / 39 | 19 / 19 / 19 | 0.09 / 0.09 / 0.09 | 0 / 0 / 2 | 1093 / 1096 / 1100 | 68090 / 68420 / 68706 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1510 / 1516 / 1525 | 132880 / 133408 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg4|L10-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1510 / 1516 / 1525 | 132880 / 133408 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | 0 / 0 / 0 | 727 / 732 / 739 | 2908 / 2928 / 2956 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 67 / 68 / 68 | not reached / not reached / not reached | 65 / 66 / 66 | 678 / 684 / 689 | 2712 / 2736 / 2756 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-1|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1353 | 10784 / 10800 / 10824 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-1|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1348 / 1350 / 1353 | 10784 / 10800 / 10824 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 28740 / 28740 / 28740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L1-Z1|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2395 / 2395 / 2395 | 38320 / 38320 / 38320 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 3 / 3 / 4 | not reached / not reached / not reached | 1 / 1 / 1 | 9 / 21 / 54 | 90 / 210 / 540 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 128 / 129 / 130 | not reached / not reached / not reached | 126 / 127 / 128 | 319 / 326 / 331 | 3190 / 3260 / 3310 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-1|POL2-FIXED | model-output (diagnostic) | 4 / 17 / 45 | 3 / 5 / 11 | 0.02 / 0.09 / 0.24 | 0 / 1 / 1 | 86 / 327 / 900 | 1590 / 5970 / 16330 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-1|CONTINUOUS | model-output (diagnostic) | 43 / 44 / 45 | 43 / 44 / 45 | 0.24 / 0.24 / 0.25 | 41 / 42 / 43 | 874 / 884 / 895 | 15910 / 16140 / 16410 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-2|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-2|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1725 / 1725 / 1725 | 51750 / 51750 / 51750 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1969 / 1981 | 78280 / 78760 / 79240 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L5-Z2|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1957 / 1969 / 1981 | 78280 / 78760 / 79240 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-0|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 1 | not reached / not reached / not reached | 0 / 0 / 0 | 196 / 197 / 197 | 4312 / 4334 / 4334 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-0|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 164 / 164 / 165 | not reached / not reached / not reached | 162 / 162 / 163 | 164 / 164 / 165 | 3608 / 3608 / 3630 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-1|POL2-FIXED | model-output (diagnostic) | 4 / 6 / 14 | 3 / 3 / 4 | 0.02 / 0.03 / 0.07 | 1 / 1 / 1 | 28 / 43 / 97 | 1122 / 1694 / 3740 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-1|CONTINUOUS | model-output (diagnostic) | 71 / 72 / 72 | 71 / 72 / 72 | 0.30 / 0.30 / 0.31 | 69 / 70 / 70 | 502 / 505 / 509 | 19536 / 19778 / 20042 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-2|POL2-FIXED | model-output (diagnostic) | 48 / 48 / 49 | 0 / 0 / 0 | 0.13 / 0.13 / 0.14 | 0 / 0 / 0 | 1000 / 1004 / 1010 | 60412 / 60764 / 61094 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-2|CONTINUOUS | model-output (diagnostic) | 47 / 48 / 49 | 39 / 41 / 43 | 0.12 / 0.12 / 0.13 | 37 / 39 / 41 | 976 / 987 / 1000 | 59246 / 60082 / 60852 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-3|POL2-FIXED | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1510 / 1516 / 1525 | 132880 / 133408 / 134200 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg6|L10-Z3|squad-3|CONTINUOUS | model-output (diagnostic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1510 / 1516 / 1525 | 132880 / 133408 / 134200 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

12800 runs, 384429846 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L3-Z2|squad-0|POL2-FIXED | 0 | 376.0 | unsafe | 394.8 | -4.8% | not reached | not reached | — |
| a10-p1.6-g100|L3-Z2|squad-0|CONTINUOUS | 0 | 376.0 | unsafe | 376.7 | -0.2% | not reached | not reached | — |
| a10-p1.6-g100|L3-Z2|squad-1|POL2-FIXED | 1 | 878.5 | approximate | 833.1 | 5.4% | not reached | not reached | — |
| a10-p1.6-g100|L3-Z2|squad-1|CONTINUOUS | 1 | 878.5 | approximate | 840.4 | 4.5% | not reached | not reached | — |
| a10-p1.6-g100|L3-Z2|squad-2|POL2-FIXED | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100|L3-Z2|squad-2|CONTINUOUS | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100|L3-Z2|squad-3|POL2-FIXED | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100|L3-Z2|squad-3|CONTINUOUS | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-0|POL2-FIXED | 0 | 237.0 | unsafe | 265.8 | -10.8% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-0|CONTINUOUS | 0 | 237.0 | unsafe | 237.0 | -0.0% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-1|POL2-FIXED | 1 | 615.8 | approximate | 541.6 | 13.7% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-1|CONTINUOUS | 1 | 615.8 | approximate | 542.8 | 13.5% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-2|POL2-FIXED | 2 | 934.1 | approximate | 952.0 | -1.9% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-2|CONTINUOUS | 2 | 934.1 | approximate | 951.7 | -1.8% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-3|POL2-FIXED | 3 | 1118.2 | approximate | 1270.8 | -12.0% | not reached | not reached | — |
| a10-p1.6-g100|L7-Z3|squad-3|CONTINUOUS | 3 | 1118.2 | approximate | 1271.8 | -12.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-0|POL2-FIXED | 0 | 321.0 | unsafe | 334.2 | -3.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-0|CONTINUOUS | 0 | 321.0 | unsafe | 320.1 | 0.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-1|POL2-FIXED | 1 | 878.5 | approximate | 747.9 | 17.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-1|CONTINUOUS | 1 | 878.5 | approximate | 787.1 | 11.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-2|POL2-FIXED | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-2|CONTINUOUS | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-3|POL2-FIXED | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L3-Z2|squad-3|CONTINUOUS | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-0|POL2-FIXED | 0 | 133.3 | unsafe | 3.3 | 3952.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-0|CONTINUOUS | 0 | 133.3 | unsafe | 132.8 | 0.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-1|POL2-FIXED | 1 | 615.8 | approximate | 39.6 | 1453.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-1|CONTINUOUS | 1 | 615.8 | approximate | 428.1 | 43.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-2|POL2-FIXED | 2 | 934.1 | approximate | 901.1 | 3.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-2|CONTINUOUS | 2 | 934.1 | approximate | 892.9 | 4.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-3|POL2-FIXED | 3 | 1118.2 | approximate | 1248.4 | -10.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg2|L7-Z3|squad-3|CONTINUOUS | 3 | 1118.2 | approximate | 1246.8 | -10.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-0|POL2-FIXED | 0 | 221.5 | unsafe | 289.8 | -23.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-0|CONTINUOUS | 0 | 221.5 | unsafe | 221.2 | 0.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-1|POL2-FIXED | 1 | 878.5 | approximate | 714.0 | 23.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-1|CONTINUOUS | 1 | 878.5 | approximate | 667.7 | 31.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-2|POL2-FIXED | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-2|CONTINUOUS | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-3|POL2-FIXED | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L3-Z2|squad-3|CONTINUOUS | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-0|POL2-FIXED | 0 | 147.6 | unsafe | 175.1 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-0|CONTINUOUS | 0 | 147.6 | unsafe | 147.4 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-1|POL2-FIXED | 1 | 615.8 | approximate | 26.1 | 2255.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-1|CONTINUOUS | 1 | 615.8 | approximate | 405.1 | 52.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-2|POL2-FIXED | 2 | 934.1 | approximate | 835.8 | 11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-2|CONTINUOUS | 2 | 934.1 | approximate | 837.4 | 11.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-3|POL2-FIXED | 3 | 1118.2 | approximate | 1219.0 | -8.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg3|L7-Z3|squad-3|CONTINUOUS | 3 | 1118.2 | approximate | 1221.0 | -8.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-0|POL2-FIXED | 0 | 241.4 | unsafe | 267.9 | -9.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-0|CONTINUOUS | 0 | 241.4 | unsafe | 241.4 | -0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-1|POL2-FIXED | 1 | 878.5 | approximate | 57.7 | 1423.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-1|CONTINUOUS | 1 | 878.5 | approximate | 646.3 | 35.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-2|POL2-FIXED | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-2|CONTINUOUS | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-3|POL2-FIXED | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L3-Z2|squad-3|CONTINUOUS | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-0|POL2-FIXED | 0 | 130.3 | unsafe | 2.5 | 5113.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-0|CONTINUOUS | 0 | 130.3 | unsafe | 130.5 | -0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-1|POL2-FIXED | 1 | 615.8 | approximate | 13.9 | 4314.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-1|CONTINUOUS | 1 | 615.8 | approximate | 353.8 | 74.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-2|POL2-FIXED | 2 | 934.1 | approximate | 808.4 | 15.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-2|CONTINUOUS | 2 | 934.1 | approximate | 762.5 | 22.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-3|POL2-FIXED | 3 | 1118.2 | approximate | 1184.6 | -5.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L7-Z3|squad-3|CONTINUOUS | 3 | 1118.2 | approximate | 1197.3 | -6.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-0|POL2-FIXED | 0 | 149.4 | unsafe | 186.8 | -20.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-0|CONTINUOUS | 0 | 149.4 | unsafe | 149.1 | 0.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-1|POL2-FIXED | 1 | 878.5 | approximate | 591.4 | 48.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-1|CONTINUOUS | 1 | 878.5 | approximate | 590.5 | 48.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-2|POL2-FIXED | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-2|CONTINUOUS | 2 | 1262.4 | approximate | 1429.5 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-3|POL2-FIXED | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L3-Z2|squad-3|CONTINUOUS | 3 | 1482.4 | approximate | 1758.9 | -15.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-0|POL2-FIXED | 0 | 0 | unreachable | 0 | both 0 | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-0|CONTINUOUS | 0 | 0 | unreachable | 0 | both 0 | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-1|POL2-FIXED | 1 | 615.8 | approximate | 9.0 | 6727.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-1|CONTINUOUS | 1 | 615.8 | approximate | 315.3 | 95.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-2|POL2-FIXED | 2 | 934.1 | approximate | 183.3 | 409.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-2|CONTINUOUS | 2 | 934.1 | approximate | 696.3 | 34.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-3|POL2-FIXED | 3 | 1118.2 | approximate | 1135.3 | -1.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L7-Z3|squad-3|CONTINUOUS | 3 | 1118.2 | approximate | 1123.9 | -0.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-0|POL2-FIXED | 0 | 760.2 | unsafe | 781.3 | -2.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-0|CONTINUOUS | 0 | 760.2 | unsafe | 759.8 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-1|POL2-FIXED | 1 | 1531.5 | approximate | 1350.5 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-1|CONTINUOUS | 1 | 1531.5 | approximate | 1350.5 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-2|POL2-FIXED | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-2|CONTINUOUS | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-3|POL2-FIXED | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L1-Z1|squad-3|CONTINUOUS | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-0|POL2-FIXED | 0 | 399.9 | unsafe | 452 | -11.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-0|CONTINUOUS | 0 | 399.9 | unsafe | 400.1 | -0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-1|POL2-FIXED | 1 | 1160.5 | approximate | 991.0 | 17.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-1|CONTINUOUS | 1 | 1160.5 | approximate | 1018.9 | 13.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-2|POL2-FIXED | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-2|CONTINUOUS | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-3|POL2-FIXED | 3 | 1699.4 | approximate | 1969.7 | -13.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L5-Z2|squad-3|CONTINUOUS | 3 | 1699.4 | approximate | 1969.7 | -13.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-0|POL2-FIXED | 0 | 144.1 | unsafe | 3.0 | 4641.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-0|CONTINUOUS | 0 | 144.1 | unsafe | 144.1 | 0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-1|POL2-FIXED | 1 | 779.5 | approximate | 67.0 | 1064.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-1|CONTINUOUS | 1 | 779.5 | approximate | 555.4 | 40.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-2|POL2-FIXED | 2 | 1138.5 | approximate | 1078.3 | 5.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-2|CONTINUOUS | 2 | 1138.5 | approximate | 1096.4 | 3.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-3|POL2-FIXED | 3 | 1321.1 | approximate | 1516.8 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg4|L10-Z3|squad-3|CONTINUOUS | 3 | 1321.1 | approximate | 1516.8 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-0|POL2-FIXED | 0 | 684.5 | unsafe | 732.4 | -6.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-0|CONTINUOUS | 0 | 684.5 | unsafe | 684.3 | 0.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-1|POL2-FIXED | 1 | 1531.5 | approximate | 1350.5 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-1|CONTINUOUS | 1 | 1531.5 | approximate | 1350.5 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-2|POL2-FIXED | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-2|CONTINUOUS | 2 | 1876.8 | approximate | 2395 | -21.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-3|POL2-FIXED | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L1-Z1|squad-3|CONTINUOUS | 3 | 2045.8 | approximate | 2395 | -14.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-0|POL2-FIXED | 0 | 325.5 | unsafe | 25.6 | 1172.0% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-0|CONTINUOUS | 0 | 325.5 | unsafe | 325.8 | -0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-1|POL2-FIXED | 1 | 1160.5 | approximate | 392.6 | 195.6% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-1|CONTINUOUS | 1 | 1160.5 | approximate | 884.9 | 31.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-2|POL2-FIXED | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-2|CONTINUOUS | 2 | 1521.5 | approximate | 1725.0 | -11.8% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-3|POL2-FIXED | 3 | 1699.4 | approximate | 1969.7 | -13.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L5-Z2|squad-3|CONTINUOUS | 3 | 1699.4 | approximate | 1969.7 | -13.7% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-0|POL2-FIXED | 0 | 164.6 | unsafe | 196.7 | -16.3% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-0|CONTINUOUS | 0 | 164.6 | unsafe | 164.4 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-1|POL2-FIXED | 1 | 779.5 | approximate | 52.8 | 1375.5% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-1|CONTINUOUS | 1 | 779.5 | approximate | 505.6 | 54.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-2|POL2-FIXED | 2 | 1138.5 | approximate | 1004.4 | 13.4% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-2|CONTINUOUS | 2 | 1138.5 | approximate | 988.0 | 15.2% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-3|POL2-FIXED | 3 | 1321.1 | approximate | 1516.8 | -12.9% | not reached | not reached | — |
| a10-p1.6-g100-dmg6|L10-Z3|squad-3|CONTINUOUS | 3 | 1321.1 | approximate | 1516.8 | -12.9% | not reached | not reached | — |

## Notes and limitations

- Registered as amendment 01 because S3-E11 alone was not informative under the registered rule (24 of 72 cells with recruits generated knockouts).
- The informativeness rule is applied to the S3-E11 and S3-E11a cells together (AMENDMENT-01.md).

