# L2 replay and settlement contract — v3.0 (L2.1)

**Version 3.0, 2026-11-15. Status: candidate, in review.** Source: the owner's "Independent L2 Review and L2.1 Authorisation" §2–§9. It revises `L2_CONTRACT.md` v2.0, which is kept unchanged as the record of L2. The exact rules are `spec/formulas/l21-replay.md` v2; the code is `src/l2/` (formula version `l2.1-v2`).

**Unchanged from v2.0:**
- chronological progression and the three boundary kinds (§9A);
- request, transaction, encounter and work identities as separate classes (§9B);
- the work transition table (reserve, complete, release, abandon);
- the trusted boundary, and the rule that validation never repairs.

**What v3.0 changes:** §2 (receipt expiry and the bounded window), §3 (internal credits), §4 (the producer lifecycle), §5 (reconstruction), §6 (immutability), §7 (delivery parts and atomic settlement), §8 (branch identity). §10 lists the decisions the owner should confirm.

## 1. Chronological progression
- **Partition invariance (§9A) holds as before.** For every split of a productive interval into storage batches, the result is the same, including save and restore between the batches.
- **New:** every partition case draws from its own random stream (seed plus case number), so cases can run in any grouping or in parallel with identical results.

## 2. Requests: the bounded recent window
### 2.1 Time
- **Every delivery carries the trusted delivery time** `atMs`, stamped by the trusted boundary from a monotonic clock. A client clock is never used.
- **Acceptance and commit happen at that same moment:** a delivery is processed atomically at its trusted time. A receipt's time is its acceptance time.
- **A delivery whose time is behind the account's settlement cursor** is refused as `TIME_BACKWARDS`, with no effect. A correct trusted clock never produces one.
- **Times are safe integers** in `[0, MAX_TIME_MS]` (`MAX_TIME_MS` = 8.64 × 10^15, the largest JavaScript date).

### 2.2 State of a stream
A stream keeps:
- a closed horizon `H`;
- the highest executed sequence number `T`;
- at most `maxRecent` live receipts, in acceptance order.

**Invariant:** every executed request either still has its receipt or lies at or below `H`. Nothing else is kept. In particular there is **no membership below the horizon**: the state is bounded by `maxRecent`, whatever the history or its gaps.

### 2.3 Expiry and eviction
- **Age:** a receipt accepted at time `a` is live while `now − a < maxAgeMs`. From `a + maxAgeMs` on, it has expired.
  - Expiry is applied whenever the account's clock advances, in every delivery of any type, before classification. It never waits for a new request on the same stream.
  - Since acceptance times never decrease, the expired receipts are a prefix of the acceptance order.
- **Count:** when a new receipt makes more than `maxRecent`, the receipt with the lowest sequence number is removed. This is deterministic.
- **Each removal raises `H`** to at least the removed sequence number.
  - Raising `H` on an age removal also closes never-seen numbers below it.
  - **Declared protocol rule:** sequence numbers are assigned in generation order. A request numbered below one whose receipt has expired was generated before that one, so it is at least as old.
  - Live receipts below `H` stay replayable until they themselves expire or are evicted.

### 2.4 Classification, in order
1. **`INVALID_REQUEST`:** the sequence number is not a positive safe integer, or the stream name is invalid.
2. **`REPLAY`** with the original receipt, if a live receipt has this number and the same payload hash. **`CONFLICTING_PAYLOAD`** if the payload differs.
3. **`REQUEST_CLOSED`:** the number is at or below `H`. The request can be neither executed nor replayed. **This does not say that it was ever applied** (owner §3).
4. **`REQUEST_AHEAD`:** the number is more than `maxAhead` above `T`. It is refused without effect and may be resent later.
   - **Declared admission rule:** a single arbitrary high number cannot reach the window, so it can never raise `H`. Outstanding lower numbers stay executable.
5. **`STREAM_LIMIT`:** a new stream when the account already has `maxStreams` streams.
6. **`NEW`:** otherwise. The request executes once, and its receipt is recorded at the trusted time.

**Out-of-order requests** inside the window (above `H`, at most `T + maxAhead`) execute in any order, each once.

### 2.5 What a stream can no longer distinguish
Below the horizon, "applied long ago" and "never seen and now too old" are the same answer: `REQUEST_CLOSED`. This replaces L2's `REPLAY_TOO_OLD` and `REQUEST_EXPIRED`, as the owner approved.

### 2.6 Declared observable differences from the full-history reference
The full-history reference (`src/l2/l1Reference.ts`) keeps every receipt and credit, and has no horizon or window. L2.1 differs from it in exactly these cases:

| L2.1 | Full-history reference |
|---|---|
| `REQUEST_CLOSED` | `REPLAY` with the original receipt (applied; receipt expired or evicted) |
| `REQUEST_CLOSED` | `CONFLICTING_PAYLOAD` (applied; retried with another payload) |
| `REQUEST_CLOSED` | would execute (never seen; below the horizon) |
| `REQUEST_AHEAD` | would execute (**new in v3**) |
| `CREDIT_AHEAD` | would pay the credit (**new in v3**, §3) |
| `STREAM_LIMIT`, `CREDIT_STREAM_LIMIT` | would proceed (**new in v3**) |

**The differential checks each difference against its reason in the compact state:**
- for `REQUEST_CLOSED`, the number is at or below `H` and has no receipt;
- for `REQUEST_AHEAD`, the number is more than `maxAhead` above `T`;
- for `CREDIT_AHEAD`, the number is more than `creditWindow` above the prefix;
- for the stream limits, the stream table is full.

A difference without its reason is a mismatch. A refused delivery still advances the reference's clock, so both stay comparable. **No other difference is permitted.**

## 3. Internal kill credits: exact ownership with an admission window
- **The request window (§2) does not apply to credits.** Credit numbers are internal encounter identities.
- **Exactness:** a stream keeps an exact range set of settled numbers. Each number is credited or abandoned at most once, and an abandoned encounter is never paid.
- **Admission:** a number more than `creditWindow` above the stream's settled prefix is `CREDIT_AHEAD`. It is refused without effect and may be redelivered.
  - The gaps inside the window are outstanding encounters. **They are never closed to save memory.**
  - An encounter is settled only by its credit or by an explicit abandonment from its owner (`creditAbandon`).
- **Bound:** a stream's range set has at most `creditWindow` runs, and an account at most `maxCreditStreams` streams.

## 4. The producer lifecycle (automatic retirement approved)
- **Numbers:** producer numbers are allocated per kind (`job`, `batch`) and never reused.
- **Closed:** a producer is closed when no new unit may start:
  - a job when it completes or is cancelled;
  - a batch when its owner sends `closeBatch`.
- **Units start in order.** A new unit (reserve, or abandon from none) must be the next unit `maxUnit + 1`, otherwise `WORK_OUT_OF_ORDER`. The limits:
  - at most `maxUnits` units per producer (`PRODUCER_FULL`: a long-lived activity rotates to a new producer);
  - at most `maxOutstanding` reserved units at once (`WORK_LIMIT`);
  - at most `maxOpenProducers` open producers per kind (`PRODUCER_LIMIT`).
- **Settled units follow from the order.** Because units start in order, the settled set's gaps are exactly the reserved units: the producer's state is bounded by `maxUnits` and `maxOutstanding`.
- **Automatic retirement:**
  - a closed producer with no reserved unit retires at once, deterministically, in the same delivery;
  - its unit tables are dropped and its number joins the kind's retired range set;
  - that set has at most `maxOpenProducers + 1` runs.
- **Retired producers stay retired.** Every message for a retired producer is refused (`PRODUCER_RETIRED`) and can never reactivate it.
- **Settled units stay settled.** Released and abandoned units can never be completed (`WORK_INELIGIBLE`). A cancelled job's unstarted units are never produced.
- **Reservations are kept.** A legitimate outstanding reservation is never closed to save memory: a closed producer waits for its reserved units to settle before it retires.
- **Scope:** the lifecycle infrastructure is in the synthetic account. Integration into the gameplay engine is S5.

## 5. Validated reconstruction
**Both checkpoint kinds** (the synthetic account, `src/l2/checkpoint.ts`, and the actual simulation, `src/l2/simCheckpoint.ts` with `src/l2/simState.ts`):
- validate shape, digest, versions and limits, then every invariant;
- refuse with the problem named (`INVALID_CHECKPOINT`), and never repair anything;
- never throw anything else on malformed input: a malformed nested value is a named problem;
- keep their cost proportional to the retained structure, never to the history.

**The synthetic account is checked exactly by interval arithmetic:**
- released and abandoned sets are subsets of the settled set and disjoint from each other;
- settled and reserved units together are exactly `1..maxUnit`;
- open and retired producers partition `1..allocated`, with canonical keys;
- the receipts are live, ordered and within the limits;
- credits lie within the window;
- the smith and its job producer agree; the reserved balances equal the reserved lines.

**The actual simulation is checked against its features and content:**
- required fields exactly per the enabled features: industry exactly when the industry switch is on, permanent exactly when the permanent switch is on;
- every required RNG stream: the account, each character, the permanent emblem stream;
- numeric domains: levels, EXP against the table, health within maximum, statuses, times not after the state time;
- cross-references: assignments, encounter and participants, equipment and loadouts both ways, the production queue, work and pending settlements, the credit registries;
- each queued event's kind for the enabled features, with its phase, owner, payload fields and references. Stale events are legitimate and accepted;
- the ledger by the L1 validated reconstruction, the reservation balance, and the S4 permanent domain.

**Simulation checkpoint encoding v2:**
- The engine keeps its committed kill credits as a linked chain. Serialized as nested objects, this overflowed the stack after a few thousand kills, so **L2 could not save a long run**. v2 stores each chain as a flat list and rebuilds it on restore.
- **The chain still grows with the history.** That is the engine's L1 credit model; replacing it is S5 engine integration (§9).

**The digest proves nothing about authenticity.** It detects corruption only. A consistent edit with a recomputed digest is accepted when the edited values remain valid. Checkpoints must be stored outside the client's reach, or signed (trusted boundary, unchanged).

## 6. Immutability
- **Frozen values:** accounts, receipts (stored and returned), nested work records, RNG states and reservation lines are frozen.
- **Structural sharing:** unchanged parts are shared, never deep-copied per delivery. Item storage is copy-on-write (§9 of the owner's approval).
- **Trusted accounts only:** the account functions accept only accounts made by the account module (`newAccount`, `deliver`, `advanceTo`, `fork`, a validated checkpoint). A spread or hand-built copy is refused.
- **Not a security boundary:** the trust registry guards against accidental misuse. It does not protect against hostile code inside the server.
- **Exception:** the full-history reference is mutable by design, and is used only by the differential harness.

## 7. A delivery's three parts and atomic settlement
1. **Envelope.** Checked: the shape, the branch, the trusted time (`TIME_BACKWARDS`, `INVALID_DELIVERY`), the stream name, and that the payload can be canonically hashed. A refusal here changes nothing at all.
2. **Chronological advancement** to the delivery time, with receipt expiry. It is committed once the envelope is accepted, **independently of the command**. It is identical to `advanceTo(account, atMs)` alone.
3. **The command, atomically** on top of the advanced account: all of its effects or none.
   - A request is recorded with its receipt either way: a failure receipt when its execution was refused. That is request bookkeeping, not part of the command.
   - **A failed settlement batch** (`settleBatch`) commits none of its units, outputs or identity ranges. The state after it equals the advancement plus the failure receipt, which is a full-state comparison in the tests.
   - **A settlement request** (`settle`) cannot move the settlement cursor:
     - settlement is driven by the trusted clock only;
     - a `settle` to a time before the cursor is `SETTLE_BACKWARDS`;
     - a `settle` beyond the trusted delivery time is `SETTLE_AHEAD`.

     L2 allowed a settlement ahead of the delivery time. L2.1 refuses it, so no command can claim time that has not passed.

**Domain validation:** external numbers are checked against their supported domains, and refused with `INVALID_REQUEST` before anything is applied:
- sequence numbers, credit numbers and credit gold (at most 10^9);
- quantities, at most `min(10^6, maxUnits)`;
- item references, producer numbers and unit numbers.

## 8. Branch identity
- **Accounts and deliveries name their branch** (`main`, `main/what-if`, …).
- **Admission:** a delivery for another branch is refused (`BRANCH_MISMATCH`) and changes nothing. A child's message cannot run in its parent or a sibling, nor a parent's in the child.
- **Isolation:** a child's deliveries never change the parent, which immutability guarantees. The tests check isolation and admission separately.
- **Forks:**
  - `fork(account, name)` makes the child `parent/name` and shares the compact evidence, so it is cheap;
  - each branch then keeps its own replay history, so the same request identity runs independently in both;
  - checkpoints take their branch from the account, and restoring into another branch is refused (`BRANCH_MISMATCH`);
  - an ordinary caller cannot relabel a branch: the only path is `fork`, which adds a child segment.
- **Sibling names** are the caller's to keep distinct.

## 9. Limitations
1. **The gameplay engine is not on the L2.1 store.** Its commands do not pass through the request window, and its kill-credit registries keep the full committed history.
   - The actual simulation's checkpoint therefore grows with the number of kills: about 265 bytes per kill, about 1.5 MB after 2.5 simulated hours of S2 play.
   - L2.1 makes such runs saveable; it does not make them bounded. That is S5.
2. **No Roblox persistence is implemented or claimed.** The compare-and-swap write remains a description.
3. **The trusted boundary is assumed:** it stamps monotonic times, and it stores checkpoints out of the client's reach.
4. **Thresholds are candidates:** the window, admission and limit values (§11) are test values for the synthetic account.

## 10. Decisions for the owner to confirm
1. **An age expiry closes never-seen numbers below the expired one** (§2.3, generation-order rule). The alternative, keeping each gap open until its own deadline, would need per-gap state.
2. **`REQUEST_AHEAD` is anchored on the highest executed number `T`** (`maxAhead` above it).
3. **Settlement is driven by the trusted clock only.** A `settle` request no longer advances beyond the delivery time (§7).
4. **Every accepted delivery advances the economy to its trusted time first,** including a replay or a refused request.
5. **The credit window and abandonment for internal credits** (§3), rather than closing old gaps.

## 11. Candidate limits (synthetic test values, `src/l2/limits.ts`)
| Limit | Value |
|---|---|
| `maxRecent` (receipts per stream) | 256 |
| `maxAgeMs` | 86,400,000 (24 h) |
| `maxAhead` | 1,024 |
| `maxStreams` | 8 |
| `creditWindow` | 4,096 |
| `maxCreditStreams` | 8 |
| `maxOpenProducers` (per kind) | 64 |
| `maxUnits` (per producer) | 4,096 |
| `maxOutstanding` (per producer) | 64 |

**The tight-window differential uses** `maxRecent` 8, `maxAgeMs` 3,600,000 and `maxAhead` 64 (`manifests/l2.1/`).

**Bound on the retained identity evidence:**
- request receipts, at most `maxStreams × maxRecent`;
- credit runs, at most `maxCreditStreams × creditWindow`;
- open producers, at most `2 × maxOpenProducers`, each bounded by `maxUnits` and `maxOutstanding`;
- retired runs, at most `2 × (maxOpenProducers + 1)`.

**None of these depends on the length of the history.**
