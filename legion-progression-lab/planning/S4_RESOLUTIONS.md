# S4: proposed rule resolutions

**Version 1.0, 2026-11-14. Proposed, awaiting owner review.** These rules fill what the owner's "S3.1 Final Acceptance and S4 Authorisation", the Game Design Bible §7 and the Decision Register leave open (`planning/S4_SPECIFICATION.md`).

**Every number is a candidate.** Nothing here changes an earlier resolution.

| Rule | Subject | Proposed rule | Source | Alternatives and why not |
|---|---|---|---|---|
| S4-R01 | Switch | One `permanent` switch (with `legion` and `industry`). Off reproduces S3.1 exactly. | owner §6 | Separate switches per system: more combinations to keep reproducible, with no benefit in the slice. |
| S4-R02 | Bonus source | Each permanent bonus is a registered source: ID, system, target, scope, category, semantics, value, provenance and formula version. | owner §11 | Ad hoc stat fields: no breakdown or provenance. |
| S4-R03 | Pools | Every non-Monument permanent bonus joins the existing pool for its stat (`cat.damage.additive` for attack, the HP and ability bp sums, the crit sum, the efficiency sum). Only Monument of Power uses its own category, the S1-registered `cat.damage.monument`, and Monument of Vitality uses one HP factor. | R05.17, R08.10; owner §11; Bible §7 "global bonus rules" | **All additive:** simplest, but passive rewards would dilute purchases. It is tested as a sensitivity variant. **One multiplier per system:** forbidden. |
| S4-R04 | Scope | Account-wide: once per owned character, including new recruits, workers, gatherers and smiths. Class-record bonuses are account-wide too (one per class). | R05.02; owner §10–§11 | **Class bonus only for that class:** it would reward owning many of one class and does little for diversity. |
| S4-R05 | Exactly once | Every reward has a stable entitlement ID and is granted at most once. Rewards are stat bonuses only (no currency or counters), so a single evaluation pass cannot cascade. | owner §9, §12 | **Currency rewards:** they need recursion guards and feed loops; deferred. |
| S4-R06 | Counters | Lifetime monotone counters and high-water marks. Current balances never drive a Feat. | owner §9 | **Current values:** reserve swapping or spending would toggle rewards. |
| S4-R07 | Ordering | **CREDIT:** counters, Bestiary and the emblem draw commit with the kill. **PROGRESS:** one `PermanentCheck` after `ProgressCheck` grants every newly crossed reward in ID order. **RECOMPUTE:** stats. | D-07; owner §12 | Evaluating at CREDIT would grant before gates and level-ups settle. |
| S4-R08 | Max HP change | Current HP rescales by the S2 proportional rule (recruits by the S2 member rule). | S2 | **Full heal on bonus:** an exploitable timing. |
| S4-R09 | Monument discovery | **Guaranteed:** Power at the first-recruit quest, Vitality at the first zone-2 visit, Industry at the zone-2 kill gate. | owner §7; R05.03 | **Rare-drop discovery:** forbidden for essential Monuments. |
| S4-R10 | Monument curves | **Gold:** geometric with ceil, `c(L+1) = ceil(c(L) × (1 + growth))`. **Bonus:** three tiers of 10 levels with diminishing per-level bp. **Materials:** milestones every fifth level. Cost and bonus parameters are independent. | R05.04–R05.05, R05.18; owner §7 | **A diminishing formula** (for example a/(1 + bL)): harder to show exactly to players and in fixtures. |
| S4-R11 | Purchase | Validation, then one atomic transaction against `available` balances. `levels: n` buys n or nothing. | owner §7 | **Partial fills:** forbidden. |
| S4-R12 | Buy Max | The largest legal sequential k ≥ 1. An affordable milestone is crossed; buying stops before the first unaffordable level or `maxLevel`. Previewed, and checked against brute force. | owner §7 ("preferred interpretation: yes") | Stopping at every milestone: the owner's non-preferred reading. |
| S4-R13 | Preview | The observation shows the next cost, next bonus and Buy Max preview. | R05.20 | — |
| S4-R14 | Bestiary count | +1 per accepted kill credit of the species (squad or worker stream), never per participant. Discovery at the first credit. The boss is excluded. | owner §8 | **Count per participant:** forbidden. |
| S4-R15 | Emblems | A dedicated `emblem` RNG stream, one draw per accepted credit of the species, `dropBp` in [0, 10000]. The first copy is rewarded once; later copies are counted only. No luck interaction in S4. | owner §8 | **Multiple collection tiers:** more power from luck; deferred. |
| S4-R16 | Regional rewards | Completion when every species is discovered; mastery when every species reaches Gold. | R05.08 | — |
| S4-R17 | Feats | Tiered lifetime Feats in combat, recruitment and combined levels, professions, gathering, production, crafting, equipment, exploration and conquest. Several tiers crossed in one event are all granted. | owner §9 | — |
| S4-R18 | Class records | The S2 account record per class (highest mastery level). Milestones grant that class's account bonus once. | R05.16; owner §10 | **The current class level of each character:** duplicates and switching would multiply it. |
| S4-R19 | Roster | **Lifetime recruits acquired** (never decreases) drives roster milestones. **Combined productive-roster level** is a high-water Feat. | owner §10 ("register the chosen interpretation") | **Current roster size or levels:** reserve swapping could toggle rewards. |
| S4-R20 | Observation | The `permanent` section (spec §8): realistic information only. | owner §15 | — |
| S4-R21 | Old and new stats | An attack uses the stats in force when it lands. Work in progress keeps its captured rate. A Monument purchase during combat or production is allowed, and stats recompute at once. | S2, S3-R14; owner §12 | **Refusing purchases in combat:** an arbitrary restriction on an account menu. |
| S4-R22 | Serialization | Permanent state is plain JSON-safe data, included in state hashing and the replay digest. | owner §6 | — |
| S4-R23 | Starter weapon | Candidate variant: a modest hero weapon below the Wood tier (`tier.starter`, order 0) at account start. Unarmed controls are kept. | owner §4B | **A Wood-tier starter:** it would suppress Wood upgrades. |
| S4-R24 | New milestones | The S3.1 R04–R07 milestones are kept. Added: first meaningful upgrade over an already equipped combat item (≥ 10% matched-state DPS or hits survived against the replaced item) and first meaningful hero-specific upgrade. | owner §3 (R06), §4B | — |
| S4-R25 | R09 measures | Gathered-but-unconsumed stock and production beyond the declared plan are reported separately. The plan measure exists only for policies that declare a plan (POL3-DEMAND2 and the POL4 policies). | owner §3 (R09) | — |
| S4-R26 | Diagnostic arena | Matched under-levelled start against zone-3 enemies scaled to stay challenging, with spawn availability raised. Labelled diagnostic; not a zone and not a baseline. | owner §4A | **A new zone:** forbidden. |
| S4-R27 | Elasticity horizon | Seven-day elasticity runs only if within the declared runtime and memory budget. Otherwise shorter controlled diagnostics, reported as such and never extrapolated. | owner §13 (E03) | — |
| S4-R28 | L2 | Design document only, for separate owner approval. | owner §16 | — |
