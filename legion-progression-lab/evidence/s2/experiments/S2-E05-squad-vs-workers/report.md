# S2-E05-squad-vs-workers

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** All recruits in the squad, all as workers, or one deployed and the rest workers: what does each give, per objective?

**Design.** POL2-SQUAD (every recruit deployed), POL2-WORKERS (none deployed, all workers) and POL2-MIXED (one deployed, the rest workers), PR-BAL and PR-OPT, 100 replicates. Objectives reported separately (B3): hero EXP (expTotal), legion EXP (legionExpTotal), gold (goldPerHour, goldHeld), conquest (zone first visits, boss gate).

**Seeds:** root `S2-E05`, 100 replicates per cell. **Semantic fingerprint:** `c5bbd0865c8183a3ba30d259da00a1acaaee581c0612de76bb49de0623c538a3` (manifest SHA-256 `53807463b09c637c535e29809c944ef8977907c219bad08645d5d99912f2c7e9`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-MIXED | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-OPT|POL2-WORKERS | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-OPT|POL2-MIXED | 2.088 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-MIXED | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-OPT|POL2-SQUAD | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-OPT|POL2-WORKERS | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-OPT|POL2-MIXED | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | expTotal | legionExpTotal | goldPerHour | goldHeld | conquestScore | zone3FirstVisitMin | bossGateOpen | recruitLevelMean | workerKillsPerHour | squadKillsPerHour | workerStops | memberKnockoutsPerHour | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|POL2-SQUAD | model-output (realistic) | 44280 / 44412 / 44522 | 174460 / 174988 / 175428 | 12100 / 12136 / 12166 | 11550 / 11586 / 11616 | 3001002160 / 3001002166 / 3001002171 | 8.30 / 8.37 / 8.43 | 1 / 1 / 1 | 36 / 36 / 36.33 | 0 / 0 / 0 | 2160 / 2166 / 2171 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-WORKERS | model-output (realistic) | 13022 / 13110 / 13198 | 45010 / 45122 / 45248 | 12741 / 12773 / 12811 | 12191 / 12223 / 12261 | 3001005555 / 3001005564 / 3001005572 | 24.67 / 24.94 / 25.08 | 1 / 1 / 1 | 21 / 21 / 21 | 4694 / 4702 / 4711 | 857 / 861 / 865 | 0 / 0 / 0 | 1 / 1 / 1 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-MIXED | model-output (realistic) | 25206 / 25338 / 25470 | 73226 / 73518 / 73778 | 13628 / 13664 / 13706 | 13078 / 13114 / 13156 | 3001004407 / 3001004415 / 3001004423 | 9.23 / 9.29 / 9.34 | 1 / 1 / 1 | 24.33 / 24.33 / 24.33 | 3110 / 3116 / 3123 | 1293 / 1299 / 1305 | 0 / 0 / 0 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-OPT|POL2-SQUAD | model-output (realistic) | 70680 / 70812 / 70922 | 280060 / 280588 / 281028 | 12866.67 / 12890.67 / 12910.67 | 18750 / 18786 / 18816 | 3001003360 / 3001003366 / 3001003371 | 8.30 / 8.37 / 8.43 | 1 / 1 / 1 | 43.67 / 43.67 / 43.67 | 0 / 0 / 0 | 2240 / 2244 / 2247.33 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-OPT|POL2-WORKERS | model-output (realistic) | 22724 / 22834 / 22992 | 81488 / 81656 / 81806 | 15458.67 / 15492 / 15520 | 22638 / 22688 / 22730 | 3001008211 / 3001008221 / 3001008233 | 24.67 / 24.94 / 25.08 | 1 / 1 / 1 | 26.67 / 26.67 / 26.67 | 4606 / 4612 / 4618 | 865.33 / 868.67 / 874 | 0 / 0 / 0 | 4 / 4 / 4 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-OPT|POL2-MIXED | model-output (realistic) | 43202 / 43378 / 43510 | 129360 / 129734 / 130018 | 16231.33 / 16265.33 / 16289.33 | 23797 / 23848 / 23884 | 3001006779 / 3001006788 / 3001006796 | 9.23 / 9.29 / 9.34 | 1 / 1 / 1 | 30.33 / 30.33 / 30.33 | 3108.67 / 3112.67 / 3116.67 | 1407.33 / 1412.67 / 1416.67 | 0 / 0 / 0 | 4.67 / 5.33 / 5.33 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

600 runs, 110202828 checks, **0 violations**.

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- No single best is declared across objectives (B3).

