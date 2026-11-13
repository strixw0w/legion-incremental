# LEGION INCREMENTAL
## Game Design Bible · v1.0 · Foundational design baseline

**Studio:** Zero Hour Studios | **Platform:** Roblox | **Date:** 13 November 2026  
**Status:** 183 foundational decisions approved; detailed content, coefficients and implementation readiness pending.  
**Owner:** Studio founders. **Implementation:** Claude, working in gated increments. **Review:** independent design/technical review with ChatGPT and human playtesting.

> Start as one warrior. Build a legion. Conquer worlds. Grow stronger even while you're away.

## 0. How to use this document

This is the design baseline, not a claim that the game has been built or validated. It consolidates the ten completed questionnaire rounds. The companion `DECISION_REGISTER.md` maps every approved choice to its original round and question. If an approved decision conflicts with an older illustration, the approved decision wins. Later explicit scope decisions narrow earlier long-term ambitions. If this Bible introduces an implementation detail not selected in the questionnaire, treat it as a proposal or engineering requirement, not a new approved gameplay rule. Do not silently change approved design; record the trade-off and obtain owner approval. Maintain a change log with decision ID, rationale, evidence, migration impact and version.

**Status conventions:** LOCKED = explicitly selected; TARGET = selected design objective or provisional timing/quantity, subject to balancing; PROPOSED = candidate content/implementation detail not yet approved; OPEN = requires decision or empirical evidence. Exact formulas, item tables, unlock thresholds, reward amounts, pricing, art assets and performance budgets are not yet production-approved. Research was inspiration from IdleOn and Roblox experiences; community calculator formulas are not live-game verified. No exact IdleOn data or proprietary game assets are required for Legion. Earlier illustrative numerical tables are not canonical content definitions.

**Authority order:** approved decision register + explicit later owner decisions → Bible interpretation and scope → approved formula/content spec → tested implementation. When ambiguity exists, flag it rather than inventing a requirement. No feature should be advertised as complete before acceptance tests and playtesting.

## 1. Vision and design pillars

Legion Incremental is a third-person 3D open-world incremental RPG in which the player controls a main hero fighting alongside a persistent roster of individually developing recruits. Recruits are characters, not disposable pets. The player grows through combat, equipment, professions, permanent account systems, class development and increasingly sophisticated assignments. All these systems feed one another. A compact, visually readable fantasy world makes the growth tangible. The long-term fantasy is a specialised legion conquering worlds, not an empire city-builder or a traditional MMO raid game.

**Audience and experience:** Mobile-first Roblox players; easy first-session comprehension, with substantial optional depth for incremental optimisers. Desktop players receive equivalent gameplay. Visually colourful, stylised low-poly medieval fantasy with recognisable Roblox characters and chunky gear, evolving toward magical and cosmic settings. Broad age accessibility; avoid coercive monetisation and unnecessary attention demands.

**Pillars:**
- Visible, frequent early progress: first enemy defeated within 30 seconds; first recruit 2–5 minutes; first new zone roughly 5–10 minutes.
- Persistent investment: no mandatory rebirth, loss of levels or world resets. Earlier characters, equipment and resources retain usefulness.
- Accessible combat, deep build choices: automatic basic attacks, manual hero abilities, squad composition and bosses with readable mechanics.
- Parallel economy: one job per character; meaningful resource allocation; offline gains augment rather than replace active conquest.
- Interconnected incremental systems: account-wide rewards, controlled feedback loops, independently balanced progression layers.
- Fairness and respect for time: free core automation, no paid productive roster slots, no destructive login streaks, no progression-critical RNG gates.
- Data-driven design: simulation, playable tests, measured retention and deliberate iteration; no guaranteed commercial success.

**Non-goals at launch:** open-world PvP, trading, guilds, paid random items or paid luck, additional worlds, advanced classes, enchanting, complex raids, giant simultaneously rendered armies, mandatory resets. Future features remain subject to review; not promises of delivery dates.

## 2. Core loop and player journey

Primary loop: enter accessible combat zone → hero and deployed recruits attack → earn personal gold, EXP, drops and conquest credit → improve gear/talents/Monuments → recruit and specialise members → allocate workers to obtain resources → conquer gates and bosses → unlock opportunities → repeat. Parallel loop: choose assignment → produce materials/EXP → reserve components in crafting queue → craft/equip → increase productive capacity. Return loop: offline assignments advance → rewards deposited and summarised → spend materials/level talents → clear active gate → improve assignments before leaving.

**One activity at a time:** Each hero/recruit occupies exactly one productive assignment. Deployed members participate with the hero; independent combat workers farm separately. A unit cannot also mine, smith or generate other rewards at the same time. Idle or unassigned is valid. Changing assignment settles the prior interval and begins a new one; no double credit. This is a required invariant, not a UI preference.

### First-session target sequence (not a fixed tutorial script)
| Elapsed | Experience | Success criterion |
|---|---|---|
| 0–30s | Spawn near starter enemies with basic weapon; basic auto-attack and movement | First kill and clear reward feedback |
| 30s–2m | First level, simple quest and starter progression | Player understands EXP/gold and next objective |
| 2–5m | Short recruitment/rescue quest | First recruit visibly fights; offline feature introduced and eligible |
| 5–10m | Complete first kill gate | Enter next zone without a complex menu |
| 10–15m | Choose hero class, first ability and talent points | Understand difference between classes |
| 15–25m | Sequential mining, woodcutting and smithing quests; unlock worker assignment | First useful crafted item and production plan |
| 25–30m | First Monument, Bestiary/Feats feedback, return plan | Understand permanent progress and offline gains |
| 30–60m | Prototype miniboss/early conquest milestone | Understand why further upgrades matter |

Exact sequence of class choice and crafting is provisional. Offline unlock is early, not delayed until the last tutorial step; the final recap reinforces it. Provide skip/recovery for returning or experienced players, contextual guidance rather than long exposition, and an always-visible next objective. Tutorial state must persist safely.

## 3. Scope and release boundaries

| Feature | Vertical slice | Full World 1 launch | Later |
|---|---|---|---|
| Zones | Town + 3 combat zones | 10 incl final boss region; optional gathering/secret areas | New 10-zone worlds |
| Bosses | 1 prototype miniboss | 2 major minibosses + final boss; Normal and Elite variants | Nightmare variants |
| Roster | Hero + 2 recruits | Hero + 6 recruits; deploy 1→3 | 20–50 total recruits; deploy up to 6 |
| Classes | 3 base, 1 skill/class initially | Complete Warrior, Archer, Mage; up to 3 hero equipped abilities unlocked | 6 branch classes and later advancements |
| Rare heroes | Not required for initial slice | 3 named unique sidegrades | More heroes |
| Professions | Mining, woodcutting, basic smithing | All 3 fully integrated | Research, later other professions |
| Gear | Starter and basic tiers | 6 core material tiers | Enchanting, new materials, later ascension |
| Permanent systems | 3 Monuments proposed | Monuments, Bestiary, passive Feats | Research and Legion Mastery Tree (W2 candidate) |
| Automation | Jobs and basic offline | Full eligible jobs, presets, estimates, offline cap & summaries | Research jobs and additional automation |
| Social | Not required in first slice | 4-player parties, co-op bosses, leaderboards | Guilds, optional balanced PvP/trading investigation |
| Retention | First session + return | Daily/weekly orders, catch-up guidance | Expanded live events/seasonal content |
| Monetisation | None needed for validation | Tested deterministic passes/products, direct cosmetics | Additional cosmetics and balanced products |
| Engineering | Saving and server authority early | Security, performance, analytics, deployment readiness | Scaling/migrations |

**Launch-target reconciliation (approval requested for unresolved details):** Six recruits is the total playable recruit capacity in World 1, excluding hero; recommendation is that rare heroes occupy the same six slots, not extra productive slots. Three unique heroes are discoverable at launch but this must not force ordinary units to be deleted. Proposed approach: unlocked rare heroes enter a nonproductive reserve/collection, with elective activation or swapping into existing roster capacity and preserved progress; define reserve accounting and whether ordinary recruits can be swapped before implementation. No production from reserve. If owner intends six ordinary recruits plus three additional heroes, revise economic targets explicitly. World 1 three deployed recruits overrides the earlier long-term six cap. Normal/Elite at launch overrides prior long-term three difficulties. Advanced classes are not playable until a later update; class challenge mechanics may be prototyped but not a launch content requirement. Research and Mastery Tree are intentionally absent from launch calculations except as disabled hooks. World 1 final boss unlocks completion and World 2 preview, not a playable unavailable world. World 1 endgame must provide meaningful mastery, Elite runs, equipment and collection goals while W2 is developed.

## 4. Combat specification

### Controls and actors
Hero controlled in third person, movement freely available while attacking. Basic attacks auto-target nearby eligible monsters; player can set a manual priority target. Use mobile-friendly target indicators and clear cancellation/manual override. Auto-farm is optional within a selected unlocked zone; it must respect boundaries and never automatically clear a major gate. Deployed squad follows the hero and uses abilities automatically on cooldown. Individual recruits have their own stats, equipment, levels, class, talents and profession skill levels. Hero and squad should each meaningfully contribute; exact relative contribution depends on build, not a fixed percentage.

**Proposed targeting implementation:** sticky target until defeated, invalid or outside leash; priority target supersedes nearest selection; units retain class-specific engagement distance. Retarget predictably. No repeated retarget spam, pathfinding across entire map or automatic movement outside selected zone. Use pooled actors and client presentation for visual effects, authoritative server combat decisions. Define aggro, range, attack cadence, line-of-sight, enemy leash and stuck recovery through tests before production. Manual movement overrides automated motion immediately. Basic attack targeting is not mandatory clicking.

### Stats and effects
Damage, HP, defence and accuracy are core; introduce accuracy gradually with high hit rates at start. Critical chance can approach 100%; separate scalable critical damage. Attack speed and cooldowns are separately bounded for performance and balance. Up to three equipped manual hero abilities; recruit skills use automatic cooldown logic. No super-crit tiers at launch. Each class needs a distinct use case in general farming, durable encounters and boss fights; exact abilities and talent tables are open. Healing/support may exist but no required separate healer class at launch. Defence uses controlled mitigation and a damage floor, never arbitrary invulnerability; enemy requirements visibly explain poor accuracy.

### Enemy lifecycle and reward rules
Many small monsters populate shared zones; they retaliate when engaged rather than automatically attacking everyone entering. One primary monster species per normal zone, with occasional variants and rare elites. Normal on-tier early enemies target 2–5 seconds to kill; harder ordinary enemies 5–15 seconds. Overgeared earlier mobs should become trivially easy, even one-hit, without breaking spawn/reward ceilings. Bosses are distinct and not subject to normal TTK targets. At death award eligible personal contribution rewards, never final-hit-only rewards. Gold, combat EXP, monster-specific materials and rare drops are standard. Deployed eligible characters each receive their full personal EXP award (not a divided shared pool); account gold/loot is granted once per eligible account kill, not once per recruit. Independent combat workers each generate their own eligible encounters. Define contribution based on meaningful participation, including support where appropriate; avoid excluding beginners if a powerful player finishes an enemy quickly. Exact thresholds and anti-carry policy are open; test damage tagging, overkill, party farming, contribution windows, simultaneous kills, disconnects and AFK accounts. Do not let mere presence multiply loot.

**Death:** respawn at checkpoint, no XP/resource loss. Boss failure returns to entrance, resets encounter, free retry. Ordinary combat failure should stop or safely recover auto-farm; offline combat must model survivability, not immortal farming. Recruits' HP, defeat/recovery and target aggro are unresolved; initial proposal: recruited fighters can be temporarily knocked out of the encounter and recover at safe checkpoint, with no permanent injury or resource loss. Boss telegraphs must be visible on mobile, avoid unavoidable damage and permit meaningful movement/abilities.

### Bosses and multiplayer
Personal instances, optional party co-op (up to 4 total players, own squads); scale appropriately by participating players and test against carrying/alt accounts. First eligible clear grants unique conquest unlock and milestone reward; repeats provide boss drops balanced against clear time; no daily keys or entry fees. Normal and Elite launch, Nightmare later. Boss-specific rewards cannot be farmed by offline ordinary assignments. Normal gate clear must be recorded transactionally. Boss patterns should combine readable telegraphs, movement, summons or phase changes and stat progression. Co-op scaling is not a guarantee of difficulty equivalence; simulate and test both solo and parties.

## 5. Characters, recruitment and class development

Main hero and ordinary recruits begin classless. Main hero chooses a class after early progression. Ordinary recruits can be assigned any of three base classes. First recruit earned via short quest; subsequent recruit slots unlocked by progress and recruits bought with earned resources. Target six total recruit slots by W1 completion. Start deployed one, increase to three W1, six long-term. No paid slots. Hero not counted as deployed recruit. Acquisition and deployment progression are separate gates.

| Class | Intended role (candidate details) | Proposed future branches | Proposed profession affinity |
|---|---|---|---|
| Warrior | Melee, HP, defence | Berserker / Guardian | Mining |
| Archer | Range, attack speed, accuracy, crit | Marksman / Ranger | Hunting (future); select launch affinity before balance |
| Mage | Area damage, magic, support | Elementalist / Cleric | Woodcutting |

Names and affinities beyond base classes are proposals. All characters can train every profession; affinity is an advantage, not a restriction. Avoid dead-end specialisations. Initial talent structure: earn points per character combat level, allocate class-specific talents, free town respec with short cooldown. Earned-resource class change at trainer preserves overall character level. Require level milestone + class challenge for advanced branches when available. Maintain distinct per-class training/mastery progress so switching at high level doesn't instantly earn class bonuses. Talent allocation, class change and gear compatibility must be atomic and not permit double spending. Preserving prior class talent builds is a proposed convenience; exact respec cooldown/cost and class mastery earned-EXP formula remain open.

**Rare heroes:** three named at launch, unique traits and abilities, distinct acquisition paths (rare drop, quest/boss/hidden discovery). Proposed candidates, not locked: a Guardian-like protective warrior, an elite ranged hunter, an area-control mage. They should not be superior in every stat; sidegrades with meaningful use cases. No summons banners or paid luck. Unique once per account; repeat eligible reward gives material instead. Determine guaranteed acquisition paths for any progression-critical hero reward, and choose collection/reserve mechanics before build. No need to obtain every hero to clear World 1. Track duplicate conversion and unique grants transactionally.

**Class-wide benefits:** highest qualifying historical mastery record per class gives a permanent bonus earned by genuinely training that class, plus roster milestones. Do not add every duplicate character's same class bonus. Track record per class separately from current overall level; respec or class switch cannot multiply previously granted rewards. Permanent record remains after switching. Bulk auto-equip, filters, named loadouts and assignments preserve customisation. Compare items by selected objective; don't consume or unequip protected gear without explicit consent.

## 6. Professions, equipment and crafting

Three starting professions: Mining, Woodcutting and Smithing. Each character has individual levels and relevant tools. Hero and recruits can gather; interact once at physical node to auto-gather, move away to stop. Workers assigned to specific discovered nodes or production jobs, using unlimited personal resource availability on shared physical nodes. No player competition over finite ore/tree respawns. Numerical simulation may replace distant workers, but the physical locations must be meaningful. Progression through level, efficiency, speed and yield; higher efficiency can generate multiple resources per action. Gate resources by skill/tool requirements or low efficiency thresholds to be tested. Avoid a pure endless-linear output curve; use controlled rates and caps where appropriate.

**Storage:** one account-wide inventory for stackable gold/materials; equipment has unique instance ownership/equipped assignment. Automatic deposits while online and offline. No separate worker bag collection. Quantities and reserve balances must never go negative. Show available, reserved and total where relevant. Each item is equipped by one character at a time; transfer within roster freely. Class-incompatible weapons cannot be equipped. Use integer quantities with explicit precision and inventory capacity policy. Do not impose tedious inventory restrictions without design approval.

**Equipment:** six launch core tiers Wood, Copper, Iron, Steel, Gold, Mithril. Class-specific weapons, shared armour designs: weapon, helmet, chestplate, leggings, boots, accessory and relevant profession tools. Unlock accessories/tools contextually. Armor shared design does not mean one item equipped by all units. Fixed base stats, optional bonus traits; enchanting selectable bonuses and optional rare rolls later. Most gear crafted; occasional rare equipment from monsters/bosses. Tier upgrade should feel substantial; guaranteed smaller enhancements with escalating costs. Higher-tier recipes may consume earlier equipment; player may alternatively pass old gear to another recruit or recycle. Preview consumption, lock equipped/favourite items from automatic consumption, and confirm expensive conversions. Exact inheritance of enhancements, salvage return and gear binding rules are open; prevent upgrade/recycle loops producing net materials. No failure/destruction chance.

**Production:** mining ores/gems → bars; woodcutting timber/fibres → refined components; combat drops → crafting requirements. Smithing level unlocks recipes. Equipment crafting instant when prerequisites and ingredients met. Components and bars may be timed jobs. Queue recipe and quantity, reserve available inputs; pause if shortage, display cause, resume deterministically once supplies exist. Reservation policy must clarify partial availability and priority between jobs. No unapproved automatic spending of gold or equipment. Proposed deterministic FIFO job priority (stable tie-break by ID) for contested materials, unless owner chooses other priority. Cancel returns unused reservations, never already-consumed inputs. No simultaneous generation and consumption exploit. Smithing EXP awarded for actual successful production, not cancellations. Direct gear crafting and component job assignment must not create double profession credit. Earlier materials remain demanded by later recipes and monuments. Avoid too many redundant currencies.

## 7. Permanent progression

### Ancient Monuments (launch)
Unlock through quests, zone milestones and rare drops. Each has level, gold cost, additive/milestone bonus and material-gated milestones. Gold for routine levels, specific materials for major milestones. Soft caps and expandable tiers/ascension, no level reset. Candidate launch monuments: Power (damage), Vitality (HP), Protection (defence), Precision (accuracy), Industry (gathering), Fortune (drop luck). Slice: three monuments (choose exact ones in content spec). Main unlocks must have guaranteed paths; rare discovery may offer optional monuments or alternate acquisition. Upgrade screen shows current bonus, next bonus, exact cost and Buy Max respecting milestone/material requirements. No free overflow across a milestone. Ascension behavior is later content, not an implicit World 1 multiplier.

### Bestiary (launch)
Track each monster's lifetime eligible kills and rare emblem collection. Guaranteed mastery kill milestones and RNG emblems provide individual passive account bonuses; regional completion/mastery grants extra passive rewards. All unlocked bonuses active; no card equipping per character. Eligible assigned online/offline kills count under same rules; contribution must not duplicate account kill credit. Earlier monster farming remains useful. Candidate ranks Bronze/Silver/Gold/Diamond/Mythic/Celestial; launch count, thresholds and reward pools open. Avoid hundreds of separate independent damage multipliers; group bonuses into explicit pools. Rare variants may share base credit plus variant-specific collection only if defined. Do not require luck to clear gates.

### Legion Feats (launch)
Lifetime achievements across kills, gathering, character training, crafting and conquest. Permanent stats, titles and milestone rewards automatically unlocked, with consolidated notifications. Count eligible online/offline actions once. No repeated claim/regrant on login. Optional summaries. Feats and Bestiary distinct sources; overlap intentional but test scaling.

### Research Laboratory (World 2 candidate)
Assign recruits to generate research points; four branches Military, Industrial, Legion, Arcane. Choose upgrades after meeting prerequisites, not random discovery. Costs and benefits may reference materials and earlier systems. Controlled feedback: e.g., research improves Monument affordability while monuments may improve research output, with bounded influence and sensitivity testing. Research production uses same assignment exclusivity and offline engine. Launch has no usable research points/upgrades. Exact unlock and formula later.

### Legion Mastery Tree (World 2 candidate)
Points earned from world bosses, major quests, mastery milestones and Feats (one-time awards, not infinite points per repeated kill). Choose order, eventually unlock every branch. Combat/economy/recruitment/professions/automation branches are candidate themes. If points earned before system release, recommended either persist explicit entitlement milestones or grant retrospectively once on unlock; decide before shipping. Not an active launch UI or unapproved currency sink.

**Global bonus rules:** applicable bonuses affect all current and future recruits including workers; no repeated per-unit unlock fee. Major independent multiplier categories deliberate and limited, repeatables usually additive or diminishing. Explicit stat contribution sources and order. Inspect every new cross-system link for positive feedback and economic dominance.

## 8. Worlds, zones and content roadmap

**Locked:** colourful medieval-to-magical fantasy; compact connected zones within a world, portals between worlds; ten combat zones including final boss region; account-wide unlocks; kill thresholds with occasional miniboss gates; workers contribute eligible kills but hero visits/completes major gates; optional gathering locations, caves and elite encounters; one primary species per ordinary zone plus variants; two major minibosses and a world boss; free travel to discovered checkpoints/towns. World 1 is The Verdant Kingdom; launch W1 only with W2 preview. First new zone target 5–10m; Normal World 1 completion target 4–8 active hours across sessions. Offline progress may change calendar time; record both active and elapsed time in experiments. This is a target for selected representative free-play profiles, not a guaranteed speed for every strategy.

### World 1 candidate content map

| Zone | Candidate name | Primary enemy | Role / gate | Candidate resource |
|---|---|---|---|---|
| 1 | Slime Meadow | Green Slime | Basic combat, first recruit, first kill gate | Slime Gel |
| 2 | Wolfwood Forest | Wolf | Gear and crafting introduction | Wolf Fang |
| 3 | Goblin Encampment | Goblin | Recruitment and slice boundary | Goblin Scrap |
| 4 | Bandit Outskirts | Bandit | Introduce accuracy | Bandit Cloth |
| 5 | Bandit Stronghold | Elite Bandit | First major miniboss gate | Bandit Insignia |
| 6 | Murkwater Swamp | Swamp Beast | Defence and survivability | Swamp Hide |
| 7 | Haunted Woods | Skeleton | Rare hero discovery and collection | Bone Shard |
| 8 | Forgotten Ruins | Stone Golem | Second major miniboss gate | Rune Fragment |
| 9 | Fallen Citadel | Corrupted Knight | Final preparation and conquest | Corrupted Steel |
| 10 | Throne of the Fallen | Fallen King | Normal world clear and next-world preview | Boss Crown Fragment |

Except the world theme, zone count and gate structure, names, species, resources and placement of specific mechanics are candidates. No placeholder HP/EXP/gold numbers are production-approved. The slice miniboss is a prototype in or near zone 3; it need not be a third major launch miniboss. It can be reused/relocated as zone 5 or 8 content, with the final World 1 count remaining two major minibosses. The tenth zone is the boss region, not a tenth mandatory normal monster species. Optional elite fights are not major gates.

**Town:** Legion Headquarters, starting hub with barracks (recruitment), blacksmith (recipes), trainer (classes/talents), Monument Hall, Bestiary Hall, Command Centre, shared inventory access and world portal. Buildings unlock progressively; menus become accessible contextually. Free fast travel to discovered checkpoints and towns; hero still has to visit newly accessible areas and complete gates. Exact definition of a newly unlocked vs discovered checkpoint is open: recommended separate `accessUnlocked` and `visited` flags, with active visit before assigning jobs or teleporting there. A player cannot skip active gate via co-op teleport or party join. Optional mine, lumberyard, hidden ruins and elite branches encourage exploration without forcing huge travel times. Reusable art kits and distinct silhouettes; no empty distances.

**Boss candidate:** Fallen King with melee swings, telegraphed slams, summoned minions and faster late phases. First clear once per account; Elite offers stronger or additional mechanics and new rewards, not solely a huge HP increase. Nightmare in later update. Define solo/party clear requirements, timeouts, leave/rejoin behavior, checkpoint safety, reward eligibility and scaling during M0/M1 before building. Repeat rewards must not dominate all other resource sources by default. Need a World 1 post-clear path (Elite clears, gear enhancements, Bestiary ranks, rare heroes and profession/class mastery). W2 preview should clearly say not yet playable.

### Future content concepts (not launch commitments)
| World | Candidate setting | Candidate mechanics |
|---|---|---|
| 2 | Sunken Empire: desert ruins/temples | Research, Mastery Tree, enchanting, advanced branches |
| 3 | Frostbound Peaks: ice caverns/fortresses | Construction, manufacturing, advanced automation |
| 4 | Ashen Dominion: volcanic strongholds | Further class advancements, equipment ascension |
| 5 | Celestial Realm: floating islands/cosmic monsters | Celestial systems and endgame expansion |

Every new world adds at least one substantive new progression opportunity, not just stronger enemies. Earlier worlds retain material, collection and boss value. Revisit performance and content workload before committing future systems. No release dates or world-specific exact balancing approved.

## 9. Online automation and offline simulation

**Availability:** unlock after first recruit, 2–5m target. Online automated jobs at 100% of calculated job rate. Offline starting rate 60% of equivalent online automated production, not 60% of a player manually optimising combat. First 24h normal efficiency, another 48h reduced, max 72h per offline interval. Second-window rate remains OPEN; 25% of online rate is a candidate from the prior example, not selected. Define whether upgrades affect reduced window before implementation. Upgrade normal window toward 100% through applicable Monuments and later Research/Mastery; no indefinitely >100% offline efficiency. Apply efficiency to credited productive work, not twice to both kill count and per-kill rewards. Offline level-ups occur from calculated offline EXP, so relevant production stats can change; rare drop eligibility/probability per credited kill matches ordinary online rewards. Bosses and major active gates cannot be simulated offline.

**Assignments:** hero defaults to last eligible activity when leaving, configurable offline task. Deployed squad defaults to group combat with hero at selected eligible zone; optionally assign each separately for offline. All productive units remain exclusive. Independent combat jobs require actual combat capability; use survival, attack speed, accuracy, defence, spawn throughput and target availability in rate model. Grouped combat is one encounter stream; no multiplying per-account loot by number of deployed members. Each deployed member receives personal eligible EXP. Offline hero gathering should not leave recruits ambiguously assigned; propose last eligible individual/group assignment fallback or idle, shown in preview before logout when possible. Define online auto-farm vs assigned job rates clearly. Worker progress and active gameplay can run concurrently when assignments are distinct.

**Command Centre:** freely change assignments from physical headquarters or portable interface. Display estimates per hour for relevant EXP, gold, materials, kills, chances/expected rare drops with uncertainty where relevant; show prerequisites and reason for low rate. Recommend by selected objective, not always latest zone. Saved named presets plus objective-based suggestions; apply atomically, validate assignments; no automatic spending or changes without player consent. Estimated rates are not guarantees, especially where supplies, levelling, death or RNG vary. Record last update and active/offline efficiency. UI explains which character is deployed vs independently farming vs worker vs idle. Shared storage auto-deposit, no claim button per unit.

**Settlement semantics (proposed engineering contract):**
1. Validate authoritative profile, ownership/session fence and last settled timestamp. Determine elapsed time from server time; clamp negative/time discontinuities and max offline window. Do not trust client time or claimed rates.
2. Use saved assignments and content version, with documented migration policy. Integrate all jobs on the same chronological timeline, so resource generation, reservations, shortages, level changes and milestone effects resolve consistently. Use deterministic event boundaries at rate changes, window boundaries, level-ups, input exhaustion, job completions and relevant bonus changes; avoid a per-attack loop for long intervals. Define deterministic tie order and bound compute. Persist fractional production carry if needed; no reward rounding exploit from frequent rejoining.
3. Credit only completed eligible work and actual recipe outputs. Use seeded/statistically appropriate batched random sampling for drop counts, with stable replay/idempotency; use per-credited-kill odds, not guaranteed expected-value rare grants. No random reroll via reconnect. Separate Bernoulli/binomial-style drops, quantity bonuses, unique acquisition and duplicate conversion. Guarantee milestone rewards only once.
4. Apply EXP and level-ups, class mastery, permanent milestone changes, materials, gold and queue consumption with clear event ordering. Offline kills advance eligible conquest counters but never active gate completion. If next activity is locked or assignment invalid, pause and explain, not auto-conquer.
5. Commit balances, item ownership, XP, milestones, RNG/settlement ID, timestamp and receipt atomically within the account transaction model; subsequent retries cannot duplicate. Respect datastore size/throughput, lease/fencing and autosave design. A disconnected/crashed server cannot overwrite a newer session.
6. Deposit automatically. Present consolidated receipt: elapsed duration, effective hours, earnings by type, notable level-ups/collection discoveries, paused jobs and next suggested action. Summary must reflect persisted credits, not hypothetical calculations. No need to claim individually.

Exact online/offline parity policy: same formulas and eligibility for equivalent automated activity; manual skills, active tactics and live interactions can create different throughput. Rate approximations should be compared against measured automated gameplay and exact small-run reference simulations. Group farming, contribution rules, inventory reservations and cross-system threshold crossings must not be silently approximated if they materially change progression. Define tolerances by category. For long offline sessions use bounded batching with auditable approximation error; no hidden online-only advantage from processing order. No servers kept alive to generate offline rewards; no inactivity-bypass encouragement.

**Active-only:** discovering regions, major quest gates, class challenges, boss encounters, purchases, recruitment and manual strategic upgrades. Eligible combat/gathering/production objectives can progress online or offline. Daily/weekly windows use defined server calendar boundaries and settlement splitting; do not credit every past expired order retroactively unless explicitly designed. Reward players for returning, not for leaving computers running.

## 10. Economy and formula specification requirements

No production coefficients have been chosen. Build an original model, calibrate against target timings and viable strategies. Source research remains reference only; don't copy the exact IdleOn curves, assume community calculator output is live earned EXP, or modify frozen prior experiments.

### Canonical formula families (initial candidates, not fixed equations)
- **Level requirements:** `xpRequired(level)` smooth variable-growth, increasing, valid positive thresholds and explicit rounding/indexing (XP from level L to L+1). Fast early progression; target examples L2 after 1–3 kills, L5 3–5m, L10 10–20m, L25 1–2h, L50 near W1 clear, all provisional. No planned permanent level cap; implementation guards against overflow and runaway loops. Each character tracks combat EXP and profession EXP independently; class mastery trained separately. Specify thresholds, cumulative XP, multi-level settlement and numeric precision.
- **Damage:** candidate `raw = (baseDamage + weaponDamage) * (1 + sum(additiveDamage)) * product(approvedMajorMultipliers)`. Additive values as fractional units, no ambiguous percentage scaling; each source has a category ID and scope. World1 Research absent; inactive multipliers neutral (=1). Define class/ability/equipment interactions explicitly; avoid adding a new independent factor per small bonus. Apply accuracy and mitigation in a consistent order; crit chance constrained to [0,1], crit damage separate. Candidate expectation `DPS = raw * attacksPerSecond * hitProbability * (1 + critProbability * (critMultiplier - 1)) * mitigationFactor`, excluding abilities, discrete hits, target switching, overkill and travel. Actual encounter model handles those separately. No expectation-only rare drop claims. Min damage floor applies to landed damaging hits, not misses.
- **Accuracy:** visible enemy requirement and predictable hit curve, initially high chance; gradual introduction. Candidate saturating curve, monotonic in accuracy, caps at 100%; choose exact shape in experiments. Defense uses diminishing mitigation and positive floor; no permanent immunity. HP, enemy damage, accuracy requirement, defence and mechanics independently tuned by zone. Attack speed, ability cooldown, AoE target caps and spawn availability constrain throughput. Test survival and retry downtime for farming estimates.
- **Enemy reward throughput:** expected credited kills/hour bounded by combat time, target availability, movement, recovery and respawn. Base EXP, gold, materials and rare odds per monster independent. Enemy HP generally outpaces base EXP so prior areas can offer better EXP at certain builds; no requirement that every prior zone always wins. Reward estimates compare complete cycles, not simply HP/DPS. Shared population capacity and multiplayer contribution require live tests.
- **Gathering:** candidate rate = eligible actions/hour × expected resource yield/action. Actions depend on efficiency, speed and node requirements; over-efficiency increases yields, not unbounded simulation events. Profession EXP depends on defined successful actions/yield rules. Rare gems separate from base material. Compare older node mastery vs newer resource access.
- **Production:** duration/quantity/resource cost per recipe with Smithing level, tool and applicable bonuses. Inputs reserved/consumed once. Timed components versus instant equipment. Define whether speed and efficiency reduce duration/cost or increase outputs, and where rounding occurs. Guarantee no negative inventories or self-funding salvage loops.
- **Upgrade costs:** repeatables use tuned escalating curves and discrete material milestones; cost curve and bonus curve independent. Monuments soft cap/ascension; equipment tier recipes tailored to throughput and upgrade times. Buy Max computes affordable legal levels with no skipping material gates; cap complexity and preserve exact rounding. Avoid auto-buy that drains resources needed for queues.
- **Drops:** for fixed independent per-kill odds p and n eligible kills, probability of at least one drop is `1 - (1 - p)^n`; use only when independence/constant p apply. Separate probability, quantity, eligibility and guarantee/pity rules. Cap probability and clearly describe modifiers. Progression-critical items have guaranteed paths; optional rare rewards may use transparent protection. No paid luck/indirect paid chance boosts at launch; audit whether any paid deterministic product affects random outcome probability or opportunity and current platform requirements before publishing.
- **Offline:** 60% baseline first 24h; reduced window next 48h unspecified. Efficiency applied once to productive work. Level-up events affect subsequent rates. Distinguish fractional carries from integer reward units. Separate active play, online assigned, online auto-farm and offline. Account gold/loot per encounter, full personal deployed EXP. Test resource contention and simultaneous jobs.

### Currency and resource flow
Universal gold across worlds, no reset or separate world-specific gold. Specialised resources only where meaningful (ore, timber, components, monster drops, boss items; later research and mastery points). Sources: combat, quests, bosses, assignments, milestone rewards; sinks: recruitment, monuments, equipment enhancement, class changes, crafting and later research. EXP not spendable. Crafting material sinks should include selected prior materials to preserve older areas. Build source/sink ledger by category and profile. Boss and daily rewards must not flood the economy. Guarantee progression-critical resource access; no compulsory RNG grind. Track production rates, wallet growth, cost-to-income ratios, bottlenecks and time-to-next-affordable upgrade.

### Large-number architecture
World 1 may not require arbitrary precision for every value. Design scalable representation where needed, with explicit integer/fractional semantics, serialization, comparison, rounding, display abbreviations and safe conversion. Standard Luau numbers are not exact for all large integers; validate integer limits and avoid precision errors in spend/award checks. Use exact integer representation for balances where required; separate approximate display values from authoritative arithmetic. Define practical limits and tests for extreme numbers; don't claim literal infinity. Content IDs/version, formulas and units must match simulator/Roblox. No different hidden multipliers for offline, online or paying players.

### Simulation profiles and validation
Profiles: casual short sessions + offline, balanced, combat-focused, economy-focused, collector, realistic optimiser; separate perfect-information optimiser as an upper-bound experiment, not a typical player. Include no-spend baseline and later paid profiles, plus mixed class/assignment compositions, frequent logins, long offline absences and deliberate poor choices. Observe 5/15/30/60m, D1/3/7/14/30, active vs elapsed time, upgrades, zones, EXP, production, stockpiles, skill levels, rare outcomes, spending, dead time and time-to-bottleneck. Record policy decisions and RNG seeds. Use cloned states to compare alternatives, sensitivity tests for XP/cost/HP/slot/offline/drop/feedback parameters, and distribution quantiles rather than one perfect run. Ensure several viable strategies; trade-offs not identical results. Explicitly test earlier zone XP efficiency, resource farming trade-off, allocation shifts, queue shortages and late system compounding. Freeze approved baseline with reproducible exports and tests before production use. Validate against real Roblox playtest measurements. No asserted target percentile until test plan approves it.

## 11. Retention, social features and live operations

**Daily/weekly Legion Orders:** optional, modest rewards; no lost streaks or required daily attendance. Daily objectives selected from unlocked activities, weekly orders covering combat, professions, bosses and collections. Offline eligible ordinary progress counts; active-only objectives require live completion. Show progress and clear reward, avoid tasks requiring impossible unlocks or overspending. Returning-player guidance, offline rewards and optional catch-up objectives without resetting progress. Catch-up details open; don't create an incentive to intentionally stop playing. Calendar rules, expiry and reward grant behavior must be specified before build.

**Parties:** up to four players including leader, each with own squad; personal contribution rewards, cooperative challenges and modest non-stacking party benefits. Friends can join accessible content; progression gates cannot be bypassed. Co-op bosses are optional, solo progression viable. Determine party invite/leave/reconnect, scaling snapshots, public-zone credit, abuse cases and mobile UI. No compulsory guild membership. Leaderboards lifetime and weekly across combat, professions, collections; reward recognition/cosmetics primarily, not large snowballing power. Define ties, eligibility, suspicious values, reset time and data consistency. Proposed launch minimal categories: highest combat level, total legion levels, boss record, profession mastery, Bestiary. Choose exact categories before content lock.

**Post-launch guilds:** shared objectives, levels, modest bonuses and asynchronous weekly boss. PvE-first; optional separated balanced PvP investigated later. No player trading at launch; restricted trading only after economy/security stability, platform policy review and fraud/duplication threat model. No auction house launch. Preserve solo access to all essential content.

**Events:** optional server events and seasonal quests with controlled economic rewards and returning opportunities. Candidate events: monster invasion, rare elite hunt, ancient titan, resource surge, lost recruit, meteor gathering. Launch event count is OPEN; daily/weekly orders and Elite repeatability are baseline. No need to ship complex global live events before core quality is proven. No exclusive permanent power locked to brief attendance. Simulate events' effect on material supply, rare probabilities and progression before activation. Roll out via versioned configs and flags; ability to disable broken event without wiping progress. No promises on weekly update cadence.

## 12. Monetisation and policy boundaries

Core loop must be validated free-to-play first. All worlds, classes, productive roster/deployment slots, essential progression, offline earnings, auto-farm, auto-equip, fast travel and assignments earnable/free. Direct-purchase cosmetics for hero and legion (armour skins, weapon skins, capes, banners; later auras/mounts). No cosmetics granting mandatory progression. Modest, deterministic disclosed EXP, gold, profession bonuses, integrated into existing additive categories and tested against total compounding. Repeatable temporary training/production boosts and guaranteed balanced bundles allowed. No paid summons, paid random enchantments or paid drop luck at launch. No selling large late-tier material stockpiles to new players. Proposed packs/price ranges from Round 9 are not approved: don't ship fixed 299/399/499 Robux pricing or +50% multipliers without analysis. Temporary boost timer behavior offline is proposed pause unless specifically balanced/marketed otherwise; define activation, stacking, extension and expiry explicitly.

**Implementation requirements:** validate Roblox marketplace receipts server-side, idempotent product grant, transaction logs and recovery for repeated callbacks. Pass entitlement verification on server; UI accurately shows duration, exact effect, eligible items, limits and price. No deceptive urgency/discounts, no destructive missed-day rewards. Review current Roblox policies and age/regional restrictions before any monetisation test, particularly paid random outcomes, indirect boosts and social features. Do not assume current policy wording from earlier research remains unchanged. Assess whether deterministic paid boosts indirectly alter random rewards and avoid paid luck. Design remains subject to platform rules. Compare free vs paid progression, total account EXP generation and offline multiplier feedback; if boost is excessive, tune before release. Revenue, retention and purchase conversion are hypotheses, not guarantees.

## 13. UI, art and experience specifications

Mobile-first third-person default controls; keep movement, target priority, auto-farm toggle, up to three unlocked ability buttons and essential HP/EXP/gold/conquest feedback readable. Avoid covering targets/telegraphs. Screen layout respects safe areas, scales for aspect ratio, accessible touch targets and controller/keyboard support where feasible. Use clear icon + label, high contrast, color-independent indicators, settings for sound/VFX, reduced clutter and damage-number aggregation. Progressively unlock menus; early players see only current objectives. Menus provide current stats, next upgrades, prices, comparisons, Buy Max and optional detailed breakdown. Do not expose future features as working controls. Distinct onboarding for new and returning players.

| Screen | Required information/actions |
|---|---|
| HUD | Hero HP/EXP/level, gold, zone goal, ability cooldown, targeting, auto-farm status, next objective |
| Legion roster | Class/levels/job/status, deploy/assign, compare/filter, rare collection and capacity |
| Character detail | Stats, equipment, talents, profession levels, mastery, class change, loadouts |
| Command Centre | Per-job estimates, objectives, presets, pending queues, warnings, offline plan |
| Inventory | Shared balances, reserved/available, equipment instances, sort/filters, protected items |
| Crafting | Recipe prerequisites, ingredients, equipped item warning, output comparison, queue/cancel |
| Monuments | Current/next bonus, legal cost, milestone, Buy Max |
| Bestiary | Discoveries, mastery kills, emblems, regional progress and passive bonus |
| Feats / Orders | Lifetime and timed objective status, eligible progress and reward summary |
| Map | Zones, access vs visited status, gates, discovered teleport, optional areas |
| Boss entrance | Difficulty, eligibility, party status, clear rewards/records |
| Welcome back | Elapsed time, effective duration, credited totals, level-ups, notable drops, paused jobs |
| Shop | Direct purchases, precise effect, eligibility, receipts, confirmation |
| Settings | Audio, visuals, reduced effects and input/accessibility options |

Art direction: bright stylised low-poly medieval fantasy, recognisable Roblox scale and chunky silhouettes; distinct classes, tier colors/materials, biome palettes, landmarks and satisfying readable hits. Shared armour meshes per tier with class differentiation through weapons and abilities. Reusable kit assets, consistent icons and textures; original IP, no copied IdleOn/competitor artwork. Candidate art brief per zone includes color palette, landmarks, monster silhouette, spawn layout, materials, signage, VFX budget, mobile readability and sound cues. Final art assets not provided by this document.

## 14. Technical architecture and data contracts

### Service boundaries (proposed names)
| Service/module | Authority and responsibility |
|---|---|
| Data/Profile | Schema, migration, session fencing, atomic mutation, autosave, recoveries |
| Character/Class/Talent | Stats, EXP, levels, mastery, allocation, equipment compatibility |
| Combat/Enemy/Boss | Target validity, damage, cooldown, encounter lifecycle, reward eligibility |
| Legion/Assignment | Roster capacity, deployment, assignments, presets, schedule events |
| Inventory/Economy | Gold/material balance, item instances, reserve/consume, cost/grant ledger |
| Crafting/Production | Recipes, prerequisites, queues, timing, shortage/resume, output |
| Progression | Account unlocks, Monuments, Bestiary, Feats, class bonus records |
| Offline/Simulation | Shared rate rules, time settlement, deterministic batches, receipts |
| Quest/Orders | Tutorial, daily/weekly goals, active/eligible progress |
| Party/Leaderboard | Co-op session eligibility, scaling, rankings |
| Commerce | Entitlement checks, purchase receipt dedupe and grants |
| Analytics | Versioned events, funnels, economic instrumentation, diagnostic sampling |
| Shared content/formula modules | Typed IDs, schema validation, immutable config versions, common pure math |

Server-authoritative for all rewards, purchases, damage, ownership and progression; clients request actions and render confirmed state. Validate remotes (type, bounds, ownership, availability, cooldown/rate, proximity when required). No trust in client-provided cost, timestamp, stats, rarity or damage. Use stable IDs, never display names as keys. Use typed Luau interfaces and narrow module APIs; isolate pure formulas from engine side effects. Keep authoritative content version and client-safe presentation data separate. No unsupported library or tooling choice locked; evaluate existing repository workflow before choosing Rojo/test runner/build pipeline.

### Proposed saved profile model
- Metadata: account ID binding, schema version, content version, revision, last settled server timestamp, session fence, migration markers, receipt dedupe keys.
- Hero/recruits: stable IDs, unique hero definition if applicable, current class, combat level/XP, per-class mastery progress, talent allocation, skills/tool slots, equipment IDs, current/previous eligible assignments and saved presets. Roster/collection/reserve capacity explicit.
- Inventory: exact currency/material balances, available/reserved partition, item instances with base definition, enhancement/traits, owner/equipped binding, protection flag. No shared item instances across characters.
- Progression: visited and accessible zones/worlds, kill counters, active gate/quest/boss completion flags, Monument levels, Bestiary counts/emblems/reward flags, Feat milestones, class records, future entitlement flags if approved.
- Production: job IDs, recipe IDs/versions, unit ID, count/completed/remaining, reserved inputs, partial work/carry, status, priority and timestamps.
- Time and events: last applied settlement, deterministic RNG/reward receipt state, order windows, claim/grant identifiers, pending recoverable work; define bounded logs and retention so datastore size stays safe.
- Social/commerce: preferences, relevant entitlement state, leaderboard values or versioned summary; party session ephemeral, not a second source of truth for profile rewards. Separate sensitive or unnecessary information; analytics avoid personal data beyond required identifiers and platform tooling.

All state transitions must be atomic at the account mutation boundary. Define consistency model for distributed party/boss rewards and recovery if server dies mid-grant. Persist reward receipt before acknowledging success. Autosave with retry/backoff, session conflict recovery, server shutdown best effort, migration fixtures and rollback policy; avoid overwriting new state with stale session. No assumption that a platform API provides multi-key atomicity. Keep core account balances in one consistency domain or explicitly design compensation/reconciliation. Test duplicate requests, concurrent purchases, teleport/reconnect, queue cancellation, clock anomalies, migration, old-client config, crash before/after commit and failed saves.

### Performance and deployment
Target responsive low-end mobile; initial 12-player test server with full available squads, ordinary monsters, elites, VFX, assignment computations and party encounters. W1 maximum is 12 heroes + 36 deployed recruits if all have 3 slots; future six slots require separate capacity regression. Workers distant/offline numerical, local representative visuals if appropriate. Pool enemies and effects, bounded pathfinding/AI tick budgets, distance/visibility-based rendering and replication, client-side nonauthoritative animations; streaming where appropriate. Avoid simulating 20–50 roster characters per player as full server humanoids. Profile server CPU/frame, client frame time/memory, network, load time and datastore budget on real representative devices; agree numeric acceptance budgets after baseline measurements. Increase server capacity only when evidence supports it. Do not claim 12-player performance validated.

## 15. Analytics, playtesting and launch readiness

Instrument from first playable build. Define event schemas and versioned IDs, dedupe, privacy and sampling. Use official Roblox analytics where supported; validate event delivery and semantics in test environment. Track new-player funnel: join, first kill, first level, first recruit, first zone, class choice, first craft, first worker, first Monument, offline introduction/first return, first miniboss, first final boss. Record elapsed and active time, content version, platform/device category and acquisition cohort where available. Economy: per-source/sink gold/material events, balance distributions, recipe affordability, upgrade time, assignments/rates, offline duration/effective gains, resource shortage, kill/contribution/TTK, death and boss failure. Retention D1/D7/D30, qualified play and co-play as available, payer conversion/receipts and free/paid progression gaps. Never equate tracker concurrent-player snapshots with causal proof of success; use actual metrics and relevant Roblox benchmarks rather than inventing guaranteed retention targets.

**Playtest questions:** Can a new player understand combat without explanation? Does first recruit feel valuable? Can a mobile player locate the next objective, assign a worker and craft? Are class choices meaningful? Do returning rewards produce a clear next action? Does a combat-focused or economic-focused player get stuck? Do high-level players ruin beginner kills? Does auto-farm remove all reasons to engage? Are Elite bosses rewarding without being impossible? Do paid advantages alter core economy too much? Observe behaviour and qualitative feedback; distinguish usability, bugs, balance and fun. Use small tests, avoid overinterpreting tiny cohorts. Measure actual progression distributions before setting hard target rates.

**Release sequence:** internal tests → closed alpha with new players → small controlled advertising tests → measure/iterate → scale only when evidence supports. Launch W1 only, no misleading W2 promise. Required launch gates: approved formulas/content, full Normal and Elite encounters and 10 zones, feature acceptance, save/rejoin/receipt integrity, offline parity, security regression, real low-end mobile and server profiling, analytics verification, accessible onboarding, policy review, incident/rollback plan, sufficient post-clear goals and approved content roadmap. No automatic release just because a feature list is checked off. If an approved launch feature cannot meet quality gates, explicitly negotiate scope instead of silently cutting it.

## 16. Development milestones and acceptance gates

| Milestone | Deliverable | Gate to advance |
|---|---|---|
| M0 | Freeze Bible/register; resolve high-impact open items; inventory prior research; formula/content schema and plan | Owner approves baseline interpretation, assumptions and simulator plan; frozen repo untouched |
| M1 | Separate Legion progression lab | Reproducible candidate curves, multiple profiles, tests, experiment outputs, baseline version; no Roblox production code required |
| M2 | Roblox combat prototype | Satisfying auto attacks/manual controls, class basics, target/contribution correctness, basic performance/saving contract |
| M3 | Legion recruitment/deployment | First recruit and 2-recruit slice, individual EXP, assignment exclusivity, class/gear state and safe unlocks |
| M4 | Professions/crafting/gear | Shared storage, tools, queued components, instant gear, resource conservation, equipment transfer |
| M5 | Permanent systems | Slice Monuments and hooks; full Bestiary/Feats by W1 expansion, stat breakdown, milestone idempotency |
| M6 | Offline and persistence | Deterministic settlement, rate changes, same eligibility, shortage handling, receipts, crash/duplication tests |
| M7 | Integrated vertical slice | 20–30m coherent experience, 3 zones/2 recruits/1 miniboss, contextual onboarding, usability and measured model parity |
| M8 | Full W1 | 10 zones, 6 recruit slots, max 3 deployed, 3 classes/rare heroes/gear tiers, Normal/Elite, optional areas, collection/post-clear progression |
| M9 | Social, orders, shop and analytics | Party/co-op, leaderboard, daily/weekly, deterministic monetisation after free validation; analytics and compliance |
| M10 | Closed alpha and soft launch | Performance, security, onboarding and economy gates; real cohort data; controlled ad tests; fixes |
| M11 | Public release | Owner sign-off, monitoring/rollback, post-clear content and live operation plan |

**Dependency note:** M1 initial candidate model precedes Roblox slice; iterative simulation and prototype work may run in parallel once interfaces and specs are approved. Saving/security foundations start at M2/M3, not postponed to M6. Analytics starts at M2/M7, not postponed to M9. M5 is slice scope; M8 completes launch permanent systems. Rare hero acquisition/reserve design settled before M3. No one-prompt full build. Each increment gets written scope, acceptance tests, reproducible results, changed files, Git checkpoint, open issues and independent review. Claude cannot change approved design without owner sign-off. Test counts alone are not proof of correctness; inspect scenarios and evidence.

## 17. Dedicated progression lab specification

Create `legion-progression-lab/` as a separate repository/worktree or explicitly isolated project. Existing `progression-lab/` frozen baseline commit `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` must remain unchanged. Verify baseline and clean state read-only before reusing any reference; don't overwrite, cherry-pick changes into frozen branch, alter old exports or relabel historical results. Prior experiments on zone choice and offline scheduling are reference, not Legion predictions. Verify actual repo state locally; this Bible cannot inspect current machine or guarantee that checkout exists. If copying own reusable code, document provenance/licence and dependency boundaries; no copying GPL community calculator code into production without appropriate review.

Lab should be data-driven and testable headless; UI/dashboard useful but not blocker to core engine. Modules: content schema, numeric representation, formula primitives, actor and profile state, event-driven combat/production/settlement, resource ledger, progression gates, policy runners, seeded RNG, experiment orchestration and reports. Simulator starts with simplified assumptions explicitly declared, then adds complexity; avoid pretending offline exactness before model tests. Version formulas/content and experiment manifests; same fixtures later consumed by Luau. Include engine-independent fixtures for XP thresholds, additive/multiplier stacking, crit/accuracy/defence, recipe cost, assignment exclusivity, loot grant, offline boundaries, level-up feedback, competing queues, unlock restrictions and overflow/rounding. A simple exact reference simulator for short intervals can cross-check batch engine. Do not require testing all IdleOn bonus terms first.

### Candidate experiment sequence (M1 sub-increments)
| ID | Scope | Evidence gate |
|---|---|---|
| S0 | Schema + deterministic numeric primitives, XP/damage/mitigation | Unit tests, typed definitions, documented units/rounding |
| S1 | Single hero 3-zone combat loop, rewards and gates | Expected time-to-kill/XP examples, monotonic stats, target pacing experiments |
| S2 | Recruits, full personal EXP, squad vs independent jobs, class mastery | No double gold/loot/assignment credit; slot scaling and switch abuse tests |
| S3 | Mining, woodcutting, smithing, gear and queues | Conservation, reservations, shortages, transfer, production bottlenecks |
| S4 | Monuments, Bestiary/Feats, passive class bonuses | Correct grouping, one-time milestones, cap/feedback sensitivity |
| S5 | Offline batch settlement, caps and RNG | Boundary/replay tests; small exact reference vs batch; level-up and shortage events |
| S6 | Full W1 candidate tables, policies and sensitivity | Multiple strategies, 5m→30d reports, early vs late zones, resource trade-offs |
| S7 | Baseline freeze/export, Luau fixtures and integration plan | Reproducible results, documented limitations and owner/independent review |

M1 initial implementation should begin at S0/S1 only, with provisional fixtures clearly labelled. No polished UI before headless model works. Avoid simulated player policies with perfect knowledge masquerading as realistic behaviour. Policies operate on available information and plausible decisions; upper-bound oracle separate. Keep content editable and produce human-readable CSV/JSON outputs; include seeds, versions, policy definitions and hashes. Validate any candidate coefficients with live slice and revise via versioned changes. Compare actual production, time-to-kill and reward traces, not just end-level results.

## 18. Open decisions and risk register

| ID | Unresolved issue / risk | Recommendation / action | Must resolve by |
|---|---|---|---|
| O01 | Six recruits vs three unique heroes | Same six productive slots; nonproductive reserve with preserved progress; confirm swap rules | M0 before M3 |
| O02 | Reduced offline 48h window | Test candidate 25% online rate and whether upgrades apply; explicit formula | S5 |
| O03 | Online/offline grouped farming loot | One account reward per eligible encounter, full personal EXP; exact contribution/throughput semantics | S2 |
| O04 | Class switching and talent points | Separate class-earned mastery vs total level, preserve builds if chosen; exact cooldown/cost | S2 / M3 |
| O05 | Recruit combat HP/knockout | Temporary encounter KO/recovery candidate, no resource loss; model survival | S1/S2 |
| O06 | Class profession affinities | Warrior mining, Mage woodcutting candidates; Archer launch affinity unresolved | S3 |
| O07 | Exact zone access vs visit vs assignment | Separate flags, no gate bypass; define teleport/party policy | S1 |
| O08 | Prototype miniboss vs full W1 count | Reuse prototype as one of two major bosses, or separate optional encounter | M0/M7 |
| O09 | Enhancement inheritance/salvage | Prevent duplicate net gains; protect equipped gear; decide refund/transfer rules | S3 |
| O10 | Queue reservation and tie order | Deterministic priority/partial reserve semantics; compare alternatives | S3/S5 |
| O11 | Feat/Bestiary/Monument tables | Select exact counts, milestone caps and bonuses; no copied placeholder numbers | S4/S6 |
| O12 | Numeric and offline precision | Select representation, rounding, carry and approximation error budgets | S0/S5 |
| O13 | Rare reward protection and unique duplicates | Define transparent guarantee paths and category caps, avoid paid odds | S4/S6 |
| O14 | World 1 completion and post-clear duration | 4–8h target; test profile distributions, meaningful Elite/mastery loop | S6/M7/M8 |
| O15 | Future Mastery points before unlock | Retrospective one-time grant or persisted entitlement; no launch active tree | M8 before W2 |
| O16 | Party contribution and boss scaling | Fair early-player credit, alt/carry protection, participation checks | M2/M9 |
| O17 | Daily/weekly order calendar | Eligibility, offline boundary, catch-up, modest rewards | M9 |
| O18 | Monetisation values and compliance | Free progression first, test moderate boosts, policy review, no paid RNG | M9 |
| O19 | Mobile and server budget | Profile actual low-end devices and 12-player load, choose numeric thresholds | M2/M7/M10 |
| O20 | Live event and launch leaderboard scope | Small safe set; no obligation to launch every concept | M9 |
| O21 | Workload and quality risk | Enforce slice gate; explicit change control if scope exceeds capacity | Every milestone |
| O22 | Actual formula/model validity | Measured playtest reconciliation, no claim of IdleOn live validation | S7/M7 |

Critical next decisions are O01, O03, O04, O05, O07 and O12 because they affect the core data model. Other issues can be staged, using explicit candidate defaults for isolated experiments only. Avoid asking for every coefficient before M1; experiments exist to inform those choices. The owner can override recommendations explicitly. All remaining ideas in earlier rounds are design candidates unless the register confirms them.

## 19. Immediate next action

Use `CLAUDE_M0_KICKOFF.md` in the development workspace with this Bible and decision register. First task is read-only repo audit and M0 plan/decision matrix. Once reviewed, approve a small S0/S1 implementation scope in the separate Legion lab, then review the output before proceeding. Do not start building World 1 in Roblox yet. In parallel, human designers can prepare art references and test scenarios without locking numerical values or building production content. This is a development plan, not work already executed.

## Appendix — Reference boundary

Source of truth: the ten user-selected questionnaires in the design conversation. Research inspirations: IdleOn's multi-character progression and community calculators, Roblox incrementals/army RPGs and official Creator documentation. Earlier competitor figures were public snapshots, not causal performance evidence. Earlier calculator tables and charts were illustrative. For implementation verification, use current official Roblox documentation (Creator Hub: https://create.roblox.com/docs/) for DataStore, marketplace receipts, analytics, performance and virtual item policy; verify current rules at time of use. This consolidation does not claim fresh web research or independently revalidate those prior citations. Prior frozen simulator and IdleOn forensic work are reference inputs only, not live-game formulas or current repository verification.
