# S6 acceptance addendum

**Source:** the owner's "S6 Acceptance and Final S7 Simulator Handoff" (received 2026-11-17).
- **The implementation** is accepted, subject to two focused correctness corrections (A and B) and a negative test of
  mutation M39.
- **The complete World 1 candidate** is approved as an engineering reference, not as final launch balance.
- **No further S6 economic calibration** is made.

**What stays unchanged:** the original S6 evidence (`evidence/s6/`), registrations (`manifests/s6/`), content
(`content/s6/`) and results. Every correction below is recorded here, never by editing them.

## 1. The independent review record (as the owner reported it; not restated as further verification)

**What the reviewer (ChatGPT) independently verified:**
- the ZIP SHA-256 `bbaf9f82e58522fb8ca4f8153bc20ebe9b56c32f558852da8d332661ce59bc2f`;
- all 1,805 manifest-listed files against their hashes and sizes, with no unexpected files and ZIP integrity passing;
- 1,313 historical evidence, content, manifest, reproduction and specification files compared against S5. The only
  difference was the S5 mutation-check script, updated for the accepted S5 corrections;
- the amendment 01 registration checks, including the registered code digest;
- the complete Python oracle suite: 22 groups, zero failures (the generated-preview check remains skipped);
- the S6 analysis JSON, regenerated with identical results after normalising the results directory;
- S6-E07 tasks 0 and 10, reproduced exactly in their complete semantic rows.

**The review environment:** Node 22.16.0 on Linux, with Zod shape validation bypassed for known valid content. The
actual engine and semantic validation were retained.

**What was not independently rerun:**
- a third boss-experiment reproduction, which exceeded the review budget;
- the complete pinned Vitest suite;
- the full S6 matrix.

The supplied logs support 1,746 regular tests, nine statistical tests and 52 of 53 detected S6 mutations.

## 2. Correction to the evidence summary: 538 tasks, not 578
`evidence/s6/S6_EVIDENCE.md` gives the amendment 01 workload as "578 tasks" in two places: the verification summary
and the registered-experiments row. **The correct total is 538.**

| Workload | Tasks |
|---|---|
| E02 | 80 |
| E01 | 99 |
| E03 | 30 |
| E05 stage 1 | 51 |
| E06 | 40 |
| E07 | 30 |
| E04 | 33 |
| E10 | 40 |
| E11 | 30 |
| E05 stage 2 | 105 |

- **No row is missing:** every run record shows its registered task count completed (`evidence/s6/a01-chain/chain.txt`,
  `evidence/s6/fingerprints.txt`).
- **The cause:** an addition error in the summary only.
- **The original document is preserved**, and the correction is recorded here.

## 3. Correction A: bounded rare-hero duplicate history

**The owner's reproduction:** a level-200 squad farming Haunted Woods, seed `independent-s6-rare`. The rare list grew
by one entry per duplicate: 22, 35 and 69 entries after 1, 2 and 4 hours, with one unique hero and 21, 34 and 68
shards. The grant code also filtered the whole list on every grant.

**The fix** (`src/engine/legion.ts` `w1Credit`, `src/engine/w1.ts`). World 1 state is now **version 2** (`w1.version: 2`):
- **Unique ownership:** the legion's rare list names each rare hero at most once, in acquisition order.
- **A checked duplicate counter per hero:** `w1.rareDuplicates`, one per content rare hero, in content order. A repeat
  grant increments it with the S4 checked addition (`addCounter`). At 2^53 − 1 the next duplicate is refused
  (`NUMERIC_LIMIT`), and its whole step commits nothing.
- **Stable conversion identities:** the n-th duplicate of a hero is the ledger transaction `rare:<id>:duplicate:<n>`.
  These are the same identities as before; only their source changed, from a list count to the counter.
- **Exactly one shard per legitimate duplicate** (the existing candidate).
- **Never a second character.**
- **No random draw** for a conversion.
- **Acquisition order and reserve ownership unchanged:** a new rare hero joins after the last character, in the reserve
  when the productive slots are full.
- **Validated** (`src/l2/simState.ts`). Each of these is refused, never repaired:
  - a W1 state of another version, including version 1 (the review package's list);
  - a rare list that names a hero twice;
  - a duplicate count that is not a non-negative safe integer;
  - duplicate counts of the wrong length;
  - duplicates of a hero not owned.
- **The observation** shows each hero's duplicates on the boss board (`rareHeroes[].duplicates`).
- **Historical paths unchanged:** the S2–S5 diagnostic grant (S2-R20) and every pre-W1 pack keep their representation.

**Shown on the owner's scenario** (`rare-history.txt`, from `tools/rare_history.ts`):

| After | Rare list | Huntress duplicates | Shards | Rare record |
|---|---|---|---|---|
| 1 h | `["rare.huntress"]` | 21 | 21 | 25 bytes |
| 2 h | `["rare.huntress"]` | 34 | 34 | 25 bytes |
| 4 h | `["rare.huntress"]` | 68 | 68 | 25 bytes |

The conversions are the same 21, 34 and 68 the reviewer counted. The history no longer grows with them.

**Tested** (`test/s6.acceptance.test.ts`, group A):
- **The owner's scenario:**
  - the counters, the shard balance and the duplicate events agree;
  - 68 duplicate transactions `rare:rare.huntress:duplicate:1` … `:68`, each once;
  - one character.
- **No draw for a conversion:** the engine's rare stream, pity counters and drop sequence equal a replay of its elite
  kills through the pure helper.
- **Reserve ownership and acquisition order.**
- **Save/load and replay:** a run restored mid-way, with duplicates before and after, ends exactly as the uninterrupted
  run and as an identical replay.
- **Branch isolation:** a fork leaves its parent unchanged, and the parent continued the same way ends equal to the
  fork.
- **The numerical boundary:** a counter at 2^53 − 1 validates. The next duplicate is refused, and its step commits no
  shard and no count.
- **Every refusal of the version 2 representation.**
- **The existing S6 tests are updated to version 2:** the elite-drop test now expects the hero listed once and its
  duplicates counted.

## 4. Correction B: the external command boundary

**The defect:** `submit` read the active step's event key, so a W1 `StartBoss` submitted from outside a policy
decision failed.

**The fix** (`src/engine/legion.ts`) gives a supported external entry point, and restricts the internal one:
- **`submitExternal({ command, expectBossAttempts? })`,** World 1 only:
  - **Where it goes:** between steps, it queues the command as an `ExternalCommand` event in the decision phase, at the
    instant the simulation stands at.
  - **Its slot:** the next free decision slot after the last processed step at that instant, the same rule as an event
    scheduled by that step. Nothing is invented: the instant is the simulation's own time, and the order is the
    engine's event order.
  - **Ordering within an instant:**
    - a command at a session's closing instant comes after the boundary, so it is refused `NOT_IN_SESSION`;
    - one at an opening instant comes after the boundary and the decision that boundary requested;
    - within a slot, external commands are processed before the policy's decision, in the order they were queued.
- **The last processed step** is saved in W1 checkpoints (runtime `lastStep`). A restored simulation therefore queues
  exactly as the uninterrupted one. Pending external commands are saved, validated and restored like any event (rule
  `ExternalCommand`, owner `external`).
- **Validated when its slot is processed,** with every refusal named and logged (`ExternalCommandResult`), and kept by
  ticket (`externalResult(ticket)`). The checks, in order:
  - in session (`NOT_IN_SESSION`);
  - not stale: if `expectBossAttempts` is given, the boss's attempts must still match (`STALE_REQUEST`);
  - then the command's own rules: `GATE_LOCKED`, `GATE_ACTIVE_ONLY`, `BUSY`, `ALREADY_ENGAGED`, `RARE_CLASS_FIXED` and
    the others.
- **Refused at the boundary, with nothing queued:**
  - an invalid request (`INVALID_REQUEST`): any command outside the supported set (StartBoss, SetAutoFarm, Rest,
    Travel, Teleport, SetClass), or a supported command with a missing, extra or mistyped field;
  - a call inside a step (`IN_STEP`);
  - a stopped simulation (`STOPPED`);
  - content other than World 1 (`NOT_WORLD_1`).
- **Direct `submit` outside a step, in World 1,** is refused by name (`OUTSIDE_STEP`) instead of failing. Policies are
  unaffected, because they submit inside their decisions. Pre-W1 content keeps its historical behaviour.

**Tested** (group B):
- a valid challenge outside a policy decision: auto-farm off, then StartBoss, processed in order, and the boss cleared;
- locked, active-only, already-engaged (BUSY), stale and invalid requests, and non-W1 content;
- offline;
- the session boundaries:
  - at the closing instant, refused;
  - at the opening instant, accepted after the boundary's own steps, with the slot order checked;
- a failed attempt recorded on the boss board;
- a command pending across a checkpoint;
- the saved last step: a restored run queues in the same slot as the uninterrupted one after an inclusive advance.

## 5. The negative test of mutation M39
The reward monitor's check that a joining rare hero brings no EXP guards an invariant the engine keeps, so no correct
run can trip it.

**The new test injects an invalid acquisition into the monitor harness.** An observer registered before the monitor
gives the Guardian 777 unearned EXP at the boss credit that grants it.
- **The monitor reports** `I3 rare:rare.guardian joined with EXP or an award`.
- **The same run without the injection** reports no violation.
- **The production engine is not changed.**

**The original 52 / 53 mutation evidence is preserved** (`evidence/s6/gates/`). The post-correction mutation run is
below.

## 6. Owner resolutions (recorded)

**S6-R01 … R16 are approved, with these qualifications:**
- **R02:** a safe external command boundary is required (§4). The repeat reward coefficients remain candidates.
- **R05:** bounded unique ownership and duplicate counters are required (§3).
- **R10:** numerical support is accepted for the tested W1 horizon, not for indefinite progression.
- **R11:** the M39 negative test (§5).
- **R12:** the corrected rare ownership representation is validated (§3).
- **R13:** accuracy is an acknowledged gameplay implementation gap.
- **R14:** the content is approved as an engineering reference only.
- **R15:** POL6 is a simulated policy, not evidence of optimal or actual player behaviour.

**All other rule structures are accepted. No numerical content is approved as final launch balance.** The owner's
design decisions for the playable implementation (§5 of the owner's message) are recorded in the S7 limitations and
calibration backlog.

## 7. Verification
**One recorded run:** `checks-run.txt`, 2026-11-17 10:36:48Z – 12:31:49Z (6,901 s), Node v24.22.3 on win32, on the
corrected code. Each section below names its output file in this folder.

### 7.1 Mutations (`mutation-check-s6-after-corrections.txt`)
**64 planted defects, 64 detected, every file restored** (SHA-256 re-checked):
- the original 53, with M19 re-pointed at the corrected grant code (correction A rewrote its line);
- M54–M58 for correction A, and M59–M64 for correction B.

**M39 is now detected** by the injection test (§5). The original run, 52 of 53 detected, stays in
`evidence/s6/gates/mutation-check-s6.txt` and `mutation-check-s6-followup.txt`, unchanged.

### 7.2 Suites (`suites/`)
| Check | Result |
|---|---|
| Typecheck | exit 0 |
| Regular tests | 1,768 passed |
| Statistical tests | 9 passed |
| Fixtures | 669 cases, 0 problems |
| Schemas | no drift |
| Python oracles | 22 groups, 0 failing |

**Why there are 22 more regular tests than the 1,746 reviewed:**
- the 20 acceptance tests;
- 2 automatic per-file isolation checks: one for the new acceptance test file, and one for an S7 draft script that was
  in the working tree (`repro/s7/traces.ts`), which is not part of the S6 commit.

The committed checkpoint is tested on its own, from a clean export (`evidence/s6-checkpoint/CHECKPOINT.md`).

### 7.3 Targeted World 1 gameplay controls (`w1-controls/`)
The registered amendment 01 manifests were run again on the corrected code (15 workers). Each run is compared with
the registered rows, every field.

| Experiment | Tasks rerun | Task errors | Rows identical to the registered rows |
|---|---|---|---|
| S6-E06 rare heroes | 40 (all) | 0 | 40 / 40 |
| S6-E07 boss rewards | 30 (all) | 0 | 30 / 30 |
| S6-E03 strategy spread | 30 (all) | 0 | 30 / 30 |
| S6-E04 earlier zones | 33 (all) | 0 | 33 / 33 |
| S6-E10 connected idle | 40 (all) | 0 | 40 / 40 |
| S6-E02 completion | the first 20 of 80 | 0 | 20 / 20 |

- **Corrections A and B change no measured result.** The rare-hero changes alter only how duplicates are stored, not
  their number, order or transaction identities. The policies never used the external boundary.
- **The E02 subset** reports the status `EXPLORATORY_SUBSET` because it runs a task subset (`--tasks 20`), as
  designed.
- **Not rerun, by instruction:** the complete 538-task matrix (E01, E05 stages 1 and 2, E11, and E02 tasks 21–80).

### 7.4 Other regressions
- **Historical controls** (`historical/`): all 9 representative controls were run fresh and MATCH their stored
  baseline fingerprints.
  - The header line "executed with the S5 code" is the script's fixed wording; the run used the current, corrected
    code.
  - The exact dependency cache reports 45 MISS, the same as at the S5 and S6 gates. Its entries predate later engine
    changes, so none is certified by dependency identity, and none is used as evidence. Cached and fresh results are
    kept apart.
- **S5 registered reruns** (`reruns/s5-reruns.txt`): S5-E01 (42 rows), S5-E04 (200) and S5-E02 (200). Each has
  semantic row fingerprints identical to the packaged ones (`3f82d4b45b011e3c`, `1cea03792a0de960`,
  `a3f1ad5417dc9503`).
- **The calibration reproduction** (`calibration-reproduction.txt`): every field the c02 row has is identical. The
  fields added since c02 are measures only.
- **The rare-history demonstration** (`rare-history.txt`): the table in §3.

### 7.5 Registration and preservation
- **Code digest** (`code-digest-check.txt`):
  - registered (amendment 01): `faac6f659d10bee4da4a60469e0129786499b5fcc345bb579880f73f34dc078b` (164 files);
  - now: `4b50b96f5120ed29e691b77b7bca1fac5840aa113f772f0a16ad8d849a488fe8`.

  With the five registered copies in `registered-copies/` substituted, the digest equals the registered one. Those
  five files (`legion.ts`, `w1.ts`, `legionObservation.ts`, `legionTypes.ts`, `simState.ts`) are therefore the only
  code differences.
- **Registrations** (`registration-check.txt`, `s6-amendment-01-registration-check.txt`):
  - S3, S3.1, S4, S5, L2 and L2.1: 0 changed;
  - S6: 20 registered files, 1 changed;
  - amendment 01: everything unchanged except the code.

  In both S6 cases the change is the code digest, as expected from corrections A and B.
- **Preservation** (`preservation-check.txt`): 0 problems. No tracked evidence, manifest, content, fixture, formula or
  reproduction file changed since `s5-checkpoint`.

### 7.6 Changed fingerprints and their reasons
| Fingerprint | Change | Reason |
|---|---|---|
| The lab code digest | `faac6f65…` → `4b50b96f…` | Corrections A and B (five files, §7.5) |
| World 1 checkpoints | state version 1 → 2; runtime `lastStep` added | A bounded duplicate representation (§3) and the external command slot (§4). A version 1 W1 checkpoint (the review package's) is refused, not converted. |
| The regular test count | 1,746 → 1,768 | §7.2 |

**Unchanged:**
- every pre-W1 checkpoint and fixture fingerprint;
- every W1 control row;
- every S5 rerun;
- every historical control.
