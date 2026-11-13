# M0 Architecture — `legion-progression-lab`

**Milestone:** M0 · **Version:** 1.1 (13 November 2026) · **Status:** APPROVED WITH CORRECTIONS. D-02, D-07, D-09 and D-10 were approved in `M0_RESOLUTION.md`. Review items A–G are applied in §6, §9, §10, §11, §14 and §15 (`M0_CHANGE_SUMMARY.md` lists every change). v1.0 is preserved in Git (import commit). Apart from S0, which is listed in the implementation plan, nothing described here has been built.

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

**Approved (D-09):** the canonical Legion repository is `Documents/GitHub/legion-incremental/`. It contains the game, the lab and a shared `spec/` folder, with strict one-way rules. Its GitHub remote `strixw0w/legion-incremental` is **public**, so nothing is pushed until the owner decides visibility (`M0_REPOSITORY_VERIFICATION.md`). The previous workspace `Desktop/Legion Incremental/` is kept unchanged until the owner approves its deletion.

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

## 3. Language, runtime and tooling (approved, D-10)

| Tool | Pinned version | Why |
|---|---|---|
| Language | **TypeScript 7.0.2**, strict (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`, `verbatimModuleSyntax`) | Typed state and event contracts. The same version is proven in the owner's frozen lab. |
| Runtime | **Node.js 24.22.3** (LTS "Krypton", released 10 Nov 2026), pinned in `.node-version`, `package.json#engines` and a runtime test | Runs `.ts` directly by type stripping. Installed as a self-contained copy in `%LOCALAPPDATA%\legion-tools\node-v24.22.3-win-x64\`, SHA-256 verified against nodejs.org `SHASUMS256.txt`. The system Node 25 used by other projects is untouched. |
| Package manager | **npm 11.19.1** (bundled), `engine-strict=true` | Exact versions; the lockfile is committed with S0 after review |
| Test runner | **vitest 4.1.12** | Proven in the frozen lab. vitest 5.x exists; it is not adopted without a reason. |
| Schema validation | **zod 4.6.7**, with JSON Schema export (`z.toJSONSchema`) into `spec/schema/` | One source of truth for shapes, plus a neutral schema for the Luau side |
| Property tests | **fast-check 4.10.2**, fixed seeds | Generated sequences check invariants |
| Node type definitions | **@types/node 24.19.2** | Matches the runtime major version |
| Hashing | `node:crypto` SHA-256 | Fingerprints and RNG seed derivation |
| Independent oracles | **Python 3.12.9 standard library only** (`decimal`, `fractions`, `hashlib`, `json`), always run with `python -I` | Expected values from a different language than the code under test |
| Luau conformance (M2+) | Lune (plus1game pins `lune-org/lune@0.11.0`) | Headless Luau for fixture conformance |
| Roblox sync | **Rojo 7.7.1** via Rokit; matching Studio plugin installed | Shared with plus1game (D-10) |

**Alternatives considered** (unchanged from v1.0):
- **Luau/Lune for the lab:** rejected, because shared code would defeat parity testing.
- **Python as the simulator:** rejected, because unbounded integers would hide the game's double-precision limits. Python is used for oracles only.
- **Rust, C# or Go:** rejected, since there is no precedent in this workspace.
- **Spreadsheet:** rejected, because it cannot express event ordering, RNG or state.

TypeScript and Luau numbers are both IEEE-754 doubles. Basic arithmetic (`+ − × ÷`, comparisons, `floor`) gives identical results when performed in the same order. `pow`, `log` and `exp` may differ in the last bit between engines, so authoritative paths never use them at runtime (§6, §15).

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
- **Time categories recorded separately for every run** (review item H):
  - `activeManualMs`: in a session, player-driven.
  - `connectedAutoFarmMs`: in a session, auto-farm on, no manual input. S1 has no abilities, so the two are equal in effect but are still reported separately.
  - `offlineMs`: between sessions.
  - `elapsedMs` = calendar time = `activeManualMs + connectedAutoFarmMs + offlineMs`.
- **Offline accounting (S5):** `creditedOfflineMs` per window: window 1 is 0–24 h at normal efficiency, window 2 is 24–72 h at reduced efficiency, and nothing is credited beyond 72 h. Reports also show "effective hours" = Σ window time × efficiency.
- **Session schedules** are part of the profile, not the policy, so the same policy can be run on different schedules.

---

## 6. Numeric policy (approved with corrections, D-02; review items A and B)

### 6.1 Safe integers, intermediate overflow, exact division
- **Safe integer:** `MAX_SAFE = 2^53 − 1 = 9,007,199,254,740,991`. A safe integer is a double for which `Number.isSafeInteger(x)` holds. `−0` is normalised to `+0` at every boundary.
- **`addSafe`, `subSafe`, `mulSafe`:** inputs must be safe integers. The IEEE-754 operation is performed once and its result checked. For integer inputs this check is sound: if the exact result lies outside ±(2^53−1), the rounded double lies at or beyond ±2^53 (rounding is monotonic and 2^53 is representable), so the check fails; otherwise the double is exact.
- **Intermediate overflow:** every intermediate value in a compound expression is checked, not only the final result. For example, `(a × b) ÷ c` fails with `NUMERIC_LIMIT` if `a × b` overflows, even when the mathematical final value would fit. Re-ordering to avoid an overflow is allowed only where a spec says so (as in §6.3).
- **`divRem(a, b)`:** exact for safe integers a ≥ 0, b ≥ 1. It starts with `q = floor(a / b)` and corrects q until `0 ≤ a − q·b < b`, because floating division alone can be off by one near 2^53. `ceilDiv` is derived from it.
- **Errors:**
  - `INVALID_NUMBER`: NaN, ±Infinity, a non-integer where an integer is required, a negative where forbidden.
  - `NUMERIC_LIMIT`: a result outside the safe range.

  Nothing is ever silently clamped.

### 6.2 Round half up (corrected)
`roundHalfUp(x)`:
- If |x| ≥ 2^52, every double is already an integer, so x is returned unchanged. The caller then checks that it is safe; 2^53 is not.
- Otherwise `f = floor(x)` and `d = x − f`, which is exact in this range, and the result is `f + (d ≥ 0.5 ? 1 : 0)`.

The naive `floor(x + 0.5)` is forbidden. It returns 1 for x = 0.49999999999999994, and 2^52 + 2 for x = 2^52 + 1, because x + 0.5 is rounded before the floor.

### 6.3 Exact remainder accounting (replaces the v1.0 floating carry)
Authoritative fractional progress is held as **integer remainders of exact rational accumulators**, never as floating-point carries.

**Primitive.** `accrue(rem, num, steps, den) → { granted, rem′ }` computes exactly:
- `granted = ⌊(rem + num·steps) / den⌋`
- `rem′ = (rem + num·steps) mod den`

for safe integers `0 ≤ rem < den`, `num ≥ 0`, `steps ≥ 0` and `1 ≤ den ≤ 2^26`.

**Exactness without big integers.** Write `steps = qₛ·den + j` and `num = a·den + b`, with `0 ≤ j, b < den`. Then
`granted = a·qₛ·den + a·j + b·qₛ + ⌊(b·j + rem) / den⌋` and `rem′ = (b·j + rem) mod den`.
- Because `den ≤ 2^26`, `b·j + rem < 2^52 + 2^26` is exact.
- Every other term is a part of `granted` and is computed with `mulSafe`/`addSafe`.
- So the only failure mode is a genuinely unrepresentable result (`NUMERIC_LIMIT`). A denominator above 2^26 is `INVALID_DENOMINATOR`.

**Guarantees.**
- **G1, partition invariance.** For fixed integer parameters (num, den), calling `accrue` over steps s₁, s₂, … in order and carrying `rem` gives exactly the same total and final `rem` as one call with Σsᵢ. This is pure integer arithmetic, so settlement frequency can never change the result.
- **G2, zero duration.** `steps = 0` changes nothing.
- **G3, rate changes.**
  - Authoritative rate parameters are **integers** (ms per action, basis points, milli-units per hour) that are fixed between rate-change events.
  - Across a change, each segment uses its own parameters, and the remainder carries over when the stage's `den` is unchanged.
  - Equivalence is guaranteed for every partition of a timeline that contains the same rate-change events. Those events are part of the deterministic simulation, not of the settlement schedule.
- **G4, quantisation boundary.**
  - Where a modelled real-valued quantity must become such an integer, the conversion happens once, at the rate-change event. It rounds against the player (durations up, yields and rates down) and is recorded in the receipt. These conversions are defined in the S2/S3/S5 stream specs.
  - Not guaranteed: equality with an unquantised real-valued integral. The difference is bounded by the declared quantum, for example less than 0.001 unit per hour per stream for the per-hour chain below.
- **G5, no epsilon.** No tolerance is ever added before a floor, so rounding can never create currency.

**Standard chains** (each stage has its own `den ≤ 2^26`; every stage is partition-invariant, so the chain is):

| Chain | Stage 1 | Stage 2 |
|---|---|---|
| Per-hour rate | ms → milli-units: `num = rateMilliPerHour`, `den = 3,600,000` | milli-units → units: `num = 1`, `den = 1000` |
| Timed actions | ms → actions: `num = 1`, `den = actionIntervalMs` (≤ 2^26 ms ≈ 18.6 h) | — |
| Efficiency (applied once) | work units → credited units: `num = efficiencyBp`, `den = 10,000` | — |

**Persistence.**
- Remainders are saved as integers in `[0, den)`, together with the version of their parameters.
- Proposed keying for S2+ is `(ownerId, quantityId, stage)`, where `ownerId` is `account` for ledger resources and a character ID for EXP. Account-resource remainders survive assignment switching.
- How partial action progress behaves on a switch is decided in S2/S3. The candidate rule is that it is discarded and never credited.

**Limits.**
- Per-call results above `2^53 − 1` fail with `NUMERIC_LIMIT`.
- The S6 headroom report shows each stream's peak against the limit.

### 6.4 Representation summary
| Quantity | Representation | Rule |
|---|---|---|
| Gold, materials, item counts, kill counters | Safe integer | Ledger (§10) |
| EXP (combat, profession, mastery) | `level` + `expIntoLevel` | §6.5 |
| Fractional progress (rates, efficiency, multipliers) | Integer remainders of exact accumulators | §6.3 |
| Damage per landed hit | Safe integer | `max(minDamage, roundHalfUp(raw × critFactor × mitigation))`, multiplied in that order |
| Percent-like values | Integer basis points (`…Bp`) | Converted only at the point of use |
| Probabilities | Basis points or a double in [0, 1] (`…Prob`) | Decided by a 32-bit integer threshold (§11) |
| Durations | Integer ms (`…Ms`) | — |
| Progression curves | Versioned integer tables | §6.5, §15 |
| Display | Formatted strings | Presentation only |

### 6.5 Single-level thresholds vs cumulative EXP
- **Thresholds only:** state stores `level` and `expIntoLevel`. Only the single-level threshold T(L) of the current level is ever compared, so only thresholds must be safe integers.
- **Cumulative table is report-only:** `C(L) = Σ_{i<L} T(i)` can leave the safe range many levels before any single threshold does. The table builder reports `lastSafeThresholdLevel` and `lastSafeCumulativeLevel` separately. Cumulative entries beyond the safe range are reported as absent, never clamped.
- **Award rules:**
  - `expIntoLevel + award` is checked with `addSafe`. Each level-up subtracts the current threshold, and leftover EXP is never discarded.
  - An award that would run past the end of the content table is refused as a whole with `XP_TABLE_EXHAUSTED`, leaving state unchanged. The table must be extended by a content change; it is never silently capped.
  - A per-award level-up guard (a content value) prevents runaway loops (`LEVEL_UP_GUARD`).

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

## 9. Commands, events and ordering (review item G; specified now, implemented in S1)

### 9.1 Commands
Commands (intent from a policy or a player) are validated against state and return `Accepted` or `Rejected(reasonCode)`, with no state change on rejection.
- **S1 commands:** `Travel(zoneId)`, `Teleport(checkpointId)`, `Engage(auto | targetId)`, `SetAutoFarm(on, zoneId)`, `StartBoss(gateId)`, `Rest`, `EndSession`.
- **Reason codes:** one code per refusal, for example `ZONE_NOT_ACCESSIBLE`, `ZONE_NOT_VISITED`, `CHECKPOINT_UNKNOWN`, `GATE_ACTIVE_ONLY`, `DEAD`, `NOT_IN_SESSION`.

### 9.2 Ordering key
```
orderKey = (tMs, pass, phase, entityOrder, seq)
pass:   0 for the first pass at a timestamp; see rule 5
phase:  0 BOUNDARY    session start/end, window boundaries, scheduled checkpoints
        1 COMPLETE    attacks resolve, job units complete, respawns complete → outputs deposited
        2 CREDIT      kill credited: EXP, gold, loot rolls, counters (once per account per kill)
        3 PROGRESS    level-ups (one event per level), mastery, milestones, gate completion, unlocks
        4 RECOMPUTE   stats and rates recalculated
        5 START       next swing scheduled, next job unit starts, reservations taken
        6 POLICY      policy observes and issues commands (validated as commands)
entityOrder: stable string order of entity IDs — used ONLY for commutative effects (rule 1)
seq: integer assigned when the event is scheduled (final tie-break)
```

### 9.3 Semantic rules
1. **Simultaneous resolution, no entity-order advantage.**
   - All attacks that resolve at the same (tMs, pass) in COMPLETE are resolved **simultaneously**. Every attack's damage is computed from the state at the start of the phase, and all damage is then applied together.
   - If the hero and an enemy land lethal blows on each other at the same instant, both die. The enemy kill is credited because the hero's hit landed, and the hero dies and respawns with no loss.
   - Entity order may only order commutative effects such as ledger credits and log lines. Any outcome that depends on order must come from a declared domain rule (simultaneity here; FIFO job priority from D-07), never from IDs.
   - **Metamorphic test:** renaming or permuting entity IDs must not change any outcome.
2. **Cancellation and stale events.**
   - Every scheduled event carries its actor's `epoch` and its `encounterId`.
   - Death, knockout, retreat, encounter end, session end and assignment change all increment the actor's epoch or close the encounter.
   - A popped event whose epoch or encounter no longer matches is discarded with no effect (counted as `staleDiscarded`).
   - Cancelled work never produces outputs or credits.
3. **Session boundaries.**
   - A session covers the half-open interval `[tStart, tEnd)`.
   - `SessionEnded` is a BOUNDARY event at `tEnd`, processed in phase 0 before any COMPLETE event at `tEnd`. It closes every open encounter by incrementing epochs, so an attack scheduled exactly at `tEnd` is not resolved online.
   - Online credit covers `[tStart, tEnd)`. The same event writes `lastSettledMs = tEnd`.
4. **Online → offline transitions.**
   - Offline settlement covers `[lastSettledMs, tReturn)`, using the assignment snapshot and remainders captured at the boundary event. The snapshot is immutable for that settlement.
   - No instant is credited by both paths. Test: credited online time + credited offline time + uncredited time = elapsed time, with no overlap.
5. **Same-moment scheduling into an earlier or equal phase.**
   - A handler running at (t, pass p, phase φ) may schedule (t, p, φ′) only if φ′ > φ.
   - If it needs φ′ ≤ φ at the same t (for example, a level-up in PROGRESS that enables an instant completion), the event goes to (t, p + 1, φ′): a new pass at the same timestamp.
   - Passes per timestamp are bounded (engine limit, candidate 64), otherwise `EVENT_CASCADE_LIMIT`. Time never moves backwards.
6. **Duplicate encounter credit.**
   - Each enemy instance has a unique `enemyInstanceId` per encounter, and its kill credit transaction ID is `kill:<encounterId>:<enemyInstanceId>`.
   - An instance can die once (state check), and the ledger treats a second credit with the same ID as a replay or a conflict (§10).
   - Two of an account's encounter streams never share an instance: worker streams are numerical and separate from physical spawns (R-A4).
7. **Multi-level awards** follow §6.5. They emit one `LevelUp` event per level, in ascending order, in PROGRESS at the same `tMs`.

---

## 10. Resource ledger (corrected, review item C)

**Shapes**
- **Balances:** each resource has two buckets, `available` and `reserved` (reserved is used from S3), with `total = available + reserved`.
- **Transaction:** `{ txId, purpose, cause?, lines: [{ resourceId, bucket, delta }] }`.
  - `txId` is a non-empty string of at most 256 characters.
  - Deltas are non-zero safe integers.
  - `resourceId` uses the stable ID format.
  - At least one line is required.

**Apply algorithm** (pure and atomic; it returns a new ledger or an error and never partially applies):
1. **Validate** the shape and every value (`INVALID_TX`, `INVALID_NUMBER`).
2. **Hash:** `payloadHash = SHA-256(canonicalJson(tx))` (§14).
3. **Check the transaction ID** against committed transactions:
   - **identical payload:** return the stored result with `replayed: true`, ledger unchanged;
   - **different payload:** `TX_CONFLICT`, ledger unchanged.
4. **Aggregate** all lines by `(resourceId, bucket)` using `addSafe`; intermediate overflow gives `NUMERIC_LIMIT`. Validation uses the aggregated net per bucket, so `+5` and `−3` on one bucket behave exactly like `+2`, and line order can never cause a false negative balance.
5. **Check each affected bucket:** `new = old + net`, which must be ≥ 0 (`NEGATIVE_BALANCE`) and ≤ 2^53−1 (`NUMERIC_LIMIT`).
6. **Commit** all changes and record `txId → { payloadHash, result }`. A failed transaction records nothing, so a later attempt with the same ID is evaluated afresh.

**Behaviour and later scope**
- **Result:** `{ txId, nets: [{ resourceId, bucket, delta }] }` with nets sorted by (resourceId, bucket); a replay sets `replayed: true`.
- **Conservation:** for every bucket, `final − initial = Σ nets of committed transactions`. This is checked in property tests and at every report checkpoint.
- **Reservation lifecycle (S3):** `reserve` moves available → reserved; `consume` removes from reserved; `release` moves reserved → available. A cancelled job can never trigger a deposit.
- **Items (S3):** equipment items are individual instances, not ledger quantities: `{ itemId, defId, ownerCharacterId | null, equippedSlot | null, enhancement, protected }`. Each has exactly one owner or none, and equip/transfer is one atomic operation.
- **Committed-ID retention:** unbounded in the lab. A bounded retention window for the game is an M6 design item.

---

## 11. Random numbers (corrected, review item D)

**Generator: xoshiro128** v1.1** (Blackman & Vigna) on four 32-bit state words:
```
result = rotl32(s1 * 5, 7) * 9            (all arithmetic mod 2^32)
t  = s1 << 9
s2 ^= s0;  s3 ^= s1;  s1 ^= s2;  s0 ^= s3;  s2 ^= t;  s3 = rotl32(s3, 11)
```
- Implementation is pure: `nextU32(state) → [u32, state′]`.
- In JavaScript: `Math.imul` with `>>> 0`. In Luau: the multiplications by 5 and 9 stay below 2^35, which is exact in doubles; shifts, rotations and xors use `bit32`.
- Roblox `Random` is not used for anything that must replay, because its algorithm is not specified for replay in another engine.

**Stream identity encoding (v1).**
- A stream is identified by `(root, purpose, entity, counter)`.
- Its byte encoding concatenates, for each field in the order `"legion.rng.v1"` (domain tag), root, purpose, entity, counter, a 4-byte big-endian unsigned length followed by the field's UTF-8 bytes.
- `counter` is a safe integer ≥ 0 written in canonical decimal (no sign, no leading zeros).
- String fields must be non-empty and at most 1024 UTF-8 bytes (`INVALID_STREAM_ID`).
- The length prefixes make the encoding injective: ("ab", "c") and ("a", "bc") give different bytes.

**State initialisation.**
- `digest = SHA-256(encoding)`, and state words s0..s3 are the big-endian u32 values of digest bytes 0–15.
- If all four words are zero, use bytes 16–31. If those are also zero, fail with `RNG_ZERO_STATE`. The all-zero state is a fixed point of the generator and must never be used.
- Each stream therefore has 128 bits of state derived from a 256-bit cryptographic hash. This replaces the v1.0 derivation, which collapsed every stream through one 32-bit FNV-1a hash and SplitMix32.

**Bernoulli trials.**
- **Threshold:** for a probability in basis points (integer 0–10,000), `T = ⌊bp · 2^32 / 10000⌋`, computed exactly with `divRem` (`bp · 2^32 ≤ 4.3 × 10^13` is safe). For a double probability p in [0, 1], `T = ⌊p · 2^32⌋`; scaling by a power of two is exact.
- **Too small:** a non-zero probability below 2^−32 gives `PROBABILITY_TOO_SMALL`. Quantisation of p is therefore below 2.33 × 10^−10.
- **Draws:** one trial consumes **exactly one draw** u and succeeds if and only if `u < T`. So p = 0 never succeeds and p = 1 always succeeds, but each still consumes one draw, which keeps streams aligned.

**Uniform integer `uniformInt(lo, hi)` (inclusive).**
- `lo` and `hi` must be safe integers with `lo ≤ hi`, otherwise `INVALID_RANGE`. `span = hi − lo + 1` must be at most 2^32, otherwise `RANGE_TOO_LARGE`.
- `limit = span · ⌊2^32 / span⌋`, computed exactly. Each attempt draws u; if `u < limit` the result is `lo + (u mod span)`, otherwise it draws again. Each attempt consumes one draw.
- **Boundaries:**
  - `span = 1`: exactly one draw, returns `lo`.
  - `span = 2^32`: never rejects.
  - `span = 2^31 + 1`: worst case, rejection probability ≈ 0.5.
- **Guard:** after 1000 consecutive rejections, `RNG_REJECTION_GUARD`. This has probability at most 2^−1000 with a correct generator; it exists so a broken generator fails instead of hanging.

**Batched sampling (S5)** is unchanged from v1.0:
- exact geometric gap sampling for rare drops;
- a documented, tested approximation only for large-count common materials;
- statistical (not bit-exact) agreement between engines wherever `log` is used.

**Two separate test kinds:**
1. **Replay:** exact sequences for fixed stream IDs, from the independent oracle.
2. **Distribution:** chi-square and binomial interval tests at fixed seeds with a pre-declared α = 0.001.

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

## 14. Experiments, manifests, reports, fingerprints (corrected, review item F)

**Manifests and runner (unchanged from v1.0).**
- **Manifest:** JSON, zod-validated: `{ experimentId, increment, purpose, contentRef {path, sha256}, formulaVersions, profiles[], policies[], schedule, horizons[], seeds { root, replicates }, metrics[], acceptance[] (pre-registered), outputs[] }`.
- **Refusals:** the runner refuses to start when hashes mismatch or a depended-on baseline has moved.

**Output records**, split into two parts:
- **`semantic`:** the canonical result, compared and fingerprinted. It contains only repository-relative paths with `/` separators. No absolute paths, usernames, hostnames, timestamps or durations.
- **`environment`:** recorded but never fingerprinted. Node version, OS, architecture, lab Git commit (or "uncommitted"), start timestamp and wall-clock durations.

**Canonical JSON (v1)**, following RFC 8785 conventions:
- Object keys are sorted by UTF-16 code-unit order and must be ASCII.
- Numbers must be finite and are serialised with ECMAScript `Number.prototype.toString` (shortest round-trip; `−0` becomes `0`).
- Strings are escaped as by `JSON.stringify`.
- `undefined`, functions, symbols and BigInt are rejected.

**Fingerprints and reproduction.**
- **Semantic fingerprint** = `SHA-256(canonicalJson(semantic))`.
- **Reproduction claim:** identical inputs give an identical semantic fingerprint. This is tested by running twice on the same machine and runtime (`npm run curve:preview` twice in S0).
- **Not claimed** until actually tested: byte identity across operating systems, CPU architectures or Node versions. Each environment record holds what is needed for that test later.

**Reports.**
- Every number in a report carries a label.
- Simulated numbers are `model-output`, tagged `realistic` or `oracle`; estimates are tagged `estimate`.
- Targets and results are kept in separate columns.

**Baselines** are promoted only with owner approval, plus a changelog entry.

---

## 15. Shared test fixtures and independent oracles (corrected, review item E)

**Format** (`spec/fixtures/<family>.v<N>.json`, validated by the zod schema exported to `spec/schema/fixture.schema.json`):

```json
{
  "fixtureSet": "xp",
  "fixtureVersion": 1,
  "specRef": "spec/formulas/xp.md#v1",
  "status": "candidate",
  "independence": "Hand derivations; tables cross-checked by spec/oracle/xp_oracle.py (decimal, two precisions).",
  "cases": [
    {
      "id": "xp.award.multi-level.001",
      "kind": "normal",
      "description": "One award crosses two thresholds exactly",
      "input":    { "table": [10, 30, 58], "level": 1, "expIntoLevel": 5, "award": 35 },
      "expected": { "level": 3, "expIntoLevel": 0, "levelUps": [2, 3] },
      "tolerance": "exact",
      "derivation": "5+35=40; 40-10=30 -> L2; 30-30=0 -> L3; 0<58 stop"
    }
  ]
}
```

**Rules**
1. **Independence:**
   - Expected values come from hand derivations or from `spec/oracle/` scripts written from the Markdown spec, never from running lab code. Every case carries a `derivation`.
   - Limitation: the oracles and the lab are written by the same author (Claude), in different languages. The reviewer should spot-check derivations.
2. **Exact rational vs high precision:**
   - `fractions.Fraction` is used only for rational quantities: integer and basis-point arithmetic, mitigation K/(K+D), integer-power hit curves, accumulators.
   - Irrational quantities, such as fractional exponents `L^p` and `g^(L−1)` with non-integer g, are evaluated with `decimal` at **two precisions (60 and 120 significant digits)**.
3. **Rounding-stability check** for every tabulated value:
   - the round-half-up integer must agree at both precisions;
   - the high-precision value's distance to the nearest `.5` rounding boundary must exceed `10^−9 × max(1, |value|)`;
   - the lab's double-precision result must equal the oracle integer.

   An unstable entry rejects the curve for use as content; different coefficients are needed.
4. **Integer tables are the contract:**
   - The lab generates each table (for example `content/tables/xp.w1.candidate.v0.1.0.json`), and the oracle regenerates it independently.
   - The artifact is accepted only if both agree exactly and every entry is stable.
   - Both engines consume the same versioned integer table; no engine recomputes a curve at runtime.
5. **Coverage:** every family includes normal cases, boundary cases (exact thresholds, zero, limits, values near 2^53) and failure cases (invalid input leading to a named error).
6. **Tolerance:**
   - `exact` for integers and for doubles produced by basic arithmetic in the specified order.
   - `{ "rel": 1e-12 }` only for reported doubles that involve `pow`, `log` or `exp`. These never decide an authoritative integer outcome directly; they are tabulated first.
7. **Special values:** `"NaN"`, `"Infinity"` and `"-Infinity"` appear only as strings in failure inputs.
8. **Versioning:** a fixture set is versioned with its spec. Changing an expected value requires a spec version bump and a changelog line.
9. **S0 families:**
   - numeric (safe integers, divRem, roundHalfUp)
   - remainder accumulator
   - rng (stream encoding, sequences, Bernoulli thresholds, uniformInt)
   - xp (table and awards)
   - stats stacking
   - combat primitives
   - ledger
   - canonical JSON
   - content validation

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
