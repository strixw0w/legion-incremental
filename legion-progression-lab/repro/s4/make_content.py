"""Writes the S4 candidate content pack (content/w1-slice-s4.candidate.v0.4.0.json). Every number is a candidate.
The basePack sha256 is filled afterwards by src/cli/s4-fill-base.ts."""
import json
import sys

out = sys.argv[1]
C = lambda v, **kw: {"value": v, "label": "candidate", **kw}
R = lambda target, bp: {"target": target, "bp": C(bp)}
M = lambda res, qty: {"resourceId": res, "qty": C(qty)}
GEL, FANG, SCRAP = "res.mat.slime_gel", "res.mat.wolf_fang", "res.mat.goblin_scrap"
LOG, ORE, PLANK, BAR = "res.mat.log", "res.mat.copper_ore", "res.mat.plank", "res.mat.copper_bar"


def tiers(p1, p2, p3):
    return [{"toLevel": 10, "perLevelBp": C(p1)}, {"toLevel": 20, "perLevelBp": C(p2)}, {"toLevel": 30, "perLevelBp": C(p3)}]


pack = {
    "schemaVersion": 1,
    "contentId": "w1-slice-s4",
    "contentVersion": "0.4.0",
    "status": "candidate",
    "note": "S4 permanent progression for the W1 slice (planning/S4_SPECIFICATION.md, S4_RESOLUTIONS.md). Every number is a candidate; nothing is approved or live-validated. The S3 pack (basePack) is unchanged.",
    "basePack": {"path": "content/w1-slice-s3.candidate.v0.3.0.json", "sha256": "0" * 64},
    "formulaVersion": "perm-v1",
    "monuments": [
        {
            "id": "monument.power", "name": "Monument of Power", "target": "attack",
            "discovery": {"kind": "quest", "questId": "Q1"},
            "maxLevel": C(30), "baseGold": C(40), "growthBp": C(1500), "tiers": tiers(200, 100, 50),
            "milestones": [
                {"level": 5, "materials": [M(GEL, 10)]},
                {"level": 10, "materials": [M(FANG, 10)]},
                {"level": 15, "materials": [M(SCRAP, 10)]},
                {"level": 20, "materials": [M(FANG, 25), M(BAR, 5)]},
                {"level": 25, "materials": [M(SCRAP, 25)]},
                {"level": 30, "materials": [M(GEL, 50), M(BAR, 10)]},
            ],
        },
        {
            "id": "monument.vitality", "name": "Monument of Vitality", "target": "maxHp",
            "discovery": {"kind": "zoneVisited", "zoneOrder": 2},
            "maxLevel": C(30), "baseGold": C(30), "growthBp": C(1500), "tiers": tiers(300, 150, 75),
            "milestones": [
                {"level": 5, "materials": [M(GEL, 15)]},
                {"level": 10, "materials": [M(PLANK, 10)]},
                {"level": 15, "materials": [M(FANG, 15)]},
                {"level": 20, "materials": [M(SCRAP, 20), M(PLANK, 20)]},
                {"level": 25, "materials": [M(GEL, 40)]},
                {"level": 30, "materials": [M(FANG, 40), M(BAR, 10)]},
            ],
        },
        {
            "id": "monument.industry", "name": "Monument of Industry", "target": "efficiency",
            "discovery": {"kind": "gateCompleted", "zoneOrder": 2},
            "maxLevel": C(30), "baseGold": C(60), "growthBp": C(1500), "tiers": tiers(300, 150, 75),
            "milestones": [
                {"level": 5, "materials": [M(PLANK, 10)]},
                {"level": 10, "materials": [M(BAR, 10)]},
                {"level": 15, "materials": [M(PLANK, 30), M(GEL, 20)]},
                {"level": 20, "materials": [M(BAR, 25)]},
                {"level": 25, "materials": [M(PLANK, 50), M(FANG, 30)]},
                {"level": 30, "materials": [M(BAR, 50), M(SCRAP, 30)]},
            ],
        },
    ],
    "bestiary": {
        "species": [
            {"enemyId": "enemy.w1.green_slime", "ranks": [{"rank": "bronze", "kills": C(25), "reward": R("attack", 100)}, {"rank": "silver", "kills": C(150), "reward": R("maxHp", 200)}, {"rank": "gold", "kills": C(600), "reward": R("attack", 200)}],
             "emblem": {"dropBp": C(20), "reward": R("gatherEfficiency", 200)}},
            {"enemyId": "enemy.w1.wolf", "ranks": [{"rank": "bronze", "kills": C(25), "reward": R("critChance", 50)}, {"rank": "silver", "kills": C(150), "reward": R("attack", 150)}, {"rank": "gold", "kills": C(600), "reward": R("maxHp", 300)}],
             "emblem": {"dropBp": C(20), "reward": R("critChance", 100)}},
            {"enemyId": "enemy.w1.goblin", "ranks": [{"rank": "bronze", "kills": C(25), "reward": R("maxHp", 200)}, {"rank": "silver", "kills": C(150), "reward": R("attack", 200)}, {"rank": "gold", "kills": C(600), "reward": R("abilityPower", 500)}],
             "emblem": {"dropBp": C(20), "reward": R("attack", 200)}},
        ],
        "regions": [{"id": "region.w1.slice", "species": ["enemy.w1.green_slime", "enemy.w1.wolf", "enemy.w1.goblin"], "completion": R("attack", 200), "mastery": R("attack", 500)}],
    },
    "feats": [
        {"id": "feat.combat.kills", "counter": "accountKills", "tiers": [{"threshold": C(100), "reward": R("attack", 50)}, {"threshold": C(500), "reward": R("maxHp", 100)}, {"threshold": C(2000), "reward": R("attack", 100)}, {"threshold": C(5000), "reward": R("attack", 150)}]},
        {"id": "feat.combat.gold", "counter": "goldEarned", "tiers": [{"threshold": C(1000), "reward": R("attack", 50)}, {"threshold": C(10000), "reward": R("maxHp", 100)}]},
        {"id": "feat.roster.levels", "counter": "rosterLevelsHigh", "tiers": [{"threshold": C(25), "reward": R("maxHp", 100)}, {"threshold": C(60), "reward": R("attack", 100)}, {"threshold": C(120), "reward": R("attack", 150)}]},
        {"id": "feat.prof.levels", "counter": "professionLevelsHigh", "tiers": [{"threshold": C(20), "reward": R("gatherEfficiency", 200)}, {"threshold": C(40), "reward": R("smithEfficiency", 300)}]},
        {"id": "feat.gather.units", "counter": "gatheredUnits", "tiers": [{"threshold": C(200), "reward": R("gatherEfficiency", 100)}, {"threshold": C(2000), "reward": R("gatherEfficiency", 200)}]},
        {"id": "feat.prod.units", "counter": "unitsCompleted", "tiers": [{"threshold": C(20), "reward": R("smithEfficiency", 200)}, {"threshold": C(100), "reward": R("smithEfficiency", 300)}]},
        {"id": "feat.craft.items", "counter": "itemsCrafted", "tiers": [{"threshold": C(1), "reward": R("maxHp", 50)}, {"threshold": C(10), "reward": R("attack", 100)}, {"threshold": C(30), "reward": R("attack", 100)}]},
        {"id": "feat.equip.enhance", "counter": "enhancements", "tiers": [{"threshold": C(1), "reward": R("critChance", 50)}, {"threshold": C(10), "reward": R("attack", 100)}]},
        {"id": "feat.explore.zones", "counter": "zonesVisited", "tiers": [{"threshold": C(2), "reward": R("maxHp", 100)}, {"threshold": C(3), "reward": R("attack", 100)}]},
        {"id": "feat.conquest.gates", "counter": "gatesCompleted", "tiers": [{"threshold": C(1), "reward": R("attack", 50)}, {"threshold": C(2), "reward": R("maxHp", 150)}]},
        {"id": "feat.conquest.boss", "counter": "bossCleared", "tiers": [{"threshold": C(1), "reward": R("attack", 200)}]},
    ],
    "classRecords": [
        {"cls": "warrior", "milestones": [{"record": C(5), "reward": R("maxHp", 300)}, {"record": C(10), "reward": R("attack", 200)}, {"record": C(20), "reward": R("maxHp", 500)}]},
        {"cls": "archer", "milestones": [{"record": C(5), "reward": R("critChance", 100)}, {"record": C(10), "reward": R("critChance", 150)}, {"record": C(20), "reward": R("attack", 300)}]},
        {"cls": "mage", "milestones": [{"record": C(5), "reward": R("abilityPower", 500)}, {"record": C(10), "reward": R("gatherEfficiency", 300)}, {"record": C(20), "reward": R("smithEfficiency", 500)}]},
    ],
    "roster": [{"id": "roster.recruits", "counter": "recruitsAcquired", "tiers": [{"threshold": C(2), "reward": R("attack", 100)}, {"threshold": C(3), "reward": R("maxHp", 200)}]}],
    "starterWeapon": {"id": "item.starter.training_blade", "name": "Training Blade", "tier": "tier.starter", "attackMilli": C(1000), "note": "Candidate variant only (owner S3.1 acceptance section 4B); applied by the s4.starterWeapon variant, never by the control."},
    "extensionPoints": {"monument.eternity": "S5: offline efficiency; no content or mechanics in S4"},
}
open(out, "w", encoding="utf-8", newline="\n").write(json.dumps(pack, indent=2) + "\n")
print(f"wrote {out}")
