# S1 checkpoint record

**Written:** after the commit it describes, so it is not part of that commit; it joins the next commit.

| Item | Value |
|---|---|
| Commit | `a7d8476a322b5ededd841c6389b67a944499849f` |
| Tag | `s1-checkpoint` (annotated, local only), tag object `92fa8a446f623332225312d989c87270b964838f` |
| Tree | `4150c5a19bcce051c00e3c7bbf89e41cef09a331` |
| Parent | `ad11a508fd715b08705c5ee72f215f92183f0993` (`s0-checkpoint`) |
| Change from the S0 checkpoint | 259 files changed: 241 added, 18 modified, 296,492 insertions, 33 deletions |
| Pushed | **No.** The GitHub remote is public. |

**Contents:**
- S1, the single-character diagnostic simulation;
- the S1.1 correction pass;
- the S1.1 acceptance addendum (estimator v1.2);
- owner resolutions: `S1_OWNER_RESOLUTIONS.md` (S1-R01 … R17) and `S1_1_OWNER_RESOLUTIONS.md` (S1.1-R01 … R15);
- the S1.1 acceptance addendum document;
- all historical evidence: `evidence/s1/`, `evidence/s1.1/`, `evidence/s1.1-addendum/`, and the S0 checkpoint record `evidence/s0-checkpoint/`.

**Basis:** accepted by the owner in "S1.1 Acceptance and S2 Authorisation" §4.

## Verification of the committed tree
A clean export of the tag (`git archive s1-checkpoint`) was put in an empty folder and checked there:

| Check | Result |
|---|---|
| `npm ci --offline` | 51 packages |
| Type check | 0 errors |
| Default tests | 714 of 714 passed |
| Statistical tests | 9 of 9 passed |
| Fixtures | 326 cases, 0 problems |
| Schemas | 3 of 3 match |
| Independent oracles | 15 groups, 0 failing |

The full logs from the working tree, identical in content, are in `evidence/s1.1-addendum/`.

**Experiment results:** every S1.1 experiment re-verified MATCH against its recorded fingerprint after the addendum correction (`evidence/s1.1-addendum/exp-verify-after.txt`).

## Frozen material (`frozen-check.txt`)
All three locations are unchanged:
- **Frozen original progression-lab:**
  - 3,012 files; the path/size/time and content lists are identical to M0;
  - combined fingerprint `1275f219…ce64d`;
  - HEAD `74499ef`, with 12 Original v1 working files.
- **Original v1 archive:** `master` `74499ef`, `archive/increment6-original-v1` `8d80a44`, no remotes.
- **Old Legion workspace:** 16 files, identical to their copy-time hashes; not deleted.
