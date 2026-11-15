# spec/ — engine-neutral contracts for Legion Incremental

This folder holds **data and prose only**. It is shared by the TypeScript progression lab (`legion-progression-lab/`) and, from M2, by the Roblox Luau game. Neither engine's code lives here, and neither engine imports the other's code. Both are checked against the same written rules and the same test cases.

| Folder | Contents |
|---|---|
| `formulas/` | One Markdown spec per formula family, versioned (`## v1`) |
| `schema/` | JSON Schemas exported from the lab's zod schemas. They are documentation for other engines; zod stays authoritative. |
| `fixtures/` | Test cases with independently derived expected values (JSON) |
| `oracle/` | Small independent checker scripts (Python standard library only, run with `python -I`). They derive or verify fixture values from the specs. They are never imported by either engine. |
| `content/` | Owner-approved content packs. Empty until S7 promotes a baseline; S0 candidate content lives in the lab. |

**Rules**
1. **Independence.** Fixture expectations come from hand derivations or from `oracle/` scripts written from these specs, never from running the code under test. Every case states its `derivation`. Limitation: the oracles and the lab were written by the same author (Claude) in different languages, so reviewers should spot-check derivations.
2. **Versioning.** Changing the meaning of a formula bumps its spec version. Changing an expected value bumps the fixture version, with a line in `legion-progression-lab/CHANGELOG.md`.
3. **Status.** Everything here is `candidate` until the owner approves it (`legion-progression-lab/planning/M0_RESOLUTION.md`).

**Formula specs (current versions; S1 additions at the bottom):**
| Spec | Version | Fixture file (fixture version) |
|---|---|---|
| [units.md](formulas/units.md): units, suffixes, labels and content validation | v1 | `content.v1.json` (1) |
| [numeric.md](formulas/numeric.md): safe integers, rounding, `mulDivRem` | v1 (S0.1 added `mulDivRem`) | `numeric.v1.json` (2) |
| [remainder.md](formulas/remainder.md): exact remainder accounting | **v2** | `remainder.v2.json` (2) |
| [rng.md](formulas/rng.md): random numbers | v1 (S0.1 state boundary) | `rng.v1.json` (2) |
| [xp.md](formulas/xp.md): EXP thresholds and awards | **v2** | `xp.v2.json` (2) |
| [stats.md](formulas/stats.md): stat stacking | **v2** | `stats.v2.json` (2) |
| [combat.md](formulas/combat.md): combat primitives, attack quantisation (S1) | **v2** | `combat.v2.json` (3) |
| [ledger.md](formulas/ledger.md): resource ledger | v1 (S0.1 immutability boundary) | `ledger.v1.json` (1) |
| [canonical-json.md](formulas/canonical-json.md): canonical JSON and fingerprints | v1 | `canonical-json.v1.json` (1) |
| [s1-combat-loop.md](formulas/s1-combat-loop.md): S1 event queue, combat loop, sessions, kill credit | **v1.1** (S1.1: identity-checked credit, combined triggers, auto-farm off, regeneration, structured drops) | `combat-loop.v1.json` (1), `rewards.v1.json` (2), `credits.v1.json` (1) |
| [gates.md](formulas/gates.md): zone flags, kill gates, travel, commands, miniboss stub | **v1.1** (S1.1: `Report`, auto-farm off) | `gates.v1.json` (2) |
| [estimator.md](formulas/estimator.md): displayed farming-rate estimator | **v1.3** (S3 entry: an exhausted budget is "unresolved" with no forecast, never "unreachable"; v1.2 S1.1 addendum; v1.1 the first written version) | `estimator.v1.json` (3) |
| [s2-legion.md](formulas/s2-legion.md): S2 legion stats, squad fights, credit, worker feasibility | v1.1 (S2.1) | `squad-fight.v1.json`, `legion-credit.v1.json`, `worker-feasibility.v1.json` |
| [s4-permanent.md](formulas/s4-permanent.md): S4 Monument tables, purchases and Buy Max, permanent bonus pools, rewards and counters; v1.1: the S4 acceptance corrections (checked counters, effective bonus metadata, the regional mastery rank) | **v1.1** (S4 acceptance) | `permanent-rules.v1.json`, `permanent-acceptance.v1.json` (2) |
| [s3-industry.md](formulas/s3-industry.md): S3 professions, gathering, equipment, production queue, effective damage | **v1.2** (S3.1: crafting eligibility, recipe validation, fractional attribution; S3 acceptance addendum: a dead hero cannot craft) | `industry-rules.v1.json` (2), `equipment-ops.v1.json` (1), `production-queue.v1.json` (1), `recipe-validation.v1.json` (1) |

**File naming:**
- A fixture file is named after the spec version it tests (`<family>.v<spec version>.json`). Its `fixtureVersion` counts changes to that family's cases across versions.
- A minor spec revision (S1.1's `v1.1`) keeps the major-version file name; the fixture's `specRef` names the exact version (`#v1.1`).
- Each family has exactly one current file. `oracle/check_all.py` and the lab's conformance test refuse a second one.
- Superseded files are not kept here; the S0 review package holds them.
