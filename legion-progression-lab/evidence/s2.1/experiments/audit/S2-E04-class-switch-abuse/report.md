# S2-E04-class-switch-abuse

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Can switching class create mastery, records or account progress without the matching combat?

**Design.** The hero and three recruits at level 50 cycle Warrior -> Archer -> Mage 1, 5 or 20 times each; without training (every switch at the session start, no combat) and with 60 s of squad farming in zone 1 between switches. The invariant monitor checks every switch and credit. 100 replicates.

**Seeds:** root `S2-E04`, 100 replicates per cell. **Semantic fingerprint:** `ca0dd467f43a183ac9e273808e14ea92491a65933e01b3b3759dd884eb71e42a` (manifest SHA-256 `9c5055132290d80eef8ea12a9a982a1548425092244537931000c4ba384d23f2`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-05 | No mastery from switching without training | engineering | max == 0 EXP | a10-p1.6-g100|L50|cycles-1|no-train | 0 | pass |
| H-S2-05 | No mastery from switching without training | engineering | max == 0 EXP | a10-p1.6-g100|L50|cycles-5|no-train | 0 | pass |
| H-S2-05 | No mastery from switching without training | engineering | max == 0 EXP | a10-p1.6-g100|L50|cycles-20|no-train | 0 | pass |
| H-S2-05 | No account class record from switching without training | engineering | max == 0 levels | a10-p1.6-g100|L50|cycles-1|no-train | 0 | pass |
| H-S2-05 | No account class record from switching without training | engineering | max == 0 levels | a10-p1.6-g100|L50|cycles-5|no-train | 0 | pass |
| H-S2-05 | No account class record from switching without training | engineering | max == 0 levels | a10-p1.6-g100|L50|cycles-20|no-train | 0 | pass |
| H-S2-05 | With training, mastery never exceeds the combat EXP earned (only the held class gains) | engineering | max <= 0 EXP | a10-p1.6-g100|L50|cycles-1|no-train | 0 | pass |
| H-S2-05 | With training, mastery never exceeds the combat EXP earned (only the held class gains) | engineering | max <= 0 EXP | a10-p1.6-g100|L50|cycles-1|train | 0 | pass |
| H-S2-05 | With training, mastery never exceeds the combat EXP earned (only the held class gains) | engineering | max <= 0 EXP | a10-p1.6-g100|L50|cycles-5|no-train | 0 | pass |
| H-S2-05 | With training, mastery never exceeds the combat EXP earned (only the held class gains) | engineering | max <= 0 EXP | a10-p1.6-g100|L50|cycles-5|train | 0 | pass |
| H-S2-05 | With training, mastery never exceeds the combat EXP earned (only the held class gains) | engineering | max <= 0 EXP | a10-p1.6-g100|L50|cycles-20|no-train | 0 | pass |
| H-S2-05 | With training, mastery never exceeds the combat EXP earned (only the held class gains) | engineering | max <= 0 EXP | a10-p1.6-g100|L50|cycles-20|train | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L50|cycles-1|no-train | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L50|cycles-1|train | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L50|cycles-5|no-train | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L50|cycles-5|train | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L50|cycles-20|no-train | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L50|cycles-20|train | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | switchesAccepted | switchesRequested | masteryTotal | masteryMinusCombatExp | recordsSum | legionExpTotal | goldSpent | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L50|cycles-1|no-train | model-output (diagnostic) | 4 / 4 / 4 | 4 / 4 / 4 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L50|cycles-1|train | model-output (diagnostic) | 4 / 4 / 4 | 4 / 4 / 4 | 1200 / 1200 / 1200 | 0 / 0 / 0 | 5 / 5 / 5 | 1200 / 1200 / 1200 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L50|cycles-5|no-train | model-output (diagnostic) | 20 / 20 / 20 | 20 / 20 / 20 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1600 / 1600 / 1600 | 0 / 0 / 0 |
| a10-p1.6-g100|L50|cycles-5|train | model-output (diagnostic) | 20 / 20 / 20 | 20 / 20 / 20 | 3760 / 3760 / 3760 | 0 / 0 / 0 | 15 / 15 / 15 | 3760 / 3760 / 3760 | 1600 / 1600 / 1600 | 0 / 0 / 0 |
| a10-p1.6-g100|L50|cycles-20|no-train | model-output (diagnostic) | 80 / 80 / 80 | 80 / 80 / 80 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 7600 / 7600 / 7600 | 0 / 0 / 0 |
| a10-p1.6-g100|L50|cycles-20|train | model-output (diagnostic) | 80 / 80 / 80 | 80 / 80 / 80 | 13360 / 13360 / 13360 | 0 / 0 / 0 | 26 / 26 / 26 | 13360 / 13360 / 13360 | 7600 / 7600 / 7600 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

600 runs, 4663000 checks, **0 violations**.

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- Gold for the switches is credited by a diagnostic transaction before the run (S2-E04 only).

