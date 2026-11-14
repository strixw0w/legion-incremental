# S2 — owner resolutions

**Version 1.0, 2026-11-13.** Source: the owner's "Independent L1/S2 Review and S2.1 Authorisation" §5–§7. This document records the owner's decisions on the proposed rules in `S2_RESOLUTIONS.md` v1.0, which stays unchanged as the historical proposal.

**Status of numbers:** no numerical coefficient is promoted to approved content. Every value named below stays a candidate in `content/w1-slice-s2.candidate.v0.2.0.json`, unless stated otherwise.

## 1. S2-R01 … R20

| ID | Owner decision | Approved structure | Still candidate |
|---|---|---|---|
| R01 | Approved | Stable character identities, never reused | — |
| R02 | Approved | First-recruit quest structure | The 40-kill value |
| R03 | Approved | Progression-unlocked productive slots | Exact milestones |
| R04 | Approved | Gold recruit purchases | Costs |
| R05 | Approved | One to three deployed recruits in World 1 | Milestones. **Final W1 target:** six productive recruits plus the hero |
| R06 | Approved as candidate | Hero class selection at level 5 | The level |
| R07 | Approved | A class change keeps overall combat level, HP fraction, independent mastery and saved class talent builds. **In the game, class changes happen through the appropriate trainer** (see §2) | Costs |
| R08 | Approved | Mastery is earned from eligible EXP while genuinely holding the class. Separate mastery requirements may be investigated later | — |
| R09 | Approved | Records: the historical maximum qualifying mastery per class across owned characters, reserve included. **Bonuses are applied in S4, not S2** | — |
| R10 | Approved | Per-class talent allocations and free respec. **Town-respec rules are preserved** | Talent strengths, caps, point progression, cooldowns |
| R11 | Approved only as experimental candidate content | Class modifiers | All values |
| R12 | Approved | Class ability structure | Coefficients and cooldowns |
| R13 | Approved as initial PvE behaviour | Warrior-first threat order | Final tank balance (provisional) |
| R14 | Approved | Temporary knockout and recovery, with no permanent losses | Recovery durations |
| R15 | Approved | Full individual EXP for eligible encounter participants; a knockout in the killing batch remains eligible | — |
| R16 | Approved | Immediate departure from deployed combat; joining from the next engagement | — |
| R17 | Approved, with conditions | Independent workers, **subject to the access and visited prerequisites (D-01) and the estimator corrections** (implemented in S2.1) | Recovery and stop thresholds |
| R18 | Approved | Ordinary assignment changes cancel stale work. Loadout changes during encounters are refused. **Reserve swaps happen outside encounters**, as previously approved (enforced in S2.1) | — |
| R19 | Approved as diagnostic behaviours | Passive and attentive policies. **They are not observed human behaviour** | — |
| R20 | Approved | Unique named heroes share ordinary productive capacity; the reserve retains progress | Duplicate reward quantity and resource |

## 2. Further resolutions
1. **Class change and respec in the game.** These are trainer- and town-based interactions. The lab's headless approximation is an instant command, accepted only outside an encounter, with no travel to a trainer or town. Its costs and cooldowns are candidates. Results that depend on how often players change class or respec (for example S2-E04) are bounded by this approximation.
2. **Recruit regeneration and worker between-fight healing are candidates.** The S2 engine currently differs between the two:
   - deployed recruits regenerate with the hero between fights, at the hero's rate per second of their own maximum HP, rounded down, at least 1;
   - workers do not regenerate between fights; they recover fully only after a knockout.

   Neither behaviour is treated as final.
3. **Recovery timers and reconnects.** When S5 introduces persistence, recovery timers must not be resettable to the player's advantage by repeated reconnects. In S2 a knocked-out character recovers at the next session start (no offline time exists); S5 must replace this rule.
4. **Ability cancellation and cooldowns** (documented behaviour, S2 engine):
   - a recruit's or worker's ability is cast automatically whenever it is ready and the character is in a fight; its cooldown starts at the cast;
   - the hero's ability cooldown starts when the command is accepted; the cast resolves as a blow in the next pass at the same moment, and is lost (cooldown still spent) if the encounter ends first;
   - a character that leaves the squad, is reassigned, is knocked out or whose session ends has its pending casts cancelled; the cooldown is not refunded and not reset;
   - cooldowns persist across fights and sessions.
5. **The hero damage-share band** (30–60%, R02.03 as proposed) is a **candidate balance target, not an immutable gameplay rule**.
6. **Hero damage should remain relevant** as deployment capacity increases (S3 directions A–C, H).

## 3. L1 direction (owner §6)
- The persistent AVL ledger is accepted, subject to the reconstruction fix (S2.1) and its verification.
- Once that passes, it may be used for S2.1 and later large simulation experiments.
- The reference ledger is kept for differential tests and historical controls.
- Full-history semantics stay. No bounded history or batching yet. Replay and conflict contracts stay.
- L2 is still to be planned before the S5 long-duration offline experiments.
- **Recorded unresolved limits:** month-scale memory (W-month exceeds the 2 GiB budget) and serialization size (a single string above about W-week exceeds the V8 limit).

## 4. Balance decisions (owner §7)
- **No retuning in S2.1.** The S1 and S2 candidate content is preserved.
- **Findings acknowledged:**
  - first recruit timing is promising;
  - the hero damage share is too low in several passive configurations;
  - early squad progression is substantially faster than the proposed full-game pacing;
  - full squads dominate total combat EXP;
  - mixed squads produce the most gold in the tested campaigns;
  - independent combat worker strategies must be reassessed after the visitation correction;
  - S2-E07 was uninformative (no knockouts);
  - ORC2-SEARCH is not an upper bound.
- **Full individual squad EXP is an approved mechanic.** It must not be reduced merely because it accelerates progression.
- Enemy HP must not be raised everywhere to force a pacing result.
- **S3 directions** are prepared in `planning/S3_EXPERIMENT_DIRECTIONS.md`. Not implemented; S3 needs separate authorisation.
