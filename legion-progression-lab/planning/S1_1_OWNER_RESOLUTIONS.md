# S1.1 — owner resolutions after the independent S1.1 review

**Version 1.0, 2026-11-13.**

**Source:** the owner's "S1.1 Acceptance and S2 Authorisation" §3. It records the owner's decisions on the proposals in `S1_1_RESOLUTIONS.md` v1.0, which is kept unchanged as the record of what was proposed. Historical design decisions are not rewritten.

**No candidate numerical coefficient is promoted to approved status** by any resolution below. Thresholds (30% HP, one level, 3 deaths in 5 minutes, cascade limit 8, estimator budgets) remain candidates.

| ID | Owner resolution | What it means for the lab |
|---|---|---|
| S1.1-R01 | Approved: the level-based block for S1. | **S2/S3 note:** reconsider a blocked zone when meaningful combat capability improves: squad changes, equipment, relevant abilities. Not only after a level-up. |
| S1.1-R02 | Approved: the recovery policy and the 30% rest threshold, as candidates. | **Future note:** retreat recommendations should consider survival, not merely whether victory has a nonzero probability. |
| S1.1-R03 | Approved. | Combined policy triggers. |
| S1.1-R04 | Approved as an engineering cascade safeguard. | The limit of 8 decisions per timestamp is an engineering safeguard, not a gameplay rule. |
| S1.1-R05 | Approved. | Manual retry semantics. |
| S1.1-R06 | Approved. | Death window `(t − deathWindowMs, t]`. |
| S1.1-R07 | Approved. | Auto-farm off cancels automatic work; engagement origin. |
| S1.1-R08 | Approved. | Regeneration starts; session-boundary rules; world spawn maintenance. |
| S1.1-R09 | Approved. | Kill-credit identity. |
| S1.1-R10 | Approved, subject to the estimator fallback correction. | Corrected in estimator v1.2 (`S1_1_ACCEPTANCE_ADDENDUM.md`): impossibility is decided before any budget-limited approximation. |
| S1.1-R11 | Approved. | `Report` command. |
| S1.1-R12 | Approved. | Drop events and quantities. |
| S1.1-R13 | Approved. | S1 controls retained; S1 manifests refused by the S1.1 runner. |
| S1.1-R14 | Approved. Continuous farming is a diagnostic estimator reference, not a guaranteed realistic production rate. | Estimator comparisons keep the continuous-farming reference and are labelled as such. |
| S1.1-R15 | Approved. | No oracle is called an upper bound. |

## Time categories in future experiments (owner §3)
Future experiments distinguish:
- **active manual input** (the player issuing commands or fighting by hand);
- **connected time with automation enabled**;
- **resting**;
- **travelling**;
- **waiting** (for example for a respawn);
- **elapsed calendar time**.

All time with automation disabled is **not** to be described as active player input.

**In S1 and S1.1 results:**
- the metric `activeManualMin` (and `activeManualMs`) measures *connected time with auto-farm off*. That includes resting, travelling and waiting, not only active input.
- The S1.1 evidence labels it "Idle (auto-farm off)". S1 used the name `activeManualMin`; read it as "auto-farm off".
- S2 replaces it with the separate categories above (`planning/S2_SPECIFICATION.md`).
