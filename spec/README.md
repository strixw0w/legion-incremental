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

**Formula specs (current version after S0.1):**
| Spec | Version | Fixture file (fixture version) |
|---|---|---|
| [units.md](formulas/units.md): units, suffixes, labels and content validation | v1 | `content.v1.json` (1) |
| [numeric.md](formulas/numeric.md): safe integers, rounding, `mulDivRem` | v1 (S0.1 added `mulDivRem`) | `numeric.v1.json` (2) |
| [remainder.md](formulas/remainder.md): exact remainder accounting | **v2** | `remainder.v2.json` (2) |
| [rng.md](formulas/rng.md): random numbers | v1 (S0.1 state boundary) | `rng.v1.json` (2) |
| [xp.md](formulas/xp.md): EXP thresholds and awards | **v2** | `xp.v2.json` (2) |
| [stats.md](formulas/stats.md): stat stacking | **v2** | `stats.v2.json` (2) |
| [combat.md](formulas/combat.md): combat primitives | **v2** | `combat.v2.json` (2) |
| [ledger.md](formulas/ledger.md): resource ledger | v1 (S0.1 immutability boundary) | `ledger.v1.json` (1) |
| [canonical-json.md](formulas/canonical-json.md): canonical JSON and fingerprints | v1 | `canonical-json.v1.json` (1) |

**File naming:**
- A fixture file is named after the spec version it tests (`<family>.v<spec version>.json`). Its `fixtureVersion` counts changes to that family's cases across versions.
- Each family has exactly one current file. `oracle/check_all.py` and the lab's conformance test refuse a second one.
- Superseded files are not kept here; the S0 review package holds them.
