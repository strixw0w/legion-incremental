# S5 offline credit and settlement timing — v1

**Status: candidate (S5, 2026-11-15).** Implemented by `legion-progression-lab/src/engine/offline.ts` (§1–§3) and
`legion-progression-lab/src/s5/settlement.ts` `timingRefusal` (§4). Independently re-derived by
`spec/oracle/s5_oracle.py` (families `s5-offline-credit` and `s5-settlement-timing`). Written by the same author as
the lab code; it is not an independent party.

All quantities are integers in milliseconds or basis points (bp). Rates use 10⁻⁸ units (`E8`).

## §1 Credited productive duration

An absence starts when a session ends. After `w` wall milliseconds of absence, its credited duration is

```
P(w) = 0                                                     if w <= 0
P(w) = floor( (n · 10⁴ · min(w, F) + r · clamp(w − F, 0, S)) / 10⁸ )   otherwise
```

where:
- `n` is the normal-window rate in bp (candidate 6,000 = 60 %, raised by the Monument of Eternity, at most 10,000);
- `F` and `S` are the window lengths (candidates 24 h and 48 h);
- `r` is the reduced-window rate in 10⁻⁸ units: `r = n · k` for the ratio rule with ratio `k` in bp (default 5,000),
  or `r = f · 10⁴` for the flat rule with rate `f` in bp (registered alternative 2,500);
- `clamp(x, 0, S) = max(0, min(x, S))`.

The floor is of the exact rational value. Beyond `F + S` the credit is zero, so `P` is constant from there. `P` is
non-decreasing and `P(w) <= w` whenever `n <= 10,000` and `r <= 10⁸`.

A wall offset that is not a safe integer is refused (`INVALID_STATE`).

**Mechanism (S5-R01):**
- The engine's game time advances by `P(w)` during an unlocked absence, so every system progresses at the offline rate.
- The rate is applied exactly once: rewards are never multiplied.
- `n` and `r` are captured when the absence begins.

## §2 Efficiency windows

The windows an absence of `w` wall milliseconds crossed, in order (each only if non-empty):

| Window | From | To | Rate (E8) |
|---|---|---|---|
| `normal` | 0 | `min(w, F)` | `n · 10⁴` (when `w > 0`) |
| `reduced` | `F` | `min(w, F + S)` | `r` (when `w > F`) |
| `beyond-cap` | `F + S` | `w` | 0 (when `w > F + S`) |

## §3 Storage batches

An absence may be settled in batches at wall offsets `0 = w₀ < w₁ < … < w_k = W`. Batch `j` credits
`P(w_j) − P(w_{j−1})`. The batch credits sum to `P(W)` whatever the partition, so a batch never restarts a window.

## §4 Settlement timing refusals

The state seen:
- whether a session is open;
- the current absence index `A` (or none);
- the wall cursor `c`;
- the open session's planned wall end `E`.

`now` is the trusted clock. The first applicable code is returned, or none.

**`play` (to):**
1. no open session: `NOT_CONNECTED`;
2. `to > now`: `FUTURE_TIME`;
3. `to < c`: `BACKWARDS_TIME`;
4. `to > E`: `BEYOND_SESSION`.

**`settle` (absence, from, to) and `reconnect` (absence, from, at, end):**
1. **No current absence:** `ABSENCE_CLOSED` if a session is open, `NO_ABSENCE` otherwise.
2. **The request names another absence:**
   - `ABSENCE_CLOSED` if it names `absence:<i>` with `i < A`;
   - `ABSENCE_UNKNOWN` otherwise.
3. `from < c`: `OVERLAP` (the request overlaps an interval already settled; a partial overlap is the same case).
4. `from > c`: `GAP`.
5. `to` (or `at`) `< from`: `BACKWARDS_TIME`.
6. `to` (or `at`) `> now`: `FUTURE_TIME`.
7. `reconnect` only, `end <= at`: `EMPTY_SESSION`.

A request of an unknown type is refused (`INVALID_STATE`).

**Before these rules:**
- branch;
- trusted clock (`CLOCK_BACKWARDS`);
- the L2.1 request window (replay, conflict, closed, ahead).

**After a reconnect,** the cursor is the reconnect moment and no absence is current, so the closed absence (including
any time beyond its cap) can never be settled again.
