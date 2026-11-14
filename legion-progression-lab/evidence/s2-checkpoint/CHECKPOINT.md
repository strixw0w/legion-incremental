# S2 checkpoint

- **Commit:** `732f3da1ee166639ae504430a8aa0cbca3101846` (branch `main`, local only; not pushed).
- **Tag:** `s2-checkpoint` (annotated; tag object `588466a3cd173df79824ecc0d1a0e5cd523bc06f`); tree `981e839cb5863f9f0daf0be3ec4f6e6959d77ed1`.
- **Parent:** the S1 checkpoint `a7d8476` (tag `s1-checkpoint`).
- **Content:** L1 + S2 + S2.1 exactly as the accepted package `legion-S2.1-review-2026-11-13.zip` (SHA-256 `34a92723…bfc7`, 716 files; compared file by file before committing), plus `planning/S2_ACCEPTANCE_RESOLUTION.md`. 316 files changed.
- **Acceptance:** owner "Final L1/S2.1 Acceptance and S3 Authorisation" (2026-11-14); see `planning/S2_ACCEPTANCE_RESOLUTION.md`.
- **Clean export check** (`git archive s2-checkpoint`, extracted to an empty folder, offline install): type check pass; 926 / 926 regular tests; 9 / 9 statistical tests; 356 fixture cases, 0 problems; 17 oracle groups, 0 failing; S2-E04, S2.1-E03 and S1.1-E05 re-verified MATCH.
- **Frozen simulator and Original v1 archive:** unchanged (M0 fingerprint `1275f219…ce64d`, HEAD `74499ef`, 12 Original v1 files; archive master `74499ef`, `archive/increment6-original-v1` `8d80a44`). **Old Legion workspace:** the 16 recorded files are unchanged; a tool-generated `sourcemap.json` appeared when the editor opened the folder (see `frozen-check.txt`).
