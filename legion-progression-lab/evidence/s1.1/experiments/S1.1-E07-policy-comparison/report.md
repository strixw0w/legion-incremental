# S1.1-E07-policy-comparison

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** With corrected triggers, how do the corrected realistic policies, the S1 controls and the trigger-fixed ORC-BRUTE compare? (ORC-BRUTE is a restricted lookahead, not an upper bound.)

**Design.** As S1-E08: base, PR-BAL, 200 replicates, S1-E08 seed root; corrected POL-*, S1 controls CTL-*-S1 (each with estimator v1.1 and the S1 control estimator) and ORC-BRUTE (trigger handling fixed; one cell, it reads no estimate). Controls with the S1 estimator must reproduce S1-E08's realistic rows exactly (engineering gate A1).

**Seeds:** root `S1-E08`, 200 replicates per cell (replicate i uses `S1-E08#rep-i`).

**Semantic fingerprint:** `a8a931018a94498fcf2e60990057b3f9b159837d462c444e40f5b47807567506` (manifest SHA-256 `199d07e8adf1a7b441d82cb289794b1c330344043bb85312a1692e1bd40a2830`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | expTotal | levelAt60 | zone3FirstVisitMin | deathsPerHour | killsPerHour | autoFarmStops | policyStopReports | activeManualMin |
|---|---|---|---|---|---|---|---|---|---|
| base|PR-BAL|POL-FRONTIER|est-s1.1 | model-output (realistic) | 8178 / 8200 / 8244 | 19 / 19 / 19 | 37.98 / 38.12 / 38.26 | 0 / 0 / 0 | 693 / 694 / 696 | 0 / 0 / 0 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 |
| base|PR-BAL|POL-FRONTIER|est-s1 | model-output (realistic) | 8178 / 8200 / 8244 | 19 / 19 / 19 | 37.98 / 38.12 / 38.26 | 0 / 0 / 0 | 693 / 694 / 696 | 0 / 0 / 0 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 |
| base|PR-BAL|POL-STAY|est-s1.1 | model-output (realistic) | 7364 / 7386 / 7430 | 18 / 18 / 18 | 16.25 / 16.33 / 16.43 | 0 / 0 / 0 | 482 / 483 / 485 | 0 / 0 / 0 | 0 / 0 / 0 | 8.48 / 8.60 / 8.63 |
| base|PR-BAL|POL-STAY|est-s1 | model-output (realistic) | 7364 / 7386 / 7430 | 18 / 18 / 18 | 16.25 / 16.33 / 16.43 | 0 / 0 / 0 | 482 / 483 / 485 | 0 / 0 / 0 | 0 / 0 / 0 | 8.48 / 8.60 / 8.63 |
| base|PR-BAL|POL-BEST-SHOWN|est-s1.1 | model-output (realistic) | 9290 / 9320 / 9340 | 20 / 20 / 20 | not reached / not reached / not reached | 0 / 0 / 0 | 1787 / 1790 / 1792 | 0 / 0 / 0 | 0 / 0 / 0 | 1.83 / 1.83 / 1.83 |
| base|PR-BAL|POL-BEST-SHOWN|est-s1 | model-output (realistic) | 9290 / 9320 / 9340 | 20 / 20 / 20 | not reached / not reached / not reached | 0 / 0 / 0 | 1787 / 1790 / 1792 | 0 / 0 / 0 | 0 / 0 / 0 | 1.83 / 1.83 / 1.83 |
| base|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | model-output (control) | 8178 / 8200 / 8244 | 19 / 19 / 19 | 37.98 / 38.12 / 38.26 | 0 / 0 / 0 | 693 / 694 / 696 | 0 / 0 / 0 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 |
| base|PR-BAL|CTL-FRONTIER-S1|est-s1 | model-output (control) | 8178 / 8200 / 8244 | 19 / 19 / 19 | 37.98 / 38.12 / 38.26 | 0 / 0 / 0 | 693 / 694 / 696 | 0 / 0 / 0 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 |
| base|PR-BAL|CTL-STAY-S1|est-s1.1 | model-output (control) | 6990 / 7034 / 7100 | 18 / 18 / 18 | 16.17 / 16.28 / 16.41 | 36 / 36 / 36 | 465 / 467 / 470 | 34 / 34 / 34 | 0 / 0 / 0 | 3.50 / 3.50 / 3.50 |
| base|PR-BAL|CTL-STAY-S1|est-s1 | model-output (control) | 6990 / 7034 / 7100 | 18 / 18 / 18 | 16.17 / 16.28 / 16.41 | 36 / 36 / 36 | 465 / 467 / 470 | 34 / 34 / 34 | 0 / 0 / 0 | 3.50 / 3.50 / 3.50 |
| base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | model-output (control) | 9280 / 9320 / 9380 | 20 / 20 / 20 | not reached / not reached / not reached | 3 / 4 / 4 | 1786 / 1790 / 1796 | 1 / 2 / 2 | 0 / 0 / 0 | 1.08 / 1.17 / 1.17 |
| base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | model-output (control) | 9280 / 9320 / 9380 | 20 / 20 / 20 | not reached / not reached / not reached | 3 / 4 / 4 | 1786 / 1790 / 1796 | 1 / 2 / 2 | 0 / 0 / 0 | 1.08 / 1.17 / 1.17 |
| base|PR-BAL|ORC-BRUTE|est-s1.1 | model-output (oracle) | 8850 / 8890 / 8930 | 20 / 20 / 20 | not reached / not reached / not reached | 13 / 13 / 13 | 945 / 949 / 953 | 3 / 3 / 3 | 0 / 0 / 0 | 0.58 / 0.58 / 0.58 |

## Policy bound (oracle / realistic, mean total EXP; informational)

| Variant | Profile | Oracle | Realistic | Oracle mean EXP (model-output, oracle) | Realistic mean EXP (model-output, realistic) | Ratio |
|---|---|---|---|---|---|---|
| base | PR-BAL | ORC-BRUTE | POL-FRONTIER | 8886.8 | 8208.7 | 1.083 |
| base | PR-BAL | ORC-BRUTE | POL-STAY | 8886.8 | 7393.1 | 1.202 |
| base | PR-BAL | ORC-BRUTE | POL-BEST-SHOWN | 8886.8 | 9315.8 | 0.954 |
| base | PR-BAL | ORC-BRUTE | CTL-FRONTIER-S1 | 8886.8 | 8208.7 | 1.083 |
| base | PR-BAL | ORC-BRUTE | CTL-STAY-S1 | 8886.8 | 7042.8 | 1.262 |
| base | PR-BAL | ORC-BRUTE | CTL-BEST-SHOWN-S1 | 8886.8 | 9326.1 | 0.953 |

## Notes and limitations

- S1.1 correction pass (owner review 'Independent S1 Review and S1.1 Authorisation'). Single-character diagnostic model; no recruits, classes, abilities, gear, sinks, offline progress or Monuments.
- All inputs are candidates (content w1-slice.candidate.v0.1.0, unchanged; owner resolutions S1-R01..R17; S1.1 rules S1.1-R01..R15); every output is model-output, not live-validated.
- Policies: POL-* are the corrected S1.1 realistic policies; CTL-*-S1 are the S1 decision logic kept as diagnostic controls; ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control, never an upper bound.
- Seeds: the same seed roots as the corresponding S1 experiments, so S1, controls and corrected policies face the same random draws.
- Ratios oracle / realistic are reported as a comparison with a restricted search, never as a gap to the optimum.

