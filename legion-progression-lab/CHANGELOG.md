# Changelog

Every change to formula specs, fixtures, content or baselines is recorded here, with its decision ID, rationale, evidence and version.

## L2 acceptance — 2026-11-15 (two boundary corrections; L2 checkpoint)

**Source:** owner "L2.1 Acceptance and S5 Authorisation" §1–§5. **Decision:** `planning/L2_ACCEPTANCE_RESOLUTION.md` (L2 and L2.1 accepted; all five L2.1 contract decisions approved). **Evidence:** `evidence/l2-acceptance/ADDENDUM.md`.

- **A. Safe stream dictionaries:** request, credit and producer-kind dictionaries are read by own property only (`own()` in `src/l2/compactIds.ts`), so a stream named `constructor` (or any inherited name) behaves like any other.
- **B. Reconstruction invariant:** `streamProblems` refuses a stream whose highest executed sequence has no retained receipt and lies above the horizon.
- **Tests:** 5 new in `test/l2.core.test.ts`. **Mutation checks:** `repro/l2-acceptance/mutation_check.py` (4 / 4). **Reproductions:** `repro/l2-acceptance/findings.ts`.

## L2.1 — 2026-11-15 (correctness and bounded-memory correction of L2; accepted 2026-11-15 with the L2 acceptance corrections)

**Source:** owner "Independent L2 Review and L2.1 Authorisation". **Contract:** `planning/L2_1_CONTRACT.md` v3.0 (revises `L2_CONTRACT.md` v2.0, which is kept). **Rules:** `spec/formulas/l21-replay.md` v2 (formula version `l2.1-v2`). **Pre-registration:** `manifests/l2.1/`. **Evidence:** `evidence/l2.1/L2_1_EVIDENCE.md`.

- **Receipt expiry and the bounded window** (`src/l2/requests.ts`): receipts expire by trusted acceptance time on every delivery, out of order included. A stream keeps a horizon, the highest executed number and at most `maxRecent` receipts; `REQUEST_CLOSED` replaces `REPLAY_TOO_OLD` and `REQUEST_EXPIRED`; far-ahead numbers are `REQUEST_AHEAD`; stream count limit.
- **Limits** (`src/l2/limits.ts`): every retained structure has a declared bound.
- **Credits:** exact range sets with an admission window (`CREDIT_AHEAD`) and explicit abandonment (`creditAbandon`).
- **Producer lifecycle** (`src/l2/producers.ts`, `account.ts`): units in order, outstanding and unit limits (rotation), closing (`closeBatch`; jobs on completion or cancellation), automatic retirement. The explicit `retire` request is removed.
- **Validated reconstruction:** exact interval arithmetic for producers (`ranges.ts`: `isSubset`, `disjoint`); a full simulation-state validator (`src/l2/simState.ts`) with required fields per feature, domains, cross-references and event rules. The simulation checkpoint is now v2: committed kill credits are stored flat, because L2's nested encoding overflowed after a few thousand kills.
- **Immutability:** frozen receipts, nested records, RNG and reservation lines; only module-made accounts are accepted.
- **Branch identity:** accounts and deliveries carry their branch (`fork`, `BRANCH_MISMATCH`).
- **Delivery parts:** envelope (`INVALID_DELIVERY`, `TIME_BACKWARDS`, `BRANCH_MISMATCH`), independently committed advancement (`advanceTo`), atomic command; `settle` can no longer go ahead of the trusted time (`SETTLE_AHEAD`).
- **Approved optimisations,** each verified byte-identical against the previous implementation (`evidence/l2.1/optimisation/`): copy-on-write items, structural comparison in the differential, Feat evaluation only when a tier can become eligible; independent partition cases on worker threads.
- **Runners:** enforced wall and memory budgets for every experiment kind; peak memory measured during execution; manifests of another formula version are refused.
- **Fixtures and oracle:** new families `l21-requests`, `l21-credits`, `l21-lifecycle`, `l21-delivery` with `spec/oracle/l21_oracle.py`; `l2-requests` is superseded (kept, not run against the code).
- **Tests:** `test/l2.core.test.ts` (rewritten), `test/l21.findings.test.ts`, additions to `test/l2.sim.test.ts`. **Mutation checks:** `repro/l2.1/mutation_check.py`. **Reproductions:** `repro/l2.1/findings_before.ts`, `findings_after.ts`. **Cache:** `repro/l2.1/history_cache.py`.
- **Not built:** offline gameplay, the Monument of Eternity, the store's integration into the gameplay engine, Roblox persistence.

## L2 — 2026-11-15 (bounded replay infrastructure; accepted with L2.1 and the L2 acceptance corrections)

**Source:** owner "Independent S4 Review and L2 Authorisation" §8–§12. **Contract:** `planning/L2_CONTRACT.md` v2.0 (revises the v1.0 proposal, which is kept). **Rules:** `spec/formulas/l2-replay.md` v1. **Pre-registration:** `manifests/l2/` (registered 2026-11-15T13:26:46Z). **Evidence:** `evidence/l2/L2_EVIDENCE.md`.

- **New module `src/l2/`** (pure; the purity scan now covers it):
  - range sets (`ranges.ts`);
  - request streams with bounded receipts and closed horizons (`requests.ts`);
  - producers, work operations and retirement (`producers.ts`, `ids.ts`);
  - the COMPACT identity store (`compactIds.ts`) and the FULL L1 reference (`l1Reference.ts`);
  - the synthetic account with request identities, atomic batch settlement and chronological settlement (`account.ts`);
  - validated checkpoints (`checkpoint.ts`) and validated save and restore of the actual simulation (`simCheckpoint.ts`);
  - the differential and partition harnesses (`differential.ts`, `partition.ts`).
- **CLI:** `src/cli/l2-run.ts` (refuses unregistered or changed manifests) and `src/cli/l2-perf.ts` (staged workloads with enforced budgets; the differential and partition harnesses have no deadline check).
- **Engine (additive):** `LegionSimulation.runtimeSnapshot()` and `LegionSimulation.restoreRuntime()`, plus the exported `SimRuntime` type. No existing behaviour changed.
- **Error codes (append-only):** `RANGE_OVERLAP`, `INVALID_CHECKPOINT`, `BRANCH_MISMATCH`.
- **Fixtures:** families `l2-ranges`, `l2-requests`, `l2-work` and `l2-settlement` (generator `repro/l2/make_fixtures.py`), with the oracle `spec/oracle/l2_oracle.py`.
- **Tests:** `test/l2.core.test.ts` and `test/l2.sim.test.ts`. **Mutation checks:** `repro/l2/mutation_check.py`. **Examples:** `repro/l2/examples.ts`.
- **Not built:** offline combat, gathering or Smithing simulation, the Monument of Eternity, offline rewards UI, S5 campaigns, new zones, Roblox gameplay. The engine's own commands are not yet routed through the L2 request layer.
- **Performance:** `evidence/perf-audit/PERFORMANCE_AUDIT_L2_ADDENDUM.md` (the L2 cycle measured, a profile of the L2 differential, the suites revised, and a correction to the audit's §8; the audit itself is unchanged).

## S4 acceptance — 2026-11-15 (three targeted corrections; S4 checkpoint)

**Source:** owner "Independent S4 Review and L2 Authorisation" §1–§7. **Decision:** `planning/S4_ACCEPTANCE_RESOLUTION.md`. **Owner rule decisions:** `planning/S4_OWNER_RESOLUTIONS.md` (S4-R01 … R28). **Evidence:** `evidence/s4-acceptance/ADDENDUM.md`.

- **A, checked lifetime counters:** `addCounter` and `creditPermanentState` (`src/engine/permanent.ts`); domain validation before every run (`permanentStateProblems`). A refused step restores the account state from before the step and stops the run (`src/engine/legion.ts`).
- **B, effective bonus metadata:** `canonicalCategory`, `appliedStat` and `appliedCategory` on every bonus source, and the observation's effective `groups` (`src/model/permanentTypes.ts`, `src/engine/permanent.ts`). Gameplay unchanged (identical event logs).
- **C, regional mastery rank:** the required rank is named: Gold for schema-1 packs, or an explicit `mastery.requiredRank` in schema 2 (`src/model/permanentContent.ts`). New candidate pack `content/w1-slice-s4.candidate.v0.4.1.json` (v0.4.0 unchanged).
- **Spec:** `spec/formulas/s4-permanent.md` v1.1 (§9). **Fixtures:** new family `permanent-acceptance.v1.json` (31 cases), with the oracle extended. **Tests:** `test/s4_acceptance.permanent.test.ts`. **Mutation checks:** `repro/s4-acceptance/mutation_check.py` (13). **Error codes:** none added for S4.
- **Not changed:** every S1–S4 result and fingerprint; the S4 v0.4.0 pack; the registered S4 manifests.
- **Performance audit:** `evidence/perf-audit/PERFORMANCE_AUDIT.md` (requested with the authorisation; measurements only, nothing adopted).

## S4 — 2026-11-14 (permanent progression; accepted with the 2026-11-15 corrections)

**Source:** owner "S3.1 Final Acceptance and S4 Authorisation" §6–§18. **Specification:** `planning/S4_SPECIFICATION.md` v1.0; **proposed rules:** `planning/S4_RESOLUTIONS.md` (S4-R01 … R28, awaiting owner review). **Pre-registration:** `manifests/s4/` (with amendment 01). **Evidence:** `evidence/s4/S4_EVIDENCE.md`. **L2:** `planning/L2_CONTRACT_PROPOSAL.md` (design only).

- **Engine:** a `permanent` switch (with `legion` and `industry`; off reproduces S3.1 exactly). Permanent state, the bonus registry (`src/engine/permanent.ts`), Monuments with independent cost and bonus curves, soft-cap tiers, material milestones, atomic purchases and Buy Max; the Bestiary (per accepted credit), emblems (own RNG stream, first copy rewarded), regional rewards; lifetime Feats; class-record and roster milestones; one coalesced milestone evaluation per moment at PROGRESS and the stat recompute at RECOMPUTE (S4-R07).
- **Stats:** StatMods gain `permAttackBp`, `monumentAttackBp`, `permHpBp`, `monumentHpBp` (0 outside S4). Ordinary permanent bonuses join the existing pools; the S1-registered `cat.damage.monument` is the one Monument of Power category; efficiency bonuses join the S3 efficiency sum once.
- **Content:** `content/w1-slice-s4.candidate.v0.4.0.json` (generator `repro/s4/make_content.py`); every number a candidate; the starter weapon is a variant only.
- **Monitor:** I22–I28 (`src/experiments/permanentMetrics.ts`); I12 accepts the starter-variant item; I13 knows the `monument.purchase` sink; I19 compares S3 modifiers only.
- **Measurements and policies:** `src/experiments/s4Metrics.ts`; POL4-MONUMENT, POL4-BESTIARY, POL4-BALANCED (`src/policy/permanentPolicies.ts`), and version 1.1 (POL4-MONUMENT2, POL4-BALANCED2) from amendment 01.
- **Experiments:** `src/cli/exp4.ts` (+ worker), `src/cli/s4-engineering.ts` (S4-E01, E02, E05), `src/cli/s4-make-manifests.ts`, `src/cli/s4-amend.ts`, `src/cli/s4-analyse.ts`, `src/experiments/s4Manifest.ts`, `s4Patch.ts`, `s4Jobs.ts`, `s4Engineering.ts`.
- **Fixtures:** new family `permanent-rules.v1.json` (28 cases; generator `repro/s4/make_fixtures.py`), `spec/formulas/s4-permanent.md` v1, oracle `spec/oracle/s4_oracle.py`.
- **Not changed:** the S1–S3 packs, every S1–S3.1 manifest, result and fingerprint; S3.1 measures gain only permanent-aware inputs that are identities outside S4.

## S3 acceptance addendum — 2026-11-14 (S3 and S3.1 accepted subject to this correction; committed with them as the `s3-checkpoint`)

**Source:** owner "S3.1 Final Acceptance and S4 Authorisation" §2–§5. **Records:** `planning/S3_ACCEPTANCE_RESOLUTION.md`, `planning/S3_1_OWNER_RESOLUTIONS.md` v1.0, `evidence/s3-acceptance/ADDENDUM.md`.

- **Crafting eligibility completed:** a dead hero (respawn delay) is refused (`CRAFTER_DEAD`) in `crafterBlocker`, which also feeds the crafting menu and the engine's defensive guard; monitor I20 re-states it. Travel, a pending engagement and regeneration are explicitly allowed. `spec/formulas/s3-industry.md` v1.2.
- **Tests:** `test/s3_acceptance.crafting.test.ts` (the reviewer's reproduction with an actual hero death, the menu, the engine guard and I20, and the allowed states). **Mutation checks:** `repro/s3-acceptance/mutation_check.py` (5).
- **Regression:** every S3.1 manifest, every S3 regression re-run and three historical spot checks re-verified MATCH; no historical result changed.

## S3.1 — 2026-11-14 (correctness and economic calibration after the independent S3 review; accepted 2026-11-14 with the addendum above)

**Source:** owner "Independent S3 Review and S3.1 Authorisation" (S3 conditionally accepted). **Owner resolutions:** `planning/S3_OWNER_RESOLUTIONS.md` v1.0. **New rules:** `planning/S3_1_RESOLUTIONS.md` v1.0 (S3.1-R01 … R12). **Policy:** `planning/S3_1_POLICY.md`. **Pre-registration:** `manifests/s3.1/`. **Evidence:** `evidence/s3.1/S3_1_EVIDENCE.md`.

- **Blocker A, crafting eligibility (S3.1-R01):** an instant craft is refused, never interrupting anything, when the crafter is in the reserve (`CRAFTER_IN_RESERVE`), knocked out (`CRAFTER_KNOCKED_OUT`), in an encounter (`CHARACTER_BUSY`) or has another productive activity (`CRAFTER_WORKING`); the menu offers only eligible crafters (`qualified`; `levelQualified` added); the engine refuses an ineligible crafter even if validation were bypassed; monitor I20. Reserve characters' equipment can still be managed.
- **Blocker B, recipe validation (S3.1-R02; `spec/formulas/s3-industry.md` v1.1 §7):** duplicate resources in a recipe list are refused; recoverable bounds use summed quantities; self-amplifying timed recipes are refused; intermediates and the equipment, yield and hero-variant extremes are checked; material checks sum lines naming the same resource; monitor I21 bounds every salvage by its craft's inputs.
- **Measurement C, effective damage (S3.1-R03; spec v1.1 §5a):** order-independent fractional attribution; the S3 integer attribution is kept unchanged as legacy.
- **Measurements (S3.1 manifests only; S3 manifests produce exactly the S3 value set):** `src/experiments/s31Metrics.ts` (capacity, utilisation, demand, stockpiles, excess, shortage types, first-craft milestones, gear lifetime, equipment value, snapshots); fractional values.
- **Policy:** POL3-DEMAND (`src/policy/industryDemand.ts`); the observation gains the item catalogue (`defs`). The six S3 strategies are unchanged (their crafter choice follows the corrected menu).
- **Candidate variants (`s3Patch.ts`, on the frozen S3 content):** Copper offence and defence scales, percentage weapons (`attackBp`, StatMods `attackPctBp`; 0 in the S3 content), earlier-material Copper recipes, gathering yield and smith speed scales.
- **Amendment 01 (after the registered results; `manifests/s3.1/AMENDMENT-01.md`):** POL3-DEMAND kept an assigned gatherer for the rest of the run once nothing was left to build. POL3-DEMAND2 (version 1.1, `makePol3Demand(id, over, 2)`) corrects the stop rule; POL3-DEMAND is unchanged, so the registered results reproduce. Follow-up manifests S3.1-E09 (payback) and S3.1-E10 (content variants) reuse the S3.1-E08 and S3.1-E04 seeds and cells, and reproduce their shared cells exactly. Test: `test/s3_1.policy.test.ts`.
- **Tools:** `exp3.ts` runs S3.1 manifests; `s3-recycle.ts --with-timed --params`; `s31-analyse.ts`; `s31-make-manifests.ts`; `s31-amend.ts`; `repro/s3.1/defects.mjs`; `repro/s3.1/mutation_check.py`; `repro/s3.1/attribution_check.py` (restores the S3 crafter rule temporarily and shows that every S3 regression change comes from S3.1-R01 alone).
- **Fixtures:** new family `recipe-validation.v1.json` (13); `industry-rules.v1.json` fixture version 2 (+5 fractional cases); `s3_oracle.py` extended; generator `repro/s3.1/make_fixtures.py` (the S3 generator `repro/s3/make_fixtures.py` is unchanged). `equipment-ops` and `production-queue` unchanged.
- **L2 design note** v1.1: replay protection needs settled ranges and gaps, not one high-water mark (design only).
- **Not changed:** the S3 content, manifests, results and fingerprints (the regression re-runs write to `results/s3.1/audit/`); S1 and S2 content and results; no coefficient is approved.

## S3 — 2026-11-14 (accepted 2026-11-14 with S3.1 and the acceptance addendum)

**Source:** owner "Final L1/S2.1 Acceptance and S3 Authorisation" §2–§13. **S2 checkpoint:** `732f3da` (tag `s2-checkpoint`, `evidence/s2-checkpoint/`). **Specification:** `planning/S3_SPECIFICATION.md` v1.0, `planning/S3_RESOLUTIONS.md` v1.1 (S3-R01 … R28, proposed), `planning/S3_OWNER_DECISIONS.md` (O06, N-06, O09, O10). **Pre-registration:** `manifests/s3/` (plan and manifests hashed before any run; amendment 01 registered before the widened knockout matrix ran). **Evidence:** `evidence/s3/S3_EVIDENCE.md`.

- **Estimator v1.3 (S3 entry correction, owner §4):** an exhausted swing or work budget is now "unresolved" with no forecast (`forecast: 'unavailable'`), never "unreachable"; "unreachable" stays for proven impossibility (zero hit chance, dies before the first kill). The displayed estimate, squad estimate and worker estimate carry the `forecast` field; policies treat "unresolved" as not recommended; experiment metrics record `null` (not 0) for an unavailable forecast. `spec/formulas/estimator.md` v1.3; `estimator.v1.json` fixture version 3 (one case re-derived by `s1_oracle.py`). Every historical experiment was re-run: all fingerprints match except S2.1-E02, whose 7 changed values are this encoding change (`evidence/s3/estimator-v1.3-regression.txt`); the stored S2.1 results are unchanged.
- **New formula spec `spec/formulas/s3-industry.md` v1** and **content `content/w1-slice-s3.candidate.v0.3.0.json`** (four resources, six tier IDs with Wood and Copper content, three professions, four nodes, 23 items, 25 recipes, enhancement, salvage, the O09 inheritance mode, hero-advantage variant hooks; every value a candidate), compiled on the unchanged S2 pack (`model/industryContent.ts`; the S2 hashes are kept).
- **Engine (`engine/legion.ts`, behind `industry: true`; off reproduces S2 exactly, on without S3 activity gives the S2 event log):** per-character professions and efficiency; hero gathering by command and recruit gathering and smithing roles; exact gathering accrual; item instances with one location; equip, unequip, transfer, auto-equip, protection; crafting with explicit consumption; guaranteed enhancement; salvage; the O10 production queue (per-unit FIFO reservation, shortage pause and resume, cancellation, same-moment order) and two diagnostic arms; every ledger change logged (`LedgerTx`). `characterStats` takes equipment and hero-variant modifiers (none gives exactly S2's stats).
- **New:** `engine/industry.ts` (rules and validation), `engine/industryObservation.ts`, `model/industryTypes.ts`, `experiments/industryMetrics.ts` (monitor I10–I19 and effective damage), POL3 policies (`policy/industryRealistic.ts`), ORC3-SEARCH (`policy/industrySearch.ts`), the S3 runner (`cli/exp3.ts`, `s3Manifest.ts`, `s3Jobs.ts`, `s3Patch.ts`), S3-E01 (`cli/s3-conservation.ts`), S3-E06 (`cli/s3-recycle.ts`), analysis (`cli/s3-analyse.ts`), L2 measurements (`cli/s3-l2-measure.ts`); `planning/L2_DESIGN_UPDATE.md` (design only; no compaction).
- **Changed S1/S2 code (behaviour unchanged for S1/S2, tested):** `experiments/metrics.ts` reconciles `LedgerTx` entries; `experiments/legionMetrics.ts` adds the hero's gathering time to the time check (and reports it only with the switch on); `legionCommands.ts` validates the two new roles; `legionObservation.ts` adds the `industry` section only with the switch on; `legionContent.ts` exports `modsKey`.
- **Fixtures:** three new families with an independent oracle (`spec/oracle/s3_oracle.py`): `industry-rules.v1.json` (21), `equipment-ops.v1.json` (15), `production-queue.v1.json` (12). Existing fixtures unchanged except the estimator v1.3 case.
- **Not changed:** S1 and S2 content, coefficients, targets and results; no coefficient is approved.

## S2.1 — 2026-11-13 (focused acceptance pass; awaiting review; NOT committed)

**Source:** owner "Independent L1/S2 Review and S2.1 Authorisation". **Pre-registration:** `manifests/s2.1/`. **Evidence:** `evidence/s2.1/S2_1_EVIDENCE.md`. **Owner resolutions:** `planning/S2_OWNER_RESOLUTIONS.md` v1.0 (S2-R01 … R20 and further resolutions). **S3 directions (prepared, not implemented):** `planning/S3_EXPERIMENT_DIRECTIONS.md`.

- **Worker access (D-01):**
  - a worker assignment now needs a zone that is accessible AND visited by the hero (`ZONE_NOT_VISITED`, `legionCommands.ts`);
  - the observation marks unvisited zones as unavailable (`workerZoneAvailability`), keeping previews; realistic policies consider available zones only;
  - diagnostic set-ups may mark zones visited (`visitedZones`), but cannot start a worker in an unvisited zone (`INVALID_STATE`);
  - the engine refuses a worker fight in an unvisited zone;
  - the invariant monitor adds I9 (worker eligibility).
- **Reserve swaps** are refused while the character is in an encounter (`CHARACTER_BUSY`; S2-R18 as approved).
- **Ledger reconstruction** (`persistentLedger.ts`; `spec/formulas/ledger.md` v1.2):
  - conservation is summed exactly (BigInt), so valid histories with large cumulative turnover are accepted;
  - structural validity, not authenticity, is documented, with the implications for a Luau reconstruction;
  - the differential gains near-limit operations and reconstruction round trips (`--extremes --reconstruct`; the original stream is unchanged without them).
- **Worker estimator** (`workerFeasibility.ts`; `spec/formulas/s2-legion.md` v1.1):
  - an ability-aware structural bound decides impossibility;
  - fights only an ability can win are "unresolved" (new reliability value, worker estimates only), never "unreachable";
  - ability omission is labelled at every reliability.
- **Numerical domain:** the S2 content compiler checks the class-stat and ability intermediates at the maximum level and talent caps.
- **Fixtures:** new families `worker-feasibility.v1.json` (8) and `ledger-reconstruction.v1.json` (8), with `s2_oracle.py` extended. Existing fixtures unchanged.
- **Runner:** `exp2.ts` and `exp2-crosscheck.ts` accept S2.1 manifests and `--results-dir`; `s2-analyse.ts` accepts `--results` / `--out`; new `s21-analyse.ts`.
- **Not changed:** content, coefficients, targets, policy parameters, the AVL tree, `applyTx`, replay and conflict semantics, the S2 evidence and results (the audit writes to `results/s2.1/audit/`).

## S2 — 2026-11-13 (implemented; awaiting independent review and owner acceptance; NOT committed as a checkpoint)

**Source:** owner "S1.1 Acceptance and S2 Authorisation" §6–§12. **Specification:** `planning/S2_SPECIFICATION.md` v1.0, `planning/S2_RESOLUTIONS.md` v1.0 (S2-R01 … R20, proposed). **Pre-registration:** `manifests/s2/PREREGISTRATION.md` (plan hashed before implementation; manifests hashed before any run). **Evidence:** `evidence/s2/S2_EVIDENCE.md`.

- **New formula spec `spec/formulas/s2-legion.md` v1:** character stats by class, squad fights (threat order, simultaneous resolution, knockouts, eligibility), multi-character credit.
- **New content `content/w1-slice-s2.candidate.v0.2.0.json`:** the S1 pack unchanged plus S2 sections (roster, classes, talents, abilities); every value a candidate; one new test-only resource `res.rare.hero_shard`.
- **New engine `src/engine/legion.ts`** (the S1.1 stepper is unchanged): hero, recruits and rare heroes with stable identities; quest Q1, slots, deploy cap, purchases; classes, mastery, records (tracked, not applied), talents, respec, abilities; squad fights; knockouts and recovery; independent workers; one atomic multi-character credit (`legionCredit.ts`); per-character epochs; time categories. With S2 off and the hero alone it reproduces S1.1 exactly (control A0).
- **New:** command validation (`legionCommands.ts`), observation (`legionObservation.ts`), squad estimator s2.0 (`squadEstimator.ts`, labelled approximate; structural impossibility), realistic POL2 policies (`policy/legionRealistic.ts`), ORC2-SEARCH (`policy/legionSearch.ts`), invariant monitor and S2 metrics (`experiments/legionMetrics.ts`), S2 runner (`cli/exp2.ts`) and analyses (`cli/s2-analyse.ts`).
- **Fixtures:** two new families with an independent oracle (`spec/oracle/s2_oracle.py`): `squad-fight.v1.json` (7 cases) and `legion-credit.v1.json` (7 cases). The fixture schema gains the two family names; existing fixtures are unchanged.
- **Changed S1 code (behaviour unchanged for S1/S1.1):** `experiments/metrics.ts` reconciles legion spending (`LegionSpend` / `LegionGrant` entries, which S1 never logs).
- **Not changed:** S1 content, the EXP curve, S1/S1.1 targets and results. No coefficient is approved.

## L1 persistent ledger — 2026-11-13 (gates passed; awaiting independent review)

**Source:** owner "S1.1 Acceptance and S2 Authorisation" §5. **Specification:** `planning/L1_LEDGER_SPECIFICATION.md` v1.0 (budgets declared before any result). **Report:** `evidence/l1/L1_REPORT.md`.

- **New:** `src/core/ledger/persistentMap.ts` (persistent AVL tree with path copying), `persistentLedger.ts` (same contract as the reference; canonical serialization `legion.ledger.v1` for both implementations; validated reconstruction), `implementations.ts` (registry; default stays `reference`), `differential.ts`.
- **`spec/formulas/ledger.md` v1 → v1.1:** implementations, canonical serialization, reconstruction.
- **`ledger.ts`:** only `validateTx` is exported (shared validation). `ledger.v1.json` and `test/ledger.test.ts` are unchanged.
- **Runners:** `--ledger reference|persistent` for the S1.1 runner (recorded in `environment.json`, never in the semantic result).
- **Results:** differential 1,000,000 operations, 0 mismatches; gameplay regression 7 of 7 MATCH; planted bugs 12 of 12 detected (run 1: 11 of 12, test strengthened); G1–G4 pass. W-month exceeds the heap budget, as expected (full history; L2).
- **Not implemented:** history compaction (L2).

## S1.1 acceptance addendum — 2026-11-13 (S1 and S1.1 accepted; committed as the S1 checkpoint, tag `s1-checkpoint`)

**Source:** owner "S1.1 Acceptance and S2 Authorisation" §1–§4. **Record:** `planning/S1_1_ACCEPTANCE_ADDENDUM.md`. **Evidence:** `evidence/s1.1-addendum/`.

- **Estimator v1.1 → v1.2** (`spec/formulas/estimator.md`, `src/engine/estimator.ts`):
  - impossible victory is decided structurally from the completed fight distribution, before the survival budget. The result is exactly 0 kills, unreachable, `DIES_BEFORE_KILL`;
  - `SURVIVAL_BUDGET` now marks only winnable but expensive estimates.
- **Fixtures:** `estimator.v1.json` moves to fixture version 2 (+2 cases: the reviewer's impossible-over-budget case, and a winnable over-budget case). The independent oracle `s1_oracle.py` follows v1.2.
- **Tests:** a unit test for the review case; the reproduction script `repro/s1.1/estimator-survival-budget.mjs`.
- **No historical result changed:** all 7 S1.1 experiments MATCH their recorded fingerprints, and `analysis-gates.json` is identical.
- **Planning:**
  - `S1_1_OWNER_RESOLUTIONS.md` v1.0 records S1.1-R01 … R15 as approved, with the owner's interpretations, and the time categories for future experiments;
  - pointer lines in `S1_1_RESOLUTIONS.md` and `spec/README.md`.
- **Not changed:** combat statistics, content, the EXP curve and targets; the S1 and S1.1 evidence.

## S1.1 — 2026-11-13 (accepted with the addendum above)

**Scope.** A targeted correction pass after the independent S1 review ("Independent S1 Review and S1.1 Authorisation"); S1 was conditionally accepted. It is not a rewrite and not S2.

**Evidence:** `evidence/s1.1/S1_1_EVIDENCE.md`. Owner resolutions: `planning/S1_OWNER_RESOLUTIONS.md` v1.0. S1.1 rules: `planning/S1_1_RESOLUTIONS.md` v1.0.

**Labels:** content and the EXP curve are unchanged (`w1-slice.candidate.v0.1.0`, fingerprint `cb130aba…8ec6`). Every value is a candidate.

### Changed: formula specs
- **`s1-combat-loop.md` v1 → v1.1:**
  - identity-checked, atomic kill credit;
  - combined policy triggers;
  - auto-farm off cancels automatic work;
  - regeneration whenever idle in a session;
  - a session end clears a pending manual engage;
  - structured drops;
  - the explicit death window `(t − w, t]`, a per-zone stop record and manual retry.
- **`gates.md` v1 → v1.1:** the `SetAutoFarm(off)` effect, the `Report` command (`REPORT_UNKNOWN`) and the `deathStop` zone field.
- **New `estimator.md` v1.1:**
  - budgets;
  - unresolved mass never counted as a kill;
  - an exact survival chain;
  - reliability (unreachable / unsafe / approximate / reliable) with reasons.

### Changed: lab (owner review §2–§7)
- **Kill credit (§2).** New `src/engine/credit.ts`: a pending/committed registry in the state, classified before any draw. Rejections are `CREDIT_REPLAYED`, `CREDIT_CONFLICT` or `CREDIT_UNKNOWN`. The credit is applied as one atomic state update, and history is persistent so branches share it safely.
- **Recovery (§3):**
  - The realistic policies respect the repeated-death stop: they rest, retreat and report.
  - The S1 logic is kept as the controls `CTL-*-S1`.
  - New command `Report`.
  - Zones record `deathStop`.
- **Triggers (§4):**
  - POLICY events at one `(t, pass)` form one decision with all triggers, in `TRIGGER_ORDER`;
  - new triggers `hero-died`, `auto-farm-stopped`, `boss-cleared`, `boss-failed`;
  - more than 8 decisions at one timestamp is `EVENT_CASCADE_LIMIT`;
  - ORC-BRUTE uses the combined triggers.
- **Estimator (§5).** `estimator.ts` v1.1. The S1 estimator is kept unchanged in `estimator-s1.ts`, selectable only as `estimator: "s1"`.
- **Drops (§6).** Structured drops (`DropAward`). Metrics keep events and quantities, and reconcile them with the ledger. The drops job checks each entry.
- **Auto-farm and sessions (§7).** Engagement origin; auto-farm off cancels automatic work; regeneration and session-boundary fixes.
- **Experiments.** S1.1 manifests (`increment: "S1.1"`, `estimators`, `estimator.fixed`, variant `slime.dropsVariant`), a per-folder hash register and `results/s1.1/`. The runner refuses S1 manifests.

### Added
- **Tests:** `test/s1_1.credit.test.ts` (injected duplicates, conflicts, unknown credits, EXP-only, boss, branching, atomicity, registry) and `test/s1_1.behaviour.test.ts` (triggers, recovery, auto-farm, regeneration, sessions, estimator, drops).
- **Fixtures:**
  - `credits.v1.json` (6 cases) and `estimator.v1.json` (8 cases) are new;
  - `rewards.v1.json` moves to fixture version 2 (+2 cases: quantities above 1, the same resource twice; events and totals);
  - `gates.v1.json` moves to fixture version 2 (+4 `Report` cases).

  The independent oracle `s1_oracle.py` gains the `credits` and `estimator` families, `Report`, and events/totals.
- **Reproductions and analyses:** `repro/s1.1/defects.mjs` (run against the original S1 package and against this tree) and `repro/s1.1/analyse.py` (pre-registered analyses A1–A8).
- **Planning:** `S1_OWNER_RESOLUTIONS.md`, `S1_1_RESOLUTIONS.md`, `LEDGER_INFRASTRUCTURE_PROPOSAL.md`; a pointer line in `S1_RESOLUTIONS.md`.
- **Pre-registration:** `manifests/s1.1/` (7 manifests and `PREREGISTRATION.md`, registered before any S1.1 experiment ran).

### Privacy
`planning/M0_REPOSITORY_VERIFICATION.md`: absolute user-profile paths are redacted to `%USERPROFILE%\…` in the shared copy. The original is preserved privately outside the repository.

### Not changed
- the content pack, the EXP curve and the targets;
- the ledger (the replacement is not implemented; the proposal only);
- the S1 manifests, results and evidence (`manifests/s1/`, `evidence/s1/`).

## S1 — 2026-11-13 (conditionally accepted after independent review; uncommitted)

S1 is a single-character diagnostic simulation, authorised in `planning/S0_FINAL_REVIEW_RESOLUTION.md` §4. It starts from the S0 checkpoint `ad11a508fd715b08705c5ee72f215f92183f0993`. Evidence: `evidence/s1/S1_EVIDENCE.md`. Every input and output is `candidate` / model output, and nothing is live-validated.

### Added: formula specs
- **`combat.md` (still v2):** "Attack quantisation" (owner requirement §5).
  - Derived attack is evaluated in thousandths, and `rawMilli = roundHalfUp(value)` is applied exactly to the binary64 value, with no ×1000 multiplication.
  - The section states the limits (≤ 2^53 − 1; ≥ 1 thousandth, otherwise `INVALID_NUMBER`) and the exactness boundary.
  - New function `attackRawMilli` (`src/core/formulas/combat.ts`).
- **`s1-combat-loop.md` v1:** time, the event queue and ordering key, epochs and stale events, simultaneous resolution, engagement, swings, retaliation, death and respawn, sessions, kill credit, progress and recompute, policy decisions, regeneration and errors.
- **`gates.md` v1:** the three zone flags, kill gates, travel and teleport, command validation order and reason codes, the prototype miniboss stub (active-only) and invariants.

### Added: planning
- **`planning/S1_RESOLUTIONS.md`:** 17 proposed candidate rules for questions the approved documents do not settle. Each lists its consequence. None is approved.
- **`planning/S0_FINAL_REVIEW_RESOLUTION.md`:** S1 authorisation terms.

### Added: fixtures and oracles
- **`combat.v2.json`** fixture version 2 → 3: 8 `attackRawMilli` cases, including the binary64-half case.
- **New fixture files:**
  - `combat-loop.v1.json`: 14 hand-derived single-fight timelines;
  - `gates.v1.json`: 25 command-validation cases;
  - `rewards.v1.json`: 5 drop-roll cases, including a draw-alignment case added after the first S1 mutation run showed the one-draw-per-entry rule untested.

  Total cases: 252 → 304.
- **`spec/oracle/s1_oracle.py`:** an independent time-loop fight model with exact `Fraction` damage, gates.md validation, and drop rolls using `rng_oracle`.
- **Other oracle changes:**
  - `exact_oracle.py` handles `attackRawMilli`;
  - `check_all.py` runs 6 groups, including S1.
- **Fixture format:** the families `combat-loop`, `gates` and `rewards` are allowed, and `specRef` may contain digits. The schema was re-exported.

### Added: content (all candidate)
- **`content/w1-slice.candidate.v0.1.0.json`:**
  - hero, zones 1–3, enemies, prototype boss stub, travel and auto-farm;
  - inputs taken from M1 plan v1.0 §6;
  - fingerprint `cb130aba01a3d1242d0d875c514a3c976e9c3c039834e099591f1a0e162f8ec6`.
- **`content/tables/xp.w1.sweep.a{8,10,12}-p{1.6,1.8,2.0}.v0.1.0.json`** and `xp-sweep.index.json`: 9 sweep tables, each checked by `xp_oracle.py`, with no rounding-unstable level.

### Added: lab
- **`src/model/`:** content schema, validation and compilation (`content.ts`), and the types (`types.ts`) for state, events, commands, reason codes, observation and policy.
- **`src/engine/`:**
  - `queue.ts`: binary heap ordered by the event key;
  - `simulation.ts`: the reference stepper;
  - `commands.ts`: validation;
  - `rewards.ts`;
  - `estimator.ts`: an exact swing-count distribution plus spawn, attack and survival bounds;
  - `observation.ts`.
- **`src/policy/`:**
  - `realistic.ts`: POL-STAY, POL-FRONTIER, POL-BEST-SHOWN and the diagnostic POL-FIXED;
  - `oracle.ts`: ORC-BRUTE.
- **`src/experiments/`:**
  - manifest schema;
  - content-variant patches;
  - jobs;
  - metrics recorder;
  - statistics (nearest-rank quantiles, exact binomial interval, two-sample KS);
  - summaries;
  - reports.
- **`src/cli/`:**
  - `exp.ts` and `exp-worker.ts`: a pre-registration-checked runner using worker threads, plus `--verify`;
  - `build-xp-sweep.ts`;
  - `bench-ledger.ts` and `bench/hamtLedger.ts`: a benchmark-only persistent-map prototype;
  - `s1-traces.ts`;
  - `s1-analyse.ts`;
  - `s1-content.ts`.
- **Error codes:** `EVENT_CASCADE_LIMIT` and `SIM_EVENT_LIMIT`.
- **Purity test:** now also scans `src/model`, `src/engine`, `src/policy` and `src/experiments`.
- **New npm scripts:** `exp`, `exp:verify`, `xp:sweep` and `bench:ledger`.
- **Tests:** 463 → 626 in the default suite, and 7 → 9 statistical tests (S1 drop rolls).
  - New files: `s1.events`, `s1.gates`, `s1.determinism`, `s1.experiments`, `stats/s1.drops.distribution`.

### Added: experiments (pre-registered in `manifests/s1/`)
- **Experiments:** S1-E01 to S1-E08, plus amendment S1-E06b. That amendment was registered after S1-E06 under-sampled and shared seeds across zones; S1-E06 is reported unchanged.
- **Results:** in `results/s1/` and copied to `evidence/s1/experiments/`.
- **Ledger benchmark:** `results/s1/ledger-benchmark/`.

### Changed
- **Policy definition:** POL-FRONTIER's survival criterion was changed from displayed deaths/h ≤ 1 to displayed kills-per-life ≥ 10. The change was made after an engineering smoke run and before any experiment was registered (S1-R16).
- **`DisplayedEstimate`** now carries `killsPerLife`.

### Not changed
- S0 formulas and fixture results.
- The XP table artifact `990fe508…0dc`.
- The S0 content pack.
- The S0-R01 curve fingerprint.
- The frozen simulator and the Original v1 archive.

## S0.1 final ledger correction — 2026-11-13 (accepted subject to verification; committed as the S0 checkpoint)

From the independent S0.1 review (`planning/S0_FINAL_REVIEW_RESOLUTION.md`).

**Defect.** A frozen object combining the balances of one genuine ledger with the committed history of another passed `applyTx`'s structural check. Replaying a committed transaction then credited it again: balance 10 instead of 5. Frozen shallow copies, and maps forged through the read-only map's constructor, were also accepted.

**Fix.** `src/core/ledger/ledger.ts` now registers every ledger made by `emptyLedger`/`applyTx` in a module-private `WeakSet`. `applyTx` accepts only registered ledgers (`INVALID_STATE` otherwise). Branching from any earlier genuine snapshot is unchanged.

**Spec and fixtures.**
- `ledger.md` (still v1, no result changes) documents the identity rule and the need for a separate, validated reconstruction boundary for any future deserialisation.
- No fixture changes: object identity cannot be expressed in JSON.

**Tests.** 4 regression tests:
- mixed ledgers;
- shallow copies and forged maps;
- branching from historical snapshots;
- replay and conflicts after branching.

**Evidence:** `evidence/s0.1-final/`.

## S0.1 — 2026-11-13 (accepted by owner after independent review, subject to the final correction above)

Hardening corrections from the independent S0 review (items 1–8). Evidence: `evidence/s0.1/S0_1_EVIDENCE.md`. All coefficients remain `candidate`. The XP curve, the XP table artifact and the content pack are unchanged.

### Changed: formula specs
- **`remainder.md` v1 → v2 (review item 1).**
  - **What changed:** the per-hour chain is one exact division of `milliRem·3.6e6 + msRem + rate·dMs` by 3.6e9, using the new `mulDivRem`.
  - **Impact:**
    - wherever v1 returned a result, v2 returns the identical result;
    - v2 no longer fails on the milli-unit intermediate, only when the grant itself exceeds 2^53 − 1;
    - G1 is restated with that precise domain;
    - the per-hour state is validated explicitly.
- **`stats.md` v1 → v2 (review item 2).**
  - **What changed:**
    - an active factor of exactly 1 is skipped;
    - every partial and final value must be in [0, 2^53 − 1], otherwise `NUMERIC_LIMIT` (never `Infinity` or `NaN`);
    - malformed or sparse inputs give `INVALID_CONTENT`.
  - **Impact:** results change only near 2^53 (the identity case) or where v1 returned out-of-range, `Infinity` or `NaN` values.
- **`combat.md` v1 → v2 (review item 3).**
  - **What changed:**
    - damage per hit is exact rational arithmetic on integer inputs (`rawMilli`, `critMultBp`, mitigation ratio `{num, den}`), rounded half up once at the end;
    - new `mitigationRatio`;
    - `mitigationFactor` is kept for display only.
  - **Impact:**
    - the damage input shape changes;
    - results change only where v1's binary64 arithmetic misrounded an exact half, for example 100 × 1.005 = 100.5 → 101 (v1: 100).
- **`xp.md` v1 → v2 (review items 4 and 5).**
  - **What changed:** awards are spent level by level, so there is no intermediate sum. Tables and states must be dense.
  - **Impact:**
    - every award v1 accepted gives the identical result;
    - awards v1 refused with `NUMERIC_LIMIT` now give the exact result, or `XP_TABLE_EXHAUSTED`.
- **`numeric.md` v1:** adds `mulDivRem`, an exact ⌊a·m/d⌋ and remainder that never forms a·m. No existing operation changed.
- **`rng.md` v1 (review item 5):** adds the state boundary.
  - Every public entry point validates the state: a dense array of four u32 values, not all zero.
  - The generator step is private.
  - No valid result changed.
- **`ledger.md` v1 (review items 6 and 7):** adds the immutability boundary and the S1 performance note. No result changed.
  - The ledger state is frozen, its maps are read-only, and receipts are frozen.
  - Only ledgers made by `emptyLedger` or `applyTx` are accepted.

### Changed: fixtures (one current file per family)
- **`numeric.v1.json`:** fixture version 1 → 2, with 11 new `mulDivRem` cases.
- **`remainder.v1.json` → `remainder.v2.json`:** fixture version 2. All 18 v1 cases are unchanged; 15 cases are added (per-hour, rate-change timeline and state cases).
- **`stats.v1.json` → `stats.v2.json`:** fixture version 2. All 9 v1 cases are unchanged; 11 cases are added.
- **`combat.v1.json` → `combat.v2.json`:** fixture version 2.
  - **Retired:** `combat.dmg.overflow.001`.
  - **Restated:** 8 damage cases in v2 inputs, with unchanged expected values.
  - **Added:** 20 cases.
- **`xp.v1.json` → `xp.v2.json`:** fixture version 2.
  - **Retired:** `xp.award.overflow.001`. Its expected outcome changed from `NUMERIC_LIMIT` to `XP_TABLE_EXHAUSTED`; it is replaced by `xp.award.near-max.exhausted.001`.
  - **Added:** 9 cases.
  - **New operation:** `awardSequence`.
- **`rng.v1.json`:** fixture version 1 → 2, with 9 new `nextFromState` cases.
- **Totals:** 179 → 252 cases.

| Kind | S0 | S0.1 |
|---|---|---|
| Normal | 45 | 52 |
| Boundary | 61 | 94 |
| Failure | 73 | 106 |

### Changed: oracles
- **`exact_oracle.py`:**
  - `mulDivRem`;
  - per-hour v2 as a single division with unbounded integers, plus timelines;
  - stats v2, which replays the specified binary64 order with Python floats and checks it against exact Fractions;
  - combat v2 damage with exact Fractions, plus `mitigationRatio`;
  - tolerances now also apply to binary64 results.
- **`xp_oracle.py`:** awards v2 as plain unbounded-integer arithmetic, plus `awardSequence` and the `maxLevelUps ≥ 1` rule.
- **`rng_oracle.py`:** `nextFromState`, with the state rule.
- **`check_all.py`:** finds each family's single current fixture file and refuses duplicates.

### Changed: lab
- **New:**
  - `src/core/arrays.ts` (dense-array checks);
  - `mulDivRem` in `src/core/numeric/safeInt.ts`.
- **Rewritten:**
  - `accruePerHour` (`remainder.ts`);
  - `evaluateStat` (`stats.ts`);
  - `damagePerHit`, plus the new `mitigationRatio` (`combat.ts`);
  - `applyExpAward` and `assertXpTable` (`xp.ts`).
- **Hardened:**
  - `assertRngState`, `nextU32`, `bernoulli`, `uniformInt` and `stateFromDigest`;
  - `applyTx` validation and immutability (`ledger.ts`).
- **Fixture runner:**
  - new operations: `mulDivRem`, `perHourTimeline`, `nextFromState`, `mitigationRatio` and `awardSequence`;
  - damage cases use the v2 inputs.
- **Tests:** the default suite grows from 329 to 459 tests; the 7 statistical tests are unchanged.

### Added
- `planning/S1_LEDGER_BENCHMARK_PROPOSAL.md` (review item 7). It is a proposal only; there is no ledger redesign.
- `evidence/s0.1/` (the S0.1 evidence pack).

### Not changed
- The XP curve candidate and the table artifact (fingerprint `990fe508…0dc`).
- The content pack.
- The S0-R01 report inputs and semantics. Its semantic fingerprint is re-checked in the evidence.
- Canonical JSON, units and content validation.
- Hit chance, crit chance and hits-to-kill.
- The `accrue` primitive.
- The frozen `progression-lab/` baseline and the Original v1 archive.

## S0 — 2026-11-13 (accepted by owner after independent review of S0 and S0.1)

### Added
- **Formula specs v1** (`spec/formulas/`):
  - `units`, `numeric`, `remainder`, `rng`, `xp`, `stats`, `combat`, `ledger`, `canonical-json`;
  - basis: `M0_RESOLUTION.md` D-02, D-07, D-10 and corrections A–F.
- **Fixtures v1** (`spec/fixtures/`): 9 families, 179 cases, each with a derivation.
- **Independent oracles** (`spec/oracle/`): `rng_oracle.py`, `xp_oracle.py`, `exact_oracle.py`, `check_all.py`.
- **Exported JSON Schemas** (`spec/schema/`): fixture, content pack S0, XP table artifact.
- **Content `s0-core` 0.1.0 (candidate):**
  - XP curve a = 10, p = 1.6, g = 1;
  - 200-entry XP table artifact (fingerprint `990fe508ef0f83f196a4052a56354c989fc9e93f36070754ed222295a69fb0dc`), oracle-verified and rounding-stable;
  - stat category registry with inactive W2 hooks;
  - candidate combat coefficients.
- **Lab S0 modules, tests and CLI tools** (see `README.md`).
- **Report S0-R01** (candidate EXP curve inspection).

### Not changed
- **Approved baseline:** the design pack (`docs/`) and the approved Decision Register.
- **Frozen simulator:** the frozen `progression-lab/` baseline.
