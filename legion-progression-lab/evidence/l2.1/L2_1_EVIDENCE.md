# L2.1 evidence: bounded replay correction

**Version 1.0, 2026-11-15.** Source: the owner's "Independent L2 Review and L2.1 Authorisation" §2–§11.

**Status:**
- **In review.** Not accepted, **not committed** (L2 and L2.1 sit uncommitted on top of `s4-checkpoint`), not pushed (the repository is public).
- **Not done:** S5 was not started; offline gameplay, the Monument of Eternity and engine integration were not built; Roblox persistence was not implemented; no workspace was deleted.
- **Test values only:** every economy number and limit is a synthetic test value. Every measurement is a simulator measurement, **not a Roblox persistence limit**.

## 0. What was verified, and by whom
- **Every check here was run by the same author** as L2.1 (Claude Code). **No independent reviewer has examined L2.1.**
- **The reviewer's independent verification of L2** (owner §1) applies to the L2 package only.
- **Independence inside the code base:**
  - **The full-history reference** (`src/l2/l1Reference.ts`) keeps every receipt and credit, with no window. It shares the producer lifecycle and the synthetic economy with the compact store, through the account.
  - **The L2.1 oracle** (`spec/oracle/l21_oracle.py`) derives the request window from the full history by definition, uses plain sets and dictionaries, and re-simulates the account from `spec/formulas/l21-replay.md` v2. **It was written by the same author.**
  - **The reviewer noted that L2's oracle reproduced L2's own algorithm.** The L2.1 review cases are therefore hand-derived in the fixtures (the out-of-order expiry, the age boundary, the window edge and the close-empty case). The TypeScript window is also checked against a definition-based model in a property test.
- **Mutation checks** show that the tests detect each planted defect. They do not show that no other defect exists.

## 1. Documents
| Document | What |
|---|---|
| `planning/L2_1_CONTRACT.md` **v3.0** | The revised contract: time, the bounded window, the **declared observable differences** (§2.6), credits, the lifecycle, reconstruction, immutability, the delivery parts, branches, limitations, **decisions for the owner** (§10), the limits. v2.0 is kept |
| `spec/formulas/l21-replay.md` **v2** | The exact rules. `l2-replay.md` v1 is kept unchanged, and its request rules are superseded |
| `manifests/l2.1/PREREGISTRATION.md`, `preregistration.json` | Registered **2026-11-15T17:39:09Z**, before any L2.1 experiment |
| `evidence/l2.1/optimisation/SUMMARY.md` | The exact optimisation comparisons |
| CHANGELOG, PROVENANCE, README, spec README | Updated for L2.1 |

## 2. The review findings, before and after
**Inputs:** the reviewer's own, in `repro/l2.1/findings_before.ts` and `findings_after.ts`.
- **Before:** `reproductions/findings-before.json`, run on this tree's L2 code at 2026-11-15 ~16:35 UTC, before any L2.1 edit. All nine findings reproduced exactly as reviewed.
- **After:** `reproductions/findings-after.json`.
- **Tests:** `test/l21.findings.test.ts` asserts the after-state.

| # | Finding (owner §) | L2 (before) | L2.1 (after) |
|---|---|---|---|
| F1 | Out-of-order expiry: seq 2 at 0, seq 1 at 90, seq 3 at 150, `maxAgeMs` 100 (§2) | all three retained; retry of 2 at 150 **replays** | receipt 2 expires at 150 (horizon 2): retry **`REQUEST_CLOSED`**; receipt 1 still replays until 190 |
| F2 | Expiry through a credit, with no new request (§2) | retry at 10 h **replays** | receipts expire on every delivery: retry **`REQUEST_CLOSED`**, one Monument level |
| F3 | 2,000 requests 2, 4, …, 4000 (§3) | **2,000 runs**; horizon 3,798; 101 receipts; 38,655 B | **no gap membership** (state is the horizon, the highest number and 101 receipts); **15,868 B**, and **16,181 B after 20,000 requests**; odd numbers below the horizon are `REQUEST_CLOSED` |
| F4 | Released prefix 100,002 over settled 100,001 (§5A) | **accepted** | **refused:** a released unit is not settled (interval subset) |
| F5 | Unit 1 both released and abandoned (§5B) | **accepted** | **refused:** both released and abandoned (interval disjointness) |
| F6 | Simulation checkpoint: delete `hero`; `hp = -1`; unknown event kind; delete `rng.loot`; delete `permanent` (§5) | **all five accepted** | **all five refused** with the problem named; the unedited checkpoint, re-sealed, is accepted |
| F7 | A returned receipt changed to level 999 (§6) | stored replay receipt **reports 999**; action and RNG not frozen; the RNG is the caller's array | the change is refused (frozen); the replay is the original; action and RNG frozen; the RNG is copied; spread copies are refused |
| F8 | A child-branch message delivered to the parent (§7) | **executed** in the parent | **`BRANCH_MISMATCH`**, parent unchanged; executes in the child; a child checkpoint cannot be restored as the parent |
| F9 | A failed `settleBatch` at 1 h (§8) | time 0 → 3.6 M and ore 0 → 129, **inside the failed command** | the same time and ore, now **the independently committed advancement**: the state equals `advanceTo(1 h)` alone, plus the failure receipt; the batch's producer is unchanged |

**F9 needs an explanation.** The time still moves to 1 h and the ore still reaches 129, because the delivery's trusted time is 1 h.
- **What L2.1 changes is what owns that advancement.** Advancement is now part 2 of every delivery, defined and committed independently of the command (contract §7).
- **The failed batch commits nothing of its own**, which a full-state comparison in the tests shows.
- **No command can move the cursor:** a `settle` beyond the trusted time is now `SETTLE_AHEAD`.
- **For the owner:** if a refused request should not advance the economy at all, that is decision §10.4 of the contract.

## 3. What was built (`src/l2/`, pure; `src/cli/l2-run.ts`, `l2-perf.ts`, `l2-partition-worker.ts`)
| Owner § | Where | What |
|---|---|---|
| §2 receipt expiry | `requests.ts`, `compactIds.ts` (`maintain`), `account.ts` | **Expiry by trusted acceptance time** (live while `now − at < maxAgeMs`), whatever the arrival order, on every delivery; deliveries behind the clock are `TIME_BACKWARDS` |
| §3 bounded window | `requests.ts`, `limits.ts` | **Horizon, top and at most `maxRecent` receipts:** `REQUEST_CLOSED`, `REQUEST_AHEAD`, `STREAM_LIMIT`; no membership below the horizon |
| §4 lifecycle and credits | `producers.ts`, `account.ts`, `compactIds.ts` | **Producers:** units in order; outstanding and unit limits (rotation); closing; automatic retirement. **Credits:** an admission window and abandonment |
| §5 reconstruction | `checkpoint.ts`, `producers.ts` (`producerProblems`, `kindProblems`), `ranges.ts` (`isSubset`, `disjoint`), `simState.ts`, `simCheckpoint.ts` | **Exact interval arithmetic;** a full simulation-state validator; controlled errors; **simulation checkpoint v2**, with flat credit chains |
| §6 immutability | `account.ts` (`seal`, the trust registry), `requests.ts` (`freezeReceipt`), `producers.ts` | **Frozen receipts, nested records, RNG and lines;** only module-made accounts are accepted |
| §7 branches | `account.ts` (`fork`, the envelope), `checkpoint.ts` | **Branch identity** on accounts and deliveries; lineage taken from the account |
| §8 atomic settlement | `account.ts` (`deliver`, `advanceTo`) | **Envelope, advancement and atomic command;** `SETTLE_AHEAD`; domain validation |
| §9 performance | `account.ts` (copy-on-write items, the Feat check), `differential.ts` (structural comparison), `partition.ts` (independent cases), `src/cli/l2-run.ts` (worker threads, budgets for every kind, peak memory) | |

**New finding during L2.1 (not in the review): L2 could not save a long actual-simulation run.** Its simulation checkpoint serialized the engine's committed kill-credit chain as nested objects, and overflowed after about 6,900 kills (3 simulated hours of S2 play).
- **v2 stores the chain flat.** A real-run survey (392 checkpoints of S2, S3 and S4 setups, up to 14 simulated hours) all pass the new validator. Five save, restore and continue cycles to 10 h are identical to the uninterrupted run in all seven setups (`test/l2.sim.test.ts`, and the survey script).
- **The chain still grows by about 258 bytes per kill:** 2.4 MB after 4 hours (`examples/reconstruction-examples.md`). That is the engine's L1 credit model, a limitation (§6.1).

## 4. Registered experiments (all within their registered budgets)
E01, E02 and E03 ran at the same time as three processes, from 17:39:09 UTC. E04 ran alone afterwards.

| Experiment | Size | Wall (budget) | Peak process memory, OS (budget) | Result |
|---|---|---|---|---|
| **L2.1-E01** differential, candidate limits | **1,000,000 deliveries** | **243.9 s** (1,800 s) | 574 MB (4,096) | **0 mismatches**, 0 invariant and 0 bound violations; **100 / 100** checkpoints identical; **40** branches, 0 isolation breaks, **0 wrong-branch admissions** (200 probes) |
| **L2.1-E02** differential, tight window | **250,000** | 74.6 s (900 s) | 298 MB (4,096) | **0 mismatches**, 0 / 0 violations; **50 / 50** checkpoints; 25 branches, 0 / 0 |
| **L2.1-E03** partition | **2,000 × 5** on 13 workers | 13.5 s (900 s) | 893 MB, all threads (8,192) | **0 mismatches** in 10,000 partitions (9,400 with checkpoints); the owner's example **250 / 250 / 250** |
| **L2.1-E04** bounded growth | day, week, month | 0.24 s, 1.76 s, 9.1 s | 242 MB (4,096) | **H-L21-03 passes** (below) |

**Hypotheses:** **H-L21-01, H-L21-01b, H-L21-02 and H-L21-03 all pass. H-L21-04** (determinism of the package) is §8.

**L2's E01 took 2,093.6 s, over its budget.** That recorded miss stands.

### 4.1 Declared differences (contract §2.6), every one reason-checked
| | E01 | E02 |
|---|---|---|
| `REQUEST_CLOSED` where the reference replays | 72,952 | 22,471 |
| `REQUEST_CLOSED` where the reference reports a conflict | 39,368 | 9,674 |
| `REQUEST_CLOSED`, never seen | 10,597 | 2,620 |
| `REQUEST_AHEAD` | 4,815 | 1,150 |
| `CREDIT_AHEAD` | 1,067 | 280 |
| Stream limits | 0 | 0 |

**Reading the counts:**
- Each one passed its reason check in the compact state. A difference without its reason is a mismatch, and there were none.
- **The harness can find mismatches:** planted faults (mutations N36–N38, and the "harness's power" test) are reported, including a silent economy drift.

### 4.2 Retained structure (E01 maximum over the run, against the declared limit)
| Structure | E01 | E02 | Limit |
|---|---|---|---|
| Receipts per stream | 89 | 8 | 256 (8) |
| Credit range-set runs | 15 | 14 | 4,096 |
| Producer range-set runs | 23 | 23 | 4,096 |
| Open producers per kind | 64 | 64 | 64 |
| Reserved units per producer | 12 | 8 | 64 |

**Open producers reached the limit of 64:** the random generator opens batches faster than it closes them, so further opens were refused (`PRODUCER_LIMIT`). Retired producers: 31,923 (E01), 7,998 (E02). **The full-history reference kept 399,752 receipts** at the end of E01.

### 4.3 Bounded growth (L2.1-E04; compact store alone, `--expose-gc`)
| Stage | Deliveries | Wall | Peak RSS (sampled) | Account alone | Whole process retained | Checkpoint | Reconstruction p95 | Reloads | Producers retired | Rotations |
|---|---|---|---|---|---|---|---|---|---|---|
| day | 32,630 | 0.24 s | 87 MB | ≈ 0 MB (below the heap counter's resolution) | 1.42 MB | 42,984 B | 1.11 ms | 4 | 297 | 0 |
| week | 228,691 | 1.76 s | 156 MB | 0.133 MB | 0.71 MB | 54,332 B | 2.29 ms | 28 | 2,095 | 2 |
| month | 980,279 | 9.09 s | 240 MB | **0.141 MB** | 0.85 MB | **55,021 B** | 1.82 ms | 120 | **9,131** | **10** |

**The pass rules:**
- **Month / week checkpoint = 1.013** (limit 1.25);
- the account alone is ≤ 0.141 MB in every stage (limit 1 MB);
- the checkpoint is ≤ 56 KB (limit 256 KB);
- the p95 is ≤ 2.3 ms (limit 50 ms);
- the largest retained structures (month): 256 receipts, 20 credit runs, 15 producer runs, 4 open producers, 3 reserved units.

**The daily checkpoint size over the month** rises from 43 KB to a plateau of 55–56 KB. The rise is the item map filling to its domain limit of 1,000 items.

**Behaviours exercised (month outcome counts, `experiments/L2.1-E04-bounded-growth.json`):**

| Behaviour | Count |
|---|---|
| Late requests below the horizon (`REQUEST_CLOSED`) | 850 |
| Late work for retired producers (`PRODUCER_RETIRED`) | 2,090 |
| Duplicate and late credits (`CREDIT_REPLAYED`) | 6,401 |
| Abandoned encounters | 7,988 |
| Jobs created (completed or cancelled) | 3,519 |
| Of which cancelled | 793 |
| Closed batches | 5,612 |
| Rotations (`PRODUCER_FULL`) | 10 |
| Reloads | 120 |
| Permanently missing request numbers | about 2% of the client's numbers |
| Multi-day reservations on the long-lived producer | by construction: 0.2% of its units are held for 1–3 days |

## 5. Gates
All gates ran on the final L2.1 code, 2026-11-15 17:43:45–17:51:52 UTC (`gates-run.txt`).

| Gate | Result | File |
|---|---|---|
| L2.1 mutation set (N1–N38) | **38 planted defects, 38 detected**; files restored | `mutation-check-l2.1.txt` (the first run, with N38 missed, is `mutation-check-l2.1-first-run.txt`, and its follow-up is `-followup.txt`) |
| Tests | **1,475 passed** in 43 files; statistical tests 9 passed | `test-output.txt`, `test-stats-output.txt` |
| Type check | exit code 0 | `typecheck.txt` |
| Fixtures | **607 cases, 0 problems**, including the new families `l21-requests` (19), `l21-credits` (10), `l21-lifecycle` (12) and `l21-delivery` (16). `l2-requests` (19) is superseded and not run against the code; its oracle check still passes | `fixtures-check.txt` |
| Python oracles | **21 groups, 0 failing** (new: the L2.1 group) | `oracle-check.txt` |
| Schemas | all OK | `schemas-check.txt` |
| Representative historical controls, **executed** | **6 MATCH:** S1.1-E03, S2-E04, S2.1-E03, S3-E02, S3.1-E03, S4-E04 | `historical-controls.txt` |
| Historical cache | **45 / 45 exact hits:** the 42 registered manifests and the 3 S4 engineering runs. 39 are **reused, not executed**; the 6 above were executed as well | `history-cache.txt` |
| Registration | **0 changed:** the L2.1 and L2 plans, contracts, specs, manifests and amendment; the S4, S3.1 and S3 registers | `registration-check.txt` |
| Preservation | **0 problems.** All 51 original L2 record files (`evidence/l2`, `manifests/l2`, `repro/l2`, the L2 contract and proposal, the L2 spec, fixtures and oracle) are byte-identical to the L2 package. 0 tracked evidence, manifest, content, fixture, formula or repro files changed since `s4-checkpoint`. The 26 changed L2 files are the L2 code revised by L2.1, plus its documents | `preservation-check.txt` |
| Git | HEAD `dc39492` (`s4-checkpoint`); L2 and L2.1 uncommitted; nothing pushed | `git-status.txt`; `l2.1-vs-s4-checkpoint.patch` (71 file diffs, 25,278 lines); **`l2.1-vs-l2-package.patch`** (the L2.1 change set: 51 files, 25 added and 26 changed, 17,287 lines) |
| Frozen workspaces | the frozen simulator's 3,012 files are identical to M0 (`1275f219…`); the Original v1 archive is unchanged; the old Legion workspace is identical | `frozen-check.txt` |

### 5.1 Verification-suite timings and cache usage (owner §10)
| Step | Wall | How |
|---|---|---|
| **Fast development:** type check, all tests, fixtures, oracles | about 0.5 min (2 + 15 + 2 + 4 s, plus the 5 s statistical tests) | run after each change |
| Simulation-state survey: 392 real checkpoints saved, all validated, 7 resume checks | 2.0 min to save; 28 s to validate | standard regression, once |
| Exact optimisation comparisons: 3 runs | 4.9, 2.2 and 1.6 min | each alone |
| **Registered experiments:** E01, E02 and E03 side by side | **4.1 min wall** (E01 243.9 s, E02 74.6 s, E03 13.5 s on 13 workers) | in parallel |
| E04 bounded growth | 11.3 s | alone |
| **Acceptance gates**, all | **8.1 min:** mutation set 260 s; suites 29 s; 6 historical controls 164 s; cache 2 s; checks and diffs about 30 s | |
| Historical experiments **cached** | **39 not executed** (exact identity hits); 0 misses | `history-cache.txt` |

**Against L2's cycle (`evidence/perf-audit/PERFORMANCE_AUDIT_L2_ADDENDUM.md` §2):**
- the registered experiments took 58.3 min in L2 and 4.3 min in L2.1;
- the gates took 73 min in L2, including the full 64-minute historical regression, and 8.1 min in L2.1;
- no registered sample size was reduced, and E01 was run once.

**Why the cache hits are exact:** L2.1 changed no file in any historical runner's import closure, and no content, manifest, dependency or runtime. The closures and their file hashes are listed per experiment in `history-cache.txt`.

## 6. Missed targets and limitations
1. **The gameplay engine is not on the L2.1 store** (owner: integration is S5).
   - Its commands do not pass through the request window.
   - Its kill-credit registries keep the full committed history, so **the actual simulation's checkpoint grows with the number of kills**: about 258 bytes per kill, 2.4 MB after 4 simulated hours of S2 play.
   - L2.1 makes long runs saveable and validated. It does not make them bounded.
2. **F9:** a refused request still advances the economy to its trusted time. This is by design (contract §7), and is offered to the owner as decision §10.4.
3. **The trust registry guards against accidental misuse only.** `trustValidated` is exported for the checkpoint module, so hostile code inside the server could call it.
4. **The digest is not a signature.** A consistent edit of an unconstrained value, with the digest recomputed, is accepted (`examples/reconstruction-examples.md`). Checkpoints must be stored out of the client's reach.
5. **No real persistence:** the compare-and-swap write remains a description.
6. **The limits are candidates.** The window, admission and lifecycle limits are synthetic test values, and E01 hit `PRODUCER_LIMIT`.
7. **The simulation validator's cross-checks are the engine invariants verified on real runs:** 392 surveyed checkpoints, plus random corruption in the tests. Rules that would need the engine's internal derivations (for example, the hero's maximum health from level, class and modifiers) are range checks, not recomputations.
8. **One planted defect (N38, a silent economy drift) was missed on the first mutation run.** The harness test was strengthened, and N36–N38 were re-run and detected. Both logs are kept: `mutation-check-l2.1-first-run.txt` and `mutation-check-l2.1-followup.txt`. The full set ran again in the gates (§5).
9. **Timings are single measurements** on one machine.
10. **Not independent** (§0).

## 7. Determinism and fingerprints
- **Fingerprints:** `fingerprints.txt` gives the SHA-256 of each result's deterministic part. The E04 timings and memory are excluded.
- **Repeat runs:** the package check (§8) re-runs E02 and E03, with E03 on 4 workers instead of 13. L2.1-E01 runs once.

## 8. Package
**Archive:** `legion-L2.1-review-2026-11-15.zip`.
- **Contents:** the canonical repository's working tree, HEAD `s4-checkpoint`, with L2 and L2.1 uncommitted on top.
- **Inside:** `MANIFEST.txt` gives the SHA-256 and size of every file.
- **The archive's own SHA-256** and the fresh-extraction results are in `legion-L2.1-review-2026-11-15.verification.txt`, next to the ZIP.

**The fresh-extraction check:**
- extract into a new, empty folder, and check every file against `MANIFEST.txt`;
- install offline, then run the type check, tests, statistical tests, fixtures, schemas and oracles;
- re-verify S3.1-E03 and S4-E04;
- re-run **L2.1-E02**, and **L2.1-E03 with 4 workers** (13 when registered); both must give the packaged status and result.

| Owner §11 item | Where |
|---|---|
| L2.1 evidence summary | this file |
| Revised versioned replay and settlement contract | `planning/L2_1_CONTRACT.md` v3.0; `spec/formulas/l21-replay.md` v2 |
| Before / after reproductions of the reviewer findings | `reproductions/findings-before.json`, `findings-after.json` (and `.txt`); `repro/l2.1/findings_before.ts`, `findings_after.ts`; `test/l21.findings.test.ts`; §2 |
| Automatic retirement and bounded-gap tests | `test/l2.core.test.ts` (the lifecycle, credits and window tests, the definition-model property test); `l21-lifecycle`, `l21-credits` and `l21-requests` fixtures; L2.1-E04 |
| Validated reconstruction tests | `test/l2.core.test.ts` (named refusals, random corruption); `test/l2.sim.test.ts` (the five review cases, 19 further edits and the 8 L2 edits, random corruption, the long run); `examples/reconstruction-examples.md` |
| New negative-control and mutation evidence | `mutation-check-l2.1.txt` (38 / 38), with the first run and follow-up; `repro/l2.1/mutation_check.py`; the harness's power test |
| Updated independent fixtures and oracles | `spec/fixtures/l21-*.v1.json` (57 cases); `spec/oracle/l21_oracle.py`; `repro/l2.1/make_fixtures.py` |
| Differential and partition results | `experiments/L2.1-E01-differential.json`, `L2.1-E02-differential-tight.json`, `L2.1-E03-partition.json`; §4 |
| New bounded-growth measurements | `experiments/L2.1-E04-bounded-growth.json`; §4.3 |
| Exact performance optimisation comparisons | `optimisation/SUMMARY.md`, `baseline.json`, `opt1-cow.json`, `opt2-feats.json`; `repro/l2.1/opt_compare.ts` |
| Verification-suite timings and cache usage | §5.1; `history-cache.txt`; `historical-controls.txt`; `gates-run.txt`; `runs.txt` |
| All remaining limitations and missed budgets | §6. No L2.1 budget was missed; the recorded L2 misses stand |
| Git status and diff | `git-status.txt`, `l2.1-vs-s4-checkpoint.patch`, `l2.1-vs-l2-package.patch`, `preservation-check.txt` |
| Verified archive checksum manifest | `MANIFEST.txt` in the archive; the `.verification.txt` next to it |

**To re-run:**
- `node src/cli/l2-run.ts manifests/l2.1/<manifest>.json --out <file>`. Add `--expose-gc` before the script for E04, and `--workers <n>` for E03.
- `python -I -X utf8 repro/l2.1/mutation_check.py <lab folder> <node folder>`. It edits sources temporarily, so never run it alongside an experiment.
- `python -I -X utf8 repro/l2.1/history_cache.py <lab folder> <L2 review zip> <node folder>`.
- `node repro/l2.1/findings_after.ts <out.json>`. For the before state, run `node repro/l2.1/findings_before.ts <L2 lab folder> <out.json>` on an L2 tree with its `node_modules`.
