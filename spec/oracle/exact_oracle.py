"""Independent exact oracle for rational families. Python standard library only; run with `python -I`.

Families: numeric (v1 + mulDivRem), remainder (v2), stats (v2), combat (v2), ledger, canonical-json, content (hash cases only).
Uses Python integers (unbounded) and fractions.Fraction (exact rationals), so it can detect any case where the
lab's bounded double arithmetic would differ from exact arithmetic. The one exception is stats v2, whose spec
defines a binary64 evaluation order: the oracle replays that order with Python floats (IEEE-754 binary64,
correctly rounded like JavaScript) and separately checks the result against the exact rational value.
Written from the Markdown specs in spec/formulas/, not from the lab's TypeScript.

Usage:  python -I exact_oracle.py --check FIXTURE.json [FIXTURE.json ...]
"""
import hashlib
import json
import math
import re
import sys
from decimal import Decimal
from fractions import Fraction

MAX_SAFE = 2**53 - 1
TWO52 = 2**52
MAX_DEN = 2**26
BP = 10000


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def decode(value):
    if isinstance(value, list):
        return [decode(v) for v in value]
    if isinstance(value, dict):
        if list(value.keys()) == ["$special"]:
            return {"NaN": math.nan, "Infinity": math.inf, "-Infinity": -math.inf, "-0": -0.0}[value["$special"]]
        return {k: decode(v) for k, v in value.items()}
    return value


def safe_int(v, nonneg=False):
    """Accepts Python ints and integral floats (JSON numbers) inside the safe range."""
    if isinstance(v, bool):
        raise OracleError("INVALID_NUMBER")
    if isinstance(v, float):
        if not math.isfinite(v) or v != math.floor(v):
            raise OracleError("INVALID_NUMBER")
        v = int(v)
    if not isinstance(v, int) or abs(v) > MAX_SAFE:
        raise OracleError("INVALID_NUMBER")
    if nonneg and v < 0:
        raise OracleError("INVALID_NUMBER")
    return v


def checked(v):
    if abs(v) > MAX_SAFE:
        raise OracleError("NUMERIC_LIMIT")
    return v


def finite(v):
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        raise OracleError("INVALID_NUMBER")
    return Fraction(v)


def round_half_up(x):
    f = finite(x)
    return math.floor(f + Fraction(1, 2))


# ---------------------------------------------------------------- numeric
def numeric(inp):
    op = inp["op"]
    if op in ("add", "sub", "mul"):
        a, b = safe_int(inp["a"]), safe_int(inp["b"])
        return {"result": checked({"add": a + b, "sub": a - b, "mul": a * b}[op])}
    if op == "mulThenDiv":
        a, b, c = safe_int(inp["a"]), safe_int(inp["b"]), safe_int(inp["c"])
        product = checked(a * b)
        if product < 0:
            raise OracleError("INVALID_NUMBER")
        if c < 1:
            raise OracleError("INVALID_NUMBER")
        return {"result": product // c}
    if op in ("divRem", "ceilDiv"):
        a, b = safe_int(inp["a"], nonneg=True), safe_int(inp["b"])
        if b < 1:
            raise OracleError("INVALID_NUMBER")
        q, r = divmod(a, b)
        return {"q": q, "r": r} if op == "divRem" else {"result": q + (1 if r else 0)}
    if op == "mulDivRem":
        a, m, d = safe_int(inp["a"], nonneg=True), safe_int(inp["m"], nonneg=True), safe_int(inp["d"])
        if d < 1:
            raise OracleError("INVALID_NUMBER")
        q, r = divmod(a * m, d)
        return {"q": checked(q), "r": r}
    if op == "roundHalfUp":
        return {"result": round_half_up(inp["x"])}
    if op == "roundHalfUpToSafeInt":
        return {"result": checked(round_half_up(inp["x"]))}
    raise SystemExit(f"unknown numeric op {op}")


# ---------------------------------------------------------------- remainder
def accrue(rem, num, steps, den):
    den = safe_int(den)
    if den < 1 or den > MAX_DEN:
        raise OracleError("INVALID_DENOMINATOR")
    rem = safe_int(rem, nonneg=True)
    if rem >= den:
        raise OracleError("INVALID_STATE")
    num, steps = safe_int(num, nonneg=True), safe_int(steps, nonneg=True)
    total = rem + num * steps
    return checked(total // den), total % den


MS_PER_HOUR = 3_600_000
MILLI_PER_UNIT = 1000
PER_HOUR_DEN = MS_PER_HOUR * MILLI_PER_UNIT


def per_hour_state(state):
    """remainder.md v2: msRem in [0, 3,600,000) and milliRem in [0, 1000), safe integers."""
    if not isinstance(state, dict):
        raise OracleError("INVALID_STATE")
    ms = safe_int(state.get("msRem"), nonneg=True)
    if ms >= MS_PER_HOUR:
        raise OracleError("INVALID_STATE")
    milli = safe_int(state.get("milliRem"), nonneg=True)
    if milli >= MILLI_PER_UNIT:
        raise OracleError("INVALID_STATE")
    return ms, milli


def per_hour(ms, milli, rate, part):
    """One per-hour accrual: a single exact division of X = milliRem*3.6e6 + msRem + rate*dMs by 3.6e9."""
    rate, part = safe_int(rate, nonneg=True), safe_int(part, nonneg=True)
    x = milli * MS_PER_HOUR + ms + rate * part
    granted, rest = divmod(x, PER_HOUR_DEN)
    return checked(granted), rest % MS_PER_HOUR, rest // MS_PER_HOUR


def remainder(inp):
    op = inp["op"]
    if op == "accrue":
        g, r = accrue(inp["rem"], inp["num"], inp["steps"], inp["den"])
        return {"granted": g, "rem": r}
    if op == "accrueSplit":
        rem, total = inp["rem"], 0
        for part in inp["parts"]:
            g, rem = accrue(rem, inp["num"], part, inp["den"])
            total = checked(total + g)
        return {"granted": total, "rem": rem}
    if op in ("perHour", "perHourTimeline"):
        if op == "perHour":
            segments = [{"rateMilliPerHour": inp["rateMilliPerHour"], "parts": inp["parts"]}]
        else:
            segments = inp["segments"]
        ms, milli = per_hour_state(inp["state"])
        total = 0
        for seg in segments:
            for part in seg["parts"]:
                g, ms, milli = per_hour(ms, milli, seg["rateMilliPerHour"], part)
                total = checked(total + g)
        return {"granted": total, "state": {"msRem": ms, "milliRem": milli}}
    raise SystemExit(f"unknown remainder op {op}")


# ---------------------------------------------------------------- stats
def stats(inp):
    """stats.md v2. Returns the binary64 value in the spec's order, after checking it against the exact value."""
    flat = safe_int(inp["base"], nonneg=True)
    if not isinstance(inp["categories"], list) or not isinstance(inp["sources"], list):
        raise OracleError("INVALID_CONTENT")
    cats = {}
    for c in inp["categories"]:
        if not isinstance(c, dict) or not isinstance(c.get("id"), str) or not c["id"]:
            raise OracleError("INVALID_CONTENT")
        if c["id"] in cats or c.get("kind") not in ("additivePool", "multiplier") or not isinstance(c.get("active"), bool):
            raise OracleError("INVALID_CONTENT")
        cats[c["id"]] = c
    seen, sums = set(), {}
    for src in inp["sources"]:
        if not isinstance(src, dict) or not isinstance(src.get("sourceId"), str) or not src["sourceId"]:
            raise OracleError("INVALID_CONTENT")
        if src["sourceId"] in seen:
            raise OracleError("INVALID_CONTENT")
        seen.add(src["sourceId"])
        if src.get("kind") == "flat":
            flat = checked(flat + safe_int(src.get("value"), nonneg=True))
        elif src.get("kind") == "bp":
            if src.get("categoryId") not in cats:
                raise OracleError("UNKNOWN_CATEGORY")
            sums[src["categoryId"]] = checked(sums.get(src["categoryId"], 0) + safe_int(src.get("value")))
        else:
            raise OracleError("INVALID_CONTENT")
    value, exact, factors = float(flat), Fraction(flat), []
    for cid in sorted(cats):  # category IDs are ASCII, so code-point order equals JavaScript's UTF-16 order
        numer = checked(BP + sums.get(cid, 0))
        if numer < 0:
            raise OracleError("INVALID_STATE")
        if cats[cid]["active"] and numer != BP:
            nxt = (value * numer) / BP  # binary64, correctly rounded, in the specified order
            if not nxt <= MAX_SAFE:
                raise OracleError("NUMERIC_LIMIT")
            value, exact = nxt, exact * Fraction(numer, BP)
        factors.append({"categoryId": cid, "active": cats[cid]["active"], "sumBp": sums.get(cid, 0), "factorNumerator": numer})
    if abs(Fraction(value) - exact) > exact * Fraction(1, 10**12):
        raise SystemExit(f"stats: binary64 value {value!r} is not within 1e-12 of the exact value {exact}")
    return {"value": value, "flatTotal": flat, "factors": factors}


# ---------------------------------------------------------------- combat
def combat(inp):
    op = inp["op"]
    if op == "hitChance":
        a, r = safe_int(inp["accuracy"], nonneg=True), safe_int(inp["requirement"], nonneg=True)
        c = inp["curve"]
        h_at, fl, k = safe_int(c["hAtReqBp"]), safe_int(c["floorBp"]), safe_int(c["k"])
        if not (0 <= h_at <= BP and 0 <= fl <= BP and 1 <= k <= 8) or fl > h_at:
            raise OracleError("INVALID_NUMBER")
        if r == 0:
            return {"result": Fraction(1)}
        floor = Fraction(fl, BP)
        if a == 0:
            return {"result": floor}
        h = 1 - (1 - Fraction(h_at, BP)) * Fraction(r, a) ** k
        return {"result": min(Fraction(1), max(floor, h))}
    if op in ("mitigation", "mitigationRatio"):
        d, kk = safe_int(inp["defence"], nonneg=True), safe_int(inp["K"])
        if kk < 1:
            raise OracleError("INVALID_NUMBER")
        den = checked(kk + d)
        return {"result": Fraction(kk, den)} if op == "mitigation" else {"num": kk, "den": den}
    if op == "critEffective":
        bp = safe_int(inp["bp"], nonneg=True)
        return {"effectiveBp": min(bp, BP), "overcapBp": max(0, bp - BP)}
    if op == "damagePerHit":
        # combat.md v2: V = rawMilli/1000 * (critMultBp/10000 if crit) * num/den, exactly; result = floor(V + 1/2).
        raw = safe_int(inp["rawMilli"])
        if raw < 1:
            raise OracleError("INVALID_NUMBER")
        if not isinstance(inp.get("crit"), bool):
            raise OracleError("INVALID_NUMBER")
        mult = safe_int(inp["critMultBp"])
        if mult < BP:
            raise OracleError("INVALID_NUMBER")
        mit = inp.get("mitigation")
        if not isinstance(mit, dict):
            raise OracleError("INVALID_NUMBER")
        num, den = safe_int(mit.get("num")), safe_int(mit.get("den"))
        if num < 1 or den < num:
            raise OracleError("INVALID_NUMBER")
        mn = safe_int(inp["minDamage"])
        if mn < 1:
            raise OracleError("INVALID_NUMBER")
        v = Fraction(raw, 1000) * (Fraction(mult, BP) if inp["crit"] else 1) * Fraction(num, den)
        return {"result": max(mn, checked(math.floor(v + Fraction(1, 2))))}
    if op == "attackRawMilli":
        # combat.md v2 "Attack quantisation": binary64 stat value (stats.md v2 order), then exact roundHalfUp of that double.
        value = stats({"base": inp["baseMilli"], "sources": inp["sources"], "categories": inp["categories"]})["value"]
        raw = math.floor(Fraction(value) + Fraction(1, 2))
        if raw < 1:
            raise OracleError("INVALID_NUMBER")
        return {"value": value, "rawMilli": raw}
    if op == "hitsToKill":
        hp, dmg = safe_int(inp["hp"]), safe_int(inp["damage"])
        if hp < 1 or dmg < 1:
            raise OracleError("INVALID_NUMBER")
        return {"result": -(-hp // dmg)}
    raise SystemExit(f"unknown combat op {op}")


# ---------------------------------------------------------------- canonical JSON (ECMAScript number formatting)
def js_number(x):
    if isinstance(x, bool):
        raise OracleError("INVALID_JSON_VALUE")
    x = float(x)
    if not math.isfinite(x):
        raise OracleError("INVALID_JSON_VALUE")
    if x == 0:
        return "0"
    sign, digits, exp = Decimal(repr(abs(x))).as_tuple()
    digits = list(digits)
    while len(digits) > 1 and digits[-1] == 0:
        digits.pop()
        exp += 1
    k, n = len(digits), exp + len(digits)
    s = "".join(map(str, digits))
    if k <= n <= 21:
        out = s + "0" * (n - k)
    elif 0 < n <= 21:
        out = s[:n] + "." + s[n:]
    elif -6 < n <= 0:
        out = "0." + "0" * (-n) + s
    else:
        e = n - 1
        out = s[0] + ("." + s[1:] if k > 1 else "") + "e" + ("+" if e > 0 else "-") + str(abs(e))
    return ("-" if x < 0 else "") + out


LONE = re.compile(r"[\ud800-\udfff]")
PRINTABLE = re.compile(r"^[\x20-\x7e]*$")


def canonical(v):
    if v is None:
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    if isinstance(v, (int, float)):
        return js_number(v)
    if isinstance(v, str):
        if LONE.search(v):
            raise OracleError("INVALID_JSON_VALUE")
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, list):
        return "[" + ",".join(canonical(x) for x in v) + "]"
    if isinstance(v, dict):
        parts = []
        for key in sorted(v):
            if not PRINTABLE.match(key):
                raise OracleError("INVALID_JSON_VALUE")
            parts.append(json.dumps(key) + ":" + canonical(v[key]))
        return "{" + ",".join(parts) + "}"
    raise OracleError("INVALID_JSON_VALUE")


def sha256(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def canonical_case(inp):
    text = canonical(inp["value"])
    return {"text": text, "sha256": sha256(text)}


# ---------------------------------------------------------------- ledger
RES = re.compile(r"^res(\.[a-z0-9_]+)+$")
PURPOSE = re.compile(r"^[a-z][a-z0-9_.-]{0,63}$")


def validate_tx(tx):
    if not isinstance(tx, dict) or set(tx) - {"txId", "purpose", "cause", "lines"}:
        raise OracleError("INVALID_TX")
    if not isinstance(tx.get("txId"), str) or not 1 <= len(tx["txId"]) <= 256:
        raise OracleError("INVALID_TX")
    if not isinstance(tx.get("purpose"), str) or not PURPOSE.match(tx["purpose"]):
        raise OracleError("INVALID_TX")
    if "cause" in tx and (not isinstance(tx["cause"], str) or len(tx["cause"]) > 256):
        raise OracleError("INVALID_TX")
    lines = tx.get("lines")
    if not isinstance(lines, list) or not 1 <= len(lines) <= 1000:
        raise OracleError("INVALID_TX")
    for line in lines:
        if not isinstance(line, dict) or set(line) - {"resourceId", "bucket", "delta"}:
            raise OracleError("INVALID_TX")
        if not isinstance(line.get("resourceId"), str) or not RES.match(line["resourceId"]):
            raise OracleError("INVALID_TX")
        if line.get("bucket") not in ("available", "reserved"):
            raise OracleError("INVALID_TX")
        d = line.get("delta")
        if isinstance(d, bool) or not isinstance(d, (int, float)) or (isinstance(d, float) and (not math.isfinite(d) or d != math.floor(d))) or abs(d) > MAX_SAFE:
            raise OracleError("INVALID_NUMBER")
        if d == 0:
            raise OracleError("INVALID_TX")


def ledger(inp):
    balances, committed, steps = {}, {}, []
    for tx in inp["txs"]:
        try:
            validate_tx(tx)
            h = sha256(canonical(tx))
            if tx["txId"] in committed:
                prior_hash, prior_nets = committed[tx["txId"]]
                if prior_hash != h:
                    raise OracleError("TX_CONFLICT")
                steps.append({"ok": True, "replayed": True, "nets": prior_nets})
                continue
            nets = {}
            for line in tx["lines"]:
                key = (line["resourceId"], line["bucket"])
                nets[key] = checked(nets.get(key, 0) + int(line["delta"]))
            new = {k: dict(v) for k, v in balances.items()}
            for (res, bucket), d in nets.items():
                if d == 0:
                    continue
                cur = new.setdefault(res, {"available": 0, "reserved": 0})
                after = cur[bucket] + d
                if after > MAX_SAFE:
                    raise OracleError("NUMERIC_LIMIT")
                if after < 0:
                    raise OracleError("NEGATIVE_BALANCE")
                cur[bucket] = after
            out = [{"resourceId": r, "bucket": b, "delta": d} for (r, b), d in sorted(nets.items()) if d != 0]
            balances = new
            committed[tx["txId"]] = (h, out)
            steps.append({"ok": True, "replayed": False, "nets": out})
        except OracleError as e:
            steps.append({"ok": False, "error": e.code})
    return {"steps": steps, "balances": {k: balances[k] for k in sorted(balances)}}


# ---------------------------------------------------------------- content (hash cross-check only)
def content(inp):
    table_hash = sha256(canonical(inp["table"]))
    if inp["pack"]["xp"]["table"]["sha256"] != table_hash:
        raise OracleError("INVALID_CONTENT")
    return {"ok": True, "tableHash": table_hash}


FAMILIES = {"numeric": numeric, "remainder": remainder, "stats": stats, "combat": combat, "ledger": ledger, "canonical-json": canonical_case, "content": content}


def close(expected, got, tol):
    if isinstance(got, float):
        got = Fraction(got)
    if isinstance(got, Fraction):
        if tol in (None, "exact"):
            return Fraction(expected) == got
        allowed = max(Fraction(tol.get("abs", 0)), Fraction(tol.get("rel", 0)) * abs(Fraction(expected)))
        return abs(Fraction(expected) - got) <= allowed
    if isinstance(got, dict):
        return isinstance(expected, dict) and set(expected) == set(got) and all(close(expected[k], got[k], tol) for k in got)
    if isinstance(got, list):
        return isinstance(expected, list) and len(expected) == len(got) and all(close(e, g, tol) for e, g in zip(expected, got))
    if isinstance(got, bool) or isinstance(expected, bool):
        return expected is got
    if isinstance(got, (int, float)) and isinstance(expected, (int, float)):
        return Fraction(expected) == Fraction(got)
    return expected == got


def check(path):
    data = json.load(open(path, encoding="utf-8"))
    family = data["fixtureSet"]
    fn = FAMILIES[family]
    bad = skipped = 0
    for case in data["cases"]:
        if family == "content" and "expectedError" in case:
            skipped += 1  # structural rule; hand-derived, see the case derivation
            continue
        try:
            got, err = fn(decode(case["input"])), None
        except OracleError as e:
            got, err = None, e.code
        if "expectedError" in case:
            ok = err == case["expectedError"]
        else:
            ok = err is None and close(case["expected"], got, case.get("tolerance"))
        if not ok:
            bad += 1
            shown = err if err is not None else json.dumps(got, default=lambda f: f"{f.numerator}/{f.denominator}")
            print(f"MISMATCH {case['id']}: oracle={shown}")
    print(f"exact_oracle {family}: {len(data['cases']) - skipped} cases checked, {skipped} hand-only, {bad} mismatches ({path})")
    return bad


def plain(value):
    """Converts oracle results to JSON: exact rationals become the nearest binary64 (only for cases where that is the declared expectation)."""
    if isinstance(value, Fraction):
        return int(value) if value.denominator == 1 else float(value)
    if isinstance(value, dict):
        return {k: plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [plain(v) for v in value]
    return value


def fill(draft, out):
    """Fills cases whose "expected" is the string "ORACLE" (used for SHA-256 values that cannot be derived by hand)."""
    data = json.load(open(draft, encoding="utf-8"))
    fn = FAMILIES[data["fixtureSet"]]
    for case in data["cases"]:
        if case.get("expected") == "ORACLE":
            case["expected"] = plain(fn(decode(case["input"])))
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"filled {out}")


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--check":
        sys.exit(1 if sum(check(p) for p in sys.argv[2:]) else 0)
    if len(sys.argv) == 4 and sys.argv[1] == "--fill":
        fill(sys.argv[2], sys.argv[3])
        sys.exit(0)
    raise SystemExit(__doc__)
