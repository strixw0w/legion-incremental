# Simulation and verification performance audit

**Version 1.0, 2026-11-15.** Requested alongside the owner's "Independent S4 Review and L2 Authorisation".

**What was run:**
- Nothing registered was restarted or replaced.
- The new measurements are staged and short:
  - one same-tree `--verify` of S4-E04 and one of S3.1-E02, both MATCH;
  - one CPU-profiled 7-day game run.
- Tools: `tools/` (`measure.sh` with `sample.ps1`, `one_cell.ts`, `agg.py`, `callers.py`, `closure_check.py`). Raw data: `samples/`.

## 1. Current state
- **No experiment is running.** All S4 work finished on 2026-11-14 (the S4 review package). The S4 corrections were at the code-reading stage, with no source change yet. L2 has not started.
- **Machine:** AMD Ryzen 7 7800X3D, 8 cores / 16 threads, 31.1 GB RAM, Windows 11, pinned Node 24.22.3.
- **Runners:** each manifest runs in one process with 15 worker threads (`min(15, CPUs − 1)`). Jobs are split round-robin, and every worker compiles every content variant.

## 2. Wall-clock time of the S4 verification cycle (2026-11-14, UTC)
| Step | Time | Detail |
|---|---|---|
| Pass 1 (registered manifests, before the final monitor check) | 11.9 min | E06 3.0, E04 1.4, E03 6.8, engineering 0.5 |
| Pass 2 (final code) | 10.6 min | E06 2.9, E04 1.2, E03 5.8, engineering 0.6 |
| Amendment 01 | 10.3 min | E07 2.2, E09 2.1, E08 6.0 |
| `--verify` of all six S4 manifests | 27.3 min | E06 2.6, E04 1.1, E03 6.7, E07 3.2, E09 4.1, E08 9.4 |
| Determinism re-run, S4-E06 (two seed roots) | 7.7 min | |
| Reference-ledger run, S4-E06 | 5.1 min | 302 s, against 176 s with the persistent ledger (1.7× slower) |
| Historical regression, 36 manifests | 32.5 min | S1.1 3.6, S2 10.0, S2.1 0.8, S3 9.5, S3.1 8.3 |
| Mutation checks (S4, S3 acceptance, S3.1, S3) | 4.4 min | |
| Test suites, fixtures, oracles | 0.5 min | 1,228 tests in about 13 s |
| Follow-up after P14 (S4 mutations and suites) | 2.5 min | |
| Clean-extraction ZIP verification | 8.3 min | E06, E04, E09 and S3.1-E03 re-verified |
| **Total** | **about 121 min** | |

**By purpose:**

| Purpose | Time | Share |
|---|---|---|
| New S4 results (pass 2 and amendment) | 20.9 min | 17% |
| Re-confirming new S4 results (pass 1, verify, determinism, reference ledger, ZIP) | 60.3 min | 50% |
| Historical regression | 32.5 min | 27% |
| Tests, fixtures, oracles, mutations | 7.4 min | 6% |

S4-E06 was executed 7 times in all, and every S4 manifest at least 3 times.

**Unexplained variation:** several `--verify` runs on 2026-11-14 took 1.5–2× their first run (E08 565 s against 359 s; E09 248 s against 125 s). Today's S4-E04 re-check took 72.7 s against 71.1 s originally. The likely cause is other load on the machine at the time. This was not proven.

## 3. CPU and memory (measured 2026-11-15, one sample per second)
| Workload | Wall | Mean CPU (all 16 threads) | Samples below 50% | Peak private memory (whole process, including workers) | Recorded end-of-run RSS |
|---|---|---|---|---|---|
| S4-E04 `--verify` (150 seven-day runs) | 75 s | 98% | 1 of 69 | 4,077 MB | 3,611 MB (2026-11-14) |
| S3.1-E02 `--verify` | 115 s | 97% | 3 of 107 | 4,262 MB | — |
| One 7-day run, in-process | 3.7–4.5 s | 1 thread | — | heap 91–115 MB, RSS about 250 MB | — |

- **The CPU is saturated.** More threads within a manifest would not help.
- **Workers are threads in the same process,** so process memory includes them. The recorded "main RSS" is taken at the end of the run, after the workers have finished. It under-reports the peak by about 0.5 GB.
- **Within budget:** both workloads stayed within the S4-R27 limits (30 min, 8 GB). No workload exceeded a budget, so none was stopped.

## 4. Five largest bottlenecks
| # | Bottleneck | Size | Evidence |
|---|---|---|---|
| 1 | Repeated execution of the new manifests on unchanged code | 60 min of the 121-min cycle | §2. The same-tree `--verify` straight after the run repeats the determinism check; the clean-extraction check is the independent-environment one |
| 2 | Historical regression re-runs every manifest in full | 32.5 min | §2; §5 for which of these were necessary |
| 3 | Rebuilding the policy observation at each decision | about 32% of a simulation's CPU | `samples/profile-one-7day-run.txt`: industry part 9.6%, permanent part with Buy Max previews 6.1%, worker estimates 3.8%, squad stats |
| 4 | Canonical JSON and SHA-256 of every logged event | about 15% | the log digest behind every fingerprint |
| 5 | Character stat recomputation (`characterStats`) | about 10% | called by the observation, squad resolution and encounter start; it is a pure function |

**Smaller costs:**
- the monitors I1–I28 (about 8%; required);
- per-call re-validation of tables (`assertXpTable`, `assertDenseArray`; about 2%);
- the reference ledger (1.7× slower; used only as a check).

**Profile caveat:** the profile comes from one 7-day run (control, POL4-BALANCED). The shares vary by policy and setting.

## 5. Are unchanged historical results recomputed?
**Yes, partly.** `tools/closure_check.py` lists each runner's static import closure and intersects it with the files changed since `s3-checkpoint` (`samples/closure-check-vs-s3-checkpoint.txt`):

| Runner | Files in closure | Changed since the S3 checkpoint | Re-run needed? |
|---|---|---|---|
| S1 / S1.1 (`exp.ts`) | 43 | **0** | **No:** with the same content files and Node version, the 7 S1.1 re-runs (3.6 min) repeat a stored computation |
| S2 / S2.1 (`exp2.ts`) | 62 | 10 (`legion.ts`, `industry.ts`, …) | **Yes:** they are the "S4 off reproduces the past" evidence |
| S3 / S3.1 (`exp3.ts`) | 70 | 13 | **Yes**, for the same reason |

**On the new manifests,** the `--verify` straight after the run and the determinism re-run both repeat the same seeds on the same code.

## 6. Opportunities (none adopted without owner approval)
**Deterministic parallel execution:**
- **Dynamic job queue:** workers would pull jobs instead of taking a fixed round-robin share. Results would be stored by job index, so the output stays identical. The gain is small (the tail idle is under 3% of samples).
- **Mutation checks in a temporary copy of the tree:** they could then overlap other steps instead of forcing strictly sequential gates. The gain is limited to idle gaps, because the CPU is already saturated.

**Caching (exact by construction):**
- **Result cache per registered manifest**, keyed by SHA-256 of:
  - the manifest;
  - every content file read;
  - the runner's import-closure sources;
  - the Node version;
  - the ledger implementation.

  A hit reuses the stored fingerprint in the fast and standard suites, and the cache hits are listed. The full-checkpoint suite always runs uncached.
- **In-run memoisation** of `characterStats`, keyed by level, class, talents and modifiers, and of observation parts unchanged since the last decision. Adopted only if every registered manifest's log digest and fingerprint stay byte-identical.
- **A faster canonical serialiser for flat event records** that emits identical bytes. Accepted only if every stored fingerprint still matches.
- **Compile each content variant once** and share it with the workers. Small: 33 ms per compile, repeated 15 times.

**Estimated effect:**
- in the standard suite, roughly halving the S4-size cycle by skipping provably unchanged recomputation;
- in a single run, 20–30% from memoisation (estimated from the profile shares, not measured).

## 7. Proposed verification suites
| Suite | When | Contents | Time (this machine) |
|---|---|---|---|
| **Fast development** | every change | type check; the 1,228 tests and 9 statistical tests; fixtures and oracles; the mutation set for the files touched; a one-replicate smoke run of each affected cell (never evidence) | about 1–3 min (measured parts: 13 s + 6 s + 5 s) |
| **Standard regression** | before an internal checkpoint | the fast suite; every mutation set (about 4.5 min); a full re-run of every registered manifest whose cache key changed, with hits listed; one determinism re-run of the largest new manifest | about 20–40 min (estimated) |
| **Full checkpoint** | once per review package | every registered manifest from scratch, without cache; determinism and reference-ledger checks; every mutation set; clean-extraction ZIP verification | about 2 h at the S4 size (measured) |

**No suite reduces a registered sample size.** Registered experiments always run in full. The suites differ only in how often unchanged work is repeated.

## 8. Use in L2
The L2 runner applies the lessons here (`manifests/l2/` pre-registration):
- **Registered budgets enforced while running:** a workload that exceeds its time or memory budget is stopped and reported.
- **Separate memory measures:** retained heap, peak heap, process memory (including the worker threads), serialized checkpoint size, replay-tail size and reconstruction latency.
- **Staged workloads** from day scale to month scale.

## 9. Limitations
- Sampling once a second can miss short peaks.
- The Windows CPU counter includes other processes.
- Per-thread heap was not measured separately; process private memory covers every thread.
- The profile is one run of one cell.
- The 2026-11-14 slowdowns are unexplained.
- The time savings in §6 are estimates.
