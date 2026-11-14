# L1 — structurally shared persistent ledger: specification and acceptance plan

**Version 1.0, 2026-11-13.**

**Status:** written, and the budgets declared, **before** any L1 test, differential run or benchmark result was seen.

**Authority:** owner "S1.1 Acceptance and S2 Authorisation" §5 (L1). L2 (bounded history, batched settlement) is **not** part of L1. It needs a separately versioned contract.

## 1. Decision
- **Structure: a persistent AVL tree** with path copying, for both ledger maps (balances and committed transactions). Source: `src/core/ledger/persistentMap.ts`, `persistentLedger.ts`.
- **Why not the benchmark hash trie?**
  - A balanced search tree compares keys exactly, so no hash collision can exist.
  - It iterates in ascending key order, so the canonical serialization falls out of the representation.
  - It is short and textbook: no external code, no licence question (see `PROVENANCE.md`).
  - The S1 benchmark prototype (`src/cli/bench/hamtLedger.ts`) stays benchmark-only and is not used.
- **Cost:** a commit creates O(log n) new nodes (about 20 at a million entries) and shares the rest. The reference copies both maps (O(n)).
- **Interface:** one contract, two implementations (`src/core/ledger/implementations.ts`):
  - **`reference`:** the S0 copy-on-commit ledger. It is unchanged except that `validateTx` is exported for sharing. It stays the **correctness reference and the default**.
  - **`persistent`:** the L1 ledger. Experiments choose it explicitly, through the `Simulation` option `ledger` or the runner flag `--ledger persistent`.
  - **The default is not switched by L1.** S2 experiments may use `persistent` only after the L1 gates in §4 pass and the differential and benchmark report exists.

## 2. Contract preserved (identical observable semantics)
Each item is tested against both implementations:

| # | Property | How it is checked |
|---|---|---|
| C1 | Full transaction history kept; nothing is ever forgotten | committed count and content after every step |
| C2 | Replay with the same txId and payload returns the ORIGINAL receipt with `replayed: true`, and the ledger is unchanged | contract and differential tests |
| C3 | The same txId with a different payload gives `TX_CONFLICT`, ledger unchanged | contract and differential tests |
| C4 | Exact balances: lines aggregated with checked addition; every affected bucket ends in [0, 2^53 − 1]; `NEGATIVE_BALANCE` / `NUMERIC_LIMIT` | contract and differential tests |
| C5 | Conservation: every balance equals the sum of all committed nets | differential runs; reconstruction check |
| C6 | Failed transactions are atomic: the input ledger and every earlier snapshot are unchanged | contract tests |
| C7 | Genuine immutable snapshot identity. Only ledgers made by the implementation's own constructors are accepted (`INVALID_STATE`); frozen copies, assembled objects and the other implementation's ledgers are refused | identity tests |
| C8 | Immutability: every exposed object is frozen; tree nodes are frozen and unreachable (private fields) | mutation-protection tests |
| C9 | Cheap branching: any snapshot can be a branch start. Branches are isolated, and replay and conflict are judged per branch | branch tests and differential branching |
| C10 | Deterministic canonical serialization (`legion.ledger.v1`), independent of insertion history and of the implementation | serialization tests |
| C11 | Validated reconstruction (`reconstructPersistentLedger`). Nothing is trusted: schema, order, IDs, numbers, hashes and conservation are all checked; a failure is `INVALID_STATE` | reconstruction tests and corruption cases |
| C12 | Existing error semantics: same codes and validation (`INVALID_TX`, `INVALID_NUMBER`, …) | the differential compares error codes |

**Semantic versus representation equality:**
- **Two ledgers are semantically equal** when their canonical serializations are equal: same balances and same committed records.
- **Internal representation is NOT compared:** tree shape, node sharing, and insertion versus sorted iteration order.
- **Reports** state "semantically equivalent" only.

## 3. Verification plan
1. **Existing fixtures and tests:**
   - `spec/fixtures/ledger.v1.json` (15 cases) is unchanged, and is run against both implementations;
   - `test/ledger.test.ts` is unchanged and still runs against the reference.
2. **Contract tests:** `test/ledger.contract.test.ts`. The same battery runs against both implementations: C1–C9 and C12, identity, freezing, branching and atomicity.
3. **Persistent-specific tests** (`test/ledger.persistent.test.ts`):
   - tree invariants after random operations;
   - key replacement, with old snapshots keeping old values;
   - adversarial keys: FNV-1a 32-bit collisions found by brute force, shared long prefixes, Unicode and NUL characters;
   - serialization independent of insertion order;
   - the reconstruction round trip and corrupted inputs.
4. **Randomised differential testing:**
   - **Property test (fast-check):** random sequences of credits, debits, overdrafts, overflows, invalid lines, replays, conflicts and branch switches, applied to both implementations. Every step compares the result or error code and the canonical serialization.
   - **Large run** (`src/cli/ledger-differential.ts`): at least 50 seeds × 20,000 operations with branching, reported in `evidence/l1/`.
5. **Mutation protection:** planted bugs in the persistent ledger and tree must be detected by the tests above, and every file restored.
6. **Gameplay regression:** every S1.1 experiment is re-run with `--ledger persistent` and must MATCH its recorded semantic fingerprint (same seeds). This shows S1.1 gameplay results do not depend on the implementation.
7. **Performance:** the staged benchmark (`npm run bench:ledger`) under the budgets in §5. It measures throughput, median and p99 latency and their growth, heap, canonical state size, replay cost, branching cost and serialization/reconstruction time, for both implementations.

## 4. Acceptance gates (L1)
L1 is accepted for use in S2 experiments only if:
- **G1:** items 1–3 and 5 pass;
- **G2:** the differential reports 0 mismatches;
- **G3:** the gameplay regression is 7 of 7 MATCH;
- **G4:** within the budgets in §5, the persistent ledger completes W-small, W-day, W-week and W-legion; its per-transaction latency does not grow linearly with history (p50 at 100% of a workload ≤ 3 × p50 at 10%); and W-day runs at least 10 × faster than the reference.

Results are reported as measured. A workload that exceeds its budget is reported as **timed out or unsuitable**, never projected. Failing G4 is reported, and the default stays the reference.

## 5. Benchmark budgets (declared before running)
- **Same staged design and limits as the S1 benchmark:**
  - 120 s wall-clock and 2 GiB heap per run;
  - up to 5 runs or 600 s per workload stage;
  - larger workloads are skipped once a smaller one exceeds the budget.
- **Workloads:** W-small, W-day, W-week, W-legion and W-month, unchanged from `S1_LEDGER_BENCHMARK_PROPOSAL.md`.
- **The reference is run again** under the same budgets as the control.
- **Expectation, not a gate:** W-month is expected to exceed the 2 GiB heap budget for the persistent ledger too, because L1 keeps full history by design. Bounding that history is L2's job. Exceeding it is reported, not hidden.
