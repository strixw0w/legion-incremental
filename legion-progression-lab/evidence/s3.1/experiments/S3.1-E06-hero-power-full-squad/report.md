# S3.1-E06-hero-power-full-squad

**Labels:** all values are `model-output` from `candidate` inputs (S3 industry model on the S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.

**Question.** With three deployed recruits, comparable equipment and identical levels, how do hero base-attack and combined ability variants change the hero contribution (raw and fractional effective), damage per second, overkill and progression, by hero class, passive and attentive?

**Design.** Matched: zone 3, hero level 10 (Archer, Warrior or Mage) with level-10 Warrior, Archer and Mage recruits, everyone in full Wood +0, the fixed-zone squad policy, 20 min. Campaigns: POL3-CONQ (three deployed) at PR-BAL. Variants control, x1.25, x1.5, x2.0 and combined C (hero only). 50 replicates.

**Seeds:** root `s3.1-e06`, 50 replicates per cell. **Semantic fingerprint:** `af08898c5782e3408df5080dbefd350cdfa158e2c4d41c2e8595c5a1ed4dbe64` (manifest SHA-256 `0bd77acafd203957280528deaab40a67e2311b8df191fae04c640dfcf6f66d2d`).

## Pre-registered hypotheses

| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |
|---|---|---|---|---|---|---|
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|Z3-L10|hero-archer|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|Z3-L10|hero-archer|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|Z3-L10|hero-warrior|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|Z3-L10|hero-warrior|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|Z3-L10|hero-mage|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|Z3-L10|hero-mage|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|Z3-L10|hero-archer|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|Z3-L10|hero-archer|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|Z3-L10|hero-warrior|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|Z3-L10|hero-warrior|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|Z3-L10|hero-mage|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|Z3-L10|hero-mage|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|Z3-L10|hero-archer|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|Z3-L10|hero-archer|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|Z3-L10|hero-warrior|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|Z3-L10|hero-warrior|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|Z3-L10|hero-mage|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|Z3-L10|hero-mage|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|Z3-L10|hero-archer|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|Z3-L10|hero-archer|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|Z3-L10|hero-warrior|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|Z3-L10|hero-warrior|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|Z3-L10|hero-mage|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|Z3-L10|hero-mage|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|Z3-L10|hero-archer|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|Z3-L10|hero-archer|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|Z3-L10|hero-warrior|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|Z3-L10|hero-warrior|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|Z3-L10|hero-mage|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|Z3-L10|hero-mage|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL3-CONQ|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | a10-p1.6-g100|PR-BAL|POL3-CONQ|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|PR-BAL|POL3-CONQ|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a125|PR-BAL|POL3-CONQ|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|PR-BAL|POL3-CONQ|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a150|PR-BAL|POL3-CONQ|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|PR-BAL|POL3-CONQ|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-a200|PR-BAL|POL3-CONQ|attentive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|PR-BAL|POL3-CONQ|passive | 0 | pass |
| H-S3.1-06 | Every S2 and S3 invariant holds (monitor I1-I21) | engineering | max == 0 violations | s31-c|PR-BAL|POL3-CONQ|attentive | 0 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|Z3-L10|hero-archer|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|Z3-L10|hero-archer|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|Z3-L10|hero-warrior|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|Z3-L10|hero-warrior|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|Z3-L10|hero-mage|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|Z3-L10|hero-mage|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|Z3-L10|hero-archer|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|Z3-L10|hero-archer|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|Z3-L10|hero-warrior|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|Z3-L10|hero-warrior|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|Z3-L10|hero-mage|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|Z3-L10|hero-mage|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|Z3-L10|hero-archer|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|Z3-L10|hero-archer|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|Z3-L10|hero-warrior|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|Z3-L10|hero-warrior|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|Z3-L10|hero-mage|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|Z3-L10|hero-mage|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|Z3-L10|hero-archer|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|Z3-L10|hero-archer|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|Z3-L10|hero-warrior|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|Z3-L10|hero-warrior|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|Z3-L10|hero-mage|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|Z3-L10|hero-mage|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|Z3-L10|hero-archer|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|Z3-L10|hero-archer|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|Z3-L10|hero-warrior|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|Z3-L10|hero-warrior|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|Z3-L10|hero-mage|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|Z3-L10|hero-mage|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|PR-BAL|POL3-CONQ|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | a10-p1.6-g100|PR-BAL|POL3-CONQ|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|PR-BAL|POL3-CONQ|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a125|PR-BAL|POL3-CONQ|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|PR-BAL|POL3-CONQ|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a150|PR-BAL|POL3-CONQ|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|PR-BAL|POL3-CONQ|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-a200|PR-BAL|POL3-CONQ|attentive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|PR-BAL|POL3-CONQ|passive | 1 | pass |
| H-S3.1-06b | Fractional effective attribution is within its precision contract in every run | engineering | mean == 1 share of runs | s31-c|PR-BAL|POL3-CONQ|attentive | 1 | pass |

## Cells (p10 / p50 / p90)

| Cell | Tag | heroEffectiveShareFrac | heroDamageShare | heroAbilityShareFrac | heroOverkillShareFrac | squadEffectiveDps | heroEffectiveDps | killsPerHour | expTotal | legionExpTotal | minToL10 | invariantViolations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|Z3-L10|hero-archer|passive | model-output (diagnostic) | 0.24 / 0.24 / 0.24 | 0.23 / 0.23 / 0.23 | 0 / 0 / 0 | 0.18 / 0.18 / 0.19 | 57.50 / 57.79 / 58.00 | 13.71 / 13.80 / 13.89 | 1725 / 1731 / 1740 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|Z3-L10|hero-archer|attentive | model-output (diagnostic) | 0.32 / 0.32 / 0.33 | 0.30 / 0.30 / 0.30 | 0.11 / 0.12 / 0.12 | 0.19 / 0.19 / 0.20 | 62.60 / 62.90 / 63.20 | 20.25 / 20.36 / 20.46 | 1878 / 1887 / 1896 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|Z3-L10|hero-warrior|passive | model-output (diagnostic) | 0.14 / 0.14 / 0.15 | 0.14 / 0.14 / 0.14 | 0 / 0 / 0 | 0.15 / 0.16 / 0.16 | 54.70 / 54.76 / 54.80 | 7.86 / 7.91 / 7.97 | 1641 / 1641 / 1644 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|Z3-L10|hero-warrior|attentive | model-output (diagnostic) | 0.19 / 0.19 / 0.19 | 0.18 / 0.19 / 0.19 | 0.04 / 0.05 / 0.05 | 0.17 / 0.19 / 0.20 | 55.70 / 57.06 / 57.40 | 10.61 / 10.88 / 11.01 | 1671 / 1710 / 1722 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|Z3-L10|hero-mage|passive | model-output (diagnostic) | 0.17 / 0.17 / 0.17 | 0.16 / 0.16 / 0.17 | 0 / 0 / 0 | 0.22 / 0.23 / 0.24 | 53.20 / 53.50 / 53.90 | 8.87 / 8.93 / 9.03 | 1596 / 1605 / 1617 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|Z3-L10|hero-mage|attentive | model-output (diagnostic) | 0.25 / 0.25 / 0.25 | 0.26 / 0.26 / 0.27 | 0.10 / 0.10 / 0.10 | 0.32 / 0.32 / 0.33 | 57.20 / 57.79 / 58.18 | 14.39 / 14.53 / 14.65 | 1716 / 1731 / 1743 | — | — | — | 0 / 0 / 0 |
| s31-a125|Z3-L10|hero-archer|passive | model-output (diagnostic) | 0.26 / 0.27 / 0.27 | 0.26 / 0.26 / 0.26 | 0 / 0 / 0 | 0.23 / 0.23 / 0.24 | 57.60 / 57.80 / 58 | 15.24 / 15.35 / 15.44 | 1728 / 1734 / 1740 | — | — | — | 0 / 0 / 0 |
| s31-a125|Z3-L10|hero-archer|attentive | model-output (diagnostic) | 0.35 / 0.36 / 0.36 | 0.34 / 0.34 / 0.34 | 0.12 / 0.12 / 0.13 | 0.25 / 0.25 / 0.26 | 62.70 / 63.00 / 63.30 | 22.30 / 22.46 / 22.60 | 1881 / 1890 / 1899 | — | — | — | 0 / 0 / 0 |
| s31-a125|Z3-L10|hero-warrior|passive | model-output (diagnostic) | 0.17 / 0.17 / 0.17 | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 | 0.19 / 0.20 / 0.20 | 54.79 / 54.80 / 54.96 | 9.36 / 9.41 / 9.46 | 1641 / 1644 / 1647 | — | — | — | 0 / 0 / 0 |
| s31-a125|Z3-L10|hero-warrior|attentive | model-output (diagnostic) | 0.22 / 0.22 / 0.22 | 0.22 / 0.22 / 0.23 | 0.05 / 0.05 / 0.06 | 0.21 / 0.23 / 0.25 | 56.66 / 57.10 / 57.36 | 12.55 / 12.65 / 12.75 | 1698 / 1713 / 1719 | — | — | — | 0 / 0 / 0 |
| s31-a125|Z3-L10|hero-mage|passive | model-output (diagnostic) | 0.20 / 0.20 / 0.20 | 0.18 / 0.18 / 0.18 | 0 / 0 / 0 | 0.10 / 0.10 / 0.11 | 55.10 / 55.30 / 55.77 | 10.93 / 11.02 / 11.11 | 1653 / 1659 / 1671 | — | — | — | 0 / 0 / 0 |
| s31-a125|Z3-L10|hero-mage|attentive | model-output (diagnostic) | 0.28 / 0.29 / 0.29 | 0.30 / 0.30 / 0.30 | 0.10 / 0.10 / 0.10 | 0.30 / 0.30 / 0.31 | 59.80 / 60.29 / 60.70 | 16.98 / 17.21 / 17.32 | 1794 / 1806 / 1821 | — | — | — | 0 / 0 / 0 |
| s31-a150|Z3-L10|hero-archer|passive | model-output (diagnostic) | 0.30 / 0.30 / 0.30 | 0.29 / 0.29 / 0.29 | 0 / 0 / 0 | 0.22 / 0.22 / 0.23 | 59.50 / 59.60 / 59.60 | 17.87 / 17.96 / 18.06 | 1785 / 1788 / 1788 | — | — | — | 0 / 0 / 0 |
| s31-a150|Z3-L10|hero-archer|attentive | model-output (diagnostic) | 0.39 / 0.39 / 0.40 | 0.38 / 0.38 / 0.38 | 0.13 / 0.13 / 0.13 | 0.30 / 0.30 / 0.30 | 63.10 / 63.10 / 63.40 | 24.81 / 24.87 / 24.99 | 1893 / 1893 / 1902 | — | — | — | 0 / 0 / 0 |
| s31-a150|Z3-L10|hero-warrior|passive | model-output (diagnostic) | 0.19 / 0.19 / 0.19 | 0.19 / 0.19 / 0.20 | 0 / 0 / 0 | 0.22 / 0.23 / 0.23 | 55.00 / 55.27 / 55.48 | 10.55 / 10.64 / 10.72 | 1650 / 1656 / 1662 | — | — | — | 0 / 0 / 0 |
| s31-a150|Z3-L10|hero-warrior|attentive | model-output (diagnostic) | 0.24 / 0.25 / 0.25 | 0.25 / 0.25 / 0.25 | 0.06 / 0.06 / 0.06 | 0.22 / 0.25 / 0.27 | 57.89 / 58.17 / 58.60 | 14.09 / 14.37 / 14.66 | 1734 / 1743 / 1758 | — | — | — | 0 / 0 / 0 |
| s31-a150|Z3-L10|hero-mage|passive | model-output (diagnostic) | 0.23 / 0.23 / 0.23 | 0.20 / 0.20 / 0.20 | 0 / 0 / 0 | 0.11 / 0.11 / 0.11 | 55.80 / 56.10 / 56.49 | 12.75 / 12.81 / 12.93 | 1674 / 1683 / 1692 | — | — | — | 0 / 0 / 0 |
| s31-a150|Z3-L10|hero-mage|attentive | model-output (diagnostic) | 0.31 / 0.32 / 0.32 | 0.33 / 0.33 / 0.33 | 0.10 / 0.11 / 0.11 | 0.33 / 0.34 / 0.34 | 59.70 / 60.30 / 60.60 | 18.79 / 19.08 / 19.26 | 1791 / 1809 / 1818 | — | — | — | 0 / 0 / 0 |
| s31-a200|Z3-L10|hero-archer|passive | model-output (diagnostic) | 0.35 / 0.35 / 0.36 | 0.34 / 0.34 / 0.34 | 0 / 0 / 0 | 0.29 / 0.29 / 0.30 | 59.48 / 59.70 / 59.99 | 20.95 / 21.08 / 21.25 | 1782 / 1791 / 1797 | — | — | — | 0 / 0 / 0 |
| s31-a200|Z3-L10|hero-archer|attentive | model-output (diagnostic) | 0.44 / 0.44 / 0.44 | 0.44 / 0.44 / 0.44 | 0.14 / 0.14 / 0.14 | 0.38 / 0.38 / 0.38 | 64.00 / 64.30 / 64.90 | 28.28 / 28.38 / 28.55 | 1920 / 1929 / 1947 | — | — | — | 0 / 0 / 0 |
| s31-a200|Z3-L10|hero-warrior|passive | model-output (diagnostic) | 0.23 / 0.23 / 0.23 | 0.23 / 0.23 / 0.24 | 0 / 0 / 0 | 0.27 / 0.28 / 0.28 | 55.30 / 55.50 / 55.70 | 12.57 / 12.67 / 12.76 | 1659 / 1665 / 1671 | — | — | — | 0 / 0 / 0 |
| s31-a200|Z3-L10|hero-warrior|attentive | model-output (diagnostic) | 0.28 / 0.29 / 0.29 | 0.29 / 0.30 / 0.30 | 0.06 / 0.07 / 0.07 | 0.29 / 0.31 / 0.33 | 58.07 / 58.50 / 59.00 | 16.37 / 16.78 / 17.24 | 1740 / 1755 / 1770 | — | — | — | 0 / 0 / 0 |
| s31-a200|Z3-L10|hero-mage|passive | model-output (diagnostic) | 0.30 / 0.30 / 0.30 | 0.25 / 0.25 / 0.25 | 0 / 0 / 0 | 0.10 / 0.11 / 0.11 | 57.80 / 58.10 / 58.38 | 17.19 / 17.32 / 17.44 | 1734 / 1743 / 1749 | — | — | — | 0 / 0 / 0 |
| s31-a200|Z3-L10|hero-mage|attentive | model-output (diagnostic) | 0.38 / 0.38 / 0.38 | 0.39 / 0.40 / 0.40 | 0.11 / 0.11 / 0.11 | 0.37 / 0.38 / 0.38 | 62.20 / 62.60 / 63.00 | 23.54 / 23.66 / 23.83 | 1866 / 1878 / 1890 | — | — | — | 0 / 0 / 0 |
| s31-c|Z3-L10|hero-archer|passive | model-output (diagnostic) | 0.26 / 0.27 / 0.27 | 0.26 / 0.26 / 0.26 | 0 / 0 / 0 | 0.23 / 0.23 / 0.24 | 57.60 / 57.80 / 58 | 15.24 / 15.35 / 15.44 | 1728 / 1734 / 1740 | — | — | — | 0 / 0 / 0 |
| s31-c|Z3-L10|hero-archer|attentive | model-output (diagnostic) | 0.36 / 0.37 / 0.37 | 0.38 / 0.38 / 0.38 | 0.14 / 0.14 / 0.15 | 0.33 / 0.33 / 0.34 | 63.10 / 63.70 / 64.20 | 23.09 / 23.26 / 23.47 | 1893 / 1911 / 1926 | — | — | — | 0 / 0 / 0 |
| s31-c|Z3-L10|hero-warrior|passive | model-output (diagnostic) | 0.17 / 0.17 / 0.17 | 0.17 / 0.17 / 0.17 | 0 / 0 / 0 | 0.19 / 0.20 / 0.20 | 54.79 / 54.80 / 54.96 | 9.36 / 9.41 / 9.46 | 1641 / 1644 / 1647 | — | — | — | 0 / 0 / 0 |
| s31-c|Z3-L10|hero-warrior|attentive | model-output (diagnostic) | 0.27 / 0.27 / 0.27 | 0.25 / 0.25 / 0.25 | 0.10 / 0.11 / 0.11 | 0.12 / 0.13 / 0.14 | 62.60 / 62.80 / 62.99 | 16.71 / 16.82 / 16.92 | 1878 / 1884 / 1887 | — | — | — | 0 / 0 / 0 |
| s31-c|Z3-L10|hero-mage|passive | model-output (diagnostic) | 0.20 / 0.20 / 0.20 | 0.18 / 0.18 / 0.18 | 0 / 0 / 0 | 0.10 / 0.10 / 0.11 | 55.10 / 55.30 / 55.77 | 10.93 / 11.02 / 11.11 | 1653 / 1659 / 1671 | — | — | — | 0 / 0 / 0 |
| s31-c|Z3-L10|hero-mage|attentive | model-output (diagnostic) | 0.30 / 0.30 / 0.30 | 0.33 / 0.34 / 0.34 | 0.11 / 0.12 / 0.12 | 0.38 / 0.39 / 0.40 | 58.90 / 59.20 / 59.60 | 17.69 / 17.84 / 18.09 | 1767 / 1776 / 1788 | — | — | — | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL3-CONQ|passive | model-output (realistic) | 0.22 / 0.22 / 0.22 | 0.19 / 0.19 / 0.19 | 0 / 0 / 0 | 0.44 / 0.44 / 0.45 | 66.65 / 66.82 / 66.95 | 14.48 / 14.62 / 14.71 | 2162 / 2167 / 2171 | 44324 / 44434 / 44522 | 174636 / 175076 / 175428 | 7.31 / 7.38 / 7.46 | 0 / 0 / 0 |
| a10-p1.6-g100|PR-BAL|POL3-CONQ|attentive | model-output (realistic) | 0.28 / 0.29 / 0.29 | 0.28 / 0.28 / 0.28 | 0.09 / 0.09 / 0.10 | 0.54 / 0.54 / 0.55 | 68.12 / 68.28 / 68.45 | 19.43 / 19.58 / 19.85 | 2206 / 2211 / 2216 | 45292 / 45402 / 45512 | 178508 / 178948 / 179388 | 7.04 / 7.09 / 7.14 | 0 / 0 / 0 |
| s31-a125|PR-BAL|POL3-CONQ|passive | model-output (realistic) | 0.25 / 0.26 / 0.26 | 0.23 / 0.23 / 0.23 | 0 / 0 / 0 | 0.47 / 0.48 / 0.48 | 68.05 / 68.22 / 68.42 | 17.31 / 17.42 / 17.63 | 2204 / 2209 / 2215 | 45248 / 45358 / 45490 | 178332 / 178772 / 179300 | 6.77 / 6.84 / 6.91 | 0 / 0 / 0 |
| s31-a125|PR-BAL|POL3-CONQ|attentive | model-output (realistic) | 0.32 / 0.33 / 0.33 | 0.32 / 0.32 / 0.32 | 0.10 / 0.10 / 0.10 | 0.58 / 0.58 / 0.59 | 69.28 / 69.45 / 69.52 | 22.53 / 22.75 / 22.98 | 2241 / 2246 / 2248 | 46062 / 46172 / 46216 | 181588 / 182028 / 182204 | 6.56 / 6.63 / 6.69 | 0 / 0 / 0 |
| s31-a150|PR-BAL|POL3-CONQ|passive | model-output (realistic) | 0.29 / 0.29 / 0.29 | 0.26 / 0.26 / 0.26 | 0 / 0 / 0 | 0.50 / 0.51 / 0.51 | 69.15 / 69.28 / 69.42 | 19.90 / 20.02 / 20.22 | 2237 / 2241 / 2245 | 45974 / 46062 / 46150 | 181236 / 181588 / 181940 | 6.47 / 6.51 / 6.55 | 0 / 0 / 0 |
| s31-a150|PR-BAL|POL3-CONQ|attentive | model-output (realistic) | 0.36 / 0.36 / 0.36 | 0.36 / 0.36 / 0.36 | 0.10 / 0.11 / 0.11 | 0.61 / 0.62 / 0.62 | 70.02 / 70.15 / 70.28 | 25.17 / 25.31 / 25.58 | 2263 / 2267 / 2271 | 46546 / 46634 / 46722 | 183524 / 183876 / 184228 | 6.38 / 6.42 / 6.46 | 0 / 0 / 0 |
| s31-a200|PR-BAL|POL3-CONQ|passive | model-output (realistic) | 0.34 / 0.35 / 0.35 | 0.32 / 0.32 / 0.32 | 0 / 0 / 0 | 0.55 / 0.55 / 0.55 | 71.05 / 71.22 / 71.28 | 24.55 / 24.68 / 24.90 | 2294 / 2299 / 2301 | 47228 / 47338 / 47382 | 186252 / 186692 / 186868 | 5.73 / 5.75 / 5.78 | 0 / 0 / 0 |
| s31-a200|PR-BAL|POL3-CONQ|attentive | model-output (realistic) | 0.42 / 0.42 / 0.42 | 0.43 / 0.43 / 0.43 | 0.12 / 0.12 / 0.12 | 0.66 / 0.66 / 0.66 | 71.62 / 71.72 / 71.78 | 30.03 / 30.28 / 30.40 | 2311 / 2314 / 2316 | 47602 / 47668 / 47712 | 187748 / 188012 / 188188 | 5.71 / 5.73 / 5.75 | 0 / 0 / 0 |
| s31-c|PR-BAL|POL3-CONQ|passive | model-output (realistic) | 0.25 / 0.26 / 0.26 | 0.23 / 0.23 / 0.23 | 0 / 0 / 0 | 0.47 / 0.48 / 0.48 | 68.05 / 68.22 / 68.42 | 17.31 / 17.42 / 17.63 | 2204 / 2209 / 2215 | 45248 / 45358 / 45490 | 178332 / 178772 / 179300 | 6.77 / 6.84 / 6.91 | 0 / 0 / 0 |
| s31-c|PR-BAL|POL3-CONQ|attentive | model-output (realistic) | 0.35 / 0.36 / 0.36 | 0.37 / 0.37 / 0.37 | 0.13 / 0.14 / 0.14 | 0.62 / 0.63 / 0.63 | 69.48 / 69.65 / 69.78 | 24.54 / 24.85 / 25.08 | 2247 / 2252 / 2256 | 46194 / 46304 / 46392 | 182116 / 182556 / 182908 | 6.53 / 6.59 / 6.63 | 0 / 0 / 0 |

## Reward-invariant monitor (gate B1)

2000 runs, 76410828 checks, **0 violations**.

## Estimate (labelled) against realisation (model-output)

| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |
|---|---|---|---|---|---|---|---|---|
| a10-p1.6-g100|Z3-L10|hero-archer|passive | 3 | 1453.5 | approximate | 1732.0 | -16.1% | not reached | not reached | — |
| a10-p1.6-g100|Z3-L10|hero-archer|attentive | 3 | 1515.7 | approximate | 1887.5 | -19.7% | not reached | not reached | — |
| a10-p1.6-g100|Z3-L10|hero-warrior|passive | 3 | 1367.9 | approximate | 1641.8 | -16.7% | not reached | not reached | — |
| a10-p1.6-g100|Z3-L10|hero-warrior|attentive | 3 | 1396.3 | approximate | 1703.8 | -18.1% | not reached | not reached | — |
| a10-p1.6-g100|Z3-L10|hero-mage|passive | 3 | 1393.7 | approximate | 1605.5 | -13.2% | not reached | not reached | — |
| a10-p1.6-g100|Z3-L10|hero-mage|attentive | 3 | 1466.9 | approximate | 1730.4 | -15.2% | not reached | not reached | — |
| s31-a125|Z3-L10|hero-archer|passive | 3 | 1485.0 | approximate | 1733.5 | -14.3% | not reached | not reached | — |
| s31-a125|Z3-L10|hero-archer|attentive | 3 | 1557.7 | approximate | 1890.7 | -17.6% | not reached | not reached | — |
| s31-a125|Z3-L10|hero-warrior|passive | 3 | 1394.3 | approximate | 1644.7 | -15.2% | not reached | not reached | — |
| s31-a125|Z3-L10|hero-warrior|attentive | 3 | 1427.5 | approximate | 1711.3 | -16.6% | not reached | not reached | — |
| s31-a125|Z3-L10|hero-mage|passive | 3 | 1421.8 | approximate | 1661.6 | -14.4% | not reached | not reached | — |
| s31-a125|Z3-L10|hero-mage|attentive | 3 | 1507.1 | approximate | 1808.2 | -16.7% | not reached | not reached | — |
| s31-a150|Z3-L10|hero-archer|passive | 3 | 1522.0 | approximate | 1787.2 | -14.8% | not reached | not reached | — |
| s31-a150|Z3-L10|hero-archer|attentive | 3 | 1602.2 | approximate | 1895.9 | -15.5% | not reached | not reached | — |
| s31-a150|Z3-L10|hero-warrior|passive | 3 | 1413.9 | approximate | 1657.6 | -14.7% | not reached | not reached | — |
| s31-a150|Z3-L10|hero-warrior|attentive | 3 | 1452.8 | approximate | 1746.4 | -16.8% | not reached | not reached | — |
| s31-a150|Z3-L10|hero-mage|passive | 3 | 1444.0 | approximate | 1683.7 | -14.2% | not reached | not reached | — |
| s31-a150|Z3-L10|hero-mage|attentive | 3 | 1540.7 | approximate | 1806.2 | -14.7% | not reached | not reached | — |
| s31-a200|Z3-L10|hero-archer|passive | 3 | 1585.3 | approximate | 1790.7 | -11.5% | not reached | not reached | — |
| s31-a200|Z3-L10|hero-archer|attentive | 3 | 1679.2 | approximate | 1932.2 | -13.1% | not reached | not reached | — |
| s31-a200|Z3-L10|hero-warrior|passive | 3 | 1451.3 | approximate | 1664.5 | -12.8% | not reached | not reached | — |
| s31-a200|Z3-L10|hero-warrior|attentive | 3 | 1499.8 | approximate | 1755 | -14.5% | not reached | not reached | — |
| s31-a200|Z3-L10|hero-mage|passive | 3 | 1491.0 | approximate | 1743.2 | -14.5% | not reached | not reached | — |
| s31-a200|Z3-L10|hero-mage|attentive | 3 | 1607.3 | approximate | 1878.3 | -14.4% | not reached | not reached | — |
| s31-c|Z3-L10|hero-archer|passive | 3 | 1485.0 | approximate | 1733.5 | -14.3% | not reached | not reached | — |
| s31-c|Z3-L10|hero-archer|attentive | 3 | 1598.3 | approximate | 1909.7 | -16.3% | not reached | not reached | — |
| s31-c|Z3-L10|hero-warrior|passive | 3 | 1394.3 | approximate | 1644.7 | -15.2% | not reached | not reached | — |
| s31-c|Z3-L10|hero-warrior|attentive | 3 | 1451.1 | approximate | 1883.5 | -23.0% | not reached | not reached | — |
| s31-c|Z3-L10|hero-mage|passive | 3 | 1421.8 | approximate | 1661.6 | -14.4% | not reached | not reached | — |
| s31-c|Z3-L10|hero-mage|attentive | 3 | 1545.1 | approximate | 1776.8 | -13.0% | not reached | not reached | — |

## Notes and limitations

- No variant is applied to the historical control; the owner prefers a modest hero advantage with meaningful manual abilities (S3.1 section 11). The diagnostic starts are labelled.

