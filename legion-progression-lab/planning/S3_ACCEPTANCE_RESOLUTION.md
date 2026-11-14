# S3 and S3.1: final acceptance resolution

**Version 1.0, 2026-11-14.** Source: the owner's "S3.1 Final Acceptance and S4 Authorisation".

S3 and S3.1 were independently reviewed from the complete S3.1 review package. **The implementation is accepted, subject to the small crafting correction** recorded in the S3 acceptance addendum (`evidence/s3-acceptance/ADDENDUM.md`). The owner authorises:
- the local checkpoint `s3-checkpoint`;
- S4, after that checkpoint.

**No further comprehensive S3 hardening or economic calibration increment.**

## 1. Accepted package
- **Package:** `legion-S3.1-review-2026-11-14.zip`, SHA-256 `741a96dde5cc930c3f80b187a887f10b327b050dcbc9aac6090321cc2f7b4dcf`, 1,108 files.
- **Committed as:** the S3.1 package's working tree, plus the acceptance correction and its records. The difference from the package is listed file by file in `evidence/s3-checkpoint/CHECKPOINT.md`.

## 2. Independent verification (as stated by the owner; not overstated)
**The reviewer independently verified:**
- the ZIP SHA-256 above;
- all 1,108 manifest-listed files (checksums and sizes), with no unexpected files apart from the manifest itself;
- that all 652 historical content, manifest and evidence files compared against the original S3 package are byte-identical;
- that all 23 unique S3 and S3.1 registered documents and manifest files match their recorded hashes;
- the complete supplied Python oracle command: 18 groups, 0 failures (eight content fixtures are hand-only; the generated-preview check was skipped);
- all 200 base and all 1,800 sweep EXP thresholds;
- that the S3.1 analysis JSON and text regenerate byte for byte;
- that the complete corrected defect reproduction matches the packaged JSON, apart from the local directory path;
- all 100 replicates of `S3.1-E03-equipment-strength / control|Z3-L7|copper-full`, which match the packaged results exactly:
  - semantic cell fingerprint `f861385df59ad74ad0709b0c47edcf57f83c6eb4b8b842370ca6c614fd98b021`;
  - combined event-log digest `82e074fb53315365372c078eea1ffeb13c06553181690f5772a01bbe3b30b32f`.

**Conditions of those checks:** the independent TypeScript checks ran on Linux with Node 22.16.0, in a separate review copy with Zod shape validation bypassed. The actual simulation engine, policies, persistent ledger and semantic validation were retained.

**Not independently executed:** the complete pinned Vitest suite. The supplied evidence supports 1,116 regular tests, 9 statistical tests, 422 fixture cases and 37 detected mutations.

## 3. The crafting correction (owner §2)
- **What the reviewer found:** a dead hero could craft during the respawn delay. Recruit knockouts are `CharacterState.knockedOut`, but hero death is `HeroState.status`, which `crafterBlocker` did not check.
- **The fix:** it is refused (`CRAFTER_DEAD`) in four places: the engine's eligibility check, the crafting menu, the engine's defensive guard (the same function) and monitor I20 (re-stated independently).
- **Clarified contract:** travel, a pending engagement and regeneration do not block crafting.
- **Details, tests, mutation checks and the regression comparison:** `evidence/s3-acceptance/ADDENDUM.md`.

## 4. S3.1 owner resolutions (owner §3)
`planning/S3_1_OWNER_RESOLUTIONS.md` v1.0 records S3.1-R01 … R12. **No numerical coefficient is promoted.**

## 5. Economic balance decisions (owner §4)
### A. Content horizon and investment payback
**What the owner acknowledges:**
- No tested industrial strategy recovers its cumulative EXP opportunity cost within the S3.1 horizon.
- The corrected fresh-account POL3-DEMAND2 campaign reaches the pure-combat late EXP rate, but keeps an absolute cumulative deficit of about **23,662 legion EXP** (597,376 against 573,714 at 180 min).
- **A narrowing percentage deficit is not evidence of payback.**
- The three-zone ceiling makes extended payback experiments uninformative.

**Instructions:**
- Do not repeat the three-hour campaign with different gear multipliers.
- **During S4, run one bounded matched-state diagnostic:**
  - an under-levelled account;
  - sufficiently challenging diagnostic enemies with adequate spawn availability;
  - labelled diagnostic content, not a new world zone and not a change to the frozen S3 baseline;
  - comparing combat and recruitment, equipment and industry, Monument investment, and a balanced investment.
- **The full campaign payback question is deferred to S6,** when complete World 1 content exists.
- **No mandatory equipment gates.**

### B. Onboarding equipment
- **A starter-weapon candidate for the hero is approved.** Its statistics are modest, so crafted Wood and Copper still matter.
- **The starter weapon is a candidate content variant, not a silent change to S3.** The historical unarmed controls are preserved.
- **The S3.1 milestone results are retained.** New metrics are registered separately:
  - first simple crafted item: candidate 5–10 active min;
  - first crafted combat item equipped;
  - first meaningful upgrade over an already equipped combat item: candidate 15–25 active min;
  - first meaningful hero-specific equipment upgrade;
  - first Copper combat item equipped: reported before a target is chosen.
- **The meaningful-upgrade criterion stays** at least +10% under a declared matched-state combat measure, unless an alternative is pre-registered.
- **No artificial delays.**

### C. Reference industrial policy
- **POL3-DEMAND2 is the primary realistic industrial reference policy from S4 onward.**
- POL3-DEMAND, the fixed-role S3 strategies and POL3-CONQ are preserved as historical controls.
- POL3-DEMAND2 was developed after the initial S3.1 results and evaluated in a separately registered follow-up.
- **Its decisions are not measured human behaviour.**

### D. Copper strength
- The existing Copper candidate statistics are retained. The informative comparison already meets the 25% TTK target.
- Stronger Copper variants remain experimental.

### E. Percentage weapons
- Percentage and hybrid weapon scaling continue to be investigated. Preferred candidate designs have:
  - a meaningful flat attack component;
  - a controlled percentage of level-based attack;
  - explicit additive grouping;
  - no independent multiplier per equipment piece.
- The current percentage-weapon variant is **not** promoted to the baseline.

### F. Hero advantage
- **Hero base attack ×1.5 is the leading candidate** for later full-squad comparisons, together with meaningful manual abilities.
- The control and ×1.25 are kept; ×2 is a sensitivity arm, not the preferred default.
- The full-squad 30–60% hero damage-share range remains a candidate target.
- Class-specific utility and defensive contribution are to be considered: a Warrior's tanking value is not fully captured by raw damage share.
- **No existing content pack is silently replaced.**

## 6. Checkpoint and next increment (owner §5)
- **Checkpoint:** after the correction passes, S3 and S3.1 (with the correction) are committed as one local checkpoint and tagged `s3-checkpoint`. The commit SHA and the checks are recorded in `evidence/s3-checkpoint/CHECKPOINT.md`.
- **Preserved:** historical evidence, content, manifests and results.
- **Not done:** no push while the GitHub repository is public, and no old workspace deleted.
- **S4** is authorised after the checkpoint, and must not be committed before independent review and owner acceptance.
- **Not started:** S5 and L2 implementation.
