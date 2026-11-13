# M0 Repository and Backup Verification (D-09, D-10)

> **S1.1 redaction note:** absolute paths under the local Windows user profile are shown as `%USERPROFILE%\...` in this shared copy (owner S1 review section 11). The unredacted original is preserved privately outside the repository.

**Version:** 1.0 · **Date:** 13 November 2026 · **Performed by:** Claude, under `M0_RESOLUTION.md` D-09/D-10 · **Method:** SHA-256 (`sha256sum`, Python `hashlib`); Git read commands with `GIT_OPTIONAL_LOCKS=0` against the frozen repository.

> **In plain words.**
> - **Backup:** the old workspace is backed up in full, and every file was checked against the original.
> - **Archive:** the unsaved "Original v1" work is preserved on its own branch, in a separate copy of the repository. The frozen original is untouched.
> - **New repository:** the Legion files were copied into the new repository and checked.
> - **Not on GitHub:** the GitHub repository is **public**, so nothing was uploaded.

---

## 1. Full backup of the original Roblox Incremental workspace

| Item | Value |
|---|---|
| Source | `%USERPROFILE%\Desktop\Roblox Incremental\` (complete: `docs/`, `progression-lab/` including `.git/`, `node_modules/` and the 12 uncommitted Original v1 changes, `reports/`, `research_notes/`) |
| Backup file | `%USERPROFILE%\Documents\Legion-Backups\2026-11-13\RobloxIncremental_full_2026-11-13.zip` |
| Backup SHA-256 | `2cb07d31fd77e85f97d1dabba918a88177b72c4d8fff875c3a299da8d31a3bc9` (62,190,194 bytes) |
| Contents | 3,012 files + 414 directory entries |
| Verification | ZIP CRC test passed. Every one of the 3,012 members was read back and its SHA-256 and size compared with a fresh hash of the source file: **0 missing, 0 extra, 0 mismatched**. |
| Verification record | `…\2026-11-13\RobloxIncremental_full_2026-11-13.verification.json` (SHA-256 `7cecc0ff3c73076dced3a0cb30ceeeabe17386387c2ce7f31eebe503fa747d7e`) |
| Source file-list fingerprint | `537e06aec6eaba30327c738cdff007fd129f3da5e1699cfe6a5a7c070a337e52` (SHA-256 of the sorted "hash path" list) |
| Storage note | The backup is on the same disk as the original, so it protects against accidental change, not against disk failure. **Owner action recommended:** copy the ZIP to private off-machine storage. It contains private research, so not a public repository. |

## 2. Archive of Original v1 (separate repository copy)

| Item | Value |
|---|---|
| Archive repository | `%USERPROFILE%\Documents\Legion-Backups\2026-11-13\progression-lab-archive\` |
| How created | `git clone --no-hardlinks` of the frozen repository (read-only on the source), then `git remote remove origin` so it cannot push back into the original |
| `master` | `74499ef2a7ec154bdcbc10b1152f2aec89c3c913`, identical to the frozen commit; this copy is checked out on `master` |
| Archive branch | `archive/increment6-original-v1` → `8d80a440d9818c961713b767f696764b3f18db66` ("Archive Increment 6 "Original v1" (uncommitted post-freeze work)") |
| Branch contents | Exactly the 12 post-freeze changes: 2 modified (`README.md`, `package.json`) and 10 added. 23,907 insertions, 1 deletion vs `74499ef`. |
| Byte check | For all 12 files, SHA-256 of `git show archive/…:<path>` equals SHA-256 of the original working-tree file: **12 / 12 match** |
| Integrity | `git fsck` reported no errors |

## 3. Frozen original: untouched

| Check | Result |
|---|---|
| Fingerprint after backup and archive vs the M0 "before" fingerprint (3,012 files incl. `.git/`; path, size, mtime, SHA-256) | **Identical** (`cmp`) |
| Combined checksum-list fingerprint | `1275f21973fc85c6a3bf5b0bffed5654619f7869a405a775fe13a2e24f9ce64d` (same as M0) |
| HEAD / branches | `74499ef2a7ec154bdcbc10b1152f2aec89c3c913` on `master`; still the only branch. No commit, branch, checkout or reset was made in the original. |
| Working tree | Still 2 modified + 10 untracked files, unchanged |

## 4. Canonical Legion repository

| Item | Value |
|---|---|
| Path | `%USERPROFILE%\Documents\GitHub\legion-incremental\` (branch `main`) |
| Copied from | `%USERPROFILE%\Desktop\Legion Incremental\` (left unchanged; not deleted; awaiting owner approval) |
| Files copied | 16 (design pack 4, M0 documents 5, Rojo starter 7). `.git` was not copied. The copy refused to overwrite any existing file. |
| Copy verification | SHA-256 of each copy equals its source: **16 / 16** |
| Committed-bytes verification | SHA-256 of each blob in the import commit equals its source: **16 / 16** |
| Line endings | The system Git has `core.autocrlf=true`. `.gitattributes` (`* -text`) was added so recorded hashes stay valid on checkout. |
| Import commit | `3aced251bf44c8dd4ceafac01946acaa4af2cdcd`: "M0 import: design pack v1.0, M0 planning documents (as reviewed), Rojo starter" |

**Original design-pack hashes (match `M0_REPO_AUDIT.md` and the reviewer's check):**

| File | SHA-256 |
|---|---|
| `docs/LEGION_GAME_DESIGN_BIBLE.md` | `f8651cb1cd10f358756f8f6368f0a7558b2f3f7eea059f249f2ada2051514a7b` |
| `docs/DECISION_REGISTER.md` | `94fab1eea22ee7fb23988932362933c2848fd9ef195fa6de7ab3b5852f5802eb` |
| `docs/CLAUDE_M0_KICKOFF.md` | `86b7c5e4851b557160cb2760c91bdbf286660926d2602645502cb6e6272f7e4b` |
| `docs/README.md` | `b18f434c1acdf45480495c2f535400fea0e28ae92c93d1adbb21a533437c8afd` |

**As-reviewed M0 document hashes (v1.0, in the import commit):**

| File | SHA-256 |
|---|---|
| `M0_ARCHITECTURE.md` v1.0 | `e072e66abcbca84118d703ca2e7911f36de6f7dd4f4ff615a9830032efa98015` |
| `M0_DECISION_MATRIX.md` v1.0 | `218eff265116edfab3bb7cb8831fb7c07c572965438ddeb61c768d2c914dcca2` |
| `M0_EXPERIMENT_PLAN.md` v1.0 | `5bf319378c290888cafd9419b55a8bd288f039927fe77c2b5b546f365ac467c6` |
| `M0_REPO_AUDIT.md` v1.0 | `4d0da4352ce88b721e76bc07f2d6806befbea0472a9b8dbe612eccaab5e2349b` |
| `M1_S0_S1_IMPLEMENTATION_PLAN.md` v1.0 | `08c324ea557e38565b7ce39fee8a4d76b6675d417d74a776682d27fabd12abd6` |

**Decision coverage (v1.1 matrix).**
- The audit §9 script, run on the v1.1 matrix in the canonical repository, reported **183/183 register IDs present exactly once as primary rows; none missing, extra or duplicated**.
- The v1.1 addendum adds no primary rows.

## 5. GitHub remote: checked, not pushed

| Item | Value |
|---|---|
| Remote | `origin` → `https://github.com/strixw0w/legion-incremental.git` |
| `gh repo view` (read-only) | `visibility: PUBLIC`, `isPrivate: false`, `isEmpty: true`, created 2026-11-13T12:32:13Z |
| Action | **Nothing pushed.** Instruction D-09 forbids pushing to a public remote. All commits are local. |
| Owner decision needed | Make the GitHub repository private (or choose another private remote) before any push. Committed documents contain local Windows paths that include the account username. |

## 6. Tooling (D-10)

| Item | Value |
|---|---|
| Rojo pin | `rokit.toml`: `rojo-rbx/rojo@7.7.0-rc.1` → `rojo-rbx/rojo@7.7.1` (file SHA-256 now `e58e2941943fb7c87d3d62e25909e2a1ff27124d6faf552381fb038956d1be72`). `rojo --version` in the repository prints `Rojo 7.7.1`. Version 7.7.1 was already in Rokit's tool storage (used by plus1game). |
| Studio plugin | `rojo plugin install` (7.7.1) wrote `%LOCALAPPDATA%\Roblox\Plugins\RojoManagedPlugin.rbxm`, SHA-256 `9412c5ce010e18342a4470a48f516772127649216aa3fbf55b8fe1369ca5db7f` (504,236 bytes). This is byte-identical to the plugin the owner had before this session. The replaced 7.7.0-rc.1 plugin (`3daa26e6…46879`) is backed up in the session scratchpad. |
| plus1game | Not modified. Only read commands were used there. It already had uncommitted changes, which belong to the owner. |
| Running server | A `rojo serve` process (7.7.0-rc.1) started earlier from the old workspace is still running. It was left alone. The 7.7.1 plugin will not connect to it; restart `rojo serve` from the canonical repository. |
| Node.js | 24.22.3 (LTS "Krypton"), self-contained at `%LOCALAPPDATA%\legion-tools\node-v24.22.3-win-x64\`. `node-v24.22.3-win-x64.zip` SHA-256 `e612af99f626ab415ea225af6bce5c971feb448cb5cae250bb1c3fa50c5f7d9f` equals the value in nodejs.org `SHASUMS256.txt`. npm 11.19.1 bundled. The system Node v25.9.0 is unchanged. |

## 7. Not done (requires explicit owner approval)

- Deleting `Desktop/Legion Incremental/` (the old Legion workspace).
- Pushing to any remote.
- Any change inside `Desktop/Roblox Incremental/`.
