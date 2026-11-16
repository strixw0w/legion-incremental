"""Writes the S5 fixture drafts (inputs and derivations only); spec/oracle/s5_oracle.py --fill computes the expected
values from the rule text, and the lab's conformance test checks the code against them.
  python -I repro/s5/make_fixtures.py <draft-dir>
"""
import json
import random
import sys

H = 3_600_000
M = 60_000
out_dir = sys.argv[1]
ratio = lambda k: {"kind": "ratio", "ratioBp": k}
flat = lambda b: {"kind": "flat", "bp": b}

credit = []
def c(cid, kind, desc, inp, der):
    credit.append({"id": cid, "kind": kind, "description": desc, "input": inp, "derivation": der})

c("s5.cr.zero", "boundary", "zero absence credits nothing", {"w": 0, "normalBp": 6000}, "P(0) = 0 by the first case of the rule (w <= 0).")
c("s5.cr.negative", "boundary", "a negative clock anomaly credits nothing", {"w": -5000, "normalBp": 6000}, "w <= 0 gives 0; the absence clock never runs backwards into credit.")
c("s5.cr.one-ms", "boundary", "one millisecond floors to zero at 60 %", {"w": 1, "normalBp": 6000}, "floor(6000 * 10^4 * 1 / 10^8) = floor(0.6) = 0.")
c("s5.cr.two-ms", "boundary", "two milliseconds credit one", {"w": 2, "normalBp": 6000}, "floor(6000 * 10^4 * 2 / 10^8) = floor(1.2) = 1.")
c("s5.cr.24h", "boundary", "exactly 24 hours: the whole normal window", {"w": 24 * H, "normalBp": 6000}, "0.6 * 86,400,000 = 51,840,000 exactly; the reduced window has not begun.")
c("s5.cr.24h-plus-1", "boundary", "24 hours plus one millisecond: the reduced window adds 0.3 ms, floored", {"w": 24 * H + 1, "normalBp": 6000}, "51,840,000 + floor(0.3) = 51,840,000; the windows now list the reduced window (one ms).")
c("s5.cr.24h-plus-10", "boundary", "24 hours plus ten milliseconds", {"w": 24 * H + 10, "normalBp": 6000}, "51,840,000 + floor(10 * 0.3) = 51,840,003.")
c("s5.cr.72h", "boundary", "exactly 72 hours: both windows full", {"w": 72 * H, "normalBp": 6000}, "0.6 * 24 h + 0.3 * 48 h = 14.4 h + 14.4 h = 28.8 h = 103,680,000.")
c("s5.cr.72h-plus-1", "boundary", "one millisecond beyond the cap credits nothing more", {"w": 72 * H + 1, "normalBp": 6000}, "clamp(w - F, 0, S) = S, so P is constant from F + S; a beyond-cap window of one ms is listed.")
c("s5.cr.30d", "boundary", "a 30-day absence is capped", {"w": 30 * 24 * H, "normalBp": 6000}, "Same as 72 h: 103,680,000; the beyond-cap window runs from 72 h to 720 h.")
c("s5.cr.flat25", "normal", "registered alternative: flat 25 % second window", {"w": 72 * H, "normalBp": 6000, "second": flat(2500)}, "0.6 * 24 h + 0.25 * 48 h = 14.4 h + 12 h = 26.4 h = 95,040,000.")
c("s5.cr.ratio03", "normal", "registered alternative: ratio 0.3", {"w": 72 * H, "normalBp": 6000, "second": ratio(3000)}, "0.6 * 24 h + 0.18 * 48 h = 14.4 h + 8.64 h = 23.04 h.")
c("s5.cr.ratio07", "normal", "registered alternative: ratio 0.7", {"w": 72 * H, "normalBp": 6000, "second": ratio(7000)}, "0.6 * 24 h + 0.42 * 48 h = 14.4 h + 20.16 h = 34.56 h.")
c("s5.cr.n80", "normal", "Monument of Eternity at 80 %: the reduced window stays proportional", {"w": 72 * H, "normalBp": 8000}, "0.8 * 24 h + 0.4 * 48 h = 19.2 h + 19.2 h = 38.4 h.")
c("s5.cr.n100", "normal", "Monument of Eternity at 100 %", {"w": 72 * H, "normalBp": 10000}, "24 h + 0.5 * 48 h = 48 h = 172,800,000.")
c("s5.cr.n0", "boundary", "a zero normal rate credits nothing", {"w": 50 * H, "normalBp": 0}, "n = 0 and r = 0 * k = 0.")
c("s5.cr.custom-windows", "normal", "custom window lengths (1 h and 2 h)", {"w": 4 * H, "normalBp": 6000, "firstMs": H, "secondMs": 2 * H}, "0.6 * 1 h + 0.3 * 2 h = 1.2 h; one hour beyond the cap.")
c("s5.cr.fraction", "normal", "an odd millisecond count floors the exact rational once", {"w": 25 * H + 7, "normalBp": 6100, "second": ratio(4300)}, "0.61 * 24 h + 0.2623 * (1 h + 7 ms) floored once from the exact rational sum.")
c("s5.cr.not-integer", "failure", "a wall offset that is not an integer is refused", {"w": 1.5, "normalBp": 6000}, "Spec §1: a wall offset that is not a safe integer is refused (INVALID_STATE).")
c("s5.cr.batches-even", "normal", "storage batches never restart a window: 30 h in six batches", {"w": 30 * H, "normalBp": 6000, "batches": [5 * H, 10 * H, 15 * H, 20 * H, 25 * H, 30 * H]}, "Each batch credits P(w_j) - P(w_{j-1}); the sum telescopes to P(30 h) = 14.4 h + 1.8 h.")
c("s5.cr.batches-across-cap", "normal", "batches across both window edges and the cap", {"w": 100 * H, "normalBp": 6000, "batches": [1, 24 * H, 24 * H + 1, 50 * H, 72 * H, 72 * H + 1, 100 * H]}, "The sum telescopes to P(100 h) = P(72 h); batches past the cap credit zero.")
rng = random.Random(20261115)
for i in range(16):
    w = rng.randint(0, 40 * 24 * H)
    n = rng.randint(0, 10000)
    sec = ratio(rng.randint(0, 10000)) if i % 3 else flat(rng.randint(0, 10000))
    k = rng.randint(1, 6)
    batches = sorted({rng.randint(1, w) for _ in range(k)} | {w}) if w > 0 else None
    inp = {"w": w, "normalBp": n, "second": sec}
    if batches:
        inp["batches"] = batches
    c(f"s5.cr.random.{i:02d}", "normal", "seeded random wall offset, rates and batches", inp, "Exact rational floor of the rule; batch credits telescope to P(w).")

timing = []
def t(cid, kind, desc, state, req, now, der):
    timing.append({"id": cid, "kind": kind, "description": desc, "input": {"state": state, "request": req, "nowMs": now}, "derivation": der})

ses = {"sessionOpen": True, "absence": None, "cursorWallMs": 10 * M, "sessionWallEndMs": 40 * M}
away = {"sessionOpen": False, "absence": 3, "cursorWallMs": 100 * M, "sessionWallEndMs": None}
pre = {"sessionOpen": False, "absence": None, "cursorWallMs": 0, "sessionWallEndMs": None}
play = lambda to: {"type": "play", "toWallMs": to}
settle = lambda a, f, to: {"type": "settle", "absence": a, "fromWallMs": f, "toWallMs": to}
rec = lambda a, f, at, end: {"type": "reconnect", "absence": a, "fromWallMs": f, "atWallMs": at, "endWallMs": end}
t("s5.tm.play-ok", "normal", "play within the session", ses, play(20 * M), 20 * M, "Connected, to <= now, to >= cursor, to <= the session end: no refusal.")
t("s5.tm.play-end", "boundary", "play exactly to the session end", ses, play(40 * M), 40 * M, "to = E is allowed (the logout itself).")
t("s5.tm.play-beyond", "boundary", "play beyond the session end", ses, play(40 * M + 1), 41 * M, "to > E: BEYOND_SESSION.")
t("s5.tm.play-future", "boundary", "play beyond the trusted clock", ses, play(20 * M + 1), 20 * M, "to > now: FUTURE_TIME (checked before the cursor).")
t("s5.tm.play-back", "boundary", "play before the cursor", ses, play(10 * M - 1), 20 * M, "to < cursor: BACKWARDS_TIME.")
t("s5.tm.play-away", "normal", "play while away", away, play(110 * M), 110 * M, "No open session: NOT_CONNECTED.")
t("s5.tm.settle-ok", "normal", "settle from the cursor", away, settle("absence:3", 100 * M, 160 * M), 200 * M, "Current absence, from = cursor, to >= from, to <= now.")
t("s5.tm.settle-zero", "boundary", "a zero-length batch is allowed", away, settle("absence:3", 100 * M, 100 * M), 200 * M, "to = from is not backwards; it credits nothing.")
t("s5.tm.settle-overlap", "normal", "a batch that starts before the cursor overlaps", away, settle("absence:3", 90 * M, 160 * M), 200 * M, "from < cursor: OVERLAP (also the partial overlap 90..160 across the cursor 100).")
t("s5.tm.settle-full-overlap", "boundary", "a batch wholly inside the settled interval", away, settle("absence:3", 50 * M, 80 * M), 200 * M, "from < cursor: OVERLAP.")
t("s5.tm.settle-gap", "normal", "a batch that starts after the cursor leaves a gap", away, settle("absence:3", 101 * M, 160 * M), 200 * M, "from > cursor: GAP.")
t("s5.tm.settle-back", "boundary", "a batch that ends before it starts", away, settle("absence:3", 100 * M, 99 * M), 200 * M, "to < from: BACKWARDS_TIME.")
t("s5.tm.settle-future", "boundary", "a batch beyond the trusted clock", away, settle("absence:3", 100 * M, 201 * M), 200 * M, "to > now: FUTURE_TIME.")
t("s5.tm.settle-closed", "normal", "an earlier absence is closed", away, settle("absence:2", 100 * M, 160 * M), 200 * M, "Names absence 2 < current 3: ABSENCE_CLOSED (it was claimed at its reconnect).")
t("s5.tm.settle-unknown", "normal", "a later absence is unknown", away, settle("absence:4", 100 * M, 160 * M), 200 * M, "Names absence 4 > 3: ABSENCE_UNKNOWN.")
t("s5.tm.settle-garbage", "boundary", "a malformed absence name is unknown", away, settle("absence:x", 100 * M, 160 * M), 200 * M, "Not absence:<digits>: ABSENCE_UNKNOWN.")
t("s5.tm.settle-connected", "normal", "settling while connected", ses, settle("absence:0", 10 * M, 20 * M), 30 * M, "No current absence and a session open: ABSENCE_CLOSED.")
t("s5.tm.settle-pre", "boundary", "settling before the first session", pre, settle("absence:0", 0, 10), 10, "No absence and no session: NO_ABSENCE.")
t("s5.tm.rec-ok", "normal", "a reconnect from the cursor", away, rec("absence:3", 100 * M, 150 * M, 180 * M), 150 * M, "Current absence, from = cursor, at in [from, now], end > at.")
t("s5.tm.rec-empty", "boundary", "a reconnect whose session is empty", away, rec("absence:3", 100 * M, 150 * M, 150 * M), 150 * M, "end <= at: EMPTY_SESSION.")
t("s5.tm.rec-future", "boundary", "a reconnect after the trusted clock", away, rec("absence:3", 100 * M, 151 * M, 180 * M), 150 * M, "at > now: FUTURE_TIME (before EMPTY_SESSION).")
t("s5.tm.rec-back", "boundary", "a reconnect before the cursor's start", away, rec("absence:3", 100 * M, 99 * M, 180 * M), 150 * M, "at < from: BACKWARDS_TIME.")
t("s5.tm.rec-twice", "normal", "the same absence claimed twice", ses, rec("absence:3", 100 * M, 150 * M, 180 * M), 150 * M, "After the reconnect the session is open and no absence is current: ABSENCE_CLOSED.")
t("s5.tm.rec-overlap", "normal", "a reconnect that overlaps settled time", away, rec("absence:3", 99 * M, 150 * M, 180 * M), 150 * M, "from < cursor: OVERLAP.")
t("s5.tm.bad-type", "failure", "an unknown request type is refused", away, {"type": "teleport"}, 150 * M, "Spec §4: an unknown request type is refused (INVALID_STATE).")

def fixture(name, cases, independence):
    return {"fixtureSet": name, "fixtureVersion": 1, "specRef": "spec/formulas/s5-offline.md#v1", "status": "candidate", "independence": independence, "cases": cases}

ind = "S5 rules (spec/formulas/s5-offline.md v1) re-derived by spec/oracle/s5_oracle.py from the rule text with Python integers and exact fractions; the lab side calls the real S5 functions. Derivations are hand-written. Written by the same author as the code (not an independent party)."
for name, cases in (("s5-offline-credit", credit), ("s5-settlement-timing", timing)):
    with open(f"{out_dir}/{name}.draft.json", "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(fixture(name, cases, ind), indent=2) + "\n")
print(f"drafts: {len(credit)} credit cases, {len(timing)} timing cases")
