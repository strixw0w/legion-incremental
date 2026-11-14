"""Writes the S2.1 fixture drafts (expected = "ORACLE"); spec/oracle/s2_oracle.py --fill derives the expectations.
Usage: python -I repro/s2.1/make_fixture_drafts.py <out dir>"""
import json
import os
import sys

out = sys.argv[1]
M = 2**53 - 1
HERO = {"baseAttackMilli": 6000, "attackPerLevelMilli": 1000, "attackIntervalMs": 1200, "baseMaxHp": 60, "maxHpPerLevel": 8, "baseDefence": 0, "defencePerLevel": 1}
CLASSES = [
    {"id": "warrior", "hpBp": 4000, "attackBp": -1000, "attackIntervalMs": 1300, "defenceFlat": 2, "defencePerLevelBp": 5000, "threatRank": 0, "ability": {"multBp": 20000, "cooldownMs": 8000}},
    {"id": "archer", "hpBp": -1000, "attackBp": 0, "attackIntervalMs": 1000, "defenceFlat": 0, "defencePerLevelBp": 0, "threatRank": 2, "ability": {"multBp": 25000, "cooldownMs": 6000}},
    {"id": "mage", "hpBp": -2000, "attackBp": 2500, "attackIntervalMs": 1500, "defenceFlat": 0, "defencePerLevelBp": 0, "threatRank": 2, "ability": {"multBp": 40000, "cooldownMs": 10000}},
]


def wf(cid, kind, desc, worker, enemy, deriv):
    return {"id": cid, "kind": kind, "description": desc, "input": {"hero": HERO, "classes": CLASSES, "worker": worker, "enemy": enemy, "K": 100, "minDamage": 1, "overheadMs": 1500}, "expected": "ORACLE", "derivation": deriv}


lethal = lambda hp: {"hp": hp, "attackMilli": 1_000_000, "attackIntervalMs": 1000, "firstAttackDelayMs": 1, "defence": 0}
feas = [
    wf("s2.1.feasibility.ability-makes-winnable.001", "boundary", "the reviewer case: a level-1 Mage worker kills a 25-HP enemy only with Fireball before the 1 ms knockout",
       {"level": 1, "cls": "mage"}, lethal(25),
       "Mage raw 7500 -> 8, Fireball raw 30000 -> 30; knocked out at 1 ms (one hit of 1000); bound 8 + 30 = 38 >= 25: not impossible; basic attacks need 4 swings: they cannot win -> unresolved"),
    wf("s2.1.feasibility.bound-equals-hp.001", "boundary", "a bound exactly equal to the enemy HP is not a proof of impossibility",
       {"level": 1, "cls": "mage"}, lethal(38), "bound 38 = HP 38 -> not proven impossible -> unresolved"),
    wf("s2.1.feasibility.cooldown-limits.001", "failure", "one HP more than one swing and one cast: the cooldown allows no second cast before the knockout",
       {"level": 1, "cls": "mage"}, lethal(39), "bound 38 < 39 (cooldown 10 s, knockout at 1 ms) -> proven impossible -> unreachable"),
    wf("s2.1.feasibility.lethal-retaliation.001", "failure", "the ability cannot overcome lethal retaliation",
       {"level": 1, "cls": "mage"}, lethal(100), "bound 38 < 100 -> unreachable"),
    wf("s2.1.feasibility.efficiency-only.001", "normal", "basic attacks already win; the ability only changes efficiency",
       {"level": 1, "cls": "mage"}, {"hp": 25, "attackMilli": 1000, "attackIntervalMs": 2000, "firstAttackDelayMs": 2000, "defence": 0},
       "4 swings of 8 by 4,500 ms; the 1-damage enemy hits 2 times; the Mage (48 HP) survives -> basic can win -> reachable"),
    wf("s2.1.feasibility.classless.001", "normal", "a classless worker has no ability: basic attacks decide, and a lost fight is proven impossible",
       {"level": 1, "cls": None}, lethal(25), "6 per swing, bound 6 < 25 -> unreachable"),
    wf("s2.1.feasibility.warrior-l5.001", "normal", "a level-5 Warrior with Cleave against a hard enemy",
       {"level": 5, "cls": "warrior"}, {"hp": 90, "attackMilli": 30000, "attackIntervalMs": 1000, "firstAttackDelayMs": 1000, "defence": 2},
       "stats from s2-legion.md v1 section 1 at level 5; derived by the oracle"),
    {"id": "s2.1.feasibility.invalid-enemy.001", "kind": "failure", "description": "an enemy with zero attack is refused as content",
     "input": {"hero": HERO, "classes": CLASSES, "worker": {"level": 1, "cls": "mage"}, "enemy": {"hp": 10, "attackMilli": 0, "attackIntervalMs": 1000, "firstAttackDelayMs": 1, "defence": 0}, "K": 100, "minDamage": 1, "overheadMs": 1500},
     "expectedError": "INVALID_CONTENT", "derivation": "content rule: attack >= 1 thousandth"},
]
with open(os.path.join(out, "worker-feasibility.draft.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"fixtureSet": "worker-feasibility", "fixtureVersion": 1, "specRef": "spec/formulas/s2-legion.md#v1.1", "status": "candidate",
               "independence": "Ability-aware structural feasibility and the worker-estimate classification (spec/formulas/s2-legion.md v1.1 section 6), re-derived by spec/oracle/s2_oracle.py from the formula text with exact integer arithmetic; the basic-attack verdict re-derives estimator v1.2 for the single certain outcome. The lab side compiles a synthetic pack and asks the real engine (workerEstimate, workerFeasibility). Certain hits, no crits. The first four cases are also derived by hand.",
               "cases": feas}, f, indent=2)


def tx(tid, delta, res="res.gold", bucket="available"):
    return {"txId": tid, "purpose": "fixture", "lines": [{"resourceId": res, "bucket": bucket, "delta": delta}]}


def serial(balances, committed):
    return {"schema": "legion.ledger.v1", "balances": balances, "committed": committed}


H = "ab" * 32
led = [
    {"id": "s2.1.reconstruction.review-turnover.001", "kind": "boundary", "description": "credit M, debit M, credit M with txIds a, z, b: every step valid, reconstruction accepted",
     "input": {"txs": [tx("a", M), tx("z", -M), tx("b", M)]}, "expected": "ORACLE", "derivation": "steps ok, ok, ok; balance M; canonical order a, b, z reaches 2M only as an exact intermediate sum -> accepted"},
    {"id": "s2.1.reconstruction.txid-orders.001", "kind": "boundary", "description": "the same history under other transaction IDs (canonical order z-last differs)",
     "input": {"txs": [tx("z", M), tx("a", -M), tx("m", M)]}, "expected": "ORACLE", "derivation": "steps ok x3; balance M; canonical order a, m, z: -M, +M, +M"},
    {"id": "s2.1.reconstruction.independent-resources.001", "kind": "normal", "description": "large turnover on two resources and both buckets, with a multi-line transaction",
     "input": {"txs": [tx("g1", M), tx("g2", -M), tx("r1", M, "res.iron", "reserved"), tx("r2", -(M - 7), "res.iron", "reserved"), {"txId": "multi", "purpose": "fixture", "lines": [{"resourceId": "res.gold", "bucket": "available", "delta": 5}, {"resourceId": "res.wood", "bucket": "reserved", "delta": M}]}]},
     "expected": "ORACLE", "derivation": "gold 5, iron reserved 7, wood reserved M"},
    {"id": "s2.1.reconstruction.refused-steps.001", "kind": "failure", "description": "refused transactions change nothing; replay and conflict keep their meaning; the result still reconstructs",
     "input": {"txs": [tx("a", M), tx("b", 1), tx("c", -M), tx("d", -1), tx("a", M), tx("a", 5)]},
     "expected": "ORACLE", "derivation": "ok, NUMERIC_LIMIT, ok, NEGATIVE_BALANCE, replayed, TX_CONFLICT; balance 0"},
    {"id": "s2.1.reconstruction.valid-serialized.001", "kind": "normal", "description": "saved data with turnover beyond 2^53 - 1 in canonical order is accepted",
     "input": {"serialized": serial([["res.gold", {"available": M, "reserved": 0}]], [["a", {"payloadHash": H, "nets": [["res.gold", "available", M]]}], ["b", {"payloadHash": H, "nets": [["res.gold", "available", M]]}], ["z", {"payloadHash": H, "nets": [["res.gold", "available", -M]]}]])},
     "expected": "ORACLE", "derivation": "exact sum M + M - M = M equals the balance"},
    {"id": "s2.1.reconstruction.corrupted-balance.001", "kind": "failure", "description": "a balance that is not the exact sum of the receipts is invalid input",
     "input": {"serialized": serial([["res.gold", {"available": M - 1, "reserved": 0}]], [["a", {"payloadHash": H, "nets": [["res.gold", "available", M]]}], ["b", {"payloadHash": H, "nets": [["res.gold", "available", M]]}], ["z", {"payloadHash": H, "nets": [["res.gold", "available", -M]]}]])},
     "expectedError": "INVALID_STATE", "derivation": "sum M, balance M - 1"},
    {"id": "s2.1.reconstruction.receipt-out-of-range.001", "kind": "failure", "description": "a receipt delta beyond 2^53 - 1 is invalid input, not a numeric overflow",
     "input": {"serialized": serial([["res.gold", {"available": 1, "reserved": 0}]], [["a", {"payloadHash": H, "nets": [["res.gold", "available", M + 2]]}], ["b", {"payloadHash": H, "nets": [["res.gold", "available", -M - 1]]}]])},
     "expectedError": "INVALID_STATE", "derivation": "delta M + 2 is not a safe integer"},
    {"id": "s2.1.reconstruction.missing-resource.001", "kind": "failure", "description": "turnover on a resource absent from balances that does not net to zero",
     "input": {"serialized": serial([["res.gold", {"available": 1, "reserved": 0}]], [["a", {"payloadHash": H, "nets": [["res.gold", "available", 1], ["res.iron", "available", M]]}]])},
     "expectedError": "INVALID_STATE", "derivation": "res.iron sums to M but has no balance"},
]
with open(os.path.join(out, "ledger-reconstruction.draft.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"fixtureSet": "ledger-reconstruction", "fixtureVersion": 1, "specRef": "spec/formulas/ledger.md#v1.2", "status": "candidate",
               "independence": "Chronological transaction outcomes and validated reconstruction with EXACT conservation (spec/formulas/ledger.md v1.2), re-derived by spec/oracle/s2_oracle.py with unbounded Python integers. The lab side uses applyTxPersistent, serializeLedger and reconstructPersistentLedger. Outcomes and balances are also derived by hand.",
               "cases": led}, f, indent=2)
print("drafts written")
