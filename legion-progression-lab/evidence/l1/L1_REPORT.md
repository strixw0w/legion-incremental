# L1 — structurally shared persistent ledger: specification check, differential and benchmark report

**Date:** 2026-11-13. **Specification:** `planning/L1_LEDGER_SPECIFICATION.md` v1.0, written with its budgets before any L1 test, differential run or benchmark result was seen. **Owner instruction:** "S1.1 Acceptance and S2 Authorisation" §5.

**Labels:** benchmark numbers are environment measurements on one machine (AMD Ryzen 7 7800X3D, 16 logical CPUs, Windows 11, Node 24.22.3 with `--expose-gc`), not semantic results. Verification is the lab's own; no independent review has happened yet.

## 1. What L1 is
- **`src/core/ledger/persistentMap.ts`:** a persistent AVL tree with path copying. A commit creates O(log n) new nodes and shares every untouched subtree; old roots stay valid forever. Nodes are frozen. There is no hashing, so hash collisions cannot occur; keys are compared exactly.
- **`src/core/ledger/persistentLedger.ts`:** the ledger contract on two trees (balances, committed transactions):
  - same validation (shared `validateTx`), payload hash, original-receipt replay, `TX_CONFLICT`, checked aggregation, bucket limits and all-or-nothing commit as the reference;
  - only ledgers issued by the module are accepted (module-private registry); the trees are unreachable from outside;
  - canonical serialization `legion.ledger.v1` for BOTH implementations, independent of insertion history;
  - validated reconstruction from serialized data (schema, order, uniqueness, numeric ranges, hashes, conservation, tree invariants).
- **`src/core/ledger/implementations.ts`:** `reference` (unchanged copy-on-commit ledger, still the default and the correctness reference) and `persistent`.
- **The HAMT benchmark prototype from S1** (`src/cli/bench/hamtLedger.ts`) was not adopted.
- **No history compaction** (that is L2). Nothing is ever forgotten.

## 2. Semantic versus representation equality
Two ledgers are **semantically equal** when their canonical serializations are equal: the same balances and the same committed records with the same payload hashes and receipts. Tree shape, node sharing and iteration order are internal representation and are never compared. The reference iterates in insertion order and the persistent ledger in key order: they are semantically equivalent, not representationally equal. Every comparison below is semantic.

## 3. Verification (specification §3)
| Item | Result |
|---|---|
| 1. Existing fixtures and tests unchanged | `spec/fixtures/ledger.v1.json` (15 cases) and `test/ledger.test.ts` are unchanged since the S1 checkpoint (`git diff s1-checkpoint` empty for both). The only change to `ledger.ts` is exporting `validateTx`. The 15 fixtures pass against both implementations. |
| 2. Contract tests | `test/ledger.contract.test.ts`: the same battery against both implementations (C1–C9, C12, identity, freezing, branching, atomicity), 24 tests, pass. |
| 3. Persistent-specific tests | `test/ledger.persistent.test.ts`: tree invariants under random operations, key replacement with old snapshots kept, brute-forced FNV-1a 32-bit collisions, shared prefixes, Unicode and NUL keys, insertion-order independence, reconstruction round trip, 15 corrupted inputs refused (now also checking the refusal reason for out-of-order keys), mutation protection. Pass. |
| 4. Randomised differential | Property test (fast-check, 300 runs) and the large run below. 0 mismatches. |
| 5. Mutation protection | 12 planted bugs in the tree and the ledger. Run 1: 11 detected; P12 (out-of-order keys accepted on input) was not, because the later tree-invariant check still refused the input and the test only checked the error code. The test now also checks the reason; run 2: **12 of 12 detected**, every file restored (`mutation-check-run1.txt`, `mutation-check.txt`). |
| 6. Gameplay regression | All 7 S1.1 experiments re-run with `--ledger persistent`: **7 of 7 MATCH** their recorded semantic fingerprints (`gameplay-regression-persistent.txt`). |
| 7. Performance | Staged benchmark under the declared budgets (§5 below). |

## 4. Large differential run (`src/cli/ledger-differential.ts`; `results/l1/differential.json`)
- 50 seeds × 20,000 operations = **1,000,000 operations**, applied to both implementations in lockstep with branch switches; the canonical serialization was compared every 500 steps (**2,000 content comparisons**) and every result or error code at every step.
- Operation mix: credit 359,164; debit 150,280; multi-line 99,938; replay 100,038; conflict 80,338; reserve 80,231; branch switch 60,033; invalid 39,883; overflow 30,095.
- Outcomes: ok 789,168; replayed 10,741; `NUMERIC_LIMIT` 58,677; `INVALID_TX` 45,072; `NEGATIVE_BALANCE` 26,330; `TX_CONFLICT` 9,979.
- **Mismatches: 0.**

## 5. Benchmark (`src/cli/bench-ledger-l1.ts`; `results/l1/benchmark.json`)
Budgets (declared before running): 120 s wall clock and 2 GiB heap per run; up to 5 runs or 600 s per workload stage; larger workloads skipped once a smaller one exceeds the budget. Workloads unchanged from the S1 benchmark proposal.

| Workload | Transactions | Reference | Persistent | Persistent median latency (10% → 100% of the run) | Persistent heap at end |
|---|---|---|---|---|---|
| W-small | 2,880 | 193 ms (median of 5) | 29 ms | 6.3 → 4.4 µs | 12 MB |
| W-day | 28,800 | 25,950 ms | 222 ms | 6.1 → 5.0 µs | 23 MB |
| W-week | 201,600 | **timed out** (58,500 tx in 120 s) | 1,419 ms | 5.1 → 4.5 µs | 91 MB |
| W-legion | 1,008,000 | not run (W-week exceeded the budget) | 7,612 ms | 4.9 → 4.7 µs | 412 MB |
| W-month | 4,320,000 | not run | first run completed in 36.4 s (1.75 GB heap); the second stopped at 4,079,500 tx on the 2 GiB heap budget: **reported as exceeding the budget** | 5.3 → 5.7 µs | 1,752 MB |

Other measurements (persistent; first run of each workload):
- **Replay** of an existing transaction: median 3.4–6.5 µs. **Branching** from an earlier snapshot: median 4.8–11.8 µs (reference: 123 µs at W-small, 1,875 µs at W-day, because it copies both maps).
- **Canonical serialization:** 4.4 ms (W-small, 423 KB), 46 ms (W-day, 4.3 MB), 319 ms (W-week, 30 MB). **Reconstruction** with full validation: 7 ms, 58 ms, 447 ms; the reconstructed ledger was semantically equal every time. Above W-week a single serialized string exceeds the V8 string limit, so serialization was not measured there (reported, not projected).
- **S1 runtime impact:** the same S1 run gives identical event-log digests on both ledgers. 60-minute session: 47.9 ms (reference) vs 41.2 ms (persistent); 600-minute session: 2,202 ms vs 330 ms.

## 6. Gates (specification §4)
| Gate | Requirement | Result |
|---|---|---|
| G1 | Items 1–3 and 5 pass | **Pass** (item 5 after the test strengthening described above; run 1 is kept) |
| G2 | Differential: 0 mismatches | **Pass** (0 in 1,000,000 operations and 300 property runs) |
| G3 | Gameplay regression 7 of 7 MATCH | **Pass** |
| G4 | Persistent completes W-small, W-day, W-week, W-legion within budget; p50 at 100% ≤ 3 × p50 at 10%; W-day ≥ 10 × faster than the reference | **Pass**: all four complete; latency ratios 0.70, 0.82, 0.88, 0.96; W-day 116.6 × faster |

## 7. Decision and limits
- **L1 is accepted for S2 experiments by its own gates**, as the S2 specification pre-registered ("S2 experiments use the L1 persistent ledger once the L1 gates pass"). The S2 runner uses it by default and the reference-ledger cross-check re-runs S2 cells on the reference.
- **The lab default is NOT switched.** `DEFAULT_LEDGER` stays `reference`: the owner said not to switch merely because the benchmark is faster, and the reference remains the correctness reference for fixtures and the S1/S1.1 runners.
- **Limits:** L1 keeps full history by design, so very long histories (W-month) exceed the 2 GiB heap budget. Bounded history and batched settlement are L2 (design before S5; not implemented). No transaction or encounter identity is ever forgotten in L1.
- **Not independently verified yet:** these results are the lab's own; an independent review is still required.

## 8. Provenance
The AVL tree (Adelson-Velsky and Landis, 1962) and path copying for persistence (Driscoll, Sarnak, Sleator and Tarjan, 1989) are textbook algorithms, written from their definitions. No code was copied from any project. See `PROVENANCE.md`.
