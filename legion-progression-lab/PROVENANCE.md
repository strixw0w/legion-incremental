# Provenance

## Code copied from elsewhere
**None.** No source file, function or test was copied from the frozen baseline simulator or from any third-party project. Every file in this lab was written new for Legion in S0 and S0.1 (13 November 2026).

## Ideas reused from the owner's frozen baseline simulator
Source: the owner's private `progression-lab/` repository, commit `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` (frozen, unmodified; see `planning/M0_REPOSITORY_VERIFICATION.md`). Licence: the owner's own private code. Only the ideas below were reused, each re-implemented from scratch.

| Idea | Where it was in the frozen lab | Where it is here | Change |
|---|---|---|---|
| Label every number by origin; a result is never more trustworthy than its weakest input | `src/data/provenance.ts` | `src/core/content/labels.ts` | New label set: `approved/target/candidate/derived` |
| Canonical (key-sorted) JSON with SHA-256 fingerprints | `src/experiments/hash.ts` | `src/core/hash/canonicalJson.ts` | Uses `node:crypto` instead of a hand-written SHA-256. Stricter (ASCII keys, rejects non-finite numbers, sparse arrays, undefined). Semantic and environment records separated. |
| Pre-registered targets; report the closest candidate, never move targets | `experiments/increment6_design_decisions.md` (uncommitted, now archived) | `planning/M0_EXPERIMENT_PLAN.md` | Engineering gates separated from balance targets |
| Integer hits-to-kill breakpoints | `src/sim/combat.ts` | `src/core/formulas/combat.ts` | Integer damage per hit removes the need for a rounding tolerance |
| One reason code per refusal | `README.md`, `src/sim/types.ts` | `src/core/errors.ts` | Stable error codes |
| "Unlocking is not reaching" (measure first visit) | `experiments/increment6_findings.md` | Experiment plan N-11; S1 metrics `zone*UnlockMin` vs `zone*FirstVisitMin` | — |
| Zone audit with forks (matched state, per-zone alternatives) | Frozen lab "fork" idea, as named in experiment plan §4 | `src/experiments/jobs.ts` (audit), S1-E03 | Re-implemented on the S1 engine; estimate vs fork agreement tag |

## Third-party material deliberately excluded
- **IdleOn data and code:** no IdleOn data, numbers, names or assets, and no IdleOn Toolbox (GPL-3.0) code.
- **Community data:** no community calculator formulas, and no DigitalTQ or Toolbox snapshots.

## Published algorithms used (implemented from their specifications)
- **xoshiro128** 1.1** (David Blackman and Sebastiano Vigna, public domain). Checked line by line against the reference `prng.di.unimi.it/xoshiro128starstar.c` on 13 Nov 2026.
- **SHA-256:** via `node:crypto` (lab) and Python `hashlib` (oracle).
- **RFC 8785 conventions** for canonical JSON (restricted subset; see `spec/formulas/canonical-json.md`).
- **Binary long multiplication with a running remainder** (S0.1 `mulDivRem`): the textbook shift-and-add method, written from its definition in `spec/formulas/numeric.md`. No library code was used.
- **S1:**
  - **Hash array mapped trie** (benchmark-only prototype `src/cli/bench/hamtLedger.ts`): the published data-structure idea (Bagwell, 2001), written from its description with an FNV-1a string hash and popcount. It is not used by the engine.
  - **Two-sample Kolmogorov–Smirnov statistic** with the standard asymptotic critical value c(0.001) = 1.949, and an **exact binomial acceptance interval** computed in log space. Both were written from their textbook definitions.
  - **Binary heap** event queue: textbook.
- **S1.1:**
  - **Absorbing Markov chain and renewal–reward rate** (estimator v1.1 survival chain): textbook expected-value recursions over "hits left", written from `spec/formulas/estimator.md` v1.1.
  - **Persistent (immutable, shared-tail) linked list** for the committed kill-credit history: textbook.

- **L1 (persistent ledger):**
  - **AVL tree** (Adelson-Velsky and Landis, 1962) with **path copying** for persistence (Driscoll, Sarnak, Sleator and Tarjan, "Making data structures persistent", 1989): textbook algorithms written from their definitions (`src/core/ledger/persistentMap.ts`). No library or project code was copied; the S1 HAMT prototype was not adopted.
  - **FNV-1a 32-bit** (Fowler, Noll, Vo; public domain) appears only in a test, to brute-force colliding keys and show the tree is unaffected by hash collisions.
- **S2 (legion engine):**
  - **No code copied.** The engine generalises this lab's own S1.1 stepper; the squad estimator is an expected-rate (renewal) approximation written from `planning/S2_SPECIFICATION.md` §9; the structural impossibility check is an elementary upper bound.
  - **ORC2-SEARCH** is a bounded rollout search (fork, simulate each candidate for a horizon, keep the best): a generic technique, written for this lab.
  - **The S2 oracle** (`spec/oracle/s2_oracle.py`) was written from `spec/formulas/s2-legion.md`, not from the TypeScript.

- **S2.1:**
  - **Exact conservation** uses JavaScript's built-in BigInt (arbitrary-precision integers).
  - **The ability-aware feasibility bound** is an elementary upper bound written for this lab.
  - No code was copied.

## Dependencies (exact versions; full tree in `package-lock.json`)
- **Runtime:** `zod` 4.6.7 (MIT).
- **Development:** `typescript` 7.0.2 (Apache-2.0), `vitest` 4.1.12 (MIT), `fast-check` 4.10.2 (MIT), `@types/node` 24.19.2 (MIT).
- **Installed tree:** 102 packages; licence counts are in `evidence/s0/`. The MPL-2.0 packages are vitest's bundled CSS tooling, which the lab never uses.
- **Oracles:** the Python standard library only.
