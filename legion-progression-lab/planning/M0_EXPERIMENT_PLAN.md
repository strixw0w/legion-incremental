# M0 Experiment Plan — S0 to S7

**Milestone:** M0 · **Version:** 1.1 (13 November 2026) · **Status:** APPROVED WITH CORRECTIONS (review item H applied; `M0_CHANGE_SUMMARY.md` lists every change). No experiment in this plan has been run. Every number below is a `candidate`, a hypothesis or a proposed gate. None is a result.

> **In plain words.** This is the list of questions the simulator will answer, in the order it will answer them. It also fixes, before any testing, what result would count as a pass. Every result will be labelled "model output". It shows what our invented numbers do, not what real players will do. Real validation only comes from Roblox playtests later (M7).

---

## 1. Principles

1. **Pre-registration.** Each experiment's hypotheses, metrics and pass ranges are written in its manifest *before* it runs. If a candidate fails, the report says so and the closest candidate is reported. Targets are never moved to fit results (frozen-lab Increment 6 rule, reused).
2. **Model output only.** Every result is labelled `model-output`. Nothing is called validated until compared with live Roblox measurements (M7+).
3. **Three kinds of time, always separate.**
   - Every metric that involves time is reported as active manual time, connected auto-farm time and elapsed (calendar) time, side by side.
   - R06.09 is an *active-hours* target. Offline progress changes calendar time only.
4. **Realistic vs oracle.** Realistic policies see only what the player could see on screen (architecture §4.1). The oracle uses hindsight or brute-force search and is an upper bound only. Targets for typical players are judged on realistic policies.
5. **Estimate vs simulated.** The rate estimator (what a Command Centre would display) and the simulated results are reported separately, along with the estimate's error.
6. **Distributions, not single runs.** Sampled metrics are reported as p10 / p50 / p90 across replicate seeds. Deterministic-expectation runs (no RNG; expected values) are used only as a cross-check.
7. **One change at a time.** Sensitivity runs vary one parameter (or a declared pair) from a fixed base. The base manifest hash is recorded.
8. **No silent scope.** An experiment never introduces a mechanic that isn't in the approved design. Missing mechanics are listed as limitations.
9. **Engineering gates are separate from balance targets.**
   - **Engineering gates** (correctness, determinism, invariants, reproducibility) must pass before an increment is accepted.
   - **Balance targets** (pacing, TTK, timings) are candidate hypotheses. A missed target is reported as missed, together with the closest swept candidate. It never blocks acceptance by itself, and is never re-defined after the run.
10. **S1 is a single-character diagnostic model**, not the final onboarding experience.
    - It is not required to reproduce recruitment, equipment or full-game timings.
    - Representative onboarding pacing is recalibrated progressively in S2 (recruits), S3 (gear and crafting) and S4 (permanent systems), each against the same pre-registered targets.
11. **Consistent units for comparison gates.**
    - Strategy spread is always the dimensionless ratio best ÷ worst (≥ 1) of the declared metric at the declared checkpoint. It is never mixed with percentage differences.
    - Every gate states its unit explicitly.

---

## 2. Time accounting

| Term | Definition |
|---|---|
| `activeManualMs` | Time inside a session with player-driven play. Abilities, travel decisions and active-only gates are available. |
| `connectedAutoFarmMs` | Time inside a session with auto-farm on and no manual input. It is reported separately even when the throughput is equal (S1 has no abilities). |
| `offlineMs` | Time between sessions. |
| `elapsedMs` | `activeManualMs + connectedAutoFarmMs + offlineMs` (calendar). |
| `creditedOfflineMs` | Offline time inside windows: window 1 is 0–24 h, window 2 is 24–72 h, with no credit beyond 72 h (S5). |
| `effectiveOfflineHours` | Σ over windows of hours × efficiency (S5). |
| `deadTimeMs` | Active time with no progress-relevant event (stuck, waiting, dead, travelling) in a rolling window (candidate 5 min). |
| Observation checkpoints | Active: 5, 15, 30 and 60 min, then every hour. Elapsed: D1, D3, D7, D14, D30 (from S5/S6). |

---

## 3. Player profiles (all no-spend; paid profiles are added only after M9 and free-path validation)

Schedules are candidates (ranges in brackets), chosen to span plausible Roblox behaviour. They are not measured behaviour.

| ID | Profile | Schedule (candidate) | Policy family | Knowledge | From |
|---|---|---|---|---|---|
| PR-NEW | First-session newcomer | One 30–60 min session | Realistic, cautious, follows objectives | UI only | S1 |
| PR-CAS | Casual: short sessions plus offline | 2 × 15 min/day [1–3 × 10–20 min], ~11 h gaps | Realistic, simple choices | UI only | S5 |
| PR-BAL | Balanced | 1 × 60 min/day [45–90] | Realistic, sensible | UI only | S1 (single session), S5 |
| PR-CMB | Combat-focused | 2 × 60 min/day | Realistic, prioritises zone push and gear | UI only | S2 |
| PR-ECO | Economy-focused | 2 × 45 min/day | Realistic, prioritises workers, crafting, Monuments | UI only | S3 |
| PR-COL | Collector | 1 × 90 min/day | Realistic, prioritises Bestiary, Feats, elites, rare heroes | UI only | S4/S6 |
| PR-OPT | Realistic optimiser | 2 × 90 min/day | Realistic, uses displayed estimates aggressively | UI + displayed rates | S1 |
| PR-ORC | Oracle (upper bound) | Same schedule as compared profile | Hindsight / brute force | Everything | S1 |
| PR-POOR | Deliberately poor choices | 1 × 60 min/day | Fixed bad heuristics (e.g. never upgrades gear, overstays zone 1) | UI only | S2 |
| PR-FREQ | Frequent logins | 6 × 10 min/day | Realistic | UI only | S5 |
| PR-ABS | Long absences | 1 h, then 3 days away, then 1 h (repeated) | Realistic | UI only | S5 |

**Squad and class compositions** (from S2): all-Warrior, all-Archer, all-Mage, one of each, hero plus no recruits (control), and a deliberately mismatched profession assignment (from S3).

---

## 4. Policies

| ID | Behaviour | Type |
|---|---|---|
| POL-FRONTIER | Moves to the newest *visited-or-accessible* zone once the displayed TTK ≤ a threshold (candidate 6 s) and displayed survival is OK. Otherwise stays. Rests when HP < 30%. | Realistic |
| POL-STAY | Stays in the current zone until its gate completes, then advances immediately. | Realistic (simple) |
| POL-BEST-SHOWN | Picks the accessible zone with the best *displayed* EXP/h estimate; re-decides at gate unlock and level-up. | Realistic (uses the estimator) |
| POL-OBJECTIVE | Follows a scripted objective list (first-session onboarding approximation). | Realistic |
| ORC-BRUTE | Tries every zone choice at each decision point (S1: ≤ 3 zones × few decision points) and keeps the best for the declared objective. | Oracle |
| ORC-FORK | Clones state at a moment and runs each alternative for a fixed horizon (frozen lab "fork" idea, reused). | Oracle / diagnostic |

Every policy decision is logged with its reason code. A policy command the engine rejects is logged, not patched.

---

## 5. Metrics catalogue (units in brackets)

**Combat:**
- TTK p10/p50/p90 [s] and hits-to-kill
- kills/h: estimate vs simulated, with the limiting factor (attack, spawn, travel, survival)
- overkill fraction
- deaths/h and death downtime [s]
- hero damage share [%] (S2)

**Progression:**
- time to first kill [s]
- kills to level 2
- time to L5/L10/L25/L50 [active min, elapsed]
- zone unlock time *and* first-visit time [active min]
- gate wait [min]

**Economy:**
- gold/h, materials/h per resource, EXP/h per character
- stockpiles, cost-to-income ratio, time-to-next-affordable upgrade
- source/sink ledger by category

**Production (S3+):**
- job utilisation, shortage pause time, queue wait, reservation lock duration

**Offline (S5+):**
- offline share of progress [%], effective offline hours, active-vs-offline progress per hour
- receipt contents, batch-vs-reference deviation

**Health:**
- dead time [%], bottleneck attribution (each active minute assigned to exactly one cause, frozen-lab method reused)
- strategy spread = best ÷ worst ratio (dimensionless, ≥ 1) of the declared metric across realistic profiles; every spread gate uses this unit
- numeric headroom = max value / (2^53−1)
- estimator error [%]

---

## 6. Manifests and seeds

```json
{
  "experimentId": "S1-E01-calibration",
  "increment": "S1",
  "purpose": "Early pacing of candidate W1 slice content for a single hero",
  "contentRef": { "path": "content/w1-slice.candidate.v0.1.0.json", "sha256": "<filled by runner>" },
  "formulaVersions": { "xpRequired": 1, "damage": 1, "mitigation": 1, "hitChance": 1, "dropRoll": 1 },
  "profiles": ["PR-NEW", "PR-BAL"],
  "policies": ["POL-FRONTIER", "POL-STAY", "ORC-BRUTE"],
  "horizons": { "activeMinutes": [5, 15, 30, 60] },
  "seeds": { "root": "S1-E01", "replicates": 200 },
  "sweep": { "xpCurve.a": [8, 10, 12], "zone1.killGate": [60, 100, 150] },
  "metrics": ["firstKillS", "killsToL2", "minToL5", "minToL10", "zone2FirstVisitMin", "ttkZone1", "ttkZone2"],
  "acceptance": [
    { "id": "H-S1-01", "metric": "firstKillS", "stat": "p90", "op": "<=", "value": 30, "label": "target (R10.10)" }
  ]
}
```

- **Seed policy:** replicate *i* uses root `"<root>#rep-<i>"`, and streams are derived per purpose and entity (architecture §11). The number of replicates is declared in the manifest. Candidate: 200 for sampled metrics; 1 for deterministic-expectation mode.
- **Reproducibility:** every run records the lab commit, Node version, content hash, manifest hash and result fingerprint. `npm run exp:verify` must reproduce the result fingerprint.
- **Naming:** `S<n>-E<nn>-<slug>`. Manifests live in `manifests/s<n>/`; results in `results/s<n>/<experimentId>/`.

---

## 7. Increments

Each increment lists its scope, experiments, hypotheses (all `candidate`), metrics and **proposed** acceptance gates. An increment's gate is reviewed by the owner and an independent reviewer before the next starts.

### S0 — Schema and deterministic numeric primitives

- **Scope** (architecture v1.1):
  - units and limits;
  - safe-integer arithmetic with intermediate-overflow checks;
  - exact `divRem`;
  - corrected round-half-up;
  - exact remainder accumulators (`accrue` and the per-hour chain);
  - RNG: xoshiro128** with SHA-256 length-prefixed stream derivation, Bernoulli thresholds, rejection-sampled uniform integers;
  - XP integer table builder and multi-level awards;
  - stat stacking with breakdown;
  - damage, crit, accuracy and mitigation primitives;
  - the atomic idempotent ledger (aggregation, `TX_CONFLICT`);
  - content schema and validation;
  - canonical JSON and semantic fingerprints;
  - the fixture format and independent oracles.
- **Experiments:** none about balance.
  - One deterministic report, `S0-R01-curve-preview`, prints for levels 1–60 the oracle-verified candidate XP integer table and cumulative EXP.
  - It also gives `lastSafeThresholdLevel` and `lastSafeCumulativeLevel` separately (approximate beyond the stored table, labelled so).
  - Optionally it shows the same for the declared S1 sweep variants (a, p).
  - It is an inspection aid, not a result.
- **Hypotheses:** none (correctness only).
- **Engineering gates (proposed; S0 has no balance targets):**
  - All unit, property, fixture, purity, isolation, runtime and statistical tests pass. Counts are reported, but counts alone are not evidence: the reviewer inspects fixture derivations.
  - Every `spec/fixtures` case has a derivation. Each family has at least one boundary and one failure case.
  - The independent oracles reproduce every oracle-checkable expected value: RNG sequences exactly, XP tables exactly and rounding-stable, exact-rational cases exactly.
  - Distribution tests pass at the pre-declared α = 0.001 with fixed seeds.
  - Partition-invariance property tests pass: the same constant-rate interval split arbitrarily gives an identical total and remainder.
  - Every unit, rounding point, limit and error code is written in `spec/formulas/*.md`.
  - Running the curve preview twice gives the same semantic fingerprint. Environment metadata is recorded separately.
  - The frozen `progression-lab/` is unchanged (fingerprint before and after S0).

### S1 — Single hero, three-zone combat loop, rewards and gates

> **S1 is a diagnostic model** (principle 10).
> - It isolates combat, rewards and gates for one classless hero.
> - Its pacing numbers are not expected to match the final onboarding, which depends on recruits (S2), gear (S3) and permanent systems (S4).
> - S1 pacing hypotheses are reported, and they inform the later recalibration.
> - Only its engineering gates decide acceptance.

- **Scope:** classless hero; zones 1–3; one primary enemy per zone; enemies retaliate; hero death and respawn; kill gates; access/visited/checkpoint flags; travel and teleport; per-kill rewards (EXP, gold, one material, one test-only rare drop); a stub active-only miniboss gate in zone 3; reference stepper; rate estimator; realistic and oracle policies.
- **Explicitly not in S1:** recruits, classes, abilities, gear crafting, gold sinks, offline, Monuments. Gold and materials only accumulate and are reported. That limitation is stated in the report.
- **Experiments:**

| ID | Question | Design |
|---|---|---|
| S1-E01 calibration | Do the candidate inputs meet early pacing targets? | Sweep XP curve `a` ∈ {8, 10, 12} × exponent `p` ∈ {1.6, 1.8, 2.0} × zone 1 gate ∈ {60, 100, 150}, plus slime EXP ∈ {3, 4, 5} in a second pass; PR-NEW and PR-BAL; POL-FRONTIER/POL-STAY; 200 replicates. Hand arithmetic (M1 plan §6.4) suggests the S1 base candidate reaches L5 too early (≈ 2.4 min vs the 3–5 min target), so the curve's steepness `p` is swept, not only its scale. |
| S1-E02 estimator vs stepper | Does the analytic rate model match simulated combat? | Fixed hero levels (1, 5, 10) × zones 1–3, 1 h active each, 200 replicates; compare kills/h, EXP/h, TTK. |
| S1-E03 earlier-zone audit | Is an earlier zone ever better, and is the newest zone worth entering? | Matched state at first visit of zones 2 and 3; per-zone rates (estimate) plus 15-min forks per zone (ORC-FORK). |
| S1-E04 survival sensitivity | How often does the hero die, and what does downtime cost? | Enemy damage ×{0.5, 1, 1.5, 2}; hero HP per level ×{0.75, 1, 1.25}; record deaths/h, downtime and auto-farm stops. |
| S1-E05 gate pacing | Are later gates progressively longer? | Gate 2→3 ∈ {80, 120, 180} with the S1-E01 winner; measure first-visit times. |
| S1-E06 drop correctness | Are sampled drop counts consistent with per-kill odds? | 10^5 kills per zone across seeds; observed counts vs binomial 99.9% interval; no fractional grants. |
| S1-E07 determinism | Same manifest gives the same result fingerprint; different seeds give different samples with the same distribution. | Rerun S1-E01 subset twice; compare fingerprints. |
| S1-E08 policy bound | How far is a realistic policy from the oracle in 60 min? | POL-FRONTIER vs ORC-BRUTE; report the ratio. Informational only. |

- **Candidate hypotheses:**

| ID | Hypothesis (candidate) | Source | Metric and pass range (proposed) |
|---|---|---|---|
| H-S1-01 | First kill within 30 s for a newcomer | R10.10 | p90 `firstKillS` ≤ 30 |
| H-S1-02 | Level 2 after 1–3 kills | Bible §10 | p50 `killsToL2` ∈ [1, 3] |
| H-S1-03 | On-tier early TTK 2–5 s (zones 1–2 at first visit) | R02.14 | p50 TTK ∈ [2, 5] s |
| H-S1-04 | Harder enemy TTK 5–15 s (zone 3 at first visit) | R02.14 | p50 TTK ∈ [5, 15] s |
| H-S1-05 | First new zone first-visited in 5–10 active min | R06.08, N-11 | p50 `zone2FirstVisitMin` ∈ [5, 10] |
| H-S1-06 | Zone 2→3 takes longer than zone 1→2 | R06.08 | p50 ratio > 1 |
| H-S1-07 | Level 5 in 3–5 min, level 10 in 10–20 min (single hero only; recruits and gear will change this) | Bible §10 | Diagnostic only: p50 reported against the range; not an acceptance gate (principle 10) |
| H-S1-08 | Overgeared earlier enemies become trivial | Bible §4 | At hero damage ≥ zone 1 HP: hits-to-kill = 1 and TTK = 0 s first swing |
| H-S1-09 | The estimator is accurate for steady farming | R07.16 | Mean kills/h within ±5% (candidate tolerance) of simulated, or the deviation is explained by a named factor |
| H-S1-10 | Prior zones can be better EXP/h for some builds; the newest zone is still worth entering | R08.05 | Reported, no pass/fail: where and by how much an earlier zone wins. The owner decides whether that is wanted. |

- **Engineering gates (decide acceptance):**
  - S0 gates still pass.
  - Every invariant test assigned to S1 passes:
    - access, visit and checkpoint rejections;
    - one credit per kill;
    - no active-only gate started by auto-farm;
    - deterministic ordering;
    - simultaneous lethal attacks, cancellation and stale events, session boundaries (architecture §9.3);
    - the entity-renaming metamorphic test.
  - S1-E06 (drop correctness) and S1-E07 (determinism) pass.
  - S1-E01 to E08 produce labelled reports with p10/p50/p90.
- **Balance targets (reported, never moved after the run):**
  - H-S1-01 to H-S1-10 are each reported as pass, miss or reported-only, with the closest swept candidate and what would need to change.
  - A miss does not block acceptance. No content becomes "approved" by passing.

### S2 — Recruits, full personal EXP, squad vs independent jobs, class mastery

- **Scope:**
  - Recruits and slots: first-recruit quest condition, slot unlocks and recruit purchase, deploy cap 1→3.
  - Classes and talents: three base classes, talent points with per-class allocation, class change.
  - Mastery and records: mastery per class, class records.
  - Combat: recruit KO (if D-03/O05 option A), auto abilities on cooldown.
  - Assignments: squad stream vs independent combat workers, assignment registry and switching.
- **Experiments:**
  - **S2-E01 deploy scaling (0–3):** EXP per member, loot per kill and kills/h.
  - **S2-E02 hero damage share** by build.
  - **S2-E03 credit invariants:** property tests plus scenario tests.
  - **S2-E04 class-switch abuse:** a level-50 character cycles every class, which must not increase records.
  - **S2-E05 squad vs workers:** allocation trade-off.
  - **S2-E06 assignment switching:** every 1 min vs every 30 min vs set-and-forget, measuring the micromanagement gain.
  - **S2-E07 KO sensitivity.**
  - **S2-E08 first recruit timing.**
- **Hypotheses (candidate):**
  - H-S2-01: first recruit at 2–5 active min (R03.03).
  - H-S2-02: loot per kill independent of deployed count (invariant).
  - H-S2-03: hero damage share 30–60% for balanced builds (R02.03; band unapproved).
  - H-S2-04: switching gain ≤ 5% vs set-and-forget over 1 h (candidate; R07.10 allows free switching, the question is whether micromanagement dominates).
  - H-S2-05: no mastery gain from switching without training.

### S3 — Mining, woodcutting, smithing, gear and queues

- **Scope:** profession levels per character; nodes (unlimited personal access); efficiency and yield; tools; six tier IDs (only tiers 1–2 have content in S3); instant gear crafting; timed components and bars; queues with reservations (D-07); shortage pause and resume; equipment instances, transfer and auto-equip; enhancement; recycle rules (O09).
- **Experiments:**
  - **S3-E01 conservation:** a property test across 10^4 generated command sequences.
  - **S3-E02 queue contention:** FIFO vs reserve-all vs proportional, as comparison arms.
  - **S3-E03 shortage timelines.**
  - **S3-E04 gather vs fight allocation.**
  - **S3-E05 tier step size:** TTK improvement per tier vs per enhancement.
  - **S3-E06 recycle loop search:** no net material gain from any craft/salvage cycle.
  - **S3-E07 old-material demand.**
  - **S3-E08 time to first useful craft** (R04.20).
- **Hypotheses (candidate):**
  - H-S3-01: no sequence creates or destroys materials except declared sources and sinks.
  - H-S3-02: a tier upgrade cuts on-tier TTK by ≥ 25% (candidate), while one enhancement level cuts it by less than half a tier.
  - H-S3-03: first useful crafted item at 15–25 active min (R04.20).

### S4 — Monuments, Bestiary, Feats, passive class bonuses

- **Scope:** three slice Monuments (owner chooses which; candidates Power/Vitality/Industry), Monument levels with gold costs and material milestones, soft caps, Buy Max; Bestiary kill milestones and emblems; Feats; class-record bonuses; bonus pools and breakdown.
- **Experiments:**
  - **S4-E01 one-time milestones:** repeated triggers grant nothing extra.
  - **S4-E02 pool grouping:** breakdown equals the applied stat for random bonus sets.
  - **S4-E03 feedback elasticity** (§8).
  - **S4-E04 soft-cap behaviour.**
  - **S4-E05 Buy Max correctness:** never crosses an unmet material milestone; matches brute force.
  - **S4-E06 Monument vs gear spending trade-off.**
- **Hypotheses (candidate):**
  - H-S4-01: no permanent-bonus loop has elasticity > 1 sustained over a 7-day horizon (candidate red-flag threshold).
  - H-S4-02: Buy Max equals the brute-force optimum for every tested state.

### S5 — Offline batch settlement, caps and RNG

- **Scope:** offline unlock; 60% normal window for 24 h; reduced window for 48 h (arms per D-08); 72 h cap; the W1 upgrade source (N-01) if approved; hero and squad default assignments (N-03); level-ups and stat changes mid-interval; shortages mid-interval; batched sampling; receipts; idempotency; time anomalies.
- **Experiments:**
  - **S5-E01 boundaries:** 0, 1 ms, 24 h exactly, 24 h + 1 ms, 72 h, 72 h + 1 day, negative clock.
  - **S5-E02 reference vs batch:** 200 scenarios ≤ 2 h; integers equal in expectation mode, statistically equal in sampled mode.
  - **S5-E03 level-up mid-offline.**
  - **S5-E04 shortage mid-offline.**
  - **S5-E05 reconnect idempotency:** the same settlement ID twice; and interleaved short logins.
  - **S5-E06 second-window arms:** flat 25%; ratio-linked k = 0.3, 0.5, 0.7.
  - **S5-E07 PR-FREQ vs PR-CAS vs PR-ABS equity.**
  - **S5-E08 connected-idle incentive** (N-02): online-idle vs offline progress per hour.
- **Hypotheses (candidate):**
  - H-S5-01: batch equals the reference (exact in expectation mode).
  - H-S5-02:
    - With identical rate-change events, any split of the offline timeline into settlements gives **exactly** identical credited totals (architecture §6.3 G1). This is an engineering gate.
    - Frequent logins differ only through the intended window reset, which is reported as a design effect.
  - H-S5-03: for PR-CAS, the offline share of progress is 30–60% (candidate band; owner to confirm).
  - H-S5-04: active progress per hour > offline progress per hour for every realistic profile (R07.19).

### S6 — Full W1 candidate tables, policies and sensitivity

- **Scope:**
  - **Zones and bosses:** zones 1–10 with gates, two major minibosses and the final boss (as clear-time and failure models), Normal/Elite boss repeat rewards, elite variants.
  - **Characters and gear:** six gear tiers, six recruit slots, three rare heroes (per D-06) as candidates.
  - **Systems and runs:** the full W1 Monument/Bestiary/Feat candidate tables, and every profile from 5 min to 30 days.
- **Experiments:**
  - **S6-E01 profile matrix:** every profile × composition, D1–D30.
  - **S6-E02 W1 completion distribution:** active hours to the final-boss clear (R06.09: 4–8 h; percentile per O14).
  - **S6-E03 strategy spread** (R08.19).
  - **S6-E04 earlier zones and resource trade-offs** (§9.1).
  - **S6-E05 sensitivity tornado:** XP curve, costs, enemy HP, slots, offline rate, drop odds, feedback coefficients, each ±25% and ±50%.
  - **S6-E06 rare hero acquisition timing and sidegrade check.**
  - **S6-E07 boss/elite rewards vs farming.**
  - **S6-E08 post-clear goal duration.**
  - **S6-E09 numeric headroom.**
- **Hypotheses (candidate):**
  - H-S6-01: realistic PR-BAL clears W1 Normal within 4–8 active hours.
  - H-S6-02: no realistic profile is stuck > 60 active min without an available action (candidate).
  - H-S6-03: strategy spread (best ÷ worst ratio of D7 progress) is between 1.1 and 2.0. This is a candidate: several viable strategies, not identical.
  - H-S6-04: repeat boss rewards do not exceed the best farming reward/h by more than a candidate ratio.
  - H-S6-05: peak values stay below 1% of 2^53−1.

### S7 — Baseline freeze, export, Luau fixtures, integration plan

- **Scope:**
  - **Freeze:** the owner-approved candidate set becomes `spec/content/w1.v1.0.0.json`, and the approved results are frozen in `baselines/` with fingerprints.
  - **Luau handover:** the fixture families are expanded for Luau kernels, and scenario traces are produced for the M6 settlement parity.
  - **Records:** a limitations document and a changelog.
- **Gates (proposed):**
  - A clean rerun reproduces every baseline fingerprint.
  - Every fixture has a derivation.
  - The independent reviewer signs off.
  - The owner approves the baseline as the starting point for M2–M8 (still subject to M7 live revision).

---

## 8. Feedback-loop testing

| Loop | Path | Test |
|---|---|---|
| L1 Combat economy | kills → gold → Monuments → damage → kills | Elasticity of D7 progress to Monument cost and bonus coefficients (S4-E03, S6-E05) |
| L2 Gear economy | gathering → bars → gear → TTK and gathering speed → more gathering | Elasticity to recipe cost and tool efficiency (S3, S6) |
| L3 Roster EXP | more deployed → more EXP per kill (per member) → stronger squad → faster kills | Deploy scaling 1→3 vs progress (S2-E01, S6-E05 slots) |
| L4 Bestiary | kills → Bestiary bonuses → faster kills | Bonus coefficient sensitivity (S4) |
| L5 Offline | gold → offline-efficiency upgrade → more offline gold | Only if N-01 is approved; sensitivity (S5-E06, S6-E05) |

**Method.** For each loop parameter θ, the elasticity is the change in log(progress metric at horizon H) per change in log θ, estimated from ±25% runs.

**Red flags (candidate):**
- an elasticity above 1 at H = 7 days;
- the time between successive upgrades shrinking over time (runaway);
- one system providing > 50% of all stat growth at D14.

Each red flag gets a written explanation, or a proposed versioned change for owner approval.

---

## 9. Specific required test plans

### 9.1 Earlier farming locations
- **Matched state:** at each first visit of zone N (N ≥ 2), list every accessible zone with estimated EXP/h, gold/h, materials/h and TTK, alongside 15-minute fork results. This is the frozen-lab zone-audit design, reused.
- **Fork tags:** a fork result is `CONFIRMED IN MODEL` only when the estimate and the fork agree; otherwise it is `HYPOTHESIS`.
- **Reported (not pass/fail):** where an earlier zone wins and for which builds, as R08.05 explicitly allows. Also whether the newest zone is ever *never* worth entering, which would be a red flag for the owner.
- **Increments:** S1 (zones 1–3), S6 (zones 1–10).

### 9.2 Assignment switching
- **Invariant (S2):** each switch settles the old interval exactly once. The carry is preserved, and no switch can create a credit.
- **Policy comparison:** switching every 1, 5 and 30 min vs set-and-forget, under the same schedule. Report the micromanagement gain (H-S2-04).
- **Offline:** switching right before logout uses the new assignment for the whole offline interval. No mixing.

### 9.3 Multi-character EXP
- **S2-E01:** with 0–3 deployed members, EXP per member per kill is constant, and account loot per kill is constant.
- **Eligibility:** a knocked-out or out-of-range member receives 0. A member eligible for only part of an encounter is credited only for kills while eligible.
- **Level spread:** the distribution of levels across the roster at D1/D7, and whether recruits keep up with the hero.

### 9.4 Resource contention
- **S3-E02:** two to four jobs competing for the same bar or component input, using FIFO, reserve-all and proportional rules as comparison arms.
- **Metrics:** shortage time per job, materials locked in reserve, throughput, and the explanation shown to the player.
- **Edge cases:**
  - a deposit and a job start at the same millisecond (deposit first, per D-07);
  - cancelling mid-unit returns the reservation only;
  - a cancelled job never produces output.

### 9.5 Offline settlement
- **S5-E01 to E05** (boundaries, reference vs batch, level-up, shortage, idempotency).
- **Long absences:** 72 h and 30-day absences confirm the cap and the receipt.
- **Restrictions:** offline never completes a major gate, never visits a zone, never assigns to an unvisited zone, and never purchases.
- **Paired comparison:** online automated vs offline over the same interval. The only differences may be efficiency and active-only opportunities.

---

## 10. What counts as evidence (reviewer checklist per increment)

- [ ] The manifest was committed before the results (timestamps and Git order).
- [ ] Every number in the report is labelled; targets and results are in separate columns.
- [ ] Rerun fingerprints match (`exp:verify` output included).
- [ ] Fixture derivations were inspected for at least the new families.
- [ ] Each failure is reported honestly, with the closest candidate.
- [ ] Limitations are listed (what the model does not include).
- [ ] No mechanic outside the approved design was introduced.
- [ ] Test counts are reported but not used as proof on their own.

---

## 11. Limits of this plan

- **No live validation.** All outputs are model output from candidate inputs. Real pacing comes from M7 playtests and later cohorts (R09.20, R10.19).
- **Behaviour is scripted.** Policies are scripts, and real players are more varied. Scripts can behave strangely in corner cases (frozen-lab Increment 6 finding at 1 h/day).
- **Physical play is abstracted:** pathing, crowding, multiplayer contention, mobile input and feel are reduced to candidate parameters (engagement overhead, travel time). These are among the most uncertain inputs and must be measured in M2.
- **Bosses are modelled only as clear time and failure chance;** telegraph skill is not simulated.
- **Monetisation profiles** are out of scope until the free path is validated (R10.18).
