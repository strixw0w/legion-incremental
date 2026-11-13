# S1.1-E01-base-attribution

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** With the corrected engine, how do the base calibration cells change, and which change comes from bug fixes, the estimator correction or the policy correction?

**Design.** Base candidate (a10-p1.6-g100, the S1-E01 winner and base) x PR-NEW, PR-BAL x 3 S1 controls + 3 corrected policies x estimator s1 / s1.1, 200 replicates with the S1-E01 seed root. Controls with the S1 estimator must reproduce S1-E01 exactly (engineering gate A1).

**Seeds:** root `S1-E01`, 200 replicates per cell (replicate i uses `S1-E01#rep-i`).

**Semantic fingerprint:** `46730cdf03bfae235bc5d30c76040059d56721eaa008d6d0afc2431e22dee954` (manifest SHA-256 `3131d8cf00a242fc18bcca6df6e25663f95b11457b31049fbd8771ed263ed01d`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |
|---|---|---|---|---|---|---|
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | 10.40 | pass |
| H-S1-01 | First kill within 30 s for a newcomer | target | p90 <= 30 s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | 10.40 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | 3 | pass |
| H-S1-02 | Level 2 after 1-3 kills | target | p50 in [1, 3] kills | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | 3 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | 2.40 | pass |
| H-S1-03a | On-tier early TTK 2-5 s: zone 1 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | 2.40 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 4.80 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | 3.60 | pass |
| H-S1-03b | On-tier early TTK 2-5 s: zone 2 at first visit | target | p50 in [2, 5] s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | 3.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 9.60 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 6 | pass |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | not reached | not-reached |
| H-S1-04 | Harder enemy TTK 5-15 s: zone 3 at first visit | target | p50 in [5, 15] s | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | not reached | not-reached |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | 6.17 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | 6.17 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | 6.17 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | 6.17 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | 6.17 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | 6.17 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 5.08 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | 6.17 | pass |
| H-S1-05 | First new zone first-visited in 5-10 active min | target | p50 in [5, 10] active min | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | 6.17 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 2.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 2.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 2.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 2.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 2.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 2.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 2.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 2.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 6.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | not reached | not-reached |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | 2.45 | miss |
| H-S1-07a | Level 5 in 3-5 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [3, 5] active min | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | 2.45 | miss |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | 14.03 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | 14.03 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | 14.10 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | 14.10 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | 14.07 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | 14.07 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | 14.03 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | 14.03 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | 14.10 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | 14.10 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | 14.16 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | 14.07 | pass |
| H-S1-07b | Level 10 in 10-20 min (single hero only; recruits and gear will change this) | diagnostic | p50 in [10, 20] active min | a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | 14.07 | pass |

*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | firstKillS | killsToL2 | minToL5 | minToL10 | zone2FirstVisitMin | zone3FirstVisitMin | ttkZ1FirstVisitS | ttkZ2FirstVisitS | ttkZ3FirstVisitS | deathsPerHour | levelAt45 | deathsPerHour | autoFarmStops | expTotal | levelAt60 | policyStopReports | activeManualMin | materialsPerHour | materialDropEventsPerHour |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.92 / 14.03 / 14.14 | 5.02 / 5.08 / 5.12 | 16.19 / 16.30 / 16.41 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 15 / 16 / 16 | 36 / 36 / 36 | 25 / 25 / 25 | 4768 / 4812 / 4834 | not reached / not reached / not reached | 0 / 0 / 0 | 2.75 / 2.75 / 2.75 | 102.67 / 117.33 / 132 | 102.67 / 117.33 / 132 |
| a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.92 / 14.03 / 14.14 | 5.02 / 5.08 / 5.12 | 16.19 / 16.30 / 16.41 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 15 / 16 / 16 | 36 / 36 / 36 | 25 / 25 / 25 | 4768 / 4812 / 4834 | not reached / not reached / not reached | 0 / 0 / 0 | 2.75 / 2.75 / 2.75 | 102.67 / 117.33 / 132 | 102.67 / 117.33 / 132 |
| a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 5802 / 5824 / 5846 | not reached / not reached / not reached | 0 / 0 / 0 | 4 / 4 / 4 | 180 / 200 / 217.33 | 180 / 200 / 217.33 |
| a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 5802 / 5824 / 5846 | not reached / not reached / not reached | 0 / 0 / 0 | 4 / 4 / 4 | 180 / 200 / 217.33 | 180 / 200 / 217.33 |
| a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.79 / 14.10 / 14.23 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 4 / 5.33 / 5.33 | 17 / 17 / 17 | 4 / 5.33 / 5.33 | 1 / 2 / 2 | 6192 / 6212 / 6260 | not reached / not reached / not reached | 0 / 0 / 0 | 0.75 / 0.83 / 0.83 | 533.33 / 564 / 593.33 | 533.33 / 564 / 593.33 |
| a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.79 / 14.10 / 14.23 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 4 / 5.33 / 5.33 | 17 / 17 / 17 | 4 / 5.33 / 5.33 | 1 / 2 / 2 | 6192 / 6212 / 6260 | not reached / not reached / not reached | 0 / 0 / 0 | 0.75 / 0.83 / 0.83 | 533.33 / 564 / 593.33 | 533.33 / 564 / 593.33 |
| a10-p1.6-g100|PR-NEW|POL-STAY|est-s1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 16.25 / 16.35 / 16.45 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 0 / 0 / 0 | 16 / 16 / 16 | 0 / 0 / 0 | 0 / 0 / 0 | 5032 / 5054 / 5076 | not reached / not reached / not reached | 0 / 0 / 0 | 6.58 / 6.63 / 6.68 | 106.67 / 121.33 / 134.67 | 106.67 / 121.33 / 134.67 |
| a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 16.25 / 16.35 / 16.45 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 0 / 0 / 0 | 16 / 16 / 16 | 0 / 0 / 0 | 0 / 0 / 0 | 5032 / 5054 / 5076 | not reached / not reached / not reached | 0 / 0 / 0 | 6.58 / 6.63 / 6.68 | 106.67 / 121.33 / 134.67 | 106.67 / 121.33 / 134.67 |
| a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 5802 / 5824 / 5846 | not reached / not reached / not reached | 0 / 0 / 0 | 4 / 4 / 4 | 180 / 200 / 217.33 | 180 / 200 / 217.33 |
| a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 5802 / 5824 / 5846 | not reached / not reached / not reached | 0 / 0 / 0 | 4 / 4 / 4 | 180 / 200 / 217.33 | 180 / 200 / 217.33 |
| a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.97 / 14.07 / 14.17 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 6200 / 6216 / 6232 | not reached / not reached / not reached | 0 / 0 / 0 | 1.50 / 1.50 / 1.50 | 533.33 / 562.67 / 592 | 533.33 / 562.67 / 592 |
| a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.97 / 14.07 / 14.17 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 6200 / 6216 / 6232 | not reached / not reached / not reached | 0 / 0 / 0 | 1.50 / 1.50 / 1.50 | 533.33 / 562.67 / 592 | 533.33 / 562.67 / 592 |
| a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.92 / 14.03 / 14.14 | 5.02 / 5.08 / 5.12 | 16.19 / 16.30 / 16.41 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 15 / 16 / 16 | 36 / 36 / 36 | 34 / 34 / 34 | 7012 / 7056 / 7078 | 18 / 18 / 18 | 0 / 0 / 0 | 3.50 / 3.50 / 3.50 | 96 / 109 / 122 | 96 / 109 / 122 |
| a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.92 / 14.03 / 14.14 | 5.02 / 5.08 / 5.12 | 16.19 / 16.30 / 16.41 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 36 / 36 / 36 | 15 / 16 / 16 | 36 / 36 / 36 | 34 / 34 / 34 | 7012 / 7056 / 7078 | 18 / 18 / 18 | 0 / 0 / 0 | 3.50 / 3.50 / 3.50 | 96 / 109 / 122 | 96 / 109 / 122 |
| a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 8178 / 8200 / 8244 | 19 / 19 / 19 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 | 157 / 171 / 185 | 157 / 171 / 185 |
| a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 8178 / 8200 / 8244 | 19 / 19 / 19 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 | 157 / 171 / 185 | 157 / 171 / 185 |
| a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.79 / 14.10 / 14.23 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 3 / 4 / 4 | 17 / 17 / 17 | 3 / 4 / 4 | 1 / 2 / 2 | 9280 / 9310 / 9380 | 20 / 20 / 20 | 0 / 0 / 0 | 1.08 / 1.17 / 1.17 | 493 / 517 / 541 | 493 / 517 / 541 |
| a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1 | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.79 / 14.10 / 14.23 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 3 / 4 / 4 | 17 / 17 / 17 | 3 / 4 / 4 | 1 / 2 / 2 | 9280 / 9310 / 9380 | 20 / 20 / 20 | 0 / 0 / 0 | 1.08 / 1.17 / 1.17 | 493 / 517 / 541 | 493 / 517 / 541 |
| a10-p1.6-g100|PR-BAL|POL-STAY|est-s1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 16.25 / 16.35 / 16.45 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 0 / 0 / 0 | 16 / 16 / 16 | 0 / 0 / 0 | 0 / 0 / 0 | 7364 / 7386 / 7430 | 18 / 18 / 18 | 0 / 0 / 0 | 8.48 / 8.58 / 8.65 | 99 / 112 / 125 | 99 / 112 / 125 |
| a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 16.25 / 16.35 / 16.45 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 9.60 / 9.60 / 9.60 | 0 / 0 / 0 | 16 / 16 / 16 | 0 / 0 / 0 | 0 / 0 / 0 | 7364 / 7386 / 7430 | 18 / 18 / 18 | 0 / 0 / 0 | 8.48 / 8.58 / 8.65 | 99 / 112 / 125 | 99 / 112 / 125 |
| a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 8178 / 8200 / 8244 | 19 / 19 / 19 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 | 157 / 171 / 185 | 157 / 171 / 185 |
| a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 2.40 / 2.40 / 2.40 | 4.80 / 4.80 / 4.80 | 6 / 6 / 6 | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 8178 / 8200 / 8244 | 19 / 19 / 19 | 0 / 0 / 0 | 5.83 / 5.83 / 5.83 | 157 / 171 / 185 | 157 / 171 / 185 |
| a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.97 / 14.07 / 14.17 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 9290 / 9320 / 9340 | 20 / 20 / 20 | 0 / 0 / 0 | 1.83 / 1.83 / 1.83 | 493 / 517 / 541 | 493 / 517 / 541 |
| a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 | model-output (realistic) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 13.97 / 14.07 / 14.17 | 6.11 / 6.17 / 6.23 | not reached / not reached / not reached | 2.40 / 2.40 / 2.40 | 3.60 / 3.60 / 3.60 | not reached / not reached / not reached | 0 / 0 / 0 | 17 / 17 / 17 | 0 / 0 / 0 | 0 / 0 / 0 | 9290 / 9320 / 9340 | 20 / 20 / 20 | 0 / 0 / 0 | 1.83 / 1.83 / 1.83 | 493 / 517 / 541 | 493 / 517 / 541 |

## Notes and limitations

- S1.1 correction pass (owner review 'Independent S1 Review and S1.1 Authorisation'). Single-character diagnostic model; no recruits, classes, abilities, gear, sinks, offline progress or Monuments.
- All inputs are candidates (content w1-slice.candidate.v0.1.0, unchanged; owner resolutions S1-R01..R17; S1.1 rules S1.1-R01..R15); every output is model-output, not live-validated.
- Policies: POL-* are the corrected S1.1 realistic policies; CTL-*-S1 are the S1 decision logic kept as diagnostic controls; ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control, never an upper bound.
- Seeds: the same seed roots as the corresponding S1 experiments, so S1, controls and corrected policies face the same random draws.
- Targets are the S1-E01 targets, unchanged. They are evaluated in every cell; the corrected-policy cells (POL-*, est-s1.1) are the S1.1 result, the others are attribution steps.

