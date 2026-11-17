# S6 calibration pass (method step 3): working notes

**Status: done (2026-11-16).** Gate kills × 12 from zone 4 were chosen. They are written as candidate 0.6.1
(`content/s6/*.v0.6.1.json`; `CHOSEN_CALIBRATION` in `src/s6/w1Content.ts`). The initial candidate 0.6.0 is kept
unchanged. No target changed.

## Target (fixed before any result; not changed)
H-S6-01: the PR-BAL median within 4–8 active hours to the final Normal clear. The calibration aims at the middle of the
band (about 6 active hours).

## Initial candidate (exploratory x02, after fixes F1–F15)
- PR-BAL: world cleared at 1.11 active hours.
- PR-OPT: 1.33.
- PR-CAS: 0.82.
- PR-POOR: 1.24.

**Why it is fast:** the hero moves to a new zone only in a session (offline play grants no visitation). Each night the
offline farming in the frontier zone gives about 20 times the active farming, so it opens that zone's kill gate and adds
many levels. Bosses are beaten at the first attempt, and zone progress is paced by the kills needed during sessions.

## Lever
`W1Calibration.gateKills` (`src/s6/w1Content.ts`) multiplies each kill gate from zone 4 on, and every boss unlock.
- Zones 1–3 keep the slice pacing (§3.1).
- Enemy EXP and boss HP are unchanged (`enemyExp` 1, `bossHp` 1).

## Runs

| Run | Gate kills × | From zone | PR-BAL world clear, active hours (3 seeds) | Longest stall (active min) |
|---|---|---|---|---|
| c01 | 1 | 1 | 1.10, 1.10, 1.11 | 22–28 |
| c01 | 4 | 1 | 2.84, 2.84, 2.84 | 24–32 |
| c01 | 8 | 1 | 4.61, 4.61, 4.61 | 23–33 |
| c01 | 16 | 1 | 9.00, 9.00, 9.00 | 22–42 |
| c02 | 8 | 4 | 3.49, 3.50, 3.61 | 21–37 |
| c02 | 12 | 4 | 6.57, 6.63, 6.89 | 21–32 |
| c02 | 16 | 4 | 6.77, 6.83, 7.00 | 19–27 |

c01 scaled zones 1–3 as well. That was rejected: it would hold a new player in the first zones for a whole session.

**Observation:** the clear time moves in session-sized steps. Each night completes the frontier gate, so a boss often
falls at the start of a session. That is why ×12 and ×16 both clear in the seventh session.

## Decision
- **Chosen:** gate kills × 12 from zone 4, with every boss unlock × 12. EXP and boss HP as built.
- **The rule (above):** the tested value nearest the middle of the band (about 6 active hours).
  - ×12: median 6.63 (6.57–6.89).
  - ×16: median 6.83.
  - ×8: 3.50, below the band.
  - ×10 was not tested. The pass stopped at the tested values.

**Checks:**
- **The candidate differs from the initial one only in the scaled gates.** The test "the calibration pass" in
  `test/s6.w1.test.ts` shows:
  - the 0.6.0 files are exactly the initial build;
  - 0.6.1 differs from it only in the kill gates from zone 4, the boss unlocks and the version.
- **Reproduction** (`reproduction-check.txt`, from `evidence/s6/tools/calibration_xcheck.ts`): c02's ×12 task for seed 0
  was rerun from the written 0.6.1 files. The world clear (6.892 active hours) and the whole run row are identical.

**Seen in the calibration runs, not tuned** (one pass, one lever; reported with the registered results):
- **Bosses do not gate:** the levels gained offline overpower them, and they fall at the first attempt.
- **The hero's damage share** is about 0.17–0.20, below the S2 band [0.30, 0.60].
