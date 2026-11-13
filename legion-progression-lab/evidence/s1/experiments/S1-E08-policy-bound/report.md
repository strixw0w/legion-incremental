# S1-E08-policy-bound

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** How far are realistic policies from the oracle in 60 minutes?

**Design.** PR-BAL; POL-FRONTIER, POL-STAY and POL-BEST-SHOWN against ORC-BRUTE (forks every zone choice at session start, each gate completion and every 5 minutes, with exact future random draws); 200 replicates; ratio of mean total EXP. Informational only.

**Seeds:** root `S1-E08`, 200 replicates per cell (replicate i uses `S1-E08#rep-i`).

**Semantic fingerprint:** `834208a76516056c19cb703e011dba5dc15eb4a32eedacda0900385cf22dde74` (manifest SHA-256 `0161ae21700c7bee9bf1eddc22c71bb2283bde8c7cf9a8fa3fd250ca06dfafbc`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | expTotal | levelAt60 | zone3FirstVisitMin | deathsPerHour | killsPerHour |
|---|---|---|---|---|---|---|
| base|PR-BAL|POL-FRONTIER | model-output (realistic) | 8178 / 8200 / 8244 | 19 / 19 / 19 | 37.98 / 38.12 / 38.26 | 0 / 0 / 0 | 693 / 694 / 696 |
| base|PR-BAL|POL-STAY | model-output (realistic) | 6990 / 7034 / 7100 | 18 / 18 / 18 | 16.17 / 16.28 / 16.41 | 36 / 36 / 36 | 465 / 467 / 470 |
| base|PR-BAL|POL-BEST-SHOWN | model-output (realistic) | 9280 / 9320 / 9380 | 20 / 20 / 20 | not reached / not reached / not reached | 3 / 4 / 4 | 1786 / 1790 / 1796 |
| base|PR-BAL|ORC-BRUTE | model-output (oracle) | 8840 / 8880 / 8928 | 20 / 20 / 20 | not reached / not reached / not reached | 13 / 13 / 13 | 948 / 952 / 957 |

## Policy bound (oracle / realistic, mean total EXP; informational)

| Variant | Profile | Oracle | Realistic | Oracle mean EXP (model-output, oracle) | Realistic mean EXP (model-output, realistic) | Ratio |
|---|---|---|---|---|---|---|
| base | PR-BAL | ORC-BRUTE | POL-FRONTIER | 8882.4 | 8208.7 | 1.082 |
| base | PR-BAL | ORC-BRUTE | POL-STAY | 8882.4 | 7042.8 | 1.261 |
| base | PR-BAL | ORC-BRUTE | POL-BEST-SHOWN | 8882.4 | 9326.1 | 0.952 |

## Notes and limitations

- S1 is a single-character diagnostic model (experiment plan principle 10): no recruits, classes, abilities, gear, sinks, offline progress or Monuments; gold and materials only accumulate.
- All inputs are candidates (content w1-slice.candidate.v0.1.0 and the S1 resolutions S1-R01..R17); every output is model-output, not live-validated.
- Engagement overhead and walk times are the most uncertain inputs (to be measured in M2).
- ORC-BRUTE is an upper bound with hindsight; it is never a target for typical players.

