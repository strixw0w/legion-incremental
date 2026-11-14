# S2-E06-assignment-switching

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Does switching recruits between the squad and workers gain more than 5% over setting them once?

**Design.** All recruits alternate between the squad and workers every 1, 5 or 30 minutes, against set-and-forget all-squad (POL2-SQUAD) and all-workers (POL2-WORKERS), PR-BAL, 100 replicates.

**Seeds:** root `S2-E06`, 100 replicates per cell. **Semantic fingerprint:** `ec7f2bd85fd6b2f1150de62be0ee252a0c12356fd9ded2e072218fcc59a05fe5` (manifest SHA-256 `b433a0b06b5ddd11a8070bde7e9efa6fa17300cc551c5f42d9ac22218834c3d4`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SWITCH-1min | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SWITCH-5min | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SWITCH-30min | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | legionExpTotal | expTotal | goldPerHour | zone3FirstVisitMin | workerStops | invariantViolations |
|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|POL2-SQUAD | model-output (realistic) | 174636 / 174988 / 175340 | 44324 / 44412 / 44500 | 12112 / 12136 / 12160 | 8.31 / 8.36 / 8.43 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-WORKERS | model-output (realistic) | 44986 / 45122 / 45254 | 13000 / 13110 / 13202 | 12735 / 12775 / 12810 | 24.73 / 24.93 / 25.07 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-SWITCH-1min | model-output (realistic) | 111432 / 112208 / 113014 | 28480 / 28620 / 28838 | 14400 / 14476 / 14574 | 8.81 / 8.87 / 8.94 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-SWITCH-5min | model-output (realistic) | 110742 / 111412 / 111778 | 28250 / 28348 / 28470 | 14698 / 14739 / 14784 | 10.35 / 10.37 / 10.44 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-SWITCH-30min | model-output (realistic) | 113058 / 113392 / 113802 | 28440 / 28528 / 28660 | 17332 / 17359 / 17398 | 8.31 / 8.36 / 8.43 | 0 / 0 / 0 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

500 runs, 79252611 checks, **0 violations**.

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- H-S2-04 is evaluated in analysis B2, as pre-registered: mean legionExpTotal of each switching cell divided by the BETTER of the two set-and-forget means, minus 1, must be <= 0.05.
- A switch cancels the fights in progress (no credit for them); the realistic switching policy changes every recruit at the first decision after each period boundary.

