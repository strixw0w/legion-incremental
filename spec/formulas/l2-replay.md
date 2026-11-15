# L2 bounded replay, identity and settlement rules — v1

**Version 1, 2026-11-15. Status: candidate.** This specification implements `legion-progression-lab/planning/L2_CONTRACT.md` v2.0. The code is `legion-progression-lab/src/l2/`. The independent re-derivation is `spec/oracle/l2_oracle.py`.

**Fixtures:** `l2-ranges.v1.json`, `l2-requests.v1.json`, `l2-work.v1.json`, `l2-settlement.v1.json` and `l2-checkpoint.v1.json`.

**Arithmetic:** integers only; every count and balance is in `[0, 2^53 − 1]` and every addition is checked (`NUMERIC_LIMIT`).

## 1. Range sets
**Shape:** a range set `R = (p, runs)` represents `{1..p} ∪ ⋃ [a_i, b_i]`.
- `p ≥ 0`, and the runs are sorted.
- `a_1 > p + 1`; for every run, `a_i ≤ b_i`; and `a_{i+1} > b_i + 1` (disjoint and non-adjacent).
- Members are positive safe integers.

**Normal form:** after every change, a run beginning at `p + 1` merges into the prefix, and adjacent or touching runs merge.

**Operations:**
- **`has(R, x)`:** `x ≤ p`, or `a_i ≤ x ≤ b_i` for some run.
- **`add(R, a, b)`** (with `1 ≤ a ≤ b`):
  - refused as `RANGE_OVERLAP` if any `x ∈ [a, b]` is a member (nothing is trimmed);
  - otherwise it returns the normal form of `R ∪ [a, b]`.
- **`gaps(R)`:** the maximal non-member intervals below `max(R)`.
- **`size(R)`:** the number of runs. It is bounded by the gaps, not by `|R|`.

## 2. Request streams
**A stream** is `S = (settled: range set, closedBelow ≥ 0, recent: list of (seq, payloadHash, receipt, atMs) sorted by seq)`.

**Configuration:** `maxRecent ≥ 1` and `maxAgeMs ≥ 0`.

**`classify(S, seq, payloadHash)`,** in this order:
1. `seq` is not a positive safe integer: `INVALID_REQUEST`.
2. `has(settled, seq)` and `seq` is in `recent`:
   - the same payloadHash returns `REPLAY` with the stored receipt;
   - otherwise `CONFLICTING_PAYLOAD`.
3. `has(settled, seq)` (receipt evicted): `REPLAY_TOO_OLD`.
4. `seq ≤ closedBelow`: `REQUEST_EXPIRED`.
5. Otherwise `NEW`.

**`record(S, seq, payloadHash, receipt, atMs, nowMs)`** (only after `NEW`):
- it adds `seq` to `settled` and inserts the receipt;
- then it evicts the lowest-seq receipt while `|recent| > maxRecent` or `recent[0].atMs < nowMs − maxAgeMs`;
- each eviction sets `closedBelow = max(closedBelow, evicted seq)`.

**Invariants:**
- every recent seq is settled and above `closedBelow`;
- `|recent| ≤ maxRecent`;
- `closedBelow` never decreases.

**L1 reference (full history):** no eviction and no horizon, so rules 3 and 4 never apply.
- A rule-3 request gets its original receipt from L1, or `CONFLICTING_PAYLOAD` if its payload differs.
- A rule-4 request is executed by L1.

These three observable cases are the only permitted differences: the changed old-replay semantics.

## 3. Work operations
**Producers:** a producer is `(kind, number)`, where `number` is in `1..allocated(kind)`. `allocate(kind)` returns `allocated + 1` and is never reused.

**Units:** each unit `u ≥ 1` of a producer is in one of the states `none`, `reserved`, `completed`, `released` or `abandoned`.

| Op | Allowed from | Result | Otherwise |
|---|---|---|---|
| `reserve(u, lines)` | `none` | `reserved`; moves `lines` from available to reserved (`NEGATIVE_BALANCE` if short) | `WORK_REPLAYED` if `reserved`; `WORK_INELIGIBLE` if `completed`, `released` or `abandoned` |
| `complete(u, outputs)` | `reserved` | `completed`; consumes the reserved lines and deposits `outputs` to available | `WORK_NOT_RESERVED` from `none`; `WORK_REPLAYED` if `completed`; `WORK_INELIGIBLE` if `released` or `abandoned` |
| `release(u)` | `reserved` | `released`; the reserved lines return to available | `WORK_NOT_RESERVED` from `none`; `WORK_REPLAYED` if `released`; `WORK_INELIGIBLE` if `completed` or `abandoned` |
| `abandon(u)` | `none` | `abandoned` (an interrupted action: settled without a deposit) | `WORK_REPLAYED` if `abandoned`; `WORK_INELIGIBLE` otherwise |

**Errors on any op:**
- `PRODUCER_RETIRED` if the producer is retired;
- `PRODUCER_UNKNOWN` if `number > allocated` or `number < 1`.

**Settled units:** the completed, released and abandoned units form one range set per producer, the **settled set**. Reserved units are a separate finite set.

**`retire(producer)`:**
- **Allowed only if** no unit is reserved and the settled set has no gap (it is exactly `1..p`). Otherwise `RETIRE_OPEN_WORK` or `RETIRE_GAP`.
- **Result:** the number joins `retired(kind)`, a range set, and the unit tables are dropped.

## 4. Chronological settlement (synthetic economy)
**State:**
- time `t`;
- gatherers, each with:
  - profession level `L` and EXP;
  - a remainder `r ∈ [0, D)`, where `D = 10000 × 1000`;
  - an action in progress `(start, captured numerator)` or none;
  - an assignment;
- a smith job: `quantity`, `done`, and a unit in progress or none;
- the balances;
- the lifetime ore counter `C`;
- the granted Feat tiers;
- the efficiency schedule;
- the producers (§3).

**Rules:**
- **Gathering actions:**
  - every action lasts `A` ms;
  - an action starting at `s` captures `num = yieldMilli(L) × (10000 + featBp + efficiencyBp(s))`, where:
    - `yieldMilli(L) = y0 + y1 × (L − 1)`;
    - `featBp` is the sum of the granted tiers' bp at `s`;
    - `efficiencyBp(s)` is the schedule's value at `s`, a step function (offline-efficiency windows).
- **Each action end at `s + A`, in order:**
  1. deposit `units = floor((r + num) / D)`, with `r ← (r + num) mod D` (exact);
  2. `C ← C + units`;
  3. EXP plus `x`, with level-ups from the EXP table;
  4. grant every newly crossed Feat tier, in ascending tier order;
  5. the smith checks its input (below);
  6. if still assigned, the next action starts at `s + A` with the rates now in force.
- **Smith units:**
  - a unit needs `k` ore and starts only when `available(ore) ≥ k`;
  - its start reserves `k` ore (`reserve`); its end, after `B` ms, completes it (`complete`: consumes `k` ore and deposits 1 bar);
  - the next unit starts at once if input is available, otherwise at the first ore deposit that makes it available;
  - the job is complete when `done = quantity`.
- **Same-time order:** at a moment, action ends are processed in gatherer order, then smith unit ends, then starts. Every change takes effect at the moment it happens and is captured by actions that start at or after that moment.
- **`settle(state, until)`** processes every event at time `≤ until`, in that order, and leaves the in-progress actions and units in the state.

**Partition invariance:** for every `t1 ≤ t2`, `settle(settle(S, t1), t2) = settle(S, t2)`, including a save and restore of the checkpoint between the two calls.

**The owner's example:**
- **Setup:** `y0 = 1000` milli per action, `A = 36,000` ms (100 per hour), and a Feat of +5,000 bp at 100 ore.
- **Result:** both one 2-hour batch and two 1-hour batches give 250 ore.

## 5. Checkpoints
**Format:** a checkpoint is canonical JSON.
- **Structure:** `{schema: "legion.l2.checkpoint.v1", versions, checkpointId, branch, cursor, account, digest}`.
- **The digest:** `digest = sha256(canonicalJson(checkpoint without digest))`.

**Validation refuses, as `INVALID_CHECKPOINT` with the problem named:**
- a schema or shape violation;
- a digest mismatch;
- a version mismatch with the running code;
- a range set not in normal form;
- a recent receipt outside its stream's settled set or not above its horizon;
- `|recent| > maxRecent`;
- reserved balances that differ from the reserved units' lines;
- a unit both settled and reserved;
- a retired producer with open units;
- a number above `allocated`;
- a remainder outside `[0, D)`;
- a count outside the domain;
- an all-zero RNG state;
- a settlement cursor behind a settled unit's end;
- an assignment to an unknown character or producer.

**It never repairs anything.**

**Branches:** a checkpoint names its branch lineage. Restoring it under another lineage is `BRANCH_MISMATCH`.
