"""Writes the S4 acceptance fixture draft (spec/fixtures/permanent-acceptance.v1.json; expected values "ORACLE", filled by
spec/oracle/s4_oracle.py --fill). Cases for the owner's three S4 corrections: checked lifetime counters (A), canonical
and effective bonus metadata (B) and the regional mastery rank (C). Most expected values are also derived by hand.
Usage: python -I repro/s4-acceptance/make_fixtures.py <out.json>"""
import json
import sys

out = sys.argv[1]
MAX = 2**53 - 1


def case(id, kind, desc, inp, deriv, error=None):
    c = {"id": id, "kind": kind, "description": desc, "input": inp, "derivation": deriv}
    if error:
        c["expectedError"] = error
    else:
        c["expected"] = "ORACLE"
    return c


def kc(**kw):
    base = {"op": "kill-credit", "counters": {"accountKills": 0, "goldEarned": 0}, "kills": 0, "gold": 1, "boss": False}
    base.update(kw)
    return base


SLIME = [{"rank": "bronze", "kills": 25}, {"rank": "silver", "kills": 150}, {"rank": "gold", "kills": 600}]
DIAMOND = SLIME + [{"rank": "diamond", "kills": 700}]
WOLF = [{"rank": "bronze", "kills": 30}, {"rank": "silver", "kills": 160}, {"rank": "gold", "kills": 650}]

cases = [
    # A. checked counters
    case("s4acc.counter.exact.001", "boundary", "2^53 - 3 + 2 = 2^53 - 1 exactly", {"op": "counter-add", "value": MAX - 2, "delta": 2}, "hand: 9007199254740989 + 2 = 9007199254740991"),
    case("s4acc.counter.zero.001", "boundary", "0 + (2^53 - 1)", {"op": "counter-add", "value": 0, "delta": MAX}, "hand: the maximum itself"),
    case("s4acc.counter.over.001", "failure", "the reviewer's reproduction: 2^53 - 1 + 2 is refused (not 2^53)", {"op": "counter-add", "value": MAX, "delta": 2}, "hand: 9007199254740993 > 2^53 - 1", "NUMERIC_LIMIT"),
    case("s4acc.counter.over.002", "failure", "2^53 - 1 + 1 is refused", {"op": "counter-add", "value": MAX, "delta": 1}, "hand: see the description", "NUMERIC_LIMIT"),
    case("s4acc.counter.over.003", "failure", "2^53 - 2 + 2 is refused (the float sum 2^53 would look exact)", {"op": "counter-add", "value": MAX - 1, "delta": 2}, "hand: 2^53 is not a safe integer", "NUMERIC_LIMIT"),
    case("s4acc.counter.over.004", "failure", "two halves of the range overflow", {"op": "counter-add", "value": 2**52, "delta": 2**52}, "hand: 2^53", "NUMERIC_LIMIT"),
    case("s4acc.counter.neg.001", "failure", "a negative increment is refused", {"op": "counter-add", "value": 5, "delta": -1}, "hand: counters are monotone", "INVALID_NUMBER"),
    case("s4acc.counter.frac.001", "failure", "a fractional count is refused", {"op": "counter-add", "value": 1.5, "delta": 1}, "hand: see the description", "INVALID_NUMBER"),
    case("s4acc.credit.normal.001", "normal", "a kill credit adds one kill, its gold and one Bestiary kill", kc(counters={"accountKills": 41, "goldEarned": 1000}, kills=7, gold=12), "hand: 42, 1012, 8"),
    case("s4acc.credit.first.001", "normal", "the first kill of a species discovers it", kc(gold=3), "hand: 1, 3, 1, discovered"),
    case("s4acc.credit.boss.001", "normal", "a boss credit counts for the account, not the Bestiary", kc(counters={"accountKills": 5, "goldEarned": 50}, kills=2, gold=100, boss=True), "hand: 6, 150, Bestiary unchanged 2"),
    case("s4acc.credit.turnover.001", "boundary", "lifetime gold reaches exactly 2^53 - 1", kc(counters={"accountKills": 10, "goldEarned": MAX - 12}, gold=12), "hand: 9007199254740991"),
    case("s4acc.credit.turnover.002", "failure", "lifetime gold one past the limit: refused (current balances are not involved)", kc(counters={"accountKills": 10, "goldEarned": MAX - 11}, gold=12), "hand: see the description", "NUMERIC_LIMIT"),
    case("s4acc.credit.reviewer.001", "failure", "the reviewer's reproduction: lifetime gold 2^53 - 1, gold reward 2", kc(counters={"accountKills": 10, "goldEarned": MAX}, gold=2), "hand: see the description", "NUMERIC_LIMIT"),
    case("s4acc.credit.kills.001", "failure", "account kills at the limit", kc(counters={"accountKills": MAX, "goldEarned": 0}, gold=1), "hand: see the description", "NUMERIC_LIMIT"),
    case("s4acc.credit.bestiary.001", "failure", "Bestiary kills at the limit", kc(kills=MAX, gold=1), "hand: see the description", "NUMERIC_LIMIT"),
    case("s4acc.credit.boss.002", "boundary", "a boss credit with the Bestiary count at the limit is accepted (the Bestiary is not counted)", kc(kills=MAX, gold=1, boss=True), "hand: 1, 1, unchanged"),
    # B. canonical identity and effective application
    case("s4acc.groups.control.001", "normal", "the reviewer's example, control pooling: ordinary attack 200 and Power 2,000 are two groups",
         {"op": "applied-groups", "pooling": "category", "rewards": [{"id": "feat:a:1", "target": "attack", "bp": 200}], "monuments": [{"id": "monument.power", "target": "attack", "bonusBp": 2000}]},
         "hand: additive 200; monument 2000"),
    case("s4acc.groups.additive.001", "normal", "the reviewer's example, additive pooling: one attack group of 2,200 bp; Power keeps its canonical category",
         {"op": "applied-groups", "pooling": "additive", "rewards": [{"id": "feat:a:1", "target": "attack", "bp": 200}], "monuments": [{"id": "monument.power", "target": "attack", "bonusBp": 2000}]},
         "hand: additive 2200; canonical cat.damage.monument"),
    case("s4acc.groups.vitality.001", "normal", "Vitality, control: the HP pool and the Monument factor are separate",
         {"op": "applied-groups", "pooling": "category", "rewards": [{"id": "bestiary:x:bronze", "target": "maxHp", "bp": 200}], "monuments": [{"id": "monument.vitality", "target": "maxHp", "bonusBp": 1500}]},
         "hand: pool.hp 200; factor.monument.hp 1500"),
    case("s4acc.groups.vitality.002", "normal", "Vitality, additive: one HP pool of 1,700 bp",
         {"op": "applied-groups", "pooling": "additive", "rewards": [{"id": "bestiary:x:bronze", "target": "maxHp", "bp": 200}], "monuments": [{"id": "monument.vitality", "target": "maxHp", "bonusBp": 1500}]},
         "hand: pool.hp 1700"),
    case("s4acc.groups.mixed.001", "normal", "every target, additive pooling; Industry is unaffected by pooling",
         {"op": "applied-groups", "pooling": "additive", "rewards": [{"id": "class:warrior:5", "target": "maxHp", "bp": 300}, {"id": "emblem:e", "target": "gatherEfficiency", "bp": 200}, {"id": "feat:c:1", "target": "critChance", "bp": 100}, {"id": "feat:k:1", "target": "attack", "bp": 50}, {"id": "roster:r:1", "target": "abilityPower", "bp": 500}],
          "monuments": [{"id": "monument.power", "target": "attack", "bonusBp": 1000}, {"id": "monument.vitality", "target": "maxHp", "bonusBp": 600}, {"id": "monument.industry", "target": "efficiency", "bonusBp": 900}]},
         "hand: rewards in ID order, then Monuments; attack 1050, HP 900, crit 100, ability 500, gather 1100, smith 900"),
    # C. regional mastery rank
    case("s4acc.mastery.v1.001", "normal", "schema 1: Gold by name", {"op": "mastery", "schemaVersion": 1, "species": [{"enemyId": "s", "ranks": SLIME}, {"enemyId": "w", "ranks": WOLF}], "regionSpecies": ["s", "w"]}, "hand: s 600, w 650"),
    case("s4acc.mastery.v1.002", "normal", "the reviewer's case: a Diamond rank does not raise a schema-1 requirement", {"op": "mastery", "schemaVersion": 1, "species": [{"enemyId": "s", "ranks": DIAMOND}, {"enemyId": "w", "ranks": WOLF}], "regionSpecies": ["s", "w"]}, "hand: s 600 (not 700), w 650"),
    case("s4acc.mastery.v2.001", "normal", "schema 2: explicit Gold with a Diamond defined", {"op": "mastery", "schemaVersion": 2, "requiredRank": "gold", "species": [{"enemyId": "s", "ranks": DIAMOND}, {"enemyId": "w", "ranks": WOLF}], "regionSpecies": ["s", "w"]}, "hand: s 600, w 650"),
    case("s4acc.mastery.v2.002", "normal", "schema 2: an explicit Silver region", {"op": "mastery", "schemaVersion": 2, "requiredRank": "silver", "species": [{"enemyId": "s", "ranks": SLIME}, {"enemyId": "w", "ranks": WOLF}], "regionSpecies": ["w", "s"]}, "hand: w 160, s 150"),
    case("s4acc.mastery.v2.003", "failure", "schema 2 without requiredRank", {"op": "mastery", "schemaVersion": 2, "species": [{"enemyId": "s", "ranks": SLIME}], "regionSpecies": ["s"]}, "hand: see the description", "INVALID_CONTENT"),
    case("s4acc.mastery.v1.003", "failure", "schema 1 stating requiredRank", {"op": "mastery", "schemaVersion": 1, "requiredRank": "gold", "species": [{"enemyId": "s", "ranks": SLIME}], "regionSpecies": ["s"]}, "hand: see the description", "INVALID_CONTENT"),
    case("s4acc.mastery.v2.004", "failure", "a required Diamond that one species does not define", {"op": "mastery", "schemaVersion": 2, "requiredRank": "diamond", "species": [{"enemyId": "s", "ranks": DIAMOND}, {"enemyId": "w", "ranks": WOLF}], "regionSpecies": ["s", "w"]}, "hand: w has no diamond", "INVALID_CONTENT"),
    case("s4acc.mastery.v1.004", "failure", "schema 1 with a species lacking Gold", {"op": "mastery", "schemaVersion": 1, "species": [{"enemyId": "s", "ranks": SLIME[:2]}], "regionSpecies": ["s"]}, "hand: see the description", "INVALID_CONTENT"),
    case("s4acc.mastery.v1.005", "failure", "a region species without a Bestiary entry", {"op": "mastery", "schemaVersion": 1, "species": [{"enemyId": "s", "ranks": SLIME}], "regionSpecies": ["s", "boss"]}, "hand: see the description", "INVALID_CONTENT"),
]

doc = {
    "fixtureSet": "permanent-acceptance",
    "fixtureVersion": 1,
    "specRef": "spec/formulas/s4-permanent.md#v1.1",
    "status": "candidate",
    "independence": "S4 acceptance corrections (spec/formulas/s4-permanent.md v1.1, section 9), re-derived by spec/oracle/s4_oracle.py from the formula text with Python integers; the lab side calls the real corrected S4 functions. Most cases are also derived by hand. Written by the same author as the code (not an independent party).",
    "cases": cases,
}
with open(out, "w", encoding="utf-8", newline="\n") as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"wrote {len(cases)} cases to {out}")
