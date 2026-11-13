# S1-E06-drop-correctness-b

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Are sampled drop counts consistent with the per-kill odds, with only whole-number grants?

**Design.** Amendment 01: hero frozen at level 100 farming each zone (diagnostic set-up) for 60 min, 100 replicates per zone with independent seeds per zone (over 100,000 kills per zone); pooled counts per resource against the exact two-sided binomial 99.9% interval; ledger balances must equal the counted drops.

**Seeds:** root `S1-E06B`, 100 replicates per cell (replicate i uses `S1-E06B#rep-i`).

**Semantic fingerprint:** `2d073232d8cb72f490f9eec7f8eec82b5f961c8d86990b4a9db45e0a55532388` (manifest SHA-256 `d3e94a0d52b6e9ad6960900175303ae7222865ddba5cad635a90f487cdd57b2f`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | kills | ledgerMismatch |
|---|---|---|---|
| base|Z1|L100 | model-output (diagnostic) | 2395 / 2395 / 2395 | 0 / 0 / 0 |
| base|Z2|L100 | model-output (diagnostic) | 2395 / 2395 / 2395 | 0 / 0 / 0 |
| base|Z3|L100 | model-output (diagnostic) | 1355 / 1361 / 1366 | 0 / 0 / 0 |

## Drop correctness (engineering gate)

| Cell | Resource | Chance | Kills | Observed | Expected | 99.9% interval | Inside | Ledger mismatches |
|---|---|---|---|---|---|---|---|---|
| base|Z1|L100 | res.mat.slime_gel | 3000 bp | 239500 | 71709 | 71850 | [71113, 72589] | yes | 0 |
| base|Z1|L100 | res.rare.test_token | 20 bp | 239500 | 465 | 479 | [409, 553] | yes | 0 |
| base|Z2|L100 | res.mat.wolf_fang | 2500 bp | 239500 | 60048 | 59875 | [59179, 60573] | yes | 0 |
| base|Z2|L100 | res.rare.test_token | 20 bp | 239500 | 434 | 479 | [409, 553] | yes | 0 |
| base|Z3|L100 | res.mat.goblin_scrap | 2000 bp | 136073 | 27117 | 27214.6 | [26730, 27701] | yes | 0 |
| base|Z3|L100 | res.rare.test_token | 20 bp | 136073 | 294 | 272.1 | [220, 328] | yes | 0 |

## Notes and limitations

- Engineering gate: every pooled count inside its interval and zero ledger mismatches.
- The rare item is test-only (res.rare.test_token, 0.2%).
- Registered as amendment 01 after S1-E06 (see AMENDMENT-01.md); S1-E06 is reported unchanged.

