# Exact remainder accounting

## v2

Current version (S0.1, 2026-11-13).

**Changes from v1:**
- The per-hour chain is evaluated as **one exact division**, so it fails only when the granted amount itself cannot be represented. v1 failed earlier, on an intermediate milli-unit total.
- G1 is restated with its precise domain.
- The per-hour state is validated explicitly.

**Impact:** wherever v1 returned a result, v2 returns the identical result. v2 additionally succeeds for very large rates or durations that v1 refused. The `accrue` primitive is unchanged. v1 is kept below for history.

Authoritative fractional progress (rates, efficiency, multipliers) is held as **integer remainders of exact rational accumulators**. Floating-point carries are not used for authoritative state (owner decision D-02).

### Primitive `accrue` (unchanged from v1)
`accrue(rem, num, steps, den) → (granted, rem′)` with `granted = ⌊(rem + num·steps) / den⌋` and `rem′ = (rem + num·steps) mod den`.
- **Domain:** safe integers with `0 ≤ rem < den`, `num ≥ 0`, `steps ≥ 0`, `1 ≤ den ≤ 2^26 = 67,108,864`.
- **Errors:**
  - den outside the domain: `INVALID_DENOMINATOR`;
  - `rem ≥ den`: `INVALID_STATE`;
  - negative or non-integer inputs: `INVALID_NUMBER`;
  - `granted > 2^53 − 1`: `NUMERIC_LIMIT`.
- **Evaluation:** exactly as in v1 (below). `NUMERIC_LIMIT` is raised only when `granted` itself is unrepresentable.

### Per-hour chain `accruePerHour` (changed in v2)
**State and inputs:**
- State `(msRem, milliRem)`, safe integers with `0 ≤ msRem < 3,600,000` and `0 ≤ milliRem < 1000`.
- Inputs `rateMilliPerHour ≥ 0` (thousandths of a unit per hour) and `dMs ≥ 0`, both safe integers.

**Definition.** Conceptually there are two stages: milliseconds → milli-units (den 3,600,000), then milli-units → units (den 1000). For positive integers, `⌊⌊X/a⌋/b⌋ = ⌊X/(a·b)⌋`, so the two stages are exactly one division by `D = 3,600,000,000`:
- `X = milliRem·3,600,000 + msRem + rate·dMs`
- `granted = ⌊X / D⌋`
- `rest = X mod D`, `milliRem′ = ⌊rest / 3,600,000⌋`, `msRem′ = rest mod 3,600,000`

**Evaluation without big integers:**
1. `(q, r) = mulDivRem(rate, dMs, D)` (`numeric.md`), which is exact. `rate·dMs` is never formed.
2. `carried = milliRem·3,600,000 + msRem`, which is below D and exact.
3. `s = r + carried`, which is below 2D and exact.
   - If `s ≥ D`: `granted = q + 1` (checked) and `rest = s − D`.
   - Otherwise: `granted = q` and `rest = s`.

**Errors:**
- the state is not an object: `INVALID_STATE`;
- `msRem` or `milliRem` out of range: `INVALID_STATE`;
- a state field, the rate or the duration is negative or not a safe integer: `INVALID_NUMBER`;
- `granted > 2^53 − 1`: `NUMERIC_LIMIT`.

**Supported domain (precise):** every valid state with every non-negative safe rate and duration. The only refusal is a single call whose own grant exceeds 2^53 − 1, a number that could not be credited to a ledger balance anyway.
- *Examples:*
  - at rate 2^53 − 1 milli/h (about 9.0 × 10^12 units per hour), one call may cover up to 3,600,000,000 ms (1,000 hours);
  - at 1 milli/h, one call may cover 2^53 − 1 ms.
- *Impact:* none for the planned game. W1 candidate rates are many orders of magnitude below these limits.

### Guarantees
- **G1 (partition invariance).** Take a fixed rate (per-hour chain) or a fixed `(num, den)` (`accrue`). Applying the function over durations s₁, s₂, … in order, carrying the state, gives exactly the same total `granted` and final state as one call with Σsᵢ. This holds whenever that total is ≤ 2^53 − 1.
  - If the total exceeds 2^53 − 1, the single call raises `NUMERIC_LIMIT`. The parts' grants cannot then be summed within the safe range either, so a caller that adds them (for example the ledger) also raises `NUMERIC_LIMIT`.
  - No partition yields more or less than the single call.
- **G2 (zero duration).** A duration of 0 changes nothing.
- **G3 (rate changes).** Integer parameters are fixed between rate-change events, and the state carries across a change because `D` is unchanged. A timeline of pieces `(rateᵢ, dMsᵢ)`, each split in any way, grants exactly `⌊(carried₀ + Σ rateᵢ·dMsᵢ) / D⌋` in total, whenever that total is ≤ 2^53 − 1.
- **G4 (quantisation boundary).** Unchanged from v1.
  - A real-valued modelled quantity becomes integer parameters once, at its rate-change event. Rounding always goes against the player: durations up, yields and rates down.
  - The rule is recorded in the receipt and specified per stream type in S2, S3 and S5.
  - Equality with an unquantised real-valued integral is not guaranteed. The difference is bounded by the declared quantum, which is below 0.001 unit per hour per stream for the per-hour chain.
- **G5 (no epsilon).** No tolerance is ever added before a floor.

### Standard chains
| Chain | Evaluation | State |
|---|---|---|
| Per-hour rate (`accruePerHour`) | one exact division by 3,600,000,000 (above) | `msRem ∈ [0, 3,600,000)`, `milliRem ∈ [0, 1000)` |
| Timed actions | `accrue` with `num = 1`, `den = actionIntervalMs` (≤ 2^26 ms) | `rem ∈ [0, den)` |
| Efficiency (applied once) | `accrue` with `num = efficiencyBp`, `den = 10,000` | `rem ∈ [0, 10,000)` |

### Persistence
Unchanged from v1. The per-hour state is still saved as the two integers `(msRem, milliRem)`, so v1 saves load unchanged.

### Luau parity
`mulDivRem` and `divRem` use only integer-valued double arithmetic below 2^53 (`numeric.md`), so a Luau kernel following the steps above reproduces every result bit for bit.

Fixtures: `spec/fixtures/remainder.v2.json` (fixture version 2: every v1 case kept unchanged, plus per-hour, timeline and state cases).

## v1 (superseded by v2 in S0.1; kept for history)

Authoritative fractional progress (rates, efficiency, multipliers) is held as **integer remainders of exact rational accumulators**. Floating-point carries are not used for authoritative state (owner decision D-02).

### Primitive
`accrue(rem, num, steps, den) → (granted, rem′)` with:
- `granted = ⌊(rem + num·steps) / den⌋`
- `rem′ = (rem + num·steps) mod den`

**Domain:** safe integers with `0 ≤ rem < den`, `num ≥ 0`, `steps ≥ 0`, and `1 ≤ den ≤ 2^26 = 67,108,864`.

**Errors:**
- den outside the domain: `INVALID_DENOMINATOR`
- `rem ≥ den`: `INVALID_STATE`
- negative or non-integer inputs: `INVALID_NUMBER`
- `granted > 2^53 − 1`: `NUMERIC_LIMIT`

**Exact evaluation without big integers.** Write `steps = qₛ·den + j` and `num = a·den + b` (`divRem`, so `0 ≤ j, b < den`). Then:
- `granted = a·qₛ·den + a·j + b·qₛ + ⌊(b·j + rem) / den⌋`
- `rem′ = (b·j + rem) mod den`

Because `den ≤ 2^26`, `b·j + rem < 2^52`, so that term is exact. The other three terms are parts of `granted`; they are computed with checked multiplication and addition in the order written. So a `NUMERIC_LIMIT` is raised only when `granted` itself is unrepresentable. The full product `num·steps` (up to about 2^106) is never formed.

### Guarantees
- **G1 (partition invariance).** For fixed (num, den), applying `accrue` over steps s₁, s₂, … in order, carrying `rem`, gives exactly the same total `granted` and final `rem` as one call with Σsᵢ.
- **G2 (zero duration).** `steps = 0` returns `(0, rem)`.
- **G3 (rate changes).** Integer parameters are fixed between rate-change events. Results are identical for every partition of a timeline that contains the same rate-change events. The remainder carries over a change when the stage's `den` is unchanged.
- **G4 (quantisation boundary).** A real-valued modelled quantity is turned into integer parameters once, at its rate-change event. The rounding always goes against the player: durations up, yields and rates down. The rule is recorded in the receipt and specified per stream type in S2, S3 and S5. Equality with an unquantised real-valued integral is **not** guaranteed. The difference is bounded by the declared quantum, for example less than 0.001 unit per hour per stream for the per-hour chain.
- **G5 (no epsilon).** No tolerance is ever added before a floor.

### Standard chains
Each stage is an `accrue` with its own `den ≤ 2^26`. Each stage is partition-invariant, so the chain is.

| Chain | Stage 1 | Stage 2 |
|---|---|---|
| Per-hour rate (`accruePerHour`) | ms → milli-units: `num = rateMilliPerHour`, `den = 3,600,000`, state `msRem ∈ [0, 3,600,000)` | milli-units → units: `num = 1`, `den = 1000`, state `milliRem ∈ [0, 1000)` |
| Timed actions | ms → actions: `num = 1`, `den = actionIntervalMs` (≤ 2^26 ms) | — |
| Efficiency (applied once) | work units → credited units: `num = efficiencyBp`, `den = 10,000` | — |

### Persistence
- Remainders are saved as integers in `[0, den)`, together with the parameter version.
- Proposed keying from S2: `(ownerId, quantityId, stage)`, where `ownerId = "account"` for ledger resources and a character ID for EXP.
- Account-resource remainders survive assignment switching. What happens to partial action progress on a switch is decided in S2/S3; the candidate rule is that it is discarded and never credited.

Fixtures (v1): `spec/fixtures/remainder.v1.json`, replaced in S0.1 by `remainder.v2.json`, which keeps every v1 case unchanged.
