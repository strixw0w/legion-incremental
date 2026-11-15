# S4 pre-registration

**Version 1.0, 2026-11-14.** Registered before any S4 balance comparison ran. `manifests/s4/preregistration.json` holds the SHA-256 of this document and of every manifest.

**Source:** the owner's "S3.1 Final Acceptance and S4 Authorisation" §4, §13–§15, §18; `planning/S4_SPECIFICATION.md`; `planning/S4_RESOLUTIONS.md`.

**Labels.**
- Every input number is a `candidate` (`content/w1-slice-s4.candidate.v0.4.0.json`); every output is a `model-output`.
- **Not changed:** the S1–S3 packs, the S3.1 results and the historical controls.
- **No target moves after results.**

**Disclosure** (what was run before registration):
1. A development probe: one replicate per policy, 90 minutes, seed `probe4#rep-0`. It checked that the S4 cells run and that the monitors report nothing.
2. Three one-replicate arena calibration probes (zone-3 goblin HP ×3, ×4 and ×5; start levels 8/6, 10/8 and 12/10).
   - The first arena draft (HP ×6, enemy attack ×2, levels 8/6) killed the squad within minutes. Two policies then refused the zone as unsafe.
   - **HP ×4, with enemy damage unchanged, and start levels 10/8 were chosen** so that the squad survives and kills are limited by damage, not spawns.
   - No slice coefficient or balance target was set from these probes.
3. Engineering smoke runs of S4-E01, E02 and E05 with 60–300 cases. The seeds differed from the registered ones (`smoke4-*`).

## 1. The four kinds of change (owner §18)
| Kind | What |
|---|---|
| Engineering | the permanent switch, state, bonus registry, Monuments and Buy Max, Bestiary and emblems, Feats, class and roster milestones, event ordering, monitor I22–I28, fixtures and the oracle |
| Measurement | `src/experiments/permanentMetrics.ts` and `s4Metrics.ts`: purchase intervals, system shares, milestone-blocked time, Monument material use, the S4-R24 milestones, session snapshots |
| Policies | POL4-MONUMENT, POL4-BESTIARY, POL4-BALANCED (`src/policy/permanentPolicies.ts`). POL3-DEMAND2 is the industrial reference (owner §4C); POL3-CONQ, POL3-EQUIP and POL3-DEMAND are controls |
| Candidate content variants | starter weapon, hero ×1.5, the diagnostic arena, additive Monument pooling, the ±25% loop parameters (`src/experiments/s4Patch.ts`). None is a baseline |

## 2. Runtime and memory budget (S4-R27)
- **Budget:** each manifest runs within 30 minutes on 15 workers, with the main process under 8 GB resident.
- **Seven-day horizon:** a seven-day run (420 active minutes) took about 5 s in the probes, so it is **run in full**. It is not extrapolated from shorter runs.
- **Calendar time:** passes between sessions without progress, because S4 has no offline settlement. Active and calendar time are both reported.

## 3. Experiments
| ID | Question (owner §13) | Design |
|---|---|---|
| S4-E01 | One-time milestones | `node src/cli/s4-engineering.ts --experiment E01 --n 2000 --seed s4-e01`. Each randomized adversarial scenario has: a random start; random commands (reserve swaps, class switches, recruits, purchases, travel, crafts); injected replayed credits; duplicated and late evaluations; two sessions; two forks; a JSON round trip. Half use the control content and half compressed thresholds |
| S4-E02 | Bonus pool grouping | `--experiment E02 --n 5000 --seed s4-e02`. Each case has random bonus sets on random characters with random equipment, in four variants (control, crit overcap, attack ×20, additive pooling), plus a recruit bought afterwards. Every stat is re-evaluated from individual sources (I24), and the observation's sources are checked against the bonuses in force |
| S4-E05 | Buy Max | `--experiment E05 --n 5000 --seed s4-e05`. Random states (zero, exact prefix, random, very large, no materials, reserved materials) on the real and two synthetic Monuments. The real command runs in a branch and is compared with an independent brute force. Also checked: exact-n purchases, failed purchases leaving everything unchanged, and branch isolation |
| S4-E03 | Feedback elasticity, 7 days | manifest S4-E03-elasticity |
| S4-E04 | Soft-cap behaviour, 7 days | manifest S4-E04-soft-caps, plus the content tables |
| S4-E06 | Monument versus gear spending | manifest S4-E06-investment: the fresh account and the diagnostic arena (owner §4A), the starter weapon, hero ×1.5, an all-Warrior squad, and the permanent-off control |

## 4. Hypotheses and rules
| ID | Role | Statement | Where |
|---|---|---|---|
| H-S4-01 | candidate red flag (M0) | No loop parameter has an elasticity above 1 at the seven-day horizon, for legion EXP, hero EXP, gold earned or the permanent attack bonus, per policy and setting. Above 1 is reported as a sensitivity warning, not as proof of instability | S4-E03 |
| H-S4-02 | engineering | Buy Max equals the brute force in every tested state (0 disagreements); exact purchases agree; failed purchases change nothing; branches are isolated | S4-E05 |
| H-S4-03 | engineering | Every milestone reward is granted once: 0 duplicate grants, 0 monitor violations, 0 record changes outside kill credits, 0 fork mismatches, 0 isolation or round-trip breaks | S4-E01 |
| H-S4-04 | engineering | The breakdown equals the applied stats for every random bonus set (0 I24 violations, 0 observation mismatches) | S4-E02 |
| H-S4-05 | engineering | 0 monitor violations (I1–I28) in every run of every manifest | S4-E03, E04, E06 |
| H-S4-06 | reported (M0 red flags) | The late Monument purchase interval is not shorter than the early one, and no permanent system provides more than 50% of the permanent bonus at the horizon | S4-E03, E04 |
| H-S4-07 | candidate target (owner §4B) | With the starter weapon, the first meaningful upgrade over an already equipped combat item comes at p50 in [15, 25] active min | S4-E06 starter cells |
| H-S4-08 | candidate target (owner §4B) | With the starter weapon, the first simple crafted item comes at p50 in [5, 10] active min | S4-E06 starter cells |

**Reported comparisons (no target):**
- **E06:** every policy against POL3-CONQ, separately on the fresh account and in the arena. Measures:
  - hero and legion EXP, conquest;
  - gold earned, spent and held;
  - gear, permanent bonuses, materials and professions;
  - kills per hour, opportunity cost.

  Also: POL4-BESTIARY's earlier-zone farming; the all-Warrior squad's class rewards; the permanent switch on against off; hero ×1.5; the starter weapon's milestones.
- **E03:** the elasticity table, purchase intervals, system shares.
- **E04:** costs, marginal bonus and ROI per level; time to the next affordable level from the measured gold income; milestone-blocked time; levels reached; additive pooling against the control.

**Engineering gates:**
- `--verify` matches every fingerprint;
- S4-E06 passes a determinism re-run with the second seed root `s4-e06-second`;
- S4-E06 gives the same fingerprint with the reference ledger;
- every historical S1.1–S3.1 experiment re-verifies with the final code.

**Order of running:** E01, E02, E05, then E06, E04, E03.
