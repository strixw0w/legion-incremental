# L2 bounded replay and settlement contract

**Version 2.0, 2026-11-15.**
- **Revises** `planning/L2_CONTRACT_PROPOSAL.md` v1.0 (2026-11-14). v1.0 is kept unchanged as the historical proposal.
- **Status:** authorised for implementation by the owner's "Independent S4 Review and L2 Authorisation" §8–§12. It awaits independent review.
- **Formulas and identities:** `spec/formulas/l2-replay.md` v1.
- **Code:** `src/l2/`.

**The contract change, stated once.**
- **L1 stays the full-history correctness reference.** Within the common contract, L2 must agree with L1 exactly: balances, accepted and refused operations, and in-window replays.
- **L2 deliberately changes old-replay semantics.**
  - A settled request older than the receipt window returns `REPLAY_TOO_OLD`. L1 would return its original receipt, or `CONFLICTING_PAYLOAD` when the retry's payload differs: without the receipt, L2 can no longer compare payloads.
  - An unseen request older than the stream's closed horizon returns `REQUEST_EXPIRED`. L1 would execute it late.
- **No universal semantic equivalence between L1 and L2 is claimed.** Every difference is one of these three observable cases, and the differential tooling counts each separately.

## 1. Three kinds of boundary (owner §9A)
| Boundary | What it is | Rule |
|---|---|---|
| **Gameplay simulation boundary** | an event of the simulation (an action start or end, a kill, a completion) | ordered by the D-07 event key |
| **Economic rate-change boundary** | a moment at which a rate or eligibility changes: a combat or profession level-up, a class-record milestone, a Bestiary bonus or emblem, a Feat, an equipment or assignment change, a queue completion or input becoming available, a reservation change, an offline-efficiency window edge | **takes effect at its chronological point**, under the approved work-start capture rule: an action captures its rate when it starts, so a change applies from the next action start at or after it |
| **Persistent storage batch** | where a settlement is cut and saved | **never changes an outcome**: identical productive intervals give identical results whatever their partition into batches (partition invariance) |

**Entitlements inside a batch:** permanent entitlements are evaluated at their chronological point inside a batch, never only at its end. v1.0 §7 (evaluate at batch end) is withdrawn.

**The owner's example:** 100 ore per hour, and a Feat granting +50% production after 100 ore.
- One 2-hour batch and two 1-hour batches must both give 250, never 200.
- The settlement primitive integrates exactly between consecutive rate-change boundaries.

L2 provides this as infrastructure, with synthetic conformance tests (`src/l2/settlement.ts`). **The offline gameplay engine is S5 and is not built.**

## 2. Identity classes (owner §9B)
| Class | Identity | Purpose | A duplicate gets |
|---|---|---|---|
| **Request** | `(requestStream, requestSeq)`, chosen by the sender | one deliberate client action. A retry keeps the identity; a new action takes a new one | the original receipt (in window), `CONFLICTING_PAYLOAD` (same identity, other payload), `REPLAY_TOO_OLD`, or `REQUEST_EXPIRED` (§3) |
| **Transaction** | the ledger `txId`, derived from the request or work operation that commits it | one atomic ledger change | the original ledger receipt; never applied twice |
| **Encounter credit** | `(creditStream, encounterNumber)` | one kill credit | `CREDIT_REPLAYED`, with exact membership kept compactly (§4) |
| **Work operation** | `(producerKind, producerNumber, unitSeq, op)`, with op ∈ {reserve, release, complete, abandon} | one transition of one production unit | `WORK_REPLAYED` for the same op; an invalid transition is refused (§5) |

**A retry never becomes a new action because state has advanced.**
- The request identity, not the current state, decides whether an action is new.
- Retrying an already completed one-level Monument purchase returns its original receipt. It never buys the following level.

**Request kinds and their payloads:**

| Request kind | Payload |
|---|---|
| Monument purchase | `{ monumentId, levels }` |
| Recruitment | `{}` |
| Crafting | `{ recipeId, crafterId }` |
| Enhancement | `{ itemId, level }` |
| Queue creation | `{ recipeId, quantity, mode }` |
| Cancellation | `{ jobNumber }` |
| Settlement | `{ producer, fromUnit, toUnit, digest }` |

**Same identity, different payload:** `CONFLICTING_PAYLOAD`, refused, with no state change.

**Command generation and request delivery are separate.**
- Simulator policies generate commands.
- The delivery layer (`src/l2/requests.ts`) wraps them in request identities and may duplicate, delay or reorder them.
- The engine's own policy commands are not yet routed through it. That is S5 and Roblox work, recorded as a limitation.

## 3. Bounded receipts (owner §9C)
Exactly-once protection and receipt retention are separate:
- **Exactly-once protection is permanent and compact.** Per request stream, the settled sequence numbers are kept as a range set (§4). This never forgets.
- **Receipts are bounded:**
  - at most `maxRecent` receipts per stream, and none older than `maxAgeMs`;
  - **either limit evicts, whichever is reached first**, oldest sequence first;
  - candidate values: `maxRecent` 256, `maxAgeMs` 24 h;
  - eviction raises the stream's **closed horizon** `closedBelow` to the highest evicted sequence number.

**Classification of a delivered request `(stream, seq, payloadHash)`:**

| Condition | Response |
|---|---|
| `seq` settled and its receipt retained, same payload | **original receipt** (no execution) |
| `seq` settled and its receipt retained, other payload | `CONFLICTING_PAYLOAD` |
| `seq` settled, receipt evicted | `REPLAY_TOO_OLD`: "already applied". Never re-applied. The payload is no longer comparable, so a conflicting retry also gets `REPLAY_TOO_OLD` |
| `seq` not settled and `seq ≤ closedBelow` | `REQUEST_EXPIRED`: a stale, never-seen request. Not executed late |
| `seq` not settled and `seq > closedBelow` | **new**: executed (out-of-order arrival inside the window is valid) |
| `seq` not a positive safe integer | `INVALID_REQUEST` |

**A valid new request is never confused with an old expired one,** because the horizon only rises when a receipt is evicted.

**Unsettled work and reservations are never evicted.** They live in the producer table (§5), not in the receipt store.

## 4. Compact sequence ranges (owner §9D)
**A range set** is a contiguous settled prefix `1..p` plus sorted, disjoint, non-adjacent runs above `p + 1`.
- Membership is exact.
- The size is the number of open gaps, not the history length.
- Adding a member that is already present is a replay.
- Adding a run that intersects the set is refused as a whole: **an overlap is never trimmed**.

**Used for:** request streams, encounter-credit streams, production units per producer, and retired producer numbers.

## 5. Producers, work operations and retirement (owner §9D)
**Producers** have a kind (`job`, `gather:<character>`, `batch`) and a number. Numbers are allocated monotonically per kind and **never reused**.

**Unit states:** `none → reserved → completed | released`, and `none → abandoned`.
- **Reserve:** places the unit's ledger reservation.
- **Release:** a cancellation; it returns the reservation.
- **Complete:** consumes the reservation and deposits the output.
- **Abandon:** an interrupted gathering action. It settles the unit without a deposit.

**Released and abandoned units are permanently ineligible for credit.** A complete after a release is `WORK_INELIGIBLE`; a complete without a reserve is `WORK_NOT_RESERVED`; a repeated op is `WORK_REPLAYED`.

**Retirement:**
- **Allowed only when** no unit is reserved and the producer's unit range has no open gap below its allocated maximum.
- **What remains:** the producer's number joins the kind's retired range set, and its unit table is deleted. Retired history therefore stays bounded: contiguous retirements collapse into the prefix.
- **After retirement:** a message for a retired producer is `PRODUCER_RETIRED`, and one for an unallocated number is `PRODUCER_UNKNOWN`.

## 6. Validated reconstruction (owner §9E)
**A checkpoint** is a canonical JSON document (`legion.l2.checkpoint.v1`) with a SHA-256 digest over everything except the digest field. **Its contents:**
- ledger balances and reservations;
- request streams (ranges, horizon, retained receipts);
- encounter-credit ranges;
- producers (ranges, open units, retired ranges, next numbers);
- open work;
- the relevant character, equipment and assignment state;
- exact production remainders;
- permanent counters and entitlements;
- RNG streams;
- the content and formula versions;
- the checkpoint identity, the settlement cursor and the branch lineage.

**Reconstruction checks everything and repairs nothing.** It covers:
- **the shape:** a strict schema;
- **the digest;**
- **the versions:** content and formula versions match the running code;
- **every invariant:**
  - ranges normalised;
  - every retained receipt inside its stream's settled set and above its horizon;
  - reserved balances equal the open units' reservations;
  - every assignment refers to an existing character and producer;
  - remainders within their denominators;
  - permanent counts inside the S4 domain;
  - RNG states non-zero;
  - the settlement cursor not behind any settled unit.

A malformed or inconsistent checkpoint is refused with the first problem named.

**For the actual simulation,** `src/l2/simCheckpoint.ts` saves and restores a `LegionSimulation` between steps. It covers the state, the pending event queue, the sequence counter and the run counters. **A restored simulation continues exactly as the uninterrupted one would:** identical state and identical subsequent event log.

**The trusted checkpoint boundary.**
- Structural validation and digest consistency detect corruption and inconsistency.
- **They do not establish authenticity** against an attacker who can rewrite the whole save, because the digest is not keyed.
- A real server must keep checkpoints in storage the client cannot write, or sign them. Neither is implemented.

## 7. Atomic settlement (owner §9F)
**A settlement request** names a producer, a unit range `fromUnit..toUnit` and the digest of its claimed outputs.

**It is validated as a whole before anything changes:**
- the producer exists and is not retired;
- every unit in the range is reserved, or valid to settle;
- the range does not intersect the settled set;
- the outputs are those the settlement primitive computes.

**Then** the balances, unit ranges, counters, RNG positions and the settlement cursor are produced as one new immutable state. **Any failure returns the old state unchanged.**

**Duplicate, overlapping and conflicting batches:**
- **duplicate** (same request, same payload): the original receipt;
- **partially overlapping:** `BATCH_OVERLAP`, refused whole;
- **conflicting** (same request, other payload): `CONFLICTING_PAYLOAD`.

**How a real server would persist this (not implemented):** one conditional write of the new checkpoint together with its receipt, keyed by the previous checkpoint's digest (compare-and-swap). A failed write leaves the old checkpoint authoritative. **Roblox persistence is not implemented and no claim about it is made.**

## 8. Immutable branching
All L2 states are immutable values.
- A branch (fork, hindsight search, what-if preview) shares structure and never writes to its parent.
- Each checkpoint names its branch lineage. Restoring a branch's checkpoint as the parent's, or settling a branch's messages in the parent, is refused (`BRANCH_MISMATCH`).

## 9. Budgets (candidate diagnostic targets; pre-registered in `manifests/l2/`)
| Measure | Candidate budget |
|---|---|
| Retained heap of one slice account after settlement (with GC) | ≤ 16 MB, flat as processed history grows |
| Reconstruction latency (parse, validate, restore) | ≤ 200 ms (p95) |
| Serialized checkpoint size | ≤ 1 MB |
| Replay tail (retained receipts) | ≤ `maxRecent` per stream |
| Peak heap, process RSS, worker memory | reported. The L2 tools run in one process with no worker threads, so the process figures cover everything |

**These are simulator measurements, not Roblox persistence limits.** A stage that exceeds its time or memory budget is stopped and reported as such.

## 10. What L2 does not do
**Not built:**
- offline combat, gathering or Smithing simulation;
- the Monument of Eternity;
- offline rewards UI;
- S5 campaigns;
- new World 1 zones;
- Roblox gameplay.

**Not changed:** the D-07 event ordering, the in-window ledger semantics and the S4 entitlement and counter rules.

**Not done in S4:** no compaction was applied to any S4 result.
