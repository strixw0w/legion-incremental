# L2 evidence: bounded replay and settlement infrastructure

**Version 1.0, 2026-11-15.** Source: the owner's "Independent S4 Review and L2 Authorisation" §8–§12.

**Status:**
- **In review.** Not accepted, **not committed**, not pushed (the GitHub repository is public).
- S5 was **not** started. No old workspace was deleted.
- Every economy number in L2 is a synthetic test value. Every measurement is a simulator measurement, **not a Roblox persistence limit**.

## 0. What was verified, and by whom
- **Every check here was run by the same author** that wrote L2 (Claude Code). **No independent reviewer has examined L2.**
- **Independence inside the code base:**
  - **The L1 reference identity store** (`src/l2/l1Reference.ts`: plain maps, sets and lists, every receipt kept) is written independently of the range-set and receipt code.
  - **Shared code:** the synthetic economy and the work-transition table (`workRefusal` in `src/l2/ids.ts`) are shared by both stores. A defect there would not show in the differential. It is covered by the fixtures (`l2-work`, `l2-settlement`) against the Python oracle, and by mutation checks.
  - **The oracle** `spec/oracle/l2_oracle.py` was written from `spec/formulas/l2-replay.md` by the same author.
- **Mutation checks** show that the tests detect each planted defect. They do not show that no other defect exists.

## 1. S4 acceptance and checkpoint
- **The three corrections** are recorded in `evidence/s4-acceptance/ADDENDUM.md`:
  - checked counters;
  - effective bonus metadata;
  - the regional mastery Gold rank.
- **Owner decisions** (S4-R01 … R28): `planning/S4_OWNER_RESOLUTIONS.md`. **Review record:** `planning/S4_ACCEPTANCE_RESOLUTION.md`.
- **S4 checkpoint:** commit **`dc39492f3ed2c8f66884e964bcd2cfbb521e6a4d`**, annotated tag `s4-checkpoint`. Local only. Record: `evidence/s4-checkpoint/CHECKPOINT.md`, with the clean-export and frozen checks.
- **Before the commit:**
  - 35 affected manifests re-verified MATCH;
  - S4-E01, E02 and E05 identical;
  - event logs identical before and after the corrections;
  - all suites and every mutation set passed.
- **L2 is uncommitted on top of the checkpoint:** `git-status.txt` and `l2-vs-s4-checkpoint.patch`.

## 2. Documents
| Document | What |
|---|---|
| `planning/L2_CONTRACT.md` **v2.0** | The revised contract: the three boundary kinds and partition invariance (§9A); request, transaction, encounter and work identities (§9B); bounded receipts (§9C); compact ranges, producers and retirement (§9D); validated reconstruction and the trusted boundary (§9E); atomic settlement (§9F); branching; budgets; scope. v1.0 (`L2_CONTRACT_PROPOSAL.md`) is kept unchanged |
| `spec/formulas/l2-replay.md` **v1** | The exact rules for range sets, request streams, work operations, chronological settlement and checkpoints |
| `manifests/l2/PREREGISTRATION.md`, `preregistration.json` | Registered 2026-11-15T13:26:46Z, before any L2 experiment ran |
| `manifests/l2/AMENDMENT-01.md` | Registered 14:21:56Z, after the results and before its run: the staged workload's client retires finished jobs, plus an isolated account heap measure |
| `evidence/perf-audit/PERFORMANCE_AUDIT.md` (v1.0, part of the S4 checkpoint, unchanged) and **`PERFORMANCE_AUDIT_L2_ADDENDUM.md`** (new) | The verification performance audit and the proposed fast, standard and full-checkpoint suites. The addendum measures the L2 cycle, profiles the L2 differential, revises the suites and corrects the audit's §8 |
| CHANGELOG, PROVENANCE, lab README, spec README | Updated for L2 |

## 3. What was built (`src/l2/`, pure; `src/cli/l2-run.ts`, `l2-perf.ts`)
| Owner §10 item | Where |
|---|---|
| Versioned bounded replay contract | `L2_CONTRACT.md` v2.0; `l2-replay.md` v1; formula version `l2-v1` |
| Compact sequence and range representations | `ranges.ts`: a contiguous prefix plus disjoint runs; overlaps refused whole, never trimmed |
| Recent receipt retention; safe old-message rejection | `requests.ts`: `maxRecent` or `maxAgeMs` evicts, the closed horizon rises; `REPLAY_TOO_OLD` and `REQUEST_EXPIRED` |
| Producer lifecycle and retirement; work-operation identity; reservation-aware replay protection | `producers.ts`, `ids.ts`, `compactIds.ts`: numbers never reused; reserve, complete, release and abandon; retired numbers kept as a range set (bounded) |
| Encounter-credit compaction | a range set per credit stream (exact membership) |
| Request identity, with command generation separate from request delivery | `account.ts`: a retry returns its receipt, so a completed one-level Monument purchase never buys the next level; a conflicting payload is refused |
| Validated reconstruction | `checkpoint.ts` (the synthetic account) and `simCheckpoint.ts` (**the actual `LegionSimulation`**: state, pending event queue, counters; the L1 ledger reconstruction; the reservation balance; the S4 permanent domain) |
| Synthetic batch settlement primitives | `account.ts`: atomic `settleBatch` (`BATCH_OVERLAP`, refused whole) and chronological `settle` (work-start capture) |
| Immutable branching | frozen values; `BRANCH_MISMATCH` |
| Deterministic canonical serialization | canonical JSON with SHA-256 digests |
| Differential and performance tooling | `differential.ts`, `partition.ts`, `src/cli/l2-perf.ts`, `src/cli/l2-run.ts` (refuses unregistered or changed manifests) |

**Engine change (additive only):** `LegionSimulation.runtimeSnapshot()` and `restoreRuntime()`. **Error codes added:** `RANGE_OVERLAP`, `INVALID_CHECKPOINT`, `BRANCH_MISMATCH`.

**Not built** (owner §10): offline combat, gathering or Smithing simulation, the Monument of Eternity, offline rewards UI, S5 campaigns, new zones, Roblox gameplay.

## 4. Registered experiments
### 4.1 L2-E01 differential against L1, 1,000,000 deliveries (H-L2-01: **pass**; wall budget **missed**)
- **Deliveries:**
  - 400,731 new requests, 99,802 retries, 30,149 conflicting retries, 25,001 late or stale requests;
  - 115,031 new credits, 37,872 duplicate and 11,611 late credits;
  - 279,803 work operations.
- **Window:** 256 receipts or 24 h per stream.
- **Result:**
  - **0 mismatches, 0 invariant violations;**
  - **100 / 100 checkpoints restored identically;**
  - **40 branches, 0 isolation breaks.**
- **Changed old-replay semantics, counted:**
  - `REPLAY_TOO_OLD` where L1 replays the receipt: **70,579**;
  - `REPLAY_TOO_OLD` where L1 reports `CONFLICTING_PAYLOAD`: **34,438**;
  - `REQUEST_EXPIRED` where L1 would execute: **15,405**.
- **Bounds:**
  - at most **102** retained receipts per stream (window 256);
  - L1 kept **405,752** receipts at the end;
  - the largest L2 range set had **23,338 runs** (§6, item 4).
- **Simulated time:** about 36.7 years, because of long time jumps.
- **Wall time 2,093.6 s (34.9 min) against a registered 30 min.** The runner did not enforce the wall budget for E01–E03, so the run was **not stopped**. The result is kept and labelled over budget. Main RSS was 1,068 MB.

### 4.2 L2-E02 differential, tight window of 8 receipts or 1 h, 250,000 deliveries (H-L2-01: **pass**)
- **Result:** 0 mismatches, 0 invariant violations, **50 / 50** checkpoints identical, 25 branches with 0 breaks.
- **Changed semantics:** 22,590 / 8,543 / 4,621 (in the order of §4.1).
- **Bounds:** at most 8 receipts per stream; L1 kept 100,522 receipts.
- **Runtime:** 395.6 s, RSS 613 MB.

### 4.3 L2-E03 batch partition invariance, 2,000 cases × 5 partitions (H-L2-02: **pass**)
- **Cases:** Feat tiers, level-ups, offline-efficiency windows, Monument purchases, recruits, queue creation and cancellation, and kill credits, at random points.
- **Result:** **10,000 partitions, 9,407 of them with checkpoint save and restore, and 0 mismatches.**
- **Boundary events crossed:** 3,892 Feat grants, 151,516 level-ups and 4,000 window edges.
- **The owner's example** (100 ore per hour, +50% after 100 ore): **250 in one, two and many batches.** The bonus-at-batch-end defect is planted as mutation L9 and detected.
- **Runtime:** 258.7 s.

### 4.4 L2-E04 staged workloads (registered); L2-E05 (amendment 01)
**Workload:** one account, 4 gatherers, a credit every 4 s, a request a minute, work operations every 30 s. The L1 reference runs alongside. The process uses no worker threads, so worker memory is zero by construction.

| Stage | Deliveries | Wall | Peak heap / RSS | Whole-heap retained | **Account alone** | Checkpoint | Tail | Reconstruction p95 | L1 receipts |
|---|---|---|---|---|---|---|---|---|---|
| E04 day | 27,471 | 0.3 s | 24 / 87 MB | 3.04 MB | — | 54,228 B | 256 | 1.55 ms | 1,587 |
| E04 week | 192,484 | 49.3 s | 118 / 250 MB | **28.17 MB** | — | **138,096 B** | 256 | 8.58 ms | 11,092 |
| E04 month | 825,128 | 341.5 s | 184 / 325 MB | **55.57 MB** | — | **419,145 B** | 256 | 21.2 ms | 47,570 |
| E05 day | 27,561 | 0.3 s | 23 / 87 MB | 2.99 MB | **0.09 MB** | 57,051 B | 256 + 90 | 1.58 ms | 1,677 |
| E05 week | 193,175 | 49.9 s | 120 / 254 MB | 28.28 MB | **0.13 MB** | 69,330 B | 256 + 96 | 2.81 ms | 11,783 |
| E05 month | 828,118 | 307.3 s | 171 / 306 MB | 55.42 MB | **0.14 MB** | **72,206 B** | 256 + 110 | 2.80 ms | 50,560 |

**Registered outcomes (L2-E04):**
- **H-L2-03 missed:** the month checkpoint is 3.0× the week one (limit 1.25×), and the whole-heap retained figure exceeds 16 MB in the week and month stages.
- **H-L2-04 passes:** reconstruction p95 ≤ 21.2 ms against 200 ms.
- **Within budget:** every stage's wall time and peak heap; checkpoint ≤ 419 KB against 1,024 KB.

**Cause** (`AMENDMENT-01.md`):
- **Finished job producers are never retired by the workload's client,** so they accumulate (about 12.5 KB per day). Retirement is explicit in the contract and not automatic.
- **The whole-heap figure includes much more than the account:** the account alone is 0.14 MB.

**Amendment 01 (L2-E05, registered before it ran)** adds client housekeeping that retires finished jobs: 2,990 jobs in the month stage.
- **Growth is now bounded:** month / week = 1.04.
- **The account alone is ≤ 0.14 MB** in every stage.

**The registered E04 misses stand.** Automatic retirement of finished work is proposed for S5.

## 5. Gates
All gates were run on the final L2 code, 2026-11-15 14:28–15:41 UTC (`gates-run.txt`).

| Gate | Result | File |
|---|---|---|
| L2 mutation check (L1–L17) | **17 planted defects, 17 detected**; files restored | `mutation-check-l2.txt` |
| Earlier mutation sets, re-run on the L2 code | S4 acceptance 13 / 13; S4 (P1 and P8 re-targeted) 17 / 17; S3 acceptance 5 / 5; S3.1 16 / 16; S3 21 / 21 | `mutation-check-*.txt` |
| Tests | **1,401 passed** in 42 files; statistical tests 9 passed | `test-output.txt`, `test-stats-output.txt` |
| Type check | exit code 0 | `typecheck.txt` |
| Fixtures | **550 cases, 0 problems**, including the four new L2 families: ranges 20, requests 19, work 14, settlement 16 | `fixtures-check.txt` |
| Python oracles | **20 groups, 0 failing** | `oracle-check.txt` |
| Schemas | all OK | `schemas-check.txt` |
| Historical regression | **42 registered manifests MATCH** their baseline fingerprints (S1.1 7, S2 10, S2.1 2, S3 9, S3.1 8, S4 6); S4-E01, E02 and E05 **identical** to the packaged outputs; 64 min | `historical-regression.txt` |
| Registration | **0 changed**: the L2 plan, contract, spec, four manifests, and amendment 01 with its manifest; the S4 (7), S3.1 (9) and S3 (12) registers | `registration-check.txt` |
| Preservation | **0 tracked files changed** since `s4-checkpoint` under evidence, manifests, content, spec fixtures, spec formulas and repro. 12 tracked files changed, all for L2 (CHANGELOG, PROVENANCE, READMEs, `errors.ts`, the additive `legion.ts` snapshot, fixture runner and schema registrations, the purity test, `check_all.py`) | `preservation-check.txt` |
| Git | HEAD is `dc39492` (`s4-checkpoint`); L2 is uncommitted; nothing pushed | `git-status.txt`, `l2-vs-s4-checkpoint.patch` (46 file diffs, 11,254 lines) |
| Frozen workspaces | the frozen simulator's 3,012 files are identical to M0 (fingerprint `1275f219…`); the Original v1 archive is unchanged; the old Legion workspace is identical | `frozen-check.txt` |

**Changes during packaging:**
- The first registration check did not list amendment 01. The check now covers it, and it was re-run (0 changed).
- One comment line in `src/cli/l2-run.ts` was corrected after the gates: its usage note named `L2-E03-perf.json` instead of `L2-E04-perf.json`. No code changed. The git status, patch, preservation and frozen checks were regenerated afterwards. The fresh-extraction check (§8) re-ran the type check and tests on the packaged code.
- A profiling probe was added for the performance audit (`evidence/perf-audit/tools/l2_profile.ts`). It is outside the type check and the tests.

## 6. Missed targets and limitations
1. **L2-E01 exceeded its registered wall budget** (34.9 against 30 min) and was not stopped. The runner enforces budgets only inside the staged workloads (E04/E05). The fix for the future: a deadline check in the differential and partition harnesses.
2. **H-L2-03 missed in the registered L2-E04:**
   - retained state grows with finished work unless producers are retired;
   - the whole-heap measure exceeds the 16 MB budget.

   Amendment 01 shows bounded growth with retirement. The account alone uses about 0.1 MB. Automatic retirement is not implemented.
3. **The whole-heap "retained" measure does not isolate the account.** It probably includes the L1 reference store running alongside; this was not proven. The isolated measure was added after the results.
4. **Missing request numbers below the horizon leave permanent holes in a stream's range set.** The range set must keep them, to tell `REPLAY_TOO_OLD` (applied) from `REQUEST_EXPIRED` (never seen). So it grows with the number of permanently lost messages, not with history:
   - E01 reached 23,338 runs;
   - insertion copies the runs (O(runs)). In a 200,000-delivery profile, range-set work was only about 3% of the time; its share at 1,000,000 deliveries was not measured (`evidence/perf-audit/PERFORMANCE_AUDIT_L2_ADDENDUM.md` §4).
   - **The options are for the owner:** fold the two answers below the horizon into one, or use a balanced structure.
5. **The engine itself is not on L2 yet:**
   - its own commands are not routed through the L2 request layer;
   - its ledger transaction IDs are not mapped to compact identity classes;
   - the actual simulation keeps its full-history L1 ledger.

   L2 is infrastructure plus synthetic conformance, as authorised. The engine integration is S5.
6. **Checkpoint authenticity:** the digest is not keyed. A consistent edit of an unconstrained value with a recomputed digest (for example, a gold balance) is accepted. This is demonstrated in `examples/reconstruction-examples.md`. A server must store checkpoints out of the client's reach, or sign them.
7. **No real persistence:** the compare-and-swap write of contract §7 is described, not implemented. Nothing is claimed about Roblox persistence.
8. **The simulation checkpoint:**
   - it needs the persistent ledger (the reference ledger is refused);
   - the caller supplies the policy again, which is valid because the POL3 and POL4 policies keep no hidden state. That was checked by reading the code, not in general;
   - the restored log digest restarts as a chain from the saved digest.
9. **Synthetic economy only.** Partition invariance is shown for the synthetic model's chronological settlement, not for an S5 offline engine.
10. **Performance of the synthetic account:** each delivery copies small maps (items up to 1,000), so throughput falls from about 85,000 to about 2,700 deliveries per second as the account fills up. In the differential, a profile puts 36% of the time in that copy and 33% in the per-delivery comparison of the two accounts (`PERFORMANCE_AUDIT_L2_ADDENDUM.md` §4). These are simulator figures.
11. **Found before registration** (disclosed in the pre-registration): the third observable changed-semantics case (an evicted conflicting retry), and the roster cap of 8 gatherers in the test economy.
12. **Not independent** (§0).

## 7. Determinism and fingerprints
- **Fingerprints:** `fingerprints.txt` gives the SHA-256 of each result's deterministic part. E01–E03 use the whole result. E04 and E05 use the counts, checkpoint sizes, receipts and growth, not the timings.
- **Repeat runs:** the clean-extraction verification of the package re-runs L2-E02 and L2-E03 from their registered manifests and requires identical results (§8). L2-E01 (35 min) was not run a second time.
- **The actual simulation:** `test/l2.sim.test.ts` shows four save, load and continue cycles giving the uninterrupted run's state, event log and counters exactly (POL4-BALANCED2 and POL4-MONUMENT2).

## 8. Package
**Archive:** `legion-L2-review-2026-11-15.zip`.
- **Contents:** the canonical repository's working tree, HEAD `s4-checkpoint`, with L2 uncommitted on top.
- **Inside:** `MANIFEST.txt` gives the SHA-256 and size of every file.
- **The archive's own SHA-256** and the fresh-extraction results are in `legion-L2-review-2026-11-15.verification.txt`, next to the ZIP. A file inside an archive cannot carry that archive's checksum.

**The fresh-extraction check:**
- extract into a new, empty folder, and check every file against `MANIFEST.txt`;
- install offline (`npm ci --offline`), then run the type check, tests, statistical tests, fixtures, schemas and oracles;
- re-verify S3.1-E03 and S4-E04 against their stored fingerprints;
- re-run L2-E03 and L2-E02 from their registered manifests, and require results identical to the packaged ones.

| Owner §12 item | Where |
|---|---|
| `L2_EVIDENCE.md` | this file |
| S4 acceptance addendum and checkpoint SHA | `evidence/s4-acceptance/ADDENDUM.md`; `evidence/s4-checkpoint/CHECKPOINT.md` (`dc39492f…`); §1 |
| Revised versioned L2 contract | `planning/L2_CONTRACT.md` v2.0 (v1.0 kept as `L2_CONTRACT_PROPOSAL.md`) |
| Source code | `src/l2/`, `src/cli/l2-run.ts`, `src/cli/l2-perf.ts`, the additive `src/engine/legion.ts` change; `l2-vs-s4-checkpoint.patch` |
| Formula and identity specifications | `spec/formulas/l2-replay.md` v1; contract §9B–§9D |
| Independent fixtures and oracles | `spec/fixtures/l2-*.v1.json` (69 cases), `spec/oracle/l2_oracle.py`, `repro/l2/make_fixtures.py`; independence limits in §0 |
| Full verification logs | `gates-run.txt`, `test-output.txt`, `test-stats-output.txt`, `typecheck.txt`, `fixtures-check.txt`, `oracle-check.txt`, `schemas-check.txt`, `historical-regression.txt`, `runs.txt` |
| Differential test results | `experiments/L2-E01-differential.json`, `L2-E02-differential-tight.json`; §4.1–§4.2 |
| Replay-contract comparisons | `examples/replay-contract-comparison.md`; the changed-semantics counts in §4.1–§4.2 |
| Representative checkpoint and reconstruction examples | `examples/account-checkpoint.json`, `sim-checkpoint-summary.json`, `reconstruction-examples.md`; `repro/l2/examples.ts` |
| Batch partition conformance tests | `experiments/L2-E03-partition.json`; the `l2-settlement` fixtures; `test/l2.core.test.ts` |
| Mutation-check evidence | `mutation-check-l2.txt` and the five re-run sets; `repro/l2/mutation_check.py` |
| Performance and memory reports | `experiments/L2-E04-perf.json`, `L2-E05-perf-v11.json`; §4.4; `evidence/perf-audit/PERFORMANCE_AUDIT.md` and `PERFORMANCE_AUDIT_L2_ADDENDUM.md` |
| Deterministic fingerprints | `fingerprints.txt`; §7 |
| All missed targets and remaining limitations | §6 |
| Git status and diff | `git-status.txt`, `preservation-check.txt`, `l2-vs-s4-checkpoint.patch` |
| Frozen workspace verification | `frozen-check.txt` |
| Verified archive checksum manifest | `MANIFEST.txt` in the archive; the `.verification.txt` next to it |

**To re-run:**
- `node src/cli/l2-run.ts manifests/l2/<manifest>.json --out <file>`; add `--expose-gc` before the script for E04 and E05, which measure retained heap. The runner refuses a manifest that is unregistered or changed.
- `python -I -X utf8 repro/l2/mutation_check.py <lab folder> <node folder>` for the mutation set. It edits source files temporarily, so never run it while an experiment is running.
- `node repro/l2/examples.ts <output folder>` for the examples.
