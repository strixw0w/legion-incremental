# S2-E09-hindsight-search

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** With hindsight and a bounded budget, how much better than the realistic policies can a squad / worker / zone plan do, per objective?

**Design.** ORC2-SEARCH for each objective (hero EXP, legion EXP, gold held, conquest) against POL2-SQUAD, POL2-WORKERS and POL2-MIXED on the same seeds, PR-BAL, 50 replicates. Budget per decision: 12 candidates (3 modes x frontier or a fixed zone), horizon 10 min, at most 360 forks per run, decisions at most once per minute.

**Seeds:** root `S2-E09`, 50 replicates per cell. **Semantic fingerprint:** `0dc8463e65cdac3cb642b9a6de22e8ca4ea1a4db6d1764f565ce8d74d0c2cc00` (manifest SHA-256 `0ee1b60ddd80811324148fa3c8408c18f061f771b943a729b1267b04718192b7`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|ORC2-SEARCH-gold | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|ORC2-SEARCH-conquest | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 0 | pass |
| H-S2-06 | The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL2-MIXED | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | expTotal | legionExpTotal | goldHeld | conquestScore | searchForks | searchDecisions | searchBudgetExhausted | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp | model-output (oracle) | 44302 / 44412 / 44478 | 174548 / 174988 / 175252 | 11556 / 11586 / 11604 | 3001002161 / 3001002166 / 3001002169 | 333 / 345 / 345 | 30 / 31 / 31 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp | model-output (oracle) | 44302 / 44412 / 44478 | 174548 / 174988 / 175252 | 11556 / 11586 / 11604 | 3001002161 / 3001002166 / 3001002169 | 333 / 345 / 345 | 30 / 31 / 31 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-gold | model-output (oracle) | 13456 / 13526 / 13636 | 45100 / 45250 / 45430 | 11948 / 11993 / 12040 | 3000005818 / 3000005837 / 3000005850 | 225 / 225 / 225 | 22 / 22 / 22 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-conquest | model-output (oracle) | 10728 / 11100 / 11144 | 47702 / 48270 / 48426 | 11854 / 11931 / 11968 | 3001006075 / 3001006099 / 3001006222 | 186 / 186 / 186 | 18 / 18 / 18 | 0 / 0 / 0 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-SQUAD | model-output (realistic) | 44302 / 44412 / 44478 | 174548 / 174988 / 175252 | 11556 / 11586 / 11604 | 3001002161 / 3001002166 / 3001002169 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-WORKERS | model-output (realistic) | 12982 / 13110 / 13174 | 45014 / 45108 / 45270 | 12193 / 12221 / 12266 | 3001005553 / 3001005563 / 3001005574 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL2-MIXED | model-output (realistic) | 25206 / 25316 / 25448 | 73220 / 73494 / 73750 | 13066 / 13117 / 13156 | 3001004406 / 3001004416 / 3001004423 | — | — | — | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

350 runs, 51011656 checks, **0 violations**.

## Hindsight search against realistic policies (B4)

| Search | Objective | Metric | Realistic | Search mean (oracle, hindsight) | Realistic mean | Ratio |
|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp | heroExp | expTotal | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 44396.6 | 44396.6 | 1 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp | heroExp | expTotal | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 44396.6 | 13090.5 | 3.392 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-heroExp | heroExp | expTotal | a10-p1.6-g100|PR-BAL|POL2-MIXED | 44396.6 | 25328.3 | 1.753 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp | legionExp | legionExpTotal | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 174926.4 | 174926.4 | 1 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp | legionExp | legionExpTotal | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 174926.4 | 45125.9 | 3.876 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-legionExp | legionExp | legionExpTotal | a10-p1.6-g100|PR-BAL|POL2-MIXED | 174926.4 | 73491.7 | 2.380 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-gold | gold | goldHeld | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 12006.6 | 11581.8 | 1.037 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-gold | gold | goldHeld | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 12006.6 | 12225.1 | 0.982 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-gold | gold | goldHeld | a10-p1.6-g100|PR-BAL|POL2-MIXED | 12006.6 | 13114.2 | 0.916 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-conquest | conquest | conquestScore | a10-p1.6-g100|PR-BAL|POL2-SQUAD | 3001006129.6 | 3001002165.3 | 1.000 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-conquest | conquest | conquestScore | a10-p1.6-g100|PR-BAL|POL2-WORKERS | 3001006129.6 | 3001005564.3 | 1.000 |
| a10-p1.6-g100|PR-BAL|ORC2-SEARCH-conquest | conquest | conquestScore | a10-p1.6-g100|PR-BAL|POL2-MIXED | 3001006129.6 | 3001004415.5 | 1.000 |

The ratio is a lower bound on what hindsight could gain over the realistic policy; it is not an upper bound.

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- The search uses hidden information (future random draws). It reports the best feasible outcome found within its budget, never a proven optimum or an upper bound (B4).

