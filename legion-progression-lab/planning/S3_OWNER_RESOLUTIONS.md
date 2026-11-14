# S3 — owner rule resolutions

**Version 1.0, 2026-11-14.** Source: the owner's "Independent S3 Review and S3.1 Authorisation" §5–§14. This document records the owner's decisions on the proposed S3 rules (planning/S3_RESOLUTIONS.md v1.1, S3-R01 … R28). It does not change the historical register (docs/DECISION_REGISTER.md) or earlier resolutions, which all remain in force.

**Status of S3:** conditionally accepted, subject to S3.1. Not committed. **No numerical coefficient is promoted to final approved content.**

## Rules R01–R20 (accepted with refinements)
| Rules | Decision |
|---|---|
| R01–R03 | Combat EXP table reuse, profession efficiency and class affinity strengths are **candidates**. Separate profession curves may be tested. |
| R04–R06 | **Accepted:** discovery through hero visitation, node requirements, tool gating. |
| R07–R11 | **Accepted structure:** equipment, enhancement, salvage, inheritance. Coefficients remain candidates. Aggregate recipe validation must be corrected (done in S3.1, `spec/formulas/s3-industry.md` v1.1 §7). |
| R12 | **Accepted:** hero gathering. |
| R13 | **Accepted** for the initial slice: recruit-only timed production. Hero smithing remains a possible later refinement. |
| R14–R15 | **Accepted:** rate capture at work start; no reward for interrupted incomplete work. Work persistence and partial progress are revisited in S5. |
| R16–R17 | **Accepted:** instant crafting and explicit item consumption, **subject to reserve and productive-role eligibility** (S3.1-R01). |
| R18 | **Accepted:** proportional effective-damage attribution, **corrected to remove order dependence** (S3.1: fractional attribution, v1.1 §5a). |
| R19–R20 | **Accepted:** time categories and the profession EXP structure. EXP values remain candidates. |

## Rules R21–R28
| Rule | Decision |
|---|---|
| R21 | Auto-equip score accepted as an **initial candidate policy**, not a proven optimal recommendation. |
| R22 | Accepted: interruption when the relevant tool changes. |
| R23 | Accepted: incompatible weapons move to the inventory on a class change. |
| R24 | Accepted: hero gathering conditions and the current headless approximation. |
| R25 | Accepted: level-qualified smiths skip jobs they cannot perform. |
| R26 | Accepted: scheduling-pass coalescing. |
| R27 | Accepted: hero-only gathering time accounting. |
| R28 | Accepted: explicitly labelled diagnostic starting resources, equipment and profession EXP; **never silently introduced into realistic campaigns**. |

## Directions for S3.1 (owner §6–§14, summarised; the owner's text is authoritative)
- **Industry should be a viable investment, not a compulsory chore.** Do not reduce full personal squad EXP (approved design rule). Do not require equipment in every ordinary zone to force industry participation.
- **S3 established that the tested strategies underperform**, not that every industrial strategy is inferior. The six POL3 strategies stay as historical controls; add at least one demand-aware, observation-only industrial policy (§6 lists its required behaviours).
- **Separate capacity from realised demand** (§7): the 70–120-fold figure is gathered against consumed logs in the tested campaigns, not a capacity mismatch (zone-1 oak 1,200 logs/hour, zone-2 oak 1,800, one busy smith consumes 1,800). Do not cut yields by that factor; measure capacities, utilisation, demand, stockpiles, excess and shortage types first.
- **First craft** (§8): the S3-E08 results and its missed 15–25 minute hypothesis are preserved. New candidate metrics and targets: first simple crafted item 5–10 active minutes; first meaningful combat equipment upgrade 15–25 active minutes (defined before the runs). No artificial waiting timers.
- **Copper and equipment strength** (§9): the S3 content is the comparison control. Register focused alternatives (Copper offence +25% / +50%, offence with defence or HP, equipment that matters more relative to level growth); do not multiply every statistic; evaluate the 25% TTK target only in an informative combat range; no Iron or later tiers.
- **Investment comparison** (§10): pure combat, POL3-BAL, POL3-PROF and the new policy, matched initial states and seeds, fresh account and a matched mid-game state, 15/30/60/90 active minutes; report broad progression measures; investigate payback after returning industrial recruits to combat; report failure honestly.
- **Hero power** (§11): repeat with three deployed recruits, comparable equipment, identical starting levels, several hero classes, passive and attentive; the owner prefers a modest hero advantage with meaningful manual abilities, not doubling hero attack. Never apply a variant to the historical control.
- **Knockouts** (§12): the S3 knockout matrix is not widened again; ordinary early farming need not produce frequent knockouts. **Earlier materials:** investigate selected Copper recipes that keep a use for planks or earlier monster materials, without making every recipe need every earlier resource; permanent-upgrade demand belongs to S4.
- **L2** (§13): no compaction; a detailed replay contract is prepared later (monotone producer IDs differ from settled contiguous ranges).
- **Integrity** (§14): a concise S3.1 preregistration before new balance comparisons; separate engineering corrections, policy improvements, measurement corrections and candidate content changes; preserve every S3 artefact; report promising candidates separately with their own version.
- **Out of scope:** S4 mechanics, offline progression, new zones, the full six tiers, monetisation, Roblox gameplay, dashboards. Do not commit S3 or S3.1 before independent review and owner acceptance; do not push; do not delete old workspaces.
