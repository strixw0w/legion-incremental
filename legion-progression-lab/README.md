# legion-progression-lab

The Legion Incremental progression lab: a calculator, without a screen, that will play out hypothetical players' progress so balance ideas can be tested before they reach Roblox. It is deterministic (same inputs, same answers), and every number carries a label saying where it came from.

**Accepted checkpoints: S1** (`s1-checkpoint`) and **S2** (`s2-checkpoint`, commit `732f3da`: L1, S2 and the S2.1 acceptance pass; `evidence/s2-checkpoint/`). L1 adds a structurally shared persistent ledger (`evidence/l1/L1_REPORT.md`). S2 adds the legion: recruits, squads, classes, mastery, talents, abilities, knockouts and independent workers (`evidence/s2/S2_EVIDENCE.md`, `evidence/s2.1/S2_1_EVIDENCE.md`). **Accepted checkpoint S3** (`s3-checkpoint`): S3, professions, gathering, equipment, crafting and the production queue behind an `industry` switch (`evidence/s3/S3_EVIDENCE.md`), with S3.1, its corrections and economic calibration (`evidence/s3.1/S3_1_EVIDENCE.md`), and the acceptance addendum (`evidence/s3-acceptance/ADDENDUM.md`; `planning/S3_ACCEPTANCE_RESOLUTION.md`). **Accepted: S4** (`s4-checkpoint`, commit `dc39492`), permanent progression (Monuments, Bestiary, Feats, class and roster bonuses) behind a `permanent` switch (`evidence/s4/S4_EVIDENCE.md`), with three acceptance corrections (`evidence/s4-acceptance/ADDENDUM.md`; `planning/S4_ACCEPTANCE_RESOLUTION.md`).

Every coefficient is `candidate`, which means invented for testing and not approved. Every result is model output, not live-validated.

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
| `src/model/` | S1 content pack schema and compilation; state, event, command and observation types | `s1-combat-loop.md`, `gates.md` |
| `src/engine/` | S1 reference stepper (event queue, simultaneous blows, stale events, sessions, kill credit, gates), command validation, observation; identity-checked kill credit (`credit.ts`); rate estimator v1.1 (`estimator.ts`); the S1 estimator kept as a diagnostic control (`estimator-s1.ts`) | `s1-combat-loop.md` v1.1, `gates.md` v1.1, `estimator.md` v1.1 |
| `src/policy/` | Realistic policies with S1.1 recovery rules (POL-STAY, POL-FRONTIER, POL-BEST-SHOWN, POL-FIXED-n); the S1 logic as diagnostic controls (CTL-*-S1); the comparison oracle ORC-BRUTE (a restricted lookahead, not an upper bound) | experiment plan §4; `planning/S1_1_RESOLUTIONS.md` |
| `src/experiments/` | Manifests, jobs, metrics (drop events and quantities, reconciled with the ledger), quantiles, summaries and reports | experiment plan §6 |
| `content/` | Candidate content packs (S0 core, S1 W1 slice) and integer XP table artifacts | — |
| `manifests/s1/` | S1 manifests and hash register (historical; run by the S1 implementation only) | — |
| `manifests/s1.1/` | Pre-registered S1.1 regression and experiment plan, manifests and hash register | — |
| `manifests/s2/` | Pre-registered S2 plan, manifests and hash register | `planning/S2_SPECIFICATION.md` |
| `manifests/s3/` | Pre-registered S3 plan, manifests, amendment 01 and hash register | `planning/S3_SPECIFICATION.md` |
| `manifests/s3.1/` | Pre-registered S3.1 plan, manifests, amendment 01 and hash register | `planning/S3_1_RESOLUTIONS.md` |
| `manifests/s4/` | Pre-registered S4 plan, manifests, amendment 01 and hash register | `planning/S4_SPECIFICATION.md` |
| `repro/s1.1/` | Defect reproductions, run against the original S1 package or this tree (`defects.mjs`), and the pre-registered analyses (`analyse.py`) | — |

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
npm run exp -- manifests/s1.1/S1.1-E01-base-attribution.json        # run a pre-registered S1.1 experiment
npm run exp:verify -- manifests/s1.1/S1.1-E01-base-attribution.json # re-run and compare the semantic fingerprint
npm run bench:ledger    # staged ledger benchmark (budgets in manifests/s1/PREREGISTRATION.md)
node repro/s1.1/defects.mjs .          # S1.1 defect reproductions against this tree (or pass the S1 package's lab folder)
python -I repro/s1.1/analyse.py .      # S1.1 pre-registered analyses A1-A8
node src/cli/exp2.ts manifests/s2/S2-E05-squad-vs-workers.json            # run a pre-registered S2 experiment (L1 ledger)
node src/cli/exp2.ts manifests/s2/S2-E05-squad-vs-workers.json --verify   # re-run and compare the fingerprint
node src/cli/s2-analyse.ts             # S2 pre-registered analyses B0-B6
node src/cli/exp3.ts manifests/s3/S3-E08-first-useful-craft.json          # run a pre-registered S3 experiment
node src/cli/exp3.ts manifests/s3/S3-E08-first-useful-craft.json --verify # re-run and compare the fingerprint
node src/cli/s3-conservation.ts --sequences 10000 --seed s3-e01            # S3-E01 conservation property run
node src/cli/s3-recycle.ts --depth 4   # S3-E06 recycle loop search
node src/cli/s3-analyse.ts             # S3 registered rules and comparisons
node src/cli/exp3.ts manifests/s3.1/S3.1-E02-policy-capacity.json        # run a pre-registered S3.1 experiment
node repro/s3.1/defects.mjs .          # the S3 review findings against this tree (or the S3 package's lab folder)
node src/cli/s31-analyse.ts            # S3.1 registered rules and comparisons
node src/cli/exp4.ts manifests/s4/S4-E06-investment.json             # run a pre-registered S4 experiment
node src/cli/s4-engineering.ts --experiment E05 --n 5000 --seed s4-e05   # S4-E01 / E02 / E05 engineering checks
node src/cli/s4-analyse.ts             # S4 registered rules and comparisons
node src/cli/l2-run.ts manifests/l2.1/L2.1-E01-differential.json --out evidence/l2.1/experiments/L2.1-E01-differential.json   # L2.1 (E04: add --expose-gc); L2 manifests are reproduced from the L2 package
python -I repro/l2.1/history_cache.py . <L2 review zip> <node dir>   # which historical experiments are exact cache hits
python -I repro/s3.1/attribution_check.py . <node dir> <scratch dir>   # S3 regression changes come from the crafter rule alone
```

**Re-verifying results.** `exp:verify` compares a re-run with the fingerprint stored in `results/s1.1/<id>/fingerprint.txt`. `results/` is not in Git. In a fresh copy, first copy the recorded results from `evidence/s1.1/experiments/` into `results/s1.1/`; otherwise there is nothing to compare against, and it reports `MISMATCH` against "(none)".

**S1 manifests are refused.** They are historical evidence: their policy names meant the S1 decision logic, and their results were produced by the S1 implementation (S1 review package, ZIP SHA-256 `b255d94b…6d7fd3`). Reproduce them from that package.

If PowerShell refuses to run `npm`, use `npm.cmd`.

## Rules this lab follows

- **Isolated:** it never reads or imports anything from the frozen `progression-lab/` baseline. A test enforces this.
- **Pure core:** `src/core`, `src/spec` and `src/report` never use the clock, ambient randomness, the process or files. A test enforces this.
- **No silent clamping:** a number that would overflow or become invalid is refused with a named error.
- **Independent checks:** expected test answers come from hand derivations or from the Python checkers in `spec/oracle/`, never from this code.
- **Labels:** results are labelled. Nothing here is a validated pacing claim; real validation comes from Roblox playtests (M7).

**Plans and decisions:** `planning/`.

**Evidence for review:**
- `evidence/s0/`, `evidence/s0.1/`, `evidence/s0.1-final/`, `evidence/s0-checkpoint/`;
- `evidence/s1/` (S1, historical);
- `evidence/s1.1/` (S1.1);
- `evidence/s1.1-addendum/` (the S1.1 acceptance addendum);
- `evidence/l1/` (L1 ledger, in review);
- `evidence/s2/` and `evidence/s2.1/` (S2 and S2.1, accepted in `s2-checkpoint`);
- `evidence/s3/` (S3, in review);
- `evidence/s3.1/` (S3.1, accepted with the S3 checkpoint);
- `evidence/s3-acceptance/` and `evidence/s3-checkpoint/` (the S3 acceptance addendum and checkpoint);
- `evidence/s4/` (S4, accepted with the S4 checkpoint);
- `evidence/s4-acceptance/` (the S4 acceptance addendum), `evidence/s4-checkpoint/` and `evidence/perf-audit/` (the verification performance audit);
- `evidence/l2/` (L2 bounded replay infrastructure, reviewed; corrected by L2.1);
- `evidence/l2.1/` (L2.1 correction, in review).
