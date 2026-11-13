# M0 Architecture — `legion-progression-lab`

**Milestone:** M0 · **Prepared:** 13 November 2026 · **Status:** PROPOSED, awaiting owner approval (decisions D-02, D-07, D-09 and D-10 in `M0_DECISION_MATRIX.md`). Nothing described here has been built.

> **In plain words.** The lab is a calculator that plays out a hypothetical player's progress. It runs on a computer, without a screen, so it can test thousands of plays quickly and give the same answer every time. It is kept completely separate from the old frozen simulator and from the Roblox game's code. The lab and the game never share code. They share only three kinds of plain data files:
>
> 1. **Written formula rules** that describe each formula in words.
> 2. **Content tables** with the monsters, costs and level curves.
> 3. **Test cases** with known correct answers.
>
> Both are checked against the same test cases, so if they ever disagree, the tests catch it.

---

## 1. Goals and non-goals

**Goals**

1. Model the approved design (multi-character legion, shared ledger, assignments, offline windows) honestly, starting small (S0/S1) and adding systems one increment at a time.
2. Same inputs + same seed ⇒ byte-identical outputs on any machine.
3. Every number traceable to a label: `approved`, `target`, `candidate`, `derived` or `model-output`.
4. Exact guarantees for the engineering invariants (no negative balances, no double credit, one job per unit, and so on), checked by tests rather than by trust.
5. Produce engine-neutral specs, content and fixtures that the Roblox Luau implementation can be checked against later, without sharing runtime code.

**Non-goals (for M1)**

- A visual dashboard. A UI is optional later and never blocks an increment.
- Any Roblox code or production content.
- Claims of live validation. All outputs are model output from candidate inputs.
- Reuse of the frozen lab's numbers, or any IdleOn data.

---

## 2. Placement and isolation

**Recommendation (UNAPPROVED, D-09):** one canonical Legion repository containing the game, the lab and a shared `spec/` folder, with strict one-way rules. This assumes the owner picks the current workspace. The audit (B-03) lists the alternative, `Documents/GitHub/legion-incremental`, which already has a GitHub remote. The structure below works in either place.

```
<Legion repo root>/
├─ docs/                        Design pack v1.0 (owner-approved; changed only through change control)
├─ spec/                        Engine-neutral contracts. DATA AND PROSE ONLY, no executable game/lab code.
│  ├─ formulas/                 One Markdown spec per formula family, versioned (e.g. xp.md, damage.md)
│  ├─ schema/                   JSON Schemas exported from the lab's content/fixture schemas
│  ├─ fixtures/                 Hand-derived expected-value test cases (JSON), shared by both engines
│  ├─ oracle/                   Tiny independent derivation scripts (Python stdlib only) used to compute fixture values
│  └─ content/                  Owner-approved content packs (empty until S7 promotes a baseline)
├─ legion-progression-lab/      Headless simulator (TypeScript on Node). Never required by the game.
│  ├─ planning/                 M0 documents (this set) and later increment plans
│  ├─ src/core/                 Pure primitives: numeric, rng, formulas, ledger, content schema, hashing
│  ├─ src/model/                State, command and event types
│  ├─ src/engine/               Event queue, reference stepper, rate estimator, (S5) batch integrator
│  ├─ src/policy/               Player policies (realistic) and oracle (upper bound), kept apart
│  ├─ src/experiments/          Manifest schema, runner, reports, fingerprints
│  ├─ src/cli/                  Command-line entry points
│  ├─ content/                  Candidate content packs (JSON, versioned, every value labelled)
│  ├─ manifests/                Experiment manifests (JSON)
│  ├─ baselines/                Owner-approved frozen results (committed only with approval)
│  ├─ results/                  Run outputs (git-ignored unless promoted to baselines/)
│  └─ test/                     Unit, property, fixture-conformance, statistical, isolation tests
├─ src/                         Roblox game (Rojo). From M2: pure Luau kernels in src/shared, engine code in server/client
└─ tests/                       From M2: Luau tests run with Lune, including the spec/fixtures conformance runner
```

**Isolation rules (enforced by tests from S0):**

| Rule | Enforcement |
|---|---|
| The lab never reads, imports or writes anything under the frozen `Desktop/Roblox Incremental/` tree. | `test/isolation.test.ts` scans lab sources for that path and for import specifiers that leave the lab folder (only `../spec/` is allowed). |
| The lab never requires game code; the game never requires lab code. | Lab: same scan. Game (M2+): a Lune check rejects requires that point into `legion-progression-lab/`. |
| `spec/` contains no executable game or lab code. | A check allows only `.md`, `.json` and `spec/oracle/*.py` (derivation scripts, never imported by either engine). |
| The lab has its own `package.json` and lockfile. Nothing is installed at the repo root. | Code review plus the absence of a root `package.json`. |
| Rojo never syncs the lab or spec folders into Studio. | `default.project.json` maps only `src/...`. Content JSON is mapped in explicitly at M2 when needed. |

**Relationship to the frozen lab:** reference only. Ideas reused are re-implemented from scratch and listed in `legion-progression-lab/PROVENANCE.md` (path + commit `74499ef` + what was reused + licence: owner's own private code). No file is copied verbatim unless that file lists it. Reuse assessment: `M0_REPO_AUDIT.md` §6.

---

## 3. Language, runtime and tooling

**Recommendation (UNAPPROVED, D-10):**

| Tool | Choice | Why |
|---|---|---|
| Language | **TypeScript, strict** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`, `verbatimModuleSyntax`) | Typed state and event contracts catch whole classes of mistakes. Your own frozen lab already proved this stack across five increments. |
| Runtime | **Node.js, current LTS line**, pinned in `.node-version` and `package.json#engines` | Node runs `.ts` files directly by stripping types, so there is no build step. This machine has Node v25.9.0, an odd-numbered release with short support. The audit recommends installing an LTS line and checking the schedule at nodejs.org. |
| Test runner | **vitest** (frozen lab used 4.1.12, MIT) | Fast, TypeScript-native, proven. |
| Schema validation | **zod** (frozen lab used 4.6.7, MIT), with JSON Schema export into `spec/schema/` | One source of truth for content/manifest shapes, plus a neutral schema the Luau side can read as documentation. |
| Property-based tests | **fast-check** (MIT), exact version pinned at install | Generates thousands of random command sequences to check invariants (balances never negative, conservation of materials). |
| Hashing | `node:crypto` SHA-256 over canonical JSON | Reproducible fingerprints. Replaces the frozen lab's hand-written SHA-256. |
| Fixture oracle | **Python 3 standard library** (3.12.9 is installed), run with `python -I` | Expected values come from a different language than the code under test (`fractions.Fraction` for exact arithmetic). It is used only to derive fixture numbers, never as a simulator. |
| Luau parity (M2+) | **Lune** (plus1game pins `lune-org/lune@0.11.0` via Rokit) | Runs Luau headless on this machine, as plus1game already does for its kernel specs. |

**Alternatives considered**

| Option | For | Against | Verdict |
|---|---|---|---|
| Luau via Lune for the lab | Same language as the game | Invites copying lab code into the game, so both share the same bugs and parity tests prove nothing. That contradicts "parity without shared runtime code". Thin data, statistics and testing tooling. | Use Lune for the game's tests, not the lab. |
| Python | Great analysis libraries; exact `Fraction`/`int` | Python integers are unbounded while Luau numbers are doubles, so a Python sim would hide precision limits the game has. Slower event loops; weaker static typing. | Use only for fixture oracles. |
| Rust / C# / Go | Speed, types | No precedent in your workspace; heavier tooling for a non-technical owner. | No. |
| Spreadsheet | Transparent | Cannot express event ordering, RNG, queues or multi-character state. | Optional later for reviewing outputs. |

TypeScript numbers and Luau numbers are both IEEE-754 doubles. Basic arithmetic (`+ − × ÷`, comparisons, `floor`, `ceil`) therefore gives bit-identical results when the operations happen in the same order. Functions like `pow`, `log` and `exp` can differ in the last bit between engines; §6 and §15 handle this.

---

## 4. Engine design (deterministic, headless-first)

Layered, with dependencies pointing only downward:

```
cli → experiments → policy → engine → model → core
                                      ↑
                         content (JSON, validated by core/content)
```

- **`core/` is pure.** It uses no clock (`Date`), no ambient randomness (`Math.random`), no file or network I/O, no `process` access and no module-level mutable state. Randomness arrives only as an explicit generator state passed in and returned. `test/purity.test.ts` scans `src/core/`, `src/model/` and `src/engine/` for forbidden globals. This is the same discipline plus1game enforces for its Luau kernels.
- **State transitions are functions.** `apply(state, event) → { state', emitted[] }` and `validate(state, command) → Accepted | Rejected(reasonCode)`. State objects are treated as immutable; the engine creates new state.
- **Two engines, one contract:**
  1. **Reference stepper** (S1+). Exact discrete simulation: every swing, hit, miss, crit, kill, respawn, death, job unit and level-up is an event. Used for short horizons and as the arbiter of truth.
  2. **Batch integrator** (S5+). Jumps between event boundaries using analytic rates (rate change, window boundary, level-up, input exhaustion, job completion, bonus change). Samples batched drops statistically. Used for long offline intervals and 30-day runs. Every batch result is cross-checked against the stepper on short intervals (experiment plan §7, S5).
- **Rate estimator** (S1+). A third, separate component: the analytic expected-rate model that a Command Centre would show (R07.16). It is never used as "actual" results. Reports always show estimate vs simulated.
- **Policies** sit outside the engine. They see only an *observation*: what the player could see on screen (§4.1). They issue commands, which the engine validates exactly as it would a player's request.

### 4.1 Observation boundary (realistic vs oracle)

| Policy type | May see | May not see |
|---|---|---|
| **Realistic** | Own stats, levels, HP; zone list with access/visited flags; enemy requirements shown in UI; displayed rate estimates; prices, costs, recipe requirements; inventory; gate progress | Future RNG outcomes, other branches' results, hidden coefficients not shown in UI |
| **Oracle (upper bound)** | Everything, including cloned-state lookahead / brute-force search | — (but its results are tagged `oracle` and never used to set typical-player targets) |

---

## 5. Time model

- **Simulation clock:** integer milliseconds since profile creation (`tMs`). It stays exact far beyond any horizon (2^53 ms is about 285,000 years). Event times are always integers. A duration derived from a rate is rounded **up** to the next millisecond when scheduling, so events are never early (proposed).
- **Three time categories recorded for every run:**
  - `activeMs`: the player is in a session (S1: scheduled session time; split into `activeManual` and `onlineAutoFarm` once abilities exist).
  - `offlineMs`: elapsed time between sessions.
  - `elapsedMs` = calendar time = active + offline.
- **Offline accounting (S5):** `creditedOfflineMs` per window: window 1 is 0–24 h at normal efficiency, window 2 is 24–72 h at reduced efficiency, and nothing is credited beyond 72 h. Reports also show "effective hours" = Σ window time × efficiency.
- **Session schedules** are part of the profile, not the policy, so the same policy can be run on different schedules.

---

## 6. Numeric policy (proposed, pending D-02)

| Quantity | Representation | Rule |
|---|---|---|
| Gold, materials, item counts, kill counters | Integer stored in a double | Must satisfy `Number.isSafeInteger`, ≥ 0 and ≤ 2^53−1. Any operation that would break this raises `NUMERIC_LIMIT`: the experiment halts with a report, never a silent clamp. |
| EXP (combat, profession, mastery) | `level` (integer ≥ 1) + `expIntoLevel` (integer) | Small numbers: only a single level threshold must fit the limit. Multi-level awards loop level by level (§9). |
| Fractional earnings (from multipliers, rates, offline efficiency) | Per-(entity, resource) **carry** in [0, 1), stored as a double | `award = raw + carry`; `granted = floor(award)`; `carry = award − granted`. The carry is saved with state, so frequent rejoining gains or loses nothing. |
| Damage per landed hit | Integer | `max(minDamage, roundHalfUp(raw × critFactor × mitigation))`, where `roundHalfUp(x) = floor(x + 0.5)`, the same in both engines. Enemy HP is an integer, so hits-to-kill is exact integer arithmetic (no epsilon needed). |
| Percent-like bonuses | Integer **basis points** in content (`damageBonusBp: 2500` = +25%) | Converted with `bp / 10000` at the point of use. Field suffixes make units explicit. |
| Probabilities | Double in [0, 1] (`…Prob`) | Compared through a 32-bit integer threshold (§11), so both engines decide identically. |
| Multipliers | Double ≥ 0 (`…Mult`), neutral = 1 | Only registered categories may multiply (R05.17/R08.10). |
| Durations | Integer milliseconds (`…Ms`) | — |
| Rates | Double per hour (`…PerHour`) | Estimator and report use only. Credited amounts always pass through the carry. |
| XP thresholds, cost curves | **Precomputed integer tables** in content | The lab's content builder evaluates the candidate curve once with documented rounding and writes integers. The game reads the same integers, so engines never recompute `pow()` and diverge. |
| Display | Strings from a formatter (K, M, B, T…) | Presentation only. Never fed back into arithmetic. |

`NaN`, `Infinity` and negative zero are rejected at every state boundary (content load, command validation, ledger apply). W1 has no planned level cap (R08.03). The technical ceiling is the first level whose threshold would exceed 2^53−1, and content validation reports where that is. A mantissa/exponent number type is a **future extension point** (`NumericPolicy` interface), not built in M1.

---

## 7. Content and formula schema (versioned)

- **Content pack:** one JSON file per pack, e.g. `content/w1-slice.candidate.v0.1.0.json`.

```json
{
  "contentId": "w1-slice",
  "contentVersion": "0.1.0",
  "status": "candidate",
  "formulaVersions": { "xpRequired": 1, "damage": 1, "hitChance": 1, "mitigation": 1, "dropRoll": 1 },
  "units": "see spec/formulas/units.md",
  "zones": [
    {
      "id": "zone.w1.01",
      "order": 1,
      "displayName": { "value": "Slime Meadow", "label": "candidate" },
      "enemyId": "enemy.w1.green_slime",
      "killGate": { "toZoneId": "zone.w1.02", "kills": { "value": 100, "label": "candidate" } }
    }
  ],
  "enemies": [
    {
      "id": "enemy.w1.green_slime",
      "hp": { "value": 15, "label": "candidate" },
      "attackDamage": { "value": 1, "label": "candidate" }
    }
  ]
}
```

- **Stable IDs:** lowercase dotted (`zone.w1.03`, `enemy.w1.goblin`, `res.gold`, `res.mat.slime_gel`). IDs are never reused or renamed; display names are separate and never used as keys (Bible §14).
- **Labels:** every numeric value is `{ value, label, note?, range?, hypothesis? }`, with label ∈ {`approved`, `target`, `candidate`, `derived`}. A computed result takes the weakest label of its inputs. This is adapted from the frozen lab's provenance rule; anything using a candidate is candidate.
- **Formula versions:** each formula family has a Markdown spec in `spec/formulas/<family>.md` with numbered versions. Content declares which version it uses. Changing semantics means a new version number, never a silent edit.
- **Content hash:** SHA-256 of canonical JSON (keys sorted, no whitespace). It is recorded in every manifest and result.
- **Validation:** zod schema plus cross-reference checks (every referenced ID exists, gates point forward, no cycles, probabilities in [0,1], tables monotonic, all integers safe). An invalid pack is refused entirely, never partly loaded.

---

## 8. State contracts (introduced incrementally)

The sketch below is in TypeScript-like notation. Fields marked (Sx) arrive in that increment; nothing is added early.

```ts
interface AccountState {
  schemaVersion: number;              // state shape version (migration fixtures from S5)
  contentId: string; contentVersion: string; contentHash: string;
  tMs: number;                        // integer ms
  rng: RngState;                      // §11; one root state + derived streams
  ledger: Ledger;                     // §10
  carry: Record<CarryKey, number>;    // [0,1) fractional earnings
  zones: Record<ZoneId, { accessUnlocked: boolean; visited: boolean; checkpointDiscovered: boolean;
                          kills: number /* eligible credited kills, account-wide */ }>;
  gates: Record<GateId, { completed: boolean; completedAtMs?: number; activeOnly: boolean }>;
  characters: Record<CharacterId, CharacterState>;   // S1: hero only
  roster?: { slotsUnlocked: number; deployCap: number; reserve: CharacterId[] };         // (S2)
  assignments?: Record<CharacterId, Assignment>;                                        // (S2)
  items?: Record<ItemId, ItemInstance>;                                                 // (S3)
  jobs?: Record<JobId, JobState>;                                                       // (S3)
  progression?: { monuments; bestiary; feats; classRecords };                           // (S4)
  settlement?: { lastSettledMs: number; receipts: ReceiptId[]; windowPolicyVersion };   // (S5)
}

interface CharacterState {
  id: CharacterId; kind: 'hero' | 'recruit' | 'rareHero';
  classId: ClassId | null;            // null = classless
  combat: { level: number; expIntoLevel: number };
  hp: number;                         // current HP (integer)
  status: 'ready' | 'engaged' | 'dead' | 'knockedOut';   // knockedOut from S2
  locationZoneId: ZoneId | 'town';
  mastery?: Record<ClassId, { level: number; expIntoLevel: number }>;   // (S2)
  professions?: Record<ProfessionId, { level: number; expIntoLevel: number }>; // (S3)
  equipment?: Partial<Record<SlotId, ItemId>>;                           // (S3)
  talents?: Record<ClassId, TalentAllocation>;                           // (S2)
}

type Assignment =                      // (S2) exactly one per character, enforced by type and invariant
  | { kind: 'idle' }
  | { kind: 'squad' }                  // deployed with hero
  | { kind: 'combatWorker'; zoneId: ZoneId }
  | { kind: 'gather'; nodeId: NodeId }                 // (S3)
  | { kind: 'craft'; jobId: JobId };                   // (S3)
  // 'research' is reserved for W2 and rejected by validation in W1.
```

---

## 9. Commands, events and ordering

**Commands** (intent from a policy or a player) are validated against state and return `Accepted` or `Rejected(reasonCode)`, with no state change on rejection. S1 commands: `Travel(zoneId)`, `Teleport(checkpointId)`, `Engage(auto | targetId)`, `SetAutoFarm(on, zoneId)`, `StartBoss(gateId)`, `Rest`, `EndSession`. Reason codes follow the frozen lab's pattern of one code per refusal: `ZONE_NOT_ACCESSIBLE`, `ZONE_NOT_VISITED`, `CHECKPOINT_UNKNOWN`, `GATE_ACTIVE_ONLY`, `DEAD`, `NOT_IN_SESSION`, and so on.

**Events** are immutable records with an ordering key:

```
orderKey = (tMs, phase, entityOrder, seq)
phase:  0 BOUNDARY    session start/end, window boundaries, scheduled checkpoints
        1 COMPLETE    attack resolves, job unit completes, respawn completes → outputs deposited
        2 CREDIT      kill credited: EXP, gold, loot rolls, counters (once per account per kill)
        3 PROGRESS    level-ups (one event per level), mastery, milestones, gate completion, unlocks
        4 RECOMPUTE   stats and rates recalculated
        5 START       next swing scheduled, next job unit starts, reservations taken
        6 POLICY      policy observes and issues commands (validated as commands)
entityOrder: 'account' < 'hero' < 'recruit:<id>' < 'job:<id>' < 'enemy:<id>' (lexical within kind)
seq: monotonically increasing integer assigned at scheduling time (final tie-break)
```

Consequences:
- **Same-moment chaining:** production created at *t* is usable by work starting at *t*, but not by work that completed at *t*.
- **Level-up timing:** a level-up caused by a kill at *t* raises the damage of the swing scheduled at *t*, never the swing that made the kill.
- **Multi-level awards** emit one `LevelUp` event per level, in ascending order, at the same `tMs`.

**Multi-level award contract** (S0 fixture):

```
expIntoLevel += award
while expIntoLevel ≥ xpRequired(level):
    expIntoLevel −= xpRequired(level); level += 1; emit LevelUp(level)
    guard: at most maxLevelUpsPerAward levels (content value), else NUMERIC_LIMIT
```

---

## 10. Resource ledger

- **Balances:** each resource has two buckets per account, `available` and `reserved` (reserved used from S3). `total = available + reserved`. All three are shown where relevant (Bible §6).
- **Transactions are atomic:**

```ts
interface LedgerTx {
  txId: string;                    // deterministic: hash(causeEventKey, purpose)
  tMs: number; cause: EventRef; purpose: 'killReward' | 'purchase' | 'reserve' | 'consume'
                                         | 'release' | 'deposit' | 'grant' | …;
  lines: { resourceId: ResourceId; bucket: 'available' | 'reserved'; delta: number /* integer */ }[];
}
```

- **Apply rules:**
  - Validate every line first: all deltas are safe integers, and no resulting bucket is below 0 or above 2^53−1.
  - Then apply all lines, or none. A failed transaction leaves the state unchanged and returns the reason.
  - `txId` must be unique: a repeated `txId` is a no-op that returns the original result (idempotency, the basis for "no repeated offline claim").
- **Reservation lifecycle (S3):** `reserve` moves available → reserved; `consume` removes from reserved; `release` (cancel) moves reserved → available. A cancelled job can never trigger `deposit`.
- **Conservation check:** for every material, Σ sources − Σ sinks = Δ total, verified at every report checkpoint.
- **Detail levels:** a full transaction log for tests and short runs; aggregated source/sink totals by category, profile and checkpoint for long runs (Bible §10 "source/sink ledger").
- **Items (S3)** are not ledger quantities. They are instances `{ itemId, defId, ownerCharacterId | null, equippedSlot | null, enhancement, protected }`. An instance has exactly one owner or none. Equip/transfer is one atomic operation that checks slot compatibility and class restriction.

---

## 11. Random numbers

- **Generator:** xoshiro128** (32-bit state words). It uses only 32-bit add, xor, shift, rotate and multiplications by 5 and 9, all exactly reproducible in JavaScript (`Math.imul`, `>>> 0`) and in Luau (`bit32` plus multiplications by small constants within 2^53). Roblox's `Random` is **not** used for anything that must replay, because its internal algorithm is not specified for replay in another engine.
- **Seeding and streams:**
  - A root seed string comes from the manifest, e.g. `"S1-E01#rep-017"`.
  - Each stream is `deriveStream(root, purpose, entityId, counter)`: FNV-1a 32-bit over the UTF-8 bytes, then a SplitMix32 finaliser to fill the four state words.
  - Purposes (`combat.crit`, `combat.hit`, `drop`, `spawn`…) and entities get separate streams. Adding a new random draw to one system therefore never changes another system's outcomes.
  - **Luau has no `Math.imul`.** FNV-1a and SplitMix32 multiply by large 32-bit constants, so the Luau side uses a split 16-bit multiply, because a full 32×32 product would exceed 2^53. The RNG fixture (exact output sequences for several seeds) proves both implementations agree.
- **Primitives (S0):**
  - `nextU32()` gives an integer in [0, 2^32).
  - **Bernoulli(p)** is `nextU32() < T` with `T = floor(p × 2^32)`, computed once per probability. `p × 2^32` is exact in doubles, so both engines use the same integer threshold. Its resolution is 2^−32 (about 2.3 × 10^−10). Content validation rejects a non-zero probability below 2^−32.
  - **Uniform integer** in [lo, hi] uses rejection sampling with integer arithmetic only (no modulo bias).
- **Batched sampling (S5):** for `n` credited kills with probability `p`, the count of drops is sampled from the exact distribution. Rare drops use geometric gap sampling, which is exact and costs time proportional to the number of drops. A large-count approximation is allowed only for high-`n·p` common materials, with its error bound documented and tested against per-kill sampling. Because these use `log`, cross-engine agreement is checked statistically, not bit-for-bit.
- **Two separate kinds of RNG test:**
  1. **Replay:** a fixed seed gives an exact output sequence (fixture) and the run's event-log hash is identical on rerun.
  2. **Distribution:** chi-square and binomial confidence-interval tests at fixed seeds with a pre-declared significance (candidate α = 0.001), so tests never flake.
- **Not expected value:** a rare drop with p = 0.002 over 100 kills is a sampled count (usually 0), never "0.2 items".

---

## 12. Encounters, credit and assignments (contracts; semantics per D-01, D-04)

- **Encounter stream:** a source of kills with one account-credit owner, e.g. the hero's squad or one independent combat worker.
- **Each kill is credited exactly once:** gold, loot rolls, materials, Bestiary count and gate counter go to the account a single time, with transaction ID `kill:<streamId>:<killSeq>`.
- **EXP:** each *eligible member* of that stream receives the monster's full EXP (S2), using the eligibility rule from D-04.
- **Assignments (S2):** the registry maps each character to exactly one `Assignment`, so a character in two jobs cannot even be written down.
  - **Changing assignment** emits `AssignmentEnded`, which settles the old interval through its carry, then `AssignmentStarted`, in that order and at the same `tMs`.
  - **Validation** rejects assignment to an unvisited zone, an undiscovered node, an active-only gate, or anything for a reserve unit.
- **Same rules online and offline:** online and offline use one eligibility function and one formula set. Only the efficiency factor and active-only opportunities differ (Bible §9).

---

## 13. Offline settlement engine (design for S5; not built in S0/S1)

`settle(state, nowMs, settlementId) → { state', receipt }`:
1. **Check the time and the ID:**
   - Clamp: `elapsed = max(0, nowMs − lastSettledMs)`. A negative or discontinuous clock gives 0 and a warning.
   - Cap the credited time at 72 h.
   - If `settlementId` was already applied, return the stored receipt unchanged (idempotent).
2. **Build the timeline:** collect the boundaries that change rates (24 h and 72 h window edges, predicted level-ups, input exhaustion, job completions, gate thresholds, bonus milestones). The earliest comes first, with ties ordered by §9.
3. **Integrate each segment** analytically at constant rates, then apply the boundary event and recompute.
4. **Bound the compute:** a candidate cap on events per settlement. If the cap is hit, fall back to documented coarser segments and record the approximation in the receipt.
5. **Sample drops** in batches per segment (§11).
6. **Restrictions:** never visit zones, start or complete major gates, purchase, recruit or use abilities. If an assignment becomes invalid, pause it with a reason.
7. **Commit** ledger transactions, levels, counters, carries, `lastSettledMs` and the receipt together. The receipt lists persisted credits only.
8. **Cross-check (tests):** for short intervals (≤ 2 h candidate) the batch result is compared against the reference stepper run on the same timeline. Integers must match in deterministic-expectation mode; sampled outcomes must match statistically.

---

## 14. Experiments, manifests, reports, fingerprints

- **Manifest** (JSON, zod-validated): `{ experimentId, increment, purpose, labCommit, contentRef {path, hash}, formulaVersions, profiles[], policies[], schedule, horizons[], seeds { root, replicates }, metrics[], acceptance[] (pre-registered), outputs[] }`.
- **Runner:**
  - It refuses to run if the manifest's content hash doesn't match the file, or if a baseline it depends on has moved (frozen-lab pattern).
  - It writes to `results/<increment>/<experimentId>/`: `manifest.json`, `summary.json`, `quantiles.csv` (p10/p50/p90 per metric and checkpoint), `timeline.csv` (sampled runs), `events.sample.jsonl`, `report.md`, `fingerprints.json`.
- **Fingerprints:** input fingerprint = SHA-256 of manifest + content + formula versions; result fingerprint = SHA-256 of canonical summary. Re-running a manifest must reproduce the result fingerprint exactly (`npm run exp:verify`).
- **Report labelling:** every number carries a label. Simulated numbers are `model-output`, plus the policy tag `realistic` or `oracle`. Estimates are tagged `estimate`; simulated values `simulated`. Reports keep "targets" and "results" in separate columns and never restate a target as an achievement.
- **Baselines:** promoted to `baselines/` only with owner approval, with a changelog entry (decision ID, rationale, evidence, version), as Bible §0 requires.

---

## 15. Shared test fixtures

**Format** (`spec/fixtures/<family>.v<N>.json`, JSON-Schema-validated):

```json
{
  "fixtureSet": "xp.thresholds-and-awards",
  "fixtureVersion": 1,
  "specRef": "spec/formulas/xp.md#v1",
  "status": "candidate",
  "independence": "Expected values derived by hand and by spec/oracle/xp_oracle.py (Fraction arithmetic); not produced by lab code.",
  "cases": [
    {
      "id": "xp.award.multi-level.001",
      "kind": "normal",
      "description": "One award crosses two thresholds exactly",
      "input":    { "table": [10, 30, 58], "level": 1, "expIntoLevel": 5, "award": 35 },
      "expected": { "level": 3, "expIntoLevel": 0, "levelUps": [2, 3] },
      "tolerance": "exact",
      "derivation": "5+35=40; 40-10=30 → L2; 30-30=0 → L3; 0<58 stop"
    },
    {
      "id": "xp.award.reject-nan.001",
      "kind": "failure",
      "input": { "table": [10], "level": 1, "expIntoLevel": 0, "award": "NaN" },
      "expectedError": "INVALID_NUMBER"
    }
  ]
}
```

**Rules**
1. **Independence:** expected values are written by hand or computed by `spec/oracle/` scripts from the Markdown spec, *before* or *independently of* the lab code, and never by running the lab and copying its output. Every case carries a `derivation`.
2. **Coverage:** every family includes normal cases, boundary cases (exact thresholds, zero, limits) and failure cases (invalid input → named error).
3. **Tolerance:**
   - `exact` for integers and for doubles produced only by basic arithmetic.
   - `{ "rel": 1e-12 }` (candidate) for values involving `pow`, `log` or `exp`. Such values never decide an authoritative integer outcome directly; they are tabulated first (§6).
4. **JSON encoding of special values:** `"NaN"`, `"Infinity"` and `"-Infinity"` are strings in failure cases only.
5. **Versioning:** a fixture set is versioned with its spec. Changing an expected value requires a spec version bump and a changelog line.
6. **Fixture families for M1:**
   - S0: numeric (safe-int, rounding, carry), rng (sequence, Bernoulli threshold, uniform-int), xp, stats stacking, damage/crit/mitigation/accuracy, ledger transactions, content validation.
   - S1: kill gate and access/visit, time-to-kill and hits-to-kill, death/respawn, reward credit.
   - Later increments: assignment exclusivity, squad credit, queues, offline boundaries, level-up feedback, unlock restrictions, overflow/rounding (Bible §17 list).

---

## 16. Test strategy

| Layer | What it proves | Runs | From |
|---|---|---|---|
| Unit tests | Each primitive behaves per spec, including failures | `npm test` | S0 |
| Fixture conformance | The lab agrees with independent expected values in `spec/fixtures` | `npm test` (and `npm run fixtures:check`) | S0 |
| Property tests (fast-check) | Invariants hold for thousands of generated command sequences | `npm test` | S0 (ledger), grows each increment |
| Purity and isolation scans | The core never touches clock, ambient RNG or I/O; nothing reaches the frozen lab or game code | `npm test` | S0 |
| Statistical tests | RNG and samplers have correct distributions (fixed seeds, pre-declared α) | `npm run test:stats` | S0 |
| Determinism / replay | Same manifest gives an identical result fingerprint; same seed gives an identical event-log hash | `npm run exp:verify` and replay tests | S0/S1 |
| Estimator vs stepper | Analytic rates agree with simulated rates within declared tolerances, or the gaps are explained | S1 experiment | S1 |
| Batch vs reference | Offline batch equals the exact small-run reference | S5 experiment and tests | S5 |
| Golden regression | Approved baselines never move silently | `npm run baseline:check` | S1 onward |
| Luau conformance | The game's Luau kernels agree with the same fixtures | Lune in the game repo | M2 |

**Engineering invariants → where they are tested**

| Invariant (kickoff list) | Test(s) | Increment |
|---|---|---|
| No negative material/gold balances | Ledger unit + property tests; checkpoint conservation | S0, every report |
| No double spend | Atomic transactions; duplicate `txId` is a no-op; reservation tests | S0, S3 |
| No duplicate equipped item ownership | Item ownership property test (random equip/transfer sequences) | S3 |
| No multiple productive jobs per unit | Assignment registry type + property test | S2 |
| Full eligible EXP to each participating deployed character | Squad credit tests (0–3 deployed, knocked-out member, out of range) | S2 |
| No duplicate per-account loot/conquest credit | Kill credit once per stream; two streams never credit one kill | S1 (single stream), S2 |
| Explicit units, percent/fraction semantics, stable IDs | Schema validation; unit-suffix lint over content | S0 |
| Deterministic tie-breaks, numeric limits, no NaN/Infinity | Ordering-key tests; limit fixtures; boundary rejections | S0/S1 |
| Unambiguous level thresholds and multi-level awards | XP fixtures | S0 |
| Class switching cannot grant mastery without training | Switch-abuse tests | S2 |
| Identical eligibility/formulas online vs offline | One shared eligibility function; paired online/offline tests differ only by efficiency | S5 |
| Rare rolls statistically correct, not expected-value grants | Bernoulli/binomial distribution tests; drop counts are integers | S0, S1, S5 |
| No repeated offline claim via reconnect | Settlement idempotency (same settlement ID gives the same receipt and no extra credit) | S5 |
| Queues reserve and consume inputs once; cancel creates no output | Reservation lifecycle property tests | S3 |
| Stable chronological ordering across jobs and level-ups | Ordering-key tests; same-timestamp scenarios | S1, S3, S5 |
| Small-run reference vs batch comparison for offline | Batch-vs-stepper experiment | S5 |
| No automatic offline boss clear, ineligible assignment or gate bypass | Command rejections; offline restriction tests | S1, S2, S5 |
| Fixtures independent of code under test; normal and failure cases | Fixture rules §15; review checklist | S0 onward |
| RNG distribution and replay validated separately | Separate statistical and replay test files | S0 |

---

## 17. Parity with Roblox Luau (no shared runtime code)

1. **Shared:** `spec/formulas/*.md`, `spec/schema/*.json`, `spec/fixtures/*.json` and approved `spec/content/*.json`. All data and prose, nothing executable.
2. **Not shared:** code. The lab is TypeScript. The game implements its own pure Luau kernels in `src/shared/`, following the plus1game discipline: `--!strict`, no engine globals, RNG injected, one spec per kernel.
3. **Content in the game:** Rojo turns `.json` files into ModuleScripts that return the table, so the game can `require` the very same approved content JSON. This proposal must be confirmed against current Rojo documentation at M2.
4. **Fixture conformance:** a Lune runner in the game repo (M2) reads every `spec/fixtures/*.json`, runs the matching Luau kernel and applies the same tolerance rules. Both engines' results go into a parity report: fixture ID, engine and version, pass/fail, max deviation.
5. **Exactness where it matters:**
   - Integer tables (XP, costs) are read, never recomputed.
   - Damage, hits-to-kill, ledger and RNG primitives are integer-exact in both engines.
   - Transcendental functions appear only in tolerance-checked or tabulated paths.
6. **Scenario traces (S5/S7 → M6):** a short scripted command log (e.g. 30 minutes of one hero farming, then a 26 h absence) is run in the lab and in the Luau settlement kernel. Normalised event logs (order, types, integer amounts) are compared exactly in deterministic-expectation mode and statistically in sampled mode.
7. **Live calibration (M7):** instrumented playtests measure time-to-kill, engagement overhead, kills per hour and death rates. The lab's candidate inputs are then revised through versioned content changes. This is the only path to "validated".
8. **What parity cannot cover:** feel, physical pathing, multiplayer contention and network effects. These are measured live, not simulated.

---

## 18. Future extension points (hooks only; neutral in the W1 baseline)

| Future feature | Hook in M1 | Neutral value in W1 |
|---|---|---|
| Research (R05.09–R05.11) | `Assignment.kind = 'research'` reserved; validation rejects it in W1 | Multiplier category `research` = 1; no points |
| Legion Mastery Tree (R05.12–R05.13) | Multiplier category `masteryTree` registered but inactive; entitlement flags reserved (O15) | = 1 |
| Six deployed (R02.04) | `deployCap` is a content table, not a constant | W1 max 3 |
| 20–50 roster (R01.08) | `slotsUnlocked` from content | W1 max 6 |
| Nightmare (R06.18) | Difficulty enum includes `nightmare`, rejected by W1 content validation | — |
| Enchanting / advanced classes | Item `traits` array and class `branchOf` field reserved | Empty / null |
| Big numbers (W2+) | `NumericPolicy` interface around ledger arithmetic | Safe-integer policy |
| Party contribution (O16) | Credit function takes a contributor list | Single account in M1 |

---

## 19. Architecture risks

| Risk | Mitigation |
|---|---|
| Two implementations drift (lab vs Luau) | Shared fixtures and scenario traces are mandatory gates from M2. A spec version bump is required for any semantic change. |
| Batch offline approximations hide exploits | Small-run reference comparison and auditable error bounds in every receipt (S5). |
| Candidate numbers mistaken for approved | Labels on every value; reports refuse to print an unlabelled number. |
| Over-building before evidence | Increment gates S0 → S7; nothing is added to a state shape before the increment that owns it. |
| Tool version drift (Node/TypeScript/vitest) | Exact versions pinned in the lockfile. Runtime version recorded in every manifest. Fixture results must not depend on the version. |
| Non-technical owner cannot verify code | Evidence packs are human-readable: reports in plain words, fixture derivations, before/after fingerprints. Independent review at each gate. |
