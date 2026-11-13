# S1.1-E04-survival-policies

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** How do the corrected realistic policies (respect the stop, rest, retreat, report) change survival and farming compared with the S1 logic, across enemy damage levels?

**Design.** Enemy damage x0.5, x1, x1.5, x2 (hero HP per level x1; the S1-E04 variants of those names) x PR-BAL x 3 S1 controls + 3 corrected policies, estimator v1.1, 200 replicates, S1-E04 seed root.

**Seeds:** root `S1-E04`, 200 replicates per cell (replicate i uses `S1-E04#rep-i`).

**Semantic fingerprint:** `ccf0f709f12c037671e2eef082d4cbac961ec6ee09f137e9ab9ff64ccb12678e` (manifest SHA-256 `6a40822eadc459bf9b76254a090b8dbeb9496e38f26bda0bbe61b14026038a0d`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | deathsPerHour | deathDowntimeS | autoFarmStops | levelAt60 | zone3FirstVisitMin | expTotal | killsPerHour | policyStopReports | activeManualMin | zone2FirstVisitMin |
|---|---|---|---|---|---|---|---|---|---|---|---|
| d0.5-h1|PR-BAL|CTL-STAY-S1 | model-output (control) | 20 / 21 / 21 | 260 / 272.30 / 273 | 11 / 12 / 12 | 19 / 19 / 19 | 15.28 / 15.39 / 15.49 | 7716 / 7760 / 7826 | 498 / 500 / 503 | 0 / 0 / 0 | 1.58 / 1.67 / 1.67 | 5.02 / 5.08 / 5.12 |
| d0.5-h1|PR-BAL|CTL-FRONTIER-S1 | model-output (control) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 36.15 / 36.30 / 36.57 | 8640 / 8662 / 8684 | 714 / 715 / 716 | 0 / 0 / 0 | 3.33 / 3.33 / 3.33 | 5.02 / 5.08 / 5.12 |
| d0.5-h1|PR-BAL|CTL-BEST-SHOWN-S1 | model-output (control) | 1 / 1 / 1 | 13 / 13 / 13 | 0 / 0 / 0 | 20 / 20 / 20 | not reached / not reached / not reached | 9440 / 9470 / 9500 | 1787 / 1790 / 1793 | 0 / 0 / 0 | 1 / 1 / 1 | 5.02 / 5.08 / 5.12 |
| d0.5-h1|PR-BAL|POL-STAY | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 15.40 / 15.52 / 15.62 | 7936 / 7980 / 8024 | 508 / 510 / 512 | 0 / 0 / 0 | 5.26 / 5.33 / 5.35 | 5.02 / 5.08 / 5.12 |
| d0.5-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 36.15 / 36.30 / 36.57 | 8640 / 8662 / 8684 | 714 / 715 / 716 | 0 / 0 / 0 | 3.33 / 3.33 / 3.33 | 5.02 / 5.08 / 5.12 |
| d0.5-h1|PR-BAL|POL-BEST-SHOWN | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 20 / 20 / 20 | not reached / not reached / not reached | 9420 / 9440 / 9470 | 1785 / 1787 / 1790 | 0 / 0 / 0 | 1.33 / 1.33 / 1.33 | 5.02 / 5.08 / 5.12 |
| d1-h1|PR-BAL|CTL-STAY-S1 | model-output (control) | 36 / 36 / 36 | 468 / 468 / 468 | 34 / 34 / 34 | 18 / 18 / 18 | 16.17 / 16.28 / 16.40 | 6990 / 7056 / 7100 | 465 / 468 / 470 | 0 / 0 / 0 | 3.50 / 3.50 / 3.50 | 5.02 / 5.08 / 5.12 |
| d1-h1|PR-BAL|CTL-FRONTIER-S1 | model-output (control) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 37.98 / 38.12 / 38.24 | 8178 / 8200 / 8244 | 693 / 694 / 696 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 | 5.02 / 5.08 / 5.12 |
| d1-h1|PR-BAL|CTL-BEST-SHOWN-S1 | model-output (control) | 3 / 4 / 4 | 39 / 52 / 52 | 1 / 2 / 2 | 20 / 20 / 20 | not reached / not reached / not reached | 9280 / 9310 / 9380 | 1786 / 1789 / 1796 | 0 / 0 / 0 | 1.08 / 1.17 / 1.17 | 6.11 / 6.19 / 6.23 |
| d1-h1|PR-BAL|POL-STAY | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 18 / 18 / 18 | 16.23 / 16.35 / 16.45 | 7364 / 7386 / 7430 | 482 / 483 / 485 | 0 / 0 / 0 | 8.48 / 8.60 / 8.63 | 5.02 / 5.08 / 5.12 |
| d1-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 37.98 / 38.12 / 38.24 | 8178 / 8200 / 8244 | 693 / 694 / 696 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 | 5.02 / 5.08 / 5.12 |
| d1-h1|PR-BAL|POL-BEST-SHOWN | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 20 / 20 / 20 | not reached / not reached / not reached | 9290 / 9320 / 9330 | 1787 / 1790 / 1791 | 0 / 0 / 0 | 1.83 / 1.83 / 1.83 | 6.11 / 6.19 / 6.23 |
| d1.5-h1|PR-BAL|CTL-STAY-S1 | model-output (control) | 52 / 53 / 53 | 676 / 689 / 689 | 50 / 51 / 51 | 17 / 17 / 17 | 16.44 / 16.79 / 16.91 | 6088 / 6132 / 6242 | 424 / 426 / 431 | 0 / 0 / 0 | 4.83 / 4.92 / 4.92 | 5.02 / 5.08 / 5.12 |
| d1.5-h1|PR-BAL|CTL-FRONTIER-S1 | model-output (control) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 20 | not reached / not reached / not reached | 8600 / 8640 / 8700 | 920 / 924 / 930 | 0 / 0 / 0 | 4.33 / 4.50 / 4.50 | 5.02 / 5.08 / 5.12 |
| d1.5-h1|PR-BAL|CTL-BEST-SHOWN-S1 | model-output (control) | 5 / 5 / 5 | 65 / 65 / 65 | 3 / 3 / 3 | 20 / 20 / 20 | not reached / not reached / not reached | 9220 / 9250 / 9270 | 1780 / 1783 / 1785 | 0 / 0 / 0 | 1.25 / 1.25 / 1.25 | 6.11 / 6.19 / 6.23 |
| d1.5-h1|PR-BAL|POL-STAY | model-output (realistic) | 0 / 0 / 1 | 0 / 0 / 13 | 0 / 0 / 0 | 18 / 18 / 18 | 16.56 / 16.68 / 16.78 | 6748 / 6792 / 6814 | 454 / 456 / 457 | 0 / 0 / 0 | 11.62 / 11.82 / 11.94 | 5.02 / 5.08 / 5.12 |
| d1.5-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 20 | not reached / not reached / not reached | 8600 / 8640 / 8700 | 920 / 924 / 930 | 0 / 0 / 0 | 4.33 / 4.50 / 4.50 | 5.02 / 5.08 / 5.12 |
| d1.5-h1|PR-BAL|POL-BEST-SHOWN | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 20 / 20 / 20 | not reached / not reached / not reached | 9220 / 9240 / 9260 | 1780 / 1782 / 1784 | 0 / 0 / 0 | 2.17 / 2.17 / 2.17 | 6.11 / 6.19 / 6.23 |
| d2-h1|PR-BAL|CTL-STAY-S1 | model-output (control) | 69 / 70 / 70 | 897 / 903.20 / 910 | 67 / 68 / 68 | 16 / 16 / 16 | 17.25 / 17.39 / 17.52 | 5230 / 5318 / 5428 | 385 / 389 / 394 | 0 / 0 / 0 | 6.25 / 6.33 / 6.33 | 5.02 / 5.08 / 5.12 |
| d2-h1|PR-BAL|CTL-FRONTIER-S1 | model-output (control) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | not reached / not reached / not reached | 8304 / 8364 / 8414 | 939 / 945 / 950 | 0 / 0 / 0 | 5 / 5.02 / 5.17 | 8.53 / 8.65 / 8.71 |
| d2-h1|PR-BAL|CTL-BEST-SHOWN-S1 | model-output (control) | 8 / 8 / 8 | 104 / 104 / 104 | 6 / 6 / 6 | 20 / 20 / 20 | not reached / not reached / not reached | 9080 / 9110 / 9140 | 1766 / 1769 / 1772 | 0 / 0 / 0 | 1.50 / 1.50 / 1.50 | 6.11 / 6.19 / 6.23 |
| d2-h1|PR-BAL|POL-STAY | model-output (realistic) | 4 / 5 / 6 | 52 / 85 / 118 | 0 / 1 / 2 | 17 / 17 / 17 | 17.25 / 17.48 / 17.62 | 5986 / 6076 / 6194 | 422 / 428 / 446 | 0 / 0 / 0 | 14.12 / 14.57 / 14.83 | 5.02 / 5.08 / 5.12 |
| d2-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | not reached / not reached / not reached | 8304 / 8364 / 8414 | 939 / 945 / 950 | 0 / 0 / 0 | 5 / 5.02 / 5.17 | 8.53 / 8.65 / 8.71 |
| d2-h1|PR-BAL|POL-BEST-SHOWN | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 20 / 20 / 20 | not reached / not reached / not reached | 9070 / 9130 / 9140 | 1765 / 1771 / 1772 | 0 / 0 / 0 | 2.67 / 2.67 / 2.83 | 6.11 / 6.19 / 6.23 |

## Notes and limitations

- S1.1 correction pass (owner review 'Independent S1 Review and S1.1 Authorisation'). Single-character diagnostic model; no recruits, classes, abilities, gear, sinks, offline progress or Monuments.
- All inputs are candidates (content w1-slice.candidate.v0.1.0, unchanged; owner resolutions S1-R01..R17; S1.1 rules S1.1-R01..R15); every output is model-output, not live-validated.
- Policies: POL-* are the corrected S1.1 realistic policies; CTL-*-S1 are the S1 decision logic kept as diagnostic controls; ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control, never an upper bound.
- Seeds: the same seed roots as the corresponding S1 experiments, so S1, controls and corrected policies face the same random draws.
- No target is registered: deaths, stops, idle time, levels and EXP are reported for every cell (PREREGISTRATION.md A4).

