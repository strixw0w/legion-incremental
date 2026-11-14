# S2-E08-first-recruit-timing

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** When does the first recruit arrive, for quest sizes 25 / 40 / 60, and how do recruits change level-5 and zone timing?

**Design.** Quest Q1 size 25, 40 or 60 x realistic POL2-SQUAD-W, POL2-WORKERS, POL2-MIXED x PR-NEW and PR-BAL, 100 replicates.

**Seeds:** root `S2-E08`, 100 replicates per cell. **Semantic fingerprint:** `9e6384f355a11b79495d9d9312d5bd93f2cfb16087183d69ca2d32df7877b017` (manifest SHA-256 `f2519f9195cffa97ffc1bba428a17c155c3aa888ad2b999a669209f5abbb8a41`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 2.088 | pass |
| H-S2-01 | First recruit in 2-5 active minutes | target | p50 in [2, 5] min | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 2.088 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 10.400 | reported |
| H-S1-01 | First kill within 30 s for a newcomer | reported | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 10.400 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 3 | reported |
| H-S1-02 | Level 2 after 1-3 kills | reported | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 3 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 2.400 | reported |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 2.400 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 3 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 1.300 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 3 | reported |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | reported | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 1.300 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 1 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 4 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 3 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 1 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 4 | reported |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | reported | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 3 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 3.885 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 3.962 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 3.885 | reported |
| H-S1-05 | First new zone first-visited in 5-10 active min | reported | p50 in [5, 10] min | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 3.962 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 1.114 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 5.399 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 1.347 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 1.114 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 5.399 | reported |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | reported | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 1.347 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 2.448 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 2.328 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 2.448 | reported |
| H-S1-07a | Level 5 in 3-5 min (single-hero target; recruits change this) | reported | p50 in [3, 5] min | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 2.328 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 7.383 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 11.243 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 7.987 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 7.383 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 11.243 | reported |
| H-S1-07b | Level 10 in 10-20 min (single-hero target; recruits change this) | reported | p50 in [10, 20] min | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 7.987 | reported |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q25 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q25 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q25 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q25 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q25 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q25 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q60 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q60 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-NEW|POL2-MIXED|Q60 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q60 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q60 | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-MIXED|Q60 | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | firstRecruitMin | recruit2Min | minToL5 | minToL10 | zone2FirstVisitMin | zone3FirstVisitMin | firstKillS | killsToL2 | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q25 | model-output (realistic) | 1.39 / 1.41 / 1.43 | 4.51 / 4.56 / 4.60 | 2.01 / 2.03 / 2.05 | 7.00 / 7.08 / 7.15 | 3.64 / 3.66 / 3.68 | 7.99 / 8.07 / 8.13 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q25 | model-output (realistic) | 1.39 / 1.41 / 1.43 | 4.33 / 4.38 / 4.43 | 2.43 / 2.45 / 2.47 | 11.11 / 11.20 / 11.29 | 3.52 / 3.58 / 3.63 | 24.71 / 24.88 / 24.99 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-MIXED|Q25 | model-output (realistic) | 1.39 / 1.41 / 1.43 | 4.51 / 4.56 / 4.60 | 2.01 / 2.03 / 2.05 | 7.61 / 7.67 / 7.74 | 3.64 / 3.66 / 3.68 | 8.92 / 8.97 / 9.05 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q25 | model-output (realistic) | 1.39 / 1.41 / 1.43 | 4.51 / 4.56 / 4.60 | 2.01 / 2.03 / 2.05 | 7.00 / 7.08 / 7.15 | 3.64 / 3.66 / 3.68 | 7.99 / 8.07 / 8.13 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q25 | model-output (realistic) | 1.39 / 1.41 / 1.43 | 4.33 / 4.38 / 4.43 | 2.43 / 2.45 / 2.47 | 11.11 / 11.20 / 11.29 | 3.52 / 3.58 / 3.63 | 24.71 / 24.88 / 24.99 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-MIXED|Q25 | model-output (realistic) | 1.39 / 1.41 / 1.43 | 4.51 / 4.56 / 4.60 | 2.01 / 2.03 / 2.05 | 7.61 / 7.67 / 7.74 | 3.64 / 3.66 / 3.68 | 8.92 / 8.97 / 9.05 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q40 | model-output (realistic) | 2.07 / 2.09 / 2.11 | 4.82 / 4.87 / 4.91 | 2.31 / 2.33 / 2.35 | 7.31 / 7.38 / 7.46 | 3.94 / 3.96 / 3.98 | 8.29 / 8.37 / 8.44 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q40 | model-output (realistic) | 2.07 / 2.09 / 2.11 | 4.62 / 4.68 / 4.74 | 2.43 / 2.45 / 2.47 | 11.04 / 11.24 / 11.32 | 3.84 / 3.88 / 3.94 | 24.67 / 24.92 / 25.04 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-MIXED|Q40 | model-output (realistic) | 2.07 / 2.09 / 2.11 | 4.82 / 4.87 / 4.91 | 2.31 / 2.33 / 2.35 | 7.93 / 7.99 / 8.04 | 3.94 / 3.96 / 3.98 | 9.24 / 9.29 / 9.34 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q40 | model-output (realistic) | 2.07 / 2.09 / 2.11 | 4.82 / 4.87 / 4.91 | 2.31 / 2.33 / 2.35 | 7.31 / 7.38 / 7.46 | 3.94 / 3.96 / 3.98 | 8.29 / 8.37 / 8.44 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q40 | model-output (realistic) | 2.07 / 2.09 / 2.11 | 4.62 / 4.68 / 4.74 | 2.43 / 2.45 / 2.47 | 11.04 / 11.24 / 11.32 | 3.84 / 3.88 / 3.94 | 24.67 / 24.92 / 25.04 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-MIXED|Q40 | model-output (realistic) | 2.07 / 2.09 / 2.11 | 4.82 / 4.87 / 4.91 | 2.31 / 2.33 / 2.35 | 7.93 / 7.99 / 8.04 | 3.94 / 3.96 / 3.98 | 9.24 / 9.29 / 9.34 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-SQUAD-W|Q60 | model-output (realistic) | 2.88 / 2.93 / 2.95 | 5.13 / 5.17 / 5.21 | 2.43 / 2.45 / 2.47 | 7.62 / 7.70 / 7.76 | 4.21 / 4.26 / 4.29 | 8.60 / 8.68 / 8.75 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-WORKERS|Q60 | model-output (realistic) | 2.88 / 2.93 / 2.95 | 4.95 / 5.03 / 5.10 | 2.43 / 2.45 / 2.47 | 11.07 / 11.15 / 11.23 | 4.16 / 4.21 / 4.27 | 24.70 / 24.96 / 25.10 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL2-MIXED|Q60 | model-output (realistic) | 2.88 / 2.93 / 2.95 | 5.13 / 5.17 / 5.21 | 2.43 / 2.45 / 2.47 | 8.23 / 8.30 / 8.35 | 4.21 / 4.26 / 4.29 | 9.54 / 9.60 / 9.67 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-SQUAD-W|Q60 | model-output (realistic) | 2.88 / 2.93 / 2.95 | 5.13 / 5.17 / 5.21 | 2.43 / 2.45 / 2.47 | 7.62 / 7.70 / 7.76 | 4.21 / 4.26 / 4.29 | 8.60 / 8.68 / 8.75 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-WORKERS|Q60 | model-output (realistic) | 2.88 / 2.93 / 2.95 | 4.95 / 5.03 / 5.10 | 2.43 / 2.45 / 2.47 | 11.07 / 11.15 / 11.23 | 4.16 / 4.21 / 4.27 | 24.70 / 24.96 / 25.10 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-MIXED|Q60 | model-output (realistic) | 2.88 / 2.93 / 2.95 | 5.13 / 5.17 / 5.21 | 2.43 / 2.45 / 2.47 | 8.23 / 8.30 / 8.35 | 4.21 / 4.26 / 4.29 | 9.54 / 9.60 / 9.67 | 9.20 / 10.40 / 10.40 | 3 / 3 / 3 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

1800 runs, 261579980 checks, **0 violations**.

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- H-S2-07 (how recruits change level-5 and zone timing) is reported in analysis B6 against the S1.1 control.

