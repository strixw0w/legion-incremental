"""Independent S5 oracle (spec/formulas/s5-offline.md v1), written from the rule text with Python integers and exact
fractions. It shares no code with the lab.

Families:
  s5-offline-credit     the credited duration P(w) (exact rational floor), the windows crossed, storage-batch credits.
  s5-settlement-timing  the ordered timing refusals of play, settle and reconnect requests.

The credited duration is computed as an exact Fraction sum of the two window contributions and floored once; the
windows are found by intersecting [0, w) with the three fixed intervals [0, F), [F, F+S), [F+S, inf).

Usage:  python -I spec/oracle/s5_oracle.py --check <fixture.json> ...
        python -I spec/oracle/s5_oracle.py --fill <draft.json> <out.json>
Written by the same author as the lab code (not an independent party).
"""
import json
import math
import re
import sys
from fractions import Fraction

MAX_SAFE = 2**53 - 1
H = 3_600_000
DEFAULT_F = 24 * H
DEFAULT_S = 48 * H


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def is_int(v):
    return isinstance(v, int) and not isinstance(v, bool) and -MAX_SAFE <= v <= MAX_SAFE


def reduced_rate_e8(n, second):
    """The reduced window's rate per millisecond, as a Fraction of one (not in E8 units)."""
    if second["kind"] == "ratio":
        return Fraction(n, 10_000) * Fraction(second["ratioBp"], 10_000)
    if second["kind"] == "flat":
        return Fraction(second["bp"], 10_000)
    raise OracleError("INVALID_STATE")


def credited(w, n, second, F, S):
    if not is_int(w):
        raise OracleError("INVALID_STATE")
    if w <= 0:
        return 0
    normal_part = Fraction(n, 10_000) * min(w, F)
    reduced_part = reduced_rate_e8(n, second) * max(0, min(w - F, S))
    return math.floor(normal_part + reduced_part)


def windows(w, n, second, F, S):
    out = []
    intervals = [("normal", 0, F, n * 10_000), ("reduced", F, F + S, int(reduced_rate_e8(n, second) * 10**8)), ("beyond-cap", F + S, None, 0)]
    for name, lo, hi, rate in intervals:
        top = w if hi is None else min(w, hi)
        if top > lo:
            out.append({"window": name, "fromMs": lo, "toMs": top, "rateE8": rate})
    return out


def offline_credit(inp):
    n = inp["normalBp"]
    second = inp.get("second", {"kind": "ratio", "ratioBp": 5000})
    F = inp.get("firstMs", DEFAULT_F)
    S = inp.get("secondMs", DEFAULT_S)
    w = inp["w"]
    out = {"rateE8": int(reduced_rate_e8(n, second) * 10**8), "creditedMs": credited(w, n, second, F, S), "windows": windows(w, n, second, F, S)}
    if "batches" in inp:
        # A batch credits the growth of the cumulative credit; computed per batch from its own end points.
        credits = []
        start = 0
        for end in inp["batches"]:
            credits.append(credited(end, n, second, F, S) - credited(start, n, second, F, S))
            start = end
        out["batchCredits"] = credits
        out["batchSum"] = sum(credits)
    return out


ABS = re.compile(r"^absence:(\d+)$")


def timing(inp):
    st = inp["state"]
    req = inp["request"]
    now = inp["nowMs"]
    kind = req.get("type")
    c = st["cursorWallMs"]
    if kind == "play":
        if not st["sessionOpen"]:
            return {"code": "NOT_CONNECTED"}
        if req["toWallMs"] > now:
            return {"code": "FUTURE_TIME"}
        if req["toWallMs"] < c:
            return {"code": "BACKWARDS_TIME"}
        end = st["sessionWallEndMs"]
        if end is not None and req["toWallMs"] > end:
            return {"code": "BEYOND_SESSION"}
        return {"code": None}
    if kind not in ("settle", "reconnect"):
        raise OracleError("INVALID_STATE")
    a = st["absence"]
    if a is None:
        return {"code": "ABSENCE_CLOSED" if st["sessionOpen"] else "NO_ABSENCE"}
    if req["absence"] != f"absence:{a}":
        m = ABS.match(req["absence"])
        return {"code": "ABSENCE_CLOSED" if m and int(m.group(1)) < a else "ABSENCE_UNKNOWN"}
    frm = req["fromWallMs"]
    if frm < c:
        return {"code": "OVERLAP"}
    if frm > c:
        return {"code": "GAP"}
    to = req["toWallMs"] if kind == "settle" else req["atWallMs"]
    if to < frm:
        return {"code": "BACKWARDS_TIME"}
    if to > now:
        return {"code": "FUTURE_TIME"}
    if kind == "reconnect" and req["endWallMs"] <= req["atWallMs"]:
        return {"code": "EMPTY_SESSION"}
    return {"code": None}


FAMILIES = {"s5-offline-credit": offline_credit, "s5-settlement-timing": timing}


def run_case(family, case):
    try:
        return {"expected": FAMILIES[family](case["input"])}
    except OracleError as e:
        return {"expectedError": e.code}


def main(argv):
    if len(argv) >= 3 and argv[1] == "--fill":
        doc = json.load(open(argv[2], encoding="utf-8"))
        for case in doc["cases"]:
            case.pop("expected", None)
            case.pop("expectedError", None)
            case.update(run_case(doc["fixtureSet"], case))
        with open(argv[3], "w", encoding="utf-8", newline="\n") as f:
            f.write(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        print(f"filled {len(doc['cases'])} cases -> {argv[3]}")
        return 0
    if len(argv) >= 3 and argv[1] == "--check":
        bad = 0
        total = 0
        for path in argv[2:]:
            doc = json.load(open(path, encoding="utf-8"))
            for case in doc["cases"]:
                total += 1
                got = run_case(doc["fixtureSet"], case)
                want = {k: case[k] for k in ("expected", "expectedError") if k in case}
                if json.dumps(got, sort_keys=True) != json.dumps(want, sort_keys=True):
                    bad += 1
                    print(f"MISMATCH {case['id']}: oracle {got} fixture {want}")
        print(f"s5 oracle: {total - bad}/{total} cases agree")
        return 0 if bad == 0 else 1
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
