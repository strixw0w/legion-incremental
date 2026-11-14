# S3 experiment directions (prepared, NOT implemented)

**Version 1.0, 2026-11-13.** Source: owner "Independent L1/S2 Review and S2.1 Authorisation" §7. **S3 is not authorised.** This document prepares directions so that S3 can start without another planning phase. Nothing here is built or run.

**Standing rules for S3:**
- **Preserve controls.** Keep the single-character S1.1 control and the S2 / S2.1 controls (same seeds, content and policies) in every comparison.
- **Investigate systems together.** Hero power, abilities, equipment, pacing and investment interact; do not tune them one at a time to a target.
- **Do not reduce full individual squad EXP** merely because it accelerates progression; it is an approved mechanic.
- **Do not raise every enemy's HP** to force a pacing result.
- **Labels.** Every candidate value stays labelled; no coefficient is promoted without the owner.

## Directions
| ID | Direction | Variants (candidate) | Primary measures |
|---|---|---|---|
| A | Hero base damage multiplier | Hero base attack ×1.5 and ×2.0 vs control (recruits unchanged) | Hero damage share (passive), hero and legion EXP, pacing to levels 5 / 10 and zones |
| B | Stronger manual hero abilities | Hero ability multiplier and cooldown variants; attentive vs passive | Effective damage share, the share from the ability, pacing |
| C | Combined moderate advantage | Base ×1.25 with a stronger ability | As A and B; is the combination more efficient than either alone? |
| D | Hero-exclusive equipment advantages | Equipment slots or bonuses only the hero can use (S3 equipment content) | Damage share; how relevant the hero stays as the deploy cap rises |
| E | Independent pacing sensitivity | EXP requirements (curve parameters), enemy HP per zone (not uniformly), recruit unlock milestones, conquest (gate) requirements, each varied alone around the control | Level, zone and recruit timings against the pre-registered targets |
| F | Knockout sensitivity matrix | See below | Knockout and death rates, recovery share, production |
| G | Investment strategy | Equipment vs recruitment vs production investment policies at matched gold budgets | Hero EXP, legion EXP, gold, conquest; per objective |
| H | Effective vs raw damage | Damage contribution net of overkill (effective) vs raw damage | Hero share both ways; how much of the hero's damage is overkill |

## F — knockout sensitivity matrix (thresholds fixed before any run)
- **Design:**
  - squad sizes 1, 2, 3;
  - character levels 1, 5, 10, at a fixed zone ladder (zones 1–3);
  - enemy damage ×1, ×1.5, ×2, ×3;
  - realistic squad policy, with resting allowed, and continuous farming as a reference;
  - PR-BAL;
  - 100 replicates.
- **"Generates knockouts":** a cell's p50 member knockouts per hour ≥ 1. The matrix is informative only if at least 50% of its cells generate knockouts; otherwise its range is widened before any conclusion (a registered amendment).
- **Thresholds of interest (reported, not targets):**
  - knockouts per hour of 1, 5 and 20;
  - recovery share of member time ≥ 10%;
  - hero deaths per hour ≥ 1;
  - auto-farm stops ≥ 1 per session.
- **Controls:**
  - the same matrix without recruits (single hero);
  - the S2-E07 cells (which generated no knockouts) for continuity.
- **S2.1 contribution:** S2.1-E03 runs a small matched diagnostic (levels 1 and 5, zones 2 and 3, squads 1–3, enemy damage ×1 and ×2) to show that such cells do generate knockouts and to calibrate the S3 ranges. It is not the S3 matrix.

## Open questions for the owner before S3
- Which direction(s) to run first, and the candidate ranges for A–E.
- Whether hero-exclusive equipment (D) is in S3 scope with Smithing, or later.
- The investment-policy definitions for G (fixed budgets or fixed session lengths).
