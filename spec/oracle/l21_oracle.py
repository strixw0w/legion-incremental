"""Independent L2.1 oracle (spec/formulas/l21-replay.md v2), written from the rule text with Python integers.

It does not reuse the lab's structures: the request window is derived from the full request history by definition
(the horizon is the largest sequence number of any removed receipt), credits are plain sets (the prefix is computed
by counting), producers are plain dictionaries of unit states, and the account is re-simulated from the formula text.

Families:
  l21-requests   the bounded window: expiry by acceptance time, count eviction, REQUEST_CLOSED, REQUEST_AHEAD.
  l21-credits    exact credit ownership with an admission window; abandonment.
  l21-lifecycle  producers: in-order units, outstanding and unit limits, closing, automatic retirement, no reuse.
  l21-delivery   whole deliveries through the synthetic account: envelope, advancement, atomic commands.

Usage:  python -I spec/oracle/l21_oracle.py --check <fixture.json> ...
        python -I spec/oracle/l21_oracle.py --fill <draft.json> <out.json>
Written by the same author as the lab code (not an independent party).
"""
import json
import re
import sys

MAX_SAFE = 2**53 - 1
MAX_TIME = 8_640_000_000_000_000
D = 10000 * 1000
DEFAULT_LIMITS = {"maxRecent": 256, "maxAgeMs": 86_400_000, "maxAhead": 1024, "maxStreams": 8, "creditWindow": 4096,
                  "maxCreditStreams": 8, "maxOpenProducers": 64, "maxUnits": 4096, "maxOutstanding": 64}
STREAM = re.compile(r"^[a-z0-9][a-z0-9:._-]{0,63}$")


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def is_int(v, lo=0, hi=MAX_SAFE):
    return isinstance(v, int) and not isinstance(v, bool) and lo <= v <= hi


def limits_of(x):
    lim = dict(DEFAULT_LIMITS)
    lim.update(x or {})
    if any(not is_int(v, 1) for v in lim.values()):
        raise OracleError("INVALID_NUMBER")
    return lim


# ---------------------------------------------------------------- the request window, by definition
class Window:
    def __init__(self, lim):
        self.lim = lim
        self.history = {}  # seq -> {"hash", "at", "removed", "receipt"}
        self.top = 0

    def horizon(self):
        return max([s for s, r in self.history.items() if r["removed"]], default=0)

    def expire(self, now):
        for r in self.history.values():
            if not r["removed"] and now - r["at"] >= self.lim["maxAgeMs"]:
                r["removed"] = True

    def classify(self, seq, h):
        if not is_int(seq, 1):
            return "INVALID_REQUEST"
        r = self.history.get(seq)
        if r is not None and not r["removed"]:
            return "REPLAY" if r["hash"] == h else "CONFLICTING_PAYLOAD"
        if seq <= self.horizon():
            return "REQUEST_CLOSED"
        if seq - self.top > self.lim["maxAhead"]:
            return "REQUEST_AHEAD"
        return "NEW"

    def record(self, seq, h, receipt, now):
        self.history[seq] = {"hash": h, "at": now, "removed": False, "receipt": receipt}
        self.top = max(self.top, seq)
        while True:
            live = sorted(s for s, r in self.history.items() if not r["removed"])
            if len(live) <= self.lim["maxRecent"]:
                break
            self.history[live[0]]["removed"] = True

    def receipts(self):
        live = [(r["at"], s) for s, r in self.history.items() if not r["removed"]]
        return [s for _, s in sorted(live)]


def requests(inp):
    lim = limits_of(inp.get("limits"))
    w, kinds, last = Window(lim), [], 0
    for st in inp["steps"]:
        if not is_int(st["nowMs"]) or st["nowMs"] < last:
            raise OracleError("INVALID_NUMBER")
        last = st["nowMs"]
        w.expire(st["nowMs"])
        k = w.classify(st["seq"], st["hash"])
        kinds.append(k)
        if k == "NEW":
            w.record(st["seq"], st["hash"], {"code": "OK"}, st["nowMs"])
    if "finalNowMs" in inp:
        w.expire(inp["finalNowMs"])
    return {"kinds": kinds, "horizon": w.horizon(), "top": w.top, "receipts": w.receipts()}


# ---------------------------------------------------------------- credits
def prefix(members):
    p = 0
    while p + 1 in members:
        p += 1
    return p


def encode(members):
    p = prefix(members)
    runs = []
    for x in sorted(m for m in members if m > p):
        if runs and x == runs[-1][1] + 1:
            runs[-1][1] = x
        else:
            runs.append([x, x])
    return {"p": p, "runs": runs}


def credit_state(streams, lim, stream, n):
    if not STREAM.match(stream) or not is_int(n, 1):
        return "INVALID_REQUEST"
    if stream not in streams and len(streams) >= lim["maxCreditStreams"]:
        return "CREDIT_STREAM_LIMIT"
    s = streams.get(stream, set())
    if n in s:
        return "CREDIT_REPLAYED"
    if n - prefix(s) > lim["creditWindow"]:
        return "CREDIT_AHEAD"
    return "NEW"


def credits(inp):
    lim = limits_of(inp.get("limits"))
    streams, codes, paid = {}, [], 0
    for st in inp["steps"]:
        c = credit_state(streams, lim, st["stream"], st["n"])
        if c != "NEW":
            codes.append(c)
            continue
        streams.setdefault(st["stream"], set()).add(st["n"])
        paid += 1 if st["op"] == "credit" else 0
        codes.append("APPLIED")
    return {"codes": codes, "paid": paid, "streams": {k: encode(v) for k, v in sorted(streams.items())}}


# ---------------------------------------------------------------- producers (plain dictionaries)
class Kind:
    def __init__(self, lim):
        self.lim = lim
        self.allocated = 0
        self.retired = set()
        self.open = {}  # n -> {"units": {u: state}, "closed": bool, "lines": {u: qty}}

    def refusal(self, n):
        if not is_int(n, 1) or n > self.allocated:
            return "PRODUCER_UNKNOWN"
        if n in self.retired:
            return "PRODUCER_RETIRED"
        return None

    def open_new(self):
        if len(self.open) >= self.lim["maxOpenProducers"]:
            return None
        self.allocated += 1
        self.open[self.allocated] = {"units": {}, "closed": False, "lines": {}}
        return self.allocated

    def max_unit(self, n):
        return max(self.open[n]["units"], default=0)

    def reserved(self, n):
        return sorted(u for u, s in self.open[n]["units"].items() if s == "reserved")

    def admit(self, n, u, op):
        """The refusal of a work operation, or None (spec 3.2 order)."""
        why = self.refusal(n)
        if why:
            return why
        if not is_int(u, 1) or op not in ("reserve", "complete", "release", "abandon"):
            return "INVALID_REQUEST"
        s = self.open[n]["units"].get(u, "none")
        how = {"completed": "complete", "released": "release", "abandoned": "abandon"}.get(s)
        if op == "reserve":
            r = None if s == "none" else "WORK_REPLAYED" if s == "reserved" else "WORK_INELIGIBLE"
        elif op in ("complete", "release"):
            r = None if s == "reserved" else "WORK_NOT_RESERVED" if s == "none" else ("WORK_REPLAYED" if how == op else "WORK_INELIGIBLE")
        else:
            r = None if s == "none" else ("WORK_REPLAYED" if how == "abandon" else "WORK_INELIGIBLE")
        if r:
            return r
        if s == "none":
            if self.open[n]["closed"]:
                return "PRODUCER_CLOSED"
            if u != self.max_unit(n) + 1:
                return "WORK_OUT_OF_ORDER"
            if u > self.lim["maxUnits"]:
                return "PRODUCER_FULL"
            if op == "reserve" and len(self.reserved(n)) >= self.lim["maxOutstanding"]:
                return "WORK_LIMIT"
        return None

    def retire_if_finished(self, n):
        p = self.open[n]
        if p["closed"] and not self.reserved(n):
            del self.open[n]
            self.retired.add(n)
            return True
        return False

    def summary(self):
        return {"allocated": self.allocated, "retired": sorted(self.retired)[:1000],
                "open": [{"producer": n, "maxUnit": self.max_unit(n), "reserved": self.reserved(n), "closed": self.open[n]["closed"]} for n in sorted(self.open)]}


def lifecycle(inp):
    lim = limits_of(inp.get("limits"))
    k, codes = Kind(lim), []
    for st in inp["ops"]:
        op, n = st["op"], st.get("producer")
        if op == "open":
            got = k.open_new()
            codes.append("PRODUCER_LIMIT" if got is None else f"OK:{got}")
            continue
        if op == "close":
            why = k.refusal(n)
            if why:
                codes.append(why)
            elif k.open[n]["closed"]:
                codes.append("PRODUCER_CLOSED")
            else:
                k.open[n]["closed"] = True
                codes.append("OK:retired" if k.retire_if_finished(n) else "OK")
            continue
        u = st.get("unit")
        why = k.admit(n, u, op)
        if why:
            codes.append(why)
            continue
        k.open[n]["units"][u] = {"reserve": "reserved", "complete": "completed", "release": "released", "abandon": "abandoned"}[op]
        if op != "reserve" and k.retire_if_finished(n):
            codes.append("OK:retired")
            continue
        codes.append("OK")
    return k.summary()


# ---------------------------------------------------------------- the synthetic account (spec section 4)
ECONOMY_V1 = {"actionMs": 36_000, "y0Milli": 1000, "y1Milli": 100, "expPerAction": 10, "expBase": 100, "maxLevel": 50,
              "featTiers": [{"threshold": 100, "bp": 5000}, {"threshold": 1000, "bp": 2500}, {"threshold": 10_000, "bp": 2500}],
              "efficiency": [{"fromMs": 0, "bp": 0}], "monumentBaseGold": 50, "monumentGrowthBp": 1500, "monumentBpPerLevel": 200,
              "monumentMaxLevel": 30, "recruitGold": 100, "maxGatherers": 8, "smithOrePerBar": 2, "smithUnitMs": 60_000, "craftBars": 5,
              "enhanceGoldPerLevel": 20, "emblemBp": 50}


def add(v, d):
    if v + d > MAX_SAFE:
        raise OracleError("NUMERIC_LIMIT")
    return v + d


def canonical(v):
    """True when the value is canonical JSON data (no floats, no non-finite numbers)."""
    if isinstance(v, bool) or v is None or isinstance(v, str):
        return True
    if isinstance(v, int):
        return abs(v) <= MAX_SAFE
    if isinstance(v, float):
        return False
    if isinstance(v, list):
        return all(canonical(x) for x in v)
    if isinstance(v, dict):
        return all(isinstance(k, str) and canonical(x) for k, x in v.items())
    return False


class Account:
    def __init__(self, e, lim, gatherers):
        if not is_int(gatherers, 1, e["maxGatherers"]):
            raise OracleError("INVALID_NUMBER")
        self.e, self.lim = e, lim
        self.t, self.ore, self.ore_res, self.bar, self.gold = 0, 0, 0, 0, 0
        self.life_ore, self.kills, self.requests, self.feats, self.mon = 0, 0, 0, [], 0
        self.items = {}
        self.g = [{"level": 1, "exp": 0, "rem": 0, "action": None} for _ in range(gatherers)]
        self.smith = None  # {"job", "quantity", "done", "unit"}
        self.streams = {}
        self.credits = {}
        self.kinds = {"batch": Kind(lim), "job": Kind(lim)}
        for i in range(gatherers):
            self.start(i)

    def eff(self, t):
        bp = 0
        for w in self.e["efficiency"]:
            if w["fromMs"] <= t:
                bp = w["bp"]
        return bp

    def start(self, i):
        x = self.g[i]
        y = self.e["y0Milli"] + self.e["y1Milli"] * (x["level"] - 1)
        bp = 10000 + sum(self.e["featTiers"][j]["bp"] for j in self.feats) + self.e["monumentBpPerLevel"] * self.mon + self.eff(self.t)
        x["action"] = (self.t, y * bp)

    def smith_start(self):
        s, k = self.smith, self.e["smithOrePerBar"]
        if s is None or s["unit"] is not None or s["done"] >= s["quantity"] or self.ore < k:
            return
        self.ore -= k
        self.ore_res += k
        s["unit"] = (self.t, s["done"] + 1)
        self.kinds["job"].open[s["job"]]["units"][s["done"] + 1] = "reserved"

    def advance(self, until):
        A, B, k = self.e["actionMs"], self.e["smithUnitMs"], self.e["smithOrePerBar"]
        while True:
            ends = [x["action"][0] + A for x in self.g if x["action"]]
            if self.smith and self.smith["unit"] is not None:
                ends.append(self.smith["unit"][0] + B)
            if not ends or min(ends) > until:
                break
            t = min(ends)
            self.t = t
            ended = []
            for i, x in enumerate(self.g):
                if x["action"] and x["action"][0] + A == t:
                    total = x["rem"] + x["action"][1]
                    units, x["rem"] = total // D, total % D
                    self.ore = add(self.ore, units)
                    self.life_ore = add(self.life_ore, units)
                    x["exp"] += self.e["expPerAction"]
                    while x["level"] < self.e["maxLevel"] and x["exp"] >= self.e["expBase"] * x["level"]:
                        x["exp"] -= self.e["expBase"] * x["level"]
                        x["level"] += 1
                    x["action"] = None
                    for j, tier in enumerate(self.e["featTiers"]):
                        if j not in self.feats and self.life_ore >= tier["threshold"]:
                            self.feats.append(j)
                    self.feats.sort()
                    ended.append(i)
            s = self.smith
            if s and s["unit"] is not None and s["unit"][0] + B == t:
                self.ore_res -= k
                self.bar += 1
                jk = self.kinds["job"]
                jk.open[s["job"]]["units"][s["unit"][1]] = "completed"
                s["done"] += 1
                s["unit"] = None
                if s["done"] >= s["quantity"]:
                    jk.open[s["job"]]["closed"] = True
                    jk.retire_if_finished(s["job"])
                    self.smith = None
            self.smith_start()
            for i in ended:
                self.start(i)
        self.t = max(self.t, until)

    def deliver(self, d):
        """Returns the outcome code (with the receipt code when there is a receipt)."""
        if not isinstance(d, dict) or d.get("type") not in ("request", "credit", "creditAbandon", "work"):
            return "INVALID_DELIVERY"
        if d.get("branch") != "main":
            return "BRANCH_MISMATCH" if isinstance(d.get("branch"), str) else "INVALID_DELIVERY"
        if not is_int(d.get("atMs"), 0, MAX_TIME):
            return "INVALID_DELIVERY"
        if d["atMs"] < self.t:
            return "TIME_BACKWARDS"
        if d["type"] != "work" and not (isinstance(d.get("stream"), str) and STREAM.match(d["stream"])):
            return "INVALID_DELIVERY"
        if d["type"] == "request" and not (isinstance(d.get("payload"), dict) and canonical(d["payload"])):
            return "INVALID_DELIVERY"
        # Part 2: advancement to the trusted time, then receipt expiry on every stream.
        self.advance(d["atMs"])
        for w in self.streams.values():
            w.expire(self.t)
        if d["type"] in ("credit", "creditAbandon"):
            if not is_int(d.get("n"), 1) or (d["type"] == "credit" and not is_int(d.get("gold"), 0, 10**9)):
                return "INVALID_REQUEST"
            c = credit_state(self.credits, self.lim, d["stream"], d["n"])
            if c != "NEW":
                return c
            self.credits.setdefault(d["stream"], set()).add(d["n"])
            if d["type"] == "credit":
                self.gold = add(self.gold, d["gold"])
                self.kills += 1
            return "APPLIED"
        if d["type"] == "work":
            k = self.kinds["batch"]
            n, u, op = d.get("producer"), d.get("unit"), d.get("op")
            why = k.admit(n, u, op)
            if why:
                return why
            if not is_int(d.get("qty"), 1, 10**9):
                return "INVALID_REQUEST"
            p = k.open[n]
            if op == "reserve":
                if self.ore < d["qty"]:
                    return "NOT_AFFORDABLE"
                self.ore -= d["qty"]
                self.ore_res += d["qty"]
                p["units"][u] = "reserved"
                p["lines"][u] = d["qty"]
            else:
                q = p["lines"].pop(u, 0)
                if op == "complete":
                    self.ore_res -= q
                    self.bar += q
                elif op == "release":
                    self.ore_res -= q
                    self.ore += q
                p["units"][u] = {"complete": "completed", "release": "released", "abandon": "abandoned"}[op]
                k.retire_if_finished(n)
            return "APPLIED"
        # A request.
        stream, seq = d["stream"], d.get("seq")
        h = json.dumps(d["payload"], sort_keys=True, separators=(",", ":"))
        if stream not in self.streams and len(self.streams) >= self.lim["maxStreams"]:
            kind = "STREAM_LIMIT" if is_int(seq, 1) else "INVALID_REQUEST"
        else:
            kind = self.streams.get(stream, Window(self.lim)).classify(seq, h)
        if kind == "REPLAY":
            return "REPLAY:" + self.streams[stream].history[seq]["receipt"]["code"]
        if kind != "NEW":
            return kind
        receipt = self.execute(d["payload"])
        self.requests += 1
        self.streams.setdefault(stream, Window(self.lim)).record(seq, h, receipt, self.t)
        return "APPLIED:" + receipt["code"]

    def execute(self, p):
        """Checks first, then the effects (a refusal changes nothing): spec section 4."""
        e, lim, kind = self.e, self.lim, p.get("kind")
        if kind == "settle":
            u = p.get("untilMs")
            if not is_int(u, 0, MAX_TIME):
                return {"code": "INVALID_REQUEST"}
            if u < self.t:
                return {"code": "SETTLE_BACKWARDS"}
            if u > self.t:
                return {"code": "SETTLE_AHEAD"}
            return {"code": "OK"}
        if kind == "monument":
            if p.get("levels") != 1:
                return {"code": "INVALID_REQUEST"}
            if self.mon >= e["monumentMaxLevel"]:
                return {"code": "MONUMENT_MAX_LEVEL"}
            cost = e["monumentBaseGold"]
            for _ in range(self.mon):
                cost = -(-cost * (10000 + e["monumentGrowthBp"]) // 10000)
            if self.gold < cost:
                return {"code": "NOT_AFFORDABLE"}
            self.gold -= cost
            self.mon += 1
            return {"code": "OK"}
        if kind == "recruit":
            if len(self.g) >= e["maxGatherers"]:
                return {"code": "ROSTER_FULL"}
            cost = e["recruitGold"] * len(self.g)
            if self.gold < cost:
                return {"code": "NOT_AFFORDABLE"}
            self.gold -= cost
            self.g.append({"level": 1, "exp": 0, "rem": 0, "action": None})
            self.start(len(self.g) - 1)
            return {"code": "OK"}
        if kind == "craft":
            if len(self.items) >= 1000:
                return {"code": "ITEM_LIMIT"}
            if self.bar < e["craftBars"]:
                return {"code": "NOT_AFFORDABLE"}
            self.bar -= e["craftBars"]
            self.items[f"item:{len(self.items) + 1}"] = 0
            return {"code": "OK"}
        if kind == "enhance":
            item, level = p.get("item"), p.get("level")
            if not isinstance(item, str) or not is_int(level, 1):
                return {"code": "INVALID_REQUEST"}
            if item not in self.items:
                return {"code": "ITEM_UNKNOWN"}
            if level != self.items[item] + 1:
                return {"code": "LEVEL_MISMATCH"}
            cost = e["enhanceGoldPerLevel"] * level
            if self.gold < cost or self.bar < 1:
                return {"code": "NOT_AFFORDABLE"}
            self.gold -= cost
            self.bar -= 1
            self.items[item] = level
            return {"code": "OK"}
        if kind == "createJob":
            q = p.get("quantity")
            if not is_int(q, 1, min(1_000_000, lim["maxUnits"])):
                return {"code": "INVALID_REQUEST"}
            if self.smith is not None:
                return {"code": "SMITH_BUSY"}
            job = self.kinds["job"].open_new()
            if job is None:
                return {"code": "PRODUCER_LIMIT"}
            self.smith = {"job": job, "quantity": q, "done": 0, "unit": None}
            self.smith_start()
            return {"code": "OK"}
        if kind == "cancelJob":
            job = p.get("job")
            if not is_int(job, 1):
                return {"code": "INVALID_REQUEST"}
            if self.smith is None or self.smith["job"] != job:
                return {"code": "JOB_NOT_ACTIVE"}
            jk = self.kinds["job"]
            if self.smith["unit"] is not None:
                self.ore_res -= e["smithOrePerBar"]
                self.ore += e["smithOrePerBar"]
                jk.open[job]["units"][self.smith["unit"][1]] = "released"
            jk.open[job]["closed"] = True
            jk.retire_if_finished(job)
            self.smith = None
            return {"code": "OK"}
        if kind == "openBatch":
            return {"code": "PRODUCER_LIMIT"} if self.kinds["batch"].open_new() is None else {"code": "OK"}
        if kind == "closeBatch":
            n, k = p.get("producer"), self.kinds["batch"]
            if not is_int(n, 1):
                return {"code": "INVALID_REQUEST"}
            why = k.refusal(n)
            if why:
                return {"code": why}
            if k.open[n]["closed"]:
                return {"code": "PRODUCER_CLOSED"}
            k.open[n]["closed"] = True
            k.retire_if_finished(n)
            return {"code": "OK"}
        if kind == "settleBatch":
            n, a, b, k = p.get("producer"), p.get("fromUnit"), p.get("toUnit"), self.kinds["batch"]
            if not (is_int(n, 1) and is_int(a, 1) and is_int(b, 1)) or b < a or b - a >= lim["maxOutstanding"]:
                return {"code": "INVALID_REQUEST"}
            why = k.refusal(n)
            if why:
                return {"code": why}
            for u in range(a, b + 1):
                s = k.open[n]["units"].get(u, "none")
                if s in ("completed", "released", "abandoned"):
                    return {"code": "BATCH_OVERLAP"}
                if s == "none":
                    return {"code": "WORK_NOT_RESERVED"}
            for u in range(a, b + 1):
                q = k.open[n]["lines"].pop(u, 0)
                self.ore_res -= q
                self.bar += q
                k.open[n]["units"][u] = "completed"
            k.retire_if_finished(n)
            return {"code": "OK"}
        return {"code": "INVALID_REQUEST"}


def delivery(inp):
    e = dict(ECONOMY_V1)
    e.update(inp.get("economy") or {})
    a = Account(e, limits_of(inp.get("limits")), inp["gatherers"])
    codes = [a.deliver(d) for d in inp["deliveries"]]
    s = a.smith
    return {"codes": codes, "final": {
        "t": a.t, "ore": a.ore, "oreReserved": a.ore_res, "bar": a.bar, "gold": a.gold, "lifetimeOre": a.life_ore, "kills": a.kills,
        "requests": a.requests, "feats": a.feats, "monument": a.mon, "levels": [x["level"] for x in a.g], "items": len(a.items),
        "smith": {"job": s["job"] if s else None, "quantity": s["quantity"] if s else 0, "done": s["done"] if s else 0, "busy": bool(s and s["unit"] is not None)},
        "batch": a.kinds["batch"].summary(), "job": a.kinds["job"].summary()}}


FAMILIES = {"l21-requests": requests, "l21-credits": credits, "l21-lifecycle": lifecycle, "l21-delivery": delivery}


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
            print(f"MISMATCH {case['id']}: oracle={err if err else json.dumps(got)[:400]}")
    print(f"l21_oracle {data['fixtureSet']}: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
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
