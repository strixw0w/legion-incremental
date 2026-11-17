# S6 pre-registration

**Registered before any registered S6 run.** The registration time and SHA-256 hashes are in `preregistration.json`:
- this document, the specification and every manifest;
- the candidate content files, the stage-2 rule, the analysis (`repro/s6/analyze.py`) and the run chain
  (`repro/s6/run_all.sh`);
- a digest of every source file under `src/`.

`python -I -X utf8 repro/s6/register.py --check` compares the current files with it. The runner (`src/cli/s6-run.ts`)
refuses a manifest in this folder that is unregistered or changed, and one whose named content is not the candidate.

- **Source:** the owner's "S5 Acceptance and S6 Authorisation" (2026-11-16), and the M0 experiment plan §S6.
- **Specification:** `planning/S6_SPECIFICATION.md` v0.2. The targets and decision rules in its §7 were fixed in v0.1,
  before any S6 simulation (`evidence/s6/registration/`), and are unchanged.
- **Content:** the calibrated candidate `w1-full` 0.6.1 (`content/s6/*.v0.6.1.json`).

**What ran before this registration** (kept and labelled; none is evidence for a hypothesis):
- **Exploratory runs** x01 and x02 and the industry probes (`evidence/s6/exploratory/`). They found the mechanical
  failures F1–F15, each fixed and listed in `FIXES.md`.
- **The calibration pass** c01 and c02 (`evidence/s6/calibration/`), and its reproduction check.
- **Smoke subsets of every manifest** (`evidence/s6/smoke/`). These are plumbing checks: 1 seed, short horizons, 3–17
  tasks.
  - **Two rounds:** `results/s6/smoke/` and `results/s6/smoke-2/`, about 2½ minutes each. Every task completed.
  - **Between the rounds, measures were added and nothing else changed** (content, policy, targets and cells as
    before):
    - E04 records gold earned and kills from the lifetime counters. Its ledger change is now labelled net, because
      spending is included; E07's material change is labelled the same way.
    - The stall measure also records the open gap at a run's end.
    - Milestones record the connected-automated time.
    - Snapshots record the gold spent per Monument (E11's Monument gold share) and the legion's time by category (the
      waiting share).
  - **What the smoke rows showed:** they were read for plumbing and are not evidence. They include single-seed values
    that bear on two checks:
    - boss repeats paid 1.7–3.0 times frontier farming, against the H-S6-04 limit of 1.5;
    - the hero's damage share was about 0.18.
  - **Nothing was tuned after them.** The calibration pass had already ended.
- **The analysis script** `repro/s6/analyze.py` was tested on the smoke rows (registered with its hash).

## 1. Experiments

| Manifest | What | Size | Budgets (enforced) |
|---|---|---|---|
| `S6-E01-profile-matrix` | every profile × {its policy, POL6-WARRIOR, POL6-MAGE}, horizons 5 min … D30 | 11 × 3 × 3 seeds = 99 | 3 h; 60 min per task |
| `S6-E02-completion` | PR-BAL, PR-CAS, PR-CMB, PR-OPT to D30 | 4 × 20 seeds = 80 | 3 h; 60 min per task |
| `S6-E03-strategy-spread` | PR-BAL × {BAL, CONQ, NOMON, WARRIOR, MAGE, BOSSFARM}, D7 | 6 × 5 seeds = 30 | 90 min; 45 min |
| `S6-E04-earlier-zones` | one connected hour per zone 1–10 and the frontier policy, from one connected wall day | 11 × 3 seeds = 33 | 90 min; 45 min |
| `S6-E05-sensitivity-stage1` | 8 factors × {0.5, 1.5} and the baseline, PR-BAL to D14 | 17 × 3 seeds = 51 | 90 min; 45 min |
| `S6-E06-rare-heroes` | PR-BAL, PR-COL × {POL6-BAL, POL6-NORARE}, D14 | 2 × 2 × 10 seeds = 40 | 90 min; 45 min |
| `S6-E07-boss-rewards` | each boss: Normal repeats against frontier farming for one hour after the first clear | 3 × 10 seeds = 30 | 90 min; 60 min |
| `S6-E10-connected-idle` | four arms: active, connected idle and offline per wall hour | 4 × 10 seeds = 40 | 90 min; 45 min |
| `S6-E11-power-pricing` | PR-BAL, PR-CMB × {80/15 %, 120/18 %, 160/20 %}, D14 | 2 × 3 × 5 seeds = 30 | 90 min; 45 min |

**Every manifest also has** a 10-minute heartbeat budget (a task must report progress at least that often) and a
12 GB process memory budget.

**S6-E08 and S6-E09 have no manifest.** They are read from the E01 and E02 rows (specification §7).

**The sizes are the specification's** (§7). They are smaller than S5's 200 seeds because each S6 run is a whole World 1
account over up to 30 days.

## 2. The S6-E05 stage 2 (registered rule)
`repro/s6/e05_stage2.py` (its hash is registered) runs once the registered stage 1 is COMPLETE.

**The rule:** a factor goes to stage 2 when, at either multiplier, either of these differs from the baseline's by at
least 10 %:
- its mean D7 legion EXP;
- its median world-clear active hours. A run that does not clear by D14 counts as an infinite time, and a missing D7
  snapshot counts as a difference.

**What the script writes:**
- `S6-E05-sensitivity-stage2.json`: the selected factors × {0.5, 0.75, 1.25, 1.5} and the baseline, × 5 seeds, PR-BAL
  to D14, with a 2-hour budget;
- `preregistration-stage2.json`: the time, the rule's hash, the stage-1 rows' hash and the selection table. This is
  written even when no factor is selected.

Stage 2 runs only after both are written.

## 3. How each target is judged (specification §7, fixed in v0.1)
`repro/s6/analyze.py` computes these from the rows. A miss is reported as a miss.

| Target | Rows | Decision |
|---|---|---|
| **H-S6-01** | E02, PR-BAL | The median active hours to the final Normal clear over the 20 seeds is within [4, 8]. A seed that does not clear by D30 counts as above 8. The 10th and 90th percentiles are reported, and so are the other three profiles. |
| **H-S6-02** | every E01 and E02 row | No run's longest stall exceeds 60 active minutes. The stall counts both kinds of gap in active time with no progress event: the gaps between events, and the open gap at the run's end. |
| **H-S6-03** | E03 | The best strategy's mean D7 legion EXP ÷ the worst's is within [1.1, 2.0]. |
| **H-S6-04** | E07 | For each boss, the mean gold per hour and the mean EXP per hour of Normal repeats ÷ frontier farming, over the seeds that reached the boss, are each at most 1.5. A boss no seed reached is reported as not tested. |
| **H-S6-05** | every E01 and E02 row | Each run's peak state integer is below 1 % of 2^53 − 1, and no run exhausts the EXP table: its maximum level is below 601, and it was not stopped by `XP_TABLE_EXHAUSTED`. |
| **Sidegrade** (E06, candidate) | E06 | For each profile, the mean D14 legion EXP with rare heroes ÷ without is within [0.90, 1.15]. |
| **Not universally respawn-limited** | E01 at D7 | Flagged if, in every cell with the profile's policy, the mean waiting time exceeds 50 % of the connected time. |
| **Hero contribution** | E01 and E02 at D7 | The mean hero share of squad damage per profile, reported against the S2 band [0.30, 0.60]. |
| **Active gameplay** | E10, control arm | The mean active legion EXP per wall hour ÷ the connected-idle one is above 1. |

**Descriptive** (no target): E01 and E08 milestones; E04's yield per zone; E05's tornado and elasticities; E10's other
arms; E11's arms; the Monument of Eternity's purchase timing and offline share.

## 4. How the runs go
- **Order** (`repro/s6/run_all.sh`), one manifest at a time:
  1. the registration check and the full test suite (the chain stops if either fails);
  2. E02, E01, E03, E05 stage 1, E06, E07, E04, E10, E11;
  3. the E05 stage-2 registration and run;
  4. the registration check again.
- **Workers:** each manifest runs on 15 worker threads. Every task is a pure function of its manifest and its index,
  so the rows do not depend on the number of workers or their order.
- **Stopped runs:** a run the watchdog stops is written as STOPPED with its reason and the rows completed. It is
  reported, never silently rerun.
- **Fixed during the runs:** no code, content or manifest changes while they run. The final registration check shows
  this.
