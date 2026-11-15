# L2 acceptance addendum: corrections A and B

**Version 1.0, 2026-11-15.** Source: the owner's "L2.1 Acceptance and S5 Authorisation" §2–§4. The owner's decisions are in `planning/L2_ACCEPTANCE_RESOLUTION.md`. **Every check here was run by the same author** as the code; this is not an independent review.

## 1. Correction A: safe stream dictionaries
**The defect:** the stream-name alphabet `[a-z0-9][a-z0-9:._-]{0,63}` admits `constructor`. Indexing an ordinary object by it read `Object.prototype.constructor`, so the compact store crashed:
- the request threw `s.receipts is not iterable`;
- the credit threw while reading range data.

**The correction:**
- **Own-property lookups:** every dictionary lookup keyed by a stream or kind name now goes through `own()` in `src/l2/compactIds.ts`, which reads only own properties. That covers request streams, credit streams, producer kinds, the differential harness's reason checks, checkpoint validation and the fixture handlers.
- **Unchanged:** the dictionaries keep their canonical serialization, and every legitimate stream name keeps its meaning.
- **The full-history reference** uses `Map` and was not affected; that is now tested.
- **Names outside the alphabet** (`__proto__`, `toString`, the empty name, names with spaces, names over 64 characters) were and remain controlled envelope refusals (`INVALID_DELIVERY`), and a checkpoint naming one is refused by name.

## 2. Correction B: the request-stream reconstruction invariant
**The defect:** `streamProblems` did not check that the highest executed sequence `top` keeps its receipt or lies at or below the horizon. A checkpoint with the receipt removed (`top` 1, `horizon` 0) restored, and the retry of request 1 executed again, creating a second batch producer.

**The correction:** `src/l2/requests.ts` `streamProblems` refuses `top > horizon` without a retained receipt for `top`:

> the highest executed sequence `top` has neither a retained receipt nor lies at or below the horizon

The invariant holds by construction for every state the code produces: a receipt leaves only by expiry or eviction, and either raises the horizon to at least its number. This is structural validation, not authenticity.

## 3. Before and after (the reviewer's inputs; `repro/l2-acceptance/findings.ts`)
| Case | Before (the L2.1 package, `findings-before.json`) | After (`findings-after.json`) |
|---|---|---|
| A: compact store, stream `constructor`, request then credit | `TypeError: s.receipts is not iterable`; `TypeError` reading `length` | `APPLIED` `{code: OK, t: 0, ore: 0}`; `APPLIED` |
| A: full-history reference, same deliveries | `APPLIED`; `APPLIED` (unaffected) | `APPLIED`; `APPLIED` |
| B: receipt of `top` 1 removed, digest recomputed, then restore and retry | **accepted**; the retry executes, so batch producers allocated = 2 | **refused** (`INVALID_CHECKPOINT`, the message above) |

## 4. Tests added (`test/l2.core.test.ts`, "L2 acceptance corrections")
- **A, inherited names:** `constructor`, `prototype`, `valueof`, `tostring`, `hasownproperty`, `isprototypeof`, `propertyisenumerable` and `tolocalestring`. For each name, in both stores:
  - a request, its retry, a credit, a duplicate credit and an abandonment behave exactly as for any other name;
  - through a checkpoint, the restored account replays and refuses exactly the same way.
- **A, names outside the alphabet:** controlled refusals in both stores, with the account unchanged. A checkpoint naming `__proto__` is refused by name.
- **B, the review case:** refused. The unedited checkpoint restores, and its retry replays (one producer).
- **B, legitimate states accepted:**
  - the highest number closed by expiry (`top` = `horizon`, no receipt);
  - out of order: 5 at 0 and 2 at 50, then at 101 receipt 5 has expired (`horizon` 5 = `top`) while receipt 2 stays live below the horizon, replays, and 5 is closed;
  - the highest number retained above the horizon after a lower one expired;
  - removing that highest receipt is refused.
- **Valid out-of-order histories:** the existing property test checks `streamProblems` on 400 random histories against the definition-based window model, and still passes.

## 5. Checks (`checks-run.txt`, 2026-11-15 18:20:05–18:26:02 UTC)
| Check | Result |
|---|---|
| Acceptance mutation set (`repro/l2-acceptance/mutation_check.py`: A1–A3 the prototype reads, B1 the invariant) | **4 / 4 detected**; files restored |
| The L2.1 mutation set re-run on the corrected code | **38 / 38 detected** |
| Tests | **1,480 passed** (1,475 before, plus 5 new); statistical tests **9 passed** |
| Type check | exit 0 |
| Fixtures | **607 cases**, 0 problems |
| Oracles | **21 groups**, 0 failing |
| Focused differential and partition: the registered L2.1-E02 (250,000 deliveries) and L2.1-E03 (2,000 × 5) re-run on the corrected code | status and result **identical** to the L2.1 packaged ones |
| Historical experiments | **not re-run** (owner §4). The exact dependency cache shows 45 / 45 hits: no historical runner's closure contains the changed files |
| Registration (L2.1, L2, S4, S3.1, S3) | 0 changed |
| Preservation | 0 problems: the L2 records match the L2 package byte for byte, and no tracked earlier evidence changed |
