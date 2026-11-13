# S1 — owner resolutions after the independent S1 review

**Version 1.0, 2026-11-13.**

**Source:** the owner's "Independent S1 Review and S1.1 Authorisation" (§1 verification, §8 resolutions, §9 ledger decision). It replaces the *status* of the proposals in `S1_RESOLUTIONS.md` v1.0. That document is kept unchanged as the record of what was proposed.

## 1. Review outcome
- **S1 is conditionally accepted**, subject to a targeted S1.1 correction pass. S1 is not committed.
- **S2 is not authorised.**
- **What the reviewer verified independently** (as stated by the owner; not overstated here):
  - the S1 review ZIP SHA-256 `b255d94ba35c6649d70d838f44f39bda5fde6c7f2b12332adbecb9b1ef6d7fd3`;
  - all 320 manifest-listed files by SHA-256 and size, with no unexpected archive files;
  - all nine pre-registration document and manifest hashes;
  - the Python oracle command: 15 groups, 0 failures. The generated-preview check was skipped in that invocation.
  - the scope (single character) and the presence of the final S0 ledger identity correction;
  - all 200 replicates of the base PR-BAL / POL-FRONTIER cell of S1-E08, run against the real TypeScript engine on Linux with Node 22.16.0:
    - EXP p10 / p50 / p90 = 8,178 / 8,200 / 8,244;
    - combined event-log digest `4ca19b6bcc63a2482f7cc0b5d5484ee6bfc7787d242fe1605b07a8e7097ac3ba`;
    - both match the packaged results exactly.

    The reviewer rebuilt the compiled content from the packaged candidate values, because the offline review environment lacked Zod.
- **Not independently re-run:** the complete Vitest suite. The supplied logs support 626 default and 9 statistical passing tests.

## 2. Resolutions S1-R01 … S1-R17
"Accepted" means accepted as the rule the simulator uses. **No candidate numerical balance coefficient is promoted to approved status** by any of these resolutions.

| ID | Owner resolution | Note for the lab |
|---|---|---|
| S1-R01 | Accepted for diagnostic S1. Actual Roblox onboarding may start in town near zone 1. | Start at zone 1's entrance stays the simulator rule. |
| S1-R02 | Accepted as candidate timings. Measure physical timings in M2. | `zoneEntryWalkMs`, `engageOverheadMs` stay candidates. |
| S1-R03 | Accepted. | |
| S1-R04 | Accepted as a candidate. | |
| S1-R05 | Accepted for S1. Do not remove future active boss dodging. | No evasion in the simulator. Active dodging is a later boss feature. |
| S1-R06 | Accepted for the simulator. Roblox targeting remains nearest eligible enemy plus manual priority. | |
| S1-R07 | Accepted for personal simulated encounters. Shared multiplayer enemy behaviour remains deferred. | |
| S1-R08 | Accepted. | |
| S1-R09 | Accepted with corrected realistic-policy response and explicit death-window boundaries. | S1.1: the window is `(t − deathWindowMs, t]`; realistic policies respect the stop (`S1_1_RESOLUTIONS.md` S1.1-R01, R02, R05). The threshold of 3 deaths in 5 minutes is preserved. |
| S1-R10 | Accepted provisionally. Test alternative healing models later. | |
| S1-R11 | Accepted provisionally. Regeneration and recovery rates remain candidates. | S1.1 completes *when* regeneration starts (S1.1-R07); the rates are unchanged. |
| S1-R12 | Accepted for initial zones. | |
| S1-R13 | Accepted. | |
| S1-R14 | Accepted for S1, with no offline productive activity. | S1.1 states world spawn maintenance between sessions explicitly (S1.1-R08). |
| S1-R15 | Accepted as diagnostic content only. | |
| S1-R16 | Accepted with trigger, recovery and oracle corrections. | S1.1-R03, R04 (triggers); S1.1-R01, R02 (recovery); ORC-BRUTE kept as a comparison control, not an upper bound. |
| S1-R17 | Accepted as hypothetical profiles, not measured player schedules. | |

## 3. Oracle
- **ORC-BRUTE** is a restricted fixed-zone lookahead strategy, not an upper bound. In S1.1 it is kept as a comparison control, with its trigger handling fixed.
- **No heuristic is to be described as a proven upper bound** without mathematical or exhaustive-search evidence.
- **Approved direction for S2** (not implemented in S1.1): a stronger search strategy that:
  - uses level-up and gate decision points;
  - tries multiple candidate continuation strategies, including the existing realistic policies;
  - has explicit computation budgets;
  - labels hindsight knowledge clearly;
  - reports the best known feasible strategy, never global optimality.

## 4. Ledger
- **Direction approved:** a structurally shared ledger.
- **Not approved:** the benchmark-only implementation as a production replacement.
- **Kept:** the current ledger as the correctness reference.
- **Next step:** a dedicated infrastructure proposal before large-scale multi-character experiments (early S2 if needed). See `LEDGER_INFRASTRUCTURE_PROPOSAL.md`.
- **No ledger replacement in S1.1.**
