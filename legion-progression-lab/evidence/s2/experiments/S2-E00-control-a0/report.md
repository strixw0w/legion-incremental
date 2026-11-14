# S2-E00-control-a0

**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** Does the S2 engine, with the hero alone, classless and every S2 feature off, reproduce the S1.1 base metric summaries exactly (same seeds)?

**Design.** S1.1 policies POL-STAY and POL-FRONTIER, PR-NEW and PR-BAL, base variant a10-p1.6-g100, the S1-E01 seed root and 200 replicates, exactly as S1.1-E01. Analysis B0 compares every metric summary present in both with S1.1-E01 cells <variant>|<profile>|<policy>|est-s1.1.

**Seeds:** root `S1-E01`, 200 replicates per cell. **Semantic fingerprint:** `bdebfcd69b2e811153a52943bac6fd9bda1c41eef7fb81f847658998b7466457` (manifest SHA-256 `d7b99c07302d657dc0fdd4611a2499d17a3589375f05c7d3ce62fd9ab879fa63`).

## Cells (p10 / p50 / p90)

| Cell | Tag | firstKillS | killsToL2 | minToL5 | minToL10 | zone2FirstVisitMin | zone3FirstVisitMin | deathsPerHour | levelAt45 | expTotal | autoFarmStops |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|PR-NEW|POL-STAY | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 16.25 / 16.35 / 16.45 | 0 / 0 / 0 | 16 / 16 / 16 | 5032 / 5054 / 5076 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-NEW|POL-FRONTIER | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 0 / 0 / 0 | 17 / 17 / 17 | 5802 / 5824 / 5846 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL-STAY | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 16.25 / 16.35 / 16.45 | 0 / 0 / 0 | 16 / 16 / 16 | 7364 / 7386 / 7430 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL-FRONTIER | model-output (control) | 10.40 / 10.40 / 10.40 | 3 / 3 / 3 | 2.43 / 2.45 / 2.47 | 14.06 / 14.16 / 14.26 | 5.02 / 5.08 / 5.12 | 37.98 / 38.14 / 38.28 | 0 / 0 / 0 | 17 / 17 / 17 | 8178 / 8200 / 8244 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

800 runs, 0 checks, **0 violations**.

## Notes and limitations

- All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.
- Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.
- Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).
- Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.
- Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.
- Gate B0: the S2 engine must reproduce S1.1 exactly; any difference is an engine defect, not a balance result.

