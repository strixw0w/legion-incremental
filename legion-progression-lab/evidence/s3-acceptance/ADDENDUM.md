# S3 acceptance addendum: a dead hero cannot craft

**Version 1.0, 2026-11-14.** Source: the owner's "S3.1 Final Acceptance and S4 Authorisation" §2. This is the small crafting correction on which the S3 and S3.1 acceptance depends (`planning/S3_ACCEPTANCE_RESOLUTION.md`).

**The scope was not widened** and no separate S3.2 increment was opened, because the correction exposed no broader defect (§4).

## 1. The finding (independent reviewer)
- **The cause:** recruit knockouts are `CharacterState.knockedOut`, but hero death is `HeroState.status === 'dead'`. The S3.1 `crafterBlocker` checked only the former.
- **The reproduction:**
  - a diagnostic hero with 4 planks;
  - zone-1 enemies with 100,000 HP and 1,000,000 attack milli;
  - auto-farming;
  - on the first observation with the hero dead, `Craft { crafterId: hero, recipeId: recipe.wood.club }`.
- **What happened:** the hero died at 10,000 ms, the craft succeeded at 10,000 ms, a Wooden Club was created, the hero received 4 Smithing EXP, and it respawned at 15,000 ms. The monitor reported 0 violations.

## 2. The correction
| Place | Change |
|---|---|
| `src/engine/industry.ts` `crafterBlocker` | The hero is refused while `HeroState.status === 'dead'` (from `HeroDied` to `HeroRespawned`): new reason code `CRAFTER_DEAD`. Order: reserve, knocked out, dead, encounter, other work. |
| Crafting observation (`industryObservation.ts`) | Unchanged code: `qualified` already uses `crafterBlocker`, so a dead hero is no longer offered. `levelQualified` still lists it. |
| Engine defensive guard (`legion.ts` `applyIndustry`) | Unchanged code: it calls the same `crafterBlocker`, so it enforces the same contract. |
| Monitor I20 (`industryMetrics.ts`) | The independent re-statement now also treats a dead hero as ineligible, and its message names it. |
| `src/model/industryTypes.ts` | Reason code `CRAFTER_DEAD` added. |
| `spec/formulas/s3-industry.md` | v1.2 section: the dead hero and the clarified contract. |
| `repro/s3.1/attribution_check.py` | The temporary "S3 rule" restore also removes the dead-hero line, so it still restores the S3 rule exactly. |

**Clarified contract.** Instant crafting is an account menu action by a free crafter:
- **Refused:** a reserve, knocked-out or dead crafter; a crafter in an encounter (including a boss fight); a crafter with other productive work (`CRAFTER_WORKING`).
- **Allowed for the hero,** because none of these is an encounter or production:
  - **travelling** between zones;
  - a **pending engagement**: walking to a target, when no encounter exists until the hero arrives;
  - **regeneration**: resting, or regenerating while idle.

  An instant craft interrupts none of them; the walk, the travel and the rest complete as scheduled (tested).
- **Unchanged:** legitimate crafting between fights.

## 3. Tests and mutation checks
**`test/s3_acceptance.crafting.test.ts`** has four tests:
1. **The reviewer's reproduction, with an actual hero death:**
   - the craft on the first observation with the hero dead is refused (`CRAFTER_DEAD`);
   - no club and no EXP from that attempt;
   - one club is made after the respawn, with exactly 4 Smithing EXP in total;
   - the monitor is clean.
2. **The menu:** a dead hero is not in `qualified`, but is in `levelQualified`.
3. **The engine guard and the monitor:** the guard refuses a dead hero even if validation were bypassed, and I20 reports a forged dead-hero craft.
4. **Travel, pending engagement and regeneration** do not block crafting; the engagement still ends in a kill, the travel arrives and the rest completes.

Before the fix, tests 1–3 failed (the reproduction).

**Mutation checks:** **All 42 planted bugs were detected, and every file was restored and re-hashed.**

| Check | Result | File |
|---|---|---|
| New, for this correction (A1–A5) | **5 / 5** | mutation-check-acceptance.txt |
| S3.1 (X1–X16) | **16 / 16** | mutation-check-s3.1.txt |
| S3, re-run on the corrected code (W17 left out, as in S3.1) | **21 / 21** | mutation-check-s3-rerun.txt |

The five new planted bugs:
- **A1:** a dead hero may craft (the finding).
- **A2:** I20 ignores a dead hero.
- **A3–A5:** travel, resting or a pending engagement would block crafting, contradicting the clarified contract.

## 4. Focused regression comparison
**Result: no historical result changed** (regression-run.txt: 20 MATCH, 0 MISMATCH). Every registered experiment was re-run with the corrected code and compared with its stored fingerprint:

| Re-verified | Result | Compared with |
|---|---|---|
| All eight S3.1 manifests (E02–E06, E08, and the amendment's E09 and E10) | **8 / 8 MATCH** | `results/s3.1` (the packaged S3.1 fingerprints) |
| The nine S3 regression re-runs (S3-E02, E03, E04, E05, E07, E08, E09, E10, E12) | **9 / 9 MATCH** | `results/s3.1/audit` |
| Historical spot checks with the industry switch off (S1.1-E03, S2-E04, S2.1-E03) | **3 / 3 MATCH** | their baselines |

**Why nothing changed:** none of the registered strategies ever tried to craft with a dead hero.
- They craft rarely.
- Hero deaths are rare in the campaigns.
- POL3-DEMAND crafts only when the wearer is not in combat, and the S3 strategies craft between fights.

**Spot checks only, by design.** With the industry switch off, the changed code is unreachable, so the full 19-experiment historical regression was not repeated. The S3.1 package's full historical regression (evidence/s3.1/historical-regression.txt, 19 / 19 MATCH) was run on the same code apart from this correction.

**Attribution re-run** (attribution-check.txt). With the S3 crafter rule restored (now also allowing a dead hero), all 75 changed S3 cells again equal the stored S3 results. The S3.1 conclusion stands: every S3 regression change comes from the crafting-eligibility rule.

## 5. Verification suite
| Check | Result |
|---|---|
| Type check | pass |
| Default tests | **1,121 passed** (37 files: the 1,116 of S3.1 plus the 4 new acceptance tests and the isolation test for the new test file) |
| Statistical tests | **9 passed** |
| Fixture conformance | **422 cases, 0 problems** |
| Python oracle | **18 groups, 0 failing** |

**Files in this folder:**
- ADDENDUM.md (this file);
- regression-run.txt;
- attribution-check.txt;
- mutation-check-acceptance.txt, mutation-check-s3.1.txt and mutation-check-s3-rerun.txt;
- typecheck.txt, test-output.txt, test-stats-output.txt, fixtures-check.txt, schemas-check.txt and oracle-check.txt.

The S3.1 package evidence (`evidence/s3.1/`) is unchanged.
