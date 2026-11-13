# S0 Evidence Pack — Legion progression lab

**Increment:** M1 · S0 (schema and deterministic numeric primitives) · **Date:** 13 November 2026 · **Author:** Claude (implementation lead)
**Status:** implemented and self-verified. **Not committed and not promoted to a baseline**, pending independent review and owner acceptance (`M0_RESOLUTION.md` §5).
**Repository:** canonical `Documents/GitHub/legion-incremental/` (local only; the GitHub remote is public, so nothing was pushed). Last commit: `0209d93` (documentation checkpoint). All S0 work is uncommitted on top of it.

> **In plain words.**
> - **What was built:** S0 is the lab's basic calculators: whole-number maths, exact fractions of resources, random numbers, level-up tables, stat bonuses, damage and the resource ledger.
> - **Tests:** 336 automated tests pass (329 regular + 7 statistical).
> - **Independent check:** separate Python checkers, which never use the lab's code, agree with every one of the 179 test cases and with the whole 200-level table.
> - **Tests can fail:** four deliberately planted bugs were all caught.
> - **Repeatable:** the same report run twice gives the identical result.
> - **Frozen simulator:** still byte-for-byte untouched.
> - **All numbers are candidates.** Nothing here says the game is balanced. S1 has not started.

All paths below are relative to the repository root. In captured outputs, the local folder is written as `<REPO>` and the user folder as `<HOME>`.

---

## 1. Scope delivered vs authorised

| Authorised S0 item | Delivered in | Spec |
|---|---|---|
| Numeric types, limits, rounding, production remainder primitives | `src/core/numeric/{safeInt,rounding,basisPoints,remainder}.ts` | `spec/formulas/numeric.md`, `remainder.md`, `units.md` |
| Deterministic RNG and seed derivation | `src/core/rng/{xoshiro128ss,streamId,sample}.ts` | `rng.md` |
| EXP tables and multi-level EXP awards | `src/core/formulas/xp.ts`, `content/tables/xp.w1.candidate.v0.1.0.json` | `xp.md` |
| Stat stacking and breakdowns | `src/core/formulas/stats.ts` | `stats.md` |
| Accuracy, damage, mitigation, crit primitives | `src/core/formulas/combat.ts` | `combat.md` |
| Atomic, idempotent resource ledger | `src/core/ledger/ledger.ts` | `ledger.md` |
| Content schemas and canonical hashing | `src/core/content/*`, `src/core/hash/canonicalJson.ts`, `spec/schema/*` | `units.md`, `canonical-json.md` |
| Independent fixture oracles | `spec/oracle/{rng_oracle,xp_oracle,exact_oracle,check_all}.py` | — |
| Unit, property, statistical, purity, isolation tests | `legion-progression-lab/test/**` | — |
| Candidate EXP curve inspection report | `src/report/curvePreview.ts`, `src/cli/curve-preview.ts`, `evidence/s0/curve-preview/` | — |

**Not done (out of scope, as instructed):** S1, event engine, zones, combat loop, recruits, classes, production systems, queues, offline settlement, dashboards, Roblox or Luau code. No change was made to the frozen simulator or to plus1game.

Full file list with SHA-256 and sizes: [file-inventory.txt](file-inventory.txt) (86 files).

---

## 2. Tools and exact versions

From [tool-versions.txt](tool-versions.txt) and [dependencies.txt](dependencies.txt):

| Tool | Version |
|---|---|
| Node.js (pinned, self-contained, checksum-verified) | 24.22.3 |
| npm | 11.19.1 |
| TypeScript | 7.0.2 |
| vitest | 4.1.12 |
| zod | 4.6.7 |
| fast-check | 4.10.2 |
| @types/node | 24.19.2 |
| Python (oracles, standard library only) | 3.12.9 |
| Git | 2.53.0.windows.1 |
| Rojo (repository pin) | 7.7.1 |
| OS | Windows 11 x64 (MINGW64 shell) |

- **Lockfile:** `legion-progression-lab/package-lock.json`, SHA-256 `d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6`.
- **Reinstall check:** after `npm ci` (a clean reinstall from the lockfile), the lockfile hash was unchanged.
- **Licence counts across the installed tree:** 63 MIT, 23 Apache-2.0, 12 MPL-2.0, 2 ISC, 1 BSD-3-Clause, 1 0BSD.
- **The MPL-2.0 packages** are all `lightningcss` builds bundled with vitest; the lab never uses them.

---

## 3. Commands run and results

| Command (inside `legion-progression-lab/`) | Result | Captured output |
|---|---|---|
| `npm ci` | 51 packages installed from the lockfile; lockfile unchanged | — |
| `npm run typecheck` | exit 0, no errors | [typecheck.txt](typecheck.txt) |
| `npm test` (`vitest --config vitest.config.ts`) | **18 files, 329 tests, 329 passed, 0 failed** | [test-output.txt](test-output.txt), [test-results.json](test-results.json) |
| `npm run test:stats` | **1 file, 7 tests, 7 passed** | [test-stats-output.txt](test-stats-output.txt) |
| `npm run fixtures:check` | **179 cases in 9 families, 0 problems** | [fixtures-check.txt](fixtures-check.txt) |
| `npm run schemas:check` | 3 of 3 exported schemas match the zod source | [schemas-check.txt](schemas-check.txt) |
| `npm run curve:preview` (twice) | Same semantic fingerprint both times | [curve-preview-run1.txt](curve-preview-run1.txt), [curve-preview-run2.txt](curve-preview-run2.txt), [reproduction.txt](reproduction.txt) |
| `python -I spec/oracle/check_all.py` (`npm run oracle:check`) | **5 groups, 0 failing; 0 mismatches** | [oracle-check.txt](oracle-check.txt) |
| Planted-bug (mutation) check | 4 of 4 planted bugs detected; every file restored with an identical hash | [mutation-check.txt](mutation-check.txt) |
| Frozen-simulator fingerprint | Identical to the M0 start | [frozen-check.txt](frozen-check.txt) |

**Tests per file** (from `test-results.json`):

| Test file | Tests |
|---|---|
| fixtures.conformance | 180 (179 cases + 1 coverage check) |
| isolation | 52 |
| purity | 21 |
| numeric | 8 |
| remainder | 8 |
| ledger | 8 |
| xp | 8 |
| combat | 7 |
| rng | 9 |
| canonicalJson | 4 |
| numeric.property | 4 |
| stats | 4 |
| content | 4 |
| remainder.property | 3 |
| schemaDrift | 3 |
| ledger.property | 2 |
| xp.property | 2 |
| runtime | 2 |
| stats/rng.distribution (separate run) | 7 |

Test counts alone are not evidence. Sections 4–7 show what the tests check.

**Property tests** use fixed seeds (`seed: 20261113`). Each runs 300 to 3000 generated cases; the counts are in the test files.

---

## 4. Coverage by invariant

The engineering invariants are from the M0 kickoff; S0 covers those that concern primitives. "Fixture" means `spec/fixtures/*.v1.json`; "test" means `legion-progression-lab/test/*`.

| Invariant / requirement | Evidence in S0 | Status |
|---|---|---|
| No negative balances | ledger fixtures `ledger.atomic.001`, `ledger.failed-not-recorded.001`; `ledger.property.test.ts` (balances ≥ 0 over random sequences) | Covered (primitive) |
| No double spend; idempotent replay; conflicting reuse refused | `ledger.replay.001`, `ledger.conflict.001`; `ledger.test.ts` (replay, key-order-independent replay, conflict); property "replaying every transaction changes nothing" | Covered |
| Aggregate lines before validation (C) | `ledger.aggregate.001`, `ledger.aggregate-overflow.001`, `ledger.net-zero.001` | Covered |
| Conservation | `ledger.property.test.ts`: balance = Σ committed nets, for every bucket | Covered |
| Explicit units, percent semantics, stable IDs | `spec/formulas/units.md`; content schema (`content.*` fixtures: unlabelled number, bad ID, unknown field) | Covered |
| No NaN, Infinity or unsafe values; numeric limits | numeric fixtures (limits, NaN, Infinity, -0); `numeric.property.test.ts` vs BigInt | Covered |
| Intermediate overflow detected (B) | `numeric.muldiv.intermediate-overflow.001`; `numeric.test.ts` | Covered |
| Correct round-half-up near the limit (B) | `numeric.rhu.naive-bug.001/002`, `numeric.rhu.half-below-2p52.001`, `numeric.rhu.overflow.001`; property vs exact rational reference | Covered |
| Exact remainders; partition invariance; zero duration; persistence; switching; large balances (A) | remainder fixtures (`split`, `zero-steps`, `perhour.split.*`, `perhour.persisted.001`, `huge-product`, `overflow`); `remainder.test.ts` (every-millisecond settlement = one settlement; save/load round trip; two interleaved keys); `remainder.property.test.ts` (any partition; vs BigInt) | Covered |
| Unambiguous level thresholds and multi-level awards; no discard or clamp | xp fixtures (`award.*`, `exhausted.*`, `guard`, `overflow`); `xp.property.test.ts` (a then b = a + b; EXP conserved) | Covered |
| Thresholds vs cumulative EXP (B) | `xp.cumulative.unsafe.001`; S0-R01 limits (cumulative ≈ L 815,401 vs threshold ≈ L 2.22 billion) | Covered |
| Deterministic RNG replay | rng fixtures (exact sequences from the oracle); `rng.test.ts` replay | Covered |
| RNG distribution correctness (separate from replay) | `test/stats/rng.distribution.test.ts`: chi-square on bytes, Bernoulli at 5000/100/20 bp, d6, worst-case span, adjacent-stream independence (α = 0.001) | Covered |
| Unambiguous stream encoding; all-zero-state prevention; stronger seeds (D) | `rng.encode.injective.*`, `rng.encode.*` failures, `rng.digest.*`; injectivity property test | Covered |
| Exact uniform-integer range and rejection behaviour (D) | `rng.uniform.span1`, `full`, `worst`, `inverted`, `too-large`, `nonint` | Covered; the 1000-attempt guard cannot be triggered with a correct generator (see §9) |
| Rare rolls are sampled, not expected values | Bernoulli primitive (one draw per trial); distribution tests | Primitive covered; drop credit is S1 |
| Crit may reach 100%, excess ignored (R-A2) | `combat.crit.cap.001`, `combat.crit.overcap.001` | Covered |
| Monotonic hit chance, diminishing mitigation, exact hits-to-kill breakpoints | combat fixtures; property tests in `combat.test.ts` | Covered |
| No W2 multipliers in the W1 baseline | content pack: `cat.research` and `cat.mastery_tree` are inactive; `stats.inactive.001` | Covered |
| Semantic vs environment fingerprints (F) | `curve-preview/semantic.json` vs `environment.json`; [reproduction.txt](reproduction.txt) | Covered (same machine) |
| Core purity; lab isolation from the frozen baseline | `purity.test.ts` (21 files), `isolation.test.ts` (52 files) | Covered |
| Pinned runtime and exact dependency versions | `runtime.test.ts` | Covered |
| No duplicate equipped items, one job per unit, queues, offline claims | — | **Not in S0** (S2, S3, S5) |

---

## 5. Coverage by fixture family

From [fixtures-check.txt](fixtures-check.txt) and [oracle-check.txt](oracle-check.txt):

| Family | Cases | Normal | Boundary | Failure | Lab | Independent oracle |
|---|---|---|---|---|---|---|
| numeric | 29 | 5 | 14 | 10 | 29/29 | `exact_oracle.py`: 29 checked, 0 mismatches |
| remainder | 18 | 7 | 6 | 5 | 18/18 | `exact_oracle.py`: 18 checked, 0 mismatches |
| rng | 37 | 10 | 14 | 13 | 37/37 | `rng_oracle.py`: 37 checked, 0 mismatches |
| xp | 22 | 5 | 6 | 11 | 22/22 | `xp_oracle.py`: 22 checked, 0 mismatches |
| stats | 9 | 3 | 2 | 4 | 9/9 | `exact_oracle.py`: 9 checked, 0 mismatches |
| combat | 32 | 10 | 12 | 10 | 32/32 | `exact_oracle.py`: 32 checked, 0 mismatches |
| ledger | 15 | 2 | 4 | 9 | 15/15 | `exact_oracle.py`: 15 checked, 0 mismatches |
| canonical-json | 7 | 2 | 2 | 3 | 7/7 | `exact_oracle.py`: 7 checked, 0 mismatches |
| content | 10 | 1 | 1 | 8 | 10/10 | 2 hash cases checked; the 8 structural failures are hand-derived |
| **Total** | **179** | 45 | 61 | 73 | **179/179** | **171 oracle-checked, 0 mismatches** |

**Also oracle-checked:**
- The 200-threshold XP table artifact: 0 mismatched levels, 0 rounding-unstable levels.
- The S0-R01 report: 60 rows plus 9 sweep variants × 30 thresholds, 0 problems.

**Where the expected values come from:**
- **Hand:** the numeric, remainder, xp-award, stats, combat and ledger expectations were written by hand and then confirmed by the oracles.
- **Oracle:** RNG encodings and sequences, XP curve tables and SHA-256 values came from the oracles, because they cannot be derived by hand.

The oracles were written from the Markdown specs and use no lab code. Same-author limitation: §9.

---

## 6. Numerical boundary and rounding tests (selection)

| Boundary | Case(s) | Expected |
|---|---|---|
| 2^53 − 1 reachable, 2^53 refused | `numeric.add.limit.001`, `numeric.add.overflow.001`, `numeric.rhu.overflow.001` | 9007199254740991; `NUMERIC_LIMIT` |
| Largest square below 2^53 | `numeric.mul.limit.001` / `.overflow.001` | 94906265² = 9007199136250225; 94906266² refused |
| Intermediate overflow although the final value fits | `numeric.muldiv.intermediate-overflow.001` | `NUMERIC_LIMIT` |
| Floating division off by one near 2^53 | `numeric.divrem.limit.003` | (2^53−2) ÷ (2^53−1) → q = 0 (binary64 gives 1.0) |
| Naive rounding bug at 0.49999999999999994 | `numeric.rhu.naive-bug.001` | 0 (the naive version gives 1) |
| Naive rounding bug at 2^52 + 1 | `numeric.rhu.naive-bug.002` | 2^52 + 1 (the naive version gives 2^52 + 2) |
| Half below 2^52 | `numeric.rhu.half-below-2p52.001` | 2^52 |
| Negative half | `numeric.rhu.003` | −2.5 → −2 |
| Remainder product about 2^79, never formed | `remainder.accrue.huge-product.001` | granted 9007199120523263, rem 1 |
| Largest denominator 2^26 / one above | `remainder.accrue.max-den.001` / `den-too-large.001` | ok / `INVALID_DENOMINATOR` |
| Every-millisecond settlement = one settlement | `remainder.test.ts` (600,000 one-ms steps) | identical |
| Cumulative EXP unsafe while thresholds are safe | `xp.cumulative.unsafe.001` | stops at level 2, not clamped |
| Award past table end | `xp.award.exhausted.001/002` | `XP_TABLE_EXHAUSTED` (nothing discarded) |
| Smallest probability 2^−32 / below it | `rng.threshold-p.min.001` / `too-small.001` | threshold 1 / `PROBABILITY_TOO_SMALL` |
| Crit 100% / 125% | `combat.crit.cap.001` / `overcap.001` | effective 10000 bp; overcap 2500 |
| Damage exactly .5 | `combat.dmg.crit-half.001` | 7 × 1.5 = 10.5 → 11 |
| Damage floor | `combat.dmg.floor.001` | 0.36 → 1 |
| ECMAScript number formatting | `cjson.numbers.001` | `1e+21`, `1e-7`, `10000000000000000`, `5e-7`, `0.000001`, −0 → `0` |

Property tests compare against exact BigInt or rational references over thousands of generated inputs:
- `addSafe`, `mulSafe`, `divRem` and `roundHalfUp` across the full safe range;
- `accrue` with arbitrary partitions and the per-hour chain.

---

## 7. Determinism and reproduction fingerprints

| Item | Fingerprint (SHA-256) |
|---|---|
| S0-R01 semantic fingerprint (canonical JSON of `semantic`) | `24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9`, identical in both runs |
| `semantic.json` file bytes | `4f3ad8d72b88598e33537513e662bf4d9756176dde7d3fc38926fff65c90f49d`, byte-identical in both runs |
| Content pack `s0-core` 0.1.0 (canonical) | `39ab7e5978c4a62bb2921ecb9ad0b5432a48a2c6c97768e2c58b07902a3b356a` |
| XP table artifact (canonical; recorded in the pack) | `990fe508ef0f83f196a4052a56354c989fc9e93f36070754ed222295a69fb0dc` |
| `package-lock.json` | `d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6` |

- **Environment metadata:** recorded separately in [curve-preview/environment.json](curve-preview/environment.json) (Node, OS, Git state, timestamp) and not fingerprinted.
- **Reproduction:** shown on one machine and runtime (Windows x64, Node 24.22.3). **No cross-platform identity is claimed.**
- **Every file:** SHA-256 values for all files are in [file-inventory.txt](file-inventory.txt).

---

## 8. Candidate EXP curve preview (S0-R01)

Full report: [curve-preview/report.md](curve-preview/report.md). Inputs are `candidate`; this is an **inspection aid, not a balance result**.

- **Curve:** `T(L) = roundHalfUp(10 · L^1.6)` (a = 10, p = 1.6, g = 1); 200 stored thresholds.
- **First values:**
  - thresholds T(1..12): 10, 30, 58, 92, 131, 176, 225, 279, 336, 398, 464, 533;
  - cumulative EXP to reach L5: 190; L10: 1,337; L25: 15,732.
- **Limits:**
  - cumulative EXP is safe for the whole 200-level table;
  - approximately, cumulative EXP would pass 2^53 − 1 around level 815,401, while a single threshold would not until around level 2.22 billion.
- **Sweep preview for S1-E01:** a ∈ {8, 10, 12} × p ∈ {1.6, 1.8, 2.0}, all oracle-checked. For example, a = 10, p = 2.0 gives cumulative EXP of 300 to reach L5 and 2,850 to reach L10.

---

## 9. Limitations and honest notes

1. **Oracle independence is partial.** The Python oracles and the TypeScript lab were written by the same author (Claude) from the same specs, in different languages and without shared code. A shared misunderstanding of a spec would pass both. Mitigations:
   - hand derivations for most expected values;
   - exact BigInt and rational property references;
   - the planted-bug check;
   - the xoshiro128** step function compared line by line with the published reference code.

   The reviewer should still spot-check derivations.
2. **No Luau parity yet.** Lune conformance is planned for M2.
3. **Cross-platform reproducibility is untested.** Only Windows x64 with Node 24.22.3 was used.
4. **The `uniformInt` 1000-attempt guard has no test that triggers it.** It cannot fire with a correct generator (probability ≤ 2^−1000). Its behaviour is specified and visible in code review.
5. **Content structural failures are hand-checked only.** The 8 `INVALID_CONTENT` fixtures are checked by the lab against hand-derived rules; the oracle checks only the content hash cases.
6. **Exported JSON Schemas omit some zod rules.** zod refinements (for example "safe integer" or "range") cannot be expressed in JSON Schema, so the exports leave them out. zod stays authoritative and the exports are documentation for other engines.
7. **Hit-chance and mitigation tolerance.** These values are not exactly representable in binary, so their fixtures use a relative tolerance of 10^−12. Authoritative integer outcomes never depend on them directly.
8. **The S1 diagnostic hint is unchanged.** Hand arithmetic in plan v1.0 suggested level 5 comes early with p = 1.6. S0 does not test pacing; S1-E01 will.
9. **Node 24 is not on the system PATH.** It is a self-contained copy, so commands need the PATH line from the README. The system Node 25 is untouched.
10. **Rojo server restart needed.** A Rojo server (7.7.0-rc.1) from the old workspace was still running during this work. Studio now has the 7.7.1 plugin and needs `rojo serve` restarted from the canonical repository.
11. **The public GitHub remote blocks pushing.** Nothing was pushed; the owner must make the repository private, or choose another remote.

---

## 10. Provenance and changelog

- [../../PROVENANCE.md](../../PROVENANCE.md): no code copied; ideas reused from the frozen lab (concept only); published algorithms; dependencies.
- [../../CHANGELOG.md](../../CHANGELOG.md): the S0 entry.

---

## 11. Git state

From [git-status.txt](git-status.txt):
- **Commits:** `0209d93` (M0 resolution and corrections) on top of `3aced25` (M0 import). Both are local; nothing was pushed.
- **S0 itself:** **all S0 files are untracked** (not committed, as instructed). Tracked files changed since `0209d93`: none.
- **Patch:** [s0.patch](s0.patch) holds a unified diff of every S0 file against an empty file (11,382 lines). It was generated without touching the Git index.

---

## 12. Frozen simulator unchanged during S0

From [frozen-check.txt](frozen-check.txt):
- all 3,012 files under the original `Roblox Incremental` workspace (including `progression-lab/.git`) are identical to the M0 start by path, size, modification time and SHA-256;
- combined checksum-list fingerprint `1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d`;
- HEAD `74499ef2a7ec154bdcbc10b1152f2aec89c3c913`;
- only branch `master`;
- the same 12 uncommitted Original v1 files.

The old Legion workspace `Desktop/Legion Incremental/` was re-hashed: 16 files, 0 changed.

---

## 13. Reviewer checklist

- [ ] Specs (`spec/formulas/*.md`) match the corrections A–G in `planning/M0_RESOLUTION.md` §4.
- [ ] Spot-check at least five hand derivations per family in `spec/fixtures/`.
- [ ] Re-run `npm ci && npm test && npm run test:stats && npm run fixtures:check && npm run oracle:check && npm run schemas:check` with Node 24.22.3.
- [ ] Run `npm run curve:preview` twice; the semantic fingerprint must equal `24dd9064…b9b9`.
- [ ] Review `mutation-check.txt` and, if desired, plant your own bug.
- [ ] Confirm no S1-or-later functionality is present.
- [ ] Confirm every content value is labelled `candidate`.

**Next step (owner):** after the independent review, accept or reject S0. On acceptance, Claude makes the S0 commit. S1 starts only after a separate explicit approval.
