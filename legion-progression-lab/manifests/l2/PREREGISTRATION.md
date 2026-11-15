# L2 pre-registration

**Version 1.0, 2026-11-15.** Registered before any L2 experiment ran. `manifests/l2/preregistration.json` holds the SHA-256 of this document and of every manifest. `src/cli/l2-run.ts` refuses a manifest that is not registered, or that changed after registration.

**Source:**
- the owner's "Independent S4 Review and L2 Authorisation" §8–§12;
- `planning/L2_CONTRACT.md` v2.0;
- `spec/formulas/l2-replay.md` v1;
- `evidence/perf-audit/PERFORMANCE_AUDIT.md` (the budgets and the memory measures).

**Labels.**
- Every economy number is a synthetic test value. L2 is infrastructure; it carries no game balance.
- Every measurement is a **simulator measurement**, not a Roblox persistence limit.

**Disclosure** (what was run before registration):
- the unit tests of `test/l2.core.test.ts` and `test/l2.sim.test.ts`, including a 20,000-delivery differential (seed `l2-test-diff`) and 25 partition cases (seed `l2-test-partition`);
- short development runs of the staged workload (seed `l2-dev`) to check that the stages execute.

**Found by the unit tests before registration:** with bounded receipts, an evicted request retried with another payload gets `REPLAY_TOO_OLD` from L2, but `CONFLICTING_PAYLOAD` from L1. The contract (v2.0, §0 and §3) and the spec (§2) were corrected to name this third observable case before registration. The test economy's roster was capped at 8 gatherers (`maxGatherers`), because the unbounded roster made each delivery slower as the run went on.

No budget or target was set from these runs.

## 1. Experiments
| ID | Question (owner §11) | Design |
|---|---|---|
| L2-E01 | Does L2 agree with the L1 full-history reference within the common contract? | `L2-E01-differential.json`: 1,000,000 randomized deliveries. Request kinds, retries, conflicting payloads, missing and late (stale) messages, out-of-order and duplicated messages, duplicate encounter credits, work operations with invalid transitions, retired and unknown producers, cancelled work, reservation and completion interleavings, atomic batch settlements (overlapping too), retirement, long time jumps. Checkpoint save and restore every 10,000 deliveries; an immutable branch every 25,000 |
| L2-E02 | The same under heavy eviction | `L2-E02-differential-tight.json`: 250,000 deliveries, with a window of 8 receipts or 1 h |
| L2-E03 | Is settlement invariant to batch partition at chronological bonus boundaries? | `L2-E03-partition.json`: 2,000 random cases × 5 partitions, with checkpoints, plus the owner's worked example |
| L2-E04 | Does retained state stay bounded as processed history grows? Are the budgets met? | `L2-E04-perf.json`: staged day, week and month workloads, run with `node --expose-gc` |

**Also registered as gates, run by the test suite:**
- repeated save, load and resumed execution of the actual simulation (`test/l2.sim.test.ts`);
- malformed and inconsistent checkpoint rejection;
- numeric-boundary tests;
- the existing ledger fixtures and every historical regression control;
- the L2 fixture families (`spec/fixtures/l2-*.v1.json`) against `spec/oracle/l2_oracle.py`;
- the L2 mutation checks (`repro/l2/mutation_check.py`).

## 2. Budgets (registered now; owner §11)
| Measure | Budget | Where |
|---|---|---|
| Retained heap of one account after GC | ≤ 16 MB | L2-E04, every stage |
| Reconstruction latency (parse, validate, restore), p95 of 30 | ≤ 200 ms | L2-E04, every stage |
| Serialized checkpoint | ≤ 1,024 KB | L2-E04, every stage |
| Replay tail | ≤ 256 receipts per stream | L2-E01, L2-E04 |
| Stage wall time and peak heap | day 5 min / 2,048 MB; week 15 min / 3,072 MB; month 30 min / 4,096 MB | L2-E04 (a stage over budget is **stopped** and reported; later stages do not run) |
| Wall time per manifest | ≤ 30 min | L2-E01 … E03 |

**Memory reported separately:**
- peak heap;
- process memory (main RSS);
- worker memory: the L2 tools use **no worker threads**, so the process figures cover everything;
- retained heap;
- checkpoint size;
- replay tail.

## 3. Hypotheses and rules
| ID | Role | Statement |
|---|---|---|
| H-L2-01 | engineering gate | L2-E01 and E02 show 0 unexplained mismatches, 0 invariant violations, 0 branch isolation breaks, and every checkpoint restores identically. The only differences from L1 are the registered changed semantics: `REPLAY_TOO_OLD` where L1 replays the receipt or reports `CONFLICTING_PAYLOAD`, and `REQUEST_EXPIRED` where L1 would execute. They are counted and reported, never hidden |
| H-L2-02 | engineering gate | L2-E03 shows 0 partition mismatches, and the owner's example gives 250 in one, two and many batches |
| H-L2-03 | candidate target | Bounded retention: in L2-E04 the month checkpoint is at most 1.25× the week checkpoint, the replay tail stays at most 256 per stream, and every account budget holds in every stage |
| H-L2-04 | candidate target | Reconstruction p95 ≤ 200 ms in every stage |
| H-L2-05 | engineering gate | Every planted replay and settlement bug is detected (`repro/l2/mutation_check.py`) |

**No target moves after results.** A miss is reported as a miss.
