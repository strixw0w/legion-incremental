# M0 Change Summary — v1.0 (as reviewed) → v1.1 (corrected)

**Date:** 13 November 2026 · **Basis:** `M0_RESOLUTION.md` v1.0 (owner decisions D-01 to D-10, resolutions R-A1 to R-A8, review corrections A–H).
- **Before:** the v1.0 documents are in the import commit `3aced251bf44c8dd4ceafac01946acaa4af2cdcd`.
- **After:** the v1.1 documents are in the following documentation commit.
- **To see every line changed:** `git diff 3aced25 -- legion-progression-lab/planning/`.

> **In plain words.** This lists every change made to the planning documents after the review, and the reason for each. Nothing in your original Bible or Decision Register was changed.

## 1. New documents

| Document | Purpose |
|---|---|
| `M0_RESOLUTION.md` v1.0 | The owner's decisions and the review outcome, kept separate from the approved register |
| `M0_REPOSITORY_VERIFICATION.md` v1.0 | Backup, archive, copy and hash verification; GitHub visibility; tooling |
| `M0_CHANGE_SUMMARY.md` | This file |

## 2. `M0_ARCHITECTURE.md` v1.0 → v1.1

| Section | Change | Review item / decision |
|---|---|---|
| Header | Version 1.1; status "approved with corrections" | — |
| §2 | Canonical repository fixed to `Documents/GitHub/legion-incremental/`; public remote noted; old workspace kept | D-09 |
| §3 | Exact pinned versions: TypeScript 7.0.2, Node 24.22.3 (self-contained, checksum-verified), npm 11.19.1, vitest 4.1.12, zod 4.6.7, fast-check 4.10.2, @types/node 24.19.2, Python 3.12.9 stdlib, Rojo 7.7.1 | D-10 |
| §5 | Time categories split into active manual, connected auto-farm and offline, with elapsed time as their sum | H |
| §6 | Rewritten. §6.1 safe integers with intermediate-overflow checks and exact `divRem`. §6.2 corrected round-half-up, with the two failure cases of `floor(x+0.5)` documented. §6.3 **exact remainder accumulators** replace the floating carry: integer remainder, den ≤ 2^26, overflow-free decomposition, guarantees G1 (partition invariance) to G5 (no epsilon), standard chains, quantisation boundary, persistence, limits. §6.5 single-level thresholds vs cumulative table; no clamp or discard; `XP_TABLE_EXHAUSTED` | D-02, A, B |
| §9 | Rewritten. Ordering key gains `pass`. Seven semantic rules: simultaneous lethal attacks; no entity-order advantage plus a metamorphic test; epochs for cancellation and stale events; half-open sessions; online→offline handoff; same-moment earlier-phase scheduling via passes; kill credit IDs against duplicate encounter credit | D-07, G |
| §10 | Rewritten. Per-bucket aggregation before validation; identical payload replays the stored result; a different payload is `TX_CONFLICT`; failed transactions record nothing; conservation rule | C |
| §11 | Rewritten. Length-prefixed stream identity with a domain tag; SHA-256 state derivation (128-bit state from a 256-bit hash) replaces FNV-1a and SplitMix32; all-zero-state rule; Bernoulli always one draw; exact `uniformInt` range, limit, boundaries and guard | D |
| §14 | Rewritten. Semantic vs environment records; canonical JSON v1 rules; fingerprint covers semantic content only; reproduction claim limited to what is tested; no cross-platform byte-identity claim | F |
| §15 | Rewritten. `Fraction` only for rational quantities; `decimal` at 60 and 120 digits plus a rounding-stability check for fractional exponents; integer tables are the cross-engine contract; same-author independence limitation stated | E |

## 3. `M0_EXPERIMENT_PLAN.md` v1.0 → v1.1

| Location | Change | Review item |
|---|---|---|
| Header | Version 1.1 | — |
| §1 principle 3 | Three time kinds always separate | H |
| §1 new principles 9–11 | Engineering gates vs balance targets; S1 is a diagnostic model with progressive recalibration in S2–S4; consistent units for comparison gates (best ÷ worst ratio) | H |
| §2 table | `activeMs` replaced by `activeManualMs` and `connectedAutoFarmMs`; `elapsedMs` redefined | H |
| §5 metrics | Strategy spread is the best ÷ worst ratio | H |
| §7 S0 | Scope and gates updated to the corrected primitives; oracle agreement, partition invariance, semantic fingerprint and frozen-lab check added | A–F |
| §7 S1 | Diagnostic-model note; H-S1-07 marked diagnostic only; gates split into engineering gates (decide acceptance) and balance targets (reported, never moved after the run); §9.3 semantics added to the gates | G, H |
| §7 S5 H-S5-02 | Exact partition invariance becomes an engineering gate; the window-reset effect is reported separately | A, H |
| §7 S6 H-S6-03 | Spread gate restated as a best ÷ worst ratio of 1.1–2.0 | H |

## 4. `M1_S0_S1_IMPLEMENTATION_PLAN.md` v1.0 → v1.1

- **Restructured:**
  - **S0 is authorised.** Its file list was rewritten to match the corrected design: the remainder module, SHA-256 stream derivation, `exact_oracle.py`, the schema-drift and runtime tests, and the evidence folder.
  - **S1 is not authorised.** Its plan is condensed and carries the §9.3 requirements.
- **v1.0 S1 candidate inputs** were deliberately not reproduced. They remain in the import commit for the future S1 approval request.
- **Commands** now use the pinned Node 24.22.3.
- **Definition of done:** S0 is **not committed** until after review.

## 5. `M0_DECISION_MATRIX.md` v1.0 → v1.1

- Header status updated.
- A new **§0 addendum** maps D-01 to D-10 and every C/N item to its resolution status.
- The 183 primary rows in §5 are **unchanged**. The coverage check still passes: 183/183, none missing, extra or duplicated.

## 6. `M0_REPO_AUDIT.md`

- **Unchanged.** It is the record of the state at audit time.
- Later facts, such as backups, the canonical repository and the public remote, are recorded in `M0_REPOSITORY_VERIFICATION.md`.

## 7. Repository files outside `planning/`

| File | Change | Reason |
|---|---|---|
| `.gitattributes` | Added in the import commit (`* -text`) | Keep bytes, and therefore recorded hashes, identical on checkout (system `core.autocrlf=true`) |
| `rokit.toml` | `rojo@7.7.0-rc.1` → `rojo@7.7.1` | D-10 |
| Design pack (`docs/`) | **No change** | Approved baseline |
