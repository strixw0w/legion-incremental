# S5 checkpoint

**The commit:**
- **Commit:** `1b285dbd30176ff21cf002ad608bf4638521abbd` on branch `main`. Local only; **not pushed** (the GitHub repository is public).
- **Tag:** `s5-checkpoint`, annotated (tag object `a11ce38bcb6d213922ef062c08b3227f52965ba3`); tree `ebff2f0a8adc8fe06af7e0e5ffa8d7432db5d6e7`.
- **Parent:** the L2 checkpoint `43a1a16` (tag `l2-checkpoint`).

**Content:** 167 files changed or added against the L2 checkpoint.
- S5 as reviewed (`legion-S5-review-2026-11-15.zip`, SHA-256 `45bdac40…0d16`);
- the four acceptance corrections A–D, with their tests and mutation checks (`evidence/s5-acceptance/S5_ACCEPTANCE_ADDENDUM.md`).

**Not in the checkpoint:**
- this `evidence/s5-checkpoint/` folder, written after the commit;
- the S6 work in progress (unreviewed; it remains uncommitted in the working tree).

**How the tree was made** (`evidence/s5-acceptance/rebuild-record.txt`):
- **Why:** S6 work had started in the canonical working tree after the corrections.
- **Where:** the checkpoint tree was rebuilt in a separate git worktree at `l2-checkpoint`, from the reviewed package plus
  the exact correction patches.
- **Cross-checks:** four, each byte for byte. Against the package, the tree differs in exactly the five correction files.
- **The commit:** made from that worktree; `main` was then moved to it. The canonical working tree's files were not
  touched. After the move it differs from the checkpoint only in S6 paths.

**Acceptance:** the owner's "S5 Acceptance and S6 Authorisation" (2026-11-16) accepts S5 subject to corrections A–D and
records the offline defaults and the H-S5-03 resolution.

**Verification before the commit** (`evidence/s5-acceptance/checks-run.txt`):
- 1,668 / 1,668 tests and 9 / 9 statistical tests;
- 669 fixture cases with 0 problems; schemas OK;
- 22 oracle groups, 0 failing;
- the full S5 mutation set 40 / 40, including M34 and M37 after the follow-up tests;
- nine historical controls MATCH;
- S5-E01, S5-E04 and S5-E02 re-run identical to the packaged results;
- registration 0 changed, preservation 0 problems.

**Clean export check** (`git archive s5-checkpoint` into an empty folder, offline install; `clean-export-check.txt`):
- 1,607 files;
- type check pass;
- 1,668 / 1,668 tests and 9 / 9 statistical tests;
- 669 fixture cases, 0 problems;
- 22 oracle groups, 0 failing;
- S3.1-E03 and S4-E04 MATCH;
- S5-E01 re-run from the export on 8 worker threads, identical to the packaged result.

**Frozen simulator, Original v1 archive and old workspace** (`frozen-check.txt`):
- the M0 fingerprint is unchanged (`1275f219…ce64d`; 3,012 files, identical contents and times);
- frozen HEAD `74499ef`, with 12 Original v1 working files;
- the archive is unchanged and has no remotes;
- the old Legion workspace is identical to the S3 checkpoint check;
- `s5-checkpoint` is on no remote-tracking branch (nothing pushed).

**Independence:** every check above was run by the implementer. None is an independent review.
