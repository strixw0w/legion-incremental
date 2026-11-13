# Stat stacking

## v2

Current version (S0.1, 2026-11-13).

**Changes from v1:**
- An active category whose factor is exactly 1 is skipped.
- Every partial and final value must lie in [0, 2^53 − 1].
- Malformed or sparse inputs are refused with `INVALID_CONTENT`.

**Impact:**
- **Neutral skip.** It changes a result only where the binary64 round trip `v × 10000 / 10000` did not return v. In S0 this was seen only near 2^53 (for example 2^53 − 1 became 2^53 − 2); a scan of base values 1–199 with ordinary bonuses found no difference.
- **Range limit.** It turns results that v1 returned as values above 2^53 − 1, `Infinity` or `NaN` into `NUMERIC_LIMIT`.
- Every other result is identical to v1.

### Inputs
- `base`: safe integer ≥ 0.
- **Sources** (a dense array of objects):
  - `{ sourceId, kind: "flat", value }`, where value is a safe integer ≥ 0;
  - `{ sourceId, kind: "bp", categoryId, value }`, where value is a safe integer and may be negative.
- **Categories** (a dense array of objects): `{ id, kind: "additivePool" | "multiplier", active }`. `active` must be a boolean. `kind` is governance metadata; both kinds evaluate the same way.
- **Malformed input:** a non-array, a missing entry, a non-object entry, an empty or non-string ID, an unknown kind or a non-boolean `active` gives `INVALID_CONTENT`.

### Evaluation (binary64, in exactly this order)
1. `flatTotal = base + Σ flat values`, checked (`NUMERIC_LIMIT` above 2^53 − 1).
2. For each registered category c:
   - `sumBp_c = Σ bp values` of the sources in c, checked;
   - `factorNumerator_c = 10000 + sumBp_c`, which must be ≥ 0, otherwise `INVALID_STATE`. This is checked for inactive categories too.
3. Start with `v = flatTotal`. Then, for each category in ascending `id` order (UTF-16 code-unit order; content IDs are ASCII):
   - **inactive:** skipped. Factor 1; its sources still appear in the breakdown.
   - **active with `factorNumerator_c = 10000`:** skipped. The factor is exactly 1, so v is unchanged *(new in v2)*.
   - **otherwise:** `v = (v × factorNumerator_c) / 10000`, two correctly rounded binary64 operations in that order. If the new v is not ≤ 2^53 − 1, `NUMERIC_LIMIT` *(new in v2)*.
4. Return v.

### Supported range (new in v2)
- **Range:** flatTotal and every partial value must lie in [0, 2^53 − 1]. In each step `v ≤ 2^53 − 1` and `factorNumerator ≤ 2^53 − 1`, so the product is below 2^106, far inside the finite binary64 range. **The result is therefore never `Infinity` or `NaN`.**
- **Intermediate values are checked in `id` order.** A partial value out of range is refused even if a later category would bring it back down. Example: 2^52 × 2 = 2^53 is refused before a later × 0.5. Reordering is not allowed, because the binary64 result depends on the order (`stats.order.001`).
- **Do derived stats exceed the exact integer range before consumers quantise them? No.**
  - A derived stat is a binary64 real in [0, 2^53 − 1]. It is not necessarily an integer.
  - Above 2^52 it has no fractional precision left.
  - Consumers that need integers quantise it with their own rule. Combat v2 recommends `rawMilli = roundHalfUp(attack × 1000)` (`combat.md` v2). That quantisation has its own limit: attack ≤ (2^53 − 1)/1000.
- **Impact:** none for W1 or W2 content, whose values are many orders of magnitude below 2^53.

### Breakdown
- **Contents:** `flatTotal`, the flat source IDs, and per category `(categoryId, kind, active, sumBp, factorNumerator, sourceIds)`.
- **Ordering:** categories appear in ascending id order.
- **Consistency:** the same function produces the value and the breakdown, so recomposing the breakdown with the rule above (including the neutral skip) always reproduces the value exactly.

### Notes
- **World 2 hooks:** `cat.research` and `cat.mastery_tree` are registered but inactive in W1, so their factor is 1 however large their sources are (Bible §3).
- **Consumers round:** this function returns a double. A consumer that needs an integer (for example damage) applies its own rule (`combat.md` v2).
- **Luau parity:** the evaluation is binary64 multiplication and division in a fixed order with no fused operations. A Luau kernel must use the same order: multiply, then divide, per category, in ascending id order. Its parity fixtures (`stats.order.001`) pin the last bit.

Fixtures: `spec/fixtures/stats.v2.json` (fixture version 2: every v1 case kept unchanged, plus neutral, range, order, World 2 hook and malformed-input cases).

## v1 (superseded by v2 in S0.1; kept for history)

Implements the approved rule of explicit additive pools plus a limited number of controlled multiplier categories (R05.17, R08.10).

### Inputs
- `base`: safe integer ≥ 0.
- **Sources:**
  - `{ sourceId, kind: "flat", value }`, where value is a safe integer ≥ 0 in S0;
  - `{ sourceId, kind: "bp", categoryId, value }`, where value is a safe integer and may be negative.
- **Categories:** `{ id, kind: "additivePool" | "multiplier", active }`. `kind` is governance metadata; both kinds evaluate the same way.

### Evaluation (binary64, in exactly this order)
1. `flatTotal = base + Σ flat values`, checked.
2. For each category c, `sumBp_c = Σ bp values` of the sources in c (checked), and `factorNumerator_c = 10000 + sumBp_c`, which must be ≥ 0 (otherwise `INVALID_STATE`).
3. `v = flatTotal`. Then, for each **active** category in ascending `id` order (string order): `v = (v × factorNumerator_c) / 10000`.
4. Inactive categories contribute a factor of 1. Their sources still appear in the breakdown.

### Errors
- Duplicate category ID, duplicate source ID, or unknown kind: `INVALID_CONTENT`.
- A source referring to an unregistered category: `UNKNOWN_CATEGORY`.

### Breakdown
The breakdown returns `flatTotal`, the flat source IDs, and per category `(categoryId, kind, active, sumBp, factorNumerator, sourceIds)`. The same function produces the value and the breakdown, so recomposing the breakdown with the rule above always reproduces the value exactly.

### Notes
- **World 2 hooks:** `cat.research` and `cat.mastery_tree` are registered but inactive in W1, so their factor is 1 (Bible §3: no W2 multipliers in the W1 baseline).
- **Consumers round:** this function returns a double. A consumer that needs an integer (for example damage) applies its own rounding rule (`combat.md`).

Fixtures (v1): `spec/fixtures/stats.v1.json`, replaced in S0.1 by `stats.v2.json`, which keeps every v1 case unchanged.
