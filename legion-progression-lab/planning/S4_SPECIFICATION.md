# S4 specification: Monuments, Bestiary, Feats, class and roster bonuses

**Version 1.0, 2026-11-14.** Written before S4 implementation. Source: the owner's "S3.1 Final Acceptance and S4 Authorisation" §6–§18.

**Built on:**
- Game Design Bible §7;
- Decision Register R05.01–R05.20, R08.09–R08.10;
- `S2_OWNER_RESOLUTIONS.md`, `S3_OWNER_RESOLUTIONS.md` and `S3_1_OWNER_RESOLUTIONS.md`;
- the M0 experiment plan (S4, §8).

Where these are silent, the proposed rules S4-R01 … in `S4_RESOLUTIONS.md` apply. **Every number is a candidate** in `content/w1-slice-s4.candidate.v0.4.0.json`.

**Out of scope (owner §17):**
- offline settlement and Monument of Eternity mechanics (an extension point only);
- L2 compaction;
- Research, the Legion Mastery Tree, advanced classes and enchanting;
- final rare heroes, zones 4–10, Iron to Mithril, final bosses;
- daily or weekly orders, parties, monetisation and trading;
- Roblox or Luau work, and dashboards.

## 1. Engine and switch
- **The `permanent` feature switch** (it requires `legion` and `industry`) adds the S4 systems to the one engine.
  - **Off:** S3.1 is reproduced exactly (tested; every historical fingerprint is re-verified).
  - **On:** permanent state, bonuses, milestones and Monument purchases.
- **The S4 content pack** builds on the frozen S3 pack (`basePack`) and never changes it.
- **Permanent state** is plain data inside the simulation state. It is serialised and hashed with everything else.
- **What it holds:**
  - Monument levels;
  - Bestiary records;
  - lifetime counters and high-water marks;
  - the entitlement registry (every reward granted, by stable ID);
  - the emblem RNG stream.

## 2. The permanent bonus registry (owner §11)
**Every permanent bonus is a registered source** with these fields:
- a stable `sourceId`;
- the `system` it comes from (monument, bestiary, emblem, region, feat, class record, roster);
- a `target` stat (`attack`, `maxHp`, `critChance`, `abilityPower`, `gatherEfficiency`, `smithEfficiency`);
- a `scope` (`account`: every owned character, once);
- a `category`;
- `semantics` (`additiveBp`);
- its current value in bp;
- `provenance` (the entitlement or Monument level that grants it);
- the formula version (`perm-v1`).

**Pools (S4-R03):**

| Target | Where the permanent sources go | The one independent factor |
|---|---|---|
| attack | the existing additive pool `cat.damage.additive`, with class and talent bonuses | Monument of Power, in the S1-registered `cat.damage.monument` category, activated by the switch |
| maxHp | added to the class and talent HP bp sum | Monument of Vitality: one integer factor after the pool |
| critChance | added to the crit sum, capped at 10,000 bp (the overcap is shown in the breakdown) | none |
| abilityPower | added to the talent ability bp | none |
| gather / smith efficiency | added to the S3 efficiency sum (level, tool, affinity) | none |

- **No other multiplier.** There is never one factor per Monument level, Feat, monster rank or class record.
- **Neutral identity:** with no permanent bonus, every stat equals the S3.1 stat bit for bit (an empty pool or a skipped category).
- **Breakdown:** `statBreakdown(character)` lists every source. It is evaluated by the same S0.1 stat function (`evaluateStat`), and a monitor check and S4-E02 require it to equal the applied stat.
- **Application:**
  - Account bonuses apply once to every owned character, including recruits bought later, workers, gatherers and smiths. A reserve character's stats are computed the same way; it does not act.
  - An efficiency bonus enters the efficiency sum once, so it changes the yield once and is never applied again at deposit.
  - Overflow and range rules are those of `stats.md` v2 and `combat.md` v2. Crit is capped.

## 3. Ancient Monuments (owner §7)
**Three slice Monuments:** Power (attack), Vitality (max HP) and Industry (gathering and smithing efficiency). Eternity is an extension point only: no content and no mechanics.

**Discovery is guaranteed (S4-R09):**
- Power: at the first-recruit quest;
- Vitality: at the first visit of zone 2;
- Industry: at the zone-2 kill gate (conquest).

No random reward is ever required.

**Levels (S4-R10):**
- **Range:** level 0 at discovery, up to `maxLevel` (30: three tiers of 10).
- **Gold cost from level L to L + 1:** `cost(0) = baseGold`, then `cost(L + 1) = ceil(cost(L) × (10000 + growthBp) / 10000)`. All values are integers, checked to be safe.
- **Bonus at level L:** the sum of per-level bp by tier (tier 1 `p1`, tier 2 `p2 < p1`, tier 3 `p3 < p2`). This is the soft cap: diminishing returns that never make an earlier level worthless.
- **Material milestones:** entering a milestone level also costs the listed materials. Planks, bars and earlier-zone monster drops all have uses.
- **Independence:** the cost and bonus curves are separate parameter sets.

**Purchase (`UpgradeMonument { monumentId, levels: n | 'max' }`, S4-R11):**
- **Validation first, then one atomic ledger transaction** that debits gold and materials from `available` only. Reserved production materials cannot be spent.
- **On failure,** nothing changes. A request for n levels buys exactly n, or nothing.
- **Levels are never lost.** There are no resets.

**Buy Max (S4-R12):**
- **What it buys:** the largest k ≥ 1 such that every level from L + 1 to L + k is legal. Legal means discovered, at most `maxLevel`, and the cumulative gold and the cumulative amount of each material within the available balances.
- **Milestones:** an affordable milestone is crossed. Buying stops before the first level that cannot be afforded, or that is beyond `maxLevel`.
- **k = 0** is refused (`NOT_AFFORDABLE` or `MAX_LEVEL`).
- **Preview:** the observation previews Buy Max (levels, total gold, total materials, resulting bonus).
- **Check:** an independent brute-force reference must agree exactly (S4-E05).

## 4. Bestiary (owner §8)
- **Species:** the three ordinary slice monsters (slime, wolf, goblin); the boss is excluded.
- **Discovery:** at the first accepted kill credit of the species.
- **Counting (S4-R14):** each accepted kill credit adds exactly one to its species, during the credit phase:
  - whatever the number of participants;
  - squad or legitimately credited worker kills;
  - never for a rejected or duplicate credit.
- **Ranks:** Bronze, Silver and Gold (candidate thresholds), each with a passive account reward. Further ranks are reserved.
- **Emblems (S4-R15):**
  - **The draw:** one optional rare emblem per species. Every accepted credit of that species makes one draw from a dedicated `emblem` RNG stream. The chance is `dropBp`, in [0, 10000] (validated).
  - **Reward:** the first acquisition grants its reward. Later copies are counted and grant nothing (no unlimited power).
  - **Luck:** none in S4 (declared).
  - **Isolation:** duplicate or rejected credits never reach the draw, and the stream is separate from every other stream.
- **Regional rewards (S4-R16):**
  - completion: every species discovered;
  - mastery: every species at Gold.
- **Passive:** every reward is passive and account-wide. There are no cards to equip, no paid luck and no paid emblems.

## 5. Legion Feats (owner §9)
**Lifetime counters (S4-R06):**
- **Monotone counters:**
  - account kills;
  - gold earned from kills;
  - raw units gathered;
  - timed units completed;
  - items crafted;
  - enhancements;
  - zones visited;
  - kill gates completed;
  - boss cleared;
  - recruits acquired.
- **High-water marks:**
  - combined level of the productive roster (the hero and non-reserve recruits);
  - the summed profession levels.

**Never lowered.** Spending, reserving and class switching never lower a counter. Current balances are never a Feat counter.

**Tiers:**
- Each Feat has tiers of increasing thresholds. Each tier grants a passive stat bonus.
- **No Feat or Bestiary reward is currency, or anything that advances a counter.** So one evaluation pass is complete and nothing can cascade.

**Representative set:** combat, recruitment and combined levels, professions, gathering, component production, crafting, equipment (enhancements), exploration and conquest.

## 6. Class records and roster milestones (owner §10)
- **Class records (S4-R18):**
  - **The record:** the S2 account record per class, the highest mastery level any owned character ever reached in that class.
  - **Milestones:** reaching record milestones grants that class's account-wide bonus once. Candidate themes: Warrior combat and vitality, Archer crit, Mage ability and industrial efficiency.
  - **No duplication:** several characters of one class do not multiply the bonus. A class switch cannot create mastery (S2), and switching back keeps earned records.
  - **Reserve:** reserve characters earn no EXP or mastery, but keep their records.
- **Roster milestones (S4-R19):**
  - **Lifetime recruitment:** recruits ever acquired, which never decreases.
  - **Combined productive-roster level:** a high-water Feat.
  - **No farming:** repeated reserve swaps cannot re-grant anything (exactly-once registry and high-water marks; tested).

## 7. Exactly-once evaluation and event ordering (owner §12; S4-R05, R07)
**Same-moment phases are unchanged (D-07):** BOUNDARY < COMPLETE < CREDIT < PROGRESS < RECOMPUTE < START < POLICY.

| Phase | S4 behaviour |
|---|---|
| CREDIT | The accepted kill credit commits, in the same state assignment: the Bestiary count, lifetime kills and gold, and the emblem draw. Other counters update with their own events: deposits, unit completions, crafts, enhancements, recruits, visits, gates. |
| PROGRESS | `PermanentCheck`, at most one per moment, after the S2 `ProgressCheck`: <br>• evaluates every milestone against the counters and grants each newly crossed reward once, in reward-ID order (one event crossing several thresholds grants all of them); <br>• discovers Monuments; <br>• logs `MilestoneGranted` and `MonumentDiscovered`. |
| RECOMPUTE | If the bonus registry changed, every character's stats are recomputed. Max HP rescales current HP by the S2 proportional rule. |
| POLICY | `UpgradeMonument` is an account command. It is allowed during combat and production. Stats recompute at once. |

**Old and new stats (S4-R21):**
- An attack uses the stats in force when it lands (the S2 rule), so a bonus counts from the next landing attack after the recompute.
- Gathering and production keep the rate captured at work start (S3-R14); the next action uses the new efficiency.
- **No retroactive change:** the reward or kill that unlocked a bonus is never re-evaluated with it.

**Atomicity:**
- A failed command changes nothing.
- An entitlement is granted only with its registry entry, in one state assignment.
- **Replay:** a replayed credit is rejected before any counter changes.

## 8. Observations and policies (owner §15)
**The observation's `permanent` section shows:**
- **Monuments:** discovered, level, bonus, next cost and bonus, Buy Max preview;
- **Bestiary:** entries (kills, rank, next threshold, emblems);
- **Feats:** counters and tiers;
- **Class records** and next milestones;
- **Roster** counters;
- **Bonuses:** the full bonus breakdown.

Only realistic information is shown: no future draws.

**Policies:**
- **POL4-MONUMENT:** POL3-DEMAND2 industry plus Monument Buy Max whenever gold exceeds the next recruit's price.
- **POL4-BESTIARY:** POL3-CONQ combat that farms the accessible zone whose species is nearest its next rank or regional reward.
- **POL4-BALANCED:** POL3-DEMAND2 plus Monument purchases ranked against equipment and recruits by bonus per gold.

**Controls:**
- POL3-CONQ (pure combat and recruitment);
- POL3-DEMAND2 (the industry reference);
- POL3-EQUIP and POL3-DEMAND (historical).

The hindsight search is not extended.

## 9. Candidate variants (on the S4 pack, never a silent change)
- **Starter weapon** (owner §4B): a modest hero weapon below the Wood tier (`tier.starter`, order 0), given at account start. Unarmed controls are kept.
- **Hero ×1.5** (owner §4F): the leading candidate arm. The control, ×1.25 and the ×2.0 sensitivity are kept.
- **Under-levelled diagnostic arena** (owner §4A): a labelled matched-state start against scaled zone-3 enemies with adequate spawns. It is not a new zone.
- **Monument pooling sensitivity:** Power in the additive pool instead of its own factor.
- **±25% loop parameters** for S4-E03.

## 10. Experiments
**S4-E01 … E06** follow the owner's §13 and the M0 plan. They are pre-registered in `manifests/s4/`, with the targets fixed before any run. Each experiment and its gates are given there.

## 11. Monitor (new checks, independent re-statements)
| Check | What it verifies |
|---|---|
| I22 | Each reward ID is granted at most once, and the entitlement registry matches the grants. |
| I23 | Lifetime counters never decrease, and they equal an independent tally from the event log. |
| I24 | Every character's applied stats equal the breakdown re-evaluated independently. |
| I25 | A Monument purchase debits exactly the summed cost-table entries; levels never decrease or exceed the maximum. |
| I26 | Bestiary counts equal the accepted credits per species, never the participants. |
| I27 | Each emblem's first acquisition is rewarded once; draws equal accepted credits. |
| I28 | A milestone is granted only when its counter has reached the threshold. |

## 12. L2
The complete bounded replay and settlement contract is prepared as a design document (owner §16): `planning/L2_CONTRACT_PROPOSAL.md`. **No L2 implementation.**
