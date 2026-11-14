# S2-E01-deploy-scaling

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** How do deploying 0, 1, 2 or 3 recruits change progression, legion EXP and the hero damage share?

**Design.** Realistic POL2 with at most k deployed (k = 0..3, undeployed recruits idle so only deployment varies), PR-BAL and PR-OPT; plus frozen-level matched cells (all level 10, zone 2, Archer hero, mixed Warrior / Archer / Mage recruits, 30 min). 100 replicates.

**Seeds:** root `S2-E01`, 100 replicates per cell. **Semantic fingerprint:** `6c434caa321dfcb56a6245d80e94a5c73226fb481d9ed8dad9edff7c5897fb58` (manifest SHA-256 `1f2b6f01c15e2fdefc42df24d697798b18b0cc7628bf4505a6e95848dfe024b7`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 2.088 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 10.400 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 3 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 2.400 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 3 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 3 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 1.300 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 4 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 3 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 1 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 1 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 4 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 3 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 1 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 1 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 4.815 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 4.815 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 3.962 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 4.191 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 1.347 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 1.113 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 1.113 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 4.191 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 1.347 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 1.113 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 1.113 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 2.448 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 2.448 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 2.328 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 11.277 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 7.985 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 7.375 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 7.375 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 11.277 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 7.985 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 7.375 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 7.375 | reported |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|matched-L10-Z2|squad-0 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|matched-L10-Z2|squad-1 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|matched-L10-Z2|squad-2 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|matched-L10-Z2|squad-3 | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | firstRecruitMin | recruit2Min | recruit3Min | minToL5 | minToL10 | zone2FirstVisitMin | zone3FirstVisitMin | levelAt45 | levelAt60 | expTotal | legionExpTotal | legionExpPerHour | heroDamageShare | memberKnockoutsPerHour | deathsPerHour | goldPerHour | invariantViolations | killsPerHour |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-0 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 6.07 / 6.14 / 6.22 | 14.36 / 14.56 / 14.74 | 2.41 / 2.45 / 2.47 | 11.16 / 11.28 / 11.36 | 4.75 / 4.82 / 4.88 | 24.79 / 24.96 / 25.24 | 20 / 20 / 20 | 23 / 23 / 23 | 12974 / 13062 / 13172 | 12974 / 13062 / 13172 | 12974 / 13062 / 13172 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 3628 / 3652 / 3682 | 0 / 0 / 0 | 869 / 873 / 878 |
| a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-1 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 4.81 / 4.86 / 4.90 | 10.46 / 10.52 / 10.58 | 2.29 / 2.33 / 2.35 | 7.93 / 7.99 / 8.04 | 3.92 / 3.96 / 3.98 | 9.23 / 9.29 / 9.35 | 25 / 25 / 25 | 29 / 29 / 29 | 25206 / 25360 / 25448 | 49922 / 50230 / 50406 | 49922 / 50230 / 50406 | 0.55 / 0.55 / 0.55 | 3 / 3 / 3 | 0 / 0 / 0 | 6898 / 6940 / 6964 | 0 / 0 / 0 | 1293 / 1300 / 1304 |
| a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-2 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 4.81 / 4.86 / 4.90 | 9.12 / 9.19 / 9.26 | 2.29 / 2.33 / 2.35 | 7.30 / 7.38 / 7.45 | 3.92 / 3.96 / 3.98 | 8.29 / 8.36 / 8.43 | 30 / 30 / 30 | 35 / 35 / 35 | 39418 / 39594 / 39748 | 117524 / 118052 / 118514 | 117524 / 118052 / 118514 | 0.29 / 0.29 / 0.29 | 0 / 0 / 0 | 0 / 0 / 0 | 10774 / 10822 / 10864 | 0 / 0 / 0 | 1939 / 1947 / 1954 |
| a10-p1.6-g100|PR-BAL|POL2-SQUAD|deploy-3 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 4.81 / 4.86 / 4.90 | 9.12 / 9.19 / 9.26 | 2.29 / 2.33 / 2.35 | 7.30 / 7.38 / 7.45 | 3.92 / 3.96 / 3.98 | 8.29 / 8.36 / 8.43 | 32 / 32 / 32 | 36 / 37 / 37 | 44324 / 44412 / 44544 | 174636 / 174988 / 175516 | 174636 / 174988 / 175516 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 | 0 / 0 / 0 | 12112 / 12136 / 12172 | 0 / 0 / 0 | 2162 / 2166 / 2172 |
| a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-0 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 6.07 / 6.14 / 6.22 | 14.36 / 14.56 / 14.74 | 2.41 / 2.45 / 2.47 | 11.16 / 11.28 / 11.36 | 4.75 / 4.82 / 4.88 | 24.79 / 24.96 / 25.24 | 20 / 20 / 20 | 23 / 23 / 23 | 22698 / 22808 / 22918 | 22698 / 22808 / 22918 | 15132 / 15205.33 / 15278.67 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | 4186.67 / 4206.67 / 4226.67 | 0 / 0 / 0 | 874 / 877.33 / 880.67 |
| a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-1 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 4.81 / 4.86 / 4.90 | 10.46 / 10.52 / 10.58 | 2.29 / 2.33 / 2.35 | 7.93 / 7.99 / 8.04 | 3.92 / 3.96 / 3.98 | 9.23 / 9.29 / 9.35 | 25 / 25 / 25 | 29 / 29 / 29 | 43158 / 43378 / 43510 | 85848 / 86266 / 86508 | 57232 / 57510.67 / 57672 | 0.56 / 0.56 / 0.56 | 2 / 2 / 2 | 0 / 0 / 0 | 7862.67 / 7902.67 / 7926.67 | 0 / 0 / 0 | 1406 / 1412.67 / 1416.67 |
| a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-2 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 4.81 / 4.86 / 4.90 | 9.12 / 9.19 / 9.26 | 2.29 / 2.33 / 2.35 | 7.30 / 7.38 / 7.45 | 3.92 / 3.96 / 3.98 | 8.29 / 8.36 / 8.43 | 30 / 30 / 30 | 35 / 35 / 35 | 65818 / 65994 / 66148 | 196724 / 197252 / 197714 | 131149.33 / 131501.33 / 131809.33 | 0.28 / 0.28 / 0.28 | 0 / 0 / 0 | 0 / 0 / 0 | 11982.67 / 12014.67 / 12042.67 | 0 / 0 / 0 | 2092.67 / 2098 / 2102.67 |
| a10-p1.6-g100|PR-OPT|POL2-SQUAD|deploy-3 | model-output (realistic) | 2.05 / 2.09 / 2.11 | 4.81 / 4.86 / 4.90 | 9.12 / 9.19 / 9.26 | 2.29 / 2.33 / 2.35 | 7.30 / 7.38 / 7.45 | 3.92 / 3.96 / 3.98 | 8.29 / 8.36 / 8.43 | 32 / 32 / 32 | 36 / 37 / 37 | 70724 / 70812 / 70944 | 280236 / 280588 / 281116 | 186824 / 187058.67 / 187410.67 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 | 0 / 0 / 0 | 12874.67 / 12890.67 / 12914.67 | 0 / 0 / 0 | 2241.33 / 2244 / 2248 |
| a10-p1.6-g100|matched-L10-Z2|squad-0 | model-output (diagnostic) | — | — | — | — | — | — | — | — | — | — | — | 10240 / 10320 / 10420 | 1 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | — | 0 / 0 / 0 | 1024 / 1032 / 1042 |
| a10-p1.6-g100|matched-L10-Z2|squad-1 | model-output (diagnostic) | — | — | — | — | — | — | — | — | — | — | — | 31920 / 31920 / 32000 | 0.64 / 0.64 / 0.64 | 0 / 0 / 0 | 0 / 0 / 0 | — | 0 / 0 / 0 | 1596 / 1596 / 1600 |
| a10-p1.6-g100|matched-L10-Z2|squad-2 | model-output (diagnostic) | — | — | — | — | — | — | — | — | — | — | — | 71700 / 71700 / 71700 | 0.28 / 0.29 / 0.29 | 0 / 0 / 0 | 0 / 0 / 0 | — | 0 / 0 / 0 | 2390 / 2390 / 2390 |
| a10-p1.6-g100|matched-L10-Z2|squad-3 | model-output (diagnostic) | — | — | — | — | — | — | — | — | — | — | — | 95600 / 95600 / 95600 | 0.20 / 0.20 / 0.20 | 0 / 0 / 0 | 0 / 0 / 0 | — | 0 / 0 / 0 | 2390 / 2390 / 2390 |

## Reward-invariant monitor (gate B1)

1200 runs, 66728482 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|matched-L10-Z2|squad-0 | 0 | 1031.6 | reliable | 1032.9 | -0.1% | not reached | not reached | — |
| a10-p1.6-g100|matched-L10-Z2|squad-1 | 1 | 1567.1 | approximate | 1597.2 | -1.9% | not reached | not reached | — |
| a10-p1.6-g100|matched-L10-Z2|squad-2 | 2 | 1903.9 | approximate | 2390 | -20.3% | not reached | not reached | — |
| a10-p1.6-g100|matched-L10-Z2|squad-3 | 3 | 2024.8 | approximate | 2390 | -15.3% | not reached | not reached | — |

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- deploy-0 still recruits (all idle): it shows the hero alone in the S2 engine with S2 spending on.

