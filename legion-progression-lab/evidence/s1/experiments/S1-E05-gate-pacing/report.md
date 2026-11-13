# S1-E05-gate-pacing

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Are later gates progressively longer (zone 2 -> 3 longer than zone 1 -> 2)?

**Design.** Zone 2 kill gate in {80, 120, 180} crossed with the full S1-E01 pass-1 grid (27 variants), so the S1-E01 winner (selected by the pre-registered rule) is included without an adaptive step; PR-OPT (90 min); POL-STAY and POL-FRONTIER; 200 replicates.

**Seeds:** root `S1-E05`, 200 replicates per cell (replicate i uses `S1-E05#rep-i`).

**Semantic fingerprint:** `c963e86f416f11dd72e893e224afb5e75fae5caa8f18ee06aed36ab5eec98e0e` (manifest SHA-256 `070e8fd2231be90f56d4d2996734e8e8ddd3ce5ae1db2bdc5b1319cabe29591a`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |
|---|---|---|---|---|---|---|
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60-z80|PR-OPT|POL-STAY | 2.45 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60-z80|PR-OPT|POL-FRONTIER | 8.36 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60-z120|PR-OPT|POL-STAY | 3.34 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60-z120|PR-OPT|POL-FRONTIER | 8.36 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60-z180|PR-OPT|POL-STAY | 4.67 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g60-z180|PR-OPT|POL-FRONTIER | 8.36 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100-z80|PR-OPT|POL-STAY | 1.49 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100-z80|PR-OPT|POL-FRONTIER | 5.08 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100-z120|PR-OPT|POL-STAY | 2.05 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100-z120|PR-OPT|POL-FRONTIER | 5.08 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100-z180|PR-OPT|POL-STAY | 2.88 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g100-z180|PR-OPT|POL-FRONTIER | 5.08 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150-z80|PR-OPT|POL-STAY | 0.95 | miss |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150-z80|PR-OPT|POL-FRONTIER | 3.27 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150-z120|PR-OPT|POL-STAY | 1.35 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150-z120|PR-OPT|POL-FRONTIER | 3.27 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150-z180|PR-OPT|POL-STAY | 1.92 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.6-g150-z180|PR-OPT|POL-FRONTIER | 3.27 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60-z80|PR-OPT|POL-STAY | 2.59 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60-z80|PR-OPT|POL-FRONTIER | 13.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60-z120|PR-OPT|POL-STAY | 3.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60-z120|PR-OPT|POL-FRONTIER | 13.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60-z180|PR-OPT|POL-STAY | 5.05 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g60-z180|PR-OPT|POL-FRONTIER | 13.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100-z80|PR-OPT|POL-STAY | 1.62 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100-z80|PR-OPT|POL-FRONTIER | 8.49 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100-z120|PR-OPT|POL-STAY | 2.30 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100-z120|PR-OPT|POL-FRONTIER | 8.49 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100-z180|PR-OPT|POL-STAY | 3.16 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g100-z180|PR-OPT|POL-FRONTIER | 8.49 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150-z80|PR-OPT|POL-STAY | 1.06 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150-z80|PR-OPT|POL-FRONTIER | 5.63 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150-z120|PR-OPT|POL-STAY | 1.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150-z120|PR-OPT|POL-FRONTIER | 5.63 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150-z180|PR-OPT|POL-STAY | 2.09 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p1.8-g150-z180|PR-OPT|POL-FRONTIER | 5.63 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60-z80|PR-OPT|POL-STAY | 2.71 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60-z80|PR-OPT|POL-FRONTIER | 21.94 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60-z120|PR-OPT|POL-STAY | 3.82 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60-z120|PR-OPT|POL-FRONTIER | 21.94 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60-z180|PR-OPT|POL-STAY | 5.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g60-z180|PR-OPT|POL-FRONTIER | 21.94 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100-z80|PR-OPT|POL-STAY | 1.70 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100-z80|PR-OPT|POL-FRONTIER | 13.96 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100-z120|PR-OPT|POL-STAY | 2.43 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100-z120|PR-OPT|POL-FRONTIER | 13.96 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100-z180|PR-OPT|POL-STAY | 3.54 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g100-z180|PR-OPT|POL-FRONTIER | 13.96 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150-z80|PR-OPT|POL-STAY | 1.13 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150-z80|PR-OPT|POL-FRONTIER | 9.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150-z120|PR-OPT|POL-STAY | 1.64 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150-z120|PR-OPT|POL-FRONTIER | 9.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150-z180|PR-OPT|POL-STAY | 2.35 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a8-p2.0-g150-z180|PR-OPT|POL-FRONTIER | 9.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60-z80|PR-OPT|POL-STAY | 2.56 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60-z80|PR-OPT|POL-FRONTIER | 10.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60-z120|PR-OPT|POL-STAY | 3.56 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60-z120|PR-OPT|POL-FRONTIER | 10.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60-z180|PR-OPT|POL-STAY | 4.89 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g60-z180|PR-OPT|POL-FRONTIER | 10.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-z80|PR-OPT|POL-STAY | 1.57 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-z80|PR-OPT|POL-FRONTIER | 6.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-z120|PR-OPT|POL-STAY | 2.21 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-z120|PR-OPT|POL-FRONTIER | 6.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-z180|PR-OPT|POL-STAY | 3.03 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g100-z180|PR-OPT|POL-FRONTIER | 6.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150-z80|PR-OPT|POL-STAY | 1.05 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150-z80|PR-OPT|POL-FRONTIER | 4.25 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150-z120|PR-OPT|POL-STAY | 1.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150-z120|PR-OPT|POL-FRONTIER | 4.25 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150-z180|PR-OPT|POL-STAY | 2.01 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.6-g150-z180|PR-OPT|POL-FRONTIER | 4.25 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60-z80|PR-OPT|POL-STAY | 2.64 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60-z80|PR-OPT|POL-FRONTIER | 16.86 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60-z120|PR-OPT|POL-STAY | 3.74 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60-z120|PR-OPT|POL-FRONTIER | 16.86 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60-z180|PR-OPT|POL-STAY | 5.35 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g60-z180|PR-OPT|POL-FRONTIER | 16.86 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100-z80|PR-OPT|POL-STAY | 1.66 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100-z80|PR-OPT|POL-FRONTIER | 10.68 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100-z120|PR-OPT|POL-STAY | 2.39 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100-z120|PR-OPT|POL-FRONTIER | 10.68 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100-z180|PR-OPT|POL-STAY | 3.36 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g100-z180|PR-OPT|POL-FRONTIER | 10.68 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150-z80|PR-OPT|POL-STAY | 1.11 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150-z80|PR-OPT|POL-FRONTIER | 7.17 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150-z120|PR-OPT|POL-STAY | 1.59 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150-z120|PR-OPT|POL-FRONTIER | 7.17 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150-z180|PR-OPT|POL-STAY | 2.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p1.8-g150-z180|PR-OPT|POL-FRONTIER | 7.17 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60-z80|PR-OPT|POL-STAY | 2.82 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60-z80|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60-z120|PR-OPT|POL-STAY | 3.95 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60-z120|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60-z180|PR-OPT|POL-STAY | 5.61 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g60-z180|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100-z80|PR-OPT|POL-STAY | 1.76 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100-z80|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100-z120|PR-OPT|POL-STAY | 2.48 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100-z120|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100-z180|PR-OPT|POL-STAY | 3.57 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g100-z180|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150-z80|PR-OPT|POL-STAY | 1.17 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150-z80|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150-z120|PR-OPT|POL-STAY | 1.67 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150-z120|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150-z180|PR-OPT|POL-STAY | 2.44 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a10-p2.0-g150-z180|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60-z80|PR-OPT|POL-STAY | 2.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60-z80|PR-OPT|POL-FRONTIER | 12.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60-z120|PR-OPT|POL-STAY | 3.71 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60-z120|PR-OPT|POL-FRONTIER | 12.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60-z180|PR-OPT|POL-STAY | 5.09 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g60-z180|PR-OPT|POL-FRONTIER | 12.60 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100-z80|PR-OPT|POL-STAY | 1.63 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100-z80|PR-OPT|POL-FRONTIER | 7.91 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100-z120|PR-OPT|POL-STAY | 2.35 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100-z120|PR-OPT|POL-FRONTIER | 7.91 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100-z180|PR-OPT|POL-STAY | 3.17 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g100-z180|PR-OPT|POL-FRONTIER | 7.91 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150-z80|PR-OPT|POL-STAY | 1.06 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150-z80|PR-OPT|POL-FRONTIER | 5.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150-z120|PR-OPT|POL-STAY | 1.52 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150-z120|PR-OPT|POL-FRONTIER | 5.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150-z180|PR-OPT|POL-STAY | 2.09 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.6-g150-z180|PR-OPT|POL-FRONTIER | 5.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60-z80|PR-OPT|POL-STAY | 2.70 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60-z80|PR-OPT|POL-FRONTIER | 20.18 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60-z120|PR-OPT|POL-STAY | 3.80 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60-z120|PR-OPT|POL-FRONTIER | 20.18 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60-z180|PR-OPT|POL-STAY | 5.45 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g60-z180|PR-OPT|POL-FRONTIER | 20.18 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100-z80|PR-OPT|POL-STAY | 1.71 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100-z80|PR-OPT|POL-FRONTIER | 12.88 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100-z120|PR-OPT|POL-STAY | 2.43 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100-z120|PR-OPT|POL-FRONTIER | 12.88 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100-z180|PR-OPT|POL-STAY | 3.51 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g100-z180|PR-OPT|POL-FRONTIER | 12.88 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150-z80|PR-OPT|POL-STAY | 1.14 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150-z80|PR-OPT|POL-FRONTIER | 8.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150-z120|PR-OPT|POL-STAY | 1.65 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150-z120|PR-OPT|POL-FRONTIER | 8.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150-z180|PR-OPT|POL-STAY | 2.36 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p1.8-g150-z180|PR-OPT|POL-FRONTIER | 8.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60-z80|PR-OPT|POL-STAY | 2.89 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60-z80|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60-z120|PR-OPT|POL-STAY | 4.03 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60-z120|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60-z180|PR-OPT|POL-STAY | 5.68 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g60-z180|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100-z80|PR-OPT|POL-STAY | 1.82 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100-z80|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100-z120|PR-OPT|POL-STAY | 2.58 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100-z120|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100-z180|PR-OPT|POL-STAY | 3.66 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g100-z180|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150-z80|PR-OPT|POL-STAY | 1.22 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150-z80|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150-z120|PR-OPT|POL-STAY | 1.73 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150-z120|PR-OPT|POL-FRONTIER | not reached | not-reached |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150-z180|PR-OPT|POL-STAY | 2.48 | pass |
| H-S1-06 | Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals) | target | p50 > 1 ratio | a12-p2.0-g150-z180|PR-OPT|POL-FRONTIER | not reached | not-reached |

*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | zone2FirstVisitMin | zone3FirstVisitMin | gate23Over12Ratio | minToL10 | levelAt90 |
|---|---|---|---|---|---|---|
| a8-p1.6-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.22 / 3.26 / 3.30 | 11.17 / 11.27 / 11.37 | 2.42 / 2.45 / 2.51 | 11.92 / 12.10 / 12.17 | 25 / 25 / 25 |
| a8-p1.6-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.22 / 3.26 / 3.30 | 30.46 / 30.58 / 30.70 | 8.29 / 8.36 / 8.49 | 11.30 / 11.38 / 11.44 | 26 / 26 / 26 |
| a8-p1.6-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.22 / 3.26 / 3.30 | 14.06 / 14.14 / 14.24 | 3.29 / 3.34 / 3.38 | 11.10 / 11.40 / 11.50 | 25 / 25 / 25 |
| a8-p1.6-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.22 / 3.26 / 3.30 | 30.46 / 30.58 / 30.70 | 8.29 / 8.36 / 8.49 | 11.30 / 11.38 / 11.44 | 26 / 26 / 26 |
| a8-p1.6-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.22 / 3.26 / 3.30 | 18.23 / 18.53 / 18.63 | 4.58 / 4.67 / 4.73 | 11.10 / 11.40 / 11.50 | 25 / 25 / 25 |
| a8-p1.6-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.22 / 3.26 / 3.30 | 30.46 / 30.58 / 30.70 | 8.29 / 8.36 / 8.49 | 11.30 / 11.38 / 11.44 | 26 / 26 / 26 |
| a8-p1.6-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 4.98 / 5.02 / 5.06 | 12.40 / 12.49 / 12.58 | 1.47 / 1.49 / 1.51 | 11.22 / 11.31 / 11.40 | 25 / 25 / 25 |
| a8-p1.6-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 4.98 / 5.02 / 5.06 | 30.47 / 30.55 / 30.65 | 5.03 / 5.08 / 5.13 | 11.27 / 11.35 / 11.43 | 26 / 26 / 26 |
| a8-p1.6-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 4.98 / 5.02 / 5.06 | 15.24 / 15.34 / 15.43 | 2.03 / 2.05 / 2.08 | 11.22 / 11.31 / 11.40 | 25 / 25 / 25 |
| a8-p1.6-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 4.98 / 5.02 / 5.06 | 30.47 / 30.55 / 30.65 | 5.03 / 5.08 / 5.13 | 11.27 / 11.35 / 11.43 | 26 / 26 / 26 |
| a8-p1.6-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 4.98 / 5.02 / 5.06 | 19.39 / 19.48 / 19.57 | 2.85 / 2.88 / 2.91 | 11.22 / 11.31 / 11.40 | 25 / 25 / 25 |
| a8-p1.6-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 4.98 / 5.02 / 5.06 | 30.47 / 30.55 / 30.65 | 5.03 / 5.08 / 5.13 | 11.27 / 11.35 / 11.43 | 26 / 26 / 26 |
| a8-p1.6-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.15 / 7.23 / 7.29 | 14.00 / 14.10 / 14.21 | 0.94 / 0.95 / 0.97 | 11.50 / 11.62 / 11.73 | 25 / 25 / 25 |
| a8-p1.6-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.15 / 7.23 / 7.29 | 30.61 / 30.89 / 31.02 | 3.23 / 3.27 / 3.31 | 11.43 / 11.53 / 11.76 | 26 / 26 / 26 |
| a8-p1.6-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.15 / 7.23 / 7.29 | 16.84 / 16.94 / 17.04 | 1.33 / 1.35 / 1.36 | 11.50 / 11.62 / 11.73 | 25 / 25 / 25 |
| a8-p1.6-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.15 / 7.23 / 7.29 | 30.61 / 30.89 / 31.02 | 3.23 / 3.27 / 3.31 | 11.43 / 11.53 / 11.76 | 26 / 26 / 26 |
| a8-p1.6-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.15 / 7.23 / 7.29 | 20.99 / 21.09 / 21.18 | 1.90 / 1.92 / 1.94 | 11.50 / 11.62 / 11.73 | 25 / 25 / 25 |
| a8-p1.6-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.15 / 7.23 / 7.29 | 30.61 / 30.89 / 31.02 | 3.23 / 3.27 / 3.31 | 11.43 / 11.53 / 11.76 | 26 / 26 / 26 |
| a8-p1.8-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.26 / 3.30 / 3.32 | 11.73 / 11.81 / 11.91 | 2.56 / 2.59 / 2.63 | 18.99 / 19.08 / 19.16 | 19 / 19 / 19 |
| a8-p1.8-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.26 / 3.30 / 3.32 | 47.89 / 48.16 / 48.30 | 13.50 / 13.60 / 13.76 | 16.29 / 16.39 / 16.49 | 20 / 20 / 20 |
| a8-p1.8-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.26 / 3.30 / 3.32 | 15.43 / 15.56 / 15.69 | 3.67 / 3.73 / 3.78 | 17.03 / 17.13 / 17.26 | 19 / 19 / 19 |
| a8-p1.8-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.26 / 3.30 / 3.32 | 47.89 / 48.16 / 48.30 | 13.50 / 13.60 / 13.76 | 16.29 / 16.39 / 16.49 | 20 / 20 / 20 |
| a8-p1.8-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.26 / 3.30 / 3.32 | 19.78 / 19.91 / 20.05 | 4.98 / 5.05 / 5.11 | 16.08 / 16.21 / 16.35 | 19 / 19 / 19 |
| a8-p1.8-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.26 / 3.30 / 3.32 | 47.89 / 48.16 / 48.30 | 13.50 / 13.60 / 13.76 | 16.29 / 16.39 / 16.49 | 20 / 20 / 20 |
| a8-p1.8-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.00 / 5.06 / 5.10 | 12.94 / 13.24 / 13.34 | 1.56 / 1.62 / 1.64 | 18.09 / 18.20 / 18.30 | 19 / 19 / 19 |
| a8-p1.8-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.00 / 5.06 / 5.10 | 47.84 / 47.98 / 48.29 | 8.42 / 8.49 / 8.60 | 16.10 / 16.22 / 16.46 | 20 / 20 / 20 |
| a8-p1.8-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.00 / 5.06 / 5.10 | 16.57 / 16.68 / 16.79 | 2.28 / 2.30 / 2.33 | 15.98 / 16.08 / 16.20 | 19 / 19 / 19 |
| a8-p1.8-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.00 / 5.06 / 5.10 | 47.84 / 47.98 / 48.29 | 8.42 / 8.49 / 8.60 | 16.10 / 16.22 / 16.46 | 20 / 20 / 20 |
| a8-p1.8-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.00 / 5.06 / 5.10 | 20.74 / 21.07 / 21.18 | 3.10 / 3.16 / 3.21 | 15.98 / 16.08 / 16.20 | 19 / 19 / 19 |
| a8-p1.8-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.00 / 5.06 / 5.10 | 47.84 / 47.98 / 48.29 | 8.42 / 8.49 / 8.60 | 16.10 / 16.22 / 16.46 | 20 / 20 / 20 |
| a8-p1.8-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.19 / 7.25 / 7.31 | 14.88 / 14.96 / 15.08 | 1.05 / 1.06 / 1.08 | 17.40 / 17.58 / 17.68 | 19 / 19 / 19 |
| a8-p1.8-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.19 / 7.25 / 7.31 | 47.89 / 48.09 / 48.21 | 5.57 / 5.63 / 5.69 | 16.22 / 16.30 / 16.40 | 20 / 20 / 20 |
| a8-p1.8-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.19 / 7.25 / 7.31 | 18.16 / 18.31 / 18.42 | 1.50 / 1.52 / 1.54 | 16.06 / 16.17 / 16.28 | 19 / 19 / 19 |
| a8-p1.8-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.19 / 7.25 / 7.31 | 47.89 / 48.09 / 48.21 | 5.57 / 5.63 / 5.69 | 16.22 / 16.30 / 16.40 | 20 / 20 / 20 |
| a8-p1.8-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.19 / 7.25 / 7.31 | 22.33 / 22.45 / 22.56 | 2.08 / 2.09 / 2.12 | 16.06 / 16.17 / 16.28 | 19 / 19 / 19 |
| a8-p1.8-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.19 / 7.25 / 7.31 | 47.89 / 48.09 / 48.21 | 5.57 / 5.63 / 5.69 | 16.22 / 16.30 / 16.40 | 20 / 20 / 20 |
| a8-p2.0-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.30 / 3.32 / 3.34 | 12.19 / 12.33 / 12.41 | 2.67 / 2.71 / 2.74 | 29.70 / 29.82 / 29.93 | 15 / 15 / 15 |
| a8-p2.0-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.30 / 3.32 / 3.34 | 76.05 / 76.23 / 76.39 | 21.80 / 21.94 / 22.12 | 23.46 / 23.58 / 23.68 | 17 / 17 / 17 |
| a8-p2.0-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.30 / 3.32 / 3.34 | 15.91 / 16.05 / 16.14 | 3.79 / 3.82 / 3.87 | 27.55 / 27.71 / 27.89 | 15 / 15 / 15 |
| a8-p2.0-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.30 / 3.32 / 3.34 | 76.05 / 76.23 / 76.39 | 21.80 / 21.94 / 22.12 | 23.46 / 23.58 / 23.68 | 17 / 17 / 17 |
| a8-p2.0-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.30 / 3.32 / 3.34 | 21.47 / 21.63 / 21.78 | 5.45 / 5.51 / 5.58 | 24.63 / 24.77 / 25.29 | 15 / 15 / 15 |
| a8-p2.0-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.30 / 3.32 / 3.34 | 76.05 / 76.23 / 76.39 | 21.80 / 21.94 / 22.12 | 23.46 / 23.58 / 23.68 | 17 / 17 / 17 |
| a8-p2.0-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.04 / 5.08 / 5.12 | 13.59 / 13.75 / 13.84 | 1.68 / 1.70 / 1.73 | 28.30 / 28.78 / 28.89 | 15 / 15 / 15 |
| a8-p2.0-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.04 / 5.08 / 5.12 | 75.84 / 76.06 / 76.38 | 13.85 / 13.96 / 14.09 | 23.27 / 23.48 / 23.66 | 17 / 17 / 17 |
| a8-p2.0-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.04 / 5.08 / 5.12 | 17.30 / 17.48 / 17.59 | 2.41 / 2.43 / 2.47 | 26.53 / 26.73 / 26.86 | 15 / 15 / 15 |
| a8-p2.0-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.04 / 5.08 / 5.12 | 75.84 / 76.06 / 76.38 | 13.85 / 13.96 / 14.09 | 23.27 / 23.48 / 23.66 | 17 / 17 / 17 |
| a8-p2.0-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.04 / 5.08 / 5.12 | 22.81 / 23.07 / 23.20 | 3.49 / 3.54 / 3.58 | 24.07 / 24.23 / 24.45 | 15 / 15 / 15 |
| a8-p2.0-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.04 / 5.08 / 5.12 | 75.84 / 76.06 / 76.38 | 13.85 / 13.96 / 14.09 | 23.27 / 23.48 / 23.66 | 17 / 17 / 17 |
| a8-p2.0-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.23 / 7.29 / 7.33 | 15.40 / 15.49 / 15.59 | 1.11 / 1.13 / 1.14 | 27.24 / 27.39 / 27.53 | 15 / 15 / 15 |
| a8-p2.0-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.23 / 7.29 / 7.33 | 75.86 / 76.04 / 76.22 | 9.37 / 9.44 / 9.51 | 23.25 / 23.39 / 23.49 | 17 / 17 / 17 |
| a8-p2.0-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.23 / 7.29 / 7.33 | 18.93 / 19.20 / 19.34 | 1.60 / 1.64 / 1.66 | 25.59 / 25.77 / 25.88 | 15 / 15 / 15 |
| a8-p2.0-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.23 / 7.29 / 7.33 | 75.86 / 76.04 / 76.22 | 9.37 / 9.44 / 9.51 | 23.25 / 23.39 / 23.49 | 17 / 17 / 17 |
| a8-p2.0-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.23 / 7.29 / 7.33 | 24.24 / 24.39 / 24.53 | 2.32 / 2.35 / 2.37 | 23.11 / 23.28 / 23.42 | 15 / 15 / 15 |
| a8-p2.0-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.23 / 7.29 / 7.33 | 75.86 / 76.04 / 76.22 | 9.37 / 9.44 / 9.51 | 23.25 / 23.39 / 23.49 | 17 / 17 / 17 |
| a10-p1.6-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.28 / 3.32 / 3.34 | 11.67 / 11.79 / 11.87 | 2.52 / 2.56 / 2.60 | 15.68 / 15.87 / 16.00 | 22 / 22 / 22 |
| a10-p1.6-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.28 / 3.32 / 3.34 | 38.02 / 38.15 / 38.27 | 10.43 / 10.51 / 10.64 | 14.09 / 14.19 / 14.27 | 23 / 23 / 23 |
| a10-p1.6-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.28 / 3.32 / 3.34 | 14.99 / 15.12 / 15.23 | 3.52 / 3.56 / 3.62 | 14.01 / 14.13 / 14.25 | 22 / 22 / 22 |
| a10-p1.6-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.28 / 3.32 / 3.34 | 38.02 / 38.15 / 38.27 | 10.43 / 10.51 / 10.64 | 14.09 / 14.19 / 14.27 | 23 / 23 / 23 |
| a10-p1.6-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.28 / 3.32 / 3.34 | 19.38 / 19.51 / 19.63 | 4.83 / 4.89 / 4.95 | 14.01 / 14.13 / 14.25 | 22 / 22 / 22 |
| a10-p1.6-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.28 / 3.32 / 3.34 | 38.02 / 38.15 / 38.27 | 10.43 / 10.51 / 10.64 | 14.09 / 14.19 / 14.27 | 23 / 23 / 23 |
| a10-p1.6-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.02 / 5.06 / 5.12 | 12.88 / 12.99 / 13.31 | 1.54 / 1.57 / 1.62 | 15.21 / 15.34 / 15.43 | 22 / 22 / 22 |
| a10-p1.6-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.02 / 5.06 / 5.12 | 38.00 / 38.12 / 38.24 | 6.45 / 6.51 / 6.59 | 14.06 / 14.16 / 14.24 | 23 / 23 / 23 |
| a10-p1.6-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.02 / 5.06 / 5.12 | 16.19 / 16.29 / 16.40 | 2.18 / 2.21 / 2.24 | 13.92 / 14.02 / 14.13 | 22 / 22 / 22 |
| a10-p1.6-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.02 / 5.06 / 5.12 | 38.00 / 38.12 / 38.24 | 6.45 / 6.51 / 6.59 | 14.06 / 14.16 / 14.24 | 23 / 23 / 23 |
| a10-p1.6-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.02 / 5.06 / 5.12 | 20.33 / 20.43 / 20.55 | 2.99 / 3.03 / 3.07 | 13.92 / 14.02 / 14.13 | 22 / 22 / 23 |
| a10-p1.6-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.02 / 5.06 / 5.12 | 38.00 / 38.12 / 38.24 | 6.45 / 6.51 / 6.59 | 14.06 / 14.16 / 14.24 | 23 / 23 / 23 |
| a10-p1.6-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.21 / 7.27 / 7.33 | 14.76 / 14.86 / 14.98 | 1.03 / 1.05 / 1.06 | 14.04 / 14.14 / 14.26 | 22 / 22 / 22 |
| a10-p1.6-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.21 / 7.27 / 7.33 | 37.99 / 38.13 / 38.27 | 4.21 / 4.25 / 4.29 | 14.08 / 14.16 / 14.26 | 23 / 23 / 23 |
| a10-p1.6-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.21 / 7.27 / 7.33 | 17.61 / 17.71 / 17.83 | 1.42 / 1.44 / 1.46 | 14.04 / 14.14 / 14.26 | 22 / 22 / 22 |
| a10-p1.6-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.21 / 7.27 / 7.33 | 37.99 / 38.13 / 38.27 | 4.21 / 4.25 / 4.29 | 14.08 / 14.16 / 14.26 | 23 / 23 / 23 |
| a10-p1.6-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.21 / 7.27 / 7.33 | 21.76 / 21.86 / 21.97 | 1.99 / 2.01 / 2.03 | 14.04 / 14.14 / 14.26 | 23 / 23 / 23 |
| a10-p1.6-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.21 / 7.27 / 7.33 | 37.99 / 38.13 / 38.27 | 4.21 / 4.25 / 4.29 | 14.08 / 14.16 / 14.26 | 23 / 23 / 23 |
| a10-p1.8-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.34 / 3.36 / 3.38 | 12.10 / 12.20 / 12.30 | 2.59 / 2.64 / 2.67 | 24.61 / 24.73 / 24.84 | 17 / 17 / 17 |
| a10-p1.8-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.34 / 3.36 / 3.38 | 59.74 / 60.02 / 60.16 | 16.75 / 16.86 / 17.02 | 20.30 / 20.45 / 20.55 | 18 / 18 / 18 |
| a10-p1.8-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.34 / 3.36 / 3.38 | 15.78 / 15.93 / 16.06 | 3.70 / 3.74 / 3.79 | 22.97 / 23.19 / 23.33 | 17 / 17 / 17 |
| a10-p1.8-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.34 / 3.36 / 3.38 | 59.74 / 60.02 / 60.16 | 16.75 / 16.86 / 17.02 | 20.30 / 20.45 / 20.55 | 18 / 18 / 18 |
| a10-p1.8-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.34 / 3.36 / 3.38 | 21.00 / 21.37 / 21.55 | 5.25 / 5.35 / 5.43 | 20.08 / 20.22 / 20.39 | 17 / 17 / 17 |
| a10-p1.8-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.34 / 3.36 / 3.38 | 59.74 / 60.02 / 60.16 | 16.75 / 16.86 / 17.02 | 20.30 / 20.45 / 20.55 | 18 / 18 / 18 |
| a10-p1.8-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.08 / 5.12 / 5.16 | 13.52 / 13.61 / 13.70 | 1.64 / 1.66 / 1.68 | 23.61 / 23.70 / 23.80 | 17 / 17 / 17 |
| a10-p1.8-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.08 / 5.12 / 5.16 | 59.69 / 59.85 / 59.97 | 10.60 / 10.68 / 10.79 | 20.15 / 20.25 / 20.35 | 18 / 18 / 18 |
| a10-p1.8-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.08 / 5.12 / 5.16 | 17.22 / 17.35 / 17.46 | 2.36 / 2.39 / 2.42 | 21.94 / 22.08 / 22.28 | 17 / 17 / 17 |
| a10-p1.8-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.08 / 5.12 / 5.16 | 59.69 / 59.85 / 59.97 | 10.60 / 10.68 / 10.79 | 20.15 / 20.25 / 20.35 | 18 / 18 / 18 |
| a10-p1.8-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.08 / 5.12 / 5.16 | 22.18 / 22.33 / 22.44 | 3.32 / 3.36 / 3.40 | 19.98 / 20.13 / 20.23 | 17 / 17 / 17 |
| a10-p1.8-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.08 / 5.12 / 5.16 | 59.69 / 59.85 / 59.97 | 10.60 / 10.68 / 10.79 | 20.15 / 20.25 / 20.35 | 18 / 18 / 18 |
| a10-p1.8-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.27 / 7.31 / 7.37 | 15.31 / 15.41 / 15.49 | 1.09 / 1.11 / 1.12 | 22.71 / 22.82 / 22.94 | 17 / 17 / 17 |
| a10-p1.8-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.27 / 7.31 / 7.37 | 59.55 / 59.83 / 59.99 | 7.10 / 7.17 / 7.23 | 20.01 / 20.25 / 20.38 | 18 / 18 / 18 |
| a10-p1.8-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.27 / 7.31 / 7.37 | 18.81 / 18.92 / 19.15 | 1.57 / 1.59 / 1.62 | 20.89 / 21.32 / 21.41 | 17 / 17 / 17 |
| a10-p1.8-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.27 / 7.31 / 7.37 | 59.55 / 59.83 / 59.99 | 7.10 / 7.17 / 7.23 | 20.01 / 20.25 / 20.38 | 18 / 18 / 18 |
| a10-p1.8-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.27 / 7.31 / 7.37 | 23.41 / 23.55 / 23.66 | 2.19 / 2.22 / 2.24 | 19.90 / 20.05 / 20.16 | 17 / 17 / 17 |
| a10-p1.8-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.27 / 7.31 / 7.37 | 59.55 / 59.83 / 59.99 | 7.10 / 7.17 / 7.23 | 20.01 / 20.25 / 20.38 | 18 / 18 / 18 |
| a10-p2.0-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.34 / 3.38 / 3.40 | 12.66 / 12.91 / 13.05 | 2.75 / 2.82 / 2.88 | 38.74 / 38.91 / 39.09 | 13 / 13 / 13 |
| a10-p2.0-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.34 / 3.38 / 3.40 | not reached / not reached / not reached | not reached / not reached / not reached | 29.23 / 29.36 / 29.52 | 15 / 15 / 15 |
| a10-p2.0-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.34 / 3.38 / 3.40 | 16.59 / 16.73 / 16.84 | 3.90 / 3.95 / 4.01 | 35.70 / 35.91 / 36.05 | 13 / 13 / 13 |
| a10-p2.0-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.34 / 3.38 / 3.40 | not reached / not reached / not reached | not reached / not reached / not reached | 29.23 / 29.36 / 29.52 | 15 / 15 / 15 |
| a10-p2.0-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.34 / 3.38 / 3.40 | 22.03 / 22.32 / 22.48 | 5.52 / 5.61 / 5.67 | 33.15 / 33.29 / 33.44 | 14 / 14 / 14 |
| a10-p2.0-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.34 / 3.38 / 3.40 | not reached / not reached / not reached | not reached / not reached / not reached | 29.23 / 29.36 / 29.52 | 15 / 15 / 15 |
| a10-p2.0-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.10 / 5.16 / 5.18 | 14.07 / 14.19 / 14.30 | 1.73 / 1.76 / 1.78 | 37.36 / 37.55 / 37.70 | 13 / 13 / 13 |
| a10-p2.0-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.10 / 5.16 / 5.18 | not reached / not reached / not reached | not reached / not reached / not reached | 29.19 / 29.31 / 29.47 | 15 / 15 / 15 |
| a10-p2.0-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.10 / 5.16 / 5.18 | 17.83 / 17.95 / 18.07 | 2.45 / 2.48 / 2.51 | 34.73 / 34.94 / 35.07 | 13 / 13 / 14 |
| a10-p2.0-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.10 / 5.16 / 5.18 | not reached / not reached / not reached | not reached / not reached / not reached | 29.19 / 29.31 / 29.47 | 15 / 15 / 15 |
| a10-p2.0-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.10 / 5.16 / 5.18 | 23.39 / 23.53 / 23.68 | 3.53 / 3.57 / 3.61 | 32.37 / 32.54 / 32.70 | 14 / 14 / 14 |
| a10-p2.0-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.10 / 5.16 / 5.18 | not reached / not reached / not reached | not reached / not reached / not reached | 29.19 / 29.31 / 29.47 | 15 / 15 / 15 |
| a10-p2.0-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.29 / 7.35 / 7.41 | 15.86 / 15.91 / 15.99 | 1.16 / 1.17 / 1.18 | 35.47 / 35.60 / 35.72 | 13 / 13 / 13 |
| a10-p2.0-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.29 / 7.35 / 7.41 | not reached / not reached / not reached | not reached / not reached / not reached | 29.05 / 29.16 / 29.30 | 15 / 15 / 15 |
| a10-p2.0-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.29 / 7.35 / 7.41 | 19.54 / 19.66 / 19.77 | 1.66 / 1.67 / 1.69 | 33.84 / 33.99 / 34.18 | 14 / 14 / 14 |
| a10-p2.0-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.29 / 7.35 / 7.41 | not reached / not reached / not reached | not reached / not reached / not reached | 29.05 / 29.16 / 29.30 | 15 / 15 / 15 |
| a10-p2.0-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.29 / 7.35 / 7.41 | 25.10 / 25.24 / 25.42 | 2.40 / 2.44 / 2.46 | 31.12 / 31.26 / 31.80 | 14 / 14 / 14 |
| a10-p2.0-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.29 / 7.35 / 7.41 | not reached / not reached / not reached | not reached / not reached / not reached | 29.05 / 29.16 / 29.30 | 15 / 15 / 15 |
| a12-p1.6-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.32 / 3.36 / 3.38 | 11.95 / 12.05 / 12.16 | 2.55 / 2.60 / 2.63 | 19.58 / 20.02 / 20.12 | 20 / 20 / 20 |
| a12-p1.6-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.32 / 3.36 / 3.38 | 45.51 / 45.65 / 45.77 | 12.51 / 12.60 / 12.71 | 16.88 / 16.98 / 17.07 | 21 / 21 / 21 |
| a12-p1.6-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.32 / 3.36 / 3.38 | 15.65 / 15.79 / 15.91 | 3.66 / 3.71 / 3.75 | 17.91 / 18.08 / 18.19 | 20 / 20 / 20 |
| a12-p1.6-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.32 / 3.36 / 3.38 | 45.51 / 45.65 / 45.77 | 12.51 / 12.60 / 12.71 | 16.88 / 16.98 / 17.07 | 21 / 21 / 21 |
| a12-p1.6-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.32 / 3.36 / 3.38 | 20.16 / 20.45 / 20.58 | 5.02 / 5.09 / 5.15 | 16.80 / 17.08 / 17.21 | 20 / 20 / 20 |
| a12-p1.6-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.32 / 3.36 / 3.38 | 45.51 / 45.65 / 45.77 | 12.51 / 12.60 / 12.71 | 16.88 / 16.98 / 17.07 | 21 / 21 / 21 |
| a12-p1.6-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.08 / 5.12 / 5.16 | 13.37 / 13.47 / 13.56 | 1.61 / 1.63 / 1.65 | 18.95 / 19.15 / 19.27 | 20 / 20 / 20 |
| a12-p1.6-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.08 / 5.12 / 5.16 | 45.31 / 45.62 / 45.76 | 7.84 / 7.91 / 7.99 | 16.85 / 16.95 / 17.07 | 21 / 21 / 21 |
| a12-p1.6-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.08 / 5.12 / 5.16 | 16.87 / 17.16 / 17.32 | 2.29 / 2.35 / 2.39 | 17.39 / 17.53 / 17.64 | 20 / 20 / 20 |
| a12-p1.6-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.08 / 5.12 / 5.16 | 45.31 / 45.62 / 45.76 | 7.84 / 7.91 / 7.99 | 16.85 / 16.95 / 17.07 | 21 / 21 / 21 |
| a12-p1.6-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.08 / 5.12 / 5.16 | 21.25 / 21.36 / 21.49 | 3.15 / 3.17 / 3.21 | 16.63 / 16.95 / 17.07 | 20 / 20 / 20 |
| a12-p1.6-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.08 / 5.12 / 5.16 | 45.31 / 45.62 / 45.76 | 7.84 / 7.91 / 7.99 | 16.85 / 16.95 / 17.07 | 21 / 21 / 21 |
| a12-p1.6-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.25 / 7.31 / 7.37 | 14.95 / 15.04 / 15.28 | 1.04 / 1.06 / 1.09 | 18.11 / 18.31 / 18.39 | 20 / 20 / 20 |
| a12-p1.6-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.25 / 7.31 / 7.37 | 45.32 / 45.46 / 45.58 | 5.17 / 5.22 / 5.25 | 16.70 / 16.80 / 16.89 | 21 / 21 / 21 |
| a12-p1.6-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.25 / 7.31 / 7.37 | 18.36 / 18.48 / 18.58 | 1.51 / 1.52 / 1.54 | 16.54 / 16.66 / 16.78 | 20 / 20 / 20 |
| a12-p1.6-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.25 / 7.31 / 7.37 | 45.32 / 45.46 / 45.58 | 5.17 / 5.22 / 5.25 | 16.70 / 16.80 / 16.89 | 21 / 21 / 21 |
| a12-p1.6-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.25 / 7.31 / 7.37 | 22.50 / 22.61 / 22.72 | 2.07 / 2.09 / 2.11 | 16.54 / 16.66 / 16.78 | 20 / 20 / 21 |
| a12-p1.6-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.25 / 7.31 / 7.37 | 45.32 / 45.46 / 45.58 | 5.17 / 5.22 / 5.25 | 16.70 / 16.80 / 16.89 | 21 / 21 / 21 |
| a12-p1.8-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.36 / 3.40 / 3.42 | 12.42 / 12.54 / 12.63 | 2.66 / 2.70 / 2.73 | 30.74 / 30.88 / 31.01 | 15 / 15 / 15 |
| a12-p1.8-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.36 / 3.40 / 3.42 | 71.59 / 71.93 / 72.11 | 20.03 / 20.18 / 20.37 | 24.19 / 24.46 / 24.60 | 17 / 17 / 17 |
| a12-p1.8-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.36 / 3.40 / 3.42 | 16.17 / 16.30 / 16.41 | 3.75 / 3.80 / 3.85 | 28.52 / 28.68 / 28.81 | 15 / 15 / 15 |
| a12-p1.8-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.36 / 3.40 / 3.42 | 71.59 / 71.93 / 72.11 | 20.03 / 20.18 / 20.37 | 24.19 / 24.46 / 24.60 | 17 / 17 / 17 |
| a12-p1.8-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.36 / 3.40 / 3.42 | 21.74 / 21.89 / 22.04 | 5.39 / 5.45 / 5.52 | 25.80 / 26.27 / 26.41 | 15 / 16 / 16 |
| a12-p1.8-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.36 / 3.40 / 3.42 | 71.59 / 71.93 / 72.11 | 20.03 / 20.18 / 20.37 | 24.19 / 24.46 / 24.60 | 17 / 17 / 17 |
| a12-p1.8-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.12 / 5.16 / 5.20 | 13.87 / 13.97 / 14.06 | 1.68 / 1.71 / 1.72 | 29.23 / 29.37 / 29.86 | 15 / 15 / 15 |
| a12-p1.8-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.12 / 5.16 / 5.20 | 71.56 / 71.74 / 71.92 | 12.78 / 12.88 / 13.00 | 24.15 / 24.27 / 24.41 | 17 / 17 / 17 |
| a12-p1.8-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.12 / 5.16 / 5.20 | 17.59 / 17.71 / 17.85 | 2.40 / 2.43 / 2.46 | 27.66 / 27.84 / 27.98 | 15 / 15 / 15 |
| a12-p1.8-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.12 / 5.16 / 5.20 | 71.56 / 71.74 / 71.92 | 12.78 / 12.88 / 13.00 | 24.15 / 24.27 / 24.41 | 17 / 17 / 17 |
| a12-p1.8-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.12 / 5.16 / 5.20 | 23.13 / 23.30 / 23.46 | 3.47 / 3.51 / 3.55 | 25.18 / 25.41 / 25.55 | 16 / 16 / 16 |
| a12-p1.8-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.12 / 5.16 / 5.20 | 71.56 / 71.74 / 71.92 | 12.78 / 12.88 / 13.00 | 24.15 / 24.27 / 24.41 | 17 / 17 / 17 |
| a12-p1.8-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.31 / 7.37 / 7.43 | 15.67 / 15.75 / 15.85 | 1.13 / 1.14 / 1.15 | 28.37 / 28.48 / 28.59 | 15 / 15 / 15 |
| a12-p1.8-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.31 / 7.37 / 7.43 | 71.40 / 71.62 / 71.92 | 8.65 / 8.73 / 8.81 | 23.98 / 24.14 / 24.39 | 17 / 17 / 17 |
| a12-p1.8-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.31 / 7.37 / 7.43 | 19.36 / 19.48 / 19.60 | 1.63 / 1.65 / 1.66 | 26.74 / 26.88 / 27.06 | 15 / 15 / 15 |
| a12-p1.8-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.31 / 7.37 / 7.43 | 71.40 / 71.62 / 71.92 | 8.65 / 8.73 / 8.81 | 23.98 / 24.14 / 24.39 | 17 / 17 / 17 |
| a12-p1.8-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.31 / 7.37 / 7.43 | 24.60 / 24.76 / 24.90 | 2.34 / 2.36 / 2.39 | 23.88 / 24.03 / 24.18 | 16 / 16 / 16 |
| a12-p1.8-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.31 / 7.37 / 7.43 | 71.40 / 71.62 / 71.92 | 8.65 / 8.73 / 8.81 | 23.98 / 24.14 / 24.39 | 17 / 17 / 17 |
| a12-p2.0-g60-z80|PR-OPT|POL-STAY | model-output (realistic) | 3.38 / 3.42 / 3.44 | 13.12 / 13.28 / 13.39 | 2.85 / 2.89 / 2.94 | 47.79 / 48.27 / 48.45 | 12 / 12 / 12 |
| a12-p2.0-g60-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.38 / 3.42 / 3.44 | not reached / not reached / not reached | not reached / not reached / not reached | 35.03 / 35.21 / 35.45 | 14 / 14 / 14 |
| a12-p2.0-g60-z120|PR-OPT|POL-STAY | model-output (realistic) | 3.38 / 3.42 / 3.44 | 17.00 / 17.16 / 17.29 | 3.98 / 4.03 / 4.08 | 44.38 / 44.98 / 45.17 | 12 / 12 / 12 |
| a12-p2.0-g60-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.38 / 3.42 / 3.44 | not reached / not reached / not reached | not reached / not reached / not reached | 35.03 / 35.21 / 35.45 | 14 / 14 / 14 |
| a12-p2.0-g60-z180|PR-OPT|POL-STAY | model-output (realistic) | 3.38 / 3.42 / 3.44 | 22.64 / 22.80 / 22.95 | 5.61 / 5.68 / 5.75 | 41.42 / 41.55 / 41.73 | 13 / 13 / 13 |
| a12-p2.0-g60-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 3.38 / 3.42 / 3.44 | not reached / not reached / not reached | not reached / not reached / not reached | 35.03 / 35.21 / 35.45 | 14 / 14 / 14 |
| a12-p2.0-g100-z80|PR-OPT|POL-STAY | model-output (realistic) | 5.16 / 5.20 / 5.22 | 14.47 / 14.64 / 14.82 | 1.78 / 1.82 / 1.85 | 46.23 / 46.67 / 46.83 | 12 / 12 / 12 |
| a12-p2.0-g100-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.16 / 5.20 / 5.22 | not reached / not reached / not reached | not reached / not reached / not reached | 34.98 / 35.12 / 35.26 | 14 / 14 / 14 |
| a12-p2.0-g100-z120|PR-OPT|POL-STAY | model-output (realistic) | 5.16 / 5.20 / 5.22 | 18.47 / 18.59 / 18.73 | 2.54 / 2.58 / 2.61 | 43.05 / 43.47 / 43.63 | 12 / 12 / 13 |
| a12-p2.0-g100-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.16 / 5.20 / 5.22 | not reached / not reached / not reached | not reached / not reached / not reached | 34.98 / 35.12 / 35.26 | 14 / 14 / 14 |
| a12-p2.0-g100-z180|PR-OPT|POL-STAY | model-output (realistic) | 5.16 / 5.20 / 5.22 | 23.91 / 24.20 / 24.39 | 3.58 / 3.66 / 3.70 | 40.53 / 40.74 / 40.94 | 13 / 13 / 13 |
| a12-p2.0-g100-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 5.16 / 5.20 / 5.22 | not reached / not reached / not reached | not reached / not reached / not reached | 34.98 / 35.12 / 35.26 | 14 / 14 / 14 |
| a12-p2.0-g150-z80|PR-OPT|POL-STAY | model-output (realistic) | 7.35 / 7.41 / 7.45 | 16.29 / 16.41 / 16.54 | 1.20 / 1.22 / 1.24 | 44.82 / 44.98 / 45.13 | 12 / 12 / 12 |
| a12-p2.0-g150-z80|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.35 / 7.41 / 7.45 | not reached / not reached / not reached | not reached / not reached / not reached | 34.82 / 34.94 / 35.12 | 14 / 14 / 14 |
| a12-p2.0-g150-z120|PR-OPT|POL-STAY | model-output (realistic) | 7.35 / 7.41 / 7.45 | 20.03 / 20.18 / 20.30 | 1.71 / 1.73 / 1.75 | 42.12 / 42.30 / 42.43 | 13 / 13 / 13 |
| a12-p2.0-g150-z120|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.35 / 7.41 / 7.45 | not reached / not reached / not reached | not reached / not reached / not reached | 34.82 / 34.94 / 35.12 | 14 / 14 / 14 |
| a12-p2.0-g150-z180|PR-OPT|POL-STAY | model-output (realistic) | 7.35 / 7.41 / 7.45 | 25.61 / 25.77 / 25.92 | 2.46 / 2.48 / 2.51 | 39.72 / 39.94 / 40.14 | 13 / 13 / 13 |
| a12-p2.0-g150-z180|PR-OPT|POL-FRONTIER | model-output (realistic) | 7.35 / 7.41 / 7.45 | not reached / not reached / not reached | not reached / not reached / not reached | 34.82 / 34.94 / 35.12 | 14 / 14 / 14 |

## Notes and limitations

- S1 is a single-character diagnostic model (experiment plan principle 10): no recruits, classes, abilities, gear, sinks, offline progress or Monuments; gold and materials only accumulate.
- All inputs are candidates (content w1-slice.candidate.v0.1.0 and the S1 resolutions S1-R01..R17); every output is model-output, not live-validated.
- Engagement overhead and walk times are the most uncertain inputs (to be measured in M2).
- The S1-E01 winner row is identified with the rule in PREREGISTRATION.md; every row is reported.

