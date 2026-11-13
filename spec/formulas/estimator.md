# Rate estimator (displayed farming rates)

## v1.2

S1.1 acceptance addendum (2026-11-13), after the independent S1.1 review §2.

**Change from v1.1.** Impossibility is decided first, from the completed fight distribution (§4, "Impossible victory"). In v1.1, a fight that could never be won still showed a small positive rate when the survival chain exceeded its budget, because the approximate fallback was used. Ordinary estimates are unchanged.

## v1.1

S1.1 (2026-11-13), after the independent S1 review §5. The S1 estimator (v1) was described only in the source code and in `S1_EVIDENCE.md`; this is its first written specification.

**What it is.** The estimator predicts steady farming rates for one zone at one hero level, as a Command Centre would display them (R07.16). It is the third, separate component of architecture v1.1 §4.
- It never produces "actual" results. Reports show the estimate and the simulation side by side.
- Every input and threshold is a candidate.

**Implementation:**
- `legion-progression-lab/src/engine/estimator.ts`.
- The v1 estimator is kept unchanged in `estimator-s1.ts`, as a labelled diagnostic control for S1.1 comparisons only.

**Checks:**
- `spec/fixtures/estimator.v1.json`, re-derived by `spec/oracle/s1_oracle.py`;
- `test/s1_1.behaviour.test.ts`.

### 1. Inputs
From content, for hero level L and the zone's enemy:
- hero damage per hit (normal and crit) and enemy damage per hit, as in `s1-combat-loop.md` §6–7;
- hit chance `p_h` (from the hit threshold, `T / 2^32`) and crit chance `p_c`;
- attack interval `I`, engage overhead `O`, zone entry walk `W`, respawn delay `D`;
- enemy first-attack delay `F`, enemy attack interval `E`;
- hero max HP, spawn slots `S`, respawn time `Rs`;
- auto-farm stop threshold and death window;
- out-of-combat delay.

### 2. Swings to kill
- **Method:** the distribution of the number of swings n needed to kill is computed exactly, by dynamic programming over the enemy's remaining HP.
- **Draws per swing:** each swing misses with probability `1 − p_h`, hits normally with `p_h(1 − p_c)` and crits with `p_h p_c`.
- **Budget** (candidate values, `ESTIMATOR_BUDGET`):
  - at most 100,000 swings;
  - at most 5,000,000 state updates (remaining-HP states × swings);
  - stop when the surviving mass is below 1e-12.
- **Unresolved mass is never a kill.** The result is **unreachable** with kills/h = 0, and TTK, deaths/h and expected swings are `null`:
  - if `p_h = 0`, reason `NO_HIT_CHANCE`;
  - if more than 1e-9 of the probability mass is still unresolved when a budget runs out, reason `SWING_BUDGET` or `WORK_BUDGET`.

  `null` is the representation of "no finite value"; canonical JSON has no infinity.

### 3. One fight
- **Time to kill** in n swings: `ttk(n) = max(0, I − O) + (n − 1) I`. The killing swing of the previous fight starts the cooldown.
- **Enemy hits** landed by then: `h(n) = floor((ttk(n) − F) / E) + 1` if `ttk(n) ≥ F`, else 0.
- **Simultaneous hit.** The last of those hits lands **at the kill moment** if `(ttk(n) − F)` is a multiple of `E`. Both blows land (`s1-combat-loop.md` §4).
- **Expected values:** `E[n]` and `E[ttk]`.
  - Attack bound: `3,600,000 / (O + E[ttk])` kills/h.
  - Spawn bound: `3,600,000 · S / (Rs + O + E[ttk])` kills/h.

### 4. Survival: exact chain
- **States.** Let `R = ceil(maxHp / enemyDamage)`, the number of hits that kill the hero from full HP. HP carries over between fights. There is no regeneration while farming, because `O` is shorter than the out-of-combat delay (S1-R11).
- **From r hits left**, a fight needing n swings (probability `p_n`) either:
  - is **won** if `h(n) < r`: the hero continues from `r − h(n)`, and the fight took `ttk(n)`;
  - is **lost** otherwise: the hero dies at its r-th hit, at `F + (r − 1)E`. The kill still counts only if `h(n) = r` and that hit is simultaneous with the kill; then the fight took `ttk(n)`.
- **Recursion.** `K(r)` (expected kills until death) and `T(r)` (expected time until death, including one overhead `O` per fight) follow from that, for r = 1..R. Fights with `h(n) = 0` leave r unchanged and are solved in closed form.
- **Per life:**
  - kills per life `= K(R)`;
  - time per life `= D + (W − O) + T(R)` (the first fight after a respawn walks `W` instead of `O`).
- **Rates:**
  - kills/h = `min(3,600,000 · K(R) / time per life, spawn bound)`;
  - deaths/h = kills/h ÷ `K(R)`.
- **Win chance.** `winChanceFromFullHp` is the probability that the first fight from full HP ends in a credited kill.
- **Harmless enemy.** If no fight outcome includes an enemy hit, the enemy cannot hurt the hero: kills per life is `null` (unlimited) and deaths/h is 0.
- **Impossible victory** *(v1.2)*. Before any survival calculation: if **no** resolved fight outcome wins from full HP, the result is exact and computed directly, whatever the budget. "Wins" means `h(n) < R`, or `h(n) = R` with the hit simultaneous with the kill. Then:
  - victory is impossible from any lower HP too, so kills per life = 0;
  - the win chance is 0 and kills/h = 0;
  - each life is one lost fight, so time per life = `D + (W − O) + O + F + (R − 1)E`;
  - reliability is **unreachable**, reason `DIES_BEFORE_KILL`.

  This is decided structurally (some outcome wins or none does), never from a sum of small probabilities.
- **Budget.** Otherwise the chain is limited to 5,000,000 (R × outcomes). Beyond that, the v1 renewal approximation is used, flagged with reason `SURVIVAL_BUDGET`. That reason now means only "a win is possible, but the exact chain was too expensive"; it never stands for an impossible fight.

### 5. Reliability (shown with every estimate)
| Reliability | When | Reasons |
|---|---|---|
| unreachable | no kill is possible: §2, or `K(R) = 0` | `NO_HIT_CHANCE`, `SWING_BUDGET`, `WORK_BUDGET`, `DIES_BEFORE_KILL` |
| unsafe | `K(R) < 1`, or expected deaths per death window ≥ the stop threshold | `UNDER_ONE_KILL_PER_LIFE`, `AUTO_FARM_STOP_EXPECTED` |
| approximate | otherwise, if any reason applies: death downtime ≥ 10% of the time; the spawn bound binds while the hero can be hurt; regeneration between fights is possible (out-of-combat delay ≤ `O`); the survival budget ran out | `SURVIVAL_LIMITED`, `SPAWN_WAITS_NOT_MODELLED`, `REGEN_NOT_MODELLED`, `SURVIVAL_BUDGET` |
| reliable | otherwise | (none) |

**Limiting factor:**
- `survival` when unreachable, unsafe, or death downtime ≥ 10%;
- otherwise `spawn` if the spawn bound binds;
- otherwise `attack`.

**Not modelled:**
- the auto-farm stop rule itself (D-03): the estimate assumes continuous farming;
- resting;
- the exact swing cooldown after a respawn.

These are reported limitations, not hidden adjustments.
