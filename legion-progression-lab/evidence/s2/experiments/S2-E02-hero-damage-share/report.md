# S2-E02-hero-damage-share

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** What share of the squad damage does the hero deal, by hero class, recruit composition and passive or attentive ability use?

**Design.** Matched state: every character level 10 (frozen), zone 2, squad of three recruits. Hero class Warrior / Archer / Mage x composition all-Warrior / all-Archer / all-Mage / mixed x passive / attentive (the hero casts whenever ready). 30 min, 100 replicates.

**Seeds:** root `S2-E02`, 100 replicates per cell. **Semantic fingerprint:** `ca7de4c25f6653d56a5d59cb833fced9e4b121bb98a3fc66f875682678ff7ad0` (manifest SHA-256 `02ad2d3f4702657de0d9cdd0ca4fb3507c72d0eaaddd226430bade0d82262a37`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-03 | The hero damage share is 30-60% for balanced builds (band unapproved) | target | p50 in [0.3, 0.6] share | a10-p1.6-g100|L10-Z2|hero-warrior|mixed|passive | 0.141 | miss |
| H-S2-03 | The hero damage share is 30-60% for balanced builds (band unapproved) | target | p50 in [0.3, 0.6] share | a10-p1.6-g100|L10-Z2|hero-archer|mixed|passive | 0.200 | miss |
| H-S2-03 | The hero damage share is 30-60% for balanced builds (band unapproved) | target | p50 in [0.3, 0.6] share | a10-p1.6-g100|L10-Z2|hero-mage|mixed|passive | 0.185 | miss |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|all-W|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|all-W|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|all-A|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|all-A|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|all-M|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|all-M|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|mixed|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-warrior|mixed|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|all-W|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|all-W|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|all-A|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|all-A|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|all-M|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|all-M|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|mixed|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-archer|mixed|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|all-W|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|all-W|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|all-A|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|all-A|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|all-M|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|all-M|attentive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|mixed|passive | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|L10-Z2|hero-mage|mixed|attentive | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | heroDamageShare | heroAbilityDamageShare | killsPerHour | legionExpPerHour | memberKnockoutsPerHour | deathsPerHour | invariantViolations |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L10-Z2|hero-warrior|all-W|passive | model-output (diagnostic) | 0.20 / 0.20 / 0.20 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-W|attentive | model-output (diagnostic) | 0.25 / 0.25 / 0.25 | 0.06 / 0.06 / 0.06 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-A|passive | model-output (diagnostic) | 0.12 / 0.12 / 0.12 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-A|attentive | model-output (diagnostic) | 0.15 / 0.15 / 0.15 | 0.04 / 0.04 / 0.04 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-M|passive | model-output (diagnostic) | 0.13 / 0.13 / 0.13 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-M|attentive | model-output (diagnostic) | 0.16 / 0.16 / 0.16 | 0.04 / 0.04 / 0.04 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-warrior|mixed|passive | model-output (diagnostic) | 0.14 / 0.14 / 0.14 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-warrior|mixed|attentive | model-output (diagnostic) | 0.18 / 0.18 / 0.18 | 0.04 / 0.05 / 0.05 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|all-W|passive | model-output (diagnostic) | 0.27 / 0.28 / 0.28 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|all-W|attentive | model-output (diagnostic) | 0.38 / 0.38 / 0.38 | 0.14 / 0.15 / 0.15 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|all-A|passive | model-output (diagnostic) | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|all-A|attentive | model-output (diagnostic) | 0.25 / 0.25 / 0.25 | 0.09 / 0.10 / 0.10 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|all-M|passive | model-output (diagnostic) | 0.18 / 0.18 / 0.18 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|all-M|attentive | model-output (diagnostic) | 0.26 / 0.26 / 0.27 | 0.10 / 0.10 / 0.10 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|mixed|passive | model-output (diagnostic) | 0.20 / 0.20 / 0.20 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-archer|mixed|attentive | model-output (diagnostic) | 0.29 / 0.29 / 0.29 | 0.11 / 0.11 / 0.11 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|all-W|passive | model-output (diagnostic) | 0.26 / 0.26 / 0.26 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|all-W|attentive | model-output (diagnostic) | 0.36 / 0.36 / 0.36 | 0.14 / 0.14 / 0.14 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|all-A|passive | model-output (diagnostic) | 0.16 / 0.16 / 0.16 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|all-A|attentive | model-output (diagnostic) | 0.23 / 0.24 / 0.24 | 0.09 / 0.09 / 0.09 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|all-M|passive | model-output (diagnostic) | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|all-M|attentive | model-output (diagnostic) | 0.25 / 0.25 / 0.25 | 0.10 / 0.10 / 0.10 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|mixed|passive | model-output (diagnostic) | 0.18 / 0.19 / 0.19 | 0 / 0 / 0 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|L10-Z2|hero-mage|mixed|attentive | model-output (diagnostic) | 0.27 / 0.27 / 0.27 | 0.11 / 0.11 / 0.11 | 2390 / 2390 / 2390 | 95600 / 95600 / 95600 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

2400 runs, 97512000 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|L10-Z2|hero-warrior|all-W|passive | 3 | 1721.6 | approximate | 2390 | -28.0% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-W|attentive | 3 | 1758.5 | approximate | 2390 | -26.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-A|passive | 3 | 2078.7 | approximate | 2390 | -13.0% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-A|attentive | 3 | 2089.4 | approximate | 2390 | -12.6% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-M|passive | 3 | 2005.6 | approximate | 2390 | -16.1% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-warrior|all-M|attentive | 3 | 2022.0 | approximate | 2390 | -15.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-warrior|mixed|passive | 3 | 1961.6 | approximate | 2390 | -17.9% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-warrior|mixed|attentive | 3 | 1980.3 | approximate | 2390 | -17.1% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|all-W|passive | 3 | 1832.9 | approximate | 2390 | -23.3% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|all-W|attentive | 3 | 1907.8 | approximate | 2390 | -20.2% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|all-A|passive | 3 | 2117.9 | approximate | 2390 | -11.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|all-A|attentive | 3 | 2146.8 | approximate | 2390 | -10.2% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|all-M|passive | 3 | 2066.6 | approximate | 2390 | -13.5% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|all-M|attentive | 3 | 2110.0 | approximate | 2390 | -11.7% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|mixed|passive | 3 | 2024.8 | approximate | 2390 | -15.3% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-archer|mixed|attentive | 3 | 2069.6 | approximate | 2390 | -13.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|all-W|passive | 3 | 1757.8 | approximate | 2390 | -26.5% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|all-W|attentive | 3 | 1854.6 | approximate | 2390 | -22.4% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|all-A|passive | 3 | 2097.5 | approximate | 2390 | -12.2% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|all-A|attentive | 3 | 2135.1 | approximate | 2390 | -10.7% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|all-M|passive | 3 | 2037.9 | approximate | 2390 | -14.7% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|all-M|attentive | 3 | 2097.4 | approximate | 2390 | -12.2% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|mixed|passive | 3 | 1988.6 | approximate | 2390 | -16.8% | not reached | not reached | — |
| a10-p1.6-g100|L10-Z2|hero-mage|mixed|attentive | 3 | 2047.2 | approximate | 2390 | -14.3% | not reached | not reached | — |

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- Talents are allocated in full by the fixed POL2 priority (9 points at level 10). No class is tuned to pass (owner section 9).

