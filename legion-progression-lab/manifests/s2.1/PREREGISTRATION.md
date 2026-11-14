# S2.1 pre-registration — focused acceptance pass

**Registered before any corrected comparison was run.** Owner: "Independent L1/S2 Review and S2.1 Authorisation" §2–§9. This plan is hashed into `preregistration.json` now. Its machine-readable manifests are hashed before they run. Deviations are amendments, registered before they run and reported.

**What S2.1 corrects:**
1. Worker assignment requires a visited zone (D-01).
2. Ledger reconstruction sums conservation exactly.
3. Worker estimates classify ability-dependent fights as "unresolved", never as impossible without proof.
4. Also: reserve swaps happen only outside encounters; the invariant monitor checks worker eligibility (I9); numerical-domain checks cover the class-stat formulas.

No content, coefficient, target or policy parameter changes. The policies change only to respect the new availability rule and the new "unresolved" label.

## 1. S2.1-E01 — impact audit of every S2 cell (no new manifest)
- **Method:** every registered S2 manifest (`manifests/s2/`, hashes unchanged) is re-run with the corrected engine, with the same seeds and replicates. Results go to `results/s2.1/audit/<S2 id>/`. The historical `results/s2/` and `evidence/s2/` are never overwritten.
- **Classification rule:** a cell is **unaffected** if its semantic summary (every metric summary and the combined event-log digest of its runs) is byte-identical to the stored S2 result. Otherwise it is **affected**; for affected cells, original and corrected values are reported side by side.
- **Expectation, stated before running (not a gate):**
  - **affected:** cells whose policy can assign workers (POL2-WORKERS, POL2-MIXED, the switching cells, ORC2-SEARCH, possibly POL2-SQUAD-W), and S2-E10 cells with a classed worker (their displayed prediction changes);
  - **unaffected:** S2-E00, E01, E02, E04, E07, the POL2-SQUAD cells, and the S2-E10 squad and classless-worker cells.
- **Why unaffected cells are not re-interpreted:** if a cell is identical, its historical result is the corrected result; nothing in it depended on the corrected rules.
- **Analyses on the corrected results:**
  - **C0 (gate):** the control A0 still reproduces S1.1 (S2-E00 identical, or B0 re-passes).
  - **C1 (gate):** the invariant monitor (I1–I9) finds 0 violations in every audit run.
  - **C2:** original against corrected for every affected cell (key metrics), and H-S2-01 … H-S2-04 re-evaluated.
  - **C3:** squad against workers per objective, corrected.
  - **C4:** search against realistic policies, corrected.
  - **C5:** worker estimates against realisation, corrected.

## 2. S2.1-E02 — ability-aware worker estimates (new manifest)
- **Design:**
  - one worker of each class (classless, Warrior, Archer, Mage);
  - levels 1, 5 and 10, zones 1–3;
  - the hero farms the same zone continuously, so the zone is visited;
  - frozen levels, 30 min, 100 replicates.
- **H-S2.1-01 (engineering):** every cell whose worker estimate is "unreachable" realises 0 worker kills (`workerKillsPerHour` max = 0). A proven impossibility must never be contradicted.
- **H-S2.1-02 (reported):** cells labelled "unresolved" are reported with their realised kills (expected: some, by the ability).
- **Reported:** predicted against realised production, by reliability class, as in S2-E10.

## 3. S2.1-E03 — knockout diagnostic (new manifest)
- **Design:**
  - matched squads, frozen levels, with an Archer hero and Warrior / Archer / Mage recruits;
  - levels 1 and 5, zones 2 and 3, squads of 1, 2 and 3;
  - enemy damage ×1 and ×2;
  - the realistic fixed-zone squad logic (rests, respects stops), 30 min, 100 replicates.
- **Threshold, fixed now:** a cell "generates knockouts" if its p50 `memberKnockoutsPerHour` ≥ 1.
- **H-S2.1-03 (diagnostic):** at least half of the 24 cells generate knockouts, which shows the diagnostic is informative. If not, it is reported as uninformative.
- It calibrates, and does not replace, the S3 knockout matrix (`planning/S3_EXPERIMENT_DIRECTIONS.md` F).

## 4. Engineering gates for S2.1
1. Type check; regular and statistical tests; fixtures (new families `worker-feasibility`, `ledger-reconstruction`); independent oracles; schemas.
2. The three defect reproductions are wrong on the original S2 package and correct on S2.1 (`repro/s2.1/defects.mjs`).
3. The ledger differential with near-limit turnover and reconstruction reports 0 mismatches.
4. C0 and C1 pass. H-S2.1-01 passes.
5. Mutation checks: planted bugs in each correction are detected; the S2 and L1 sets still pass on the final code.
6. Determinism: identical re-runs, a different second seed root, KS tests (S2.1-E02).
7. `exp2 --verify` MATCH for the S2.1 experiments and the audit; a reference-ledger cross-check of one cell per new experiment.
8. The frozen simulator, archive and old workspaces are unchanged.
