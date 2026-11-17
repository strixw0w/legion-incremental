# S6 evidence: complete World 1 (headless)

**Status: candidate, uncommitted, awaiting independent review and owner acceptance.**

**Baseline:** HEAD is the S5 checkpoint (commit `1b285dbd30176ff21cf002ad608bf4638521abbd`, annotated tag
`s5-checkpoint`; S5 accepted with corrections A–D). S6 is uncommitted on top of it, and nothing is pushed. S7 has not
been started, and no Roblox gameplay was implemented.

**Source:** the owner's "S5 Acceptance and S6 Authorisation" (2026-11-16).

**About independence:** every check here was written and run by the same author as the code. None is an independent
review; that is the owner's.

## Where to start

| Document | What it holds |
|---|---|
| `planning/S6_SPECIFICATION.md` v0.2 | the design as implemented (S6-R01 … R16), the content, the policy POL6, the experiments and the fixed targets |
| `evidence/s6/registration/S6_SPECIFICATION_v0.1_before_any_result.md` | v0.1, written before any S6 simulation; its §7 targets are unchanged |
| `evidence/s6/exploratory/FIXES.md` | every mechanical fix, F1–F19, with the failure it repaired |
| `evidence/s6/calibration/CALIBRATION_NOTES.md` | the one calibration pass (gate kills × 12 from zone 4) |
| `manifests/s6/PREREGISTRATION.md`, `preregistration.json` | the registration (2026-11-16T22:20:00Z) |
| `manifests/s6/AMENDMENT_01.md`, `preregistration-amendment-01.json` | the amendment after the first chain failed (2026-11-16T23:07:03Z) |
| `evidence/s6/analysis/ANALYSIS.md` (and `analysis.json`) | every table below, computed by the registered `repro/s6/analyze.py` |
| `evidence/s6/experiments/` | the registered rows and run records (amendment 01) |
| `evidence/s6/gates/gates-run.txt` | the gates: mutation set, suites, controls, reruns, registration, preservation |

## What happened, in order

| When (UTC, 2026-11-16/17) | Step | Record |
|---|---|---|
| 15:18 | specification v0.1, targets fixed | `evidence/s6/registration/` |
| 18:04–18:41 | exploratory runs x01, x02 and industry probes; fixes F1–F15 | `evidence/s6/exploratory/` |
| 18:44–18:59 (runs); 22:05 (chosen) | calibration pass c01, c02; gate kills × 12 from zone 4 chosen (candidate 0.6.1) | `evidence/s6/calibration/` |
| 22:09–22:18 | calibration reproduction check; two smoke rounds; measures added between them | `evidence/s6/smoke/` |
| **22:20:00** | **registration** | `manifests/s6/preregistration.json` |
| 22:20–22:51 | first registered chain: **S6-E02 returned a task error in all 80 tasks** (the engine's 20-million event budget ended every D30 account near day 17); the chain was stopped by the operator; no outcome was seen | `evidence/s6/registered-chain/` |
| 22:52–23:05 | diagnosis; fixes F16–F19; D30 check of two seeds | `evidence/s6/amendments/` |
| **23:07:03** | **amendment 01 registered** (manifests, content, analysis, specification and targets unchanged) | `manifests/s6/preregistration-amendment-01.json` |
| 23:07–01:49 | amendment chain: the full suite, then all nine manifests and the E05 stage 2 (selected by its rule at 01:27:09); every workload COMPLETE, 0 task errors, within budget; registration unchanged before and after | `evidence/s6/a01-chain/chain.txt` |
| 01:50 onwards | gates | `evidence/s6/gates/` |

## Verification summary

**The gate record** is `evidence/s6/gates/gates-run.txt` (2026-11-17, 01:49–02:27Z, after the amendment chain). The
suite outputs are in `evidence/s6/gates/suites/`.

| Check | Result |
|---|---|
| Type check | clean |
| Tests (`npm test`) | 1,746 passed, 0 failed (51 files). S6: `test/s6.w1.test.ts` (25) and `test/s6.gates.test.ts` (17, written in the gate phase; see below). After the three test tightenings: 1,746 passed (`suites/test-output-after-followup.txt`). |
| Statistical suite | 9 passed |
| Fixtures | 669 cases, 0 problems |
| Oracles | 22 groups, 0 failing |
| Schemas | OK |
| Mutation set (53 planted bugs in the S6 code) | **First run: 49 / 53 detected** (`mutation-check-s6.txt`). M26, M48 and M51 were not; three tests were tightened, and the follow-up detects 3 / 3 (`mutation-check-s6-followup.txt`). **M39 is not detectable** by a passing run: it removes a monitor check of an invariant the engine keeps, so a negative test would need a defective engine. Every file was restored (SHA-256). |
| Registered experiments (amendment 01) | 10 / 10 workloads COMPLETE: 578 tasks, 0 task errors, every one within its wall, task, heartbeat and memory budgets (`evidence/s6/a01-chain/chain.txt`) |
| The first registered attempt | S6-E02: 80 / 80 task errors. Four runners were stopped by the operator, with no rows. The record is kept (`evidence/s6/registered-chain/`; amendment 01). |
| Historical controls (fresh, `--verify`) | 9 / 9 MATCH. The exact dependency cache shows 45 MISS (the engine changed), so the controls were run fresh. |
| S5 registered reruns on the S6 code | S5-E01, E04 and E02: semantic rows identical to the packaged S5 results. The S6 engine changes keep every S5 path. |
| Calibration reproduction | c02's × 12 task from the written candidate 0.6.1: identical on every field c02 has. The added fields are measures only. |
| Code against the registrations | **Against the original:** exactly three files differ, `legionMetrics.ts`, `experiments.ts` and `s6-run.ts` (F16–F19; `code-digest-check.txt`). **Against amendment 01:** unchanged before the chain, after it, and after the gates. |
| Registration (all registers) | S5, L2.1, L2, S4, S3.1 and S3: 0 changed. The S6 original's stage-2 rule and code changed exactly as amendment 01 records. |
| Preservation | 0 tracked evidence, manifest, content, fixture, formula or repro files changed since `s5-checkpoint` |
| Frozen simulator, Original v1 archive, old workspace | identical; nothing pushed (`evidence/s6/frozen-check.txt`) |

**Gate-phase tests** (`test/s6.gates.test.ts`): written after a coverage review of the W1 paths, before the mutation
set. They cover:
- StartBoss outside a session;
- a boss opening exactly at its kills;
- the world clear;
- elite drops, duplicates and shards;
- traits;
- roster milestones and the Feat counter;
- a failed attempt on the boss board;
- the harness's day chunks;
- guard-stopped runs and the event budget;
- six more checkpoint refusals.

Writing them found F16.

## Results against the fixed targets

**The targets and decision rules were fixed in v0.1, before any S6 simulation.** Nothing was tuned after the
calibration pass. Every miss below is reported as a miss.

| Target | Rule (fixed) | Result | |
|---|---|---|---|
| **H-S6-01** World 1 completion (E02) | PR-BAL median active hours to the final Normal clear within 4–8 | median **6.64** (P10 6.55, P90 6.91); 20 / 20 cleared by D30 | **PASS** |
| **H-S6-02** no long stall (E01, E02) | no run more than 60 active minutes without a progress event | **3 of 179** runs over 60: 85.3 (PR-COL, POL6-BAL), 76.7 (PR-OPT, POL6-BAL-ATT), 74.0 (PR-OPT, POL6-MAGE) minutes, all after the world clear (calendar days 12–22); every other run at most 50.2 | **MISS** |
| **H-S6-03** strategy spread (E03) | best ÷ worst D7 legion EXP within 1.1–2.0 | **3.95**: POL6-CONQ (no industry) best, POL6-BOSSFARM worst | **MISS** |
| **H-S6-04** boss repeats (E07) | a repeat's gold and EXP per hour at most 1.5 × frontier farming, every boss | gold 3.06 / 1.53 / 2.02 and EXP 2.81 / 1.48 / 2.09 (Bandit Chief / Ruin Warden / Fallen King) | **MISS** |
| **H-S6-05** numeric headroom (E09) | peak below 1 % of 2^53 − 1; no table exhaustion | peak 4,294,920,125 (a random-stream word; 4.8 × 10⁻⁷ of 2^53 − 1); highest level 325 of 601; none exhausted | **PASS** |
| Sidegrade (E06, candidate band) | with ÷ without rare heroes, D14 legion EXP, within 0.90–1.15 | 0.982 (PR-BAL), 0.959 (PR-COL) | **PASS** |
| Not universally respawn-limited | flagged if waiting exceeds 50 % of connected time in every cell at D7 | largest mean share 0.27 (PR-FREQ) | not flagged |
| Hero contribution | reported against the S2 band 0.30–0.60 | 0.17–0.19 in every profile (0 of 11 inside) | **outside the band** |
| Active gameplay (E10, control arm) | active ÷ connected-idle EXP per hour above 1 | 2.85 | **PASS** |

## What the results show (plain summary)

**1. World 1 moves one step per session, and offline play does the work.**
- **How it works:** each absence completes the frontier's kill gate. At the next session start, the hero walks into
  the newly opened zone or beats the boss at the first attempt.
- **The result:** most profiles clear the world after about seven sessions, whatever the session length.

  | Profile | Active hours to the clear (median) | Calendar days |
  |---|---|---|
  | PR-5MIN | 0.67 | 8.0 |
  | PR-FREQ | 1.34 | 1.2 |
  | PR-CAS | 1.76 | 3.5 |
  | PR-POOR | 4.39 | 4.0 |
  | PR-ECO | 5.14 | 3.0 |
  | PR-OPT | 5.41 | 1.45 |
  | PR-COL | 5.41 | 3.0 |
  | PR-CMB | 6.58 | 3.0 |
  | PR-BAL | 6.63 | 6.0 |
  | PR-ABS | 6.82 | 18.3 |

- **What this means for H-S6-01:** the pass comes from PR-BAL's one-hour sessions. The same content takes PR-5MIN 40
  active minutes. Active hours are not a good pacing measure for this design; sessions and calendar days are. This is
  a design question for the owner, not a tuning change.

**2. Bosses do not gate.**
- **Failures:** 1 in 481 boss attempts across E02. The levels gained offline overpower every boss.
- **Elite versions:** each falls minutes after its Normal clear, and the Elite Fallen King 0.01 active hours after the
  world clear.
- **Rare heroes:** all three are earned in every realistic run before the clear (S6-E06: the Guardian at about 2, the
  Huntress at about 3, the Stormcaller at about 4–5 active hours for PR-BAL).

**3. Repeating a boss pays 1.5–3 times farming per connected hour (the H-S6-04 miss), yet boss farming loses
overall.**
- **Why it pays per hour:** a repeat takes seconds (410 Bandit Chief clears per hour).
- **Why it loses:** POL6-BOSSFARM ends sessions at the boss zone instead of the frontier. The offline farming that
  follows, which is most of progress, is therefore weaker: E03 gives 0.42 times POL6-BAL's D7 legion EXP.

**4. Industry and Monuments cost more than they give back by D7.**
- **Without industry:** POL6-CONQ (no gathering or smithing) has 1.66 times POL6-BAL's D7 legion EXP, because recruits
  in industry roles do not fight.
- **The weakest profile is faster:** PR-POOR (no gear, no Monuments, no Elite attempts) clears in 4.39 active hours and
  4 calendar days, against POL6-BAL's 6.63 hours and 6 days.
- **Gear still progresses:** the gear tiers are reached, with Mithril at about 6–7 active hours.

**5. The Monuments stop at their milestones.**
- **Where they stop:** at D30 most runs hold Power at 29, Industry at 14 and Vitality at 14–29.
- **Why:** the next milestone needs a material from an earlier zone, such as slime gel from zone 1 for Power 30. POL6
  never goes back to farm it, so the S6 design's "earlier-material relevance" is not exercised by the policy.
- **Gold is not the constraint:** Monuments take 0.3 % of the gold earned, so E11's three Power pricing arms cannot be
  told apart.
- **Eternity:** it reaches its maximum (25) early in every realistic profile, at 0.2–2 active hours (PR-BAL: 1.0).

**6. The hero's share of squad damage is about 0.18 in every profile**, below the S2 band of 0.30–0.60.

**7. Zone 10 is respawn-limited.** It has six spawn slots, and the hero waits a third of the time. A connected hour in
zone 9 gives about 10 % more EXP and gold than in zone 10 (E04). The earlier zones give 32–80 % of the frontier's EXP.

**8. The S5 connected-idle incentive mostly disappears in World 1.**
- **The gap:** connected idle gives 1.07 times offline per hour at the 60 % rate, and exactly the same at 80 % or 100 %.
  Farming is limited by respawns, not by the offline rate.
- **Active play:** it gives 2.85 times connected idle (E10).

**9. Sensitivity (E05).**
- **Productive slots dominate:** × 1.25 gives 1.7 times D7 legion EXP and a clear in 0.65 times the active hours.
- **The offline rate matters only below the candidate:** × 0.5 gives 0.72; above it, nothing changes.
- **Every other factor moves D7 legion EXP by at most about 12 %.**
- **The clear time moves for almost nothing but slots,** because progress is session-stepped. Its small changes are
  session-sized steps, not smooth responses.

**10. Little is left to do after the world clear (E08).** Every Elite clear, every rare hero and the Monument of
Eternity come before or at the clear. Mithril gear follows within an hour. The Monument maxima are never reached
(finding 5).

## Missed targets, findings and limitations

**Missed targets (nothing was tuned to pass):**
1. **H-S6-02:** three long stalls, all in 90-minute-session profiles.
   - **When:** all three come after the world clear, on calendar days 12–22 at levels 291–311, in the endgame. The
     replays (`evidence/s6/analysis/stall-locations.txt`) reproduce each one.
   - **Why:** level-ups have become slow there, and emblem finds are nearly the only progress events.
   - **The fixed rule** does not distinguish the endgame, so this is a miss.
2. **H-S6-03:** the strategy spread is 3.95. Industry is a net loss, and boss farming a large one.
3. **H-S6-04:** boss repeats pay well above farming per connected hour.
4. **The hero-contribution band** is missed in every profile.

**Questions for the owner:**
- the pacing measure (sessions against active hours, finding 1);
- whether bosses should gate;
- the industry and Monument value (findings 4 and 5);
- zone 10's spawn slots.

**Process findings (disclosed):**
- **The first registered chain failed** (amendment 01). The smoke subsets used short horizons and could not reveal
  the event budget. The operator's stop of the chain needed several steps, all recorded.
- **The reward monitor defect F16** was found by a gate-phase test. It never affected a registered row.
- **Commands outside a decision:** a W1 `StartBoss` submitted from outside a policy decision fails, because the engine
  reads the current step's time. Every policy submits inside a decision, so no run is affected; the gate test sends
  its command through a decision.

**Limitations:**
- **Boss mechanics** are stats only, and accuracy has no source (specification §9).
- **Workers** never meet elites.
- **Talents** are complete at level 20.
- **The welcome-back summary** does not name a rare hero earned offline.
- **Sample sizes:** E01 has 3 seeds per cell. The stall measure (H-S6-02) is a maximum, so more seeds would find more
  long stalls.
- **E07 and E04** start from accounts grown in one connected session, not along a profile's path.
- **POL6 is a model:** its fixes F3–F14 make it run, not optimal. Findings 3–5 are partly findings about the policy.
- **Every number is a candidate,** and every measurement is a lab simulator measurement on this machine.

## Deterministic fingerprints, git, frozen workspaces, archive
- **Fingerprints:** `evidence/s6/fingerprints.txt` (content, registrations, manifests, rules, analysis, chains, and
  every experiment's rows fingerprint; the first attempt's E02 too).
- **Git:** `evidence/s6/gates/git-status.txt` and `evidence/s6/s6-vs-s5-checkpoint.patch`.
- **Frozen workspaces:** `evidence/s6/frozen-check.txt` (the frozen simulator, archive and old workspace).
- **Registration and preservation:** `evidence/s6/gates/registration-check.txt`, `s6-registration-check.txt`,
  `s6-amendment-01-registration-check.txt` and `preservation-check.txt`.
- **The review ZIP** has a checksum manifest (`MANIFEST.txt`), and its fresh-extraction verification log sits beside
  the ZIP.
