# S5 registered experiments: results

**Registration:** `manifests/s5/PREREGISTRATION.md`, registered 2026-11-15T20:13:30Z, before any registered run.

**The runs:** each ran once from its unchanged manifest, one at a time, with enforced budgets
(`evidence/s5/runs/chain.txt`).

**The data:**
- the rows are in `<experiment>/rows.jsonl`;
- the run records, with status, budgets, memory and fingerprints, are in `<experiment>/run.json`;
- the aggregates are in `SUMMARY.json`, computed by `repro/s5/analyze.py`.

**Percentiles** are nearest-rank, over seeds (p10 / p50 / p90).

## Status and budgets

| Experiment | Status | Tasks | Wall time (budget) | Peak memory (budget) | Gate |
|---|---|---|---|---|---|
| S5-E01 boundaries | COMPLETE | 42 / 42 | 12 s (10 min) | 3.2 GB (4 GB) | G-S5-01 **PASS** |
| S5-E02 reference vs batch | COMPLETE | 200 / 200 | 44 s (20 min) | 3.1 GB (8 GB) | G-S5-02 **PASS** |
| S5-E03 mid-absence progression | COMPLETE | 200 / 200 | 3.5 min (30 min) | 4.2 GB (8 GB) | G-S5-04 **PASS** |
| S5-E04 production shortage | COMPLETE | 200 / 200 | 13 s (20 min) | 3.7 GB (8 GB) | G-S5-05 **PASS** |
| S5-E05 reconnection and idempotency | COMPLETE | 200 / 200 | 3.4 min (30 min) | 3.9 GB (8 GB) | G-S5-06 **PASS** |
| S5-E06 efficiency alternatives | COMPLETE | 4,800 / 4,800 | 49.8 min (90 min) | 4.1 GB (12 GB) | comparison |
| S5-E07 profile equity | COMPLETE | 800 / 800 | 13.4 min (45 min) | 4.0 GB (12 GB) | hypotheses |
| S5-E08 connected-idle incentive | COMPLETE | 200 / 200 | 2.3 min (20 min) | 3.2 GB (8 GB) | measurement |

**Peak memory** is the whole process with 15 worker threads. No run was stopped.

## Engineering gates

**G-S5-01 (E01): 42 / 42.** Every case gave its exact credited time:
- 0, 1 ms, 2 ms;
- 24 h − 1 ms, 24 h, 24 h + 1 ms;
- 72 h − 1 ms, 72 h, 72 h + 1 ms, 72 h + 1 day, 30 days.

For each case, all of these held:
- the credited time equals P(w), recomputed from the rule text;
- the session opened at the logout game time + P(w);
- the windows and cap flags were right;
- the cursor passed the whole absence;
- a re-claim was refused.

**The anomalies** were each refused by name with no change: a negative absence (`BACKWARDS_TIME`), a trusted clock
running backwards (`CLOCK_BACKWARDS`), and a future reconnect (`FUTURE_TIME`).

**G-S5-02 / H-S5-01 (E02): 200 / 200.** The efficient settlement through the service gave the same state as the
reference stepper (canonical JSON at the reconnect) and an equal log count. The scenarios covered:
- absences with p50 60 min (p10 11, p90 113);
- 1–8 storage batches, each a validated save and restore;
- one of four offline plans.

**A reference checkpoint restored into the efficient engine** and finished was also equal, in 200 / 200.

**The reference stepper took 1.42 times as long** as the efficient settlement (p50; p10 1.20, p90 1.64), including
the efficient path's restores.

No sampled batching exists, so the agreement is exact and no statistical criterion is used.

**G-S5-03 / H-S5-02 (partition invariance).** Every storage split gave exactly the same state:
- E02's batches;
- E03's cuts at level-up moments;
- E04's ten batches;
- E05's noisy against clean accounts.

The frequent-login effect is the declared window reset (S5-R12); E07 measures it.

**G-S5-04 (E03): 200 / 200.** In each seed:
- a 24-hour absence equalled connected automated play for its credited 14.4 hours from the same logout state;
- it equalled its own settlement cut exactly at the first 10 hero level-up moments;
- every seed exercised rate changes (per absence, p50: 92 hero level-ups, 289 member level-ups, 11 permanent bonus
  recomputes, 69 emblem finds).

**One limitation:** this setup's absences contained no profession level-ups (the recruits fight). Profession
progression offline is exercised in E04 and in the examples.

**G-S5-05 (E04): 200 / 200.** Production paused when logs ran out and resumed on gathering deposits: p50 637 pauses
per 12-hour absence (p10 468, p90 789), and p50 777 planks made from 4–15 starting logs. Also:
- log conservation was exact;
- no balance went negative;
- the run was equal in ten batches.

**G-S5-06 (E05): 200 / 200.** Every noisy account ended exactly as its clean twin (state and cursor). 106 scripts
included an absence beyond the cap.

The noise was answered as registered:

| Answer | Count |
|---|---|
| Replayed (live retries) | 308 |
| `CONFLICTING_PAYLOAD` | 241 |
| `REQUEST_CLOSED` (retries after the 24-hour receipt window) | 21 |
| `OVERLAP` | 225 |
| `GAP` | 214 |
| `FUTURE_TIME` | 309 |
| `ABSENCE_CLOSED` | 167 |
| `WRONG_BRANCH` | 301 |
| `STALE_CHECKPOINT` | 316 |

The injected failures behaved as modelled:

| Failure | Count | What followed |
|---|---|---|
| Before the commit | 104 | nothing changed; the retry committed |
| After the commit | 96 | the retry replayed (96 genuine replays) |
| Failed calculation | 109 | nothing changed; the retry committed |

## Balance results (candidates; reported, never forced)

### E07 profile equity (POL5-BAL; default rules: 60 %, ratio 0.5, 72-hour cap; 200 seeds per profile)

| Profile, D3 (p50) | Connected h | Away h | Credited h | Equivalent productive h | Offline share: EXP / gold / kills | Hero level |
|---|---|---|---|---|---|---|
| PR-FREQ (6 × 10 min) | 3.0 | 69 | 41.4 | 44.4 | 93.5 % / 93.5 % / 93.4 % | 166 |
| PR-CAS (2 × 15 min) | 1.5 | 70.5 | 42.3 | 43.8 | 96.9 % / 97.0 % / 96.9 % | 166 |
| PR-BAL (1 × 60 min) | 3.0 | 69 | 41.4 | 44.4 | 93.8 % / 93.7 % / 93.6 % | 168 |
| PR-ABS (1 h, 3 days away) | 1.0 | 71 | 28.5 | 29.5 | 97.5 % / 97.4 % / 97.2 % | 143 |

**H-S5-03 (PR-CAS offline share 30–60 %): not met.** The share is about 97 % for combat EXP, gold earned and kills,
and 99 % for units gathered. Production units are 1.6 %; their throughput is limited by the online queue. The owner
anticipated this:
- a 30-minute-per-day player away 23.5 hours receives 14.1 credited hours a day (measured: 14.1 h at D1);
- against that, they spend 0.5 hours connected;
- so pure resource and EXP output is dominated by the credited time.

**The efficiency was not lowered.** The candidate band appears unrealistic for these outputs under the approved 60 %
default. This is a design question for the owner (§16), not an engineering failure.

**The frequent-login effect (S5-R12).** Every profile whose absences stay under 24 hours is credited the same 60 %
of its away time (41.4–42.3 h by D3). PR-ABS (3-day absences) is credited 28.5 h over the same calendar: about 33 %
less, from the reduced window and the cap. Shorter, frequent absences are therefore favoured over long ones, as
declared. Within the sub-24-hour profiles, frequency itself gives no extra credit.

**H-S5-04 (active progress per hour > offline per hour): mostly, not always.** The comparison is EXP per connected
hour against EXP per offline wall hour:

| Profile | Seeds where it held, D1 | Seeds where it held, D3 |
|---|---|---|
| PR-FREQ | 197 / 200 | 197 / 200 |
| PR-BAL | 200 / 200 | 200 / 200 |
| PR-ABS | 198 / 200 | 200 / 200 |
| PR-CAS | 118 / 200 | 200 / 200 |

**The exceptions** are early days. Connected minutes happen at low levels, while later offline hours run at higher
levels, which earn more EXP per hour. The per-hour comparison is confounded by when in the account's life each hour
falls; E08 removes that confounding.

**Conquest and exploration:**
- **Zones:** every profile has visited all 3 slice zones by D3 (p10 = p90 = 3).
- **The boss:** no realistic profile completes it.
- **Account power on return (D3, p50):** hero attack 291.5–294.8 for the sub-24-hour profiles and 253.6 for PR-ABS.
  Monuments of Power, Vitality and Industry are at level 4; Eternity is at 0 (POL5-BAL rarely buys it under its
  candidate weight).

**The value of subsequent spending:** gold earned by D3 (421–636 thousand) far exceeds the cost of every Monument's
levels. Spending is limited by the policy's Monument choices, not by gold; this echoes S4's soft-cap finding.

**The content horizon:** every replicate of every profile left the slice content before D7 (`XP_TABLE_EXHAUSTED`, the
EXP table ends at level 201). D7 is reported as not observable, never extrapolated.

### E08 connected-idle incentive (200 seeds; per wall hour after a 2-hour POL5-BAL session)

| Mode | Combat EXP per h | Gold per h | Kills per h |
|---|---|---|---|
| Active (POL5-BAL-ATT: decisions and the hero's manual ability) | 211,200 | 14,400 | 2,400 |
| Connected idle (no decisions) | 211,200 | 14,400 | 2,400 |
| Offline (default rules) | 126,720 | 8,640 | 1,440 |

**Active equals connected idle exactly in every seed** (ratio 1.000). Farming in the slice is limited by respawns
(2,400 kills per hour in the best zone), not by damage, so neither the manual ability nor further decisions add output
in a farming window.

**Connected idle ÷ offline is 1.667 = 1 ÷ 0.6.** This is the unintended incentive the owner asked to identify: keeping
Roblox running idle gives 67 % more progress per hour than logging off, and nothing more is gained by playing actively
while farming.

**Active-only value** in this slice lies in decisions that change state (zone pushes, purchases, crafting), not in
farming throughput. The owner's §16 ("active progression per hour should remain rewarding") is therefore not met by
farming alone in the current content.

### E06 efficiency alternatives

200 seeds per cell, POL5-BAL, observed at D3. Each cell shows the credited hours, the hero level and the gold earned (all p50). The normal rate is set directly, as a stand-in for Monument of Eternity levels 0, 8 and 25.

| Profile | Normal rate | Flat 25 % | Ratio 0.3 | Ratio 0.5 (default) | Ratio 0.7 |
|---|---|---|---|---|---|
| PR-CAS | 60 % | 42.30 h · L166 · 623,104 | 42.30 h · L166 · 623,104 | 42.30 h · L166 · 623,104 | 42.30 h · L166 · 623,104 |
| PR-CAS | 80 % | 56.40 h · L185 · 826,144 | 56.40 h · L185 · 826,144 | 56.40 h · L185 · 826,144 | 56.40 h · L185 · 826,144 |
| PR-CAS | 100 % | 70.50 h · L199 · 990,232 | 70.50 h · L199 · 990,232 | 70.50 h · L199 · 990,232 | 70.50 h · L199 · 990,232 |
| PR-ABS | 60 % | 26.15 h · L138 · 387,709 | 22.86 h · L132 · 340,333 | 28.50 h · L143 · 421,549 | 34.14 h · L153 · 502,765 |
| PR-ABS | 80 % | 30.95 h · L148 · 456,829 | 30.48 h · L147 · 450,061 | 38.00 h · L159 · 558,349 | 45.52 h · L171 · 666,637 |
| PR-ABS | 100 % | 35.75 h · L156 · 525,949 | 38.10 h · L160 · 559,789 | 47.50 h · L173 · 695,149 | 56.90 h · L186 · 830,509 |

**PR-CAS: the second-window arm makes no difference.** Its absences (about 11.75 hours) never leave the first 24 hours, so every arm gives identical rows, and only the normal rate matters:
- credited time: 42.3 → 56.4 → 70.5 h by D3;
- hero level: 166 → 185 → 199, which is close to the content's level 201.

**PR-ABS: the arm decides the 3-day absences.** At 60 %, the credited time by D3 is:
- ratio 0.3: 22.9 h;
- flat 25 %: 26.2 h;
- ratio 0.5: 28.5 h;
- ratio 0.7: 34.1 h.

**The flat rule is not proportional.** At 100 % it gives 35.8 h, against 47.5 h for the default ratio 0.5, because its reduced window stays at 25 %. This is why the owner's Monument rule asks for the ratio-linked window ("the reduced window remains proportional").

**The offline share stays at 97–99 % in every cell.** No arm brings PR-CAS into the 30–60 % band: its outcome does not depend on the second window at all.

