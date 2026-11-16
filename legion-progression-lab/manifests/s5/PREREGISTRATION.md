# S5 pre-registration

**Registered before any registered S5 run.** The registration time and SHA-256 hashes are in `preregistration.json`.
The runner (`src/cli/s5-run.ts`) refuses a manifest in this folder that is unregistered or changed.

- **Source:** the owner's "L2.1 Acceptance and S5 Authorisation" §15–§17, and the M0 experiment plan §S5 (S5-E01…E08,
  H-S5-01…04).
- **Specification:** `planning/S5_SPECIFICATION.md`. **Rules:** `spec/formulas/s5-offline.md` v1.
- **Formula version:** `legion.s5.offline-credit.v1`.

**Exploratory workloads ran before this registration**, as the owner asks (§17), and are kept and labelled exploratory:
- `evidence/s5/performance/settlement-profile-exploratory.json` (the settlement profile);
- `evidence/s5/performance/explore-profiles.json` (one seed per profile, seven days);
- smoke subsets of every manifest (2–16 tasks; not evidence).

They set the horizons and budgets below. Two things they showed:
- **The slice content's EXP table ends (level 201) between D3 and D7** for every profile, so D7 is attempted only in
  S5-E07, and a run that leaves the content is recorded as stopped.
- **Connected automated play and attentive active play gave equal output per hour** in a farming window. Farming
  there is limited by respawns, not damage.

## 1. Experiments

| Manifest | What | Size | Budgets (enforced) |
|---|---|---|---|
| `S5-E01-boundaries` | boundaries and clock anomalies through the settlement service | 14 cases × 3 seeds | 10 min, 4 GB |
| `S5-E02-reference-vs-batch` | reference stepper against the efficient settlement, and reconstruction | **200 scenarios ≤ 2 h** (M0 plan) | 20 min, 8 GB |
| `S5-E03-mid-absence` | rate changes during an absence: chronological and partition-exact | 200 seeds | 30 min, 8 GB |
| `S5-E04-production-shortage` | production stops on a shortage and resumes on gathering deposits | 200 seeds | 20 min, 8 GB |
| `S5-E05-reconnect-idempotency` | retries, overlaps, stale loads, failure boundaries, short logins, cap resets | 200 scripts | 30 min, 8 GB |
| `S5-E06-efficiency-alternatives` | flat 25 %, ratio 0.3 / 0.5 / 0.7 × normal rate 60 / 80 / 100 % × PR-CAS, PR-ABS | 4 × 3 × 2 × **200 seeds** | 90 min, 12 GB |
| `S5-E07-profile-equity` | PR-FREQ, PR-CAS, PR-BAL, PR-ABS | 4 × **200 seeds** | 45 min, 12 GB |
| `S5-E08-connected-idle` | active, connected idle and offline progress per wall hour | 200 seeds | 20 min, 8 GB |

**About the sizes:**
- 200 is the M0 plan's registered size for E02, and its default for sampled metrics; none is reduced.
- E01's cases are exact, so they are run with three seeds.

**How the runs go:**
- **Each manifest runs on 15 worker threads.** Every task is a pure function of its manifest and its index, so the
  result rows do not depend on the parallelism.
- **The runs go one manifest at a time,** with nothing else running.
- **A run over its wall or memory budget is stopped** and reported as `STOPPED`, with the tasks it completed. Its
  hypothesis is then not established; it is never reported as passed.

**Further registered workloads, run alone afterwards, single thread:**
- **The settlement profile** (`repro/s5/settlement_perf.ts`). Budgets:
  - a maximal absence (72 wall hours) settles in at most 6 s at 60 % and at most 10 s at 100 %, on the
    representative S5 account;
  - throughput is at least 5 game hours per second for absences of 8 h or more;
  - the account record is at most 256 KB;
  - a validated restore plus a save takes at most 100 ms;
  - peak process memory is at most 1 GB.
- **The integration verification workloads,** run once more on the final code:
  - the checkpoint corpus: 40 cuts, 8 configurations, 2 identities, at most 30 min;
  - the identity differential: 14 h, 2 seeds, 7 configurations, at most 15 min;
  - state growth: 7 days in both identities and 28 days bounded, at most 15 min and 2 GB;
  - the offline checkpoint corpus: 30 cuts, 6 configurations, at most 60 min.

## 2. Engineering gates (pass or fail)

| Gate | Experiment | Pass rule |
|---|---|---|
| G-S5-01 | E01 | 42 / 42 cases. Every rule holds: the credited time equals P(w) recomputed from the rule text; the session opens at the logout game time + P(w); the windows and cap flags; the cursor passes the whole absence; a re-claim is refused; each anomaly is refused by its code with no change. |
| G-S5-02 (H-S5-01) | E02 | 200 / 200 scenarios with exact state equality at the reconnect (canonical JSON) and equal log counts; 200 / 200 reconstructions equal. |
| G-S5-03 (H-S5-02) | E02–E05 | Every storage split gives exactly the same state (E02 batches, E03 level-up cuts, E04 ten batches, E05 noisy against clean). |
| G-S5-04 | E03 | 200 / 200: offline equals connected automated play for the credited duration, and equals its level-up-cut batching; at least 95 % of seeds exercise a rate-changing event. |
| G-S5-05 | E04 | 200 / 200: exact log conservation, no negative balance, equal in ten batches; at least 95 % of seeds pause and resume, and make planks beyond their starting stock. |
| G-S5-06 | E05 | 200 / 200 noisy accounts end exactly as the clean ones; no unexpected answer; the clean runs commit every genuine request. |

**Stochastic contract:**
- There is no sampled or expected-value batching.
- The authoritative settlement is the engine's own sample path, so every equality above is exact.
- No statistical criterion is needed or claimed.

## 3. Balance hypotheses (candidates, reported, never forced)

**H-S5-03:** for PR-CAS, the offline share of progress is 30–60 %. This is a candidate band, not an engineering
requirement.
- It is reported separately for combat EXP, gold earned, units gathered, kills and production units.
- It is reported as p10 / p50 / p90 at D1 and D3.
- The efficiency is never lowered to make it pass (owner §16).

**H-S5-04:** active progress per hour exceeds offline progress per hour for every realistic profile (R07.19). It is
measured in E07 (per connected hour against per offline wall hour) and in E08.

**E06** is a comparison with no pass rule.

**E08** reports the connected-idle incentive (connected idle ÷ offline, per wall hour). A ratio above 1 is an incentive
to keep Roblox running; the owner asked for incentives to be identified, not hidden.

## 4. Separated quantities (owner §15 E07, §16)

| Quantity | Meaning |
|---|---|
| Active time | Connected time without auto-farm. |
| Connected automated time | Connected time with auto-farm. |
| Offline wall time | Time away. |
| Credited time | The game time credited for absences. |
| Equivalent productive time | Connected time plus credited time. |

**Reported progress:**
- conquest and exploration (zones visited and accessible, boss);
- account power on return (hero attack and HP, Monument levels);
- progression requiring active decisions (recruits, Monument levels).
