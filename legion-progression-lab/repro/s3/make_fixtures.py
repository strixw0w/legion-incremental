"""Writes the S3 fixture drafts (expected values "ORACLE", filled by spec/oracle/s3_oracle.py --fill).
Usage: python -I repro/s3/make_fixtures.py <out-dir>"""
import json
import os
import sys

out = sys.argv[1]
WOOD = [
    {"id": "item.wood.club", "slot": "weapon", "tier": "tier.wood", "classes": ["none", "warrior", "archer", "mage"], "attackMilli": 2000},
    {"id": "item.wood.sword", "slot": "weapon", "tier": "tier.wood", "classes": ["warrior"], "attackMilli": 3000},
    {"id": "item.wood.bow", "slot": "weapon", "tier": "tier.wood", "classes": ["archer"], "attackMilli": 3000},
    {"id": "item.wood.helmet", "slot": "helmet", "tier": "tier.wood", "defence": 1, "hp": 5},
    {"id": "item.wood.chest", "slot": "chestplate", "tier": "tier.wood", "defence": 2, "hp": 10},
    {"id": "item.wood.hammer", "slot": "hammer", "tier": "tier.wood", "efficiencyBp": 2000},
    {"id": "item.wood.pickaxe", "slot": "pickaxe", "tier": "tier.wood", "efficiencyBp": 0},
    {"id": "item.copper.helmet", "slot": "helmet", "tier": "tier.copper", "defence": 2, "hp": 10},
    {"id": "item.copper.chest", "slot": "chestplate", "tier": "tier.copper", "defence": 4, "hp": 20},
    {"id": "item.copper.bow", "slot": "weapon", "tier": "tier.copper", "classes": ["archer"], "attackMilli": 6000},
    {"id": "item.copper.pickaxe", "slot": "pickaxe", "tier": "tier.copper", "efficiencyBp": 3000},
    {"id": "item.iron.helmet", "slot": "helmet", "tier": "tier.iron", "defence": 4, "hp": 20},
]


def case(id, kind, desc, inp, deriv, error=None):
    c = {"id": id, "kind": kind, "description": desc, "input": inp, "derivation": deriv}
    if error:
        c["expectedError"] = error
    else:
        c["expected"] = "ORACLE"
    return c


def write(name, family, independence, cases):
    data = {"fixtureSet": family, "fixtureVersion": 1, "specRef": "spec/formulas/s3-industry.md#v1", "status": "candidate", "independence": independence, "cases": cases}
    with open(os.path.join(out, name), "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


R = lambda **kw: dict(defs=WOOD, **kw)
rules = [
    case("s3.rules.efficiency.warrior-mining.001", "normal", "Warrior mining level 4 with a Copper pickaxe +2: 3 x 400 + 3600 + 2500 affinity", R(op="efficiency", characterId="rec:1", cls="warrior", profession="mining", profExp={"rec:1": {"mining": 98}}, items=[{"defId": "item.copper.pickaxe", "enhancement": 2, "equip": {"characterId": "rec:1", "slot": "pickaxe"}}]), "hand: level 4 at 98 EXP (10+30+58); 3000 x 1.2 = 3600; total 7300"),
    case("s3.rules.efficiency.mage-wood.001", "normal", "Mage woodcutting level 1 without a tool: the affinity only", R(op="efficiency", characterId="rec:1", cls="mage", profession="woodcutting"), "hand: 0 + 0 + 2500"),
    case("s3.rules.efficiency.level-boundary.001", "boundary", "classless smith exactly at the level-2 threshold with a Wood hammer", R(op="efficiency", characterId="rec:2", cls="none", profession="smithing", profExp={"rec:2": {"smithing": 10}}, items=[{"defId": "item.wood.hammer", "equip": {"characterId": "rec:2", "slot": "hammer"}}]), "hand: level 2 at exactly 10 EXP: 400 + 2000"),
    case("s3.rules.efficiency.archer-not-mining.001", "boundary", "an Archer's affinity (Smithing) does not apply to Mining", R(op="efficiency", characterId="rec:1", cls="archer", profession="mining"), "hand: 0"),
    case("s3.rules.gather.alternating.001", "boundary", "1.5 units per action deposit 1, 2, 1, 2 with an exact remainder", R(op="gather-deposits", baseYieldMilli=1500, efficiencies=[0, 0, 0, 0]), "hand: 1.5 -> 1 r .5; 2.0 -> 2 r 0"),
    case("s3.rules.gather.level2.001", "normal", "1.04 units per action (+400 bp) over five actions", R(op="gather-deposits", baseYieldMilli=1000, efficiencies=[400, 400, 400, 400, 400]), "hand: remainder grows by 400000 per action"),
    case("s3.rules.gather.captured.001", "normal", "captured efficiencies change between actions (0, 2500, 2500, 2500, 400)", R(op="gather-deposits", baseYieldMilli=1000, efficiencies=[0, 2500, 2500, 2500, 400]), "hand: 1; 1.25; 1.5; 1.75 -> 1 each, remainder .75; then 1.79 -> 1"),
    case("s3.rules.unit-time.hammer.001", "normal", "4000 ms plank with +2000 bp: ceil(40000000 / 12000)", R(op="unit-time", unitMs=4000, efficiencyBp=2000), "hand: 3333.33 -> 3334"),
    case("s3.rules.unit-time.none.001", "boundary", "no efficiency: the recipe time exactly", R(op="unit-time", unitMs=4000, efficiencyBp=0), "hand: 4000"),
    case("s3.rules.unit-time.bar.001", "normal", "6000 ms bar with +4500 bp", R(op="unit-time", unitMs=6000, efficiencyBp=4500), "hand: 60000000 / 14500 = 4137.9 -> 4138"),
    case("s3.rules.stats.chest5.001", "normal", "Wood chest at +5", R(op="item-stats", defId="item.wood.chest", enhancement=5), "hand: 2 x 1.5 = 3; 10 x 1.5 = 15"),
    case("s3.rules.stats.helmet5.001", "boundary", "Wood helmet at +5 rounds down", R(op="item-stats", defId="item.wood.helmet", enhancement=5), "hand: 1 x 1.5 = 1; 5 x 1.5 = 7"),
    case("s3.rules.enhance.cost0.001", "boundary", "first enhancement of a Wood item", R(op="enhancement-cost", defId="item.wood.chest", level=0), "hand: 20 x 1 gold, 1 plank"),
    case("s3.rules.enhance.cost4.001", "normal", "+4 to +5 of a Copper item", R(op="enhancement-cost", defId="item.copper.chest", level=4), "hand: 20 x 25 = 500 gold, 5 bars"),
    case("s3.rules.enhance.no-material.001", "failure", "an Iron item has no enhancement material in S3", R(op="enhancement-cost", defId="item.iron.helmet", level=0), "spec section 3: invalid content", error="INVALID_CONTENT"),
    case("s3.rules.enhance.unknown.001", "failure", "an unknown item definition", R(op="item-stats", defId="item.wood.nothing", enhancement=0), "spec: invalid content", error="INVALID_CONTENT"),
    case("s3.rules.salvage.001", "boundary", "half of 3 planks and of 4 bars; a 1-plank line returns nothing and is omitted", R(op="salvage", recoverable=[{"resourceId": "res.mat.plank", "qty": 3}, {"resourceId": "res.mat.copper_bar", "qty": 4}, {"resourceId": "res.mat.slime_gel", "qty": 1}]), "hand: 1, 2, 0 (omitted)"),
    case("s3.rules.shares.lethal.001", "normal", "lethal batch 6 + 5 damage removing 8 HP", R(op="effective-shares", damages=[6, 5], hpRemoved=8), "hand: floors 4, 3 (remainders 4, 7); the leftover unit goes to the second blow -> 4, 4"),
    case("s3.rules.shares.tie.001", "boundary", "equal remainders: the earlier blow gets the leftover", R(op="effective-shares", damages=[3, 3], hpRemoved=3), "hand: floors 1, 1; remainders 3, 3 -> 2, 1"),
    case("s3.rules.shares.full.001", "boundary", "total damage not above the HP removed: every blow in full", R(op="effective-shares", damages=[5, 2], hpRemoved=10), "hand: 5, 2"),
    case("s3.rules.shares.three.001", "normal", "three blows 9, 0, 4 removing 7 HP", R(op="effective-shares", damages=[9, 0, 4], hpRemoved=7), "oracle"),
]
write("industry-rules.v1.json", "industry-rules", "S3 rule formulas (spec/formulas/s3-industry.md v1 sections 1-3 and 5), re-derived by spec/oracle/s3_oracle.py from the formula text with Python integers; the lab side calls the real helpers (engine/industry.ts, model/industryContent.ts, experiments/industryMetrics.ts) on a minimal content view. Most cases are also derived by hand.", rules)

eq = [
    case("s3.equip.mods.hero.001", "normal", "hero with a Wood sword +1, a Wood chest and a pickaxe (tools add no combat stats)", R(op="mods", characterId="hero", items=[{"defId": "item.wood.sword", "enhancement": 1, "equip": {"characterId": "hero", "slot": "weapon"}}, {"defId": "item.wood.chest", "equip": {"characterId": "hero", "slot": "chestplate"}}, {"defId": "item.wood.pickaxe", "equip": {"characterId": "hero", "slot": "pickaxe"}}]), "hand: 3300 attack, 10 HP, 2 defence"),
    case("s3.equip.mods.exclusive.001", "normal", "direction D: the hero's weapon bonus +100%", R(op="mods", characterId="hero", rules={"exclusiveWeaponBp": 10000}, items=[{"defId": "item.copper.bow", "equip": {"characterId": "hero", "slot": "weapon"}}]), "hand: 6000 x 2 = 12000"),
    case("s3.equip.mods.recruit-no-bonus.001", "boundary", "the hero-only bonus does not apply to a recruit", R(op="mods", characterId="rec:1", rules={"exclusiveWeaponBp": 10000}, items=[{"defId": "item.copper.bow", "equip": {"characterId": "rec:1", "slot": "weapon"}}]), "hand: 6000"),
    case("s3.equip.auto.001", "normal", "auto-equip: best helmet (tie to the lowest ID), a chest not taken from another character, no incompatible weapon", R(op="auto-equip", characterId="hero", cls="none", items=[{"defId": "item.wood.helmet"}, {"defId": "item.copper.helmet"}, {"defId": "item.copper.helmet"}, {"defId": "item.copper.chest", "equip": {"characterId": "rec:1", "slot": "chestplate"}}, {"defId": "item.wood.chest"}, {"defId": "item.wood.sword"}]), "hand: helmet=item:2, chestplate=item:5"),
    case("s3.equip.auto.strict.001", "boundary", "an equal-scoring item never replaces the current one", R(op="auto-equip", characterId="hero", cls="none", items=[{"defId": "item.copper.helmet", "equip": {"characterId": "hero", "slot": "helmet"}}, {"defId": "item.copper.helmet"}]), "hand: empty plan"),
    case("s3.equip.auto.weapon.001", "normal", "a Warrior's sword beats the equipped club", R(op="auto-equip", characterId="rec:1", cls="warrior", items=[{"defId": "item.wood.club", "equip": {"characterId": "rec:1", "slot": "weapon"}}, {"defId": "item.wood.sword"}, {"defId": "item.wood.bow"}]), "hand: weapon=item:2"),
    case("s3.equip.consume.equipped.001", "failure", "consume check: an equipped item", R(op="consume-check", targetDefId="item.copper.helmet", itemId="item:1", items=[{"defId": "item.wood.helmet", "equip": {"characterId": "hero", "slot": "helmet"}}]), "spec section 3: ITEM_EQUIPPED first"),
    case("s3.equip.consume.protected.001", "boundary", "consume check: a protected inventory item", R(op="consume-check", targetDefId="item.copper.helmet", itemId="item:1", items=[{"defId": "item.wood.helmet", "protected": True}]), "ITEM_PROTECTED"),
    case("s3.equip.consume.same-tier.001", "boundary", "consume check: same tier", R(op="consume-check", targetDefId="item.copper.helmet", itemId="item:1", items=[{"defId": "item.copper.helmet"}]), "CONSUME_ITEM_INVALID"),
    case("s3.equip.consume.ok.001", "normal", "consume check: a free lower-tier helmet", R(op="consume-check", targetDefId="item.copper.helmet", itemId="item:1", items=[{"defId": "item.wood.helmet", "enhancement": 4}]), "hand: null, allowed"),
    case("s3.equip.consume.consumed.001", "boundary", "consume check: an already consumed item", R(op="consume-check", targetDefId="item.copper.helmet", itemId="item:1", items=[{"defId": "item.wood.helmet", "location": "consumed"}]), "ITEM_UNAVAILABLE"),
    case("s3.equip.consume.unknown-item.001", "boundary", "consume check: an unknown item", R(op="consume-check", targetDefId="item.copper.helmet", itemId="item:7", items=[]), "ITEM_UNKNOWN"),
    case("s3.equip.consume.unknown-target.001", "failure", "consume check against an unknown recipe target", R(op="consume-check", targetDefId="item.copper.nothing", itemId="item:1", items=[]), "invalid content", error="INVALID_CONTENT"),
    case("s3.equip.weapon.bow-warrior.001", "boundary", "a bow does not fit a Warrior", R(op="weapon-compatible", defId="item.wood.bow", cls="warrior"), "hand: the bow lists only archer"),
    case("s3.equip.weapon.club-none.001", "normal", "the club fits a classless hero", R(op="weapon-compatible", defId="item.wood.club", cls="none"), "hand: the club lists none"),
]
write("equipment-ops.v1.json", "equipment-ops", "S3 equipment rules (spec/formulas/s3-industry.md v1 section 3), re-derived by spec/oracle/s3_oracle.py; the lab side calls the real computeMods, autoEquipPlan, consumable and weaponCompatible. Most cases are also derived by hand.", eq)


def Q(**kw):
    base = dict(arm="fifo", unitMs=4000, smiths=[{"hammer": False}], hammerEffBp=0, gatherer=None, startLogs=6, sessions=[{"startMs": 0, "endMs": 60000}], commands=[], untilMs=61000)
    base.update(kw)
    return base


queue = [
    case("s3.queue.fifo.compete.001", "normal", "one smith, two jobs competing for 6 logs: the earlier job reserves first; the later pauses", Q(commands=[{"atMs": 0, "type": "enqueue", "quantity": 2}, {"atMs": 1000, "type": "enqueue", "quantity": 2}]), "hand: job:1 units at 0 and 4000; job:2 one unit at 8000 then paused"),
    case("s3.queue.same-moment.cancel.001", "boundary", "a unit completing at t is kept before a cancellation at t; the unit started at t is released", Q(commands=[{"atMs": 1000, "type": "enqueue", "quantity": 3}, {"atMs": 5000, "type": "cancel", "jobId": "job:1"}]), "hand: u1 completes at 5000; u2 starts and is released at 5000"),
    case("s3.queue.reserve-all.001", "normal", "reserve-all arm: two smiths, 10 logs, two jobs of 3; the second is cancelled while paused", Q(arm="reserve-all", smiths=[{"hammer": False}, {"hammer": False}], startLogs=10, commands=[{"atMs": 0, "type": "enqueue", "quantity": 3}, {"atMs": 0, "type": "enqueue", "quantity": 3}, {"atMs": 6000, "type": "cancel", "jobId": "job:2"}]), "oracle"),
    case("s3.queue.round-robin.001", "normal", "round-robin arm: one smith alternates between two jobs", Q(arm="round-robin", startLogs=8, commands=[{"atMs": 0, "type": "enqueue", "quantity": 2}, {"atMs": 0, "type": "enqueue", "quantity": 2}]), "hand: job:1, job:2, job:1, job:2"),
    case("s3.queue.supply.001", "normal", "a gatherer supplies 1 log per 3 s; the job pauses and resumes at each covering deposit", Q(startLogs=0, gatherer={"actionMs": 3000, "yieldMilli": 1000}, commands=[{"atMs": 0, "type": "enqueue", "quantity": 3}]), "oracle"),
    case("s3.queue.session.001", "boundary", "a session end releases the unit; work resumes at the next session start", Q(startLogs=2, sessions=[{"startMs": 0, "endMs": 3000}, {"startMs": 10000, "endMs": 20000}], commands=[{"atMs": 1000, "type": "enqueue", "quantity": 1}], untilMs=21000), "hand: u1 1000 released at 3000; u2 10000-14000"),
    case("s3.queue.reassign.001", "normal", "reassigning the smith mid-unit releases the reservation; reassigning back restarts", Q(startLogs=2, commands=[{"atMs": 1000, "type": "enqueue", "quantity": 1}, {"atMs": 3000, "type": "assign", "member": "rec:1", "to": "idle"}, {"atMs": 5000, "type": "assign", "member": "rec:1", "to": "smithing"}]), "hand: u1 released at 3000; u2 5000-9000"),
    case("s3.queue.hammer.001", "boundary", "a Wood hammer (+2000 bp): units of ceil(40000000 / 12000) = 3334 ms", Q(smiths=[{"hammer": True}], hammerEffBp=2000, startLogs=4, commands=[{"atMs": 0, "type": "enqueue", "quantity": 2}]), "hand: 0-3334, 3334-6668"),
    case("s3.queue.rejected.001", "boundary", "an empty quantity and an unknown or finished job are refused without effect", Q(startLogs=2, commands=[{"atMs": 0, "type": "enqueue", "quantity": 0}, {"atMs": 0, "type": "cancel", "jobId": "job:9"}, {"atMs": 0, "type": "enqueue", "quantity": 1}, {"atMs": 5000, "type": "cancel", "jobId": "job:1"}]), "hand: BAD_QUANTITY, JOB_UNKNOWN, then job:1 completes at 4000 and the cancel is JOB_FINISHED"),
    case("s3.queue.two-smiths.001", "normal", "two smiths take two jobs at once; one job is never worked by two smiths", Q(smiths=[{"hammer": False}, {"hammer": True}], hammerEffBp=4500, startLogs=12, commands=[{"atMs": 0, "type": "enqueue", "quantity": 3}, {"atMs": 500, "type": "enqueue", "quantity": 2}]), "oracle"),
    case("s3.queue.reserve-all.cancel-held.001", "boundary", "reserve-all arm: the smith leaves mid-unit (the job keeps its reservation), then the waiting job is cancelled: everything is released", Q(arm="reserve-all", startLogs=6, commands=[{"atMs": 0, "type": "enqueue", "quantity": 3}, {"atMs": 1000, "type": "assign", "member": "rec:1", "to": "idle"}, {"atMs": 2000, "type": "cancel", "jobId": "job:1"}]), "hand: 6 logs reserved at 0; unit released at 1000 with the reservation kept; the cancel at 2000 returns all 6"),
    case("s3.queue.bad-sessions.001", "failure", "overlapping sessions are refused", Q(sessions=[{"startMs": 0, "endMs": 5000}, {"startMs": 4000, "endMs": 9000}]), "engine: INVALID_STATE", error="INVALID_STATE"),
]
write("production-queue.v1.json", "production-queue", "The O10 production queue (spec/formulas/s3-industry.md v1 section 4), re-derived by spec/oracle/s3_oracle.py as an independent discrete-event model written from the formula text; the lab side builds synthetic packs in memory and runs the real engine. Several cases are also derived by hand.", queue)
print("drafts written to", out)
