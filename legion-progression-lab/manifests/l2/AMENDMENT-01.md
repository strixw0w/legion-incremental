# L2 amendment 01: retiring finished jobs in the staged workload (a follow-up, registered after the results)

**Registered 2026-11-15, after the registered L2 experiments had run and before this follow-up ran.** It is appended to `manifests/l2/preregistration.json` under `amendments`. The original registration, its manifests and every registered result are unchanged.

## Why
**What the results showed** (L2-E04):
- **H-L2-03 missed:** the month checkpoint (419,145 B) is 3.0× the week checkpoint (138,096 B), against at most 1.25×.
- **Retained heap over budget:** 28.17 MB in the week stage and 55.57 MB in the month stage, against ≤ 16 MB.
- **Within budget:** reconstruction p95 21.2 ms and checkpoint size.

**The cause, found by reading the account after the run.**
- **The checkpoint growth:** the workload creates a smith job about 14 times an hour but never retires a finished job's producer. Every finished job stays in the open producer table: about 12.5 KB of checkpoint per simulated day, linear in history. The L2 contract allows retirement (§5) but does not make it automatic. A client that never retires finished producers keeps them, as designed. This is a finding about the contract, recorded as such.
- **The retained-heap figure** is the whole heap after GC minus the stage's baseline. With the L1 reference running alongside, it plausibly includes objects other than the L2 account (the L1 store holds every unit and credit). It is not a clean measure of the account alone.

## What is added
- **L2-E05-perf-v11:** L2-E04 with the same seed, stages, workload, budgets and L1 counting, plus two changes:
  - **retireFinished:** every 10 simulated minutes the client sends one retire request per finished job producer (no reserved unit, and the smith is no longer on it), on its own request stream;
  - **an isolated account measurement:** the account rebuilt from its checkpoint text after GC, measured alone (`accountHeapMb`). The original `retainedHeapMb` is kept.
- **Code:** only `src/cli/l2-perf.ts` and `src/cli/l2-run.ts` change (the option, the measurement, and the runner accepting amendment manifests). `src/l2` is unchanged, so L2-E01 … E03 remain results of the final L2 code.

## Rules (fixed now, before the run)
- **H-L2-03 and H-L2-04** are derived again for L2-E05 under the same rule and budgets. The registered L2-E04 outcomes stand.
- **Retained heap:** both measures are reported. The 16 MB budget is judged on the isolated account measure, and the whole-heap measure is reported beside it.
- **The finding stands:** without retirement, retained state grows with finished work. **Automatic retirement of finished jobs is proposed for S5,** not implemented here.
