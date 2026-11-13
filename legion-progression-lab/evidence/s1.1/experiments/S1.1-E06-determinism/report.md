# S1.1-E06-determinism

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Is the corrected engine still deterministic (identical re-runs, different second seeds, no distribution change across seed roots)?

**Design.** As S1-E07 with the corrected policies: variants a10-p1.6-g100 and a12-p2.0-g150, PR-BAL, POL-FRONTIER, POL-STAY, POL-BEST-SHOWN, 200 replicates; re-run with the same root and run with a second root; two-sample KS at alpha 0.001.

**Seeds:** root `S1-E07`, 200 replicates per cell (replicate i uses `S1-E07#rep-i`).

**Semantic fingerprint:** `6d3ff33d3d3333bf07cfaa76733606255d2d812e3d55b123b19f4e072380919c` (manifest SHA-256 `f36833e76191cba80f7ef6c3ba81ab05097753933029b3b50ed7d736ebc3d436`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | firstKillS | minToL5 | zone2FirstVisitMin | expTotal |
|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2.43 / 2.45 / 2.47 | 5.02 / 5.06 / 5.12 | 8178 / 8200 / 8244 |
| a10-p1.6-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2.43 / 2.45 / 2.47 | 5.02 / 5.06 / 5.12 | 7364 / 7386 / 7430 |
| a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2.43 / 2.45 / 2.47 | 6.11 / 6.17 / 6.23 | 9290 / 9310 / 9330 |
| a12-p2.0-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4.40 / 4.44 / 4.46 | 7.35 / 7.41 / 7.45 | 6960 / 6990 / 7010 |
| a12-p2.0-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4.40 / 4.44 / 4.46 | 7.35 / 7.41 / 7.45 | 5342 / 5342 / 5364 |
| a12-p2.0-g150|PR-BAL|POL-BEST-SHOWN | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4.40 / 4.44 / 4.46 | 12.73 / 12.81 / 12.89 | 7370 / 7394 / 7418 |

## Determinism

```json
{
  "runsCompared": 1200,
  "rerunEventLogDigestsIdentical": true,
  "rerunSemanticFingerprintsIdentical": true,
  "secondSeedRoot": "S1-E07-B",
  "secondSeedRunsWithDifferentEventLogs": 1200,
  "ksAlpha": 0.001,
  "ks": [
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-FRONTIER",
      "metric": "firstKillS",
      "n": [
        200,
        200
      ],
      "d": 0.03,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-FRONTIER",
      "metric": "minToL5",
      "n": [
        200,
        200
      ],
      "d": 0.030000000000000027,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-FRONTIER",
      "metric": "zone2FirstVisitMin",
      "n": [
        200,
        200
      ],
      "d": 0.07999999999999999,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-FRONTIER",
      "metric": "expTotal",
      "n": [
        200,
        200
      ],
      "d": 0.06000000000000005,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-STAY",
      "metric": "firstKillS",
      "n": [
        200,
        200
      ],
      "d": 0.03,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-STAY",
      "metric": "minToL5",
      "n": [
        200,
        200
      ],
      "d": 0.030000000000000027,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-STAY",
      "metric": "zone2FirstVisitMin",
      "n": [
        200,
        200
      ],
      "d": 0.07999999999999999,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-STAY",
      "metric": "expTotal",
      "n": [
        200,
        200
      ],
      "d": 0.035,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN",
      "metric": "firstKillS",
      "n": [
        200,
        200
      ],
      "d": 0.03,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN",
      "metric": "minToL5",
      "n": [
        200,
        200
      ],
      "d": 0.030000000000000027,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN",
      "metric": "zone2FirstVisitMin",
      "n": [
        200,
        200
      ],
      "d": 0.08999999999999997,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN",
      "metric": "expTotal",
      "n": [
        200,
        200
      ],
      "d": 0.08499999999999996,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-FRONTIER",
      "metric": "firstKillS",
      "n": [
        200,
        200
      ],
      "d": 0.03,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-FRONTIER",
      "metric": "minToL5",
      "n": [
        200,
        200
      ],
      "d": 0.065,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-FRONTIER",
      "metric": "zone2FirstVisitMin",
      "n": [
        200,
        200
      ],
      "d": 0.07500000000000001,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-FRONTIER",
      "metric": "expTotal",
      "n": [
        200,
        200
      ],
      "d": 0.05999999999999994,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-STAY",
      "metric": "firstKillS",
      "n": [
        200,
        200
      ],
      "d": 0.03,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-STAY",
      "metric": "minToL5",
      "n": [
        200,
        200
      ],
      "d": 0.065,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-STAY",
      "metric": "zone2FirstVisitMin",
      "n": [
        200,
        200
      ],
      "d": 0.07500000000000001,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-STAY",
      "metric": "expTotal",
      "n": [
        200,
        200
      ],
      "d": 0.02500000000000001,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-BEST-SHOWN",
      "metric": "firstKillS",
      "n": [
        200,
        200
      ],
      "d": 0.03,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-BEST-SHOWN",
      "metric": "minToL5",
      "n": [
        200,
        200
      ],
      "d": 0.065,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-BEST-SHOWN",
      "metric": "zone2FirstVisitMin",
      "n": [
        200,
        200
      ],
      "d": 0.04499999999999993,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    },
    {
      "cell": "a12-p2.0-g150|PR-BAL|POL-BEST-SHOWN",
      "metric": "expTotal",
      "n": [
        200,
        200
      ],
      "d": 0.030000000000000027,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    }
  ],
  "ksRejections": 0
}
```

## Notes and limitations

- S1.1 correction pass (owner review 'Independent S1 Review and S1.1 Authorisation'). Single-character diagnostic model; no recruits, classes, abilities, gear, sinks, offline progress or Monuments.
- All inputs are candidates (content w1-slice.candidate.v0.1.0, unchanged; owner resolutions S1-R01..R17; S1.1 rules S1.1-R01..R15); every output is model-output, not live-validated.
- Policies: POL-* are the corrected S1.1 realistic policies; CTL-*-S1 are the S1 decision logic kept as diagnostic controls; ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control, never an upper bound.
- Seeds: the same seed roots as the corresponding S1 experiments, so S1, controls and corrected policies face the same random draws.
- Engineering gate A6: identical re-run digests and fingerprints; every second-seed run differs.

