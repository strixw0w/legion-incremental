# M0 Decision Matrix — Legion Incremental

**Milestone:** M0 (audit, reconcile, plan) · **Prepared:** 13 November 2026 · **Status of this document:** PROPOSED, awaiting owner review
**Inputs:** `docs/DECISION_REGISTER.md` (sha256 `94fab1ee…5802eb`, 183 decisions) and `docs/LEGION_GAME_DESIGN_BIBLE.md` (sha256 `f8651cb1…514a7b`, see audit for full hashes).

> **In plain words.** Every one of the 183 choices you made is listed below exactly once, under the stage of work where it first has to be built or tested. For each one I say whether its meaning is already clear, whether I am proposing a reading of it that you should confirm, or whether it needs a decision from you. Section 2 is the short list of decisions I need from you before building starts. Nothing here changes any of your choices; every recommendation is marked **UNAPPROVED** until you say yes.

---

## 1. How to read this matrix

**Type** (what kind of approved decision it is):

| Code | Meaning |
|---|---|
| **L** | Locked rule: a behaviour the game must have. |
| **T** | Target: an approved goal or timing that still has to be measured and balanced. Numbers in it are not final coefficients. |
| **N** | Narrowed: still approved as a long-term direction, but a later decision sets the World 1 launch scope. |
| **D** | Deferred: approved for later (post-launch or World 2+). Nothing is built for it at launch except where a "disabled hook" is listed. |

**Interpretation status** (whether this matrix can be used as-is):

| Code | Meaning |
|---|---|
| ✔ | Clear. No interpretation needed beyond the register text. |
| **P** | Proposed reading. I wrote down a specific meaning so it can be built and tested; the owner should confirm or correct it. |
| **O** | Open. Needs an owner decision (linked to a Bible O-item or a new N-item) before the milestone that owns it. |
| **⚠** | Conflict or tension with another decision, prior work or the Bible. Shown in §3; not resolved silently. |

**Domains:** SIM = progression lab · RBX = Roblox implementation · ART = content/art · ANA = analytics · LCH = launch, policy and operations · FUT = future scope · PROC = process.

**Owning milestone** = the earliest milestone that must lock the decision's semantics or deliver it. Later milestones that also touch it are named in the notes. M1 is split into its sub-increments S0–S7 (Bible §17). A primary row's ID is written in **bold**; plain IDs elsewhere are cross-references only.

---

## 2. High-priority owner decisions (blocking)

These are the decisions that change the data model or the first code. Each recommendation is **UNAPPROVED**. Full option analysis is in §4.

| # | Decision needed | Recommendation (UNAPPROVED) | Blocks |
|---|---|---|---|
| **D-01** | Zone access vs visit vs assignment (O07, N-04, N-11) | Three separate account flags: `accessUnlocked`, `visited`, `checkpointDiscovered`. Kill gates can be satisfied by any eligible kill, including workers and offline, but that only grants access. The hero must enter the zone in person before it counts as visited, which is required before workers can be assigned there or you can teleport there. Minibosses, bosses and quest gates are active-only. | S1 |
| **D-02** | Numeric precision and rounding (O12, R08.18) | Whole-number balances stored exactly up to 9,007,199,254,740,991 (2^53−1). Fractions are kept in a saved "carry" so nothing is lost or gained by rejoining. Damage per landed hit is a whole number (round half up, minimum 1). Time is in whole milliseconds. Percent bonuses are stored as whole basis points. Hitting the limit is a visible error, never a silent cap. | S0 |
| **D-03** | Hero death and auto-farm recovery (part of O05) | Death respawns the hero at the zone checkpoint after a short delay with no loss. Auto-farm resumes, but stops with a reason after repeated deaths within a short window. | S1 (hero) / S2 (recruits) |
| **D-04** | Squad reward ownership vs full individual EXP (O03, C-05) | One account credit per kill (gold, loot, Bestiary, gate count). Every eligible deployed member gets the monster's full EXP. Eligible means deployed in that encounter, not knocked out, and within range when the kill happens. | S2 |
| **D-05** | Class mastery, class change, talents, respec (O04) | Mastery EXP builds only for the class in use. The class bonus comes from the best mastery ever reached in that class by any character. Talent points depend on level, with a separate saved build per class. Class change preserves level and costs earned gold. | S2 |
| **D-06** | Six recruit slots vs three rare heroes (O01, N-13) | Rare heroes use the same six productive slots. Extra characters wait in an unlimited, non-productive reserve with progress kept. Swapping is free outside encounters. Nothing is ever deleted. | S2 schema, M3 |
| **D-07** | Event ordering; queue reservation and priority (O10) | Fixed same-moment order: work completes, then rewards are credited, then level-ups and unlocks, then stats are recalculated, then new work starts. Queues reserve inputs one unit at a time, take turns first-in-first-out, and pause on shortage. | S1 (ordering), S3 (queues) |
| **D-08** | Offline second window and W1 upgrade source (O02, N-01, N-10) | Test two options: a flat 25% (candidate), or half of the normal-window rate (30% at the start). Recommended default: half of the normal-window rate. Add one World 1 source of offline-efficiency upgrades, such as a candidate Monument. Each return starts a fresh 24 h + 48 h window. | S5 |
| **D-09** | Repository housekeeping (audit B-01, B-03, B-04) | The owner decides how the post-freeze "Original v1" files are preserved. Pick one canonical Legion repository. First commit = design pack + M0 documents. | First Git checkpoint |
| **D-10** | Lab tooling (architecture §3) | TypeScript on a Node LTS line (versions pinned), vitest, zod. Python's standard library is used only for independent fixture checks. Lune later checks that the Luau code agrees. | S0 |

**Deferred, not blocking S0/S1** (decide by the milestone shown in §7): O06, O08, O09, O11, O13–O22, N-02, N-06, N-07, N-08, N-09, N-12, N-14, N-15.

---

## 3. Conflicts and missing semantics

### 3.1 Conflicts and tensions (shown, not resolved silently)

| ID | Between | Issue | Proposed handling (UNAPPROVED) |
|---|---|---|---|
| **C-01** | R09.17 vs R04.18, R10.06, Bible §1/§3 non-goals | R09.17 says random enchanting is "gameplay-earned at launch", but enchanting itself is a later-world feature and a launch non-goal. | Read R09.17 as a monetisation rule: whenever enchanting exists it is never sold. No enchanting at launch. |
| **C-02** | R07.03 ("permanent upgrades available"), R07.05 vs W1 scope | Offline efficiency upgrades come from Monuments/Research/Mastery, but Research and Mastery are W2. None of the six candidate Monuments (Power, Vitality, Protection, Precision, Industry, Fortune) raises offline efficiency. As drafted, W1 has no upgrade path. | N-01: add one W1 source, for example a 7th candidate Monument or Feat milestones. Owner chooses. |
| **C-03** | R07.02 (online assignments 100%) vs Bible §9 "reward returning, not leaving computers running" | Connected-but-idle earns 100% while offline earns 60%. That rewards leaving the game running. Roblox's idle disconnect limits it but does not remove it. | N-02: accept for launch and measure it in analytics. Revisit if idle sessions dominate. |
| **C-04** | R07.06 vs R07.07 | The hero defaults to its last eligible activity, and the squad defaults to "farming with the hero". If the hero's last activity was mining, the squad's assignment is ambiguous (the Bible flags this). | N-03: if the hero's offline activity is not combat, deployed members fall back to their last individual assignment, otherwise idle. The preview is shown before logout. |
| **C-05** | R02.12 vs R03.12 | "Personal contribution-based rewards" vs "full EXP for each deployed recruit". | The Bible §4 reconciliation: contribution decides account credit, eligibility decides member EXP. Formalised in D-04. |
| **C-06** | R06.05, R06.07, R07.13 | Can a kill-count gate be completed offline? Only "major gates" are explicitly active-only. | N-04: kill gates may complete from eligible worker/offline kills but only grant access. Minibosses, bosses and quest gates are active-only. Visiting is always active. |
| **C-07** | R08.09 vs Bible §10 ("crit chance constrained to [0,1]") | "Approaches 100%" could mean it never reaches 100%. | N-05: may reach exactly 1.0. Any excess has no effect and is shown as overcap. No super-crit at launch. |
| **C-08** | Uncommitted frozen-lab "Original v1" vs R01.07, R10.04, R07.03, R07.04, R08.05, R06.03 | The Original v1 design is single-character, away 40% capped at 10 h, 12 zones, and EXP per kill grows faster than monster HP. | Not a register conflict. Original v1 coefficients must not seed Legion content. See audit §6. |
| **C-09** | R02.04 vs R10.05 | Six deployed vs three in W1. | Reconciled in the register: W1 cap 3, six later. |
| **C-10** | R03.05 vs R10.04 | "Around 4–6" vs fixed 6. | Reconciled: 6. |
| **C-11** | R06.18 vs R10.09 | Three difficulties vs two at launch. | Reconciled: Normal/Elite at launch. |
| **C-12** | R01.08 vs R10.04 | 20–50 roster vs 6 in W1. | Reconciled: eventual target. Roster capacity is a content parameter. |
| **C-13** | R10.03 vs R06.14 | Slice miniboss vs two major minibosses. | Reconciled in the register (no extra launch boss). Placement is O08. |
| **C-14** | R03.07, R03.08 vs R10.06 | Branch classes vs none at launch. | Reconciled: deferred. |
| **C-15** | R03.13 vs Bible §5 table | Archer's proposed affinity is "Hunting (future)", which does not exist in W1. | O06: choose an Archer launch affinity or none before S3. |

### 3.2 Missing semantics (new N-items, beyond Bible O01–O22)

| ID | Missing definition | Recommendation (UNAPPROVED) | Resolve by |
|---|---|---|---|
| **N-01** | W1 source of offline-efficiency upgrades (C-02) | One candidate Monument ("offline efficiency", gold + material milestones) with a ceiling of 100% in the normal window. | S5 |
| **N-02** | Online-idle incentive (C-03) | Accept; record idle-connected time separately in analytics. | M6/M10 |
| **N-03** | Hero/squad default offline assignment (C-04) | See C-04. | S5 |
| **N-04** | Kill gate vs major gate completion (C-06) | See C-06 / D-01. | S1 |
| **N-05** | Crit overcap (C-07) | See C-07. | S0 |
| **N-06** | Are launch equipment traits random or recipe-fixed (R04.13)? | Recipe-fixed or none in the slice. Random traits later, and never sold (R09.17). | S3 |
| **N-07** | Can several of the player's own workers use the same node or zone, and do workers share the hero's physical monster population? | Yes to sharing a node (R04.07 unlimited personal access). Workers are numerical streams with their own target availability, separate from the hero's physical monsters. | S2/S3 |
| **N-08** | Do class mastery and profession EXP accrue offline? | Yes, under exactly the same eligibility as online (R07.11), at offline efficiency. | S5 |
| **N-09** | What counts as "active time" for R06.09 (4–8 active hours)? | Sim: scheduled session time. Live: connected time with recent input. Idle-connected is reported separately. | S6 |
| **N-10** | When do offline windows reset? | Each completed settlement closes the interval; the next absence starts a fresh 24 h normal window. No minimum session length. Each interval is capped at 72 h. | S5 |
| **N-11** | Pacing targets: unlock time or first visit? | Measure first visit (the prior lab's Increment 6 found "unlocked" ran days ahead of "first fought"). | S1 |
| **N-12** | Recruit details: purchase currency, slot unlock triggers, first class choice cost and timing, usefulness while classless | Candidate gold cost per recruit. First class choice free at any time. Classless recruits can fight and gather on base stats. | S2 |
| **N-13** | What happens to equipment held by a reserve unit (D-06)? | It stays equipped but remains freely transferable. Reserve units never block another unit from equipping an item. | S2/S3 |
| **N-14** | Which content version settles an offline interval after a patch? | The current version at settlement, with an ID migration map. The receipt records the version used. | M6 |
| **N-15** | Does the hero count toward class records (R03.17/R05.16)? | Yes; the hero is a character. | S2 |

---

## 4. High-impact decision reviews

Each review lists options, consequences in plain outcomes, and one recommendation marked **UNAPPROVED**.

### 4.1 Six productive slots vs three named rare heroes (O01 · R10.04, R10.07, R03.14–R03.16, R09.14)

| Option | What it means | Consequences |
|---|---|---|
| **A. Shared six slots + reserve** | Six productive recruit slots in total. A rare hero takes a free slot or waits in a reserve, and can be swapped with an ordinary recruit, whose progress is kept. | Economy targets stay as designed (hero + 6 producing). Players make a real roster choice. Needs a reserve/collection screen and swap rules. Nobody is deleted. |
| B. Six ordinary + three extra productive heroes | Up to 9 productive recruits plus the hero. | Raises total production by up to 50% for collectors. Every economy target must be re-balanced. Arguably conflicts with R10.04 "six recruits". |
| C. Rare hero replaces a recruit permanently | Acquiring a hero converts or dismisses an ordinary recruit. | Violates "must not force ordinary units to be deleted" (Bible §3) and the persistent-investment pillar. |
| D. Rare heroes are collection-only | Heroes give passive bonuses but never deploy. | Wastes "distinctive abilities" (R10.07) and the "sidegrade use case" (R03.15). |

**Recommendation (UNAPPROVED): A.**
- **Reserve:** unlimited and non-productive. No EXP, no jobs, no offline credit.
- **Swaps:** free, but blocked during an active encounter or boss.
- **New rare hero:** it fills an empty unlocked slot if one exists, otherwise it goes to the reserve with a notification.
- **Class records:** reserve characters' historical records still count.
- **Gear:** per N-13.
- **To test (S2/S6):** production with 6 productive slots is identical whether or not rare heroes are owned, and the reserve never produces anything.

### 4.2 Group encounter reward ownership vs full individual EXP (O03 · R02.12, R03.12, R07.12, R06.07)

| Option | What it means | Consequences |
|---|---|---|
| **A. Account credit once, full EXP per eligible member** | Each kill is credited once per account: gold, loot rolls, materials, Bestiary, gate counter. Each eligible deployed member gets the monster's full EXP. | Matches R03.12 and Bible §4. Total legion EXP rises with deployment (1→3) by design; loot does not. Needs a clear "eligible" rule. |
| B. Split EXP across the squad | Monster EXP divided among members. | Contradicts R03.12. |
| C. EXP only to damage dealers | Members with no damage on the kill get nothing. | Punishes support, slow or freshly recruited units. Contradicts "each deployed recruit". |
| D. Loot per member | Each member rolls loot. | Explicitly forbidden ("do not let mere presence multiply loot"). |

**Recommendation (UNAPPROVED): A.**
- **Account credit** requires the account's squad to have contributed meaningfully. For a solo account that is automatic. In parties, the threshold is O16 (M9).
- **Member eligibility** is all of: deployed in that encounter stream, not knocked out, and within the encounter radius when the kill happens.
- **Independent combat workers:** each is its own encounter stream with its own account credit per kill.
- **Two of the player's own streams** can never credit the same kill.
- **To test (S2):** loot/gold per kill is identical for 0, 1, 2 or 3 deployed members, EXP per member is unchanged by squad size, and a knocked-out member receives nothing.

### 4.3 Per-class mastery and respec (O04 · R03.09–R03.11, R03.17, R05.16)

| Option | What it means | Consequences |
|---|---|---|
| **A. Mastery per character per class, record = historical best** | Mastery EXP builds only for the class in use. The class-wide bonus uses the best mastery level ever reached in that class by any character. | Switching a high-level character to every class grants nothing (R05.16). Records never drop after switching. Duplicate same-class characters do not stack (R03.17). |
| B. Mastery = combat level in current class | The bonus follows current level and class. | The exploit R05.16 forbids. |
| C. Mastery per account per class | One shared mastery pool per class. | Simpler, but loses "genuinely training" per character. Easier to farm with an alt. |

**Recommendation (UNAPPROVED): A.**
- **Talent points** = f(combat level), the same for every class. Each class stores its own allocation of those points, so switching back restores a build. Only the active class's talents apply.
- **Respec:** free in town with a candidate cooldown of 5–15 minutes (to be tested).
- **Class change:** costs earned gold (a candidate scaling with level) and is atomic with gear compatibility checks. A class-incompatible weapon is unequipped into shared storage with consent shown.
- **Classless:** a classless character earns no mastery.
- **To test (S2):** a level-50 Warrior switching to Mage has Mage mastery 0. Respec loops never raise any record. A record survives a class change.

### 4.4 Recruit survivability (O05 · R02.06, R02.07, R07.11, Bible §4)

| Option | What it means | Consequences |
|---|---|---|
| **A. Temporary knockout** | A recruit at 0 HP leaves the encounter. It recovers after a candidate out-of-combat delay, or when the hero respawns. No loss. | HP and defence matter for recruits. Offline survival can be modelled. Gives the squad tactics meaning. |
| B. Immortal recruits | Recruits never take lethal damage. | Simplest, but defence and HP for recruits become meaningless and offline farming is effectively immortal (the Bible forbids "immortal farming"). |
| C. Shared fate | Squad wipe only when the hero dies. | Recruit HP still meaningless while the hero lives. |

**Recommendation (UNAPPROVED): A.**
- **While knocked out:** the recruit gets no EXP and does no damage.
- **Enemies:** they target units using simple aggro rules (candidate: the last attacker, then the closest).
- **Workers and offline:** survival becomes an expected-uptime fraction, from incoming damage vs sustain. An assignment whose modelled death rate exceeds a candidate threshold is flagged "unsafe" and pauses with a reason rather than farming forever.
- **S1 covers the hero only** (D-03).

### 4.5 Visit / access / assignment distinction (O07 · R06.05–R06.07, R06.19, R07.13, R09.06)

| Option | What it means | Consequences |
|---|---|---|
| **A. Three flags + active visit** | `accessUnlocked` (from gates), `visited` (hero physically entered), `checkpointDiscovered` (teleport point found). Assignment and teleport require visited/discovered. | No gate bypass by workers, offline kills or parties. Exploration stays meaningful. Small extra walk when a zone unlocks. |
| B. Access = visit | Unlocking a zone allows assignment immediately. | Offline can effectively "conquer" ahead of the player. Weakens R06.07 "hero visits". |
| C. Visit implies all checkpoints | Entering a zone discovers every checkpoint. | Less exploration. Simpler. |

**Recommendation (UNAPPROVED): A.**
- **Kill gates:** they complete from any eligible credited kill (N-04).
- **Parties:** joining a party is only possible into zones where the player already has access. Entering a zone the player has access to through a party counts as a visit.
- **Gathering nodes:** each has its own `discovered` flag, set when the hero comes within interaction range.
- **Auto-farm and offline** never set `visited`, never start a miniboss/boss, and never complete a quest gate.
- **To test (S1):** zone 2 cannot be entered, assigned or teleported to before its gate. After an offline unlock, zone 2 is accessible but not assignable until visited.

### 4.6 Numeric precision and rounding (O12 · R08.03, R08.18, Bible §10)

| Option | What it means | Consequences |
|---|---|---|
| **A. Exact integers in doubles + carries** | Balances are whole numbers inside 2^53−1, fractional earnings go to a saved carry, damage is rounded per hit, time is in whole ms. | Identical in Luau and JavaScript (both use IEEE-754 doubles). Exact for W1 scale. A clear error at the limit. A big-number type is needed only for later worlds. |
| B. Floats everywhere, rounded on display | Fractional balances. | Precision drift, inexact spend checks, and possible "fraction farming" by rejoining (forbidden by Bible §9). |
| C. Big-number library from day one | A mantissa/exponent type for all values. | Slower and more complex in Luau and DataStores. Unneeded for W1 (the prior lab's week-long runs peaked around 10^9). |

**Recommendation (UNAPPROVED): A.**
- **Percent-like values:** stored as integer basis points (`…Bp`, 2500 = +25%).
- **Probabilities:** stored as fractions (`…Prob`) and compared through a 32-bit integer threshold so both engines agree exactly (architecture §11).
- **Durations:** integer milliseconds (`…Ms`).
- **Curves:** XP thresholds and costs are precomputed as integer tables in content, so the game never recomputes `pow()` differently.
- **Display** formatting (K/M/B…) is presentation-only.
- **To test (S0):** the limits are rejected at 2^53, NaN/Infinity can never enter the state, and carry over many small awards equals one large award exactly.

### 4.7 Offline second-window rate (O02 · R07.03–R07.05, N-01, N-10)

| Option | What it means | Consequences |
|---|---|---|
| A. Flat 25% of online rate | Hours 24–72 earn 25% whatever the upgrades. | Easy to explain. Upgrades only help the first 24 h. |
| **B. Ratio-linked: 0.5 × normal-window efficiency** | Hours 24–72 earn half the normal rate (30% at the start, up to 50% at a 100% normal window). | Upgrades help both windows. Window 2 can never exceed window 1. One upgrade track. Slightly more generous at high upgrade levels. |
| C. Linear decay from normal to a floor | The rate falls over 48 h. | Smooth, but harder to explain and to batch exactly. |
| D. No reduced window (cap at 24 h) | — | Contradicts R07.04 (two windows approved). |

**Recommendation (UNAPPROVED): B** as the S5 default, with A and alternative k values (0.3 and 0.7) as comparison arms.
- **The decision** is based on: share of daily progress from offline for the casual profile, the active-vs-offline ratio (R07.19), and any incentive to stay away rather than return.
- **The rate applies once:** to credited productive work (kills, actions, job progress), never to both kills and per-kill rewards.

### 4.8 Queue contention and exact event ordering (O10 · R07.14, R07.15, R07.20, Bible §6/§9)

| Option | What it means | Consequences |
|---|---|---|
| **A. Per-unit just-in-time reservation, FIFO** | When a job starts its next unit it reserves exactly that unit's inputs. Jobs are ordered by (player priority, enqueue time, job ID). A shortage pauses the job. | No big locked stockpiles. Shortage behaviour is predictable. Cancelling returns only the in-progress unit's reservation. Long queues can starve later jobs (shown as a reason). |
| B. Reserve the whole quantity on enqueue | Inputs for every unit are locked at once. | Guarantees completion, but locks materials for hours and makes "pause on shortage" rare. Hurts the parallel economy. |
| C. Proportional sharing | Contested inputs are split across jobs. | Fair but fractional, complex to batch, and hard to explain. |

**Recommendation (UNAPPROVED): A**, plus a fixed same-moment event order (architecture §9):
1. Work completes and outputs are deposited.
2. Rewards are credited.
3. Level-ups, milestones and unlocks are applied.
4. Stats and rates are recalculated.
5. New work starts and reservations are made.
6. Policy commands are applied.

Ties break by stable entity ID, then sequence number. Production created at time *t* can be consumed by a job starting at *t*. A level-up at *t* affects work that starts at *t*, never work that completed at *t*.

---

## 5. Decision matrix by owning milestone

### M0 — Cross-cutting principles and process (5)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R01.05** | Build a powerful specialised legion and conquer worlds | L | ALL | North-star fantasy. Used as the review lens for scope changes (Bible §1). | ✔ | — |
| **R01.10** | Permanent growth, no mandatory resets | L | SIM RBX | Invariant in every increment: no level, zone or item loss and no reset mechanic. S6 checks that every profile finishes W1 without a reset. | ✔ | — |
| **R10.01** | Initial simulator → vertical slice → full W1 | L | PROC | M1 (S0–S7) precedes M2+ Roblox work. Parallel work only after interfaces are approved (Bible §16). | ✔ | — |
| **R10.02** | Preserve frozen baseline; separate Legion simulator | L | PROC SIM | The frozen commit is intact, but the working tree holds 12 post-freeze changes (audit B-01). The lab is a new isolated folder with no imports from the frozen lab. | ⚠ | B-01, D-09 |
| **R10.20** | Incremental Claude milestones, acceptance criteria, tests, Git checkpoints, independent reviews | L | PROC | Each increment: approved scope → implementation → evidence pack → owner-approved commit → independent review. Needs a canonical repo first. | P | B-03, D-09 |

### M1 · S0 — Schema and deterministic numeric primitives (13)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R02.08** | Damage, HP, defence, accuracy; accuracy introduced gradually | L | SIM RBX | Four core stats as primitives. Candidate: accuracy requirement 0 in zones 1–3 (the Bible map introduces accuracy in zone 4). | P | — |
| **R02.09** | Upgradeable crit chance and crit damage | L | SIM | `critChance` in [0,1] and `critMult` ≥ 1 are separate. Upgrade sources are wired in S4. | ✔ | C-07 |
| **R05.17** | Defined additive categories, controlled independent multipliers | L | SIM RBX | Stat = (Σ flat) × (1 + Σ additive in category) × Π (approved multiplier categories). Categories are registered in content; inactive ones equal 1. Same contract as R08.10. | P | D-02 |
| **R05.18** | Linear gains, diminishing returns, milestone multipliers | L | SIM | Three curve primitives: linear, saturating (x/(x+k) family) and stepped milestones. Coefficients are candidates. | ✔ | — |
| **R08.02** | Smooth variable-growth EXP curve | L/T | SIM | `xpRequired(L)` = EXP from L to L+1, for L ≥ 1. Candidate family a·L^p·g^(L−1), tabulated as integers in content. | P | D-02 |
| **R08.03** | No planned permanent level cap; technical limits | L | SIM RBX | No design cap. The technical limit is the first level whose threshold exceeds 2^53−1, which raises an explicit error, never a silent clamp. S6 reports headroom. | P | D-02 |
| **R08.07** | Predictable hit chance vs enemy requirements | L | SIM RBX | Candidate saturating curve `hit = 1 − (1 − hAtReq)·(R/A)^k`: monotonic, tends to 1, and R = 0 gives 100%. Shape to be chosen by experiment. | P | — |
| **R08.08** | Diminishing defence mitigation, minimum damage floor | L | SIM | Candidate factor K/(K+D). Minimum 1 damage per landed hit; the floor never turns a miss into a hit. | P | — |
| **R08.09** | Crit chance approaches 100%; separate crit damage | L | SIM | May reach exactly 1.0, any excess has no effect, and no super-crit at launch (proposed). | ⚠ | C-07, N-05 |
| **R08.10** | Explicit additive pools, limited multipliers, breakdown | L | SIM RBX | Every bonus source has `categoryId` and scope. The breakdown output comes from the same function as the stat. | ✔ | R05.17 |
| **R08.11** | Universal gold plus specialised resources | L | SIM | Resource registry: `gold` (universal, never world-specific) plus typed materials with stable IDs. | ✔ | — |
| **R08.18** | Scalable large numbers, consistent formatting and precision | L | SIM RBX | Exact integers up to 2^53−1 for W1, carries for fractions, display separate from authoritative values. A big-number type is a later extension point. | O | D-02, O12 |
| **R10.15** | Shared formula specs, versioned content, cross-engine fixtures | L | SIM RBX | `spec/` formulas, JSON content and JSON fixtures are shared as data, with no shared runtime code. | ✔ | — |

### M1 · S1 — Single hero, three-zone combat, rewards and gates (15)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R02.05** | Many small monsters spread across zones | L | SIM RBX | Sim: per-zone personal population, respawn delay and engagement overhead (all candidates). A population shared between players is a live-test item (M2/M9). | P | — |
| **R02.06** | Ordinary monsters attack back when engaged | L | SIM | An enemy damages only the unit engaging it. S1 models hero survival; S2 adds recruits. | ✔ | D-03 |
| **R02.07** | Checkpoint respawn without resource or XP loss | L | SIM RBX | Death → respawn at the zone checkpoint after a candidate delay, with zero loss. The downtime is counted. Auto-farm recovery rule per D-03. | P | D-03 |
| **R02.14** | Early kills 2–5 s, harder enemies 5–15 s (target) | T | SIM | Measured as p10/p50/p90 time-to-kill for the on-tier zone at first visit and at gate time. | ✔ | — |
| **R02.15** | Gold, EXP, monster materials, rare drops | L | SIM | Granted per credited kill. Rare drops are sampled per kill, never granted as expected values. | ✔ | — |
| **R06.05** | Current-zone kill requirements, occasional miniboss gates | L | SIM RBX | Only zone N's eligible kills count toward gate N→N+1. The counter is account-wide. Minibosses are active-only. | P | N-04 |
| **R06.06** | Account-wide zone/world access | L | SIM | `accessUnlocked` is an account flag, separate from `visited`. | P | D-01 |
| **R06.08** | First new zone in 5–10 min, later zones longer (target) | T | SIM | Measured at first visit, not unlock. | P | N-11 |
| **R06.12** | One primary species per ordinary zone plus variants/elites | L | SIM ART | S1: one species per zone. Variants and elites in S6. | ✔ | — |
| **R06.19** | Free teleport to discovered checkpoints and towns | L | SIM RBX | Teleport only to a `checkpointDiscovered` point. Candidate: 3 s load, 20 s walk between adjacent zones. | P | D-01 |
| **R08.04** | Around 5–10 starting damage (target) | T | SIM | Candidate hero base damage 6 (range 5–10). | ✔ | — |
| **R08.05** | HP grows faster than base EXP; tune independently | L | SIM | Candidate tables keep the zone-to-zone HP ratio above the EXP ratio. Opposite to the uncommitted Original v1, whose numbers are not reused. | ⚠ | C-08 |
| **R08.06** | Tune enemy HP, damage, accuracy requirement, mechanics independently | L | SIM | Each is a separate content field per enemy, with no derived curve forced. | ✔ | — |
| **R08.16** | Drop categories, controlled luck, probability caps, separate quantity bonuses | L | SIM | Drop entry = {category, `prob` (capped), quantity range}. Luck changes probability within the cap; quantity bonuses are separate. S1 has no luck sources. | P | — |
| **R10.10** | First kill < 30 s, first recruit 2–5 min, contextual onboarding (targets) | T | SIM RBX | S1 measures the first kill. The first recruit is measured in S2; onboarding is M7. | P | — |

### M1 · S2 — Recruits, squad, classes, mastery, assignments (24)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R01.02** | Main hero fights alongside the legion | L | SIM RBX | Hero + deployed recruits form one squad encounter stream. | ✔ | — |
| **R01.06** | Guaranteed ordinary recruits plus rare heroes through gameplay | L | SIM | Ordinary recruits have guaranteed paths. Rare heroes are optional and not required to clear W1. | P | D-06 |
| **R01.07** | Individual stats, levels, equipment, skills per unit | L | SIM RBX | One state record per character, with no shared levels. | ✔ | — |
| **R02.03** | Hero and legion damage roughly balanced depending on build (target) | T | SIM | Metric: hero share of squad damage. Candidate band for "balanced" builds: 30–60%. | P | — |
| **R02.04** | Start with 1 deployed, eventually up to 6 | N | SIM | Narrowed to a W1 cap of 3 (R10.05). Six exists only as a later content parameter. | ✔ | C-09 |
| **R02.11** | Legion units auto-use abilities on cooldown | L | SIM | A recruit ability is a cooldown-driven damage or support event, with candidate content. | ✔ | — |
| **R02.12** | Shared enemies, personal contribution-based rewards | L | SIM RBX | Contribution decides account credit (once per kill); eligibility decides EXP. The party threshold is O16. | O | D-04, O03, O16 |
| **R03.01** | Warrior, Archer, Mage | L | SIM RBX | Three class IDs with candidate stat profiles. | ✔ | — |
| **R03.02** | Classless hero chooses a class after early progression | L | SIM | Candidate trigger: hero level 8–12 or first visit to zone 2, within the Bible's 10–15 min window. Classless stats remain usable. | P | — |
| **R03.03** | First recruit via a short quest in 2–5 min (target) | T | SIM | The quest is modelled as a condition plus an active duration, and the target is measured. | P | — |
| **R03.04** | Unlock slots through progression, then buy recruits with resources | L | SIM | Two separate gates: slot unlock (progress) and purchase (candidate gold cost). | P | N-12 |
| **R03.05** | Around 4–6 recruits in W1 | N | SIM | Narrowed to a fixed 6 by R10.04. | ✔ | C-10 |
| **R03.06** | Ordinary recruits start classless; the player chooses a class | L | SIM | Proposed: the first class choice is free and available immediately. | O | N-12 |
| **R03.09** | Class change at the trainer for earned resources; level preserved | L | SIM RBX | Candidate gold cost. Combat level kept; mastery tracked per class. | O | D-05, O04 |
| **R03.10** | Talent points per level, class-specific talents | L | SIM | Points = f(level), the same for every class. Allocation stored per class (proposed). | O | D-05 |
| **R03.12** | Full personal combat EXP for hero and each deployed recruit | L | SIM RBX | Each eligible deployed member gets the monster's full EXP, not split. An ineligible member (knocked out, out of range, not deployed) gets none. | P | D-04 |
| **R05.16** | Permanent mastery milestones only while genuinely training a class; best record per class | L | SIM | Mastery EXP comes only from eligible combat EXP in the active class. The record is the maximum mastery level any character ever reached in that class. | P | D-05, N-15 |
| **R06.07** | Worker combat kills count; hero visits and completes major gates | L | SIM | Worker and offline kills count toward counters and kill gates. Minibosses, bosses and quest gates need the hero actively. | P | D-01, N-04 |
| **R07.02** | Online assignments earn 100% of calculated production | L | SIM | Online independent workers produce at 100% of the rate model. This creates a connected-idle incentive. | ⚠ | C-03, N-02 |
| **R07.09** | Exactly one productive assignment per character at a time | L | SIM RBX | Invariant: each character holds exactly one of {idle, squad, combat worker(zone), gatherer(node), crafter(job)}. Reserve units hold none. | ✔ | — |
| **R07.10** | Free assignment changes via Command Centre or portable interface | L | SIM RBX | A change settles the old interval first, then starts the new one. No cost, no double credit. | ✔ | — |
| **R09.14** | All productive roster and combat slots earned through gameplay | L | SIM RBX | No slot unlock path can reference a purchase; checked by a schema test. | ✔ | — |
| **R10.04** | World 1: six recruits plus the hero | L | SIM | Six = total productive recruit capacity, hero excluded. How rare heroes fit is D-06. | O | D-06, O01 |
| **R10.05** | Start with 1 deployed, up to 3 in W1; up to 6 later | L | SIM | Deploy cap schedule 1→3 in W1, with candidate unlock points. The hero is additional. | ✔ | — |

### M1 · S3 — Professions, gear, crafting, queues (23)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R03.13** | Any character trains any profession; classes have natural specialities | L | SIM | Affinity is an efficiency bonus, never a restriction. Candidates: Warrior → Mining, Mage → Woodcutting. Archer's launch affinity is unresolved. | O | O06, C-15 |
| **R04.01** | Mining, Woodcutting, Smithing in W1 | L | SIM RBX | — | ✔ | — |
| **R04.02** | Individual profession levels for every character | L | SIM | EXP and level per character per profession. | ✔ | — |
| **R04.03** | Hero and recruits can gather | L | SIM | — | ✔ | — |
| **R04.05** | Assign specific resource nodes or production jobs | L | SIM RBX | A worker targets a discovered node or a job. Several of the player's own workers per node allowed (proposed). | P | N-07 |
| **R04.06** | Higher efficiency gives more resources per action | L | SIM | Yield per action = base × f(efficiency), with candidate diminishing returns. Over-efficiency raises the yield, not the number of events. | P | — |
| **R04.07** | Unlimited personal access at shared physical nodes | L | SIM RBX | Nodes never deplete and are never contested between players. | ✔ | — |
| **R04.08** | Shared resource storage, individually equipped items | L | SIM RBX | One account ledger for stackable resources. Equipment items are individual, each with exactly one owner. | ✔ | — |
| **R04.09** | Automatic worker material deposits | L | SIM | Outputs go into the ledger on completion, with no collection step. | ✔ | — |
| **R04.10** | Weapon, four armour pieces, accessory, profession tools | L | SIM RBX | Slot list, tools per profession, unlocked contextually. | ✔ | — |
| **R04.11** | Mostly crafted gear, occasional valuable drops | L | SIM | The crafted path is guaranteed; equipment drops are rare extras. | ✔ | — |
| **R04.12** | Wood, copper, iron, steel, gold, mithril and later tiers | N | SIM ART | Launch narrowed to six tiers by R10.08. | ✔ | — |
| **R04.13** | Fixed base stats with optional traits/enchantments | L | SIM | Not specified whether launch traits are random or recipe-fixed. Enchanting is deferred (R04.18). | ⚠ | N-06, C-01 |
| **R04.14** | Gathering materials, monster drops and Smithing level required for crafting | L | SIM | Recipe prerequisites: Smithing level plus the input resources. | ✔ | — |
| **R04.15** | Instant equipment crafting; timed bars/components possible | L | SIM | Gear is crafted in one instant transaction; bars and components are timed jobs. | ✔ | — |
| **R04.16** | Higher-tier recipes consume earlier equipment; optional recycling | L | SIM | Open: how enhancements carry over, how much salvage returns, and protection. No net-positive loops allowed. | O | O09 |
| **R04.17** | Guaranteed enhancement, escalating costs | L | SIM | No failure chance. The cost curve is independent of the bonus curve. | ✔ | — |
| **R04.19** | Free equipment transfer, auto-equip and loadout presets | L | SIM RBX | A transfer is an atomic owner change. Auto-equip never consumes protected items. | ✔ | — |
| **R07.14** | Queued component recipes, quantity limits, material reservations | L | SIM RBX | Proposed: inputs reserved one unit at a time; jobs ordered by (priority, enqueue time, job ID). | O | D-07, O10 |
| **R07.15** | Shortages pause the job with a reason; resume when inputs exist | L | SIM | The job pauses with "short of item X: need N, have M" and resumes at the next deposit that covers it. | ✔ | — |
| **R08.12** | Recipes individually balanced | L | SIM | Each recipe is its own content row, with no global formula forced. | ✔ | — |
| **R08.13** | Substantial tier upgrades, smaller enhancements between tiers | L/T | SIM | Metric: time-to-kill gain per tier vs per enhancement level. Candidate thresholds in S3. | P | — |
| **R10.08** | Six tiers wood–mithril; class weapons, shared armour designs | L | SIM ART | Six tier IDs, class-specific weapon recipes and shared armour recipes. Each armour piece is still owned by one unit. | ✔ | — |

### M1 · S4 — Monuments, Bestiary, Feats, class bonuses (12)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R03.17** | Highest-developed character per class gives the class bonus, plus roster milestones | L | SIM | The class bonus comes from the class record (R05.16), never a sum over duplicates. Roster milestones come from total legion levels (candidate). | P | D-05, N-15 |
| **R05.01** | W1 Monuments, Bestiary, passive Feats; expand later | L | SIM RBX | — | ✔ | — |
| **R05.02** | Account bonuses apply to all current and future recruits and workers | L | SIM | Each account-scope bonus is applied once per unit when its stats are evaluated, with no per-unit unlock. | ✔ | — |
| **R05.03** | Monuments discovered via quests, zone milestones, rare drops | L | SIM | Main Monuments have a guaranteed path. Rare-drop discovery is only for optional Monuments or alternate routes. | P | O13 |
| **R05.04** | Gold for routine levels, materials at major milestones | L | SIM | — | ✔ | — |
| **R05.05** | Soft caps, expandable tiers, ascension milestones | L | SIM | Soft caps through diminishing returns; tiers expand at milestones. Ascension is later content, not a W1 multiplier. | P | — |
| **R05.06** | Bestiary guaranteed kill milestones plus rare emblem collections | L | SIM | Counts and thresholds open. Emblems are optional and never gate-critical. | O | O11 |
| **R05.07** | All unlocked Bestiary bonuses are passive | L | SIM | — | ✔ | — |
| **R05.08** | Individual bonuses plus regional completion/mastery rewards | L | SIM | Regional reward definitions open. | O | O11 |
| **R05.14** | Feats grant permanent stats, titles, milestone rewards | L | SIM | Feat tables open. Each reward is granted once. | O | O11 |
| **R05.20** | Current/next bonus, cost, Buy Max, advanced breakdown | L | SIM RBX | Buy Max = the most legal levels without crossing an unmet material milestone. The same function drives the UI and the sim. | P | — |
| **R08.14** | Individually tuned escalating costs with milestone requirements | L | SIM | — | ✔ | — |

### M1 · S5 — Offline settlement (11)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R07.01** | Offline unlocks after first recruit, 2–5 min target | L/T | SIM RBX | Offline progress switches on when the first recruit is gained. | ✔ | — |
| **R07.03** | Offline starts at 60%, permanent upgrades available | L | SIM | 60% applies to credited productive work, measured against the equivalent online automated rate. The candidate content has no W1 upgrade source. | ⚠ | C-02, N-01 |
| **R07.04** | First 24 h normal efficiency, next 48 h reduced | L | SIM | The reduced rate is unspecified; 25% is only a candidate. | O | D-08, O02, N-10 |
| **R07.05** | Monuments/Research/Mastery upgrade toward 100% in the normal window | L | SIM | Of these, W1 has only Monuments. Ceiling 100%; never above. | ⚠ | C-02 |
| **R07.06** | Choose hero offline assignment; default last eligible activity | L | SIM | Interplay with the squad default is unresolved. | ⚠ | C-04, N-03 |
| **R07.07** | Squad defaults to farming with the hero; separate assignments allowed | L | SIM | Same issue as R07.06. | ⚠ | C-04, N-03 |
| **R07.11** | Full calculated offline EXP, level-ups and stat changes | L | SIM | A level-up mid-interval changes later rates (event boundary). Mastery and profession EXP accrue too (proposed). | P | N-08 |
| **R07.12** | Same drop rules per credited kill | L | SIM | Odds per credited kill. Batched sampling is statistically equivalent to per-kill sampling. | ✔ | — |
| **R07.13** | Offline eligible kills count; hero must visit and complete gates | L | SIM | Offline kills advance counters and may satisfy kill gates (access only), never visits or major gates. | P | N-04 |
| **R07.18** | Offline rewards deposited automatically; consolidated summary | L | SIM RBX | The receipt is built from persisted credits only. | ✔ | — |
| **R07.20** | Efficient batch offline model including level-ups, materials, limits and gates | L | SIM RBX | Event-boundary batch integrator, cross-checked against the exact reference stepper. | ✔ | — |

### M1 · S6 — Full W1 candidate tables, strategies, sensitivity (15)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R03.14** | Rare heroes via drops, quests, boss challenges, hidden discoveries | L | SIM ART | Acquisition paths and protection rules open. Not required for the W1 clear. | O | O13, D-06 |
| **R03.15** | Rare heroes have unique traits, abilities and specialisations; not universally superior | L | SIM | Check: no rare hero dominates every objective metric in S6 comparisons. | P | — |
| **R03.16** | Unique heroes recruited once; repeats give upgrade materials | L | SIM RBX | The unique grant is idempotent; duplicates convert through a defined table. | ✔ | — |
| **R05.19** | Interconnected systems with controlled feedback loops | L | SIM | Loop elasticity tests (experiment plan §8). | P | — |
| **R06.03** | Ten combat zones per world including the final boss region | L | SIM ART | Zone 10 is the boss region. S1 covers 3 zones. | ✔ | — |
| **R06.09** | W1 completion in 4–8 active hours (target) | T | SIM | Undecided: which profiles and percentile count as "representative", and how active time is defined. | O | O14, N-09 |
| **R06.13** | Rare elite variants: stronger attacks, better rewards, unique looks | L | SIM | A variant table with spawn chance, stats and rewards. | ✔ | — |
| **R06.14** | Two major minibosses and a final boss per world | L | SIM | Open: whether the slice miniboss becomes the zone 5 or zone 8 boss. | O | O08 |
| **R06.15** | Free boss entry after conquest; rewards balanced around clear time | L | SIM | Boss reward per hour is compared with farming reward per hour and must not dominate by default. | P | — |
| **R07.19** | Active play provides additional opportunities | L | SIM | Metric: progress per hour active vs offline. Active must exceed offline (candidate band). | P | — |
| **R08.01** | Rapid early growth, deep midgame, long-term goals (target) | T | SIM | Shape checks: gaps between milestones grow over time, and post-clear goals exist. | P | — |
| **R08.15** | Selected older materials used in advanced recipes and upgrades | L | SIM | A demand report per material per zone. | ✔ | — |
| **R08.17** | Guaranteed critical items; optional randomness or transparent protection | L | SIM | Pity and protection rules open. | O | O13 |
| **R08.19** | Several viable strategies with trade-offs | L | SIM | Spread metric across profile end-states; no single dominant strategy. | P | — |
| **R08.20** | Candidate curves, multiple profiles, sensitivity tests, Roblox validation | L | SIM ANA | This plan. Roblox validation happens at M7. | ✔ | — |

### M2 — Roblox combat prototype (8)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R01.01** | Traditional third-person 3D Roblox | L | RBX ART | — | ✔ | — |
| **R01.03** | Automatic basic attacks, manual special abilities | L | RBX SIM | Sim: basic attacks in S1; abilities as cooldown events in S2. | ✔ | — |
| **R02.01** | Automatic targeting plus manual priority target | L | RBX | Proposed (from the Bible): the target is kept until it dies; a priority target overrides the nearest. | P | — |
| **R02.02** | Move freely while attacking | L | RBX | — | ✔ | — |
| **R02.10** | Up to 3 equipped manual hero abilities | L | RBX SIM | Ability content is open. Sim models abilities as an active-only damage bonus (candidate). | O | — |
| **R07.08** | Optional auto-farm within the selected zone, manual override | L | RBX SIM | Auto-farm never leaves its zone and never starts a major gate. Sim time category: "online auto-farm". | P | D-01 |
| **R10.14** | Modular typed Luau, shared definitions, data-driven content, automated tests | L | RBX | Precedent: plus1game's strict pure Luau kernels with Lune tests (audit §5). | P | — |
| **R10.16** | Server authority, session protection, schema migrations, idempotency early | L | RBX | Starts at M2/M3, not M6. | ✔ | — |

### M3 — Roblox recruitment and deployment (2)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R03.11** | Free town talent respec with a short cooldown | L/T | RBX SIM | Cooldown length is a candidate. S2 tests that respec cannot multiply rewards. | O | D-05 |
| **R03.18** | Individual customisation, auto-equip, bulk upgrades, assignment presets, filters | L | RBX | UI work across M3, M4 and M6. The sim uses the same validation rules. | ✔ | — |

### M4 — Roblox professions and crafting (2)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R01.09** | Dedicated physical mining, woodcutting and crafting locations | L | RBX ART | The sim abstracts these as nodes with travel time. | ✔ | — |
| **R04.04** | Interact once to auto-gather; move away to stop | L | RBX | — | ✔ | — |

### M5 — Roblox permanent systems (1)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R05.15** | Automatic Feat rewards, notification, optional summary | L | RBX SIM | One-time grants are tested in S4. | ✔ | — |

### M6 — Roblox offline, persistence, Command Centre (4)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R07.16** | Projected rewards per hour and objective-based recommendations | L | RBX SIM | Estimates come from the same rate model the lab checks against simulated results. Uncertainty is shown. | P | — |
| **R07.17** | Named assignment presets and objective suggestions | L | RBX | A preset applies atomically and is validated. | ✔ | — |
| **R09.04** | Welcome-back guidance, offline rewards, optional catch-up, no resets | L | RBX | Catch-up design open. It must not reward staying away. | O | O17 |
| **R09.15** | Free core automation, auto-equip, travel and assignment management | L | RBX | None of these is paywalled. | ✔ | — |

### M7 — Integrated vertical slice: content, art, onboarding (12)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R01.04** | Open connected monster zones | L | RBX ART | — | ✔ | — |
| **R02.13** | Boss telegraphs, dodging, meaningful abilities | L | RBX | The sim models bosses only as clear time and failure chance. | ✔ | — |
| **R04.20** | Sequential profession and crafting quests in the first 15–25 min (target) | T | RBX SIM | The sim measures time-to-first-craft under a scripted onboarding route (S3). | P | — |
| **R06.01** | Colourful medieval fantasy, increasingly magical/cosmic | L | ART | — | ✔ | — |
| **R06.02** | Compact connected zones per world; portals between worlds | L | RBX ART | — | ✔ | — |
| **R06.04** | World 1: The Verdant Kingdom | L | ART | Zone names and species are candidates. | ✔ | — |
| **R06.16** | Personal boss instances, optional party co-op, scaling | L | RBX | Party scaling and credit (O16) are decided at M9. | O | O16 |
| **R06.17** | Boss failure resets the encounter; no resource loss | L | RBX SIM | Retry downtime is modelled in the sim. | ✔ | — |
| **R10.03** | Prototype: 3 zones, 2 recruits, gathering, crafting, Monuments, 1 miniboss | L | RBX SIM | Open: the miniboss's later reuse (O08), and which 3 Monuments to use. | O | O08 |
| **R10.11** | Polished stylised low-poly fantasy, chunky gear | L | ART | — | ✔ | — |
| **R10.12** | Mobile-first HUD, progressive menus, optional detailed stats | L | RBX | — | ✔ | — |
| **R10.13** | Compact handcrafted zones, reusable kits, landmarks | L | ART | — | ✔ | — |

### M8 — Full World 1 (5)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R06.10** | W1 only at launch with a W2 preview | L | RBX LCH | The preview says clearly that W2 is not playable yet. | ✔ | — |
| **R06.11** | Main path plus gathering areas, hidden caves, elite encounters | L | RBX ART | Optional areas are never gates. | ✔ | — |
| **R10.06** | Three complete base classes; advanced branches previewed for W2 | L | RBX | — | ✔ | — |
| **R10.07** | Three named rare heroes at launch | L | RBX ART SIM | Reserve and slot rules (D-06) must be decided before M3. | O | D-06, O01 |
| **R10.09** | Normal and Elite at launch, Nightmare later | L | RBX SIM | Elite adds new mechanics and rewards, not only more HP. | ✔ | — |

### M9 — Social, orders, shop (13)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R09.01** | Optional daily orders, modest rewards, no destructive streaks | L | RBX | Calendar rules open. | O | O17 |
| **R09.02** | Weekly orders: combat, professions, bosses, collections | L | RBX | Calendar rules open. | O | O17 |
| **R09.03** | Eligible offline activity counts for orders; active challenges stay active-only | L | RBX SIM | Uses the same eligibility function as the S5 counters. | P | — |
| **R09.05** | Parties up to four players, each with their own legion | L | RBX | — | ✔ | — |
| **R09.06** | Personal contribution rewards, co-op challenges, modest non-stacking party benefits | L | RBX | Contribution thresholds and anti-carry rules open. | O | O16 |
| **R09.09** | Lifetime and weekly leaderboards | L | RBX | Launch categories open. | O | O20 |
| **R09.12** | Cosmetics and moderate transparent boosts; all essential content free | L | LCH | Values and compliance open. | O | O18 |
| **R09.13** | Modest deterministic EXP, gold and profession gamepasses | L | LCH SIM | Values unapproved. Paid profiles are added to the sim after the free baseline. | O | O18 |
| **R09.16** | Defined temporary boosts and balanced guaranteed bundles | L | LCH | Proposed: boost timers pause while offline (Bible §12); not decided. | O | O18 |
| **R09.17** | Rare heroes, random enchanting and drop luck earned through gameplay at launch | L | LCH | No enchanting exists at launch. | ⚠ | C-01 |
| **R09.18** | Direct armour/weapon/banner/cape cosmetics; later auras/mounts | L | ART LCH | — | ✔ | — |
| **R09.19** | Optional events and seasonal challenges | L | RBX LCH | Number of events at launch open. | O | O20 |
| **R10.18** | Validate free progression first, then test deterministic paid products | L | LCH SIM | — | ✔ | — |

### M10 — Closed alpha and soft launch (3)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R09.20** | Pre-release analytics, soft launch, cohort comparison | L | ANA | Instrumentation starts at M2/M7. | ✔ | — |
| **R10.17** | Low-end mobile target; initial tests with 12-player full squads | L/T | RBX | Performance budgets are set only after measurements. | O | O19 |
| **R10.19** | Internal tests, closed alpha, small ad tests, evidence-based scaling | L | LCH | — | ✔ | — |

### Future — post-launch / World 2+ (15)

| ID | Approved decision (short) | Type | Domains | Interpretation and notes | Interp. | Links |
|---|---|---|---|---|---|---|
| **R01.08** | Eventual 20–50 roster, smaller deployed squad | D | FUT | Roster capacity is a content parameter; the schema allows N slots. | ✔ | C-12 |
| **R03.07** | Two branches per base class, later advancements | D | FUT | Not playable at launch (R10.06). | ✔ | C-14 |
| **R03.08** | Advancement needs a level milestone and a class challenge | D | FUT | — | ✔ | C-14 |
| **R04.18** | Enchanting in a later world | D | FUT | — | ✔ | C-01 |
| **R05.09** | Recruits assigned to laboratories produce research points | D | FUT | The "research" assignment type is reserved and rejected in W1. No W1 multiplier. | ✔ | — |
| **R05.10** | Military, Industrial, Legion, Arcane research branches | D | FUT | — | ✔ | — |
| **R05.11** | Direct research choice after prerequisites | D | FUT | — | ✔ | — |
| **R05.12** | Mastery points from bosses, quests, milestones, Feats | D | FUT | Policy for points earned before unlock (O15) must be decided by M8. | O | O15 |
| **R05.13** | Free upgrade order; eventually every branch | D | FUT | — | ✔ | — |
| **R06.18** | Normal/Elite/Nightmare with scaling and new rewards | N/D | FUT | Launch narrowed to Normal/Elite (R10.09). | ✔ | C-11 |
| **R06.20** | New worlds add enemies, gear, systems; older worlds stay relevant | D | FUT SIM | S6 checks that older materials stay in demand. | ✔ | — |
| **R09.07** | Guilds in a post-launch update | D | FUT | — | ✔ | — |
| **R09.08** | Guild objectives, levels, bonuses, weekly boss | D | FUT | — | ✔ | — |
| **R09.10** | PvE-focused; optional separate balanced PvP later | D | FUT | No PvP at launch. | ✔ | — |
| **R09.11** | No launch trading; investigate restricted trading later | D | FUT | No trading code paths at launch. | ✔ | — |

---

## 6. Coverage check

| Owning milestone | Primary rows |
|---|---|
| M0 | 5 |
| S0 | 13 |
| S1 | 15 |
| S2 | 24 |
| S3 | 23 |
| S4 | 12 |
| S5 | 11 |
| S6 | 15 |
| M2 | 8 |
| M3 | 2 |
| M4 | 2 |
| M5 | 1 |
| M6 | 4 |
| M7 | 12 |
| M8 | 5 |
| M9 | 13 |
| M10 | 3 |
| Future | 15 |
| **Total** | **183** |

| Round | Register count | Primary rows here |
|---|---|---|
| R01 | 10 | 10 |
| R02 | 15 | 15 |
| R03 | 18 | 18 |
| R04 | 20 | 20 |
| R05 | 20 | 20 |
| R06 | 20 | 20 |
| R07 | 20 | 20 |
| R08 | 20 | 20 |
| R09 | 20 | 20 |
| R10 | 20 | 20 |

**Machine check (run 13 Nov 2026, Python 3.12.9 standard library, read-only).**
- **Coverage:** the script compared every bold primary-row ID in this file with every ID row in `docs/DECISION_REGISTER.md`. Register: 183 IDs, 183 unique. Primary rows: 183, 183 unique. Missing: none. Extra: none. Duplicated: none. Every section's declared count matches its rows.
- **Interpretation status:** 96 clear (✔), 44 proposed (P), 33 open (O), 10 conflict/tension (⚠).
- **Type codes:** 151 L, 5 L/T, 9 T, 3 N, 14 D, 1 N/D.

The script is reproduced in the audit §9.

---

## 7. Bible open items (O01–O22) → where they are addressed

| O-ID | Topic | Linked decisions | Handling here | Decide by |
|---|---|---|---|---|
| O01 | Six recruits vs three heroes | R10.04, R10.07, R03.14–16, R01.06 | §4.1, D-06 | Before S2 (schema) / M3 |
| O02 | Reduced offline window | R07.04, R07.03, R07.05 | §4.7, D-08 | S5 |
| O03 | Grouped farming loot | R02.12, R03.12, R07.12 | §4.2, D-04 | S2 |
| O04 | Class switching and talents | R03.09–11, R05.16, R03.17 | §4.3, D-05 | S2 / M3 |
| O05 | Recruit HP and knockout | R02.06, R02.07 | §4.4, D-03 | S1 (hero) / S2 |
| O06 | Profession affinities | R03.13 | C-15 | S3 |
| O07 | Access vs visit vs assignment | R06.05–07, R06.19, R07.13 | §4.5, D-01 | S1 |
| O08 | Prototype miniboss vs W1 count | R10.03, R06.14 | C-13. Recommendation (UNAPPROVED): reuse the slice miniboss as the zone 5 miniboss in M8 | M7 |
| O09 | Enhancement inheritance and salvage | R04.16 | Open | S3 |
| O10 | Queue reservation and tie order | R07.14, R07.15 | §4.8, D-07 | S1 (ordering) / S3 |
| O11 | Feat/Bestiary/Monument tables | R05.06, R05.08, R05.14 | Open | S4 / S6 |
| O12 | Numeric and offline precision | R08.03, R08.18 | §4.6, D-02 | S0 / S5 |
| O13 | Rare reward protection, duplicates | R03.14, R05.03, R08.17 | Open | S4 / S6 |
| O14 | W1 completion and post-clear duration | R06.09, R08.01 | N-09 | S6 / M7 / M8 |
| O15 | Mastery points before unlock | R05.12 | Open | M8 |
| O16 | Party contribution and boss scaling | R02.12, R06.16, R09.06 | Open | M2 / M9 |
| O17 | Daily/weekly calendar | R09.01, R09.02, R09.04 | Open | M9 |
| O18 | Monetisation values and compliance | R09.12, R09.13, R09.16 | Open | M9 |
| O19 | Mobile and server budget | R10.17 | Open | M2 / M7 / M10 |
| O20 | Live events and leaderboard scope | R09.09, R09.19 | Open | M9 |
| O21 | Workload and quality risk | R10.20 | Process: slice gate and change control | Every milestone |
| O22 | Actual formula and model validity | R08.20 | Experiment plan §10–11 | S7 / M7 |
