"""Independent S3 oracle (spec/formulas/s3-industry.md v1), written from the formula text with Python integers.

Families:
  industry-rules    efficiency, gathering deposits, unit time, item stats, enhancement cost, salvage, effective shares
  equipment-ops     character modifiers, auto-equip plan, consume check, weapon compatibility
  recipe-validation (v1.1) the per-recipe content rules: no duplicate lines, summed bounds, safe intermediates
  production-queue  a discrete-event model of the O10 production queue (FIFO / reserve-all / round-robin arms) with one
                    optional gatherer, commands at given times and session boundaries

Usage:  python -I spec/oracle/s3_oracle.py --check <fixture.json> ...
        python -I spec/oracle/s3_oracle.py --fill <draft.json> <out.json>   (fills "expected": "ORACLE")
"""
import json
import sys

TIER_ORDER = {"tier.wood": 1, "tier.copper": 2, "tier.iron": 3, "tier.steel": 4, "tier.gold": 5, "tier.mithril": 6}
SLOTS = ["weapon", "helmet", "chestplate", "leggings", "boots", "accessory", "pickaxe", "axe", "hammer"]
TOOLS = {"pickaxe", "axe", "hammer"}
AFFINITY = {"warrior": "mining", "archer": "smithing", "mage": "woodcutting"}
TOOL_FOR = {"mining": "pickaxe", "woodcutting": "axe", "smithing": "hammer"}


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def rules(inp):
    r = inp.get("rules", {})
    return {
        "table": r.get("table", [10, 30, 58, 92, 131, 176]),
        "perLevel": r.get("efficiencyPerLevelBp", 400),
        "affinityBp": r.get("affinityBp", 2500),
        "stepBp": r.get("stepBp", 1000),
        "goldBase": r.get("goldBase", 20),
        "materialByTier": r.get("materialByTier", {"tier.wood": "res.mat.plank", "tier.copper": "res.mat.copper_bar"}),
        "salvageBp": r.get("salvageReturnBp", 5000),
        "exclusiveBp": r.get("exclusiveWeaponBp", 0),
    }


def defs(inp):
    out = {}
    for d in inp.get("defs", []):
        out[d["id"]] = {
            "slot": d["slot"], "tier": d["tier"], "order": TIER_ORDER[d["tier"]], "max": d.get("maxEnhancement", 5), "classes": d.get("classes"),
            "attack": d.get("attackMilli", 0), "defence": d.get("defence", 0), "hp": d.get("hp", 0), "crit": d.get("critBp", 0), "eff": d.get("efficiencyBp", 0),
        }
    return out


def need(D, i):
    if i not in D:
        raise OracleError("INVALID_CONTENT")
    return D[i]


def items(inp):
    out = []
    for n, it in enumerate(inp.get("items", []), start=1):
        loc = ("equipped", it["equip"]["characterId"], it["equip"]["slot"]) if "equip" in it else (it.get("location", "inventory"),)
        out.append({"id": f"item:{n}", "n": n, "def": it["defId"], "enh": it.get("enhancement", 0), "protected": it.get("protected", False), "loc": loc})
    return out


def level(table, exp):
    lv, left = 1, exp
    for t in table:
        if left < t:
            break
        left -= t
        lv += 1
    return lv


def stats(d, enh, step):
    f = lambda v: (v * (10000 + step * enh)) // 10000
    return {"attackMilli": f(d["attack"]), "defence": f(d["defence"]), "hp": f(d["hp"]), "critBp": f(d["crit"]), "efficiencyBp": f(d["eff"])}


def equipped(its, who, slot):
    for it in its:
        if it["loc"][0] == "equipped" and it["loc"][1] == who and it["loc"][2] == slot:
            return it
    return None


def industry_rules(inp):
    R, D = rules(inp), defs(inp)
    op = inp["op"]
    if op == "efficiency":
        who, prof, cls = inp.get("characterId", "rec:1"), inp["profession"], inp.get("cls", "none")
        lv = level(R["table"], inp.get("profExp", {}).get(who, {}).get(prof, 0))
        tool = equipped(items(inp), who, TOOL_FOR[prof])
        tool_eff = stats(D[tool["def"]], tool["enh"], R["stepBp"])["efficiencyBp"] if tool else 0
        aff = R["affinityBp"] if cls != "none" and AFFINITY[cls] == prof else 0
        return {"efficiencyBp": (lv - 1) * R["perLevel"] + tool_eff + aff}
    if op == "gather-deposits":
        rem, dep = 0, []
        for e in inp["efficiencies"]:
            total = rem + inp["baseYieldMilli"] * (10000 + e)
            dep.append(total // 10**7)
            rem = total % 10**7
        return {"deposits": dep, "remainder": rem}
    if op == "unit-time":
        return {"unitMs": -((-inp["unitMs"] * 10000) // (10000 + inp["efficiencyBp"]))}
    if op == "item-stats":
        return stats(need(D, inp["defId"]), inp["enhancement"], R["stepBp"])
    if op == "enhancement-cost":
        d = need(D, inp["defId"])
        n = inp["level"] + 1
        if d["tier"] not in R["materialByTier"]:
            raise OracleError("INVALID_CONTENT")
        return {"gold": R["goldBase"] * n * n, "materialId": R["materialByTier"][d["tier"]], "materialQty": n}
    if op == "salvage":
        out = []
        for line in inp["recoverable"]:
            q = (line["qty"] * R["salvageBp"]) // 10000
            if q > 0:
                out.append({"resourceId": line["resourceId"], "qty": q})
        return {"returns": out}
    if op == "effective-shares-fractional":
        d, H = inp["damages"], inp["hpRemoved"]
        total = sum(d)
        if total <= H:
            return {"shares": list(d)}
        return {"shares": [(x * H) / total for x in d]}
    if op == "effective-shares":
        d, H = inp["damages"], inp["hpRemoved"]
        total = sum(d)
        if total <= H:
            return {"shares": list(d)}
        shares = [(x * H) // total for x in d]
        left = H - sum(shares)
        order = sorted(range(len(d)), key=lambda i: (-((d[i] * H) % total), i))
        for i in order[:left]:
            shares[i] += 1
        return {"shares": shares}
    raise OracleError("UNKNOWN_OP")


def score(D, it, step):
    s = stats(D[it["def"]], it["enh"], step)
    return s["attackMilli"] + 1000 * s["defence"] + 200 * s["hp"] + s["critBp"] + s["efficiencyBp"]


def compatible(d, cls):
    return d["classes"] is None or cls in d["classes"]


def equipment_ops(inp):
    R, D = rules(inp), defs(inp)
    its = items(inp)
    op = inp["op"]
    if op == "mods":
        who = inp["characterId"]
        a = hp = de = cr = 0
        for it in its:
            if it["loc"][0] == "equipped" and it["loc"][1] == who and it["loc"][2] not in TOOLS:
                s = stats(D[it["def"]], it["enh"], R["stepBp"])
                a, hp, de, cr = a + s["attackMilli"], hp + s["hp"], de + s["defence"], cr + s["critBp"]
        if who == "hero" and R["exclusiveBp"]:
            a = (a * (10000 + R["exclusiveBp"])) // 10000
        return {"attackFlatMilli": a, "hpFlat": hp, "defenceFlat": de, "critBp": cr}
    if op == "auto-equip":
        who, cls = inp["characterId"], inp.get("cls", "none")
        plan = []
        for slot in SLOTS:
            cur = equipped(its, who, slot)
            best, best_score = None, score(D, cur, R["stepBp"]) if cur else -1
            for it in its:
                d = D[it["def"]]
                if it["loc"][0] != "inventory" or d["slot"] != slot or (slot == "weapon" and not compatible(d, cls)):
                    continue
                sc = score(D, it, R["stepBp"])
                if sc > best_score:
                    best, best_score = it, sc
            if best:
                plan.append(f"{slot}={best['id']}")
        return {"plan": plan}
    if op == "consume-check":
        target = need(D, inp["targetDefId"])
        it = next((x for x in its if x["id"] == inp["itemId"]), None)
        if it is None:
            return {"reason": "ITEM_UNKNOWN"}
        d = D[it["def"]]
        if it["loc"][0] == "equipped":
            return {"reason": "ITEM_EQUIPPED"}
        if it["loc"][0] != "inventory":
            return {"reason": "ITEM_UNAVAILABLE"}
        if it["protected"]:
            return {"reason": "ITEM_PROTECTED"}
        if d["slot"] != target["slot"] or d["order"] >= target["order"]:
            return {"reason": "CONSUME_ITEM_INVALID"}
        return {"reason": None}
    if op == "weapon-compatible":
        return {"compatible": compatible(need(D, inp["defId"]), inp.get("cls", "none"))}
    raise OracleError("UNKNOWN_OP")


# ---------------------------------------------------------------- production queue (s3-industry.md section 4)
def production_queue(q):
    sessions = q["sessions"]
    prev = 0
    for s in sessions:
        if s["startMs"] < prev or s["endMs"] <= s["startMs"]:
            raise OracleError("INVALID_STATE")
        prev = s["endMs"]
    arm, unit_ms, until = q["arm"], q["unitMs"], q["untilMs"]
    smiths = [f"rec:{i + 1}" for i in range(len(q["smiths"]))]
    eff = {f"rec:{i + 1}": (q["hammerEffBp"] if s["hammer"] else 0) for i, s in enumerate(q["smiths"])}
    gatherer = f"rec:{len(smiths) + 1}" if q["gatherer"] else None
    assign = {s: "smithing" for s in smiths}
    st = {"avail": q["startLogs"], "res": 0, "planks": 0}
    jobs, work, ev = [], {}, []
    g = {"end": None, "rem": 0}
    open_ = {"v": False}
    utime = lambda who: -((-unit_ms * 10000) // (10000 + eff[who]))

    def job(jid):
        n = int(jid.split(":")[1]) if jid.startswith("job:") and jid.split(":")[1].isdigit() else 0
        return jobs[n - 1] if 1 <= n <= len(jobs) else None

    def release(who, reason):
        w = work.pop(who)
        j = job(w["job"])
        if arm != "reserve-all" or reason == "CANCELLED":
            units = j["reserved"] if arm == "reserve-all" else 1
            if units > 0:
                st["avail"] += 2 * units
                st["res"] -= 2 * units
            j["reserved"] -= units
        j["state"] = "cancelled" if reason == "CANCELLED" else "queued"
        ev.append([w["t"], "UnitReleased", j["id"], who, w["id"], reason])

    def run_pass(t):
        for sm in smiths:
            if assign[sm] != "smithing" or sm in work:
                continue
            order = [j for j in jobs if j["state"] in ("queued", "paused-shortage")]
            order.sort(key=lambda j: ((j["served"] if arm == "round-robin" else 0), j["enq"], j["n"]))
            for j in order:
                was_paused = j["state"] == "paused-shortage"
                if j["reserved"] == 0:
                    units = j["qty"] - j["done"] if arm == "reserve-all" else 1
                    if st["avail"] < 2 * units:
                        if j["state"] != "paused-shortage" or j["shortage"] != "res.mat.log":
                            j["state"], j["shortage"] = "paused-shortage", "res.mat.log"
                            ev.append([t, "JobPaused", j["id"], "res.mat.log"])
                        continue
                    st["avail"] -= 2 * units
                    st["res"] += 2 * units
                    j["reserved"] = units
                j["started"] += 1
                j["served"] += 1
                j["state"], j["shortage"] = "active", None
                wid = f"{j['id']}/u{j['started']}"
                work[sm] = {"id": wid, "job": j["id"], "end": t + utime(sm), "t": t}
                if was_paused:
                    ev.append([t, "JobResumed", j["id"]])
                ev.append([t, "UnitStarted", j["id"], sm, wid])
                break

    def has_open():
        return any(j["state"] not in ("complete", "cancelled") for j in jobs)

    cmd_times = sorted({c["atMs"] for c in q["commands"]})
    times = set(cmd_times)
    for s in sessions:
        times.update([s["startMs"], s["endMs"]])
    t = -1
    while True:
        cands = [x for x in times if x > t]
        cands += [w["end"] for w in work.values() if w["end"] > t]
        if g["end"] is not None and g["end"] > t:
            cands.append(g["end"])
        if not cands:
            break
        t = min(cands)
        if t >= until:
            break
        pass_q = False
        # BOUNDARY: a session ending at t, then one starting at t
        for s in sessions:
            if s["endMs"] == t and open_["v"]:
                g["end"] = None
                for who in smiths:
                    if who in work:
                        w = work[who]
                        w["t"] = t
                        release(who, "SESSION_ENDED")
                open_["v"] = False
        for s in sessions:
            if s["startMs"] == t:
                open_["v"] = True
                if gatherer:
                    g["end"] = t + q["gatherer"]["actionMs"]
                if any(assign[s2] == "smithing" for s2 in smiths) or has_open():
                    pass_q = True
        if not open_["v"]:
            continue
        # COMPLETE + CREDIT (settlements in character-ID order)
        done_units = sorted([who for who, w in work.items() if w["end"] == t])
        settle = [(who, "unit") for who in done_units]
        if gatherer and g["end"] == t:
            settle.append((gatherer, "gather"))
        settle.sort(key=lambda x: x[0])
        for who, kind in settle:
            if kind == "unit":
                w = work.pop(who)
                j = job(w["job"])
                st["res"] -= 2
                st["planks"] += 1
                j["done"] += 1
                j["reserved"] -= 1
                fin = j["done"] >= j["qty"]
                j["state"] = "cancelled" if j["state"] == "cancelled" else ("complete" if fin else "queued")
                j["shortage"] = None
                ev.append([t, "UnitCompleted", j["id"], who, w["id"]])
                if fin:
                    ev.append([t, "JobCompleted", j["id"]])
                pass_q = True
            else:
                total = g["rem"] + q["gatherer"]["yieldMilli"] * 10000
                units, g["rem"] = total // 10**7, total % 10**7
                st["avail"] += units
                g["end"] = t + q["gatherer"]["actionMs"]
                if units > 0 and any(j["state"] in ("queued", "paused-shortage") for j in jobs):
                    pass_q = True
        if pass_q:
            run_pass(t)
        # POLICY: commands in order, then a pass if any command asked for one
        if t in cmd_times:
            pass_q = False
            for c in [c for c in q["commands"] if c["atMs"] == t]:
                if c["type"] == "enqueue":
                    if not (1 <= c["quantity"] <= 1000):
                        ev.append([t, "CommandRejected", "Enqueue", "BAD_QUANTITY"])
                        continue
                    jobs.append({"id": f"job:{len(jobs) + 1}", "n": len(jobs) + 1, "qty": c["quantity"], "done": 0, "enq": t, "state": "queued", "started": 0, "reserved": 0, "served": 0, "shortage": None})
                    pass_q = True
                elif c["type"] == "cancel":
                    j = job(c["jobId"])
                    if j is None:
                        ev.append([t, "CommandRejected", "CancelJob", "JOB_UNKNOWN"])
                        continue
                    if j["state"] in ("complete", "cancelled"):
                        ev.append([t, "CommandRejected", "CancelJob", "JOB_FINISHED"])
                        continue
                    for who in smiths:
                        if who in work and work[who]["job"] == j["id"]:
                            work[who]["t"] = t
                            release(who, "CANCELLED")
                    if j["reserved"] > 0:
                        st["avail"] += 2 * j["reserved"]
                        st["res"] -= 2 * j["reserved"]
                    j["reserved"], j["state"] = 0, "cancelled"
                    ev.append([t, "JobCancelled", j["id"]])
                    pass_q = True
                else:
                    who, to = c["member"], c["to"]
                    if assign.get(who) == to:
                        ev.append([t, "CommandRejected", "Assign", "ALREADY_ASSIGNED"])
                        continue
                    old = assign[who]
                    if who in work:
                        work[who]["t"] = t
                        release(who, "REASSIGNED")
                    assign[who] = to
                    if to == "smithing" or old == "smithing":
                        pass_q = True
            if pass_q:
                run_pass(t)
    return {"events": ev, "logs": st["avail"], "logsReserved": st["res"], "planks": st["planks"], "jobs": [f"{j['id']}:{j['state']}:{j['done']}/{j['qty']}" for j in jobs]}


# ---------------------------------------------------------------- recipe validation (s3-industry.md v1.1 section 7)
MAX_SAFE = 2**53 - 1


def recipe_validation(inp):
    """Validates the case's recipes by the v1.1 rules; the defaults (one plank recipe, the hammer and the club recipes)
    fill whatever the case does not cover and are valid by construction."""
    def total(lines):
        out = {}
        for res, q in lines:
            out[res] = out.get(res, 0) + q
        return out
    covered = set()
    for r in inp["recipes"]:
        timed = r["kind"] == "timed"
        lists = [r["inputs"], r.get("outputs", [])] if timed else [r["inputs"], r.get("recoverable", [])]
        for ls in lists:
            ids = [res for res, _ in ls]
            if len(set(ids)) != len(ids):
                raise OracleError("INVALID_CONTENT")
            for _, q in ls:
                if q * 1000 > MAX_SAFE or q * 10000 > MAX_SAFE:
                    raise OracleError("INVALID_CONTENT")
        ins = total(r["inputs"])
        if timed:
            if r.get("unitMs", 4000) * 10000 > MAX_SAFE:
                raise OracleError("INVALID_CONTENT")
            for res, q in total(r.get("outputs", [])).items():
                if ins.get(res, 0) > 0 and q >= ins[res]:
                    raise OracleError("INVALID_CONTENT")
            covered.add(("id", r["id"]))
        else:
            for res, q in total(r.get("recoverable", [])).items():
                if q > ins.get(res, 0):
                    raise OracleError("INVALID_CONTENT")
            covered.add(("item", r["itemId"]))
    defaults = [("id", "recipe.plank"), ("item", "item.wood.hammer"), ("item", "item.wood.club")]
    return {"valid": True, "recipes": len([d for d in defaults if d not in covered]) + len(inp["recipes"])}


FAMILIES = {"industry-rules": industry_rules, "equipment-ops": equipment_ops, "production-queue": production_queue, "recipe-validation": recipe_validation}


def check(path):
    data = json.load(open(path, encoding="utf-8"))
    fn, bad = FAMILIES[data["fixtureSet"]], 0
    for case in data["cases"]:
        try:
            got, err = fn(case["input"]), None
        except OracleError as e:
            got, err = None, e.code
        ok = (err == case["expectedError"]) if "expectedError" in case else (err is None and case["expected"] == got)
        if not ok:
            bad += 1
            print(f"MISMATCH {case['id']}: oracle={err if err else json.dumps(got)}")
    print(f"s3_oracle {data['fixtureSet']}: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
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
