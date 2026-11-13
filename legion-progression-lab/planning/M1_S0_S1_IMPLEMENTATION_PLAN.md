# M1 · S0 + S1 Implementation Plan

**Milestone:** first implementation increment of M1 (the Legion progression lab) · **Version:** 1.1 (13 November 2026) · **Status:**
- **S0 AUTHORISED** (`M0_RESOLUTION.md` §5).
- **S1 NOT AUTHORISED.** Its plan is kept here for later approval.
- v1.0 of this plan is preserved in Git (import commit); `M0_CHANGE_SUMMARY.md` lists what changed.

> **In plain words.**
> - **S0** builds the lab's basic calculators and the checks that prove them right:
>   - exact whole-number maths;
>   - exact bookkeeping for fractions of a resource;
>   - the random-number generator;
>   - level-up tables;
>   - stat bonuses;
>   - damage;
>   - the resource ledger.
>
>   It also produces one inspection report showing the candidate level curve.
> - **Separate checker programs:** in Python, a different language, they work out the right answers on their own, so the lab is checked against something it didn't produce.
> - **S1** (one hero, three zones) waits for your approval after S0 is reviewed.

---

## 1. Preconditions

| # | Precondition | Status |
|---|---|---|
| 1 | M0 conditionally accepted; owner decisions recorded | Done: `M0_RESOLUTION.md` v1.0 |
| 2 | Mandatory corrections A–H applied to the planning documents | Done: architecture v1.1, experiment plan v1.1, this plan v1.1, matrix v1.1 addendum |
| 3 | Canonical repository, backup and archive verified | Done: `M0_REPOSITORY_VERIFICATION.md` |
| 4 | Documentation checkpoint committed (local, not pushed) | Done before S0 starts |
| 5 | Node 24 LTS installed (self-contained, checksum-verified) | Done: 24.22.3 in `%LOCALAPPDATA%\legion-tools\` |
| 6 | Permission to install development dependencies | Given (D-10) |

---

## 2. S0 scope (authorised)

**In scope**
1. **Numbers and limits:**
   - safe-integer arithmetic with intermediate-overflow checks;
   - exact `divRem` and `ceilDiv`;
   - corrected `roundHalfUp`;
   - basis points.
2. **Remainder accounting:** exact accumulators (`accrue`, den ≤ 2^26) and the per-hour two-stage chain, all partition-invariant (architecture §6.3).
3. **RNG:**
   - xoshiro128**;
   - length-prefixed stream identity, SHA-256 state derivation, all-zero-state rule;
   - Bernoulli thresholds from basis points and probabilities;
   - rejection-sampled `uniformInt`.
4. **EXP:**
   - integer XP table builder from a candidate curve, plus a cumulative report with separate safe limits;
   - multi-level awards that never discard EXP.
5. **Stat stacking** across registered categories, with a breakdown.
6. **Combat primitives:** hit chance (integer-power saturating curve), mitigation K/(K+D), crit chance cap at 100% with overcap reported, integer damage per landed hit, hits-to-kill.
7. **Ledger:** atomic and idempotent, with per-bucket aggregation, replay of an identical payload and `TX_CONFLICT`.
8. **Content and hashing:** labelled values, IDs, the S0 content pack, the XP table artifact, validation, canonical JSON and SHA-256 fingerprints.
9. **Specs and fixtures:** formula specs, fixture format and families, and the independent oracles (Python stdlib: `hashlib`, `decimal`, `fractions`).
10. **Tests:** unit, property (fast-check, fixed seeds), statistical (fixed seeds, α = 0.001), purity, isolation, runtime and schema-drift tests.
11. **Report:** the candidate EXP curve inspection report `S0-R01-curve-preview`.

**Explicitly out of scope:** S1, the event engine, zones, combat loop, recruits, classes, professions and production queues, offline settlement, any experiment runner beyond the S0 report, dashboards, Roblox or Luau code, any change to `Desktop/Roblox Incremental/` or plus1game.

**All numerical coefficients are `candidate`.**

---

## 3. S0 files

Paths are relative to the canonical repository root `Documents/GitHub/legion-incremental/`.

```
legion-progression-lab/
├─ package.json                  exact versions; scripts (§6); engines.node "24.22.3"
├─ package-lock.json             lockfile (committed together with S0 after review)
├─ .node-version                 24.22.3
├─ .npmrc                        engine-strict=true, save-exact=true
├─ .gitignore                    node_modules/, results/, coverage/, *.local
├─ tsconfig.json                 strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + erasableSyntaxOnly
│                                + verbatimModuleSyntax + allowImportingTsExtensions + noEmit, module/moduleResolution nodenext
├─ vitest.config.ts              default run (excludes test/stats)
├─ vitest.stats.config.ts        statistical tests only
├─ README.md                     purpose, commands, labels, limits (plain words)
├─ PROVENANCE.md                 ideas reused from the frozen lab (concept only, no code copied)
├─ CHANGELOG.md                  versioned changes to specs, fixtures, content
├─ content/
│  ├─ s0-core.candidate.v0.1.0.json        candidate S0 content pack (xp curve, stat categories, combat params)
│  └─ tables/xp.w1.candidate.v0.1.0.json   integer XP table artifact (lab-built, oracle-verified)
├─ src/core/errors.ts            LabError with stable codes
├─ src/core/numeric/safeInt.ts   MAX_SAFE, isSafeInt, assertSafeInt, addSafe, subSafe, mulSafe, divRem, ceilDiv
├─ src/core/numeric/rounding.ts  roundHalfUp, roundHalfUpToSafeInt
├─ src/core/numeric/basisPoints.ts  BP_SCALE, assertBp
├─ src/core/numeric/remainder.ts accrue, MAX_DEN, perHourChain (accruePerHour)
├─ src/core/hash/canonicalJson.ts canonicalJson, sha256Hex, fingerprint
├─ src/core/rng/streamId.ts      encodeStreamId, deriveRngState
├─ src/core/rng/xoshiro128ss.ts  RngState, nextU32
├─ src/core/rng/sample.ts        thresholdFromBp, thresholdFromProb, bernoulli, uniformInt
├─ src/core/formulas/xp.ts       xpCurveValue, buildXpTable, cumulativeReport, applyExpAward
├─ src/core/formulas/stats.ts    evaluateStat (+ breakdown)
├─ src/core/formulas/combat.ts   hitChance, mitigationFactor, critChanceEffective, damagePerHit, hitsToKill
├─ src/core/ledger/ledger.ts     emptyLedger, applyTx, balance
├─ src/core/content/labels.ts    Labelled<T>, weakestLabel
├─ src/core/content/schema.ts    zod: IDs, labelled numbers, S0 content pack, XP table artifact
├─ src/core/content/validate.ts  cross-reference and table checks
├─ src/spec/fixtureSchema.ts     zod schema for spec/fixtures files
├─ src/report/curvePreview.ts    pure builder of the S0-R01 semantic report
├─ src/cli/paths.ts              repository-relative path helpers (I/O lives only in src/cli)
├─ src/cli/build-xp-table.ts     builds content/tables/xp…json from the content pack
├─ src/cli/curve-preview.ts      writes results/s0/S0-R01-curve-preview/{report.md,semantic.json,environment.json}
├─ src/cli/export-schemas.ts     writes spec/schema/*.schema.json from zod
├─ src/cli/fixtures-check.ts     validates and runs every spec/fixtures case, prints a family summary
├─ test/helpers/fixtures.ts      loads fixture files
├─ test/helpers/reference.ts     BigInt reference implementations used only by property tests
├─ test/numeric.test.ts          safe ints, intermediate overflow, divRem, roundHalfUp boundaries
├─ test/numeric.property.test.ts properties vs BigInt reference
├─ test/remainder.test.ts        splitting, zero duration, persistence, switching, large balances
├─ test/remainder.property.test.ts partition invariance vs BigInt reference
├─ test/rng.test.ts              stream encoding, zero state, sequences, Bernoulli, uniformInt boundaries
├─ test/xp.test.ts               table build, cumulative limits, awards, no discard, errors
├─ test/xp.property.test.ts      split awards equal a single award
├─ test/stats.test.ts            stacking and breakdown
├─ test/combat.test.ts           hit curve, mitigation, crit cap, damage floor, hits-to-kill
├─ test/ledger.test.ts           aggregation, negative, overflow, duplicate lines, replay, conflict, failure
├─ test/ledger.property.test.ts  random sequences: no negative, conservation, replay
├─ test/canonicalJson.test.ts    ordering, numbers, rejections, fingerprints
├─ test/content.test.ts          content pack and XP table artifact validation
├─ test/fixtures.conformance.test.ts every spec/fixtures case through the lab
├─ test/schemaDrift.test.ts      committed spec/schema equals freshly exported schemas
├─ test/purity.test.ts           core has no clock, ambient RNG, I/O or process access
├─ test/isolation.test.ts        no imports outside the lab except ../spec; no references to the frozen lab
├─ test/runtime.test.ts          Node major version is 24
└─ test/stats/rng.distribution.test.ts chi-square and binomial tests (fixed seeds)

spec/
├─ README.md                     what spec/ is; data and prose only; fixture independence
├─ formulas/units.md             unit suffixes, integer/fraction semantics
├─ formulas/numeric.md           safe ints, overflow, divRem, roundHalfUp (v1)
├─ formulas/remainder.md         accrue, chains, guarantees G1–G5, persistence (v1)
├─ formulas/rng.md               xoshiro128**, stream encoding, initialisation, Bernoulli, uniformInt (v1)
├─ formulas/xp.md                curve family, table rounding, thresholds vs cumulative, awards (v1)
├─ formulas/stats.md             categories, order of evaluation, breakdown (v1)
├─ formulas/combat.md            hit chance, mitigation, crit, damage per hit, hits-to-kill (v1)
├─ formulas/ledger.md            transaction shape, aggregation, idempotency, errors (v1)
├─ formulas/canonical-json.md    canonical JSON, semantic vs environment, fingerprints (v1)
├─ schema/*.schema.json          exported from zod (fixture, content pack, XP table)
├─ fixtures/{numeric,remainder,rng,xp,stats,combat,ledger,canonical-json,content}.v1.json
└─ oracle/
   ├─ rng_oracle.py              hashlib + independent xoshiro128**; generates/checks rng fixture sequences
   ├─ xp_oracle.py               decimal at 60 and 120 digits; table regeneration and rounding-stability check
   ├─ exact_oracle.py            Fraction/int recomputation of numeric, remainder, stats, combat, ledger, canonical-json cases
   └─ check_all.py               runs every oracle check; non-zero exit on any disagreement

legion-progression-lab/evidence/s0/   S0_EVIDENCE.md and captured outputs (created at the end of S0)
```

---

## 4. Fixture schema (unchanged in substance from v1.0)

- **Required fields:** `fixtureSet`, `fixtureVersion`, `specRef`, `status`, `independence`, `cases[]`.
- **Each case:** `id`, `kind` (`normal | boundary | failure`), `description`, `input`, and either `expected` or `expectedError`. It may add `tolerance` (`exact` or `{rel, abs}`), and must carry a `derivation`, which names a hand step or an oracle script.
- **Rules:**
  - Case IDs are unique across all files.
  - Every family has at least one boundary and one failure case.
  - `"NaN"`, `"Infinity"` and `"-Infinity"` appear only as strings in failure inputs.
  - The zod schema in `src/spec/fixtureSchema.ts` is the source; `spec/schema/fixture.schema.json` is exported from it and checked for drift.

---

## 5. Candidate S0 content (all `candidate`)

| Parameter | Candidate | Range for later sweeps | Purpose |
|---|---|---|---|
| XP curve family | `powerGeometric`: `T(L) = roundHalfUp(a·L^p·g^(L−1))`, L ≥ 1 | — | R08.02 smooth variable growth |
| a | 10 | 8–12 | L2 after 1–3 kills (S1) |
| p | 1.6 | 1.6–2.0 | Early steepness (hand arithmetic suggests L5 arrives early at 1.6; S1-E01 sweeps p) |
| g | 1.00 | 1.00–1.04 | Later growth (S6) |
| Table length | 200 thresholds (levels 1→201) | — | Technical table length, not a design cap (R08.03) |
| maxLevelUpsPerAward | 1000 | — | Runaway guard |
| Stat categories | `cat.damage.additive` (additive pool), `cat.damage.monument` (multiplier, inactive in S0), `cat.research` (multiplier, inactive: W2 hook), `cat.mastery_tree` (multiplier, inactive: W2 hook) | — | R05.17 / R08.10 registry; inactive = factor 1 |
| mitigationK | 100 | 50–200 | R08.08 |
| minDamagePerHit | 1 | 1 | Damage floor |
| hitCurve hAtReqBp / floorBp / k | 9000 / 1000 / 2 | 8000–9500 / 500–2000 / 1–4 | R08.07 |
| critChanceBp / critMultBp (base) | 500 / 15000 | 0–1000 / 12500–20000 | R02.09; cap at 10000 bp (R-A2) |

---

## 6. Commands

The commands assume Node 24.22.3 is first on PATH. In PowerShell:

```
$env:Path = "$env:LOCALAPPDATA\legion-tools\node-v24.22.3-win-x64;" + $env:Path
```

```
cd legion-progression-lab
npm ci                           # exact versions from the lockfile (engine-strict)
npm run typecheck                # tsc --noEmit
npm test                         # all non-statistical tests
npm run test:stats               # statistical tests (fixed seeds)
npm run fixtures:check           # validate fixtures and run them through the lab
npm run oracle:check             # python -I ../spec/oracle/check_all.py
npm run schemas:check            # exported schemas equal the committed ones
npm run xp:build                 # (re)build the XP table artifact from the content pack
npm run curve:preview            # S0-R01 report; prints the semantic fingerprint
```

---

## 7. S0 definition of done (engineering gates)

1. `typecheck`, `test`, `test:stats`, `fixtures:check`, `oracle:check` and `schemas:check` all pass. Outputs are captured in `evidence/s0/`, with the repository path redacted to `<REPO>`.
2. Every fixture case has a derivation. Every family has boundary and failure cases. The oracles agree with every oracle-checkable expected value.
3. The XP table artifact equals the oracle's independent table, and every entry is rounding-stable.
4. Two runs of `curve:preview` produce the same semantic fingerprint. Environment metadata is recorded separately.
5. Every unit, rounding point, limit and error code used in code is written in `spec/formulas/`.
6. `PROVENANCE.md` and `CHANGELOG.md` are updated.
7. The frozen `progression-lab/` fingerprint is unchanged after S0.
8. **Evidence pack:** `evidence/s0/S0_EVIDENCE.md` plus a ZIP for the independent reviewer (no `node_modules`, credentials or unrelated files).
9. **No commit and no baseline promotion of S0** until the independent review and owner acceptance. The S0 work stays as uncommitted changes, with `git status` and `git diff` captured in the evidence.

---

## 8. S1: NOT AUTHORISED (kept for later approval)

**Plan carried forward from v1.0, with the v1.1 corrections**
- **Scope** is unchanged from v1.0: a single classless hero, zones 1–3, retaliation, death and respawn, kill gates and the three flags, a stub active-only miniboss, reference stepper, estimator, policies, and experiments S1-E01 to E08.
- **Event semantics are now pre-specified** in architecture v1.1 §9.3 and must be implemented as written:
  - simultaneous lethal attacks;
  - cancellation and stale events via epochs;
  - half-open session intervals;
  - online→offline handoff;
  - same-moment passes;
  - the metamorphic entity-renaming test;
  - kill credit IDs.
- **S1 is a diagnostic model** (experiment plan v1.1, principle 10):
  - Engineering gates decide acceptance.
  - Pacing hypotheses are reported, and never re-defined after a run.
- **v1.0 candidate inputs** (zones 1–3, hero stats) remain candidates for the S1 approval request. They are not reproduced here, so they cannot be mistaken for authorised content; see the import commit for v1.0 §6.

**Before S1 may start:**
1. S0 independently reviewed and accepted by the owner.
2. Explicit owner approval of the S1 scope.
3. The S0 commit made after that acceptance.
4. The frozen-lab fingerprint re-checked.
