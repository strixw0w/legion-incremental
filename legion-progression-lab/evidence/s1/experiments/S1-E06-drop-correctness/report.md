# S1-E06-drop-correctness

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Are sampled drop counts consistent with the per-kill odds, with only whole-number grants?

**Design.** Hero frozen at level 100 farming each zone (diagnostic set-up) for 30 min, 50 replicates per zone (over 100,000 kills per zone); pooled counts per resource against the exact two-sided binomial 99.9% interval; ledger balances must equal the counted drops.

**Seeds:** root `S1-E06`, 50 replicates per cell (replicate i uses `S1-E06#rep-i`).

**Semantic fingerprint:** `b91e47e564b3e6cc336c080e26ef2e2334f3fbf436c6c391580cd78a9afc17b6` (manifest SHA-256 `d2992ce562322cfeeb52c204b8065ef161c290f31159347e0cd4f57ab313331d`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | kills | ledgerMismatch |
|---|---|---|---|
| base|Z1|L100 | model-output (diagnostic) | 1195 / 1195 / 1195 | 0 / 0 / 0 |
| base|Z2|L100 | model-output (diagnostic) | 1195 / 1195 / 1195 | 0 / 0 / 0 |
| base|Z3|L100 | model-output (diagnostic) | 674 / 678 / 682 | 0 / 0 / 0 |

## Drop correctness (engineering gate)

| Cell | Resource | Chance | Kills | Observed | Expected | 99.9% interval | Inside | Ledger mismatches |
|---|---|---|---|---|---|---|---|---|
| base|Z1|L100 | res.mat.slime_gel | 3000 bp | 59750 | 17701 | 17925 | [17557, 18294] | yes | 0 |
| base|Z1|L100 | res.rare.test_token | 20 bp | 59750 | 114 | 119.5 | [85, 157] | yes | 0 |
| base|Z2|L100 | res.mat.wolf_fang | 2500 bp | 59750 | 14803 | 14937.5 | [14590, 15287] | yes | 0 |
| base|Z2|L100 | res.rare.test_token | 20 bp | 59750 | 114 | 119.5 | [85, 157] | yes | 0 |
| base|Z3|L100 | res.mat.goblin_scrap | 2000 bp | 33930 | 6604 | 6786 | [6545, 7029] | yes | 0 |
| base|Z3|L100 | res.rare.test_token | 20 bp | 33930 | 66 | 67.9 | [42, 97] | yes | 0 |

## Notes and limitations

- Engineering gate: every pooled count inside its interval and zero ledger mismatches.
- The rare item is test-only (res.rare.test_token, 0.2%).

