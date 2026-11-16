# S5 acceptance addendum

**Source:** the owner's "S5 Acceptance and S6 Authorisation" (2026-11-16). S5 is accepted, subject to the focused
account-service corrections A–D below.

**What stays unchanged:** the original S5 evidence (`evidence/s5/`), registrations (`manifests/s5/`) and results are
preserved exactly. This addendum and `evidence/s5-acceptance/` hold the corrections and their verification.

## 1. The independent review record (as the owner reported it; not restated as further verification)

**What the reviewer (ChatGPT) independently verified:**
- the ZIP SHA-256 `45bdac40…0d16`;
- all 1,588 manifest-listed files, and ZIP integrity;
- 1,181 historical files compared against L2.1: only the extended oracle runner differs;
- all 11 S5 registration hashes;
- the Python oracle suite (22 groups, 0 failures);
- reproductions: nine S5-E01 boundary cases, six S5-E02 reference-versus-batch cases (equal apart from execution
  times), and one S5-E04 case;
- two further independently seeded absences (2 h and 25 h): one batch against three batches gave identical states and
  welcome-back summaries.

**The review environment:** Linux, Node 22.16.0, with Zod shape validation bypassed, while semantic validation and the
engine logic were kept.

**What was not independently rerun:** the complete pinned Vitest suite and the complete registered matrices. A longer
partition comparison and an additional E05 case exceeded the review budget.

## 2. Corrections

### A. Outer account consistency (`src/s5/settlement.ts` `s5AccountProblems`; schema `legion.s5.account.v2`)

**The owner's reproduction:**
- settle one hour;
- rewind the outer cursor to the absence start;
- recompute the outer digest;
- deserialize and settle the earlier interval.

**Now refused.** The cursor is bound to the embedded checkpoint's progress:
- **during an absence,** `gameStart + P(cursor − wallStart)` must equal the checkpoint's game time (or `+ w` for a
  locked absence);
- **while connected,** the cursor must be the checkpoint's wall time;
- **the cursor's absence** must be the checkpoint's absence.

**In a capped absence,** every cursor beyond the cap maps to the same capped progress, so moving within that interval
cannot credit anything. Moving into the creditable interval is refused.

**Retained receipts** are validated for:
- exact shape and the request identity;
- an account version within the record, increasing;
- a receipt identity naming this account and its version;
- digests;
- intervals (never backwards);
- formula and checkpoint versions;
- cursors at the end of their interval;
- absence identities;
- captured rates;
- summary arithmetic where independently reconstructable: the credited duration equals P(elapsed), the windows, the
  cap flags, and the locked-absence form.

**Each detailed receipt is bound to its compact stream receipt** while that is retained: the stream receipt carries the
detail digest, payload hash and version. An edited welcome-back total is then refused.

**The latest receipt** must describe the stored checkpoint (its digest) and the cursor.

**A settlement summary of the still-open absence** is recomputed from the checkpoint and compared.

**Inconsistent records are refused, never repaired.**

**Malformed records the owner listed, now refused:**
- a wrong absence identity in the cursor;
- `receipts: [null]`;
- modified welcome-back resource totals.

**This is structural validation, not authentication.** A complete, internally consistent rewrite of a trusted save
(the stream receipts included) is not detected, and no digest is claimed to prevent it.

### B. Welcome-back replay

**What a retry of a committed request returns:** its compact receipt **and its retained original detail**
(`detailStatus: RETAINED`).
- **The latest reconnect's detail** is kept in the record's `welcomeBack` field, independent of the 32-receipt window.
- **Explicit lookup:** `retainedWelcomeBack(account, absence)`.

**After eviction,** a replay returns the compact receipt with `detail: null, detailStatus: EVICTED`. Nothing is ever
recomputed from a later account, and exactly-once settlement is unchanged.

**Tested:**
- a response lost after the commit recovers the original summary (deep-equal);
- the latest welcome-back is retained after 34 newer receipts;
- a superseded one is reported as `EVICTED`.

### C. Session schedule growth

**The fix:** the engine accepts a session offset (offline mode only). The account service compacts the persisted
schedule at every commit to the current session onward (`compactCheckpoint`).

**What is preserved:**
- monotonic session and absence identities;
- the current session or absence and its wall bounds;
- the wall and game anchors;
- the captured efficiency;
- outstanding settlement state;
- replay protection.

**Historical experiment schedules** are unaffected: they never use an offset.

**Tested with 150 repeated reconnects** (beyond both receipt windows):
- the persisted schedule holds one session, at offset k + 1;
- the record stops growing once the windows have filled (under 5 % between 60 and 150 reconnects);
- the final state equals one uncompacted engine run of the full schedule;
- the record deserializes and resumes.

### D. Between-session Monument purchases (S5-R14 approved)

**The fix:** every mode refuses `UpgradeMonument` outside a connected session (`NOT_IN_SESSION`); the S4 mode is
included.

**Why S4 is unaffected:** no S4 control submits a purchase between sessions. The historical S4 controls are
re-verified below.

## 3. Verification
**Run in the S5 checkpoint tree** (2026-11-16, 18:03–19:15Z; `checks-run.txt`). This tree is S5 as reviewed plus the
corrections only, rebuilt in a separate git worktree because unreviewed S6 work in progress shares the canonical
working tree. The method and its four byte-for-byte cross-checks are in `rebuild-record.txt`.

**Tests for the corrections:** `test/s5.acceptance.test.ts`, which covers A–D and the owner's reproductions. It includes
two follow-up tests, each consistency check of A on its own, added after the first mutation run.

**Mutation checks:**
- **First run, before the follow-up tests** (`mutation-check-corrections.txt`): 11 of the 13 correction-related planted
  bugs were detected. M34 (cursor bound to progress) and M37 (latest receipt bound to the checkpoint and cursor) were not.
- **After the follow-up tests, the full S5 set:**
  - **Part 1** (`mutation-check-s5-full-final.txt`): M1–M17 detected (17 / 17). The run then stopped at M18, because its
    pattern was the line correction C rewrote. The script refuses a pattern that is not found exactly once, and nothing
    was changed. M18 was re-pointed at the rewritten line, as the same planted bug.
  - **Part 2** (`mutation-check-s5-full-final-part2.txt`): M18–M40 detected (23 / 23), including M34 and M37.
  - **In all, 40 of 40 detected,** with every file restored.

**Suites** (`suites/`):
- type check pass;
- 1,668 / 1,668 tests and 9 / 9 statistical tests;
- 669 fixture cases with 0 problems;
- schemas OK;
- 22 oracle groups, 0 failing.

**Historical controls, run fresh** (`historical/`):
- nine representative controls, all MATCH against their stored baselines (S1.1-E03, S2-E04, S2-E05, S2.1-E03, S3-E02,
  S3-E03, S3.1-E03, S4-E03, S4-E04). S4-E03 and S4-E04 cover correction D's change to the S4 mode.
- The exact dependency cache reports 45 MISS, as for S5 itself: the engine and core files changed since L2, so no
  historical result is reused from the cache. The controls above are the fresh re-execution (owner §17).

**S5 registered reruns on the corrected code** (`reruns/s5-reruns.txt`, 8 workers): S5-E01 (42 rows), S5-E04 (200) and
S5-E02 (200). Each semantic rows fingerprint (timing fields excluded) is identical to the packaged one, so corrections C
and D change no registered S5 result.

**Registration and preservation:**
- the registration check shows 0 changed (S5, L2.1, L2, S4, S3.1, S3);
- the preservation check shows 0 problems (no tracked evidence, manifest, content, fixture, formula or reproduction file
  changed since `l2-checkpoint`).

**Not independently verified:** all of the above was run by the implementer, not by an independent reviewer.

## 4. Owner resolutions recorded
- **The rules:** S5-R01 … R14 are approved with the corrections above. All numeric content remains candidate.
- **The offline defaults are kept:**
  - 60 % for 24 h;
  - 30 % for the following 48 h;
  - nothing after 72 credited wall hours;
  - the Monument of Eternity raises the normal rate towards 100 %.
- **H-S5-03 (a 30–60 % offline share) is rejected as a target** for raw EXP, gold and materials. The failed historical
  result is preserved.
