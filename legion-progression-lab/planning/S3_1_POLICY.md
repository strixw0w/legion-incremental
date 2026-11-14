# POL3-DEMAND — the S3.1 demand-aware industrial policy

**Version 1.0, 2026-11-14.** Owner "Independent S3 Review and S3.1 Authorisation" §6. Implementation: `src/policy/industryDemand.ts` (declared constants `DEMAND`). The six S3 POL3 strategies remain the historical controls, unchanged.

**Information:** only the LegionObservation (the Command Centre and the town menus, including the blacksmith's item catalogue: each item's slot, tier, classes and base stats). No engine import, no state between decisions, no future random draws. Every command it issues is validated by the engine as usual.

| Owner §6 requirement | How POL3-DEMAND meets it |
|---|---|
| Identify the next economically useful upgrade | Candidates: every higher-tier weapon, armour piece and accessory for the hero and the recruits that fight in the squad, and +1 enhancement (up to +2) of their equipped combat items. Gain = auto-equip score difference (S3-R21 weights; a percentage weapon counts 1 point per bp). Cost = production seconds of the missing inputs (plank 10 s, bar 13 s, log 3 s, ore 3.5 s). Best gain per (cost + 1), gain at least 1,000 (one attack or defence point, or five HP). |
| Identify missing ingredients and their eligible sources | Planks from logs (an oak the gatherer can use), bars from ore (a copper vein, which needs a pickaxe: a Wood pickaxe for the would-be miner is chosen first when nobody can mine), enemy drops from the zone that drops them. |
| Temporarily gather the required materials; stop unnecessary stockpiles | One gatherer only while its raw material is short for the chosen candidate; it stops once the need is 2 units below zero (GATHER_STOP_MARGIN, so it does not flip on every deposit). |
| Return surplus workers to combat; switch smiths away when there are no useful jobs | Roles exist only while needed: one smith while production is needed or jobs are open. Everyone without a role is managed by POL2 (squad first, then workers), so a finished role returns to combat at the next decision. |
| Return to earlier visited zones for missing monster materials | When only candidates blocked by a missing drop are useful, the hero farms the accessible zone that drops it (POL2's fixed-zone rule with its recovery rules). |
| Skip a temporarily blocked build step when another useful affordable item exists | Blocked candidates are chosen only when no unblocked candidate is useful. |
| Compare equipment, recruitment and production investments | Recruit purchases (POL2) come first; enhancements need gold beyond the next recruit's price; production happens only for a candidate whose gain clears the threshold, ranked by gain per production second. |
| Avoid rapid assignment oscillation | The stop margin above; smiths are released only when no job is open (never mid-unit by the policy). |
| Preserve recovery, eligibility, visitation and reserve rules | POL2's recovery and zone rules; crafters only from the menu's eligible list (S3.1-R01); the reserve is never used; only discovered nodes. |

**Not included:** hero gathering (the hero's combat time is the most valuable); a combat worker sent for a missing drop (the hero's earlier-zone rule is used instead); a general optimiser. ORC3-SEARCH is not extended in S3.1.

**Development probe (disclosed):** before registration, one 60-minute run (seed `probe31#rep-0`) was used to check that the policy issues valid commands and that the monitor reports nothing; no constant was changed after it.

## Version 1.1: POL3-DEMAND2 (S3.1 amendment 01, after the registered results)

**Defect found in version 1.** When no candidate upgrade remains, version 1 computes no material need at all: the need is zero, not "required minus held". The stop rule ("stops once the need is 2 units below zero") therefore never releases a gatherer that is already assigned, and it keeps gathering for the rest of the run. In the registered S3.1-E08 fresh-account runs, the materials held rose from 86 to 1,175 between 30 and 165 minutes while nothing was crafted. That breaks the "stop unnecessary stockpiles" and "return surplus workers to combat" rows above.

**Version 1.1** (`makePol3Demand(id, over, 2)`, policy id POL3-DEMAND2) keeps counting the materials held and the open jobs when no candidate remains, so the gatherer stops once 2 spare units are held. Nothing else changes and no constant moves. Version 1 (POL3-DEMAND) stays unchanged so that the registered results reproduce. Version 1.1 is measured in S3.1-E09 and S3.1-E10 (manifests/s3.1/AMENDMENT-01.md) and reported there as a follow-up. Test: `test/s3_1.policy.test.ts`.
