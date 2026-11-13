# S1-E07-determinism

**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.

**Question.** Does the same manifest give the same result fingerprint, and do different seeds give different samples from the same distribution?

**Design.** S1-E01 subset (base a10-p1.6-g100 and a12-p2.0-g150; PR-BAL; POL-FRONTIER and POL-STAY; 200 replicates) run twice with root S1-E07 and once with root S1-E07-B; compare event-log digests and semantic fingerprints, and two-sample KS at alpha = 0.001.

**Seeds:** root `S1-E07`, 200 replicates per cell (replicate i uses `S1-E07#rep-i`).

**Semantic fingerprint:** `9be940d7d7421210a4efb8248e2d5649203194f900964a68ce7440b42eee478b` (manifest SHA-256 `028bb7c3f50b748076578537e7a8a40cbfd7ac72a0e7e9556c7ef995431370bc`).

## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)

| Cell | Tag | firstKillS | minToL5 | zone2FirstVisitMin | expTotal |
|---|---|---|---|---|---|
| a10-p1.6-g100|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2.43 / 2.45 / 2.47 | 5.02 / 5.06 / 5.12 | 8178 / 8200 / 8244 |
| a10-p1.6-g100|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 2.43 / 2.45 / 2.47 | 5.02 / 5.06 / 5.12 | 6990 / 7034 / 7078 |
| a12-p2.0-g150|PR-BAL|POL-FRONTIER | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4.40 / 4.44 / 4.46 | 7.35 / 7.41 / 7.45 | 6960 / 6990 / 7010 |
| a12-p2.0-g150|PR-BAL|POL-STAY | model-output (realistic) | 10.40 / 10.40 / 10.40 | 4.40 / 4.44 / 4.46 | 7.35 / 7.41 / 7.45 | 4770 / 4770 / 4814 |

## Determinism

```json
{
  "runsCompared": 800,
  "rerunEventLogDigestsIdentical": true,
  "rerunSemanticFingerprintsIdentical": true,
  "secondSeedRoot": "S1-E07-B",
  "secondSeedRunsWithDifferentEventLogs": 800,
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
      "d": 0.06999999999999995,
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
      "d": 0.05499999999999994,
      "critical": 0.19490000000000002,
      "distributionsDiffer": false
    }
  ],
  "ksRejections": 0
}
```

## Notes and limitations

- Engineering gate: identical re-run digests and fingerprints; second-root runs differ. KS rejections are reported (expected rate alpha per test).

