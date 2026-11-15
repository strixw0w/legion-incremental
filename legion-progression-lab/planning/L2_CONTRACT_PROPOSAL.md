# L2 bounded replay and settlement contract (proposal)

**Version 1.0, 2026-11-14. Status: proposed for separate owner approval. Nothing here is implemented.**

**Source:** the owner's "S3.1 Final Acceptance and S4 Authorisation" §16. It builds on `planning/L2_DESIGN_UPDATE.md` v1.1 (S3.1), the L1 ledger specification, and the S4 entitlement registry.

**Scope.** L2 replaces "keep the full history forever" with checkpoints plus a bounded tail.
- It must be approved before implementation.
- It must be complete before large-scale S5 offline experiments.

## 1. Two contracts, not one
| | Full-history replay (today, L1) | Bounded-history replay (L2) |
|---|---|---|
| What is kept | every committed transaction and credit identity | a validated checkpoint, plus the tail since it, plus per-stream settled ranges |
| A replayed old message | returns its **original receipt** (idempotent, identical) | inside the replay window: the original receipt. **Older than the window: `REPLAY_TOO_OLD`** |
| Equivalence | — | **Not semantically equivalent** to full history for messages older than the window. L2 must never claim otherwise. Equivalence holds only inside the window, and for the balances and state, never for receipts of messages older than the window |

## 2. Identities that must stay exactly-once
Each row is one identity class. **Settled** is how a checkpoint records it; **Replay** is what a duplicate gets.

| Identity | Example | Settled | Replay |
|---|---|---|---|
| Ledger transaction | `kill:enc:9:zone.w1.02#3`, `gather:g:rec:1:57`, `monument:monument.power:4-6` | the transaction ID set inside the window; a per-category range proof below it | the original receipt in the window, else `REPLAY_TOO_OLD` |
| Encounter credit | `enc:<n>` + instance + stream | committed-credit set (non-monotone across streams, so **no single high-water mark**); per stream, a contiguous prefix plus the set above it | `CREDIT_REPLAYED` or `REPLAY_TOO_OLD` |
| Production completion | `unit:job:<j>/u<k>` | per job: completed units and the in-progress unit, with its reserve / release / complete state | `SETTLEMENT_REPLAYED` |
| Craft and enhancement | `craft:<n>` (gap-free), `enhance:item:<i>:<lvl>` (levels only rise) | high-water mark (proved gap-free: they advance only on a committed operation) | refused (already committed) |
| Monument purchase | `monument:<id>:<from>-<to>` | the Monument's level (monotone); a purchase ID is valid only if `from` = the current level + 1 | refused (the level has moved) |
| Bestiary milestone | `bestiary:<enemy>:<rank>` | entitlement registry (stable IDs; S4-R05) | never re-granted |
| Emblem | `emblem:<enemy>` + copy count | first-copy entitlement plus a copy counter. The emblem RNG state is checkpointed with the stream position | never re-granted; a draw happens only on an accepted credit |
| Feat, class record, roster | `feat:<id>:<tier>`, `class:<cls>:<record>`, `roster:<id>:<tier>` | entitlement registry and the lifetime counters and high-water marks (S4-R06) | never re-granted |
| Class and roster entitlements | account records per class; lifetime recruits | monotone values in the checkpoint | — |

## 3. Work that is open at a checkpoint
- **Outstanding reservations.** For every job, the checkpoint stores `reservedUnits` and the identity of the in-progress unit, with its reserve transaction. The reserved bucket must equal the sum held by jobs (monitor I15), so a later release or completion is accepted exactly once.
- **Cancelled and abandoned work:**
  - a cancelled reserve-all job stores its release transaction;
  - an interrupted gathering action stores its consumed sequence number as **settled-without-deposit**, so the number never settles later.
- **Producer sequence gaps.** Each producer stream (a character's gathering sequence, a job's units) stores its contiguous settled prefix plus the explicit set of settled numbers above it, or equivalently its open gaps. **A high-water mark alone is insufficient** wherever gaps can exist (L2 design update §4).
- **Out-of-order settlement.** A completion may arrive after a later one of the same stream, or after a checkpoint that already covers later numbers. It is accepted if its number is in an open gap and refused if it is settled. The checkpoint must keep the gaps until they close or the producer retires.

## 4. Validated reconstruction
- **Building a checkpoint.** It is built from a quiescent moment (no event pending at the same timestamp).
- **Its contents:**
  - balances per resource and bucket;
  - the per-stream settled ranges and gaps;
  - the open-work table (§3);
  - the entitlement registry;
  - lifetime counters, Monument levels and Bestiary records;
  - every RNG stream state (hit, crit, loot, worker loot, emblem);
  - and the event-log digest up to the checkpoint.
- **Validation.** The checkpoint plus the tail must replay to exactly the state of the full history, which is the same check the S3-E01 and S4-E01 property runs perform:
  - every balance;
  - the next transaction outcome;
  - the refusal of every replay inside the window.

  The reference ledger stays the differential control (L1).
- **Reconstruction refuses** a checkpoint whose digest chain, balances or registry do not validate. It never repairs one silently.

## 5. Producer retirement
A producer (a recruit dismissed in a later world, a finished job, a closed offline batch) may be retired only when:
- its stream has no open gap;
- it holds no reservation;
- and no pending completion exists.

Retirement records the final settled prefix. A later message for a retired producer is refused (`PRODUCER_RETIRED`), never re-opened.

## 6. Replay windows and old messages
- **Window size.** The window is a declared number of committed transactions per stream, and a declared age. The candidate is ≥ 7 days of activity, so offline catch-up and reconnects stay inside it.
- **Older messages** get `REPLAY_TOO_OLD`. Clients must treat this as "already applied or expired", **never** as "apply again".
- **Monotone identities** (Monument levels, enhancement levels, entitlements) need no window: their state alone refuses a replay.

## 7. Offline batches (S5)
- **Batch identity.** A batch ID names its exact range per producer, for example `gather-batch:<character>:<fromN>-<toN>`. Ranges never overlap and never leave gaps, and the exact S0.1 remainder carries between batches.
- **Overlap prevention.** A batch whose range intersects a settled range is refused as a whole, and partial overlap is never trimmed silently. Two concurrent settlements of the same interval are serialised by the batch ID.
- **Permanent progression inside a batch.** Counters, Bestiary kills and the emblem draws are credited per included credit, in credit order. Entitlements are evaluated once at the batch end, by the same S4 rule (one pass, ID order), and grant at most once.

## 8. Immutable branching
Branches (forks, hindsight search, what-if previews) share the immutable state and never write to the parent: S4-E01 checks isolation. A checkpoint taken in a branch belongs to that branch. Settling a branch's messages in the parent is forbidden.

## 9. Acceptance budgets (to be confirmed by the owner)
| Measure | Candidate budget |
|---|---|
| Memory per account (checkpoint + tail + ranges) | ≤ 16 MB in the slice, independent of total history length |
| Reconstruction time | ≤ 200 ms per account on the lab machine |
| Checkpoint validation | 100% of the S3-E01 / S4-E01 sequences replay to identical balances and refuse every in-window replay |
| History growth | bounded by the window plus open work; measured against the S3 figure of about 1,000 transactions per gatherer-hour (L2 design update §2) |

## 10. What L2 must not change
- the event ordering contract (D-07);
- the ledger's transaction semantics inside the window;
- the S4 entitlement and counter rules.

**No compaction until this contract is approved. No L2 implementation in S4.**
