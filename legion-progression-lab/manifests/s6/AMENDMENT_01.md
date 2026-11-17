# S6 amendment 01: the event budget, stopped runs, and the reward monitor

**Registered before any amended run.** The time and hashes are in `preregistration-amendment-01.json`, which also
records the new code digest. `python -I -X utf8 repro/s6/register_a01.py --check` compares the current files with it.

## 1. What happened in the registered chain
The plan was registered at 2026-11-16T22:20:00Z (`preregistration.json`), and the chain `repro/s6/run_all.sh` started
at 22:20:05Z. Its log, the runners' logs and the first attempt's rows are kept in `evidence/s6/registered-chain/`.

| Step | Result |
|---|---|
| Registration check, full test suite | passed (22:20:05Z, 22:21:45Z) |
| S6-E02 (80 tasks, 22:21:45–22:47:51Z) | the runner reported COMPLETE, but **every task returned an error** and no outcome: `INVALID_STATE: a checkpoint can only be taken between steps` |
| S6-E01, E03, E05 stage 1, E06 | **stopped by the operator** within about 45 s of each start (22:47:51–22:50:30Z). They wrote no rows. |
| S6-E07, E04, E10, E11, E05 stage 2 | never started |

**The operator stop.** The E02 errors meant that every D30 run would fail the same way, so the chain was stopped at
22:48Z. Stopping its outer shell left `run_all.sh` running, so each runner it then started was stopped in turn, and
finally the script itself (`chain.txt` records each step).

**What was observed:** E02's rows contain only the task number and the error text. No outcome of any registered task
was seen.

## 2. The cause
A diagnosis probe reran E02's first task day by day (`evidence/s6/amendments/a01-diagnosis.txt`).
- **The stop:** the engine's default event budget ended the account at wall day 17 (game hour 401.8). This is
  `SIM_EVENT_LIMIT`, 20,000,000 events per simulation.
- **Why the row was lost:** the harness records a guard stop as the run's `stopped` field. Its peak-integer measure
  (S6-E09) then took a checkpoint of the account, which the engine refuses inside a step. That error replaced the
  whole row.
- **Why it was not seen before:** the calibration runs (to D14) and the smoke runs (to D7 at most) never reached the
  budget.

## 3. The fixes
None changes a target, a cell, a seed, a budget, the content or the analysis.

| # | Where | Fix |
|---|---|---|
| F17 | `src/s6/experiments.ts` (`S6_MAX_EVENTS`) | Every S6 account runs with an event budget of 1,000,000,000, well above a D30 World 1 account's needs (37.8 million for PR-BAL and 43.8 million for PR-OPT in the check below). A runaway run is still stopped by the watchdog's per-task wall budget. A run that never reaches 20 million events runs exactly as before. |
| F18 | `src/s6/experiments.ts` (`peakStateValue`) | A run stopped by a guard keeps its row: its peak is taken from the live state, and `peak.source` says which (`checkpoint` or `live-state`). |
| F19 | `src/cli/s6-run.ts` | A run in which any task returned an error is labelled `TASK_ERRORS`, never `COMPLETE`. The first attempt's E02 was labelled COMPLETE with `failedTasks` 80. The stage-2 rule already requires COMPLETE. |
| F16 | `src/experiments/legionMetrics.ts` | **Found by a new gate test, not by the chain.** The S2 reward monitor read an elite's instance identity one field too early. An encounter id itself contains `:`, so the monitor judged an elite kill against the ordinary zone enemy. The monitor is used only by tests, and is outside the registered runs' import closure (`repro/s6/import_closure.py`). |

**Tests:** `test/s6.gates.test.ts` (written in the gate phase; see the evidence) covers the fixes:
- a guard-stopped run keeps its snapshots and peak;
- S6 accounts use the S6 budget;
- elite rare drops and duplicates are checked under the corrected monitor.

## 4. What is unchanged, and the re-run
- **Unchanged:** every manifest file (the same hashes as the original registration, checked by `register_a01.py`), the
  candidate content 0.6.1, the specification v0.2, the analysis `repro/s6/analyze.py`, the targets and the order.
- **The same seeds are run again.** No outcome of any registered task was observed (§1), so this is not a second look.
- **The stage-2 rule** `repro/s6/e05_stage2.py` is unchanged except that its stage-1 results folder is now an argument
  (default: the original path).
- **The re-run:** `repro/s6/run_all_a01.sh` writes into `results/s6/a01/`, with its log in `evidence/s6/a01-chain/`. The
  first attempt's `results/s6/S6-E02-completion/` is kept as it is.

**Exploratory check before this registration** (`evidence/s6/amendments/a01-d30-check.txt`; not evidence): the seeds of
E02 tasks 0 (PR-BAL) and 60 (PR-OPT) were run to D30 with the new budget, to look for any other failure after day 17.
- **Neither failed.** PR-BAL used 37.8 million events (312 s, single process); PR-OPT used 43.8 million (514 s).
- **What they showed:** per-day hero levels, accessible zones and whether the world was cleared, for those two seeds.
  This is outcome information; nothing was changed after it.

## 5. Process notes
- **Stopping a chain:** stopping the outer shell does not stop `run_all.sh`. Its process tree is stopped instead
  (`taskkill /T`), and every stop is written to the chain log.
- **What the smoke subsets should have included:** they should have included one task at a registered horizon of every
  manifest. Their horizons (at most D7) hid the budget.
