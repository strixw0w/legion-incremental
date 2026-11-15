"""Writes the L2 fixture drafts (spec/fixtures/l2-*.v1.json; expected values "ORACLE", filled by spec/oracle/l2_oracle.py
--fill). Hand-written cases for each rule of spec/formulas/l2-replay.md v1, plus seeded random cases.
Usage: python -I repro/l2/make_fixtures.py <out dir>"""
import json
import os
import random
import sys

out = sys.argv[1]
H = lambda c: c * 64


def case(id, kind, desc, inp, deriv, error=None):
    c = {"id": id, "kind": kind, "description": desc, "input": inp, "derivation": deriv}
    if error:
        c["expectedError"] = error
    else:
        c["expected"] = "ORACLE"
    return c


def doc(family, cases, note):
    return {"fixtureSet": family, "fixtureVersion": 1, "specRef": "spec/formulas/l2-replay.md#v1", "status": "candidate",
            "independence": f"L2 rules (spec/formulas/l2-replay.md v1) re-derived by spec/oracle/l2_oracle.py from the rule text with Python sets and integers; the lab side calls the real L2 functions. {note} Written by the same author as the code (not an independent party).",
            "cases": cases}


rng = random.Random(20261115)
# ---------------------------------------------------------------- ranges
R = [
    case("l2.ranges.prefix.001", "normal", "contiguous additions collapse into the prefix", {"op": "ranges", "adds": [[1, 1], [2, 5], [6, 6]], "queries": [1, 6, 7]}, "hand: p 6, no runs"),
    case("l2.ranges.gap.001", "normal", "a gap keeps a run above the prefix", {"op": "ranges", "adds": [[1, 3], [5, 7]], "queries": [4, 5]}, "hand: p 3, run [5,7], gap [4,4]"),
    case("l2.ranges.fill.001", "normal", "filling the gap merges everything into the prefix", {"op": "ranges", "adds": [[1, 3], [5, 7], [4, 4]], "queries": [4]}, "hand: p 7"),
    case("l2.ranges.touch.001", "normal", "touching runs merge", {"op": "ranges", "adds": [[10, 12], [13, 15], [20, 20]], "queries": [9, 15, 20]}, "hand: runs [10,15], [20,20]"),
    case("l2.ranges.overlap.001", "failure", "an overlapping run is refused whole (never trimmed)", {"op": "ranges", "adds": [[1, 5], [4, 8]], "queries": []}, "hand: 4 and 5 are members", "RANGE_OVERLAP"),
    case("l2.ranges.overlap.002", "failure", "re-adding a single member", {"op": "ranges", "adds": [[3, 3], [3, 3]], "queries": []}, "hand: 3 is already a member", "RANGE_OVERLAP"),
    case("l2.ranges.invalid.001", "failure", "zero is not a member", {"op": "ranges", "adds": [[0, 2]], "queries": []}, "hand: members are positive", "INVALID_RANGE"),
    case("l2.ranges.boundary.001", "boundary", "the largest safe member", {"op": "ranges", "adds": [[9007199254740990, 9007199254740991], [1, 1]], "queries": [9007199254740991, 2]}, "hand: p 1, one run at the top"),
]
for i in range(12):
    adds, used = [], set()
    for _ in range(rng.randint(1, 15)):
        a = rng.randint(1, 40)
        b = a + rng.randint(0, 3)
        if any(x in used for x in range(a, b + 1)):
            continue
        used.update(range(a, b + 1))
        adds.append([a, b])
    R.append(case(f"l2.ranges.random.{i + 1:03d}", "normal", "seeded random disjoint additions", {"op": "ranges", "adds": adds, "queries": list(range(1, 45, 3))}, "oracle: plain set, re-encoded"))
# ---------------------------------------------------------------- requests
P = {"maxRecent": 3, "maxAgeMs": 1000}
step = lambda seq, h="a", at=0, now=None: {"seq": seq, "hash": H(h), "atMs": at, "nowMs": at if now is None else now}
Q = [
    case("l2.req.basic.001", "normal", "new, replay, conflict", {"op": "stream", "policy": P, "steps": [step(1), step(1), step(1, "b"), step(2)]}, "hand: NEW REPLAY CONFLICTING_PAYLOAD NEW"),
    case("l2.req.count.001", "normal", "count eviction raises the horizon; an evicted replay is too old", {"op": "stream", "policy": P, "steps": [step(1), step(2), step(3), step(4), step(1), step(5)]}, "hand: 1 evicted at 4; replay of 1 REPLAY_TOO_OLD"),
    case("l2.req.expired.001", "normal", "a skipped number below the horizon is expired, not executed late", {"op": "stream", "policy": P, "steps": [step(1), step(3), step(4), step(5), step(6), step(2)]}, "hand: horizon 3 after evicting 1 and 3; 2 REQUEST_EXPIRED"),
    case("l2.req.late.001", "normal", "a skipped number above the horizon is still new (out of order)", {"op": "stream", "policy": P, "steps": [step(1), step(3), step(2)]}, "hand: NEW NEW NEW"),
    case("l2.req.age.001", "normal", "age eviction: the oldest goes when older than maxAgeMs", {"op": "stream", "policy": P, "steps": [step(1, at=0), step(2, at=500), step(3, at=2000), step(1, at=2100)]}, "hand: 1 and 2 evicted at 2000; 1 REPLAY_TOO_OLD"),
    case("l2.req.invalid.001", "normal", "a non-positive sequence number is invalid", {"op": "stream", "policy": P, "steps": [step(0), step(-4), step(1)]}, "hand: INVALID_REQUEST twice"),
    case("l2.req.boundary.001", "boundary", "exactly maxRecent receipts: nothing is evicted; one more evicts the lowest", {"op": "stream", "policy": P, "steps": [step(1), step(2), step(3), step(1), step(4), step(1)]}, "hand: REPLAY at 3 kept; REPLAY_TOO_OLD after the fourth"),
    case("l2.req.boundary.002", "boundary", "age exactly maxAgeMs is kept; one millisecond more evicts", {"op": "stream", "policy": P, "steps": [step(1, at=0), step(2, at=1000), step(1, at=1000), step(3, at=1001), step(1, at=1001)]}, "hand: kept at 1000, evicted at 1001"),
    case("l2.req.policy.001", "failure", "maxRecent 0 is not a policy", {"op": "stream", "policy": {"maxRecent": 0, "maxAgeMs": 10}, "steps": [step(1)]}, "hand: maxRecent >= 1", "INVALID_NUMBER"),
]
for i in range(10):
    steps, nxt, t = [], 1, 0
    for _ in range(rng.randint(5, 30)):
        t += rng.randint(0, 700)
        r = rng.random()
        if r < 0.55:
            seq = nxt + (1 if rng.random() < 0.15 else 0)
            nxt = seq + 1
        else:
            seq = rng.randint(1, max(1, nxt))
        steps.append(step(seq, rng.choice("ab"), t))
    Q.append(case(f"l2.req.random.{i + 1:03d}", "normal", "seeded random deliveries", {"op": "stream", "policy": P, "steps": steps}, "oracle: rules 1-5 in order"))
# ---------------------------------------------------------------- work
W = [
    case("l2.work.table.001", "normal", "the transition table", {"op": "work", "allocated": 2, "ops": [
        {"producer": 1, "unit": 1, "op": "complete"}, {"producer": 1, "unit": 1, "op": "reserve"}, {"producer": 1, "unit": 1, "op": "reserve"},
        {"producer": 1, "unit": 1, "op": "complete"}, {"producer": 1, "unit": 1, "op": "complete"}, {"producer": 1, "unit": 1, "op": "release"},
        {"producer": 1, "unit": 2, "op": "reserve"}, {"producer": 1, "unit": 2, "op": "release"}, {"producer": 1, "unit": 2, "op": "complete"},
        {"producer": 1, "unit": 3, "op": "abandon"}, {"producer": 1, "unit": 3, "op": "abandon"}, {"producer": 1, "unit": 3, "op": "reserve"}]},
        "hand: NOT_RESERVED OK REPLAYED OK REPLAYED INELIGIBLE OK OK INELIGIBLE OK REPLAYED INELIGIBLE"),
    case("l2.work.retire.001", "normal", "retirement needs no open work and no gap; a retired producer refuses everything", {"op": "work", "allocated": 3, "ops": [
        {"producer": 2, "unit": 1, "op": "reserve"}, {"producer": 2, "op": "retire"}, {"producer": 2, "unit": 1, "op": "complete"},
        {"producer": 2, "unit": 3, "op": "abandon"}, {"producer": 2, "op": "retire"}, {"producer": 2, "unit": 2, "op": "abandon"},
        {"producer": 2, "op": "retire"}, {"producer": 2, "unit": 4, "op": "reserve"}, {"producer": 4, "unit": 1, "op": "reserve"}, {"producer": 3, "op": "retire"}]},
        "hand: OK OPEN_WORK OK OK GAP OK OK RETIRED UNKNOWN OK"),
    case("l2.work.boundary.001", "boundary", "a producer that never did any work may retire; its number is never reused", {"op": "work", "allocated": 1, "ops": [{"producer": 1, "op": "retire"}, {"producer": 1, "unit": 1, "op": "reserve"}, {"producer": 2, "unit": 1, "op": "reserve"}]}, "hand: OK RETIRED UNKNOWN"),
    case("l2.work.invalid.001", "failure", "a negative allocation is not a producer table", {"op": "work", "allocated": -1, "ops": []}, "hand: allocations count from 0", "INVALID_NUMBER"),
]
for i in range(10):
    ops = []
    for _ in range(rng.randint(5, 40)):
        if rng.random() < 0.1:
            ops.append({"producer": rng.randint(1, 3), "op": "retire"})
        else:
            ops.append({"producer": rng.randint(0, 3), "unit": rng.randint(1, 5), "op": rng.choice(["reserve", "reserve", "complete", "release", "abandon"])})
    W.append(case(f"l2.work.random.{i + 1:03d}", "normal", "seeded random work operations", {"op": "work", "allocated": 2, "ops": ops}, "oracle: the transition table"))
# ---------------------------------------------------------------- settlement
ECON = {"actionMs": 36000, "y0Milli": 1000, "y1Milli": 100, "expPerAction": 10, "expBase": 100, "maxLevel": 50,
        "featTiers": [{"threshold": 100, "bp": 5000}, {"threshold": 1000, "bp": 2500}, {"threshold": 10000, "bp": 2500}],
        "efficiency": [{"fromMs": 0, "bp": 0}], "monumentBaseGold": 50, "monumentGrowthBp": 1500, "monumentBpPerLevel": 200, "monumentMaxLevel": 30,
        "recruitGold": 100, "maxGatherers": 8, "smithOrePerBar": 2, "smithUnitMs": 60000}
OWNER = {**ECON, "y1Milli": 0, "expPerAction": 0, "featTiers": [{"threshold": 100, "bp": 5000}]}
S = [
    case("l2.settle.owner.001", "boundary", "the owner's example: 100 ore per hour, +50% after 100 ore, two hours: 250 in every partition",
         {"op": "settle", "economy": OWNER, "gatherers": 1, "schedule": [], "untilMs": 7200000, "partitions": [[], [3600000], [600000, 3599999, 3600000, 3600001]]}, "hand: 100 in hour 1 (the 100th deposit at 3,600,000 grants the Feat), 150 in hour 2"),
    case("l2.settle.negative.001", "failure", "an efficiency window that makes production negative is refused", {"op": "settle", "economy": {**OWNER, "efficiency": [{"fromMs": 0, "bp": -20000}]}, "gatherers": 1, "schedule": [], "untilMs": 3600000, "partitions": [[]]}, "hand: 10000 - 20000 < 0", "INVALID_STATE"),
    case("l2.settle.window.001", "boundary", "an offline-efficiency window edge is captured at the next action start",
         {"op": "settle", "economy": {**OWNER, "featTiers": [], "efficiency": [{"fromMs": 0, "bp": 0}, {"fromMs": 1800000, "bp": -5000}]}, "gatherers": 1, "schedule": [], "untilMs": 3600000, "partitions": [[], [1800000], [1799999, 1800001]]},
         "hand: 50 full actions, then 50 half actions: 75"),
    case("l2.settle.mixed.001", "normal", "Monument purchases, a recruit and the smith queue at their chronological points",
         {"op": "settle", "economy": ECON, "gatherers": 2, "schedule": [{"atMs": 0, "kind": "credit", "gold": 400}, {"atMs": 600000, "kind": "monument"}, {"atMs": 900000, "kind": "monument"}, {"atMs": 1200000, "kind": "recruit"},
                                                                   {"atMs": 1500000, "kind": "createJob", "quantity": 30}, {"atMs": 2700000, "kind": "cancelJob", "job": 1}, {"atMs": 3000000, "kind": "createJob", "quantity": 5}],
          "untilMs": 5400000, "partitions": [[], [1500000, 2700000], [100, 1234567, 2699999, 4000000]]}, "oracle"),
]
for i in range(12):
    e = {**ECON, "actionMs": rng.randint(5, 60) * 1000, "expBase": rng.randint(20, 200),
         "featTiers": [{"threshold": rng.randint(5, 200), "bp": rng.randint(500, 6000)}, {"threshold": rng.randint(201, 3000), "bp": rng.randint(500, 4000)}],
         "efficiency": [{"fromMs": 0, "bp": 0}, {"fromMs": rng.randint(0, 36000000), "bp": -rng.randint(0, 5000)}]}
    horizon = rng.randint(1, 24) * 3600000
    sched = []
    for _ in range(rng.randint(0, 10)):
        r = rng.random()
        at = rng.randint(0, horizon)
        if r < 0.3:
            sched.append({"atMs": at, "kind": "credit", "gold": rng.randint(10, 400)})
        elif r < 0.5:
            sched.append({"atMs": at, "kind": "monument"})
        elif r < 0.6:
            sched.append({"atMs": at, "kind": "recruit"})
        elif r < 0.85:
            sched.append({"atMs": at, "kind": "createJob", "quantity": rng.randint(1, 20)})
        else:
            sched.append({"atMs": at, "kind": "cancelJob", "job": rng.randint(1, 3)})
    sched.sort(key=lambda d: d["atMs"])
    parts = [[], sorted(rng.randint(0, horizon) for _ in range(rng.randint(1, 8))), sorted(rng.randint(0, horizon) for _ in range(rng.randint(1, 8)))]
    S.append(case(f"l2.settle.random.{i + 1:03d}", "normal", "seeded random economy, schedule and partitions", {"op": "settle", "economy": e, "gatherers": rng.randint(1, 3), "schedule": sched, "untilMs": horizon, "partitions": parts}, "oracle: spec section 4 as a single run"))

os.makedirs(out, exist_ok=True)
for family, cases, note in [("l2-ranges", R, ""), ("l2-requests", Q, ""), ("l2-work", W, ""), ("l2-settlement", S, "The lab side settles every listed partition (with a checkpoint save and restore at each point) and requires the same result.")]:
    with open(os.path.join(out, f"{family}.draft.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc(family, cases, note), f, indent=2)
        f.write("\n")
    print(f"{family}: {len(cases)} cases")
