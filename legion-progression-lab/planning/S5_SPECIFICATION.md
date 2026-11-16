# S5 specification: offline progression on bounded engine state

**Version 0.2, 2026-11-15. Status: candidate, complete for review.**

**History:**
- v0.1 was the working draft registered with the experiments (SHA-256 `fb98bd98…a9846`, kept in
  `evidence/s5/registration/S5_SPECIFICATION_v0.1_at_registration.md`).
- v0.2 states the design as implemented. It adds the rules found during implementation: S5-R07 to S5-R14.

**Source:** the owner's "L2.1 Acceptance and S5 Authorisation" §6–§20.

**Built on:**
- the design register R07.01–R07.20 and R09.03–R09.04;
- the M0 resolutions D-06 (reserve), D-08 (offline windows) and R-A7 (non-combat hero);
- the M0 experiment plan §S5;
- the accepted L2.1 contract v3.0.

**Status of the rules:** S5-R01 … S5-R14 are proposed rule resolutions for the owner. Every number is a candidate.

## 0. Internal checkpoints (owner §20)

| # | Checkpoint | Status | Where |
|---|---|---|---|
| 1 | L2.1 acceptance corrections | done | `evidence/l2-acceptance/` |
| 2 | Local L2 Git checkpoint | done (`43a1a16`, tag `l2-checkpoint`) | `evidence/l2-checkpoint/` |
| 3 | Actual engine L2 integration and bounded-state verification | done | §1–§2; `evidence/s5/integration/` |
| 4 | Offline assignment and efficiency semantics | done | §3–§4; `src/engine/offline.ts` |
| 5 | Reference offline progression | done | §6; stepper `reference` |
| 6 | Efficient chronological settlement | done | §6; stepper `efficient` |
| 7 | Replay, reconstruction and failure-boundary verification | done | §5; `src/s5/settlement.ts` |
| 8 | Monument of Eternity and welcome-back summary | done | §7–§8 |
| 9 | Registered S5 experiments | run | `manifests/s5/`, `results/s5/` |

## 1. Bounded engine state (S5-R10; owner §6)

**The engine option.** The option `identity` is `'l1' | 'l2'`. The default is `'l1'`, so every historical control runs
unchanged. `'l2'` needs a bounded ledger, `'bounded'` or `'bounded-reference'` (see §6).

**Kill credits.** The committed chain is replaced by an exact settled range set per stream:
- the stream `squad` takes its numbers from `enc:N`;
- the stream `worker:<id>` takes its numbers from `w:<id>:<seq>`.

**How kill credits work:**
- **Allocation:** the engine allocates the numbers monotonically.
- **Explicit abandonment:** an encounter that ends without its kill (session end, death, boss timer, a stopped or
  reassigned worker) is abandoned explicitly: its number is settled with no reward.
- **Nothing is deleted:** old entries are never removed.
- **Declared difference:** a claim for a settled number is `CREDIT_SETTLED`.

**The ledger:** balances, a window of the 256 most recent transactions, and a count.
- **Exactly-once for older transactions** belongs to the identity that produced them:
  - credits by their ranges;
  - work by its producers;
  - reservations by their jobs;
  - purchases by their counters.
- **Declared difference:** a transaction identity evicted from the window would not be recognised by the ledger itself.

**Items and jobs:**
- **Counters:** items and jobs take explicit counters (`nextItem`, `nextJob`), never a list length.
- **Retirement:** spent items leave the list, and so do completed or cancelled jobs once nothing refers to them.
- **No reuse:** retired numbers are never reused, and cancelling a retired job gives `JOB_FINISHED`.

**Diagnostic history is never part of a checkpoint.** It is kept outside:
- the event log (a fixed-size digest chain, its count, and an optional kept prefix outside the checkpoint);
- the run counters (keys bounded by the code set).

**Already bounded, and kept:**
- the death and knockout windows;
- the permanent entitlements (bounded by the content);
- the zone counters.

## 2. Reconstruction corrections (S5-R11; owner §7)

### A. Required live events
For every live engine state, its continuation event must be queued and current:
- the session start and end;
- an encounter's enemy attack, the hero's swing (current epoch), and a boss timer;
- the respawn of a dead hero, while the game is active;
- walking, travelling and resting continuations;
- a knocked-out recruit's recovery, while the game is active;
- worker fight events;
- work completions and pending settlements;
- pending kill credits.

"Active" means a connected session or an unlocked absence. Stale events stay legitimate and are never required.

### B. Pre-session state
The pre-session state (`session.index = −1`) is a valid checkpoint before the first session opens.

### C. Offline state
The offline state is validated in full:
- the anchor, the configured and remembered assignments, the absence and its captured rates;
- the snapshot and the connected assignments;
- the progress baseline;
- consistency with the session and the schedule (game time never beyond the credited duration the schedule allows).

The tests use resumed execution, not only round trips.

### D. Limitations kept explicit
- **The digest does not authenticate:** a checkpoint is trusted input; its digest detects corruption only.
- **A restored run's event-log digest is a declared chain** from the saved one.

## 3. Offline time model (S5-R01, S5-R02, S5-R12, S5-R13; owner §9, §13)

### S5-R01 Game time: one clock, slowed during an absence
The engine runs on game time:
- **Connected:** game time advances with wall time.
- **During an unlocked absence:** game time advances by the credited productive duration
  `P(w) = floor((n·10⁴·min(w, 24 h) + r·clamp(w − 24 h, 0, 48 h)) / 10⁸)`, computed exactly in big integers
  (`spec/formulas/s5-offline.md` v1).
  - `w` is the wall time since the absence began.
  - `n` is the normal-window rate in bp (candidate 6,000).
  - `r` is the reduced-window rate in 10⁻⁸ units: `n × k` with ratio `k` (default 5,000), or `f × 10⁴` for the flat
    rule (registered alternative `f` = 2,500).
  - Beyond 72 h the credit is zero.

**Consequences:**
- **Every system progresses at the offline rate:** combat, gathering, smithing, respawns, recovery, regeneration and
  permanent checks.
- **The rate is applied exactly once:** rewards are never multiplied, and every remainder stays exact.
- **Level-ups and bonus changes** take effect at their game-time moment, under the existing work-start capture rule.

**The mechanism is pinned by two equivalences**, both tested (`test/s5.offline.test.ts`, S5-E03):
- a 10-hour absence at 60 % gives exactly the same state as a 6-hour absence at 100 %;
- offline play equals connected automated play for the credited duration from the same state.

### S5-R02 Absences, windows and the cursor
**Identity and capture:**
- **When an absence begins:** at a session's end. It ends at the next genuine session start.
- **Its identity:** `absence:<index of the session it follows>`.
- **What it captures at its start:** `n`, `r`, the window lengths, the assignment snapshot and a progress baseline.

**What changes nothing:**
- **No purchase changes a committed absence:** a later purchase never changes it (no retroactive increase).
- **Storage batches never restart a window:** an absence may be settled in storage batches, and every batch advances
  game time to `P(cumulative wall offset)`, so the result is partition-exact.

**The cursor:**
- **What it records:** the wall moment settled to.
- **At the reconnect:** it moves past the whole absence (beyond the cap too), so expired time can never become
  creditable.

**The schedule** may grow only during the absence after its last session. A checkpoint restored with an added session
places that session at its credited game time; a session that would start before the checkpoint is refused as
backwards time.

### S5-R12 Frequent logins (declared design effect, D-08 N-10)
**What a reconnect does:** a genuine reconnect starts a new absence, with a fresh first window.
**What this gives frequent logins:** each of their absences stays in its 60 % window, so two 40-hour absences credit
38.4 h, while one 80-hour absence credits 28.8 h. S5-E07 reports the size of this effect.
**What cannot fake an absence:** retries and storage batches can never create one (§5).

### S5-R13 Boundaries
- **`run(t)`** processes every event before `t`.
- **`runThrough(t)`** also processes the events at `t`, without advancing beyond `t`.
- **At a session boundary** the engine runs through it: the logout or reconnect is processed at its exact moment,
  and no game time is credited beyond it.
- **The absence is the game interval [start, reconnect).** A zero or one-millisecond absence credits exactly
  `P(w)` (0 ms at 60 %).
- **`runToWall(W)`** advances through the schedule's sessions and absences in order. Each absence's rate is only
  known when it begins.

## 4. Offline assignments and restrictions (S5-R03, S5-R04, S5-R05; owner §10, §11)

### S5-R04 Assignments
**One assignment each:**
- Each character has exactly one productive offline assignment.
- `SetOfflineAssignment` (online only) configures or clears it, and is validated when configured and again at logout.

**The hero:** combat in a visited and accessible zone (auto-farm with the deployed squad), gathering at a discovered
node with the tool, or idle.
- **Default:** its current offline-capable activity, else its last eligible one, else idle.

**Recruits:**
- **Reserve:** reserve recruits produce nothing (D-06), whatever is configured.
- **Deployed:** they farm with the hero when the hero's assignment is combat. Otherwise they take their last eligible
  independent job, or go idle (R-A7).
- **Independent** (worker, gathering, smithing): they keep their job if it is still eligible.
- **Combat workers** need hero visitation (D-01).
- **Smithing** follows recipe and profession requirements.

**The preview** (`offlinePreview()`) gives every character's effective assignment and the reason for it. Logout
applies exactly the preview, so the preview is exact (test: the snapshot equals the preview).

### S5-R03 Logout and reconnect transitions
**Logout:**
- **Work that continues:** work in progress of every character whose assignment does not change continues into the
  absence in game time; it is neither abandoned nor reset.
- **The hero:**
  - an ordinary encounter continues if its assignment is combat in its zone;
  - travel is cancelled (no visitation offline);
  - a boss encounter is released (no boss completion offline);
  - a configured zone or node elsewhere is reached by an offline relocation, which grants no visitation and no
    discovery;
  - a hero dead at logout starts its assignment at its respawn.

**Reconnect:** every recruit whose assignment changed at logout returns to its connected one.

**The transition contract** is the existing `Assign` contract (S2/S3):
- a worker fight is abandoned;
- gathering or smithing work in progress is abandoned (no yield; the reservation is released).
- **No advantage:** changing assignment can only lose a unit of progress, never gain one.

**Timers are not reset by a reconnect:** after an unlocked absence there is no instant respawn or recovery at the
session start; the timers ran offline and keep running.

### S5-R05 What offline play may grant
**Granted:**
- combat EXP and class mastery;
- gold, ordinary materials, and rare drops and emblems;
- Bestiary progress;
- ordinary kill counts (an ordinary kill gate may open access);
- permanent milestones.

**Not granted:**
- hero visitation and checkpoint discovery;
- boss or major gate completion;
- class advancement;
- any purchase (recruit, Monument, class change);
- crafting decisions that were not queued online.

**What enforces this:**
- **No commands offline:** every command is refused `NOT_IN_SESSION`, including `UpgradeMonument` in offline mode
  (see S5-R14).
- **No decisions offline:** no policy decision is even scheduled.

**Automation only:**
- no manual hero abilities;
- recruits' automatic abilities apply;
- the repeated-death auto-farm stop and the repeated-knockout worker stop apply offline, and are reported.

**The first recruit:** offline progression unlocks with the first recruit (R07.01), which completing Q1 grants.
- **Before it, an absence is locked:** it credits nothing, and the historical session start applies.
- **So no quest progress can happen offline.**

## 5. Settlement, receipts and failure boundaries (S5-R06; owner §14)

**What the service is:** a lab model of the account service around the actual engine (`src/s5/settlement.ts`).
- It is **not** Roblox persistence.
- It is **not** crash-safe storage.
- It specifies the atomic transition and models its failure boundaries.

**The account record** holds:
- the engine checkpoint, which carries the wall schedule known so far;
- the wall cursor;
- the L2.1 request window of its `settlement` stream;
- the 32 most recent detailed receipts;
- a branch and a version.

**The requests:**
- `play` (connected time);
- `settle` (a storage batch of the current absence);
- `reconnect` (closes the absence, opens the session; its receipt carries the welcome-back summary).

**Each request is processed in this order:**
1. **Branch:** `WRONG_BRANCH`.
2. **Trusted clock:** `CLOCK_BACKWARDS`.
3. **The L2.1 window:** a retry replays the stored receipt; a changed payload under the same number is
   `CONFLICTING_PAYLOAD`; `REQUEST_CLOSED` and `REQUEST_AHEAD` as in L2.1.
4. **The timing rules** (`spec/formulas/s5-offline.md` §4): `NOT_CONNECTED`, `NO_ABSENCE`, `ABSENCE_CLOSED`,
   `ABSENCE_UNKNOWN`, `OVERLAP` (a partial overlap is the same case), `GAP`, `BACKWARDS_TIME`, `FUTURE_TIME`,
   `BEYOND_SESSION`, `EMPTY_SESSION`.
5. **Decision:** the request is decided on a restored copy, and committed by one compare-and-swap replacement of the
   record (version + 1).

**How outcomes are recorded:**
- **A refused, well-formed request** is committed with its code, so a retry gets the same answer.
- **A stale load** is `STALE_CHECKPOINT` at the commit.
- **A failed calculation** commits nothing.
- **A failure before the commit** leaves the record unchanged.
- **A failure after the commit**, followed by a retry, replays the receipt; nothing is credited twice.

**A detailed receipt records:**
- the account version and checkpoint digest;
- the absence identity;
- the wall and game intervals;
- the captured rates and windows;
- the assignment snapshot;
- the content, formula and checkpoint versions;
- the committed summary (progression, resources and rewards);
- the RNG digest;
- the cursor;
- the request identity and payload hash.

**Compaction:** an old detailed receipt may be compacted away. A re-claim stays refused: the cursor and the request
window still refuse it.

## 6. Reference and efficient settlement (S5-R07; owner §13)

**The reference stepper:** `stepper: 'reference'`, `ledger: 'bounded-reference'`, `hashLog: true`.
- per-event log hashing;
- uncached character stats;
- the copy-on-commit bounded ledger (`src/core/ledger/boundedReferenceLedger.ts`).

It is used for short controlled intervals.

**The efficient settlement:** the default.
- no per-event hashing;
- exact caches: character stats by input identity, a frozen EXP table validated once;
- the chunked bounded ledger, which appends in place and copies only on a branch.

**Both share every gameplay rule and every random draw, in the same order,** so the authoritative settlement is exact
sample-path deterministic for its identity, and partition-exact.
- **No batching:** no sampled or expected-value reward batching is used.
- **No statistical claim:** no statistical parity is claimed or needed, and no fractional expected reward is ever
  granted.
- **Interchangeable checkpoints:** the two steppers' checkpoints have one stored form, so a reference checkpoint
  restores into the efficient engine (S5-E02 reconstruction).
- **A/B check of the speed-ups:** the caches were checked against a copy of the code without them, giving identical
  state, log digest and event counts (`evidence/s5/performance/`).

## 7. Monument of Eternity (S5-R08; owner §12)

**Where it lives:** the S5 candidate pack `content/w1-slice-s5.candidate.v0.5.0.json`. That pack is the corrected S4
pack v0.4.1 plus this Monument. The S4 packs, loaders and controls are unchanged.

**Its candidate numbers:**
- target `offline`;
- discovery quest Q1 (a guaranteed path);
- 25 levels, base 500 gold, growth 20 %;
- +250 bp per level for levels 1–10, then +100 bp per level for levels 11–25;
- so the normal rate is 60 % at level 0, 80 % at level 8, 85 % at level 10 and 100 % at level 25.

**How it applies:**
- **The cap:** the normal rate is at most 10,000 bp.
- **The reduced window stays proportional** under the ratio rule.
- **One layer only:** it is no stat source and joins no stat pool; it acts on the clock alone.
- **Online purchases only.**
- **No retroactive increase:** an absence keeps the rate it captured.

**The breakdown** (`offlineBreakdown()`) lists:
- the base rate;
- each source with its level and bp;
- the uncapped and capped normal rate;
- the second-window rule and rate;
- the window lengths.

**S4 decision-makers never buy it.** The S5 candidate policy POL5-BAL values an Eternity bp at half an attack bp.

## 8. Welcome-back summary (S5-R09; owner §18)

**What it is:** structured data (`src/s5/summary.ts`), built at commit time from the engine against the absence's
baseline and stored in the receipt, so it reports committed rewards and never recomputes them from a later account.

**Its contents:**
- elapsed and credited time;
- the windows and the cap;
- resources;
- combat and profession EXP;
- levels gained;
- mastery;
- Bestiary and Feat unlocks;
- kills;
- production completed and reservations remaining;
- shortages and paused jobs;
- stopped assignments;
- survival issues;
- ordinary gates unlocked;
- the active-only steps still remaining (unvisited accessible zones, the boss challenge, an affordable recruit).

## 9. Experiments (owner §15–§16)

**Registration:** `manifests/s5/PREREGISTRATION.md`, registered 2026-11-15T20:13:30Z.

**S5-E01 … E08** are as registered, with gates G-S5-01 … 06.

**The balance hypotheses** (H-S5-03 and H-S5-04) are candidates, reported and never forced.

**The slice content's horizon:**
- the EXP table ends at level 201, between D3 and D7 of every profile;
- so D7 is attempted and recorded as stopped, never extrapolated.

## 10. Proposed rule resolutions

| ID | Resolution |
|---|---|
| S5-R01 | One game clock, slowed during an absence by P(w): the rate is applied once, rewards are never multiplied. |
| S5-R02 | Absence identity = the session it follows. Rates and assignments are captured at its start. Batches use the cumulative offset. The cursor passes the whole absence. |
| S5-R03 | Unchanged assignments continue across logout and reconnect. Changed ones follow the `Assign` contract. Timers are never reset by a reconnect. |
| S5-R04 | Offline assignments and defaults as in §4, applied exactly as previewed. |
| S5-R05 | What offline play may and may not grant, as in §4. Offline unlocks at the first recruit (Q1). |
| S5-R06 | The settlement service's order of checks, codes, atomic compare-and-swap commit, and failure boundaries (§5). |
| S5-R07 | The reference and efficient steppers share the sample path: exact equality, no sampled batching. |
| S5-R08 | The Monument of Eternity's numbers and rules (§7), in a new candidate pack. |
| S5-R09 | The welcome-back summary is committed in the reconnect receipt (§8). |
| S5-R10 | The bounded engine identity (§1). |
| S5-R11 | The reconstruction rules (§2). |
| S5-R12 | A genuine reconnect starts a fresh window (the frequent-login effect is declared and measured). |
| S5-R13 | Boundary semantics: `runThrough` at session boundaries; the absence is [start, reconnect). |
| S5-R14 | **Finding:** S4 accepts a Monument purchase submitted between sessions. No S4 control does so, and the S4 path is unchanged; offline mode refuses it. The owner decides whether S4 should refuse it too. |
