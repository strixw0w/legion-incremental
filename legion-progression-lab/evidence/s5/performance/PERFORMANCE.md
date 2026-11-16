# S5 performance and verification-cache report (owner §17)

**Where these numbers come from:** all are lab measurements on the development machine (Ryzen 7800X3D, 16 threads,
Node v24.22.3). They are not Roblox server measurements.

## 1. Settlement profile (registered budgets)

**The workload** is `repro/s5/settlement_perf.ts`, run alone on a single thread:
- an exploratory profile ran before registration and is kept here (`settlement-profile-exploratory.json`);
- the registered run is `settlement-profile.json` (with its `.log`).

**The account:** the representative S5 account (S5 content, POL5-BAL, a three-hour first session; hero plus three
recruits), settled through the settlement service.

| Budget (registered) | Limit | Registered run |
|---|---|---|
| Maximal absence (72 wall h) at 60 % | ≤ 6 s | 2.49 s (28.8 credited h; 8 batches 2.53 s) — **met** |
| Maximal absence at 100 % | ≤ 10 s | 4.20 s (48 credited h) — **met** |
| Throughput, absences ≥ 8 h | ≥ 5 game h per s | lowest 9.90 game h per s (p50 about 11.5) — **met** |
| Account record | ≤ 256 KB | largest 99.5 KB (eight-batch settlements keep eight detailed receipts; one batch about 81 KB) — **met** |
| Validated restore + save | ≤ 100 ms | at most 3 ms (restore 1 ms + save 2 ms) — **met** |
| Peak process memory | ≤ 1 GB | 294 MB — **met** |

**Also measured** in the JSON:
- events processed;
- checkpoint, request-stream and receipt sizes (the replay and identity history);
- eight-batch settlements against one batch;
- roster scaling (0 to 4 diagnostic recruits on the same 24-hour absence);
- the reference stepper against the efficient one.

## 2. What made settlement efficient (exact)

**The starting point.** A profile of a maximal absence on the S5 integration engine ran at 5.4 game h per second. The
time went to:
- the bounded ledger copying its 256-entry window on every transaction (21 %);
- stat-cache key strings (12 %);
- EXP table re-validation (9 %).

**Three exact changes** brought it to about 11 game h per second:
1. **The chunked bounded ledger:** it appends in place, and copies only when an older value is extended.
2. **Character stats** are indexed by input identity.
3. **A compiled EXP table** is frozen and validated once.

**Exactness is checked three ways:**
- **An A/B against a copy of the code without them:** three offline scenarios, up to a 72-hour absence. The state
  fingerprint, log digest and event count are identical (`ab-exactness.txt`).
- **The reference stepper:** it bypasses them, and agrees exactly in all 200 S5-E02 scenarios.
- **A property test:** the chunked ledger against its copy-on-commit reference under random commits, replays,
  conflicts and branches.

**Policy decisions** are not scheduled while away, so a whole class of events disappears offline at no cost to
fidelity: offline play makes no decisions by rule.

## 3. Experiment workloads

**How they ran:** each registered manifest ran on 15 worker threads with enforced wall and memory budgets, one manifest
at a time. Peak process memory covers all threads.

**The figures:** `evidence/s5/experiments/SUMMARY.json` lists:
- each run's wall time and peak memory, against its budget;
- its rows fingerprint and semantic rows fingerprint.

**Determinism:** every task is a pure function of its manifest and index, so the rows do not depend on the number of
workers. The fresh-extraction verification re-runs three manifests with 8 workers and compares the semantic
fingerprints.

## 4. Verification workflow and the exact dependency cache

**The suites** are the accepted L2.1 workflow:
- fast development checks (single test files);
- the standard suite (`npm test`, the statistical suite, fixtures, schemas, the oracles);
- the acceptance gates (`evidence/s5/gates-run.txt`).

**The cache report** (`evidence/s5/historical/history-cache.txt`) is the exact dependency cache of the 45 historical
experiment families (`repro/l2.1/history_cache.py`) against the L2 baseline.
- **Every entry misses.** S5 changed the engine (`src/engine/legion.ts`), the core EXP formula module and the content
  compiler, and every historical runner imports them. The cache therefore refuses to reuse any historical result.

**So S5 re-executes representative controls fresh** (`evidence/s5/historical/historical-controls.txt`), as the owner
asks, instead of all 45 families:
- one or two per increment (S1.1, S2, S2.1, S3, S3.1, S4);
- including the families nearest to S5's changes: production shortages (S3-E03), squad against workers
  (assignments; S2-E05), and S4 elasticity and soft caps (permanent progression).

Each control is checked with `--verify` against its stored baseline fingerprint.

**Cached against fresh:** no historical result is reported as cached in S5. All historical evidence is preserved
unchanged (`evidence/s5/preservation-check.txt`).

**Also fresh:** the identity differential (§2 of the integration report) runs S2, S3 and S4 configurations fresh with
the L1 identity on the final code, and compares them with the bounded identity.
