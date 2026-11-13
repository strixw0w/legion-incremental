# M0 Repository Audit — Legion Incremental

**Milestone:** M0 · **Audit date:** 13 November 2026 · **Auditor:** Claude (implementation lead), read-only inspection · **Status:** for owner and independent review

> **In plain words.**
> - **Old simulator safe:** the old frozen simulator is still exactly at the commit you froze, and I changed nothing in it. The before and after fingerprints of all 3,012 files match exactly.
> - **Unsaved work:** the same folder also contains 12 changes made the day *after* the freeze (an experiment called "Original v1") that were never saved into Git. Its own notes say you "unfroze" it for that work. You need to decide how to keep it.
> - **No backup:** that folder has no online copy.
> - **Two homes:** there are two possible homes for the new Legion project, and you should pick one.
> - **What we keep:** the old simulator's *ideas* are worth reusing (labelling every number, fingerprints, pre-registered targets, zone audits). Its *numbers* and its single-character engine are not.

---

## 1. Method

- **Read-only.** Directory listings, file reads, `sha256sum`, and Git read commands run with `GIT_OPTIONAL_LOCKS=0` and `--no-optional-locks`. This stops `git status` from rewriting `.git/index`, which a plain `git status` can do.
- **Nothing run in the frozen lab:** no tests, builds, experiments or `npm` commands, because they write caches, `test-results/` or reports. Package licences were read from installed `package.json` files.
- **Before/after proof.** Before any inspection I recorded, for every file under `Desktop/Roblox Incremental/` (3,012 files, `.git/` included), its path, size, modification time and SHA-256. I repeated this after all the work (§9). The fingerprint files are kept outside the frozen tree, in the session scratchpad.
- **Files changed by this session elsewhere** (none of them in the frozen tree), for completeness:
  1. Earlier in the session, at the owner's request: Rojo set-up in `Desktop/Legion Incremental/` (`rokit.toml`, `rojo init` starter files, `git init`).
  2. Also earlier: the Roblox Studio Rojo plugin was replaced. The old one is backed up in the scratchpad.
  3. Now: these five planning documents in `legion-progression-lab/planning/`.

---

## 2. Design inputs

| File | Path | SHA-256 | Note |
|---|---|---|---|
| Game Design Bible v1.0 | `Desktop/Legion Incremental/docs/LEGION_GAME_DESIGN_BIBLE.md` | `f8651cb1cd10f358756f8f6368f0a7558b2f3f7eea059f249f2ada2051514a7b` | 373 lines; read in full |
| Decision Register | `Desktop/Legion Incremental/docs/DECISION_REGISTER.md` | `94fab1eea22ee7fb23988932362933c2848fd9ef195fa6de7ab3b5852f5802eb` | 183 decisions (10 + 15 + 18 + 20×7); read in full |
| M0 kickoff | `Desktop/Legion Incremental/docs/CLAUDE_M0_KICKOFF.md` | `86b7c5e4851b557160cb2760c91bdbf286660926d2602645502cb6e6272f7e4b` | Same text as the task brief |
| Pack README | `Desktop/Legion Incremental/docs/README.md` | `b18f434c1acdf45480495c2f535400fea0e28ae92c93d1adbb21a533437c8afd` | — |

The same three documents also exist in `Downloads/` (byte-identical, checked with `cmp`), together with `Legion_Incremental_Design_Pack_v1.0.zip` and `… (1).zip`, which are byte-identical to each other and contain the same four files.

---

## 3. Workspace inventory

| Location | What it is | Git state (read-only) | Relevance |
|---|---|---|---|
| `Desktop/Roblox Incremental/progression-lab/` | **Frozen baseline simulator** (TypeScript, React dashboard, vitest, Playwright) | Repo, branch `master`, 2 commits, HEAD `74499ef`, **no remote, no tags, no stash**; working tree **not clean** (§4) | Reference only |
| `Desktop/Roblox Incremental/docs/` | IdleOn audit inputs and earlier Claude briefs (23 files) | Not under version control | Reference only; IdleOn data is not used for Legion |
| `Desktop/Roblox Incremental/reports/` | IdleOn class-EXP audits, Phase 6 protocols, `Progression Design Note.md` (6 files) | Not under version control | Reference; the design note explains the post-freeze "Original v1" work |
| `Desktop/Roblox Incremental/research_notes/` | IdleOn live-session screenshots and forensics (65 files) | Not under version control | Reference only |
| `Desktop/Legion Incremental/` | **Current workspace.** Rojo starter (created this session on the owner's request), `rokit.toml` (Rojo 7.7.0-rc.1), `docs/` design pack, and now `legion-progression-lab/planning/` | Repo, branch `master`, **no commits**, everything untracked, no remote | Candidate canonical Legion repo (B-03) |
| `Documents/GitHub/legion-incremental/` | Empty repository created 13 Nov 12:32 | Branch `main`, no commits, remote `origin` → `github.com/strixw0w/legion-incremental` | Alternative canonical Legion repo (B-03) |
| `Documents/GitHub/plus1game/` | Another of the owner's Roblox games: strict Luau, Rokit (rojo 7.7.1, luau-lsp 1.70.1, lune 0.11.0, selene 0.32.0, StyLua 2.6.0, wally 0.3.2), Jest-Lua 3.10.0, pure kernels with injected RNG, Lune test lanes, `sim/` in Luau | Has commits and a GitHub remote (not inspected further) | **Precedent** for Luau parity tooling (architecture §17) |
| `Documents/GitHub/Brainrot-Bubble-Popper/` | roblox-ts game with a TypeScript simulation folder and economy check scripts | Has commits and a GitHub remote | Minor precedent (TypeScript simulation of a Roblox economy) |
| `Documents/GitHub/asset-holder/` | Shared Roblox asset pipeline | Has commits and a GitHub remote | Later (art, M7+), per global instructions |
| `Downloads/IdleOn_Phase6_World1_Source_Audit.zip`, `Downloads/Phase6_Priority3_Independent_Review.md` | Earlier IdleOn research artefacts | — | Reference only |

**Tools found on this machine:**
- **Available:** Node v25.9.0, npm 11.12.1, Python 3.12.9, Git 2.53.0, Rokit 1.2.0, and Rojo 7.7.0-rc.1 (global, via the `~/.aftman/aftman.toml` entry that Rokit reads).
- **Not available in this workspace:** Lune, selene, StyLua, wally. They are pinned only inside plus1game's `rokit.toml`.

---

## 4. Frozen baseline verification

| Check | Expected | Found | Result |
|---|---|---|---|
| Folder present | `progression-lab/` | `Desktop/Roblox Incremental/progression-lab/` | ✔ |
| Frozen commit exists | `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` | Present; "chore: finalize cross-browser regression test setup", 9 Nov 2026 18:45 UTC | ✔ |
| HEAD | frozen commit | `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` on `master` | ✔ |
| History | — | 2 commits: `f38643d` "Record the verified Increment 5.1 baseline" (18:31), then `74499ef` | ✔ |
| Tags / remote / stash | — | none / none / none | ⚠ No off-machine copy (B-02) |
| Tracked files at HEAD | — | 152 files (source, experiments, golden baselines, results, e2e) | ✔ |
| Working tree clean | clean | **Not clean: 2 modified, 10 untracked** | ⚠ **B-01** |

**Post-freeze changes** (all dated 10 Nov 2026, 12:50–13:07, the day after the frozen commit):

| Change | File | Size (bytes) |
|---|---|---|
| Modified | `README.md` (+19 lines: "Original v1" section, two commands, a folder row) | — |
| Modified | `package.json` (+2 scripts: `experiments:original`, `experiments:original-search`) | — |
| Untracked | `experiments/increment6_design_decisions.md` | 3,408 |
| Untracked | `experiments/increment6_findings.md` | 6,158 |
| Untracked | `experiments/original_v1.experiment.ts` | 3,925 |
| Untracked | `experiments/original_v1_search.experiment.ts` | 5,099 |
| Untracked | `experiments/results/original_v1.json` | 32,612 |
| Untracked | `experiments/results/original_v1_search.json` | 430,448 |
| Untracked | `experiments/results/original_v1_tables.md` | 3,158 |
| Untracked | `src/design/evaluateOriginal.ts` | 8,988 |
| Untracked | `src/design/originalV1.ts` | 7,059 |
| Untracked | `src/tests/originalDesign.test.ts` | 3,873 |

**Interpretation (evidence, not assumption).** `reports/Progression Design Note.md` (workspace level) says: *"The owner chose Claude's recommended answers to section 3 and unfroze the simulator. Original v1 is now built…"* So the frozen **commit** is intact, but the **working tree** carries an uncommitted Increment 6. Per kickoff boundary 1, I changed nothing. I did not commit, stash, reset or check anything out.

**Reported counts not re-verified.**
- `increment6_findings.md` claims "988 tests pass … all 352 browser checks pass". Those numbers describe the uncommitted state on 10 Nov.
- A static count of `it(`/`test(` declarations in `src/tests/` today is 495. Parametrised tests expand at run time, so this is not comparable to 988 and is **not a test result**.
- No test was run during this audit.

---

## 5. What the frozen lab is (technical summary)

- **Stack** (tracked `package.json`):
  - React 19.3.1, zod 4.6.7 (runtime);
  - TypeScript 7.0.2, Vite 8.3.7, vitest 4.1.12, @playwright/test 1.65.0, @vitejs/plugin-react 6.3.0 (development).
- **Size:** about 11,000 lines across `src/sim`, `src/data`, `src/experiments`, `src/design` and `experiments/*.ts` (`wc -l`).
- **Model characteristics** (from README and source):
  - **one character**, one monster species per zone, no classes or skills;
  - **continuous average kill rate** (`killRateBreakdown`), no randomness ("identical settings always give identical results");
  - **expected-value fractional materials**;
  - floating-point balances clamped by `SAFE_MAX = 1e30`;
  - offline = frozen active rate × share × min(hours, cap);
  - coin upgrades plus four account-upgrade tracks;
  - kill-count portals;
  - zone, farming-location and logoff policies;
  - golden baselines with input and result fingerprints.
- **Data provenance:** IdleOn World 1 monster HP/EXP and level gates labelled OBSERVED from community sites; everything else ASSUMPTION. The README states that no IdleOn Toolbox (GPL-3.0) code is used.

---

## 6. Reuse assessment

**Reuse conceptually (re-implement fresh in the Legion lab; record in `PROVENANCE.md`):**

| Frozen-lab element | Location | Legion use | Why suitable |
|---|---|---|---|
| Provenance labels and "weakest input" rule | `src/data/provenance.ts` | Labels `approved/target/candidate/derived/model-output` | Directly serves "tag every number candidate" |
| Canonical JSON + SHA-256 fingerprints | `src/experiments/hash.ts` | Manifest and result fingerprints (via `node:crypto`) | Reproducibility; owner's own code, no third-party dependency |
| Golden baselines; runners refuse to start if a baseline moved; `e2e:expected:check` | `experiments/golden/`, `freeze_*.experiment.ts` | `baselines/` + `baseline:check` | Prevents silent regressions |
| Pre-registered targets before tuning; "report closest, don't move targets" | `experiments/increment6_design_decisions.md` | Experiment plan §1 | Honest calibration |
| Kill-rate seam (continuous model vs event source) | `src/sim/killRateModel.ts` | Rate estimator vs reference stepper | The same separation, now with real events |
| Hits-to-kill breakpoints and rounding-tolerance lesson | `src/sim/combat.ts` | Integer damage per hit removes the tolerance need | The lesson is kept and the mechanism improved |
| Activity, blocker and reason codes; one cause per minute | README, `src/sim/types.ts` | Rejection codes and bottleneck attribution | Explains results in plain words |
| Matched-state zone audit and cloned forks | `src/experiments/zoneAudit.ts` | S1-E03 / S6-E04 earlier-zone audits | Exactly the R08.05 question |
| Separate "highest unlocked / current / logout zone" | Increment 5 | `accessUnlocked` / `visited` / assignment (O07) | Same separation, generalised |
| "Optimal is not realistic" tagging; hindsight search | Increment 5 | Realistic vs oracle policies | Required by the kickoff |
| Findings classification (MODEL OUTPUT, HYPOTHESIS, CONFIRMED IN MODEL) | README | Report labels | Prevents over-claiming |
| Luau porting notes (1-based lists, nil, math.huge) | README | Parity notes | Small but useful |
| Increment 6 caveat: "unlocking is not reaching" | `increment6_findings.md` | N-11: measure first visit | Real lesson from prior work |

**Leave behind:**

| Element | Why |
|---|---|
| All numbers: sandbox defaults, account-upgrade tables, Zones 10–20 synthetic curves, **Original v1 coefficients** | Invented for a different design. Original v1 contradicts the register: one character (R01.07, R10.04), away 40% capped at 10 h (R07.03, R07.04), 12 zones (R06.03), EXP growth faster than HP growth (R08.05). See C-08. |
| IdleOn OBSERVED data (DigitalTQ, IdleOn Toolbox snapshots) | The kickoff forbids treating community data as live-verified or copying IdleOn's numerical progression |
| Single-character `simulateRun` loop and account-upgrade tracks | Not Legion systems; no multi-character, assignment or ledger model |
| Continuous expected-value drops and materials | Violates "rare rolls statistically correct, not expected-value grants" |
| Offline model (frozen rate × share × capped hours) | Cannot express two windows, level-ups during offline, multiple jobs, shortages or receipts |
| Floating balances with silent `SAFE_MAX` clamping | Legion requires exact integers and visible errors at limits |
| React dashboard and Playwright browser walks | Headless-first. A UI is optional later. |
| **Prior experiments** (E0/E1, D1–D3, P0–P2, F0–F2 × A0–A1, Original v1) | Single-character results. They do not represent multi-character Legion behaviour and must not be cited as Legion predictions. |

**Code-copy policy (proposed):**
- No frozen-lab file is copied verbatim. If one ever is, `PROVENANCE.md` records the source path, the commit `74499ef`, the owner as author (private code), and why.
- No third-party community calculator code is used anywhere.

---

## 7. Dependencies and licensing

| Item | Licence | Status |
|---|---|---|
| Frozen lab direct packages: zod, vitest, vite, react, react-dom, @vitejs/plugin-react | MIT | Not imported by Legion. The lab installs its own copies. |
| typescript 7.0.2, @playwright/test 1.65.0 | Apache-2.0 | Same |
| Frozen lab `node_modules` (package.json files to depth 3, counted) | 45 MIT, 7 Apache-2.0, 2 MPL-2.0, 2 ISC, 1 BSD-3-Clause | MPL-2.0 packages not identified in this audit. They are not part of the proposed Legion set. |
| Proposed Legion lab packages: typescript, vitest, zod, fast-check, @types/node | MIT / Apache-2.0 (fast-check and @types/node: MIT) | Exact versions and licences to be recorded from the lockfile at S0 |
| IdleOn Toolbox (`github.com/Morta1/IdleonToolbox`) | GPL-3.0 | **Excluded.** Never copied into Legion production or the lab. |
| DigitalTQ / IdleOn Toolbox data snapshots, IdleOn art | Third-party | **Excluded** from Legion content |
| plus1game tooling (Lune, Rojo, selene, StyLua, wally, Jest-Lua) | Not inspected in this audit | Check licences when adopted at M2 |

---

## 8. Blockers and risks

| ID | Blocker / risk | Impact | Recommended action (owner) |
|---|---|---|---|
| **B-01** | Frozen working tree holds uncommitted "Original v1" (Increment 6) changes | The frozen lab is "clean at the commit" but not clean on disk. That work exists only as uncommitted files. | Owner chooses one: **(a)** the owner, or Claude with explicit permission in a separate task, commits it on a *new branch* (e.g. `increment6-original-v1`) so `master` stays at `74499ef`; **(b)** archive a zip copy elsewhere and leave as is; **(c)** discard (not recommended). Not done in M0. |
| **B-02** | No remote or backup for the frozen repo; research folders unversioned | A disk failure loses the baseline and research | Back up `Desktop/Roblox Incremental/` (zip to cloud storage, or a private GitHub repo) |
| **B-03** | Two candidate homes for the Legion repo | Unclear where Git checkpoints (R10.20) go | Choose one. If `Documents/GitHub/legion-incremental` (has a GitHub remote), move the current workspace contents there; otherwise add a remote to `Desktop/Legion Incremental`. |
| **B-04** | The Legion workspace has no commit; the design pack is untracked | Bible §16 M0 asks to "freeze Bible/register" | First commit: design pack + M0 documents (+ Rojo starter), after the owner approves |
| R-05 | This workspace pins Rojo **7.7.0-rc.1**; plus1game pins **7.7.1**; the Studio plugin was replaced this session with the 7.7.0-rc.1 build | plus1game's Studio connection may now show a version mismatch | Separate from M0: consider pinning Legion to 7.7.1 and reinstalling the matching plugin |
| R-06 | Node v25.9.0 is an odd-numbered (short-support) release line | Reproducibility and security updates | Install a current LTS line (check nodejs.org) before S0; record the version in every manifest |
| R-07 | Design-pack numbers are partly placeholders (zone names, candidate Monuments) | Risk of mistaking candidates for approved | The labelling rules in the architecture §7 apply to every value |

None of these blocks *reviewing* M0. B-01 to B-04 and R-06 block the first implementation commit.

---

## 9. Statements and evidence

**Was the frozen repository modified? No.**

| Evidence | Before (start of audit) | After (end of M0 work) |
|---|---|---|
| Files under `Desktop/Roblox Incremental/` (including `.git/`) | 3,012 | 3,012 |
| Path + size + modification-time list | recorded | **identical** (`cmp`) |
| SHA-256 of every file | recorded | **identical** (`cmp`) |
| Combined SHA-256 of the checksum list | — | `1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d` |
| `git rev-parse HEAD` | `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` | `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` |
| `git status --porcelain --untracked-files=all` | 12 lines (2 M, 10 ??) | 12 lines, same content |

The fingerprint lists are in the session scratchpad, outside the frozen tree, under `fingerprint_before_*` and `fingerprint_after_*`.

**Decision coverage check** (reproducible; Python standard library, read-only). It confirms 183/183 register IDs appear exactly once as bold primary rows in `M0_DECISION_MATRIX.md`, with zero missing, extra or duplicated:

```python
import re, collections
reg = open("docs/DECISION_REGISTER.md", encoding="utf-8").read()
mat = open("legion-progression-lab/planning/M0_DECISION_MATRIX.md", encoding="utf-8").read()
reg_ids = re.findall(r"^\| (R\d\d\.\d\d) \|", reg, re.M)
prim = collections.Counter(re.findall(r"^\| \*\*(R\d\d\.\d\d)\*\* \|", mat, re.M))
assert len(reg_ids) == len(set(reg_ids)) == 183
assert set(prim) == set(reg_ids) and all(v == 1 for v in prim.values())
```

Run from the repository root with `python -I <script>`. Result on 13 Nov 2026: register 183 / unique 183; primary rows 183 / unique 183; missing none; extra none; duplicates none.

---

## 10. Documents produced in M0

All in `Desktop/Legion Incremental/legion-progression-lab/planning/`:

1. `M0_REPO_AUDIT.md`: this file.
2. `M0_DECISION_MATRIX.md`: all 183 decisions by owning milestone, conflicts, missing semantics, high-impact reviews, owner decisions.
3. `M0_ARCHITECTURE.md`: separate lab structure, tooling, deterministic engine, schemas, ledger, RNG, fixtures, tests, Luau parity.
4. `M0_EXPERIMENT_PLAN.md`: S0–S7, profiles, policies, metrics, manifests, hypotheses, gates.
5. `M1_S0_S1_IMPLEMENTATION_PLAN.md`: the first implementation increment, file by file.

No code, content pack, fixture, manifest or package was created. No test or experiment was run.
