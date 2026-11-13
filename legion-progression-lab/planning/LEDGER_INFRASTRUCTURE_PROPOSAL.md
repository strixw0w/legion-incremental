# Ledger infrastructure — proposal

**Version 0.1, 2026-11-13.**

**Status:** proposal only; nothing in it is implemented. It is required before large-scale multi-character experiments, and may be scheduled early in S2 if needed.

**Inputs:**
- the S1 ledger benchmark (`evidence/s1/experiments/ledger-benchmark/benchmark.json`, `S1_EVIDENCE.md` §9);
- the owner's decision (`S1_OWNER_RESOLUTIONS.md` §4, owner review §9).

## 1. Decision recorded
- **Approved direction:** a structurally shared ledger.
- **Not approved as a production replacement:** the benchmark-only hash-trie prototype (`src/cli/bench/hamtLedger.ts`).
- **Correctness reference:** the current copy-on-commit ledger (`src/core/ledger/ledger.ts`) stays. Any replacement is tested against it.
- **No replacement is implemented in S1.1.**

## 2. What the S1 measurements showed (measured, single machine)
- **Production ledger** (copy-on-commit):
  - per-transaction latency grows linearly with history;
  - W-day (28,800 transactions) took about 36 s per run;
  - W-week went over the 120 s budget at 50,000 transactions;
  - in a 600-minute S1 run, the ledger was 93% of runtime.
- **Prototype** (structurally shared): near-flat latency up to W-legion (1,008,000 transactions in about 9 s). It went over the **2 GiB heap budget** on W-month at 2,915,500 transactions, because every committed transaction's identity and result is kept forever.
- **Conclusion:** month-scale, multi-character runs need two things:
  - **structural sharing**, for time;
  - **bounded memory for committed history**, which must never let an old transaction be credited again.

## 3. Requirements for any replacement (owner review §9)
1. **All existing ledger fixtures pass unchanged** (`spec/fixtures/ledger.v1.json`, 15 cases), and so do all ledger unit and property tests.
2. **Exact conservation:**
   - integer balances with checked addition;
   - no negative balances;
   - `NUMERIC_LIMIT` behaviour identical.
3. **Immutable genuine snapshots:**
   - only ledgers produced by the authorised constructors are accepted (the S0 identity rule);
   - snapshots are deep-frozen or otherwise unchangeable.
4. **Cheap branching:** applying a transaction never copies the whole state; old snapshots stay valid and usable as branch starting points.
5. **Replay and conflict handling identical to the reference:**
   - same txId and payload → stored result, `replayed = true`;
   - same txId, different payload → `TX_CONFLICT`.
6. **Deterministic canonical serialization:**
   - the same logical ledger always serialises to the same canonical JSON;
   - independent of insertion order or internal tree shape.
7. **Validated reconstruction:**
   - deserialization goes through a separate, validated reconstruction boundary that re-checks every invariant;
   - an externally assembled object is never accepted directly (S0 identity rule).
8. **Randomised differential testing** against the reference ledger:
   - long seeded transaction streams with replays, conflicts and failures;
   - branch points;
   - every result, balance and committed set compared.
9. **Hash-trie specific tests** (if a hash trie is used):
   - hash collisions, forced with an injectable hash;
   - key replacement;
   - deletion and re-insertion;
   - deep branching.
10. **Measured, not projected:**
    - throughput, median and p99 latency, and latency growth;
    - heap growth and state size;
    - all with predeclared budgets, as in the S1 benchmark.

## 4. Committed-history growth (needed for long runs)
"Never forget committed transaction IDs in a way that makes old transactions valid for credit again" (owner review §9). Candidate approaches, to be compared in the proposal's implementation step:

- **Batched settlement.** A whole stretch of simulated time is settled as one transaction, with a deterministic ID derived from the batch's inputs (for example offline settlement in S5). History grows per batch, not per kill.
- **Sequence-based replay protection.** Each producer (hero, recruit, settlement process) has a monotone sequence number:
  - a transaction is valid only if its sequence number is the next expected one;
  - anything at or below the producer's high-water mark is a replay, unless it is still inside a small retained window that stores full payload hashes for conflict detection;
  - IDs older than the window are rejected as `REPLAY_TOO_OLD`, never re-credited.
- **Compaction with a watermark.** Committed entries below a watermark are summarised (count and running hash) and their individual entries dropped. A replay below the watermark is rejected outright.

Every approach must keep the S1.1 kill-credit identity rule: credit identity is checked by the engine's credit registry **independently** of ledger transactions (`s1-combat-loop.md` v1.1 §10). The registry has the same growth question. In S1 it is a shared persistent list, normally O(1) per credit.

## 5. Proposed steps (each needs owner approval)
1. **Infrastructure proposal v1.0:**
   - choose a structure (persistent hash trie or a persistent sorted map with structural sharing);
   - choose a history strategy from §4;
   - define the budgets and the differential test plan.
2. **Implementation behind the same interface** (`emptyLedger`, `applyTx`, `balance`); the reference ledger is kept.
3. **Acceptance run:**
   - the §3 tests;
   - the S1 benchmark workloads re-run against the new budgets;
   - a full S1.1 experiment re-run (fingerprints must be identical, because semantics are unchanged).
4. **Only after acceptance:** switch the default; the reference stays for differential tests.
