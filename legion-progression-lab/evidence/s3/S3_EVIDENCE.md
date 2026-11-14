# S3 evidence — professions, equipment, crafting and production

**Increment:** S3, authorised by the owner's "Final L1/S2.1 Acceptance and S3 Authorisation" (2026-11-14), §2–§13.

**Date:** 2026-11-14.

**Status:**
- **S2 checkpoint committed** (`732f3da`, tag `s2-checkpoint`); **S3 is uncommitted** on top of it, awaiting independent review and owner acceptance. It is not committed as an approved checkpoint.
- **Not pushed.** The GitHub remote is public.
- **S4 not started;** old workspaces not deleted.

**Labels:**
- Every S3 number is a `candidate` (content/w1-slice-s3.candidate.v0.3.0.json, planning/S3_RESOLUTIONS.md). Every result is a model output from candidate inputs. Nothing is approved or live-validated.
- No S1 or S2 content, coefficient, target or policy parameter changed. No S2 coefficient is promoted.

**Engineering gates:** **all pass** (type check; 1,063 default tests and 9 statistical tests; 404 fixture cases, 0 problems; 18 oracle groups, 0 failing; 3 schemas in sync; 22 / 22 planted bugs detected; 11 / 11 S3 experiments and 19 / 19 historical experiments re-verified MATCH; determinism and reference-ledger checks pass; S3-E01 and S3-E06 clean; 13 / 13 registered files unchanged). **Candidate balance targets:** H-S3-02 and H-S3-03 **miss** (§9); targets were not moved.

---

## 0. In plain words (for the owner)
- **What was built:** characters can now mine, cut wood and smith; equipment exists as individual items (Wood and Copper tiers), can be crafted, enhanced, salvaged, moved between characters and auto-equipped; and a production queue turns logs into planks and ore into bars, holding exactly the inputs it needs and pausing when they run out. All of it sits behind an "industry" switch: with the switch off, S2 runs exactly as before (tested).
- **Is it correct?** In every run (29,890 experiment runs and 10,000 generated command sequences) the safety monitor found **no** broken rule: no item in two places, no material from nowhere, no reward paid twice, no reservation lost; and a search of 15,210 craft, enhance and salvage states found no way to gain material. An independent Python model of the queue and the formulas agrees on all 48 new reference cases. Twenty-two deliberately planted bugs were each caught by the tests (one was missed at first; the gap was closed with a new test and case, and all 22 were re-run).
- **What the experiments say (model outputs, not balance decisions):**
  1. **Industry does not pay back within a session in this content.** Putting recruits into gathering or smithing costs 32–64% of the hero's EXP and 65–91% of the legion's EXP over 60 minutes, and the hindsight search (which could switch strategy at every decision) always chose pure combat for every goal. The reason: every squad member earns full personal EXP, so a recruit who stops fighting loses a lot, and Wood/Copper gear makes kills only 10–20% faster.
  2. **The first useful item comes too early:** 2.4–10.8 minutes for the five crafting strategies, against the 15–25 minute target band (a miss; the target was not moved).
  3. **Copper is not a big enough step:** in zone 3 a full Copper set cuts the squad's time-to-kill by 13% against Wood (target at least 25%), and one enhancement level gives half of that. In zone 2 the squad already kills almost instantly, so gear cannot show a difference there.
  4. **Gatherers produce far more than smiths can use:** one gatherer collects about 2,000–3,000 logs an hour while the smith turns about 10–17 planks an hour into equipment; the class affinity bonuses therefore change nothing downstream.
  5. **Hero power levers work as expected:** doubling the hero's base attack raises its damage share from 57% to 65% and EXP by about 41%; ability variants matter only when the player actively uses the ability.
  6. **Knockouts stay rare:** even with a widened, pre-registered matrix, only 45% of squad cells produce regular knockouts (the registered bar was 50%), so no knockout conclusion is drawn.
- **Decisions for the owner** are listed in §11.

## 1. Verification recorded (not overstated)
- **Nothing in S3 has been independently verified yet.** Everything below was run on this machine (Windows, Node 24.22.3, 16 logical CPUs, 15 worker threads).
- **The Python oracles** (spec/oracle/s3_oracle.py) and the lab were written by the same author (Claude) in different languages, from the same written spec; reviewers should spot-check derivations (several cases are also derived by hand).
- **Monitor check counts** are repeated evaluations of the same invariants across model runs; they are not independently designed test scenarios.

## 2. The S2 checkpoint (owner §2)
- **Acceptance resolution:** planning/S2_ACCEPTANCE_RESOLUTION.md.
- **Commit** `732f3da1ee166639ae504430a8aa0cbca3101846`, **tag** `s2-checkpoint` (annotated, object `588466a3…`), tree `981e839c…`; exactly the accepted S2.1 package plus the resolution (compared file by file). Details: evidence/s2-checkpoint/CHECKPOINT.md.
- **Clean export** (`git archive`, offline install): 926 tests, 9 statistical tests, 356 fixture cases, 17 oracle groups, 3 re-verifications MATCH.
- **Frozen simulator, Original v1 archive and old Legion workspace:** unchanged at the checkpoint and again after S3 (frozen-check.txt). The old workspace's 16 recorded files are byte-identical; the tool-generated `sourcemap.json` noted at the checkpoint is still the only extra file.
- **Ledger (owner §2, §11):** the persistent AVL ledger runs every S3 experiment; the reference ledger is kept as the default and as the differential control (§8).

## 3. Estimator v1.3 — the S3 entry correction (owner §4)
- **Rule:** an exhausted swing or work budget is **"unresolved"**, with no forecast (`forecast: 'unavailable'`), never "unreachable". "Unreachable" is kept for proven impossibility (zero hit chance; dies before the first kill), which keeps its forecast (`available`, zero rates).
- **Distinct labels:** unsafe, approximate and reliable stay distinct; no positive forecast is invented for an unresolved case.
- **Zero against unavailable:** the displayed estimate, the squad estimate and the worker estimate carry `forecast`; experiment metrics record `null` for an unavailable forecast, never 0.
- **Updated:** policies (POL1, POL2 and POL3 never recommend "unresolved"), observations, metric encodings, `spec/formulas/estimator.md` v1.3, `estimator.v1.json` (fixture version 3, re-derived by `s1_oracle.py`), two S1.1 behaviour tests and one new test.
- **Historical evidence preserved; changed output explained** (estimator-v1.3-regression.txt): all 19 historical experiments were re-run. 18 match their stored fingerprints exactly; **S2.1-E02 differs in exactly 7 values, all in one cell** (L1-Z3 worker Mage, `predictedWorkerKillsPerHour` 0 → null, "reached" 100 → 0). That is the intended encoding change. The re-run was written to `evidence/s3/estimator-v1.3-rerun/`; `results/s2.1/` and `evidence/s2.1/` are unchanged.
- **The large S2.1 errors, documented (owner §4):** in S2.1-E02, worker estimates labelled **approximate** had a median absolute error of 12.4% but a maximum of 382.1% (19 cells); estimates labelled **unsafe** had a median of 422.2% and a maximum of 903.0% (13 cells with realised kills); **reliable** estimates were within 0.1% (2 cells); the one **unresolved** cell had no forecast (shown as 100% because it had no prediction). The labels are therefore informative (reliable is reliable), but "approximate" can be off by a factor of four and "unsafe" by a factor of ten. A player-facing estimate should show the label prominently, and no number should be shown for "unsafe" without a warning. This is unchanged by v1.3 (source: evidence/s2.1/analysis.txt).

## 4. What S3 implements (owner §5)
| Area | Implementation | Tests / fixtures |
|---|---|---|
| Professions | Mining, Woodcutting, Smithing EXP and level per character (combat EXP table, S3-R01); efficiency = (level − 1) × 400 + tool + affinity (O06) | s3.industry gathering tests; `industry-rules` efficiency cases |
| Nodes and gathering | 4 nodes (zones 1–3); discovered when the hero has visited the zone; level and tool requirements; unlimited personal access, any number of workers; exact remainder accrual; deposits are one transaction each; captured rate at action start | gathering tests; `industry-rules` deposits cases |
| Hero gathering | `Gather` / `StopGather` at a node of the hero's zone; any other hero activity or the session end stops it (the action in progress yields nothing) | "any other hero activity stops…" |
| Assignments | squad, worker, gathering(node), smithing, idle, reserve; one per character; the hero is leader; leaving a role abandons its work (no yield; reservations released); reserve produces nothing | reserve and reassignment tests; monitor I18 |
| Equipment | instances `item:<n>` with one location; slots weapon, helmet, chestplate, leggings, boots, accessory, pickaxe, axe, hammer; Wood and Copper content, six tier IDs; fixed recipe-defined stats (N-06); class weapons and a universal club (S3-R08); shared armour designs, independent instances; free equip, unequip and transfer outside encounters; deterministic auto-equip (S3-R21); protection; stats added before class multipliers (none gives exactly S2's stats) | equipment tests; `equipment-ops` |
| Crafting | instant, by a named crafter out of an encounter with the Smithing level; Copper consumes one explicitly chosen lower-tier same-slot item that is neither equipped nor protected (O09); atomic | crafting tests; `equipment-ops` consume cases |
| Enhancement | guaranteed, +10% of base stats per level to +5; gold 20 × n² and n tier materials; no inheritance by default, half as a variant (O09) | enhancement tests; `industry-rules` |
| Salvage | half of the declared recoverable materials, rounded down; never equipped or protected items; no net-positive cycle | salvage tests; S3-E06 |
| Production queue | timed planks and bars; quantity-limited jobs; per-unit FIFO reservation, skip on shortage keeping the FIFO position, automatic pause and resume, atomic completion, Smithing EXP, cancellation and release, estimates and states in the observation; diagnostic reserve-all and round-robin arms (O10) | queue tests; `production-queue` (independent discrete-event oracle) |
| Effective damage (H) | lethal-batch HP shared in proportion to damage (largest remainder), order-independent, sums exactly to the HP removed; raw damage unchanged | effective-damage tests; `industry-rules` shares cases |

**Not built (owner §12):** Monuments, Bestiary, Feats, applied mastery bonuses, research, offline settlement, advanced classes, enchanting, rare-hero content, zones 4–10, final bosses, the full six tiers, monetisation, trading, Roblox/Luau, dashboards.

## 5. Owner decisions (owner §6; planning/S3_OWNER_DECISIONS.md)
- **O06 affinities** (Warrior → Mining, Archer → Smithing, Mage → Woodcutting) are an efficiency bonus only; the strength (+2,500 bp) is a candidate; the no-affinity control ran in S3-E04 (§9).
- **N-06:** every item stat is fixed by its recipe; there is no random equipment, luck or reroll anywhere in S3.
- **O09:** no inheritance by default (the half-inheritance variant is tested); the observation shows the consume candidates (preview); salvage is deterministic and partial; equipped and protected items are never consumed or salvaged, and the policies never touch protected items.
- **O10:** per-unit reservation; FIFO by enqueue time then job number; completion before outputs; outputs credited before new work; pause and resume; release on cancel. The three questions it left open are specified (S3_SPECIFICATION.md §6; spec/formulas/s3-industry.md §4): competing jobs share the pool in FIFO order of the scan, a skipped (paused) job keeps its place and does not block later jobs, and a unit completing at *t* completes before a cancellation at *t* while a unit started at *t* is released by it.

## 6. Invariants (owner §7) — the S3 monitor
`src/experiments/industryMetrics.ts` re-checks the state after every S3 event, alongside the S2 monitor (I1–I9):

| Owner §7 requirement | Monitor check |
|---|---|
| one location per item; never double-equipped | I10 (loadout and locations agree both ways; one holder; slot matches; weapon fits the class) |
| never equipped-and-salvaged, double-consumed, auto-consumed while protected | I11 (terminal states never return; consumed or salvaged only from a free, unprotected inventory item) |
| never created by a failed craft | I12 (an item appears only with a Crafted entry, one per craft, or the labelled diagnostic start) |
| atomic operations; no negative balances; no undeclared creation or destruction; no reserved materials in purchases | I13 (every transaction has a declared purpose and obeys its sign rule; purchases and crafts only debit `available`) and I14 (exact BigInt reconstruction of every balance from the committed history) |
| no locked or abandoned reservations | I15 (reserved balance = inputs held by jobs, exactly; none after a session end for the per-unit arms) |
| no duplicate rewards or EXP; no stale rewards | I16 (a unit completes once, after it started, never after release or for a cancelled job) and I17 (profession EXP = the EXP of the completion entries) |
| no reserve-character production; no double production; no undiscovered-node production | I18 (yields only for the current role at a discovered node; smithing only by assigned recruits; one piece of work per character; never while fighting) |
| exact remainder accounting; stats captured at work start; no acceleration via reassign or equip | I19 (exact action and unit durations; the deposit equals the exact accrual of the captured yield; equipment modifiers equal those recomputed from the loadout) |

"Never transferred while reserved" applies to materials only: items are never reserved in S3, and reserved materials cannot be spent (I13, I15).

## 7. Policies, observation and time (owner §9, §10)
- **POL3** (src/policy/industryRealistic.ts): the six registered strategies (manifests/s3/PREREGISTRATION.md §2), each POL2 plus a fixed role assignment, build order, production rule, optional hero gathering, optional earlier-zone rule and optional enhancement rule. They see only the observation and import nothing from the engine.
- **ORC3-SEARCH** (src/policy/industrySearch.ts): bounded hindsight search over the six strategies; its plan replays to the identical event log (no fork leaks; tested).
- **Observation** (src/engine/industryObservation.ts): profession levels and efficiencies; discovered nodes with requirements, displayed rates and blockers; items, loadouts and enhancement previews; recipes with availability, Smithing requirements and consume previews; jobs with states and shortage reasons; displayed unit times; work in progress. Never random state or the event queue.
- **Time categories:** automated combat, manual combat, gathering (the hero), travelling, resting, waiting (dead or spawn), idle, offline; crafting decisions are instant commands (counted, not timed). No category is "player input".
- **Headless approximations:** "interact once to auto-gather" is a `Gather` command; menus are instant; walking to a node inside a zone takes no time; interrupted work yields nothing (S3-R15).
- **Development probes:** before registration the strategies were debugged with single probe runs and one engineering smoke run (disclosed in PREREGISTRATION.md); their outcomes were not used for any target.

## 8. Ledger and L2 (owner §11)
- **Persistent ledger** for every S3 experiment. **Reference ledger** as the control: S3-E04 gives the same semantic fingerprint with the reference ledger (`af86534b…0a39` both; results in evidence/s3/experiments/reference-ledger/); S3-E01 compared the first 500 generated sequences on both ledgers: 0 mismatches; the in-suite sample compares 10.
- **L2 design update:** planning/L2_DESIGN_UPDATE.md (reservations, item, job and unit identities, production completions, batched settlement against replay protection, per-stream high-water marks). **No compaction implemented.**
- **Runtime and memory:** l2-measurements.txt (transactions per hour by strategy, wall time, heap growth) and each experiment's environment.json (duration, main-process memory). Over a 90-minute campaign the history holds 3,369 transactions without industry and 3,512–4,577 with it (gathering deposits are the largest S3 category); the persistent ledger gives identical balances in about half the wall time of the reference ledger (18 campaigns compared). The experiment runner held 1.2–3.6 GB resident with all results in memory; S3-E12 (1,600 runs, 400 of them hindsight searches) took 5.3 minutes on 15 workers in its verification re-run.

## 9. Experiments (owner §8, §9; manifests/s3/)
Registered 2026-11-14T09:59:41Z before any S3 experiment ran; amendment 01 registered at 10:13:03Z, after S3-E11 and before its widened matrix ran. Results: results/s3/<id>/ (copied to evidence/s3/experiments/); registered rules and comparisons: analysis.txt. Every run carries the S2 and S3 monitors.

| ID | Runs | Monitor checks | Violations | Headline (model output) |
|---|---|---|---|---|
| S3-E01 conservation | 10,000 sequences, 400,000 commands (112,062 accepted) | 178,614,774 | **0** | H-S3-01 **pass**; reference ledger 500/500 identical |
| S3-E02 queue contention | 72 | 674,499 | **0** | throughput set by the smiths in every arm; reserve-all locks 3–6× more materials and adds shortage; round-robin finishes jobs together but late; FIFO finishes the earliest jobs first |
| S3-E03 shortage timelines | 18 | 177,750 | **0** | jobs pause and resume automatically at each covering deposit; two plain woodcutters keep one smith fully supplied, one Mage nearly (18 short pauses) |
| S3-E04 gather vs fight | 1,200 | 211,822,974 | **0** | industry roles cost 32–64% hero EXP and 65–91% legion EXP at PR-BAL; the no-affinity control changes nothing downstream |
| S3-E05 tier step | 1,400 | 24,003,300 | **0** | H-S3-02 **miss** in zone 3 (tier cut 13.3%; one level 6.7%); zone 2 at the measurement floor |
| S3-E06 recycle loops | 15,210 states (depth 4, 3 stocks) | — | **0 breaks** | no craft, enhance or salvage sequence gains any material or gold |
| S3-E07 old-material demand | 400 | 111,606,902 | **0** | after the first Copper item no Wood-tier material is consumed; gatherers keep collecting thousands of logs |
| S3-E08 first useful craft | 1,300 | 156,306,954 | **0** | H-S3-03 **miss** in all 10 crafting cells: p50 2.4–10.8 min (band 15–25) |
| S3-E09 hero damage A–D, H | 800 | 136,681,128 | **0** | base ×2.0: share 57% → 65%, EXP +41% (passive); ability variants matter only when attentive; effective shares exact in every run (H-S3-10 pass) |
| S3-E10 pacing levers | 700 | 111,899,418 | **0** | EXP curve moves level times 16–39%; zone-2 enemy HP ×1.25 delays level 10 and zone 3 by ~9%, zone-3 HP ×1.25 cuts hero EXP 15%; gates as expected; equipment cost ×0.5/×2 changes nothing |
| S3-E11 knockout matrix | 9,600 | 386,161,417 | **0** | 24 of 72 squad cells generate knockouts (33%): not informative → amendment 01 |
| S3-E11 widened (amendment 01) | 12,800 | 384,429,846 | **0** | together 76 of 168 (45%): still below 50% → "knockouts are rare across the tested range"; no conclusion drawn |
| S3-E12 investment (G) | 1,600 | 231,131,253 | **0** | pure combat (POL3-CONQ) best on every objective in both designs; ORC3-SEARCH chose it at every decision (identical runs) |

### 9.1 S3-E05 and H-S3-02 (tier step)
| Squad (p50 median TTK, s) | none | Wood +0 | Wood +1 | Wood +2 | Wood +5 | Copper +0 | Copper +1 | Kills/h Wood → Copper |
|---|---|---|---|---|---|---|---|---|
| Zone 2, level 5 (Archer hero, Warrior + Mage) | 1.0 | 0.5 | 0.5 | 0.5 | 0 | 0 | 0 | 1,788 → 2,385 |
| Zone 3, level 10 | 1.6 | 1.5 | 1.4 | 1.4 | 1.5 | 1.3 | 1.0 | 1,311 → 1,435 |

- **Registered rule:** tier cut = 1 − TTK(Copper +0)/TTK(Wood +0) ≥ 25%, and one enhancement level cuts less than half the tier cut.
- **Zone 3: miss** (tier cut 13.3%; Wood +1 cut 6.7%, exactly half, not less).
- **Zone 2:** the derived rule reports "pass" (100% cut) only because a Copper-equipped squad kills the wolf in the first simultaneous batch (TTK 0); it is at the measurement floor and is **not** evidence that the tier step is large enough.
- **Also seen (reported, not registered):** gear removes knockouts in zone 3 (9 per hour without gear, 4.8 with Wood +0, 0 from Wood +1). The displayed estimator shows a larger tier cut (19%) than realised.

### 9.2 S3-E08 and H-S3-03 (first useful craft; p50 active minutes, identical at PR-NEW and PR-BAL)
| POL3-EQUIP | POL3-EARLY | POL3-PROF | POL3-COMBAT | POL3-BAL | POL3-CONQ | S2 control |
|---|---|---|---|---|---|---|
| 2.4 | 5.7 | 6.5 | 9.5 | 10.8 | never | never |

All ten crafting cells miss the 15–25 minute band (too early). The spread between replicates is small (p10–p90 within 0.3 min), because the first recruit (40 kills, about 2.1 min) and gathering are nearly deterministic.

### 9.3 S3-E04 and S3-E12 (combat against industry; investment)
| PR-BAL (60 min), means | Hero EXP | Legion EXP | Items crafted | Copper items | Hero damage share |
|---|---|---|---|---|---|
| S2 control / POL3-CONQ (no industry) | 44,426 | 175,044 | 0 | 0 | 19% |
| POL3-COMBAT (2 in industry after the roster is full) | 30,074 (−32%) | 61,216 (−65%) | 7 | 2 | 56% |
| POL3-BAL (2 in industry from joining) | 29,825 (−33%) | 59,357 (−66%) | 8 | 2 | 57% |
| POL3-PROF (3 in industry) | 16,161 (−64%) | 16,161 (−91%) | 10 | 5 | 100% |

- **POL3-CONQ equals the S2 control exactly** (same strategy without industry; a consistency check).
- **No-affinity control (O06):** POL3-BAL logs fall from 2,315 to 1,958 per hour without the Mage bonus, and nothing downstream changes (EXP within 0.02%), because logs are never the bottleneck.
- **S3-E12 design 1 (PR-OPT, 90 min):** every strategy is below POL3-CONQ on hero EXP (−30% to −80%), legion EXP (−65% to −90%) and gold (−31% to −82%); POL3-EARLY also loses a zone. **ORC3-SEARCH** (hindsight) chose POL3-CONQ at every decision for every objective: its runs are event-for-event identical to POL3-CONQ's (same run-log digests). Its fork budget (180) was used up after 30 decisions in every run, after which it keeps its plan. Ratios against the industry strategies: 1.4–10 (a lower bound on the gap, never an upper bound).
- **S3-E12 design 2 (matched mid-game start, 45 min):** the same order. POL3-COMBAT, POL3-EQUIP and POL3-BAL craft nothing in 45 minutes: their first build step is a Wood class weapon, which needs slime gel, a zone-1 drop; from a zone-2 start the hero never returns to zone 1, and the strategies pursue only their first pending step (a declared rule). POL3-EARLY returns to zone 1 for the gel (its earlier-zone rule) and crafts 5 items; POL3-PROF starts with tools (planks only) and crafts 3. This is the one case where earlier-zone farming helps.

### 9.4 S3-E09 (directions A–D and H; means, POL3-BAL, PR-BAL)
| Variant | Hero raw share | Hero effective share | Ability share (effective) | Hero overkill | Hero EXP vs control |
|---|---|---|---|---|---|
| control, passive / attentive | 56.8% / 64.1% | 56.0% / 60.3% | 0% / 13.3% | 22% / 37% | — |
| A base ×1.25 | 61.2% / 67.9% | 58.1% / 63.0% | 0% / 13.4% | 30% / 43% | +6.7% / +5.8% |
| A base ×1.5 | 62.5% / 70.2% | 60.3% / 65.6% | 0% / 13.9% | 30% / 46% | +19.5% / +14.7% |
| A base ×2.0 | 65.0% / 74.0% | 64.9% / 70.1% | 0% / 14.9% | 31% / 51% | +41.3% / +29.4% |
| B ability +100% | (passive unchanged) / 67.1% | — / 61.1% | — / 14.9% | — / 44% | 0% / +0.2% |
| B cooldown −50% | (passive unchanged) / 68.4% | — / 66.9% | — / 27.2% | — / 42% | 0% / +7.0% |
| C ×1.25, +50%, −25% | 61.2% / 70.6% | 58.1% / 64.7% | 0% / 19.2% | 30% / 48% | +6.7% / +11.3% |
| D hero weapon +100% | 60.9% / 67.9% | 58.2% / 62.8% | 0% / 13.1% | 29% / 43% | +5.7% / +3.0% |

- **Effective vs raw (H):** the hero's effective share is 1–6 points below its raw share: up to half of an attentive hero's raw damage is overkill (lethal-batch excess). Effective contributions summed exactly to the HP removed in every one of the 800 runs.
- **Combination (C)**, attentive, gives +11.3% hero EXP, about the sum of its parts (A ×1.25 alone +5.8%, the cooldown change alone +7.0%, the multiplier alone +0.2%); passive, it equals A ×1.25 alone.

### 9.5 S3-E10 (pacing levers, each alone; p50 change against the control)
EXP curve a = 8 / 12 / p = 1.8: level 10 at −16% / +21% / +39%; zone-2 enemy HP ×1.25: level 10 +9%, zone 3 +9%; zone-3 enemy HP ×1.25: hero EXP −15%; kill gate 1 at 75 / 125: zone 2 −16% / +16%; kill gate 2 at 90 / 150: zone 3 −12% / +12%; first-recruit quest 20 / 60 kills: first recruit −43% / +40%; equipment cost ×0.5 / ×2: no change beyond 1.3%. Full table: analysis.txt.

### 9.6 S3-E02, E03 and E07 (queues and materials)
- **Queue contention (deterministic; 3 identical replicates):** units per hour are identical across arms (set by the smiths). FIFO completes the first job earliest; round-robin finishes all jobs within 0.05–0.25 min of each other but the first one later; reserve-all holds 1.4–2.8 units of inputs on average (FIFO 0.26–0.51) and adds shortage time (e.g. 4.55 against 2.58 min with two smiths and four jobs).
- **Shortage timelines:** a job pauses and resumes automatically at each covering deposit (37 pauses with one plain woodcutter, 18 with a Mage, none with two woodcutters).
- **Old-material demand (S3-E07):** after the first Copper item no Wood-tier material is consumed in any strategy (planks 0, gel 0), while gatherers keep collecting 3,500–4,500 more logs per run: earlier materials have no further use in the S3 slice.

### 9.7 Deviations from the registration
- **S3-E12 search cells** ran all 100 replicates, not the first 10 named in PREREGISTRATION.md §3 (the runner applies the manifest's replicate count to every cell). More runs than registered, none fewer; reported as run.
- **S3-E11** was not informative under its registered rule, so amendment 01 was registered before the widened matrix ran (AMENDMENT-01.md); its pre-stated rule for a second failure was applied.
- No target, threshold or manifest changed after any result.

## 10. Engineering checks
| Check | Result | Detail |
|---|---|---|
| Type check | **pass** | strict (typecheck.txt) |
| Default tests | **1,063 / 1,063** | 38 new S3 tests (s3.industry 37, s3.conservation 1) plus the fixture conformance cases; every earlier test unchanged except the two S1.1 estimator tests updated for v1.3 and one new v1.3 test (test-output.txt) |
| Statistical tests | **9 / 9** | unchanged suite (test-stats-output.txt) |
| Fixtures | **404 cases, 0 problems** | 48 new: industry-rules 21, equipment-ops 15, production-queue 12; estimator.v1.json updated for v1.3 (fixtures-check.txt) |
| Independent oracles | **18 groups, 0 failing** | new group: S3 families (s3_oracle.py, including a discrete-event model of the queue) (oracle-check.txt) |
| Schemas | **3 / 3 in sync** | the fixture schema gains three family names (schemas-check.txt) |
| Planted bugs | **22 / 22 detected** | every file restored and re-hashed; W21 (a cancelled reserve-all job keeps its reservations) was missed at first: the case `s3.queue.reserve-all.cancel-held.001` and a test were added, and all 22 were re-run (mutation-check-s3.txt) |
| `exp3 --verify` | **11 / 11 MATCH** | every S3 experiment re-run and compared with its stored fingerprint (followup-run.txt) |
| Determinism | **pass** | S3-E08: re-run event logs and fingerprint identical; a second seed root changes all 1,300 run logs; 0 of 104 KS tests reject equal distributions (experiments/S3-E08-first-useful-craft/determinism.json) |
| Reference ledger | **identical** | S3-E04 fingerprint identical on both ledgers; S3-E01 500 / 500 sequences identical; 18 / 18 measured campaigns identical balances |
| S2 control | **identical** | with the switch off, and on without S3 activity, the event log equals S2's (tests); every historical experiment re-verified with the final code (historical-regression-final.txt) : **19 / 19 MATCH** (S1.1 7; S2 10 against the S2.1 baseline in evidence/s2.1/experiments/audit; S2.1-E02 against its v1.3 re-run and S2.1-E03 against results/s2.1) |
| S3-E01 conservation | **0 violations** | 10,000 sequences, 400,000 commands, 178,614,774 checks (S3-E01-conservation.json) |
| S3-E06 recycle loops | **0 breaks** | 15,210 states to depth 4 from three stocks (S3-E06-recycle.json) |
| Registration | **13 / 13 unchanged** | plan, 10 manifests, amendment 01 and its document (registration-check.txt) |
| Preservation | **unchanged** | no tracked file of earlier evidence, manifests or content changed against `s2-checkpoint`; the one changed earlier fixture is the intended estimator v1.3 case (preservation-check.txt) |
| Frozen simulator, archive, old workspace | **unchanged** | M0 fingerprint `1275f219…ce64d`; HEAD `74499ef`; 12 Original v1 files; archive refs unchanged; the old workspace's 16 recorded files identical (only the editor's `sourcemap.json` added, as at the S2 checkpoint) (frozen-check.txt) |

**Files in evidence/s3/:** S3_EVIDENCE.md (this file); analysis.txt and analysis.json; experiments/ (every S3 result, each with semantic.json, fingerprint.txt, environment.json, report.md, quantiles.csv and sample event logs; reference-ledger/); estimator-v1.3-regression.txt and estimator-v1.3-rerun/; historical-regression-final.txt; experiments-run.txt and followup-run.txt (run logs); S3-E01-conservation.json; S3-E06-recycle.json and .txt; l2-measurements.txt; mutation-check-s3.txt; test-output.txt, test-stats-output.txt, typecheck.txt, fixtures-check.txt, schemas-check.txt, oracle-check.txt; registration-check.txt, preservation-check.txt, frozen-check.txt, git-status.txt; s3-vs-s2-checkpoint.patch (the complete change against the S2 checkpoint, evidence excluded, local paths redacted); tool-versions.txt.

## 11. Decisions for the owner
1. **Pacing of industry against combat.** In this content, investing recruits in industry never pays back within a 90-minute session (§9.3). Options to test in a later increment, none recommended: stronger gear steps (a Copper cut of at least 25%, H-S3-02), gear that changes what a squad can farm (zones or bosses it cannot otherwise survive), lower gathering yields so that gatherers are scarce, or gear that is useful longer. Full personal squad EXP was not reduced (owner §3).
2. **First useful craft** comes at 2–11 minutes, before the 15–25 minute band (R04.20). Keep the band and slow the first craft, or revisit the band.
3. **The Copper step** (13% in zone 3) is below the 25% candidate target; one enhancement level gives half a tier.
4. **Gathering yields** are about 70–120 times what the smiths consume (logs gathered against logs turned into planks); the O06 affinity strength therefore has no effect. Revisit node yields, smith throughput or recipe costs together.
5. **Hero power (A–D):** base attack is the strongest single lever; ability variants reward attentive play only. No direction is recommended.
6. **Knockouts** remain rare even in the widened matrix; decide whether knockout pressure is wanted in W1 at all.
7. **Rules proposed during implementation** (S3-R21 … R28 in S3_RESOLUTIONS.md) and the six POL3 strategies need the owner's review.

## 12. Limitations
- Wood and Copper only; zones 1–3; one profession action per node type; no offline settlement (all work stops at a session end).
- The strategies are fixed, declared rules; a human may play differently. They pursue only the first pending build step, so a missing enemy drop blocks the whole build (seen from the matched mid-game start, §9.3). The hindsight search covers only the six strategies, and its fork budget runs out after 30 decisions.
- TTK is measured in whole swing batches; at the measurement floor (zone 2) gear differences disappear.
- The squad and worker estimators do not include equipment beyond its stats (they are the S2 estimators on the equipped stats).
- Results are model outputs from candidate content; no value is approved.

## 13. Package
- **Review package:** `Documents/Legion-Reviews/legion-S3-review-2026-11-14.zip`, built from the repository working tree (HEAD `s2-checkpoint` plus the uncommitted S3 work), excluding `.git/`, `node_modules/`, `legion-progression-lab/results/` (copies are in `evidence/*/experiments/`) and `__pycache__/`. Every file is listed with its SHA-256 and size in `MANIFEST.txt` inside the ZIP.
- **The ZIP's own SHA-256, file count and fresh-extraction check** (offline install and suites run from the extracted copy) are in `legion-S3-review-2026-11-14.verification.txt` beside the ZIP; the hash cannot be written inside the ZIP itself.
- **Start here:** this file, then `planning/S3_SPECIFICATION.md`, `planning/S3_RESOLUTIONS.md`, `manifests/s3/PREREGISTRATION.md` and `AMENDMENT-01.md`, `analysis.txt`.
- **Not done (as instructed):** no commit of S3, no push, no S4, no deletion of old workspaces.
