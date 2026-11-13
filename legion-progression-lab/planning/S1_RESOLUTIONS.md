# S1 — proposed resolutions where the approved documents are silent

**Version 1.0, 2026-11-13. Status: proposed candidate rules. None is an approved design decision.**

> **S1.1 note (pointer only; the proposals below are unchanged):** the owner resolved S1-R01 … R17 after the independent S1 review. See `S1_OWNER_RESOLUTIONS.md` v1.0. S1-R09's window is specified as `(t − deathWindowMs, t]` in `S1_1_RESOLUTIONS.md` S1.1-R06.

Every rule below is needed to run a single-hero combat loop, but neither the Decision Register, the Bible, `M0_RESOLUTION.md` nor architecture v1.1 decides it. Following the S1 authorisation ("record the proposed resolution and its consequences; do not silently invent gameplay rules"), each one is written down, used consistently by the lab and the independent oracle, and listed here for the owner to confirm or replace.

| ID | Question | Proposed rule (candidate) | Why | Consequence if changed |
|---|---|---|---|---|
| S1-R01 | Where does a new profile start? | At zone 1's entrance checkpoint. Zone 1 is accessible, visited and its checkpoint discovered at t = 0. S1 has no town: the town has no function without shops, sinks or recruits. | No town feature exists in S1 scope | A town start adds one walk (candidate `townToZone1Ms`) before the first kill. It directly affects H-S1-01. |
| S1-R02 | How long until the first enemy after arriving in a zone or respawning? | `zoneEntryWalkMs` (candidate 8,000 ms) for the first engagement after a session start, zone arrival or respawn. Later engagements take `engageOverheadMs` (candidate 1,500 ms). | v1.0 plan inputs `firstTargetWalkMs` and `engageOverheadMs` | Shifts first-kill time and re-engagement after travel and death. The physical value is measured in M2. |
| S1-R03 | When is the first swing of an encounter? | At engagement arrival, unless the swing cooldown since the previous swing has not elapsed. The cooldown carries across encounters. | v1.0 §6.4 "first swing at engagement, TTK = (hits − 1) × interval" | TTK definitions and H-S1-08 ("TTK = 0 s first swing") depend on it. |
| S1-R04 | When does an enemy first attack? | `firstAttackDelayMs` after engagement arrival. Candidate value: the enemy's attack interval. | v1.0 schema field, no value given | Weak enemies killed within the delay never hurt the hero. This drives death rates in S1-E04. |
| S1-R05 | Can the hero dodge? | No. Enemy attacks always land, consume no random draws and are mitigated by defence. | No evasion stat is approved (R02.08 lists damage, HP, defence and accuracy only) | Adding evasion later changes survival, not damage dealt. |
| S1-R06 | Which enemy does auto-target pick? | The alive slot with the earliest `aliveSinceMs`; ties go to the lowest slot index. | R02.01 automatic targeting. All instances in a zone are identical. | Only spawn-limited timing can differ. No ID ordering is involved, so the metamorphic test holds. |
| S1-R07 | What happens to an enemy when its encounter ends without a kill? | It becomes available again at full HP. Its spawn age is unchanged. | Idle-game convention; no rule exists | Chip damage cannot be banked across deaths or travel. |
| S1-R08 | Where and how does the hero respawn? | At the current zone's entrance checkpoint, at full HP, after `respawnDelayMs`, with no loss. | R02.07, D-03 (respawn at checkpoint, no loss); the HP level is unstated | Respawning at partial HP would raise death loops (S1-E04). |
| S1-R09 | When does auto-farm stop after deaths? | When the deaths within the last `deathWindowMs` (inclusive of now) reach `stopAfterDeaths`. Candidate: 3 within 5 min. Reason `REPEATED_DEATHS`. | D-03 "repeated deaths stop automation"; numbers are candidates | Affects auto-farm downtime in S1-E04. |
| S1-R10 | What does a level-up do mid-work? | Stats are recomputed in RECOMPUTE at the same timestamp. Swings use the stats current when they resolve. Current HP rises by the max-HP gain (not a full heal). | Architecture §9.2 phase order; HP rule unstated | A full heal on level-up would reduce early deaths. |
| S1-R11 | When does the hero regenerate? | Only while `idle` or `resting`. The first tick comes `outOfCombatDelayMs` after the last combat contact, then a tick every second of `maxHp × regenBp / 10000`, using exact remainder accounting. It stops at max HP, and the remainder resets when interrupted. | v1.0 inputs; the mechanics are unstated | With the candidate 1.5 s re-engage overhead, a continuously farming hero never regenerates. Resting is a policy choice. |
| S1-R12 | Where is a zone's checkpoint? | At its entrance, one per zone, so the visit and the checkpoint discovery happen at the same arrival but stay separate flags. | D-01 requires separate flags; zone layout is unstated | Mid-zone checkpoints (later worlds) would separate the two times. |
| S1-R13 | Which zones can Travel reach? | Only adjacent zones (the W1 path is a line). Farther zones need several travels or a teleport to a discovered checkpoint. | R06.02 compact connected zones | Direct long-distance travel would shorten returns to earlier zones. |
| S1-R14 | What does a session boundary do to the hero? | `SessionEnded` closes everything and turns auto-farm off. Nothing happens offline (S5). At the next `SessionStarted`, a dead hero is respawned at the checkpoint, and cancelled travel leaves the hero at the origin. | Architecture §9.3 rule 3; S1 has no offline | Only multi-session profiles are affected. S1 experiments use single sessions. |
| S1-R15 | How does the boss stub reward and reset? | A clear credits the boss's candidate EXP and gold through the normal kill-credit transaction and completes the gate. A failure returns the hero to the zone 3 entrance with no loss, and the gate can be retried. The boss does not count towards zone kills. | R06.17; boss rewards unstated; R-A6 keeps it a prototype | The stub is not used in balance experiments, only in correctness tests. |
| S1-R16 | Which policy parameters are used? | POL-FRONTIER moves when the displayed TTK in the next zone is ≤ 6 s and the displayed kills per life (kills from full HP before death, if never resting) is ≥ 10, and rests below 30% HP. *(Changed from "displayed deaths/h ≤ 1" after an engineering smoke run and before any experiment was registered. Deaths/h assumes no resting, which this policy does, so the first version kept it in zone 1 for about 48 minutes.)* POL-BEST-SHOWN re-decides at gate unlock and level-up. ORC-BRUTE re-decides at gate unlock and every 5 active minutes. | Experiment plan §4 gives the behaviour; the thresholds are candidates | Policy comparisons (S1-E08) depend on these thresholds. |
| S1-R17 | How are profiles scheduled in S1? | PR-NEW: one 45-minute session (inside the 30–60 range). PR-BAL: one 60-minute session. PR-OPT: one 90-minute session. All sessions start at t = 0. | Experiment plan §3 ranges | Horizons beyond the session end are reported as not reached. |

**Not resolved by S1, and deliberately not modelled:**
- town services;
- sinks;
- equipment;
- abilities;
- recruits;
- offline;
- elites;
- accuracy requirements above 0;
- hero evasion;
- party play.

Each is a limitation in `S1_EVIDENCE.md`.
