# S3.1-E09-demand-stop-payback

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Amendment 01 (post-results follow-up): with the stop rule corrected (POL3-DEMAND2), does the demand-aware policy stop stockpiling once nothing is left to build, return its gatherers to combat, and recover its investment against pure combat within 180 minutes?

**Design.** As S3.1-E08 (fresh and mid-game, 180 min, snapshots every 15 min, 50 replicates, the same seed root), with POL3-DEMAND2 added; the POL3-CONQ and POL3-DEMAND cells reproduce S3.1-E08.

**Seeds:** root `s3.1-e08`, 50 replicates per cell. **Semantic fingerprint:** `e6b5b2842d17134cc0eeb9d8876181917a07e3d629dac737df00827a92e0be4b` (manifest SHA-256 `f2fc61a6dec2e38341a3d282c1820652ee2ee7eda0d13a9f55a457c401a9a974`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-DEMAND2 | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-DEMAND2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-DEMAND2 | 1 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | legionExpAt30 | legionExpAt60 | legionExpAt90 | legionExpAt120 | legionExpAt150 | legionExpTotal | heroExpAt60 | expTotal | equipmentValue | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|
| fresh|POL3-CONQ | model-output (realistic) | 69036 / 69388 / 69740 | 174636 / 174988 / 175340 | 280236 / 280588 / 280940 | 385836 / 386188 / 386540 | 491436 / 491788 / 492140 | 597036 / 597388 / 597740 | 44324 / 44412 / 44500 | 149924 / 150012 / 150100 | 0 / 0 / 0 | 0 / 0 / 0 |
| midgame|POL3-CONQ | model-output (realistic) | 85352 / 85704 / 85968 | 190952 / 191304 / 191568 | 296552 / 296904 / 297168 | 402152 / 402504 / 402768 | 507752 / 508104 / 508368 | 613352 / 613704 / 613968 | 48038 / 48126 / 48192 | 153638 / 153726 / 153792 | 0 / 0 / 0 | 0 / 0 / 0 |
| fresh|POL3-DEMAND | model-output (realistic) | 33626 / 47362 / 48792 | 113000 / 152962 / 154392 | 192200 / 258562 / 259992 | 271400 / 364162 / 365592 | 350600 / 469762 / 471192 | 429800 / 575362 / 576792 | 38306 / 40396 / 40694 | 143906 / 145996 / 146294 | 0.32 / 0.43 / 0.43 | 0 / 0 / 0 |
| midgame|POL3-DEMAND | model-output (realistic) | 28556 / 34532 / 39446 | 134156 / 140132 / 145046 | 239756 / 245732 / 250646 | 345356 / 351332 / 356246 | 450956 / 456932 / 461846 | 556556 / 562532 / 567446 | 35288 / 36726 / 38202 | 140888 / 142326 / 143802 | 0.43 / 0.43 / 0.43 | 0 / 0 / 0 |
| fresh|POL3-DEMAND2 | model-output (realistic) | 35874 / 47682 / 48718 | 141474 / 153282 / 154318 | 247074 / 258882 / 259918 | 352674 / 364482 / 365518 | 458274 / 470082 / 471118 | 563874 / 575682 / 576718 | 37446 / 40472 / 40716 | 143046 / 146072 / 146316 | 0.43 / 0.43 / 0.43 | 0 / 0 / 0 |
| midgame|POL3-DEMAND2 | model-output (realistic) | 24346 / 29622 / 36568 | 129946 / 135222 / 142168 | 235546 / 240822 / 247768 | 341146 / 346422 / 353368 | 446746 / 452022 / 458968 | 552346 / 557622 / 564568 | 34284 / 35510 / 37366 | 139884 / 141110 / 142966 | 0.43 / 0.43 / 0.43 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

300 runs, 127187358 checks, **0 violations**.

## Notes and limitations

- Registered as amendment 01 after the registered results (manifests/s3.1/AMENDMENT-01.md); reported as a follow-up, never in place of a registered outcome.
- H-S3.1-05 payback for POL3-DEMAND2 is derived by src/cli/s31-analyse.ts under the registered rule.

