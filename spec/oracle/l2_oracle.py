"""Independent L2 oracle (spec/formulas/l2-replay.md v1), written from the formula text with Python integers.

Families:
  l2-ranges      range sets: normal form after additions, membership, gaps; an overlapping addition is refused whole.
  l2-requests    request streams: classification in rule order, recording, eviction by count or age, the horizon.
  l2-work        work operations on producers: the transition table, retirement, no reuse.
  l2-settlement  chronological settlement of the synthetic economy (spec section 4): work-start capture, Feat tiers,
                 level-ups, Monument purchases, recruits, efficiency windows, the smith queue; partition invariance is
                 checked by the lab side (every listed partition must give this single-run result).

Usage:  python -I spec/oracle/l2_oracle.py --check <fixture.json> ...
        python -I spec/oracle/l2_oracle.py --fill <draft.json> <out.json>
"""
import json
import sys

MAX_SAFE = 2**53 - 1
D = 10000 * 1000


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def add(v, d):
    if v + d > MAX_SAFE:
        raise OracleError("NUMERIC_LIMIT")
    return v + d


# ---------------------------------------------------------------- 1. ranges (as a plain set, then re-encoded)
def encode(members):
    p = 0
    while p + 1 in members:
        p += 1
    runs, rest = [], sorted(x for x in members if x > p)
    for x in rest:
        if runs and x == runs[-1][1] + 1:
            runs[-1][1] = x
        else:
            runs.append([x, x])
    return p, runs


def ranges(inp):
    members = set()
    for a, b in inp["adds"]:
        if a < 1 or b < a:
            raise OracleError("INVALID_RANGE")
        if any(x in members for x in range(a, b + 1)):
            raise OracleError("RANGE_OVERLAP")
        members.update(range(a, b + 1))
    p, runs = encode(members)
    # Gaps between consecutive members (interval arithmetic: members may be near 2^53).
    gaps, prev = [], 0
    for x in sorted(members):
        if x > prev + 1:
            gaps.append([prev + 1, x - 1])
        prev = x
    return {"p": p, "runs": runs, "gaps": gaps, "member": [q in members for q in inp["queries"]]}


# ---------------------------------------------------------------- 2. request streams
def requests(inp):
    max_recent, max_age = inp["policy"]["maxRecent"], inp["policy"]["maxAgeMs"]
    if not isinstance(max_recent, int) or max_recent < 1 or not isinstance(max_age, int) or max_age < 0:
        raise OracleError("INVALID_NUMBER")
    settled, recent, closed = set(), {}, 0
    kinds = []
    for st in inp["steps"]:
        seq, h = st["seq"], st["hash"]
        if not isinstance(seq, int) or seq < 1 or seq > MAX_SAFE:
            k = "INVALID_REQUEST"
        elif seq in settled:
            if seq in recent:
                k = "REPLAY" if recent[seq][0] == h else "CONFLICTING_PAYLOAD"
            else:
                k = "REPLAY_TOO_OLD"
        elif seq <= closed:
            k = "REQUEST_EXPIRED"
        else:
            k = "NEW"
        kinds.append(k)
        if k == "NEW":
            settled.add(seq)
            recent[seq] = (h, st["atMs"])
            while recent:
                low = min(recent)
                if len(recent) > max_recent or recent[low][1] < st["nowMs"] - max_age:
                    del recent[low]
                    closed = max(closed, low)
                else:
                    break
    p, runs = encode(settled)
    return {"kinds": kinds, "closedBelow": closed, "recent": sorted(recent), "settled": {"p": p, "runs": runs}}


# ---------------------------------------------------------------- 3. work operations
def work(inp):
    allocated, retired = inp["allocated"], set()
    if not isinstance(allocated, int) or allocated < 0:
        raise OracleError("INVALID_NUMBER")
    units = {}  # (n, u) -> 'reserved' | 'completed' | 'released' | 'abandoned'
    codes = []
    for step in inp["ops"]:
        n = step["producer"]
        if n < 1 or n > allocated:
            codes.append("PRODUCER_UNKNOWN")
            continue
        if n in retired:
            codes.append("PRODUCER_RETIRED")
            continue
        op = step["op"]
        if op == "retire":
            mine = {u: s for (m, u), s in units.items() if m == n}
            if any(s == "reserved" for s in mine.values()):
                codes.append("RETIRE_OPEN_WORK")
            elif sorted(mine) != list(range(1, len(mine) + 1)):
                codes.append("RETIRE_GAP")
            else:
                retired.add(n)
                codes.append("OK")
            continue
        u = step["unit"]
        s = units.get((n, u), "none")
        settled_as = {"completed": "complete", "released": "release", "abandoned": "abandon"}.get(s)
        if op == "reserve":
            code = "OK" if s == "none" else "WORK_REPLAYED" if s == "reserved" else "WORK_INELIGIBLE"
            if code == "OK":
                units[(n, u)] = "reserved"
        elif op in ("complete", "release"):
            if s == "reserved":
                code = "OK"
                units[(n, u)] = "completed" if op == "complete" else "released"
            elif s == "none":
                code = "WORK_NOT_RESERVED"
            else:
                code = "WORK_REPLAYED" if settled_as == op else "WORK_INELIGIBLE"
        else:  # abandon
            if s == "none":
                code = "OK"
                units[(n, u)] = "abandoned"
            else:
                code = "WORK_REPLAYED" if settled_as == "abandon" else "WORK_INELIGIBLE"
        codes.append(code)
    return {"codes": codes, "retired": sorted(retired)}


# ---------------------------------------------------------------- 4. chronological settlement (spec section 4)
def settlement(inp):
    e = inp["economy"]
    A, B, k = e["actionMs"], e["smithUnitMs"], e["smithOrePerBar"]
    tiers = e["featTiers"]
    g = [{"level": 1, "exp": 0, "rem": 0, "action": None} for _ in range(inp["gatherers"])]
    st = {"t": 0, "ore": 0, "oreRes": 0, "bar": 0, "gold": 0, "lifeOre": 0, "feats": [], "mon": 0, "smith": None}

    def eff(t):
        bp = 0
        for w in e["efficiency"]:
            if w["fromMs"] <= t:
                bp = w["bp"]
        return bp

    def start(i):
        x = g[i]
        y = e["y0Milli"] + e["y1Milli"] * (x["level"] - 1)
        bp = 10000 + sum(tiers[j]["bp"] for j in st["feats"]) + e["monumentBpPerLevel"] * st["mon"] + eff(st["t"])
        if bp < 0:
            raise OracleError("INVALID_STATE")
        x["action"] = (st["t"], y * bp)

    def smith_start():
        s = st["smith"]
        if s is None or s["unit"] is not None or s["done"] >= s["quantity"] or st["ore"] < k:
            return
        st["ore"] -= k
        st["oreRes"] += k
        s["unit"] = st["t"]

    def advance(until):
        while True:
            ends = [x["action"][0] + A for x in g if x["action"]]
            if st["smith"] and st["smith"]["unit"] is not None:
                ends.append(st["smith"]["unit"] + B)
            if not ends or min(ends) > until:
                break
            t = min(ends)
            st["t"] = t
            ended = []
            for i, x in enumerate(g):
                if x["action"] and x["action"][0] + A == t:
                    total = x["rem"] + x["action"][1]
                    units, x["rem"] = total // D, total % D
                    st["ore"] = add(st["ore"], units)
                    st["lifeOre"] = add(st["lifeOre"], units)
                    x["exp"] += e["expPerAction"]
                    while x["level"] < e["maxLevel"] and x["exp"] >= e["expBase"] * x["level"]:
                        x["exp"] -= e["expBase"] * x["level"]
                        x["level"] += 1
                    x["action"] = None
                    for j, tier in enumerate(tiers):
                        if j not in st["feats"] and st["lifeOre"] >= tier["threshold"]:
                            st["feats"].append(j)
                    st["feats"].sort()
                    ended.append(i)
            s = st["smith"]
            if s and s["unit"] is not None and s["unit"] + B == t:
                st["oreRes"] -= k
                st["bar"] += 1
                s["done"] += 1
                s["unit"] = None
                if s["done"] >= s["quantity"]:
                    st["smith"] = None
            smith_start()
            for i in ended:
                start(i)
        st["t"] = max(st["t"], until)

    for i in range(len(g)):
        start(i)
    jobs = 0
    for d in sorted(inp["schedule"], key=lambda x: x["atMs"]):
        advance(d["atMs"])
        kind = d["kind"]
        if kind == "credit":
            st["gold"] = add(st["gold"], d["gold"])
        elif kind == "monument":
            cost = e["monumentBaseGold"]
            for _ in range(st["mon"]):
                cost = -(-cost * (10000 + e["monumentGrowthBp"]) // 10000)
            if st["mon"] < e["monumentMaxLevel"] and st["gold"] >= cost:
                st["gold"] -= cost
                st["mon"] += 1
        elif kind == "recruit":
            cost = e["recruitGold"] * len(g)
            if len(g) < e["maxGatherers"] and st["gold"] >= cost:
                st["gold"] -= cost
                g.append({"level": 1, "exp": 0, "rem": 0, "action": None})
                start(len(g) - 1)
        elif kind == "createJob":
            if st["smith"] is None:
                jobs += 1
                st["smith"] = {"job": jobs, "quantity": d["quantity"], "done": 0, "unit": None}
                smith_start()
        elif kind == "cancelJob":
            s = st["smith"]
            if s is not None and s["job"] == d["job"]:
                if s["unit"] is not None:
                    st["oreRes"] -= k
                    st["ore"] += k
                st["smith"] = None
    advance(inp["untilMs"])
    return {"t": st["t"], "ore": st["ore"], "oreReserved": st["oreRes"], "bar": st["bar"], "gold": st["gold"], "lifetimeOre": st["lifeOre"], "feats": st["feats"], "monument": st["mon"],
            "levels": [x["level"] for x in g], "remainders": [x["rem"] for x in g]}


FAMILIES = {"l2-ranges": ranges, "l2-requests": requests, "l2-work": work, "l2-settlement": settlement}


def check(path):
    data = json.load(open(path, encoding="utf-8"))
    fn, bad = FAMILIES[data["fixtureSet"]], 0
    for case in data["cases"]:
        try:
            got, err = fn(case["input"]), None
        except OracleError as ex:
            got, err = None, ex.code
        ok = (err == case["expectedError"]) if "expectedError" in case else (err is None and case["expected"] == got)
        if not ok:
            bad += 1
            print(f"MISMATCH {case['id']}: oracle={err if err else json.dumps(got)}")
    print(f"l2_oracle {data['fixtureSet']}: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
    return bad


def fill(draft, out):
    data = json.load(open(draft, encoding="utf-8"))
    for case in data["cases"]:
        if case.get("expected") == "ORACLE":
            case["expected"] = FAMILIES[data["fixtureSet"]](case["input"])
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
