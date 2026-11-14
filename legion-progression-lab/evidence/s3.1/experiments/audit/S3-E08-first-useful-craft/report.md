# S3-E08-first-useful-craft

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** When does a realistic player craft the first item that improves a character (R04.20, H-S3-03)?

**Design.** Campaigns of the six POL3 strategies at PR-NEW (45 min) and PR-BAL (60 min), with the S2 control. A useful craft is any crafted weapon, armour piece or accessory (tools excluded). 100 replicates.

**Seeds:** root `s3-e08`, 100 replicates per cell. **Semantic fingerprint:** `260d7c08ed8bba67b1cfb4a2f18fa729c0dab1d800c3d6a505914ebcd962b162` (manifest SHA-256 `192aa35298bfbe3d7ae6cf22611c83ec8a8573aeef4dd925b1d48de17993985f`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-NEW|POL3-COMBAT | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-NEW|POL3-EQUIP | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-NEW|POL3-PROF | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-NEW|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-NEW|POL3-EARLY | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-NEW|POL3-CONQ | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-COMBAT | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-EQUIP | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-PROF | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-EARLY | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL3-CONQ | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-BAL|POL2-SQUAD-W|S2-control | 0 | pass |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-NEW|POL3-COMBAT | 9.478 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-NEW|POL3-EQUIP | 2.555 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-NEW|POL3-PROF | 6.460 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-NEW|POL3-BAL | 10.785 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-NEW|POL3-EARLY | 5.693 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-NEW|POL3-CONQ | not reached | not-reached |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-BAL|POL3-COMBAT | 9.478 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-BAL|POL3-EQUIP | 2.555 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-BAL|POL3-PROF | 6.460 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-BAL|POL3-BAL | 10.785 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-BAL|POL3-EARLY | 5.693 | miss |
| H-S3-03 | The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band) | target | p50 in [15, 25] active min | PR-BAL|POL3-CONQ | not reached | not-reached |

## Cells (p10 / p50 / p90)

| Cell | Tag | firstUsefulCraftMin | firstCraftMin | firstCopperItemMin | crafted | firstRecruitMin | recruit2Min | heroGatheringMin | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|
| PR-NEW|POL3-COMBAT | model-output (realistic) | 9.40 / 9.48 / 9.54 | 9.40 / 9.48 / 9.54 | 10.87 / 10.95 / 11.03 | 7 / 7 / 7 | 2.07 / 2.09 / 2.11 | 4.82 / 4.86 / 4.90 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-NEW|POL3-EQUIP | model-output (realistic) | 2.54 / 2.56 / 2.58 | 2.54 / 2.56 / 2.58 | not reached / not reached / not reached | 11 / 11 / 11 | 2.07 / 2.09 / 2.11 | 6.93 / 7.00 / 7.04 | 1.35 / 1.35 / 1.35 | 0 / 0 / 0 |
| PR-NEW|POL3-PROF | model-output (realistic) | 6.37 / 6.46 / 6.53 | 6.20 / 6.29 / 6.35 | 14.07 / 14.17 / 14.44 | 10 / 10 / 10 | 2.07 / 2.09 / 2.11 | 6.07 / 6.15 / 6.20 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-NEW|POL3-BAL | model-output (realistic) | 10.72 / 10.79 / 10.86 | 10.72 / 10.79 / 10.86 | 12.10 / 12.17 / 12.24 | 8 / 8 / 8 | 2.07 / 2.09 / 2.11 | 4.82 / 4.86 / 4.90 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-NEW|POL3-EARLY | model-output (realistic) | 5.56 / 5.69 / 5.87 | 5.56 / 5.69 / 5.87 | not reached / not reached / not reached | 5 / 5 / 5 | 2.07 / 2.09 / 2.11 | 4.84 / 5.36 / 5.54 | 1.35 / 1.35 / 1.35 | 0 / 0 / 0 |
| PR-NEW|POL3-CONQ | model-output (realistic) | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 2.07 / 2.09 / 2.11 | 4.82 / 4.86 / 4.90 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-BAL|POL3-COMBAT | model-output (realistic) | 9.40 / 9.48 / 9.54 | 9.40 / 9.48 / 9.54 | 10.87 / 10.95 / 11.03 | 7 / 7 / 7 | 2.07 / 2.09 / 2.11 | 4.82 / 4.86 / 4.90 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-BAL|POL3-EQUIP | model-output (realistic) | 2.54 / 2.56 / 2.58 | 2.54 / 2.56 / 2.58 | not reached / not reached / not reached | 11 / 11 / 11 | 2.07 / 2.09 / 2.11 | 6.93 / 7.00 / 7.04 | 1.35 / 1.35 / 1.35 | 0 / 0 / 0 |
| PR-BAL|POL3-PROF | model-output (realistic) | 6.37 / 6.46 / 6.53 | 6.20 / 6.29 / 6.35 | 14.07 / 14.17 / 14.44 | 10 / 10 / 10 | 2.07 / 2.09 / 2.11 | 6.07 / 6.15 / 6.20 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-BAL|POL3-BAL | model-output (realistic) | 10.72 / 10.79 / 10.86 | 10.72 / 10.79 / 10.86 | 12.10 / 12.17 / 12.24 | 8 / 8 / 8 | 2.07 / 2.09 / 2.11 | 4.82 / 4.86 / 4.90 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-BAL|POL3-EARLY | model-output (realistic) | 5.56 / 5.69 / 5.87 | 5.56 / 5.69 / 5.87 | not reached / not reached / not reached | 5 / 5 / 5 | 2.07 / 2.09 / 2.11 | 4.84 / 5.36 / 5.54 | 1.35 / 1.35 / 1.35 | 0 / 0 / 0 |
| PR-BAL|POL3-CONQ | model-output (realistic) | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 2.07 / 2.09 / 2.11 | 4.82 / 4.86 / 4.90 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-BAL|POL2-SQUAD-W|S2-control | model-output (control) | — | — | — | — | 2.07 / 2.09 / 2.11 | 4.82 / 4.86 / 4.90 | — | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

1300 runs, 156301178 checks, **0 violations**.

## Notes and limitations

- The target band is the M0 candidate (R04.20); it is not changed after results. Development probes of the strategies (seed probe#rep-0) were run before registration to debug them; the band was fixed by M0 before S3.

