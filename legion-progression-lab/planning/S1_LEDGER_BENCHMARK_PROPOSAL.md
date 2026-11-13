# S1 ledger benchmark — proposal

**Status:** proposal (S0.1, 2026-11-13). Nothing here is implemented or optimised in S0.1. S1 runs the benchmark and reports the result; the owner decides any redesign.
**Source of the requirement:** S0 independent review, item 7. The ledger copies its committed-transaction map (and its balance map) on every successful transaction.

## 1. Question S1 must answer
Is the S0/S0.1 copy-on-commit ledger suitable for:
- **longer simulations:** days to weeks of simulated time;
- **realistic future legion sizes:** the hero plus recruits, each producing transactions.

S1 must answer with measurements, not estimates. If the answer is no, S1 names the replacement it recommends and shows that the replacement keeps the four properties in section 5.

## 2. Why it is a real question (indicative only)
A one-off timing on the development machine shows the expected linear growth. Conditions:
- Node 24.22.3, Windows x64, one run;
- 1,000 single-line transactions measured at each history size;
- script `evidence/s0.1/ledger-indicative.txt`.

| committed transactions already in the ledger | time for the next 1,000 | per transaction |
|---|---|---|
| 0 | 26 ms | 26 µs |
| 4,000 | 249 ms | 249 µs |
| 9,000 | 568 ms | 568 µs |
| 19,000 | 1,287 ms | 1.3 ms |
| 39,000 | 2,834 ms | 2.8 ms |

Each transaction costs about 70 µs per 1,000 already committed, so a run of N transactions costs roughly N²/2 copies.

**Projection (not a measurement):** a run of 1 million transactions would spend about 70 ms on the last transaction and many hours in total. These figures are indicative, not acceptance evidence.

## 3. Workloads
All workloads use a seeded, deterministic transaction generator, so every run is reproducible. Transactions mirror the S1 engine:
- one kill reward with 1–3 lines;
- occasional multi-line crafts;
- a deliberate 1% of replays (same txId and payload);
- 0.1% of conflicts (same txId, different payload).

| Workload | Legion size (workers) | Transactions per worker per simulated hour (candidate) | Simulated span | Approximate transactions |
|---|---|---|---|---|
| W-small | 1 (hero only) | 120 | 24 h | 2,880 |
| W-day | 10 | 120 | 24 h | 28,800 |
| W-week | 10 | 120 | 7 days | 201,600 |
| W-legion | 50 | 120 | 7 days | 1,008,000 |
| W-month | 50 | 120 | 30 days | 4,320,000 |

- **Candidate inputs:** legion sizes and rates are candidates, taken from M0 planning ranges. S1 replaces them with the S1 engine's actual transaction rate per worker and records the change.
- **Settlement:** if S1 settles offline time in batches (one transaction per settlement window instead of one per kill), it runs the batched form as well and reports both.

## 4. Measurements and report
Each workload is run 5 times. Report the median and the min–max spread. Required figures:
- **Throughput:** transactions per second over the whole run, and per 10% slice of the run, which shows growth.
- **Latency:** median and 99th-percentile time of `applyTx` at 10%, 50% and 100% of the run.
- **Memory growth:** heap used after a forced garbage collection (`node --expose-gc`) at the same points, plus bytes per committed transaction.
- **Long-run state size:** canonical-JSON byte length and SHA-256 of `{ balances, committed index }` at the end of the run. This approximates what a save would hold.
- **Replay cost:** the time for one replay lookup at the end of the run.
- **Environment record:** in the existing environment-fingerprint format.

Placement:
- **Code:** the benchmark is a CLI tool (`src/cli/bench-ledger.ts`), because timers and memory figures are not allowed in the pure core.
- **Results:** they go to `results/s1/` as environment-only output. They are never part of a semantic fingerprint.

## 5. Properties any alternative must keep
Any replacement must keep all four properties:
1. **Replay protection.** A committed txId with the same payload replays without effect; with a different payload, `TX_CONFLICT`. Failed transactions are not recorded.
2. **Conservation.** For every bucket, final − initial = Σ nets of committed transactions. Balances are never negative or unsafe.
3. **Determinism.** The same inputs give byte-identical results, receipts and state fingerprints.
4. **Oracle branching.** Any earlier ledger state can be kept and reused as the start of a second run (for oracle comparisons and what-if branches) without copying the whole history first. Today this is free, because states are immutable values.

In addition:
- the immutability boundary of `ledger.md` (S0.1) must hold;
- every existing ledger fixture and property test must pass unchanged.

## 6. Candidate alternatives (for S1 to evaluate, not to adopt without approval)
| Option | Effect on cost | Risk to the four properties |
|---|---|---|
| Persistent (structurally shared) map, e.g. a hash array mapped trie | O(log n) per transaction, snapshots stay cheap | None if implemented correctly. Needs its own tests, and its iteration order must be made deterministic. |
| Batched settlement (one transaction per settlement window) | Divides the transaction count by the batch size | Changes receipt granularity. Replay keys must be defined per window. |
| Committed-ID retention window (already planned for M6) | Bounds the committed index | Replays older than the window need an explicit, distinct outcome. Needs an owner decision on the window. |
| Mutable internal map with explicit `fork()` snapshots | O(1) per transaction | Branching becomes an explicit copy. The immutability boundary must be re-established at every public return. |

## 7. Decision rule (candidate, for owner approval in S1)
**Candidate threshold:** the copy-on-commit ledger is "suitable" for a workload if:
- the full run completes in under 60 seconds;
- the 99th-percentile `applyTx` latency at the end of the run stays under 1 ms;
- heap use stays under 1 GB.

**Outcomes:**
- Suitable: keep the current design for that workload class.
- Not suitable: S1 proposes one option from section 6, with the measurements above for both designs.

The thresholds are candidates, not approved values.
