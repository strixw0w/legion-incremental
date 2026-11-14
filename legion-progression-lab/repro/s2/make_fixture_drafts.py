"""Writes the S2 fixture drafts (expected = "ORACLE"); spec/oracle/s2_oracle.py --fill derives the expectations.
Usage: python -I repro/s2/make_fixture_drafts.py <out dir>"""
import json
import os
import sys

out = sys.argv[1]
HERO = {"baseAttackMilli": 6000, "attackPerLevelMilli": 1000, "attackIntervalMs": 1200, "baseMaxHp": 60, "maxHpPerLevel": 8, "baseDefence": 0, "defencePerLevel": 1}
CLASSES = [
    {"id": "warrior", "hpBp": 4000, "attackBp": -1000, "attackIntervalMs": 1300, "defenceFlat": 2, "defencePerLevelBp": 5000, "threatRank": 0, "ability": {"multBp": 20000, "cooldownMs": 8000}},
    {"id": "archer", "hpBp": -1000, "attackBp": 0, "attackIntervalMs": 1000, "defenceFlat": 0, "defencePerLevelBp": 0, "threatRank": 2, "ability": {"multBp": 25000, "cooldownMs": 6000}},
    {"id": "mage", "hpBp": -2000, "attackBp": 2500, "attackIntervalMs": 1500, "defenceFlat": 0, "defencePerLevelBp": 0, "threatRank": 2, "ability": {"multBp": 40000, "cooldownMs": 10000}},
]


def sq(cid, kind, desc, hero, recruits, enemy, deriv, until=30000):
    return {"id": cid, "kind": kind, "description": desc, "input": {"hero": {**HERO, **hero}, "classes": CLASSES, "recruits": recruits, "enemy": enemy, "K": 100, "minDamage": 1, "entryWalkMs": 8000, "untilMs": until}, "expected": "ORACLE", "derivation": deriv}


squad = [
    sq("s2.squad.ko-in-killing-batch.001", "boundary", "the Warrior is knocked out by the attack that lands with the killing blow: it is still eligible",
       {"level": 1, "cls": None}, [{"level": 1, "cls": "warrior"}], {"hp": 39, "attackMilli": 1000000, "attackIntervalMs": 100000, "firstAttackDelayMs": 2400, "defence": 0},
       "hero 6 per swing (6000 milli); Warrior raw 5400 -> 5, Cleave raw 10800 -> 11. 8,000: 6+5+11; 9,200: 6; 9,300: 5; 10,400: 6 = 39 = HP. The first attack (10,400) hits the Warrior (threat 0) for 1000: knocked out in the killing batch, so awards [hero, rec:1]"),
    sq("s2.squad.ko-before-kill.001", "boundary", "the Warrior knocked out one instant before the kill is not eligible and makes no later blow",
       {"level": 1, "cls": None}, [{"level": 1, "cls": "warrior"}], {"hp": 34, "attackMilli": 1000000, "attackIntervalMs": 100000, "firstAttackDelayMs": 1200, "defence": 0},
       "8,000: 6+5+11; 9,200: hero 6 and the attack knocks the Warrior out; its 9,300 swing never happens; 10,400: 6 -> 34 = HP. Awards [hero]"),
    sq("s2.squad.threat-then-hero.001", "normal", "the enemy hits the Warrior first; once it is knocked out the hero is the target and dies",
       {"level": 1, "cls": None}, [{"level": 1, "cls": "warrior"}], {"hp": 100000, "attackMilli": 1000000, "attackIntervalMs": 2000, "firstAttackDelayMs": 1200, "defence": 0},
       "attacks at 9,200 (Warrior, knocked out) and 11,200 (hero, 60 HP, dies): outcome heroDied at 11,200, no awards"),
    sq("s2.squad.classless-hero-before-archer.001", "normal", "without a Warrior the classless hero (threat 1) is hit before an Archer (threat 2)",
       {"level": 1, "cls": None}, [{"level": 1, "cls": "archer"}], {"hp": 100000, "attackMilli": 30000, "attackIntervalMs": 2000, "firstAttackDelayMs": 2000, "defence": 0},
       "30 damage per attack at 10,000 and 12,000: the hero (60 HP) dies at 12,000; the Archer is never hit"),
    sq("s2.squad.full-squad-l10.001", "normal", "a level-10 Archer hero with a level-10 Warrior, Archer and Mage kills a goblin-like enemy; everyone eligible",
       {"level": 10, "cls": "archer"}, [{"level": 10, "cls": "warrior"}, {"level": 10, "cls": "archer"}, {"level": 10, "cls": "mage"}], {"hp": 120, "attackMilli": 6000, "attackIntervalMs": 1600, "firstAttackDelayMs": 1600, "defence": 5},
       "stats from s2-legion.md v1 section 1 at level 10 (steps 9); every member swings from 8,000 on its own interval, recruits cast at 8,000; damage vs defence 5 with K 100; the Warrior is the target; derived by the oracle time loop"),
    sq("s2.squad.mage-hero-two-recruits.001", "normal", "a Mage hero (no cast: manual) with a Warrior and a Mage; the Warrior tanks every hit",
       {"level": 5, "cls": "mage"}, [{"level": 5, "cls": "warrior"}, {"level": 5, "cls": "mage"}], {"hp": 300, "attackMilli": 8000, "attackIntervalMs": 1500, "firstAttackDelayMs": 1500, "defence": 2},
       "the hero ability is never cast without a command; the recruit Mage casts Fireball every 10 s from 8,000; derived by the oracle time loop"),
    {"id": "s2.squad.invalid-enemy.001", "kind": "failure", "description": "an enemy with zero attack is refused as content",
     "input": {"hero": {**HERO, "level": 1, "cls": None}, "classes": CLASSES, "recruits": [], "enemy": {"hp": 10, "attackMilli": 0, "attackIntervalMs": 1000, "firstAttackDelayMs": 1000, "defence": 0}, "K": 100, "minDamage": 1, "entryWalkMs": 8000, "untilMs": 30000},
     "expectedError": "INVALID_CONTENT", "derivation": "content rule: attack >= 1 thousandth"},
]
with open(os.path.join(out, "squad-fight.draft.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"fixtureSet": "squad-fight", "fixtureVersion": 1, "specRef": "spec/formulas/s2-legion.md#v1", "status": "candidate",
               "independence": "Single squad encounters derived from spec/formulas/s2-legion.md v1 (stats from the class table, blows and attacks on their own clocks, threat order, simultaneous resolution from the state before each instant, knockouts, eligibility at the kill). Re-derived by spec/oracle/s2_oracle.py with a plain time loop and exact Fractions; the lab side runs the real S2 engine on a synthetic pack. Every case has certain hits and no crits. Cases 1-4 are also derived by hand.",
               "cases": squad}, f, indent=2)

EN = {"1": {"exp": 4, "gold": 1, "drops": [{"resourceId": "res.mat.slime_gel", "chanceBp": 3000, "qty": 1}, {"resourceId": "res.rare.test_token", "chanceBp": 20, "qty": 1}]}}
CH = [{"id": "hero", "cls": None}, {"id": "rec:1", "cls": "warrior"}, {"id": "rec:2", "cls": None}]


def kill(n, eligible, stream="squad", enc=None):
    return {"op": "kill", "encounterId": enc or f"enc:{n}", "instanceId": f"z1#{n}", "zoneOrder": 1, "boss": False, "stream": stream, "eligible": eligible}


def credit(n, stream="squad", enc=None):
    return {"op": "credit", "encounterId": enc or f"enc:{n}", "instanceId": f"z1#{n}", "zoneOrder": 1, "boss": False, "stream": stream}


def lc(cid, kind, desc, events, deriv):
    return {"id": cid, "kind": kind, "description": desc, "input": {"seedRoot": "fx-legion-credit", "enemies": EN, "characters": CH, "events": events}, "expected": "ORACLE", "derivation": deriv}


credits = [
    lc("s2.credit.squad-full-exp.001", "normal", "one squad credit: every eligible character gets the full 4 EXP; one reward roll on the account stream", [kill(1, ["hero", "rec:1", "rec:2"]), credit(1)], "outcomes [credited]; exp 4 each; mastery rec:1 warrior 4 (hero and rec:2 classless: none); gold 1; 2 loot draws on squad; 1 kill"),
    lc("s2.credit.duplicate.001", "failure", "an exact duplicate credit is a replay: nothing twice, no draw", [kill(1, ["hero", "rec:1"]), credit(1), credit(1)], "outcomes [credited, CREDIT_REPLAYED]; exp 4 for hero and rec:1, 0 for rec:2; 2 draws"),
    lc("s2.credit.stream-conflict.001", "failure", "the same encounter claimed by another stream is a conflict, before and after the genuine credit", [kill(1, ["hero", "rec:1"]), credit(1, "worker:rec:1"), credit(1), credit(1, "worker:rec:1")], "outcomes [CREDIT_CONFLICT, credited, CREDIT_CONFLICT]; one roll"),
    lc("s2.credit.worker-stream.001", "normal", "a worker kill gives EXP to the worker only and rolls on the worker loot stream", [kill(1, ["rec:1"], "worker:rec:1", "w:rec:1:1"), credit(1, "worker:rec:1", "w:rec:1:1"), kill(2, ["hero", "rec:2"]), credit(2)], "rec:1 4 EXP (warrior mastery 4) from the worker kill; hero and rec:2 4 EXP from the squad kill; 2 draws on each stream; 2 kills"),
    lc("s2.credit.class-switch.001", "boundary", "mastery follows the class held at each credit; switching moves none", [kill(1, ["hero", "rec:1"]), credit(1), {"op": "class", "id": "rec:1", "cls": "archer"}, kill(2, ["hero", "rec:1"]), credit(2)], "rec:1 exp 8; mastery warrior 4, archer 4, mage 0"),
    lc("s2.credit.partial-eligibility.001", "boundary", "a character missing from the eligible set (knocked out before the kill) gets nothing", [kill(1, ["hero"]), credit(1)], "hero 4, rec:1 0, rec:2 0; mastery all 0"),
    lc("s2.credit.unknown.001", "failure", "a credit for an encounter that never ended is unknown", [credit(9)], "outcomes [CREDIT_UNKNOWN]; nothing else"),
]
with open(os.path.join(out, "legion-credit.draft.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"fixtureSet": "legion-credit", "fixtureVersion": 1, "specRef": "spec/formulas/s2-legion.md#v1", "status": "candidate",
               "independence": "Multi-character credit identity (spec/formulas/s2-legion.md v1 section 3) re-derived by spec/oracle/s2_oracle.py: pending claims with their eligible sets, classification before any draw, one reward roll per accepted credit on the stream's own generator (independent RNG of rng_oracle.py), full EXP to every eligible character, mastery to the held class. The lab side uses engine/legionCredit.ts, engine/rewards.ts and the engine's awardEligible. Outcome lists, EXP and mastery are also derived by hand.",
               "cases": credits}, f, indent=2)
print("drafts written")
