# Random numbers

## v1

### Generator: xoshiro128** 1.1 (Blackman and Vigna)
State: four unsigned 32-bit words (s0, s1, s2, s3), never all zero. All arithmetic is mod 2^32. `rotl(x, k) = (x << k) | (x >> (32 − k))`.
```
result = rotl(s1 * 5, 7) * 9
t  = s1 << 9
s2 ^= s0
s3 ^= s1
s1 ^= s2
s0 ^= s3
s2 ^= t
s3 = rotl(s3, 11)
return result
```
- **Reference check:** this is the published reference (`prng.di.unimi.it/xoshiro128starstar.c`, version 1.1). The step function was checked line by line on 13 Nov 2026.
- **Implementation notes:** JavaScript uses `Math.imul` and `>>> 0`. Luau multiplies by 5 and 9 within 2^35, which is exact in doubles, and uses `bit32` for shifts, rotations and xors.
- **Not Roblox `Random`:** Roblox `Random` is not used for anything that must replay.

### Stream identity encoding
A stream is `(root, purpose, entity, counter)`. Its encoding concatenates, for each field in this order:
```
"legion.rng.v1", root, purpose, entity, decimal(counter)
```
For each field, the encoding writes a 4-byte big-endian unsigned length, then the field's UTF-8 bytes.
- **Counter:** a safe integer ≥ 0, written in canonical decimal (no sign, no leading zeros).
- **String fields:** non-empty, well-formed (no lone surrogates), at most 1024 UTF-8 bytes.
- **Violations:** any of the above gives `INVALID_STREAM_ID`.
- **Injectivity:** the length prefixes make the encoding injective. ("ab", "c") and ("a", "bc") give different bytes.

### State initialisation
- `digest = SHA-256(encoding)`.
- State words = big-endian u32 of digest bytes 0..15.
- If all four are zero, use bytes 16..31. If those are also zero, `RNG_ZERO_STATE`. The all-zero state is a fixed point of the generator.

### Bernoulli trials
**Threshold T:**
- From basis points `bp ∈ [0, 10000]` (integer): `T = ⌊bp · 2^32 / 10000⌋`, computed exactly. Any other bp value gives `INVALID_PROBABILITY`.
- From a probability p (finite double in [0, 1]): `T = ⌊p · 2^32⌋`, which is exact because it scales by a power of two. A value outside [0, 1] gives `INVALID_PROBABILITY`. A non-zero p below 2^−32 gives `PROBABILITY_TOO_SMALL`.

**Trial:** a trial consumes **exactly one** draw u and succeeds if and only if `u < T`. This holds even for T = 0 (never succeeds) and T = 2^32 (always succeeds).

### uniformInt(lo, hi), inclusive
1. lo and hi must be safe integers, otherwise `INVALID_NUMBER`. `lo ≤ hi`, otherwise `INVALID_RANGE`.
2. `span = hi − lo + 1 ≤ 2^32`, otherwise `RANGE_TOO_LARGE`.
3. `limit = span · ⌊2^32 / span⌋`.
4. Repeat: draw u (one draw per attempt). If `u < limit`, return `lo + (u mod span)` and the number of attempts.
5. After 1000 attempts: `RNG_REJECTION_GUARD`. This has probability ≤ 2^−1000 for a correct generator; it exists so that a broken generator fails instead of hanging.

Boundaries:
- `span = 1`: exactly one draw, returns lo.
- `span = 2^32`: never rejects, returns `lo + u`.
- `span = 2^31 + 1`: worst case, rejection probability ≈ 0.5.

### Tests
- **Replay:** exact sequences for fixed stream IDs, computed by `spec/oracle/rng_oracle.py`.
- **Distribution:** chi-square and binomial interval tests at fixed seeds with a pre-declared α = 0.001.

These two kinds of test are kept separate.

### State boundary (S0.1 hardening; no valid result changes, spec stays v1)
The state rule above ("four unsigned 32-bit words, never all zero") is enforced at **every** public entry point: `nextU32`, `bernoulli` and `uniformInt`.
- **Valid state:** a genuine array of exactly four own, defined entries, each an integer in [0, 2^32 − 1].
- **Refused with `INVALID_STATE`:** anything else, including:
  - an array with missing entries (`new Array(4)`) or `undefined` or `null` entries;
  - the wrong length, fractions, negative numbers or 2^32;
  - strings, array-like objects and typed arrays.
- **Zero state:** all four words zero gives `RNG_ZERO_STATE`.
- **Order of checks:** the state is checked before any other argument.
- **Generator step:** the step itself is private to the generator module and runs only on a validated state, so there is no unchecked entry point. A non-zero state never steps to the zero state, because the xoshiro linear engine is a bijection that fixes zero. Validated states therefore stay valid.
- **Mutation:** a caller that mutates a returned state is caught at the next call.
- `stateFromDigest` accepts only a 32-byte `Uint8Array`, otherwise `INVALID_STATE`.
- A future hot-path variant may skip validation only if its precondition is documented and enforced at the boundary that feeds it.

Fixtures: `spec/fixtures/rng.v1.json` (fixture version 2 adds explicit-state `nextFromState` cases: one hand-derived step, one oracle-derived step, and seven refusals).
