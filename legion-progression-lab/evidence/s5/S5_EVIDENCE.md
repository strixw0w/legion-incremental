# S5 evidence: offline progression on the actual engine

**Status: candidate, uncommitted, awaiting independent review and owner acceptance.**

**Baseline:** HEAD is the L2 checkpoint (commit `43a1a16c4c9a67841e3569cc11bcbabc63d8b902`, annotated tag
`l2-checkpoint`; L2 + L2.1 accepted). S5 is uncommitted on top of it, and nothing is pushed. S6 has not been started.

**Source:** the owner's "L2.1 Acceptance and S5 Authorisation" (2026-11-15).

**About independence:** every check here was written by the same author as the code. The oracles re-derive from the
rule text with separate code, but they are not an independent party; the independent review is the owner's.

## Where to start

| Document | What it holds |
|---|---|
| `planning/S5_SPECIFICATION.md` v0.2 | the design as implemented, and the proposed rule resolutions S5-R01 … S5-R14 |
| `evidence/s5/integration/INTEGRATION_REPORT.md` | checkpoint A: actual-engine L2 integration, bounded state, actual account growth, the reconstruction corrections |
| `evidence/s5/experiments/RESULTS.md` | S5-E01 … E08: gates, balance results, missed targets |
| `evidence/s5/performance/PERFORMANCE.md` | settlement performance, exact optimisations, experiment workloads, the verification cache, fresh historical controls |
| `manifests/s5/PREREGISTRATION.md` | the registration (2026-11-15T20:13:30Z), hypotheses, sizes and budgets |
| `spec/formulas/s5-offline.md` v1 | the credited-duration and settlement-timing rules (with `spec/oracle/s5_oracle.py` and `spec/fixtures/s5-*.v1.json`) |

## The L2 acceptance addendum and checkpoint
- **The L2.1 acceptance corrections** A (own-property stream dictionaries) and B (the highest-sequence receipt
  invariant) are in `evidence/l2-acceptance/`, committed in the checkpoint.
- **The checkpoint record** is `evidence/l2-checkpoint/CHECKPOINT.md` (commit SHA, tag, clean-export check,
  frozen check), written after the commit and uncommitted.

## The internal checkpoints (owner §20)

| # | Checkpoint | Evidence |
|---|---|---|
| 1–2 | L2.1 corrections; local L2 Git checkpoint | `evidence/l2-acceptance/`, `evidence/l2-checkpoint/` |
| 3 | Actual engine L2 integration and bounded state | `integration/` (identity differential, checkpoint corpus, growth); `test/s5.identity.test.ts` |
| 4 | Offline assignment and efficiency semantics | `src/engine/offline.ts`; `test/s5.offline.test.ts`; the oracle families |
| 5–6 | Reference offline progression; efficient chronological settlement | the reference and efficient steppers; S5-E02, E03, E04; `performance/` |
| 7 | Replay, reconstruction and failure boundaries | `src/s5/settlement.ts`; `test/s5.settlement.test.ts`, `test/s5.validation.test.ts`; S5-E05; `integration/offline-corpus.json` |
| 8 | Monument of Eternity and welcome-back summary | `content/w1-slice-s5.candidate.v0.5.0.json`; `test/s5.eternity.test.ts`; `examples/` |
| 9 | Registered S5 experiments | `experiments/` |

## Verification summary
**The gate record** is `evidence/s5/gates-run.txt`; the suite outputs are in `evidence/s5/suites/`.

| Check | Result |
|---|---|
| Type check | clean |
| Tests (`npm test`) | 1,658 passed, 0 failed |
| Statistical suite | 9 passed |
| Fixtures | 669 cases, 0 problems (62 new S5 cases in 2 families) |
| Oracles | 22 groups, 0 failing (new: S5 families, `spec/oracle/s5_oracle.py`) |
| Schemas | unchanged |
| Mutation set (planted bugs in the S5 code) | first run 30 / 33 detected; M5, M7 and M19 missed. Three tests added, follow-up 3 / 3 (`mutation-check-s5-first-run.txt`, `mutation-check-s5-followup.txt`) |
| Registered experiments | 8 / 8 COMPLETE within their budgets; gates G-S5-01 … 06 pass (`experiments/RESULTS.md`) |
| Settlement profile (registered budgets) | every budget met: a maximal absence takes 2.5 s at 60 % and 4.2 s at 100 %; at least 9.9 game h per s; account at most 102 KB; restore and save 3 ms; 294 MB peak |
| Identity differential (L1 against L2, actual engine) | 14 / 14 runs identical |
| Checkpoint corpus (both identities) | 768 checkpoints, 0 false refusals; 1,382 / 1,382 required-event removals refused; 72 / 72 resumes exact |
| Offline checkpoint corpus | 219 checkpoints, 0 false refusals; 455 / 455 removals refused; 45 / 45 resumes and 6 / 6 partition runs exact |
| Actual account growth | L1 26.5 MB against L2 67.7 KB after 7 game days; bounded at most 84 KB until the content ends (day 12) |
| Optimisation exactness (A/B on the final code) | identical state, log digest and event counts |
| Historical controls (fresh, `--verify`) | 9 / 9 MATCH |
| Exact dependency cache | 0 HIT, 45 MISS: every historical runner imports changed S5 code, so nothing is reused; representative controls instead |
| Registration | 0 changed: the S5 registration and every earlier register |
| Preservation | 0 tracked evidence, manifest, content, fixture, formula or repro files changed since `l2-checkpoint` |
| Frozen simulator, Original v1 archive, old workspace | identical; nothing pushed |

**Process note: line endings.**
- **What happened:** the Python patch scripts used during S5 wrote 26 source and tool files with Windows line endings
  (text mode). The registered runs (20:16–21:55Z) used those files.
- **What was done:** at 22:09Z every file was put back to Unix line endings. The first gate attempt is kept, stopped
  where a planted-bug pattern no longer matched (`mutation-check-s5-attempt-stopped-on-line-endings.txt`,
  `gates-run-attempt-1.txt`).
- **Why the results stand:** line endings change no TypeScript semantics, and the content pack's fingerprint is
  computed from its parsed data.
- **What runs on the normalised files:** the gates, the mutation set, the suites and the historical controls.
- **The confirming check:** the fresh-extraction verification re-runs S5-E01, E02 and E04 from their registered
  manifests on the normalised files and compares their semantic rows fingerprints with the registered runs.


## What S5 delivers (plain summary)

**Bounded actual engine:**
- the kill-credit chain is replaced by exact settled ranges with explicit abandonment;
- the ledger keeps a window of 256 transactions;
- spent items and finished jobs retire.

**The result:** gameplay is identical to the historical engine, and an S4 account's checkpoint stays at about 62–84
KB while the old one grows to 26.5 MB in 7 game days.

**Offline progression on the actual engine:**
- during an absence the game clock runs at the credited rate (60 % for 24 h, 30 % for the next 48 h, none beyond);
- everything then happens in order: level-ups, Bestiary, permanent bonuses, gathering, production pauses and
  resumptions;
- the efficiency is applied once, rewards are never multiplied, and every split of an absence gives the same result;
- offline equals connected automated play for the credited time.

**Offline assignments:**
- a preview shows exactly what logout applies;
- the restrictions hold: no visiting, discovery, boss, purchases or decisions offline;
- a reconnect never resets a timer.

**A lab settlement service:**
- receipts;
- exactly-once retries;
- refusals by name;
- compare-and-swap commits, modelled failures before and after the commit;
- the welcome-back summary, committed in the receipt.

It is not Roblox persistence.

**The Monument of Eternity** (60 → 100 %) is in a new candidate pack; the S4 packs are unchanged.

## Missed targets, findings and limitations

**Missed targets (balance candidates; nothing was tuned to pass):**
1. **H-S5-03 is not met.** PR-CAS's offline share is about 97 % of combat EXP, gold and kills, and 99 % of units
   gathered, against the 30–60 % candidate band. No second-window arm changes this (E06). The efficiency was not
   lowered (owner §16).
2. **H-S5-04 holds in most seeds but not all.** In PR-CAS at D1 it held in only 118 / 200: early connected minutes
   come at low levels.
3. **E08: there is an unintended connected-idle incentive.** Connected idle gives 1.667 × offline per hour, and active
   play adds nothing to farming throughput in the slice: farming is limited by respawns. Active-only value lies in
   decisions.

**Findings:**
- **S5-R14:** S4 accepts a Monument purchase submitted between sessions. No S4 control does so, and S4 is unchanged;
  offline mode refuses it. The owner decides for S4.
- **PR-ABS** is credited about 33 % less than the sub-24-hour profiles over the same calendar: the declared window
  and cap effect.

**Limitations:**
- **The slice content's EXP table ends at level 201.**
  - Every E07 replicate leaves the content before D7, so D7 is not observable.
  - The bounded 28-day growth run ends on day 12 for the same reason.
- **Two states never occurred at a checkpoint in the corpora.**
  - Boss encounters: no realistic policy challenges the boss in these windows.
  - Pending settlements: they exist within one moment only.

  Their rules are exercised by construction in the tests.
- **E03's absences contain no profession level-ups** (its recruits fight). Profession progression offline is
  exercised in E04 and in the examples.
- **Costs not separately measured:** production and combat processing costs are not profiled separately. Total
  events, and the event mix in the example traces, are reported instead.
- **No independent oracle for the engine itself:** the oracles cover the credited-duration and timing rules. The
  engine's offline behaviour is checked by equivalences instead:
  - against connected play;
  - against its own reference stepper;
  - against split absences.
- **Security limits kept explicit:** checkpoints are trusted input (the digest is not authentication). A restored
  run's log digest is a declared chain.
- **Out of scope:** no Roblox persistence and no crash-safe storage are implemented. The settlement service is a lab
  model of the atomic transition and its failure boundaries.
- **POL5-BAL is a candidate S5 policy:** POL4-BALANCED2 plus an Eternity weight of 0.5. POL5-BAL-ATT adds the manual
  ability for E08.

## Deterministic fingerprints, git, frozen workspaces, archive
- **Fingerprints:** `evidence/s5/fingerprints.txt` (content, rules, oracle, fixtures, registration, manifests, every
  experiment's rows and semantic rows fingerprints, the integration and performance outputs).
- **Git status and diff against `l2-checkpoint`:** `evidence/s5/git-status.txt` and `evidence/s5/s5-vs-l2-checkpoint.patch`.
- **The frozen simulator, archive and old workspace:** `evidence/s5/frozen-check.txt`.
- **Registration and preservation:** `evidence/s5/registration-check.txt` and `evidence/s5/preservation-check.txt`.
- **Mutation checks:** `evidence/s5/mutation-check-s5-first-run.txt`, and the follow-up if any.
- **The archive** has a verified checksum manifest: `MANIFEST.txt` in the review ZIP, and the fresh-extraction
  verification log beside the ZIP.
