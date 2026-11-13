# S1 pre-registration

**Written:** before any S1 experiment or benchmark ran, on 2026-11-13.

**Integrity:**
- `preregistration.json` records the SHA-256 of every manifest and of this document.
- `npm run exp` refuses any manifest whose hash differs from the register.
- Hypotheses, metrics, pass ranges and the rules below are **never changed after results are seen**. A missed target is reported as missed, with the closest swept candidate.

**Why there is no Git commit as evidence.** The owner's S1 authorisation says not to commit S1 until review. So the pre-registration evidence is this hash register plus the environment records, whose start times fall after this registration, instead of Git order. The reviewer can check every manifest against the register.

## 1. Experiments (experiment plan v1.1 section 7)
| ID | Kind | Question |
|---|---|---|
| S1-E01-calibration | campaign | Do the candidate inputs meet early pacing targets? |
| S1-E02-estimator | estimator (diagnostic) | Does the analytic rate model match simulated combat? |
| S1-E03-earlier-zone-audit | audit (forks) | Is an earlier zone ever better, and is the newest zone worth entering? |
| S1-E04-survival | campaign | How often does the hero die, and what does downtime cost? |
| S1-E05-gate-pacing | campaign | Are later gates progressively longer? |
| S1-E06-drop-correctness | drops (diagnostic) | Are sampled drop counts consistent with the per-kill odds? |
| S1-E07-determinism | determinism | Same manifest gives the same fingerprint; different seeds give the same distribution? |
| S1-E08-policy-bound | campaign | How far are realistic policies from the oracle in 60 minutes? |

## 2. Engineering gates (these decide acceptance)
1. All S0 gates still pass.
2. Every S1 invariant test passes:
   - the event semantics of architecture §9.3: simultaneous lethal blows, retaliation at death, death cancelling work, stale events, respawn and target invalidation, identical timestamps, exactly-once kill credit, session boundaries, level-ups during work;
   - the entity-renaming metamorphic test;
   - gates, flags and command rejections, including no active-only gate started by automation;
   - determinism and forks.
3. S1 fixtures (`combat-loop`, `gates`, `rewards`) pass in the lab and in `spec/oracle/s1_oracle.py`.
4. **S1-E06:** every pooled drop count is inside its exact two-sided binomial 99.9% interval, with 0 ledger mismatches.
5. **S1-E07:**
   - re-run event-log digests and semantic fingerprints are identical;
   - every second-root run differs;
   - KS rejections are reported, with an expected rate of α = 0.001 per test.
6. `npm run exp:verify` reproduces the semantic fingerprint of every experiment.

## 3. Balance hypotheses (reported; never moved; a miss never blocks acceptance)
**Source:** copied without change from experiment plan v1.1 §7 into the manifests.

| ID | Metric | Pass range | Role |
|---|---|---|---|
| H-S1-01 | firstKillS p90 | ≤ 30 s | target |
| H-S1-02 | killsToL2 p50 | 1–3 | target |
| H-S1-03a/b | first-visit TTK p50, zones 1 and 2 | 2–5 s | target |
| H-S1-04 | first-visit TTK p50, zone 3 | 5–15 s | target |
| H-S1-05 | zone2FirstVisitMin p50 | 5–10 active min | target |
| H-S1-06 | (zone 3 first visit − zone 2 first visit) / zone 2 first visit, p50 | > 1 | target |
| H-S1-07a/b | minutes to L5 / L10, p50 | 3–5 / 10–20 | diagnostic (not a gate) |
| H-S1-08a/b | at hero damage ≥ zone 1 HP: TTK p50, expected swings | = 0 s, = 1 | target |
| H-S1-09 | estimator mean kills/h error | within ±5% | target; see §5 |
| H-S1-10 | earlier zone better EXP/h; newest zone still worth entering | — | reported, no pass/fail |

**Measurement definitions:**
- **First-visit TTK:** the median of the first 10 kills after the hero first arrives in the zone.
- **"Not reached":** a metric not reached within the session is "not reached". It counts above every number in quantiles. Nothing is imputed.

## 4. S1-E01 "winner" rule (used to pick the S1-E05 row and the S1_EVIDENCE summary row)
1. **Candidates:** only S1-E01 pass-1 variants (27), each judged at its PR-BAL / POL-FRONTIER cell.
2. **Score:** the number of passed hypotheses among H-S1-01, 02, 03a, 03b, 04 and 05. H-S1-07 is diagnostic and does not count.
3. **First tie-break:** the smaller sum, over those six hypotheses, of normalised distances.
   - 0 if the p50 (or p90) is inside the range;
   - otherwise the distance to the nearest bound divided by the range width (for one-sided targets, divided by the bound);
   - 1 if not reached.
4. **Second tie-break:** variant ID in ascending order.

The winner is reported as "closest swept candidate". It is **not** promoted to approved.

## 5. H-S1-09 "explained by a named factor"
- **Named factors:** a cell outside ±5% passes only if the evidence names one of the estimator's documented approximations as the cause, and shows it with that cell's numbers:
  - the spawn/attack bound minimum;
  - the survival renewal approximation;
  - the initial entry walk;
  - the auto-farm stop rule, which is not modelled.
- **Otherwise** the cell is reported as a miss.

## 6. Ledger benchmark (staged, with budgets declared now)
**Workloads:** W-small, W-day, W-week, W-legion and W-month, from `planning/S1_LEDGER_BENCHMARK_PROPOSAL.md`.

**Transaction mix** (seeded):
- kill rewards with 1–3 lines;
- 2% crafts with 4 lines;
- 1% replays;
- 0.1% conflicts.

**Budget per run:** 120 s wall-clock and 2 GiB heap.

**Staged procedure:**
- Each workload first runs once.
- If it finishes within budget, it is repeated until 5 runs or until the stage has used 5 × 120 s.
- If a run exceeds the budget, it is stopped and reported as **timed out at N transactions**, with measured figures up to that point.
- Every larger workload is then reported as **not run: a smaller workload already exceeded the budget**.
- Nothing projected is reported as measured.

**Comparison:** a prototype persistent map (a structurally shared hash trie, benchmark-only) runs the same workloads. It is an investigation only and does not replace the production ledger.

**S1 runtime impact:** measured directly. The kill-reward transactions of real S1 runs (S1-E01 base cell, PR-BAL, POL-FRONTIER) are replayed through a fresh ledger and timed, then compared with the same runs' total time.
