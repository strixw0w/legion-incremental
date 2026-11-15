# S4 amendment 01: the Monument policies' purchase rule (a follow-up, registered after the results)

**Registered 2026-11-14, after the registered S4 experiments had run and before this follow-up ran.** It is appended to `manifests/s4/preregistration.json` under `amendments`. The original registration, the registered POL4-MONUMENT and POL4-BALANCED (version 1) and every registered result are unchanged. This is a post-results follow-up and is reported as one.

## Why
**What the results showed.** In the registered S4-E04 and S4-E03 results, POL4-MONUMENT's Monument levels stopped growing within the first day (17.2 levels on every day from 1 to 7):
- 98,574 gold was earned, but only 1,197 was spent on Monuments;
- for 404 of 420 active minutes a Monument level was affordable in gold but waited for materials.

POL4-BALANCED behaved the same way (7.4 levels).

**The cause, found by reading the policy.** Version 1 picks the best next Monument level by bonus per gold and buys nothing when that level is not affordable. The Monument of Vitality's level-10 milestone needs planks, which POL4-MONUMENT never produces (it has no industry). Once that level ranks best, it blocks every other purchase for the rest of the run.

This flaw in the registered policy (not in the engine) drives the S4-E04 soft-cap and S4-E03 Monument-loop results. It was found after the results. It is not a tuning change.

## What is added
- **POL4-MONUMENT2 and POL4-BALANCED2** (version 1.1): the best level is chosen **among those affordable now** (gold, including the reserve, and milestone materials). POL4-BALANCED2 still turns the best blocked level's plank or bar shortfall into production, as version 1 did. No constant changes. Version 1 is unchanged, so every registered result still reproduces.
- **S4-E07-investment-v11:** S4-E06's fresh-account and arena cells for POL3-CONQ, POL3-DEMAND2, POL4-MONUMENT and POL4-BALANCED, with POL4-MONUMENT2 and POL4-BALANCED2 added, plus hero ×1.5 and the starter weapon for POL4-BALANCED2. Same seeds (`s4-e06`) and 50 replicates.
- **S4-E08-elasticity-v11:** S4-E03 with POL4-BALANCED2 and POL4-MONUMENT2 in place of version 1, plus the version 1 control cells. Same seeds (`s4-e03`) and 20 replicates.
- **S4-E09-soft-caps-v11:** S4-E04 with version 1.1 alongside the version 1 cells. Same seeds (`s4-e04`) and 30 replicates.

**Built-in check.** Every follow-up cell that also exists in its original manifest must reproduce it exactly.

## Rules (fixed now, before the run)
- **H-S4-01 and H-S4-06** are derived again for version 1.1 under the same rules. The registered outcomes for version 1 stand.
- **Reported:**
  - the E06 comparisons for version 1.1;
  - Monument levels per day and gold spent;
  - milestone-blocked time, purchase intervals and system shares.
- **Registered conclusions stay.** Version 1.1 is reported beside them as a follow-up.
