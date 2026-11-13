# S1.1 evidence — targeted correction pass after the independent S1 review

**Increment:** S1.1, authorised by the owner's "Independent S1 Review and S1.1 Authorisation" (S1 conditionally accepted).

**Date:** 2026-11-13.

**Status:**
- **Uncommitted.** S1 and S1.1 await independent review and owner acceptance.
- **Not pushed.** The GitHub remote is public.
- **S2 not started.**

**Labels:**
- Content and the EXP curve are unchanged candidates (`w1-slice.candidate.v0.1.0`, fingerprint `cb130aba…8ec6`).
- Every result is model output. Nothing is live-validated or approved.
- ORC-BRUTE is a restricted fixed-zone lookahead used as a comparison control; it is **not an upper bound**.

**Engineering gates:** **All engineering gates pass.** (711 default tests, 9 statistical tests, 324 fixture cases, 15 oracle groups, 20 planted bugs).

---

## 1. Independent verification recorded (not overstated)
As stated by the owner (`planning/S1_OWNER_RESOLUTIONS.md` §1):
- **The reviewer independently verified:**
  - the S1 ZIP hash and all 320 files (hash and size), with no unexpected files;
  - all nine S1 pre-registration hashes;
  - the Python oracles: 15 groups, 0 failures; the preview check was skipped in that invocation;
  - the scope, and the presence of the S0 ledger identity correction;
  - all 200 replicates of the base PR-BAL / POL-FRONTIER cell of S1-E08, run against the real TypeScript engine on Linux with Node 22.16.0. EXP p10/p50/p90 = 8,178 / 8,200 / 8,244 and the combined event-log digest `4ca19b6b…7ac3ba` match the packaged results exactly. The content was rebuilt from the packaged values, because Zod was unavailable offline.
- **The full Vitest suite was not independently re-run.**
- **Everything in this document is run on this machine** (Windows, Node 24.22.3) and is likewise not independently re-run.

## 2. Each defect, reproduced on the original implementation and on the corrected one
- **Script:** `repro/s1.1/defects.mjs`. It uses only interfaces that exist in both implementations, and it injects the duplicate credit through the engine's own scheduler.
- **"Original"** is the S1 review package (ZIP SHA-256 `b255d94b…6d7fd3`), extracted and verified against its manifest.
- **Complete outputs:** Appendices K and L.

| ID | Owner | Scenario | Original S1 implementation | Corrected S1.1 |
|---|---|---|---|---|
| D1 | §2 | Duplicate `KillCredited` injected after the first kill (6 seeds) | 2 seeds: EXP 8 instead of 4, zone kills 2 instead of 1 (gold 1, ledger replay counted); 4 seeds: **run aborted** with `TX_CONFLICT` (the duplicate rolled the loot again) | 6 of 6 seeds: EXP 4, kills 1, gold 1; the loot stream is identical to the run without the duplicate; rejected as `CREDIT_REPLAYED` |
| D2 | §3 | Level 1, frozen, zone 3, fixed-zone policy, 60 min | first stop 82,000 ms; auto-farm re-enabled 87,000 ms; 124 deaths, 122 stops, 0 kills | POL-FIXED-3: stop 82,000 ms, never re-enabled, 3 deaths, report `FIXED_ZONE_BLOCKED` at 87,000 ms. The control CTL-FIXED-3-S1 still reproduces S1 (124 deaths, 122 stops) |
| D3 | §4 | Triggers at the two gate completions (base, CTL-/POL-STAY, seed s1-e01#rep-0) | 283,700 ms: [kill]; 958,400 ms: [kill] | 283,700 ms: [gate-completed, kill]; 958,400 ms: [gate-completed, kill] |
| D4 | §5 | Estimator: zero hit chance; 1-in-4-billion hit chance; level 1 in zone 3 | 2,400 kills/h, TTK 0 s; 2,400.0 kills/h, TTK 2.11e-06 s; 65.2 kills/h, TTK 22.49 s | 0 kills/h, no finite TTK, unreachable (NO_HIT_CHANCE); 0 kills/h, no finite TTK, unreachable (SWING_BUDGET); 2.51e-12 kills/h, TTK 22.49 s, unsafe (UNDER_ONE_KILL_PER_LIFE, AUTO_FARM_STOP_EXPECTED) |
| D5 | §6 | 3 gel per kill; two entries (2 + 1) for gel | 16 kills: ledger 48, metrics 16; repeated: ledger 48, metrics 32 | ledger 48 = quantities 48 (events 16); repeated: ledger 48 = quantities 48 (events 32) |
| D6 | §7 | Auto-farm on at start, off right after the first kill | kills at 10,400, 14,300 ms (an extra automatic kill) | kills at 10,400 ms; the automatic walk started at 10,400 ms is cancelled |
| D7 | §7 audit | Manual Engage, slime chips 1 HP, then idle | 0 regeneration ticks; HP at session end 59/60 | 1 tick; HP 60/60 |
| D8 | §7 audit | Manual Engage waiting for a respawn when session 1 ends; session 2 has no command | 0 commands, 1 kill in session 2 (engagement at 70,400 ms) | 0 commands, 0 kills in session 2 |

**What D1 adds to the reviewer's finding.** In S1, a duplicate rolled the loot again before the ledger saw it:
- when that second roll matched the first, the ledger treated it as a replay and EXP and kills were granted twice (the reviewer's case);
- when it differed, the ledger raised `TX_CONFLICT` and the whole run aborted.

S1.1 checks identity before any draw, so neither can happen.

## 3. The corrections (owner §2–§7)
Each item lists its rule, its code, the tests that inject the fault, its fixtures, and the planted bugs that prove the tests would catch a regression (Appendix I).

**§2 Complete kill-credit identity** (`spec/formulas/s1-combat-loop.md` v1.1 §10; `src/engine/credit.ts`, `simulation.ts`; S1.1-R09):
- **Registry.** When an enemy dies, the engine registers a **pending credit**: `(encounter, enemy instance, zone, boss)`.
- **Classified first.** `KillCredited` is classified before any random draw:
  - **accepted** (matches a pending credit exactly);
  - `CREDIT_REPLAYED`;
  - `CREDIT_CONFLICT`;
  - `CREDIT_UNKNOWN`.

  A rejected claim changes nothing: no gold, materials, EXP, kill count, unlock, boss completion or random draw. It is logged and counted.
- **Not ledger-dependent.** EXP-only encounters (no ledger lines) are protected the same way.
- **One atomic update.** An accepted credit is computed in full, then applied as one state update; if any part fails (tested with a ledger at its numeric limit), nothing is applied.
- **Immutable history.** The committed history is an immutable list shared by forks, so branches stay independent (tested from both an early and a late branch point).
- **Ledger check.** If the ledger ever holds a credit the registry has not committed, that is an engine error.
- **Extension point.** Every future per-kill effect (Bestiary, mastery, unlocks) belongs inside this one operation, after the identity check (`credit.ts` header).
- **Tests and checks:**
  - `test/s1_1.credit.test.ts`: injected exact duplicates on 6 seeds with random drops; duplicates before and after the genuine event; conflicting (zone, boss flag) and unknown claims; EXP-only; boss; branching; atomicity; the registry.
  - Fixtures `credits.v1.json` (6 cases), re-derived by the Python oracle.
  - Planted bugs C1–C5.

**§3 Realistic response to repeated deaths** (`src/policy/realistic.ts`; S1.1-R01, R02, R05, R06, R11):
- **Three behaviours, distinguished:**
  1. **Reckless diagnostic controls** keep the S1 logic: `CTL-STAY-S1`, `CTL-FRONTIER-S1`, `CTL-BEST-SHOWN-S1`, `CTL-FIXED-n-S1`.
  2. **Corrected realistic policies:**
     - they respect the stop: a zone is blocked until the hero levels up;
     - they rest below 30% HP;
     - they retreat to the highest safer accessible zone;
     - otherwise they stop and `Report(NO_SAFE_ZONE)`;
     - they never restart the failing zone on respawn.
  3. **Manual retry:** an accepted `SetAutoFarm(on)` after a stop clears the reason, and one more death inside the window stops it again. `Engage` is always allowed.
- **Threshold kept:** 3 deaths in 5 minutes, with the window `(t − 300,000 ms, t]`. The lower bound is exclusive. The spec, `S1_1_RESOLUTIONS.md` and the code agree, and a test pins both ends.
- **Tests and checks:** `test/s1_1.behaviour.test.ts` (recovery block), including the reviewer's exact scenario; planted bugs R1–R4.

**§4 Policy triggers** (`simulation.ts` `policyBatch`; S1.1-R03, R04):
- **One decision per step.** All POLICY requests at one `(t, pass)` are one decision. It carries every trigger, without repeats, in a fixed order (`TRIGGER_ORDER`).
- **New triggers:** `hero-died`, `auto-farm-stopped`, `boss-cleared`, `boss-failed`.
- **Never suppressed:** decisions at other timestamps.
- **Cascade limit:** more than 8 decisions at one timestamp is `EVENT_CASCADE_LIMIT`.
- **ORC-BRUTE** uses the combined triggers. It is kept unchanged otherwise, as a comparison control.
- **Tests and checks:** kill + level-up + gate at one moment; death + kill; boss clear; auto-farm stop; separate moments; cascade; ORC-BRUTE re-planning exactly at the gate completion. Planted bugs T1–T3.

**§5 Estimator** (`src/engine/estimator.ts`, `spec/formulas/estimator.md` v1.1; S1.1-R10):
- **Explicit budgets.** Unresolved probability mass is never treated as a kill.
- **Honest values.** Zero hit chance and fights beyond the budget are **unreachable** (0 kills/h, TTK `null`).
- **Survival.** An exact survival chain replaces the renewal approximation.
- **Reliability shown** with reasons: unreachable / unsafe / approximate / reliable.
- **S1 estimator kept** unchanged (`estimator-s1.ts`), only as the `estimator: "s1"` control.
- **Tests and checks:** zero and tiny hit chance, budgets, always-dies-first, hand-derived chain cases, the S1 control pinned. Fixtures `estimator.v1.json` (8 cases), re-derived by the oracle. Planted bugs E1–E4.

**§6 Drop events and quantities** (`src/engine/rewards.ts`, `src/experiments/metrics.ts`, `jobs.ts`; S1.1-R12):
- **Structured drops:** `(resource, quantity, entry)`.
- **Two separate measures:**
  - drop **events**, for probability checks: one binomial check per drop entry;
  - awarded **quantities**, for production rates.
- **Reconciled.** Gold and quantities are reconciled with the ledger at the end of every run; a difference fails the run.
- **Tests and checks:** the reviewer's 3-per-kill case, repeated resource IDs, the reconciliation failure, structured entries. Fixtures `rewards.v1.json` v2 (+2 cases). Planted bug D1.
- **S1 results are not invalidated.** Every S1 quantity is 1, so events and quantities coincide in S1 results.

**§7 Auto-farm cancellation and audit** (`simulation.ts`; S1.1-R07, R08):
- **Auto-farm off cancels automatic work:** an `auto` walk or ordinary encounter ends, the target is released at full HP, its events go stale, and regeneration starts.
- **Continues:** manual encounters and bosses. Engagements carry their origin.
- **Audit fixes:**
  - regeneration now starts whenever the hero becomes idle in a session (D7);
  - a session end clears a waiting manual `Engage` (D8);
  - spawn maintenance between sessions is stated explicitly and tested to change nothing of the player's.
- **No offline progression** was introduced.
- **Planted bugs:** A1–A3.

## 4. Engineering gates (these decide acceptance; balance results do not)
| Gate | Result | Evidence |
|---|---|---|
| Type check | clean | `typecheck.txt` |
| Default test suite | 711 of 711 passed | `test-output.txt, test-results.json` |
| Statistical tests | 9 of 9 passed | `test-stats-output.txt` |
| Fixtures through the lab | 324 cases, 0 problems | `fixtures-check.txt` |
| Independent Python oracles | 15 groups, 0 failing (incl. new `credits` and `estimator` families) | `oracle-check.txt` |
| Exported schemas | 3 of 3 match | `schemas-check.txt` |
| S0-R01 curve preview | identical across runs and to S0 | `curve-preview-reproduction.txt` |
| A1 S1 reproduction | PASS: 35 metrics identical … (8 cell pairs, 0 differences) | `analysis.txt §A1` |
| A3 drops | PASS: every entry inside its 99.9% interval; 0 ledger mismatches; quantity identity holds | `analysis.txt §A3` |
| A6 determinism | PASS: identical re-runs, every second-root run differs, 0 of 24 KS rejections | `analysis.txt §A6` |
| Mutation check (critical fixes) | 20 of 20 planted bugs detected; all files restored: True | `mutation-check.txt` |
| `exp:verify` of every S1.1 experiment | 7 of 7 MATCH, 0 MISMATCH | `exp-verify.txt` |
| S1 manifests refused by the S1.1 runner | yes (exit code 2) | `s1-manifest-refused.txt` |
| Frozen simulator, archive, old workspaces | unchanged | `frozen-check.txt` |

## 5. Pre-registration
**Plan:** `manifests/s1.1/PREREGISTRATION.md`: defect reproductions, 7 experiments, analyses A1–A8, gates, and the omitted re-runs with reasons.

- **Registered:** 2026-11-13T20:11:46Z. Document `manifests/s1.1/PREREGISTRATION.md` SHA-256 `5610468d85438bc474e0a2f440c834f9532b29728474510a283d41d86c81e2e4`.
- **Every run started after registration** (start times below). No target or manifest was changed after any result, and there are no amendments.
- **Engineering smoke run before registration.** The runner was checked on throwaway 2-replicate copies of these manifests; those copies and their outputs were deleted.

| Experiment | Manifest SHA-256 | Run started (UTC) | Runs | Semantic fingerprint |
|---|---|---|---|---|
| S1.1-E01-base-attribution | `3131d8cf00a242fc…` | 2026-11-13T20:11:53.110Z | 4,800 | `46730cdf03bfae235bc5d30c76040059d56721eaa008d6d0afc2431e22dee954` |
| S1.1-E02-estimator | `92d3f613d74292a2…` | 2026-11-13T20:12:40.189Z | 3,600 | `dd265cb69af9cf0f85b6b62227bbcee6ff5823d9c5b10faa47649b974c006639` |
| S1.1-E03-earlier-zone-audit | `fbad0dcee058864b…` | 2026-11-13T20:13:12.158Z | 200 | `12a24bea05f61c4927c16287ac46b6511e29b80bb3b21d23a48f402e1cb49b6f` |
| S1.1-E04-survival-policies | `6a40822eadc459bf…` | 2026-11-13T20:13:15.494Z | 4,800 | `ccf0f709f12c037671e2eef082d4cbac961ec6ee09f137e9ab9ff64ccb12678e` |
| S1.1-E05-drops-quantities | `4dce1d15b8928742…` | 2026-11-13T20:14:10.479Z | 600 | `fe72f1a3f7804d2c7ac9c32ccca8bbf563103c36bd15fe48ac144b1156552bc0` |
| S1.1-E06-determinism | `f36833e76191cba8…` | 2026-11-13T20:14:26.896Z | 1,200 | `6d3ff33d3d3333bf07cfaa76733606255d2d812e3d55b123b19f4e072380919c` |
| S1.1-E07-policy-comparison | `199d07e8adf1a7b4…` | 2026-11-13T20:15:07.281Z | 2,600 | `a8a931018a94498fcf2e60990057b3f9b159837d462c444e40f5b47807567506` |

## 6. Results (all model output)
### 6.1 A1 — the corrected engine reproduces S1 exactly when run with the S1 decision logic and the S1 estimator
- `a10-p1.6-g100|PR-NEW|POL-STAY` (S1) vs `a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1` (S1.1): 35 metric summaries compared, 0 different.
- `a10-p1.6-g100|PR-NEW|POL-FRONTIER` (S1) vs `a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1` (S1.1): 35 metric summaries compared, 0 different.
- `a10-p1.6-g100|PR-BAL|POL-STAY` (S1) vs `a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1` (S1.1): 35 metric summaries compared, 0 different.
- `a10-p1.6-g100|PR-BAL|POL-FRONTIER` (S1) vs `a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1` (S1.1): 35 metric summaries compared, 0 different.
- `base|PR-BAL|POL-STAY` (S1) vs `base|PR-BAL|CTL-STAY-S1|est-s1` (S1.1): 35 metric summaries compared, 0 different.
- `base|PR-BAL|POL-FRONTIER` (S1) vs `base|PR-BAL|CTL-FRONTIER-S1|est-s1` (S1.1): 35 metric summaries compared, 0 different.
- `base|PR-BAL|POL-BEST-SHOWN` (S1) vs `base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1` (S1.1): 35 metric summaries compared, 0 different.
- `base|PR-OPT|POL-STAY` (S1) vs `base|PR-OPT|CTL-STAY-S1` (S1.1): 34 metric summaries compared, 0 different.

**A1 PASS.**

**What this establishes:**
- The engine fixes (credit identity, triggers, auto-farm cancellation, regeneration, sessions, drops) change **nothing** in any normal run of the S1 logic, at the same seeds.
- Every difference below therefore comes from the estimator correction or the policy correction.
- It is also the evidence for not repeating the large sweeps (§7).

### 6.2 A2 — attribution: what changed, and why
Each step changes one thing:

| Step | What it is | Cause of the change from the previous step |
|---|---|---|
| L0 | the published S1 cell | (starting point) |
| L1 | S1 logic, S1 estimator | **bug fixes** |
| L2 | S1 logic, estimator v1.1 | **measurement correction** |
| L3 | corrected policies, estimator v1.1 | **policy correction** |

"cross" is the corrected policies with the S1 estimator.

**PR-BAL (60 min), S1.1-E01:**

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L0 S1-E01 | `a10-p1.6-g100|PR-BAL|POL-STAY` | 7,044.78 | 18 | 5.08 | 16.30 | 36 | 34 | 3.50 |
| L1 | `a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1` | 7,044.78 | 18 | 5.08 | 16.30 | 36 | 34 | 3.50 |
| L2 | `a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1` | 7,044.78 | 18 | 5.08 | 16.30 | 36 | 34 | 3.50 |
| L3 | `a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1` | 7,389.41 | 18 | 5.08 | 16.35 | 0 | 0 | 8.58 |
| cross | `a10-p1.6-g100|PR-BAL|POL-STAY|est-s1` | 7,389.41 | 18 | 5.08 | 16.35 | 0 | 0 | 8.58 |

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L0 S1-E01 | `a10-p1.6-g100|PR-BAL|POL-FRONTIER` | 8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 |
| L1 | `a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1` | 8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 |
| L2 | `a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1` | 8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 |
| L3 | `a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1` | 8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 |
| cross | `a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1` | 8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 |

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L1 | `a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1` | 9,320.85 | 20 | 6.17 | — | 4 | 2 | 1.17 |
| L2 | `a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1` | 9,320.85 | 20 | 6.17 | — | 4 | 2 | 1.17 |
| L3 | `a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1` | 9,313.75 | 20 | 6.17 | — | 0 | 0 | 1.83 |
| cross | `a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1` | 9,313.75 | 20 | 6.17 | — | 0 | 0 | 1.83 |

**PR-NEW (45 min), S1.1-E01:**

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L0 S1-E01 | `a10-p1.6-g100|PR-NEW|POL-STAY` | 4,809.36 | — | 5.08 | 16.30 | 36 | 25 | 2.75 |
| L1 | `a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1` | 4,809.36 | — | 5.08 | 16.30 | 36 | 25 | 2.75 |
| L2 | `a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1` | 4,809.36 | — | 5.08 | 16.30 | 36 | 25 | 2.75 |
| L3 | `a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1` | 5,054.11 | — | 5.08 | 16.35 | 0 | 0 | 6.63 |
| cross | `a10-p1.6-g100|PR-NEW|POL-STAY|est-s1` | 5,054.11 | — | 5.08 | 16.35 | 0 | 0 | 6.63 |

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L0 S1-E01 | `a10-p1.6-g100|PR-NEW|POL-FRONTIER` | 5,823.45 | — | 5.08 | 38.14 | 0 | 0 | 4 |
| L1 | `a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1` | 5,823.45 | — | 5.08 | 38.14 | 0 | 0 | 4 |
| L2 | `a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1` | 5,823.45 | — | 5.08 | 38.14 | 0 | 0 | 4 |
| L3 | `a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1` | 5,823.45 | — | 5.08 | 38.14 | 0 | 0 | 4 |
| cross | `a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1` | 5,823.45 | — | 5.08 | 38.14 | 0 | 0 | 4 |

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L1 | `a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1` | 6,220.46 | — | 6.17 | — | 5.33 | 2 | 0.83 |
| L2 | `a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1` | 6,220.46 | — | 6.17 | — | 5.33 | 2 | 0.83 |
| L3 | `a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1` | 6,214.62 | — | 6.17 | — | 0 | 0 | 1.50 |
| cross | `a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1` | 6,214.62 | — | 6.17 | — | 0 | 0 | 1.50 |

**S1.1-E07** (the S1-E08 seeds; its STAY and FRONTIER blocks are in `analysis.txt` and match the above):

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L0 S1-E08 | `base|PR-BAL|POL-BEST-SHOWN` | 9,326.15 | 20 | 6.17 | — | 4 | 2 | 1.17 |
| L1 | `base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1` | 9,326.15 | 20 | 6.17 | — | 4 | 2 | 1.17 |
| L2 | `base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1` | 9,326.15 | 20 | 6.17 | — | 4 | 2 | 1.17 |
| L3 | `base|PR-BAL|POL-BEST-SHOWN|est-s1.1` | 9,315.75 | 20 | 6.17 | — | 0 | 0 | 1.83 |
| cross | `base|PR-BAL|POL-BEST-SHOWN|est-s1` | 9,315.75 | 20 | 6.17 | — | 0 | 0 | 1.83 |

**ORC-BRUTE** (trigger fix = bug fix):

| Step | Cell | EXP (mean) | Level at 60 min | Zone 2 first visit, min | Zone 3 first visit, min | Deaths/h | Auto-farm stops | Idle (auto-farm off), min |
|---|---|---|---|---|---|---|---|---|
| L0 S1-E08 | `base|PR-BAL|ORC-BRUTE` | 8,882.35 | 20 | 5.36 | — | 13 | 3 | 0.58 |
| S1.1 | `base|PR-BAL|ORC-BRUTE|est-s1.1` | 8,886.75 | 20 | 5.06 | — | 13 | 3 | 0.58 |

**Reading:**
- **Bug fixes (L1):** no change in any realistic or control cell (A1).
- **Measurement correction (L2):** no change at the base candidate in these cells.
  - The S1 and v1.1 estimators lead POL-FRONTIER and POL-BEST-SHOWN to the same choices here, and L3 equals "cross".
  - The estimator correction matters where the displayed rates matter in dangerous zones (§6.4). It did not change these policies' paths at the base.
- **Policy correction (L3):**
  - **POL-STAY** no longer dies about 36 times an hour. It rests and is never stopped, and its mean EXP rises from 7,044.78 to 7,389.41 (4.9%) at PR-BAL, at the cost of more idle (resting) time.
  - **POL-FRONTIER** is unchanged, because it never died.
  - **POL-BEST-SHOWN** stops dying (4 → 0 deaths/h p50); its EXP changes by about −0.1%.
- **ORC-BRUTE:**
  - it now re-plans at the gate completion: zone 2 first visit p50 5.36 → 5.06 min;
  - its mean EXP moves from 8,882.35 to 8,886.75;
  - its result changed only because of the trigger bug fix.

### 6.3 A4 — reckless S1 logic against corrected realistic recovery (S1.1-E04)
| Enemy damage | Policy | Deaths/h p50 | Auto-farm stops p50 | Stop reports (mean) | Idle min p50 | Zone 3 first visit min p50 | Level at 60 min p50 | EXP (mean) |
|---|---|---|---|---|---|---|---|---|
| ×0.5 | CTL-STAY-S1 | 21 | 12 | 0 | 1.67 | 15.39 (200/200) | 19 | 7,768.69 |
| ×0.5 | POL-STAY | 0 | 0 | 0 | 5.33 | 15.52 (200/200) | 19 | 7,983.74 |
| ×0.5 | CTL-FRONTIER-S1 | 0 | 0 | 0 | 3.33 | 36.30 (200/200) | 19 | 8,662.55 |
| ×0.5 | POL-FRONTIER | 0 | 0 | 0 | 3.33 | 36.30 (200/200) | 19 | 8,662.55 |
| ×0.5 | CTL-BEST-SHOWN-S1 | 1 | 0 | 0 | 1 | — (0/200) | 20 | 9,470.35 |
| ×0.5 | POL-BEST-SHOWN | 0 | 0 | 0 | 1.33 | — (0/200) | 20 | 9,444.90 |
| ×1 | CTL-STAY-S1 | 36 | 34 | 0 | 3.50 | 16.28 (200/200) | 18 | 7,046.65 |
| ×1 | POL-STAY | 0 | 0 | 0 | 8.60 | 16.35 (200/200) | 18 | 7,390.62 |
| ×1 | CTL-FRONTIER-S1 | 0 | 0 | 0 | 5.83 | 38.12 (200/200) | 19 | 8,207.04 |
| ×1 | POL-FRONTIER | 0 | 0 | 0 | 5.83 | 38.12 (200/200) | 19 | 8,207.04 |
| ×1 | CTL-BEST-SHOWN-S1 | 4 | 2 | 0 | 1.17 | — (0/200) | 20 | 9,322.60 |
| ×1 | POL-BEST-SHOWN | 0 | 0 | 0 | 1.83 | — (0/200) | 20 | 9,314.45 |
| ×1.5 | CTL-STAY-S1 | 53 | 51 | 0 | 4.92 | 16.79 (200/200) | 17 | 6,155.21 |
| ×1.5 | POL-STAY | 0 | 0 | 0 | 11.82 | 16.68 (200/200) | 18 | 6,789.25 |
| ×1.5 | CTL-FRONTIER-S1 | 0 | 0 | 0 | 4.50 | — (0/200) | 19 | 8,646.70 |
| ×1.5 | POL-FRONTIER | 0 | 0 | 0 | 4.50 | — (0/200) | 19 | 8,646.70 |
| ×1.5 | CTL-BEST-SHOWN-S1 | 5 | 3 | 0 | 1.25 | — (0/200) | 20 | 9,247.80 |
| ×1.5 | POL-BEST-SHOWN | 0 | 0 | 0 | 2.17 | — (0/200) | 20 | 9,239.95 |
| ×2 | CTL-STAY-S1 | 70 | 68 | 0 | 6.33 | 17.39 (200/200) | 16 | 5,332.74 |
| ×2 | POL-STAY | 5 | 1 | 0 | 14.57 | 17.48 (200/200) | 17 | 6,081.61 |
| ×2 | CTL-FRONTIER-S1 | 0 | 0 | 0 | 5.02 | — (0/200) | 19 | 8,366.25 |
| ×2 | POL-FRONTIER | 0 | 0 | 0 | 5.02 | — (0/200) | 19 | 8,366.25 |
| ×2 | CTL-BEST-SHOWN-S1 | 8 | 6 | 0 | 1.50 | — (0/200) | 20 | 9,112.75 |
| ×2 | POL-BEST-SHOWN | 0 | 0 | 0 | 2.67 | — (0/200) | 20 | 9,114.30 |

**Reading:**
- **POL-STAY** (corrected) earns more EXP than its reckless control at every damage level (2.8% to 14.0%). It almost never dies or gets stopped, and it spends more time resting.
- **POL-FRONTIER** is identical to its control: it never reaches the stop.
- **No `NO_SAFE_ZONE` report occurred in any experiment cell** (0 reports in total). That path is exercised by unit tests only, so it is a limitation (§10).

### 6.4 A5 — estimator v1.1 against the stepper (S1.1-E02)
| Cell | Fixed-zone logic | Simulated mean kills/h | v1.1 kills/h | v1.1 error | v1.1 reliability (reasons) | S1 estimator kills/h | S1 error |
|---|---|---|---|---|---|---|---|
| L1-Z1 | CTL-FIXED-S1 | 898.3 | 897.7 | -0.07% | reliable | 906.1 | 0.87% |
| L1-Z2 | CTL-FIXED-S1 | 265.3 | 265.6 | 0.12% | unsafe (AUTO_FARM_STOP_EXPECTED) | 284.9 | 7.37% |
| L1-Z3 | CTL-FIXED-S1 | 0 | 2.51e-12 | n/a (simulated 0) | unsafe (UNDER_ONE_KILL_PER_LIFE, AUTO_FARM_STOP_EXPECTED) | 65.2 | n/a |
| L5-Z1 | CTL-FIXED-S1 | 1,360.6 | 1,363.6 | 0.23% | reliable | 1,363.6 | 0.23% |
| L5-Z2 | CTL-FIXED-S1 | 509.6 | 509.6 | -3.46e-03% | approximate (SURVIVAL_LIMITED) | 516.0 | 1.25% |
| L5-Z3 | CTL-FIXED-S1 | 91.5 | 91.4 | -0.06% | unsafe (AUTO_FARM_STOP_EXPECTED) | 149.4 | 63.28% |
| L10-Z1 | CTL-FIXED-S1 | 2,395 | 2,400 | 0.21% | reliable | 2,400 | 0.21% |
| L10-Z2 | CTL-FIXED-S1 | 849 | 848.2 | -0.09% | reliable | 859.5 | 1.23% |
| L10-Z3 | CTL-FIXED-S1 | 204.6 | 205.3 | 0.37% | unsafe (AUTO_FARM_STOP_EXPECTED) | 233.4 | 14.08% |
| L1-Z1 | POL-FIXED | 901.2 | 897.7 | -0.39% | reliable | 906.1 | 0.54% |
| L1-Z2 | POL-FIXED | 298.7 | 265.6 | -11.07% | unsafe (AUTO_FARM_STOP_EXPECTED) | 284.9 | -4.63% |
| L1-Z3 | POL-FIXED | 0 | 2.51e-12 | n/a (simulated 0) | unsafe (UNDER_ONE_KILL_PER_LIFE, AUTO_FARM_STOP_EXPECTED) | 65.2 | n/a |
| L5-Z1 | POL-FIXED | 1,360.6 | 1,363.6 | 0.23% | reliable | 1,363.6 | 0.23% |
| L5-Z2 | POL-FIXED | 515.1 | 509.6 | -1.05% | approximate (SURVIVAL_LIMITED) | 516.0 | 0.19% |
| L5-Z3 | POL-FIXED | 3.2 | 91.4 | 2,774.83% | unsafe (AUTO_FARM_STOP_EXPECTED) | 149.4 | 4,596.96% |
| L10-Z1 | POL-FIXED | 2,395 | 2,400 | 0.21% | reliable | 2,400 | 0.21% |
| L10-Z2 | POL-FIXED | 852 | 848.2 | -0.44% | reliable | 859.5 | 0.88% |
| L10-Z3 | POL-FIXED | 245.5 | 205.3 | -16.37% | unsafe (AUTO_FARM_STOP_EXPECTED) | 233.4 | -4.94% |

**H-S1-09** (target unchanged, evaluated on the continuous-farming reference cells): 8 pass, 0 miss, 1 not reached of 9.
- Where the simulation kills anything, v1.1's largest error is 0.37%; the S1 estimator's was 63.28%.
- The one "not reached" cell is L1-Z3: the hero never wins there, the simulated rate is 0, and v1.1 shows a vanishing rate marked **unsafe** instead of the S1 estimator's 65 kills/h.
- **POL-FIXED rows** show what respecting the stop does to fixed-zone farming. They are not estimator errors: the estimate describes continuous farming.

### 6.5 Matched-state earlier-zone audit, repeated (S1.1-E03)
| At first visit of | Time min p50 | Hero level p50 | Zone | Fork EXP/h p50 (15-min fork) | Estimate v1.1 EXP/h | S1 estimate EXP/h | v1.1 reliable or approximate |
|---|---|---|---|---|---|---|---|
| zone 2 | 5.08 | 6 | 1 | 6,448 | 5,455 | 5,455 | yes |
| zone 2 | 5.08 | 6 | 2 | 7,160 | 5,119 | 5,214 | yes |
| zone 3 | 16.29 | 10 | 1 | 9,088 | 9,600 | 9,600 | yes |
| zone 3 | 16.29 | 10 | 2 | 8,400 | 8,482 | 8,595 | yes |
| zone 3 | 16.29 | 10 | 3 | 5,984 | 4,518 | 5,135 | no (unsafe) |

| First visit of zone | Earlier zone beats newest (fork) | … (estimate v1.1) | Estimate and fork agree | Tag |
|---|---|---|---|---|
| 2 | 0% | 100% | 0% | HYPOTHESIS |
| 3 | 100% | 100% | 100% | CONFIRMED IN MODEL |

**Reading:**
- **Unchanged:** forks and visit states (A1).
- **Zone 3 first visit:** "CONFIRMED IN MODEL" again. Zone 3 is still never worth entering for EXP at its first visit with these candidate inputs. **The S1 red flag stands.**
- **Zone 2 first visit:** the corrected estimate still prefers zone 1 while the 15-minute forks prefer zone 2. The estimate is for the current level, while the hero levels up during each fork. This is a reported limitation of a fixed-level estimate, not an estimator error; at fixed levels it is within 0.4% (§6.4).

### 6.6 A3 — drop probabilities and quantities (S1.1-E05)
| Cell | Entry | Resource | Chance | Kills | Successes | Expected | 99.9% interval | Inside | Quantity awarded for the resource |
|---|---|---|---|---|---|---|---|---|---|
| base|Z1|L100 | 0 | res.mat.slime_gel | 3,000 bp | 239,500 | 72,071 | 71,850 | [71,113, 72,589] | yes | 72,071 |
| base|Z1|L100 | 1 | res.rare.test_token | 20 bp | 239,500 | 478 | 479 | [409, 553] | yes | 478 |
| base|Z2|L100 | 0 | res.mat.wolf_fang | 2,500 bp | 239,500 | 60,403 | 59,875 | [59,179, 60,573] | yes | 60,403 |
| base|Z2|L100 | 1 | res.rare.test_token | 20 bp | 239,500 | 455 | 479 | [409, 553] | yes | 455 |
| base|Z3|L100 | 0 | res.mat.goblin_scrap | 2,000 bp | 136,055 | 27,198 | 27,211 | [26,726, 27,697] | yes | 27,198 |
| base|Z3|L100 | 1 | res.rare.test_token | 20 bp | 136,055 | 262 | 272.1 | [220, 328] | yes | 262 |
| qty-test|Z1|L100 | 0 | res.mat.slime_gel | 3,000 bp | 239,500 | 71,623 | 71,850 | [71,113, 72,589] | yes | 454,681 |
| qty-test|Z1|L100 | 1 | res.mat.slime_gel | 5,000 bp | 239,500 | 119,906 | 119,750 | [118,945, 120,555] | yes | 454,681 |
| qty-test|Z1|L100 | 2 | res.rare.test_token | 20 bp | 239,500 | 495 | 479 | [409, 553] | yes | 495 |
| qty-test|Z2|L100 | 0 | res.mat.wolf_fang | 2,500 bp | 239,500 | 59,568 | 59,875 | [59,179, 60,573] | yes | 59,568 |
| qty-test|Z2|L100 | 1 | res.rare.test_token | 20 bp | 239,500 | 475 | 479 | [409, 553] | yes | 475 |
| qty-test|Z3|L100 | 0 | res.mat.goblin_scrap | 2,000 bp | 136,041 | 26,948 | 27,208.2 | [26,724, 27,695] | yes | 26,948 |
| qty-test|Z3|L100 | 1 | res.rare.test_token | 20 bp | 136,041 | 281 | 272.1 | [220, 328] | yes | 281 |

### 6.7 A6 — determinism of the corrected engine (S1.1-E06)
1,200 runs; re-run event-log digests identical: yes; semantic fingerprints identical: yes; second-root runs that differ: 1,200; KS rejections at α = 0.001: 0 of 24.

### 6.8 A7 — targets (unchanged S1 targets) for the corrected policies
| ID | Role | Target (unchanged) | PR-NEW|POL-STAY | PR-NEW|POL-FRONTIER | PR-NEW|POL-BEST-SHOWN | PR-BAL|POL-STAY | PR-BAL|POL-FRONTIER | PR-BAL|POL-BEST-SHOWN |
|---|---|---|---|---|---|---|---|---|
| H-S1-01 | target | p90 <= 30 s | 10.40 → pass | 10.40 → pass | 10.40 → pass | 10.40 → pass | 10.40 → pass | 10.40 → pass |
| H-S1-02 | target | p50 in [1, 3] kills | 3 → pass | 3 → pass | 3 → pass | 3 → pass | 3 → pass | 3 → pass |
| H-S1-03a | target | p50 in [2, 5] s | 2.40 → pass | 2.40 → pass | 2.40 → pass | 2.40 → pass | 2.40 → pass | 2.40 → pass |
| H-S1-03b | target | p50 in [2, 5] s | 4.80 → pass | 4.80 → pass | 3.60 → pass | 4.80 → pass | 4.80 → pass | 3.60 → pass |
| H-S1-04 | target | p50 in [5, 15] s | 9.60 → pass | 6 → pass | — → not-reached | 9.60 → pass | 6 → pass | — → not-reached |
| H-S1-05 | target | p50 in [5, 10] active min | 5.08 → pass | 5.08 → pass | 6.17 → pass | 5.08 → pass | 5.08 → pass | 6.17 → pass |
| H-S1-06 | target | p50 > 1 ratio | 2.22 → pass | 6.52 → pass | — → not-reached | 2.22 → pass | 6.52 → pass | — → not-reached |
| H-S1-07a | diagnostic | p50 in [3, 5] active min | 2.45 → miss | 2.45 → miss | 2.45 → miss | 2.45 → miss | 2.45 → miss | 2.45 → miss |
| H-S1-07b | diagnostic | p50 in [10, 20] active min | 14.16 → pass | 14.16 → pass | 14.07 → pass | 14.16 → pass | 14.16 → pass | 14.07 → pass |

Targets were not moved. H-S1-07a (level 5 in 3–5 min, diagnostic) still misses at 2.45 min. H-S1-04 and H-S1-06 are "not reached" for POL-BEST-SHOWN, which never enters zone 3. The curve was not retuned.

### 6.9 Policy comparison with corrected triggers (S1.1-E07)
| Comparison | Policy tag | Estimator | Mean EXP (policy) | Mean EXP (ORC-BRUTE) | Ratio |
|---|---|---|---|---|---|
| ORC-BRUTE / POL-FRONTIER | realistic | s1.1 | 8,208.69 | 8,886.75 | 1.083 |
| ORC-BRUTE / POL-STAY | realistic | s1.1 | 7,393.15 | 8,886.75 | 1.202 |
| ORC-BRUTE / POL-BEST-SHOWN | realistic | s1.1 | 9,315.75 | 8,886.75 | 0.954 |
| ORC-BRUTE / CTL-FRONTIER-S1 | control | s1.1 | 8,208.69 | 8,886.75 | 1.083 |
| ORC-BRUTE / CTL-STAY-S1 | control | s1.1 | 7,042.80 | 8,886.75 | 1.262 |
| ORC-BRUTE / CTL-BEST-SHOWN-S1 | control | s1.1 | 9,326.15 | 8,886.75 | 0.953 |

ORC-BRUTE / POL-BEST-SHOWN = 0.954: below 1, so ORC-BRUTE remains a restricted search that a realistic policy beats.
- **No ratio here is a gap to the optimum.**
- **S2 direction (owner-approved, not implemented):** a stronger search over level-up and gate decision points with explicit budgets, reporting the best known feasible strategy.

## 7. Which S1 experiments remain interpretable (A8)
| S1 experiment | Status after S1.1 | Cause of any change |
|---|---|---|
| S1-E01 calibration sweep | remains interpretable as S1 decision logic with the S1 estimator | corrected-policy behaviour measured on the base cells in S1.1-E01 |
| S1-E02 estimator | stepper side remains (CTL-FIXED-S1 reproduces S1 logic); the estimate side is superseded by S1.1-E02 (estimator v1.1) | measurement correction |
| S1-E03 earlier-zone audit | forks and visits remain (A1 identical); the estimate columns are superseded by S1.1-E03 | measurement correction |
| S1-E04 survival | remains as the reckless S1-logic control; the corrected realistic response is S1.1-E04 | policy correction |
| S1-E05 gate pacing sweep | remains interpretable as S1 decision logic | the ratio depends on zone 3 arrival, which the corrected policies change (S1.1-E01 L3 shows the size of the change at the base) |
| S1-E06 / S1-E06b drops | remain valid: all S1 quantities are 1, so events and quantities coincide; S1.1-E05 adds quantities above 1 | measurement correction (no S1 value changes) |
| S1-E07 determinism | remains for the S1 engine; S1.1-E06 covers the corrected engine | — |
| S1-E08 policy bound | realistic rows remain as S1 logic (A1 identical); the ORC-BRUTE row is superseded (trigger bug), and 'upper bound' is withdrawn; S1.1-E07 replaces it | bug fix (ORC-BRUTE triggers) |

**Omitted re-runs and why** (pre-registered):
- **The sweeps.** S1-E01's 29-variant sweep and S1-E05's 81-variant sweep were not repeated. A1 shows the S1 logic is reproduced exactly, so they remain valid descriptions of the S1 logic; the policy correction's size is measured at the base (E01, E07) and across enemy damage (E04).
- **S1-E06.** It was already superseded by S1-E06b in S1; E05 repeats S1-E06b.

## 8. Owner resolutions and S1.1 rules
- **`planning/S1_OWNER_RESOLUTIONS.md` v1.0** records:
  - the review outcome, and what was independently verified;
  - S1-R01 … R17 as resolved by the owner (no numeric coefficient promoted);
  - the oracle and ledger decisions.
- **`planning/S1_1_RESOLUTIONS.md` v1.0** lists S1.1-R01 … R15. Each is a candidate rule needed to implement the owner's direction, with its consequence. They await owner acceptance.
- **Specs:** `s1-combat-loop.md` v1.1, `gates.md` v1.1, `estimator.md` v1.1 (first written version).

## 9. Ledger infrastructure proposal
`planning/LEDGER_INFRASTRUCTURE_PROPOSAL.md` v0.1:
- the decision (structural sharing approved; prototype not approved; current ledger stays the reference);
- the ten requirements for any replacement;
- the committed-history options (batched settlement, sequence-based replay protection, watermark compaction) that never let an old transaction be credited again;
- the steps, each needing approval.

**No ledger code changed in S1.1.**

## 10. Remaining limitations and red flags
- **Red flag, unchanged:** zone 3 is not worth entering for EXP at its first visit (§6.5). POL-STAY now survives it by resting, but earns less there than earlier zones would give.
- **Diagnostic miss, unchanged:** level 5 at 2.45 min (H-S1-07a).
- **Recovery paths exercised only by tests.** No experiment cell produced a `NO_SAFE_ZONE` report or a retreat-and-retry cycle at the base candidate. Those paths are covered by unit tests and planted bugs only.
- **New candidate behaviour.** The corrected POL-STAY rests below 30% HP; S1's POL-STAY never rested. That is a modelling choice (S1.1-R02), and its thresholds are candidates.
- **Estimator limits:**
  - it assumes continuous farming;
  - it does not model the stop rule, resting or levelling during a session;
  - it models regeneration between fights only by flagging it.
- **Same author.** The oracles and fixtures were written by the same author as the lab, in another language and from the specs. The new `credits` and `estimator` oracles deserve a reviewer's spot-check.
- **Not independently re-run.** Only the S1-E08 base cell was independently reproduced (for S1, not S1.1).
- **Not committed, not pushed.** The public remote's history would still contain the unredacted M0 document committed earlier (commit `0209d93`); only the working copy and this package are redacted.

## 11. Reproduction
```
cd legion-progression-lab
npm ci
npm run typecheck && npm test && npm run test:stats && npm run fixtures:check && npm run schemas:check && npm run oracle:check
npm run curve:preview                                    # twice; S0-R01 fingerprint unchanged
mkdir -p results/s1.1 && cp -r evidence/s1.1/experiments/* results/s1.1/    # fresh copy only
npm run exp:verify -- manifests/s1.1/S1.1-E01-base-attribution.json   # likewise for every manifest in manifests/s1.1/
python -I repro/s1.1/analyse.py .                       # analyses A1-A8 (reads evidence/s1/ and results/s1.1/)
node repro/s1.1/defects.mjs .                            # reproductions on this tree
node repro/s1.1/defects.mjs <extracted S1 review package>/legion-progression-lab   # the same on the original
```
| Experiment | Runs | Semantic fingerprint | `exp:verify` |
|---|---|---|---|
| S1.1-E01-base-attribution | 4,800 | `46730cdf03bfae235bc5d30c76040059d56721eaa008d6d0afc2431e22dee954` | MATCH |
| S1.1-E02-estimator | 3,600 | `dd265cb69af9cf0f85b6b62227bbcee6ff5823d9c5b10faa47649b974c006639` | MATCH |
| S1.1-E03-earlier-zone-audit | 200 | `12a24bea05f61c4927c16287ac46b6511e29b80bb3b21d23a48f402e1cb49b6f` | MATCH |
| S1.1-E04-survival-policies | 4,800 | `ccf0f709f12c037671e2eef082d4cbac961ec6ee09f137e9ab9ff64ccb12678e` | MATCH |
| S1.1-E05-drops-quantities | 600 | `fe72f1a3f7804d2c7ac9c32ccca8bbf563103c36bd15fe48ac144b1156552bc0` | MATCH |
| S1.1-E06-determinism | 1,200 | `6d3ff33d3d3333bf07cfaa76733606255d2d812e3d55b123b19f4e072380919c` | MATCH |
| S1.1-E07-policy-comparison | 2,600 | `a8a931018a94498fcf2e60990057b3f9b159837d462c444e40f5b47807567506` | MATCH |

## 12. Repository state
- **Branch `main`.** HEAD is the S0 checkpoint `ad11a508fd715b08705c5ee72f215f92183f0993` (tag `s0-checkpoint`).
  - **S1 and S1.1 are uncommitted** (18 tracked files modified, 228 untracked, `git-status.txt`).
  - **Not pushed.**
- **Diffs:**
  - `s1_1-vs-s1-package.patch`: S1.1 against the S1 review package (55 file diffs, 7,534 lines);
  - `s1-and-s1_1-vs-checkpoint.patch`: S1 + S1.1 against the S0 checkpoint (101 file diffs, 18,299 lines).

  Local paths in both are shown as `s1-review-package/`, `s1.1-working-tree/` and `<HOME>`. So the diff of the M0 redaction shows its removed lines with `<HOME>` in place of the user profile.
- **Privacy.**
  - `planning/M0_REPOSITORY_VERIFICATION.md` now shows `%USERPROFILE%\…` instead of the local username in five paths. The original is preserved privately outside the repository.
  - No other shared file contained the username.
- **Outside the repository** (`frozen-check.txt`):
  - Frozen workspace files: 3012 (M0: 3012)
  - path/size/mtime list vs M0 start: IDENTICAL
  - content SHA-256 list vs M0 start: IDENTICAL
  - combined fingerprint: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d (M0: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d)
  - frozen HEAD: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; Original v1 working files: 12 (M0: 12)
  - archive master 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; archive/increment6-original-v1 8d80a440d9818c961713b767f696764b3f18db66; remotes 0
  - old Legion workspace: 16 files IDENTICAL to the copy-time hashes
  - Original S1 review package used for reproductions: b255d94ba35c6649d70d838f44f39bda5fde6c7f2b12332adbecb9b1ef6d7fd3
  - All git reads used GIT_OPTIONAL_LOCKS=0; nothing was written to these locations.

---

# Appendices: complete outputs

Verbatim content of each named file in `evidence/s1.1/` (local paths redacted).

## Appendix A. Type check (`typecheck.txt`)

```
$ npm run typecheck


> legion-progression-lab@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


[exit code: 0]
```

## Appendix B. Default test suite, verbose (`test-output.txt`)

```
$ npx vitest run --config vitest.config.ts --reporter=verbose


 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/canonicalJson.test.ts > canonical JSON > sorts keys and removes whitespace 2ms
 ✓ test/canonicalJson.test.ts > canonical JSON > is independent of key insertion order 36ms
 ✓ test/canonicalJson.test.ts > canonical JSON > formats numbers exactly as ECMAScript does (and -0 as 0) 75ms
 ✓ test/canonicalJson.test.ts > canonical JSON > refuses values that have no unambiguous canonical form 1ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > matches exact BigInt arithmetic for any valid inputs 104ms
 ✓ test/xp.property.test.ts > EXP award properties > two awards in sequence equal one combined award (multi-level awards are unambiguous) 109ms
 ✓ test/combat.test.ts > hit chance > is 1 without a requirement and 90% at the requirement (candidate curve) 2ms
 ✓ test/combat.test.ts > hit chance > is monotonic non-decreasing in accuracy and stays inside [floor, 1] 67ms
 ✓ test/combat.test.ts > hit chance > refuses inconsistent curves 0ms
 ✓ test/combat.test.ts > mitigation, crit and damage > mitigation is diminishing and never reaches zero 61ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > addSafe: exact result, or NUMERIC_LIMIT exactly when out of range 61ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulSafe: exact result, or NUMERIC_LIMIT exactly when out of range 102ms
 ✓ test/remainder.property.test.ts > remainder accumulator properties > G1: any partition of the steps gives the same total and remainder 109ms
 ✓ test/remainder.test.ts > exact remainder accumulator > splitting an interval never changes the total or the remainder (G1) 2ms
 ✓ test/remainder.test.ts > exact remainder accumulator > a zero-duration interval changes nothing (G2) 0ms
 ✓ test/remainder.test.ts > exact remainder accumulator > per-hour chain: one hour at 1.5 units/hour, split three different ways 3ms
 ✓ test/remainder.test.ts > exact remainder accumulator > settling every millisecond equals settling once (no gain from frequent rejoining) 272ms
 ✓ test/combat.test.ts > mitigation, crit and damage > crit chance may reach exactly 100%; the excess is reported, not applied (R-A2) 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > damage per landed hit is an integer, rounds exact halves up, and has a floor 1ms
 ✓ test/combat.test.ts > mitigation, crit and damage > hits-to-kill never increases when damage increases (breakpoints are exact) 127ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > balances are never negative and always equal the sum of committed nets (conservation) 270ms
 ✓ test/remainder.test.ts > exact remainder accumulator > persisted remainders survive a save/load round trip and complete later units 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > assignment switching: separate keys never leak into each other 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > large balances: results near 2^53 are exact and beyond it are refused 1ms
 ✓ test/remainder.test.ts > exact remainder accumulator > refuses invalid parameters 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > S0 review reproduction: 2 h at rate 2^53 - 1 in one call equals two 1 h calls 1ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > the largest representable grant succeeds in one call and in parts; one more millisecond is refused 4ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > a full state plus the largest grant still fits exactly 0ms
 ✓ test/remainder.test.ts > per-hour chain v2 (S0.1): one exact division, no intermediate overflow > refuses malformed states before doing any arithmetic 1ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > starts in zone 1 (visited, checkpoint known); other zones have every flag off 27ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a kill gate unlocks access only; the visit and checkpoint come from arriving, at the same arrival 84ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > divRem is exact for every non-negative safe dividend 129ms
 ✓ test/ledger.property.test.ts > ledger properties over random transaction sequences > replaying every transaction again changes nothing (no repeated claims) 106ms
 ✓ test/rng.test.ts > stream identity > is injective: different field tuples never share an encoding 46ms
 ✓ test/rng.test.ts > stream identity > refuses empty, oversized, ill-formed or badly counted identities 2ms
 ✓ test/rng.test.ts > stream identity > never yields the all-zero state, and applies the fallback rule exactly 6ms
 ✓ test/rng.test.ts > generator and sampling > replays exactly: the same stream gives the same sequence 1ms
 ✓ test/rng.test.ts > generator and sampling > produces unsigned 32-bit integers and never reaches the zero state 294ms
 ✓ test/stats.test.ts > stat stacking > adds within a category and multiplies across categories 2ms
 ✓ test/stats.test.ts > stat stacking > the breakdown reproduces the applied value exactly 40ms
 ✓ test/stats.test.ts > stat stacking > source order does not change the result 0ms
 ✓ test/stats.test.ts > stat stacking > inactive categories are neutral; unknown or duplicate entries are refused 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > S0 review reproduction: an active factor of exactly 1 preserves 2^53 - 1 0ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > neutral factors are an exact identity for any base, any number of them, in any position 52ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > W2 hooks from the candidate content pack stay neutral, however large their sources 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > never returns NaN or Infinity: every result is finite and inside [0, 2^53 - 1], or the call is refused 316ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses out-of-range partial and final values (S0 returned Infinity and NaN for these) 1ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > applies categories in ascending id order, whatever order they are listed in 2ms
 ✓ test/stats.test.ts > stat evaluation v2 hardening (S0.1) > refuses sparse, missing or malformed entries with INVALID_CONTENT 11ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > covers every S0, S1 and S1.1 family with unique case IDs, boundary and failure cases, and derivations 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.keys.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nested.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.numbers.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.strings.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.infinity.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > canonical-json > cjson.key-ascii.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.basic.001 (normal) 34ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.both-die.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.retaliation-at-death.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.hero-dies.001 (normal) 10ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.mitigation.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.min-damage.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.crit-half.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.session-end.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.instant-attack.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-walk.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.slow-hero.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-attack.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat-loop > s1.fight.no-hp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.no-requirement.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.at-requirement.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.above.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.below.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.floor.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.zero-accuracy.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.bad-curve.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.hit.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.small.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mit.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.normal.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.cap.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.crit.overcap.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.plain.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.crit-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.mitigated.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.floor.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.zero-raw.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-mult.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-mitigation.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.third.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.five-sixths.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half-mitigation.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.k100-d25.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.milli-below-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.below-half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.half.large-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.min-damage.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.huge-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.overflow.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.not-safe.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-ratio.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.dmg.bad-crit-flag.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.none.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.mitratio.bad-k.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.integer.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.below-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.binary64-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.half-milli.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.too-low.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.attack.range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.breakpoint.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.overkill.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-hp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > combat > combat.htk.bad-dmg.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.valid.001 (normal) 8ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.range-edge.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-hash.001 (failure) 8ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.out-of-range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.duplicate-category.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.hit-floor.001 (failure) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.table-length.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unknown-field.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.unlabelled.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > content > content.bad-id.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.exact-duplicate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.conflict-before-genuine.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.unknown.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.exp-only.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.boss.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > credits > s1.credits.interleaved.001 (normal) 0ms
 ✓ test/rng.test.ts > generator and sampling > Bernoulli always consumes exactly one draw, including p = 0 and p = 1 1ms
 ✓ test/rng.test.ts > generator and sampling > computes thresholds exactly and refuses unrepresentable probabilities 1ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt stays inside [lo, hi] and reports how many draws it used 86ms
 ✓ test/rng.test.ts > generator and sampling > uniformInt boundary behaviour: span 1, span 2^32, refusals 1ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses sparse array (S0 accepted it) at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array with a hole at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses undefined word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses three words at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses five words at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses fractional word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses negative word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses word of 2^32 at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses string word at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses array-like object at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses typed array at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses null at every entry point 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > refuses the all-zero state at every entry point (S0 accepted it in nextU32, bernoulli and uniformInt) 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > validates the state before other arguments 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > a caller mutating a returned state cannot smuggle the zero state in 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > stateFromDigest accepts only a 32-byte Uint8Array 0ms
 ✓ test/rng.test.ts > RNG state boundary (S0.1) > valid states are unaffected: a hand-derived step is unchanged 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > one call matches the BigInt reference for any state, rate and duration; NUMERIC_LIMIT exactly when the grant is unsafe 285ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > the gate-completion decision carries "gate-completed" together with "kill" (the reviewer saw only "kill") 144ms
 ✓ test/xp.property.test.ts > EXP award properties > total EXP is conserved: thresholds consumed + leftover = award 71ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > one award matches unbounded integer arithmetic (no NUMERIC_LIMIT is ever needed) 344ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.harmless.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.hand-chain.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.simultaneous.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.dies-first.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.crits-survival.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.spawn-bound.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.regen-gap.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > estimator > s1.estimator.swing-budget.001 (failure) 30ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-locked.001 (failure) 4ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-ok.001 (normal) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-far.001 (failure) 4ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-here.001 (boundary) 2ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.travel-unknown.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.no-session.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.dead.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.busy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.teleport-undiscovered.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.teleport-ok.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.teleport-unknown.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.autofarm-elsewhere.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.autofarm-off-closed.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.autofarm-off-dead.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.engage-busy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-locked.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-autofarm.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-ok.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-resting.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-done.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-wrong-zone.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-unknown.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.boss-busy.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.rest-in-boss.001 (failure) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.end-session.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-dead.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-closed.001 (failure) 12ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > gates > s1.gates.report-unknown.001 (failure) 3ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.grant-spend.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.aggregate.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.atomic.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.replay.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.conflict.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.failed-not-recorded.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.aggregate-overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.reserve.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.net-zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.zero-delta.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.resource-id.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.field.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > ledger > ledger.invalid.empty.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.nonint.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.add.negzero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.sub.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.sub.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.mul.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.mul.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldiv.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldiv.intermediate-overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.limit.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.divrem.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.ceildiv.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.003 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.naive-bug.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.naive-bug.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.half-below-2p52.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.max-safe.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.rhu.inf.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.small.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.zero.001 (boundary) 9ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.safe-product.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.wide.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.wide.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.per-hour.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.exact-carry.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.bad-d.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > numeric > numeric.muldivrem.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.zero-steps.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.efficiency.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.efficiency.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.huge-product.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.max-den.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.den-too-large.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.den-zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.bad-rem.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.accrue.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.001 (normal) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.split.002 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.tiny.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.persisted.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.large.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-granted.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-granted.split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.slow-max-duration.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.overflow.split.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.max-inputs.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.rate-change.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.rate-change.split.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.timeline.carry.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-state.003 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > remainder > remainder.perhour.bad-rate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.slime.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.always-never.001 (boundary) 1ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.draw-alignment.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.nothing.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.bad-chance.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.qty-three.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rewards > s1.rewards.same-resource-twice.001 (boundary) 4ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.injective.002 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.utf8.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.empty.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.counter.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.encode.surrogate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.state.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.first-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.second-half.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.digest.all-zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a0.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.a1.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.seq.b0.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.one.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.full.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.over.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-bp.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.min.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.too-small.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.range.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.threshold-p.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.half.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.never.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.bernoulli.always.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.d6.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.span1.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.full.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.worst.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.negative.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.inverted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.too-large.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.uniform.nonint.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.max-words.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.zero.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.short.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.null.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.too-big.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.fraction.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > rng > rng.next.not-array.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.stack.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.zero.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-bp.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inexact.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.unknown-category.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.duplicate-source.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-factor.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.negative-flat.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.max.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.neutral.w2-hooks.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.order.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.range.largest.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.final.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.intermediate.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.many.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.overflow.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.bad-active.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.null-source.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > stats > stats.inactive-negative.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.candidate.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.geometric.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.constant.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-a.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-g.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.bad-length.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.table.overflow.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.multi-level.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.none.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.table-end.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.zero-at-end.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exhausted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.exhausted.002 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.guard.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-state.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.large.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.nan.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.reviewer-split.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.near-max.exhausted.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.max-award.multi.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.sequence.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.at-end-with-exp.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.guard.exact.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.bad-guard.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.award.null-threshold.001 (failure) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.001 (normal) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.unsafe.001 (boundary) 0ms
 ✓ test/fixtures.conformance.test.ts > spec/fixtures conformance > xp > xp.cumulative.bad-table.001 (failure) 0ms
 ✓ test/s1.experiments.test.ts > summary statistics > quantiles are nearest-rank observed values; "not reached" sorts above every number 3ms
 ✓ test/s1.experiments.test.ts > summary statistics > the exact binomial interval covers at least 99.9% and is tight 14ms
 ✓ test/s1.experiments.test.ts > summary statistics > KS: identical samples do not differ; shifted samples do 0ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > a campaign job is deterministic and reports the named metrics 225ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > flag invariants hold after every event: visited implies access; checkpoint implies visited 336ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > kill + level-up + gate unlock at the same moment reach the policy together, in the canonical order 5ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a death and a kill at the same moment (both blows land) reach the policy together 32ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a boss clear reaches the policy as "boss-cleared" with its kill 6ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > the auto-farm stop reaches the policy at the death that caused it 24ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > decisions at different moments stay separate: one decision per kill moment, and a scheduled future decision runs 8ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > a policy that keeps causing new triggers at one moment is stopped as a cascade, not looped forever 5ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > ORC-BRUTE re-plans (forks every accessible zone) at the zone 2 gate completion 75ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > an injected exact duplicate after an ordinary kill is rejected: no EXP, kill, gold, drop or random draw twice 19ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > the run continues normally after a rejected duplicate (later kills are credited) 18ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a duplicate processed BEFORE the genuine event credits once; the genuine one is then the replay 1ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a conflicting duplicate (other zone, or the boss flag) is rejected explicitly, before or after the genuine one 3ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a credit for an encounter that never ended in a kill is rejected as unknown 1ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > an EXP-only encounter (no gold, no drops, so no ledger transaction) has full replay protection 4ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > a duplicated boss credit grants the boss EXP and gold once and completes the gate once 5ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > replay after branching: a branch keeps its own history, rejects replays, and never sees the other branch 4ms
 ✓ test/s1_1.credit.test.ts > kill credit is complete and happens at most once (owner review section 2) > is atomic: if any part of the credit fails, nothing of it is applied 14ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > accepts only a registered claim, exactly once, and classifies every rejection 1ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > is persistent: committing never changes an earlier registry value, and branches do not share new commits 0ms
 ✓ test/s1_1.credit.test.ts > credit registry (engine/credit.ts) > refuses to register the same kill twice (an engine error, never a gameplay outcome) 1ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > refuses travel and teleport that break the rules, with the documented reason codes 8ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > a rejected command changes nothing: the run is identical to one that never sent it 86ms
 ✓ test/s1.gates.test.ts > zone flags, kill gates, travel and teleport > teleport to a discovered checkpoint takes teleportMs and is free 29ms
 ✓ test/purity.test.ts > purity of the deterministic core > finds the pure modules 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/arrays.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/labels.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/schema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/content/validate.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/errors.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/combat.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/stats.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/formulas/xp.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/hash/canonicalJson.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/ledger/ledger.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/basisPoints.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/remainder.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/rounding.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/numeric/safeInt.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/sample.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/streamId.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/core/rng/xoshiro128ss.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/exportedSchemas.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureRunner.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/fixtureSchema.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/spec/s1Fixtures.ts uses no clock, ambient RNG, process, timers or I/O 10ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/report/curvePreview.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/content.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/model/types.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/commands.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/credit.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/estimator-s1.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/estimator.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/observation.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/queue.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/rewards.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/engine/simulation.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/oracle.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/policy/realistic.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/jobs.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/manifest.ts uses no clock, ambient RNG, process, timers or I/O 7ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/metrics.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/patch.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/report.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/stats.ts uses no clock, ambient RNG, process, timers or I/O 0ms
 ✓ test/purity.test.ts > purity of the deterministic core > src/experiments/summary.ts uses no clock, ambient RNG, process, timers or I/O 1ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > roundHalfUp equals exact floor(x + 1/2) for any finite double in the safe range 45ms
 ✓ test/numeric.property.test.ts > safe-integer operations agree with exact BigInt arithmetic > mulDivRem: exact quotient and remainder for any safe inputs, NUMERIC_LIMIT exactly when the quotient is unsafe (S0.1) 461ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > baseline timeline: first kill at 8,000 + 2 x 1,200 = 10,400 ms; first swing lands on arrival (next pass) 31ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > simultaneous lethal blows: both die, the kill is still credited, the hero respawns without loss 5ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > retaliation at the moment the enemy dies lands, and the enemy still dies 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > hero death cancels the pending swing (stale) and frees the enemy at full HP 7ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > stale events from a previous encounter never reach the next one 7ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > respawn: with one slot the hero waits, then engages a new instance with a new ID 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > target invalidation: travelling away during the walk frees the reserved enemy and cancels the arrival 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > identical timestamps resolve in phase order: kill, credit, level-up, recompute, next engagement, policy 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > a multi-level award emits one LevelUp per level in order; stats apply to the next swing; HP rises by the max-HP gain 5ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > kill rewards are credited exactly once per kill, with one ledger transaction per kill 572ms
 ✓ test/s1_1.behaviour.test.ts > policy triggers are combined, never dropped (owner review section 4) > orderTriggers removes repeats and follows TRIGGER_ORDER, unknown triggers last and alphabetical 0ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > the reviewer scenario: the S1 control resumes and dies 124 times; the corrected fixed policy stops after 3 deaths and reports why 45ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > POL-STAY leaves a zone that stopped it, farms a safer one, and does not return while its level is unchanged 41ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > a level-up lifts the block: the realistic policy retries the zone only after levelling past the stop level 69ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/s0-core.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp-sweep.index.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a10-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a12-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p1.6.v0.1.0.json stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p1.8.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/tables/xp.w1.sweep.a8-p2.0.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > content/w1-slice.candidate.v0.1.0.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E01-calibration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E02-estimator.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E03-earlier-zone-audit.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E04-survival.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E05-gate-pacing.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E06-drop-correctness-b.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E06-drop-correctness.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E07-determinism.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1/S1-E08-policy-bound.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/preregistration.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E01-base-attribution.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E02-estimator.json stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E03-earlier-zone-audit.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E04-survival-policies.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E05-drops-quantities.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E06-determinism.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > manifests/s1.1/S1.1-E07-policy-comparison.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > package.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench/hamtLedger.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/bench-ledger.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-sweep.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/build-xp-table.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/curve-preview.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp-worker.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/exp.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/export-schemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/fixtures-check.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/paths.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-analyse.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-content.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/cli/s1-traces.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/arrays.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/labels.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/schema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/content/validate.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/errors.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/combat.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/stats.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/formulas/xp.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/hash/canonicalJson.ts stays inside the lab and never references the frozen baseline 4ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/ledger/ledger.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/basisPoints.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/remainder.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/rounding.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/numeric/safeInt.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/sample.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/streamId.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/core/rng/xoshiro128ss.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/commands.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/credit.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/estimator-s1.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/estimator.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/observation.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/queue.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/rewards.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/engine/simulation.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/jobs.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/manifest.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/metrics.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/patch.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/report.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/stats.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/experiments/summary.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/content.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/model/types.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/oracle.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/policy/realistic.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/report/curvePreview.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/exportedSchemas.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureRunner.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/fixtureSchema.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > src/spec/s1Fixtures.ts stays inside the lab and never references the frozen baseline 2ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/canonicalJson.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/combat.test.ts stays inside the lab and never references the frozen baseline 7ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/content.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/fixtures.conformance.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/fixtures.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/reference.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/helpers/s1.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/isolation.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/ledger.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/numeric.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/purity.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/remainder.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/rng.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/runtime.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.determinism.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.events.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.experiments.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1.gates.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1_1.behaviour.test.ts stays inside the lab and never references the frozen baseline 1ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/s1_1.credit.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/schemaDrift.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/rng.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats/s1.drops.distribution.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/stats.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.property.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > test/xp.test.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > tsconfig.json stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/isolation.test.ts > isolation of the Legion lab > vitest.stats.config.ts stays inside the lab and never references the frozen baseline 0ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > session boundary: a lethal swing exactly at the session end is not resolved; one ms later it is 3ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > nothing happens between sessions; the next session re-engages with the entry walk; time adds up 4ms
 ✓ test/s1.events.test.ts > S1 event semantics (architecture 9.3) > an idle hero with no commands does nothing and earns nothing 2ms
 ✓ test/s1.events.test.ts > kill reward draws (s1-combat-loop.md section 10) > every drop entry uses exactly one draw, even at 0%, so later entries stay aligned 3ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G1: any partition of a duration gives the same total and state, for rates up to 2^53 - 1 355ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > opens after the zone 3 kill gate count and is cleared inside the timer; the clear is credited once 3ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > the timer is half-open: a lethal hit exactly at the timer is too late 5ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > death in the boss fight fails it with no loss; the gate stays open for a retry 2ms
 ✓ test/s1.gates.test.ts > prototype miniboss stub (active-only) > auto-farm never starts the boss, and StartBoss is refused while auto-farm is on 101ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > S0 review reproduction: 100 * 1.005 = 100.5 rounds up to 101 6ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > exact halves through mitigation ratios that binary64 cannot represent round up 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > values just below a half round down, even one part in 10^12 below 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > matches exact integer arithmetic for any valid input; NUMERIC_LIMIT exactly when the result is unsafe 602ms
 ✓ test/ledger.test.ts > ledger > aggregates lines per bucket before validating 3ms
 ✓ test/ledger.test.ts > ledger > is atomic: a failing line changes nothing, and the input ledger is never mutated 1ms
 ✓ test/ledger.test.ts > ledger > replays an identical transaction without applying it twice 0ms
 ✓ test/ledger.test.ts > ledger > identical payloads replay regardless of object key order (canonical hashing) 0ms
 ✓ test/ledger.test.ts > ledger > refuses the same txId with a different payload 0ms
 ✓ test/ledger.test.ts > ledger > a failed transaction is not recorded and can succeed later 0ms
 ✓ test/ledger.test.ts > ledger > refuses overflow, including overflow while aggregating 0ms
 ✓ test/ledger.test.ts > ledger > refuses malformed transactions 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > S0 review reproduction: mutating a returned receipt cannot change the replay receipt 1ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > committed history cannot be cleared or rewritten through the returned ledger (S0 allowed a double grant) 1ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > balances cannot be overwritten through the returned ledger 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > every reachable object is frozen, including replay receipts 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > only ledgers made by emptyLedger or applyTx are accepted 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > refuses sparse or malformed line lists with INVALID_TX (S0 raised INVALID_JSON_VALUE) 0ms
 ✓ test/ledger.test.ts > ledger immutability boundary (S0.1) > values stay readable: entries can be read, iterated and copied 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > S0.1 review reproduction: mixing the balances of one genuine ledger with the history of another is refused 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > frozen shallow copies of genuine ledgers are refused, as are maps forged through the map constructor 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > every earlier genuine ledger is an independent branch starting point 0ms
 ✓ test/ledger.test.ts > ledger identity: only registered ledgers are accepted (S0.1 final correction) > replay and conflict detection follow each branch’s own history 1ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > applies mitigation first, so no intermediate overflows when the result fits 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > is monotonic: more raw damage, a larger crit multiplier or less defence never lowers damage 72ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > mitigationRatio is exact and agrees with the display factor 0ms
 ✓ test/combat.test.ts > exact damage v2 (S0.1) > refuses malformed damage inputs 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > G3: a timeline of rate changes, each segment split arbitrarily, equals the exact integral 124ms
 ✓ test/xp.test.ts > XP table > builds the candidate table (values independently confirmed by xp_oracle.py) 2ms
 ✓ test/xp.test.ts > XP table > is non-decreasing with every threshold >= 1 0ms
 ✓ test/xp.test.ts > XP table > refuses invalid curves, empty tables and unsafe thresholds 0ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > cumulative EXP can leave the safe range while every single threshold is safe 0ms
 ✓ test/xp.test.ts > thresholds vs cumulative EXP > reports separate approximate limits for the candidate curve 1ms
 ✓ test/xp.test.ts > EXP awards > applies multi-level awards in order and keeps the leftover 0ms
 ✓ test/xp.test.ts > EXP awards > never discards EXP: an award past the table end is refused as a whole 0ms
 ✓ test/xp.test.ts > EXP awards > refuses invalid state and runaway loops 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > S0 review reproduction: an award of 2 one EXP short of a 2^53 - 1 threshold 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > awards up to 2^53 - 1 cross large thresholds exactly and conserve EXP 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > keeps table-exhaustion, guard and ordering behaviour 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > is atomic: a refused award leaves the caller state object untouched 0ms
 ✓ test/xp.test.ts > EXP awards v2 (S0.1): no intermediate overflow, dense inputs only > refuses sparse or malformed tables and states (S0 accepted new Array(2)) 0ms
 ✓ test/content.test.ts > S0 content pack > validates, and its recorded table hash matches the artifact 11ms
 ✓ test/content.test.ts > S0 content pack > detects a tampered table 2ms
 ✓ test/content.test.ts > S0 content pack > every numeric value in the pack is labelled candidate (nothing is approved yet) 0ms
 ✓ test/content.test.ts > S0 content pack > a derived value is never stronger than its weakest input 0ms
 ✓ test/remainder.property.test.ts > per-hour chain properties (remainder.md v2, S0.1) > settling at any cadence equals settling once, from any persisted state (save/load round trip included) 47ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > with no safer zone it stops, turns auto-farm off and reports NO_SAFE_ZONE (and stops dying) 2ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > POL-BEST-SHOWN never farms a blocked zone 63ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > corrected policies rest below 30% HP between fights; the S1 control never does 149ms
 ✓ test/numeric.test.ts > safe integers > adds up to the limit and refuses one past it 2ms
 ✓ test/numeric.test.ts > safe integers > refuses non-integers, NaN, Infinity and unsafe inputs 0ms
 ✓ test/numeric.test.ts > safe integers > normalises -0 to +0 0ms
 ✓ test/numeric.test.ts > safe integers > checks intermediate products, not only final results 0ms
 ✓ test/numeric.test.ts > safe integers > divides exactly near 2^53 where floating division rounds 1ms
 ✓ test/numeric.test.ts > roundHalfUp > fixes both failure cases of floor(x + 0.5) 0ms
 ✓ test/numeric.test.ts > roundHalfUp > rounds halves up, including negatives 0ms
 ✓ test/numeric.test.ts > roundHalfUp > refuses non-finite input and results beyond the safe range 0ms
 ✓ test/runtime.test.ts > pinned runtime > runs on the pinned Node 24 LTS version 2ms
 ✓ test/runtime.test.ts > pinned runtime > package.json pins exact dependency versions and the engine 1ms
 ✓ test/xp.property.test.ts > EXP award properties with thresholds up to 2^53 - 1 (S0.1) > any split of an award gives the same final state and the same ordered level-ups 556ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/fixture.schema.json matches the zod source 1ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/content-pack-s0.schema.json matches the zod source 0ms
 ✓ test/schemaDrift.test.ts > exported JSON Schemas > spec/schema/xp-table.schema.json matches the zod source 0ms
 ✓ test/s1.determinism.test.ts > determinism > the same inputs give the same event log hash and metrics; another seed gives a different log 1103ms
 ✓ test/s1.determinism.test.ts > determinism > a fork continues exactly like the original run 91ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-STAY: identical event log after mapping IDs back 102ms
 ✓ test/s1.experiments.test.ts > jobs and summaries > pre-registered hypotheses are evaluated exactly as written, and the semantic result fingerprints stably 5ms
 ✓ test/s1.experiments.test.ts > ORC-BRUTE (oracle upper bound) > is deterministic and never earns less EXP than staying in zone 1 for the whole session 892ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-FRONTIER: identical event log after mapping IDs back 127ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > manual retry: re-enabling auto-farm after the stop is accepted, clears the reason, and the next death in the window stops it again 3ms
 ✓ test/s1_1.behaviour.test.ts > realistic recovery from repeated deaths (owner review section 3) > the death window is (t - window, t]: a death exactly window ms earlier no longer counts 0ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > turning auto-farm off cancels the automatic walk to the next target: no extra kill, the target is released, its events go stale 3ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > turning auto-farm off mid-fight ends an automatic encounter without a kill; the enemy is free at full HP 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a manual encounter continues when auto-farm is turned off, and the hero can engage manually again 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > an idle hero regenerates after a manual kill (S1 did not start regeneration there) 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a hero that starts a session hurt regenerates while idle 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > a manual Engage still waiting for an enemy ends with the session: no fight in the next session without a command 2ms
 ✓ test/s1_1.behaviour.test.ts > auto-farm off, regeneration and session boundaries (owner review section 7) > between sessions only world spawns are maintained: no reward, EXP, kill, credit or hero change 3ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > zero hit chance: 0 kills/h, no finite TTK, unreachable (the S1 estimator showed 2,400 kills/h and 0 s) 21ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > a tiny hit chance that cannot resolve within the swing budget is unreachable, not efficient 41ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > high enemy HP with crits stops at the work budget quickly 777ms
 ✓ test/s1.determinism.test.ts > metamorphic: renaming and permuting entity IDs changes no outcome > POL-BEST-SHOWN: identical event log after mapping IDs back 316ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > a hero who always dies before dealing lethal damage: exactly 0 kills per life, unreachable 2ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > with crits, a nearly impossible zone is "unsafe" with a vanishing rate (base L1 zone 3) 0ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > an enemy that cannot hurt the hero: unlimited kills per life, no deaths, reliable 0ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > survival chain, hand-derived: 3 swings per kill, 1 enemy hit per fight, 3 hits to die -> 2 kills per life 1ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > survival chain: a lethal hit landing at the kill moment still credits the kill 1ms
 ✓ test/s1_1.behaviour.test.ts > estimator v1.1 never shows impossible farming as efficient (owner review section 5) > the S1 control estimator is unchanged (pinned to S1-E02 values) 0ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > three materials per kill: quantities match the ledger; events count successful entries 2ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > two entries for the same resource: two events and the summed quantity per kill 2ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > production rates use quantities; drop-event rates are reported separately 36ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > the metrics recorder refuses a run whose metrics do not match the ledger 2ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > structured drops keep the entry index, and the log encoding round-trips 0ms
 ✓ test/s1_1.behaviour.test.ts > drop events and awarded quantities are separate (owner review section 6) > the S1.1 drops job checks each entry and the per-resource quantity against the ledger (qty-test variant) 25ms
 ✓ test/s1.determinism.test.ts > rate estimator > the swing distribution is a probability distribution and exact when nothing is random 0ms
 ✓ test/s1.determinism.test.ts > rate estimator > equals the stepper exactly where it should: no crits, no retaliation, no spawn limit 76ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies import nothing but model types 0ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > the observation exposes no RNG state, queue, ledger internals or enemy instance timers 2ms
 ✓ test/s1.determinism.test.ts > observation boundary (architecture 4.1) > realistic policies never receive the engine handle 1ms

 Test Files  24 passed (24)
      Tests  711 passed (711)
   Start at  20:18:26
   Duration  2.49s (transform 2.21s, setup 0ms, import 5.43s, tests 11.87s, environment 2ms)


[exit code: 0]
```

## Appendix C. Statistical tests (`test-stats-output.txt`)

```
$ npx vitest run --config vitest.stats.config.ts --reporter=verbose


 RUN  v4.1.12 <REPO>/legion-progression-lab

 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > high and low bytes of nextU32 are uniform (chi-square, 256 buckets) 87ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 5000 bp has the correct success rate (binomial interval) 152ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 100 bp has the correct success rate (binomial interval) 137ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > Bernoulli at 20 bp has the correct success rate (binomial interval) 134ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt(1, 6) is unbiased (chi-square, df = 5) 123ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-a) 1814ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > uniformInt with span 2^31 + 1 rejects about half of all draws, and stays unbiased across halves 62ms
 ✓ test/stats/rng.distribution.test.ts > RNG distribution (fixed seeds, alpha = 0.001) > streams with adjacent counters are not correlated (chi-square on paired top bits, df = 3) 1440ms
 ✓ test/stats/s1.drops.distribution.test.ts > S1 drop rolls (statistical, alpha = 0.001) > counts over 200,000 kills are inside the binomial interval (s1-drops-b) 1734ms

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  20:18:34
   Duration  3.79s (transform 76ms, setup 0ms, import 190ms, tests 5.68s, environment 0ms)


[exit code: 0]
```

## Appendix D. Fixture conformance (`fixtures-check.txt`)

```
$ node src/cli/fixtures-check.ts

| Family | File | Cases | Normal | Boundary | Failure | Passed |
|---|---|---|---|---|---|---|
| canonical-json | spec/fixtures/canonical-json.v1.json | 7 | 2 | 2 | 3 | 7 |
| combat-loop | spec/fixtures/combat-loop.v1.json | 14 | 5 | 7 | 2 | 14 |
| combat | spec/fixtures/combat.v2.json | 59 | 13 | 28 | 18 | 59 |
| content | spec/fixtures/content.v1.json | 10 | 1 | 1 | 8 | 10 |
| credits | spec/fixtures/credits.v1.json | 6 | 1 | 1 | 4 | 6 |
| estimator | spec/fixtures/estimator.v1.json | 8 | 2 | 4 | 2 | 8 |
| gates | spec/fixtures/gates.v1.json | 29 | 5 | 4 | 20 | 29 |
| ledger | spec/fixtures/ledger.v1.json | 15 | 2 | 4 | 9 | 15 |
| numeric | spec/fixtures/numeric.v1.json | 40 | 6 | 20 | 14 | 40 |
| remainder | spec/fixtures/remainder.v2.json | 33 | 9 | 12 | 12 | 33 |
| rewards | spec/fixtures/rewards.v1.json | 7 | 2 | 4 | 1 | 7 |
| rng | spec/fixtures/rng.v1.json | 46 | 11 | 15 | 20 | 46 |
| stats | spec/fixtures/stats.v2.json | 20 | 3 | 6 | 11 | 20 |
| xp | spec/fixtures/xp.v2.json | 30 | 6 | 10 | 14 | 30 |
total cases: 324; problems: 0

[exit code: 0]
```

## Appendix E. Schema check (`schemas-check.txt`)

```
$ node src/cli/export-schemas.ts --check

OK    spec/schema/fixture.schema.json
OK    spec/schema/content-pack-s0.schema.json
OK    spec/schema/xp-table.schema.json

[exit code: 0]
```

## Appendix F. Independent oracles (`oracle-check.txt`)

```
$ python -I spec/oracle/check_all.py

rng_oracle: 46 cases checked, 0 mismatches (<REPO>\spec\fixtures\rng.v1.json)
xp_oracle fixtures: 30 cases checked, 0 mismatches (<REPO>\spec\fixtures\xp.v2.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.candidate.v0.1.0.json)
exact_oracle numeric: 40 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\numeric.v1.json)
exact_oracle remainder: 33 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\remainder.v2.json)
exact_oracle stats: 20 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\stats.v2.json)
exact_oracle combat: 59 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\combat.v2.json)
exact_oracle ledger: 15 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\ledger.v1.json)
exact_oracle canonical-json: 7 cases checked, 0 hand-only, 0 mismatches (<REPO>\spec\fixtures\canonical-json.v1.json)
exact_oracle content: 2 cases checked, 8 hand-only, 0 mismatches (<REPO>\spec\fixtures\content.v1.json)
s1_oracle combat-loop: 14 cases checked, 0 mismatches (<REPO>\spec\fixtures\combat-loop.v1.json)
s1_oracle gates: 29 cases checked, 0 mismatches (<REPO>\spec\fixtures\gates.v1.json)
s1_oracle rewards: 7 cases checked, 0 mismatches (<REPO>\spec\fixtures\rewards.v1.json)
s1_oracle credits: 6 cases checked, 0 mismatches (<REPO>\spec\fixtures\credits.v1.json)
s1_oracle estimator: 8 cases checked, 0 mismatches (<REPO>\spec\fixtures\estimator.v1.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a8-p1.6.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a8-p1.8.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a8-p2.0.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a10-p1.6.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a10-p1.8.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a10-p2.0.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a12-p1.6.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a12-p1.8.v0.1.0.json)
xp_oracle artifact: 200 thresholds; mismatched levels: none; rounding-unstable levels: none (<REPO>\legion-progression-lab\content\tables\xp.w1.sweep.a12-p2.0.v0.1.0.json)
xp_oracle preview: main rows + 9 sweep variants checked, 0 problems (<REPO>\legion-progression-lab\results\s0\S0-R01-curve-preview\semantic.json)
== rng fixtures
== xp fixtures
== xp table artifact
== exact families
== S1 / S1.1 families
== xp sweep table a=8 p=1.6
== xp sweep table a=8 p=1.8
== xp sweep table a=8 p=2
== xp sweep table a=10 p=1.6
== xp sweep table a=10 p=1.8
== xp sweep table a=10 p=2
== xp sweep table a=12 p=1.6
== xp sweep table a=12 p=1.8
== xp sweep table a=12 p=2
== S0-R01 preview
oracle summary: 15 groups, 0 failing

[exit code: 0]
```

## Appendix G. Experiment re-verification (exp:verify) (`exp-verify.txt`)

```
S1.1-E01-base-attribution: stored 46730cdf03bfae235bc5d30c76040059d56721eaa008d6d0afc2431e22dee954
S1.1-E01-base-attribution: rerun  46730cdf03bfae235bc5d30c76040059d56721eaa008d6d0afc2431e22dee954
S1.1-E01-base-attribution: MATCH (49033 ms, 15 workers)
S1.1-E02-estimator: stored dd265cb69af9cf0f85b6b62227bbcee6ff5823d9c5b10faa47649b974c006639
S1.1-E02-estimator: rerun  dd265cb69af9cf0f85b6b62227bbcee6ff5823d9c5b10faa47649b974c006639
S1.1-E02-estimator: MATCH (33011 ms, 15 workers)
S1.1-E03-earlier-zone-audit: stored 12a24bea05f61c4927c16287ac46b6511e29b80bb3b21d23a48f402e1cb49b6f
S1.1-E03-earlier-zone-audit: rerun  12a24bea05f61c4927c16287ac46b6511e29b80bb3b21d23a48f402e1cb49b6f
S1.1-E03-earlier-zone-audit: MATCH (2945 ms, 15 workers)
S1.1-E04-survival-policies: stored ccf0f709f12c037671e2eef082d4cbac961ec6ee09f137e9ab9ff64ccb12678e
S1.1-E04-survival-policies: rerun  ccf0f709f12c037671e2eef082d4cbac961ec6ee09f137e9ab9ff64ccb12678e
S1.1-E04-survival-policies: MATCH (49008 ms, 15 workers)
S1.1-E05-drops-quantities: stored fe72f1a3f7804d2c7ac9c32ccca8bbf563103c36bd15fe48ac144b1156552bc0
S1.1-E05-drops-quantities: rerun  fe72f1a3f7804d2c7ac9c32ccca8bbf563103c36bd15fe48ac144b1156552bc0
S1.1-E05-drops-quantities: MATCH (13674 ms, 15 workers)
S1.1-E06-determinism: stored 6d3ff33d3d3333bf07cfaa76733606255d2d812e3d55b123b19f4e072380919c
S1.1-E06-determinism: rerun  6d3ff33d3d3333bf07cfaa76733606255d2d812e3d55b123b19f4e072380919c
S1.1-E06-determinism: MATCH (37112 ms, 15 workers)
S1.1-E07-policy-comparison: stored a8a931018a94498fcf2e60990057b3f9b159837d462c444e40f5b47807567506
S1.1-E07-policy-comparison: rerun  a8a931018a94498fcf2e60990057b3f9b159837d462c444e40f5b47807567506
S1.1-E07-policy-comparison: MATCH (64549 ms, 15 workers)
```

## Appendix H. S1 manifest refused by the S1.1 runner (`s1-manifest-refused.txt`)

```
$ node src/cli/exp.ts manifests/s1/S1-E08-policy-bound.json
REFUSED: manifests/s1/S1-E08-policy-bound.json is an S1 manifest: historical evidence, produced by the S1 implementation (S1 review package b255d94b...). Its policy names meant the S1 logic; reproduce it from that package.
[exit code: 2]
```

## Appendix I. Mutation check (critical fixes) (`mutation-check.txt`)

```
C1: DETECTED (3 failing) restored=True | owner 2: a pending claim with different fields is accepted
C2: DETECTED (13 failing) restored=True | owner 2: committing leaves the claim pending, so a duplicate is credited again
C3: DETECTED (11 failing) restored=True | owner 2: an exact replay is classified as a conflict
C4: DETECTED (6 failing) restored=True | owner 2: a rejected duplicate still advances the loot stream
C5: DETECTED (1 failing) restored=True | owner 2: not atomic: the credit is committed before the ledger transaction can fail
T1: DETECTED (6 failing) restored=True | owner 4: only the first trigger of a step reaches the policy (the S1 behaviour)
T2: DETECTED (2 failing) restored=True | owner 4: the death trigger is never requested
T3: DETECTED (1 failing) restored=True | owner 4: no policy-cascade limit
R1: DETECTED (4 failing) restored=True | owner 3: a zone that stopped auto-farm is never blocked (blind re-enable)
R2: DETECTED (1 failing) restored=True | owner 3: corrected policies never rest
R3: DETECTED (1 failing) restored=True | owner 3: the fixed-zone policy re-enables auto-farm instead of stopping and reporting
R4: DETECTED (1 failing) restored=True | owner 3: death window lower bound inclusive
A1: DETECTED (2 failing) restored=True | owner 7: auto-farm off cancels nothing (the S1 behaviour)
A2: DETECTED (1 failing) restored=True | owner 7 audit: no regeneration after a kill with auto-farm off
A3: DETECTED (1 failing) restored=True | owner 7 audit: a pending manual engage survives the session end
E1: DETECTED (1 failing) restored=True | owner 5: zero hit chance is not detected
E2: DETECTED (3 failing) restored=True | owner 5: mass unresolved at the budget is treated as resolved
E3: DETECTED (2 failing) restored=True | owner 5: a lethal hit at the kill moment loses the kill
E4: DETECTED (2 failing) restored=True | owner 5: a hero who always dies first is shown as merely unsafe
D1: DETECTED (4 failing) restored=True | owner 6: metrics count drop events as quantities (the S1 behaviour)

S1.1 mutation check: 20 planted bugs, 20 detected, 0 not detected; all files restored: True
- C1 [src/engine/credit.ts] owner 2: a pending claim with different fields is accepted: detected by 3 failing test(s); e.g. × a conflicting duplicate (other zone, or the boss flag) is rejected explicitly, before or after the genuine one 8ms
- C2 [src/engine/credit.ts] owner 2: committing leaves the claim pending, so a duplicate is credited again: detected by 13 failing test(s); e.g. × an injected exact duplicate after an ordinary kill is rejected: no EXP, kill, gold, drop or random draw twice 11ms
- C3 [src/engine/credit.ts] owner 2: an exact replay is classified as a conflict: detected by 11 failing test(s); e.g. × an injected exact duplicate after an ordinary kill is rejected: no EXP, kill, gold, drop or random draw twice 14ms
- C4 [src/engine/simulation.ts] owner 2: a rejected duplicate still advances the loot stream: detected by 6 failing test(s); e.g. × an injected exact duplicate after an ordinary kill is rejected: no EXP, kill, gold, drop or random draw twice 15ms
- C5 [src/engine/simulation.ts] owner 2: not atomic: the credit is committed before the ledger transaction can fail: detected by 1 failing test(s); e.g. × is atomic: if any part of the credit fails, nothing of it is applied 6ms
- T1 [src/engine/simulation.ts] owner 4: only the first trigger of a step reaches the policy (the S1 behaviour): detected by 6 failing test(s); e.g. × the gate-completion decision carries "gate-completed" together with "kill" (the reviewer saw only "kill") 82ms
- T2 [src/engine/simulation.ts] owner 4: the death trigger is never requested: detected by 2 failing test(s); e.g. × a death and a kill at the same moment (both blows land) reach the policy together 6ms
- T3 [src/engine/simulation.ts] owner 4: no policy-cascade limit: detected by 1 failing test(s); e.g. × a policy that keeps causing new triggers at one moment is stopped as a cascade, not looped forever 8ms
- R1 [src/policy/realistic.ts] owner 3: a zone that stopped auto-farm is never blocked (blind re-enable): detected by 4 failing test(s); e.g. × the reviewer scenario: the S1 control resumes and dies 124 times; the corrected fixed policy stops after 3 deaths and reports why 43ms
- R2 [src/policy/realistic.ts] owner 3: corrected policies never rest: detected by 1 failing test(s); e.g. × corrected policies rest below 30% HP between fights; the S1 control never does 80ms
- R3 [src/policy/realistic.ts] owner 3: the fixed-zone policy re-enables auto-farm instead of stopping and reporting: detected by 1 failing test(s); e.g. × the reviewer scenario: the S1 control resumes and dies 124 times; the corrected fixed policy stops after 3 deaths and reports why 48ms
- R4 [src/engine/simulation.ts] owner 3: death window lower bound inclusive: detected by 1 failing test(s); e.g. × the death window is (t - window, t]: a death exactly window ms earlier no longer counts 5ms
- A1 [src/engine/simulation.ts] owner 7: auto-farm off cancels nothing (the S1 behaviour): detected by 2 failing test(s); e.g. × turning auto-farm off cancels the automatic walk to the next target: no extra kill, the target is released, its events go stale 5ms
- A2 [src/engine/simulation.ts] owner 7 audit: no regeneration after a kill with auto-farm off: detected by 1 failing test(s); e.g. × an idle hero regenerates after a manual kill (S1 did not start regeneration there) 6ms
- A3 [src/engine/simulation.ts] owner 7 audit: a pending manual engage survives the session end: detected by 1 failing test(s); e.g. × a manual Engage still waiting for an enemy ends with the session: no fight in the next session without a command 7ms
- E1 [src/engine/estimator.ts] owner 5: zero hit chance is not detected: detected by 1 failing test(s); e.g. × zero hit chance: 0 kills/h, no finite TTK, unreachable (the S1 estimator showed 2,400 kills/h and 0 s) 20ms
- E2 [src/engine/estimator.ts] owner 5: mass unresolved at the budget is treated as resolved: detected by 3 failing test(s); e.g. × s1.estimator.swing-budget.001 (failure) 23ms
- E3 [src/engine/estimator.ts] owner 5: a lethal hit at the kill moment loses the kill: detected by 2 failing test(s); e.g. × s1.estimator.simultaneous.001 (boundary) 4ms
- E4 [src/engine/estimator.ts] owner 5: a hero who always dies first is shown as merely unsafe: detected by 2 failing test(s); e.g. × s1.estimator.dies-first.001 (failure) 4ms
- D1 [src/experiments/metrics.ts] owner 6: metrics count drop events as quantities (the S1 behaviour): detected by 4 failing test(s); e.g. × three materials per kill: quantities match the ledger; events count successful entries 6ms
```

## Appendix J. Pre-registered analyses A1–A8 (`analysis.txt`)

```
== A1 S1 reproduction (engineering gate): identical metric summaries
  S1-E01-calibration a10-p1.6-g100|PR-NEW|POL-STAY  vs  S1.1-E01-base-attribution a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1: 35 metrics compared, 0 different
  S1-E01-calibration a10-p1.6-g100|PR-NEW|POL-FRONTIER  vs  S1.1-E01-base-attribution a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1: 35 metrics compared, 0 different
  S1-E01-calibration a10-p1.6-g100|PR-BAL|POL-STAY  vs  S1.1-E01-base-attribution a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1: 35 metrics compared, 0 different
  S1-E01-calibration a10-p1.6-g100|PR-BAL|POL-FRONTIER  vs  S1.1-E01-base-attribution a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1: 35 metrics compared, 0 different
  S1-E08-policy-bound base|PR-BAL|POL-STAY  vs  S1.1-E07-policy-comparison base|PR-BAL|CTL-STAY-S1|est-s1: 35 metrics compared, 0 different
  S1-E08-policy-bound base|PR-BAL|POL-FRONTIER  vs  S1.1-E07-policy-comparison base|PR-BAL|CTL-FRONTIER-S1|est-s1: 35 metrics compared, 0 different
  S1-E08-policy-bound base|PR-BAL|POL-BEST-SHOWN  vs  S1.1-E07-policy-comparison base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1: 35 metrics compared, 0 different
  S1-E03-earlier-zone-audit base|PR-OPT|POL-STAY  vs  S1.1-E03-earlier-zone-audit base|PR-OPT|CTL-STAY-S1: 34 metrics compared, 0 different
  A1 PASS

== A2 attribution: L0 S1 published -> L1 controls, S1 estimator (bug fixes) -> L2 controls, v1.1 estimator (measurement correction) -> L3 corrected policies (policy correction); cross = corrected policies with the S1 estimator
  columns: expTotal mean | levelAt60 p50 | zone2FirstVisitMin p50 | zone3FirstVisitMin p50 | deathsPerHour p50 | autoFarmStops p50 | activeManualMin p50 | minToL5 p50 | minToL10 p50
  -- S1.1-E01 STAY PR-NEW
     L0 S1-E01 4,809.36 | not reached | 5.08 | 16.30 | 36 | 25 | 2.75 | 2.45 | 14.03   [a10-p1.6-g100|PR-NEW|POL-STAY]
     L1        4,809.36 | not reached | 5.08 | 16.30 | 36 | 25 | 2.75 | 2.45 | 14.03   [a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1]
     L2        4,809.36 | not reached | 5.08 | 16.30 | 36 | 25 | 2.75 | 2.45 | 14.03   [a10-p1.6-g100|PR-NEW|CTL-STAY-S1|est-s1.1]
     L3        5,054.11 | not reached | 5.08 | 16.35 | 0 | 0 | 6.63 | 2.45 | 14.16   [a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1]
     cross     5,054.11 | not reached | 5.08 | 16.35 | 0 | 0 | 6.63 | 2.45 | 14.16   [a10-p1.6-g100|PR-NEW|POL-STAY|est-s1]
  -- S1.1-E01 FRONTIER PR-NEW
     L0 S1-E01 5,823.45 | not reached | 5.08 | 38.14 | 0 | 0 | 4 | 2.45 | 14.16   [a10-p1.6-g100|PR-NEW|POL-FRONTIER]
     L1        5,823.45 | not reached | 5.08 | 38.14 | 0 | 0 | 4 | 2.45 | 14.16   [a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1]
     L2        5,823.45 | not reached | 5.08 | 38.14 | 0 | 0 | 4 | 2.45 | 14.16   [a10-p1.6-g100|PR-NEW|CTL-FRONTIER-S1|est-s1.1]
     L3        5,823.45 | not reached | 5.08 | 38.14 | 0 | 0 | 4 | 2.45 | 14.16   [a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1]
     cross     5,823.45 | not reached | 5.08 | 38.14 | 0 | 0 | 4 | 2.45 | 14.16   [a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1]
  -- S1.1-E01 BEST-SHOWN PR-NEW
     L1        6,220.46 | not reached | 6.17 | not reached | 5.33 | 2 | 0.83 | 2.45 | 14.10   [a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1]
     L2        6,220.46 | not reached | 6.17 | not reached | 5.33 | 2 | 0.83 | 2.45 | 14.10   [a10-p1.6-g100|PR-NEW|CTL-BEST-SHOWN-S1|est-s1.1]
     L3        6,214.62 | not reached | 6.17 | not reached | 0 | 0 | 1.50 | 2.45 | 14.07   [a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1]
     cross     6,214.62 | not reached | 6.17 | not reached | 0 | 0 | 1.50 | 2.45 | 14.07   [a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1]
  -- S1.1-E01 STAY PR-BAL
     L0 S1-E01 7,044.78 | 18 | 5.08 | 16.30 | 36 | 34 | 3.50 | 2.45 | 14.03   [a10-p1.6-g100|PR-BAL|POL-STAY]
     L1        7,044.78 | 18 | 5.08 | 16.30 | 36 | 34 | 3.50 | 2.45 | 14.03   [a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1]
     L2        7,044.78 | 18 | 5.08 | 16.30 | 36 | 34 | 3.50 | 2.45 | 14.03   [a10-p1.6-g100|PR-BAL|CTL-STAY-S1|est-s1.1]
     L3        7,389.41 | 18 | 5.08 | 16.35 | 0 | 0 | 8.58 | 2.45 | 14.16   [a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1]
     cross     7,389.41 | 18 | 5.08 | 16.35 | 0 | 0 | 8.58 | 2.45 | 14.16   [a10-p1.6-g100|PR-BAL|POL-STAY|est-s1]
  -- S1.1-E01 FRONTIER PR-BAL
     L0 S1-E01 8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 | 2.45 | 14.16   [a10-p1.6-g100|PR-BAL|POL-FRONTIER]
     L1        8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 | 2.45 | 14.16   [a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1]
     L2        8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 | 2.45 | 14.16   [a10-p1.6-g100|PR-BAL|CTL-FRONTIER-S1|est-s1.1]
     L3        8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 | 2.45 | 14.16   [a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1]
     cross     8,203.63 | 19 | 5.08 | 38.14 | 0 | 0 | 5.83 | 2.45 | 14.16   [a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1]
  -- S1.1-E01 BEST-SHOWN PR-BAL
     L1        9,320.85 | 20 | 6.17 | not reached | 4 | 2 | 1.17 | 2.45 | 14.10   [a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1]
     L2        9,320.85 | 20 | 6.17 | not reached | 4 | 2 | 1.17 | 2.45 | 14.10   [a10-p1.6-g100|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1]
     L3        9,313.75 | 20 | 6.17 | not reached | 0 | 0 | 1.83 | 2.45 | 14.07   [a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1]
     cross     9,313.75 | 20 | 6.17 | not reached | 0 | 0 | 1.83 | 2.45 | 14.07   [a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1]
  -- S1.1-E07 STAY PR-BAL
     L0 S1-E08 7,042.80 | 18 | 5.06 | 16.28 | 36 | 34 | 3.50 | 2.45 | 14.01   [base|PR-BAL|POL-STAY]
     L1        7,042.80 | 18 | 5.06 | 16.28 | 36 | 34 | 3.50 | 2.45 | 14.01   [base|PR-BAL|CTL-STAY-S1|est-s1]
     L2        7,042.80 | 18 | 5.06 | 16.28 | 36 | 34 | 3.50 | 2.45 | 14.01   [base|PR-BAL|CTL-STAY-S1|est-s1.1]
     L3        7,393.15 | 18 | 5.06 | 16.33 | 0 | 0 | 8.60 | 2.45 | 14.14   [base|PR-BAL|POL-STAY|est-s1.1]
     cross     7,393.15 | 18 | 5.06 | 16.33 | 0 | 0 | 8.60 | 2.45 | 14.14   [base|PR-BAL|POL-STAY|est-s1]
  -- S1.1-E07 FRONTIER PR-BAL
     L0 S1-E08 8,208.69 | 19 | 5.06 | 38.12 | 0 | 0 | 5.83 | 2.45 | 14.14   [base|PR-BAL|POL-FRONTIER]
     L1        8,208.69 | 19 | 5.06 | 38.12 | 0 | 0 | 5.83 | 2.45 | 14.14   [base|PR-BAL|CTL-FRONTIER-S1|est-s1]
     L2        8,208.69 | 19 | 5.06 | 38.12 | 0 | 0 | 5.83 | 2.45 | 14.14   [base|PR-BAL|CTL-FRONTIER-S1|est-s1.1]
     L3        8,208.69 | 19 | 5.06 | 38.12 | 0 | 0 | 5.83 | 2.45 | 14.14   [base|PR-BAL|POL-FRONTIER|est-s1.1]
     cross     8,208.69 | 19 | 5.06 | 38.12 | 0 | 0 | 5.83 | 2.45 | 14.14   [base|PR-BAL|POL-FRONTIER|est-s1]
  -- S1.1-E07 BEST-SHOWN PR-BAL
     L0 S1-E08 9,326.15 | 20 | 6.17 | not reached | 4 | 2 | 1.17 | 2.45 | 14.06   [base|PR-BAL|POL-BEST-SHOWN]
     L1        9,326.15 | 20 | 6.17 | not reached | 4 | 2 | 1.17 | 2.45 | 14.06   [base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1]
     L2        9,326.15 | 20 | 6.17 | not reached | 4 | 2 | 1.17 | 2.45 | 14.06   [base|PR-BAL|CTL-BEST-SHOWN-S1|est-s1.1]
     L3        9,315.75 | 20 | 6.17 | not reached | 0 | 0 | 1.83 | 2.45 | 14.07   [base|PR-BAL|POL-BEST-SHOWN|est-s1.1]
     cross     9,315.75 | 20 | 6.17 | not reached | 0 | 0 | 1.83 | 2.45 | 14.07   [base|PR-BAL|POL-BEST-SHOWN|est-s1]
  -- ORC-BRUTE PR-BAL (restricted lookahead, trigger fix = bug fix)
     L0 S1-E08 8,882.35 | 20 | 5.36 | not reached | 13 | 3 | 0.58 | 2.45 | 14.04   [base|PR-BAL|ORC-BRUTE]
     S1.1      8,886.75 | 20 | 5.06 | not reached | 13 | 3 | 0.58 | 2.45 | 14.01   [base|PR-BAL|ORC-BRUTE|est-s1.1]

== A3 drops (engineering gate)
  base|Z1|L100 entry 0 res.mat.slime_gel 3000 bp: kills 239,500, successes 72,071, expected 71,850, 99.9% interval [71,113, 72,589] inside; quantity awarded for the resource 72,071
  base|Z1|L100 entry 1 res.rare.test_token 20 bp: kills 239,500, successes 478, expected 479, 99.9% interval [409, 553] inside; quantity awarded for the resource 478
  base|Z2|L100 entry 0 res.mat.wolf_fang 2500 bp: kills 239,500, successes 60,403, expected 59,875, 99.9% interval [59,179, 60,573] inside; quantity awarded for the resource 60,403
  base|Z2|L100 entry 1 res.rare.test_token 20 bp: kills 239,500, successes 455, expected 479, 99.9% interval [409, 553] inside; quantity awarded for the resource 455
  base|Z3|L100 entry 0 res.mat.goblin_scrap 2000 bp: kills 136,055, successes 27,198, expected 27,211, 99.9% interval [26,726, 27,697] inside; quantity awarded for the resource 27,198
  base|Z3|L100 entry 1 res.rare.test_token 20 bp: kills 136,055, successes 262, expected 272.1, 99.9% interval [220, 328] inside; quantity awarded for the resource 262
  qty-test|Z1|L100 entry 0 res.mat.slime_gel 3000 bp: kills 239,500, successes 71,623, expected 71,850, 99.9% interval [71,113, 72,589] inside; quantity awarded for the resource 454,681
  qty-test|Z1|L100 entry 1 res.mat.slime_gel 5000 bp: kills 239,500, successes 119,906, expected 119,750, 99.9% interval [118,945, 120,555] inside; quantity awarded for the resource 454,681
  qty-test|Z1|L100 entry 2 res.rare.test_token 20 bp: kills 239,500, successes 495, expected 479, 99.9% interval [409, 553] inside; quantity awarded for the resource 495
  qty-test|Z2|L100 entry 0 res.mat.wolf_fang 2500 bp: kills 239,500, successes 59,568, expected 59,875, 99.9% interval [59,179, 60,573] inside; quantity awarded for the resource 59,568
  qty-test|Z2|L100 entry 1 res.rare.test_token 20 bp: kills 239,500, successes 475, expected 479, 99.9% interval [409, 553] inside; quantity awarded for the resource 475
  qty-test|Z3|L100 entry 0 res.mat.goblin_scrap 2000 bp: kills 136,041, successes 26,948, expected 27,208.2, 99.9% interval [26,724, 27,695] inside; quantity awarded for the resource 26,948
  qty-test|Z3|L100 entry 1 res.rare.test_token 20 bp: kills 136,041, successes 281, expected 272.1, 99.9% interval [220, 328] inside; quantity awarded for the resource 281
  qty-test gel quantity = 3 x entry-0 successes + 2 x entry-1 successes: yes (454,681 = 3 x 71,623 + 2 x 119,906)
  A3 PASS: all inside yes, ledger mismatches 0

== A4 survival: S1 logic (CTL) against corrected policies (POL), estimator v1.1, PR-BAL, 200 replicates
  columns: deathsPerHour p50 | autoFarmStops p50 | policyStopReports mean | activeManualMin p50 | zone3FirstVisitMin p50 | levelAt60 p50 | expTotal mean
  d0.5-h1   CTL-STAY-S1        21 | 12 | 0 | 1.67 | 15.39 | 19 | 7,768.69   (zone 3 reached in 200/200)
  d0.5-h1   POL-STAY           0 | 0 | 0 | 5.33 | 15.52 | 19 | 7,983.74   (zone 3 reached in 200/200)
  d0.5-h1   CTL-FRONTIER-S1    0 | 0 | 0 | 3.33 | 36.30 | 19 | 8,662.55   (zone 3 reached in 200/200)
  d0.5-h1   POL-FRONTIER       0 | 0 | 0 | 3.33 | 36.30 | 19 | 8,662.55   (zone 3 reached in 200/200)
  d0.5-h1   CTL-BEST-SHOWN-S1  1 | 0 | 0 | 1 | not reached | 20 | 9,470.35   (zone 3 reached in 0/200)
  d0.5-h1   POL-BEST-SHOWN     0 | 0 | 0 | 1.33 | not reached | 20 | 9,444.90   (zone 3 reached in 0/200)
  d1-h1     CTL-STAY-S1        36 | 34 | 0 | 3.50 | 16.28 | 18 | 7,046.65   (zone 3 reached in 200/200)
  d1-h1     POL-STAY           0 | 0 | 0 | 8.60 | 16.35 | 18 | 7,390.62   (zone 3 reached in 200/200)
  d1-h1     CTL-FRONTIER-S1    0 | 0 | 0 | 5.83 | 38.12 | 19 | 8,207.04   (zone 3 reached in 200/200)
  d1-h1     POL-FRONTIER       0 | 0 | 0 | 5.83 | 38.12 | 19 | 8,207.04   (zone 3 reached in 200/200)
  d1-h1     CTL-BEST-SHOWN-S1  4 | 2 | 0 | 1.17 | not reached | 20 | 9,322.60   (zone 3 reached in 0/200)
  d1-h1     POL-BEST-SHOWN     0 | 0 | 0 | 1.83 | not reached | 20 | 9,314.45   (zone 3 reached in 0/200)
  d1.5-h1   CTL-STAY-S1        53 | 51 | 0 | 4.92 | 16.79 | 17 | 6,155.21   (zone 3 reached in 200/200)
  d1.5-h1   POL-STAY           0 | 0 | 0 | 11.82 | 16.68 | 18 | 6,789.25   (zone 3 reached in 200/200)
  d1.5-h1   CTL-FRONTIER-S1    0 | 0 | 0 | 4.50 | not reached | 19 | 8,646.70   (zone 3 reached in 0/200)
  d1.5-h1   POL-FRONTIER       0 | 0 | 0 | 4.50 | not reached | 19 | 8,646.70   (zone 3 reached in 0/200)
  d1.5-h1   CTL-BEST-SHOWN-S1  5 | 3 | 0 | 1.25 | not reached | 20 | 9,247.80   (zone 3 reached in 0/200)
  d1.5-h1   POL-BEST-SHOWN     0 | 0 | 0 | 2.17 | not reached | 20 | 9,239.95   (zone 3 reached in 0/200)
  d2-h1     CTL-STAY-S1        70 | 68 | 0 | 6.33 | 17.39 | 16 | 5,332.74   (zone 3 reached in 200/200)
  d2-h1     POL-STAY           5 | 1 | 0 | 14.57 | 17.48 | 17 | 6,081.61   (zone 3 reached in 200/200)
  d2-h1     CTL-FRONTIER-S1    0 | 0 | 0 | 5.02 | not reached | 19 | 8,366.25   (zone 3 reached in 0/200)
  d2-h1     POL-FRONTIER       0 | 0 | 0 | 5.02 | not reached | 19 | 8,366.25   (zone 3 reached in 0/200)
  d2-h1     CTL-BEST-SHOWN-S1  8 | 6 | 0 | 1.50 | not reached | 20 | 9,112.75   (zone 3 reached in 0/200)
  d2-h1     POL-BEST-SHOWN     0 | 0 | 0 | 2.67 | not reached | 20 | 9,114.30   (zone 3 reached in 0/200)

== A5 estimator v1.1 against the stepper (S1 control estimator alongside)
  base|L1-Z1|CTL-FIXED-S1      sim     898.3/h | v1.1     897.7 (   -0.07%) reliable  | S1 est 906.1 (0.87%)
  base|L1-Z2|CTL-FIXED-S1      sim     265.3/h | v1.1     265.6 (    0.12%) unsafe AUTO_FARM_STOP_EXPECTED | S1 est 284.9 (7.37%)
  base|L1-Z3|CTL-FIXED-S1      sim         0/h | v1.1       0.0 (      n/a) unsafe UNDER_ONE_KILL_PER_LIFE,AUTO_FARM_STOP_EXPECTED | S1 est 65.2 (n/a)
  base|L5-Z1|CTL-FIXED-S1      sim   1,360.6/h | v1.1   1,363.6 (    0.23%) reliable  | S1 est 1,363.6 (0.23%)
  base|L5-Z2|CTL-FIXED-S1      sim     509.6/h | v1.1     509.6 (   -0.00%) approximate SURVIVAL_LIMITED | S1 est 516.0 (1.25%)
  base|L5-Z3|CTL-FIXED-S1      sim      91.5/h | v1.1      91.4 (   -0.06%) unsafe AUTO_FARM_STOP_EXPECTED | S1 est 149.4 (63.28%)
  base|L10-Z1|CTL-FIXED-S1     sim     2,395/h | v1.1     2,400 (    0.21%) reliable  | S1 est 2,400 (0.21%)
  base|L10-Z2|CTL-FIXED-S1     sim       849/h | v1.1     848.2 (   -0.09%) reliable  | S1 est 859.5 (1.23%)
  base|L10-Z3|CTL-FIXED-S1     sim     204.6/h | v1.1     205.3 (    0.37%) unsafe AUTO_FARM_STOP_EXPECTED | S1 est 233.4 (14.08%)
  base|L1-Z1|POL-FIXED         sim     901.2/h | v1.1     897.7 (   -0.39%) reliable  | S1 est 906.1 (0.54%)
  base|L1-Z2|POL-FIXED         sim     298.7/h | v1.1     265.6 (  -11.07%) unsafe AUTO_FARM_STOP_EXPECTED | S1 est 284.9 (-4.63%)
  base|L1-Z3|POL-FIXED         sim         0/h | v1.1       0.0 (      n/a) unsafe UNDER_ONE_KILL_PER_LIFE,AUTO_FARM_STOP_EXPECTED | S1 est 65.2 (n/a)
  base|L5-Z1|POL-FIXED         sim   1,360.6/h | v1.1   1,363.6 (    0.23%) reliable  | S1 est 1,363.6 (0.23%)
  base|L5-Z2|POL-FIXED         sim     515.1/h | v1.1     509.6 (   -1.05%) approximate SURVIVAL_LIMITED | S1 est 516.0 (0.19%)
  base|L5-Z3|POL-FIXED         sim       3.2/h | v1.1      91.4 (2,774.83%) unsafe AUTO_FARM_STOP_EXPECTED | S1 est 149.4 (4,596.96%)
  base|L10-Z1|POL-FIXED        sim     2,395/h | v1.1     2,400 (    0.21%) reliable  | S1 est 2,400 (0.21%)
  base|L10-Z2|POL-FIXED        sim       852/h | v1.1     848.2 (   -0.44%) reliable  | S1 est 859.5 (0.88%)
  base|L10-Z3|POL-FIXED        sim     245.5/h | v1.1     205.3 (  -16.37%) unsafe AUTO_FARM_STOP_EXPECTED | S1 est 233.4 (-4.94%)
  H-S1-09: pass 8, miss 0, not reached 1 of 9
  H-S1-08a: pass 1, miss 0, not reached 0 of 1
  H-S1-08b: pass 1, miss 0, not reached 0 of 1

== A6 determinism (engineering gate)
  runs 1,200; re-run digests identical yes; fingerprints identical yes; second-root runs that differ 1,200; KS rejections 0 of 24
  A6 PASS

== A7 targets (unchanged S1 targets) in S1.1-E01; the S1.1 result is the POL-*|est-s1.1 cells
  H-S1-01   (target) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 10.40 -> pass
  H-S1-01   (target) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 10.40 -> pass
  H-S1-01   (target) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed 10.40 -> pass
  H-S1-01   (target) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 10.40 -> pass
  H-S1-01   (target) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 10.40 -> pass
  H-S1-01   (target) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed 10.40 -> pass
  H-S1-02   (target) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 3 -> pass
  H-S1-02   (target) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 3 -> pass
  H-S1-02   (target) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed 3 -> pass
  H-S1-02   (target) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 3 -> pass
  H-S1-02   (target) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 3 -> pass
  H-S1-02   (target) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed 3 -> pass
  H-S1-03a  (target) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 2.40 -> pass
  H-S1-03a  (target) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 2.40 -> pass
  H-S1-03a  (target) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed 2.40 -> pass
  H-S1-03a  (target) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 2.40 -> pass
  H-S1-03a  (target) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 2.40 -> pass
  H-S1-03a  (target) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed 2.40 -> pass
  H-S1-03b  (target) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 4.80 -> pass
  H-S1-03b  (target) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 4.80 -> pass
  H-S1-03b  (target) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed 3.60 -> pass
  H-S1-03b  (target) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 4.80 -> pass
  H-S1-03b  (target) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 4.80 -> pass
  H-S1-03b  (target) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed 3.60 -> pass
  H-S1-04   (target) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 9.60 -> pass
  H-S1-04   (target) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 6 -> pass
  H-S1-04   (target) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed not reached -> not-reached
  H-S1-04   (target) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 9.60 -> pass
  H-S1-04   (target) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 6 -> pass
  H-S1-04   (target) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed not reached -> not-reached
  H-S1-05   (target) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 5.08 -> pass
  H-S1-05   (target) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 5.08 -> pass
  H-S1-05   (target) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed 6.17 -> pass
  H-S1-05   (target) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 5.08 -> pass
  H-S1-05   (target) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 5.08 -> pass
  H-S1-05   (target) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed 6.17 -> pass
  H-S1-06   (target) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 2.22 -> pass
  H-S1-06   (target) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 6.52 -> pass
  H-S1-06   (target) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed not reached -> not-reached
  H-S1-06   (target) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 2.22 -> pass
  H-S1-06   (target) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 6.52 -> pass
  H-S1-06   (target) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed not reached -> not-reached
  H-S1-07a  (diagnostic) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 2.45 -> miss
  H-S1-07a  (diagnostic) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 2.45 -> miss
  H-S1-07a  (diagnostic) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed 2.45 -> miss
  H-S1-07a  (diagnostic) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 2.45 -> miss
  H-S1-07a  (diagnostic) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 2.45 -> miss
  H-S1-07a  (diagnostic) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed 2.45 -> miss
  H-S1-07b  (diagnostic) a10-p1.6-g100|PR-NEW|POL-STAY|est-s1.1     observed 14.16 -> pass
  H-S1-07b  (diagnostic) a10-p1.6-g100|PR-NEW|POL-FRONTIER|est-s1.1 observed 14.16 -> pass
  H-S1-07b  (diagnostic) a10-p1.6-g100|PR-NEW|POL-BEST-SHOWN|est-s1.1 observed 14.07 -> pass
  H-S1-07b  (diagnostic) a10-p1.6-g100|PR-BAL|POL-STAY|est-s1.1     observed 14.16 -> pass
  H-S1-07b  (diagnostic) a10-p1.6-g100|PR-BAL|POL-FRONTIER|est-s1.1 observed 14.16 -> pass
  H-S1-07b  (diagnostic) a10-p1.6-g100|PR-BAL|POL-BEST-SHOWN|est-s1.1 observed 14.07 -> pass

== A8 which S1 experiments remain interpretable
  S1-E01 calibration sweep: remains interpretable as S1 decision logic with the S1 estimator [corrected-policy behaviour measured on the base cells in S1.1-E01]
  S1-E02 estimator: stepper side remains (CTL-FIXED-S1 reproduces S1 logic); the estimate side is superseded by S1.1-E02 (estimator v1.1) [measurement correction]
  S1-E03 earlier-zone audit: forks and visits remain (A1 identical); the estimate columns are superseded by S1.1-E03 [measurement correction]
  S1-E04 survival: remains as the reckless S1-logic control; the corrected realistic response is S1.1-E04 [policy correction]
  S1-E05 gate pacing sweep: remains interpretable as S1 decision logic [the ratio depends on zone 3 arrival, which the corrected policies change (S1.1-E01 L3 shows the size of the change at the base)]
  S1-E06 / S1-E06b drops: remain valid: all S1 quantities are 1, so events and quantities coincide; S1.1-E05 adds quantities above 1 [measurement correction (no S1 value changes)]
  S1-E07 determinism: remains for the S1 engine; S1.1-E06 covers the corrected engine
  S1-E08 policy bound: realistic rows remain as S1 logic (A1 identical); the ORC-BRUTE row is superseded (trigger bug), and 'upper bound' is withdrawn; S1.1-E07 replaces it [bug fix (ORC-BRUTE triggers)]
```

## Appendix K. Defect reproductions: original S1 implementation (`repro/original.json.txt`)

```
# node repro/s1.1/defects.mjs <S1 review package>/legion-progression-lab   (ZIP SHA-256 b255d94ba35c6649d70d838f44f39bda5fde6c7f2b12332adbecb9b1ef6d7fd3, verified against its manifest)
{
  "lab": "as given",
  "implementation": "original (S1)",
  "D1_duplicateKillCredit": [
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-a",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": null,
        "lootRngState": [
          637869810,
          4046850466,
          3148745422,
          1381103177
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-a",
        "runAborted": true,
        "error": "TX_CONFLICT: txId was already committed with a different payload"
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-b",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": null,
        "lootRngState": [
          2993150841,
          1354937898,
          4000919107,
          3925396596
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-b",
        "runAborted": true,
        "error": "TX_CONFLICT: txId was already committed with a different payload"
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-c",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": null,
        "lootRngState": [
          205201725,
          597014283,
          3334040024,
          3060235381
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-c",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 8,
        "zone1Kills": 2,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": null,
        "lootRngState": [
          3867533570,
          2435992392,
          1473931430,
          1616514042
        ],
        "creditLogEntries": 2,
        "rejectionLogEntries": []
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-d",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": null,
        "lootRngState": [
          3645814607,
          3146299792,
          2959804850,
          2399265337
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-d",
        "runAborted": true,
        "error": "TX_CONFLICT: txId was already committed with a different payload"
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-e",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": null,
        "lootRngState": [
          482265651,
          3117795646,
          704042739,
          1219979145
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-e",
        "runAborted": true,
        "error": "TX_CONFLICT: txId was already committed with a different payload"
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-f",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": null,
        "lootRngState": [
          1536779821,
          2143364483,
          163387346,
          2200239326
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-f",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 8,
        "zone1Kills": 2,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": null,
        "lootRngState": [
          2756904171,
          1526111475,
          3183161487,
          2111625241
        ],
        "creditLogEntries": 2,
        "rejectionLogEntries": []
      }
    }
  ],
  "D2_repeatedDeaths": [
    {
      "policy": "POL-FIXED-3",
      "firstAutoFarmStopMs": 82000,
      "firstReEnableAfterStopMs": 87000,
      "deathsIn60Min": 124,
      "autoFarmStopsIn60Min": 122,
      "killsIn60Min": 0,
      "finalZone": 3,
      "policyReports": []
    }
  ],
  "D3_policyTriggers": [
    {
      "policy": "POL-STAY",
      "gateCompletions": [
        {
          "t": 283700,
          "gateId": "gate.w1.01_to_02",
          "triggersSeenByPolicyAtThatMoment": [
            [
              "kill"
            ]
          ]
        },
        {
          "t": 958400,
          "gateId": "gate.w1.02_to_03",
          "triggersSeenByPolicyAtThatMoment": [
            [
              "kill"
            ]
          ]
        }
      ]
    }
  ],
  "D4_estimator": {
    "zeroHitChance": {
      "killsPerHour": 2400,
      "ttkS": 0,
      "deathsPerHour": 0,
      "killsPerLife": null,
      "limitingFactor": "attack",
      "reliability": null,
      "reasons": null
    },
    "oneIn4BillionHitChance": {
      "killsPerHour": 2399.9962929424696,
      "ttkS": 0.000002114296464817067,
      "deathsPerHour": 0.000042285441119179595,
      "killsPerLife": 56757035.74140776,
      "limitingFactor": "attack",
      "reliability": null,
      "reasons": null
    },
    "level1Zone3DiesBeforeKill": {
      "killsPerHour": 65.15307093221234,
      "ttkS": 22.49245669364442,
      "deathsPerHour": 89.54529674742797,
      "killsPerLife": 0.727599028634452,
      "limitingFactor": "survival",
      "reliability": null,
      "reasons": null
    }
  },
  "D5_dropQuantities": {
    "threePerKill": {
      "drops": [
        {
          "resourceId": "res.mat.slime_gel",
          "chanceBp": 10000,
          "qty": 3
        }
      ],
      "kills": 16,
      "ledgerGel": 48,
      "metricsDropsGel": 16,
      "metricsMaterialsGel": null
    },
    "repeatedResource": {
      "drops": [
        {
          "resourceId": "res.mat.slime_gel",
          "chanceBp": 10000,
          "qty": 2
        },
        {
          "resourceId": "res.mat.slime_gel",
          "chanceBp": 10000,
          "qty": 1
        }
      ],
      "kills": 16,
      "ledgerGel": 48,
      "metricsDropsGel": 32,
      "metricsMaterialsGel": null
    }
  },
  "D6_autoFarmOff": {
    "autoFarmOffAtMs": 10400,
    "killsIn60s": 2,
    "killTimesMs": [
      10400,
      14300
    ],
    "engagementsStarted": [
      {
        "t": 0,
        "origin": null
      },
      {
        "t": 10400,
        "origin": null
      }
    ]
  },
  "D7_regenAfterManualKill": {
    "killAtMs": 10400,
    "hpAfterFight": 59,
    "regenTicksWhileIdle": 0,
    "hpAtSessionEnd": 59,
    "maxHp": 60
  },
  "D8_manualEngageAcrossSessions": {
    "killsInSession1": 1,
    "commandsInSession2": 0,
    "killsInSession2": 1,
    "engagementsInSession2": [
      70400
    ]
  }
}
```

## Appendix L. Defect reproductions: corrected S1.1 (`repro/corrected.json.txt`)

```
# node repro/s1.1/defects.mjs .   (corrected S1.1 working tree)
{
  "lab": "as given",
  "implementation": "corrected (S1.1)",
  "D1_duplicateKillCredit": [
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-a",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": {},
        "lootRngState": [
          637869810,
          4046850466,
          3148745422,
          1381103177
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-a",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": {
          "CREDIT_REPLAYED": 1
        },
        "lootRngState": [
          637869810,
          4046850466,
          3148745422,
          1381103177
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": [
          {
            "creditId": "kill:enc:1:zone.w1.01#1",
            "code": "CREDIT_REPLAYED"
          }
        ]
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-b",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": {},
        "lootRngState": [
          2993150841,
          1354937898,
          4000919107,
          3925396596
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-b",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": {
          "CREDIT_REPLAYED": 1
        },
        "lootRngState": [
          2993150841,
          1354937898,
          4000919107,
          3925396596
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": [
          {
            "creditId": "kill:enc:1:zone.w1.01#1",
            "code": "CREDIT_REPLAYED"
          }
        ]
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-c",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": {},
        "lootRngState": [
          205201725,
          597014283,
          3334040024,
          3060235381
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-c",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": {
          "CREDIT_REPLAYED": 1
        },
        "lootRngState": [
          205201725,
          597014283,
          3334040024,
          3060235381
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": [
          {
            "creditId": "kill:enc:1:zone.w1.01#1",
            "code": "CREDIT_REPLAYED"
          }
        ]
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-d",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": {},
        "lootRngState": [
          3645814607,
          3146299792,
          2959804850,
          2399265337
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-d",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": {
          "CREDIT_REPLAYED": 1
        },
        "lootRngState": [
          3645814607,
          3146299792,
          2959804850,
          2399265337
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": [
          {
            "creditId": "kill:enc:1:zone.w1.01#1",
            "code": "CREDIT_REPLAYED"
          }
        ]
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-e",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": {},
        "lootRngState": [
          482265651,
          3117795646,
          704042739,
          1219979145
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-e",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": {
          "CREDIT_REPLAYED": 1
        },
        "lootRngState": [
          482265651,
          3117795646,
          704042739,
          1219979145
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": [
          {
            "creditId": "kill:enc:1:zone.w1.01#1",
            "code": "CREDIT_REPLAYED"
          }
        ]
      }
    },
    {
      "withoutInjection": {
        "seedRoot": "repro-d1-f",
        "runAborted": false,
        "injectedDuplicateOf": null,
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 0,
        "rejectedCredits": {},
        "lootRngState": [
          1536779821,
          2143364483,
          163387346,
          2200239326
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": []
      },
      "withInjectedDuplicate": {
        "seedRoot": "repro-d1-f",
        "runAborted": false,
        "injectedDuplicateOf": {
          "t": 10400,
          "encounterId": "enc:1",
          "instanceId": "zone.w1.01#1"
        },
        "gold": 1,
        "cumulativeExp": 4,
        "zone1Kills": 1,
        "duplicateCreditsCounter": 1,
        "rejectedCredits": {
          "CREDIT_REPLAYED": 1
        },
        "lootRngState": [
          1536779821,
          2143364483,
          163387346,
          2200239326
        ],
        "creditLogEntries": 1,
        "rejectionLogEntries": [
          {
            "creditId": "kill:enc:1:zone.w1.01#1",
            "code": "CREDIT_REPLAYED"
          }
        ]
      }
    }
  ],
  "D2_repeatedDeaths": [
    {
      "policy": "POL-FIXED-3",
      "firstAutoFarmStopMs": 82000,
      "firstReEnableAfterStopMs": null,
      "deathsIn60Min": 3,
      "autoFarmStopsIn60Min": 1,
      "killsIn60Min": 0,
      "finalZone": 3,
      "policyReports": [
        {
          "t": 87000,
          "code": "FIXED_ZONE_BLOCKED",
          "zoneOrder": 3,
          "level": 1
        }
      ]
    },
    {
      "policy": "CTL-FIXED-3-S1",
      "firstAutoFarmStopMs": 82000,
      "firstReEnableAfterStopMs": 87000,
      "deathsIn60Min": 124,
      "autoFarmStopsIn60Min": 122,
      "killsIn60Min": 0,
      "finalZone": 3,
      "policyReports": []
    }
  ],
  "D3_policyTriggers": [
    {
      "policy": "POL-STAY",
      "gateCompletions": [
        {
          "t": 283700,
          "gateId": "gate.w1.01_to_02",
          "triggersSeenByPolicyAtThatMoment": [
            [
              "gate-completed",
              "kill"
            ]
          ]
        },
        {
          "t": 961000,
          "gateId": "gate.w1.02_to_03",
          "triggersSeenByPolicyAtThatMoment": [
            [
              "gate-completed",
              "kill"
            ]
          ]
        }
      ]
    },
    {
      "policy": "CTL-STAY-S1",
      "gateCompletions": [
        {
          "t": 283700,
          "gateId": "gate.w1.01_to_02",
          "triggersSeenByPolicyAtThatMoment": [
            [
              "gate-completed",
              "kill"
            ]
          ]
        },
        {
          "t": 958400,
          "gateId": "gate.w1.02_to_03",
          "triggersSeenByPolicyAtThatMoment": [
            [
              "gate-completed",
              "kill"
            ]
          ]
        }
      ]
    }
  ],
  "D4_estimator": {
    "zeroHitChance": {
      "killsPerHour": 0,
      "ttkS": null,
      "deathsPerHour": null,
      "killsPerLife": 0,
      "limitingFactor": "attack",
      "reliability": "unreachable",
      "reasons": [
        "NO_HIT_CHANCE"
      ]
    },
    "oneIn4BillionHitChance": {
      "killsPerHour": 0,
      "ttkS": null,
      "deathsPerHour": null,
      "killsPerLife": 0,
      "limitingFactor": "attack",
      "reliability": "unreachable",
      "reasons": [
        "SWING_BUDGET"
      ]
    },
    "level1Zone3DiesBeforeKill": {
      "killsPerHour": 2.5092773437499983e-12,
      "ttkS": 22.49245669364442,
      "deathsPerHour": 124.13793103448262,
      "killsPerLife": 2.021362304687501e-14,
      "limitingFactor": "survival",
      "reliability": "unsafe",
      "reasons": [
        "UNDER_ONE_KILL_PER_LIFE",
        "AUTO_FARM_STOP_EXPECTED"
      ]
    }
  },
  "D5_dropQuantities": {
    "threePerKill": {
      "drops": [
        {
          "resourceId": "res.mat.slime_gel",
          "chanceBp": 10000,
          "qty": 3
        }
      ],
      "kills": 16,
      "ledgerGel": 48,
      "metricsDropsGel": 16,
      "metricsMaterialsGel": 48
    },
    "repeatedResource": {
      "drops": [
        {
          "resourceId": "res.mat.slime_gel",
          "chanceBp": 10000,
          "qty": 2
        },
        {
          "resourceId": "res.mat.slime_gel",
          "chanceBp": 10000,
          "qty": 1
        }
      ],
      "kills": 16,
      "ledgerGel": 48,
      "metricsDropsGel": 32,
      "metricsMaterialsGel": 48
    }
  },
  "D6_autoFarmOff": {
    "autoFarmOffAtMs": 10400,
    "killsIn60s": 1,
    "killTimesMs": [
      10400
    ],
    "engagementsStarted": [
      {
        "t": 0,
        "origin": "auto"
      },
      {
        "t": 10400,
        "origin": "auto"
      }
    ]
  },
  "D7_regenAfterManualKill": {
    "killAtMs": 10400,
    "hpAfterFight": 59,
    "regenTicksWhileIdle": 1,
    "hpAtSessionEnd": 60,
    "maxHp": 60
  },
  "D8_manualEngageAcrossSessions": {
    "killsInSession1": 1,
    "commandsInSession2": 0,
    "killsInSession2": 0,
    "engagementsInSession2": []
  }
}
```

## Appendix M. S0-R01 curve preview reproduction (`curve-preview-reproduction.txt`)

```
S0-R01 semantic.json identical across both runs: yes
S0-R01 semantic.json identical to S0 evidence: yes
S0-R01 semantic fingerprint: 24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9
```

## Appendix N. Frozen simulator, archive and old workspaces (`frozen-check.txt`)

```
Frozen simulator, Original v1 archive and old workspace check after S1.1 (2026-11-13T20:26:16Z)
Frozen workspace files: 3012 (M0: 3012)
path/size/mtime list vs M0 start: IDENTICAL
content SHA-256 list vs M0 start: IDENTICAL
combined fingerprint: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d (M0: 1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d)
frozen HEAD: 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; Original v1 working files: 12 (M0: 12)
archive master 74499ef2a7ec154bdcbc10b1152f2aec89c3c913; archive/increment6-original-v1 8d80a440d9818c961713b767f696764b3f18db66; remotes 0
old Legion workspace: 16 files IDENTICAL to the copy-time hashes
Original S1 review package used for reproductions: b255d94ba35c6649d70d838f44f39bda5fde6c7f2b12332adbecb9b1ef6d7fd3
All git reads used GIT_OPTIONAL_LOCKS=0; nothing was written to these locations.
```

## Appendix O. Git status (`git-status.txt`)

```
$ git log --oneline
ad11a50 S0 checkpoint: S0 + S0.1 hardening + final ledger identity correction
0209d93 M0 resolution and review corrections (v1.1); repository verification; Rojo 7.7.1
3aced25 M0 import: design pack v1.0, M0 planning documents (as reviewed), Rojo starter

$ git tag -n1
s0-checkpoint   S0 checkpoint (S0 + S0.1 + final ledger correction), accepted by the owner after independent review. Local only; not pushed.

$ git status --porcelain=v1 --untracked-files=all
 M legion-progression-lab/CHANGELOG.md
 M legion-progression-lab/PROVENANCE.md
 M legion-progression-lab/README.md
 M legion-progression-lab/package.json
 M legion-progression-lab/planning/M0_REPOSITORY_VERIFICATION.md
 M legion-progression-lab/src/core/content/validate.ts
 M legion-progression-lab/src/core/errors.ts
 M legion-progression-lab/src/core/formulas/combat.ts
 M legion-progression-lab/src/spec/fixtureRunner.ts
 M legion-progression-lab/src/spec/fixtureSchema.ts
 M legion-progression-lab/test/fixtures.conformance.test.ts
 M legion-progression-lab/test/purity.test.ts
 M spec/README.md
 M spec/fixtures/combat.v2.json
 M spec/formulas/combat.md
 M spec/oracle/check_all.py
 M spec/oracle/exact_oracle.py
 M spec/schema/fixture.schema.json
?? legion-progression-lab/content/tables/xp-sweep.index.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a10-p1.6.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a10-p1.8.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a10-p2.0.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a12-p1.6.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a12-p1.8.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a12-p2.0.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a8-p1.6.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a8-p1.8.v0.1.0.json
?? legion-progression-lab/content/tables/xp.w1.sweep.a8-p2.0.v0.1.0.json
?? legion-progression-lab/content/w1-slice.candidate.v0.1.0.json
?? legion-progression-lab/evidence/s0-checkpoint/CHECKPOINT.md
?? legion-progression-lab/evidence/s0-checkpoint/checkpoint.diffstat.txt
?? legion-progression-lab/evidence/s0-checkpoint/checkpoint.patch
?? legion-progression-lab/evidence/s1.1/S1_1_EVIDENCE.md
?? legion-progression-lab/evidence/s1.1/analysis-gates.json
?? legion-progression-lab/evidence/s1.1/analysis.txt
?? legion-progression-lab/evidence/s1.1/curve-preview-reproduction.txt
?? legion-progression-lab/evidence/s1.1/curve-preview-run1.txt
?? legion-progression-lab/evidence/s1.1/curve-preview-run2.txt
?? legion-progression-lab/evidence/s1.1/exp-verify.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E01-base-attribution/environment.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E01-base-attribution/events.sample.jsonl
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E01-base-attribution/fingerprint.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E01-base-attribution/quantiles.csv
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E01-base-attribution/report.md
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E01-base-attribution/semantic.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E02-estimator/environment.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E02-estimator/fingerprint.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E02-estimator/quantiles.csv
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E02-estimator/report.md
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E02-estimator/semantic.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E03-earlier-zone-audit/environment.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E03-earlier-zone-audit/fingerprint.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E03-earlier-zone-audit/quantiles.csv
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E03-earlier-zone-audit/report.md
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E03-earlier-zone-audit/semantic.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E04-survival-policies/environment.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E04-survival-policies/events.sample.jsonl
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E04-survival-policies/fingerprint.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E04-survival-policies/quantiles.csv
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E04-survival-policies/report.md
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E04-survival-policies/semantic.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E05-drops-quantities/environment.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E05-drops-quantities/fingerprint.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E05-drops-quantities/quantiles.csv
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E05-drops-quantities/report.md
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E05-drops-quantities/semantic.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E06-determinism/environment.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E06-determinism/events.sample.jsonl
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E06-determinism/fingerprint.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E06-determinism/quantiles.csv
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E06-determinism/report.md
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E06-determinism/semantic.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E07-policy-comparison/environment.json
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E07-policy-comparison/events.sample.jsonl
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E07-policy-comparison/fingerprint.txt
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E07-policy-comparison/quantiles.csv
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E07-policy-comparison/report.md
?? legion-progression-lab/evidence/s1.1/experiments/S1.1-E07-policy-comparison/semantic.json
?? legion-progression-lab/evidence/s1.1/fixtures-check.txt
?? legion-progression-lab/evidence/s1.1/frozen-check.txt
?? legion-progression-lab/evidence/s1.1/git-status.txt
?? legion-progression-lab/evidence/s1.1/mutation-check.txt
?? legion-progression-lab/evidence/s1.1/oracle-check.txt
?? legion-progression-lab/evidence/s1.1/repro/corrected.json.txt
?? legion-progression-lab/evidence/s1.1/repro/original.json.txt
?? legion-progression-lab/evidence/s1.1/s1-and-s1_1-vs-checkpoint.patch
?? legion-progression-lab/evidence/s1.1/s1-manifest-refused.txt
?? legion-progression-lab/evidence/s1.1/s1_1-vs-s1-package.patch
?? legion-progression-lab/evidence/s1.1/schemas-check.txt
?? legion-progression-lab/evidence/s1.1/test-output.txt
?? legion-progression-lab/evidence/s1.1/test-results.json
?? legion-progression-lab/evidence/s1.1/test-stats-output.txt
?? legion-progression-lab/evidence/s1.1/tool-versions.txt
?? legion-progression-lab/evidence/s1.1/typecheck.txt
?? legion-progression-lab/evidence/s1/S1_EVIDENCE.md
?? legion-progression-lab/evidence/s1/analysis-e01.txt
?? legion-progression-lab/evidence/s1/analysis-e05.txt
?? legion-progression-lab/evidence/s1/curve-preview-reproduction.txt
?? legion-progression-lab/evidence/s1/curve-preview-run1.txt
?? legion-progression-lab/evidence/s1/curve-preview-run2.txt
?? legion-progression-lab/evidence/s1/exp-verify.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E01-calibration/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E02-estimator/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E03-earlier-zone-audit/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E04-survival/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E05-gate-pacing/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness-b/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E06-drop-correctness/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E07-determinism/semantic.json
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/environment.json
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/events.sample.jsonl
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/fingerprint.txt
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/quantiles.csv
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/report.md
?? legion-progression-lab/evidence/s1/experiments/S1-E08-policy-bound/semantic.json
?? legion-progression-lab/evidence/s1/experiments/ledger-benchmark/benchmark.json
?? legion-progression-lab/evidence/s1/fixtures-check.txt
?? legion-progression-lab/evidence/s1/frozen-check.txt
?? legion-progression-lab/evidence/s1/git-status-summary.txt
?? legion-progression-lab/evidence/s1/git-status.txt
?? legion-progression-lab/evidence/s1/mutation-check-run1.txt
?? legion-progression-lab/evidence/s1/mutation-check.txt
?? legion-progression-lab/evidence/s1/oracle-check.txt
?? legion-progression-lab/evidence/s1/s1.patch
?? legion-progression-lab/evidence/s1/schemas-check.txt
?? legion-progression-lab/evidence/s1/test-output.txt
?? legion-progression-lab/evidence/s1/test-results.json
?? legion-progression-lab/evidence/s1/test-stats-output.txt
?? legion-progression-lab/evidence/s1/tool-versions.txt
?? legion-progression-lab/evidence/s1/traces/01-simultaneous-lethal.jsonl
?? legion-progression-lab/evidence/s1/traces/02-retaliation-at-death.jsonl
?? legion-progression-lab/evidence/s1/traces/03-death-cancels-swing.jsonl
?? legion-progression-lab/evidence/s1/traces/04-session-boundary.jsonl
?? legion-progression-lab/evidence/s1/traces/05-multi-level-up.jsonl
?? legion-progression-lab/evidence/s1/traces/06-target-invalidation.jsonl
?? legion-progression-lab/evidence/s1/traces/07-boss-timer-half-open.jsonl
?? legion-progression-lab/evidence/s1/traces/08-base-POL-FRONTIER-opening.jsonl
?? legion-progression-lab/evidence/s1/typecheck.txt
?? legion-progression-lab/manifests/s1.1/PREREGISTRATION.md
?? legion-progression-lab/manifests/s1.1/S1.1-E01-base-attribution.json
?? legion-progression-lab/manifests/s1.1/S1.1-E02-estimator.json
?? legion-progression-lab/manifests/s1.1/S1.1-E03-earlier-zone-audit.json
?? legion-progression-lab/manifests/s1.1/S1.1-E04-survival-policies.json
?? legion-progression-lab/manifests/s1.1/S1.1-E05-drops-quantities.json
?? legion-progression-lab/manifests/s1.1/S1.1-E06-determinism.json
?? legion-progression-lab/manifests/s1.1/S1.1-E07-policy-comparison.json
?? legion-progression-lab/manifests/s1.1/preregistration.json
?? legion-progression-lab/manifests/s1/AMENDMENT-01.md
?? legion-progression-lab/manifests/s1/PREREGISTRATION.md
?? legion-progression-lab/manifests/s1/S1-E01-calibration.json
?? legion-progression-lab/manifests/s1/S1-E02-estimator.json
?? legion-progression-lab/manifests/s1/S1-E03-earlier-zone-audit.json
?? legion-progression-lab/manifests/s1/S1-E04-survival.json
?? legion-progression-lab/manifests/s1/S1-E05-gate-pacing.json
?? legion-progression-lab/manifests/s1/S1-E06-drop-correctness-b.json
?? legion-progression-lab/manifests/s1/S1-E06-drop-correctness.json
?? legion-progression-lab/manifests/s1/S1-E07-determinism.json
?? legion-progression-lab/manifests/s1/S1-E08-policy-bound.json
?? legion-progression-lab/manifests/s1/preregistration.json
?? legion-progression-lab/planning/LEDGER_INFRASTRUCTURE_PROPOSAL.md
?? legion-progression-lab/planning/S1_1_RESOLUTIONS.md
?? legion-progression-lab/planning/S1_OWNER_RESOLUTIONS.md
?? legion-progression-lab/planning/S1_RESOLUTIONS.md
?? legion-progression-lab/repro/s1.1/analyse.py
?? legion-progression-lab/repro/s1.1/defects.mjs
?? legion-progression-lab/src/cli/bench-ledger.ts
?? legion-progression-lab/src/cli/bench/hamtLedger.ts
?? legion-progression-lab/src/cli/build-xp-sweep.ts
?? legion-progression-lab/src/cli/exp-worker.ts
?? legion-progression-lab/src/cli/exp.ts
?? legion-progression-lab/src/cli/s1-analyse.ts
?? legion-progression-lab/src/cli/s1-content.ts
?? legion-progression-lab/src/cli/s1-traces.ts
?? legion-progression-lab/src/engine/commands.ts
?? legion-progression-lab/src/engine/credit.ts
?? legion-progression-lab/src/engine/estimator-s1.ts
?? legion-progression-lab/src/engine/estimator.ts
?? legion-progression-lab/src/engine/observation.ts
?? legion-progression-lab/src/engine/queue.ts
?? legion-progression-lab/src/engine/rewards.ts
?? legion-progression-lab/src/engine/simulation.ts
?? legion-progression-lab/src/experiments/jobs.ts
?? legion-progression-lab/src/experiments/manifest.ts
?? legion-progression-lab/src/experiments/metrics.ts
?? legion-progression-lab/src/experiments/patch.ts
?? legion-progression-lab/src/experiments/report.ts
?? legion-progression-lab/src/experiments/stats.ts
?? legion-progression-lab/src/experiments/summary.ts
?? legion-progression-lab/src/model/content.ts
?? legion-progression-lab/src/model/types.ts
?? legion-progression-lab/src/policy/oracle.ts
?? legion-progression-lab/src/policy/realistic.ts
?? legion-progression-lab/src/spec/s1Fixtures.ts
?? legion-progression-lab/test/helpers/s1.ts
?? legion-progression-lab/test/s1.determinism.test.ts
?? legion-progression-lab/test/s1.events.test.ts
?? legion-progression-lab/test/s1.experiments.test.ts
?? legion-progression-lab/test/s1.gates.test.ts
?? legion-progression-lab/test/s1_1.behaviour.test.ts
?? legion-progression-lab/test/s1_1.credit.test.ts
?? legion-progression-lab/test/stats/s1.drops.distribution.test.ts
?? spec/fixtures/combat-loop.v1.json
?? spec/fixtures/credits.v1.json
?? spec/fixtures/estimator.v1.json
?? spec/fixtures/gates.v1.json
?? spec/fixtures/rewards.v1.json
?? spec/formulas/estimator.md
?? spec/formulas/gates.md
?? spec/formulas/s1-combat-loop.md
?? spec/oracle/s1_oracle.py

$ git diff --stat ad11a508fd715b08705c5ee72f215f92183f0993
 legion-progression-lab/CHANGELOG.md                | 147 ++++++++++++++
 legion-progression-lab/PROVENANCE.md               |  10 +-
 legion-progression-lab/README.md                   |  29 ++-
 legion-progression-lab/package.json                |   6 +-
 .../planning/M0_REPOSITORY_VERIFICATION.md         |  12 +-
 .../src/core/content/validate.ts                   |   4 +-
 legion-progression-lab/src/core/errors.ts          |   3 +
 legion-progression-lab/src/core/formulas/combat.ts |  15 ++
 legion-progression-lab/src/spec/fixtureRunner.ts   |  22 ++-
 legion-progression-lab/src/spec/fixtureSchema.ts   |   4 +-
 .../test/fixtures.conformance.test.ts              |   4 +-
 legion-progression-lab/test/purity.test.ts         |   5 +-
 spec/README.md                                     |   8 +-
 spec/fixtures/combat.v2.json                       | 213 ++++++++++++++++++++-
 spec/formulas/combat.md                            |  47 ++++-
 spec/oracle/check_all.py                           |   6 +
 spec/oracle/exact_oracle.py                        |   7 +
 spec/schema/fixture.schema.json                    |  13 +-
 18 files changed, 522 insertions(+), 33 deletions(-)
```

## Appendix P. Tool versions (`tool-versions.txt`)

```
Captured: 2026-11-13T20:18:19Z
node v24.22.3
npm 11.19.1
typescript Version 7.0.2
vitest vitest/4.1.12 win32-x64 node-v24.22.3
zod 4.6.7
fast-check 4.10.2
Python 3.12.9
git version 2.53.0.windows.1
OS: MINGW64_NT-10.0-26300 3.6.6-1cdd4371.x86_64 x86_64
CPUs: 16
package-lock.json sha256: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6 (unchanged from S0: d6bdf80aad4665bca92fdf8f2cb6f2f80cebb5fe3796f7a0196142ad541665d6)
```
