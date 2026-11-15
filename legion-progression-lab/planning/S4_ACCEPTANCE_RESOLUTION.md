# S4 acceptance resolution

**Version 1.0, 2026-11-15.** Source: the owner's "Independent S4 Review and L2 Authorisation" (2026-11-15).

**Decision:**
- S4 is **accepted subject to three targeted corrections**: no comprehensive S4 balancing increment, and no separate S4.1 review unless the corrections expose broader defects.
- After the corrections pass, S4 is committed as a local checkpoint (`s4-checkpoint`) and L2 is authorised.
- **S5 stays unauthorised until L2 passes independent review.** Nothing is pushed while the GitHub repository is public.

## 1. What the independent reviewer verified (as stated by the owner, not re-verified here)
**Package integrity:**
- ZIP SHA-256 `c1afb04cde38ddf409cf9ef56130719ac77e454fb8b1ef8ec3cf3b780ed1d457`;
- all 1,268 manifest-listed files match, with no unexpected files;
- all 844 historical content, manifest and evidence files compared against the S3.1 archive are byte-identical;
- all eight unique S4 registration documents and manifests match their recorded hashes.

**Oracles and tables:**
- the complete Python oracle command: 19 groups, 0 failures;
- **not executed independently:** eight hand-only content cases and the generated-preview check;
- all 200 base EXP thresholds and all 1,800 sweep thresholds match.

**Analysis:**
- the analysis JSON regenerates exactly;
- the text reproduction lacked the pass-1 section, because the historical pass-1 directory was not supplied.

**Experiments re-run by the reviewer:**
- the complete S4-E05 (5,000 states) and S4-E02 (5,000 sets) runs match the packaged summaries, excluding duration;
- 200 new S4-E01 scenarios with the seed root `independent-s4-review`:
  - 20,867 commands, 2,046 replayed credits (all rejected), 3,660 duplicated or late checks, 4,596 rewards;
  - 0 duplicate grants, 0 record changes outside credit, 0 fork mismatches, 0 isolation or round-trip breaks;
  - 2,055,713 monitor checks, 0 violations.

**Limits of the independent verification:**
- **Environment:** the TypeScript checks ran on Linux with Node 22.16.0, in a separate review copy with Zod shape validation bypassed. The simulation and engineering experiment code was kept.
- **Not run independently:** the complete pinned Vitest suite. The supplied logs support 1,228 regular tests, 9 statistical tests, 450 fixtures and the reported mutation results.

## 2. The three corrections
| Correction | Finding | Resolution | Record |
|---|---|---|---|
| **A** lifetime counter precision | Lifetime gold at `Number.MAX_SAFE_INTEGER` plus a gold reward of 2 gave 9007199254740992, not 9007199254740993. No error was raised. This is a constructed numerical boundary diagnostic, not a gameplay exploit | **Checked addition** for every authoritative permanent count. **Domain validation** before a run. **A refused step commits nothing** (the account state returns to the state before the step) and the run stops. Nothing is clamped or discarded. No large-number architecture | `spec/formulas/s4-permanent.md` v1.1 §9.1 |
| **B** effective bonus registry metadata | With `monumentPooling = 'additive'`, the calculation was correct (one 2,200 bp attack pool), but `bonusSources` still described Power as `cat.damage.monument` | Canonical identity (`target`, `canonicalCategory`) is kept apart from effective application (`appliedStat`, `appliedCategory`). The observation gains the effective `groups`. Applies to Power and Vitality. **Gameplay unchanged** (identical event logs before and after) | §9.2 |
| **C** regional Bestiary mastery | S4-R16 specifies Gold, but the compiler took the maximum defined threshold. Adding Diamond (700) to Green Slime moved mastery from 600 to 700 | **The required rank is named:** Gold for schema-1 packs (v0.4.0), or an explicit `mastery.requiredRank` (schema 2, new candidate pack v0.4.1, otherwise identical). Missing or invalid definitions are refused. The v1 wording "highest rank threshold" is clarified in v1.1 | §9.3; `content/w1-slice-s4.candidate.v0.4.1.json` |

**Evidence:** `evidence/s4-acceptance/ADDENDUM.md`.

**Owner rule decisions:** `planning/S4_OWNER_RESOLUTIONS.md`.
