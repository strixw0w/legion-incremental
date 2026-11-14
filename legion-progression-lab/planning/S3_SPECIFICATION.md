# S3 specification — professions, equipment, crafting and production

**Version 1.0, 2026-11-14.** Written before S3 implementation. Owner: "Final L1/S2.1 Acceptance and S3 Authorisation" §5–§13.

**Sources:**
- Decision Register R04.01–R04.20, R07.09–R07.10, R08.12–R08.15;
- Game Design Bible §6;
- M0 resolutions D-01 and D-07;
- `S3_OWNER_DECISIONS.md` (O06, N-06, O09, O10);
- `S2_OWNER_RESOLUTIONS.md`;
- the M0 experiment plan (S3).

Where these are silent, the candidate rules S3-R01 … in `S3_RESOLUTIONS.md` apply.

**Labels:** every number is a candidate in `content/w1-slice-s3.candidate.v0.3.0.json`.

**Out of scope (owner §12):** Monuments, Bestiary, Feats, applied class bonuses, research, offline settlement, advanced classes, enchanting, rare-hero content, zones 4–10, final bosses, the full six-tier content, monetisation, trading, Roblox/Luau, dashboards.

## 1. Engine
- **One engine.** The S2 legion engine gains an `industry` feature switch.
  - **Off:** it reproduces S2 exactly; this is the S2 control, tested.
  - **On:** professions, nodes, gathering, equipment, crafting and production.
- **Same-moment order (D-07):** completed work, then credits (including deposits and production outputs), then level-ups and unlocks, then stat recomputation, then new work and reservations, then policy commands.
- **Ledger.** The accepted persistent ledger, with buckets `available` and `reserved`.
  - Every ledger change is one transaction with a unique, categorised ID.
  - The reference ledger is kept for cross-checks.

## 2. Professions (R04.01–R04.06; O06)
- **Levels.** Every character has Mining, Woodcutting and Smithing EXP and a level for each. Levels use the combat EXP table (candidate) and are independent of the combat level.
- **Efficiency** (basis points, bp) for a profession = (level − 1) × `efficiencyPerLevelBp` + the equipped tool's bonus + the affinity bonus. An affinity applies when the character holds the matching class.
- **Affinities (O06):** Warrior → Mining, Archer → Smithing, Mage → Woodcutting. The strength is a candidate; a no-affinity variant sets it to 0.
- **Profession EXP:**
  - per gathering action, to the gatherer;
  - per completed production unit, to the smith;
  - per instant craft, to the crafter.

  Never for cancelled or failed work.

## 3. Nodes and gathering (R04.03–R04.09; Bible §6)
- **Nodes** belong to zones. A node is **discovered** when the hero has visited its zone (D-01). Gathering at an undiscovered node is refused.
- **Requirements:** each node has a profession, a resource, an action time, a base yield (thousandths of a unit per action), a profession level requirement, an optional tool requirement (a tool slot and a minimum tier), and profession EXP per action.
- **Unlimited personal access:** any number of owned characters can gather at the same node; there is no depletion and no competition.
- **The gathering loop:** each action lasts `actionMs`. Its yield is `baseYieldMilli × (10000 + efficiency) / 10000` thousandths, added to a per-character exact remainder (S0.1 accrual). Whole units are deposited into the shared ledger at completion (one transaction).
- **Captured at action start:** the action time is fixed, and the efficiency is captured. A change of tool, level or assignment never shortens an action in progress. An interrupted action (reassignment, unequip, travel, session end) yields nothing.
- **The hero gathers by command:**
  - `Gather` at a node in the current zone, when out of combat (the headless form of "interact once to auto-gather", R04.04);
  - it stops on any other hero activity (travel, engage, auto-farm, rest, boss) or at session end.
- **Recruits** gather by assignment.

## 4. Assignments (R07.09–R07.10, extended)
- **One per character at a time:**
  - `squad` (deployed combat);
  - `worker` (independent combat);
  - `gathering(node)` (Mining or Woodcutting, set by the node);
  - `smithing` (production);
  - `idle`;
  - `reserve` (non-productive).

  The hero is `leader`. Its activity is combat, gathering or idle; the hero never smiths in the production queue.
- **Gathering assignment** requires:
  - a discovered node;
  - the node's profession level;
  - the tool requirement met by the character's equipped tool.

  The same rules apply to recommendations.
- **Changes** cancel the old role's pending work through the per-character epoch:
  - a gathering action in progress yields nothing;
  - a production unit in progress releases its reservation (§6).

  A character never produces in two roles. Reserve characters produce nothing.

## 5. Equipment (R04.10–R04.19; N-06; O09)
- **Slots:** weapon, helmet, chestplate, leggings, boots, accessory, and the tools pickaxe (Mining), axe (Woodcutting) and hammer (Smithing).
- **Tiers:** the six IDs Wood, Copper, Iron, Steel, Gold, Mithril. Only Wood and Copper have content.
- **Definitions** are fixed and recipe-defined, with no random traits:
  - weapons: an attack bonus, and a class list (a classless character uses universal weapons);
  - armour: defence and HP, usable by every class (shared design, independently owned instances);
  - accessory: HP and crit;
  - tools: profession efficiency.
- **Instances:** `item:<n>`, created only by crafting, with a definition, an enhancement level, a protected flag, and exactly one location: `inventory`, `equipped(character, slot)`, `consumed` or `salvaged`.
- **Equip, unequip and transfer** are free and atomic, and allowed only while neither character is in an encounter. Equipping into an occupied slot returns the previous item to the inventory. Weapons must be class-compatible.
- **Auto-equip (deterministic):** for each slot in order, it picks the best compatible inventory item by the slot score, ties by item ID. It only replaces an item with a strictly better one, and never takes an item equipped by another character.
- **Stats:**
  - the weapon attack bonus is added to base attack before class and talent multipliers;
  - armour and accessory HP is added to base HP before the class HP multiplier;
  - defence and crit are added after.

  With no equipment the stats are exactly S2's.
- **Enhancement:** guaranteed. Level 0 to the tier's maximum; each level adds `enhanceStepBp` of the base stats. The cost escalates as gold `enhanceGoldBase × (level + 1)²` plus tier material `× (level + 1)`.
- **Crafting** is instant (R04.15), by a named crafter who must be out of an encounter and have the recipe's Smithing level.
  - Inputs: materials, plus for Copper equipment one lower-tier item of the same slot (R04.16), chosen explicitly.
  - That item must not be equipped or protected (O09); the crafting preview shows what will be consumed.
  - Enhancement is **not** inherited (default). Partial inheritance is a variant.
  - One atomic operation: the materials are debited, the consumed item becomes `consumed`, and the new item is created in the inventory.
- **Salvage:** an unequipped, unprotected item becomes `salvaged`, and `floor(salvageBp × recoverable inputs)` of the recipe's declared recoverable materials are returned. Enhancement costs are never refunded. No craft, enhance or salvage cycle may be net-positive (S3-E06).

## 6. Production queue (R04.15; D-07; O10)
- **Timed recipes:** bars and components, for example 2 logs → 1 plank, 2 copper ore → 1 copper bar.
- **Jobs:** `job:<n>`, holding a recipe, a quantity, the enqueue time and a state (queued, active, paused-shortage, complete, cancelled). Jobs are processed by characters assigned `smithing`. A smith works one unit of one job at a time; a job is worked by at most one smith at a time.
- **The scheduling pass** runs at the new-work stage, whenever a job is enqueued, a unit completes, a deposit arrives, a smith becomes available, a job is cancelled, or a session starts.
  - Idle smiths, in acquisition order, scan the jobs in FIFO order (enqueue time, then job ID).
  - A job whose next unit's inputs are available in `available` reserves exactly one unit (one transaction moving the inputs to `reserved`) and starts.
  - A job whose inputs are short becomes `paused-shortage` and keeps its FIFO position. The scan continues with later jobs.
- **Competing jobs:** because the scan is FIFO, the earliest eligible job always reserves first. A later job can use an input only after earlier eligible jobs have taken theirs in the same pass. A paused job does not block later jobs that need other inputs.
- **Unit time** = `recipe.unitMs × 10000 / (10000 + smith efficiency)`, rounded up. It is captured at unit start; later level-ups or equipment changes affect only later units.
- **Completion** is one transaction: the reserved inputs are consumed and the outputs credited to `available`. Then Smithing EXP. A job reaching its quantity becomes complete. A scheduling pass follows at the same moment.
- **Cancellation** (a policy command) releases the in-progress unit's reservation (one transaction) and marks the job cancelled. That unit's completion event goes stale.
- **Same moment:** a unit completing at *t* completes before a cancellation at *t* (completion precedes commands), so its outputs are kept. A unit started at *t* before the command is released by it. A deposit at *t* precedes a job start at *t*.
- **Reassigning a smith mid-unit** releases the unit's reservation; the job returns to queued. **A session end** releases every in-progress unit; work resumes at the next session start. There is no offline progress.
- **Diagnostic alternatives** (experiment arms only):
  - `reserve-all`: a job reserves every remaining unit's inputs before starting;
  - `round-robin`: an integer approximation of proportional sharing, where eligible jobs take turns unit by unit.

## 7. Invariants (owner §7; checked by the S3 monitor in every run)
- **Equipment:**
  - one location per instance;
  - never equipped by two characters;
  - never equipped and salvaged, never consumed twice;
  - never created by a failed or cancelled craft;
  - never consumed or salvaged while equipped or protected.
- **Ledger:**
  - balances never negative;
  - every transaction categorised;
  - per resource, the change equals declared sources (kill rewards, gathering, production outputs, salvage) minus declared sinks (legion spending, crafting, enhancement, production inputs);
  - reservations only move between buckets.
- **Reservations:** the reserved balance equals the inputs of in-progress units exactly. No reservation is abandoned or permanently locked, and reserved materials are never used for unrelated purchases.
- **Production and EXP:** no duplicate completion, no duplicate profession EXP, no stale reward after a cancellation.
- **Assignments:** no production from reserve, undiscovered or ineligible nodes; no double production during transitions.

## 8. Effective damage (direction H)
- **Raw damage** is unchanged (historical comparisons).
- **Effective damage:**
  - in every batch where the enemy survives, every blow counts in full;
  - in the lethal batch, the enemy's remaining HP is shared among that batch's blows in proportion to their damage. This rule is order-independent and favours no entity.
  - Per kill, the effective contributions sum exactly to the HP removed.
  - **Overkill** = raw − effective.
- **Reported per character**, and split into hero swing, hero ability and recruit contributions.

## 9. Policies and observation (owner §10)
- **The observation adds** what the town menus show:
  - profession levels and efficiencies;
  - discovered nodes with their requirements and displayed gathering rates;
  - inventory items and loadouts;
  - recipes with input availability and Smithing requirements;
  - the queue with job states and shortage reasons;
  - displayed production estimates.

  Never hidden state.
- **Realistic POL3 policies** extend POL2 with a fixed investment strategy:
  - combat-and-recruitment-first;
  - equipment-first;
  - profession-and-tools-first;
  - balanced;
  - earlier-zone material farming;
  - conquest-focused.

  They follow fixed, declared build orders and allocation rules and only issue eligible commands.
- **ORC3-SEARCH** extends the bounded hindsight search with these strategies as candidates. It is labelled hindsight and never called an upper bound.
- **Time categories:** automated combat, manual combat, gathering, travelling, resting, waiting (dead, spawn, or resources), idle, and offline, plus crafting decisions (instant commands, counted, not timed). No category is "player input".

## 10. Experiments (pre-registered in `manifests/s3/PREREGISTRATION.md`)
- **The M0 families:** S3-E01 … E08.
- **Owner directions A–H:** S3-E09 … E12 (A–D and H together, E, F, G).
- **Order (owner §8):**
  1. correctness;
  2. tiers and enhancement;
  3. first useful craft;
  4. combat against industry;
  5. hero damage;
  6. pacing;
  7. knockouts;
  8. combined configurations.
- Engineering gates are separate from candidate balance targets. No target moves after results.
