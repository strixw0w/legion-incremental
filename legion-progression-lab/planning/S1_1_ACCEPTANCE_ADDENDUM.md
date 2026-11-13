# S1.1 acceptance addendum

**Version 1.0, 2026-11-13.**

**Source:** the owner's "S1.1 Acceptance and S2 Authorisation" (§1–§4). S1 and S1.1 are accepted, subject to the small estimator correction below. No comprehensive S1.2 increment is required.

**Evidence:** `evidence/s1.1-addendum/`. The S1 and S1.1 evidence (`evidence/s1/`, `evidence/s1.1/`) is preserved unchanged.

## 1. Independent verification (as stated by the owner; not overstated)
**Verified against the S1.1 review ZIP** (SHA-256 `f13ce31be88ed51b4c99578067fb178eda5dd3d8a0473609621c1caf8a54d79b`):
- all 403 manifest-listed files by SHA-256 and size, with no unexpected files;
- all seven S1.1 manifest hashes and the pre-registration document hash;
- all 92 historical S1 evidence and manifest files, byte-identical to the S1 review package;
- the Python oracle command: 15 groups, 0 failures. The generated-preview check was skipped, and eight content cases are hand-only.
- all 200 base EXP thresholds and all 1,800 sweep-table thresholds;
- `analysis-gates.json`, reproduced exactly by the supplied analysis script;
- the corrected defect-reproduction JSON, reproduced against the real TypeScript engine.

**One experiment cell re-run independently.** All 200 replicates of S1.1-E07 `base|PR-BAL|POL-STAY|est-s1.1` were re-run on Linux with Node 22.16.0, using a separate review copy that bypassed the schema-only dependencies for known valid inputs. The engine, metrics and policy code were not replaced.
- EXP p10 / p50 / p90 = 7,364 / 7,386 / 7,430; mean 7,393.15; median deaths/h 0;
- all 37 metric summaries identical;
- combined event-log digest `10b6da1c72dea1c291dd3380c4d1956b1fea7e46b642452b166cf14e843f5bea`.

**Not independently executed:** the complete pinned Vitest suite. The supplied logs support:
- 711 regular tests and 9 statistical tests;
- 324 fixture cases;
- 20 successful mutation checks.

## 2. Estimator correction (owner §2)
- **Defect.** A fight that can never be won still showed a positive rate when the exact survival chain exceeded its work budget, because estimator v1.1 then fell back to the renewal approximation.
  - **Reviewer's case:** hero 10,000 HP; 1 damage per hit at 50% hit chance; enemy 1,000 HP dealing 1 damage every 1 ms.
  - **Result:** win chance 0, yet 0.0176 kills/h, "unsafe", with reasons `SURVIVAL_BUDGET` and `UNDER_ONE_KILL_PER_LIFE`.
  - **Reproduced exactly:** `evidence/s1.1-addendum/survival-budget-before.txt`.
- **Correction:** estimator **v1.2** (`spec/formulas/estimator.md`; `src/engine/estimator.ts`).
  - **Impossibility first.** It is decided from the completed fight distribution, before any survival calculation, and structurally: either some resolved outcome wins from full HP, or none does.
  - **If none does,** the result is exact whatever the budget:
    - kills per life 0 and kills/h 0;
    - unreachable, reason `DIES_BEFORE_KILL`;
    - deaths/h from one lost fight per life.
  - **`SURVIVAL_BUDGET` now means only** "a win is possible, but the exact chain was too expensive". An expensive estimate is thereby distinguished from a genuinely impossible one.
- **After the correction:** 0 kills/h, unreachable, `DIES_BEFORE_KILL`. Deaths/h is 156.52…, equal to the hand derivation (`survival-budget-after.txt`).
- **Regression coverage:**
  - fixture `estimator.v1.json` moves to fixture version 2, with two cases filled by the independent oracle `s1_oracle.py` (updated to v1.2) and checked by hand where stated:
    - `s1.estimator.impossible-over-budget.001`, the review case;
    - `s1.estimator.possible-over-budget.001`, a winnable fight over the budget, which keeps the flagged approximation.
  - a unit test in `test/s1_1.behaviour.test.ts` rebuilds the review case on the real compiled content;
  - **planted-bug check:** removing the new branch makes the fixture and the unit test fail; the file was restored and verified.
- **Combat statistics:** not retuned. Ordinary estimates are unchanged.

## 3. Historical results
**No historical candidate result changed:**
- Every S1.1 experiment re-run with estimator v1.2 matches its recorded semantic fingerprint (7 of 7 MATCH, `exp-verify-after.txt`). No S1.1 experiment cell reached the impossible-over-budget case.
- The pre-registered analyses reproduce `analysis-gates.json` byte for byte (`analysis-gates.after.json`).

**Verification suite after the correction** (`evidence/s1.1-addendum/`):
- type check clean;
- 714 of 714 default tests and 9 of 9 statistical tests;
- 326 fixture cases, 0 problems;
- 15 oracle groups, 0 failing;
- 3 of 3 schemas match.

## 4. Owner resolutions
`S1_1_OWNER_RESOLUTIONS.md` v1.0 records S1.1-R01 … R15 as approved, with the owner's interpretations:
- R01: reconsider blocks when capability improves (S2/S3);
- R02: retreat by survival;
- R04: an engineering safeguard;
- R10: subject to this correction;
- R14: continuous farming is a diagnostic reference.

It also records the time categories for future experiments. No candidate coefficient is promoted.

## 5. Checkpoint
- **Content:** S1, S1.1, the owner resolutions and this addendum are committed as one local checkpoint, tag `s1-checkpoint`. It is not pushed.
- **Records:** the commit SHA, the tag, the verification and the frozen-material check are in `evidence/s1-checkpoint/CHECKPOINT.md`. That record is written after the commit, because it names the commit.
