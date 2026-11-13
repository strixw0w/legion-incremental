# S0 checkpoint record

Written immediately after the checkpoint commit. A commit cannot contain its own SHA, so this record lives outside it and belongs to the S1 review package.

| Item | Value |
|---|---|
| Commit | `ad11a508fd715b08705c5ee72f215f92183f0993` |
| Subject | "S0 checkpoint: S0 + S0.1 hardening + final ledger identity correction" |
| Parent | `0209d93` (M0 documentation checkpoint) |
| Tree | `f5371311ee726268ea64f2e039ea80caa0103282` |
| Local annotated tag | `s0-checkpoint`: tag object `87654918e81b94d4160eee6ad56d79d8cc46bfd5`, pointing to the commit above |
| Branch | `main`, local only. **Not pushed**: the GitHub remote is public. |
| Files changed | 155 files added, 40,904 insertions (`checkpoint.diffstat.txt`; full diff in `checkpoint.patch`) |
| Files in the repository at the checkpoint | 175 |
| Working tree after commit | clean |
| Authorisation | `planning/S0_FINAL_REVIEW_RESOLUTION.md` §3 |

## Verification of the committed content
The suite ran on the working tree immediately before the commit. The commit added exactly that tree: `git status` was clean afterwards. Outputs are in `evidence/s0.1-final/`.

| Check | Result |
|---|---|
| Type check | clean |
| Default tests | 463 passed |
| Statistical tests | 7 passed |
| Fixture conformance | 252 cases, 0 problems |
| Schemas | 3 of 3 OK |
| Independent oracles | 5 groups, 0 failing |
| S0-R01 semantic fingerprint | `24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9`, unchanged from S0 |
| Ledger correction mutation check | 4 of 4 detected |

These are this machine's results. The Vitest suite has not been independently re-run.

## Untouched locations, checked after the commit
- **Frozen simulator** (`Desktop/Roblox Incremental`, including `progression-lab/.git`): 3,012 files.
  - Path, size, modification time and SHA-256 lists are identical to the start of M0.
  - Combined fingerprint `1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d`.
  - HEAD `74499ef2a7ec154bdcbc10b1152f2aec89c3c913`.
  - 12 Original v1 working-tree files, untouched.
- **Original v1 archive** (`Documents/Legion-Backups/2026-11-13/progression-lab-archive`):
  - `master` = `74499ef…`;
  - `archive/increment6-original-v1` = `8d80a440d9818c961713b767f696764b3f18db66`;
  - no remotes.
- **Old Legion workspace** (`Desktop/Legion Incremental`): 16 files, identical to the hashes recorded when it was copied. It is kept until the owner approves deletion.
