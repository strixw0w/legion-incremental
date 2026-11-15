# S4 checkpoint

**The commit:**
- **Commit:** `dc39492f3ed2c8f66884e964bcd2cfbb521e6a4d` on branch `main`. Local only; **not pushed** (the GitHub repository is public).
- **Tag:** `s4-checkpoint`, annotated (tag object `1e13f8f38b78b80a32c735e6c56f17813faade63`); tree `b3fddc4d680d8062bf320bc182fad278978abd32`.
- **Parent:** the S3 checkpoint `f25f296` (tag `s3-checkpoint`).

**Content:**
- S4 exactly as the reviewed package `legion-S4-review-2026-11-14.zip` (SHA-256 `c1afb04c…d457`, 1,268 files);
- the three acceptance corrections, the owner resolutions and the acceptance addendum (`evidence/s4-acceptance/ADDENDUM.md`);
- spec `s4-permanent.md` v1.1 and the fixture family `permanent-acceptance.v1.json`;
- candidate pack v0.4.1;
- the verification performance audit (`evidence/perf-audit/`);
- the S3 checkpoint record (`evidence/s3-checkpoint/`, written after that commit).

203 files changed or added against the S3 checkpoint.

**Not in the checkpoint:**
- the L2 drafts (`planning/L2_CONTRACT.md`, `spec/formulas/l2-replay.md`, `spec/oracle/l2_oracle.py`). They were left untracked and are part of the L2 increment;
- this `evidence/s4-checkpoint/` folder, written after the commit.

**Acceptance:** owner "Independent S4 Review and L2 Authorisation" (2026-11-15); see `planning/S4_ACCEPTANCE_RESOLUTION.md`.

**Verification before the commit** (`evidence/s4-acceptance/`):
- a focused regression of 35 manifests, all MATCH;
- S4-E01, E02 and E05 identical;
- event logs identical before and after the corrections;
- 1,277 / 1,277 tests and 9 / 9 statistical tests;
- 481 fixture cases with 0 problems, and 19 oracle groups with 0 failing;
- mutation checks 13 / 13, 17 / 17, 5 / 5, 16 / 16 and 21 / 21.

**Clean export check** (`git archive s4-checkpoint` into an empty folder, offline install; `clean-export-check.txt`):
- type check pass;
- 1,277 / 1,277 tests and 9 / 9 statistical tests;
- 481 fixture cases, 0 problems;
- 19 oracle groups, 0 failing;
- S4-E04, S4-E09 and S3.1-E03 re-verified MATCH;
- the 13 acceptance tests pass.

**Frozen simulator, Original v1 archive and old workspace** (`frozen-check.txt`):
- the M0 fingerprint is unchanged (`1275f219…ce64d`; 3,012 files, identical contents and times);
- frozen HEAD `74499ef`, with 12 Original v1 working files;
- the archive is unchanged and has no remotes;
- the old Legion workspace is identical to the S3 checkpoint check;
- `s4-checkpoint` is on no remote-tracking branch (nothing pushed).
