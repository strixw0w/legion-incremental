"""Independent S1 / S1.1 oracle (spec/formulas/s1-combat-loop.md v1.1, gates.md v1.1, estimator.md v1.1). Python
standard library only; run with `python -I`.

Families:
  combat-loop  one fight, re-derived with a plain time loop: swings at arrival + k*interval, enemy attacks at
               arrival + firstAttackDelay + j*enemyInterval, simultaneous blows resolved from the state before them,
               nothing at or after the session end (half-open session). Damage is exact (fractions.Fraction).
  gates        command validation in the order written in gates.md section 4 (v1.1 adds Report).
  rewards      kill reward rolls: one loot draw per drop entry, using the independent RNG of rng_oracle.py; v1.1 adds
               drop EVENTS per resource and awarded TOTALS per resource.
  credits      (S1.1) kill-credit identity: pending / committed registry, classified before any draw.
  estimator    (S1.1) displayed rates: swing distribution, the exact survival chain and the reliability rules.
Written from the Markdown specs, not from the lab's TypeScript.

Usage:  python -I s1_oracle.py --check FIXTURE.json [...]      python -I s1_oracle.py --fill DRAFT OUT
"""
import importlib.util
import json
import math
import os
import sys
from fractions import Fraction

sys.dont_write_bytecode = True  # importing rng_oracle must not leave __pycache__ in spec/
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("rng_oracle", os.path.join(HERE, "rng_oracle.py"))
rng = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rng)


def damage(raw_milli, crit, crit_mult_bp, num, den, min_damage):
    c = crit_mult_bp if crit else 10000
    v = Fraction(raw_milli * c * num, 10**7 * den)
    return max(min_damage, math.floor(v + Fraction(1, 2)))


def fight(inp):
    h, e = inp["hero"], inp["enemy"]
    k, md = inp["K"], inp["minDamage"]
    if h.get("attackMilli", 6000) < 1 or e["hp"] < 1 or e["attackMilli"] < 1:
        raise rng.OracleError("INVALID_CONTENT")  # content rules: attack >= 1 thousandth, enemy HP >= 1
    crit_bp = h.get("critChanceBp", 0)
    if 0 < crit_bp < 10000:
        raise SystemExit("combat-loop fixtures must use crit chance 0 or >= 10000 (deterministic)")
    hero_dmg = damage(h.get("attackMilli", 6000), crit_bp >= 10000, h.get("critMultBp", 15000), k, k + e["defence"], md)
    enemy_dmg = damage(e["attackMilli"], False, 10000, k, k + h.get("defence", 0), md)
    interval = h.get("attackIntervalMs", 1200)
    arrival, until = inp["entryWalkMs"], inp["untilMs"]
    ehp, hhp = e["hp"], h.get("maxHp", 60)
    swings, hits = [], []
    ts, te = arrival, arrival + e["firstAttackDelayMs"]
    while True:
        t = min(ts, te)
        if t >= until:
            return {"outcome": "none", "endMs": None, "swings": swings, "enemyHits": hits, "enemyHp": ehp, "heroHp": hhp}
        swing, attack = ts == t, te == t
        if swing:  # both computed from the state before this instant; applied together
            swings.append([t, hero_dmg])
        if attack:
            hits.append([t, enemy_dmg])
        if swing:
            ehp = max(0, ehp - hero_dmg)
        if attack:
            hhp = max(0, hhp - enemy_dmg)
        killed, died = swing and ehp == 0, attack and hhp == 0
        if killed or died:
            outcome = "bothDied" if killed and died else ("enemyKilled" if killed else "heroDied")
            return {"outcome": outcome, "endMs": t, "swings": swings, "enemyHits": hits, "enemyHp": ehp, "heroHp": hhp}
        if swing:
            ts += interval
        if attack:
            te += e["attackIntervalMs"]


ZONES = {"zone.f.z1": 1, "zone.f.z2": 2, "zone.f.z3": 3}
CHECKPOINTS = {"cp.f.z1": 1, "cp.f.z2": 2, "cp.f.z3": 3}
BOSS_GATE, BOSS_ZONE = "gate.f.boss", 3


def validate(st, cmd):
    def common():
        if not st["sessionOpen"]:
            return "NOT_IN_SESSION"
        if st["heroStatus"] == "dead":
            return "DEAD"
        if st["heroStatus"] in ("travelling", "boss"):
            return "BUSY"
        return None

    z = st["zones"]
    kind = cmd["type"]
    if kind == "SetAutoFarm":
        if not cmd["on"]:
            return None if st["sessionOpen"] else "NOT_IN_SESSION"
        return common() or ("ZONE_UNKNOWN" if cmd["zoneId"] not in ZONES else ("NOT_IN_ZONE" if ZONES[cmd["zoneId"]] != st["heroZone"] else None))
    if kind == "Engage":
        return common() or ("ALREADY_ENGAGED" if st["heroStatus"] != "idle" else None)
    if kind == "Travel":
        c = common()
        if c:
            return c
        if cmd["zoneId"] not in ZONES:
            return "ZONE_UNKNOWN"
        o = ZONES[cmd["zoneId"]]
        if not z[o - 1]["access"]:
            return "ZONE_NOT_ACCESSIBLE"
        if o == st["heroZone"]:
            return "ALREADY_THERE"
        if abs(o - st["heroZone"]) != 1:
            return "ZONE_NOT_ADJACENT"
        return None
    if kind == "Teleport":
        c = common()
        if c:
            return c
        if cmd["checkpointId"] not in CHECKPOINTS or not z[CHECKPOINTS[cmd["checkpointId"]] - 1]["checkpoint"]:
            return "CHECKPOINT_UNKNOWN"
        return "ALREADY_THERE" if CHECKPOINTS[cmd["checkpointId"]] == st["heroZone"] else None
    if kind == "Rest":
        return common()
    if kind == "StartBoss":
        c = common()
        if c:
            return c
        if cmd["gateId"] != BOSS_GATE:
            return "GATE_UNKNOWN"
        if not st["bossOpened"]:
            return "GATE_LOCKED"
        if st["bossCompleted"]:
            return "GATE_ALREADY_COMPLETED"
        if st["heroZone"] != BOSS_ZONE:
            return "NOT_IN_ZONE"
        if st["autoFarm"]:
            return "GATE_ACTIVE_ONLY"
        if st["heroStatus"] not in ("idle", "resting"):
            return "ALREADY_ENGAGED"
        return None
    if kind == "EndSession":
        return None if st["sessionOpen"] else "NOT_IN_SESSION"
    if kind == "Report":  # gates.md v1.1
        if not st["sessionOpen"]:
            return "NOT_IN_SESSION"
        return None if cmd["code"] in ("NO_SAFE_ZONE", "FIXED_ZONE_BLOCKED") else "REPORT_UNKNOWN"
    raise SystemExit(f"unknown command {kind}")


def gates(inp):
    code = validate(inp["state"], inp["command"])
    return {"ok": True} if code is None else {"ok": False, "code": code}


def roll(s, enemy):
    """One kill's reward: gold line, then one draw per drop entry in listed order. Returns (lines, events, state, draws)."""
    lines = [["res.gold", enemy["gold"]]] if enemy["gold"] > 0 else []
    events = []
    for d in enemy["drops"]:
        u, s = rng.next_u32(s)
        if u < rng.threshold_bp(d["chanceBp"]):
            lines.append([d["resourceId"], d["qty"]])
            events.append(d["resourceId"])
    return lines, events, s, len(enemy["drops"])


def rewards(inp):
    s = rng.derive({"root": inp["seedRoot"], "purpose": "loot", "entity": "account", "counter": 0})
    enemy, kills, events, totals = inp["enemy"], [], {}, {}
    for _ in range(inp["kills"]):
        lines, evs, s, _ = roll(s, enemy)
        kills.append(lines)
        for r, q in lines:
            totals[r] = totals.get(r, 0) + q
        for r in evs:
            events[r] = events.get(r, 0) + 1
    return {"kills": kills, "events": dict(sorted(events.items())), "totals": dict(sorted(totals.items()))}


def credits(inp):
    """s1-combat-loop.md v1.1 section 10: classify the claim against pending and committed BEFORE any draw."""
    s = rng.derive({"root": inp["seedRoot"], "purpose": "loot", "entity": "account", "counter": 0})
    pending, committed = [], {}  # pending: list of claims in registration order; committed: id -> claim
    out, kills, totals, exp, draws = [], {}, {}, 0, 0
    for ev in inp["events"]:
        claim = (ev["encounterId"], ev["instanceId"], ev["zoneOrder"], ev["boss"])
        cid = f"kill:{ev['encounterId']}:{ev['instanceId']}"
        if ev["op"] == "kill":
            pending.append(claim)
            continue
        match = [c for c in pending if f"kill:{c[0]}:{c[1]}" == cid]
        if match:
            if match[0] != claim:
                out.append("CREDIT_CONFLICT")
                continue
            pending.remove(match[0])
        elif cid in committed:
            out.append("CREDIT_REPLAYED" if committed[cid] == claim else "CREDIT_CONFLICT")
            continue
        else:
            out.append("CREDIT_UNKNOWN")
            continue
        enemy = inp["enemies"]["boss" if claim[3] else str(claim[2])]
        lines, _, s, n = roll(s, enemy)
        draws += n
        for r, q in lines:
            totals[r] = totals.get(r, 0) + q
        exp += enemy.get("exp", 0)
        if not claim[3]:
            kills[str(claim[2])] = kills.get(str(claim[2]), 0) + 1
        committed[cid] = claim
        out.append("credited")
    return {"outcomes": out, "exp": exp, "kills": dict(sorted(kills.items())), "totals": dict(sorted(totals.items())), "lootDraws": draws, "committed": len(committed), "pending": len(pending)}


# ---------------------------------------------------------------- estimator (estimator.md v1.1)
MAX_SWINGS, MAX_WORK, TAIL, UNRESOLVED_TOL, MAX_SURVIVAL_WORK = 100_000, 5_000_000, 1e-12, 1e-9, 5_000_000


def swing_dist(hp, dn, dc, ph, pc):
    """Section 2. Returns (probabilities by n = 1.., unresolved mass, stop reason)."""
    if not ph > 0:
        return [], 1.0, "no-hit"
    alive, out, work, rest = {hp: 1.0}, [], 0, 1.0
    for _ in range(MAX_SWINGS):
        work += len(alive)
        if work > MAX_WORK:
            return out, rest, "work-budget"
        nxt, killed = {}, 0.0
        for h, m in alive.items():
            miss = m * (1 - ph)
            if miss > 0:
                nxt[h] = nxt.get(h, 0.0) + miss
            for dmg, p in ((dn, ph * (1 - pc)), (dc, ph * pc)):
                if p <= 0:
                    continue
                left = h - dmg
                if left <= 0:
                    killed += m * p
                else:
                    nxt[left] = nxt.get(left, 0.0) + m * p
        out.append(killed)
        alive = nxt
        rest = 0.0
        for m in alive.values():
            rest += m
        if rest < TAIL:
            return out, rest, "complete"
    return out, rest, "swing-budget"


def estimator(inp):
    h, e, w = inp["hero"], inp["enemy"], inp.get("world", {})
    k, md = inp["K"], inp["minDamage"]
    dn = damage(h.get("attackMilli", 6000), False, h.get("critMultBp", 15000), k, k + e["defence"], md)
    dc = damage(h.get("attackMilli", 6000), True, h.get("critMultBp", 15000), k, k + e["defence"], md)
    ed = damage(e["attackMilli"], False, 10000, k, k + h.get("defence", 0), md)
    # accuracy requirement 0 in these fixtures (p = 1) unless the case sets the hit threshold directly (v1.2 cases)
    ph = inp["heroHitThreshold"] / 2**32 if "heroHitThreshold" in inp else 1.0
    pc = min(h.get("critChanceBp", 0), 10000) / 10000
    interval, overhead, walk = h.get("attackIntervalMs", 1200), w.get("overheadMs", 1500), inp["entryWalkMs"]
    respawn_delay, ooc = w.get("respawnDelayMs", 5000), w.get("outOfCombatDelayMs", 3000)
    slots, respawn = w.get("spawnSlots", 10), w.get("respawnMs", 6000)
    stop_after, window = w.get("stopAfterDeaths", 3), w.get("deathWindowMs", 300_000)
    fad, ei, max_hp = e["firstAttackDelayMs"], e["attackIntervalMs"], h.get("maxHp", 60)

    dist, unresolved, stop = swing_dist(e["hp"], dn, dc, ph, pc)
    if stop == "no-hit" or unresolved > UNRESOLVED_TOL:
        reason = {"no-hit": "NO_HIT_CHANCE", "work-budget": "WORK_BUDGET"}.get(stop, "SWING_BUDGET")
        return {"ttkS": None, "expectedSwings": None, "killsPerHour": 0, "killsPerLife": 0, "winChanceFromFullHp": 0 if stop == "no-hit" else None,
                # estimator.md v1.3: only zero hit chance is proven impossible; an exhausted budget is unresolved
                "deathsPerHour": None, "limitingFactor": "attack", "reliability": "unreachable" if stop == "no-hit" else "unresolved", "reasons": [reason]}
    first = max(0, interval - overhead)
    outcomes, e_n, e_ttk, e_hits = [], 0.0, 0.0, 0.0
    for i, p in enumerate(dist):
        if p <= 0:
            continue
        n = i + 1
        ttk = first + (n - 1) * interval
        hits = (ttk - fad) // ei + 1 if ttk >= fad else 0
        outcomes.append((p, ttk, hits, hits > 0 and (ttk - fad) % ei == 0))
        e_n += p * n
        e_ttk += p * ttk
        e_hits += p * hits
    attack_cycle = overhead + e_ttk
    attack_bound = 3_600_000 / attack_cycle
    spawn_bound = 3_600_000 / ((respawn + overhead + e_ttk) / slots)
    taken = e_hits * ed
    reasons, kpl, win, chain_rate, share, deaths_chain = [], None, 1.0, attack_bound, 0.0, 0.0
    if taken > 0:
        R = math.ceil(max_hp / ed)
        win = 0.0
        for p, ttk, hits, sim in outcomes:
            if hits < R or (hits == R and sim):
                win += p
        downtime = respawn_delay + max(0, walk - overhead)
        can_win = any(hits < R or (hits == R and sim) for _, _, hits, sim in outcomes)
        if not can_win:  # estimator.md v1.2: impossible victory, exact whatever the budget
            kpl, win = 0, 0
            life = downtime + overhead + fad + (R - 1) * ei
            chain_rate, deaths_chain, share = 0, 3_600_000 / life, downtime / life
        elif R * len(outcomes) <= MAX_SURVIVAL_WORK:
            q0 = sum(p for p, _, hits, _ in outcomes if hits == 0)
            t0 = sum(p * ttk for p, ttk, hits, _ in outcomes if hits == 0)
            K, T = [0.0] * (R + 1), [0.0] * (R + 1)
            for r in range(1, R + 1):
                kk, tt = q0, overhead + t0
                for p, ttk, hits, sim in outcomes:
                    if hits == 0:
                        continue
                    if hits < r:
                        kk += p * (1 + K[r - hits])
                        tt += p * (ttk + T[r - hits])
                    else:
                        credited = hits == r and sim
                        if credited:
                            kk += p
                        tt += p * (ttk if credited else fad + (r - 1) * ei)
                K[r], T[r] = kk / (1 - q0), tt / (1 - q0)
            kpl = K[R]
            life = downtime + T[R]
            chain_rate, deaths_chain, share = kpl * 3_600_000 / life, 3_600_000 / life, downtime / life
        else:
            reasons.append("SURVIVAL_BUDGET")
            kpl = max_hp / taken
            per_death = downtime + e_ttk / 2
            ms = attack_cycle + per_death / kpl
            chain_rate = 3_600_000 / ms
            deaths_chain, share = chain_rate / kpl, per_death / kpl / ms
    spawn_binds = spawn_bound < chain_rate
    kph = 0 if kpl == 0 else min(chain_rate, spawn_bound)
    dph = 0 if kpl is None else (kph / kpl if kpl > 0 else deaths_chain)
    window_deaths = dph * window / 3_600_000
    if kpl == 0:
        rel = "unreachable"
        reasons.append("DIES_BEFORE_KILL")
    elif kpl is not None and (kpl < 1 or window_deaths >= stop_after):
        rel = "unsafe"
        if kpl < 1:
            reasons.append("UNDER_ONE_KILL_PER_LIFE")
        if window_deaths >= stop_after:
            reasons.append("AUTO_FARM_STOP_EXPECTED")
    else:
        if share >= 0.1:
            reasons.append("SURVIVAL_LIMITED")
        if spawn_binds and kpl is not None:
            reasons.append("SPAWN_WAITS_NOT_MODELLED")
        if kpl is not None and ooc <= overhead:
            reasons.append("REGEN_NOT_MODELLED")
        rel = "approximate" if reasons else "reliable"
    lim = "spawn" if spawn_binds else "attack"
    if rel in ("unreachable", "unsafe") or share >= 0.1:
        lim = "survival"
    return {"ttkS": e_ttk / 1000, "expectedSwings": e_n, "killsPerHour": kph, "killsPerLife": kpl, "winChanceFromFullHp": win,
            "deathsPerHour": dph, "limitingFactor": lim, "reliability": rel, "reasons": reasons}


FAMILIES = {"combat-loop": fight, "gates": gates, "rewards": rewards, "credits": credits, "estimator": estimator}


def close(expected, got, tol):
    """Equality, with numeric tolerance {rel, abs} when the fixture case declares one."""
    if isinstance(expected, bool) or isinstance(got, bool) or tol in (None, "exact"):
        if isinstance(expected, dict) and isinstance(got, dict):
            return expected.keys() == got.keys() and all(close(expected[k], got[k], tol) for k in expected)
        if isinstance(expected, list) and isinstance(got, list):
            return len(expected) == len(got) and all(close(a, b, tol) for a, b in zip(expected, got))
        return expected == got
    if isinstance(expected, (int, float)) and isinstance(got, (int, float)):
        return abs(expected - got) <= max(tol.get("abs", 0), tol.get("rel", 0) * abs(expected))
    if isinstance(expected, dict) and isinstance(got, dict):
        return expected.keys() == got.keys() and all(close(expected[k], got[k], tol) for k in expected)
    if isinstance(expected, list) and isinstance(got, list):
        return len(expected) == len(got) and all(close(a, b, tol) for a, b in zip(expected, got))
    return expected == got


def check(path):
    data = json.load(open(path, encoding="utf-8"))
    fn, bad = FAMILIES[data["fixtureSet"]], 0
    for case in data["cases"]:
        try:
            got, err = fn(case["input"]), None
        except rng.OracleError as e:
            got, err = None, e.code
        ok = (err == case["expectedError"]) if "expectedError" in case else (err is None and close(case["expected"], got, case.get("tolerance")))
        if not ok:
            bad += 1
            print(f"MISMATCH {case['id']}: oracle={err if err else json.dumps(got)}")
    print(f"s1_oracle {data['fixtureSet']}: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
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
