# S1 combat loop (single classless hero)

## v1.1

S1.1 (2026-11-13), a targeted correction of v1 after the independent S1 review (`legion-progression-lab/planning/S1_1_RESOLUTIONS.md`). This spec implements architecture v1.1 §5 (time) and §9 (commands, events, ordering) for one classless hero in zones 1–3.

**Changes from v1** (each is marked *(v1.1)* below):
1. **Kill credit is one identity-checked operation** (§10). A kill registers an authoritative pending credit; a `KillCredited` event is honoured only if it matches it exactly, and is checked before any random draw. Duplicates, conflicts and unknown credits are rejected with a reason and change nothing.
2. **Policy triggers are combined** (§11). All decision requests at one `(t, pass)` become one decision carrying every trigger. New triggers: `hero-died`, `auto-farm-stopped`, `boss-cleared`, `boss-failed`.
3. **Turning auto-farm off cancels automatic work** (§5). It ends the walk or ordinary encounter that auto-farm started; manual encounters and bosses continue.
4. **Regeneration starts whenever the hero becomes idle in a session** (§12). This includes after a kill with auto-farm off, after a boss timeout, after a cancelled automatic engagement, and at a session start while hurt.
5. **A session end clears a pending manual engage** (§9). Spawn maintenance between sessions is stated explicitly.
6. **Drops are structured** (§10): drop events and awarded quantities are separate.
7. **The death window boundary is explicit** (§8): `(t − deathWindowMs, t]`. The stop is remembered per zone, and manual retry is defined.

v1 remains the description of the S1 implementation (S1 review package, ZIP SHA-256 `b255d94b…6d7fd3`).

**Sources:**
- **Approved rules:** R02.01, R02.06, R02.07, R02.14, R06.17, R08.04–R08.09, D-01, D-03, D-07.
- **Owner resolutions:** S1-R01 … S1-R17 as recorded in `planning/S1_OWNER_RESOLUTIONS.md` v1.0, which records the owner's acceptance after the S1 review. S1.1 resolutions are in `planning/S1_1_RESOLUTIONS.md`.
- **Numbers:** every number comes from the candidate content pack (`w1-slice.candidate.*`) and is a candidate.

### 1. Time and units
- **Clock:** integer milliseconds `tMs` since the profile started.
- **Units:** HP, defence, gold, EXP and drop quantities are safe integers. Attack is in thousandths (`combat.md` v2, "Attack quantisation"). Probabilities are in basis points.
- **Never early:** no event is ever scheduled earlier than its rule says. All durations are integer milliseconds from content, so no rounding of durations occurs in S1.

### 2. Event queue and ordering key
Every event has the key `(tMs, pass, phase, entityOrder, seq)` and is popped in ascending key order:

| Phase | Name | S1 events |
|---|---|---|
| 0 | BOUNDARY | `SessionStarted`, `SessionEnded`, `BossTimerExpired` |
| 1 | COMPLETE | `HeroSwing`, `EnemyAttack`, `EngageArrived`, `TravelArrived`, `TeleportArrived`, `HeroRespawned`, `SlotRespawned`, `RegenTick` |
| 2 | CREDIT | `KillCredited` (EXP, gold, drops, zone kill counter) |
| 3 | PROGRESS | `LevelUp` (one per level), `GateCompleted`, `ZoneAccessUnlocked`, `BossGateOpened` |
| 4 | RECOMPUTE | `StatsRecomputed` |
| 5 | START | `EngageStart` (choose a target and start the walk), `RegenStart` |
| 6 | POLICY | `PolicyDecision` |

- **`entityOrder`:** `"hero"` for hero events, `"zone:<order>"` for zone-slot events, `"account"` for credits and `"session"` for boundaries. It orders only commutative effects. No outcome may depend on it (§4, metamorphic test).
- **`seq`:** a run-wide integer, incremented each time an event is scheduled. It is the final tie-break.
- **Scheduling into the same timestamp (architecture §9.3 rule 5).** A handler running at `(t, pass p, phase φ)` that schedules phase φ′ at the same `t`:
  - if φ′ > φ, the event is scheduled at `(t, p, φ′)`;
  - otherwise it is scheduled at `(t, p + 1, φ′)`.
- **Later timestamps** are scheduled at pass 0. Scheduling at an earlier timestamp is an engine error (`INVALID_STATE`).
- **Cascade limit:** pass ≥ 64 at one timestamp gives `EVENT_CASCADE_LIMIT`.

### 3. Epochs, encounters and stale events
- **Hero epoch.** The hero has an integer `epoch`. It is incremented by:
  - death;
  - starting a travel or teleport;
  - `Rest`;
  - turning auto-farm off when that cancels automatic work (§5) *(v1.1)*;
  - closing an encounter (kill, death, boss timer, session end);
  - `SessionEnded`.

  Every hero-owned event (`HeroSwing`, `EngageArrived`, `TravelArrived`, `TeleportArrived`, `HeroRespawned`, `RegenTick`, `EngageStart`, `RegenStart`) carries the epoch at scheduling time.
- **Encounters.** Every encounter has `encounterId = "enc:<n>"`, where n is a run-wide counter starting at 1. `HeroSwing` and `EnemyAttack` carry it.
- **Stale events.** A popped event is stale, and is discarded with no effect, if its epoch differs from the hero's current epoch or its encounter is no longer open. Stale discards are counted (`staleDiscarded`), and cancelled work never produces damage, credit or progress.
- **Respawn timing.** `SlotRespawned` events are owned by the zone, not the hero, and are never stale. A slot respawns on schedule whatever the hero does.
- **`HeroRespawned`** carries the epoch set by the death, so a later epoch change (`SessionEnded`) cancels it (§9).

### 4. Simultaneous resolution (architecture §9.3 rule 1)
All events popped with the same `(tMs, pass, phase = COMPLETE)` form one batch, processed in this order:
1. **Discard stale events.**
2. **Compute every attack outcome from the state at the start of the batch:**
   - for each `HeroSwing`: the hit roll, crit roll and damage (§6);
   - for each `EnemyAttack`: the damage (§7).
3. **Apply all damage together:**
   - enemy HP ← max(0, HP − hero damage);
   - hero HP ← max(0, HP − Σ enemy damage).
4. **Resolve deaths:**
   - **Enemy at 0 HP:** it dies once. A pending credit is registered and a `KillCredited` event is scheduled at `(t, CREDIT)` for `kill:<encounterId>:<enemyInstanceId>` (§10). The encounter closes.
   - **Hero at 0 HP:** the hero dies (§8). If the enemy also died at step 4, the kill is still credited, because the hero's hit landed.
5. **Process every other COMPLETE event in the batch in key order:**
   - arrivals;
   - respawns;
   - regeneration ticks.

   These never depend on order; each touches a different entity.

Renaming or permuting zone, enemy, resource, checkpoint or gate IDs consistently must not change any outcome. This is the metamorphic test: random streams are keyed by role (§10), not by content IDs, and zones are ordered by their `order` field, never by ID.

### 5. Engagement (zones)
- **Zone slots.** Each zone has `spawnSlots` enemy slots, each either `alive` or `respawning`. At `t = 0` every slot is alive with `aliveSinceMs = 0`.
- **Each new enemy instance** gets `enemyInstanceId = "<zoneId>#<k>"`, where k is the zone's run-wide spawn counter starting at 1.
- **`EngageStart` (START phase)** applies when the hero is `idle`, alive, in a session and in a zone with auto-farm on, or when the policy issued `Engage`.
  - **Origin** *(v1.1)*: the engagement is `manual` if a policy `Engage` is pending, otherwise `auto`. The walk and the encounter it leads to carry this origin.
  - **Target choice** *(S1-R06)*: the alive slot with the earliest `aliveSinceMs`; ties go to the lowest slot index. The slot is reserved and the hero becomes `walking`.
  - **Walk duration:**
    - `zoneEntryWalkMs` for the first engagement after arriving in the zone, respawning or a session start *(S1-R02)*;
    - otherwise `engageOverheadMs`.

    `EngageArrived` is scheduled at `t + walk`.
  - **No alive slot:** the hero stays `idle` and waits. When a slot respawns in the hero's zone and the hero is waiting, a new `EngageStart` is scheduled at that time. The walk duration rule is unchanged.
- **`EngageArrived`** starts the encounter:
  - a new `encounterId`;
  - `enemyHp = hp`;
  - hero status `engaged`.

  The first hero swing is scheduled at `max(t, lastSwingMs + attackIntervalMs)` *(S1-R03: swing cooldown persists across encounters)*. The first enemy attack is scheduled at `t + firstAttackDelayMs`. At the same `t`, these go to the next pass (§2).
- **Ending an encounter without a kill** (hero death, travel, teleport, rest, session end, or auto-farm off for an automatic encounter): the reserved enemy returns to `alive` with full HP. Its `aliveSinceMs` is unchanged *(S1-R07)*.
- **Turning auto-farm off** *(v1.1; owner review §7)* cancels what auto-farm started: an `auto` walk to a target, an `auto` ordinary encounter, and an automatic wait for a respawn.
  - The reserved enemy is released at full HP.
  - The hero becomes `idle` and the epoch increments, so every scheduled swing, arrival and regeneration tick of that work is stale.
  - Regeneration starts (§12).
  - A `manual` encounter and a boss fight continue. The hero may `Engage` manually at any later moment.

### 6. Hero swing
Each `HeroSwing` consumes exactly one draw from the hero's hit stream and one from the hero's crit stream (`rng.md`), whatever the probabilities:
- **Hit:**
  - `p = hitChance(accuracy, accuracyRequirement, hitCurve)` (`combat.md`);
  - threshold `T = thresholdFromProb(p)`;
  - the swing hits if and only if the draw `u < T`.

  With requirement 0 (zones 1–3), `p = 1` and `T = 2^32`, so every swing hits.
- **Crit:** threshold `thresholdFromBp(critEffectiveBp)`; crit if and only if `u < T`.
- **Damage on hit:** `damagePerHit({ rawMilli: attackRawMilli(level), crit, critMultBp, mitigation: mitigationRatio(enemyDefence, K), minDamage })`.
- **A miss** deals 0 damage. A miss never reaches `damagePerHit`.
- **Overkill** (damage above the remaining HP) is wasted and reported.
- **Next swing.** If the enemy survives, the next swing is at `t + attackIntervalMs`. Stats are always read when the swing resolves, never when it is scheduled, so a level-up between scheduling and resolution applies (S1-R10).
- `lastSwingMs = t` for every resolved swing.

### 7. Enemy attack (retaliation, R02.06)
- **Damage:** `damagePerHit({ rawMilli: enemy.attackMilli, crit: false, critMultBp: 10000, mitigation: mitigationRatio(heroDefence(level), K), minDamage })`.
- **Hit chance:** enemy attacks always land *(S1-R05: no evasion stat exists in the approved design yet)*. They consume no random draws.
- **Next attack.** If both survive, the next enemy attack is at `t + enemy.attackIntervalMs`.

### 8. Hero death and respawn (R02.07, D-03)
When hero HP reaches 0:
- **Immediate effects:**
  - status `dead`, epoch + 1;
  - the encounter closes (§5);
  - `lastCombatMs = t`;
  - the death time is recorded;
  - a policy decision is requested (`hero-died`) *(v1.1)*.
- **Auto-farm stop** *(S1-R09; boundary explicit in v1.1)*. The deaths counted at time t are those in the half-open window `(t − deathWindowMs, t]`:
  - a death exactly `deathWindowMs` earlier **no longer counts** (exclusive lower bound);
  - the death at t counts (inclusive upper bound).

  If at least `stopAfterDeaths` deaths are counted while auto-farm is on, auto-farm turns off with reason `REPEATED_DEATHS`. The zone records the stop and the hero's level at that time (`deathStop`, shown to the player), and a policy decision is requested (`auto-farm-stopped`).
- **The engine never re-enables auto-farm** *(v1.1)*.
  - A later accepted `SetAutoFarm(on)` is an explicit manual retry: it clears the stop reason.
  - The recorded deaths stay in the window, so one more death inside it stops auto-farm again.
  - `Engage` (one manual fight) is also allowed after a stop.
  - Realistic S1.1 policies retry a stopped zone only after a level-up (`S1_1_RESOLUTIONS.md`). The S1 diagnostic controls retry at once (S1 behaviour).
- **Respawn:** `HeroRespawned` is scheduled at `t + respawnDelayMs`. On respawn:
  - HP = max HP;
  - status `idle`;
  - location: the current zone's entrance checkpoint (same zone);
  - no resource or EXP loss.

  If auto-farm is still on, `EngageStart` follows at `(t, START)`.

### 9. Sessions (architecture §9.3 rule 3)
- **`[tStart, tEnd)`:** a session covers this half-open interval. `SessionEnded` at `tEnd` is a BOUNDARY event, processed before any COMPLETE event at `tEnd`.
- **On `SessionEnded`:**
  - every encounter, walk, travel, rest and regeneration closes (epoch + 1);
  - auto-farm turns off;
  - a pending manual `Engage` that is still waiting for an enemy ends *(v1.1)*;
  - an attack scheduled exactly at `tEnd` is never resolved.
- **Between sessions nothing happens to the player.** S1 has no offline progress (S5) *(S1-R14)*.
  - **World spawn maintenance continues** *(v1.1, stated explicitly)*. `SlotRespawned` events are processed between sessions; they change only the zone's slots and spawn counter.
  - They never grant rewards, EXP, kills or credits, and never change the hero.
- **On `SessionStarted`:**
  - a hero that was `dead` is respawned at the current zone's checkpoint with full HP *(S1-R14)*;
  - a hero whose travel was cancelled is still at the origin zone;
  - a hurt hero starts regenerating (§12) *(v1.1)*;
  - a `PolicyDecision` follows.

  This is the only source of new commands at a session start.
- **Time categories** (experiment plan §2):
  - `connectedAutoFarmMs` accumulates while auto-farm is on during a session;
  - `activeManualMs` accumulates during a session while auto-farm is off;
  - `offlineMs` covers the gaps between sessions;
  - `elapsedMs` is their sum.

### 10. Kill credit (CREDIT phase; architecture §9.3 rule 6, §12; D-04) *(rewritten in v1.1)*
- **Identity** *(v1.1; owner review §2)*. When an enemy dies, the engine registers a **pending credit**: `(encounterId, enemyInstanceId, zoneOrder, boss)`, with credit ID `kill:<encounterId>:<enemyInstanceId>`. This is the only source of a valid credit.
- **`KillCredited` arrives.** The claim it carries is classified against the registry **before anything else happens**, including any random draw:
  - matches a pending credit exactly → **accepted**: the pending entry moves to the committed history;
  - its ID is pending but another field differs, or its ID is committed with different fields → **`CREDIT_CONFLICT`**;
  - its ID is committed with the same fields → **`CREDIT_REPLAYED`** (counted as `duplicateCredits` too);
  - its ID was never registered → **`CREDIT_UNKNOWN`**.

  A rejected claim is logged (`KillCreditRejected`, with its code) and counted. It changes no state, consumes no draw and schedules nothing.
- **Independent of the ledger.** The registry does not rely on ledger transactions, so an encounter with no gold and no drops (EXP only) has the same protection.
- **An accepted credit is one atomic operation.**
  - All of its effects are computed first, then applied together: ledger transaction, loot stream, EXP and level, zone kill count, credit history.
  - If any part fails, for example a ledger limit, nothing of it is applied.
  - Every future per-kill effect (Bestiary, class mastery, unlocks) belongs inside this operation, after the identity check.
- **Immutable history.** The committed history is an immutable, shared list, so branches (forks) keep their own history and never see another branch's credits.
- **Ledger.** One ledger transaction:
  - `txId = "kill:<encounterId>:<enemyInstanceId>"`, `purpose = "kill.reward"`;
  - lines: gold (if > 0) and one line per successful drop entry. The ledger adds lines for the same resource together.
  - If the ledger already holds the transaction while the registry has not committed it, that is an engine error (`INVALID_STATE`).
- **Drops** *(structured in v1.1)*. For each drop entry, in the content's listed order:
  - one draw from the account loot stream: success if and only if `u < thresholdFromBp(chanceBp)`;
  - on success, a **drop event** `(resourceId, qty, entry index)`.

  Each entry consumes exactly one draw whatever its chance. Several entries may name the same resource.
  - **Drop events** count successful entries (for probability checks).
  - **Awarded quantities** sum `qty` per resource (for production rates).
  - Metrics keep both, and reconcile the quantities and gold with the ledger at the end of every run.
- **EXP:** `applyExpAward` (`xp.md` v2) with the enemy's EXP. The new level and `expIntoLevel` are stored now; `LevelUp` events follow in PROGRESS.
- **Kill count:** the zone kill counter + 1. Ordinary enemies only.
- **Random streams** (`rng.md`; derived once at run start, then carried in state):

  | Stream | Root | Purpose | Entity |
  |---|---|---|---|
  | hero hit | run seed | `"hero.hit"` | `"hero"` |
  | hero crit | run seed | `"hero.crit"` | `"hero"` |
  | account loot | run seed | `"loot"` | `"account"` |

  All have counter 0. Streams are keyed by role, so renaming content IDs cannot change any draw.

### 11. Progress, recompute, start, policy
- **PROGRESS:**
  - one `LevelUp(level)` per level gained, in ascending order;
  - kill gates and the boss gate are checked here (`gates.md`).
- **RECOMPUTE:**
  - max HP = `baseMaxHp + maxHpPerLevel × (level − 1)`;
  - defence = `baseDefence + defencePerLevel × (level − 1)`;
  - attack value = `evaluateStat(baseAttackMilli + attackPerLevelMilli × (level − 1), [], categories)`, then `rawMilli` (`combat.md`);
  - current HP increases by the max-HP gain *(S1-R10)*.
- **START:** engagement and regeneration starts (§5, §12).
- **POLICY:** a decision is requested, with a **trigger**, at these moments:

  | Trigger | When |
  |---|---|
  | `session-start` | session start |
  | `kill` | every accepted `KillCredited` |
  | `level-up` | after `LevelUp` |
  | `gate-completed` | a kill gate completes (with `ZoneAccessUnlocked`) |
  | `boss-gate-opened` | `BossGateOpened` |
  | `boss-cleared` *(v1.1)* | the boss gate completes |
  | `boss-failed` | the boss timer expires, or the hero dies in the boss fight *(v1.1)* |
  | `hero-died` *(v1.1)* | the hero dies |
  | `auto-farm-stopped` *(v1.1)* | the repeated-death stop |
  | `arrived` | travel or teleport arrival |
  | `respawned` | respawn |
  | `rest-complete` | rest complete |

- **Combining** *(v1.1; owner review §4)*. All decision requests at one `(t, pass)` form **one** decision, like a COMPLETE batch.
  - Its observation carries every trigger (`triggers`), without repeats, in the order of the table above; unlisted triggers follow alphabetically. `trigger` is the first of them.
  - So a gate completion or a level-up is never hidden behind a simultaneous kill.
  - Requests at different timestamps are different decisions and are never suppressed.
- **Cascades.** A decision's commands may cause new requests at the same timestamp, which form a later pass. More than 8 decisions at one timestamp is a policy cascade and an engine error (`EVENT_CASCADE_LIMIT`).
- **Commands** are validated and applied in order (`gates.md`). A rejected command changes nothing and is logged with its reason code.

### 12. Out-of-combat regeneration *(S1-R11)*
- **When:** only while the hero is `idle` or `resting` and alive in a session.
- **Starts** *(completed in v1.1)*: whenever the hero becomes idle or rests in a session:
  - waiting for a spawn;
  - arrival;
  - `Rest`;
  - a kill with auto-farm off;
  - a boss timeout;
  - a cancelled automatic engagement;
  - a session start while hurt.
- **First tick:** at `max(t, lastCombatMs + outOfCombatDelayMs)`.
- **Ticks:** every 1,000 ms after the first tick.
- **Amount per tick:** `accrue(regenRem, maxHp × regenPerSecBpOfMaxHp, 1, 10000)` HP, with the remainder kept in `regenRem` (`remainder.md` accrue). HP stops at max HP.
- **Reset:** regeneration stops, and `regenRem` resets to 0, when the hero leaves `idle`/`resting` or reaches max HP.
- **`Rest`** sets status `resting` (auto-farm off). It ends at max HP with a `PolicyDecision`.

### 13. Boss stub
See `gates.md` §5. The boss is fought with the same swing, attack, death and stale-event rules as an ordinary encounter. Its timer is a BOUNDARY event, so the interval is half-open. A boss encounter is always `manual`.

### 14. Errors
- `EVENT_CASCADE_LIMIT`: more than 64 passes, or more than 8 policy decisions, at one timestamp.
- `INVALID_STATE`: scheduling in the past, a queue or state invariant broken, the ledger holding a credit the registry has not committed, or metrics that do not match the ledger.
- `SIM_EVENT_LIMIT`: a run exceeded its declared event budget.

These are engine errors, not gameplay outcomes. A run that raises one is reported as failed.

**Fixtures:**
- `spec/fixtures/combat-loop.v1.json` (hand-derived timelines);
- `rewards.v1.json` (fixture version 2: drop events and quantities);
- `credits.v1.json` (credit identity).

Each is independently re-derived by `spec/oracle/s1_oracle.py`.
