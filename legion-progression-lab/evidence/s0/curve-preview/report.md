# S0-R01 — Candidate EXP curve inspection report

**Label:** inputs are `candidate`; this is an inspection aid, **not** a balance result and not a validated pacing claim.

- Content: `s0-core` v0.1.0 (content hash `39ab7e5978c4a62bb2921ecb9ad0b5432a48a2c6c97768e2c58b07902a3b356a`)
- XP table artifact hash: `990fe508ef0f83f196a4052a56354c989fc9e93f36070754ed222295a69fb0dc`
- Curve: T(L) = roundHalfUp(a · L^p · g^(L−1)) with a = 10, p = 1.6, g = 1
- Semantic fingerprint: `24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9`

## Limits (single-level threshold vs cumulative)

| Quantity | Value |
|---|---|
| Table length (thresholds stored) | 200 |
| Highest level reachable with this table | 201 |
| Last level whose cumulative EXP is a safe integer (within table) | 201 |
| Cumulative EXP safe for the whole table | yes |
| First level whose single threshold would exceed 2^53−1 (approximate) | 2221358257 — double curve, exponential + binary search (approximate, report-only) |
| First level whose cumulative EXP would exceed 2^53−1 (approximate) | 815401 — g = 1: integral approximation a*(L-1)^(p+1)/(p+1) (approximate, report-only) |

## Thresholds, levels 1–60

| Level L | T(L): EXP from L to L+1 | Cumulative EXP to reach L |
|---|---|---|
| 1 | 10 | 0 |
| 2 | 30 | 10 |
| 3 | 58 | 40 |
| 4 | 92 | 98 |
| 5 | 131 | 190 |
| 6 | 176 | 321 |
| 7 | 225 | 497 |
| 8 | 279 | 722 |
| 9 | 336 | 1001 |
| 10 | 398 | 1337 |
| 11 | 464 | 1735 |
| 12 | 533 | 2199 |
| 13 | 606 | 2732 |
| 14 | 682 | 3338 |
| 15 | 762 | 4020 |
| 16 | 844 | 4782 |
| 17 | 931 | 5626 |
| 18 | 1020 | 6557 |
| 19 | 1112 | 7577 |
| 20 | 1207 | 8689 |
| 21 | 1305 | 9896 |
| 22 | 1406 | 11201 |
| 23 | 1509 | 12607 |
| 24 | 1616 | 14116 |
| 25 | 1725 | 15732 |
| 26 | 1836 | 17457 |
| 27 | 1951 | 19293 |
| 28 | 2068 | 21244 |
| 29 | 2187 | 23312 |
| 30 | 2309 | 25499 |
| 31 | 2433 | 27808 |
| 32 | 2560 | 30241 |
| 33 | 2689 | 32801 |
| 34 | 2821 | 35490 |
| 35 | 2955 | 38311 |
| 36 | 3091 | 41266 |
| 37 | 3229 | 44357 |
| 38 | 3370 | 47586 |
| 39 | 3513 | 50956 |
| 40 | 3658 | 54469 |
| 41 | 3806 | 58127 |
| 42 | 3955 | 61933 |
| 43 | 4107 | 65888 |
| 44 | 4261 | 69995 |
| 45 | 4417 | 74256 |
| 46 | 4575 | 78673 |
| 47 | 4735 | 83248 |
| 48 | 4898 | 87983 |
| 49 | 5062 | 92881 |
| 50 | 5228 | 97943 |
| 51 | 5397 | 103171 |
| 52 | 5567 | 108568 |
| 53 | 5739 | 114135 |
| 54 | 5913 | 119874 |
| 55 | 6089 | 125787 |
| 56 | 6268 | 131876 |
| 57 | 6448 | 138144 |
| 58 | 6630 | 144592 |
| 59 | 6813 | 151222 |
| 60 | 6999 | 158035 |

## Sweep preview for S1-E01 (candidate variants, g = 1; not content)

| a | p | T(1..5) | Cum. to L2 | Cum. to L5 | Cum. to L10 | Cum. to L25 |
|---|---|---|---|---|---|---|
| 8 | 1.6 | 8, 24, 46, 74, 105 | 8 | 152 | 1070 | 12583 |
| 8 | 1.8 | 8, 28, 58, 97, 145 | 8 | 191 | 1559 | 22154 |
| 8 | 2 | 8, 32, 72, 128, 200 | 8 | 240 | 2280 | 39200 |
| 10 | 1.6 | 10, 30, 58, 92, 131 | 10 | 190 | 1337 | 15732 |
| 10 | 1.8 | 10, 35, 72, 121, 181 | 10 | 238 | 1947 | 27692 |
| 10 | 2 | 10, 40, 90, 160, 250 | 10 | 300 | 2850 | 49000 |
| 12 | 1.6 | 12, 36, 70, 110, 158 | 12 | 228 | 1605 | 18877 |
| 12 | 1.8 | 12, 42, 87, 146, 217 | 12 | 287 | 2337 | 33231 |
| 12 | 2 | 12, 48, 108, 192, 300 | 12 | 360 | 3420 | 58800 |

Every table value here is cross-checked by `spec/oracle/xp_oracle.py` (decimal, 60 and 120 digits, rounding-stability check) in `npm run oracle:check`.
