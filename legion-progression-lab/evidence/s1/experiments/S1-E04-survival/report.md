# S1-E04-survival

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** How often does the hero die, and what does downtime cost?

**Design.** Enemy damage x {0.5, 1, 1.5, 2} x hero HP per level x {0.75, 1, 1.25}; PR-BAL; POL-STAY and POL-FRONTIER; 200 replicates; record deaths/h, death downtime and auto-farm stops.

**Seeds:** root `S1-E04`, 200 replicates per cell (replicate i uses `S1-E04#rep-i`).

**Semantic fingerprint:** `2eabbe1899e88ec9077620684adb35e285535cd0f512818da3f4e71a36302e46` (manifest SHA-256 `6641a45f1ad79be965113799269f6d5f9f1cd070449e33fed8f0abff23cc6577`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | deathsPerHour | deathDowntimeS | autoFarmStops | levelAt60 | zone3FirstVisitMin | expTotal |
|---|---|---|---|---|---|---|---|
| d0.5-h0.75|PR-BAL|POL-STAY | model-output (realistic) | 24 / 24 / 24 | 312 / 312 / 312 | 21 / 21 / 21 | 19 / 19 / 19 | 15.29 / 15.39 / 15.49 | 7584 / 7606 / 7650 |
| d0.5-h0.75|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 36.31 / 36.45 / 36.57 | 8574 / 8596 / 8618 |
| d0.5-h1|PR-BAL|POL-STAY | model-output (realistic) | 20 / 21 / 21 | 260 / 272.30 / 273 | 11 / 12 / 12 | 19 / 19 / 19 | 15.28 / 15.39 / 15.49 | 7716 / 7760 / 7826 |
| d0.5-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 36.15 / 36.30 / 36.57 | 8640 / 8662 / 8684 |
| d0.5-h1.25|PR-BAL|POL-STAY | model-output (realistic) | 18 / 18 / 18 | 234 / 234 / 234 | 6 / 7 / 7 | 19 / 19 / 19 | 15.31 / 15.39 / 15.49 | 7870 / 7914 / 7936 |
| d0.5-h1.25|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 20 / 20 / 20 | 36.15 / 36.28 / 36.41 | 8706 / 8728 / 8750 |
| d1-h0.75|PR-BAL|POL-STAY | model-output (realistic) | 42 / 42 / 42 | 546 / 546 / 546 | 40 / 40 / 40 | 18 / 18 / 18 | 16.10 / 16.25 / 16.58 | 6660 / 6704 / 6748 |
| d1-h0.75|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 38.31 / 38.45 / 38.57 | 8024 / 8068 / 8090 |
| d1-h1|PR-BAL|POL-STAY | model-output (realistic) | 36 / 36 / 36 | 468 / 468 / 468 | 34 / 34 / 34 | 18 / 18 / 18 | 16.17 / 16.28 / 16.40 | 6990 / 7056 / 7100 |
| d1-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 37.98 / 38.12 / 38.24 | 8178 / 8200 / 8244 |
| d1-h1.25|PR-BAL|POL-STAY | model-output (realistic) | 31 / 32 / 32 | 403 / 407.20 / 416 | 28 / 29 / 29 | 18 / 18 / 18 | 15.93 / 16.04 / 16.14 | 7210 / 7298 / 7320 |
| d1-h1.25|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 37.65 / 37.78 / 37.91 | 8310 / 8332 / 8354 |
| d1.5-h0.75|PR-BAL|POL-STAY | model-output (realistic) | 61 / 61 / 61 | 793 / 793 / 793 | 59 / 59 / 59 | 17 / 17 / 17 | 16.57 / 16.70 / 17.05 | 5714 / 5758 / 5802 |
| d1.5-h0.75|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | not reached / not reached / not reached | 8450 / 8500 / 8530 |
| d1.5-h1|PR-BAL|POL-STAY | model-output (realistic) | 52 / 53 / 53 | 676 / 689 / 689 | 50 / 51 / 51 | 17 / 17 / 17 | 16.44 / 16.79 / 16.91 | 6088 / 6132 / 6242 |
| d1.5-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 20 | not reached / not reached / not reached | 8600 / 8640 / 8700 |
| d1.5-h1.25|PR-BAL|POL-STAY | model-output (realistic) | 47 / 47 / 47 | 611 / 611 / 611 | 45 / 45 / 45 | 17 / 17 / 17 | 16.35 / 16.47 / 16.60 | 6352 / 6396 / 6462 |
| d1.5-h1.25|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | 54.71 / 54.89 / 55.20 | 8306 / 8350 / 8372 |
| d2-h0.75|PR-BAL|POL-STAY | model-output (realistic) | 78 / 79 / 79 | 1014 / 1018.80 / 1027 | 76 / 77 / 77 | 16 / 16 / 16 | 17.70 / 17.83 / 17.95 | 4966 / 5010 / 5076 |
| d2-h0.75|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | not reached / not reached / not reached | 8080 / 8120 / 8180 |
| d2-h1|PR-BAL|POL-STAY | model-output (realistic) | 69 / 70 / 70 | 897 / 903.20 / 910 | 67 / 68 / 68 | 16 / 16 / 16 | 17.25 / 17.39 / 17.52 | 5230 / 5318 / 5428 |
| d2-h1|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | not reached / not reached / not reached | 8304 / 8364 / 8414 |
| d2-h1.25|PR-BAL|POL-STAY | model-output (realistic) | 61 / 62 / 62 | 793 / 794.10 / 806 | 59 / 60 / 60 | 17 / 17 / 17 | 17.05 / 17.17 / 17.29 | 5626 / 5714 / 5780 |
| d2-h1.25|PR-BAL|POL-FRONTIER | model-output (realistic) | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 19 / 19 / 19 | not reached / not reached / not reached | 8470 / 8520 / 8580 |

## Notes and limitations

- S1 is a single-character diagnostic model (experiment plan principle 10): no recruits, classes, abilities, gear, sinks, offline progress or Monuments; gold and materials only accumulate.
- All inputs are candidates (content w1-slice.candidate.v0.1.0 and the S1 resolutions S1-R01..R17); every output is model-output, not live-validated.
- Engagement overhead and walk times are the most uncertain inputs (to be measured in M2).
- Reported only: no pass/fail target is registered for survival in S1.

