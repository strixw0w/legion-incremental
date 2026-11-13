# S1.1-E05-drops-quantities

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** With structured drops, does every drop entry hit its probability, and does every awarded quantity, including quantities above 1 and two entries for one resource, equal the ledger?

**Design.** As S1-E06b (level 100, frozen, zones 1-3, 60 minutes, 100 replicates, independent seeds per cell) for the base content and the diagnostic 'qty-test' slime table (gel 30% x3, gel 50% x2, token 0.2% x1). One exact binomial check per entry (alpha 0.001); quantities checked against the ledger in every run.

**Seeds:** root `S1.1-E05`, 100 replicates per cell (replicate i uses `S1.1-E05#rep-i`).

**Semantic fingerprint:** `fe72f1a3f7804d2c7ac9c32ccca8bbf563103c36bd15fe48ac144b1156552bc0` (manifest SHA-256 `4dce1d15b8928742865b0f12dcfb9d9b4b3ae90c434c375674d76dfb8234acdf`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | kills | ledgerMismatch |
|---|---|---|---|
| base|Z1|L100 | model-output (diagnostic) | 2395 / 2395 / 2395 | 0 / 0 / 0 |
| base|Z2|L100 | model-output (diagnostic) | 2395 / 2395 / 2395 | 0 / 0 / 0 |
| base|Z3|L100 | model-output (diagnostic) | 1356 / 1360 / 1366 | 0 / 0 / 0 |
| qty-test|Z1|L100 | model-output (diagnostic) | 2395 / 2395 / 2395 | 0 / 0 / 0 |
| qty-test|Z2|L100 | model-output (diagnostic) | 2395 / 2395 / 2395 | 0 / 0 / 0 |
| qty-test|Z3|L100 | model-output (diagnostic) | 1355 / 1360 / 1365 | 0 / 0 / 0 |

## Drop correctness (engineering gate)

| Cell | Resource | Chance | Kills | Observed | Expected | 99.9% interval | Inside | Ledger mismatches |
|---|---|---|---|---|---|---|---|---|
| base|Z1|L100 | res.mat.slime_gel | 3000 bp | 239500 | 72071 | 71850 | [71113, 72589] | yes | 0 |
| base|Z1|L100 | res.rare.test_token | 20 bp | 239500 | 478 | 479 | [409, 553] | yes | 0 |
| base|Z2|L100 | res.mat.wolf_fang | 2500 bp | 239500 | 60403 | 59875 | [59179, 60573] | yes | 0 |
| base|Z2|L100 | res.rare.test_token | 20 bp | 239500 | 455 | 479 | [409, 553] | yes | 0 |
| base|Z3|L100 | res.mat.goblin_scrap | 2000 bp | 136055 | 27198 | 27211 | [26726, 27697] | yes | 0 |
| base|Z3|L100 | res.rare.test_token | 20 bp | 136055 | 262 | 272.1 | [220, 328] | yes | 0 |
| qty-test|Z1|L100 | res.mat.slime_gel | 3000 bp | 239500 | 71623 | 71850 | [71113, 72589] | yes | 0 |
| qty-test|Z1|L100 | res.mat.slime_gel | 5000 bp | 239500 | 119906 | 119750 | [118945, 120555] | yes | 0 |
| qty-test|Z1|L100 | res.rare.test_token | 20 bp | 239500 | 495 | 479 | [409, 553] | yes | 0 |
| qty-test|Z2|L100 | res.mat.wolf_fang | 2500 bp | 239500 | 59568 | 59875 | [59179, 60573] | yes | 0 |
| qty-test|Z2|L100 | res.rare.test_token | 20 bp | 239500 | 475 | 479 | [409, 553] | yes | 0 |
| qty-test|Z3|L100 | res.mat.goblin_scrap | 2000 bp | 136041 | 26948 | 27208.2 | [26724, 27695] | yes | 0 |
| qty-test|Z3|L100 | res.rare.test_token | 20 bp | 136041 | 281 | 272.1 | [220, 328] | yes | 0 |

## Notes and limitations

- S1.1 correction pass (owner review 'Independent S1 Review and S1.1 Authorisation'). Single-character diagnostic model; no recruits, classes, abilities, gear, sinks, offline progress or Monuments.
- All inputs are candidates (content w1-slice.candidate.v0.1.0, unchanged; owner resolutions S1-R01..R17; S1.1 rules S1.1-R01..R15); every output is model-output, not live-validated.
- Policies: POL-* are the corrected S1.1 realistic policies; CTL-*-S1 are the S1 decision logic kept as diagnostic controls; ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control, never an upper bound.
- Seeds: the same seed roots as the corresponding S1 experiments, so S1, controls and corrected policies face the same random draws.
- Engineering gate A3: every entry inside its interval; 0 ledger mismatches; MetricsRecorder refuses any run whose quantities differ from the ledger.

