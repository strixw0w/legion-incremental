"""Independent EXP oracle (spec/formulas/xp.md v2). Python standard library only; run with `python -I`.

Fractional exponents are irrational in general, so fractions.Fraction is NOT used for the curve.
T(L) = roundHalfUp(a * L^p * g^(L-1)) is evaluated with decimal at two precisions (60 and 120 significant
digits) using correctly rounded ln/exp. A value is accepted only if:
  - both precisions round to the same integer, and
  - the 120-digit value is farther than 1e-9 * max(1, |value|) from a .5 rounding boundary.
Curve parameters are read as the decimal literals written in JSON (parse_float=str), i.e. p = 1.6 exactly.

Usage:
  python -I xp_oracle.py --check-artifact PATH        compare an XP table artifact with the oracle table
  python -I xp_oracle.py --check-fixtures PATH        check every case of spec/fixtures/xp.v2.json
  python -I xp_oracle.py --check-preview PATH         check thresholds in an S0-R01 semantic.json
  python -I xp_oracle.py --fill DRAFT OUT             fill buildTable cases whose "expected" is "ORACLE"
"""
import json
import math
import sys
from decimal import ROUND_FLOOR, ROUND_HALF_UP, Decimal, localcontext

MAX_SAFE = 2**53 - 1
PRECISIONS = (60, 120)
STABILITY = Decimal("1e-9")


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def load(path):
    return json.load(open(path, encoding="utf-8"), parse_float=str)


def dec(text):
    return Decimal(str(text))


def curve_value(a, p, g, level, prec):
    with localcontext() as ctx:
        ctx.prec = prec
        L = Decimal(level)
        lp = Decimal(1) if p == 0 or level == 1 else (p * L.ln()).exp()
        gp = Decimal(1) if g == 1 or level == 1 else ((L - 1) * g.ln()).exp()
        return +(a * lp * gp)


def rhu(value):
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def oracle_table(curve, length):
    a, p, g = dec(curve["a"]), dec(curve["p"]), dec(curve["g"])
    if curve.get("family") != "powerGeometric" or a <= 0 or p < 0 or g < 1 or length < 1:
        raise OracleError("INVALID_TABLE")
    table, unstable = [], []
    for level in range(1, length + 1):
        lo, hi = (curve_value(a, p, g, level, prec) for prec in PRECISIONS)
        r_lo, r_hi = rhu(lo), rhu(hi)
        frac = hi - hi.to_integral_value(rounding=ROUND_FLOOR)
        distance = abs(frac - Decimal("0.5"))
        if r_lo != r_hi or distance <= STABILITY * max(Decimal(1), abs(hi)):
            unstable.append(level)
        if r_hi > MAX_SAFE:
            raise OracleError("NUMERIC_LIMIT")
        if r_hi < 1:
            raise OracleError("INVALID_TABLE")
        if table and r_hi < table[-1]:
            raise OracleError("INVALID_TABLE")
        table.append(r_hi)
    return table, unstable


def award(table, level, into, amount, guard):
    """xp.md v2: plain unbounded-integer arithmetic. The total into + amount may exceed 2^53 - 1 here
    (Python integers are unbounded); the spec's level-by-level evaluation gives the same result."""
    if level < 1 or level > len(table) + 1:
        raise OracleError("INVALID_STATE")
    if into < 0:
        raise OracleError("INVALID_NUMBER")
    if level <= len(table) and into >= table[level - 1]:
        raise OracleError("INVALID_STATE")
    if amount < 0 or guard < 1:
        raise OracleError("INVALID_NUMBER")
    total = into + amount
    ups = []
    while level <= len(table) and total >= table[level - 1]:
        total -= table[level - 1]
        level += 1
        ups.append(level)
        if len(ups) > guard:
            raise OracleError("LEVEL_UP_GUARD")
    if level == len(table) + 1 and total > 0:
        raise OracleError("XP_TABLE_EXHAUSTED")
    return {"level": level, "expIntoLevel": total, "levelUps": ups}


def cumulative(table):
    out = [0]
    for t in table:
        nxt = out[-1] + t
        if nxt > MAX_SAFE:
            return {"cumulative": out, "lastSafeCumulativeLevel": len(out), "cumulativeCompleteWithinTable": False}
        out.append(nxt)
    return {"cumulative": out, "lastSafeCumulativeLevel": len(out), "cumulativeCompleteWithinTable": True}


def is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def run_case(inp):
    op = inp["op"]
    if op == "buildTable":
        table, unstable = oracle_table(inp["curve"], int(inp["length"]))
        if unstable:
            raise OracleError(f"UNSTABLE_LEVELS:{unstable}")
        return {"thresholds": table}
    table = inp["table"]
    if not isinstance(table, list) or not table or any((not is_int(t)) or t < 1 or t > MAX_SAFE for t in table) or any(b < a for a, b in zip(table, table[1:])):
        raise OracleError("INVALID_TABLE")
    if op == "award":
        for key in ("level", "expIntoLevel", "award", "maxLevelUps"):
            if not is_int(inp[key]) or abs(inp[key]) > MAX_SAFE:
                raise OracleError("INVALID_NUMBER")
        return award(table, inp["level"], inp["expIntoLevel"], inp["award"], inp["maxLevelUps"])
    if op == "awardSequence":
        for key in ("level", "expIntoLevel", "maxLevelUps"):
            if not is_int(inp[key]) or abs(inp[key]) > MAX_SAFE:
                raise OracleError("INVALID_NUMBER")
        level, into, ups = inp["level"], inp["expIntoLevel"], []
        for amount in inp["awards"]:
            if not is_int(amount) or abs(amount) > MAX_SAFE:
                raise OracleError("INVALID_NUMBER")
            r = award(table, level, into, amount, inp["maxLevelUps"])
            level, into, ups = r["level"], r["expIntoLevel"], ups + r["levelUps"]
        return {"level": level, "expIntoLevel": into, "levelUps": ups}
    if op == "cumulative":
        return cumulative(table)
    raise SystemExit(f"unknown op {op}")


def check_fixtures(path):
    data = load(path)
    bad = 0
    for case in data["cases"]:
        try:
            got, err = run_case(case["input"]), None
        except OracleError as e:
            got, err = None, e.code
        ok = (err == case["expectedError"]) if "expectedError" in case else (err is None and got == case["expected"])
        if not ok:
            bad += 1
            print(f"MISMATCH {case['id']}: oracle={got if err is None else err}")
    print(f"xp_oracle fixtures: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
    return bad


def check_artifact(path):
    art = load(path)
    table, unstable = oracle_table(art["curve"], len(art["thresholds"]))
    diffs = [i + 1 for i, (x, y) in enumerate(zip(table, art["thresholds"])) if x != y]
    print(f"xp_oracle artifact: {len(table)} thresholds; mismatched levels: {diffs or 'none'}; rounding-unstable levels: {unstable or 'none'} ({path})")
    return len(diffs) + len(unstable)


def check_preview(path):
    sem = load(path)
    bad = 0
    main, unstable = oracle_table(sem["curve"], len(sem["rows"]))
    rows = [r["threshold"] for r in sem["rows"]]
    bad += sum(1 for x, y in zip(main, rows) if x != y) + len(unstable)
    for v in sem["sweepPreview"]:
        t, u = oracle_table({"family": "powerGeometric", "a": v["a"], "p": v["p"], "g": v["g"]}, len(v["thresholds"]))
        d = sum(1 for x, y in zip(t, v["thresholds"]) if x != y)
        if d or u:
            print(f"MISMATCH sweep a={v['a']} p={v['p']}: {d} differing, unstable {u}")
        bad += d + len(u)
    print(f"xp_oracle preview: main rows + {len(sem['sweepPreview'])} sweep variants checked, {bad} problems ({path})")
    return bad


def fill(draft, out):
    data = json.load(open(draft, encoding="utf-8"))
    for case in data["cases"]:
        if case.get("expected") == "ORACLE":
            case["expected"] = run_case(json.loads(json.dumps(case["input"]), parse_float=str))
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"filled {out}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == "--check-artifact":
        sys.exit(1 if check_artifact(args[1]) else 0)
    if len(args) == 2 and args[0] == "--check-fixtures":
        sys.exit(1 if check_fixtures(args[1]) else 0)
    if len(args) == 2 and args[0] == "--check-preview":
        sys.exit(1 if check_preview(args[1]) else 0)
    if len(args) == 3 and args[0] == "--fill":
        fill(args[1], args[2])
        sys.exit(0)
    raise SystemExit(__doc__)
