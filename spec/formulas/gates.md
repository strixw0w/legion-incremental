# Gates, zone flags, travel and commands (S1)

## v1.1

S1.1 (2026-11-13). Implements D-01 (three flags, kill gates, active-only gates), R06.05–R06.07, R06.17, R06.19, R10.03 and R-A6 for a single hero.

**Changes from v1** (marked *(v1.1)*):
1. `SetAutoFarm(on: false)` cancels automatic work (`s1-combat-loop.md` v1.1 §5). In v1 an automatically started encounter continued.
2. New command `Report(code)`: a policy's stated reason for stopping, with reason code `REPORT_UNKNOWN`.
3. Each zone records its last repeated-death stop (`deathStop`), shown to the player.

- **Resolutions:** the owner's decisions on S1-R01 … R17 are in `legion-progression-lab/planning/S1_OWNER_RESOLUTIONS.md`; the S1.1 rules are in `S1_1_RESOLUTIONS.md`.
- **Numbers** are candidates from the content pack.

### 1. Zone flags (account-wide; D-01)
Each zone has three **separate** flags and one counter:

| Field | Set when | Used by |
|---|---|---|
| `accessUnlocked` | Zone 1 at profile start; zone N + 1 when zone N's kill gate completes | `Travel` |
| `visited` | The hero first arrives in the zone, by travel, teleport or start | Reporting (first-visit time, N-11); worker assignment (S2) |
| `checkpointDiscovered` | The hero first arrives at the zone's entrance checkpoint | `Teleport` |
| `kills` | +1 per ordinary kill credited in the zone, account-wide (`s1-combat-loop.md` §10) | Kill gates, boss gate |
| `deathStop` *(v1.1)* | Auto-farm stops for repeated deaths in the zone: the time and the hero's level | Shown to the player; realistic policies' recovery rules |

- **Arrival in S1.** Each zone's only checkpoint is at its entrance *(S1-R12)*, so `visited` and `checkpointDiscovered` become true at the same arrival. They remain separate fields with separate events (`ZoneVisited`, `CheckpointDiscovered`) and separate tests. A flag is never set implicitly by another.
- **At `t = 0`** the hero is at zone 1's entrance *(S1-R01)*. Zone 1 is accessible, visited and its checkpoint discovered. Zones 2 and 3 have every flag false.

### 2. Kill gates (ordinary; D-01)
- **Completion.** Zone N's kill gate completes in PROGRESS at the first moment `kills(N) ≥ killGate.kills`.
- **Events:** `GateCompleted(gateId)` then `ZoneAccessUnlocked(toZoneId)`. Each happens once and is permanent.
- **Kills that count:** any eligible credited kill in zone N, including auto-farm kills. Worker and offline kills are S2/S5.
- **Access only.** A kill gate grants access, never a visit and never a checkpoint.

### 3. Travel and teleport (R06.02, R06.19)
- **`Travel(zoneId)`.** The hero walks to an **adjacent** zone (|order difference| = 1; the zones form a line) *(S1-R13)*. It takes `adjacentWalkMs`.
  - **On start:** the hero epoch + 1, the open encounter closes, auto-farm turns off and status becomes `travelling`.
  - **On `TravelArrived`:** the hero's location is the destination, at its entrance checkpoint. The visit and checkpoint flags are set if new, then `PolicyDecision`.
- **`Teleport(checkpointId)`.** The hero moves to a discovered checkpoint in any zone. It takes `teleportMs` and is free.
  - Its effects on start and arrival match `Travel`.
  - Teleport can never set `visited` on a zone that was not already visited, because only a visited zone has a discovered checkpoint.
- **During a session only.** Travel and teleport require being in a session. Both are cancelled by `SessionEnded`, leaving the hero at the origin.

### 4. Commands and reason codes (architecture §9.1)
Each command is validated against the current state. Rules are checked in the order listed, and the first failure is returned as `Rejected(code)` with no state change. An accepted command takes effect at the current `(t, POLICY)`; the events it schedules follow §2 of `s1-combat-loop.md`.

| Command | Validation, in order (code) | Effect |
|---|---|---|
| `SetAutoFarm(on: true, zoneId)` | in session (`NOT_IN_SESSION`); hero alive (`DEAD`); not travelling, teleporting or in a boss fight (`BUSY`); zone exists (`ZONE_UNKNOWN`); hero is in that zone (`NOT_IN_ZONE`) | Auto-farm on, bound to the zone. If idle, `EngageStart` follows. |
| `SetAutoFarm(on: false)` | in session (`NOT_IN_SESSION`) | Auto-farm off. *(v1.1)* An automatic walk or ordinary encounter ends without a kill; the enemy is released at full HP (`s1-combat-loop.md` §5). A manual encounter or boss fight continues. No new automatic engagement starts. |
| `Engage` | in session; alive; not busy; hero in a zone (`NOT_IN_ZONE`); hero `idle` (`ALREADY_ENGAGED`) | One manual `EngageStart`. |
| `Travel(zoneId)` | in session; alive; not busy; zone exists; `accessUnlocked` (`ZONE_NOT_ACCESSIBLE`); not the current zone (`ALREADY_THERE`); adjacent (`ZONE_NOT_ADJACENT`) | §3 |
| `Teleport(checkpointId)` | in session; alive; not busy; checkpoint exists (`CHECKPOINT_UNKNOWN`); discovered (`CHECKPOINT_UNKNOWN`); not the current zone (`ALREADY_THERE`) | §3 |
| `Rest` | in session; alive; not busy | Status `resting`, auto-farm off, open encounter closed (`s1-combat-loop.md` §12) |
| `StartBoss(gateId)` | in session; alive; not busy; gate exists (`GATE_UNKNOWN`); gate open (`GATE_LOCKED`); not cleared (`GATE_ALREADY_COMPLETED`); hero in the gate's zone (`NOT_IN_ZONE`); auto-farm off (`GATE_ACTIVE_ONLY`); hero `idle` or `resting` (`ALREADY_ENGAGED`) | §5 |
| `EndSession` | in session (`NOT_IN_SESSION`) | The session ends at the current t (`SessionEnded` at `(t, pass + 1, BOUNDARY)`) |
| `Report(code)` *(v1.1)* | in session (`NOT_IN_SESSION`); code is `NO_SAFE_ZONE` or `FIXED_ZONE_BLOCKED` (`REPORT_UNKNOWN`) | No game-state change. The hero's shown report becomes `code`; `PolicyReport` is logged when it changes. `SetAutoFarm(on)` clears it. |

**Auto-farm never issues commands.** It only re-engages ordinary enemies in its bound zone (`s1-combat-loop.md` §5). So no automation can start, travel to or complete an active-only gate. Only the policy issues commands.

### 5. Prototype miniboss gate stub (R10.03, R-A6, R06.17; active-only)
**Status:** a placeholder for the prototype miniboss. It reuses the implementation for one of the two approved major minibosses (R-A6), is **not** a fourth major boss, and its content is temporary and candidate.
- **Opening.** In PROGRESS, when `kills(zone 3) ≥ unlockKills`, `BossGateOpened(gateId)` fires once. The gate is now open but not completed.
- **Start.** `StartBoss` (§4) starts a personal boss encounter at the current t:
  - a new `encounterId`, with the boss at full HP;
  - first hero swing per the swing cooldown;
  - first boss attack at `t + firstAttackDelayMs`;
  - `BossTimerExpired` at `t + timerMs`, in phase BOUNDARY. The encounter interval is half-open, so a hit landing exactly at the timer is too late.
- **Clear** (boss HP reaches 0 before the timer):
  - `KillCredited` with the boss's EXP and gold, `txId = "kill:<encounterId>:<bossInstanceId>"`;
  - then `GateCompleted(gateId)`.

  It does not count towards zone kills.
- **Failure** (hero death or timer expiry): `BossFailed(reason)`. The encounter resets. The hero returns to zone 3's entrance (respawning first if dead), with **no loss** of resources or EXP (R06.17). The gate stays open, so it can be retried.
- **Active-only:** only `StartBoss` can begin it, and `StartBoss` is refused while auto-farm is on.

### 6. Invariants (tested)
1. `visited` implies `accessUnlocked`, and `checkpointDiscovered` implies `visited`.
2. No command ever sets `accessUnlocked`. Only gate completion does.
3. Every rejected command leaves the state byte-identical (canonical JSON), apart from the decision log.
4. No automation path reaches `StartBoss`.
5. Each gate completes at most once.

Fixtures: `spec/fixtures/gates.v1.json` (fixture version 2: command validation including `Report`, and gate progress, independently re-derived by `spec/oracle/s1_oracle.py`).
