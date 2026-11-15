# Performance audit, L2 addendum

**Version 1.0, 2026-11-15.** It adds to `PERFORMANCE_AUDIT.md` v1.0, which is unchanged because it is part of the S4 checkpoint.

- **v1.0 of the audit** was written before the S4 corrections and L2 ran.
- **This addendum** adds the measured L2 cycle, a profile of the L2 differential, and a correction to the audit's §8.
- **New files:** `tools/l2_profile.ts`, `samples/profile-l2-differential-200k.txt` and `samples/closure-check-vs-s4-checkpoint.txt`.

## 1. Correction to the audit's §8
- **What §8 says:** the L2 runner enforces registered budgets while running, so a workload that exceeds its time or memory budget is stopped and reported.
- **What happened:**
  - enforcement was built only into the staged workloads (L2-E04 and E05);
  - the differential and partition harnesses (E01–E03) had no deadline check;
  - **L2-E01 ran 34.9 min against its 30-min budget and was not stopped** (§2).

## 2. Wall-clock time per step, 2026-11-15 (UTC)
| Step | Time | CPU use | Detail |
|---|---|---|---|
| S4 acceptance regression after the three corrections | 55.9 min | 15 workers | 35 affected manifests `--verify` MATCH (`evidence/s4-acceptance/regression-run.txt`) |
| L2-E03 partition | 4.3 min | **1 thread** | 2,000 cases × 5 partitions |
| L2-E02 differential, tight window | 6.6 min | **1 thread** | 250,000 deliveries; RSS 613 MB |
| L2-E01 differential | **34.9 min** | **1 thread** | 1,000,000 deliveries; RSS 1,068 MB. **Over its registered 30-min budget, and not stopped** (§1) |
| L2-E04 staged workloads | 6.5 min | 1 thread | day 0.3 s, week 49.3 s, month 341.5 s; peak heap 184 MB |
| L2-E05 (amendment 01) | 6.0 min | 1 thread | peak heap 171 MB |
| Mutation sets (L2 and the five earlier sets) | 7.9 min | mixed | 89 planted defects, all detected |
| Tests, fixtures, oracles, schemas, type check | 0.6 min | mixed | 1,401 tests |
| Historical regression | 64.2 min | 15 workers | 42 manifests MATCH, plus 3 engineering runs identical |
| Registration, preservation, git, frozen checks | 0.5 min | 1 thread | |
| Profile probe for this addendum | 12.5 min | 1 thread | §4; not evidence |

**Workers and memory:**
- The L2 harnesses run in one thread with no workers, so worker memory is zero.
- Peak memory was the E01 process: 1,068 MB RSS at the end. The peak inside the run was not sampled.
- No step exceeded the 8 GB memory limit.

**Historical against new:**
- **New L2 results:** 58.3 min (E01–E05). **E01 alone is 60% of that.**
- **Re-confirming earlier results:** 120.1 min (the S4 acceptance regression, 55.9, and the historical regression, 64.2).

**Why the historical regression doubled from 32.5 to 64.2 min:**
- **The six S4 manifests added 26.0 min.** E08 took 8.1 min and E03 7.2 min.
- **The earlier groups also took longer** than on 2026-11-14 with the same seeds:
  - S1.1 4.7 against 3.6 min;
  - S2 10.6 against 10.0;
  - S3 11.8 against 9.5;
  - S3.1 9.1 against 8.3.

  No other measured job ran at the time. The cause is unexplained (compare the audit's §2).

## 3. Was the recomputation unnecessary?
**No, for this cycle.** `samples/closure-check-vs-s4-checkpoint.txt` lists what L2 changed inside each runner's import closure:
- `src/core/errors.ts` (three new error codes) is in every runner's closure;
- `src/engine/legion.ts` (the additive `runtimeSnapshot` and `restoreRuntime`) is in the S2, S3 and S4 runners' closures.

The exact cache proposed in the audit's §6 keys on the source files, so it would have re-run all 42 manifests. **It would have saved nothing here.** Skipping them would need a judgement that the change is additive. A cache key cannot prove that, so the re-run stands.

**The E02 and E03 re-runs** in the clean-extraction check repeat the same seeds on the same code. They are the independent-environment determinism check, and E01 is not repeated.

## 4. Where the L2 differential spends its time
**The probe:** `tools/l2_profile.ts`, a shortened differential with the E01 policy and settings and its own seed. It measures throughput:

| Deliveries | Time | Deliveries per second |
|---|---|---|
| 50,000 | 59.7 s | 837 |
| 200,000 | 335.7 s | 596 |
| 1,000,000 (E01) | 2,093.6 s | 478 |

**Throughput falls as the account fills up.** The profile of the 200,000-delivery run is in `samples/profile-l2-differential-200k.txt`.

| # | Bottleneck | Share | Why it grows |
|---|---|---|---|
| 1 | `working` (`src/l2/account.ts`): each delivery copies the account's item map (up to 1,000 items) and balances, for both stores | **36%** | proportional to the number of items |
| 2 | The per-delivery comparison: `economyView` serialises both whole accounts to canonical JSON after every delivery | **33%** | proportional to the account size; required by the registered design |
| 3 | `grantFeats`: scans and sorts the Feat tiers at every simulated event | 8% | proportional to simulated events |
| 4 | `advance`, the chronological event loop | 5% | proportional to simulated events |
| 5 | Range-set insertion (`addRun`) for credits and requests | 3% | proportional to the number of runs. **Small at 200,000 deliveries.** E01 reached 23,338 runs at 1,000,000, and its share there was not measured |

**Single-thread use:** the L2 harnesses used 1 of the 16 hardware threads. The four registered L2 experiments ran one after another for 52 min.

## 5. Opportunities for L2 (none adopted)
**Deterministic parallel execution:**
- **Run E01, E02 and E03 at the same time,** each in its own process. Their results do not depend on timing. The run phase would be bounded by E01 alone: about 35 min instead of 46, measured parts. The E04 and E05 timings must still run alone, because their wall time and latency are measured quantities.
- **Split the 2,000 independent E03 cases across 15 workers,** stored by case index. The output stays identical by construction. Roughly 4.3 min to under 1 min (estimated).

**Exact speed-ups, each accepted only if every registered L2 result stays byte-identical:**
- **Copy-on-write items** in `working`: copy the item map only when a delivery changes it. This targets the 36%. It changes `src/l2`, so all of L2 would have to be re-verified.
- **A structural equality check** in place of serialise-and-compare. It must give the same verdict on every delivery; check it against the serialised comparison on E02. This targets the 33%. It is a harness-only change.
- **Feat grants only when a new tier is reachable.** This targets the 8%.

Estimated effect: roughly 2× faster differentials. This is an estimate from the profile shares, not a measurement.

**Budget enforcement:** add a deadline check to the differential and partition harnesses, so a run over its registered wall budget stops and is reported as stopped.

## 6. The suites, revised for L2
| Suite | L2 additions | Time (this machine) |
|---|---|---|
| **Fast development** | the L2 tests, the four L2 fixture families and the L2 oracle (already in the 1,401 tests and the 550 cases); the L2 mutation set when `src/l2` changes | the fixed parts about 0.6 min, measured; the L2 mutation set's own time was not measured separately (all six sets 7.9 min) |
| **Standard regression** | L2-E02 and L2-E03 from their registered manifests, side by side (bounded by E02's 6.6 min) | about 7 min for L2, plus the S4-era standard suite (estimated) |
| **Full checkpoint** | every registered L2 manifest, without cache; E01–E03 in parallel; E04 and E05 alone; the clean-extraction ZIP check | about 1 hour for L2 (estimated from the measured parts: 35 min for E01–E03 together, 12.5 min for E04 and E05, about 15 min for the ZIP check), plus the historical regression, now 64 min |

**Registered sample sizes are unchanged in every suite:** E01 stays 1,000,000 deliveries, E02 250,000 and E03 2,000 × 5. The suites differ only in which unchanged work is repeated, and how much runs at once.

## 7. Limitations
- **The profile is one run of a shortened differential.** The shares at 1,000,000 deliveries may differ, especially for range sets.
- **Peak memory inside the L2 runs was not sampled,** only the end-of-run RSS and the staged-workload peak heap.
- **The time savings in §5 are estimates.**
