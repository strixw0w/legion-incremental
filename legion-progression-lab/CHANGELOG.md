# Changelog

Every change to formula specs, fixtures, content or baselines is recorded here, with its decision ID, rationale, evidence and version.

## S0.1 final ledger correction — 2026-11-13 (accepted subject to verification; committed as the S0 checkpoint)

From the independent S0.1 review (`planning/S0_FINAL_REVIEW_RESOLUTION.md`).

**Defect.** A frozen object combining the balances of one genuine ledger with the committed history of another passed `applyTx`'s structural check. Replaying a committed transaction then credited it again: balance 10 instead of 5. Frozen shallow copies, and maps forged through the read-only map's constructor, were also accepted.

**Fix.** `src/core/ledger/ledger.ts` now registers every ledger made by `emptyLedger`/`applyTx` in a module-private `WeakSet`. `applyTx` accepts only registered ledgers (`INVALID_STATE` otherwise). Branching from any earlier genuine snapshot is unchanged.

**Spec and fixtures.**
- `ledger.md` (still v1, no result changes) documents the identity rule and the need for a separate, validated reconstruction boundary for any future deserialisation.
- No fixture changes: object identity cannot be expressed in JSON.

**Tests.** 4 regression tests:
- mixed ledgers;
- shallow copies and forged maps;
- branching from historical snapshots;
- replay and conflicts after branching.

**Evidence:** `evidence/s0.1-final/`.

## S0.1 — 2026-11-13 (accepted by owner after independent review, subject to the final correction above)

Hardening corrections from the independent S0 review (items 1–8). Evidence: `evidence/s0.1/S0_1_EVIDENCE.md`. All coefficients remain `candidate`. The XP curve, the XP table artifact and the content pack are unchanged.

### Changed: formula specs
- **`remainder.md` v1 → v2 (review item 1).**
  - **What changed:** the per-hour chain is one exact division of `milliRem·3.6e6 + msRem + rate·dMs` by 3.6e9, using the new `mulDivRem`.
  - **Impact:**
    - wherever v1 returned a result, v2 returns the identical result;
    - v2 no longer fails on the milli-unit intermediate, only when the grant itself exceeds 2^53 − 1;
    - G1 is restated with that precise domain;
    - the per-hour state is validated explicitly.
- **`stats.md` v1 → v2 (review item 2).**
  - **What changed:**
    - an active factor of exactly 1 is skipped;
    - every partial and final value must be in [0, 2^53 − 1], otherwise `NUMERIC_LIMIT` (never `Infinity` or `NaN`);
    - malformed or sparse inputs give `INVALID_CONTENT`.
  - **Impact:** results change only near 2^53 (the identity case) or where v1 returned out-of-range, `Infinity` or `NaN` values.
- **`combat.md` v1 → v2 (review item 3).**
  - **What changed:**
    - damage per hit is exact rational arithmetic on integer inputs (`rawMilli`, `critMultBp`, mitigation ratio `{num, den}`), rounded half up once at the end;
    - new `mitigationRatio`;
    - `mitigationFactor` is kept for display only.
  - **Impact:**
    - the damage input shape changes;
    - results change only where v1's binary64 arithmetic misrounded an exact half, for example 100 × 1.005 = 100.5 → 101 (v1: 100).
- **`xp.md` v1 → v2 (review items 4 and 5).**
  - **What changed:** awards are spent level by level, so there is no intermediate sum. Tables and states must be dense.
  - **Impact:**
    - every award v1 accepted gives the identical result;
    - awards v1 refused with `NUMERIC_LIMIT` now give the exact result, or `XP_TABLE_EXHAUSTED`.
- **`numeric.md` v1:** adds `mulDivRem`, an exact ⌊a·m/d⌋ and remainder that never forms a·m. No existing operation changed.
- **`rng.md` v1 (review item 5):** adds the state boundary.
  - Every public entry point validates the state: a dense array of four u32 values, not all zero.
  - The generator step is private.
  - No valid result changed.
- **`ledger.md` v1 (review items 6 and 7):** adds the immutability boundary and the S1 performance note. No result changed.
  - The ledger state is frozen, its maps are read-only, and receipts are frozen.
  - Only ledgers made by `emptyLedger` or `applyTx` are accepted.

### Changed: fixtures (one current file per family)
- **`numeric.v1.json`:** fixture version 1 → 2, with 11 new `mulDivRem` cases.
- **`remainder.v1.json` → `remainder.v2.json`:** fixture version 2. All 18 v1 cases are unchanged; 15 cases are added (per-hour, rate-change timeline and state cases).
- **`stats.v1.json` → `stats.v2.json`:** fixture version 2. All 9 v1 cases are unchanged; 11 cases are added.
- **`combat.v1.json` → `combat.v2.json`:** fixture version 2.
  - **Retired:** `combat.dmg.overflow.001`.
  - **Restated:** 8 damage cases in v2 inputs, with unchanged expected values.
  - **Added:** 20 cases.
- **`xp.v1.json` → `xp.v2.json`:** fixture version 2.
  - **Retired:** `xp.award.overflow.001`. Its expected outcome changed from `NUMERIC_LIMIT` to `XP_TABLE_EXHAUSTED`; it is replaced by `xp.award.near-max.exhausted.001`.
  - **Added:** 9 cases.
  - **New operation:** `awardSequence`.
- **`rng.v1.json`:** fixture version 1 → 2, with 9 new `nextFromState` cases.
- **Totals:** 179 → 252 cases.

| Kind | S0 | S0.1 |
|---|---|---|
| Normal | 45 | 52 |
| Boundary | 61 | 94 |
| Failure | 73 | 106 |

### Changed: oracles
- **`exact_oracle.py`:**
  - `mulDivRem`;
  - per-hour v2 as a single division with unbounded integers, plus timelines;
  - stats v2, which replays the specified binary64 order with Python floats and checks it against exact Fractions;
  - combat v2 damage with exact Fractions, plus `mitigationRatio`;
  - tolerances now also apply to binary64 results.
- **`xp_oracle.py`:** awards v2 as plain unbounded-integer arithmetic, plus `awardSequence` and the `maxLevelUps ≥ 1` rule.
- **`rng_oracle.py`:** `nextFromState`, with the state rule.
- **`check_all.py`:** finds each family's single current fixture file and refuses duplicates.

### Changed: lab
- **New:**
  - `src/core/arrays.ts` (dense-array checks);
  - `mulDivRem` in `src/core/numeric/safeInt.ts`.
- **Rewritten:**
  - `accruePerHour` (`remainder.ts`);
  - `evaluateStat` (`stats.ts`);
  - `damagePerHit`, plus the new `mitigationRatio` (`combat.ts`);
  - `applyExpAward` and `assertXpTable` (`xp.ts`).
- **Hardened:**
  - `assertRngState`, `nextU32`, `bernoulli`, `uniformInt` and `stateFromDigest`;
  - `applyTx` validation and immutability (`ledger.ts`).
- **Fixture runner:**
  - new operations: `mulDivRem`, `perHourTimeline`, `nextFromState`, `mitigationRatio` and `awardSequence`;
  - damage cases use the v2 inputs.
- **Tests:** the default suite grows from 329 to 459 tests; the 7 statistical tests are unchanged.

### Added
- `planning/S1_LEDGER_BENCHMARK_PROPOSAL.md` (review item 7). It is a proposal only; there is no ledger redesign.
- `evidence/s0.1/` (the S0.1 evidence pack).

### Not changed
- The XP curve candidate and the table artifact (fingerprint `990fe508…0dc`).
- The content pack.
- The S0-R01 report inputs and semantics. Its semantic fingerprint is re-checked in the evidence.
- Canonical JSON, units and content validation.
- Hit chance, crit chance and hits-to-kill.
- The `accrue` primitive.
- The frozen `progression-lab/` baseline and the Original v1 archive.

## S0 — 2026-11-13 (accepted by owner after independent review of S0 and S0.1)

### Added
- **Formula specs v1** (`spec/formulas/`):
  - `units`, `numeric`, `remainder`, `rng`, `xp`, `stats`, `combat`, `ledger`, `canonical-json`;
  - basis: `M0_RESOLUTION.md` D-02, D-07, D-10 and corrections A–F.
- **Fixtures v1** (`spec/fixtures/`): 9 families, 179 cases, each with a derivation.
- **Independent oracles** (`spec/oracle/`): `rng_oracle.py`, `xp_oracle.py`, `exact_oracle.py`, `check_all.py`.
- **Exported JSON Schemas** (`spec/schema/`): fixture, content pack S0, XP table artifact.
- **Content `s0-core` 0.1.0 (candidate):**
  - XP curve a = 10, p = 1.6, g = 1;
  - 200-entry XP table artifact (fingerprint `990fe508ef0f83f196a4052a56354c989fc9e93f36070754ed222295a69fb0dc`), oracle-verified and rounding-stable;
  - stat category registry with inactive W2 hooks;
  - candidate combat coefficients.
- **Lab S0 modules, tests and CLI tools** (see `README.md`).
- **Report S0-R01** (candidate EXP curve inspection).

### Not changed
- **Approved baseline:** the design pack (`docs/`) and the approved Decision Register.
- **Frozen simulator:** the frozen `progression-lab/` baseline.
