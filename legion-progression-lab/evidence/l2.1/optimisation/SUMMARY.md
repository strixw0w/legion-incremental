# L2.1 exact optimisation comparisons (owner §9)

**Method:** `repro/l2.1/opt_compare.ts` runs a fixed set of deterministic workloads and writes every deterministic result, with the wall time kept apart. It ran three times on the same machine (Ryzen 7 7800X3D, Node 24.22.3), each time alone with no competing workload. The L2.1 semantics were final before the first run.
1. **`baseline.json`**: before any optimisation.
2. **`opt1-cow.json`**: after copy-on-write item storage (the frozen item map is shared; craft and enhance replace it).
3. **`opt2-feats.json`**: after Feat evaluation only when a tier can become newly eligible.

**The workloads:**
- a 100,000-delivery differential with the candidate limits, run twice: once with L2's serialized comparison, once with the structural comparison;
- the bounded-growth day and week stages;
- 200 partition cases × 5, in one process.

## Results are byte-identical
| Comparison | Results |
|---|---|
| `opt1-cow` against `baseline` | **identical** (every deterministic field of every workload) |
| `opt2-feats` against `baseline` | **identical** |
| The structural against the serialized comparison, within each run | **identical** results, and 0 disagreements |

**The structural comparison's verdicts are also tested:**
- on deliberately different accounts (`test/l2.core.test.ts`);
- by `compare: 'both'` in the small differential, which counts any disagreement (0);
- by planted silent faults, which must be reported (mutation N38).

**It is an exact comparison.** It walks both accounts field by field. A pair of deeply frozen objects already found equal is not walked again, since a deeply frozen value cannot change. There is no hashing and no sampling.

## Wall time (ms; one run each)
| Workload | Baseline | + copy-on-write | + Feat check | Overall |
|---|---|---|---|---|
| Differential, serialized comparison | 142,437 | 80,654 | 62,175 | 0.44× |
| Differential, structural comparison | 118,376 | 39,370 | 22,594 | **0.19×** |
| Bounded growth, day | 345 | 262 | 254 | 0.74× |
| Bounded growth, week | 27,240 | 1,927 | 1,840 | **0.07×** |
| Partition, 200 × 5 (one process) | 11,616 | 11,899 | 6,653 | 0.57× |

**The differential's structural comparison combined with both optimisations is 6.3× faster** than the serialized comparison without them: 142.4 s down to 22.6 s.

## Deterministic parallel execution
- **The partition cases are independent:** each case draws from its own random stream (`seed:case:<n>`), so the merged result is identical for any worker count and grouping.
  - Tests: `runPartitionCases` against single cases, in `test/l2.core.test.ts`.
  - The clean-extraction check re-runs L2.1-E03 with 4 workers, against the registered 13.
- **E01, E02 and E03 ran at the same time,** as three processes. E04 ran alone afterwards, because its timings are measured.

## Limitations
- Each configuration ran once; the timings are single measurements.
- The shares of the two optimisations depend on the order they were applied in: copy-on-write first, then the Feat check.
