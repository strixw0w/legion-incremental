# S3 — proposed rule resolutions

**Version 1.1, 2026-11-14 (v1.0 written before implementation; S3-R21 … R28 added during it). Status: proposed candidate rules, awaiting the owner.**

Each rule is needed to simulate S3, and the approved documents leave its exact form open. Each one states the consequence if it is changed. All numbers are candidates in `content/w1-slice-s3.candidate.v0.3.0.json`. No coefficient is approved.

| ID | Topic | Proposed rule (candidate) | Basis | Consequence if changed |
|---|---|---|---|---|
| S3-R01 | Profession curve | Profession levels use the combat EXP table | R04.02 | A separate curve changes profession pacing only |
| S3-R02 | Efficiency per level | +400 bp per profession level above 1 | R04.06 | Steeper growth front-loads gathering |
| S3-R03 | Affinity strength | +2,500 bp for the class's affinity (O06); 0 in the no-affinity control | O06 | Larger values force class-to-profession assignment |
| S3-R04 | Discovery | A node is discovered when the hero has visited its zone | D-01, Bible §6 | Separate per-node discovery adds exploration steps |
| S3-R05 | Nodes | Zone 1: Oak (Woodcutting). Zone 2: Oak and Copper vein (Mining). Zone 3: Copper vein (Mining, level 5). Action times 3.0–3.5 s; 1.0–1.5 units per action at 0 efficiency | Bible §6 | Yields and times set material pacing (S3-E04, E08) |
| S3-R06 | Tool gating | Copper ore needs an equipped pickaxe of at least Wood tier. Wood can be cut by hand, and an axe adds efficiency | R04.10, Bible §6 | Gating creates the first crafting goal |
| S3-R07 | Equipment stats | Wood: weapon +3 attack (club +2), armour +1–2 defence and +5–10 HP. Copper: about 2× Wood. Tools +2,000 to +4,500 bp. Accessory: HP and crit | R08.13 | Tier strength (S3-E05, H-S3-02) |
| S3-R08 | Classless weapons | A Wooden Club fits every character, including a classless one. Class weapons fit their class only | Bible §6 | Without it a classless hero has no weapon until level 5 |
| S3-R09 | Enhancement | +10% of base stats per level, maximum +5. Cost: gold 20 × (level + 1)² plus the tier material × (level + 1) | R04.17, R08.14 | Step size against the tier step (S3-E05) |
| S3-R10 | Salvage | Returns 50% (rounded down) of the recipe's declared recoverable materials (tier materials: planks, bars); drops and enhancement costs are never refunded | O09 | A higher rate risks net-positive loops (S3-E06) |
| S3-R11 | Inheritance | None (default, O09); variant: half the levels, rounded down | O09 | Inheritance changes the cost of upgrading |
| S3-R12 | Hero gathering | A `Gather` command at a node in the current zone; it stops on any other hero activity or at session end | R04.04 | Headless form of "interact once" |
| S3-R13 | Smiths | Only recruits work production jobs; the hero crafts instant recipes | R04.05, R04.15 | Hero smithing would compete with combat time |
| S3-R14 | Rate capture | The gathering action time, its efficiency and the production unit time are captured at start; later changes affect the next action or unit | owner §7 | Prevents acceleration by re-equipping or reassigning |
| S3-R15 | Interrupted work | Reassignment, unequip, travel or session end abandons the action or unit: no yield; the reservation is released | owner §7, O10 | Partial credit would need a progress model |
| S3-R16 | Crafting | Instant, by a named crafter out of an encounter with the Smithing level, giving the crafter Smithing EXP | R04.14–15 | Headless form of the blacksmith menu |
| S3-R17 | Consumption | A Copper recipe consumes one explicitly chosen Wood item of the same slot; equipped or protected items are refused | R04.16, O09 | Automatic choice would need a protection rule |
| S3-R18 | Effective damage | The lethal batch's remaining HP is shared in proportion to the blows' damage | owner §8 H | Order-independent; sums exactly to the HP removed |
| S3-R19 | Time categories | Gathering is its own category; crafting decisions are counted, not timed; waiting includes resource waits | owner §10 | — |
| S3-R20 | Profession EXP | Gathering: 3–6 per action. Smithing: per unit or craft, 3–12 | R04.02 | Profession pacing |

## Added during implementation (v1.1, 2026-11-14; candidates awaiting the owner)
These rules were needed to make the specification executable. Each is tested and listed in S3_EVIDENCE.md.

| ID | Topic | Proposed rule (candidate) | Basis | Consequence if changed |
|---|---|---|---|---|
| S3-R21 | Auto-equip score | attack + 1000 x defence + 200 x HP + crit bp + efficiency bp, at the item's enhancement; an empty slot scores -1; strictly better only; ties to the lowest item ID | owner §5 "deterministic auto-equip" | A different weighting picks different armour; never changes manual equipping |
| S3-R22 | Tool changes during work | Changing the equipped tool of the profession being worked (unequip, replace, transfer away) abandons the action or unit in progress (S3-R15); other slots never interrupt; enhancing an item never interrupts (the captured rate stays) | S3-R14, S3-R15 | Letting a tool swap keep the action would allow a mid-action tool to be "borrowed" |
| S3-R23 | Class change and weapons | A class change moves a weapon the new class may not wield to the inventory | §5 class compatibility | Otherwise a character could hold an incompatible weapon |
| S3-R24 | Hero gathering conditions | `Gather` needs the hero idle (not resting, walking, fighting or travelling), auto-farm off, and a node of its current zone; regeneration continues while it gathers | S3-R12 | Allowing gathering while resting would merge two time categories |
| S3-R25 | Smith level per job | A smith below a recipe's Smithing level skips that job (it stays queued, not paused); a higher-level smith may take it | §6 | Pausing it would hide a skill gap behind a shortage message |
| S3-R26 | Scheduling passes | At most one scheduling pass is queued per moment and stage; a deposit queues one only when a job is waiting | §6 | More passes change nothing but cost log entries |
| S3-R27 | Gathering time | The gathering time category counts the connected hero only; recruits' gathering is production, not player time | owner §10 | — |
| S3-R28 | Diagnostic starts | Matched-state experiments may start with labelled diagnostic items, materials and profession EXP (`createdBy: diagnostic`, ledger purpose `diagnostic`); realistic campaigns never do | S2-R diagnostic rule | — |
