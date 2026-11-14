# S3-E12-investment

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Direction G: how do the six investment strategies compare on hero EXP, legion EXP, gold and conquest, (1) over a fixed session and (2) from a matched mid-game state with the same gold, and how far is each from the best hindsight search found?

**Design.** Design 1: PR-OPT (90 min) campaigns of the six POL3 strategies, and ORC3-SEARCH (hindsight, bounded: 10-min look-ahead, 6 forks per decision, 180 per run, decisions at least 60 s apart) per objective. Design 2: PR-NEW (45 min) from a matched diagnostic state (hero level 8 in zone 2, zones 1-2 visited, two level-5 recruits, 600 gold, no materials). Strategies: 100 replicates; search: the first 10 replicates are reported (same seeds).

**Seeds:** root `s3-e12`, 100 replicates per cell. **Semantic fingerprint:** `70c2b382117530ac26f079315d7e4d2c96f16f9043a41d910bef16c5612b1c3a` (manifest SHA-256 `05b64feddad7c7a1dbf9592cafa91ae6c7e5c91287ba755ecd1e69578246bcdb`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|POL3-COMBAT | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|POL3-EQUIP | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|POL3-PROF | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|POL3-EARLY | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|POL3-CONQ | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|ORC3-SEARCH-heroExp | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|ORC3-SEARCH-legionExp | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|ORC3-SEARCH-gold | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | session|PR-OPT|ORC3-SEARCH-conquest | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | budget|PR-NEW|POL3-COMBAT | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | budget|PR-NEW|POL3-EQUIP | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | budget|PR-NEW|POL3-PROF | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | budget|PR-NEW|POL3-BAL | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | budget|PR-NEW|POL3-EARLY | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | budget|PR-NEW|POL3-CONQ | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | expTotal | legionExpTotal | goldHeld | conquestScore | crafted | enhancements | heroDamageShare | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|
| session|PR-OPT|POL3-COMBAT | model-output (realistic) | 49054 / 49274 / 49538 | 99176 / 99616 / 100144 | 12852 / 12912 / 12984 | 3001002377 / 3001002387 / 3001002399 | 7 / 7 / 7 | 0 / 0 / 0 | 0.55 / 0.56 / 0.56 | 0 / 0 / 0 |
| session|PR-OPT|POL3-EQUIP | model-output (realistic) | 40040 / 40326 / 40568 | 76142 / 76714 / 77198 | 9570 / 9648 / 9714 | 3001002000 / 3001002013 / 3001002024 | 11 / 11 / 11 | 9 / 9 / 9 | 0.48 / 0.49 / 0.49 | 0 / 0 / 0 |
| session|PR-OPT|POL3-PROF | model-output (realistic) | 27596 / 27728 / 27882 | 27596 / 27728 / 27882 | 7017 / 7053 / 7095 | 3001001436 / 3001001442 / 3001001449 | 10 / 10 / 10 | 0 / 0 / 0 | 1 / 1 / 1 | 0 / 0 / 0 |
| session|PR-OPT|POL3-BAL | model-output (realistic) | 48790 / 49054 / 49296 | 97288 / 97816 / 98300 | 12580 / 12652 / 12718 | 3001002365 / 3001002377 / 3001002388 | 8 / 8 / 8 | 4 / 4 / 4 | 0.56 / 0.56 / 0.56 | 0 / 0 / 0 |
| session|PR-OPT|POL3-EARLY | model-output (realistic) | 13878 / 13900 / 13926 | 27596 / 27640 / 27692 | 3324 / 3333 / 3343 | 2000003444 / 2000003451 / 2000003458 | 5 / 5 / 5 | 0 / 0 / 0 | 0.49 / 0.49 / 0.49 | 0 / 0 / 0 |
| session|PR-OPT|POL3-CONQ | model-output (realistic) | 70724 / 70812 / 70922 | 280236 / 280588 / 281028 | 18762 / 18786 / 18816 | 3001003362 / 3001003366 / 3001003371 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| session|PR-OPT|ORC3-SEARCH-heroExp | model-output (oracle) | 70724 / 70812 / 70922 | 280236 / 280588 / 281028 | 18762 / 18786 / 18816 | 3001003362 / 3001003366 / 3001003371 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| session|PR-OPT|ORC3-SEARCH-legionExp | model-output (oracle) | 70724 / 70812 / 70922 | 280236 / 280588 / 281028 | 18762 / 18786 / 18816 | 3001003362 / 3001003366 / 3001003371 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| session|PR-OPT|ORC3-SEARCH-gold | model-output (oracle) | 70724 / 70812 / 70922 | 280236 / 280588 / 281028 | 18762 / 18786 / 18816 | 3001003362 / 3001003366 / 3001003371 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| session|PR-OPT|ORC3-SEARCH-conquest | model-output (oracle) | 70724 / 70812 / 70922 | 280236 / 280588 / 281028 | 18762 / 18786 / 18816 | 3001003362 / 3001003366 / 3001003371 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |
| budget|PR-NEW|POL3-COMBAT | model-output (realistic) | 19526 / 19614 / 19724 | 39922 / 40120 / 40318 | 5558 / 5582 / 5612 | 3001000953 / 3001000957 / 3001000962 | 0 / 0 / 0 | 0 / 0 / 0 | 0.53 / 0.53 / 0.53 | 0 / 0 / 0 |
| budget|PR-NEW|POL3-EQUIP | model-output (realistic) | 17740 / 17850 / 17982 | 34280 / 34500 / 34764 | 5072 / 5102 / 5138 | 3001000874 / 3001000879 / 3001000885 | 0 / 0 / 0 | 0 / 0 / 0 | 0.46 / 0.46 / 0.46 | 0 / 0 / 0 |
| budget|PR-NEW|POL3-PROF | model-output (realistic) | 10054 / 10120 / 10186 | 10054 / 10120 / 10186 | 3032 / 3050 / 3068 | 3001000637 / 3001000640 / 3001000643 | 3 / 3 / 3 | 0 / 0 / 0 | 1 / 1 / 1 | 0 / 0 / 0 |
| budget|PR-NEW|POL3-BAL | model-output (realistic) | 18888 / 18976 / 19064 | 37468 / 37622 / 37820 | 5384 / 5408 / 5432 | 3001000924 / 3001000928 / 3001000932 | 0 / 0 / 0 | 0 / 0 / 0 | 0.54 / 0.55 / 0.55 | 0 / 0 / 0 |
| budget|PR-NEW|POL3-EARLY | model-output (realistic) | 6816 / 6846 / 6894 | 13632 / 13692 / 13788 | 2308 / 2319 / 2337 | 2000001683 / 2000001689 / 2000001693 | 5 / 5 / 5 | 0 / 0 / 0 | 0.52 / 0.52 / 0.52 | 0 / 0 / 0 |
| budget|PR-NEW|POL3-CONQ | model-output (realistic) | 34838 / 34948 / 35036 | 138152 / 138592 / 138944 | 9734 / 9764 / 9788 | 3001001649 / 3001001654 / 3001001658 | 0 / 0 / 0 | 0 / 0 / 0 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

1600 runs, 231129581 checks, **0 violations**.

## Hindsight search against realistic policies (B4)

| Search | Objective | Metric | Realistic | Search mean (oracle, hindsight) | Realistic mean | Ratio |
|---|---|---|---|---|---|---|
| session|PR-OPT|ORC3-SEARCH-heroExp | heroExp | expTotal | session|PR-OPT|POL3-COMBAT | 70815.3 | 49300.6 | 1.436 |
| session|PR-OPT|ORC3-SEARCH-heroExp | heroExp | expTotal | session|PR-OPT|POL3-EQUIP | 70815.3 | 40319.4 | 1.756 |
| session|PR-OPT|ORC3-SEARCH-heroExp | heroExp | expTotal | session|PR-OPT|POL3-PROF | 70815.3 | 27737.9 | 2.553 |
| session|PR-OPT|ORC3-SEARCH-heroExp | heroExp | expTotal | session|PR-OPT|POL3-BAL | 70815.3 | 49041.7 | 1.444 |
| session|PR-OPT|ORC3-SEARCH-heroExp | heroExp | expTotal | session|PR-OPT|POL3-EARLY | 70815.3 | 13900.7 | 5.094 |
| session|PR-OPT|ORC3-SEARCH-heroExp | heroExp | expTotal | session|PR-OPT|POL3-CONQ | 70815.3 | 70815.3 | 1 |
| session|PR-OPT|ORC3-SEARCH-legionExp | legionExp | legionExpTotal | session|PR-OPT|POL3-COMBAT | 280601.2 | 99669.2 | 2.815 |
| session|PR-OPT|ORC3-SEARCH-legionExp | legionExp | legionExpTotal | session|PR-OPT|POL3-EQUIP | 280601.2 | 76700.8 | 3.658 |
| session|PR-OPT|ORC3-SEARCH-legionExp | legionExp | legionExpTotal | session|PR-OPT|POL3-PROF | 280601.2 | 27737.9 | 10.116 |
| session|PR-OPT|ORC3-SEARCH-legionExp | legionExp | legionExpTotal | session|PR-OPT|POL3-BAL | 280601.2 | 97791.4 | 2.869 |
| session|PR-OPT|ORC3-SEARCH-legionExp | legionExp | legionExpTotal | session|PR-OPT|POL3-EARLY | 280601.2 | 27641.3 | 10.152 |
| session|PR-OPT|ORC3-SEARCH-legionExp | legionExp | legionExpTotal | session|PR-OPT|POL3-CONQ | 280601.2 | 280601.2 | 1 |
| session|PR-OPT|ORC3-SEARCH-gold | gold | goldHeld | session|PR-OPT|POL3-COMBAT | 18786.9 | 12919.3 | 1.454 |
| session|PR-OPT|ORC3-SEARCH-gold | gold | goldHeld | session|PR-OPT|POL3-EQUIP | 18786.9 | 9646.2 | 1.948 |
| session|PR-OPT|ORC3-SEARCH-gold | gold | goldHeld | session|PR-OPT|POL3-PROF | 18786.9 | 7055.7 | 2.663 |
| session|PR-OPT|ORC3-SEARCH-gold | gold | goldHeld | session|PR-OPT|POL3-BAL | 18786.9 | 12648.6 | 1.485 |
| session|PR-OPT|ORC3-SEARCH-gold | gold | goldHeld | session|PR-OPT|POL3-EARLY | 18786.9 | 3333.2 | 5.636 |
| session|PR-OPT|ORC3-SEARCH-gold | gold | goldHeld | session|PR-OPT|POL3-CONQ | 18786.9 | 18786.9 | 1 |
| session|PR-OPT|ORC3-SEARCH-conquest | conquest | conquestScore | session|PR-OPT|POL3-COMBAT | 3001003366.2 | 3001002388.2 | 1.000 |
| session|PR-OPT|ORC3-SEARCH-conquest | conquest | conquestScore | session|PR-OPT|POL3-EQUIP | 3001003366.2 | 3001002012.7 | 1.000 |
| session|PR-OPT|ORC3-SEARCH-conquest | conquest | conquestScore | session|PR-OPT|POL3-PROF | 3001003366.2 | 3001001442.4 | 1.000 |
| session|PR-OPT|ORC3-SEARCH-conquest | conquest | conquestScore | session|PR-OPT|POL3-BAL | 3001003366.2 | 3001002376.4 | 1.000 |
| session|PR-OPT|ORC3-SEARCH-conquest | conquest | conquestScore | session|PR-OPT|POL3-EARLY | 3001003366.2 | 2000003451.1 | 1.500 |
| session|PR-OPT|ORC3-SEARCH-conquest | conquest | conquestScore | session|PR-OPT|POL3-CONQ | 3001003366.2 | 3001003366.2 | 1 |

The ratio is a lower bound on what hindsight could gain over the realistic policy; it is not an upper bound.

## Notes and limitations

- ORC3-SEARCH uses hidden information; its result is the best feasible found within the budget, never an upper bound.
- The matched-state start is a labelled diagnostic initialisation.

