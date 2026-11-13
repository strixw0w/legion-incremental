# Safe integers and rounding

## v1

### Constants
- `MAX_SAFE = 2^53 − 1 = 9,007,199,254,740,991`
- `2^52 = 4,503,599,627,370,496`

### Safe-integer operations
`add(a, b)`, `sub(a, b)` and `mul(a, b)`:
- **Inputs:** both operands must be safe integers, otherwise `INVALID_NUMBER`.
- **Evaluation:** the IEEE-754 operation is performed once and the result is checked. A result outside ±`MAX_SAFE` gives `NUMERIC_LIMIT`.
- **Why the check is sound:** for integer inputs, an exact result outside the range rounds to a double at or beyond ±2^53, which fails the check. An exact result inside the range is represented exactly.

**Intermediate values are checked.** In a compound expression every intermediate value is checked, not only the final result. Example: `(2^52 × 4) ÷ 8` fails with `NUMERIC_LIMIT` at the product, even though the mathematical result 2^51 would fit. An implementation may reorder an expression to avoid an intermediate overflow only where a spec says so (`remainder.md`).

### Exact division
`divRem(a, b)`, for a ≥ 0 and b ≥ 1 (both safe):
- **Result:** q and r with `a = q·b + r` and `0 ≤ r < b`.
- **Algorithm:**
  1. Start with `q = floor(a / b)`.
  2. While `q > 0` and `q·b > a`, decrement q.
  3. While `(q + 1)·b ≤ a`, increment q.
  4. Set `r = a − q·b`.
- **Why the correction is needed:** floating division alone can be off by one near 2^53. For example, `a = 2^53 − 2`, `b = 2^53 − 1` gives `a/b = 1.0` in binary64, but q must be 0.
- **Ceiling:** `ceilDiv(a, b) = q + (r > 0 ? 1 : 0)`.
- **Errors:** `b < 1` or `a < 0` gives `INVALID_NUMBER`.

### roundHalfUp
`roundHalfUp(x)` for finite x (otherwise `INVALID_NUMBER`):
- If |x| ≥ 2^52, return x. Every such double is already an integer.
- Otherwise `f = floor(x)` and `d = x − f`, which is exact in this range. Return `f + (d ≥ 0.5 ? 1 : 0)`.
- Halves round toward +∞: `2.5 → 3`, `−2.5 → −2`.

`roundHalfUpToSafeInt(x)` applies `roundHalfUp`, then requires a safe integer (`NUMERIC_LIMIT` otherwise).

**Forbidden:** `floor(x + 0.5)`. It returns 1 for `x = 0.49999999999999994`, and `2^52 + 2` for `x = 2^52 + 1`, because `x + 0.5` is rounded before the floor.

### mulDivRem (added in S0.1; no existing operation changed)
`mulDivRem(a, m, d)`, for safe integers a ≥ 0, m ≥ 0 and d ≥ 1 (otherwise `INVALID_NUMBER`):
- **Result:** `q = ⌊a·m / d⌋` and `r = a·m mod d`, exactly.
- **Errors:** `q > 2^53 − 1` gives `NUMERIC_LIMIT`. This is the only failure: the product a·m (up to about 2^106) is never formed, so there is no intermediate overflow.
- **Algorithm:**
  1. If the binary64 product `a·m` is ≤ 2^53 − 1, it is exact (a true product above 2^53 − 1 rounds to at least 2^53), so return `divRem(a·m, d)`.
  2. Otherwise write `a = qₐ·d + b` with `divRem` (0 ≤ b < d). Then `q = qₐ·m + ⌊b·m / d⌋` and `r = b·m mod d`. The term `qₐ·m ≤ q` is computed with checked multiplication and addition.
  3. `⌊b·m / d⌋` and `b·m mod d` come from binary long multiplication over the bits of m, most significant first, keeping `b·prefix = q·d + r` with `0 ≤ r < d`:
     - **double:** `q = 2q`; if `r ≥ d − r` then `r = r − (d − r)`, `q = q + 1`; otherwise `r = 2r`;
     - **bit set:** if `r ≥ d − b` then `r = r − (d − b)`, `q = q + 1`; otherwise `r = r + b`.
- **Why every step is exact:** each operand and each result of `+`, `−` and the comparisons is a safe integer (`r < d`, `q ≤ prefix ≤ m`), and IEEE-754 returns an exact result whenever it is representable. At most 53 iterations.
- **Luau:** the same steps use only `+`, `−`, comparisons, `x % 2` and `(x − x % 2) / 2` on integers below 2^53, which Luau's doubles evaluate identically. `divRem` must keep its correction loops; a bare `//` is not enough near 2^53.

Fixtures: `spec/fixtures/numeric.v1.json` (fixture version 2 adds the `mulDivRem` cases).
