# M1 · S0 + S1 Implementation Plan

**Milestone:** first implementation increment of M1 (the Legion progression lab) · **Prepared:** 13 November 2026 · **Status:** PROPOSED. **Do not start until the owner approves M0** (decisions D-01, D-02, D-03, D-07 ordering, D-09 and D-10). Nothing in this plan has been built or run.

> **In plain words.** The first build is deliberately small, in two steps. **S0** builds the basic calculators and their checks: whole-number maths, the random-number generator, level thresholds, damage and the resource ledger. **S1** uses them to simulate one hero, with no recruits, fighting through three zones. It records how long kills, levels and zone unlocks take with our *invented* starting numbers. If those numbers miss your targets, the report says so honestly. Recruits, crafting, Monuments and offline progress come in later steps.

---

## 1. Preconditions (owner approvals needed before the first file is created)

| # | Approval | Why it blocks |
|---|---|---|
| 1 | M0 documents reviewed and accepted (owner + independent reviewer) | Kickoff rule 6 |
| 2 | D-02 numeric policy | S0 encodes it in every primitive |
| 3 | D-10 tooling (TypeScript, Node LTS, vitest, zod, fast-check; Python stdlib for fixture oracles) | Determines every file below |
| 4 | D-01 access/visit/checkpoint rules | S1 gates and travel |
| 5 | D-03 hero death and auto-farm recovery | S1 survival model |
| 6 | D-07 same-moment event ordering (the queue half can wait until S3) | S1 event engine |
| 7 | D-09 canonical repository chosen and first commit made (design pack + M0 docs) | Git checkpoints (R10.20) |
| 8 | Permission to run `npm install` (downloads packages from the npm registry) | Network action on the owner's machine |
| 9 | Node LTS installed (audit R-06: this machine has Node v25.9.0) | Reproducible runtime |

If the owner chooses differently from any recommendation, this plan is revised before work starts.

---

## 2. Scope

### 2.1 S0: schema and deterministic numeric primitives
1. **Units and limits:** safe-integer arithmetic with explicit `NUMERIC_LIMIT` errors.
2. **Rounding helpers:** `roundHalfUp`, `ceilDiv`, `floorWithCarry`.
3. **Basis-point conversion.**
4. **Random numbers:** xoshiro128**, FNV-1a + SplitMix32 stream derivation, Bernoulli via a 32-bit threshold, rejection-sampled uniform integers.
5. **XP:** table builder from a candidate curve (integers), cumulative table, multi-level award.
6. **Stat stacking:** flat + additive pools + registered multiplier categories, with a breakdown.
7. **Combat primitives:** hit chance (candidate saturating curve), mitigation (candidate K/(K+D)), integer damage per landed hit, crit roll, hits-to-kill.
8. **Ledger:** available bucket only in S0; atomic transactions; duplicate `txId` is a no-op.
9. **Content:** labelled values, schema, cross-reference validation, canonical JSON hash.
10. **Fixtures and specs:** fixture format and conformance harness; formula specs in `spec/formulas/`.
11. **Guard scans:** purity and isolation scans.

### 2.2 S1: single hero, three-zone combat loop, rewards and gates
1. **Model:** account and hero state, commands, events, reason codes, and the ordering key from architecture §9.
2. **Engine:**
   - a deterministic event queue;
   - a reference stepper covering swings, crits, enemy retaliation, hero death and respawn, out-of-combat regeneration, spawn slots and respawn, engagement overhead, travel and teleport;
   - kill credit (EXP, gold, one material, one test-only rare drop, zone kill counter);
   - kill gates and the three flags;
   - an active-only miniboss gate stub in zone 3.
3. **Rate estimator:** expected TTK, kills/h, EXP/h, gold/h, survival.
4. **Policies:** POL-FRONTIER, POL-STAY, POL-BEST-SHOWN, ORC-BRUTE, ORC-FORK.
5. **Experiment tooling:** manifest schema, runner with replicates and quantiles, CSV/JSON/Markdown reports, fingerprints, `exp:verify`.
6. **Content:** candidate content pack `w1-slice.candidate.v0.1.0` (zones 1–3, hero).

### 2.3 Explicitly out of scope for S0/S1
- Recruits, deployment, squads, independent workers, assignments (S2).
- Classes, talents, abilities, class mastery (S2). The hero stays classless.
- Professions, gathering, smithing, equipment instances, gear tiers, crafting, queues, reservations (S3).
- **Any gold or material sink.** Resources accumulate and are reported only. No purchase mechanic is invented.
- Monuments, Bestiary, Feats, class records (S4).
- Offline progress of any kind (S5). Between sessions nothing accrues, and the report says so.
- Zones 4–10, accuracy requirements above 0, elites, variants, Normal/Elite bosses beyond the stub (S6).
- Parties, orders, monetisation, analytics, any Roblox code, any UI or dashboard.
- Any edit to the frozen `progression-lab/` or to the Rojo game folders.

---

## 3. Exact files to create

Paths are relative to the Legion repository root (D-09). Nothing outside `legion-progression-lab/` and `spec/` is touched.

### 3.1 S0 files

```
legion-progression-lab/
├─ package.json                 name "legion-progression-lab", private, "type": "module", engines.node = LTS line, scripts (§9)
├─ package-lock.json            generated by npm install (exact versions)
├─ tsconfig.json                strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, erasableSyntaxOnly,
│                               verbatimModuleSyntax, allowImportingTsExtensions, noEmit, target ES2023, module NodeNext
├─ vitest.config.ts             test include patterns; stats tests excluded from the default run
├─ .node-version                pinned Node LTS version
├─ .gitignore                   node_modules/, results/, *.local, coverage/
├─ README.md                    plain-language purpose, commands, labels, limits
├─ PROVENANCE.md                ideas reused from the frozen lab (path, commit 74499ef, what, licence); "no code copied" unless listed
├─ CHANGELOG.md                 versioned changes to formulas, content, fixtures, baselines (decision ID, rationale, evidence)
├─ src/core/errors.ts           error codes: NUMERIC_LIMIT, INVALID_NUMBER, NEGATIVE_BALANCE, DUPLICATE_TX, INVALID_CONTENT, …
├─ src/core/numeric/units.ts    branded types: Ms, Bp, Prob, Mult, SafeInt; unit-suffix conventions
├─ src/core/numeric/safeInt.ts  assertSafeInt, addSafe, subNonNegative, mulSafe, compare; MAX_SAFE = 2^53−1
├─ src/core/numeric/rounding.ts roundHalfUp, ceilDiv (integers), floorWithCarry(raw, carry) → { granted, carry }
├─ src/core/numeric/basisPoints.ts  bpToFraction, fractionToBpExact (rejects non-integer bp)
├─ src/core/rng/xoshiro128ss.ts state type (4 × u32), nextU32 (pure: returns [value, newState])
├─ src/core/rng/streams.ts      fnv1a32(utf8 bytes), splitmix32 finaliser, deriveStream(root, purpose, entity, counter)
├─ src/core/rng/sample.ts       bernoulliThreshold(prob) → integer T, bernoulli(state, T), uniformInt(state, lo, hi)
├─ src/core/formulas/xp.ts      buildXpTable(curve, maxLevel) → integer[], cumulative(table), applyExpAward(level, expInto, award, table)
├─ src/core/formulas/stats.ts   evaluateStat(base, sources[], categoryRegistry) → { value, breakdown[] }
├─ src/core/formulas/combat.ts  hitChance(acc, req, params), mitigationFactor(def, K), damagePerHit(raw, crit, mitigation, floor),
│                               hitsToKill(hp, dmg), expectedDamagePerSwing(...) (estimator helper)
├─ src/core/ledger/ledger.ts    Ledger type (available only in S0), applyTx(ledger, tx) → Ok | Err (atomic, idempotent by txId)
├─ src/core/content/labels.ts   Labelled<T> { value, label, range?, hypothesis?, note? }; weakestLabel()
├─ src/core/content/schema.ts   zod schemas: ids, labelled numbers with unit suffixes, curve definitions, S1 content (§5)
├─ src/core/content/validate.ts cross-reference and monotonicity checks; safe-integer checks on generated tables
├─ src/core/hash/canonicalJson.ts  canonicalize (sorted keys, no whitespace), sha256Hex via node:crypto
├─ src/cli/fixtures-check.ts    validates every spec/fixtures file against spec/schema/fixture.schema.json, then runs conformance
├─ src/cli/curve-preview.ts     prints the candidate XP table and the technical-limit level (deterministic report, S0-R01)
├─ test/numeric.safeInt.test.ts
├─ test/numeric.rounding.test.ts         includes carry: 1,000 small awards = one large award, exactly
├─ test/rng.sequence.test.ts             exact outputs vs spec/fixtures/rng.v1.json (from the independent Python oracle)
├─ test/rng.replay.test.ts               same seed → same sequence; different purpose → independent stream
├─ test/stats/rng.distribution.test.ts   chi-square uniformity, Bernoulli CI, uniformInt bias (fixed seeds, α = 0.001)
├─ test/xp.test.ts                       thresholds, cumulative, multi-level award, limit, NaN rejection
├─ test/stats.stacking.test.ts           pools add within category, categories multiply, inactive = 1, breakdown = value
├─ test/combat.primitives.test.ts        hit curve monotonic/saturating, mitigation diminishing, floor 1, crit clamp, hits-to-kill breakpoints
├─ test/ledger.test.ts                   atomicity, no negative, duplicate txId no-op, limit at 2^53−1
├─ test/ledger.property.test.ts          fast-check: random tx sequences never produce negative/unsafe balances; Σ deltas = Δ balance
├─ test/content.schema.test.ts           valid pack accepted; each invalid case rejected with the named error
├─ test/fixtures.conformance.test.ts     every spec/fixtures case through the matching primitive, using the case's tolerance
├─ test/purity.test.ts                   src/core has no Date, Math.random, process, fs/net/child_process imports
└─ test/isolation.test.ts                no import outside legion-progression-lab/ except ../spec; no path to "Roblox Incremental"

spec/
├─ README.md                    what spec/ is, the "data and prose only" rule, fixture independence rule
├─ formulas/units.md            unit suffixes, integer/fraction semantics, limits, rounding points
├─ formulas/numeric.md          safe-int, roundHalfUp, ceilDiv, carry (v1)
├─ formulas/rng.md              xoshiro128**, FNV-1a, SplitMix32, stream derivation, Bernoulli threshold, uniformInt (v1)
├─ formulas/xp.md               xpRequired indexing, table generation and rounding, multi-level award, guard (v1)
├─ formulas/stats.md            additive pools, multiplier categories, breakdown ordering (v1)
├─ formulas/combat.md           hit chance, mitigation, damage per hit, crit, hits-to-kill (v1)
├─ formulas/ledger.md           transaction shape, atomicity, idempotency, error codes (v1)
├─ schema/fixture.schema.json   shape of every fixture file (§4)
├─ schema/content.schema.json   exported from the zod schema (regenerated by a script, checked in)
├─ fixtures/numeric.v1.json
├─ fixtures/rng.v1.json
├─ fixtures/xp.v1.json
├─ fixtures/stats.v1.json
├─ fixtures/combat.v1.json
├─ fixtures/ledger.v1.json
├─ fixtures/content-validation.v1.json
├─ oracle/rng_oracle.py         stdlib-only independent xoshiro128**/FNV/SplitMix32; prints the rng fixture's expected sequences
├─ oracle/xp_oracle.py          fractions.Fraction evaluation of the candidate curve with the spec's rounding
└─ oracle/combat_oracle.py      exact arithmetic for damage, mitigation and hits-to-kill cases
```

### 3.2 S1 files (added after S0 is approved)

```
legion-progression-lab/
├─ src/model/ids.ts             ZoneId, EnemyId, ResourceId, CheckpointId, GateId (validated string formats)
├─ src/model/state.ts           AccountState (S1 subset), HeroState, ZoneFlags, GateState, SessionState
├─ src/model/commands.ts        Travel, Teleport, Engage, SetAutoFarm, StartBoss, Rest, EndSession; validate(state, cmd)
├─ src/model/events.ts          event union (SwingResolved, EnemyAttack, KillCredited, ExpAwarded, LevelUp, GoldDeposited,
│                               ItemDropped, GateProgress, GateCompleted, ZoneAccessUnlocked, ZoneVisited, HeroDied,
│                               HeroRespawned, BossStarted, BossFailed, BossCleared, SessionStarted, SessionEnded, …)
├─ src/model/reasons.ts         command rejection codes and activity/bottleneck codes
├─ src/engine/orderKey.ts       (tMs, phase, entityOrder, seq) comparison
├─ src/engine/eventQueue.ts     deterministic priority queue (binary heap on orderKey)
├─ src/engine/combatLoop.ts     hero swing scheduling, enemy retaliation, death, regeneration, spawn slots
├─ src/engine/rewards.ts        kill credit (txId kill:<stream>:<seq>), drop rolls, carry, counters
├─ src/engine/gates.ts          kill gates, flags, checkpoint discovery, boss gate stub (activeOnly)
├─ src/engine/travel.ts         walk and teleport durations; access/visit/checkpoint validation
├─ src/engine/stepper.ts        reference simulation loop: pops events, applies, emits, calls policy at POLICY phase
├─ src/engine/estimator.ts      analytic expected TTK, kills/h, EXP/h, gold/h, deaths/h, limiting factor
├─ src/engine/observation.ts    what a policy may see (architecture §4.1)
├─ src/policy/types.ts          Policy interface: decide(observation) → commands[]
├─ src/policy/frontier.ts       POL-FRONTIER
├─ src/policy/stay.ts           POL-STAY
├─ src/policy/bestShown.ts      POL-BEST-SHOWN
├─ src/policy/oracleBrute.ts    ORC-BRUTE (tagged oracle)
├─ src/policy/oracleFork.ts     ORC-FORK (clone state, run alternatives for a fixed horizon)
├─ src/experiments/manifest.ts  zod schema for manifests (experiment plan §6)
├─ src/experiments/replicate.ts seeds per replicate, sweep expansion
├─ src/experiments/quantiles.ts p10/p50/p90 (nearest-rank, documented)
├─ src/experiments/report.ts    summary.json, quantiles.csv, timeline.csv, events.sample.jsonl, report.md (labelled)
├─ src/experiments/fingerprints.ts input and result fingerprints
├─ src/experiments/runner.ts    validates manifest and hashes, runs, writes outputs
├─ src/cli/run.ts               `npm run exp -- <manifest>`
├─ src/cli/verify.ts            `npm run exp:verify -- <results dir>` (rerun and compare fingerprints)
├─ content/w1-slice.candidate.v0.1.0.json      candidate inputs (§6); every value labelled "candidate"
├─ manifests/s0/S0-R01-curve-preview.json
├─ manifests/s1/S1-E01-calibration.json … S1-E08-policy-bound.json   (as defined in the experiment plan)
├─ test/s1.orderKey.test.ts               same-moment ordering: credit before level-up before recompute before next swing
├─ test/s1.gates.test.ts                  access/visit/checkpoint rules; rejections with reason codes
├─ test/s1.rewards.test.ts                one credit per kill; drop counts are integers; carry exact
├─ test/s1.combatLoop.test.ts             TTK breakpoints; overkill; retaliation; death and respawn without loss
├─ test/s1.boss.test.ts                   boss stub only via StartBoss in an active session; auto-farm cannot start it; failure resets
├─ test/s1.determinism.test.ts            identical manifest → identical event-log hash and result fingerprint
├─ test/s1.estimator.test.ts              deterministic-expectation stepper equals estimator in spawn-unlimited, no-crit cases
├─ test/s1.policy.test.ts                 policies only see observation fields; rejected commands are logged
└─ test/stats/s1.drops.distribution.test.ts  sampled drop counts within binomial 99.9% interval (fixed seeds)

spec/
├─ formulas/s1-combat-loop.md   swing timing, engagement overhead, retaliation, death, regeneration, spawn slots (v1)
├─ formulas/gates.md            kill gates, access/visit/checkpoint flags, active-only gates (v1)
├─ fixtures/combat-loop.v1.json hand-derived single-fight timelines (e.g. 15 HP, 6 damage, 1,200 ms → kill at t = 2,400 ms)
├─ fixtures/gates.v1.json       normal and rejected travel/teleport/assignment-to-zone cases
└─ fixtures/rewards.v1.json     credit-once, carry and drop-threshold cases
```

---

## 4. Fixture schema (`spec/schema/fixture.schema.json`, summarised)

```json
{
  "type": "object",
  "required": ["fixtureSet", "fixtureVersion", "specRef", "status", "independence", "cases"],
  "properties": {
    "fixtureSet":     { "type": "string", "pattern": "^[a-z0-9.-]+$" },
    "fixtureVersion": { "type": "integer", "minimum": 1 },
    "specRef":        { "type": "string" },
    "status":         { "enum": ["candidate", "approved"] },
    "independence":   { "type": "string", "minLength": 20 },
    "cases": {
      "type": "array", "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "kind", "description", "input", "derivation"],
        "properties": {
          "id":            { "type": "string", "pattern": "^[a-z0-9.-]+$" },
          "kind":          { "enum": ["normal", "boundary", "failure"] },
          "description":   { "type": "string" },
          "input":         { "type": "object" },
          "expected":      { "type": "object" },
          "expectedError": { "type": "string" },
          "tolerance":     { "oneOf": [ { "const": "exact" },
                                        { "type": "object", "properties": { "rel": { "type": "number" }, "abs": { "type": "number" } } } ] },
          "derivation":    { "type": "string", "minLength": 5 }
        },
        "oneOf": [ { "required": ["expected"] }, { "required": ["expectedError"] } ]
      }
    }
  }
}
```

**Rules:**
- Case IDs are unique across all files.
- Every family has at least one `failure` and one `boundary` case.
- `expected` values may not be produced by running lab code (reviewer check: the derivation names the hand step or the oracle script).
- `"NaN"`, `"Infinity"` and `"-Infinity"` appear only as strings in failure inputs.

**Example cases per S0 family:**

| Family | Example normal / boundary case | Example failure case |
|---|---|---|
| numeric | `addSafe(2^53−2, 1) = 2^53−1` (boundary) | `addSafe(2^53−1, 1)` → `NUMERIC_LIMIT` |
| numeric (carry) | `floorWithCarry(raw 0.25, carry 0.75) = { granted: 1, carry: 0 }`; `floorWithCarry(2.5, 0.5) = { granted: 3, carry: 0 }` (inputs exactly representable in binary) | `floorWithCarry(-1, 0)` → `INVALID_NUMBER`; carry 1.0 → `INVALID_NUMBER` |
| rng | First 8 `nextU32` outputs for seed root `"fixture-a"`, purpose `"combat.crit"`, entity `"hero"`, counter 0 (from `rng_oracle.py`) | `uniformInt(lo = 5, hi = 4)` → `INVALID_RANGE` |
| rng (Bernoulli) | `bernoulliThreshold(0.5) = 2147483648`; `(1) = 4294967296`; `(0) = 0` | `bernoulliThreshold(1e-12)` → `PROBABILITY_TOO_SMALL`; `(1.5)` → `INVALID_PROBABILITY` |
| xp | Table `[10, 30, 58]`, L1 with 5 into level, award 35 → L3, 0 into level, level-ups [2, 3] | award `-1` → `INVALID_NUMBER` |
| stats | base 6, flat +2, additive +2500 bp and +2500 bp in one category, multiplier category ×1.5 → (6 + 2) × 1.5 × 1.5 = 18 (exact) | unregistered multiplier category → `UNKNOWN_CATEGORY` |
| combat | 15 HP, 6 damage → 3 hits; 15 HP, 7 → 3; 15 HP, 8 → 2 (breakpoint) | `hitsToKill(15, 0)` → `INVALID_NUMBER` (the damage floor applies only to landed hits, never to a zero/invalid input) |
| combat (mitigation) | K = 100, D = 0 → 1.0; D = 100 → 0.5; `damagePerHit(raw 1.2, mitigation 0.3)` → max(1, roundHalfUp(0.36)) = 1 | D = −5 → `INVALID_NUMBER` |
| ledger | Two-line transaction gold −10 / material +1 applies atomically | Line drives gold to −1 → `NEGATIVE_BALANCE`, ledger unchanged; same `txId` twice → second is a no-op |
| content | Minimal valid S1 pack | Gate pointing to a missing zone → `INVALID_CONTENT`; non-integer bp → `INVALID_CONTENT` |

---

## 5. Content schema for S1 (summary)

```ts
ContentPackS1 = {
  contentId: 'w1-slice', contentVersion: SemVer, status: 'candidate',
  formulaVersions: { xpRequired: 1, damage: 1, mitigation: 1, hitChance: 1, dropRoll: 1, combatLoop: 1, gates: 1 },
  xpCurve: { family: 'powerGeometric', a: L<number>, p: L<number>, g: L<number>, rounding: 'roundHalfUp', maxLevel: L<int> },
  hero: { baseDamage, damagePerLevel, attackIntervalMs, critChanceBp, critMultBp, baseMaxHp, maxHpPerLevel,
          baseDefence, defencePerLevel, accuracy, outOfCombatDelayMs, regenPerSecBpOfMaxHp, respawnDelayMs },
  combatParams: { mitigationK, minDamagePerHit, hitCurve: { hAtReqBp, k, floorBp } },
  zones: Zone[3], enemies: Enemy[3 + 1 boss], resources: Resource[], checkpoints: Checkpoint[],
  travel: { adjacentWalkMs, teleportMs, townToZone1Ms, engageOverheadMs, firstTargetWalkMs },
  autoFarm: { stopAfterDeaths: L<int>, deathWindowMs: L<int> }
}
// L<T> = { value: T, label: 'candidate'|'approved'|'target'|'derived', range?: [min, max], hypothesis?: string }
// Zone  = { id, order, enemyId, spawnSlots, respawnMs, killGate?: { toZoneId, kills }, bossGate?: { gateId, enemyId, unlockKills, timerMs } }
// Enemy = { id, hp, attackDamage, attackIntervalMs, firstAttackDelayMs, defence, accuracyRequirement, exp, gold,
//           drops: [{ resourceId, category: 'material'|'rare', prob, qtyMin, qtyMax }] }
```

---

## 6. Initial candidate inputs (all `candidate`; none approved)

Ranges are the experiment bounds. A "Target" link means the value is chosen to test that approved target. **These were chosen by hand arithmetic only (§6.4), not by simulation.**

### 6.1 Hero (classless) and global combat parameters

| Parameter | Candidate | Range | Unit | Hypothesis / purpose | Acceptance metric (proposed) |
|---|---|---|---|---|---|
| baseDamage | 6 | 5–10 | damage | R08.04 starting damage 5–10 | Within range by definition |
| damagePerLevel | +1 | 0.5–2 | damage/level | Levels make kills visibly faster | Zone 1 hits-to-kill falls from 3 to 2 by L3 |
| attackIntervalMs | 1200 | 800–1500 | ms | Readable auto-attack cadence | TTK targets H-S1-03/04 |
| critChanceBp / critMultBp | 500 / 15000 | 0–1000 / 12500–20000 | bp | Occasional crit breakpoints | Reported only |
| baseMaxHp / maxHpPerLevel | 60 / +8 | 40–100 / 4–12 | HP | Survival matters in zone 3, not zone 1 | Deaths/h ≈ 0 in zone 1, > 0 possible in zone 3 at first visit (S1-E04) |
| baseDefence / defencePerLevel | 0 / +1 | 0 / 0–2 | defence | Mitigation curve exercised gently | Reported |
| accuracy | 10 | — | accuracy | Zones 1–3 have requirement 0, so hits are certain (Bible map introduces accuracy in zone 4) | Hit chance = 1 in S1 |
| outOfCombatDelayMs / regenPerSecBpOfMaxHp | 3000 / 1000 | 1000–6000 / 300–2000 | ms / bp | Short rests recover HP | Rest time share < 10% of active time (candidate) |
| respawnDelayMs | 5000 | 3000–15000 | ms | R02.07: no loss, small downtime | Downtime reported |
| mitigationK | 100 | 50–200 | — | Diminishing defence (R08.08) | Monotonic, factor in (0, 1] |
| minDamagePerHit | 1 | 1 | damage | Damage floor | Fixed |
| hitCurve hAtReqBp / k | 9000 / 2 | 8000–9500 / 1–4 | bp / — | 90% at requirement, approaching 100% (R08.07) | Not exercised in S1 content (requirement 0) |
| engageOverheadMs | 1500 | 500–4000 | ms | Walk-to-next-target time; **the most uncertain input**, measure in M2 | Sensitivity reported |
| firstTargetWalkMs | 8000 | 3000–20000 | ms | Spawn near starter enemies | H-S1-01 first kill ≤ 30 s |
| adjacentWalkMs / teleportMs | 20000 / 3000 | 5000–60000 / 1000–10000 | ms | Compact connected zones (R06.02) | Travel share reported |
| autoFarm stopAfterDeaths / deathWindowMs | 3 / 300000 | 2–5 / 1–10 min | count / ms | D-03 recovery rule | No auto-farm death loops |

### 6.2 XP curve

`xpRequired(L) = roundHalfUp(a × L^p × g^(L−1))` for L ≥ 1, tabulated as integers.

| Parameter | Candidate | Range | Purpose |
|---|---|---|---|
| a | 10 | 8–12 | L2 after 1–3 kills |
| p | 1.6 | 1.6–2.0 | Early steepness (L5 3–5 min, L10 10–20 min) |
| g | 1.00 | 1.00–1.04 | Later growth (S6 concern; fixed at 1.00 in S1) |
| maxLevel (table length) | 200 | — | Technical table length for S1; not a design cap (R08.03) |

### 6.3 Zones 1–3 (names and species are Bible candidates; numbers invented here)

Shared by all three zones: spawn slots 10 (range 5–20), drop prob for rare = 0.002 (test only, labelled "test-only"), accuracy requirement 0.

| Zone | Enemy | HP | Atk dmg / interval | Defence | EXP | Gold | Material (prob) | Respawn | Gate to next |
|---|---|---|---|---|---|---|---|---|---|
| zone.w1.01 Slime Meadow | Green Slime | 15 (10–30) | 1 / 2000 ms | 0 | 4 (3–5) | 1 | Slime Gel (0.30) | 6000 ms | 100 kills (60–150) → zone 2 |
| zone.w1.02 Wolfwood Forest | Wolf | 45 (30–70) | 3 / 1800 ms | 2 | 10 (8–14) | 3 | Wolf Fang (0.25) | 7000 ms | 120 kills (80–180) → zone 3 |
| zone.w1.03 Goblin Encampment | Goblin | 120 (80–180) | 6 / 1600 ms | 5 | 22 (16–30) | 6 | Goblin Scrap (0.20) | 8000 ms | Boss stub (below) |

- **R08.05 check:** zone-to-zone HP ratios are ×3.0 and ×2.67, and EXP ratios ×2.5 and ×2.2, so HP grows faster than EXP, as approved.
- **Boss stub "Goblin Chief"** (candidate, active-only): opens at zone 3 kills ≥ 150 (range 100–250). HP 1500, attack 12 / 2000 ms, enrage timer 120 s (range 60–180 s). Failure returns the hero to the entrance with no loss (R06.17). It is a placeholder for the R10.03 prototype miniboss, not one of the two major W1 minibosses (O08).

### 6.4 Hand-arithmetic sanity check (not a simulation, not a result)

The arithmetic assumes:
- no crits;
- certain hits;
- no deaths;
- first swing at engagement, so TTK = (hits − 1) × 1.2 s;
- 1.5 s overhead between kills;
- the XP table from a = 10, p = 1.6: 10, 30, 58, 92, 131, 176, 225, 279, 336, 398 …

Rough consequences:
- **Level 2 after 3 kills.** Inside the 1–3 target, at its edge.
- **Level 5 after ~48 kills, about 2.4 min.** *Earlier* than the 3–5 min target, so S1-E01 sweeps p up to 2.0 and a up to 12.
- **Zone 1 gate (100 kills) at about 4.7 min**, plus about 8 s to the first target and a 20 s walk. First visit of zone 2 is at about 5.2 min, at the lower edge of 5–10 min.
- **Zone 2 at first visit (≈ L6):** 5 hits, 4.8 s TTK, inside the 2–5 s target. **Zone 3 at ≈ L10:** 9 hits, 9.6 s TTK, inside 5–15 s.
- **Early sign of R08.05's effect:** at L10, one-shotting zone 1 slimes gives ≈ 160 EXP/min vs ≈ 154 in zone 2. An earlier zone can already be better for EXP. S1-E03 measures this properly, including spawn limits.

---

## 7. Tests: what each proves

| Test file | Normal cases | Failure / edge cases | Proves |
|---|---|---|---|
| numeric.safeInt | add/sub/mul within range | overflow at 2^53, NaN, ±Infinity, −0, non-integers | No invalid balances can be formed |
| numeric.rounding | roundHalfUp(2.5) = 3, roundHalfUp(2.4999) = 2; carry accumulation | negative raw where the spec forbids it, carry ≥ 1 rejected | Exact carry; no rejoin gain |
| rng.sequence | Oracle sequences for 3 seeds × 2 purposes | — | Bit-exact generator (Luau target later) |
| rng.replay | Same inputs give the same sequence | Different purpose/entity/counter give different streams | Replay determinism, stream independence |
| stats/rng.distribution | χ² on 10^6 draws in 256 buckets; Bernoulli p ∈ {0.5, 0.01, 0.002} within 99.9% CI; uniformInt(0, 2) unbiased | — | Distribution correctness, separate from replay |
| xp | Tables, cumulative, multi-level | award NaN/negative, threshold beyond limit, level-ups over guard | Unambiguous level semantics |
| stats.stacking | Pools and categories, breakdown equality | Unknown category, non-integer bp | R05.17/R08.10 contract |
| combat.primitives | Breakpoints 39/40/41-style cases, mitigation, crit | crit chance > 1 clamped and reported, negative defence | Monotonic, bounded combat maths |
| ledger | Atomic multi-line transaction | Negative result, duplicate txId, overflow | No negative balances, no double spend |
| ledger.property | 10^4 random sequences | — | Invariants hold beyond hand cases |
| content.schema | Candidate pack valid | Missing IDs, cycles, prob out of range, non-monotonic table, unlabelled number | Content can't be half-loaded |
| fixtures.conformance | Every spec case | Every expected error | Lab agrees with independent values |
| purity / isolation | — | Forbidden global or import → fail | Determinism; frozen lab untouched |
| s1.orderKey | Kill at t then level-up then faster swing at t | Two events at the same t from different entities | Stable chronological ordering |
| s1.gates | Unlock → walk → visited → checkpoint | Travel/teleport to an inaccessible or unvisited zone; StartBoss while auto-farming | No gate bypass |
| s1.rewards | One kill → one credit with integer drops | Replayed credit txId → no-op | No duplicate loot/conquest credit |
| s1.combatLoop | Single-fight timelines from spec fixtures | Hero death mid-fight → respawn, no loss | Correct TTK and survival semantics |
| s1.boss | Clear inside the timer | Timer expiry → reset to entrance; auto-farm cannot start it | Active-only gate |
| s1.determinism | Same manifest gives the same fingerprints | Changed content hash → runner refuses | Reproducibility |
| s1.estimator | Spawn-unlimited, no-crit cases equal exactly | — | Estimator correctness where it should be exact |
| s1.policy | Policies act only on observation | A policy reading hidden state → type error / test fail | Realistic vs oracle separation |
| stats/s1.drops.distribution | Observed drops within the binomial interval | — | Rare rolls statistically correct |

---

## 8. S1 experiments to run (from `M0_EXPERIMENT_PLAN.md` §7)

S1-E01 calibration, S1-E02 estimator vs stepper, S1-E03 earlier-zone audit, S1-E04 survival sensitivity, S1-E05 gate pacing, S1-E06 drop correctness, S1-E07 determinism, S1-E08 policy bound. Each manifest is committed before its results. Each report lists the hypotheses H-S1-01 to H-S1-10 with pass, fail or "reported", p10/p50/p90 and labels.

---

## 9. Reproducible commands (once built)

```
cd legion-progression-lab
npm ci                                   # exact versions from package-lock.json
npm run typecheck                        # tsc --noEmit
npm test                                 # unit, property, fixture conformance, purity, isolation, S1 tests
npm run test:stats                       # distribution tests (fixed seeds, slower)
npm run fixtures:check                   # validate spec/fixtures against spec/schema, then run conformance
python -I ../spec/oracle/rng_oracle.py   # reprint independent RNG expectations (compare with spec/fixtures/rng.v1.json)
npm run curve:preview                    # S0-R01 deterministic XP table report
npm run exp -- manifests/s1/S1-E01-calibration.json
npm run exp:verify -- results/s1/S1-E01-calibration   # rerun and compare fingerprints
```

On Windows PowerShell, use `npm.cmd` if `npm` is blocked (the same note as the frozen lab's README).

---

## 10. Definition of done and evidence packs

### S0 is done when
1. All S0 tests pass. The output is saved as `planning/S0_EVIDENCE.md`, with test counts *and* a list of fixture families with case counts and derivation sources.
2. `fixtures:check` passes, and the RNG oracle output matches `rng.v1.json` byte for byte.
3. `spec/formulas/*.md` document every unit, rounding point, limit and error code used in code.
4. `PROVENANCE.md` lists every idea reused from the frozen lab (expected: provenance labels, canonical JSON fingerprints, golden-baseline checks, pre-registration, kill-rate seam, reason codes). It also confirms no file was copied.
5. A before/after fingerprint of the frozen `progression-lab/` shows it is unchanged.
6. **Git checkpoint:** one commit "M1-S0: numeric primitives, RNG, XP, combat primitives, ledger, content schema, fixtures", made only after the owner approves the evidence. Then an independent review.

### S1 is done when
1. The S0 criteria still hold, and all S1 tests pass.
2. The eight S1 experiment reports exist, with manifests committed first and `exp:verify` reproducing every result fingerprint.
3. `planning/S1_EVIDENCE.md` summarises:
   - each hypothesis vs result;
   - estimator error;
   - deaths and downtime;
   - the earlier-zone findings;
   - limitations (no recruits, sinks, offline or abilities).
4. Any candidate that fails a target is reported with the closest alternative from the sweep. **No value is promoted to "approved"** without the owner.
5. **Git checkpoint:** a separate commit for S1, after owner approval. Then an independent review.

---

## 11. Evidence needed before S2 may start

1. The owner and the independent reviewer accept the S0 and S1 evidence packs.
2. Decisions **D-04** (squad credit and EXP eligibility), **D-05** (mastery/class change/talents), **D-06** (rare heroes and reserve), and the recruit half of **D-03** (knockout) are made.
3. The owner states which S1 candidate inputs to carry forward, or asks for a recalibration first. They remain `candidate` either way.
4. The S1 estimator error is known and acceptable, because S2's worker rates and later the Command Centre estimates (R07.16) rely on it.
5. The ordering-key and gate tests pass. S2 adds recruits on top of the same event engine.
6. Open items that S2 depends on (N-07, N-12, N-13, N-15) are resolved or explicitly deferred with candidate defaults.
7. The frozen `progression-lab/` has been re-checked as unchanged.
