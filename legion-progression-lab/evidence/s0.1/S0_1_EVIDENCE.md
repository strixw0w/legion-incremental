# S0.1 evidence — hardening corrections after the independent S0 review

**Increment:** S0.1, corrections to S0 only (owner authorisation "Independent S0 Review and S0.1 Authorisation", items 1–8).
**Date:** 2026-11-13.

**Status:**
- uncommitted, together with S0, awaiting independent review and owner acceptance;
- not pushed (the GitHub remote is public);
- **S1 not started.**

**Repository:** `Documents/GitHub/legion-incremental`, branch `main`. The last commit is the documentation checkpoint `0209d93`, and all S0 and S0.1 work is untracked.

**Baseline for every "before" result:** a copy of the S0 tree that is byte-identical to the reviewed S0 ZIP. 116 of 116 lab and spec files were checked against its `MANIFEST.txt`, with 0 differences.

**Not done, per the authorisation:**
- no S1 combat engine, recruits, classes, professions, offline settlement, Roblox gameplay or dashboard;
- no change to the XP curve candidate, the XP table artifact or the content pack;
- no commit, no push, and no deletion of the old workspace.

---

## 1. Summary

| Review item | S0 result (reproduced) | S0.1 result | Spec change |
|---|---|---|---|
| 1. Per-hour partition invariance | 2 h at rate 2^53−1 in one call: `NUMERIC_LIMIT`; as 2 × 1 h: 18,014,398,509,481 units, milliRem 982 | one call = two calls = 18,014,398,509,481 units, `{msRem 0, milliRem 982}` | `remainder.md` v1 → **v2** |
| 2. Stat evaluation | `evaluateStat(M, [], [neutral active])` = 9,007,199,254,740,990; 30 large categories: `Infinity`; then a factor of 0: `NaN` | 9,007,199,254,740,991; `NUMERIC_LIMIT`; `NUMERIC_LIMIT` | `stats.md` v1 → **v2** |
| 3. Combat rounding | `raw 100, crit 10050, mitigation 1` gives 100 | exact contract: 100 × 1.005 = 100.5 gives **101** | `combat.md` v1 → **v2** |
| 4. EXP award arithmetic | `({1, M−1}, 2, [M, M])`: `NUMERIC_LIMIT`; as 1 + 1: level 2, 1 EXP | level 2, 1 EXP, `levelUps [2]`, for both | `xp.md` v1 → **v2** |
| 5. External state / dense arrays | `assertRngState(new Array(4))` accepted; `applyExpAward(..., new Array(2), ...)` returned `{1, 5}` | `INVALID_STATE`; `INVALID_TABLE` | `rng.md` v1 (boundary added), `xp.md` v2 |
| 6. Receipt immutability | mutating a receipt to 999 made the replay report 999 | mutation throws `TypeError`; replay reports 5 | `ledger.md` v1 (boundary added) |
| 7. Ledger performance | (not a defect) | `planning/S1_LEDGER_BENCHMARK_PROPOSAL.md`, plus an indicative timing | `ledger.md` v1 (performance note) |
| 8. Scope and evidence | — | sections 4–8 of this document | — |

**Related defects found while fixing.** They were not in the review; all are reproduced and fixed:
- the all-zero RNG state was accepted by `nextU32`, `bernoulli` and `uniformInt`;
- a sparse `lines` array gave `INVALID_JSON_VALUE` instead of `INVALID_TX`;
- a sparse `sources` array crashed with a `TypeError`;
- **the committed history could be cleared through the returned ledger, allowing the same transaction to be paid twice (balance 10 instead of 5);**
- balances could be overwritten through the returned ledger.

**Verification at a glance:**
| Check | Result |
|---|---|
| Type check | clean |
| Default tests | 459 passed (S0: 329) |
| Statistical tests | 7 passed (unchanged) |
| Fixture conformance | 252 cases (52 normal, 94 boundary, 106 failure), 0 problems (S0: 179) |
| Exported schemas | 3 of 3 match their source |
| Independent Python oracles | 5 groups, 0 failing. Every non-content fixture is oracle-checked; 8 content structure cases are hand-only, as in S0. The 200-entry XP artifact is unchanged and stable. |
| Curve preview, run twice | semantic fingerprint `24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9` both times, **identical to S0**; `semantic.json` is byte-identical to S0's |
| Mutation check | 19 of 19 planted bugs detected (4 from S0 re-run, 15 new); every file restored with an identical hash |
| New fixtures run on the unchanged S0 code | 61 of 252 fail on S0, the regression fixtures detecting the S0 defects (section 5) |
| Frozen simulator, Original v1 archive, old workspace | byte-identical |

---

## 2. Item-by-item

Notation: `M = 2^53 − 1 = 9,007,199,254,740,991`. "Before" results are from `reproductions-before.txt` (S0 baseline) and "after" results from `reproductions-after.txt` (this tree). Both come from the same script, `reproductions.mjs`.

### 2.1 Item 1 — per-hour accrual partition invariance (`src/core/numeric/remainder.ts`)
**Reproduction:**
| Call | S0 | S0.1 |
|---|---|---|
| `accruePerHour({0,0}, M, 7200000)` | `NUMERIC_LIMIT` | `{ granted: 18014398509481, state: { msRem: 0, milliRem: 982 } }` |
| `a = accruePerHour({0,0}, M, 3600000); accruePerHour(a.state, M, 3600000)` (summed) | 18,014,398,509,481, `{0, 982}` | 18,014,398,509,481, `{0, 982}` |

**Cause.** The S0 chain first formed the milli-unit total `⌊(msRem + rate·dMs)/3.6e6⌋` (2M milli-units here, above 2^53 − 1) before dividing by 1000.

**Fix:**
- **One division.** For positive integers, `⌊⌊X/a⌋/b⌋ = ⌊X/(ab)⌋`, so the chain is one exact division: `X = milliRem·3.6e6 + msRem + rate·dMs`, `granted = ⌊X/3.6e9⌋`, and `rest = X mod 3.6e9`, split back into `(msRem, milliRem)`.
- **No big product.** `rate·dMs` is never formed. A new primitive, `mulDivRem(a, m, d)` (`numeric.md`), gives `⌊a·m/d⌋` and `a·m mod d` exactly for all safe inputs. It divides the product directly when the product is safe, and otherwise uses binary long multiplication with a running remainder. Every step is an exact safe-integer operation, so Luau can reproduce it.
- **Remainder carry.** The state is added to the remainder (a sum below 2·3.6e9) and carries at most once.

**Precise domain** (`remainder.md` v2):
- **Inputs:** every valid state with every non-negative safe rate and duration.
- **Only refusal:** a single call whose own grant exceeds 2^53 − 1, which a ledger balance could not hold anyway.
- **Examples:** rate M for 3.6e9 ms (1,000 h) gives exactly M; one more millisecond gives `NUMERIC_LIMIT`.
- **Restated G1:** any partition gives the same total and state whenever the total is ≤ 2^53 − 1. Otherwise the single call refuses, and the parts cannot be summed in the safe range either.
- **Compatibility:** results are identical to v1 wherever v1 succeeded, and v1 saves load unchanged.

**Regression fixtures** (`remainder.v2.json`):
- `remainder.perhour.reviewer.001`, `.reviewer-split.001`;
- `.max-granted.001`, `.max-granted.split.001`;
- `.slow-max-duration.001`;
- `.overflow.001`, `.overflow.split.001`;
- `.max-inputs.001`;
- `remainder.timeline.rate-change.001`, `.rate-change.split.001`, `.carry.001`;
- `remainder.perhour.bad-state.001`–`.003`, `.bad-rate.001`.

Also `numeric.muldivrem.*` (11 cases) in `numeric.v1.json`.

**Independent references:**
- *Python:* `exact_oracle.py` computes the whole chain as one division with unbounded integers. It does not use the lab's method.
- *BigInt property tests* (`remainder.property.test.ts`):
  - single calls across the full safe range, 10,000 runs, including overflow;
  - partitions with rates up to M, 5,000 runs;
  - rate-change timelines with arbitrary splits, 3,000 runs;
  - persisted-state round trips;
  - `mulDivRem` against BigInt, 20,000 runs.

### 2.2 Item 2 — stat evaluation (`src/core/formulas/stats.ts`)
**Reproduction:**
| Call | S0 | S0.1 |
|---|---|---|
| `evaluateStat(M, [], [{cat.a, additivePool, active}]).value` | 9,007,199,254,740,990 | 9,007,199,254,740,991 |
| `evaluateStat(M, 30 sources of M−10000 bp, 30 active multipliers)` | `Infinity` | `NUMERIC_LIMIT` |
| the same, then a category with factor 0 | `NaN` | `NUMERIC_LIMIT` |
| `evaluateStat(1, new Array(1), cats)` | `TypeError` (not a lab error) | `INVALID_CONTENT` |

**Fix** (`stats.md` v2):
- **Neutral skip.** An active category whose factor is exactly 1 (sumBp = 0) is skipped. Inactive categories are skipped as before.
- **Range.** flatTotal and every partial value must lie in [0, 2^53 − 1], otherwise `NUMERIC_LIMIT`. With `v ≤ 2^53 − 1` and `factorNumerator ≤ 2^53 − 1`, every product is below 2^106, so the result is never `Infinity` or `NaN`.
- **Input checks.** Categories and sources must be dense arrays of objects, with a boolean `active` and non-empty IDs (`INVALID_CONTENT`).

**Answer to "may derived stats exceed the exact integer range before consumers quantise them?" — No.**
- Derived stats are binary64 reals in [0, 2^53 − 1], refused above that.
- They are not necessarily integers; above 2^52 they carry no fraction.
- Consumers quantise. Combat v2 recommends `rawMilli = roundHalfUp(attack × 1000)`, which has its own limit, attack ≤ (2^53 − 1)/1000.

**Restriction stated:** partial values are checked in id order. A partial value out of range is refused even if a later factor would shrink it (2^52 × 2 before × 0.5). The order cannot change, because the binary64 result depends on it.

**Impact:**
- the neutral skip changes results only where `v × 10000 / 10000 ≠ v` in binary64 (near 2^53 in practice; a scan of base values 1–199 found no difference);
- the range check replaces S0's out-of-range, `Infinity` or `NaN` results.

**Regression fixtures** (`stats.v2.json`):
- `stats.neutral.max.001`;
- `stats.neutral.w2-hooks.001` (the real W2 hook IDs with huge sources, plus a cancelled pool);
- `stats.order.001` (category order pins the last binary64 bit: 1.1330000000000002 in id order vs 1.133 in listed order);
- `stats.range.largest.001`;
- `stats.overflow.final.001`, `.intermediate.001`, `.many.001`, `.nan.001`;
- `stats.bad-active.001`, `stats.null-source.001`, `stats.inactive-negative.001`.

**Tests** (`stats.test.ts`):
- neutral identity for any base and up to 8 cancelled categories, 2,000 runs;
- W2 hooks taken from the actual candidate content pack;
- a never-`NaN`/`Infinity` property, 5,000 runs;
- order and malformed-input tests.

**Independent reference:** `exact_oracle.py` replays the spec's binary64 order with Python floats (IEEE-754, correctly rounded like JavaScript) and separately checks that the result is within 10^−12 of the exact rational value.

### 2.3 Item 3 — combat rounding semantics (`src/core/formulas/combat.ts`)
**Reproduction:**
| Call | S0 | S0.1 |
|---|---|---|
| `damagePerHit({raw:100, crit:true, critMultBp:10050, mitigation:1, minDamage:1})` | 100 (binary64 `10050/10000 = 1.00499999999999989…`) | v1 input shape refused (`INVALID_NUMBER`) |
| `damagePerHit({rawMilli:100000, crit:true, critMultBp:10050, mitigation:mitigationRatio(0,100), minDamage:1})` | (v2 shape) | **101** |

**Recommended evaluation contract** (`combat.md` v2, implemented):
- **Exact inputs:**
  - `rawMilli` (raw damage in thousandths, a safe integer ≥ 1);
  - `crit` (a boolean);
  - `critMultBp` (a safe integer ≥ 10000);
  - `mitigation = {num, den}` with `1 ≤ num ≤ den`, normally `mitigationRatio(D, K) = {K, K + D}`;
  - `minDamage ≥ 1`.
- **Value:** `V = rawMilli/1000 × c/10000 × num/den`, exactly, with `c = critMultBp` or 10000. Then `result = max(minDamage, ⌊V + 1/2⌋)`. **An exact half always rounds up.** There is no binary64 rounding and no epsilon.
- **Evaluation:**
  - mitigation is applied first, so no intermediate exceeds `rawMilli` or the result;
  - three `mulDivRem` calls, one split and one carry;
  - the half-up test reduces to `n ≥ 5·10^6` on an integer n, because 10^7 is even.
- **Domain:** every input above. The only refusal is a result above 2^53 − 1. Example: `rawMilli = M` with a 2000× crit and mitigation 1/2 returns exactly M.
- **Display factor:** `mitigationFactor` (binary64) is kept for display and reports only; damage never uses it.

**Recommendation for S1 (candidate):**
- **Attack:** derived attack enters as `rawMilli = roundHalfUp(attack × 1000)`. Thousandths keep sub-integer bonuses meaningful at low levels.
- **Defence:** S1 must choose how a derived defence becomes an integer (candidate: `roundHalfUp`).

**Luau parity implications:**
- **Exact in both engines:** damage uses only integer-valued double operations below 2^53 (`+`, `−`, comparisons, `% 2`, halving, and `divRem` with its correction loops). A Luau kernel following the spec is exact, meeting architecture §17.5 ("damage … integer-exact in both engines").
- **Binary64 parts:** hit chance stays binary64. It is deterministic under IEEE-754 if the operation order is kept and no fused multiply-add is used. The M2 parity runner should also check `combat.hit.*` with exact tolerance.

**Boundary cases found by search** (v1 binary64 vs exact, over small raws, multipliers and K/D pairs), now fixtures:
| Fixture | Exact value | v1 | v2 |
|---|---|---|---|
| `combat.dmg.reviewer.001` | 100 × 1.005 = 100.5 | 100 | 101 |
| `combat.dmg.third.001` | 100 × 1.005 / 3 = 33.5 | 33 | 34 |
| `combat.dmg.five-sixths.001` | 120 × 1.015 × 5/6 = 101.5 | 101 | 102 |
| `combat.dmg.half-mitigation.001` | 200 × 1.005 × 3/6 = 100.5 | 100 | 101 |
| `combat.dmg.k100-d25.001` | 375 × 1.015 × 100/125 = 304.5 | 304 | 305 |
| `combat.dmg.below-half.large-den.001` | 2.5 − 1/999,999,937,000 | — | 2 |
| `combat.dmg.half.large-den.001` | 2.5 | — | 3 |

**Other new damage fixtures:**
- `combat.dmg.milli-half.001`, `.milli-below-half.001`;
- `.min-damage.001`;
- `.max.001`, `.huge-den.001`;
- `.overflow.002`, `.not-safe.001`;
- `.bad-ratio.001`, `.bad-crit-flag.001`;
- `combat.mitratio.*` (4 cases).

The 8 v1 damage cases are restated in v2 inputs with unchanged expected values. `combat.dmg.overflow.001` is retired: it tested v1's binary64 `raw = 2^53`.

**Independent references:**
- *Python:* `exact_oracle.py` uses exact Fractions.
- *BigInt property:* 20,000 runs across the full safe range, including `NUMERIC_LIMIT`.
- *Monotonicity property:* more raw damage, a larger crit multiplier or less defence never lowers damage.

**All damage coefficients remain candidate.**

### 2.4 Item 4 — EXP award arithmetic (`src/core/formulas/xp.ts`)
**Reproduction:**
| Call | S0 | S0.1 |
|---|---|---|
| `applyExpAward({1, M−1}, 2, [M, M], 10)` | `NUMERIC_LIMIT` | `{ level: 2, expIntoLevel: 1, levelUps: [2] }` |
| the same as two awards of 1 | level 2, 1 EXP, `[2]` | level 2, 1 EXP, `[2]` |

**Fix** (`xp.md` v2):
- **Level by level.** The award is spent level by level: `need = T(level) − progress`. If the remainder of the award covers it, it is subtracted and the level rises; otherwise the loop stops. `expIntoLevel + award` is never formed.
- **No overflow.** Every intermediate is at most the award or a threshold, so `NUMERIC_LIMIT` can no longer occur in an award.

**Preserved:**
- atomic failure (tested: the caller's state object is unchanged after a refused award);
- exact conservation (property test);
- the level-up guard (exactly `maxLevelUps` level-ups are allowed; one more is refused);
- table exhaustion, including the v1 rule that a state at N + 1 holding EXP refuses every award;
- ordered level-up lists.

**Expected-value change:** `(M − 1) + 2` on the one-entry table `[M]` gave `NUMERIC_LIMIT` in v1 and now gives `XP_TABLE_EXHAUSTED`. The real reason is the 1 EXP left with no threshold. The fixture is retired and replaced; see the changelog.

**Regression fixtures** (`xp.v2.json`):
- `xp.award.reviewer.001`, `.reviewer-split.001` (new `awardSequence` operation);
- `.near-max.exhausted.001`;
- `.max-award.multi.001` (award M across thresholds 3, M − 5 and M; S0 gave `NUMERIC_LIMIT`);
- `.sequence.001`;
- `.at-end-with-exp.001`;
- `.guard.exact.001`;
- `.bad-guard.001`, `.null-threshold.001`.

**Tests** (`xp.property.test.ts`, against an unbounded BigInt reference):
- single awards with thresholds up to M, 10,000 runs;
- arbitrary splits giving the same final state and concatenated level-ups, 5,000 runs.

### 2.5 Item 5 — external state and dense arrays (`src/core/rng/xoshiro128ss.ts`, `xp.ts`)
**Reproduction:**
| Call | S0 | S0.1 |
|---|---|---|
| `assertRngState(new Array(4))` | returned `[undefined ×4]` | `INVALID_STATE` |
| `applyExpAward({1,0}, 5, new Array(2), 5)` | `{ level: 1, expIntoLevel: 5 }` | `INVALID_TABLE` |
| `nextU32([0,0,0,0])` (found while fixing) | `[0, [0,0,0,0]]` | `RNG_ZERO_STATE` |
| `bernoulli([0,0,0,0], 2^31)` | `[true, zero state]` | `RNG_ZERO_STATE` |
| `uniformInt([0,0,0,0], 1, 6)` | `{ value: 1, state: zero }` | `RNG_ZERO_STATE` |
| `applyTx(empty, {lines: new Array(1)})` | `INVALID_JSON_VALUE` | `INVALID_TX` |

**Cause.** `Array.prototype.every` and `forEach` skip holes. The generator step accepted any state.

**Fix:**
- **Dense arrays.** `src/core/arrays.ts` (`assertDenseArray`, `assertRecord`) is used by `assertXpTable` (which also covers `cumulativeReport`), `evaluateStat`, ledger `lines` and `accruePerHour` state.
- **One RNG boundary.** `assertRngState` requires a genuine array of exactly four own, defined u32 entries, not all zero. Every exported RNG function (`nextU32`, `bernoulli`, `uniformInt`) validates its state first.
- **Private step.** The step is module-private and runs only on validated states. There is no unchecked entry point, and a non-zero state cannot step to zero, because the engine is a bijection fixing zero.
- **Digest input.** `stateFromDigest` requires a 32-byte `Uint8Array`.
- **Valid results unchanged:** all 37 S0 RNG fixtures pass unchanged, and the hand-derived step `[1,2,3,4] → 11520, [7,0,1026,12288]` is a new fixture.

**Regression fixtures** (`rng.v1.json`, fixture version 2):
- `rng.next.001`, `.max-words.001`;
- `.zero.001`, `.short.001`, `.null.001`, `.too-big.001`, `.fraction.001`, `.negative.001`, `.not-array.001`.

Holes cannot be written in JSON, so sparse arrays are covered by vitest.

**Tests** (`rng.test.ts`):
- 13 malformed state shapes, each tried at all four entry points (`assertRngState`, `nextU32`, `bernoulli`, `uniformInt`), plus the zero state at three entry points;
- state-before-arguments order;
- a mutated returned state caught at the next call.

Sparse tables, sources and lines are covered in `xp.test.ts`, `stats.test.ts` and `ledger.test.ts`.

### 2.6 Item 6 — committed transaction receipts (`src/core/ledger/ledger.ts`)
**Reproduction:**
| Steps | S0 | S0.1 |
|---|---|---|
| grant 5; set `result.nets[0].delta = 999`; replay | mutation accepted; replay reports **999**; balance 5 | mutation throws `TypeError`; replay reports 5; balance 5 |
| grant 5; `ledger.committed.clear()`; replay (found while fixing) | accepted; replay treated as new; **balance 10 (double grant)** | `TypeError`; replay recognised; balance 5 |
| grant 5; `ledger.balances.set('res.gold', {available: 1000000, …})` | accepted; balance 1,000,000 | `TypeError`; balance 5 |

**Fix and documented boundary** (`ledger.md`, "Immutable state boundary"):
- **Frozen values:** the ledger record, every balance record, every committed record, every result, its `nets` array and each line are frozen.
- **Read-only maps:** both maps are `FrozenMap` objects, which offer `get`, `has`, `size` and iteration only, with no `set`, `delete` or `clear`.
- **Replay** returns a frozen copy of the stored result.
- **Accepted ledgers:** `applyTx` accepts only ledgers made by `emptyLedger` or `applyTx`; a hand-built ledger gives `INVALID_STATE`.
- **No result changed:** all 15 ledger fixtures and both ledger property tests pass unchanged.
- **Luau note:** the game ledger must keep history private to its module and return copies.

**Tests** (`ledger.test.ts`):
- the reviewer's receipt mutation;
- clearing, deleting and setting history entries, and forging a payload hash;
- overwriting balances and replacing the map;
- every reachable object frozen, including replay receipts;
- forged ledgers refused;
- sparse and malformed line lists refused;
- read access, iteration and copying still work.

### 2.7 Item 7 — ledger performance for S1
**No optimisation or redesign.** The copy-on-commit design is unchanged (`ledger.md` performance note).

**Proposal:** `planning/S1_LEDGER_BENCHMARK_PROPOSAL.md` sets out:
- the question S1 must answer;
- five seeded workloads, from 1 to 50 workers and from 24 h to 30 days of simulated time (about 2.9 thousand to 4.3 million transactions; rates are candidates);
- the measurements: throughput, latency percentiles, heap growth, long-run state size and replay cost;
- the four properties every alternative must keep: replay protection, conservation, determinism and oracle branching;
- candidate alternatives;
- a candidate decision rule for owner approval.

**Indicative timing** (one run, this machine; `ledger-indicative.txt`): the cost per transaction grows linearly with history size.
| History size | Cost per transaction |
|---|---|
| empty | 26 µs |
| 39,000 transactions | 2.8 ms |

This confirms that S1 must measure before long runs. It is not acceptance evidence.

### 2.8 Item 8 — scope, versioning and evidence
**Versioning and impact:**
| Spec | Version | Meaning changed? | Impact on previously valid results |
|---|---|---|---|
| `remainder.md` | v1 → v2 | per-hour error domain | identical wherever v1 succeeded |
| `stats.md` | v1 → v2 | neutral skip; range | identical except near 2^53 or where v1 returned out-of-range, `Infinity` or `NaN` values |
| `combat.md` | v1 → v2 | damage inputs and exact rounding | differs only where v1 misrounded an exact half (section 2.3) |
| `xp.md` | v1 → v2 | award error domain | identical wherever v1 succeeded |
| `numeric.md` | v1 + `mulDivRem` | no | none |
| `rng.md` | v1 + state boundary | no (enforces the existing rule) | none |
| `ledger.md` | v1 + immutability boundary | no | none |

**Bookkeeping:**
- **Fixture files:** each family has one current file (`spec/README.md`); superseded files are in the S0 ZIP.
- **Changelog:** `CHANGELOG.md` "S0.1" lists every changed spec, fixture (including the two retired IDs), oracle and module.

**Unchanged:**
- the XP curve candidate and the table artifact (fingerprint `990fe508…0dc`);
- the content pack;
- the S0-R01 report.

**Curve fingerprint:** the report inputs and semantics are unchanged, so the semantic fingerprint is **identical to S0** (`24dd9064…b9b9`), and `semantic.json` is byte-identical. It was not replaced.

---

## 3. Remaining limitations
1. **Same author.** The oracles, fixtures and lab were all written by the same author (Claude), in different languages and with different methods:
   - unbounded integers and Fractions in Python, compared with `mulDivRem` and level-by-level arithmetic in TypeScript;
   - the stats oracle deliberately replays binary64, as the spec defines it.

   A shared misreading of a spec would not be caught. Reviewers should spot-check `combat.md` v2 (section "Evaluation without big integers") and the `mulDivRem` bit loop by hand.
2. **Vitest suite not yet run independently.** It needs the pinned Node and dependencies (`npm ci`). The reviewer's previous environment lacked them.
3. **Luau parity not yet tested.** The contracts are designed for exact Luau reproduction, but Luau parity is tested only from M2.
4. **Single platform.** Cross-platform reproduction of the full suite is still untested beyond the reviewer's Linux re-run of the S0 curve fingerprint.
5. **Hit chance stays binary64** (deterministic, order-specified). Only damage became exact.
6. **Unchosen S1 rules.** The S1 rules for converting derived stats into `rawMilli` and integer defence are candidates and are not yet chosen. They have no fixtures yet; that is S1 work.
7. **Ledger performance unmeasured.** Its scalability is not measured beyond the indicative run (item 7). The decision belongs to S1.
8. **Ledger boundary is against accident only.** It protects against accidental mutation, as the review asked, not against deliberate forging. A caller can still build a fake read-only map through `ledger.balances.constructor` and wrap it in a frozen object that `applyTx` accepts. A validating constructor for ledgers loaded from saves is S3/M6 work.
9. **Stats partial-value restriction.** In id order, an out-of-range partial value is refused even when a later factor would shrink it. This is a stated domain restriction, not exact rational evaluation (section 2.2).

---

## 4. How to reproduce
**Lab commands** (PowerShell, from `legion-progression-lab`):
```
$env:Path = "$env:LOCALAPPDATA\legion-tools\node-v24.22.3-win-x64;" + $env:Path
npm ci
npm run typecheck
npm test
npm run test:stats
npm run fixtures:check
npm run schemas:check
npm run oracle:check
npm run curve:preview     # twice; compare the printed semantic fingerprint
node evidence/s0.1/reproductions.mjs .
```
To get the S0 "before" results, point `reproductions.mjs` at an extracted copy of the S0 review ZIP's `legion-progression-lab` folder. The modules it loads import no packages, so no install is needed.

---

## 5. New fixtures run against the unchanged S0 code
`new-fixtures-on-s0-baseline.txt`: the S0 lab, byte-identical to the S0 ZIP, run on the S0.1 fixture files. 61 of 252 cases fail.

**Real S0 defects detected:**
- `stats.neutral.*` (2^53 − 2);
- `stats.overflow.*` (no error raised: S0 returned out-of-range, `Infinity` or `NaN` values);
- `stats.bad-active.001`;
- `stats.null-source.001` (`TypeError`);
- `remainder.perhour.reviewer.001` and `.max-granted.*` (`NUMERIC_LIMIT`);
- `xp.award.reviewer.001`, `.near-max.exhausted.001`, `.max-award.multi.001` (`NUMERIC_LIMIT`).

**Fail on S0 by design:**
- operations S0 does not have: `mulDivRem`, `perHourTimeline`, `nextFromState`, `mitigationRatio`, `awardSequence`;
- the v2 damage input shape.

The zero-state and sparse-array defects cannot be expressed in JSON fixtures; they are covered by vitest and shown in `reproductions-before.txt`.

---

## 6. Evidence files (`evidence/s0.1/`)
| File | Content |
|---|---|
| `S0_1_EVIDENCE.md` | this document (appendices: complete outputs) |
| `reproductions.mjs`, `reproductions-before.txt`, `reproductions-after.txt` | every reproduction on S0 and on S0.1 |
| `new-fixtures-on-s0-baseline.txt` | S0.1 fixtures on S0 code (section 5) |
| `typecheck.txt`, `test-output.txt`, `test-results.json`, `test-stats-output.txt` | type check, the full verbose default suite (459), machine-readable results, the statistical suite (7) |
| `fixtures-check.txt`, `schemas-check.txt`, `oracle-check.txt` | conformance (252), schema drift, independent oracles |
| `curve-preview-run1.txt`, `curve-preview-run2.txt`, `reproduction.txt`, `curve-preview/` | curve preview twice; fingerprint comparison with S0 |
| `mutation-check.txt` | 19 planted bugs, all detected, all files restored with identical hashes |
| `frozen-check.txt` | frozen simulator (3,012 files), Original v1 archive and old workspace: unchanged |
| `ledger-indicative.mjs`, `ledger-indicative.txt` | item 7 indicative timing |
| `s0-to-s0.1.diffstat.txt`, `s0-to-s0.1.patch` | every change from the S0 review package to S0.1 (lab and spec; excludes evidence, `node_modules` and results) |
| `git-status.txt` | repository log, status (untracked S0 and S0.1 work) and remote (public; not pushed) |
| `tool-versions.txt` | tool versions; the lockfile hash is unchanged from S0 |

Local paths are redacted to `<REPO>`, `<HOME>` and `<SCRATCH>`.

---

# Appendices: complete outputs

Each appendix is the verbatim content of the named file in `evidence/s0.1/` (local paths redacted).

## Appendix A. Type check (`typecheck.txt`)

```text
$ npm run typecheck


> legion-progression-lab@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


[exit code: 0]
```

## Appendix B. Default test suite, verbose (459 tests) (`test-output.txt`)

```text
$ npx vitest run --config vitest.config.ts --reporter=verbose


 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/purity.test.ts > purity of the deterministic core > finds the pure modules 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/arrays.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/labels.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/schema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/validate.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/errors.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/combat.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/stats.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/xp.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/hash/canonicalJson.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/ledger.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/basisPoints.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/remainder.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/rounding.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/safeInt.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/sample.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/streamId.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/xoshiro128ss.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/exportedSchemas.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureRunner.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureSchema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/report/curvePreview.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/ledger.test.ts > ledger > aggregates lines per bucket before validating 3ms
 ✓ test/ledger.test.ts > ledger > is atomic: a failing line changes nothing, and the input ledger is never mutated 1ms
 ✓ test/ledger.test.ts > ledger > replays an identical transaction without applying it twice 0ms
 ✓ test/ledger.test.ts > ledger > identical payloads replay regardless of object key order (canonical hashing) 0ms
 ✓ test/ledger.test.ts > ledger > refuses the same txId with a different payload 0ms
 ✓ test/ledger.test.ts > ledger > a failed transaction is not recorded and can succeed later 0ms
 ✓ test/ledger.test.ts > ledger > refuses overflow, including overflow while aggregating 0ms
 ✓ test/ledger.test.ts > ledger > refuses malformed transactions 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > S0 review reproduction: mutating a returned receipt cannot change the replay receipt 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > committed history cannot be cleared or rewritten through the returned ledger (S0 allowed a double grant) 1ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > balances cannot be overwritten through the returned ledger 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > every reachable object is frozen, including replay receipts 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > only ledgers made by emptyLedger or applyTx are accepted 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > refuses sparse or malformed line lists with INVALID_TX (S0 raised INVALID_JSON_VALUE) 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > values stay readable: entries can be read, iterated and copied 0ms
 ✓ test/xp.test.ts > XP table > builds the candidate table (values independently confirmed by xp_oracle.py) 2ms
 ✓ test/xp.test.ts > XP table > is non-decreasing with every threshold >= 1 0ms
 ✓ test/xp.test.ts > XP table > refuses invalid curves, empty tables and unsafe thresholds 0ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > cumulative EXP can leave the safe range while every single threshold is safe 0ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > reports separate approximate limits for the candidate curve 1ms
 ✓ test/xp.test.ts > EXP awards > applies multi-level awards in order and keeps the leftover 0ms
 ✓ test/xp.test.ts > EXP awards > never discards EXP: an award past the table end is refused as a whole 0ms
 ✓ test/xp.test.ts > EXP awards > refuses invalid state and runaway loops 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > S0 review reproduction: an award of 2 one EXP short of a 2^53 - 1 threshold 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > awards up to 2^53 - 1 cross large thresholds exactly and conserve EXP 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > keeps table-exhaustion, guard and ordering behaviour 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > is atomic: a refused award leaves the caller state object untouched 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > refuses sparse or malformed tables and states (S0 accepted new Array(2)) 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/s0-core.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > package.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-table.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/curve-preview.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/export-schemas.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/fixtures-check.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/paths.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/arrays.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/labels.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/schema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/validate.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/errors.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/combat.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/stats.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/xp.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/hash/canonicalJson.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/ledger.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/basisPoints.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/remainder.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/rounding.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/safeInt.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/sample.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/streamId.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/xoshiro128ss.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/report/curvePreview.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/exportedSchemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureRunner.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureSchema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/canonicalJson.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/combat.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/content.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/fixtures.conformance.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/fixtures.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/reference.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/isolation.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/purity.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/rng.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/runtime.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/schemaDrift.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/rng.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > tsconfig.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.stats.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/canonicalJson.test.ts > canonical JSON > sorts keys and removes whitespace 2ms
 ✓ test/canonicalJson.test.ts > canonical JSON > is independent of key insertion order 57ms
 ✓ test/canonicalJson.test.ts > canonical JSON > formats numbers exactly as ECMAScript does (and -0 as 0) 40ms
 ✓ test/canonicalJson.test.ts > canonical JSON > refuses values that have no unambiguous canonical form 1ms
 ✓ test/combat.test.ts > hit chance > is 1 without a requirement and 90% at the requirement (candidate curve) 2ms
 ✓ test/combat.test.ts > hit chance > is monotonic non-decreasing in accuracy and stays inside [floor, 1] 63ms
 ✓ test/combat.test.ts > hit chance > refuses inconsistent curves 0ms
 ✓ test/combat.test.ts > mitigation, crit and damage > mitigation is diminishing and never reaches zero 44ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > addSafe: exact result, or NUMERIC_LIMIT exactly when out of range 56ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulSafe: exact result, or NUMERIC_LIMIT exactly when out of range 58ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > matches exact BigInt arithmetic for any valid inputs 79ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > G1: any partition of the steps gives the same total and remainder 69ms
 ✓ test/content.test.ts > S0 content pack > validates, and its recorded table hash matches the artifact 13ms
 ✓ test/content.test.ts > S0 content pack > detects a tampered table 2ms
 ✓ test/content.test.ts > S0 content pack > every numeric value in the pack is labelled candidate (nothing is approved yet) 0ms
 ✓ test/content.test.ts > S0 content pack > a derived value is never stronger than its weakest input 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > splitting an interval never changes the total or the remainder (G1) 2ms
 ✓ test/remainder.test.ts > exact remainder accumulator > a zero-duration interval changes nothing (G2) 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > per-hour chain: one hour at 1.5 units/hour, split three different ways 2ms
 ✓ test/remainder.test.ts > exact remainder accumulator > settling every millisecond equals settling once (no gain from frequent rejoining) 189ms
 ✓ test/remainder.test.ts > exact remainder accumulator > persisted remainders survive a save/load round trip and complete later units 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > assignment switching: separate keys never leak into each other 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > large balances: results near 2^53 are exact and beyond it are refused 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > refuses invalid parameters 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > S0 review reproduction: 2 h at rate 2^53 - 1 in one call equals two 1 h calls 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > the largest representable grant succeeds in one call and in parts; one more millisecond is refused 1ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > a full state plus the largest grant still fits exactly 1ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > refuses malformed states before doing any arithmetic 1ms
 ✓ test/xp.property.test.ts > EXP award properties > two awards in sequence equal one combined award (multi-level awards are unambiguous) 91ms
 ✓ test/xp.property.test.ts > EXP award properties > total EXP is conserved: thresholds consumed + leftover = award 83ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > balances are never negative and always equal the sum of committed nets (conservation) 197ms
 ✓ test/runtime.test.ts > pinned runtime > runs on the pinned Node 24 LTS version 2ms
 ✓ test/runtime.test.ts > pinned runtime > package.json pins exact dependency versions and the engine 1ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > divRem is exact for every non-negative safe dividend 73ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > roundHalfUp equals exact floor(x + 1/2) for any finite double in the safe range 49ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > covers every S0 family with unique case IDs, boundary and failure cases, and derivations 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.keys.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nested.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.numbers.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.strings.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.infinity.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.key-ascii.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.no-requirement.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.at-requirement.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.above.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.below.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.floor.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.zero-accuracy.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.bad-curve.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.small.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.normal.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.cap.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.overcap.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.plain.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.crit-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.mitigated.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.floor.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.zero-raw.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-mult.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-mitigation.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.third.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.five-sixths.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half-mitigation.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.k100-d25.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-below-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.below-half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.min-damage.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.huge-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.overflow.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.not-safe.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-ratio.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-crit-flag.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.breakpoint.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.overkill.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-hp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-dmg.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.valid.001 (normal) 7ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.range-edge.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-hash.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.out-of-range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.duplicate-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.hit-floor.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.table-length.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unknown-field.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unlabelled.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-id.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.grant-spend.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.aggregate.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.atomic.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.replay.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.conflict.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.failed-not-recorded.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.aggregate-overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.reserve.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.net-zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.zero-delta.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.resource-id.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.fraction.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.field.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.empty.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.nonint.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.negzero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.sub.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.sub.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.mul.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.mul.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldiv.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldiv.intermediate-overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.naive-bug.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.naive-bug.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.half-below-2p52.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.max-safe.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.inf.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.small.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.safe-product.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.wide.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.wide.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.per-hour.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.exact-carry.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.bad-d.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.zero-steps.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.efficiency.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.efficiency.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.huge-product.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.max-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.den-too-large.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.den-zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.bad-rem.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.tiny.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.persisted.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.large.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-granted.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-granted.split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.slow-max-duration.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.overflow.split.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-inputs.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.rate-change.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.rate-change.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.carry.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.003 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-rate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.utf8.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.empty.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.surrogate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.state.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.first-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.second-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.all-zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a0.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a1.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.b0.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.one.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.full.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.over.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.min.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.too-small.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.never.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.always.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.d6.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.span1.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.full.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.worst.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.negative.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.inverted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.too-large.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.nonint.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.max-words.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.short.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.null.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.too-big.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.not-array.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.stack.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-bp.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inexact.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.unknown-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.duplicate-source.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-factor.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-flat.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.w2-hooks.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.order.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.range.largest.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.final.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.intermediate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.many.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.bad-active.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.null-source.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive-negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.candidate.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.geometric.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.constant.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-a.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-g.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-length.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.multi-level.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.none.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.table-end.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.zero-at-end.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exhausted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exhausted.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.guard.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-state.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.large.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.near-max.exhausted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.max-award.multi.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.sequence.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.at-end-with-exp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.guard.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-guard.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.null-threshold.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.001 (normal) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.unsafe.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.bad-table.001 (failure) 0ms
 ✓ test/numeric.test.ts > safe integers > adds up to the limit and refuses one past it 2ms
 ✓ test/numeric.test.ts > safe integers > refuses non-integers, NaN, Infinity and unsafe inputs 0ms
 ✓ test/numeric.test.ts > safe integers > normalises -0 to +0 0ms
 ✓ test/numeric.test.ts > safe integers > checks intermediate products, not only final results 0ms
 ✓ test/numeric.test.ts > safe integers > divides exactly near 2^53 where floating division rounds 1ms
 ✓ test/numeric.test.ts > roundHalfUp > fixes both failure cases of floor(x + 0.5) 0ms
 ✓ test/numeric.test.ts > roundHalfUp > rounds halves up, including negatives 0ms
 ✓ test/numeric.test.ts > roundHalfUp > refuses non-finite input and results beyond the safe range 0ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > replaying every transaction again changes nothing (no repeated claims) 75ms
 ✓ test/rng.test.ts > stream identity > is injective: different field tuples never share an encoding 44ms
 ✓ test/rng.test.ts > stream identity > refuses empty, oversized, ill-formed or badly counted identities 1ms
 ✓ test/rng.test.ts > stream identity > never yields the all-zero state, and applies the fallback rule exactly 7ms
 ✓ test/rng.test.ts > generator and sampling > replays exactly: the same stream gives the same sequence 1ms
 ✓ test/rng.test.ts > generator and sampling > produces unsigned 32-bit integers and never reaches the zero state 203ms
 ✓ test/stats.test.ts > stat stacking > adds within a category and multiplies across categories 2ms
 ✓ test/stats.test.ts > stat stacking > the breakdown reproduces the applied value exactly 37ms
 ✓ test/stats.test.ts > stat stacking > source order does not change the result 0ms
 ✓ test/stats.test.ts > stat stacking > inactive categories are neutral; unknown or duplicate entries are refused 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > S0 review reproduction: an active factor of exactly 1 preserves 2^53 - 1 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > neutral factors are an exact identity for any base, any number of them, in any position 48ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > W2 hooks from the candidate content pack stay neutral, however large their sources 2ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > never returns NaN or Infinity: every result is finite and inside [0, 2^53 - 1], or the call is refused 215ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses out-of-range partial and final values (S0 returned Infinity and NaN for these) 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > applies categories in ascending id order, whatever order they are listed in 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses sparse, missing or malformed entries with INVALID_CONTENT 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > one call matches the BigInt reference for any state, rate and duration; NUMERIC_LIMIT exactly when the grant is unsafe 171ms
 ✓ test/rng.test.ts > generator and sampling > Bernoulli always consumes exactly one draw, including p = 0 and p = 1 0ms
 ✓ test/rng.test.ts > generator and sampling > computes thresholds exactly and refuses unrepresentable probabilities 1ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt stays inside [lo, hi] and reports how many draws it used 33ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt boundary behaviour: span 1, span 2^32, refusals 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses sparse array (S0 accepted it) at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array with a hole at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses undefined word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses three words at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses five words at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses fractional word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses negative word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses word of 2^32 at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses string word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array-like object at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses typed array at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses the all-zero state at every entry point (S0 accepted it in nextU32, bernoulli and uniformInt) 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > validates the state before other arguments 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > a caller mutating a returned state cannot smuggle the zero state in 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > stateFromDigest accepts only a 32-byte Uint8Array 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > valid states are unaffected: a hand-derived step is unchanged 0ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > one award matches unbounded integer arithmetic (no NUMERIC_LIMIT is ever needed) 171ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/fixture.schema.json matches the zod source 2ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/content-pack-s0.schema.json matches the zod source 1ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/xp-table.schema.json matches the zod source 0ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulDivRem: exact quotient and remainder for any safe inputs, NUMERIC_LIMIT exactly when the quotient is unsafe (S0.1) 218ms
 ✓ test/combat.test.ts > mitigation, crit and damage > crit chance may reach exactly 100%; the excess is reported, not applied (R-A2) 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > damage per landed hit is an integer, rounds exact halves up, and has a floor 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > hits-to-kill never increases when damage increases (breakpoints are exact) 56ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > S0 review reproduction: 100 * 1.005 = 100.5 rounds up to 101 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > exact halves through mitigation ratios that binary64 cannot represent round up 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > values just below a half round down, even one part in 10^12 below 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > matches exact integer arithmetic for any valid input; NUMERIC_LIMIT exactly when the result is unsafe 289ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G1: any partition of a duration gives the same total and state, for rates up to 2^53 - 1 155ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > applies mitigation first, so no intermediate overflows when the result fits 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > is monotonic: more raw damage, a larger crit multiplier or less defence never lowers damage 28ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > mitigationRatio is exact and agrees with the display factor 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > refuses malformed damage inputs 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G3: a timeline of rate changes, each segment split arbitrarily, equals the exact integral 59ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > settling at any cadence equals settling once, from any persisted state (save/load round trip included) 25ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > any split of an award gives the same final state and the same ordered level-ups 219ms

 Test Files  18 passed (18)
      Tests  459 passed (459)
   Start at  17:10:57
   Duration  991ms (transform 1.14s, setup 0ms, import 2.55s, tests 3.38s, environment 2ms)


[exit code: 0]
```

## Appendix C. Statistical test suite (7 tests) (`test-stats-output.txt`)

```text
$ npx vitest run --config vitest.stats.config.ts --reporter=verbose


 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > high and low bytes of nextU32 are uniform (chi-square, 256 buckets) 84ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 5000 bp has the correct success rate (binomial interval) 140ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 100 bp has the correct success rate (binomial interval) 131ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 20 bp has the correct success rate (binomial interval) 131ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt(1, 6) is unbiased (chi-square, df = 5) 123ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt with span 2^31 + 1 rejects about half of all draws, and stays unbiased across halves 59ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > streams with adjacent counters are not correlated (chi-square on paired top bits, df = 3) 1338ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  17:11:02
   Duration  2.24s (transform 39ms, setup 0ms, import 97ms, tests 2.01s, environment 0ms)


[exit code: 0]
```

## Appendix D. Fixture conformance (252 cases) (`fixtures-check.txt`)

```text
$ node src/cli/fixtures-check.ts

| Family | File | Cases | Normal | Boundary | Failure | Passed |
|---|---|---|---|---|---|---|
| canonical-json | spec/fixtures/canonical-json.v1.json | 7 | 2 | 2 | 3 | 7 |
| combat | spec/fixtures/combat.v2.json | 51 | 12 | 24 | 15 | 51 |
| content | spec/fixtures/content.v1.json | 10 | 1 | 1 | 8 | 10 |
| ledger | spec/fixtures/ledger.v1.json | 15 | 2 | 4 | 9 | 15 |
| numeric | spec/fixtures/numeric.v1.json | 40 | 6 | 20 | 14 | 40 |
| remainder | spec/fixtures/remainder.v2.json | 33 | 9 | 12 | 12 | 33 |
| rng | spec/fixtures/rng.v1.json | 46 | 11 | 15 | 20 | 46 |
| stats | spec/fixtures/stats.v2.json | 20 | 3 | 6 | 11 | 20 |
| xp | spec/fixtures/xp.v2.json | 30 | 6 | 10 | 14 | 30 |
total cases: 252; problems: 0

[exit code: 0]
```

## Appendix E. Exported schema check (`schemas-check.txt`)

```text
$ node src/cli/export-schemas.ts --check

OK    spec/schema/fixture.schema.json
OK    spec/schema/content-pack-s0.schema.json
OK    spec/schema/xp-table.schema.json

[exit code: 0]
```

## Appendix F. Independent Python oracles (`oracle-check.txt`)

```text
$ python -I spec/oracle/check_all.py

rng_oracle: 46 cases checked, 0 mismatches (<REPO>\spec\fixtures\rng.v1.json)
xp_oracle fixtures: 30 cases checked, 0 mismatches (<REPO>\spec\fixtures\xp.v2.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.candidate.v0.1.0.json)
exact_oracle numeric: 40 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\numeric.v1.json)
exact_oracle remainder: 33 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\remainder.v2.json)
exact_oracle stats: 20 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\stats.v2.json)
exact_oracle combat: 51 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\combat.v2.json)
exact_oracle ledger: 15 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\ledger.v1.json)
exact_oracle canonical-json: 7 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\canonical-json.v1.json)
exact_oracle content: 2 cases checked, 8 hand-only, 0 mismatches (<REPO>\spec\fixtures\content.v1.json)
xp_oracle preview: main rows + 9 sweep variants checked, 0 problems (<REPO>\legion-progression-lab\results\s0\S0-R01-curve-preview\semantic.json)
== rng fixtures
== xp fixtures
== xp table artifact
== exact families
== S0-R01 preview
oracle summary: 5 groups, 0 failing

[exit code: 0]
```

## Appendix G. Curve preview, run 1 (`curve-preview-run1.txt`)

```text
$ node src/cli/curve-preview.ts

S0-R01 semantic fingerprint 24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9
wrote legion-progression-lab/results/s0/S0-R01-curve-preview/{semantic.json, environment.json, report.md, fingerprint.txt}

[exit code: 0]
```

## Appendix H. Curve preview, run 2 (`curve-preview-run2.txt`)

```text
$ node src/cli/curve-preview.ts

S0-R01 semantic fingerprint 24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9
wrote legion-progression-lab/results/s0/S0-R01-curve-preview/{semantic.json, environment.json, report.md, fingerprint.txt}

[exit code: 0]
```

## Appendix I. Curve preview reproduction and comparison with S0 (`reproduction.txt`)

```text
Curve preview reproduction (S0.1)
run 1 semantic.json sha256: 4f3ad8d72b88598e33537513e662bf4d9756176dde7d3fc38926fff65c90f49d
run 2 semantic.json sha256: 4f3ad8d72b88598e33537513e662bf4d9756176dde7d3fc38926fff65c90f49d
S0 evidence semantic.json sha256: 4f3ad8d72b88598e33537513e662bf4d9756176dde7d3fc38926fff65c90f49d
semantic.json byte-identical across the two S0.1 runs: yes
semantic.json byte-identical to the S0 evidence copy: yes
S0.1 semantic fingerprint (fingerprint.txt): 24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9
S0   semantic fingerprint (fingerprint.txt): 24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9
semantic fingerprint identical to S0: yes
```

## Appendix J. Mutation check (`mutation-check.txt`)

```text
S0.1 mutation check: each row plants one deliberate bug, runs the default test suite, then restores the file (SHA-256 verified).
Unmutated suite: 459 total, 0 failed.

| # | File | Planted bug | Tests failed | Restored, hash identical |
|---|---|---|---|---|
| 1 | `src/core/numeric/rounding.ts` | S0 #1: naive `floor(x + 0.5)` rounding | 6 | yes |
| 2 | `src/core/ledger/ledger.ts` | S0 #2: a reused txId always replays (conflict check removed) | 3 | yes |
| 3 | `src/core/rng/xoshiro128ss.ts` | S0 #3: rotation constant 11 changed to 13 | 10 | yes |
| 4 | `src/core/numeric/remainder.ts` | S0 #4: the a*j term dropped from accrue | 2 | yes |
| 5 | `src/core/numeric/safeInt.ts` | mulDivRem: doubling carry uses > instead of >= | 2 | yes |
| 6 | `src/core/numeric/safeInt.ts` | mulDivRem: direct path trusts a rounded product (<= 4*(2^53-1)) | 8 | yes |
| 7 | `src/core/numeric/remainder.ts` | per-hour: wrap test uses > instead of >= | 6 | yes |
| 8 | `src/core/numeric/remainder.ts` | per-hour: msRem and milliRem swapped when splitting the rest | 23 | yes |
| 9 | `src/core/formulas/stats.ts` | stats: neutral factors no longer skipped | 5 | yes |
| 10 | `src/core/formulas/stats.ts` | stats: range check removed | 6 | yes |
| 11 | `src/core/formulas/combat.ts` | damage: exact half rounds down (> instead of >=) | 14 | yes |
| 12 | `src/core/formulas/combat.ts` | damage: mitigation remainder term H dropped | 3 | yes |
| 13 | `src/core/formulas/xp.ts` | EXP: a level-up needs strictly more than the remaining requirement | 14 | yes |
| 14 | `src/core/rng/xoshiro128ss.ts` | RNG: all-zero check removed from assertRngState | 5 | yes |
| 15 | `src/core/rng/xoshiro128ss.ts` | RNG: nextU32 skips validation | 22 | yes |
| 16 | `src/core/arrays.ts` | dense arrays: hole check removed | 1 | yes |
| 17 | `src/core/ledger/ledger.ts` | ledger: committed nets no longer frozen | 2 | yes |
| 18 | `src/core/ledger/ledger.ts` | ledger: replay returns the stored result object unfrozen | 1 | yes |
| 19 | `src/core/ledger/ledger.ts` | ledger: maps exposed as plain mutable Maps | 29 | yes |

A count above 0 means the suite detected the planted bug. 'MUTATION NOT APPLIED' would mean the pattern did not match (none expected).
```

## Appendix K. Reproductions on the S0 baseline (before) (`reproductions-before.txt`)

```text
Reproductions run against: S0 baseline (byte-identical to the reviewed S0 ZIP)

R1a per-hour, one call over 2 h at rate 2^53-1
  call:   accruePerHour({msRem:0,milliRem:0}, M, 7200000)
  result: throws NUMERIC_LIMIT

R1b per-hour, same 2 h as two 1 h calls
  call:   a = accruePerHour(start, M, 3600000); b = accruePerHour(a.state, M, 3600000)
  result: returns { totalGranted: 18014398509481, state: { msRem: 0, milliRem: 982 } }

R2a neutral active category
  call:   evaluateStat(M, [], [{id:'cat.a', kind:'additivePool', active:true}]).value
  result: returns 9007199254740990

R2b 30 large multiplier categories
  call:   evaluateStat(M, 30 sources of bp M-10000, 30 active multiplier categories).value
  result: returns Infinity

R2c the same, then one category with factor 0 (sorted last)
  call:   ... plus {id:'cat.z', active:true} with a -10000 bp source
  result: returns NaN

R3a v1 call shape (raw, mitigation as a double)
  call:   damagePerHit({raw:100, crit:true, critMultBp:10050, mitigation:1, minDamage:1})
  result: returns 100

R3b v2 call shape: not available in this tree (combat v1)

R4a award of 2 one EXP short of a 2^53-1 threshold
  call:   applyExpAward({level:1, expIntoLevel:M-1}, 2, [M, M], 10)
  result: throws NUMERIC_LIMIT

R4b the same award split into 1 + 1
  call:   a = applyExpAward({1, M-1}, 1, [M,M], 10); applyExpAward(a, 1, [M,M], 10)
  result: returns { level: 2, expIntoLevel: 1, levelUps: [ 2 ] }

R5a sparse RNG state
  call:   assertRngState(new Array(4))
  result: returns [ undefined, undefined, undefined, undefined ]

R5b sparse EXP table
  call:   applyExpAward({level:1, expIntoLevel:0}, 5, new Array(2), 5)
  result: returns { level: 1, expIntoLevel: 5, levelUps: [] }

R5c all-zero state straight into the generator
  call:   nextU32([0,0,0,0])
  result: returns [ 0, [ 0, 0, 0, 0 ] ]

R5d all-zero state into a Bernoulli trial
  call:   bernoulli([0,0,0,0], 2^31)
  result: returns [ true, [ 0, 0, 0, 0 ] ]

R5e all-zero state into uniformInt
  call:   uniformInt([0,0,0,0], 1, 6)
  result: returns { value: 1, state: [ 0, 0, 0, 0 ], draws: 1 }

R5f sparse transaction lines
  call:   applyTx(emptyLedger(), {txId:'t', purpose:'grant', lines:new Array(1)})
  result: throws INVALID_JSON_VALUE

R5g sparse stat sources
  call:   evaluateStat(1, new Array(1), [{id:'cat.a',...}])
  result: throws TypeError: Cannot read properties of undefined (reading 'sourceId')

R6a mutate a returned receipt, then replay
  call:   r = applyTx(empty, grant 5); r.result.nets[0].delta = 999; applyTx(r.ledger, grant 5)
  result: returns { mutation: 'accepted', replayNets: [ { resourceId: 'res.gold', bucket: 'available', delta: 999 } ], replayed: true, balance: 5 }

R6b clear the committed history through the returned ledger, then replay
  call:   l = applyTx(empty, grant 5).ledger; l.committed.clear(); applyTx(l, grant 5)
  result: returns { mutation: 'accepted', replayed: false, balance: 10 }

R6c overwrite a balance through the returned ledger
  call:   l.balances.set('res.gold', {available: 1000000, reserved: 0})
  result: returns { mutation: 'accepted', balance: 1000000 }
```

## Appendix L. Reproductions on S0.1 (after) (`reproductions-after.txt`)

```text
Reproductions run against: S0.1 working tree

R1a per-hour, one call over 2 h at rate 2^53-1
  call:   accruePerHour({msRem:0,milliRem:0}, M, 7200000)
  result: returns { granted: 18014398509481, state: { msRem: 0, milliRem: 982 } }

R1b per-hour, same 2 h as two 1 h calls
  call:   a = accruePerHour(start, M, 3600000); b = accruePerHour(a.state, M, 3600000)
  result: returns { totalGranted: 18014398509481, state: { msRem: 0, milliRem: 982 } }

R2a neutral active category
  call:   evaluateStat(M, [], [{id:'cat.a', kind:'additivePool', active:true}]).value
  result: returns 9007199254740991

R2b 30 large multiplier categories
  call:   evaluateStat(M, 30 sources of bp M-10000, 30 active multiplier categories).value
  result: throws NUMERIC_LIMIT

R2c the same, then one category with factor 0 (sorted last)
  call:   ... plus {id:'cat.z', active:true} with a -10000 bp source
  result: throws NUMERIC_LIMIT

R3a v1 call shape (raw, mitigation as a double)
  call:   damagePerHit({raw:100, crit:true, critMultBp:10050, mitigation:1, minDamage:1})
  result: throws INVALID_NUMBER

R3b v2 call shape for the same hit (raw 100 = 100000 thousandths, no defence)
  call:   damagePerHit({rawMilli:100000, crit:true, critMultBp:10050, mitigation:mitigationRatio(0, 100), minDamage:1})
  result: returns 101

R4a award of 2 one EXP short of a 2^53-1 threshold
  call:   applyExpAward({level:1, expIntoLevel:M-1}, 2, [M, M], 10)
  result: returns { level: 2, expIntoLevel: 1, levelUps: [ 2 ] }

R4b the same award split into 1 + 1
  call:   a = applyExpAward({1, M-1}, 1, [M,M], 10); applyExpAward(a, 1, [M,M], 10)
  result: returns { level: 2, expIntoLevel: 1, levelUps: [ 2 ] }

R5a sparse RNG state
  call:   assertRngState(new Array(4))
  result: throws INVALID_STATE

R5b sparse EXP table
  call:   applyExpAward({level:1, expIntoLevel:0}, 5, new Array(2), 5)
  result: throws INVALID_TABLE

R5c all-zero state straight into the generator
  call:   nextU32([0,0,0,0])
  result: throws RNG_ZERO_STATE

R5d all-zero state into a Bernoulli trial
  call:   bernoulli([0,0,0,0], 2^31)
  result: throws RNG_ZERO_STATE

R5e all-zero state into uniformInt
  call:   uniformInt([0,0,0,0], 1, 6)
  result: throws RNG_ZERO_STATE

R5f sparse transaction lines
  call:   applyTx(emptyLedger(), {txId:'t', purpose:'grant', lines:new Array(1)})
  result: throws INVALID_TX

R5g sparse stat sources
  call:   evaluateStat(1, new Array(1), [{id:'cat.a',...}])
  result: throws INVALID_CONTENT

R6a mutate a returned receipt, then replay
  call:   r = applyTx(empty, grant 5); r.result.nets[0].delta = 999; applyTx(r.ledger, grant 5)
  result: returns { mutation: 'refused (TypeError)', replayNets: [ { resourceId: 'res.gold', bucket: 'available', delta: 5 } ], replayed: true, balance: 5 }

R6b clear the committed history through the returned ledger, then replay
  call:   l = applyTx(empty, grant 5).ledger; l.committed.clear(); applyTx(l, grant 5)
  result: returns { mutation: 'refused (TypeError)', replayed: true, balance: 5 }

R6c overwrite a balance through the returned ledger
  call:   l.balances.set('res.gold', {available: 1000000, reserved: 0})
  result: returns { mutation: 'refused (TypeError)', balance: 5 }
```

## Appendix M. S0.1 fixtures run on the unchanged S0 code (`new-fixtures-on-s0-baseline.txt`)

```text
$ node src/cli/fixtures-check.ts   (S0 lab code, byte-identical to the S0 review ZIP, run on the S0.1 fixture files)

FAIL combat.dmg.plain.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.crit-half.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.mitigated.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.floor.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.half.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.reviewer.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.third.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.five-sixths.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.half-mitigation.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.k100-d25.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.milli-half.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.milli-below-half.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.below-half.large-den.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.half.large-den.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.min-damage.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.max.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.huge-den.001: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.dmg.overflow.002: raised INVALID_NUMBER: INVALID_NUMBER: raw damage must be a finite number > 0
FAIL combat.mitratio.001: harness error: unknown combat op mitigationRatio
FAIL combat.mitratio.none.001: harness error: unknown combat op mitigationRatio
FAIL combat.mitratio.overflow.001: harness error: unknown combat op mitigationRatio
FAIL combat.mitratio.bad-k.001: harness error: unknown combat op mitigationRatio
FAIL numeric.muldivrem.small.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.zero.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.safe-product.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.wide.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.wide.002: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.per-hour.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.exact-carry.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.overflow.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.bad-d.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.negative.001: harness error: unknown numeric op mulDivRem
FAIL numeric.muldivrem.fraction.001: harness error: unknown numeric op mulDivRem
FAIL remainder.perhour.reviewer.001: raised NUMERIC_LIMIT: NUMERIC_LIMIT: mul result is outside the safe integer range
FAIL remainder.perhour.max-granted.001: raised NUMERIC_LIMIT: NUMERIC_LIMIT: mul result is outside the safe integer range
FAIL remainder.perhour.max-granted.split.001: raised NUMERIC_LIMIT: NUMERIC_LIMIT: mul result is outside the safe integer range
FAIL remainder.timeline.rate-change.001: harness error: unknown remainder op perHourTimeline
FAIL remainder.timeline.rate-change.split.001: harness error: unknown remainder op perHourTimeline
FAIL remainder.timeline.carry.001: harness error: unknown remainder op perHourTimeline
FAIL rng.next.001: harness error: unknown rng op nextFromState
FAIL rng.next.max-words.001: harness error: unknown rng op nextFromState
FAIL rng.next.zero.001: harness error: unknown rng op nextFromState
FAIL rng.next.short.001: harness error: unknown rng op nextFromState
FAIL rng.next.null.001: harness error: unknown rng op nextFromState
FAIL rng.next.too-big.001: harness error: unknown rng op nextFromState
FAIL rng.next.fraction.001: harness error: unknown rng op nextFromState
FAIL rng.next.negative.001: harness error: unknown rng op nextFromState
FAIL rng.next.not-array.001: harness error: unknown rng op nextFromState
FAIL stats.neutral.max.001: $.value: expected 9007199254740991, got 9007199254740990
FAIL stats.neutral.w2-hooks.001: $.value: expected 9007199254740991, got 9007199254740990
FAIL stats.overflow.final.001: expected NUMERIC_LIMIT, but no error was raised
FAIL stats.overflow.intermediate.001: expected NUMERIC_LIMIT, but no error was raised
FAIL stats.overflow.many.001: expected NUMERIC_LIMIT, but no error was raised
FAIL stats.overflow.nan.001: expected NUMERIC_LIMIT, but no error was raised
FAIL stats.bad-active.001: expected INVALID_CONTENT, but no error was raised
FAIL stats.null-source.001: harness error: Cannot read properties of null (reading 'sourceId')
FAIL xp.award.reviewer.001: raised NUMERIC_LIMIT: NUMERIC_LIMIT: add result is outside the safe integer range
FAIL xp.award.reviewer-split.001: harness error: unknown xp op awardSequence
FAIL xp.award.near-max.exhausted.001: raised NUMERIC_LIMIT: NUMERIC_LIMIT: add result is outside the safe integer range
FAIL xp.award.max-award.multi.001: raised NUMERIC_LIMIT: NUMERIC_LIMIT: add result is outside the safe integer range
FAIL xp.award.sequence.001: harness error: unknown xp op awardSequence
| Family | File | Cases | Normal | Boundary | Failure | Passed |
|---|---|---|---|---|---|---|
| canonical-json | spec/fixtures/canonical-json.v1.json | 7 | 2 | 2 | 3 | 7 |
| combat | spec/fixtures/combat.v2.json | 51 | 12 | 24 | 15 | 29 |
| content | spec/fixtures/content.v1.json | 10 | 1 | 1 | 8 | 10 |
| ledger | spec/fixtures/ledger.v1.json | 15 | 2 | 4 | 9 | 15 |
| numeric | spec/fixtures/numeric.v1.json | 40 | 6 | 20 | 14 | 29 |
| remainder | spec/fixtures/remainder.v2.json | 33 | 9 | 12 | 12 | 27 |
| rng | spec/fixtures/rng.v1.json | 46 | 11 | 15 | 20 | 37 |
| stats | spec/fixtures/stats.v2.json | 20 | 3 | 6 | 11 | 12 |
| xp | spec/fixtures/xp.v2.json | 30 | 6 | 10 | 14 | 25 |
total cases: 252; problems: 61

[exit code: 0]
```

## Appendix N. Frozen simulator, archive and old workspace check (`frozen-check.txt`)

```text
Frozen simulator and archive check after S0.1 (2026-11-13T17:12:32Z)
Scope: every file under the original Roblox Incremental workspace, including progression-lab/.git (path, size, modification time, SHA-256).
files at M0 start: 3012; files now: 3012
path/size/mtime list vs M0 start: IDENTICAL
content SHA-256 list vs M0 start: IDENTICAL
combined checksum-list fingerprint: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d (M0: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d)
HEAD: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913 (frozen: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913)
working-tree status lines, one per file (--untracked-files=all; the 12 Original v1 files, untouched): 12 (M0: 12)

Original v1 archive copy (Documents/Legion-Backups/2026-11-13/progression-lab-archive):
  master: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913 (expected 74499ef2a7ec154bdcbc10b1152f2aec89c3c913)
  archive/increment6-original-v1: 8d80a440d9818c961713b767f696764b3f18db66 (expected 8d80a440d9818c961713b767f696764b3f18db66)
  remotes: 0 (expected 0)

Old Legion workspace (Desktop/Legion Incremental), kept until the owner approves deletion:
  files (excluding .git): 16; SHA-256 list IDENTICAL to the hashes recorded when it was copied (16 files)

Git read commands used GIT_OPTIONAL_LOCKS=0 / --no-optional-locks (no index refresh). Nothing in these three locations was written.
```

## Appendix O. Indicative ledger timing (item 7) (`ledger-indicative.txt`)

```text
| committed tx at start | next 1,000 tx: total ms | per tx (µs) | heap after (MB) |
|---|---|---|---|
| 0 | 26.4 | 26.4 | 9.5 |
| 4,000 | 248.6 | 248.6 | 10.7 |
| 9,000 | 568.4 | 568.4 | 12.4 |
| 19,000 | 1287.3 | 1287.3 | 15.6 |
| 39,000 | 2834.3 | 2834.3 | 17.6 |

Node v24.22.3, win32/x64; one run, no warm-up control; indicative only.
```

## Appendix P. Tool versions (`tool-versions.txt`)

```text
Captured: 2026-11-13T17:10:50Z
node v24.22.3
npm 11.19.1
typescript Version 7.0.2
vitest vitest/4.1.12 win32-x64 node-v24.22.3
zod 4.6.7
fast-check 4.10.2
@types/node 24.19.2
Python 3.12.9
git version 2.53.0.windows.1
rojo (repo pin) Rojo 7.7.1
OS: MINGW64_NT-10.0-26300 3.6.6-1cdd4371.x86_64 x86_64
package-lock.json sha256: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6 (unchanged from S0: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6)
package.json sha256:      ac2b7b9d259034e1590c2039dc97bc7fcb03cb695a497c106c359f6e25a3416b
```

## Appendix Q. Change summary S0 -> S0.1 (diffstat; full patch in s0-to-s0.1.patch) (`s0-to-s0.1.diffstat.txt`)

```text
 {s0 => s0.1}/legion-progression-lab/CHANGELOG.md                                  |  102 +++++++++
 {s0 => s0.1}/legion-progression-lab/PROVENANCE.md                                 |    3 +-
 {s0 => s0.1}/legion-progression-lab/README.md                                     |   11 +-
 /dev/null => s0.1/legion-progression-lab/planning/S1_LEDGER_BENCHMARK_PROPOSAL.md |   91 ++++++++
 /dev/null => s0.1/legion-progression-lab/src/core/arrays.ts                       |   27 +++
 {s0 => s0.1}/legion-progression-lab/src/core/formulas/combat.ts                   |   87 +++++--
 {s0 => s0.1}/legion-progression-lab/src/core/formulas/stats.ts                    |   56 +++--
 {s0 => s0.1}/legion-progression-lab/src/core/formulas/xp.ts                       |   43 ++--
 {s0 => s0.1}/legion-progression-lab/src/core/ledger/ledger.ts                     |  101 ++++++++-
 {s0 => s0.1}/legion-progression-lab/src/core/numeric/remainder.ts                 |   44 +++-
 {s0 => s0.1}/legion-progression-lab/src/core/numeric/safeInt.ts                   |   53 +++++
 {s0 => s0.1}/legion-progression-lab/src/core/rng/sample.ts                        |   10 +-
 {s0 => s0.1}/legion-progression-lab/src/core/rng/streamId.ts                      |    2 +-
 {s0 => s0.1}/legion-progression-lab/src/core/rng/xoshiro128ss.ts                  |   25 +-
 {s0 => s0.1}/legion-progression-lab/src/spec/fixtureRunner.ts                     |   44 +++-
 {s0 => s0.1}/legion-progression-lab/test/combat.test.ts                           |  104 ++++++++-
 {s0 => s0.1}/legion-progression-lab/test/helpers/reference.ts                     |   43 ++++
 {s0 => s0.1}/legion-progression-lab/test/ledger.test.ts                           |   83 +++++++
 {s0 => s0.1}/legion-progression-lab/test/numeric.property.test.ts                 |   24 +-
 {s0 => s0.1}/legion-progression-lab/test/remainder.property.test.ts               |  110 +++++++--
 {s0 => s0.1}/legion-progression-lab/test/remainder.test.ts                        |   34 ++-
 {s0 => s0.1}/legion-progression-lab/test/rng.test.ts                              |   58 +++++
 {s0 => s0.1}/legion-progression-lab/test/stats.test.ts                            |  104 ++++++++-
 {s0 => s0.1}/legion-progression-lab/test/xp.property.test.ts                      |   57 ++++-
 {s0 => s0.1}/legion-progression-lab/test/xp.test.ts                               |   45 +++-
 {s0 => s0.1}/spec/README.md                                                       |   27 ++-
 s0/spec/fixtures/combat.v1.json => /dev/null                                      |   41 ----
 /dev/null => s0.1/spec/fixtures/combat.v2.json                                    |  897 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 {s0 => s0.1}/spec/fixtures/numeric.v1.json                                        |  584 ++++++++++++++++++++++++++++++++++++++++++++---
 s0/spec/fixtures/remainder.v1.json => /dev/null                                   |   27 ---
 /dev/null => s0.1/spec/fixtures/remainder.v2.json                                 |  707 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 {s0 => s0.1}/spec/fixtures/rng.v1.json                                            |  158 ++++++++++++-
 s0/spec/fixtures/stats.v1.json => /dev/null                                       |  123 ----------
 /dev/null => s0.1/spec/fixtures/stats.v2.json                                     | 1355 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 s0/spec/fixtures/xp.v1.json => s0.1/spec/fixtures/xp.v2.json                      |  233 +++++++++++++++++--
 {s0 => s0.1}/spec/formulas/combat.md                                              |   89 +++++++-
 {s0 => s0.1}/spec/formulas/ledger.md                                              |   18 ++
 {s0 => s0.1}/spec/formulas/numeric.md                                             |   15 +-
 {s0 => s0.1}/spec/formulas/remainder.md                                           |   83 ++++++-
 {s0 => s0.1}/spec/formulas/rng.md                                                 |   16 +-
 {s0 => s0.1}/spec/formulas/stats.md                                               |   58 ++++-
 {s0 => s0.1}/spec/formulas/xp.md                                                  |   49 +++-
 {s0 => s0.1}/spec/oracle/check_all.py                                             |   15 +-
 {s0 => s0.1}/spec/oracle/exact_oracle.py                                          |  120 +++++++---
 {s0 => s0.1}/spec/oracle/rng_oracle.py                                            |    9 +
 {s0 => s0.1}/spec/oracle/xp_oracle.py                                             |   23 +-
 46 files changed, 5595 insertions(+), 413 deletions(-)
```
