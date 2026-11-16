# L2 checkpoint

**The commit:**
- **Commit:** `43a1a16c4c9a67841e3569cc11bcbabc63d8b902` on branch `main`. Local only; **not pushed** (the GitHub repository is public).
- **Tag:** `l2-checkpoint`, annotated (tag object `7bbf5fd5ad9ce5e7f55147b37ecbc7ee9ab8eba5`); tree `25b8f737d0f0b4fbea1760ea0ea6ddccc9e3460b`.
- **Parent:** the S4 checkpoint `dc39492` (tag `s4-checkpoint`).

**Content:** 166 files changed or added against the S4 checkpoint.
- L2 as reviewed (`legion-L2-review-2026-11-15.zip`, SHA-256 `be59c7c6…f0e7`);
- L2.1 as reviewed (`legion-L2.1-review-2026-11-15.zip`, SHA-256 `08908e68…6c5e`);
- the two acceptance corrections, with their tests, reproductions and mutation checks (`evidence/l2-acceptance/ADDENDUM.md`);
- the owner's resolution (`planning/L2_ACCEPTANCE_RESOLUTION.md`).

**Not in the checkpoint:** this `evidence/l2-checkpoint/` folder, written after the commit.

**Acceptance:** owner "L2.1 Acceptance and S5 Authorisation" (2026-11-15). L2 and L2.1 are accepted subject to corrections A and B, and all five L2.1 contract decisions are approved.

**Verification before the commit** (`evidence/l2-acceptance/checks-run.txt`):
- 1,480 / 1,480 tests and 9 / 9 statistical tests;
- 607 fixture cases with 0 problems, and 21 oracle groups with 0 failing;
- mutation sets 4 / 4 (the corrections) and 38 / 38 (L2.1);
- L2.1-E02 and L2.1-E03 re-run identical to the packaged results;
- the historical experiments are exact dependency-cache hits (45 / 45), and were not re-run (owner §4);
- registration 0 changed, preservation 0 problems.

**Clean export check** (`git archive l2-checkpoint` into an empty folder, offline install; `clean-export-check.txt`):
- 1,461 files;
- type check pass;
- 1,480 / 1,480 tests and 9 / 9 statistical tests;
- 607 fixture cases, 0 problems;
- 21 oracle groups, 0 failing;
- S3.1-E03 and S4-E04 re-verified MATCH;
- L2.1-E03 re-run from the export on 8 worker threads, identical to the packaged result.

**Frozen simulator, Original v1 archive and old workspace** (`frozen-check.txt`):
- the M0 fingerprint is unchanged (`1275f219…ce64d`; 3,012 files, identical contents and times);
- frozen HEAD `74499ef`, with 12 Original v1 working files;
- the archive is unchanged and has no remotes;
- the old Legion workspace is identical to the S3 checkpoint check;
- `l2-checkpoint` is on no remote-tracking branch (nothing pushed).
