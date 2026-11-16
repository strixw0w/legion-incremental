# S5 internal checkpoint A: actual engine L2 integration report

**Scope:** the owner's §6 (actual engine integration) and §7 (reconstruction corrections). The design is in
`planning/S5_SPECIFICATION.md` §1–§2 (S5-R10, S5-R11). Every figure below comes from a run of the final S5 code
recorded in this folder; the logs sit beside each JSON file.

## 1. What changed in the actual engine

**The option.** The engine option `identity: 'l2'` (with a bounded ledger) switches the actual Legion simulation to
bounded state. The default `'l1'` keeps every historical control on the unchanged code path.

| Growing structure (owner §6) | L1 (historical) | L2 (S5) | How exactly-once is kept |
|---|---|---|---|
| Kill credits | the full committed chain (≈ 258 bytes per kill) | one exact settled range set per stream (`squad`, `worker:<id>`); monotonic allocation; explicit abandonment | a settled number is refused (`CREDIT_SETTLED`); nothing is deleted |
| Ledger transaction history | every transaction | balances, the 256 most recent transactions, and a count | the identities that create transactions are each issued once (credit ranges, work numbers, jobs, purchase counters) |
| Completed production jobs | kept forever, numbered by list position | retired once unreferenced; explicit `nextJob` counter | a retired number is never reused (`JOB_FINISHED`) |
| Spent items (consumed, salvaged) | kept forever, numbered by list position | retired; explicit `nextItem` counter | a retired number is never reused |
| Industry settlement identities | a count plus the pending map (transient) | unchanged | pending settlements live within one moment |
| Historical command receipts | none in the engine | the settlement service's L2.1 request window (bounded) | the L2.1 window (horizon + receipts) |
| Event logs | a digest chain, its count, and an optional kept prefix outside the checkpoint | unchanged (never in a checkpoint) | diagnostic only |
| Runtime metrics | counters keyed by code | unchanged (bounded by the code set) | diagnostic only |

**The producer lifecycle in the actual engine:**
- **Gathering and production work:** each character's work takes a monotonic per-character sequence number
  (`g:<id>:<n>`, `p:<id>:<n>`).
- **Production units:** each unit is numbered within its job (`<job>/u<n>`), and a job retires when it is finished
  and no work or pending settlement refers to it.
- **The bound:** the state is therefore bounded by the roster, the queue and the in-progress work.

This is the engine's form of the L2.1 lifecycle. The engine does not call the synthetic account's compact producer
store.

## 2. Gameplay identity (L1 against L2)

`identity-differential.json`: 7 configurations (S2 squad and workers, S3 balanced and equipment, S4 balanced,
monument and bestiary) × 2 seeds × 14 hours, with each L2 run saved and restored every 2 hours.

**What is compared:**
- the gameplay state outside the identity evidence (canonical JSON);
- the run counters;
- the event log digest.

**The result:** see the JSON. All 14 runs are identical, with 0 differences.

**The declared differences**, which never occur without injected events:
- a duplicate credit is `CREDIT_SETTLED` in L2 against `CREDIT_REPLAYED` in L1;
- an abandoned number is `CREDIT_SETTLED` in L2 against `CREDIT_UNKNOWN` or `CREDIT_CONFLICT` in L1.

Both are tested in `test/s5.identity.test.ts`, which also covers:
- stale events;
- spent-item and finished-job retirement, and `JOB_FINISHED`;
- malformed bounded checkpoints refused by name;
- pre-session checkpoints;
- every required live event removed.

## 3. Actual account state size (not the synthetic account)

`identity-differential.json` holds the checkpoint size of the actual engine every 2 hours.

`growth.json` covers the actual S4 account (legion, industry and permanent progression) with two 3-hour sessions per
game day:
- 7 days in both identities;
- 28 days in the bounded identity.

**What the growth run reports:**
- **The checkpoint and its parts:** the full checkpoint, and its ledger, credits, items, jobs and events.
- **Memory:** the process heap after a forced collection.
- **The content's end:** where the slice content runs out.

**These are actual-engine measurements.** The L2.1 synthetic 55 KB figure is a different, synthetic account and is
not used here.

| Measurement | L1 | L2 (bounded) |
|---|---|---|
| Checkpoint at 14 h, S4 configurations | about 6.9 MB | about 61–70 KB |
| Checkpoint after 7 game days, S4 POL4-BALANCED2 | 26.5 MB (ledger 16.4 MB, credits 10.1 MB) | 67.7 KB (ledger window 50.7 KB, credits 96 B) |
| Process heap after 7 days (whole process, collected) | 167 MB | 27 MB |
| Largest bounded checkpoint over 11 days (the content limit) | — | 84.0 KB |

**The bounded checkpoint does not grow with play time.** Its largest part is the 256-transaction ledger window
(about 51 KB), whose size is fixed by its bound.

**The 28-day bounded run ends on day 12** for every policy, with `XP_TABLE_EXHAUSTED`: the W1 slice's EXP table ends
at level 201. That is a content limit, not a state limit, and it is recorded in `growth.json`.

**The budget** (registered in `manifests/s5/PREREGISTRATION.md`, after a first exploratory measurement) is 15 min and
2 GB for this workload.

## 4. Reconstruction corrections (owner §7)

### A. Required live events
`simState.ts` `liveEventProblems` requires, for each live state, its current continuation event:
- the session start and end;
- an encounter's attack, its swing at the current epoch, and a boss timer;
- the respawn of a dead hero, and a knocked-out recruit's recovery, while the game is active (a session, or an
  unlocked absence);
- the arrivals of walking and travelling, and the regeneration of resting;
- worker fight events;
- work completions;
- pending settlements and credits.

Stale events are never required.

**The owner's reproduction** (an engaged hero with every pending event removed and the digest recomputed) is refused
(`test/s5.identity.test.ts`).

`checkpoint-corpus.json` covers real checkpoints at random and hunted moments:
- 8 configurations, including diagnostic deaths and worker fights, in both identities;
- **validity:** every checkpoint validates (no false refusal);
- **required events:** every required live event removed in turn is refused;
- **resumed runs:** every tenth checkpoint is resumed and ends exactly as the uninterrupted run.

### B. The pre-session state
`session.index = −1` is valid before the first session opens, and the pre-session checkpoints resume exactly. Both
identities are tested.

### C. The offline state
The S5 offline state is validated in full:
- the anchor, the configured and remembered assignments, the absence and its captured rates;
- the snapshot and the connected assignments;
- the progress baseline;
- consistency with the session and the schedule, with game time never beyond the credited duration.

**The tests:**
- `test/s5.validation.test.ts` refuses 13 malformed variants by name, and requires live events while away;
- `offline-corpus.json` covers real offline checkpoints across 6 configurations: short reconnects, 30 h, beyond the
  cap, a locked first absence, configured offline assignments (hero gathering, a worker), and a hero dying while away;
- **resumed runs:** every fifth checkpoint is resumed, and the run stepped through all its cuts must equal one
  straight run.

### D. Limitations kept explicit
- **The digest does not authenticate.** A checkpoint is trusted input; its digest detects corruption, not forgery.
- **A restored run's event-log digest is a declared chain** from the saved one. It is compared by count after a
  restore, and by digest without one.
- **Two states never appeared at a checkpoint.**
  - Boss encounters: the realistic policies in these windows never challenge the boss.
  - Pending settlements: by design they exist only within one moment, so a between-steps checkpoint can never hold
    one.

  Both validation rules are exercised by construction in the tests.

## 5. Exactness of the optimisations

**The efficient path is exact.** Its optimisations are:
- character stats cached by input identity;
- a frozen EXP table validated once;
- the chunked bounded ledger.

**Two checks show the results are unchanged:**
- **an A/B against a copy of the code without them,** on three offline scenarios up to a 72-hour absence: identical
  state fingerprint, log digest and event count (`evidence/s5/performance/PERFORMANCE.md`);
- **the reference stepper (S5-E02),** which uses none of them.
