# L2.1 bounded replay, identity and settlement rules — v2

**Version 2, 2026-11-15. Status: candidate.**
- **Implements:** `legion-progression-lab/planning/L2_1_CONTRACT.md` v3.0 (formula version `l2.1-v2`).
- **Code:** `legion-progression-lab/src/l2/`.
- **Independent re-derivation:** `spec/oracle/l21_oracle.py`.
- **Fixtures:** `l21-requests.v1.json`, `l21-credits.v1.json`, `l21-lifecycle.v1.json`, `l21-delivery.v1.json`.
- **Unchanged from L2 v1** (`l2-replay.md`, kept as written): range sets (§1), the work transition table (§3), chronological settlement (§4), and their fixtures `l2-ranges`, `l2-work` and `l2-settlement`.
- **Superseded:** `l2-requests` (by §2 below).

**Arithmetic:** integers only; every count and balance is a safe integer, and every addition is checked (`NUMERIC_LIMIT`).

## 0. Limits
`L = (maxRecent, maxAgeMs, maxAhead, maxStreams, creditWindow, maxCreditStreams, maxOpenProducers, maxUnits, maxOutstanding)`, each a positive safe integer. The candidate values are in the contract §11.

## 2. Request streams
**State:** `S = (H, T, R)`.
- `H ≥ 0` and `T ≥ 0` are integers.
- `R` is a list of receipts `(seq, hash, receipt, at)`, ordered by `at` and then `seq`.

The empty stream is `(0, 0, [])`.

**2.2 `expire(S, now)`:** while the first receipt `r` has `now − r.at ≥ maxAgeMs`, remove it and set `H ← max(H, r.seq)`.

**2.3 `classify(S, seq, hash)`** (after `expire` at the current time), in this order:
1. `seq` not a safe integer ≥ 1: `INVALID_REQUEST`.
2. Some `r ∈ R` with `r.seq = seq`: `REPLAY` with `r.receipt` if `r.hash = hash`, otherwise `CONFLICTING_PAYLOAD`.
3. `seq ≤ H`: `REQUEST_CLOSED`.
4. `seq − T > maxAhead`: `REQUEST_AHEAD`.
5. Otherwise `NEW`.

**At the account level**, before these rules:
- a stream name that is not `[a-z0-9][a-z0-9:._-]{0,63}` is `INVALID_REQUEST`;
- a new stream when `maxStreams` streams exist is `STREAM_LIMIT`.

**2.4 `record(S, seq, hash, receipt, now)`** (only after `NEW`; `now` is not before the last receipt's `at`):
- insert the receipt at `now`, keeping the order by `(at, seq)`;
- set `T ← max(T, seq)`;
- then, while `|R| > maxRecent`, remove the receipt with the lowest `seq` and set `H ← max(H, that seq)`.

**Invariants:**
- every executed request has a receipt in `R` or `seq ≤ H`;
- `|R| ≤ maxRecent`;
- `H ≤ T`;
- every `r ∈ R` has `now − r.at < maxAgeMs`;
- `H` and `T` never decrease.

**Full-history reference:** it keeps every receipt for ever, has no `H` and no `T`, and applies only rules 1, 2 and 5. The differences are listed in the contract §2.6.

## 3. Credits and producers
**3.4 Credits.** A credit stream is a range set `C` with prefix `p`. For `credit(n)` or `abandon(n)`:
- `n` not a safe integer ≥ 1: `INVALID_REQUEST`;
- `n ∈ C`: `CREDIT_REPLAYED`;
- `n − p > creditWindow`: `CREDIT_AHEAD`;
- a new stream when `maxCreditStreams` streams exist: `CREDIT_STREAM_LIMIT`;
- otherwise `C ← C ∪ {n}`. A credit pays its gold and counts a kill; an abandonment pays nothing.

**3.2 Lifecycle.** A producer is `(settled, released, abandoned, reserved, maxUnit, closed)`.

**Order of checks for a work operation** on producer `n`, unit `u`:
1. `PRODUCER_UNKNOWN` (`n` outside `1..allocated`) or `PRODUCER_RETIRED`.
2. `INVALID_REQUEST`: `u` not a safe integer ≥ 1, or an unknown operation.
3. The transition table (L2 v1 §3).
4. For an operation that starts a new unit (`reserve` or `abandon` from `none`), in this order:
   - `PRODUCER_CLOSED` if closed;
   - `WORK_OUT_OF_ORDER` if `u ≠ maxUnit + 1`;
   - `PRODUCER_FULL` if `u > maxUnits`;
   - for `reserve`, `WORK_LIMIT` if `|reserved| ≥ maxOutstanding`.

**The other producer operations:**
- **`open`:** `PRODUCER_LIMIT` if `maxOpenProducers` producers of the kind are open; otherwise `allocated + 1`.
- **`close`:**
  - `PRODUCER_UNKNOWN` or `PRODUCER_RETIRED`;
  - `PRODUCER_CLOSED` if already closed;
  - otherwise `closed ← true`.
- **Automatic retirement:** after `close`, and after any settlement on a closed producer, the producer retires if `reserved = ∅`. Its number joins `retired(kind)` and its tables are dropped.
- **Jobs:**
  - the smith reserves units in order, at most one at a time;
  - a job closes when `done = quantity` or when it is cancelled (its reserved unit is released first), and then retires.

## 4. Delivery parts (synthetic account)
`deliver(A, d)`:
1. **Envelope.** Each of these refuses with the account unchanged:
   - `d` not a known delivery type: `INVALID_DELIVERY`;
   - `d.branch ≠ A.branch`: `BRANCH_MISMATCH`, or `INVALID_DELIVERY` when the branch is not a string;
   - `d.atMs` not a safe integer in `[0, MAX_TIME_MS]`: `INVALID_DELIVERY`;
   - `d.atMs < A.t`: `TIME_BACKWARDS`;
   - an invalid stream name, or a payload that is not canonical JSON: `INVALID_DELIVERY`.
2. **Advancement:** `A′ = advanceTo(A, d.atMs)`, which is L2 v1 §4 `settle` to `d.atMs`, then `expire` on every request stream at `d.atMs`.
3. **The command on `A′`,** applied atomically:
   - **A request** is classified by §2.
     - `REPLAY` returns `A′` with the stored receipt.
     - Any other refusal returns `A′`.
     - `NEW` executes the payload on a copy of `A′`. If the receipt code is `OK`, the copy is kept; otherwise `A′` is kept. Either way the request is recorded (`record`, with the request counter plus one).
   - **A credit or work operation** that is refused returns `A′`; otherwise it is applied on a copy.

**Payload rules** that differ from L2 v1:
- **`settle(untilMs)`:**
  - `INVALID_REQUEST` if `untilMs` is not in `[0, MAX_TIME_MS]`;
  - `SETTLE_BACKWARDS` if `untilMs < t`;
  - `SETTLE_AHEAD` if `untilMs > t`;
  - otherwise `OK {t, ore}`.
- **`createJob(q)`:** `INVALID_REQUEST` unless `1 ≤ q ≤ min(10^6, maxUnits)`; checked before `SMITH_BUSY`.
- **`closeBatch(n)`:** §3.2 `close`. Receipt `OK {producer, retired}`.
- **`settleBatch(n, a, b)`:**
  - `INVALID_REQUEST` unless `1 ≤ a ≤ b` and `b − a < maxOutstanding`;
  - then the producer checks;
  - then, for each unit in order, `BATCH_OVERLAP` if settled or `WORK_NOT_RESERVED` if none;
  - only then is every unit completed. Receipt `OK {units, bars, retired}`.
- **`retire`** (L2 v1) no longer exists: retirement is automatic.
- **A credit's gold** must be in `[0, 10^9]`, otherwise `INVALID_REQUEST`.

## 5. Checkpoints (v2)
**Format:** `{schema: "legion.l2.checkpoint.v2", versions {formula, economy, limits}, checkpointId, cursor, account, digest}`.
- The account carries its `branch`.
- `digest = sha256(canonicalJson(checkpoint without digest))`.

**Validation refuses, as `INVALID_CHECKPOINT` with the problem named:**
- every shape, version or limit violation;
- a digest mismatch;
- a stream invariant of §2 broken at the account time;
- a credit set outside its window;
- for a producer:
  - `released ⊄ settled`, `abandoned ⊄ settled`, or `released ∩ abandoned ≠ ∅`;
  - `max(settled) > maxUnit`;
  - `maxUnit − |settled| ≠ |reserved|`, or a reserved unit that is settled or above `maxUnit`;
  - `maxUnit > maxUnits`, or `|reserved| > maxOutstanding`;
  - closed with no reserved unit;
- for a producer kind:
  - open and retired numbers not disjoint, or not together exactly `1..allocated`;
  - a non-canonical open key;
  - more than `maxOpenProducers` open;
- a smith inconsistent with its job producer;
- a reserved balance different from the reserved lines.

**Two rules about validation itself:**
- every check is interval arithmetic over the retained structure, never a loop over unit or sequence numbers;
- restoring into another branch is `BRANCH_MISMATCH`.
