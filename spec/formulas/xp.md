# EXP thresholds and awards

## v2

Current version (S0.1, 2026-11-13).

**Changes from v1:**
- Awards are spent level by level, so `expIntoLevel + award` is never formed.
- Tables and states are validated as dense values.

**Impact:**
- **Identical results:** every award that v1 accepted gives the same level, `expIntoLevel` and level-up list in v2.
- **Awards v1 refused:** awards that v1 refused with `NUMERIC_LIMIT`, because `expIntoLevel + award` exceeded 2^53 − 1, now give the exact result. They give `XP_TABLE_EXHAUSTED` if they run past the end of the table.
- **Unchanged parts:** curve, table builder, table artifact and cumulative report.

### Indexing, curve and table (unchanged from v1)
See v1 below. In addition, a table must be a **dense** array: every index from 0 to N − 1 must hold a safe integer ≥ 1. A missing or `null` entry gives `INVALID_TABLE`. The candidate table artifact and its fingerprint are unchanged.

### Awards (changed in v2)
`applyExpAward(state, award, table, maxLevelUps)` is atomic: it either applies the whole award or raises an error with the caller's state unchanged.

1. **Validate:**
   - the table (dense, safe integers ≥ 1, non-decreasing: `INVALID_TABLE`);
   - the state, which must be an object (`INVALID_STATE`), with `1 ≤ level ≤ N + 1` (`INVALID_STATE`), `expIntoLevel` a safe integer ≥ 0 (`INVALID_NUMBER`), and `expIntoLevel < T(level)` while `level ≤ N` (`INVALID_STATE`);
   - `award`, a safe integer ≥ 0;
   - `maxLevelUps`, a safe integer ≥ 1 (`INVALID_NUMBER`).
2. **Spend the award level by level.** Start with `progress = expIntoLevel` and `left = award`. While `level ≤ N`:
   - `need = T(level) − progress`. This is exact and between 1 and T(level).
   - If `left < need`, stop.
   - Otherwise `left = left − need`, `progress = 0`, the level increases by one, and the new level is recorded. Recording more than `maxLevelUps` levels gives `LEVEL_UP_GUARD`.
3. **End of table.** If `level = N + 1` and `progress > 0` or `left > 0`, the award runs past the end of the table: `XP_TABLE_EXHAUSTED`. The EXP is **never discarded or clamped**. As in v1, a state at level N + 1 that already holds EXP refuses every award, including 0.
4. **Return** `(level, progress + left, levelUps)`. Here `progress + left < T(level) ≤ 2^53 − 1`, so the sum is exact. Level-ups are listed in ascending order. In the engine (S1+) they are emitted as one event per level at the same timestamp.

**No `NUMERIC_LIMIT`:** every intermediate is at most the award or a threshold, so the result always equals unbounded-integer arithmetic. The only refusals are validation, `LEVEL_UP_GUARD` and `XP_TABLE_EXHAUSTED`.

**Properties (tested against unbounded integers):**
- **Split awards:** awarding a then b gives the same final level, `expIntoLevel` and concatenated level-ups as awarding a + b. This holds for any thresholds up to 2^53 − 1 and any awards whose total is ≤ 2^53 − 1. If the combined award is refused for exhaustion, some part is refused too.
- **Conservation:** thresholds consumed + final `expIntoLevel` = starting `expIntoLevel` + award.

**Luau parity:** only comparisons and subtractions of safe integers, with no products. A Luau kernel reproduces this exactly.

Fixtures: `spec/fixtures/xp.v2.json`.
- **Fixture version 2:**
  - every v1 case is kept except `xp.award.overflow.001`, whose expected outcome changed from `NUMERIC_LIMIT` to `XP_TABLE_EXHAUSTED` and which is replaced by `xp.award.near-max.exhausted.001`;
  - new cases cover reviewer reproductions, near-maximum awards, award sequences, the guard boundary and malformed tables.
- **New fixture operation:** `awardSequence` applies several awards in order.

## v1 (superseded by v2 in S0.1; kept for history)

### Indexing
- `T(L)` = EXP needed to go from level L to level L + 1, for L ≥ 1.
- A table of length N stores `T(1)..T(N)` as `thresholds[0..N−1]`. The highest level reachable with it is N + 1.
- Character state is `(level, expIntoLevel)`, with `1 ≤ level ≤ N + 1` and `0 ≤ expIntoLevel < T(level)` while `level ≤ N`.

### Curve family `powerGeometric` (candidate)
`T(L) = roundHalfUp(a · L^p · g^(L−1))`, with `a > 0`, `p ≥ 0`, `g ≥ 1`.
- **Table builder:** the lab evaluates the curve in binary64 as `(a · pow(L, p)) · pow(g, L − 1)`. Every result must be a safe integer ≥ 1 and non-decreasing.
- **Errors:** an invalid curve or length < 1 gives `INVALID_TABLE`. A non-finite value or a threshold above 2^53 − 1 gives `NUMERIC_LIMIT`.
- **Engines read tables, not curves.** Both the lab's engine and the game read the versioned **integer table artifact**; neither recomputes the curve at runtime.

**Before a table artifact may be used**, `spec/oracle/xp_oracle.py` must reproduce it independently:
- with `decimal` at 60 and 120 significant digits, using correctly rounded `ln` and `exp`;
- with curve parameters taken as the decimal literals written in JSON.

**Acceptance requires all three of these:**
- both precisions round to the same integer;
- the 120-digit value is farther than `10^−9 · max(1, |v|)` from a `.5` rounding boundary;
- the lab's integer equals the oracle's integer.

An unstable entry means the coefficients must change.

### Thresholds vs cumulative EXP
- **Thresholds only:** only single-level thresholds are ever compared in authoritative state, so only thresholds must be safe.
- **Cumulative table:** `C(L) = Σ_{i<L} T(i)` (with `C(1) = 0`) is report-only. It can leave the safe range many levels before any single threshold does. For example, two thresholds of 2^52 are each safe, but C(3) = 2^53 is not.
- **Report:** `lastSafeCumulativeLevel` is the highest L with a safe `C(L)`. Entries beyond it are absent, never clamped.
- **Beyond the stored table**, the S0-R01 report gives approximate, report-only estimates of the first level whose threshold, and separately whose cumulative EXP, would exceed 2^53 − 1.

### Awards
`applyExpAward(state, award, table, maxLevelUps)`, atomic. It either applies the whole award or raises an error with the state unchanged.
1. Validate the table, the state, `award ≥ 0` (safe) and `maxLevelUps ≥ 1`.
2. `total = expIntoLevel + award`, checked (`NUMERIC_LIMIT`).
3. While `level ≤ N` and `total ≥ T(level)`: subtract `T(level)` from total, increment level, and record the new level. Recording more than `maxLevelUps` levels gives `LEVEL_UP_GUARD`.
4. If `level = N + 1` and `total > 0`, the award runs past the end of the table: `XP_TABLE_EXHAUSTED`. The EXP is **never discarded or clamped**; the table must be extended through a content change.
5. Return `(level, total, levelUps)`. Level-ups are listed in ascending order. In the engine (S1+) they are emitted as one event per level at the same timestamp.

Property: awarding a then b equals awarding a + b. Fixtures (v1): `spec/fixtures/xp.v1.json`, replaced in S0.1 by `xp.v2.json` (`xp.award.overflow.001` retired).
