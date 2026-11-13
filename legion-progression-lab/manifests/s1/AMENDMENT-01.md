# S1 pre-registration amendment 01 — S1-E06b drop correctness (larger, independent sample)

**Registered:** after S1-E06 ran and before S1-E06b ran, 2026-11-13. Its hash is recorded under `amendments` in `preregistration.json`. The original S1-E06 manifest, result and fingerprint stay exactly as they are, and are reported as run.

## What S1-E06 showed about its own design (not about the targets)
1. **Too few kills.** The manifest said "over 100,000 kills per zone", but 50 runs × 30 min produced only:
   - 59,750 kills in each of zones 1 and 2;
   - 33,930 kills in zone 3.

   The kill rate was overestimated. At level 100 the hero is limited by spawns, not by damage.
2. **Shared seeds.** Replicate *i* used the same seed in every zone, which is the runner's default for comparisons. Zones 1 and 2 therefore drew the test-token roll from identical random numbers: 114 tokens in each, the same evidence counted twice.

S1-E06 still passed its gate: every count was inside its interval, with 0 ledger mismatches. This amendment does not change that result, the gate, the interval rule or α.

## S1-E06b (new manifest `S1-E06-drop-correctness-b.json`)
**Changes from S1-E06:**
- 100 replicates of 60 minutes per zone. Expected kills are about 239,000 in each of zones 1 and 2 and about 136,000 in zone 3, all over 100,000.
- Independent seeds per zone (`seeds.perCell = true`): replicate *i* of cell *c* uses `S1-E06B#cell-c#rep-i`.

**Unchanged:**
- the gate: every pooled count is inside the exact two-sided binomial 99.9% interval, with 0 ledger mismatches;
- the level-100 diagnostic set-up;
- the drop chances.

**`perCell` option:** added to the runner for this amendment. It is optional and defaults to false, so every earlier manifest runs exactly as before. `exp:verify` of S1-E06 still MATCHes.
