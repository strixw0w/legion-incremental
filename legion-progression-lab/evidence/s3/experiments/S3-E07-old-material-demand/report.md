# S3-E07-old-material-demand

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** After the first Copper item, how much Wood-tier material (planks, gel, logs) is still consumed, i.e. do earlier materials keep a use?

**Design.** PR-OPT (90 min) campaigns of four POL3 strategies; the monitor counts materials consumed (crafting, enhancement, production inputs) and gathered after the first Copper item. 100 replicates.

**Seeds:** root `s3-e07`, 100 replicates per cell. **Semantic fingerprint:** `bb9f24f5ae22985522d65a4dc14dca77d4bd4f9eb7893cd75fb58dbaa30076b4` (manifest SHA-256 `80a50bed57dca232e4f17ba41d589bac6d22eacb03d6f4091f1acd295182c0c0`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-COMBAT | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-EQUIP | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-PROF | 0 | pass |
| H-S3-01 | No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9) | engineering | max == 0 violations | PR-OPT|POL3-BAL | 0 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | firstCopperItemMin | planksAfterCopper | gelAfterCopper | logsConsumedAfterCopper | logsGatheredAfterCopper | craftedCopper | invariantViolations |
|---|---|---|---|---|---|---|---|---|
| PR-OPT|POL3-COMBAT | model-output (realistic) | 10.89 / 10.97 / 11.03 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 3455 / 3458 / 3462 | 2 / 2 / 2 | 0 / 0 / 0 |
| PR-OPT|POL3-EQUIP | model-output (realistic) | not reached / not reached / not reached | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| PR-OPT|POL3-PROF | model-output (realistic) | 14.04 / 14.19 / 14.45 | 0 / 0 / 0 | 0 / 0 / 0 | 4 / 4 / 4 | 4463 / 4476 / 4485 | 5 / 5 / 5 | 0 / 0 / 0 |
| PR-OPT|POL3-BAL | model-output (realistic) | 12.11 / 12.20 / 12.27 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 3926 / 3932 / 3937 | 2 / 2 / 2 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

400 runs, 111606902 checks, **0 violations**.

## Notes and limitations

- Runs that never craft a Copper item report the after-Copper counts as 0 and firstCopperItemMin as not reached.

