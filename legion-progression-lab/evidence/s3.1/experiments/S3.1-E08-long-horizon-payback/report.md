# S3.1-E08-long-horizon-payback

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Over 180 minutes, does POL3-DEMAND (which returns its industrial recruits to combat once no useful upgrade remains) recover the opportunity cost of its equipment investment against pure combat, and when?

**Design.** POL3-CONQ and POL3-DEMAND from a fresh account and from the matched mid-game start, 180 min, snapshots every 15 min. 50 replicates.

**Seeds:** root `s3.1-e08`, 50 replicates per cell. **Semantic fingerprint:** `c180715752b71a3385dae867edb507e495db2862b791ba533375462ec71e3933` (manifest SHA-256 `70d77543fbc800fadd6524b875e6b10b0af7ca8742d96fe7435ea544674e2315`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-CONQ | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | fresh|POL3-DEMAND | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | midgame|POL3-DEMAND | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-CONQ | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | fresh|POL3-DEMAND | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | midgame|POL3-DEMAND | 1 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | legionExpAt30 | legionExpAt60 | legionExpAt90 | legionExpAt120 | legionExpAt150 | legionExpTotal | heroExpAt60 | expTotal | equipmentValue | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|
| fresh|POL3-CONQ | model-output (realistic) | 69036 / 69388 / 69740 | 174636 / 174988 / 175340 | 280236 / 280588 / 280940 | 385836 / 386188 / 386540 | 491436 / 491788 / 492140 | 597036 / 597388 / 597740 | 44324 / 44412 / 44500 | 149924 / 150012 / 150100 | 0 / 0 / 0 | 0 / 0 / 0 |
| midgame|POL3-CONQ | model-output (realistic) | 85352 / 85704 / 85968 | 190952 / 191304 / 191568 | 296552 / 296904 / 297168 | 402152 / 402504 / 402768 | 507752 / 508104 / 508368 | 613352 / 613704 / 613968 | 48038 / 48126 / 48192 | 153638 / 153726 / 153792 | 0 / 0 / 0 | 0 / 0 / 0 |
| fresh|POL3-DEMAND | model-output (realistic) | 33626 / 47362 / 48792 | 113000 / 152962 / 154392 | 192200 / 258562 / 259992 | 271400 / 364162 / 365592 | 350600 / 469762 / 471192 | 429800 / 575362 / 576792 | 38306 / 40396 / 40694 | 143906 / 145996 / 146294 | 0.32 / 0.43 / 0.43 | 0 / 0 / 0 |
| midgame|POL3-DEMAND | model-output (realistic) | 28556 / 34532 / 39446 | 134156 / 140132 / 145046 | 239756 / 245732 / 250646 | 345356 / 351332 / 356246 | 450956 / 456932 / 461846 | 556556 / 562532 / 567446 | 35288 / 36726 / 38202 | 140888 / 142326 / 143802 | 0.43 / 0.43 / 0.43 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

200 runs, 81682775 checks, **0 violations**.

## Notes and limitations

- Payback (S3.1-R12, H-S3.1-05) is derived from the snapshot means by src/cli/s31-analyse.ts; failure is reported as "none within the horizon".

