# S4: owner rule resolutions

**Version 1.0, 2026-11-15.** Source: the owner's "Independent S4 Review and L2 Authorisation" §5–§6.

**Scope:**
- This document records the owner's decisions on the 28 proposed S4 rules (`planning/S4_RESOLUTIONS.md` v1.0, S4-R01 … R28).
- It does not change the proposal itself, earlier owner resolutions or the historical register.
- **No numerical coefficient is promoted to approved final balance.**

**Every rule structure is approved,** subject to the conditions below:

| Rule | Subject | Owner decision |
|---|---|---|
| S4-R01 | Switch | **Approved.** |
| S4-R02 | Bonus source | **Approved, subject to correction B.** A source's canonical identity is kept apart from its effective application (`appliedStat`, `appliedCategory`); the metadata must describe the actual calculation (`spec/formulas/s4-permanent.md` v1.1 §9.2). |
| S4-R03 | Pools | **Approved, subject to correction B.** The effective category metadata describes the actual grouping in every variant, including additive Monument pooling, for Power and Vitality. |
| S4-R04 | Scope | **Approved.** |
| S4-R05 | Exactly once | **Approved.** |
| S4-R06 | Counters | **Approved, subject to correction A.** Authoritative lifetime counters, Bestiary and emblem counts, purchases and high-water sums use checked arithmetic. An unrepresentable operation is refused, and its step commits nothing (§9.1). |
| S4-R07 | Ordering | **Approved.** |
| S4-R08 | Max HP change | **Approved.** |
| S4-R09 | Monument discovery | **Approved structure;** the discovery milestones remain **candidates**. |
| S4-R10 | Monument curves | **Approved structure:** geometric gold with ceil, tiered diminishing bonus, material milestones. The numerical costs need later calibration (§6 Monuments below). |
| S4-R11 | Purchase | **Approved.** |
| S4-R12 | Buy Max | **Approved.** |
| S4-R13 | Preview | **Approved.** |
| S4-R14 | Bestiary count | **Approved.** |
| S4-R15 | Emblems | **Approved.** |
| S4-R16 | Regional rewards | **Approved, subject to correction C.** Regional mastery uses an explicit Gold requirement for the current slice. A higher rank added later must not change it (§9.3). |
| S4-R17 | Feats | **Approved.** |
| S4-R18 | Class records | **Approved.** |
| S4-R19 | Roster | **Approved.** |
| S4-R20 | Observation | **Approved.** |
| S4-R21 | Old and new stats | **Approved.** |
| S4-R22 | Serialization | **Approved:** plain JSON-safe state. **Validated reconstruction is not yet implemented.** The S4-E01 JSON round trip is not a save/load validation; L2 provides it. |
| S4-R23 | Starter weapon | **Approved structure;** the starter weapon remains **candidate content** (a variant, not the control). |
| S4-R24 | New milestones | **Approved.** The missed onboarding hypotheses are preserved, including H-S4-07 (15–25 min, missed). |
| S4-R25 | R09 measures | **Approved.** |
| S4-R26 | Diagnostic arena | **Approved** as labelled diagnostic content. |
| S4-R27 | Elasticity horizon | **Approved.** Future performance budgets must include worker memory, not only main-process RSS. In this lab the workers are threads in one process, so process memory covers them; peak and retained heap are to be reported separately (`evidence/perf-audit/PERFORMANCE_AUDIT.md`). |
| S4-R28 | L2 | **Approved:** L2 remained design-only throughout S4. |

## Balance decisions (owner §6), recorded without change to S4 evidence
**Monuments:**
- **The finding:** the current gold prices are too low to create meaningful spending decisions in the tested campaigns.
- **Not concluded yet:** the milestone-material stalls also reflect policy limits. Materials are not to be judged too expensive before policies that actively acquire them are evaluated.
- **Kept:**
  - the existing 30-level curve, as the control;
  - the diminishing bonus tiers;
  - the selected material milestones.
- **Candidate Power cost curves for S5/S6 calibration** (experimental, not final prices):
  - base 80, growth 15%;
  - base 120, growth 18%;
  - base 160, growth 20%.

  The other Monuments need individually justified pricing.
- **A future resource-aware investment policy:**
  - identifies missing Monument materials;
  - returns to eligible earlier zones;
  - requests useful components;
  - reassigns idle smiths and unnecessary gatherers;
  - evaluates affordable alternatives;
  - never sacrifices combat indefinitely for blocked production.
- **Reference policies:** POL4-MONUMENT2 and POL4-BALANCED2 are approved follow-up reference policies. Their predecessors are preserved.
- **No further extensive S4 balance sweep.**

**Other systems:**
- **Kept:**
  - the Bestiary, Feat and class-record structures;
  - the 50% bonus-source dominance warning;
  - the hero ×1.5 attack candidate;
  - the modest starter-weapon candidate;
  - the missed 15–25 min first-meaningful-upgrade hypothesis.
- **Future measures:** first Copper upgrade and first substantial equipment investment.
- **Not to be done:**
  - no artificial crafting delay;
  - no reduction of full personal squad EXP;
  - no drastic change to gathering yields.
- **Deferred to full World 1:** complete equipment payback and progression calibration.

**Scope of the S4 seven-day experiments:** they cover 420 active minutes with no offline production. They do not validate feedback behaviour under the complete offline economy.
