"""Writes the L2.1 fixture drafts (spec/fixtures/l21-*.v1.json; expected values "ORACLE" are filled by
spec/oracle/l21_oracle.py --fill; a few review cases carry hand-derived expectations that the oracle must reproduce).
Usage: python -I repro/l2.1/make_fixtures.py <out dir>"""
import json
import os
import random
import sys

out = sys.argv[1]
H = lambda c: c * 64


def case(id, kind, desc, inp, deriv, error=None, expected="ORACLE"):
    c = {"id": id, "kind": kind, "description": desc, "input": inp, "derivation": deriv}
    if error:
        c["expectedError"] = error
    else:
        c["expected"] = expected
    return c


def doc(family, cases, note):
    return {"fixtureSet": family, "fixtureVersion": 1, "specRef": "spec/formulas/l21-replay.md#v2", "status": "candidate",
            "independence": f"L2.1 rules (spec/formulas/l21-replay.md v2) re-derived by spec/oracle/l21_oracle.py from the rule text with a full-history window model, plain sets and dictionaries; the lab side calls the real L2.1 functions. {note} Written by the same author as the code (not an independent party).",
            "cases": cases}


rng = random.Random(20261115_21)
LIM = {"maxRecent": 4, "maxAgeMs": 1000, "maxAhead": 16}
st = lambda seq, h, now: {"seq": seq, "hash": H(h), "nowMs": now}

# ---------------------------------------------------------------- requests
R = [
    case("l21.req.basic.001", "normal", "new, replay, conflict, closed after count eviction, ahead, invalid",
         {"limits": LIM, "steps": [st(1, "a", 0), st(1, "a", 1), st(1, "b", 2), st(2, "a", 3), st(3, "a", 3), st(4, "a", 3), st(5, "a", 3), st(1, "a", 4), st(40, "a", 4), st(0, "a", 4)]},
         "spec 2.3 rules 2 (replay, conflict), 2.4 count eviction of seq 1 raises H to 1 (rule 3), 40 - T(5) > 16 (rule 4), 0 invalid (rule 1)"),
    case("l21.req.review.out-of-order", "boundary", "review section 2: seq 2 at 0, seq 1 at 90, seq 3 at 150 (maxAgeMs 100); retries at 150 and 190",
         {"limits": {"maxRecent": 256, "maxAgeMs": 100, "maxAhead": 16}, "steps": [st(2, "two", 0), st(1, "one", 90), st(3, "three", 150), st(2, "two", 150), st(1, "one", 150), st(1, "one", 190)]},
         "hand-derived: at 150 receipt 2 (age 150 >= 100) expires and H = 2, so its retry is REQUEST_CLOSED; receipt 1 (age 60) still replays; at 190 it expires too",
         expected={"kinds": ["NEW", "NEW", "NEW", "REQUEST_CLOSED", "REPLAY", "REQUEST_CLOSED"], "horizon": 2, "top": 3, "receipts": [3]}),
    case("l21.req.age-boundary", "boundary", "a receipt is live at age maxAgeMs - 1 and closed at age maxAgeMs",
         {"limits": LIM, "steps": [st(1, "a", 0), st(1, "a", 999), st(1, "a", 1000)]},
         "hand-derived: live while now - at < 1000 (spec 2.2)",
         expected={"kinds": ["NEW", "REPLAY", "REQUEST_CLOSED"], "horizon": 1, "top": 1, "receipts": []}),
    case("l21.req.no-request-expiry", "boundary", "receipts expire with time alone (finalNowMs, no further request)",
         {"limits": LIM, "steps": [st(1, "a", 0), st(2, "a", 500)], "finalNowMs": 1200},
         "spec 2.2 at 1200: receipt 1 expires (age 1200), receipt 2 stays (age 700)"),
    case("l21.req.far-ahead", "normal", "a far-ahead number is refused and closes nothing; out-of-order numbers in the window execute",
         {"limits": {"maxRecent": 8, "maxAgeMs": 10**9, "maxAhead": 16}, "steps": [st(5, "a", 0), st(3, "a", 1), st(10**12, "a", 2), st(1, "a", 3), st(2, "a", 4), st(4, "a", 5)]},
         "spec 2.3 rule 4 against T = 5; H stays 0"),
    case("l21.req.even-gaps", "normal", "only even numbers arrive: no gap membership is kept",
         {"limits": {"maxRecent": 5, "maxAgeMs": 10**9, "maxAhead": 4}, "steps": [st(s, "a", s) for s in range(2, 41, 2)] + [st(31, "a", 41), st(39, "a", 42)]},
         "spec 2.4: the five highest receipts remain; H = 30; 31 is closed, 39 executes (above H)"),
    case("l21.req.expiry-raises-past-live", "boundary", "an older-numbered live receipt stays replayable after a higher one expires",
         {"limits": {"maxRecent": 8, "maxAgeMs": 100, "maxAhead": 16}, "steps": [st(5, "a", 0), st(2, "a", 50), st(3, "a", 101), st(2, "a", 101), st(1, "a", 101)]},
         "spec 2.2: receipt 5 expires at 101, H = 5; receipt 2 still replays (rule 2 before rule 3); 1 and 3 are closed"),
]
for i in range(10):
    now, steps = 0, []
    for _ in range(rng.randint(10, 40)):
        now += rng.choice([0, 0, 50, 200, 700, 1500])
        steps.append(st(rng.randint(-1, 30), rng.choice("ab"), now))
    R.append(case(f"l21.req.random.{i:03d}", "normal", "seeded random traffic", {"limits": {"maxRecent": rng.randint(1, 6), "maxAgeMs": rng.choice([100, 1000, 5000]), "maxAhead": rng.randint(1, 12)}, "steps": steps},
                  "oracle: full-history window by definition (spec 2)"))
R.append(case("l21.req.clock-backwards", "failure", "the trusted clock goes backwards", {"limits": LIM, "steps": [st(1, "a", 10), st(2, "a", 9)]}, "the trusted clock is monotonic (contract 2.1)", error="INVALID_NUMBER"))
R.append(case("l21.req.bad-limits", "failure", "maxRecent 0", {"limits": {"maxRecent": 0}, "steps": []}, "every limit is a positive safe integer (spec 0)", error="INVALID_NUMBER"))

# ---------------------------------------------------------------- credits
cr = lambda op, n, s="squad": {"op": op, "stream": s, "n": n}
C = [
    case("l21.cr.basic.001", "normal", "credit, duplicate, abandon, a credit for the abandoned number, ahead, then fill",
         {"limits": {"creditWindow": 8}, "steps": [cr("credit", 2), cr("credit", 2), cr("abandon", 1), cr("credit", 1), cr("credit", 11), cr("credit", 10), cr("abandon", 3)] + [cr("credit", n) for n in range(4, 10)]},
         "spec 3.4: each number settles once; 11 - p(3) > 8; the gaps close as their credits arrive"),
    case("l21.cr.window-edge", "boundary", "n - p equal to the window is admitted; one more is refused",
         {"limits": {"creditWindow": 8}, "steps": [cr("credit", 8), cr("credit", 10), cr("credit", 9)]},
         "hand-derived: p = 0, 8 - 0 = 8 is admitted; 10 > 8 refused; 9 - 0 = 9 > 8 refused",
         expected={"codes": ["APPLIED", "CREDIT_AHEAD", "CREDIT_AHEAD"], "paid": 1, "streams": {"squad": {"p": 0, "runs": [[8, 8]]}}}),
    case("l21.cr.streams", "boundary", "a stream limit; an invalid number; streams are independent",
         {"limits": {"maxCreditStreams": 2}, "steps": [cr("credit", 1, "a"), cr("credit", 1, "b"), cr("credit", 1, "c"), cr("credit", 0, "a"), cr("credit", 2, "a")]},
         "spec 3.4 order: invalid, stream limit, replay, ahead"),
]
for i in range(6):
    C.append(case(f"l21.cr.random.{i:03d}", "normal", "seeded random credits and abandonments",
                  {"limits": {"creditWindow": rng.randint(2, 20), "maxCreditStreams": 2}, "steps": [cr(rng.choice(["credit", "credit", "abandon"]), rng.randint(1, 40), rng.choice(["squad", "worker:1"])) for _ in range(rng.randint(10, 50))]},
                  "oracle: plain sets, prefix by counting (spec 3.4)"))
C.append(case("l21.cr.bad-limits", "failure", "creditWindow 0", {"limits": {"creditWindow": 0}, "steps": []}, "every limit is a positive safe integer (spec 0)", error="INVALID_NUMBER"))

# ---------------------------------------------------------------- lifecycle
w = lambda op, n=None, u=None: {k: v for k, v in {"op": op, "producer": n, "unit": u}.items() if v is not None}
LL = {"maxOpenProducers": 2, "maxUnits": 6, "maxOutstanding": 3}
P = [
    case("l21.life.basic.001", "normal", "in order, outstanding limit, unit limit, close, retirement once settled, retired refusals",
         {"limits": LL, "ops": [w("open"), w("reserve", 1, 2), w("reserve", 1, 1), w("reserve", 1, 2), w("reserve", 1, 3), w("reserve", 1, 4), w("complete", 1, 2), w("abandon", 1, 4), w("reserve", 1, 5), w("complete", 1, 5), w("reserve", 1, 6), w("abandon", 1, 7), w("close", 1), w("abandon", 1, 7), w("release", 1, 1), w("complete", 1, 3), w("complete", 1, 6), w("complete", 1, 1), w("close", 1), w("open")]},
         "spec 3.2: WORK_OUT_OF_ORDER, WORK_LIMIT, PRODUCER_FULL, PRODUCER_CLOSED; the last settlement on the closed producer retires it; the next open is number 2"),
    case("l21.life.close-empty", "boundary", "closing a producer with nothing reserved retires it at once; the open limit counts open producers only",
         {"limits": LL, "ops": [w("open"), w("open"), w("open"), w("close", 1), w("open"), w("close", 1), w("close", 9), w("reserve", 3, 1)]},
         "hand-derived: open 1, 2; the third is PRODUCER_LIMIT; close 1 retires it; open gives 3; close 1 again is PRODUCER_RETIRED; 9 is unknown",
         expected={"allocated": 3, "retired": [1], "open": [{"producer": 2, "maxUnit": 0, "reserved": [], "closed": False}, {"producer": 3, "maxUnit": 1, "reserved": [1], "closed": False}]}),
    case("l21.life.table", "boundary", "the transition table refusals",
         {"limits": LL, "ops": [w("open"), w("reserve", 1, 1), w("reserve", 1, 1), w("complete", 1, 1), w("complete", 1, 1), w("release", 1, 1), w("abandon", 1, 1), w("abandon", 1, 2), w("abandon", 1, 2), w("complete", 1, 2), w("complete", 1, 3), w("reserve", 1, 0)]},
         "L2 v1 section 3 table, then spec 3.2 admission"),
]
for i in range(8):
    ops = []
    for _ in range(rng.randint(15, 60)):
        r = rng.random()
        ops.append(w("open") if r < 0.12 else w("close", rng.randint(1, 4)) if r < 0.22 else w(rng.choice(["reserve", "reserve", "complete", "release", "abandon"]), rng.randint(1, 4), rng.randint(0, 8)))
    P.append(case(f"l21.life.random.{i:03d}", "normal", "seeded random lifecycle", {"limits": {"maxOpenProducers": rng.randint(1, 3), "maxUnits": rng.randint(2, 8), "maxOutstanding": rng.randint(1, 4)}, "ops": ops}, "oracle: plain dictionaries of unit states (spec 3.2)"))
P.append(case("l21.life.bad-limits", "failure", "maxUnits 0", {"limits": {"maxUnits": 0}, "ops": []}, "every limit is a positive safe integer (spec 0)", error="INVALID_NUMBER"))

# ---------------------------------------------------------------- deliveries
def rq(t, seq, payload, stream="c", branch="main"):
    return {"type": "request", "branch": branch, "atMs": t, "stream": stream, "seq": seq, "payload": payload}


def cd(t, n, gold=10, stream="squad"):
    return {"type": "credit", "branch": "main", "atMs": t, "stream": stream, "n": n, "gold": gold}


def wk(t, producer, unit, op, qty=1):
    return {"type": "work", "branch": "main", "atMs": t, "producer": producer, "unit": unit, "op": op, "qty": qty}


HOUR = 3_600_000
DL = [
    case("l21.del.review.failed-batch", "normal", "review section 8: one gatherer, a batch opened at 0, unreserved units 1-2 settled at 1 h",
         {"gatherers": 1, "deliveries": [rq(0, 1, {"kind": "openBatch"}), rq(HOUR, 2, {"kind": "settleBatch", "producer": 1, "fromUnit": 1, "toUnit": 2})]},
         "spec 4: advancement to 1 h is committed independently; the batch commits nothing (no unit, no bar); the request is recorded"),
    case("l21.del.envelope", "boundary", "envelope refusals change nothing: branch, time behind, out-of-domain time, stream name, unknown type",
         {"gatherers": 1, "deliveries": [rq(1000, 1, {"kind": "openBatch"}), rq(2000, 2, {"kind": "craft"}, branch="main/x"), rq(999, 2, {"kind": "craft"}), rq(8_640_000_000_000_001, 2, {"kind": "craft"}), rq(2000, 2, {"kind": "craft"}, stream="Bad Stream"), {"type": "teleport", "branch": "main", "atMs": 2000}, rq(2000, 2, {"kind": "craft"})]},
         "spec 4 part 1, in order"),
    case("l21.del.settle", "boundary", "settle backwards, ahead and at the trusted time",
         {"gatherers": 1, "deliveries": [rq(HOUR, 1, {"kind": "settle", "untilMs": HOUR - 1}), rq(HOUR, 2, {"kind": "settle", "untilMs": HOUR + 1}), rq(HOUR, 3, {"kind": "settle", "untilMs": HOUR}), rq(HOUR, 4, {"kind": "settle", "untilMs": -5})]},
         "spec 4 settle rule: the cursor is driven by the trusted clock only"),
    case("l21.del.review.expiry-through-credit", "normal", "review section 2: a receipt expires when time advances through a credit",
         {"gatherers": 1, "limits": {"maxAgeMs": HOUR}, "deliveries": [cd(0, 1, 500), rq(1000, 1, {"kind": "monument", "levels": 1}), cd(10 * HOUR, 2, 1), rq(10 * HOUR + 1, 1, {"kind": "monument", "levels": 1})]},
         "spec 4 part 2 expires every stream at the delivery time; the retry is REQUEST_CLOSED; one Monument level"),
    case("l21.del.jobs", "normal", "a job completes and retires; another is cancelled and never produces",
         {"gatherers": 2, "deliveries": [rq(HOUR, 1, {"kind": "createJob", "quantity": 2}), rq(HOUR + 300_000, 2, {"kind": "settle", "untilMs": HOUR + 300_000}), rq(HOUR + 300_001, 3, {"kind": "createJob", "quantity": 5}), rq(HOUR + 300_002, 4, {"kind": "cancelJob", "job": 2}), rq(2 * HOUR, 5, {"kind": "settle", "untilMs": 2 * HOUR}), rq(2 * HOUR, 6, {"kind": "createJob", "quantity": 10**9})]},
         "spec 3.2 jobs: closed on completion or cancellation, then retired"),
    case("l21.del.batches", "normal", "work through deliveries: in order, settle a batch, close, retirement, late work refused",
         {"gatherers": 2, "deliveries": [rq(HOUR, 1, {"kind": "openBatch"}), wk(HOUR, 1, 1, "reserve", 2), wk(HOUR, 1, 3, "reserve"), wk(HOUR, 1, 2, "reserve", 3), rq(HOUR + 1, 2, {"kind": "settleBatch", "producer": 1, "fromUnit": 1, "toUnit": 2}), rq(HOUR + 2, 3, {"kind": "closeBatch", "producer": 1}), wk(HOUR + 3, 1, 1, "complete"), rq(HOUR + 4, 4, {"kind": "openBatch"}), wk(HOUR + 5, 2, 1, "reserve", 10**12)]},
         "spec 3.2 and 4: the batch settles both units at once; closing with nothing reserved retires it"),
    case("l21.del.retries", "normal", "a refused execution is recorded and replays its refusal; a conflicting retry; a replay advances time only",
         {"gatherers": 1, "deliveries": [rq(1000, 1, {"kind": "recruit"}), rq(2000, 1, {"kind": "recruit"}), rq(3000, 1, {"kind": "craft"}), cd(4000, 1, 1000), rq(5000, 2, {"kind": "recruit"}), rq(6000, 2, {"kind": "recruit"})]},
         "spec 4 part 3: NEW executes on a copy; the receipt is recorded either way"),
]
for i in range(8):
    t, seq, credit, ds = 0, 0, 0, []
    for _ in range(rng.randint(15, 45)):
        t += rng.choice([0, 1000, 36_000, 600_000, HOUR])
        r = rng.random()
        if r < 0.3:
            credit += rng.choice([1, 1, 2])
            ds.append(cd(t, credit, rng.randint(0, 300)))
        elif r < 0.5:
            ds.append(wk(t, rng.randint(1, 3), rng.randint(1, 4), rng.choice(["reserve", "reserve", "complete", "release", "abandon"]), rng.randint(1, 3)))
        else:
            if rng.random() < 0.85:
                seq += 1
            pay = rng.choice([{"kind": "settle", "untilMs": t}, {"kind": "monument", "levels": 1}, {"kind": "recruit"}, {"kind": "craft"}, {"kind": "createJob", "quantity": rng.randint(1, 4)}, {"kind": "cancelJob", "job": rng.randint(1, 3)}, {"kind": "openBatch"}, {"kind": "closeBatch", "producer": rng.randint(1, 3)}, {"kind": "settleBatch", "producer": rng.randint(1, 3), "fromUnit": 1, "toUnit": rng.randint(1, 3)}])
            ds.append(rq(t, max(seq, 1), pay))
    DL.append(case(f"l21.del.random.{i:03d}", "normal", "seeded random deliveries", {"gatherers": rng.randint(1, 3), "limits": {"maxRecent": rng.randint(2, 8), "maxAgeMs": rng.choice([HOUR, 6 * HOUR]), "maxOutstanding": 3, "maxUnits": 5, "maxOpenProducers": 2}, "deliveries": ds},
                   "oracle: the synthetic account re-simulated from the rule text (spec 4)"))
DL.append(case("l21.del.no-gatherers", "failure", "an account with no gatherer", {"gatherers": 0, "deliveries": []}, "gatherers must be in [1, maxGatherers]", error="INVALID_NUMBER"))

os.makedirs(out, exist_ok=True)
for family, cases, note in [("l21-requests", R, "Review case l21.req.review.out-of-order and the boundary cases are hand-derived."), ("l21-credits", C, "The window-edge case is hand-derived."),
                            ("l21-lifecycle", P, "The close-empty case is hand-derived."), ("l21-delivery", DL, "The review cases reproduce the reviewer's inputs.")]:
    path = os.path.join(out, f"{family}.draft.json")
    json.dump(doc(family, cases, note), open(path, "w", encoding="utf-8", newline="\n"), indent=2)
    print(f"wrote {path} ({len(cases)} cases)")
