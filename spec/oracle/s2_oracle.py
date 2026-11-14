"""Independent S2 oracle (spec/formulas/s2-legion.md v1). Python standard library only; run with `python -I`.

Families:
  squad-fight    one squad encounter re-derived with a plain time loop from the spec text: character stats from the
                 class table, blows and enemy attacks on their own clocks, threat order, simultaneous resolution from
                 the state before each instant, knockouts, eligibility at the kill. Exact Fraction arithmetic.
  legion-credit  multi-character credit identity: pending claims with their eligible sets, classification before any
                 draw, ONE reward roll per accepted credit on the stream's own loot generator (independent RNG of
                 rng_oracle.py), full EXP to every eligible character, mastery to the held class only.
  worker-feasibility    (S2.1) the ability-aware structural bound and the classification of a worker's estimate
                        (s2-legion.md v1.1 section 6).
  ledger-reconstruction (S2.1) chronological transaction outcomes, then validated reconstruction with EXACT
                        conservation (Python integers are unbounded; ledger.md v1.2).
Written from the Markdown specs, not from the lab's TypeScript.

Usage:  python -I s2_oracle.py --check FIXTURE.json [...]      python -I s2_oracle.py --fill DRAFT OUT
"""
import importlib.util
import json
import math
import os
import sys
from fractions import Fraction

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("rng_oracle", os.path.join(HERE, "rng_oracle.py"))
rng = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rng)


def rhu(x):
    """roundHalfUp of a non-negative Fraction."""
    return math.floor(x + Fraction(1, 2))


def damage(raw_milli, k, defence, min_damage):
    return max(min_damage, rhu(Fraction(raw_milli * k, 1000 * (k + defence))))


THREAT_CLASSLESS = 1


def stats(hero, classes, level, cls):
    steps = level - 1
    base_hp = hero["baseMaxHp"] + hero["maxHpPerLevel"] * steps
    base_def = hero["baseDefence"] + hero["defencePerLevel"] * steps
    base_atk = hero["baseAttackMilli"] + hero["attackPerLevelMilli"] * steps
    if cls is None:
        return {"hp": base_hp, "def": base_def, "atk": rhu(Fraction(base_atk)), "interval": hero["attackIntervalMs"], "threat": THREAT_CLASSLESS, "ability": None}
    c = classes[cls]
    atk = rhu(Fraction(base_atk * (10000 + c["attackBp"]), 10000))
    return {
        "hp": max(1, rhu(Fraction(base_hp * (10000 + c["hpBp"]), 10000))),
        "def": base_def + c["defenceFlat"] + (hero["defencePerLevel"] * steps * c["defencePerLevelBp"]) // 10000,
        "atk": atk,
        "interval": c["attackIntervalMs"],
        "threat": c["threatRank"],
        "ability": {"atk": max(1, rhu(Fraction(atk * c["ability"]["multBp"], 10000))), "cd": c["ability"]["cooldownMs"]},
    }


def squad_fight(inp):
    hero, e, k, md = inp["hero"], inp["enemy"], inp["K"], inp["minDamage"]
    if e["hp"] < 1 or e["attackMilli"] < 1:
        raise rng.OracleError("INVALID_CONTENT")
    classes = {c["id"]: c for c in inp["classes"]}
    chars = [{"id": "hero", "order": 0, **stats(hero, classes, hero["level"], hero.get("cls"))}]
    for i, r in enumerate(inp["recruits"]):
        chars.append({"id": f"rec:{i + 1}", "order": i + 1, **stats(hero, classes, r["level"], r.get("cls"))})
    for c in chars:
        c["hpNow"], c["down"] = c["hp"], False
    a, until = inp["entryWalkMs"], inp["untilMs"]
    ehp = e["hp"]
    blows, hits, kos = [], [], []
    clocks = []  # (time, character, kind)
    for c in chars:
        clocks.append([a, c, "swing"])
        if c["ability"] is not None and c["id"] != "hero":  # recruits cast on cooldown; the hero's ability is manual
            clocks.append([a, c, "ability"])
    te = a + e["firstAttackDelayMs"]
    while True:
        live = [x for x in clocks if not x[1]["down"]]
        t = min([x[0] for x in live] + [te])
        if t >= until:
            return {"outcome": "none", "endMs": None, "blows": blows, "enemyHits": hits, "knockouts": kos, "awards": []}
        now = sorted([x for x in live if x[0] == t], key=lambda x: (x[1]["order"], 0 if x[2] == "swing" else 1))
        attack = te == t
        dealt = []
        for x in now:
            raw = x[1]["atk"] if x[2] == "swing" else x[1]["ability"]["atk"]
            d = damage(raw, k, e["defence"], md)
            dealt.append(d)
            blows.append([t, x[1]["id"], x[2], d])
        target = None
        if attack:
            alive = sorted([c for c in chars if not c["down"]], key=lambda c: (c["threat"], c["order"]))
            target = alive[0]
            hd = damage(e["attackMilli"], k, target["def"], md)
            hits.append([t, target["id"], hd])
        eligible = [c["id"] for c in chars if not c["down"]]  # before this instant's knockouts
        ehp = max(0, ehp - sum(dealt))
        if target is not None:
            target["hpNow"] = max(0, target["hpNow"] - hd)
        killed = len(now) > 0 and ehp == 0
        hero_died = target is not None and target["id"] == "hero" and target["hpNow"] == 0
        if target is not None and target["id"] != "hero" and target["hpNow"] == 0:
            target["down"] = True
            kos.append([t, target["id"]])
        if killed:
            return {"outcome": "bothDied" if hero_died else "enemyKilled", "endMs": t, "blows": blows, "enemyHits": hits, "knockouts": kos, "awards": eligible}
        if hero_died:
            return {"outcome": "heroDied", "endMs": t, "blows": blows, "enemyHits": hits, "knockouts": kos, "awards": []}
        for x in now:
            x[0] += x[1]["interval"] if x[2] == "swing" else x[1]["ability"]["cd"]
        if attack:
            te += e["attackIntervalMs"]


def roll(s, enemy):
    lines = [["res.gold", enemy["gold"]]] if enemy["gold"] > 0 else []
    for d in enemy["drops"]:
        u, s = rng.next_u32(s)
        if u < rng.threshold_bp(d["chanceBp"]):
            lines.append([d["resourceId"], d["qty"]])
    return lines, s, len(enemy["drops"])


def legion_credit(inp):
    root = inp["seedRoot"]
    streams = {}

    def stream_state(name):
        if name not in streams:
            entity = "account" if name == "squad" else name
            streams[name] = rng.derive({"root": root, "purpose": "loot", "entity": entity, "counter": 0})
        return streams[name]

    cls = {c["id"]: c.get("cls") for c in inp["characters"]}
    exp = {c["id"]: 0 for c in inp["characters"]}
    mastery = {c["id"]: {"warrior": 0, "archer": 0, "mage": 0} for c in inp["characters"]}
    pending, committed = [], {}
    out, kills, totals, draws = [], {}, {}, {}
    for ev in inp["events"]:
        if ev["op"] == "class":
            cls[ev["id"]] = ev["cls"]
            continue
        claim = (ev["encounterId"], ev["instanceId"], ev["zoneOrder"], ev["boss"], ev["stream"])
        cid = f"kill:{ev['encounterId']}:{ev['instanceId']}"
        if ev["op"] == "kill":
            pending.append((claim, list(ev["eligible"])))
            continue
        match = [p for p in pending if f"kill:{p[0][0]}:{p[0][1]}" == cid]
        if match:
            if match[0][0] != claim:
                out.append("CREDIT_CONFLICT")
                continue
            pending.remove(match[0])
            eligible = match[0][1]
        elif cid in committed:
            out.append("CREDIT_REPLAYED" if committed[cid] == claim else "CREDIT_CONFLICT")
            continue
        else:
            out.append("CREDIT_UNKNOWN")
            continue
        enemy = inp["enemies"]["boss" if claim[3] else str(claim[2])]
        lines, s, n = roll(stream_state(claim[4]), enemy)
        streams[claim[4]] = s
        draws[claim[4]] = draws.get(claim[4], 0) + n
        for r, q in lines:
            totals[r] = totals.get(r, 0) + q
        for cid_ in eligible:
            exp[cid_] += enemy["exp"]
            if cls[cid_] is not None:
                mastery[cid_][cls[cid_]] += enemy["exp"]
        if not claim[3]:
            kills[str(claim[2])] = kills.get(str(claim[2]), 0) + 1
        committed[cid] = claim
        out.append("credited")
    return {"outcomes": out, "exp": exp, "mastery": mastery, "kills": dict(sorted(kills.items())), "totals": dict(sorted(totals.items())), "lootDraws": dict(sorted(draws.items())), "committed": len(committed), "pending": len(pending)}


# ---------------------------------------------------------------- S2.1: worker feasibility (s2-legion.md v1.1 section 6)
def worker_feasibility(inp):
    """Ability-aware structural feasibility of one worker fight, and the classification of its estimate. Certain hits,
    no crits (fixtures are deterministic). basicCanWin re-derives estimator v1.2 for that single fight outcome."""
    hero, e, k, md = inp["hero"], inp["enemy"], inp["K"], inp["minDamage"]
    if e["hp"] < 1 or e["attackMilli"] < 1:
        raise rng.OracleError("INVALID_CONTENT")
    classes = {c["id"]: c for c in inp["classes"]}
    w = inp["worker"]
    st = stats(hero, classes, w["level"], w.get("cls"))
    swing = damage(st["atk"], k, e["defence"], md)
    hit = damage(e["attackMilli"], k, st["def"], md)
    R = -(-st["hp"] // hit)
    T = e["firstAttackDelayMs"] + (R - 1) * e["attackIntervalMs"]
    bound = swing * (T // st["interval"] + 1)
    if st["ability"] is not None:
        bound += damage(st["ability"]["atk"], k, e["defence"], md) * (T // st["ability"]["cd"] + 1)
    # estimator v1.2 on basic attacks, one certain outcome: n swings, first-swing delay max(0, interval - overhead)
    n = -(-e["hp"] // swing)
    ttk = max(0, st["interval"] - inp["overheadMs"]) + (n - 1) * st["interval"]
    hits = (ttk - e["firstAttackDelayMs"]) // e["attackIntervalMs"] + 1 if ttk >= e["firstAttackDelayMs"] else 0
    simultaneous = hits > 0 and (ttk - e["firstAttackDelayMs"]) % e["attackIntervalMs"] == 0
    basic = hits < R or (hits == R and simultaneous)
    proven = bound < e["hp"]
    if st["ability"] is None:
        reach = "reachable" if basic else "unreachable"
    else:
        reach = "reachable" if basic else ("unreachable" if proven else "unresolved")
    return {"knockoutMs": T, "damageBound": bound, "provenImpossible": proven, "basicCanWin": basic, "reachability": reach}


# ---------------------------------------------------------------- S2.1: ledger reconstruction (ledger.md v1.2)
M = 2**53 - 1
RES = __import__("re").compile(r"^res(\.[a-z0-9_]+)+$")
BUCKETS = ("available", "reserved")


def _canon(tx):
    return json.dumps(tx, sort_keys=True, separators=(",", ":"))


def _reconstruct(data):
    """Validated reconstruction: structure, order, ranges, and EXACT conservation (Python integers are unbounded)."""
    def bad():
        raise rng.OracleError("INVALID_STATE")

    if not isinstance(data, dict) or sorted(data) != ["balances", "committed", "schema"] or data["schema"] != "legion.ledger.v1":
        bad()
    balances, prev = {}, None
    for entry in data["balances"]:
        if not (isinstance(entry, list) and len(entry) == 2 and isinstance(entry[0], str) and RES.match(entry[0])):
            bad()
        rid, b = entry
        if prev is not None and not rid > prev:
            bad()
        prev = rid
        if not isinstance(b, dict) or sorted(b) != list(BUCKETS):
            bad()
        for bk in BUCKETS:
            v = b[bk]
            if isinstance(v, bool) or not isinstance(v, int) or v < 0 or v > M:
                bad()
        balances[rid] = (b["available"], b["reserved"])
    sums, prev = {}, None
    for entry in data["committed"]:
        if not (isinstance(entry, list) and len(entry) == 2 and isinstance(entry[0], str) and 1 <= len(entry[0]) <= 256):
            bad()
        tid, rec = entry
        if prev is not None and not tid > prev:
            bad()
        prev = tid
        if not isinstance(rec, dict) or sorted(rec) != ["nets", "payloadHash"] or not __import__("re").fullmatch(r"[0-9a-f]{64}", str(rec["payloadHash"])):
            bad()
        pn = None
        for n in rec["nets"]:
            if not (isinstance(n, list) and len(n) == 3 and isinstance(n[0], str) and RES.match(n[0]) and n[1] in BUCKETS):
                bad()
            d = n[2]
            if isinstance(d, bool) or not isinstance(d, int) or d == 0 or abs(d) > M:
                bad()
            key = (n[0], n[1])
            if pn is not None and not key > pn:
                bad()
            pn = key
            sums[key] = sums.get(key, 0) + d
    for rid, (av, rs) in balances.items():
        if sums.get((rid, "available"), 0) != av or sums.get((rid, "reserved"), 0) != rs:
            bad()
    for (rid, _), s in sums.items():
        if rid not in balances and s != 0:
            bad()
    return {r: [a, b] for r, (a, b) in sorted(balances.items())}


def ledger_reconstruction(inp):
    if "serialized" in inp:
        return {"reconstruction": "ok", "balances": _reconstruct(inp["serialized"])}
    bal, committed, steps = {}, {}, []
    for tx in inp["txs"]:
        if tx["txId"] in committed:
            steps.append("replayed" if committed[tx["txId"]][0] == _canon(tx) else "TX_CONFLICT")
            continue
        nets = {}
        for line in tx["lines"]:
            key = (line["resourceId"], line["bucket"])
            nets[key] = nets.get(key, 0) + line["delta"]
        new, err = dict(bal), None
        for (rid, bk), d in nets.items():
            if d == 0:
                continue
            a, r = new.get(rid, (0, 0))
            after = (a if bk == "available" else r) + d
            if after > M:
                err = "NUMERIC_LIMIT"
                break
            if after < 0:
                err = "NEGATIVE_BALANCE"
                break
            new[rid] = (after, r) if bk == "available" else (a, after)
        if err:
            steps.append(err)
            continue
        bal = new
        committed[tx["txId"]] = (_canon(tx), sorted((k[0], k[1], d) for k, d in nets.items() if d != 0))
        steps.append("ok")
    serialized = {
        "schema": "legion.ledger.v1",
        "balances": [[rid, {"available": a, "reserved": r}] for rid, (a, r) in sorted(bal.items())],
        "committed": [[tid, {"payloadHash": "0" * 64, "nets": [list(n) for n in nets]}] for tid, (_, nets) in sorted(committed.items())],
    }
    return {"steps": steps, "balances": {r: [a, b] for r, (a, b) in sorted(bal.items())}, "reconstruction": "ok", "reconstructedBalances": _reconstruct(serialized)}


FAMILIES = {"squad-fight": squad_fight, "legion-credit": legion_credit, "worker-feasibility": worker_feasibility, "ledger-reconstruction": ledger_reconstruction}


def check(path):
    data = json.load(open(path, encoding="utf-8"))
    fn, bad = FAMILIES[data["fixtureSet"]], 0
    for case in data["cases"]:
        try:
            got, err = fn(case["input"]), None
        except rng.OracleError as e:
            got, err = None, e.code
        ok = (err == case["expectedError"]) if "expectedError" in case else (err is None and case["expected"] == got)
        if not ok:
            bad += 1
            print(f"MISMATCH {case['id']}: oracle={err if err else json.dumps(got)}")
    print(f"s2_oracle {data['fixtureSet']}: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
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
