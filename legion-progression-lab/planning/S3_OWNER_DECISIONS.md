# S3 — owner decisions on open design items

**Version 1.0, 2026-11-14.** Source: the owner's "Final L1/S2.1 Acceptance and S3 Authorisation" §6. These decisions resolve open items of the Game Design Bible §18 and the M0 decision matrix. They are recorded here, separately from the original historical design register (`docs/DECISION_REGISTER.md`, unchanged).

## O06 — Profession affinities (resolves C-15)
- **Candidate affinities:**
  - Warrior → Mining;
  - Archer → Smithing;
  - Mage → Woodcutting.
- **All classes can train all professions.** An affinity is an efficiency bonus, never an eligibility restriction.
- **No affinity strength is approved.** The strength is a candidate.
- **S3 must include a no-affinity control**, and investigate whether the bonuses create useful choices or force predictable assignments.

## N-06 — Equipment traits
- In S3 and the initial slice, equipment statistics and any optional traits are **deterministic and recipe-defined**.
- Random enchanting stays a later-world system.
- **No random paid equipment, no paid luck, no rerolls.**

## O09 — Enhancement inheritance and salvage
- **Default S3 candidate:**
  - a consumed lower-tier item does **not** transfer its enhancement levels to the new item;
  - the resulting equipment and the consumed inputs are shown in an explicit preview;
  - players may keep earlier equipment and transfer it to other characters instead.
- **Variant:** partial enhancement inheritance (or compensation) is tested as a separate variant.
- **Salvage:**
  - returns a deterministic, partial quantity of declared recoverable materials; the rates are candidates;
  - enhancement, crafting and recycling must never form a net-positive resource cycle.
- **Protection:** equipped and favourite/protected items are never consumed or salvaged automatically. An explicit, user-controlled unequip or unprotect step is required first.

## O10 — Queues and reservation order (implements D-07)
- **Approved default:**
  - inputs are reserved one production unit at a time;
  - jobs take turns in deterministic FIFO order, by enqueue time, then stable job identity;
  - reserved work completes before its outputs are granted;
  - outputs are credited before new eligible work is evaluated;
  - a job pauses when ingredients are unavailable, and resumes automatically when they become available;
  - cancellation releases valid unconsumed reservations;
  - no duplication, and no negative balances.
- **Must be specified** (done in `S3_SPECIFICATION.md` §6):
  - how competing jobs share a resource pool;
  - how skipped jobs affect FIFO;
  - how completion and cancellation at the same timestamp interact.
- **Alternatives:** other reservation strategies are diagnostic experiment arms, not new default rules.
