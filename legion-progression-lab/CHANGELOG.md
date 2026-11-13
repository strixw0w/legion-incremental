# Changelog

Every change to formula specs, fixtures, content or baselines is recorded here, with its decision ID, rationale, evidence and version.

## S1.1 acceptance addendum — 2026-11-13 (S1 and S1.1 accepted; committed as the S1 checkpoint, tag `s1-checkpoint`)

**Source:** owner "S1.1 Acceptance and S2 Authorisation" §1–§4. **Record:** `planning/S1_1_ACCEPTANCE_ADDENDUM.md`. **Evidence:** `evidence/s1.1-addendum/`.

- **Estimator v1.1 → v1.2** (`spec/formulas/estimator.md`, `src/engine/estimator.ts`):
  - impossible victory is decided structurally from the completed fight distribution, before the survival budget. The result is exactly 0 kills, unreachable, `DIES_BEFORE_KILL`;
  - `SURVIVAL_BUDGET` now marks only winnable but expensive estimates.
- **Fixtures:** `estimator.v1.json` moves to fixture version 2 (+2 cases: the reviewer's impossible-over-budget case, and a winnable over-budget case). The independent oracle `s1_oracle.py` follows v1.2.
- **Tests:** a unit test for the review case; the reproduction script `repro/s1.1/estimator-survival-budget.mjs`.
- **No historical result changed:** all 7 S1.1 experiments MATCH their recorded fingerprints, and `analysis-gates.json` is identical.
- **Planning:**
  - `S1_1_OWNER_RESOLUTIONS.md` v1.0 records S1.1-R01 … R15 as approved, with the owner's interpretations, and the time categories for future experiments;
  - pointer lines in `S1_1_RESOLUTIONS.md` and `spec/README.md`.
- **Not changed:** combat statistics, content, the EXP curve and targets; the S1 and S1.1 evidence.

## S1.1 — 2026-11-13 (accepted with the addendum above)

**Scope.** A targeted correction pass after the independent S1 review ("Independent S1 Review and S1.1 Authorisation"); S1 was conditionally accepted. It is not a rewrite and not S2.

**Evidence:** `evidence/s1.1/S1_1_EVIDENCE.md`. Owner resolutions: `planning/S1_OWNER_RESOLUTIONS.md` v1.0. S1.1 rules: `planning/S1_1_RESOLUTIONS.md` v1.0.

**Labels:** content and the EXP curve are unchanged (`w1-slice.candidate.v0.1.0`, fingerprint `cb130aba…8ec6`). Every value is a candidate.

### Changed: formula specs
- **`s1-combat-loop.md` v1 → v1.1:**
  - identity-checked, atomic kill credit;
  - combined policy triggers;
  - auto-farm off cancels automatic work;
  - regeneration whenever idle in a session;
  - a session end clears a pending manual engage;
  - structured drops;
  - the explicit death window `(t − w, t]`, a per-zone stop record and manual retry.
- **`gates.md` v1 → v1.1:** the `SetAutoFarm(off)` effect, the `Report` command (`REPORT_UNKNOWN`) and the `deathStop` zone field.
- **New `estimator.md` v1.1:**
  - budgets;
  - unresolved mass never counted as a kill;
  - an exact survival chain;
  - reliability (unreachable / unsafe / approximate / reliable) with reasons.

### Changed: lab (owner review §2–§7)
- **Kill credit (§2).** New `src/engine/credit.ts`: a pending/committed registry in the state, classified before any draw. Rejections are `CREDIT_REPLAYED`, `CREDIT_CONFLICT` or `CREDIT_UNKNOWN`. The credit is applied as one atomic state update, and history is persistent so branches share it safely.
- **Recovery (§3):**
  - The realistic policies respect the repeated-death stop: they rest, retreat and report.
  - The S1 logic is kept as the controls `CTL-*-S1`.
  - New command `Report`.
  - Zones record `deathStop`.
- **Triggers (§4):**
  - POLICY events at one `(t, pass)` form one decision with all triggers, in `TRIGGER_ORDER`;
  - new triggers `hero-died`, `auto-farm-stopped`, `boss-cleared`, `boss-failed`;
  - more than 8 decisions at one timestamp is `EVENT_CASCADE_LIMIT`;
  - ORC-BRUTE uses the combined triggers.
- **Estimator (§5).** `estimator.ts` v1.1. The S1 estimator is kept unchanged in `estimator-s1.ts`, selectable only as `estimator: "s1"`.
- **Drops (§6).** Structured drops (`DropAward`). Metrics keep events and quantities, and reconcile them with the ledger. The drops job checks each entry.
- **Auto-farm and sessions (§7).** Engagement origin; auto-farm off cancels automatic work; regeneration and session-boundary fixes.
- **Experiments.** S1.1 manifests (`increment: "S1.1"`, `estimators`, `estimator.fixed`, variant `slime.dropsVariant`), a per-folder hash register and `results/s1.1/`. The runner refuses S1 manifests.

### Added
- **Tests:** `test/s1_1.credit.test.ts` (injected duplicates, conflicts, unknown credits, EXP-only, boss, branching, atomicity, registry) and `test/s1_1.behaviour.test.ts` (triggers, recovery, auto-farm, regeneration, sessions, estimator, drops).
- **Fixtures:**
  - `credits.v1.json` (6 cases) and `estimator.v1.json` (8 cases) are new;
  - `rewards.v1.json` moves to fixture version 2 (+2 cases: quantities above 1, the same resource twice; events and totals);
  - `gates.v1.json` moves to fixture version 2 (+4 `Report` cases).

  The independent oracle `s1_oracle.py` gains the `credits` and `estimator` families, `Report`, and events/totals.
- **Reproductions and analyses:** `repro/s1.1/defects.mjs` (run against the original S1 package and against this tree) and `repro/s1.1/analyse.py` (pre-registered analyses A1–A8).
- **Planning:** `S1_OWNER_RESOLUTIONS.md`, `S1_1_RESOLUTIONS.md`, `LEDGER_INFRASTRUCTURE_PROPOSAL.md`; a pointer line in `S1_RESOLUTIONS.md`.
- **Pre-registration:** `manifests/s1.1/` (7 manifests and `PREREGISTRATION.md`, registered before any S1.1 experiment ran).

### Privacy
`planning/M0_REPOSITORY_VERIFICATION.md`: absolute user-profile paths are redacted to `%USERPROFILE%\…` in the shared copy. The original is preserved privately outside the repository.

### Not changed
- the content pack, the EXP curve and the targets;
- the ledger (the replacement is not implemented; the proposal only);
- the S1 manifests, results and evidence (`manifests/s1/`, `evidence/s1/`).

## S1 — 2026-11-13 (conditionally accepted after independent review; uncommitted)

S1 is a single-character diagnostic simulation, authorised in `planning/S0_FINAL_REVIEW_RESOLUTION.md` §4. It starts from the S0 checkpoint `ad11a508fd715b08705c5ee72f215f92183f0993`. Evidence: `evidence/s1/S1_EVIDENCE.md`. Every input and output is `candidate` / model output, and nothing is live-validated.

### Added: formula specs
- **`combat.md` (still v2):** "Attack quantisation" (owner requirement §5).
  - Derived attack is evaluated in thousandths, and `rawMilli = roundHalfUp(value)` is applied exactly to the binary64 value, with no ×1000 multiplication.
  - The section states the limits (≤ 2^53 − 1; ≥ 1 thousandth, otherwise `INVALID_NUMBER`) and the exactness boundary.
  - New function `attackRawMilli` (`src/core/formulas/combat.ts`).
- **`s1-combat-loop.md` v1:** time, the event queue and ordering key, epochs and stale events, simultaneous resolution, engagement, swings, retaliation, death and respawn, sessions, kill credit, progress and recompute, policy decisions, regeneration and errors.
- **`gates.md` v1:** the three zone flags, kill gates, travel and teleport, command validation order and reason codes, the prototype miniboss stub (active-only) and invariants.

### Added: planning
- **`planning/S1_RESOLUTIONS.md`:** 17 proposed candidate rules for questions the approved documents do not settle. Each lists its consequence. None is approved.
- **`planning/S0_FINAL_REVIEW_RESOLUTION.md`:** S1 authorisation terms.

### Added: fixtures and oracles
- **`combat.v2.json`** fixture version 2 → 3: 8 `attackRawMilli` cases, including the binary64-half case.
- **New fixture files:**
  - `combat-loop.v1.json`: 14 hand-derived single-fight timelines;
  - `gates.v1.json`: 25 command-validation cases;
  - `rewards.v1.json`: 5 drop-roll cases, including a draw-alignment case added after the first S1 mutation run showed the one-draw-per-entry rule untested.

  Total cases: 252 → 304.
- **`spec/oracle/s1_oracle.py`:** an independent time-loop fight model with exact `Fraction` damage, gates.md validation, and drop rolls using `rng_oracle`.
- **Other oracle changes:**
  - `exact_oracle.py` handles `attackRawMilli`;
  - `check_all.py` runs 6 groups, including S1.
- **Fixture format:** the families `combat-loop`, `gates` and `rewards` are allowed, and `specRef` may contain digits. The schema was re-exported.

### Added: content (all candidate)
- **`content/w1-slice.candidate.v0.1.0.json`:**
  - hero, zones 1–3, enemies, prototype boss stub, travel and auto-farm;
  - inputs taken from M1 plan v1.0 §6;
  - fingerprint `cb130aba01a3d1242d0d875c514a3c976e9c3c039834e099591f1a0e162f8ec6`.
- **`content/tables/xp.w1.sweep.a{8,10,12}-p{1.6,1.8,2.0}.v0.1.0.json`** and `xp-sweep.index.json`: 9 sweep tables, each checked by `xp_oracle.py`, with no rounding-unstable level.

### Added: lab
- **`src/model/`:** content schema, validation and compilation (`content.ts`), and the types (`types.ts`) for state, events, commands, reason codes, observation and policy.
- **`src/engine/`:**
  - `queue.ts`: binary heap ordered by the event key;
  - `simulation.ts`: the reference stepper;
  - `commands.ts`: validation;
  - `rewards.ts`;
  - `estimator.ts`: an exact swing-count distribution plus spawn, attack and survival bounds;
  - `observation.ts`.
- **`src/policy/`:**
  - `realistic.ts`: POL-STAY, POL-FRONTIER, POL-BEST-SHOWN and the diagnostic POL-FIXED;
  - `oracle.ts`: ORC-BRUTE.
- **`src/experiments/`:**
  - manifest schema;
  - content-variant patches;
  - jobs;
  - metrics recorder;
  - statistics (nearest-rank quantiles, exact binomial interval, two-sample KS);
  - summaries;
  - reports.
- **`src/cli/`:**
  - `exp.ts` and `exp-worker.ts`: a pre-registration-checked runner using worker threads, plus `--verify`;
  - `build-xp-sweep.ts`;
  - `bench-ledger.ts` and `bench/hamtLedger.ts`: a benchmark-only persistent-map prototype;
  - `s1-traces.ts`;
  - `s1-analyse.ts`;
  - `s1-content.ts`.
- **Error codes:** `EVENT_CASCADE_LIMIT` and `SIM_EVENT_LIMIT`.
- **Purity test:** now also scans `src/model`, `src/engine`, `src/policy` and `src/experiments`.
- **New npm scripts:** `exp`, `exp:verify`, `xp:sweep` and `bench:ledger`.
- **Tests:** 463 → 626 in the default suite, and 7 → 9 statistical tests (S1 drop rolls).
  - New files: `s1.events`, `s1.gates`, `s1.determinism`, `s1.experiments`, `stats/s1.drops.distribution`.

### Added: experiments (pre-registered in `manifests/s1/`)
- **Experiments:** S1-E01 to S1-E08, plus amendment S1-E06b. That amendment was registered after S1-E06 under-sampled and shared seeds across zones; S1-E06 is reported unchanged.
- **Results:** in `results/s1/` and copied to `evidence/s1/experiments/`.
- **Ledger benchmark:** `results/s1/ledger-benchmark/`.

### Changed
- **Policy definition:** POL-FRONTIER's survival criterion was changed from displayed deaths/h ≤ 1 to displayed kills-per-life ≥ 10. The change was made after an engineering smoke run and before any experiment was registered (S1-R16).
- **`DisplayedEstimate`** now carries `killsPerLife`.

### Not changed
- S0 formulas and fixture results.
- The XP table artifact `990fe508…0dc`.
- The S0 content pack.
- The S0-R01 curve fingerprint.
- The frozen simulator and the Original v1 archive.

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
