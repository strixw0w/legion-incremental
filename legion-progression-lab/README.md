# legion-progression-lab

The Legion Incremental progression lab: a calculator, without a screen, that will play out hypothetical players' progress so balance ideas can be tested before they reach Roblox. It is deterministic (same inputs, same answers), and every number carries a label saying where it came from.

**Current increment: S0 with the S0.1 hardening corrections** (numeric building blocks only). There is no gameplay simulation yet; that starts at S1, which needs the owner's approval. Every coefficient is `candidate`, which means invented for testing and not approved.

## What S0 contains

| Module | What it does | Spec |
|---|---|---|
| `src/core/numeric/` | Exact whole-number maths (including exact multiply-then-divide), corrected rounding, basis points, exact remainder accounting | `spec/formulas/numeric.md`, `remainder.md` v2, `units.md` |
| `src/core/arrays.ts` | Checks that arrays passed in from outside have no missing entries | — |
| `src/core/rng/` | xoshiro128** generator, SHA-256 stream seeding, yes/no rolls, fair integer rolls | `spec/formulas/rng.md` |
| `src/core/formulas/` | EXP tables and level-ups, stat stacking, hit chance, mitigation, crit, exact damage, hits-to-kill | `xp.md` v2, `stats.md` v2, `combat.md` v2 |
| `src/core/ledger/` | Atomic, idempotent resource ledger with read-only history | `ledger.md` |
| `src/core/hash/` | Canonical JSON and SHA-256 fingerprints | `canonical-json.md` |
| `src/core/content/` | Content labels, schemas, validation | `units.md` |
| `src/spec/` | Fixture format, fixture runner, schema export | — |
| `src/report/` | S0-R01 candidate EXP curve inspection report | — |
| `src/cli/` | Command-line entry points. The only place with file I/O. | — |
| `content/` | Candidate content pack and the integer XP table artifact | — |

## Commands

Use the pinned Node 24.22.3. In PowerShell, put it first on PATH for the session:

```
$env:Path = "$env:LOCALAPPDATA\legion-tools\node-v24.22.3-win-x64;" + $env:Path
cd legion-progression-lab
npm ci                  # install the exact locked versions
npm run typecheck       # type-check everything
npm test                # all non-statistical tests
npm run test:stats      # statistical tests (fixed seeds, alpha = 0.001)
npm run fixtures:check  # run every spec/fixtures case through the lab
npm run oracle:check    # independent Python checks (needs Python 3 on PATH)
npm run schemas:check   # exported JSON Schemas match the zod source
npm run xp:build        # rebuild the XP table artifact from the content pack
npm run curve:preview   # S0-R01 report; prints the semantic fingerprint
```

If PowerShell refuses to run `npm`, use `npm.cmd`.

## Rules this lab follows

- **Isolated:** it never reads or imports anything from the frozen `progression-lab/` baseline. A test enforces this.
- **Pure core:** `src/core`, `src/spec` and `src/report` never use the clock, ambient randomness, the process or files. A test enforces this.
- **No silent clamping:** a number that would overflow or become invalid is refused with a named error.
- **Independent checks:** expected test answers come from hand derivations or from the Python checkers in `spec/oracle/`, never from this code.
- **Labels:** results are labelled. Nothing here is a validated pacing claim; real validation comes from Roblox playtests (M7).

Plans and decisions: `planning/`. Evidence for review: `evidence/s0/` (S0) and `evidence/s0.1/` (S0.1 corrections).
