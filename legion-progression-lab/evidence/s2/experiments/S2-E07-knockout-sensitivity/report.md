# S2-E07-knockout-sensitivity

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** How sensitive are knockouts, deaths and progression to enemy damage with a full squad?

**Design.** Enemy damage x0.5 / x1 / x1.5 / x2 (all enemies), POL2-SQUAD (all recruits deployed), PR-BAL, 100 replicates.

**Seeds:** root `S2-E07`, 100 replicates per cell. **Semantic fingerprint:** `acb0c1a54dca30c0a0033eaaa7c0a4cdfe009188d961f5415d8be37a11d30569` (manifest SHA-256 `c3f4bf71bcff2c157c92e6dbcc2fb6399ea988831eac107b8f7438bedb7244bd`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100-dmg0.5|PR-BAL|POL2-SQUAD | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100-dmg1.5|PR-BAL|POL2-SQUAD | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100-dmg2|PR-BAL|POL2-SQUAD | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | memberKnockoutsPerHour | deathsPerHour | autoFarmStops | legionExpPerHour | levelAt60 | zone3FirstVisitMin | heroDamageShare | restingMin | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|POL2-SQUAD | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 174548 / 174988 / 175428 | 36 / 37 / 37 | 8.30 / 8.37 / 8.44 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg0.5|PR-BAL|POL2-SQUAD | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 174548 / 174988 / 175428 | 36 / 37 / 37 | 8.30 / 8.37 / 8.44 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg1.5|PR-BAL|POL2-SQUAD | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 174548 / 174988 / 175428 | 36 / 37 / 37 | 8.30 / 8.37 / 8.44 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100-dmg2|PR-BAL|POL2-SQUAD | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 174548 / 174988 / 175428 | 36 / 37 / 37 | 8.30 / 8.37 / 8.44 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

400 runs, 32289696 checks, **0 violations**.

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.

