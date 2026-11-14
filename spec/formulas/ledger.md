# Resource ledger

## v1.2

S2.1 (2026-11-13; owner "Independent L1/S2 Review and S2.1 Authorisation" §3). **`applyTx`, the serialization format, the AVL trees, replay and conflict semantics are unchanged.** Only the conservation check of validated reconstruction changes.

### Conservation is summed exactly
- **The defect (v1.1):** conservation added each resource's nets with a checked safe-integer sum, in canonical txId order. A valid chronological history can pass far beyond 2^53 − 1 in that order. For example, credit M, debit M, credit M (txIds `a`, `z`, `b`) is valid at every step and ends at M; summed `a`, `b`, `z` it reaches 2M first. v1.1 refused it with `NUMERIC_LIMIT`.
- **v1.2 rule:** each balance must equal the **exact** sum of the committed nets for its resource and bucket. The lab sums with arbitrary-precision integers (BigInt), so the order of summation cannot matter.
- **What must still be a safe integer:** each net delta (input) and each balance (output). A delta or balance outside the range is invalid input (`INVALID_STATE`). A valid history whose cumulative turnover exceeds the range is accepted.
- **Error classes:**
  - invalid input (bad structure, order, ranges, hashes, or a balance that is not the sum of the receipts) is `INVALID_STATE`;
  - `NUMERIC_LIMIT` remains only the live `applyTx` refusal of a transaction that would move a balance out of range.

### Structural validity, not authenticity
Reconstruction establishes that saved data is a **well-formed, self-consistent** ledger: valid structure, conserved balances, a genuine persistent ledger afterwards with original replay receipts and conflict detection. It does **not** establish that the history really happened. A forged but self-consistent history is accepted. Authenticity of untrusted save data (signatures, server authority, DataStore ownership) is a separate concern for the game's persistence layer (S5/M6).

### Implications for a future Luau reconstruction
- Luau numbers are IEEE doubles; there is no built-in BigInt, and integers are exact only up to 2^53. The game must not copy the lab's BigInt sum literally, and must not sum in canonical order with plain numbers either: that would reintroduce the v1.1 defect, or silently round.
- **Acceptable exact methods:**
  - a two-limb (or multi-limb) integer accumulator, for example base 2^24 digits with carries;
  - summing positive and negative nets separately, each in a multi-limb accumulator, then comparing;
  - replaying the stored history in its original chronological order (which requires storing a sequence number, an L2 / M6 design question) and checking every intermediate balance.
- Whatever method is chosen must be tested against the same fixtures (`spec/fixtures/ledger-reconstruction.v1.json`).

### Unresolved (recorded, not fixed in S2.1)
Month-scale histories still exceed the 2 GiB benchmark heap budget, and a single serialized string above about W-week exceeds the V8 string limit. Bounded history, compaction and batched settlement remain L2 and are not authorised yet.

Fixtures: `spec/fixtures/ledger-reconstruction.v1.json` (new), `spec/fixtures/ledger.v1.json` (unchanged).

## v1.1

L1 (S2 start, 2026-11-13; owner "S1.1 Acceptance and S2 Authorisation" §5). **`applyTx` semantics are unchanged from v1.** v1.1 adds two implementations behind the same contract, a canonical serialization and a validated reconstruction.

### Implementations
| ID | Structure | Status |
|---|---|---|
| `reference` | S0 copy-on-commit maps (`src/core/ledger/ledger.ts`) | Correctness reference; **default** |
| `persistent` | Persistent AVL trees with path copying (`persistentMap.ts`, `persistentLedger.ts`) | L1. Chosen explicitly; used in S2 experiments only after the L1 gates pass (`planning/L1_LEDGER_SPECIFICATION.md`) |

- **Same contract** (v1 sections below):
  - validation;
  - payload hash;
  - original-receipt replay;
  - `TX_CONFLICT`;
  - checked aggregation;
  - bucket bounds;
  - atomic commit;
  - full history;
  - genuine-instance identity, refusing the other implementation's ledgers too;
  - frozen exposed values.
- **Persistent tree invariants:**
  - search order by JavaScript string comparison;
  - AVL balance (|h(l) − h(r)| ≤ 1);
  - stored height and size correct;
  - nodes frozen and never changed.

  A commit returns new roots that share all untouched subtrees, so every earlier snapshot remains a valid, unchanged ledger. No hashing is involved.
- **Semantic equality.** Two ledgers are semantically equal when their canonical serializations are equal. Iteration order is not part of the contract: the reference iterates in insertion order, the persistent one in key order.

### Canonical serialization (`legion.ledger.v1`)
`canonicalJson` of `{ schema: "legion.ledger.v1", balances, committed }`:
- **`balances`:** `[[resourceId, { available, reserved }], …]`, in strictly ascending resourceId order.
- **`committed`:** `[[txId, { payloadHash, nets: [[resourceId, bucket, delta], …] }], …]`, in strictly ascending txId order. Nets are in the order `applyTx` stores them (ascending resourceId, then bucket).

Equal content gives byte-identical output, whatever the insertion history or implementation.

### Validated reconstruction
`reconstructPersistentLedger(data)` is the only way to rebuild a ledger from saved data. It trusts nothing and fails with `INVALID_STATE` (no ledger) on any violation of:
- the exact schema and field sets;
- strictly ascending, unique keys;
- valid resource IDs, buckets and txIds (1..256 characters);
- 64-hex payload hashes;
- safe integers: balances ≥ 0 and deltas ≠ 0;
- nets in stored order;
- **conservation:** each balance equals the checked sum of all committed nets for that resource and bucket, and no net touches a resource missing from balances.

The rebuilt ledger is a genuine persistent ledger: replays and conflicts behave as before saving.

### Not in v1.1
Bounded or compacted history, sequence-based replay windows and batched settlement are L2. They need a separately versioned contract (owner §5). A committed transaction ID is never forgotten.

## v1

### State
- **Balances:** per resource ID (`res.…`), two buckets `available` and `reserved`. All values are safe integers ≥ 0.
- **Committed transactions:** `txId → { payloadHash, result }`.

### Transaction
`{ txId, purpose, cause?, lines }`. Validation, in this order:
- **Fields:** only `txId`, `purpose`, `cause` and `lines` are allowed (`INVALID_TX`).
- `txId`: a string of 1..256 characters (`INVALID_TX`).
- `purpose`: matches `^[a-z][a-z0-9_.-]{0,63}$` (`INVALID_TX`).
- `cause`: if the key is present, a string of at most 256 characters (`INVALID_TX`).
- `lines`: 1..1000 entries of `{ resourceId, bucket, delta }` with no other fields (`INVALID_TX`).
- `resourceId` matches `^res(\.[a-z0-9_]+)+$`, and `bucket` is `available` or `reserved` (`INVALID_TX`).
- `delta`: a safe integer (`INVALID_NUMBER`) and not zero (`INVALID_TX`).

### applyTx (pure, atomic)
1. Validate.
2. `payloadHash = SHA-256(canonicalJson(tx))` (`canonical-json.md`). Key order inside the transaction does not matter; line order does.
3. **txId already committed:**
   - **same payloadHash:** return the stored result with `replayed = true`; the ledger is unchanged;
   - **different payloadHash:** `TX_CONFLICT`, ledger unchanged.
4. **Aggregate:** add up the lines per `(resourceId, bucket)` with checked addition, so an intermediate overflow gives `NUMERIC_LIMIT`. Validation uses only these nets. `−3` then `+5` on an empty bucket is valid (net +2), and line order can never cause a false negative.
5. **Check balances:** for each non-zero net, `new = old + net`, which must be ≥ 0 (`NEGATIVE_BALANCE`) and ≤ 2^53 − 1 (`NUMERIC_LIMIT`).
6. **Commit:** apply every change, record `txId → { payloadHash, result }`, and return the new ledger. The input ledger object is never mutated. A failed transaction records nothing, so a later attempt with the same txId is evaluated afresh.

### Result
`{ txId, nets, replayed }`. `nets` lists the non-zero aggregated lines, sorted by `(resourceId, bucket)`. Lines that cancel out leave no trace; no balance entry is created for them.

### Invariants (property-tested)
- Balances are never negative and never unsafe.
- **Conservation:** for every bucket, `final − initial = Σ nets of committed transactions`.
- Replaying any committed transaction changes nothing.

### Immutable state boundary (S0.1 hardening; no result changes, spec stays v1)
- **A Ledger is an immutable value with an identity.**
  - The only ways to obtain one are `emptyLedger()` and `applyTx()`.
  - Each ledger they create is registered in a module-private set, which is never exported. `applyTx` checks identity, not structure. It refuses any object that is not registered with `INVALID_STATE`, including:
    - a hand-built object with plain maps;
    - a frozen shallow copy of a genuine ledger;
    - an object combining the balances of one genuine ledger with the history of another *(S0.1 final correction after independent review)*;
    - maps built through the read-only map's constructor.
  - Every ledger ever created stays registered for as long as it is referenced. Any earlier snapshot is therefore a valid, independent starting point for a branch. Replays and conflicts follow that branch's own history.
  - **Deserialisation:** no constructor exists that turns saved data into a ledger. Loading a ledger from a save will need its own separate, validated reconstruction boundary (S3/M6). That boundary must check balances, history and their consistency before registering the result.
  - **Scope:** this protects state integrity inside the lab and game code. It is not a defence against deliberately malicious code running in the same process.
- **Everything reachable is frozen.** This covers:
  - the ledger record;
  - both maps, which are read-only maps: `get`, `has`, `size` and iteration, but no `set`, `delete` or `clear`;
  - every balance record and every committed record;
  - every result, its `nets` array and each line.
  Mutation attempts throw `TypeError` (the lab's modules are strict) and change nothing.
- **Replay** returns a frozen copy of the stored result with `replayed = true`. No caller can alter committed history or a later replay receipt.
- **Lines:** `lines` must be a dense array of objects; a missing or non-object entry gives `INVALID_TX`.
- **Luau:** the game has no `Object.freeze` equivalent for nested data shared with callers. The game ledger must keep committed history private to its module and return copies, never internal tables.

### Performance (S1)
Each successful transaction copies both maps, unchanged from S0. That is O(n) per transaction and O(n²) over a run. It is deliberately kept for S0.1. `planning/S1_LEDGER_BENCHMARK_PROPOSAL.md` defines the benchmark that S1 must run to decide whether it is suitable for long simulations.

### Later scope
- **S3:** reservation lifecycle (reserve, consume, release) and equipment items as separate instances.
- **M6:** a bounded retention window for committed IDs in the game.

Fixtures: `spec/fixtures/ledger.v1.json`.
