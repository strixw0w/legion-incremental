# S2-E10-estimator-vs-realisation

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** How close are the displayed squad and worker estimates to realised production in continuous farming?

**Design.** Frozen levels 1 / 5 / 10 x zones 1-3 x squad sizes 0-3 (mixed classes; Archer hero from level 5), continuous farming (no rest, auto-farm re-enabled after stops), 30 min; plus one worker (classless or Warrior) per level and zone. The prediction shown at the start is compared with the realised mean (B5). 100 replicates.

**Seeds:** root `S2-E10`, 100 replicates per cell. **Semantic fingerprint:** `39c2be19a10fa054003709ff1c7d2a6072ad9abe347356034c12109247a4add2` (manifest SHA-256 `383926bb5e957ac4c32c1baad6b4453a548e0d0c45f2c67d368ef06c726f609e`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z1|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z2|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L1-Z3|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z1|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z2|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L5-Z3|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z1|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|worker-warrior | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|squad-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|worker-classless | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z3|worker-warrior | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | killsPerHour | predictedKillsPerHour | predictedReliability | workerKillsPerHour | predictedWorkerKillsPerHour | predictedWorkerReliability | memberKnockoutsPerHour | deathsPerHour | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z1|squad-0 | model-output (diagnostic) | 894 / 900 / 904 | 897.69 / 897.69 / 897.69 | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 12 / 12 / 12 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-1 | model-output (diagnostic) | 1344 / 1346 / 1350 | 1531.46 / 1531.46 / 1531.46 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-2 | model-output (diagnostic) | 2390 / 2390 / 2390 | 1876.83 / 1876.83 / 1876.83 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|squad-3 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2045.82 / 2045.82 / 2045.82 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|worker-classless | model-output (diagnostic) | 894 / 900 / 904 | 897.69 / 897.69 / 897.69 | 0 / 0 / 0 | 840 / 844 / 850 | 838.61 / 838.61 / 838.61 | 1 / 1 / 1 | 12 / 12 / 12 | 12 / 12 / 12 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z1|worker-warrior | model-output (diagnostic) | 894 / 900 / 904 | 897.69 / 897.69 / 897.69 | 0 / 0 / 0 | 838 / 840 / 844 | 800.12 / 800.12 / 800.12 | 1 / 1 / 1 | 8 / 8 / 8 | 12 / 12 / 12 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|squad-0 | model-output (diagnostic) | 260 / 266 / 274 | 265.63 / 265.63 / 265.63 | 2 / 2 / 2 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 60 / 60 / 62 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|squad-1 | model-output (diagnostic) | 594 / 598 / 606 | 691.00 / 691.00 / 691.00 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 34 / 34 / 36 | 10 / 12 / 12 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|squad-2 | model-output (diagnostic) | 1142 / 1146 / 1150 | 1043.99 / 1043.99 / 1043.99 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 12 / 12 / 14 | 2 / 2 / 2 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|squad-3 | model-output (diagnostic) | 1448 / 1454 / 1460 | 1254.53 / 1254.53 / 1254.53 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|worker-classless | model-output (diagnostic) | 260 / 266 / 274 | 265.63 / 265.63 / 265.63 | 2 / 2 / 2 | 24 / 26 / 28 | 201.71 / 201.71 / 201.71 | 2 / 2 / 2 | 6 / 6 / 6 | 60 / 60 / 62 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z2|worker-warrior | model-output (diagnostic) | 260 / 266 / 274 | 265.63 / 265.63 / 265.63 | 2 / 2 / 2 | 36 / 38 / 40 | 187.44 / 187.44 / 187.44 | 2 / 2 / 2 | 6 / 6 / 6 | 60 / 60 / 62 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|squad-0 | model-output (diagnostic) | 0 / 0 / 0 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 124 / 124 / 124 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|squad-1 | model-output (diagnostic) | 140 / 146 / 152 | 288.10 / 288.10 / 288.10 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 64 / 64 / 64 | 62 / 62 / 64 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|squad-2 | model-output (diagnostic) | 334 / 338 / 344 | 488.88 / 488.88 / 488.88 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 56 / 56 / 58 | 52 / 54 / 54 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|squad-3 | model-output (diagnostic) | 580 / 586 / 592 | 636.55 / 636.55 / 636.55 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 56 / 58 / 58 | 28 / 28 / 30 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|worker-classless | model-output (diagnostic) | 0 / 0 / 0 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 0 / 0 / 0 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 6 / 6 / 6 | 124 / 124 / 124 | 0 / 0 / 0 |
| a10-p1.6-g100|L1-Z3|worker-warrior | model-output (diagnostic) | 0 / 0 / 0 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 6 / 6 / 6 | 0.00 / 0.00 / 0.00 | 2 / 2 / 2 | 6 / 6 / 6 | 124 / 124 / 124 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|squad-0 | model-output (diagnostic) | 1512 / 1526 / 1538 | 1531.91 / 1531.91 / 1531.91 | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|squad-1 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2148.49 / 2148.49 / 2148.49 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|squad-2 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2299.47 / 2299.47 / 2299.47 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|squad-3 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2361.80 / 2361.80 / 2361.80 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|worker-classless | model-output (diagnostic) | 1512 / 1526 / 1538 | 1531.91 / 1531.91 / 1531.91 | 0 / 0 / 0 | 1356 / 1362 / 1368 | 1363.64 / 1363.64 / 1363.64 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z1|worker-warrior | model-output (diagnostic) | 1512 / 1526 / 1538 | 1531.91 / 1531.91 / 1531.91 | 0 / 0 / 0 | 1350 / 1350 / 1350 | 1285.71 / 1285.71 / 1285.71 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-0 | model-output (diagnostic) | 604 / 610 / 616 | 611.81 / 611.81 / 611.81 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 34 / 34 / 34 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-1 | model-output (diagnostic) | 1120 / 1134 / 1142 | 1160.52 / 1160.52 / 1160.52 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 10 / 10 / 12 | 2 / 2 / 2 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-2 | model-output (diagnostic) | 1722 / 1722 / 1722 | 1521.50 / 1521.50 / 1521.50 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|squad-3 | model-output (diagnostic) | 1948 / 1964 / 1980 | 1699.41 / 1699.41 / 1699.41 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|worker-classless | model-output (diagnostic) | 604 / 610 / 616 | 611.81 / 611.81 / 611.81 | 1 / 1 / 1 | 90 / 90 / 90 | 433.88 / 433.88 / 433.88 | 1 / 1 / 1 | 6 / 6 / 6 | 34 / 34 / 34 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z2|worker-warrior | model-output (diagnostic) | 604 / 610 / 616 | 611.81 / 611.81 / 611.81 | 1 / 1 / 1 | 558 / 560 / 560 | 445.17 / 445.17 / 445.17 | 1 / 1 / 1 | 18 / 18 / 18 | 34 / 34 / 34 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|squad-0 | model-output (diagnostic) | 180 / 180 / 180 | 181.20 / 181.20 / 181.20 | 2 / 2 / 2 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 90 / 90 / 90 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|squad-1 | model-output (diagnostic) | 406 / 414 / 426 | 538.59 / 538.59 / 538.59 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 40 / 42 / 44 | 28 / 30 / 32 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|squad-2 | model-output (diagnostic) | 820 / 828 / 832 | 824.51 / 824.51 / 824.51 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 30 / 30 / 30 | 10 / 10 / 10 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|squad-3 | model-output (diagnostic) | 1074 / 1078 / 1082 | 1001.13 / 1001.13 / 1001.13 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 20 / 20 / 20 | 4 / 4 / 4 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|worker-classless | model-output (diagnostic) | 180 / 180 / 180 | 181.20 / 181.20 / 181.20 | 2 / 2 / 2 | 6 / 6 / 6 | 62.79 / 62.79 / 62.79 | 2 / 2 / 2 | 6 / 6 / 6 | 90 / 90 / 90 | 0 / 0 / 0 |
| a10-p1.6-g100|L5-Z3|worker-warrior | model-output (diagnostic) | 180 / 180 / 180 | 181.20 / 181.20 / 181.20 | 2 / 2 / 2 | 18 / 18 / 18 | 93.99 / 93.99 / 93.99 | 2 / 2 / 2 | 6 / 6 / 6 | 90 / 90 / 90 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|squad-0 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2400 / 2400 / 2400 | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|squad-1 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2400 / 2400 / 2400 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|squad-2 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2400 / 2400 / 2400 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|squad-3 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2400 / 2400 / 2400 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|worker-classless | model-output (diagnostic) | 2390 / 2390 / 2390 | 2400 / 2400 / 2400 | 0 / 0 / 0 | 2398 / 2398 / 2398 | 2400 / 2400 / 2400 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z1|worker-warrior | model-output (diagnostic) | 2390 / 2390 / 2390 | 2400 / 2400 / 2400 | 0 / 0 / 0 | 1388 / 1398 / 1408 | 1316.27 / 1316.27 / 1316.27 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|squad-0 | model-output (diagnostic) | 1022 / 1032 / 1040 | 1031.63 / 1031.63 / 1031.63 | 0 / 0 / 0 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 18 / 18 / 18 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|squad-1 | model-output (diagnostic) | 1594 / 1596 / 1600 | 1567.06 / 1567.06 / 1567.06 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|squad-2 | model-output (diagnostic) | 2390 / 2390 / 2390 | 1903.93 / 1903.93 / 1903.93 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|squad-3 | model-output (diagnostic) | 2390 / 2390 / 2390 | 2024.79 / 2024.79 / 2024.79 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|worker-classless | model-output (diagnostic) | 1022 / 1032 / 1040 | 1031.63 / 1031.63 / 1031.63 | 0 / 0 / 0 | 774 / 774 / 774 | 770.15 / 770.15 / 770.15 | 1 / 1 / 1 | 18 / 18 / 18 | 18 / 18 / 18 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|worker-warrior | model-output (diagnostic) | 1022 / 1032 / 1040 | 1031.63 / 1031.63 / 1031.63 | 0 / 0 / 0 | 828 / 830 / 834 | 600.09 / 600.09 / 600.09 | 1 / 1 / 1 | 8 / 8 / 8 | 18 / 18 / 18 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-0 | model-output (diagnostic) | 360 / 360 / 360 | 360.80 / 360.80 / 360.80 | 2 / 2 / 2 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 60 / 60 / 60 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-1 | model-output (diagnostic) | 724 / 732 / 738 | 779.53 / 779.53 / 779.53 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 16 / 18 / 18 | 6 / 6 / 6 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-2 | model-output (diagnostic) | 1180 / 1186 / 1194 | 1138.47 / 1138.47 / 1138.47 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 10 / 10 / 10 | 0 / 2 / 2 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|squad-3 | model-output (diagnostic) | 1506 / 1516 / 1524 | 1321.08 / 1321.08 / 1321.08 | 1 / 1 / 1 | 0 / 0 / 0 | not reached / not reached / not reached | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|worker-classless | model-output (diagnostic) | 360 / 360 / 360 | 360.80 / 360.80 / 360.80 | 2 / 2 / 2 | 18 / 18 / 18 | 152.04 / 152.04 / 152.04 | 2 / 2 / 2 | 6 / 6 / 6 | 60 / 60 / 60 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z3|worker-warrior | model-output (diagnostic) | 360 / 360 / 360 | 360.80 / 360.80 / 360.80 | 2 / 2 / 2 | 58 / 60 / 60 | 201.11 / 201.11 / 201.11 | 1 / 1 / 1 | 6 / 6 / 6 | 60 / 60 / 60 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

5400 runs, 93854746 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L1-Z1|squad-0 | 0 | 897.7 | reliable | 899.3 | -0.2% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-1 | 1 | 1531.5 | approximate | 1347.2 | 13.7% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-2 | 2 | 1876.8 | approximate | 2390 | -21.5% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|squad-3 | 3 | 2045.8 | approximate | 2390 | -14.4% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z1|worker-classless | 0 | 897.7 | reliable | 899.3 | -0.2% | 838.6 | 844.6 | -0.7% |
| a10-p1.6-g100|L1-Z1|worker-warrior | 0 | 897.7 | reliable | 899.3 | -0.2% | 800.1 | 840.0 | -4.8% |
| a10-p1.6-g100|L1-Z2|squad-0 | 0 | 265.6 | unsafe | 266.4 | -0.3% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z2|squad-1 | 1 | 691.0 | approximate | 599.5 | 15.3% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z2|squad-2 | 2 | 1044.0 | approximate | 1145.9 | -8.9% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z2|squad-3 | 3 | 1254.5 | approximate | 1453.6 | -13.7% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z2|worker-classless | 0 | 265.6 | unsafe | 266.4 | -0.3% | 201.7 | 25.9 | 678.2% |
| a10-p1.6-g100|L1-Z2|worker-warrior | 0 | 265.6 | unsafe | 266.4 | -0.3% | 187.4 | 38.7 | 384.1% |
| a10-p1.6-g100|L1-Z3|squad-0 | 0 | 0.0 | unsafe | 0 | not reached% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z3|squad-1 | 1 | 288.1 | approximate | 146.2 | 97.0% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z3|squad-2 | 2 | 488.9 | approximate | 338.1 | 44.6% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z3|squad-3 | 3 | 636.5 | approximate | 586.3 | 8.6% | not reached | not reached | — |
| a10-p1.6-g100|L1-Z3|worker-classless | 0 | 0.0 | unsafe | 0 | not reached% | 0.0 | 0 | not reached% |
| a10-p1.6-g100|L1-Z3|worker-warrior | 0 | 0.0 | unsafe | 0 | not reached% | 0.0 | 6 | -100.0% |
| a10-p1.6-g100|L5-Z1|squad-0 | 0 | 1531.9 | reliable | 1525.3 | 0.4% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z1|squad-1 | 1 | 2148.5 | approximate | 2390 | -10.1% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z1|squad-2 | 2 | 2299.5 | approximate | 2390 | -3.8% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z1|squad-3 | 3 | 2361.8 | approximate | 2390 | -1.2% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z1|worker-classless | 0 | 1531.9 | reliable | 1525.3 | 0.4% | 1363.6 | 1362 | 0.1% |
| a10-p1.6-g100|L5-Z1|worker-warrior | 0 | 1531.9 | reliable | 1525.3 | 0.4% | 1285.7 | 1350 | -4.8% |
| a10-p1.6-g100|L5-Z2|squad-0 | 0 | 611.8 | approximate | 611 | 0.1% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-1 | 1 | 1160.5 | approximate | 1132.8 | 2.4% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-2 | 2 | 1521.5 | approximate | 1722 | -11.6% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|squad-3 | 3 | 1699.4 | approximate | 1964.7 | -13.5% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z2|worker-classless | 0 | 611.8 | approximate | 611 | 0.1% | 433.9 | 90.0 | 382.0% |
| a10-p1.6-g100|L5-Z2|worker-warrior | 0 | 611.8 | approximate | 611 | 0.1% | 445.2 | 559.3 | -20.4% |
| a10-p1.6-g100|L5-Z3|squad-0 | 0 | 181.2 | unsafe | 180 | 0.7% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z3|squad-1 | 1 | 538.6 | approximate | 414.5 | 29.9% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z3|squad-2 | 2 | 824.5 | approximate | 826.3 | -0.2% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z3|squad-3 | 3 | 1001.1 | approximate | 1078.3 | -7.2% | not reached | not reached | — |
| a10-p1.6-g100|L5-Z3|worker-classless | 0 | 181.2 | unsafe | 180 | 0.7% | 62.8 | 6.2 | 919.3% |
| a10-p1.6-g100|L5-Z3|worker-warrior | 0 | 181.2 | unsafe | 180 | 0.7% | 94.0 | 18 | 422.2% |
| a10-p1.6-g100|L10-Z1|squad-0 | 0 | 2400 | reliable | 2390 | 0.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z1|squad-1 | 1 | 2400 | approximate | 2390 | 0.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z1|squad-2 | 2 | 2400 | approximate | 2390 | 0.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z1|squad-3 | 3 | 2400 | approximate | 2390 | 0.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z1|worker-classless | 0 | 2400 | reliable | 2390 | 0.4% | 2400 | 2398 | 0.1% |
| a10-p1.6-g100|L10-Z1|worker-warrior | 0 | 2400 | reliable | 2390 | 0.4% | 1316.3 | 1398.7 | -5.9% |
| a10-p1.6-g100|L10-Z2|squad-0 | 0 | 1031.6 | reliable | 1031.3 | 0.0% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|squad-1 | 1 | 1567.1 | approximate | 1597.0 | -1.9% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|squad-2 | 2 | 1903.9 | approximate | 2390 | -20.3% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|squad-3 | 3 | 2024.8 | approximate | 2390 | -15.3% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|worker-classless | 0 | 1031.6 | reliable | 1031.3 | 0.0% | 770.1 | 774 | -0.5% |
| a10-p1.6-g100|L10-Z2|worker-warrior | 0 | 1031.6 | reliable | 1031.3 | 0.0% | 600.1 | 830.7 | -27.8% |
| a10-p1.6-g100|L10-Z3|squad-0 | 0 | 360.8 | unsafe | 360.0 | 0.2% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-1 | 1 | 779.5 | approximate | 730.9 | 6.7% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-2 | 2 | 1138.5 | approximate | 1186.8 | -4.1% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|squad-3 | 3 | 1321.1 | approximate | 1515.5 | -12.8% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z3|worker-classless | 0 | 360.8 | unsafe | 360.0 | 0.2% | 152.0 | 18.1 | 740.9% |
| a10-p1.6-g100|L10-Z3|worker-warrior | 0 | 360.8 | unsafe | 360.0 | 0.2% | 201.1 | 59.7 | 236.8% |

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- No accuracy target is set for the squad estimator (owner section 11); the error is reported per cell with its reliability. Estimates are never results.

