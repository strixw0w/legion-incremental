# S6 specification: complete World 1 (headless)

**Version 0.2, 2026-11-16. Status: candidate; the registered version.**

**Versions:**
- **v0.1** was written before any S6 simulation. It is kept byte for byte in
  `evidence/s6/registration/S6_SPECIFICATION_v0.1_before_any_result.md` (SHA-256 `db142ba8…164b`).
- **v0.2** records method steps 2 and 3 (§8), before the registered matrix:
  - the policy fixes F3–F14 in §4;
  - the calibrated kill gates in §3;
  - the status in §0;
  - the registered cells in §7.
- **Unchanged from v0.1:** the targets, hypotheses and decision rules in §7.

**Source:** the owner's "S5 Acceptance and S6 Authorisation" (2026-11-16).

**Built on:**
- the design bible §4–§8 (the W1 content map, rare heroes, equipment, the Fallen King);
- the decision register;
- the M0 decisions D-06 (six shared productive slots, a non-productive reserve, free swaps) and D-08 (offline windows);
- the M0 experiment plan §S6 (S6-E01 … E09, H-S6-01 … 05) and N-09 (what counts as active time);
- the S1–S5 engine, unchanged on every historical path.

**Status of the rules:** S6-R01 … S6-R16 are proposed for the owner. Every number is a candidate. Nothing is approved
or live-validated.

**What is fixed before any result:** the targets, hypotheses and decision rules in §7 are written here before any S6
simulation has run, and will not change after results are seen. The calibration pass (§8) changes content values only,
by the rule stated there, and is reported in full.

## 0. Internal checkpoints

| # | Checkpoint | Status |
|---|---|---|
| 1 | S5 acceptance corrections A–D | done (`evidence/s5-acceptance/`) |
| 2 | S5 checkpoint commit and tag `s5-checkpoint` | done: `1b285db` (`evidence/s5-checkpoint/CHECKPOINT.md`) |
| 3 | W1 content model and validation | done |
| 4 | Engine W1 paths: bosses, Elite versions, elites, rare heroes, milestones | done |
| 5 | W1 checkpoint validation and the reward monitor | done |
| 6 | W1 candidate content (builder) | done: initial candidate 0.6.0, calibrated candidate 0.6.1 |
| 7 | The realistic W1 policy POL6 | done, with the fixes F3–F14 (§4) |
| 8 | Runner with an independent watchdog | done |
| 9 | Tests | done: `test/s6.w1.test.ts` |
| 10 | Exploratory runs, initial candidate, calibration, registered matrix | exploratory runs, fixes and calibration done (§8); registered matrix next |
| 11 | Review package `S6_EVIDENCE.md` | after the registered matrix |

## 1. Scope

**In scope (owner):**
- **Zones and bosses:** ten combat zones including the final boss region; two minibosses and the final W1 boss.
- **Roster:** six productive recruits plus the hero; a deployed cap rising from 1 to 3; three base classes.
- **Industry:** six gathering nodes; Mining, Woodcutting and Smithing; equipment tiers Wood, Copper, Iron, Steel, Gold
  and Mithril.
- **Rare heroes:** three unique, gameplay-earned rare heroes, sidegrades that share roster capacity.
- **Encounters and progression:** Normal and Elite encounters; complete W1 permanent progression; earlier-material
  relevance; post-clear goals.
- **Theme and gates:** the Verdant Kingdom; major gates and boss completion are active-only.

**Out of scope:** World 2, Roblox gameplay, any arbitrary-precision redesign, and a redesign of the simulation
architecture.

## 2. Engine rules (all World 1 only)

**How the old paths stay unchanged.** Everything below runs only with a World 1 content pack (`schemaVersion: 2`). With
any S1–S5 pack the engine runs exactly the code it ran before, so every historical control keeps its result.

### S6-R01 The W1 content model
- **Several boss gates:** a version 2 base pack lists `bosses` in path order. Each has a kind (miniboss or final), a
  Normal and an Elite enemy, the zone kills that open it, a timer per version, and first-clear rewards per version (gold,
  materials, optionally a rare hero).
- **Zone elites:** a zone may have an `elite` variant (its own enemy, a spawn chance, optionally a rare-hero drop with a
  pity count).
- **Validation (the pack is refused as a whole):**
  - a miniboss unlocks the next zone and replaces that zone's kill gate (never both);
  - exactly one final boss, in the last zone; at most one boss per zone; bosses listed in path order;
  - an Elite version is a different enemy; a boss enemy is never an ordinary zone enemy;
  - an elite has a positive spawn chance and its own enemy;
  - every reward resource exists.
- **The single-boss state mirrors the final boss.** The engine's single boss-gate record (used by S1–S5 code, the
  observation, Feats and the welcome-back summary) follows the final boss: opened, attempts, and completion (the world
  clear). The minibosses have their own W1 state.
- **The single-boss engine** (the S1 `Simulation`) refuses W1 content, and W1 content needs the legion switch.

### S6-R02 Boss attempts and clears
- **Opening:** a boss opens when its zone has the registered number of kills.
- **Starting:** `StartBoss` names a gate and optionally `elite`. Rules, in order: in session; not dead; not busy; a known
  gate; opened; Elite needs the Normal clear; the hero is in the boss zone; auto-farm is off (active-only); the hero is
  idle or resting.
- **Repeats:** after its first clear, the Normal version can be repeated.
- **Rewards:**
  - every clear pays the boss enemy's kill reward (EXP to every eligible character, gold, drops), like any kill;
  - the first clear of each version also pays its first-clear reward, once, as its own ledger transaction
    (`w1:first:<gate>` or `w1:elite-first:<gate>`), committed in the same step as the kill credit.
- **Failure:** a timer expiry or the hero's death ends the attempt. The boss board records when the last attempt failed
  (S6-R09).
- **Legacy content:** an Elite start is refused (`GATE_UNKNOWN`).

### S6-R03 Progress after a clear
At the progress step after the credit (the D-07 order):
- a miniboss's first Normal clear unlocks the next zone, with its roster milestone where one is defined;
- the final boss's first Normal clear completes the world (`WorldCleared`).

Both are derived from the committed gate state, so they are idempotent.

### S6-R04 Zone elites
- **Spawning:** each respawn in a zone with an elite variant draws whether it is elite, from a dedicated W1 spawn stream.
  The initial spawns are ordinary.
- **Identity:** an elite slot's instance is `<elite enemy id>#<spawn number>`; an Elite boss attempt's is
  `<Elite enemy id>#<attempt>`. The enemy of any encounter or claim follows from its instance, so the claim format, the
  credit registry and the event payloads are unchanged.
- **Elites are optional:** they are never gates. Workers fight their own private enemies and never meet elites.

### S6-R05 Rare heroes (D-06)
- **Three named heroes,** each with a fixed class, a join level and a trait. A trait adds to the existing pools: attack
  and HP to the class and talent sums, crit and ability power to their sums; the ability cooldown is scaled. A rare
  hero cannot change class (`RARE_CLASS_FIXED`).
- **Acquisition paths (exactly one each, validated):**

  | Hero | Class | Path | Guarantee |
  |---|---|---|---|
  | Aldric the Guardian | Warrior | the Bandit Chief's first Normal clear (zone 5) | guaranteed |
  | Sylwen the Huntress | Archer | a Skeleton Champion (Haunted Woods elite) drop | 15 % per elite kill, guaranteed on the 12th dry elite kill |
  | Maelis the Stormcaller | Mage | the Ruin Warden's first Elite clear (zone 8) | guaranteed |

- **Roster capacity:** a new rare hero takes a free productive slot, or waits in the reserve when the slots are full.
  Swaps are free outside encounters (D-06). Nothing is deleted.
- **Duplicates:** a repeat grant converts to one hero shard instead, as its own ledger transaction.
- **Atomic:** the grant commits in the same step as the kill credit that earned it.

### S6-R06 Roster milestones
A W1 legion pack lists slot and deploy-cap milestones by zone access. Its zone 2 and 3 entries must equal the S2 fields
(validated). Candidate:

| Zone accessed | Productive slots | Deploy cap |
|---|---|---|
| quest Q1 | 1 | 1 |
| 2 | 2 | 2 |
| 3 | 3 | 3 |
| 4 | 4 | 3 |
| 6 | 5 | 3 |
| 8 | 6 | 3 |

### S6-R07 Acquisition order
In World 1, recruits and rare heroes share one ascending acquisition order (each new character comes after the last).

### S6-R08 Completed gates
The Feat counter of completed gates also counts the minibosses' first Normal clears.

### S6-R09 The boss board
The observation's W1 section shows each gate's state, its Normal and Elite enemies' displayed stats, its timers, the
first-clear gold still to earn, and the time of the last failed attempt. It also shows the rare-hero collection, the
elite slots alive per zone, each zone's enemy and drops (the zone information screen), and each timed recipe's base
unit time (the blacksmith menu).

### S6-R10 Numerics (owner: D1–D30, headroom below 1 %, no silent clamping)
- **The W1 EXP table:** the power-geometric curve with a = 10, p = 1.6 (the slice's early pacing) and g = 1.02, for 600
  thresholds (maximum level 601).
  - The top threshold is 39,495,251,710.
  - The cumulative EXP to the top is 1,759,779,504,151: **0.0195 % of 2^53 − 1**.
- **No silent clamping:** an award past the end of the table already fails loudly (`XP_TABLE_EXHAUSTED`). That stays.
  S6-E09 checks that no D30 run reaches it.

### S6-R11 Logging and the reward monitor
- **The ledger transactions** (first-clear rewards, duplicate conversions) are logged like the S3 industry transactions,
  so the metrics reconcile with the ledger.
- **The S2 reward monitor** derives the enemy of each credit from its instance (elites and Elite bosses included). A rare
  hero that joins in a credit's own step must join with no EXP and no award.

### S6-R12 Checkpoints
The checkpoint validator requires the W1 record exactly with W1 content and checks it:
- one gate per content boss;
- completion matching the clear counts;
- no Elite clear before a Normal clear;
- no attempt before opening, and no more clears than attempts;
- the single-boss state mirroring the final boss;
- valid spawn and rare streams; per-zone elite counters; pity counters below their limits;
- every rare character a content rare hero with its class and on the rare list, and every rare-list name a character.

### S6-R13 Accuracy (zone 4 "introduces accuracy")
Zones 4–10 have small accuracy requirements (5 to 10 against the hero's constant accuracy of 10): a hit chance from 97.5
% down to 90 %, for everyone.

**A declared gap:** the lab has no source of accuracy (no stat, gear or level growth), so accuracy cannot be improved.
Accuracy progression is deferred.

## 3. Candidate W1 content (S6-R14)

**How it is made:** `src/s6/w1Content.ts` builds the five artifacts from one parameter set:
`content/s6/xp.w1.full…`, `w1-full…` (base), `w1-full-s2…` (legion), `w1-full-s3…` (industry) and `w1-full-s5…`
(permanent).
- `node src/cli/s6-content.ts --build` writes them.
- A test checks that the written files are exactly the build.
- Shared definitions are copied from the slice packs unchanged: the hero formula, combat, travel, auto-farm, classes,
  talents, professions, enhancement, salvage and the Monument of Eternity.

### 3.1 Zones

| # | Zone | Enemy (HP, defence, EXP, gold) | Gate | Elite |
|---|---|---|---|---|
| 1 | Slime Meadow | Green Slime (15, 0, 4, 1) | 100 kills | — |
| 2 | Wolfwood Forest | Wolf (45, 2, 10, 3) | 120 kills | — |
| 3 | Goblin Encampment | Goblin (120, 5, 22, 6) | 150 kills | — |
| 4 | Bandit Outskirts | Bandit (158, 10, 140, 10) | 180 kills | Bandit Captain, 3 % |
| 5 | Bandit Stronghold | Elite Bandit (243, 14, 260, 16) | **Bandit Chief** (opens at 200 kills) | — |
| 6 | Murkwater Swamp | Swamp Beast (352, 24, 420, 24) | 220 kills | Bog Horror, 3 % |
| 7 | Haunted Woods | Skeleton (478, 23, 640, 34) | 250 kills | Skeleton Champion, 4 % (the Huntress) |
| 8 | Forgotten Ruins | Stone Golem (623, 34, 1,050, 48) | **Ruin Warden** (opens at 250 kills) | — |
| 9 | Fallen Citadel | Corrupted Knight (796, 32, 1,500, 65) | 300 kills | Corrupted Paladin, 3 % |
| 10 | Throne of the Fallen | Throne Guard (989, 37, 2,200, 85) | **The Fallen King** (opens at 120 kills) | — |

**The table shows the initial candidate (0.6.0).** The calibrated candidate (0.6.1, §8) multiplies every kill gate from
zone 4 on and every boss unlock by 12:
- kill gates of 2,160 (zone 4), 2,640 (zone 6), 3,000 (zone 7) and 3,600 (zone 9);
- boss unlocks of 2,400 (Bandit Chief), 3,000 (Ruin Warden) and 1,440 (the Fallen King).

Zones 1–3 and every other value are unchanged (tested).

- **Zones 1–3** keep the slice enemies, so the tested early pacing is unchanged.
- **From zone 4 on,** each enemy is sized for a "design level" (25, 35, 46, 57, 68, 80, 92):
  - HP about 2.6 × (6 + D) × (1 + 0.32 (zone − 1));
  - defence about 0.4 D (more in the swamp and the ruins);
  - a hit of 3.5–7.5 % of a design-level hero's HP after mitigation;
  - EXP sized so that the zone's gate kills give most of the levels to the next design level.
- **Zone 10** has its own enemy because the model gates every boss on zone kills. It has six spawn slots (a small boss
  region).

**Elites:** four times the HP; 1.6 times the attack, about 10 % faster; 1.3 times the defence; six times the EXP and gold;
three of the zone material, guaranteed.

### 3.2 Bosses

| Boss | Zone | Normal (× zone enemy) | Elite | Timers | First clear | Elite first clear |
|---|---|---|---|---|---|---|
| Bandit Chief | 5 | HP × 40, attack × 2.5 | HP × 1.8, attack × 1.5, faster | 120 s / 150 s | 5,000 gold, 20 insignia, **the Guardian** | 15,000 gold, 40 insignia, 40 cloth |
| Ruin Warden | 8 | HP × 45, attack × 2.5 | as above | 150 s / 180 s | 20,000 gold, 30 rune fragments | 60,000 gold, 60 runes, 60 bone shards, **the Stormcaller** |
| The Fallen King | 10 | HP × 60, attack × 3 | as above | 180 s / 240 s | 80,000 gold, 5 crown fragments | 250,000 gold, 15 crowns, 60 corrupted steel |

**Boss mechanics are modelled as stats only.** There are no telegraphs, phases or summons. The Elite version is
stronger and faster, not only larger (the design bible's intent, as far as the model can express it).

**Every clear's kill reward:** 30 times the zone enemy's EXP and gold for Normal, 60 times for Elite, plus 5 or 10 of
the zone material.

### 3.3 Roster
- **Recruit prices** (recruits 2–6): 150, 400, 1,500, 5,000 and 15,000 gold.
- **Milestones:** as in S6-R06.
- **Rare heroes (join level; trait):**
  - the Guardian (30; HP +30 %, attack −10 %);
  - the Huntress (45; crit +15 %, ability power +50 %, cooldown +20 %, HP −10 %);
  - the Stormcaller (60; ability power +80 %, cooldown +30 %, attack −15 %).
- **Modelling note:** "area control" is modelled as a much stronger, slower ability, because lab fights are
  single-target.
- **Talents** keep the S2 cap of 10 points per talent, so they are complete at level 20 (a declared limitation; the
  policies assume 10).

### 3.4 Industry
**Six nodes:**

| Node | Zone | Skill | Material | Profession level | Tool |
|---|---|---|---|---|---|
| Meadow Oak | 1 | Woodcutting | logs | 1 | none |
| Wolfwood Copper Vein | 2 | Mining | copper ore | 1 | Wood pickaxe |
| Outskirts Iron Vein | 4 | Mining | iron ore | 8 | Copper pickaxe |
| Murkwater Yew | 6 | Woodcutting | yew logs | 12 | Iron axe |
| Haunted Gold Vein | 7 | Mining | gold ore | 18 | Steel pickaxe |
| Ruins Mithril Vein | 8 | Mining | mithril ore | 25 | Gold pickaxe |

**Smithing:**
- **Timed recipes:** planks, copper bars, iron bars, yew planks, steel bars (iron ore and a log), gold bars, mithril bars
  (mithril ore and a copper bar).
- **Tiers:** Wood and Copper are the slice tiers, unchanged. Iron, Steel, Gold and Mithril each have three class
  weapons, four armour pieces, an accessory and three tools; enhancement goes to +10.
- **Weapons add a percentage of the level attack** from Iron on (5 %, 10 %, 15 %, 22 %), so gear stays relevant as
  levels rise.

**Earlier-material relevance:**
- steel needs logs, and mithril needs copper bars;
- Iron, Steel and Mithril chestplates and accessories need earlier zone materials;
- Monument milestones require materials from every region, at growing quantities.

### 3.5 Permanent progression
- **Monuments:**
  - Power to level 50 (default pricing arm 120 gold and 18 % growth; the owner's arms are compared in S6-E11);
  - Vitality to level 50 (90 gold, 17 %);
  - Industry to level 40 (150 gold, 17 %);
  - Eternity unchanged from S5.
  - Bonuses per level fall in five tiers. The milestones use W1 materials.
- **The Bestiary:** the ten zone species (thresholds 25/150/600 kills in zones 1–3, then 40/250/1,000) in four regions,
  each with completion and gold-mastery rewards.
- **Feats, class records and roster rewards** are extended for W1 (more tiers; gates to 8; zones visited to 10;
  rosters to 9).

## 4. The realistic policy POL6 (S6-R15)

**What it is:** POL6 generalises the reference chain POL5-BAL → POL4-BALANCED2 → POL3-DEMAND2 → POL2 to World 1.
- **What it sees:** only the observation.
- **Isolation:** it imports nothing from the engine (tested).
- **State:** it keeps no state between decisions.
- **Constants:** it uses declared constants and is never tuned per run.

**Why every branch schedules its next step (v0.2):** the engine asks the policy nothing in three situations:
- when the hero becomes idle (after auto-farm is switched off, or after an Assign);
- when a knocked-out member recovers on its timer;
- when a rest completes at once at full health.

So every branch of a decision either finishes its step at once or leaves an activity whose events ask the policy
again. Fixes F3–F14 (`evidence/s6/exploratory/FIXES.md`) apply this rule; they are marked below.

**Each decision:**
1. **Roster (D-06):**
   - a reserve character takes a free slot (rare heroes first, then by level);
   - with no free slot, a rare hero swaps with the lowest-level ordinary recruit out of combat.
   - **The swap's decision also carries the hero's activity** (F4). The other roster and industry decisions wait for the
     next decision.
2. **Industry:** POL3-DEMAND2's candidate rule, with costs, needs and roles derived from the menus instead of slice
   constants:
   - **Costs:** a raw material costs its fastest node's action time; a component its unit time plus its inputs.
   - **Drops:** a missing drop blocks the candidate, and the hero farms the nearest zone that drops it.
   - **Needs:** they expand through every timed recipe.
   - **Roles:** one smith, and up to two gatherers.
   - **Tools and levels:** a gatherer blocked by its tool gets the lowest qualifying tool first; one blocked by its
     profession level trains at the best node it can use.
     - **No usable training node** (F8): when every node it could train at needs a tool it lacks, that tool comes first.
     - **Tool chains** (F10): the chain is followed, at most six steps, to the first tool that can be had now. For
       example, a Gold vein needs a Steel pickaxe, whose bars need iron mined with a Copper pickaxe.
     - **Lowest tier first** (F14): when the tool's recipe consumes a lower tier of its slot and none is worn or held,
       the lowest tier of that slot comes first.
     - **The wearer keeps gathering** (F11): the tool's wearer keeps a gathering role it can do now.
     - **A worker stops** (F9): a tool's wearer that is working is assigned idle, and the next decision equips the tool.
   - **Smithing levels** (F7): a component above the smith's Smithing level is never queued. Instead the smith trains on
     the highest-level timed recipe it can make (`TRAIN_BATCH` = 20 units), and its raw inputs become gathering needs.
   - **A free crafter** (F12): an item that only a busy recruit has the Smithing level for makes that recruit the smith.
     A recruit with another role keeps it.
   - **Command order** (F9, F13):
     1. the candidate's equipment commands (a working wearer first stops, and the swap follows at the next decision);
     2. the role assignments;
     3. POL2's roster commands, never undoing the tool step;
     4. production and training orders;
     5. the hero's activity.
   - **Enhancement cap:** +4.
3. **Monuments:**
   - POL4-BALANCED2's best affordable level by weighted bonus per gold, with a reserve for the next recruit plus 500 gold;
   - a milestone that waits only for components becomes production;
   - Eternity is valued at half an attack bp per offline bp (POL5-BAL).
4. **Bosses (active only):**
   - **Which boss:** the earliest open boss without its Normal clear; then an Elite version whose Normal is cleared;
     then (the BOSSFARM variant) a repeat.
   - **When:** only when the displayed squad estimate of its zone, scaled by the boss's displayed HP, defence and
     attack, finishes within 70 % of the timer and the first target survives 1.3 times as long.
   - **After a failure:** only once the squad's capability changed and ten minutes passed.
   - **Getting there:** the hero travels or teleports, stops auto-farm, rests to 95 % health, then starts.
     - **In one decision** (F3): switching auto-farm off, then resting or starting, are ordered together.
     - **Boss zone out of reach:** if the zone cannot be reached in one move, the hero keeps farming.
     - **A knocked-out member** (F5): the boss waits, and ordinary farming continues, because its kills wake the policy.

**Variants:**

| Variant | Difference | Used for |
|---|---|---|
| POL6-BAL | the reference | — |
| POL6-BAL-ATT | adds the manual ability | active play |
| POL6-NORARE | never activates rare heroes | S6-E06 |
| POL6-CONQ | no industry | — |
| POL6-NOMON | no Monuments | — |
| POL6-BOSSFARM | repeats cleared bosses | S6-E07 |
| POL6-WARRIOR / POL6-MAGE | other compositions | — |
| POL6-POOR | no gear, no Monuments, no Elite attempts | PR-POOR |

## 5. Profiles and time measures
- **Profiles:** all the M0 plan's profiles, plus a five-minute daily one (`src/s6/profiles.ts`): PR-NEW (one 45-minute
  session), PR-5MIN, PR-CAS, PR-FREQ, PR-BAL, PR-POOR, PR-COL, PR-ECO, PR-CMB, PR-OPT and PR-ABS.
- **Active time (N-09):** scheduled session time. Connected-automated time is the engine's separate category; offline
  credited time is the credited duration of absences; calendar time is wall time.
- **Milestones:** each W1 milestone (zones, boss clears, rare heroes, the world clear, Monument levels, first crafts per
  tier) is recorded with all three when it happens in a session.
- **Stall:** the longest stretch of active time without any progress event (H-S6-02).

## 6. Runner and watchdog (S6-R16; owner: "an independent watchdog for stuck tasks")
- **The runner** (`src/cli/s6-run.ts`) runs a manifest on worker threads (deterministic rows) under a watchdog
  (`src/s6/watchdog.ts`) driven by its own one-second timer, independent of task completion.
- **Budgets,** registered per manifest:
  - the run's wall time;
  - each task's wall time;
  - each task's heartbeat gap (tasks report progress at least once per simulated wall day or chunk);
  - process memory.
- **On the first violation,** every worker is terminated. The run is written as STOPPED with:
  - the code (WALL_BUDGET, TASK_BUDGET, STALLED, MEMORY_BUDGET or WORKER_ERROR);
  - the task and its last progress;
  - every task in flight;
  - the rows completed so far.
- **A stopped workload is reported, never silently rerun.**

## 7. Experiments, hypotheses and fixed targets

**Fixed before any result.** The M0 hypotheses are kept as written. The operational definitions are fixed here.

| ID | Question | Cells (candidate; finalised at registration) | Measure | Target or check (fixed) |
|---|---|---|---|---|
| S6-E01 | Profile matrix | all profiles × {POL6-BAL or the profile's policy, POL6-WARRIOR, POL6-MAGE} × 3 seeds, horizons 5 min, 1 h, D1, D3, D7, D14, D30 | snapshots and milestones | descriptive; feeds E08 and E09 |
| S6-E02 | W1 completion | PR-BAL, PR-CAS, PR-CMB, PR-OPT × 20 seeds, to D30 | active hours to the final Normal clear (also connected-automated, offline credited and calendar) | **H-S6-01:** the PR-BAL median within 4–8 active hours; the 10th and 90th percentiles reported |
| S6-E03 | Strategy spread | PR-BAL × {BAL, CONQ, NOMON, WARRIOR, MAGE, BOSSFARM} × 5 seeds, D7 | legion EXP at D7 (mean per strategy) | **H-S6-03:** best ÷ worst between 1.1 and 2.0 |
| S6-E04 | Earlier zones | from a common D-day state, one connected hour per accessible zone (fixed zone) against the frontier policy | EXP, gold and materials per hour; waiting share | descriptive: what each earlier zone offers that the frontier does not |
| S6-E05 | Sensitivity (staged) | stage 1: each factor × {0.5, 1.5}, 3 seeds; stage 2: factors with a stage-1 effect of at least 10 % × {0.5, 0.75, 1.25, 1.5}, 5 seeds; PR-BAL D7 | legion EXP at D7; W1 clear active hours | tornado; elasticities (§8 of the M0 plan) |
| S6-E06 | Rare heroes | PR-BAL and PR-COL × {BAL, NORARE} × 10 seeds, D14 | acquisition times; D14 legion EXP with and without | sidegrade check: with ÷ without within 0.90–1.15 (candidate) |
| S6-E07 | Boss rewards against farming | one boss per cell × 10 seeds: a repeated Normal clear against frontier farming for one connected hour after the first clear | gold, EXP and materials per hour | **H-S6-04:** a repeat's gold and EXP per hour at most 1.5 times farming (candidate ratio) |
| S6-E08 | Post-clear goals | from the E01 rows (PR-BAL, PR-CMB, PR-OPT) | time after the world clear to each Elite clear, each rare hero, the Monuments' maxima and Mithril gear | descriptive (O14) |
| S6-E09 | Numeric headroom | every E01 and E02 run | the peak integer anywhere in the state; the maximum level against 601 | **H-S6-05:** the peak below 1 % of 2^53 − 1, and no run exhausts the table |
| S6-E10 | Connected-idle incentive | 4 arms × 10 seeds: control (online 100 %, offline 60 %); offline 80 %; equal connected-automated and offline rates; full normal-window efficiency (100 %) | progress per wall hour: active, connected idle, offline | descriptive comparison of the incentive under each arm (owner) |
| S6-E11 | Monument of Power pricing | PR-BAL and PR-CMB × {80/15 %, 120/18 %, 160/20 %} × 5 seeds, D14 | progress; Power level; Monument gold share | descriptive |

**Also checked in the E01 and E02 rows:**
- **H-S6-02:** no realistic profile stalls more than 60 active minutes without a progress event.
- **Not universally respawn-limited:** flagged if waiting for spawns exceeds 50 % of connected time in every
  realistic cell at D7.
- **Hero contribution:** the hero's share of squad damage, reported against the S2 band [0.30, 0.60].
- **Active gameplay:** active ÷ connected-idle EXP per hour (E10 control arm) is above 1 (the R07.19 direction).

**The registered cells (v0.2).** The manifests in `manifests/s6/` fix the cells above. All use the calibrated candidate
0.6.1. Where they make the v0.1 candidate cells exact:
- **S6-E01:** the 11 profiles × {the profile's policy, POL6-WARRIOR, POL6-MAGE} × 3 seeds = 99 runs, to D30 (PR-NEW to
  D1, its one session).
- **S6-E04:** the common state is a POL6-BAL account after one wall day inside one connected session. From it, one
  connected hour per zone 1–10 (skipped where not accessible) and one with the frontier policy; 3 seeds (33 tasks).
- **S6-E05 stage 1:** 8 factors (EXP growth, gold costs, enemy HP, slots, offline rate, drop odds, feedback, respawn) ×
  {0.5, 1.5} and the baseline, × 3 seeds (51 runs).
  - **Run length:** PR-BAL is run to D14, so that a slower variant's world clear is observed. The measures stay legion
    EXP at D7 (its snapshot) and the clear's active hours.
  - **The stage-2 rule** (registered with stage 1): a factor goes to stage 2 when, at either multiplier, its mean D7
    legion EXP or its median clear active hours differs from the baseline by at least 10 %. A clear not reached counts
    as a difference.
  - **Stage 2** is written by that rule from the stage-1 rows and registered before it runs.
- **S6-E07:** each of the three bosses × 10 seeds. Each run is one connected session of at most 72 wall hours with
  POL6-BAL until the boss's first Normal clear. From there:
  - one hour of POL6-BOSSFARM (Normal repeats);
  - against one hour of POL6-BAL (Elite bosses off in both).
- **S6-E10:** a POL6-BAL account after three connected hours, then eight wall hours under each arm.

**Interpretation of the owner's arm 3** ("equal connected-automated and offline rates"): connected automation is
credited exactly as an absence of the same length. The lab has no separate connected-idle clock, so that arm's
connected-idle row equals its offline row by construction. The arm shows what removing the incentive does to the other
two rows. The owner may correct this interpretation at review.

**The Monument of Eternity's purpose (owner):** evaluated from the E01 and E10 rows, by its purchase timing and level
under POL6-BAL, its share of offline progress, and the full-normal-window arm as its upper bound. It is reported
descriptively, not as a target.

## 8. Method (owner: small exploratory runs, one initial candidate, one calibration pass, a final registered matrix)
1. **Exploratory runs** (unregistered, labelled exploratory): a handful of PR-BAL and PR-OPT runs to D7 with the
   candidate. Do the policy and engine reach every zone and boss, where do they stall, and how fast?
2. **The initial candidate:** the content as built (§3), fixed after the exploratory runs only where they show a
   mechanical failure (a policy deadlock, an unwinnable gate), each fix listed.
3. **One calibration pass:**
   - the zone design levels, enemy HP and EXP, the boss multipliers and the gate kills are scaled toward the fixed E02
     target (the PR-BAL median in the middle of 4–8 active hours);
   - the scale factors and their reasons are reported;
   - no target changes.
4. **The registered matrix:**
   - manifests in `manifests/s6/` registered by SHA-256 in `manifests/s6/preregistration.json` before the run;
   - run with the watchdog;
   - every miss reported as a miss.

**What steps 1–3 found (v0.2):**
- **Steps 1 and 2** (`evidence/s6/exploratory/FIXES.md`): the exploratory runs x01 and x02 and the industry probes found
  15 mechanical failures (F1–F15), each fixed and listed.
  - After the fixes (x02), the policy reaches every zone and boss, all three rare heroes and Mithril gear.
  - The initial candidate cleared the world far too fast: PR-BAL at 1.11 active hours (PR-OPT 1.33, PR-CAS 0.82,
    PR-POOR 1.24).
- **Step 3** (`evidence/s6/calibration/CALIBRATION_NOTES.md`; runs c01 and c02, PR-BAL to D14, 3 seeds per arm):
  - **The lever:** kill gates and boss unlocks.
    - Scaling zones 1–3 too (c01) was rejected: it would hold a new player in the first zones for a whole session.
    - From zone 4, ×8 clears in 3.49–3.61 active hours, ×12 in 6.57–6.89 and ×16 in 6.77–7.00.
  - **Chosen:** ×12, the tested value nearest the middle of the band. EXP and boss HP were not changed.
  - **The result is candidate 0.6.1.** The initial candidate 0.6.0 is kept as written. A test shows the two differ only
    in the scaled gates.
  - **Reproduced exactly:** a check run reproduced the calibration's ×12 row from the written 0.6.1 files.

**Workload:** registered budgets per manifest. A workload over its budget is stopped and reported.

## 9. Declared limitations (so far)
- **Boss mechanics** are stats only; the Elite version is stronger and faster stats.
- **Accuracy** has no source of improvement (S6-R13).
- **Workers** never meet elites (they fight private instances).
- **Talents** are complete at level 20.
- **The welcome-back summary** keeps the S5 schema: a rare hero earned offline (a Huntress drop) appears through its
  combat EXP, not as a named "new hero" line.
- **The policy's valuation** of a weapon's percentage attack uses the displayed level attack ((level + 5) points per
  100 %), a declared rule.
- **Zone 10** needs an ordinary enemy (the Throne Guard) to open the Fallen King, although the bible calls zone 10 the
  boss region.
