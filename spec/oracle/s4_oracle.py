"""Independent S4 oracle (spec/formulas/s4-permanent.md v1 and v1.1), written from the formula text with Python integers
(and the stats.md v2 binary64 order with exact rational rounding for the attack).

Families:
  permanent-rules       Monument cost and bonus tables, the price of k levels, the legal sequential Buy Max (checked
                        here against a brute force over every k), the permanent stat pools (attack, max HP, crit,
                        ability), and the reward conditions with exactly-once grants.
  permanent-acceptance  The S4 acceptance corrections (v1.1 section 9): checked lifetime counters and the permanent part
                        of a kill credit (A), canonical and effective bonus metadata and grouping (B), the regional
                        mastery rank (C).

Usage:  python -I spec/oracle/s4_oracle.py --check <fixture.json> ...
        python -I spec/oracle/s4_oracle.py --fill <draft.json> <out.json>   (fills "expected": "ORACLE")
"""
import json
import sys
from fractions import Fraction

MAX_SAFE = 2**53 - 1


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def costs(base, growth, max_level):
    out, c = [], base
    for _ in range(max_level):
        if c > MAX_SAFE:
            raise OracleError("INVALID_CONTENT")
        out.append(c)
        num = c * (10000 + growth)
        if num > MAX_SAFE:
            raise OracleError("INVALID_CONTENT")
        c = -(-num // 10000)
    return out


def bonuses(tiers, max_level):
    out, total = [0], 0
    for level in range(1, max_level + 1):
        tier = next((t for t in tiers if level <= t["toLevel"]), None)
        if tier is None:
            raise OracleError("INVALID_CONTENT")
        total += tier["perLevelBp"]
        out.append(total)
    return out


def price(m, level, k):
    cs = costs(m["baseGold"], m["growthBp"], m["maxLevel"])
    ms = {x["level"]: x["materials"] for x in m.get("milestones", [])}
    gold, mats = sum(cs[level:level + k]), {}
    for lv in range(level + 1, level + k + 1):
        for q in ms.get(lv, []):
            mats[q["resourceId"]] = mats.get(q["resourceId"], 0) + q["qty"]
    return {"gold": gold, "materials": [{"resourceId": r, "qty": mats[r]} for r in sorted(mats)]}


def affordable(m, level, k, bal):
    p = price(m, level, k)
    return p["gold"] <= bal.get("res.gold", 0) and all(q["qty"] <= bal.get(q["resourceId"], 0) for q in p["materials"])


def buy_max(m, level, bal):
    """The largest k such that every prefix 1..k is within maxLevel and affordable (brute force over every k)."""
    best = 0
    for k in range(1, m["maxLevel"] - level + 1):
        if not affordable(m, level, k, bal):
            break
        best = k
    # The sequential walk must agree with the brute force (the prefix property: costs are positive, so once a prefix
    # fails every longer one fails too); checked here explicitly.
    longest = max([k for k in range(0, m["maxLevel"] - level + 1) if all(affordable(m, level, j, bal) for j in range(1, k + 1))], default=0)
    assert longest == best
    return best


def round_div(a, b):
    return (2 * a + b) // (2 * b)


def round_half_up(v):
    f = Fraction(v)
    return (f + Fraction(1, 2)).__floor__()


def stats(inp):
    r, level, cls, p = inp["rules"], inp["level"], inp["cls"], inp.get("perm", {})
    steps = level - 1
    A, Ma, H, Mh, K, P = (p.get(k, 0) for k in ("attackBp", "monumentAttackBp", "hpBp", "monumentHpBp", "critBp", "abilityBp"))
    base_atk = r["baseAttackMilli"] + r["attackPerLevelMilli"] * steps
    # stats.md v2: categories in ascending ID order, cat.damage.additive (active) then cat.damage.monument (active only
    # when it has a source); each non-neutral factor is two binary64 operations: v = v * (10000 + sum) / 10000.
    v = float(base_atk)
    add = (r["classAttackBp"] if cls != "none" else 0) + A
    if add != 0:
        v = (v * (10000 + add)) / 10000
    if Ma != 0:
        v = (v * (10000 + Ma)) / 10000
    atk = round_half_up(v)
    base_hp = r["baseMaxHp"] + r["maxHpPerLevel"] * steps
    if cls == "none":
        pool = base_hp if H == 0 else max(1, round_div(base_hp * (10000 + H), 10000))
    else:
        pool = max(1, round_div(base_hp * (10000 + r["classHpBp"] + H), 10000))
    max_hp = pool if Mh == 0 else max(1, round_div(pool * (10000 + Mh), 10000))
    crit = min(r["critChanceBp"] + (r["classCritBp"] if cls != "none" else 0) + K, 10000)
    ability = None if cls == "none" else max(1, round_div(atk * (r["abilityMultBp"] + P), 10000))
    return {"attackRawMilli": atk, "maxHp": max_hp, "critChanceBp": crit, "abilityRawMilli": ability}


def earned(reward, f):
    c = reward["condition"]
    kind = c["kind"]
    kills = lambda e: f["bestiary"].get(e, {}).get("kills", 0)
    if kind == "counter":
        return f["counters"][c["counter"]] >= c["threshold"]
    if kind == "bestiary":
        return kills(c["enemyId"]) >= c["kills"]
    if kind == "emblem":
        return f["bestiary"].get(c["enemyId"], {}).get("emblems", 0) >= 1
    if kind == "regionCompletion":
        return all(kills(e) >= 1 for e in c["species"])
    if kind == "regionMastery":
        return all(kills(e) >= c["kills"][e] for e in c["species"])
    if kind == "classRecord":
        return f["records"][c["cls"]] >= c["record"]
    raise OracleError("INVALID_STATE")


def permanent_rules(inp):
    op = inp["op"]
    if op == "monument-costs":
        return {"costs": costs(inp["baseGold"], inp["growthBp"], inp["maxLevel"])}
    if op == "monument-bonuses":
        return {"bonusAt": bonuses(inp["tiers"], inp["maxLevel"])}
    if op == "price":
        m, level, k = inp["monument"], inp["level"], inp["levels"]
        if k < 1 or level + k > m["maxLevel"]:
            raise OracleError("INVALID_STATE")
        return price(m, level, k)
    if op == "buy-max":
        m, level, bal = inp["monument"], inp["level"], inp["balances"]
        k = buy_max(m, level, bal)
        return {"levels": k, **price(m, level, k)}
    if op == "stats":
        return stats(inp)
    if op == "milestones":
        granted = set(inp.get("granted", []))
        return {"earned": sorted(r["id"] for r in inp["rewards"] if r["id"] not in granted and earned(r, inp["facts"]))}
    raise OracleError("INVALID_STATE")


# ---------------------------------------------------------------- S4 acceptance corrections (v1.1 section 9)
def counter_add(value, delta):
    """9.1: both operands non-negative integers no larger than 2^53 - 1; the exact sum must be no larger either."""
    for v in (value, delta):
        if not isinstance(v, int) or isinstance(v, bool) or v < 0 or v > MAX_SAFE:
            raise OracleError("INVALID_NUMBER")
    if value + delta > MAX_SAFE:
        raise OracleError("NUMERIC_LIMIT")
    return value + delta


CANONICAL = {"attack": "cat.damage.additive", "monumentAttack": "cat.damage.monument", "maxHp": "pool.hp", "monumentHp": "factor.monument.hp",
             "critChance": "pool.crit", "abilityPower": "pool.ability", "gatherEfficiency": "pool.efficiency.gather", "smithEfficiency": "pool.efficiency.smith"}
STAT = {"attack": "attack", "monumentAttack": "attack", "maxHp": "maxHp", "monumentHp": "maxHp", "critChance": "critChance", "abilityPower": "abilityPower",
        "gatherEfficiency": "gatherEfficiency", "smithEfficiency": "smithEfficiency"}


def applied_category(pooling, target):
    """9.2: with additive pooling Power joins the additive attack pool and Vitality the HP bp sum; otherwise canonical."""
    if pooling == "additive" and target == "monumentAttack":
        return CANONICAL["attack"]
    if pooling == "additive" and target == "monumentHp":
        return CANONICAL["maxHp"]
    return CANONICAL[target]


def permanent_acceptance(inp):
    op = inp["op"]
    if op == "counter-add":
        return {"value": counter_add(inp["value"], inp["delta"])}
    if op == "kill-credit":
        c = inp["counters"]
        kills = counter_add(c["accountKills"], 1)
        gold = counter_add(c["goldEarned"], inp["gold"])
        if inp["boss"]:
            return {"accountKills": kills, "goldEarned": gold, "kills": inp["kills"], "discovered": False}
        return {"accountKills": kills, "goldEarned": gold, "kills": counter_add(inp["kills"], 1), "discovered": inp["kills"] == 0}
    if op == "applied-groups":
        pooling = inp["pooling"]
        rows = [("reward:" + r["id"], r["target"], r["bp"]) for r in sorted(inp["rewards"], key=lambda r: r["id"])]
        for m in inp["monuments"]:
            targets = {"attack": ["monumentAttack"], "maxHp": ["monumentHp"], "efficiency": ["gatherEfficiency", "smithEfficiency"]}[m["target"]]
            rows += [(f"monument:{m['id']}:{t}", t, m["bonusBp"]) for t in targets]
        sources = [[sid, CANONICAL[t], STAT[t], applied_category(pooling, t), bp] for sid, t, bp in rows]
        groups, order = {}, []
        for _, _, stat, cat, bp in sources:
            if (stat, cat) not in groups:
                order.append((stat, cat))
                groups[(stat, cat)] = 0
            groups[(stat, cat)] = counter_add(groups[(stat, cat)], bp)
        return {"sources": sources, "groups": [[s, c, groups[(s, c)]] for s, c in order]}
    if op == "mastery":
        version, rank = inp["schemaVersion"], inp.get("requiredRank")
        if version == 2:
            if rank is None:
                raise OracleError("INVALID_CONTENT")
        else:
            if rank is not None:
                raise OracleError("INVALID_CONTENT")
            rank = "gold"
        species = {s["enemyId"]: s["ranks"] for s in inp["species"]}
        kills = {}
        for e in inp["regionSpecies"]:
            if e not in species:
                raise OracleError("INVALID_CONTENT")
            hit = [r["kills"] for r in species[e] if r["rank"] == rank]
            if not hit:
                raise OracleError("INVALID_CONTENT")
            kills[e] = hit[0]
        return {"rank": rank, "kills": kills}
    raise OracleError("INVALID_STATE")


FAMILIES = {"permanent-rules": permanent_rules, "permanent-acceptance": permanent_acceptance}


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
    print(f"s4_oracle {data['fixtureSet']}: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
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
