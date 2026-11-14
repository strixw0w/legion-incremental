# S3.1-E03-equipment-strength

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** In an informative combat range, how much do weapon-only, armour-only, full sets, enhancement levels and the Wood-to-Copper step change damage per second, TTK, kills per hour, survival and knockouts; and how do the Copper and percentage-weapon candidates compare with the control?

**Design.** Matched two-character squads (Archer hero and a Warrior at the same level, levels frozen; labelled diagnostic starts) farming with the realistic fixed-zone policy for 20 min in zone 2 at level 4 and zone 3 at level 7; gear configurations on both characters; candidate variants on the configurations they change. 100 replicates.

**Seeds:** root `s3.1-e03`, 100 replicates per cell. **Semantic fingerprint:** `bb367a3b1094398e0c275879ed131b2af55c34a9fa3406b92b58bbdcf6cd013d` (manifest SHA-256 `8d5a0700ed52d870e1f8aa1470880f7c8597d6a249ef407cb705c89216a50914`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|none | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|wood-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|wood-armour | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|wood-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|wood-full+1 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|wood-full+2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|wood-full+5 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|copper-armour | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z2-L4|copper-full+1 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off125|Z2-L4|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off125|Z2-L4|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|Z2-L4|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|Z2-L4|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|Z2-L4|copper-armour | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|Z2-L4|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z2-L4|wood-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z2-L4|wood-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z2-L4|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z2-L4|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|none | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|wood-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|wood-armour | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|wood-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|wood-full+1 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|wood-full+2 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|wood-full+5 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|copper-armour | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | control|Z3-L7|copper-full+1 | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off125|Z3-L7|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off125|Z3-L7|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|Z3-L7|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-off150|Z3-L7|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|Z3-L7|copper-armour | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | cu-offdef|Z3-L7|copper-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z3-L7|wood-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z3-L7|wood-full | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z3-L7|copper-weapon | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | wpn-pct|Z3-L7|copper-full | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|none | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|wood-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|wood-armour | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|wood-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|wood-full+1 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|wood-full+2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|wood-full+5 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|copper-armour | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z2-L4|copper-full+1 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off125|Z2-L4|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off125|Z2-L4|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|Z2-L4|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|Z2-L4|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|Z2-L4|copper-armour | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|Z2-L4|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z2-L4|wood-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z2-L4|wood-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z2-L4|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z2-L4|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|none | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|wood-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|wood-armour | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|wood-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|wood-full+1 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|wood-full+2 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|wood-full+5 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|copper-armour | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | control|Z3-L7|copper-full+1 | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off125|Z3-L7|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off125|Z3-L7|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|Z3-L7|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-off150|Z3-L7|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|Z3-L7|copper-armour | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | cu-offdef|Z3-L7|copper-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z3-L7|wood-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z3-L7|wood-full | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z3-L7|copper-weapon | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | wpn-pct|Z3-L7|copper-full | 1 | pass |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|none | 2 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|wood-weapon | 1.300 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|wood-armour | 2 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|wood-full | 1.300 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|wood-full+1 | 1.300 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|wood-full+2 | 1.300 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|wood-full+5 | 1.200 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|copper-weapon | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|copper-armour | 2 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|copper-full | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z2-L4|copper-full+1 | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off125|Z2-L4|copper-weapon | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off125|Z2-L4|copper-full | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off150|Z2-L4|copper-weapon | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off150|Z2-L4|copper-full | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-offdef|Z2-L4|copper-armour | 2 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-offdef|Z2-L4|copper-full | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z2-L4|wood-weapon | 1.300 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z2-L4|wood-full | 1.300 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z2-L4|copper-weapon | 1.200 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z2-L4|copper-full | 1 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|none | 4 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|wood-weapon | 3.500 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|wood-armour | 4 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|wood-full | 3.500 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|wood-full+1 | 3.500 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|wood-full+2 | 3.900 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|wood-full+5 | 3 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|copper-weapon | 2.600 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|copper-armour | 4 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|copper-full | 2.600 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | control|Z3-L7|copper-full+1 | 2.600 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off125|Z3-L7|copper-weapon | 2.600 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off125|Z3-L7|copper-full | 2.400 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off150|Z3-L7|copper-weapon | 2.400 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-off150|Z3-L7|copper-full | 2.400 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-offdef|Z3-L7|copper-armour | 4 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | cu-offdef|Z3-L7|copper-full | 2.400 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z3-L7|wood-weapon | 3.900 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z3-L7|wood-full | 3.900 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z3-L7|copper-weapon | 2.600 | reported |
| H-S3.1-03 | In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5) | reported | p50 >= 0 s (derived comparison reported separately) | wpn-pct|Z3-L7|copper-full | 2.600 | reported |

## Cells (p10 / p50 / p90)

| Cell | Tag | medianTtkS | killsPerHour | squadEffectiveDps | memberKnockoutsPerHour | deathsPerHour | recoveryShare | heroEffectiveShareFrac | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|
| control|Z2-L4|none | model-output (diagnostic) | 2 / 2 / 2 | 1041 / 1044 / 1050 | 13.03 / 13.09 / 13.16 | 12 / 15 / 15 | 0 / 0 / 0 | 0.07 / 0.08 / 0.08 | 0.58 / 0.59 / 0.59 | 0 / 0 / 0 |
| control|Z2-L4|wood-weapon | model-output (diagnostic) | 1.30 / 1.30 / 1.30 | 1341 / 1341 / 1344 | 16.78 / 16.79 / 16.83 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.52 / 0.52 / 0.52 | 0 / 0 / 0 |
| control|Z2-L4|wood-armour | model-output (diagnostic) | 2 / 2 / 2 | 1062 / 1062 / 1065 | 13.28 / 13.30 / 13.31 | 9 / 9 / 9 | 0 / 0 / 0 | 0.05 / 0.05 / 0.05 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 |
| control|Z2-L4|wood-full | model-output (diagnostic) | 1.30 / 1.30 / 1.30 | 1341 / 1341 / 1344 | 16.78 / 16.79 / 16.83 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.52 / 0.52 / 0.52 | 0 / 0 / 0 |
| control|Z2-L4|wood-full+1 | model-output (diagnostic) | 1.30 / 1.30 / 1.30 | 1341 / 1341 / 1344 | 16.78 / 16.79 / 16.83 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.52 / 0.52 / 0.53 | 0 / 0 / 0 |
| control|Z2-L4|wood-full+2 | model-output (diagnostic) | 1.30 / 1.30 / 1.30 | 1341 / 1341 / 1344 | 16.78 / 16.79 / 16.83 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.52 / 0.52 / 0.53 | 0 / 0 / 0 |
| control|Z2-L4|wood-full+5 | model-output (diagnostic) | 1.20 / 1.20 / 1.20 | 1386 / 1395 / 1404 | 17.33 / 17.44 / 17.57 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.57 / 0.58 / 0.58 | 0 / 0 / 0 |
| control|Z2-L4|copper-weapon | model-output (diagnostic) | 1 / 1 / 1 | 1590 / 1590 / 1590 | 19.88 / 19.88 / 19.88 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.60 / 0.60 / 0.60 | 0 / 0 / 0 |
| control|Z2-L4|copper-armour | model-output (diagnostic) | 2 / 2 / 2 | 1065 / 1071 / 1074 | 13.31 / 13.39 / 13.43 | 6 / 9 / 9 | 0 / 0 / 0 | 0.03 / 0.04 / 0.05 | 0.57 / 0.58 / 0.58 | 0 / 0 / 0 |
| control|Z2-L4|copper-full | model-output (diagnostic) | 1 / 1 / 1 | 1590 / 1590 / 1590 | 19.88 / 19.88 / 19.88 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.60 / 0.60 / 0.60 | 0 / 0 / 0 |
| control|Z2-L4|copper-full+1 | model-output (diagnostic) | 1 / 1 / 1 | 1593 / 1599 / 1602 | 19.94 / 19.99 / 20.03 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 |
| cu-off125|Z2-L4|copper-weapon | model-output (diagnostic) | 1 / 1 / 1 | 1590 / 1593 / 1596 | 19.90 / 19.94 / 19.95 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.57 / 0.57 / 0.57 | 0 / 0 / 0 |
| cu-off125|Z2-L4|copper-full | model-output (diagnostic) | 1 / 1 / 1 | 1596 / 1599 / 1602 | 19.95 / 19.99 / 20.02 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.56 / 0.56 / 0.57 | 0 / 0 / 0 |
| cu-off150|Z2-L4|copper-weapon | model-output (diagnostic) | 1 / 1 / 1 | 1656 / 1665 / 1674 | 20.70 / 20.81 / 20.95 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.55 / 0.55 / 0.56 | 0 / 0 / 0 |
| cu-off150|Z2-L4|copper-full | model-output (diagnostic) | 1 / 1 / 1 | 1677 / 1686 / 1701 | 20.96 / 21.10 / 21.26 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.55 / 0.55 / 0.55 | 0 / 0 / 0 |
| cu-offdef|Z2-L4|copper-armour | model-output (diagnostic) | 2 / 2 / 2 | 1077 / 1083 / 1086 | 13.49 / 13.54 / 13.57 | 3 / 3 / 3 | 0 / 0 / 0 | 0.02 / 0.02 / 0.02 | 0.56 / 0.57 / 0.57 | 0 / 0 / 0 |
| cu-offdef|Z2-L4|copper-full | model-output (diagnostic) | 1 / 1 / 1 | 1677 / 1686 / 1701 | 20.96 / 21.10 / 21.26 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.55 / 0.55 / 0.55 | 0 / 0 / 0 |
| wpn-pct|Z2-L4|wood-weapon | model-output (diagnostic) | 1.30 / 1.30 / 1.30 | 1341 / 1341 / 1344 | 16.76 / 16.78 / 16.80 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.52 / 0.52 / 0.53 | 0 / 0 / 0 |
| wpn-pct|Z2-L4|wood-full | model-output (diagnostic) | 1.30 / 1.30 / 1.30 | 1341 / 1341 / 1344 | 16.76 / 16.78 / 16.80 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.52 / 0.52 / 0.53 | 0 / 0 / 0 |
| wpn-pct|Z2-L4|copper-weapon | model-output (diagnostic) | 1.20 / 1.20 / 1.20 | 1386 / 1395 / 1404 | 17.32 / 17.44 / 17.57 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.59 / 0.60 / 0.61 | 0 / 0 / 0 |
| wpn-pct|Z2-L4|copper-full | model-output (diagnostic) | 1 / 1 / 1.20 | 1407 / 1416 / 1428 | 17.59 / 17.70 / 17.85 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0.59 / 0.60 / 0.60 | 0 / 0 / 0 |
| control|Z3-L7|none | model-output (diagnostic) | 4 / 4 / 4 | 531 / 540 / 546 | 17.74 / 18 / 18.25 | 30 / 30 / 30 | 0 / 0 / 0 | 0.16 / 0.17 / 0.17 | 0.60 / 0.60 / 0.61 | 0 / 0 / 0 |
| control|Z3-L7|wood-weapon | model-output (diagnostic) | 3 / 3.50 / 3.50 | 672 / 681 / 687 | 22.50 / 22.70 / 22.93 | 24 / 24 / 24 | 0 / 0 / 0 | 0.13 / 0.13 / 0.13 | 0.58 / 0.58 / 0.59 | 0 / 0 / 0 |
| control|Z3-L7|wood-armour | model-output (diagnostic) | 4 / 4 / 4 | 552 / 558 / 564 | 18.49 / 18.60 / 18.80 | 24 / 24 / 24 | 0 / 0 / 0 | 0.13 / 0.13 / 0.13 | 0.59 / 0.60 / 0.60 | 0 / 0 / 0 |
| control|Z3-L7|wood-full | model-output (diagnostic) | 3 / 3.50 / 3.50 | 687 / 693 / 702 | 22.93 / 23.10 / 23.47 | 18 / 18 / 18 | 0 / 0 / 0 | 0.10 / 0.10 / 0.10 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 |
| control|Z3-L7|wood-full+1 | model-output (diagnostic) | 3 / 3.50 / 3.50 | 690 / 696 / 708 | 23.06 / 23.23 / 23.63 | 18 / 18 / 18 | 0 / 0 / 0 | 0.10 / 0.10 / 0.10 | 0.58 / 0.58 / 0.59 | 0 / 0 / 0 |
| control|Z3-L7|wood-full+2 | model-output (diagnostic) | 3 / 3.90 / 3.90 | 705 / 714 / 720 | 23.55 / 23.87 / 24.07 | 18 / 18 / 18 | 0 / 0 / 0 | 0.10 / 0.10 / 0.10 | 0.59 / 0.60 / 0.60 | 0 / 0 / 0 |
| control|Z3-L7|wood-full+5 | model-output (diagnostic) | 3 / 3 / 3 | 771 / 780 / 789 | 25.77 / 26 / 26.30 | 15 / 15 / 15 | 0 / 0 / 0 | 0.08 / 0.08 / 0.08 | 0.59 / 0.59 / 0.59 | 0 / 0 / 0 |
| control|Z3-L7|copper-weapon | model-output (diagnostic) | 2.60 / 2.60 / 2.60 | 837 / 846 / 849 | 27.93 / 28.20 / 28.30 | 21 / 21 / 21 | 0 / 0 / 0 | 0.10 / 0.12 / 0.12 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 |
| control|Z3-L7|copper-armour | model-output (diagnostic) | 4 / 4 / 4 | 579 / 585 / 588 | 19.30 / 19.50 / 19.69 | 18 / 18 / 21 | 0 / 0 / 0 | 0.10 / 0.10 / 0.10 | 0.58 / 0.58 / 0.58 | 0 / 0 / 0 |
| control|Z3-L7|copper-full | model-output (diagnostic) | 2.60 / 2.60 / 2.60 | 870 / 873 / 873 | 29.07 / 29.10 / 29.18 | 12 / 12 / 12 | 0 / 0 / 0 | 0.07 / 0.07 / 0.07 | 0.57 / 0.57 / 0.58 | 0 / 0 / 0 |
| control|Z3-L7|copper-full+1 | model-output (diagnostic) | 2.60 / 2.60 / 2.60 | 873 / 876 / 879 | 29.14 / 29.29 / 29.39 | 12 / 12 / 12 | 0 / 0 / 0 | 0.07 / 0.07 / 0.07 | 0.57 / 0.58 / 0.58 | 0 / 0 / 0 |
| cu-off125|Z3-L7|copper-weapon | model-output (diagnostic) | 2.40 / 2.60 / 2.60 | 861 / 867 / 873 | 28.70 / 28.90 / 29.10 | 18 / 18 / 21 | 0 / 0 / 0 | 0.10 / 0.10 / 0.11 | 0.58 / 0.58 / 0.59 | 0 / 0 / 0 |
| cu-off125|Z3-L7|copper-full | model-output (diagnostic) | 2.40 / 2.40 / 2.50 | 891 / 897 / 903 | 29.70 / 29.90 / 30.16 | 12 / 12 / 12 | 0 / 0 / 0 | 0.07 / 0.07 / 0.07 | 0.58 / 0.58 / 0.59 | 0 / 0 / 0 |
| cu-off150|Z3-L7|copper-weapon | model-output (diagnostic) | 2.40 / 2.40 / 2.60 | 891 / 900 / 909 | 29.79 / 30.04 / 30.36 | 18 / 18 / 18 | 0 / 0 / 0 | 0.10 / 0.10 / 0.10 | 0.62 / 0.62 / 0.63 | 0 / 0 / 0 |
| cu-off150|Z3-L7|copper-full | model-output (diagnostic) | 2.40 / 2.40 / 2.40 | 933 / 945 / 957 | 31.14 / 31.50 / 31.93 | 9 / 12 / 12 | 0 / 0 / 0 | 0.05 / 0.05 / 0.07 | 0.60 / 0.61 / 0.62 | 0 / 0 / 0 |
| cu-offdef|Z3-L7|copper-armour | model-output (diagnostic) | 4 / 4 / 4 | 594 / 597 / 603 | 19.80 / 19.99 / 20.10 | 15 / 15 / 18 | 0 / 0 / 0 | 0.08 / 0.08 / 0.09 | 0.57 / 0.57 / 0.58 | 0 / 0 / 0 |
| cu-offdef|Z3-L7|copper-full | model-output (diagnostic) | 2.40 / 2.40 / 2.40 | 945 / 954 / 966 | 31.56 / 31.86 / 32.20 | 9 / 9 / 9 | 0 / 0 / 0 | 0.05 / 0.05 / 0.05 | 0.60 / 0.61 / 0.61 | 0 / 0 / 0 |
| wpn-pct|Z3-L7|wood-weapon | model-output (diagnostic) | 3 / 3.90 / 3.90 | 690 / 696 / 702 | 23 / 23.25 / 23.46 | 24 / 24 / 24 | 0 / 0 / 0 | 0.13 / 0.13 / 0.13 | 0.60 / 0.60 / 0.60 | 0 / 0 / 0 |
| wpn-pct|Z3-L7|wood-full | model-output (diagnostic) | 3 / 3.90 / 3.90 | 705 / 714 / 720 | 23.50 / 23.83 / 24.09 | 18 / 18 / 18 | 0 / 0 / 0 | 0.10 / 0.10 / 0.10 | 0.59 / 0.60 / 0.60 | 0 / 0 / 0 |
| wpn-pct|Z3-L7|copper-weapon | model-output (diagnostic) | 2.60 / 2.60 / 2.60 | 849 / 855 / 858 | 28.39 / 28.50 / 28.60 | 21 / 21 / 21 | 0 / 0 / 0 | 0.11 / 0.12 / 0.12 | 0.58 / 0.59 / 0.60 | 0 / 0 / 0 |
| wpn-pct|Z3-L7|copper-full | model-output (diagnostic) | 2.60 / 2.60 / 2.60 | 876 / 882 / 885 | 29.24 / 29.40 / 29.53 | 12 / 12 / 12 | 0 / 0 / 0 | 0.07 / 0.07 / 0.07 | 0.59 / 0.59 / 0.60 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

4200 runs, 37128066 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| control|Z2-L4|none | 1 | 1076.0 | approximate | 1045.4 | 2.9% | not reached | not reached | — |
| control|Z2-L4|wood-weapon | 1 | 1307.0 | approximate | 1342.6 | -2.6% | not reached | not reached | — |
| control|Z2-L4|wood-armour | 1 | 1076.0 | approximate | 1062.8 | 1.2% | not reached | not reached | — |
| control|Z2-L4|wood-full | 1 | 1307.0 | approximate | 1342.6 | -2.6% | not reached | not reached | — |
| control|Z2-L4|wood-full+1 | 1 | 1316.2 | approximate | 1342.6 | -2.0% | not reached | not reached | — |
| control|Z2-L4|wood-full+2 | 1 | 1317.4 | approximate | 1342.6 | -1.9% | not reached | not reached | — |
| control|Z2-L4|wood-full+5 | 1 | 1387.6 | approximate | 1394.7 | -0.5% | not reached | not reached | — |
| control|Z2-L4|copper-weapon | 1 | 1479.8 | approximate | 1590 | -6.9% | not reached | not reached | — |
| control|Z2-L4|copper-armour | 1 | 1085.7 | approximate | 1069.0 | 1.6% | not reached | not reached | — |
| control|Z2-L4|copper-full | 1 | 1492.8 | approximate | 1590 | -6.1% | not reached | not reached | — |
| control|Z2-L4|copper-full+1 | 1 | 1549.8 | approximate | 1597.5 | -3.0% | not reached | not reached | — |
| cu-off125|Z2-L4|copper-weapon | 1 | 1587.4 | approximate | 1593.6 | -0.4% | not reached | not reached | — |
| cu-off125|Z2-L4|copper-full | 1 | 1602.2 | approximate | 1598.4 | 0.2% | not reached | not reached | — |
| cu-off150|Z2-L4|copper-weapon | 1 | 1650.4 | approximate | 1665.6 | -0.9% | not reached | not reached | — |
| cu-off150|Z2-L4|copper-full | 1 | 1670.3 | approximate | 1688.0 | -1.0% | not reached | not reached | — |
| cu-offdef|Z2-L4|copper-armour | 1 | 1090.5 | approximate | 1081.6 | 0.8% | not reached | not reached | — |
| cu-offdef|Z2-L4|copper-full | 1 | 1670.3 | approximate | 1688.0 | -1.0% | not reached | not reached | — |
| wpn-pct|Z2-L4|wood-weapon | 1 | 1280.7 | approximate | 1341.2 | -4.5% | not reached | not reached | — |
| wpn-pct|Z2-L4|wood-full | 1 | 1280.7 | approximate | 1341.2 | -4.5% | not reached | not reached | — |
| wpn-pct|Z2-L4|copper-weapon | 1 | 1445.5 | approximate | 1394.7 | 3.6% | not reached | not reached | — |
| wpn-pct|Z2-L4|copper-full | 1 | 1458.2 | approximate | 1416.6 | 2.9% | not reached | not reached | — |
| control|Z3-L7|none | 1 | 615.8 | approximate | 539.2 | 14.2% | not reached | not reached | — |
| control|Z3-L7|wood-weapon | 1 | 757.9 | approximate | 680.1 | 11.4% | not reached | not reached | — |
| control|Z3-L7|wood-armour | 1 | 615.8 | approximate | 557.9 | 10.4% | not reached | not reached | — |
| control|Z3-L7|wood-full | 1 | 757.9 | approximate | 693.8 | 9.2% | not reached | not reached | — |
| control|Z3-L7|wood-full+1 | 1 | 761.4 | approximate | 697.3 | 9.2% | not reached | not reached | — |
| control|Z3-L7|wood-full+2 | 1 | 779.8 | approximate | 714.1 | 9.2% | not reached | not reached | — |
| control|Z3-L7|wood-full+5 | 1 | 817.6 | approximate | 779.5 | 4.9% | not reached | not reached | — |
| control|Z3-L7|copper-weapon | 1 | 859.6 | approximate | 843.6 | 1.9% | not reached | not reached | — |
| control|Z3-L7|copper-armour | 1 | 623.4 | approximate | 584.1 | 6.7% | not reached | not reached | — |
| control|Z3-L7|copper-full | 1 | 869.1 | approximate | 872.6 | -0.4% | not reached | not reached | — |
| control|Z3-L7|copper-full+1 | 1 | 903.1 | approximate | 877.3 | 3.0% | not reached | not reached | — |
| cu-off125|Z3-L7|copper-weapon | 1 | 927.8 | approximate | 866.1 | 7.1% | not reached | not reached | — |
| cu-off125|Z3-L7|copper-full | 1 | 940.0 | approximate | 896.7 | 4.8% | not reached | not reached | — |
| cu-off150|Z3-L7|copper-weapon | 1 | 980.5 | approximate | 900.7 | 8.9% | not reached | not reached | — |
| cu-off150|Z3-L7|copper-full | 1 | 995.2 | approximate | 944.3 | 5.4% | not reached | not reached | — |
| cu-offdef|Z3-L7|copper-armour | 1 | 627.1 | approximate | 597.9 | 4.9% | not reached | not reached | — |
| cu-offdef|Z3-L7|copper-full | 1 | 995.2 | approximate | 955.1 | 4.2% | not reached | not reached | — |
| wpn-pct|Z3-L7|wood-weapon | 1 | 779.8 | approximate | 696.1 | 12.0% | not reached | not reached | — |
| wpn-pct|Z3-L7|wood-full | 1 | 779.8 | approximate | 713.2 | 9.3% | not reached | not reached | — |
| wpn-pct|Z3-L7|copper-weapon | 1 | 912.8 | approximate | 853.6 | 6.9% | not reached | not reached | — |
| wpn-pct|Z3-L7|copper-full | 1 | 922.4 | approximate | 880.6 | 4.7% | not reached | not reached | — |

## Notes and limitations

- The Archer hero at level 4 is a labelled diagnostic start (the class normally opens at level 5).
- The S3 content is the control; variants are candidates only.

