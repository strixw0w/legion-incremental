# S3 amendment 01 — widened knockout matrix (direction F)

**Registered 2026-11-14, after S3-E11 and before the widened matrix ran.** Appended to manifests/s3/preregistration.json `amendments`; the original registration is unchanged.

## Why
PREREGISTRATION.md §4 fixed the direction-F rule before any run: the S3-E11 matrix is informative only if at least 50% of its cells with recruits generate knockouts (p50 member knockouts per hour >= 1); otherwise its range is widened by a registered amendment before any conclusion. S3-E11 gave 24 of 72 cells with recruits (33.3%), so it is **not informative** on its own. No conclusion is drawn from it until this amendment has run.

## What is added (S3-E11-knockout-matrix-widened (amendment 01, "S3-E11a"))
- **Under-levelled ladder:** level 3 in zone 2 and level 7 in zone 3, with enemy damage x1, x2, x3, x4, x6.
- **Higher enemy damage on the original ladder:** levels 1/5/10 in zones 1/2/3 with enemy damage x4 and x6.
- Everything else as S3-E11: squads of 0–3 recruits (Warrior, Archer, Mage), the fixed-zone squad policy (rests) and continuous farming, 60 minutes, no equipment, 100 replicates, seed root `s3-e11a`. Squad size 0 is the single-hero control.

## Rule for the widened matrix (fixed now)
The matrix (S3-E11 and S3-E11-knockout-matrix-widened cells together) is informative if at least 50% of its cells with recruits generate knockouts. If it still is not, the result is reported as "knockouts are rare in the S2/S3 candidate content across the tested range" and no knockout-dependent conclusion is drawn; no further widening is made in S3. Thresholds of interest stay as registered (reported, not targets).
