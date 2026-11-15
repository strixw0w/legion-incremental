# L2.1 pre-registration

**Registered before any L2.1 experiment ran.** The time and SHA-256 hashes are in `preregistration.json`. The runner (`src/cli/l2-run.ts`) refuses a manifest that is unregistered, changed, or written for another formula version.
- **Source:** the owner's "Independent L2 Review and L2.1 Authorisation".
- **Contract:** `planning/L2_1_CONTRACT.md` v3.0. **Rules:** `spec/formulas/l21-replay.md` v2. **Formula version:** `l2.1-v2`.

**The L2 registrations are kept unchanged.**
- `manifests/l2/` and its results in `evidence/l2/` belong to the L2 code and are not re-run. The new runner refuses them, because they are a different formula version.
- The original L2-E01 wall-budget miss and the original L2-E04 miss, with its L2-E05 follow-up, stand as recorded.

## 1. Experiments
| Manifest | What | Size | Registered budgets (enforced while running) |
|---|---|---|---|
| `L2.1-E01-differential` | Differential against the full-history reference, candidate limits | **1,000,000 deliveries**; checkpoint every 10,000; branch every 25,000 | 30 min wall; 4 GB peak process memory |
| `L2.1-E02-differential-tight` | Differential with a tight window (8 receipts or 1 h, `maxAhead` 64) | **250,000 deliveries**; checkpoint every 5,000; branch every 10,000 | 15 min; 4 GB |
| `L2.1-E03-partition` | Batch partition invariance, independent cases on worker threads | **2,000 cases × 5 partitions** | 15 min; 8 GB (all threads) |
| `L2.1-E04-bounded-growth` | The bounded-growth workload (owner §4), compact store alone, run alone, `--expose-gc` | day, week and month stages | day 2 min / 2 GB; week 10 min / 2 GB; month 30 min / 4 GB |

**The registered sizes are those of L2**: 1,000,000 deliveries, 250,000 deliveries, and 2,000 cases × 5. None is reduced.

**A run over its budget is stopped.** It is reported as `STOPPED_WALL_BUDGET` or `STOPPED_MEMORY_BUDGET`, with its partial counts, and its hypothesis is then reported as **not established**, never as passed.

**How each experiment runs:**
- **E01, E02 and E03 run at the same time**, as separate processes. Their results do not depend on timing.
- **E04 runs alone afterwards,** because its wall time and latency are measured quantities.
- **Peak memory** is the operating system's peak working set of the process (`process.resourceUsage().maxRSS`), with in-run samples as well.

## 2. Hypotheses and pass rules
### H-L21-01: correctness against the full-history reference (E01, E02)
**All of these hold:**
- 0 mismatches;
- 0 invariant violations;
- 0 bound violations;
- every checkpoint restored identically;
- 0 branch isolation breaks;
- 0 wrong-branch admissions;
- the structural comparison is the one in use. Its agreement with the serialized comparison is shown in `evidence/l2.1/optimisation/`.

**What a mismatch includes:** every declared difference (contract §2.6) is checked against its reason in the compact state. A declared difference without its reason counts as a mismatch.

**The declared differences are reported by kind:**
- closed after replay;
- closed after a conflicting retry;
- closed and never seen;
- request ahead;
- credit ahead;
- stream limit.

### H-L21-01b: the 1,000,000-delivery run completes within its 30-minute budget (E01)
**This is a registered outcome** (owner §10). If E01 is stopped, its partial counts are reported and H-L21-01 is reported for E01 as not established.

### H-L21-02: partition invariance (E03)
**All of these hold:**
- 0 mismatches over 10,000 partitions;
- the owner's example gives 250 ore in one, two and many batches.

**Determinism:** the clean-extraction check re-runs E03 with a different worker count (4), and its result must be identical.

### H-L21-03: bounded growth (E04)
**All of these hold:**
- every stage completes within its budget;
- the month checkpoint is at most **1.25 ×** the week checkpoint;
- in every stage:
  - the account's retained memory, measured alone, is at most **1 MB**;
  - the checkpoint is at most **256 KB**;
  - the reconstruction latency p95 is at most **50 ms**;
- the largest retained structures stay within the declared limits (contract §11).

**Reported as well:** the daily checkpoint-size series, the reloads, the retired producers, and the outcome counts. The outcome counts show that every required behaviour occurred:
- `REQUEST_CLOSED` for late requests;
- `PRODUCER_RETIRED` for late work;
- `CREDIT_REPLAYED` for duplicates;
- abandonment and rotation.

### H-L21-04: determinism of the package
The clean-extraction check of the review package re-runs **E02** (same process count) and **E03** (4 workers). Both results must be identical to the packaged ones.

## 3. Verification suites used for L2.1 (owner §10)
**Fast development** (during the work):
- the type check;
- the L2.1 tests;
- the L2 and L2.1 fixtures and oracles;
- the findings reproductions;
- short differentials and partitions.

**Standard regression:**
- E02 and E03;
- the save / resume tests of the actual simulation, for S2, S3 and S4 setups (`test/l2.sim.test.ts`, plus the 392-checkpoint survey);
- the performance diagnostics: `repro/l2.1/opt_compare.ts` before and after each optimisation.

**Acceptance checkpoint:**
- the full regular and statistical tests;
- the L2.1 mutation set (`repro/l2.1/mutation_check.py`);
- E01 to E04;
- **representative historical controls, executed fresh:** S1.1-E03, S2-E04, S2.1-E03, S3-E02, S3.1-E03, S4-E04 (`--verify`);
- **the exact dependency cache** (`repro/l2.1/history_cache.py`) for the remaining historical experiments:
  - a cache hit is reported as cached, separately from executed results;
  - a miss is executed;
- the clean-extraction ZIP check.

**What is not repeated:**
- the full 42-manifest historical regression, when the cache shows no input change;
- E01, which runs once.
