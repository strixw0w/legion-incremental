# S1-E01-calibration

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Do the candidate inputs meet the early pacing targets for a single classless hero?

**Design.** Pass 1: XP curve a in {8, 10, 12} x p in {1.6, 1.8, 2.0} x zone 1 kill gate in {60, 100, 150} (27 variants). Pass 2: slime EXP in {3, 5} at a = 10, p = 1.6, gate 100 (the 4-EXP point is in pass 1). Profiles PR-NEW (45 min) and PR-BAL (60 min); policies POL-FRONTIER and POL-STAY; 200 replicates.

**Seeds:** root `S1-E01`, 200 replicates per cell (replicate i uses `S1-E01#rep-i`).

**Semantic fingerprint:** `6c940a2cf5479d4b8b500eab847bb29e8da56251af9e34e61121fd0e18dda4d2` (manifest SHA-256 `607ab4c4b33c133d917ca5aa13f7e56510c552794fb6d2f5674171141e60d739`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |
|---|---|---|---|---|---|---|
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.6-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p1.8-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a8-p2.0-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.8-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p2.0-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.6-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p1.8-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g60|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g60|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g60|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g60|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g100|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g100|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g100|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g100|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g150|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g150|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g150|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a12-p2.0-g150|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 10.40 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g60|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g60|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g100|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g100|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g150|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.6-g150|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g60|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g60|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g60|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g100|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g100|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g100|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g150|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g150|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p1.8-g150|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g60|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g60|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g60|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g60|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g100|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g100|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g100|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g100|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g150|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g150|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g150|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a8-p2.0-g150|PR-BAL|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g60|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g60|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g150|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g150|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g60|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g60|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g60|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g60|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g100|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g100|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g100|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g150|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g150|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.8-g150|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g60|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g60|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g60|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g60|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g100|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g100|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g100|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g100|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g150|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g150|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g150|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p2.0-g150|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g60|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g60|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g60|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g100|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g100|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g100|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g150|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g150|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.6-g150|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g60|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g60|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g60|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g60|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g100|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g100|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g100|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g100|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g150|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g150|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g150|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p1.8-g150|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g60|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g60|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g60|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g60|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g100|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g100|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g100|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g100|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g150|PR-NEW|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g150|PR-NEW|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g150|PR-BAL|POL-FRONTIER | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a12-p2.0-g150|PR-BAL|POL-STAY | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 4 | miss |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 4 | miss |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 4 | miss |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 4 | miss |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 2 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 2 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 2.40 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-NEW|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g100|PR-BAL|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-NEW|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.6-g150|PR-BAL|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-NEW|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-NEW|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p1.8-g150|PR-BAL|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a8-p2.0-g150|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-NEW|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g150|PR-BAL|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.8-g150|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p2.0-g150|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-NEW|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-NEW|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.6-g150|PR-BAL|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p1.8-g150|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g60|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g100|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a12-p2.0-g150|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 3.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g60|PR-NEW|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g60|PR-BAL|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g100|PR-NEW|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g100|PR-BAL|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g150|PR-NEW|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.6-g150|PR-BAL|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g60|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g60|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g100|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g100|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g150|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p1.8-g150|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g60|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g60|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g100|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g100|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g150|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a8-p2.0-g150|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g60|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g60|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g150|PR-NEW|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g150|PR-BAL|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g60|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g60|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g100|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g100|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g150|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.8-g150|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g60|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g60|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g100|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g100|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g150|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p2.0-g150|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g60|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g60|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g100|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g100|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g150|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.6-g150|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g60|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g60|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g100|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g100|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g150|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p1.8-g150|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g60|PR-NEW|POL-STAY | 12 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g60|PR-BAL|POL-STAY | 12 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g100|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g100|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g150|PR-NEW|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a12-p2.0-g150|PR-BAL|POL-STAY | 10.80 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 8.40 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 8.40 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 3.26 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g60|PR-NEW|POL-STAY | 3.26 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 3.26 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g60|PR-BAL|POL-STAY | 3.26 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 5.02 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g100|PR-NEW|POL-STAY | 5.02 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 5.02 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g100|PR-BAL|POL-STAY | 5.02 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 7.23 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g150|PR-NEW|POL-STAY | 7.23 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 7.23 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.6-g150|PR-BAL|POL-STAY | 7.23 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g60|PR-NEW|POL-FRONTIER | 3.30 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g60|PR-NEW|POL-STAY | 3.30 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 3.30 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g60|PR-BAL|POL-STAY | 3.30 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g100|PR-NEW|POL-FRONTIER | 5.06 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g100|PR-NEW|POL-STAY | 5.06 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 5.06 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g100|PR-BAL|POL-STAY | 5.06 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g150|PR-NEW|POL-FRONTIER | 7.25 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g150|PR-NEW|POL-STAY | 7.25 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 7.25 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p1.8-g150|PR-BAL|POL-STAY | 7.25 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g60|PR-NEW|POL-FRONTIER | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g60|PR-NEW|POL-STAY | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g60|PR-BAL|POL-FRONTIER | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g60|PR-BAL|POL-STAY | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g100|PR-NEW|POL-FRONTIER | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g100|PR-NEW|POL-STAY | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g100|PR-BAL|POL-FRONTIER | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g100|PR-BAL|POL-STAY | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g150|PR-NEW|POL-FRONTIER | 7.29 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g150|PR-NEW|POL-STAY | 7.29 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g150|PR-BAL|POL-FRONTIER | 7.29 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a8-p2.0-g150|PR-BAL|POL-STAY | 7.29 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g60|PR-NEW|POL-STAY | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g60|PR-BAL|POL-STAY | 3.32 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-STAY | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-STAY | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 7.27 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g150|PR-NEW|POL-STAY | 7.27 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 7.27 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g150|PR-BAL|POL-STAY | 7.27 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g60|PR-NEW|POL-FRONTIER | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g60|PR-NEW|POL-STAY | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g60|PR-BAL|POL-FRONTIER | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g60|PR-BAL|POL-STAY | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g100|PR-NEW|POL-FRONTIER | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g100|PR-NEW|POL-STAY | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g100|PR-BAL|POL-STAY | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g150|PR-NEW|POL-FRONTIER | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g150|PR-NEW|POL-STAY | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.8-g150|PR-BAL|POL-STAY | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g60|PR-NEW|POL-FRONTIER | 3.38 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g60|PR-NEW|POL-STAY | 3.38 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g60|PR-BAL|POL-FRONTIER | 3.38 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g60|PR-BAL|POL-STAY | 3.38 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g100|PR-NEW|POL-FRONTIER | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g100|PR-NEW|POL-STAY | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g100|PR-BAL|POL-FRONTIER | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g100|PR-BAL|POL-STAY | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g150|PR-NEW|POL-FRONTIER | 7.35 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g150|PR-NEW|POL-STAY | 7.35 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g150|PR-BAL|POL-FRONTIER | 7.35 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p2.0-g150|PR-BAL|POL-STAY | 7.35 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g60|PR-NEW|POL-FRONTIER | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g60|PR-NEW|POL-STAY | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g60|PR-BAL|POL-STAY | 3.36 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g100|PR-NEW|POL-FRONTIER | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g100|PR-NEW|POL-STAY | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g100|PR-BAL|POL-STAY | 5.12 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g150|PR-NEW|POL-FRONTIER | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g150|PR-NEW|POL-STAY | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.6-g150|PR-BAL|POL-STAY | 7.33 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g60|PR-NEW|POL-FRONTIER | 3.40 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g60|PR-NEW|POL-STAY | 3.40 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g60|PR-BAL|POL-FRONTIER | 3.40 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g60|PR-BAL|POL-STAY | 3.40 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g100|PR-NEW|POL-FRONTIER | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g100|PR-NEW|POL-STAY | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g100|PR-BAL|POL-FRONTIER | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g100|PR-BAL|POL-STAY | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g150|PR-NEW|POL-FRONTIER | 7.37 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g150|PR-NEW|POL-STAY | 7.37 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g150|PR-BAL|POL-FRONTIER | 7.37 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p1.8-g150|PR-BAL|POL-STAY | 7.37 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g60|PR-NEW|POL-FRONTIER | 3.42 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g60|PR-NEW|POL-STAY | 3.42 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g60|PR-BAL|POL-FRONTIER | 3.42 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g60|PR-BAL|POL-STAY | 3.42 | miss |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g100|PR-NEW|POL-FRONTIER | 5.20 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g100|PR-NEW|POL-STAY | 5.20 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g100|PR-BAL|POL-FRONTIER | 5.20 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g100|PR-BAL|POL-STAY | 5.20 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g150|PR-NEW|POL-FRONTIER | 7.41 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g150|PR-NEW|POL-STAY | 7.41 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g150|PR-BAL|POL-FRONTIER | 7.41 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a12-p2.0-g150|PR-BAL|POL-STAY | 7.41 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 5.16 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 5.02 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 5.02 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 5.02 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 5.02 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 8.38 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60|PR-NEW|POL-STAY | 3.33 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 8.38 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60|PR-BAL|POL-STAY | 3.33 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 5.08 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100|PR-NEW|POL-STAY | 2.05 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 5.08 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100|PR-BAL|POL-STAY | 2.05 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 3.27 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150|PR-NEW|POL-STAY | 1.35 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 3.27 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150|PR-BAL|POL-STAY | 1.35 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60|PR-NEW|POL-STAY | 3.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 13.61 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60|PR-BAL|POL-STAY | 3.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100|PR-NEW|POL-STAY | 2.30 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 8.50 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100|PR-BAL|POL-STAY | 2.30 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150|PR-NEW|POL-STAY | 1.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 5.62 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150|PR-BAL|POL-STAY | 1.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60|PR-NEW|POL-STAY | 3.83 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60|PR-BAL|POL-STAY | 3.83 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100|PR-NEW|POL-STAY | 2.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100|PR-BAL|POL-STAY | 2.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150|PR-NEW|POL-STAY | 1.63 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150|PR-BAL|POL-STAY | 1.63 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 10.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60|PR-NEW|POL-STAY | 3.56 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 10.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60|PR-BAL|POL-STAY | 3.56 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-STAY | 2.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-STAY | 2.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 4.25 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150|PR-NEW|POL-STAY | 1.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 4.25 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150|PR-BAL|POL-STAY | 1.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60|PR-NEW|POL-STAY | 3.75 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60|PR-BAL|POL-STAY | 3.75 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100|PR-NEW|POL-STAY | 2.38 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 10.69 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100|PR-BAL|POL-STAY | 2.38 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150|PR-NEW|POL-STAY | 1.58 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 7.17 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150|PR-BAL|POL-STAY | 1.58 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60|PR-NEW|POL-STAY | 3.95 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60|PR-BAL|POL-STAY | 3.95 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100|PR-NEW|POL-STAY | 2.48 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100|PR-BAL|POL-STAY | 2.48 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150|PR-NEW|POL-STAY | 1.67 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150|PR-BAL|POL-STAY | 1.67 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60|PR-NEW|POL-STAY | 3.71 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 12.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60|PR-BAL|POL-STAY | 3.71 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100|PR-NEW|POL-STAY | 2.36 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 7.91 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100|PR-BAL|POL-STAY | 2.36 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150|PR-NEW|POL-STAY | 1.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 5.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150|PR-BAL|POL-STAY | 1.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60|PR-NEW|POL-STAY | 3.80 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60|PR-BAL|POL-STAY | 3.80 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100|PR-NEW|POL-STAY | 2.43 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100|PR-BAL|POL-STAY | 2.43 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150|PR-NEW|POL-STAY | 1.64 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150|PR-BAL|POL-STAY | 1.64 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60|PR-NEW|POL-STAY | 4.03 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60|PR-BAL|POL-STAY | 4.03 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100|PR-NEW|POL-STAY | 2.57 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100|PR-BAL|POL-STAY | 2.57 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150|PR-NEW|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150|PR-NEW|POL-STAY | 1.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150|PR-BAL|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150|PR-BAL|POL-STAY | 1.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 6.64 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 2.25 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 6.64 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 2.25 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 6.34 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 2.11 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 6.34 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 2.11 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g60|PR-NEW|POL-STAY | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g60|PR-BAL|POL-STAY | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g100|PR-NEW|POL-STAY | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g100|PR-BAL|POL-STAY | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g150|PR-NEW|POL-STAY | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.6-g150|PR-BAL|POL-STAY | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g60|PR-NEW|POL-FRONTIER | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g60|PR-NEW|POL-STAY | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g60|PR-BAL|POL-STAY | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g100|PR-NEW|POL-FRONTIER | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g100|PR-NEW|POL-STAY | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g100|PR-BAL|POL-STAY | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g150|PR-NEW|POL-FRONTIER | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g150|PR-NEW|POL-STAY | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p1.8-g150|PR-BAL|POL-STAY | 2.43 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g60|PR-NEW|POL-FRONTIER | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g60|PR-NEW|POL-STAY | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g60|PR-BAL|POL-FRONTIER | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g60|PR-BAL|POL-STAY | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g100|PR-NEW|POL-FRONTIER | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g100|PR-NEW|POL-STAY | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g100|PR-BAL|POL-FRONTIER | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g100|PR-BAL|POL-STAY | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g150|PR-NEW|POL-FRONTIER | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g150|PR-NEW|POL-STAY | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g150|PR-BAL|POL-FRONTIER | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a8-p2.0-g150|PR-BAL|POL-STAY | 2.99 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g60|PR-NEW|POL-STAY | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g60|PR-BAL|POL-STAY | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-STAY | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-STAY | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g150|PR-NEW|POL-STAY | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g150|PR-BAL|POL-STAY | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g60|PR-NEW|POL-FRONTIER | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g60|PR-NEW|POL-STAY | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g60|PR-BAL|POL-FRONTIER | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g60|PR-BAL|POL-STAY | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g100|PR-NEW|POL-FRONTIER | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g100|PR-NEW|POL-STAY | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g100|PR-BAL|POL-STAY | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g150|PR-NEW|POL-FRONTIER | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g150|PR-NEW|POL-STAY | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.8-g150|PR-BAL|POL-STAY | 3.03 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g60|PR-NEW|POL-FRONTIER | 4.12 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g60|PR-NEW|POL-STAY | 4.12 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g60|PR-BAL|POL-FRONTIER | 4.12 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g60|PR-BAL|POL-STAY | 4.12 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g100|PR-NEW|POL-FRONTIER | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g100|PR-NEW|POL-STAY | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g100|PR-BAL|POL-FRONTIER | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g100|PR-BAL|POL-STAY | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g150|PR-NEW|POL-FRONTIER | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g150|PR-NEW|POL-STAY | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g150|PR-BAL|POL-FRONTIER | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p2.0-g150|PR-BAL|POL-STAY | 3.72 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g60|PR-NEW|POL-FRONTIER | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g60|PR-NEW|POL-STAY | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g60|PR-BAL|POL-STAY | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g100|PR-NEW|POL-FRONTIER | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g100|PR-NEW|POL-STAY | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g100|PR-BAL|POL-STAY | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g150|PR-NEW|POL-FRONTIER | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g150|PR-NEW|POL-STAY | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.6-g150|PR-BAL|POL-STAY | 2.89 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g60|PR-NEW|POL-FRONTIER | 4.04 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g60|PR-NEW|POL-STAY | 4.04 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g60|PR-BAL|POL-FRONTIER | 4.04 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g60|PR-BAL|POL-STAY | 4.04 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g100|PR-NEW|POL-FRONTIER | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g100|PR-NEW|POL-STAY | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g100|PR-BAL|POL-FRONTIER | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g100|PR-BAL|POL-STAY | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g150|PR-NEW|POL-FRONTIER | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g150|PR-NEW|POL-STAY | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g150|PR-BAL|POL-FRONTIER | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p1.8-g150|PR-BAL|POL-STAY | 3.61 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g60|PR-NEW|POL-FRONTIER | 4.96 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g60|PR-NEW|POL-STAY | 4.79 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g60|PR-BAL|POL-FRONTIER | 4.96 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g60|PR-BAL|POL-STAY | 4.79 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g100|PR-NEW|POL-FRONTIER | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g100|PR-NEW|POL-STAY | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g100|PR-BAL|POL-FRONTIER | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g100|PR-BAL|POL-STAY | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g150|PR-NEW|POL-FRONTIER | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g150|PR-NEW|POL-STAY | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g150|PR-BAL|POL-FRONTIER | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a12-p2.0-g150|PR-BAL|POL-STAY | 4.44 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 3.25 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 3.25 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 3.25 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 3.25 | pass |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 1.96 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 1.96 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g60|PR-NEW|POL-FRONTIER | 11.40 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g60|PR-NEW|POL-STAY | 11.39 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g60|PR-BAL|POL-FRONTIER | 11.40 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g60|PR-BAL|POL-STAY | 11.39 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g100|PR-NEW|POL-FRONTIER | 11.35 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g100|PR-NEW|POL-STAY | 11.32 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g100|PR-BAL|POL-FRONTIER | 11.35 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g100|PR-BAL|POL-STAY | 11.32 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g150|PR-NEW|POL-FRONTIER | 11.55 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g150|PR-NEW|POL-STAY | 11.65 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g150|PR-BAL|POL-FRONTIER | 11.55 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.6-g150|PR-BAL|POL-STAY | 11.65 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g60|PR-NEW|POL-FRONTIER | 16.39 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g60|PR-NEW|POL-STAY | 17.13 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g60|PR-BAL|POL-FRONTIER | 16.39 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g60|PR-BAL|POL-STAY | 17.13 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g100|PR-NEW|POL-FRONTIER | 16.22 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g100|PR-NEW|POL-STAY | 16.08 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g100|PR-BAL|POL-FRONTIER | 16.22 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g100|PR-BAL|POL-STAY | 16.08 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g150|PR-NEW|POL-FRONTIER | 16.30 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g150|PR-NEW|POL-STAY | 16.17 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g150|PR-BAL|POL-FRONTIER | 16.30 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p1.8-g150|PR-BAL|POL-STAY | 16.17 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g60|PR-NEW|POL-FRONTIER | 23.56 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g60|PR-NEW|POL-STAY | 27.70 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g60|PR-BAL|POL-FRONTIER | 23.56 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g60|PR-BAL|POL-STAY | 27.70 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g100|PR-NEW|POL-FRONTIER | 23.44 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g100|PR-NEW|POL-STAY | 26.69 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g100|PR-BAL|POL-FRONTIER | 23.44 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g100|PR-BAL|POL-STAY | 26.69 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g150|PR-NEW|POL-FRONTIER | 23.37 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g150|PR-NEW|POL-STAY | 25.77 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g150|PR-BAL|POL-FRONTIER | 23.37 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a8-p2.0-g150|PR-BAL|POL-STAY | 25.77 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g60|PR-NEW|POL-FRONTIER | 14.19 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g60|PR-NEW|POL-STAY | 14.14 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g60|PR-BAL|POL-FRONTIER | 14.19 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g60|PR-BAL|POL-STAY | 14.14 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-STAY | 14.03 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-STAY | 14.03 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g150|PR-NEW|POL-FRONTIER | 14.18 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g150|PR-NEW|POL-STAY | 14.15 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g150|PR-BAL|POL-FRONTIER | 14.18 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g150|PR-BAL|POL-STAY | 14.15 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g60|PR-NEW|POL-FRONTIER | 20.45 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g60|PR-NEW|POL-STAY | 23.20 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g60|PR-BAL|POL-FRONTIER | 20.45 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g60|PR-BAL|POL-STAY | 23.20 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g100|PR-NEW|POL-FRONTIER | 20.25 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g100|PR-NEW|POL-STAY | 22.07 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g100|PR-BAL|POL-FRONTIER | 20.25 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g100|PR-BAL|POL-STAY | 22.07 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g150|PR-NEW|POL-FRONTIER | 20.25 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g150|PR-NEW|POL-STAY | 21.32 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g150|PR-BAL|POL-FRONTIER | 20.25 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.8-g150|PR-BAL|POL-STAY | 21.32 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g60|PR-NEW|POL-FRONTIER | 29.38 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g60|PR-NEW|POL-STAY | 35.92 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g60|PR-BAL|POL-FRONTIER | 29.38 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g60|PR-BAL|POL-STAY | 35.92 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g100|PR-NEW|POL-FRONTIER | 29.33 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g100|PR-NEW|POL-STAY | 34.95 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g100|PR-BAL|POL-FRONTIER | 29.33 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g100|PR-BAL|POL-STAY | 34.95 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g150|PR-NEW|POL-FRONTIER | 29.18 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g150|PR-NEW|POL-STAY | 33.99 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g150|PR-BAL|POL-FRONTIER | 29.18 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p2.0-g150|PR-BAL|POL-STAY | 33.99 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g60|PR-NEW|POL-FRONTIER | 16.98 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g60|PR-NEW|POL-STAY | 18.08 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g60|PR-BAL|POL-FRONTIER | 16.98 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g60|PR-BAL|POL-STAY | 18.08 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g100|PR-NEW|POL-FRONTIER | 16.95 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g100|PR-NEW|POL-STAY | 17.55 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g100|PR-BAL|POL-FRONTIER | 16.95 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g100|PR-BAL|POL-STAY | 17.55 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g150|PR-NEW|POL-FRONTIER | 16.80 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g150|PR-NEW|POL-STAY | 16.66 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g150|PR-BAL|POL-FRONTIER | 16.80 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.6-g150|PR-BAL|POL-STAY | 16.66 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g60|PR-NEW|POL-FRONTIER | 24.44 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g60|PR-NEW|POL-STAY | 28.68 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g60|PR-BAL|POL-FRONTIER | 24.44 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g60|PR-BAL|POL-STAY | 28.68 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g100|PR-NEW|POL-FRONTIER | 24.27 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g100|PR-NEW|POL-STAY | 27.84 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g100|PR-BAL|POL-FRONTIER | 24.27 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g100|PR-BAL|POL-STAY | 27.84 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g150|PR-NEW|POL-FRONTIER | 24.10 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g150|PR-NEW|POL-STAY | 26.88 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g150|PR-BAL|POL-FRONTIER | 24.10 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p1.8-g150|PR-BAL|POL-STAY | 26.88 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g60|PR-NEW|POL-FRONTIER | 35.27 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g60|PR-NEW|POL-STAY | 44.98 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g60|PR-BAL|POL-FRONTIER | 35.27 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g60|PR-BAL|POL-STAY | 44.98 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g100|PR-NEW|POL-FRONTIER | 35.14 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g100|PR-NEW|POL-STAY | 43.47 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g100|PR-BAL|POL-FRONTIER | 35.14 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g100|PR-BAL|POL-STAY | 43.47 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g150|PR-NEW|POL-FRONTIER | 34.98 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g150|PR-NEW|POL-STAY | 42.34 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g150|PR-BAL|POL-FRONTIER | 34.98 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a12-p2.0-g150|PR-BAL|POL-STAY | 42.34 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | 15.44 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x3|PR-NEW|POL-STAY | 15.38 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | 15.44 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x3|PR-BAL|POL-STAY | 15.38 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | 12.94 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x5|PR-NEW|POL-STAY | 12.96 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | 12.94 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100-x5|PR-BAL|POL-STAY | 12.96 | pass |

*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | firstKillS | killsToL2 | minToL5 | minToL10 | zone2FirstVisitMin | zone3FirstVisitMin | ttkZ1FirstVisitS | ttkZ2FirstVisitS | ttkZ3FirstVisitS | deathsPerHour | levelAt45 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a8-p1.6-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.30 / 11.40 / 11.46 | 3.22 / 3.26 / 3.30 | 30.48 / 30.60 / 30.72 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 18 / 18 / 19 |
| a8-p1.6-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.10 / 11.39 / 11.50 | 3.22 / 3.26 / 3.30 | 14.06 / 14.16 / 14.24 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 8.40 / 8.40 / 8.40 | 34.67 / 34.67 / 34.67 | 17 / 18 / 18 |
| a8-p1.6-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.30 / 11.40 / 11.46 | 3.22 / 3.26 / 3.30 | 30.48 / 30.60 / 30.72 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 18 / 18 / 19 |
| a8-p1.6-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.10 / 11.39 / 11.50 | 3.22 / 3.26 / 3.30 | 14.06 / 14.16 / 14.24 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 8.40 / 8.40 / 8.40 | 34 / 34 / 34 | 17 / 18 / 18 |
| a8-p1.6-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.27 / 11.35 / 11.43 | 4.96 / 5.02 / 5.08 | 30.45 / 30.57 / 30.67 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 18 / 18 / 19 |
| a8-p1.6-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.23 / 11.32 / 11.41 | 4.96 / 5.02 / 5.08 | 15.26 / 15.34 / 15.44 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 8.40 / 8.40 / 8.40 | 32 / 32 / 32 | 18 / 18 / 18 |
| a8-p1.6-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.27 / 11.35 / 11.43 | 4.96 / 5.02 / 5.08 | 30.45 / 30.57 / 30.67 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 18 / 18 / 19 |
| a8-p1.6-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.23 / 11.32 / 11.41 | 4.96 / 5.02 / 5.08 | 15.26 / 15.34 / 15.44 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 8.40 / 8.40 / 8.40 | 32 / 33 / 33 | 18 / 18 / 18 |
| a8-p1.6-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.45 / 11.55 / 11.79 | 7.15 / 7.23 / 7.29 | 30.65 / 30.91 / 31.04 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 18 / 18 / 18 |
| a8-p1.6-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.52 / 11.65 / 11.73 | 7.15 / 7.23 / 7.29 | 16.84 / 16.97 / 17.05 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 7.20 / 8.40 / 8.40 | 29.33 / 29.33 / 29.33 | 18 / 18 / 18 |
| a8-p1.6-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.45 / 11.55 / 11.79 | 7.15 / 7.23 / 7.29 | 30.65 / 30.91 / 31.04 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 18 / 18 / 18 |
| a8-p1.6-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 11.52 / 11.65 / 11.73 | 7.15 / 7.23 / 7.29 | 16.84 / 16.97 / 17.05 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 7.20 / 8.40 / 8.40 | 30 / 30 / 31 | 18 / 18 / 18 |
| a8-p1.8-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.27 / 16.39 / 16.49 | 3.26 / 3.30 / 3.32 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 15 / 15 / 15 |
| a8-p1.8-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 17.01 / 17.13 / 17.24 | 3.26 / 3.30 / 3.32 | 15.41 / 15.56 / 15.67 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 42.67 / 42.67 / 42.67 | 14 / 14 / 14 |
| a8-p1.8-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.27 / 16.39 / 16.49 | 3.26 / 3.30 / 3.32 | 47.83 / 48.16 / 48.30 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 15 / 15 / 15 |
| a8-p1.8-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 17.01 / 17.13 / 17.24 | 3.26 / 3.30 / 3.32 | 15.41 / 15.56 / 15.67 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 42 / 43 / 43 | 14 / 14 / 14 |
| a8-p1.8-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.08 / 16.22 / 16.46 | 5.00 / 5.06 / 5.10 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 15 / 15 / 15 |
| a8-p1.8-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 15.96 / 16.08 / 16.19 | 5.00 / 5.06 / 5.10 | 16.56 / 16.67 / 16.79 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 40 / 40 / 40 | 14 / 14 / 14 |
| a8-p1.8-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.08 / 16.22 / 16.46 | 5.00 / 5.06 / 5.10 | 47.80 / 47.98 / 48.25 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 15 / 15 / 15 |
| a8-p1.8-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 15.96 / 16.08 / 16.19 | 5.00 / 5.06 / 5.10 | 16.56 / 16.67 / 16.79 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 40 / 40 / 40 | 14 / 14 / 14 |
| a8-p1.8-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.20 / 16.30 / 16.40 | 7.19 / 7.25 / 7.31 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 0 / 0 / 0 | 15 / 15 / 15 |
| a8-p1.8-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.05 / 16.17 / 16.28 | 7.19 / 7.25 / 7.31 | 18.08 / 18.31 / 18.42 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 14 / 14 / 14 |
| a8-p1.8-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.20 / 16.30 / 16.40 | 7.19 / 7.25 / 7.31 | 47.78 / 48.09 / 48.23 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 15 / 15 / 15 |
| a8-p1.8-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.41 / 2.43 / 2.45 | 16.05 / 16.17 / 16.28 | 7.19 / 7.25 / 7.31 | 18.08 / 18.31 / 18.42 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 9.60 / 9.60 / 9.60 | 37 / 37 / 37 | 14 / 14 / 14 |
| a8-p2.0-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 23.44 / 23.56 / 23.68 | 3.30 / 3.32 / 3.34 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a8-p2.0-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 27.54 / 27.70 / 27.91 | 3.30 / 3.32 / 3.34 | 15.93 / 16.04 / 16.15 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 49.33 / 49.33 / 49.33 | 11 / 11 / 11 |
| a8-p2.0-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 23.44 / 23.56 / 23.68 | 3.30 / 3.32 / 3.34 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a8-p2.0-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 27.54 / 27.70 / 27.91 | 3.30 / 3.32 / 3.34 | 15.93 / 16.04 / 16.15 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 49 / 50 / 50 | 11 / 11 / 11 |
| a8-p2.0-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 23.27 / 23.44 / 23.66 | 5.02 / 5.08 / 5.12 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a8-p2.0-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 26.50 / 26.69 / 26.86 | 5.02 / 5.08 / 5.12 | 17.32 / 17.46 / 17.59 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 46.67 / 46.67 / 46.67 | 11 / 11 / 11 |
| a8-p2.0-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 23.27 / 23.44 / 23.66 | 5.02 / 5.08 / 5.12 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a8-p2.0-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 26.50 / 26.69 / 26.86 | 5.02 / 5.08 / 5.12 | 17.32 / 17.46 / 17.59 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 47 / 48 / 48 | 11 / 11 / 11 |
| a8-p2.0-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 23.25 / 23.37 / 23.49 | 7.21 / 7.29 / 7.33 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a8-p2.0-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 25.61 / 25.77 / 25.89 | 7.21 / 7.29 / 7.33 | 18.88 / 19.15 / 19.34 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 44 / 44 / 44 | 11 / 11 / 11 |
| a8-p2.0-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 23.25 / 23.37 / 23.49 | 7.21 / 7.29 / 7.33 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a8-p2.0-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 2.97 / 2.99 / 3.01 | 25.61 / 25.77 / 25.89 | 7.21 / 7.29 / 7.33 | 18.88 / 19.15 / 19.34 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 45 / 45 / 45 | 11 / 11 / 11 |
| a10-p1.6-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.09 / 14.19 / 14.29 | 3.28 / 3.32 / 3.34 | 38.02 / 38.16 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.01 / 14.14 / 14.26 | 3.28 / 3.32 / 3.34 | 14.99 / 15.12 / 15.25 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 38.67 / 40 / 40 | 15 / 15 / 15 |
| a10-p1.6-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.09 / 14.19 / 14.29 | 3.28 / 3.32 / 3.34 | 38.02 / 38.16 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.01 / 14.14 / 14.26 | 3.28 / 3.32 / 3.34 | 14.99 / 15.12 / 15.25 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 38 / 38 / 38 | 15 / 15 / 15 |
| a10-p1.6-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.92 / 14.03 / 14.14 | 5.02 / 5.08 / 5.12 | 16.19 / 16.30 / 16.41 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 15 / 16 / 16 |
| a10-p1.6-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.92 / 14.03 / 14.14 | 5.02 / 5.08 / 5.12 | 16.19 / 16.30 / 16.41 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 15 / 16 / 16 |
| a10-p1.6-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.18 / 14.26 | 7.21 / 7.27 / 7.33 | 37.99 / 38.13 / 38.27 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.03 / 14.15 / 14.28 | 7.21 / 7.27 / 7.33 | 17.59 / 17.73 / 17.84 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 8.40 / 8.40 / 8.40 | 32 / 33.33 / 33.33 | 16 / 16 / 16 |
| a10-p1.6-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.18 / 14.26 | 7.21 / 7.27 / 7.33 | 37.99 / 38.13 / 38.27 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.03 / 14.15 / 14.28 | 7.21 / 7.27 / 7.33 | 17.59 / 17.73 / 17.84 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 8.40 / 8.40 / 8.40 | 33 / 33 / 33 | 16 / 16 / 16 |
| a10-p1.8-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 20.20 / 20.45 / 20.55 | 3.32 / 3.36 / 3.38 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 14 / 14 / 14 |
| a10-p1.8-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 22.97 / 23.20 / 23.34 | 3.32 / 3.36 / 3.38 | 15.81 / 15.95 / 16.07 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 46.67 / 46.67 / 46.67 | 12 / 12 / 12 |
| a10-p1.8-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 20.20 / 20.45 / 20.55 | 3.32 / 3.36 / 3.38 | 59.70 / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 14 / 14 / 14 |
| a10-p1.8-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 22.97 / 23.20 / 23.34 | 3.32 / 3.36 / 3.38 | 15.81 / 15.95 / 16.07 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 46 / 47 / 47 | 12 / 12 / 12 |
| a10-p1.8-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 20.15 / 20.25 / 20.37 | 5.06 / 5.12 / 5.16 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 14 / 14 / 14 |
| a10-p1.8-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 21.94 / 22.07 / 22.26 | 5.06 / 5.12 / 5.16 | 17.23 / 17.34 / 17.45 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 44 / 44 / 44 | 12 / 12 / 12 |
| a10-p1.8-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 20.15 / 20.25 / 20.37 | 5.06 / 5.12 / 5.16 | 59.69 / 59.85 / 59.99 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 14 / 14 / 14 |
| a10-p1.8-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 21.94 / 22.07 / 22.26 | 5.06 / 5.12 / 5.16 | 17.23 / 17.34 / 17.45 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 44 / 44 / 44 | 12 / 12 / 12 |
| a10-p1.8-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 19.99 / 20.25 / 20.36 | 7.25 / 7.33 / 7.37 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 14 / 14 / 14 |
| a10-p1.8-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 20.89 / 21.32 / 21.42 | 7.25 / 7.33 / 7.37 | 18.79 / 18.93 / 19.08 | 2.40 / 2.40 / 2.40 | 3.60 / 4.80 / 4.80 | 9.60 / 9.60 / 10.80 | 40 / 40 / 41.33 | 12 / 12 / 12 |
| a10-p1.8-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 19.99 / 20.25 / 20.36 | 7.25 / 7.33 / 7.37 | 59.51 / 59.81 / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 14 / 14 / 14 |
| a10-p1.8-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.99 / 3.03 / 3.05 | 20.89 / 21.32 / 21.42 | 7.25 / 7.33 / 7.37 | 18.79 / 18.93 / 19.08 | 2.40 / 2.40 / 2.40 | 3.60 / 4.80 / 4.80 | 9.60 / 9.60 / 10.80 | 42 / 42 / 42 | 12 / 12 / 12 |
| a10-p2.0-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.08 / 4.12 / 4.14 | 29.21 / 29.38 / 29.50 | 3.34 / 3.38 / 3.40 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 12 / 12 |
| a10-p2.0-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.08 / 4.12 / 4.14 | 35.72 / 35.92 / 36.06 | 3.34 / 3.38 / 3.40 | 16.60 / 16.73 / 16.84 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 50.67 / 52 / 52 | 10 / 10 / 10 |
| a10-p2.0-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.08 / 4.12 / 4.14 | 29.21 / 29.38 / 29.50 | 3.34 / 3.38 / 3.40 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 12 / 12 |
| a10-p2.0-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.08 / 4.12 / 4.14 | 35.72 / 35.92 / 36.06 | 3.34 / 3.38 / 3.40 | 16.60 / 16.73 / 16.84 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 53 / 53 / 53 | 10 / 10 / 10 |
| a10-p2.0-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 29.17 / 29.33 / 29.47 | 5.10 / 5.16 / 5.18 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 12 / 12 |
| a10-p2.0-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 34.77 / 34.95 / 35.07 | 5.10 / 5.16 / 5.18 | 17.82 / 17.94 / 18.07 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 49.33 / 49.33 / 49.33 | 10 / 10 / 10 |
| a10-p2.0-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 29.17 / 29.33 / 29.47 | 5.10 / 5.16 / 5.18 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 12 / 12 |
| a10-p2.0-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 34.77 / 34.95 / 35.07 | 5.10 / 5.16 / 5.18 | 17.82 / 17.94 / 18.07 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 51 / 51 / 51 | 10 / 10 / 10 |
| a10-p2.0-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 29.02 / 29.18 / 29.30 | 7.29 / 7.35 / 7.41 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 12 / 12 / 12 |
| a10-p2.0-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 33.84 / 33.99 / 34.18 | 7.29 / 7.35 / 7.41 | 19.53 / 19.67 / 19.77 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 45.33 / 45.33 / 46.67 | 10 / 10 / 10 |
| a10-p2.0-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 29.02 / 29.18 / 29.30 | 7.29 / 7.35 / 7.41 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 12 / 12 / 12 |
| a10-p2.0-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.68 / 3.72 / 3.74 | 33.84 / 33.99 / 34.18 | 7.29 / 7.35 / 7.41 | 19.53 / 19.67 / 19.77 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 48 / 48 / 48 | 10 / 10 / 10 |
| a12-p1.6-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.88 / 16.98 / 17.11 | 3.32 / 3.36 / 3.38 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 15 / 15 / 15 |
| a12-p1.6-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 17.94 / 18.08 / 18.20 | 3.32 / 3.36 / 3.38 | 15.65 / 15.80 / 15.93 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 10.80 | 42.67 / 42.67 / 42.67 | 14 / 14 / 14 |
| a12-p1.6-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.88 / 16.98 / 17.11 | 3.32 / 3.36 / 3.38 | 45.51 / 45.65 / 45.77 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 15 / 15 / 15 |
| a12-p1.6-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 17.94 / 18.08 / 18.20 | 3.32 / 3.36 / 3.38 | 15.65 / 15.80 / 15.93 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 10.80 | 42 / 42 / 42 | 14 / 14 / 14 |
| a12-p1.6-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.85 / 16.95 / 17.05 | 5.06 / 5.12 / 5.16 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 15 / 15 / 15 |
| a12-p1.6-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 17.39 / 17.55 / 17.66 | 5.06 / 5.12 / 5.16 | 16.86 / 17.17 / 17.34 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 40 / 40 / 40 | 14 / 14 / 14 |
| a12-p1.6-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.85 / 16.95 / 17.05 | 5.06 / 5.12 / 5.16 | 45.33 / 45.62 / 45.76 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 15 / 15 / 15 |
| a12-p1.6-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 17.39 / 17.55 / 17.66 | 5.06 / 5.12 / 5.16 | 16.86 / 17.17 / 17.34 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 40 / 40 / 40 | 14 / 14 / 14 |
| a12-p1.6-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.68 / 16.80 / 16.89 | 7.25 / 7.33 / 7.37 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 0 / 0 / 0 | 15 / 15 / 16 |
| a12-p1.6-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.54 / 16.66 / 16.80 | 7.25 / 7.33 / 7.37 | 18.36 / 18.48 / 18.59 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 14 / 14 / 14 |
| a12-p1.6-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.68 / 16.80 / 16.89 | 7.25 / 7.33 / 7.37 | 45.32 / 45.48 / 45.62 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 15 / 15 / 16 |
| a12-p1.6-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.85 / 2.89 / 2.91 | 16.54 / 16.66 / 16.80 | 7.25 / 7.33 / 7.37 | 18.36 / 18.48 / 18.59 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 9.60 / 9.60 / 9.60 | 37 / 37 / 37 | 14 / 14 / 14 |
| a12-p1.8-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.00 / 4.04 / 4.05 | 24.17 / 24.44 / 24.60 | 3.36 / 3.40 / 3.42 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a12-p1.8-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.00 / 4.04 / 4.05 | 28.50 / 28.68 / 28.80 | 3.36 / 3.40 / 3.42 | 16.16 / 16.29 / 16.42 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 49.33 / 49.33 / 49.33 | 11 / 11 / 11 |
| a12-p1.8-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.00 / 4.04 / 4.05 | 24.17 / 24.44 / 24.60 | 3.36 / 3.40 / 3.42 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a12-p1.8-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.00 / 4.04 / 4.05 | 28.50 / 28.68 / 28.80 | 3.36 / 3.40 / 3.42 | 16.16 / 16.29 / 16.42 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 49 / 50 / 50 | 11 / 11 / 11 |
| a12-p1.8-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 24.15 / 24.27 / 24.39 | 5.12 / 5.16 / 5.20 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a12-p1.8-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 27.67 / 27.84 / 27.98 | 5.12 / 5.16 / 5.20 | 17.57 / 17.70 / 17.84 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 46.67 / 46.67 / 46.67 | 11 / 11 / 11 |
| a12-p1.8-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 24.15 / 24.27 / 24.39 | 5.12 / 5.16 / 5.20 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a12-p1.8-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 27.67 / 27.84 / 27.98 | 5.12 / 5.16 / 5.20 | 17.57 / 17.70 / 17.84 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 47 / 47 / 47 | 11 / 11 / 11 |
| a12-p1.8-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 23.96 / 24.10 / 24.39 | 7.31 / 7.37 / 7.43 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a12-p1.8-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 26.73 / 26.88 / 27.07 | 7.31 / 7.37 / 7.43 | 19.36 / 19.48 / 19.61 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 42.67 / 44 / 44 | 11 / 11 / 11 |
| a12-p1.8-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 23.96 / 24.10 / 24.39 | 7.31 / 7.37 / 7.43 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 13 / 13 / 13 |
| a12-p1.8-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 3.57 / 3.61 / 3.63 | 26.73 / 26.88 / 27.07 | 7.31 / 7.37 / 7.43 | 19.36 / 19.48 / 19.61 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 10.80 / 10.80 | 45 / 45 / 45 | 11 / 11 / 11 |
| a12-p2.0-g60|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.92 / 4.96 / 4.98 | 35.01 / 35.27 / 35.47 | 3.38 / 3.42 / 3.44 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 11 / 11 |
| a12-p2.0-g60|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.75 / 4.79 / 4.81 | 44.43 / 44.98 / not reached | 3.38 / 3.42 / 3.44 | 17.02 / 17.17 / 17.29 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 12 / 12 / 12 | 52 / 52 / 52 | 9 / 10 / 10 |
| a12-p2.0-g60|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.92 / 4.96 / 4.98 | 35.01 / 35.27 / 35.47 | 3.38 / 3.42 / 3.44 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 11 / 11 |
| a12-p2.0-g60|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.75 / 4.79 / 4.81 | 44.43 / 44.98 / 45.20 | 3.38 / 3.42 / 3.44 | 17.02 / 17.17 / 17.29 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 12 / 12 / 12 | 56 / 56 / 56 | 9 / 10 / 10 |
| a12-p2.0-g100|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 34.96 / 35.14 / 35.26 | 5.16 / 5.20 / 5.24 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 11 / 11 |
| a12-p2.0-g100|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 43.09 / 43.47 / 43.65 | 5.16 / 5.20 / 5.24 | 18.45 / 18.60 / 18.71 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 48 / 49.33 / 49.33 | 10 / 10 / 10 |
| a12-p2.0-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 34.96 / 35.14 / 35.26 | 5.16 / 5.20 / 5.24 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 11 / 11 |
| a12-p2.0-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 43.09 / 43.47 / 43.65 | 5.16 / 5.20 / 5.24 | 18.45 / 18.60 / 18.71 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 53 / 53 / 54 | 10 / 10 / 10 |
| a12-p2.0-g150|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 34.80 / 34.98 / 35.14 | 7.35 / 7.41 / 7.45 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 11 / 11 |
| a12-p2.0-g150|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 42.14 / 42.34 / 42.47 | 7.35 / 7.41 / 7.45 | 20.05 / 20.20 / 20.32 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 45.33 / 45.33 / 45.33 | 10 / 10 / 10 |
| a12-p2.0-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 34.80 / 34.98 / 35.14 | 7.35 / 7.41 / 7.45 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | not reached / not reached / not reached | 0 / 0 / 0 | 11 / 11 / 11 |
| a12-p2.0-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 4.40 / 4.44 / 4.46 | 42.14 / 42.34 / 42.47 | 7.35 / 7.41 / 7.45 | 20.05 / 20.20 / 20.32 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 10.80 / 10.80 / 10.80 | 51 / 51 / 51 | 10 / 10 / 10 |
| a10-p1.6-g100-x3|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4 / 4 / 4 | 3.21 / 3.25 / 3.27 | 15.32 / 15.44 / 15.52 | 5.10 / 5.16 / 5.20 | 39.26 / 39.41 / 39.52 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 16 / 17 / 17 |
| a10-p1.6-g100-x3|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4 / 4 / 4 | 3.21 / 3.25 / 3.27 | 15.26 / 15.38 / 15.49 | 5.10 / 5.16 / 5.20 | 16.63 / 16.76 / 16.87 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 37.33 / 37.33 / 37.33 | 15 / 15 / 15 |
| a10-p1.6-g100-x3|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4 / 4 / 4 | 3.21 / 3.25 / 3.27 | 15.32 / 15.44 / 15.52 | 5.10 / 5.16 / 5.20 | 39.26 / 39.41 / 39.52 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 16 / 17 / 17 |
| a10-p1.6-g100-x3|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4 / 4 / 4 | 3.21 / 3.25 / 3.27 | 15.26 / 15.38 / 15.49 | 5.10 / 5.16 / 5.20 | 16.63 / 16.76 / 16.87 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 36 / 37 / 37 | 15 / 15 / 15 |
| a10-p1.6-g100-x5|PR-NEW|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 12.84 / 12.94 / 13.02 | 4.96 / 5.02 / 5.08 | 36.78 / 36.92 / 37.04 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g100-x5|PR-NEW|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 12.66 / 12.96 / 13.06 | 4.96 / 5.02 / 5.08 | 15.55 / 15.64 / 15.74 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 8.40 / 8.40 / 8.40 | 34.67 / 36 / 36 | 16 / 16 / 16 |
| a10-p1.6-g100-x5|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 12.84 / 12.94 / 13.02 | 4.96 / 5.02 / 5.08 | 36.78 / 36.92 / 37.04 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 |
| a10-p1.6-g100-x5|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2 / 2 / 2 | 1.94 / 1.96 / 1.98 | 12.66 / 12.96 / 13.06 | 4.96 / 5.02 / 5.08 | 15.55 / 15.64 / 15.74 | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | 8.40 / 8.40 / 8.40 | 35 / 35 / 35 | 16 / 16 / 16 |

## Notes and limitations

- S1 is a single-character diagnostic model (experiment plan principle 10): no recruits, classes, abilities, gear, sinks, offline progress or Monuments; gold and materials only accumulate.
- All inputs are candidates (content w1-slice.candidate.v0.1.0 and the S1 resolutions S1-R01..R17); every output is model-output, not live-validated.
- Engagement overhead and walk times are the most uncertain inputs (to be measured in M2).
- Pass 2 is fixed in advance at the base curve; it does not depend on pass 1 results.

