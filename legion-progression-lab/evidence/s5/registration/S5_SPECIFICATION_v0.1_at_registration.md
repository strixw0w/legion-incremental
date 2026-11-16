# S5 specification: offline progression on bounded engine state

**Version 0.1 (working draft), 2026-11-15. Status: candidate, in progress.** Source: the owner's "L2.1 Acceptance and S5 Authorisation" §6–§20. Built on:
- the design register R07.01–R07.20 and R09.03–R09.04;
- the M0 resolutions D-06 (reserve), D-08 (offline windows) and R-A7 (non-combat hero);
- the M0 experiment plan §S5 (S5-E01…E08, H-S5-01…04);
- the accepted L2.1 contract v3.0.

Proposed rule resolutions are S5-R01 … and listed in §10; each is a candidate for the owner.

## 0. Internal checkpoints (owner §20)
| # | Checkpoint | Status |
|---|---|---|
| 1 | L2.1 acceptance corrections | done (`evidence/l2-acceptance/`) |
| 2 | Local L2 Git checkpoint | done (`43a1a16`, `l2-checkpoint`) |
| 3 | Actual engine L2 integration and bounded-state verification | in progress |
| 4 | Offline assignment and efficiency semantics | — |
| 5 | Reference offline progression | — |
| 6 | Efficient chronological settlement | — |
| 7 | Replay, reconstruction and failure-boundary verification | — |
| 8 | Monument of Eternity and welcome-back summary | — |
| 9 | Registered S5 experiments | — |

## 1. Bounded engine state (checkpoint 3; owner §6)
**Engine option:** `identity: 'l1' | 'l2'`. The default is `'l1'`, so every historical control runs the unchanged code path. `'l2'` turns on all of the following.

**Kill credits:**
- The committed credit chain is replaced by one exact settled range set per credit stream: `squad`, with numbers taken from `enc:N`, and `worker:<id>`, with numbers taken from `w:<id>:<seq>`.
- Encounter numbers are allocated monotonically by the engine (`encounterSeq`, the worker's `seq`).
- An encounter that ends without its kill is **explicitly abandoned**: its number is settled with no reward. Abandonment happens when the encounter is released at session end, when the hero dies, when the boss timer expires, and when a worker's fight is stopped.
- Old entries are never deleted.
- The pending claims are unchanged: their claim text is still compared exactly.
- **Declared difference** from L1: a claim for a settled number is `CREDIT_SETTLED`. L1 says `CREDIT_REPLAYED`, `CREDIT_CONFLICT` or `CREDIT_UNKNOWN`. It cannot occur without injected events.

**Ledger:** the implementation `bounded` keeps:
- the balances;
- a bounded window of recent committed transactions (replay and conflict within the window);
- a committed count.

**Exactly-once for older transactions** belongs to the identity that produced them, because every engine transaction identity is generated once:
- kill rewards by the credit ranges;
- gathering and unit settlements by the work producers;
- reservations by the jobs;
- purchases by their counters.

The engine already treats any ledger replay as an invariant failure. **Declared difference:** an evicted transaction identity presented again would not be recognised by the ledger itself.

**Items and jobs:**
- They take explicit counters (`nextItem`, `nextJob`), never the list length.
- Consumed and salvaged items leave the item list.
- Completed and cancelled jobs leave the job list, so the production producers retire.
- Their identities are never reused.

**Kept, already bounded:**
- the death and knockout windows;
- the permanent entitlements, which are bounded by the content;
- the zone counters;
- the run counters, whose keys are bounded by the code set;
- the log digest, a fixed-size hash chain.

**The diagnostic event log** (`keepLog`) is never part of a checkpoint.

**Verification:**
- an L1-against-L2 gameplay differential: identical gameplay state outside the identity evidence, identical event logs, for S2, S3 and S4 setups;
- duplicate-credit and stale-event injections;
- save, load and resume;
- long-run checkpoint-size growth in both modes.

## 2. Reconstruction corrections (owner §7)
- **A. Required live events:** for every live engine state, its continuation event must be queued, for example:
  - an active encounter has its enemy attack;
  - a dead hero has its respawn;
  - a knocked-out recruit has its recovery;
  - movement has its arrival;
  - gathering and production work have their completion;
  - pending settlements have their settle event;
  - an open session has its end.

  Stale events stay legitimate.
- **B. Pre-session state** (`session.index = -1`, before the first session opens) is supported explicitly. The tests cover before, during, between and after sessions.
- **C.** All new offline state is validated, and the tests use resumed execution, not only round trips.

## 3. Offline time model (checkpoints 4–6; owner §9, §13)
**S5-R01 Game time.** The engine runs on one clock, game time.
- Online, game time advances with wall time.
- During an absence, game time advances by the **credited productive duration** only:
  `P(w) = floor((n × min(w, 24 h) + n × k × clamp(w − 24 h, 0, 48 h)) / 10⁴)`.
  Here `w` is the wall time elapsed since the absence began, `n` the normal-window efficiency in bp (6,000 = 60%), and `k` the second-window ratio (5,000 = 0.5). It is computed exactly, in big integers.
- **Beyond 72 h the credit is zero.**
- **Everything progresses in game time,** so efficiency is applied exactly once, by slowing the productive clock: combat, gathering, smithing, recovery timers, regeneration and respawns.
- **Rewards are never multiplied,** and every remainder stays exact.
- **Level-ups and bonus changes during an absence** take effect at their game-time moment, under the existing work-start capture rule.

**S5-R02 Absence.**
- **What an absence is:** an absence begins at a session's end and ends at the next genuine session start. It has a stable identity: the session index it follows.
- **The snapshot at absence start:** the efficiency `n` and the assignment snapshot are fixed when the absence begins. A Monument purchase can never be made offline, and it never changes a committed absence.
- **Storage batches:**
  - an absence may be settled in several storage batches, at any wall points;
  - each batch settles to `P(w_k)`, computed from the cumulative wall offset, so batches never restart the 24-hour window and the result is partition-invariant.
- **The settlement cursor** records the wall offset consumed. At the reconnect it moves past the full elapsed absence, so time beyond the cap can never become creditable later.
- **A genuine new session** starts a new absence with a fresh window (D-08 N-10, to be confirmed). The frequent-login advantage this gives (every absence stays in its first window) is reported in S5-E07.

**S5-R03 Logout and reconnect of work in progress.**
- At logout, online work in progress continues into the absence in game time; it is neither abandoned nor reset.
- At reconnect, offline work in progress continues online.
- There is no advantage from reconnecting: timers and remainders carry on.
- The efficiency-window reset is the only reconnect effect, and it is declared.

## 4. Offline assignments (checkpoint 4; owner §10, §11)
**S5-R04 Assignments:**
- **Unlock:** offline progression unlocks after the first recruit (R07.01).
- **One assignment:** each character has exactly one productive offline assignment.
- **The hero:**
  - combat in a visited zone (auto-farm with the deployed squad), gathering at a discovered node with the tool, or idle;
  - the default is the last eligible assignment at logout.
- **Deployed recruits:**
  - they farm with the hero when the hero's assignment is combat;
  - otherwise they take their last eligible independent assignment, or go idle (R-A7).
- **Independent assignments** stay as configured: a worker in a visited zone, gathering, or smithing.
- **Reserve characters produce nothing.**
- **Changes:** an online command `SetOfflineAssignment` sets the assignments. A change settles or cancels pending work under the existing transition rules.
- **The preview** reports the effective assignment of every character, with the reason for each fallback.

**S5-R05 What offline combat may grant:**
- **Granted:** combat EXP, class mastery, gold, ordinary materials, rare drops and emblems, Bestiary progress, ordinary kill counts (an ordinary kill gate may open access) and permanent milestones.
- **Not granted:** hero visitation, checkpoint discovery, boss or major gates, class advancement, any purchase (recruit, Monument, class), or new crafting decisions.
- **Automation:** offline combat is the engine's automation only:
  - no policy decisions and no manual hero abilities;
  - recruits' automatic abilities apply;
  - the repeated-death auto-farm stop applies offline and is reported.

## 5. Settlement, receipts and failure boundaries (checkpoint 7; owner §14)
**S5-R06 Settlement identity:** `absence:<session index>` plus a target wall offset. Each settlement is a request on the account's `settlement` stream, under the L2.1 window.

**A committed settlement receipt records:**
- the account and checkpoint version;
- the absence identity;
- the wall start and end, and the credited duration;
- the efficiency windows;
- the assignment snapshot;
- the content and formula versions;
- the resulting progression;
- the resources and rewards;
- the RNG state digest;
- the cursor.

**Refusals:**
- overlapping, backwards and future (beyond trusted now) settlements are refused;
- a retry replays the receipt;
- a changed payload is a conflict;
- a stale checkpoint (behind the account's cursor) is refused.

**Atomicity:** the settlement is computed on a copy and committed in one state replacement. The failure boundaries are modelled:
- a failure before the commit leaves nothing consumed;
- a failure after the commit, followed by a retry, replays.

**No Roblox persistence** is implemented.

## 6. Reference and efficient settlement (checkpoints 5–6; owner §13)
- **The reference stepper:** the full engine, with per-event logging, run through the absence in game time.
- **The efficient settlement:** the same engine in settlement mode (no per-event log, no observers), plus exact fast-forward of uninterrupted gathering.
- **Sampling:** both draw the same RNG streams in the same order, so authoritative settlement is exact sample-path deterministic for its identity, and partition-invariant. No sampled or expected-value reward batching is used, so no statistical-parity claim is needed.

## 7. Monument of Eternity (checkpoint 8; owner §12)
- **What it is:** an S4 Monument added to the permanent content in a new candidate pack.
- **Discovery:** discovered by a guaranteed path (candidate: the first recruit).
- **Effect:** it raises the normal-window efficiency by its levels' bp, up to 10,000 (100%). The second window stays `k` × normal.
- **Purchases:** online only.
- **Breakdown:** the stat and efficiency breakdown lists its contribution.
- **Historical controls:** the S4 Monuments and S4 controls are unchanged, because the new pack is used only by S5.

## 8. Welcome-back summary (checkpoint 8; owner §18)
- **What it is:** structured data built from the committed settlement receipt, never recomputed from the current account.
- **Contents:**
  - the elapsed and credited time;
  - the windows;
  - the resources;
  - combat and profession EXP;
  - the levels gained;
  - mastery;
  - Bestiary and Feat unlocks;
  - production completed and reservations remaining;
  - shortages and stopped assignments;
  - survival issues;
  - gates unlocked;
  - the active-only requirements still remaining.

## 9. Experiments (checkpoint 9; owner §15–§16)
- **S5-E01 to E08:** as in the M0 experiment plan, extended by the owner's §15.
- **Registration:** budgets and sample sizes are registered before the runs.
- **The balance report:** it separates the offline share of EXP, materials and gold; active decisions; conquest; account power; and the value of spending. The 30–60% band is a candidate, not a gate.

## 10. Proposed rule resolutions
S5-R01 … S5-R06 above, to be extended as the work proceeds.
