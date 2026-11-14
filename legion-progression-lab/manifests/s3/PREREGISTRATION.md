# S3 pre-registration

**Version 1.0, 2026-11-14.** Registered before any S3 experiment ran (manifests/s3/preregistration.json holds the SHA-256 of this document and of every manifest). Owner: "Final L1/S2.1 Acceptance and S3 Authorisation" §8–§10.

**Labels.** Every input number is a `candidate` (content/w1-slice-s3.candidate.v0.3.0.json, S3_RESOLUTIONS.md). Every output is a `model-output`. Nothing is approved or live-validated. Engineering gates are separate from candidate balance targets, and **no target moves after results**.

**Disclosure.** While the POL3 strategies were being debugged, single development probes (seed `probe#rep-0`, 60 min, six strategies) were run before this registration. They are not evidence and are not reported as results. An engineering smoke run (one replicate of every manifest cell, search cells excluded, checking only that each cell runs and that the monitor reports no violation; seed `smoke#rep-0`) was also run before registration; its outcomes were not inspected beyond those two checks. The H-S3-03 band (15–25 active minutes) was fixed by the M0 plan (R04.20) before S3 began and is unchanged.

## 1. Order (owner §8)
1. Correctness: S3-E01 (conservation), S3-E06 (recycle loops), S3-E02/E03 (queues), with the monitor in every run.
2. Tiers and enhancement: S3-E05.
3. First useful craft: S3-E08.
4. Combat against industry: S3-E04 (and old-material demand, S3-E07).
5. Hero damage: S3-E09 (directions A–D and H).
6. Pacing: S3-E10 (direction E).
7. Knockouts: S3-E11 (direction F).
8. Combined configurations: S3-E12 (direction G, both designs, with the hindsight search).

## 2. Policies
**POL3** (src/policy/industryRealistic.ts) = POL2 (unchanged) + a fixed, declared investment strategy. They see only the observation, keep no state between decisions, and import nothing from the engine.

| Policy | Strategy (owner §9) | Industry roles (recruit by acquisition order) | Build order (first steps) | Hero gathers | Other |
|---|---|---|---|---|---|
| POL3-COMBAT | combat-and-recruitment-first | 2: adaptive gatherer, 3: smith, only once no recruit can be bought | weapons for hero and squad, pickaxe, chests, Copper weapons | no | — |
| POL3-EQUIP | equipment-first | 1: smith, 2: woodcutter, from joining | full Wood set for the hero, then squad 1 | yes | enhance hero weapon, chest, squad-1 weapon to +3 |
| POL3-PROF | profession-and-tools-first | 1: woodcutter, 2: smith, 3: miner, from joining | Wood tools, hero weapon and chest, Copper tools, Copper hero gear | yes | — |
| POL3-BAL | balanced | 2: smith, 3: adaptive gatherer, from joining | hero weapon, hammer, squad-1 weapon, pickaxe, chests, Copper weapons | no | enhance weapons to +2, reserving gold for recruits |
| POL3-EARLY | earlier-zone material farming | as POL3-BAL | as POL3-BAL | yes | while steps are pending the hero farms an earlier zone (the zone of a missing enemy drop, else one below its furthest zone) |
| POL3-CONQ | conquest-focused | none | weapons (never reached without a smith) | no | the no-industry reference inside S3 |

Declared constants: hero gathering starts when the planned planks need at least 4 more logs than are held (`HERO_GATHER_MIN_LOG_NEED`); production queues one job per recipe for the shortfall of the next two build steps; Copper items consume the wearer's own lower-tier item (unequipped first) or a free inventory candidate; protected items are never touched.

**ORC3-SEARCH** (src/policy/industrySearch.ts): ORC2's decision points, budgets and objectives with the six POL3 strategies as candidates. Labelled hindsight; never called an upper bound.

**Controls kept:** the S2 control (POL2-SQUAD-W with the industry switch off; identical to S2 on the S3 content, tested) in S3-E04 and S3-E08; the single-hero cells (squad size 0) in S3-E11; the no-affinity variant (O06) in S3-E04.

## 3. Experiments
| ID | Kind | Question | Manifest / tool |
|---|---|---|---|
| S3-E01 | engineering | conservation across 10,000 generated command sequences | `src/cli/s3-conservation.ts --sequences 10000 --seed s3-e01` |
| S3-E02 | queue | 2–4 jobs competing; FIFO vs reserve-all vs round-robin | S3-E02-queue-contention.json |
| S3-E03 | queue | shortage timelines | S3-E03-shortage-timelines.json |
| S3-E04 | campaign | gather vs fight allocation; affinity control | S3-E04-gather-vs-fight.json |
| S3-E05 | matched | tier step vs enhancement step (H-S3-02) | S3-E05-tier-step.json |
| S3-E06 | engineering | recycle loop search | `src/cli/s3-recycle.ts --depth 4` |
| S3-E07 | campaign | old-material demand after Copper | S3-E07-old-material-demand.json |
| S3-E08 | campaign | first useful craft (H-S3-03) | S3-E08-first-useful-craft.json |
| S3-E09 | campaign | hero damage: A, B, C, D and H | S3-E09-hero-damage.json |
| S3-E10 | campaign | pacing levers (E) | S3-E10-pacing-levers.json |
| S3-E11 | matched | knockout matrix (F) | S3-E11-knockout-matrix.json |
| S3-E12 | campaign + search | investment strategies, two designs (G) | S3-E12-investment.json |

**S3-E01 (fixed before running):** 10,000 sequences, seed root `s3-e01`; each sequence starts from a diagnostic state (3 recruits, zones 1–2 visited, materials and gold drawn from the sequence's seed, a few diagnostic items) and issues 40 random S3 and S2 commands (gather, stop, assign to any role, equip, unequip, transfer, auto-equip, protect, craft with any consume choice, enhance, salvage, enqueue, cancel, class change) at random times over a 30-minute session with auto-farm, then a session end and a second session. Valid and invalid commands are both issued. Gate: zero monitor violations (I1–I19), exact ledger reconstruction, no negative balance, and identical results for the reference and persistent ledgers on the first 500 sequences.

**S3-E06 (fixed before running):** from each of three fixed stocks, every sequence of up to 4 operations drawn from {craft any item recipe (any valid consume choice), salvage any item, enhance any item} is enumerated. Gate: no reachable state holds more of any material (or more gold) than the stock it started from.

## 4. Hypotheses and derived rules
| ID | Role | Statement | Where |
|---|---|---|---|
| H-S3-01 | engineering | No sequence creates or destroys materials except declared sources and sinks; monitor violations = 0 | every manifest; S3-E01 |
| H-S3-02 | candidate target (derived) | For each squad (Z2-L5, Z3-L10): `1 - TTK(copper+0) / TTK(wood+0) >= 0.25`, and `1 - TTK(wood+1) / TTK(wood+0) < 0.5 x (1 - TTK(copper+0) / TTK(wood+0))` (p50 medianTtkS) | S3-E05, computed by `src/cli/s3-analyse.ts` |
| H-S3-03 | candidate target | p50 first useful craft in [15, 25] active min, per POL3 cell | S3-E08 |
| H-S3-05 | diagnostic | a cell generates knockouts: p50 member KO/h >= 1 | S3-E11 |
| H-S3-10 | engineering | effective contributions sum exactly to the HP removed per kill | S3-E09 |

**Direction F rule:** the S3-E11 matrix is informative only if at least 50% of its cells with recruits generate knockouts; otherwise its range is widened by a registered amendment before any conclusion.

**Comparisons reported (no target):** S3-E04 and S3-E12 report each policy's mean against POL3-CONQ and the S2 control per metric; S3-E12 reports ORC3-SEARCH against each strategy (ratio, labelled a lower bound on the gap); S3-E09 reports each variant against the control, raw and effective; S3-E10 reports each lever's change against the control.

**Engineering gates (all manifests):** a `--verify` re-run matches every fingerprint; S3-E02 and S3-E03 replicates are identical (deterministic); S3-E08 passes a determinism re-run with a second seed root (`s3-e08-second`); S3-E04 gives the same fingerprint with the reference ledger. Runtime and memory are recorded in environment.json.

## 5. Observation, time and approximations (owner §10)
- Policies see only what the town menus show (src/engine/industryObservation.ts): profession levels and efficiencies, discovered nodes with requirements and displayed rates, items and loadouts with enhancement previews, recipes with availability, Smithing requirements and consume previews, jobs with states and shortage reasons, displayed unit times. Never random state or the event queue.
- Time categories: automated combat, manual combat, gathering (the hero; its own category), travelling, resting, waiting (dead or spawn), idle, offline. Crafting, equipping and enhancing are instant commands: counted, not timed. No category is "player input".
- Headless approximations: the hero's "interact once to auto-gather" is a `Gather` command at a node of its current zone; menus are instant; walking inside a zone to a node takes no time; a gathering action or production unit interrupted by any role, tool, travel or session change yields nothing (S3-R15).
