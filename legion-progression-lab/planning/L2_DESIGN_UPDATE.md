# L2 design update — what S3 adds to the ledger history

**Version 1.1, 2026-11-14 (v1.0 with S3; section 4 corrected after the S3 review). Status: design only.** Owner S3 authorisation §11: use the persistent ledger, keep the reference ledger for differential checks and controls, prepare an L2 design update, and do **not** implement compaction. Nothing in this document is implemented; L2 compaction is not authorised.

## 1. What S3 writes
Every S3 ledger change is one transaction with a unique, categorised ID (the prefix is the category; `txPurpose` in src/experiments/industryMetrics.ts maps it), and one `LedgerTx` event-log entry with its nets.

| Category (purpose) | Transaction ID | Lines | Identity it protects |
|---|---|---|---|
| `gather.deposit` | `gather:g:<character>:<n>` | +available of the node's resource | one deposit per gathering action (`n` = the character's work sequence) |
| `production.reserve` | `reserve:job:<j>/u<k>` | available -> reserved (inputs of one unit; reserve-all: of all remaining units) | one reservation per unit start |
| `production.release` | `release:job:<j>/u<k>` or `release:job:<j>:cancel` | reserved -> available | one release per interrupted unit, one per cancelled reserve-all job |
| `production.complete` | `unit:job:<j>/u<k>` | -reserved inputs, +available outputs | one settlement per completed unit |
| `craft` | `craft:<n>` | -available inputs | one craft per account craft counter |
| `enhance` | `enhance:item:<i>:<level>` | -available gold and tier material | one payment per item level (levels only rise) |
| `salvage` | `salvage:item:<i>` | +available returns (omitted when nothing returns) | one salvage per item |

Items (`item:<n>`), jobs (`job:<n>`), units (`job:<n>/u<k>`), crafts (`craft:<n>`) and gathering actions (`g:<character>:<n>`) are numbered by monotone counters that never reuse a value. The pending-settlement registry (`IndustryState.pending`) holds completed work between its completion and its credit at the same moment; a duplicated settlement finds no entry and is rejected (counted with the duplicate credits).

## 2. History growth (measured)
From the S3 runs (persistent ledger; numbers are model-outputs):
- A gatherer writes one transaction per action (3.0–3.5 s): about 1,000–1,200 deposits per gatherer-hour. A smith writes two per unit (reserve and complete), plus one release when a unit is interrupted.
- Over a 90-minute PR-OPT campaign (3 seeds per strategy; evidence/s3/l2-measurements.txt): 3,369 transactions without industry (POL3-CONQ, all kill rewards) and 3,512–4,577 with it (2,246–3,051 per hour). Gathering deposits are the largest S3 category (1,579–3,063 per campaign); crafting, enhancement and production add fewer than 100. With three gatherers the history would roughly double again.
- The persistent ledger gave identical balances to the reference ledger in every measured campaign, in about half the wall time (230–375 ms against 586–733 ms per 90-minute campaign). Heap growth per campaign was 9–75 MB for either ledger, dominated by the kept state rather than the ledger.
- Each experiment's environment.json records its duration and the main process's memory (1.2–3.6 GB resident for the runner holding all results).

## 3. Reservations under compaction
The reserved bucket is not a free balance: it must always equal the inputs held by jobs (monitor I15). A compaction checkpoint must therefore store, with the balances, every job's `reservedUnits` and the identity of its in-progress unit, so that a later release or completion of that unit is accepted exactly once and nothing is released twice.

## 4. Batched settlement versus replay protection (offline, S5)
- **Per-action transactions** (S3 now) make replay protection trivial (each ID is committed once) but grow the history by about a thousand entries per gatherer-hour.
- **Batched settlement** would credit many actions in one transaction. Its ID must name the exact range it covers, e.g. `gather-batch:<character>:<fromN>-<toN>`, and ranges must never overlap or leave gaps; the remainder carried between batches must be the exact S0.1 remainder (no rounding per batch).
- **Replay protection after compaction (corrected in v1.1 after the S3 review, owner S3.1 §13).** Monotone *producer* IDs are not the same as *settled contiguous ranges*, so a single high-water mark per stream is **not** sufficient in general:
  - an interrupted gathering action (`g:<character>:<n>`) consumes a number that never settles; a released unit (`job:<j>/u<k>`) has a reserve and a release but no completion; a reserve-all job holds one reservation for several units;
  - reserve, release and complete transactions of different units interleave in time, and a future networked or offline settlement can deliver completions out of order;
  - so the settled numbers of a stream can have gaps, and one work identity can own several transactions (reserve, then release or complete).
  A checkpoint must therefore keep, per stream, the **contiguous settled prefix plus the explicit set of settled numbers above it (or the open gaps)**, and, per work identity, which of its operations (reserve, release, complete, deposit) have committed. The high-water mark alone is safe only for streams proved gap-free (the account craft and item counters, which advance only on a committed craft).
- **Replay contract (to be prepared before any L2 implementation; not written in S3.1):** per-operation identity (not only per work item); cancelled and abandoned work; out-of-order settlement; contiguous acknowledged ranges and gaps; outstanding reservations; encounter-credit history (non-monotone identities: a committed-ID set or an equivalent proof); save/load reconstruction; batches and the refusal of overlapping ranges.

## 5. Recommendations for L2 (not implemented)
1. Keep the reference ledger as the differential control for every L2 change (as in L1).
2. Introduce checkpoints only together with the per-stream settled ranges and gaps, the per-work operation record and the reservation table above (section 4); prove with the S3 property run (S3-E01) that a checkpoint plus the tail replays to the same balances and refuses every replay.
3. Decide batched settlement together with S5 offline settlement, not before.
4. Keep the event-log `LedgerTx` entries (or an equivalent digest) so that reviewers can audit every material change.
