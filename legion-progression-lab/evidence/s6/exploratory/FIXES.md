# S6 fixes before registration (method step 2: mechanical failures only)

Each fix below repairs a mechanical failure (an engine defect, a policy deadlock or an unwinnable gate) found by the
S6 tests or by the exploratory runs. No fix changes a target, a hypothesis or a candidate number. Calibration (method
step 3) is reported separately.

## Found by the S6 tests (`test/s6.w1.test.ts`, first run 2026-11-16)

| # | Where | Failure | Fix |
|---|---|---|---|
| F1 | `src/engine/legion.ts` (first-clear reward) | The first-clear ledger transaction used the purpose `boss.firstClear`; the ledger refuses purposes with capitals (`INVALID_TX`), so the first W1 boss clear stopped the run. | Purpose renamed `boss.first-clear`. |
| F2 | `src/engine/legion.ts` (constructor) | W1 content without the legion switch was refused by an earlier, unrelated guard with a misleading message. | The W1 guard runs first. Only the message changes; S1–S5 never reach it. |
| F3 | `src/policy/w1Policies.ts` `bossHero` | **Policy deadlock.** Before a boss the policy only switched auto-farm off and waited for its next decision. Switching auto-farm off cancels the automatic walk or encounter and leaves the hero idle, and the engine asks the policy nothing when the hero becomes idle, so the hero stood idle for the rest of the session. | The next step (rest, or start the boss) follows in the same decision. If the boss zone cannot be reached in one move, the policy keeps farming instead of stopping. |
| F4 | `src/policy/w1Policies.ts` `decide` | **Policy deadlock.** A roster swap (a rare hero joining) was returned alone, so after a boss clear that granted a rare hero the hero was never given an activity again. | A swap's decision also carries the hero's activity. The other roster and industry decisions still wait for the next decision. |
| F5 | `src/policy/w1Policies.ts` `bossHero` | **Policy loop** (`EVENT_CASCADE_LIMIT`): with a squad member knocked out, the policy ordered a rest; at full health a rest completes at once, so it repeated eight times in one instant. Knocked-out members recover on their own timer, which asks the policy nothing. | While a squad member is knocked out, the boss waits and ordinary farming continues (its kills wake the policy). |
| F6 | `test/s6.w1.test.ts` | The tamper test marked the first boss as completed. Once F3–F5 let the first boss be cleared within 10 minutes, the record was already completed, so the tamper changed nothing. | The tamper marks the second boss, which is never fought that early. |

The specification §4 is updated to match F3–F14 (v0.2).

## Found by the exploratory runs and industry probes

**Exploratory run x01** (`x01-bal-opt-d7.json`; PR-BAL and PR-OPT to D7, one seed each, 2 workers, 32 s):
- **Both runs stopped before D7** (`a wall time before the absence began`): the run harness, F15 below.
- **Pacing:** the world was cleared at 1.24 active hours (PR-BAL) and 1.51 (PR-OPT), and every Elite version by D3.
  This is far below the fixed H-S6-01 band (4–8 active hours). It is a calibration matter (method step 3), not a
  mechanical failure, and nothing was changed for it here.
- **Gear stopped at Copper** in both runs. No Iron, Steel, Gold or Mithril item was made. The industry probes below found
  six policy defects behind it (F7–F14).

| # | Where | Failure | Fix |
|---|---|---|---|
| F7 | `src/policy/w1Policies.ts` `demandDecide` | **Progression deadlock.** Bars above the smith's Smithing level (Iron needs 8) were queued anyway and stayed paused for ever. Nothing trained Smithing, because the S3 rule only trained gatherers. | A component above the smith's level is never queued; the smith trains on the highest-level component it can make (`TRAIN_BATCH` = 20 units at a time), and its raw inputs become gathering needs. |
| F8 | `chooseRoles` | **Progression deadlock.** A gatherer whose profession level was too low trained only at nodes needing no tool. Every mining node needs a pickaxe, so no new miner ever trained. | When every training node needs a tool the recruit lacks (and its level suffices there), that tool comes first (the existing tool rule). |
| F9 | `demandDecide` | **Progression deadlock.** A tool's wearer that was a worker was nearly always mid-fight, so the tool was never equipped. | The worker stops working (`Assign … idle`); the next decision equips the tool. The candidate's commands now come before POL2's roster commands (which would put it back to work). |
| F10 | `demandDecide` (tool rule) | **Progression deadlock.** Only one step of a tool chain was followed: a Gold vein needs a Steel pickaxe, whose bars need iron mined with a Copper pickaxe, so the policy waited for the Steel pickaxe for ever. | The chain is followed (at most six steps) to the first tool that can be had now. |
| F11 | `demandDecide` (tool rule) | **Progression deadlock.** The tool's wearer lost every role while waiting, including gathering the tool's own inputs. | The wearer keeps a gathering role it can do now. |
| F12 | `demandDecide` | **Progression deadlock.** An item only a busy recruit had the Smithing level for (often the former smith, now a worker) could never be crafted. | That recruit becomes a smith, which keeps it free to craft at the next decision; a recruit with another role keeps it. |
| F13 | `demandDecide` | 33 refused commands per run: a gatherer or smith cannot take off equipment while it works, so a tool upgrade's Unequip, Craft and Equip were all refused. | Equipment changes come before role changes; a working wearer first stops, and the next decision makes the swap. |
| F14 | `demandDecide` (tool rule) | **Progression deadlock.** An upgrade recipe consumes a lower-tier item of its slot; a woodcutter that never needed an axe had none, so its Iron axe could never be made. | With no lower-tier item worn or held, the lowest tier of that slot comes first. |
| F15 | `src/s6/experiments.ts` `profileRun` | The run harness restarted each horizon's day-chunks from wall day 1, so runs past D3 asked the engine to run backwards and stopped. | The chunks continue from the wall time already run. |

**After F7–F14** (industry probe, PR-BAL, one seed): the hero and the squad wear full Mithril gear (+4) by D7, the smith
reaches Smithing 30, and no command is refused.

**Known behaviour kept (not a deadlock):** POL3-DEMAND2's stateless roles still move a recruit between worker and
gatherer as the best candidate changes during a crafting burst (a few reassignments in the same minute). It costs some
gathering time and is reported, not fixed.

## After registration (amendment 01, `manifests/s6/AMENDMENT_01.md`)

**Found after registration:**
- **By the first registered chain:** F17 and F18. Its S6-E02 returned a task error in all 80 tasks, and no outcome was
  seen. The other registered runs were stopped by the operator before writing any row.
- **By a gate-phase test:** F16.
- **By reviewing the first attempt's run record:** F19.

**None changes a target, a cell, a seed, a budget, the content or the analysis.** The amendment re-runs the registered
manifests unchanged.

| # | Where | Failure | Fix |
|---|---|---|---|
| F16 | `src/experiments/legionMetrics.ts` | The S2 reward monitor read an elite's instance identity one field too early. An encounter id contains `:`, so an elite kill (6 × EXP) was judged against the ordinary zone enemy and reported as a violation. The monitor is used by tests only, and is outside the registered runs' import closure. | The identity is the transaction ID after its `kill:<encounter id>:` prefix. |
| F17 | `src/s6/experiments.ts` | The engine's default event budget (20 million events per simulation) ended every D30 account near wall day 17 (`SIM_EVENT_LIMIT`). | Every S6 account runs with `S6_MAX_EVENTS` = 1,000,000,000. A D30 account needs 38–44 million. |
| F18 | `src/s6/experiments.ts` `peakStateValue` | After a guard stop, the peak measure took a checkpoint inside a step, which is refused, so the whole row was lost. | The live state is walked instead, and `peak.source` records it. |
| F19 | `src/cli/s6-run.ts` | A run in which every task errored was labelled COMPLETE (with `failedTasks` 80). | Such a run is labelled `TASK_ERRORS`. |
