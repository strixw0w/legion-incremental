# S4 acceptance addendum: three targeted corrections

**Version 1.0, 2026-11-15.** Source: the owner's "Independent S4 Review and L2 Authorisation" §1–§7. The decision and the reviewer's verification are recorded in `planning/S4_ACCEPTANCE_RESOLUTION.md`; the owner's rule decisions in `planning/S4_OWNER_RESOLUTIONS.md`.

**The scope was not widened.** No comprehensive S4 balancing and no S4.1 increment: the corrections exposed no broader defect.

**Verified by the same author** that wrote the corrections (Claude Code). It is not an independent verification.

## 1. Corrections
| Correction | Change | Code |
|---|---|---|
| **A** lifetime counter precision | `addCounter`: checked addition for every authoritative permanent count (lifetime counters, Bestiary kills, emblems, purchases, high-water sums, Monument price sums). The permanent part of a kill credit moved into the pure, checked `creditPermanentState`. `permanentStateProblems` validates the domain before every run. **A refused step commits nothing:** the run loop restores the account state from before the step, and the simulation refuses to continue. Nothing is clamped or discarded | `src/engine/permanent.ts`, `src/engine/legion.ts` |
| **B** effective bonus metadata | A bonus source carries `canonicalCategory` (identity) and `appliedStat` / `appliedCategory` (effective application, by `appliedCategoryOf(pooling, target)`). The observation gains `groups`, the effective grouping (`effectiveGroups`). Power and Vitality are covered. **Gameplay is unchanged** | `src/model/permanentTypes.ts`, `src/engine/permanent.ts` |
| **C** regional mastery rank | `requiredMasteryRank` and `regionMasteryKills`: the required rank is named. It is Gold for schema-1 packs (`SCHEMA_V1_MASTERY_RANK`), or `mastery.requiredRank` for schema 2. Refused: missing, invalid, a rank a species does not define, a species without a Bestiary entry, and duplicate regions. **New candidate pack** `content/w1-slice-s4.candidate.v0.4.1.json` (schema 2, explicit Gold; generator `repro/s4-acceptance/make_content_v041.py`). v0.4.0 is unchanged | `src/model/permanentContent.ts` |

**Spec:** `spec/formulas/s4-permanent.md` **v1.1**: §9, and the mastery row clarified (v1 said "highest rank threshold").

## 2. Tests, fixtures, oracle and mutation checks
- **`test/s4_acceptance.permanent.test.ts`** (13 tests) covers:
  - **A:**
    - the reviewer's reproduction, with an actual kill credit;
    - lifetime turnover at the exact boundary and one past it, while the balance is small;
    - account kills, Bestiary kills and emblem counts;
    - a counter bump outside the kill step (recruits at the quest) rolled back as a whole;
    - seven out-of-domain states refused before a run;
    - a 2,000-case property against BigInt.
  - **B:**
    - the reviewer's example in both pooling modes;
    - reconstruction of every applied stat from the observation alone, through `evaluateStat`;
    - a demonstration that the canonical categories would not reconstruct the additive variant;
    - a 120-case property;
    - identical event logs before and after.
  - **C:**
    - v0.4.0 and v0.4.1 compile to identical entitlements;
    - the reviewer's Diamond case;
    - missing and invalid definitions;
    - several regions.
- **Fixtures:** the new family `permanent-acceptance.v1.json` (31 cases; generator `repro/s4-acceptance/make_fixtures.py`). The oracle `spec/oracle/s4_oracle.py` gains the family, re-derived with Python integers.
- **Mutation checks:** `repro/s4-acceptance/mutation_check.py` plants 13 bugs, among them re-plants of the three defects the reviewer reproduced (Q1, Q7, Q9). **13 / 13 detected** (`mutation-check-corrections.txt`).

## 3. Preserved gameplay results
- **Event logs, before and after:** `repro/s4-acceptance/digests.ts` ran on the S4 review package's code (extracted, before the corrections) and on the corrected code. The 20-minute POL4-MONUMENT2 and POL4-BALANCED2 runs, in control and additive pooling, gave **identical event-log digests** (`digests-before.txt`, `digests-after.txt`).
- **Focused regression** (`regression-run.txt`): the experiments whose runner import closure contains the corrected files.
  - **All 6 S4 manifests** MATCH their S4 fingerprints.
  - **S4-E01, E02 and E05,** re-run with their registered seeds, are **identical** to the packaged outputs (duration excluded).
  - **Every S2, S2.1, S3 regression and S3.1 manifest:** **MATCH** (S2 10, S2.1 2, S3 9, S3.1 8). In all, **35 / 35 MATCH, 0 MISMATCH**.
  - **S1.1 is not re-run:** its runner's 43-file closure contains no changed file (`evidence/perf-audit/samples/closure-check-vs-s3-checkpoint.txt`).
- **Changed outputs:** the bonus-source objects in the observation, which gain the canonical and applied fields and the `groups` list. No policy reads them, and no fingerprint changed.

## 4. Full verification suite (`suites-run.txt`)
| Check | Result |
|---|---|
| Type check | pass |
| Regular tests | **1,277 / 1,277** |
| Statistical tests | **9 / 9** |
| Fixtures | **481 cases, 0 problems** (450 earlier plus the 31 new) |
| Schemas | pass |
| Oracles | **19 groups, 0 failing** |
| Mutation checks: S4 acceptance | **13 / 13** |
| Mutation checks: S4 | **17 / 17**: the original script stops at P1 on the corrected code, because that code moved into `creditPermanentState`. It was re-run with P1 and P8 re-targeted to the same bugs at their new place (`repro/s4-acceptance/mutation_check_s4_rerun.py`) |
| Mutation checks: S3 acceptance | **5 / 5** |
| Mutation checks: S3.1 | **16 / 16** |
| Mutation checks: S3 | **21 / 21** (W17 left out, as in S3.1) |

## 5. Checkpoint
The S4 checkpoint commit and its tag `s4-checkpoint` are recorded after the commit in `evidence/s4-checkpoint/CHECKPOINT.md`, because a commit cannot contain its own SHA. That record also covers the clean-export check and the frozen-workspace check.
