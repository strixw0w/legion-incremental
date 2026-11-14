# S3.1 amendment 01: POL3-DEMAND stop rule (a follow-up, registered after the results)

**Registered 2026-11-14, after every registered S3.1 experiment had run and before this follow-up ran.** It is appended to `manifests/s3.1/preregistration.json` under `amendments`. The original registration, the registered POL3-DEMAND (version 1) and every registered result are unchanged. This is a post-results follow-up and is reported as one: it does not replace any registered outcome.

## Why
**What the results showed.** In the registered S3.1-E08 results, POL3-DEMAND crafted nothing after 30 minutes from the fresh-account start. Even so:
- its materials held kept rising, from 86 at 30 min to 1,175 at 165 min (means);
- its profession levels kept rising;
- its late legion EXP rate stayed at 96% of POL3-CONQ's.

**The cause, found by reading the policy.** When no candidate upgrade remains, POL3-DEMAND computes no material need at all: the need is zero instead of "required minus held". Its stop rule keeps a gatherer working until the need is GATHER_STOP_MARGIN units below zero. A need of zero never gets there, so a gatherer already assigned is never released.

This defect breaks owner §6 ("stop stockpiles", "return workers to combat"). It was found after the results. It is not a tuning change.

## What is added
- **POL3-DEMAND2** (POL3-DEMAND version 1.1, `makePol3Demand(id, over, 2)`): identical, except for the case where no candidate remains. The stop rule then still counts the materials held and the open jobs, so an assigned gatherer stops once it holds more than GATHER_STOP_MARGIN units beyond what open jobs need.
  - No constant changes.
  - POL3-DEMAND (version 1) is unchanged, so every registered result still reproduces.
- **S3.1-E09-demand-stop-payback** uses the S3.1-E08 design:
  - fresh-account and mid-game starts, 180 min, snapshots every 15 min;
  - 50 replicates, the same seed root `s3.1-e08`;
  - three strategies: POL3-CONQ, POL3-DEMAND and POL3-DEMAND2.
- **S3.1-E10-demand-stop-content** uses the eight POL3-DEMAND cells of S3.1-E04:
  - PR-OPT, 90 min;
  - the control, four candidate content variants and three sensitivity variants;
  - 50 replicates, the same seed root `s3.1-e04`;
  - each cell also run with POL3-DEMAND2.

Both experiments use the same seeds and the same cells as the originals. So their POL3-CONQ and POL3-DEMAND cells must reproduce S3.1-E08 and S3.1-E04 exactly. This is a built-in check.

## Rules (fixed now, before the run)
- **H-S3.1-05 (payback)** is reported for POL3-DEMAND2 under the same rule. The registered H-S3.1-05 outcome for POL3-DEMAND stands.
- **Reported measures, with no target:**
  - each strategy's late legion EXP rate (90–180 min) against POL3-CONQ;
  - materials held at 30, 90 and 165 min;
  - gathering minutes, excess gathered units and reassignable gathering minutes;
  - in S3.1-E10, each variant's change against the control, for POL3-DEMAND and POL3-DEMAND2 separately.
- **Registered conclusions stay.** POL3-DEMAND2 is reported next to them as a follow-up and replaces none of them. If POL3-DEMAND2 is carried forward, it is the policy for the next increment's registration.
