# L2 and L2.1 acceptance resolution

**Version 1.0, 2026-11-15.** Source: the owner's "L2.1 Acceptance and S5 Authorisation" (2026-11-15). This records the owner's decisions; the work is in `evidence/l2-acceptance/ADDENDUM.md`, and the checkpoint in `evidence/l2-checkpoint/CHECKPOINT.md`.

## 1. Decision
- **L2 and L2.1 are accepted**, subject to two boundary corrections:
  - **A:** safe stream dictionaries;
  - **B:** the request-stream reconstruction invariant.
- **After the corrections:** commit L2 and L2.1 locally, tag `l2-checkpoint`, record the commit SHA, and verify the frozen workspaces.
- **Do not:** create another comprehensive L2 hardening increment, push to the public repository, or delete old workspaces.
- **S5 is authorised** after the checkpoint (owner §6–§20).

## 2. Independent verification (owner §1, as stated by the owner)
**ChatGPT independently verified:**
- the L2.1 ZIP: SHA-256 `08908e68…6c5e`; 1,443 files matching; no unexpected files; integrity passes;
- 7 of 7 registration hashes;
- 1,108 historical files unchanged, except the oracle runner extended for L2.1;
- the Python oracle suite: 21 groups, 0 failures;
- the XP thresholds: 200 base and 1,800 sweep;
- the findings-after script reproducing the packaged JSON;
- the owner's partition example: 250 ore;
- an additional differential: seed `independent-l21-review`, 20,000 deliveries, tight window, both comparisons. The results:
  - 0 mismatches, 0 disagreements, 0 invariant and 0 bound violations;
  - 20 checkpoint and 10 branch comparisons;
  - 0 wrong-branch admissions;
  - 2,767 reason-checked `REQUEST_CLOSED` outcomes.

**The conditions of that verification:**
- it ran on Node 22.16.0 on Linux, with schema validation bypassed for known-valid content in a separate review copy;
- the complete pinned Vitest suite, the million-delivery workload and the registered performance benchmarks were **not** independently re-run;
- a larger independent partition workload exceeded the review's execution budget, so **it did not complete**;
- eight content fixtures remain hand-only, and the generated-preview oracle check was skipped.

## 3. Owner decisions on the L2.1 contract (`planning/L2_1_CONTRACT.md` §10): all five approved
1. **Age expiry may close earlier never-seen request numbers,** under the generation-order protocol.
2. **`REQUEST_AHEAD` is anchored on the highest executed number.**
3. **Settlement is driven by trusted time,** not by client requests.
4. **Valid delivery envelopes may advance legitimate elapsed economy time** independently of command success.
5. **Internal credit admission windows and explicit abandonment** are approved.

**Clarifications** (they apply to the actual engine in S5 as well):
- Wrong-branch, malformed-envelope and invalid-clock deliveries have **no effect**.
- A valid delivery whose purchase or command then fails may still follow independently committed chronological advancement.
- A failed batch command commits none of its own proposed outputs, reservations or identity transitions.
- **A failed actual offline settlement must not mark its interval as consumed.**
- The authoritative settlement cursor, credited rewards, RNG and identity evidence are committed atomically.
- **Clients cannot supply authoritative time.**
- All numeric window and capacity limits remain engineering candidates until tested against the actual engine.

**Also approved:**
- the revised bounded request contract;
- automatic producer retirement;
- exact credit windows;
- compact retired ranges.

**The full-history reference stays available.**

## 4. The corrections required (owner §2, §3)
- **A. Safe stream dictionaries:**
  - stream names such as `constructor` must not read inherited properties, in request and credit streams, the full-history reference and checkpoint reconstruction;
  - unsupported names must be controlled refusals, not `TypeError`s;
  - canonical serialization and the existing stream semantics are preserved.
- **B. The request-stream reconstruction invariant:** the highest executed sequence must have a retained receipt, or lie at or below the closed horizon. A checkpoint that breaks this is refused. This is structural validation, not authenticity.

**Verification for the checkpoint (owner §4):**
- relevant tests, fixtures, the oracle, and focused differential and reconstruction checks;
- the full regular and statistical suites;
- **no repeat of the historical game experiments** for these isolated L2 corrections.
