# L1, S2 and S2.1 — final acceptance resolution

**Version 1.0, 2026-11-14.** Source: the owner's "Final L1/S2.1 Acceptance and S3 Authorisation". L1, S2 and S2.1 passed the focused independent acceptance review. The owner accepts the implementation and authorises the local checkpoint `s2-checkpoint` and subsequent S3 development. **No further S2 hardening increment.**

## 1. Accepted package
- **Package:** `legion-S2.1-review-2026-11-13.zip`, SHA-256 `34a927233da680ecf6a21807b2bd96704baf075efe9acdece5a7f39e4bb0bfc7`, 716 files.
- **Committed as:** the working tree was compared file-by-file with the package manifest before the commit: 716 of 716 identical, nothing missing or extra. This resolution document is the only addition.

## 2. Independent verification (as stated by the owner; not overstated)
**The reviewer independently verified:**
- the ZIP hash; all 716 manifest-listed files (checksums and sizes); no unexpected files;
- all 14 S2 and S2.1 pre-registration document and manifest hashes;
- that all 117 historical S2 evidence, L1 evidence and S2 manifest files are byte-identical to the original S2 package;
- the Python oracles: 17 groups, 0 failures, eight hand-only content cases, the generated-preview check skipped;
- all 200 base and 1,800 sweep EXP thresholds;
- that the supplied S2.1 analysis script reproduces the packaged analysis JSON exactly;
- that all three corrected defect reproductions pass;
- an extended ledger differential: 4 seeds × 5,000 operations (20,000), 949 near-limit turnover operations, 200 full-content comparisons, 400 serialization/reconstruction checks, 0 mismatches;
- all 100 replicates of three cells, whose semantic fingerprints match exactly:
  - S2.1-E02 cell 23 (level-5 Archer worker, zone 3): `ac0d15b8…3907fa`;
  - S2.1-E02 cell 29 (level-1 Mage worker, zone 3): `4ed1c0af…be263`;
  - S2-E05 corrected audit cell 2 (PR-BAL / POL2-MIXED): `c9c827be…c0cbf3`.

**Conditions of those checks:** they ran on Linux with Node 22.16.0, with schema-only validation bypassed for known valid inputs in a separate copy. The simulation, metrics, policies and ledger implementations were the real ones.

**Not independently executed:**
- the complete pinned Vitest suite, the full million-operation differential, and every experiment;
- the supplied logs support 926 regular tests, 9 statistical tests and 45 detected mutations.

## 3. Ledger
- **The persistent AVL ledger is approved** for subsequent large simulator experiments.
- **The reference ledger is kept** as the independent correctness reference, with a selectable implementation for differential and regression testing.
- **Full-history replay semantics are unchanged.** L2 is unresolved: a design update is due in S3, with no compaction until separately approved.

## 4. Acknowledged S2 findings
These are model outputs from candidate inputs, **not approved balance**:
- first recruit timing is promising;
- 139 of 140 original S2 cells retain their gameplay results;
- full squads dominate total combat EXP;
- mixed legion strategies produce the most gold;
- the worker visitation correction does not change realistic campaign results;
- hero damage contribution is too low in several passive configurations;
- early progression is much faster than the proposed final pacing;
- the corrected knockout diagnostic is informative;
- ORC2-SEARCH is not an upper bound.

**Constraints:**
- No S2 candidate coefficient is promoted.
- Full personal squad EXP must not be reduced merely because it accelerates progression.

## 5. S3 entry correction (does not block this checkpoint)
- **The issue:** when the basic-attack estimator exhausts its swing or work budget, it returns "unreachable" although the outcome is unresolved, and the ability-aware worker estimator preserved that classification in some cases.
- **The S3-entry correction:**
  - "unreachable" is reserved for proven impossibility;
  - computational limits give "unresolved";
  - "unsafe", "approximate" and "reliable" stay distinct;
  - no positive forecast is invented for an unresolved assignment;
  - UI-facing data distinguishes zero production from an unavailable forecast.
- **Preserved:** the historical S2 evidence, with any changed regression output explained. The large approximate and unsafe errors of S2.1 stay documented.
