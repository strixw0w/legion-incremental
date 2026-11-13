# Resource ledger

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
