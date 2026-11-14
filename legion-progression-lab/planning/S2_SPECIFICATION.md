# S2 specification — from a single hero to a legion

**Version 1.0, 2026-11-13.** Written before S2 implementation (owner "S1.1 Acceptance and S2 Authorisation" §6). **S2.1 amendments** (worker access requires a visited zone, reserve swaps outside encounters, ability-aware worker classification) are in `spec/formulas/s2-legion.md` v1.1 and `S2_OWNER_RESOLUTIONS.md` v1.0.

**Sources:**
- **Approved rules:** Decision Register R01.07–08, R02.03–04, R02.10–11, R03.01–18, R06.07, R07.09–10, R10.04–05.
- **M0 resolutions:** D-03 (knockouts), D-04 (squad rewards), D-05 (class mastery), D-06 (rare heroes and roster), R-A4, R-A5.
- **Bible:** §4–5.
- **Experiment plan:** S2.
- **Owner resolutions:** S1, and S1.1 (`S1_1_OWNER_RESOLUTIONS.md`).
- **Where those are silent:** the candidate rules S2-R01 … are in `S2_RESOLUTIONS.md`.

**Labels:** every number is a candidate, in `content/w1-slice-s2.candidate.v0.2.0.json`.

**Out of scope (owner §6):**
- gathering, Smithing and equipment;
- Monuments, Bestiary and Feats;
- class-derived permanent account bonuses (before S4);
- research and the Legion Mastery Tree;
- offline progression;
- advanced classes;
- full World 1 content and final bosses;
- monetisation;
- Roblox and the dashboard.

## 1. Engine and controls
- **New engine.** S2 adds a multi-character engine (`src/engine/legion.ts`). It generalises the S1.1 stepper; the S1.1 engine stays unchanged and reproducible.
- **Control A0 (engineering gate).** The S2 engine, run with the hero alone, classless, with every S2 feature off, must reproduce the S1.1 base metric summaries exactly (same seeds).
- **Event ordering, stale events, sessions and the death window:** S1.1 rules (`s1-combat-loop.md` v1.1), applied per character.
- **Ledger.** S2 experiments use the L1 persistent ledger once the L1 gates pass. A sample is re-run on the reference ledger to show the results are unchanged.

## 2. Characters (stable identities)
- **Identities:**
  - `hero`;
  - ordinary recruits `rec:1`, `rec:2`, … in acquisition order, never reused;
  - rare heroes `rare:<key>`, unique per account.
- **Each character has:**
  - combat level and EXP;
  - HP;
  - class (`none`, `warrior`, `archer`, `mage`);
  - mastery EXP per class;
  - a talent allocation per class;
  - its own hit/crit random streams;
  - an assignment.
- **Base attributes per level:** the S1 hero values. A recruit starts at level 1, classless (R03.06).
- **Rare heroes (prepared, no content):**
  - granted once per account (a duplicate grant gives an upgrade material instead, R03.16);
  - they share the productive slots; extra ones wait in reserve (D-06);
  - acquiring one never adds a productive slot.

## 3. Roster, slots, deployment, reserve
- **First recruit.** Quest Q1, "defeat N enemies in zone 1" (candidate N = 40), grants `rec:1` free, unlocks productive slot 1 and sets the deploy cap to 1 (R03.03, target 2–5 min).
- **Further slots:** slot 2 at zone 2 access, slot 3 at zone 3 access (R03.04, candidate milestones).
- **Purchasing recruits.** A recruit is bought with gold (candidates: 150 for the 2nd, 400 for the 3rd), one atomic ledger transaction `recruit:<n>`.
- **Deploy cap** (recruits in the hero's squad; the hero is not counted): 1 after Q1, 2 at zone 2 access, 3 at zone 3 access (R10.05).
- **Assignments.** Exactly one per character at a time (R07.09):
  - `squad` (deployed with the hero);
  - `worker:<zone>` (independent numerical combat worker);
  - `idle` (productive but unassigned);
  - `reserve` (non-productive; keeps levels and mastery; produces nothing).

  Changes are free (R07.10).
- **Assignment changes** are validated, exclusive and atomic:
  - the old assignment's scheduled work is cancelled by a per-character epoch;
  - one character can never be in a squad and a worker stream at the same time;
  - a transition can never produce twice.

## 4. Classes, mastery, records, talents
- **Classes:** Warrior, Archer, Mage (R03.01). The class modifiers to HP, defence, attack, attack interval and crit are candidates.
  - **The hero** may choose a class from level 5 (R03.02; candidate).
  - **Recruits** may choose one at any time (R03.06).
  - The first choice is free; each later change costs gold (candidate 100, R03.09).
- **A class change preserves:** the combat level, EXP and HP fraction.
- **Mastery (D-05):** each character keeps mastery EXP per class. Only the class the character currently holds gains mastery, by the same amount as the combat EXP it earns.
  - **Switching class:** never grants, copies or carries mastery between classes.
  - **Switching back:** restores that class's mastery and talents.
- **Class records (R05.16, R-A5):**
  - per character: the mastery level per class, which never decreases;
  - per account and class: the highest mastery level any owned character has ever reached.
  - Records are **tracked, not applied** in S2 (owner §8). No class-derived account bonus exists before S4.
- **Talents (R03.10–11):** 1 point per combat level above 1, allocated separately for each class, two candidate talents per class.
  - **Respec** is free with a cooldown (candidate 60 s) and resets the current class's allocation only.
  - Allocation, respec and class change are atomic and refused while the character is in combat.

## 5. Abilities
- **One candidate ability per class:**
  - Warrior, Cleave: 200% of attack, 8 s cooldown;
  - Archer, Power Shot: 250%, 6 s;
  - Mage, Fireball: 400% (+5% per Arcana point), 10 s.
- **Recruits** cast automatically on cooldown while engaged (R02.11).
- **The hero's ability is manual** (R01.03, R02.10). It is cast only by a policy command, and only realistic policies modelling an attentive player use it.
- **Each cast** consumes one hit draw and one crit draw from the caster's streams, like a swing, and has its own persistent cooldown.

## 6. Squad combat
- **Engagement.** The squad (hero plus deployed, non-knocked-out recruits) engages one enemy at a time, as the S1 hero does: same walk and engage rules, same spawn slots.
- **Attacks.** Every member attacks on its own interval. All blows at one `(t, pass)` resolve simultaneously from the state at the start of the batch (S1 §4).
- **Enemy targeting (candidate):** the enemy attacks one living member, chosen by threat order:
  1. Warriors, in acquisition order;
  2. then the hero;
  3. then the others, in acquisition order.
- **Knockout (D-03, option A):**
  - **A recruit at 0 HP** is knocked out: it stops attacking, cannot be targeted, and is ineligible for later credits.
  - **Recovery:** full HP 20 s after the knockout (candidate). If the squad is in an encounter at that moment, recovery happens when that encounter ends. Recovery is immediate when the hero respawns. No injury, no resource loss.
  - **Hero death** follows S1.1 rules; on respawn the whole squad is restored.
- **Deployment changes:**
  - **Leaving** the squad takes effect at once: the member's pending blows go stale.
  - **Joining** takes effect from the next engagement.

## 7. Independent combat workers (R-A4, D-04)
- **Its own fight stream.** A worker assigned to an accessible zone fights a numerical stream of that zone's enemies, one at a time. It does not compete for the squad's physical spawns.
- **Its own identities and streams:**
  - encounter IDs `w:<character>:<n>`;
  - hit, crit and loot random streams of its own.
- **Fight rules:** the same as squad fights. The next fight starts after the engage overhead.
- **Knockout:**
  - a knocked-out worker recovers after 30 s (candidate);
  - 3 knockouts within 5 minutes stop the worker, with a stated reason; the character becomes idle (D-03 analogue).
- **Credits:** each worker kill is credited once:
  - EXP and mastery to the worker only;
  - gold and loot to the account;
  - the zone kill counter (R06.07);
  - quest progress.
- **Sessions:** workers stop at a session end (no offline in S2) and resume at the next session start.

## 7a. Time categories (owner S1.1 §3)
Each run reports separately:
- automation on (the hero auto-farming);
- manual combat (the hero walking or fighting with automation off);
- resting;
- travelling;
- waiting (dead, or waiting for a spawn);
- idle;
- connected time (their sum);
- elapsed calendar time.

No category is called "active player input".

## 8. Reward invariants (owner §7; mandatory, tested)
For a squad kill:
1. Gold and loot are awarded once. The account loot stream is consumed once per credited kill, whatever the squad size.
2. The zone kill counter and quest progress advance once.
3. The encounter identity is consumed once (the S1.1 credit registry).
4. **Every eligible character receives the enemy's full EXP**; it is never divided.
   - **Eligible:** deployed and present at the encounter's start, and not knocked out before the killing batch. A member knocked out in the killing batch itself is eligible, because simultaneous blows land.
   - **Not eligible:** reserve, idle, worker or knocked-out characters.
5. Account rewards never multiply with squad size.
6. Each awarded character's EXP, level-ups, mastery and the account resources form **one atomic credit operation**.
7. A duplicate, conflicting or unknown claim changes no character, balance, counter, random stream or unlock.
8. A failed credit leaves no partial change.

Worker kills satisfy 1–3 and 5–8 with their own identities, and 4 for the worker alone.

## 9. Estimators (owner §11)
- **Workers:** estimator v1.2, applied to the worker's own stats and timings: the same exact chain and reliability rules, with recovery in place of respawn.
- **Squads:** a new, labelled-approximate squad estimator.
  - **Method:** expected squad damage per second; the expected number of swings to kill; enemy damage to the threat target; knockout risk.
  - **Every estimate exposes its assumptions:**
    - continuous farming;
    - no knockout cascade after the first;
    - first-swing timing;
    - no resting.
  - **Impossible and unsafe assignments** are reported as in v1.2, and unresolved computation is distinguished from impossibility.
- **Predicted against realised production** is tested (S2-E10). Estimates are never called results.

## 10. Policies
- **Realistic S2 policies** see only what the player sees:
  - own roster, levels, classes and HP;
  - zone flags;
  - quest progress;
  - gold;
  - displayed estimates and their reliability.

  They decide purchases, class choices (a fixed composition per policy), talent allocation (a fixed priority per class), deployment, worker assignment and zone choice, using the S1.1 recovery rules. Per S1.1-R01, a zone block also lifts when the squad's capability improves: a level-up, a new member or a class change.
- **The single-hero S1.1 policies** remain as controls.
- **Bounded hindsight search, `ORC2-SEARCH`:**
  - **Decision points:** session start, level-ups, gate completions and recruit purchases.
  - **At each one** it forks the exact state (future random draws included, which is hindsight) and evaluates a fixed candidate set:
    - the realistic policies;
    - deploy-all versus workers;
    - each accessible zone.
  - **Each candidate** runs for a bounded horizon. The search is limited by explicit fork and simulated-time budgets.
  - **It picks the best candidate** for one declared objective: hero EXP, total legion EXP, gold, or conquest.
  - **It reports the best feasible outcome found,** never an upper bound. Branch isolation is tested.

## 11. What S2 measures (pre-registered in `manifests/s2/PREREGISTRATION.md`)
S2-E01 … E08 from the experiment plan, plus:
- S2-E00, the A0 control;
- S2-E09, hindsight search against realistic policies;
- S2-E10, the squad estimator against realisation.
