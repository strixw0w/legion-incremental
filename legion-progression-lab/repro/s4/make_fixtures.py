"""Writes the S4 fixture draft spec/fixtures/permanent-rules.v1.json (expected values "ORACLE", filled by
spec/oracle/s4_oracle.py --fill). The stat cases name the content numbers they are derived from (read here from the S1
and S2 packs); the lab side refuses a case whose numbers differ from the compiled S4 content.
Usage: python -I repro/s4/make_fixtures.py <lab dir> <out.json>"""
import json
import os
import sys

lab, out = sys.argv[1], sys.argv[2]
base = json.load(open(os.path.join(lab, "content", "w1-slice.candidate.v0.1.0.json"), encoding="utf-8"))
legion = json.load(open(os.path.join(lab, "content", "w1-slice-s2.candidate.v0.2.0.json"), encoding="utf-8"))
V = lambda x: x["value"] if isinstance(x, dict) else x
h = base["hero"]
classes = {c["id"]: c for c in legion["classes"]}


def rules(cls):
    c = classes.get(cls)
    return {
        "baseAttackMilli": V(h["baseAttackMilli"]), "attackPerLevelMilli": V(h["attackPerLevelMilli"]), "critChanceBp": V(h["critChanceBp"]),
        "baseMaxHp": V(h["baseMaxHp"]), "maxHpPerLevel": V(h["maxHpPerLevel"]),
        "classAttackBp": V(c["attackBp"]) if c else 0, "classHpBp": V(c["hpBp"]) if c else 0, "classCritBp": V(c["critBp"]) if c else 0,
        "abilityMultBp": V(c["ability"]["multBp"]) if c else 0,
    }


def case(id, kind, desc, inp, deriv, error=None):
    c = {"id": id, "kind": kind, "description": desc, "input": inp, "derivation": deriv}
    if error:
        c["expectedError"] = error
    else:
        c["expected"] = "ORACLE"
    return c


GEL, FANG, BAR = "res.mat.slime_gel", "res.mat.wolf_fang", "res.mat.copper_bar"
POWER = {"baseGold": 40, "growthBp": 1500, "maxLevel": 30, "tiers": [{"toLevel": 10, "perLevelBp": 200}, {"toLevel": 20, "perLevelBp": 100}, {"toLevel": 30, "perLevelBp": 50}],
         "milestones": [{"level": 5, "materials": [{"resourceId": GEL, "qty": 10}]}, {"level": 10, "materials": [{"resourceId": FANG, "qty": 10}]}, {"level": 20, "materials": [{"resourceId": FANG, "qty": 25}, {"resourceId": BAR, "qty": 5}]}]}
SMALL = {"baseGold": 10, "growthBp": 10000, "maxLevel": 6, "tiers": [{"toLevel": 3, "perLevelBp": 100}, {"toLevel": 6, "perLevelBp": 40}],
         "milestones": [{"level": 2, "materials": [{"resourceId": GEL, "qty": 3}]}, {"level": 4, "materials": [{"resourceId": GEL, "qty": 2}, {"resourceId": FANG, "qty": 1}]}]}
R = lambda id, kind, **c: {"id": id, "system": "feat", "target": "attack", "bp": 50, "condition": {"kind": kind, **c}}
REWARDS = [
    R("feat:feat.kills:1", "counter", counter="accountKills", threshold=10),
    R("feat:feat.kills:2", "counter", counter="accountKills", threshold=50),
    R("feat:feat.kills:3", "counter", counter="accountKills", threshold=500),
    R("feat:feat.gold:1", "counter", counter="goldEarned", threshold=100),
    R("bestiary:enemy.w1.wolf:bronze", "bestiary", enemyId="enemy.w1.wolf", kills=25),
    R("bestiary:enemy.w1.wolf:gold", "bestiary", enemyId="enemy.w1.wolf", kills=600),
    R("emblem:enemy.w1.wolf", "emblem", enemyId="enemy.w1.wolf"),
    R("region:r:completion", "regionCompletion", regionId="r", species=["enemy.w1.green_slime", "enemy.w1.wolf"]),
    R("region:r:mastery", "regionMastery", regionId="r", species=["enemy.w1.green_slime", "enemy.w1.wolf"], kills={"enemy.w1.green_slime": 600, "enemy.w1.wolf": 600}),
    R("class:warrior:5", "classRecord", cls="warrior", record=5),
    R("class:mage:10", "classRecord", cls="mage", record=10),
]
COUNTERS = lambda **kw: {**{k: 0 for k in ["accountKills", "goldEarned", "rosterLevelsHigh", "professionLevelsHigh", "gatheredUnits", "unitsCompleted", "itemsCrafted", "enhancements", "zonesVisited", "gatesCompleted", "bossCleared", "recruitsAcquired"]}, **kw}
REC = lambda **kw: {"warrior": 0, "archer": 0, "mage": 0, **kw}

cases = [
    # 1. tables
    case("s4.mon.costs.power.001", "normal", "Monument of Power gold table: 40, then x1.15 with ceil", {"op": "monument-costs", "baseGold": 40, "growthBp": 1500, "maxLevel": 30}, "hand: 40, ceil(46.0)=46, ceil(52.9)=53, ceil(60.95)=61, ..."),
    case("s4.mon.costs.ceil.001", "boundary", "ceil on every step: 3 x1.5", {"op": "monument-costs", "baseGold": 3, "growthBp": 5000, "maxLevel": 5}, "hand: 3, ceil(4.5)=5, ceil(7.5)=8, 12, 18"),
    case("s4.mon.costs.flat.001", "boundary", "growth 0 gives a flat table", {"op": "monument-costs", "baseGold": 7, "growthBp": 0, "maxLevel": 4}, "hand: 7, 7, 7, 7"),
    case("s4.mon.costs.overflow.001", "failure", "a table leaving the safe integer range is refused", {"op": "monument-costs", "baseGold": 2**52, "growthBp": 10000, "maxLevel": 4}, "hand: 2^52 x 20000 > 2^53 - 1", error="INVALID_CONTENT"),
    case("s4.mon.bonus.tiers.001", "normal", "three diminishing tiers: 200, 100, 50 bp per level", {"op": "monument-bonuses", "tiers": POWER["tiers"], "maxLevel": 30}, "hand: 2000 at 10, 3000 at 20, 3500 at 30"),
    case("s4.mon.bonus.uncovered.001", "failure", "a level not covered by any tier is refused", {"op": "monument-bonuses", "tiers": [{"toLevel": 3, "perLevelBp": 10}], "maxLevel": 4}, "hand: level 4 has no tier", error="INVALID_CONTENT"),
    # 2. price and Buy Max
    case("s4.mon.price.milestone.001", "normal", "levels 4-6 of Power include the level-5 gel milestone", {"op": "price", "monument": POWER, "level": 3, "levels": 3}, "hand: 61 + 71 + 82 gold, 10 gel"),
    case("s4.mon.price.beyond.001", "failure", "a price past the maximum level is refused", {"op": "price", "monument": SMALL, "level": 5, "levels": 2}, "hand: 5 + 2 > 6", error="INVALID_STATE"),
    case("s4.buymax.zero.001", "boundary", "no gold: nothing", {"op": "buy-max", "monument": SMALL, "level": 0, "balances": {}}, "hand: cost 10 > 0"),
    case("s4.buymax.exact.001", "boundary", "gold exactly covers level 1", {"op": "buy-max", "monument": SMALL, "level": 0, "balances": {"res.gold": 10}}, "hand: 10 <= 10; level 2 costs 20 more"),
    case("s4.buymax.milestone-unmet.001", "boundary", "gold for many levels, no gel: stops before the level-2 milestone", {"op": "buy-max", "monument": SMALL, "level": 0, "balances": {"res.gold": 10000}}, "hand: k = 1"),
    case("s4.buymax.milestone-crossed.001", "normal", "an affordable milestone is crossed and buying continues", {"op": "buy-max", "monument": SMALL, "level": 0, "balances": {"res.gold": 10000, GEL: 3}}, "hand: levels 1-3 (gel 3 at level 2); level 4 needs 2 more gel"),
    case("s4.buymax.two-milestones.001", "normal", "two affordable milestones, gold limits next", {"op": "buy-max", "monument": SMALL, "level": 0, "balances": {"res.gold": 150, GEL: 5, FANG: 1}}, "hand: 10+20+40+80 = 150 for 4 levels; level 5 costs 160"),
    case("s4.buymax.large.001", "boundary", "very large balances reach the maximum and stop", {"op": "buy-max", "monument": SMALL, "level": 0, "balances": {"res.gold": 2**50, GEL: 10**9, FANG: 10**9}}, "hand: k = 6 (maxLevel)"),
    case("s4.buymax.at-max.001", "boundary", "already at the maximum: nothing", {"op": "buy-max", "monument": SMALL, "level": 6, "balances": {"res.gold": 10**9}}, "hand: k = 0"),
    case("s4.buymax.mid.001", "normal", "from level 3, materials short for level 4", {"op": "buy-max", "monument": SMALL, "level": 3, "balances": {"res.gold": 10**6, GEL: 2}}, "hand: level 4 needs 1 fang: k = 0"),
    case("s4.buymax.power.001", "normal", "Power from 0 with 1,000 gold and 10 gel", {"op": "buy-max", "monument": POWER, "level": 0, "balances": {"res.gold": 1000, GEL: 10}}, "hand: prefix sums 40, 86, 139, 200, 271, 353, 448, 558, 685, 832; the level-10 milestone needs 10 fang: k = 9"),
    # 3. pools
    case("s4.stats.neutral.001", "normal", "classless hero level 1 without bonuses equals the S3.1 stats", {"op": "stats", "level": 1, "cls": "none", "perm": {}, "rules": rules("none")}, "stats.md v2 with no factor"),
    case("s4.stats.additive.001", "normal", "classless hero level 6, +5% attack in the additive pool, +20% HP pool", {"op": "stats", "level": 6, "cls": "none", "perm": {"attackBp": 500, "hpBp": 2000}, "rules": rules("none")}, "one additive factor 10500; HP roundDiv(base x 12000, 10000)"),
    case("s4.stats.monument.001", "normal", "Warrior level 10: class -10% and rewards +3% in one pool, then the Monument factor +10%", {"op": "stats", "level": 10, "cls": "warrior", "perm": {"attackBp": 300, "monumentAttackBp": 1000}, "rules": rules("warrior")}, "v x 9300/10000 x 11000/10000, binary64 in id order"),
    case("s4.stats.vitality.001", "normal", "Mage level 20: HP pool +20% then the Vitality factor +15%", {"op": "stats", "level": 20, "cls": "mage", "perm": {"hpBp": 2000, "monumentHpBp": 1500}, "rules": rules("mage")}, "roundDiv twice"),
    case("s4.stats.critcap.001", "boundary", "Archer crit over the cap is capped at 10,000", {"op": "stats", "level": 12, "cls": "archer", "perm": {"critBp": 20000}, "rules": rules("archer")}, "min(..., 10000)"),
    case("s4.stats.ability.001", "normal", "Mage ability gains the permanent ability bp", {"op": "stats", "level": 8, "cls": "mage", "perm": {"abilityBp": 5000}, "rules": rules("mage")}, "roundDiv(atk x (multBp + 5000), 10000)"),
    # 4. rewards
    case("s4.miles.multi.001", "normal", "one event crossing two Feat tiers grants both", {"op": "milestones", "rewards": REWARDS, "facts": {"counters": COUNTERS(accountKills=60), "bestiary": {}, "records": REC()}, "granted": []}, "hand: kills:1 and kills:2"),
    case("s4.miles.granted.001", "boundary", "an already granted reward is never earned again", {"op": "milestones", "rewards": REWARDS, "facts": {"counters": COUNTERS(accountKills=60), "bestiary": {}, "records": REC()}, "granted": ["feat:feat.kills:1"]}, "hand: kills:2 only"),
    case("s4.miles.bestiary.001", "normal", "Bestiary rank, emblem and regional completion", {"op": "milestones", "rewards": REWARDS, "facts": {"counters": COUNTERS(), "bestiary": {"enemy.w1.green_slime": {"kills": 3, "emblems": 0}, "enemy.w1.wolf": {"kills": 25, "emblems": 2}}, "records": REC()}, "granted": []}, "hand: wolf bronze, wolf emblem (2 copies, one reward), region completion"),
    case("s4.miles.mastery.001", "boundary", "regional mastery needs every species at its top rank", {"op": "milestones", "rewards": REWARDS, "facts": {"counters": COUNTERS(), "bestiary": {"enemy.w1.green_slime": {"kills": 600, "emblems": 0}, "enemy.w1.wolf": {"kills": 599, "emblems": 0}}, "records": REC()}, "granted": []}, "hand: no mastery at 599; wolf bronze and completion"),
    case("s4.miles.class.001", "normal", "class records: the account record, per class", {"op": "milestones", "rewards": REWARDS, "facts": {"counters": COUNTERS(goldEarned=100), "bestiary": {}, "records": REC(warrior=7, mage=9)}, "granted": []}, "hand: warrior 5 and gold 1; mage 10 not yet"),
]
data = {"fixtureSet": "permanent-rules", "fixtureVersion": 1, "specRef": "spec/formulas/s4-permanent.md#v1", "status": "candidate",
        "independence": "S4 formulas (spec/formulas/s4-permanent.md v1), re-derived by spec/oracle/s4_oracle.py from the formula text (Buy Max also against a brute force over every k); the lab side calls the real S4 functions and the real character stat function of the compiled S4 content. Most cases are also derived by hand.",
        "cases": cases}
with open(out, "w", encoding="utf-8", newline="\n") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print(f"wrote {out}: {len(cases)} cases")
