# M0 Resolution — owner decisions and review outcome

**Document version:** 1.0 · **Date:** 13 November 2026 · **Authority:** owner instruction "Legion Incremental — M0 Review Resolution and S0 Authorisation" (13 Nov 2026), following an independent review by ChatGPT.
**Relationship to the approved baseline:**
- This document **adds** owner decisions on top of `docs/DECISION_REGISTER.md` v1.0 (183 decisions). It does not edit or replace the register.
- Authority order (Bible §0): register + explicit later owner decisions (this document) → Bible interpretation → approved formula/content spec → tested implementation.
- Any later change to these resolutions needs a new version of this document with decision ID, rationale, evidence and migration impact.

---

## 1. Review outcome

| Item | Result |
|---|---|
| Reviewer | ChatGPT (independent design/technical review), against the original Bible and register |
| 183 decision IDs present exactly once | Independently verified by the reviewer |
| Missing, duplicate or unexpected IDs | None (reviewer) |
| SHA-256 of Bible, register and kickoff match `M0_REPO_AUDIT.md` | Verified by the reviewer |
| M0 status | **Conditionally accepted**, subject to the resolutions (§2–§3) and the mandatory technical corrections A–H (§4) |
| Authorised next scope | Repository preparation, M0 corrections, then **S0 only** (§5) |

---

## 2. Owner decisions D-01 to D-10

The IDs refer to `M0_DECISION_MATRIX.md` §2. "Candidate" values stay unapproved coefficients.

### D-01 Zone access — **APPROVED**
- **Three flags:** three separate account-wide flags, `accessUnlocked`, `visited` and `checkpointDiscovered`.
- **Kill gates:** eligible worker and offline kills may satisfy *ordinary kill gates*, which grant access only.
- **Visiting and teleport:** the hero must physically visit a region before workers can be assigned there. Teleport requires discovering the appropriate checkpoint.
- **Active-only:** major gates, class challenges, minibosses and world bosses remain active-only.
- **Resolves:** O07, N-04, C-06 (with N-11 as a measurement rule).

### D-02 Numeric policy — **APPROVED WITH CORRECTIONS**
- **What to use:**
  - exact safe integers for authoritative balances, damage, EXP and counters wherever practical;
  - integer milliseconds and basis points;
  - explicit numerical limits;
  - precomputed integer progression tables.
- **Correction:** ordinary floating-point carry is **not** accepted as exact, partition-invariant accounting. Authoritative remainders use an exact integer (rational) representation with documented quantisation, overflow limits and persistence (architecture v1.1 §6).
- **Partition invariance:** the same constant-rate productive interval must produce the same rewards however it is divided into settlement intervals.
- **Resolves:** O12 (representation), R08.18 interpretation.

### D-03 Death and recovery — **APPROVED**
- **Hero:** death respawns the hero at the checkpoint with no resource or EXP loss.
- **Auto-farm:** it may resume after death; repeated deaths stop automation with a stated reason.
- **Recruits:** they may be temporarily knocked out and recover outside combat or on hero respawn. No permanent injury, no resource penalty.
- **Candidate values:** recovery delays and death thresholds.
- **Resolves:** O05 (option A).

### D-04 Squad rewards — **APPROVED**
- **Account credit:** one eligible account kill gives one gold, loot, Bestiary and conquest credit.
- **EXP:** every eligible deployed character receives the full personal EXP award.
- **Workers:** independent combat workers have distinct encounter streams.
- **No double credit:** no encounter may be credited twice to the same account.
- **Resolves:** O03, C-05. Party contribution (O16) stays open for M9.

### D-05 Class mastery — **APPROVED**
- **Mastery progress:** each character stores independent mastery progress per class, and only the actively trained class earns mastery EXP.
- **Account bonus:** the historical highest qualifying mastery per class determines the permanent account bonus.
- **Switching:** class switching preserves overall combat level. Previous talent allocations are saved separately per class.
- **No unearned mastery:** class switching and respec must never create unearned mastery.
- **Resolves:** O04 (option A). Respec cooldown and class-change cost remain candidates.

### D-06 Rare heroes and roster — **APPROVED**
- **Slots:** World 1 has six productive recruit slots in total, excluding the hero. Ordinary recruits and rare heroes share them.
- **Reserve:** extra owned characters may stay in a non-productive reserve that keeps their levels, mastery and equipment. Reserve characters generate no EXP, resources or offline rewards.
- **Swapping:** free outside encounters.
- **No deletion:** characters are never forced to be deleted or permanently replaced.
- **Resolves:** O01 (option A), N-13 (equipment stays with the reserve character).

### D-07 Event ordering and production queues — **APPROVED WITH ADDITIONAL REQUIREMENTS**
- **Ordering:** deterministic ordering of completed work, reward credits, progression changes, stat recalculation, new work and policy decisions.
- **Must be specified before S1:**
  - simultaneous lethal attacks;
  - event cancellation;
  - stale events;
  - session boundaries;
  - duplicate encounter credit.

  Specified in architecture v1.1 §9.
- **Queues:** component production uses per-unit just-in-time input reservation, deterministic FIFO ordering, and shortage pause/resume. **The queue implementation stays out of scope until S3.**
- **Resolves:** O10 (option A) for the design. The S3 implementation is still pending.

### D-08 Offline progression — **APPROVED as the default candidate model for S5**
- **Windows:**
  - first 24 h at a starting efficiency of **60%**;
  - following 48 h at **half the normal-window efficiency**, so the initial reduced rate is **30%**;
  - maximum credited duration **72 h**.
- **Upgrades:** permanent progression may raise normal-window efficiency toward 100%. The reduced window stays half the normal rate.
- **New World 1 source:** a permanent upgrade, provisionally named **Monument of Eternity**. Its coefficients, unlock requirements, costs and bonus curve are candidates.
- **S5 testing:** the proportional second window is tested against the flat 25% alternative and the other declared sensitivity arms.
- **Efficiency once:** efficiency is applied exactly once, to eligible productive work.
- **Resolves:** O02 (default candidate), N-01, C-02, N-10 (window reset per settlement remains the proposed rule, to be confirmed in S5).

### D-09 Repository — **APPROVED**
- **Canonical repository:** `Documents/GitHub/legion-incremental/`. Remote `strixw0w/legion-incremental` was found to be **PUBLIC**, so nothing is pushed (see `M0_REPOSITORY_VERIFICATION.md`).
- **Frozen commit:** `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` is preserved.
- **Before any archival change:** a verified full backup, Original v1 preserved in a separate archival repository copy, nothing discarded or overwritten, with paths, hashes, branches and verification recorded.
- **Old Legion workspace:** `Desktop/Legion Incremental/` is kept until the owner explicitly approves deleting it.
- **Executed and verified:** see `M0_REPOSITORY_VERIFICATION.md`.

### D-10 Tooling — **APPROVED**
- **Lab tools:** strict TypeScript, pinned Node 24 LTS, Vitest, Zod, fast-check, and Python standard-library independent oracles. Exact versions are pinned and the lockfile is committed.
- **Installs:** the owner authorises installing the required legitimate development dependencies for S0.
- **Later:** Lune for independent Luau conformance testing at the appropriate later milestone.
- **Rojo:** Legion's pin is upgraded to 7.7.1 with the matching Studio plugin, so Legion and plus1game share one version. No plus1game source files or unrelated dependencies are changed.

---

## 3. Additional design resolutions

| ID | Resolution | Closes |
|---|---|---|
| R-A1 | **No enchanting at launch.** When introduced, random enchantments remain gameplay-earned under the current monetisation policy. | C-01 |
| R-A2 | **Crit chance can reach exactly 100%.** Excess chance has no effect. No super-crit tiers at launch. | C-07, N-05 |
| R-A3 | **Multiple workers may use the same gathering node** without depleting another character's availability. | N-07 (nodes) |
| R-A4 | **Numerical independent worker combat streams do not compete** for the hero's physical monster spawns. | N-07 (combat) |
| R-A5 | **Hero and recruit class records follow identical eligibility rules.** | N-15 |
| R-A6 | **Prototype miniboss:** it may use temporary content but must not silently add a fourth required major launch boss. Its implementation is reused for one of the two approved major minibosses. | O08, C-13 |
| R-A7 | **Hero's last offline activity non-combat:** deployed recruits use their last eligible independent assignments or become idle. The offline assignment preview shows this clearly. | N-03, C-04 |
| R-A8 | **Everything else stays deferred** to its owning increment. This resolution is **not** blanket approval of any remaining candidate value or open item. | — |

**Still open after this resolution:**
- **Decide by their owning increment:** O06, O09, O11, O13–O22, N-02, N-06, N-08, N-09, N-12 and N-14.
- **Proposed rule, confirm in S5:** N-10.
- **Policy agreed:** N-11 (measure first visit) is part of the experiment plan v1.1.

---

## 4. Mandatory technical corrections (before S0)

| Letter | Correction required | Where addressed |
|---|---|---|
| A | Exact authoritative production remainder accounting; interval-splitting, carry-persistence, zero-duration, assignment-switching and large-balance tests; documented quantisation boundary and guaranteed equivalence; no epsilon creating currency | Architecture v1.1 §6.2–6.4; `spec/formulas/remainder.md`; S0 tests |
| B | Round-half-up correct near the safe-integer limit; intermediate-overflow tests; single-level threshold vs cumulative table distinguished; no silent clamp or discard of excess awards | Architecture v1.1 §6.1, §6.5; `spec/formulas/numeric.md`, `xp.md` |
| C | Ledger aggregates lines per bucket before validation; same txId + identical canonical payload returns the stored result; same txId + different payload gives `TX_CONFLICT`; tests for negative, overflow, duplicate lines, failed tx, conservation, replay | Architecture v1.1 §10; `spec/formulas/ledger.md` |
| D | Unambiguous stream encoding, state initialisation, all-zero-state prevention, seed derivation stronger than one 32-bit hash; deterministic independent fixture sequences; exact uniform-integer range and rejection behaviour | Architecture v1.1 §11; `spec/formulas/rng.md` |
| E | No `Fraction` for irrational exponents; an independent high-precision oracle with a rounding-stability check; both engines consume the same versioned integer tables | Architecture v1.1 §15; `spec/oracle/xp_oracle.py`; `content/tables/` |
| F | Canonical semantic fingerprints separate from environment metadata; identical inputs give identical semantic results; no unverified cross-platform byte-identity claim | Architecture v1.1 §14 |
| G | Before S1: simultaneous lethal attacks, cancellation, stale events, session-end rewards, online→offline transitions, same-moment earlier-phase scheduling, no entity-order advantage | Architecture v1.1 §9 (specified; implemented in S1) |
| H | S1 is a diagnostic model; engineering gates separated from balance targets; misses reported without moving targets; progressive recalibration S2–S4; consistent units for comparison gates; active manual, connected auto-farm and elapsed time reported separately | Experiment plan v1.1 §1, §5, §7 |

The detailed list of edits is in `M0_CHANGE_SUMMARY.md`.

---

## 5. Authorised scope and checkpoints

1. **Repository preparation:** done and verified (`M0_REPOSITORY_VERIFICATION.md`).
2. **Documentation checkpoint** (local Git commits in the canonical repository, not pushed):
   - commit 1 imports the reviewed M0 set byte-for-byte;
   - commit 2 adds this resolution, the corrections, the change summary, the verification record and the Rojo 7.7.1 pin.
3. **S0 only:**
   - numeric types, limits, rounding, remainder primitives;
   - deterministic RNG and seed derivation;
   - EXP tables and multi-level awards;
   - stat stacking and breakdowns;
   - accuracy, damage, mitigation and crit primitives;
   - an atomic idempotent ledger;
   - content schemas and canonical hashing;
   - independent fixture oracles;
   - unit, property, statistical, purity and isolation tests;
   - the candidate EXP curve inspection report.
4. **Not authorised:**
   - S1, recruits, classes, production systems, offline settlement, a dashboard or Roblox gameplay code;
   - committing or promoting S0 as an approved baseline before independent review and owner acceptance;
   - starting S1 before explicit owner approval after the S0 review.
5. **All new numerical coefficients remain `candidate`.**
