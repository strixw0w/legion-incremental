"""Writes content/w1-slice-s3.candidate.v0.3.0.json (every value a candidate; planning/S3_RESOLUTIONS.md).
The basePack fingerprint is filled in by `node src/cli/s3-content.ts --fill-base`. Usage: python -I repro/s3/make_content.py"""
import json


def L(v):
    return {"value": v, "label": "candidate"}


def item(id, name, slot, tier, maxEnh=5, **stats):
    d = {"id": id, "name": name, "slot": slot, "tier": tier, "maxEnhancement": L(maxEnh)}
    for k, v in stats.items():
        d[k] = v if k == "classes" else L(v)
    return d


items = [
    item("item.wood.club", "Wooden Club", "weapon", "tier.wood", classes=["none", "warrior", "archer", "mage"], attackMilli=2000),
    item("item.wood.sword", "Wooden Sword", "weapon", "tier.wood", classes=["warrior"], attackMilli=3000),
    item("item.wood.bow", "Wooden Bow", "weapon", "tier.wood", classes=["archer"], attackMilli=3000),
    item("item.wood.staff", "Wooden Staff", "weapon", "tier.wood", classes=["mage"], attackMilli=3000),
    item("item.wood.helmet", "Wooden Helmet", "helmet", "tier.wood", defence=1, hp=5),
    item("item.wood.chest", "Wooden Chestplate", "chestplate", "tier.wood", defence=2, hp=10),
    item("item.wood.legs", "Wooden Leggings", "leggings", "tier.wood", defence=1, hp=8),
    item("item.wood.boots", "Wooden Boots", "boots", "tier.wood", defence=1, hp=5),
    item("item.wood.charm", "Gel Charm", "accessory", "tier.wood", hp=8, critBp=0),
    item("item.wood.pickaxe", "Wooden Pickaxe", "pickaxe", "tier.wood", efficiencyBp=0),
    item("item.wood.axe", "Wooden Axe", "axe", "tier.wood", efficiencyBp=2000),
    item("item.wood.hammer", "Wooden Hammer", "hammer", "tier.wood", efficiencyBp=2000),
    item("item.copper.sword", "Copper Sword", "weapon", "tier.copper", classes=["warrior"], attackMilli=6000),
    item("item.copper.bow", "Copper Bow", "weapon", "tier.copper", classes=["archer"], attackMilli=6000),
    item("item.copper.staff", "Copper Staff", "weapon", "tier.copper", classes=["mage"], attackMilli=6000),
    item("item.copper.helmet", "Copper Helmet", "helmet", "tier.copper", defence=2, hp=10),
    item("item.copper.chest", "Copper Chestplate", "chestplate", "tier.copper", defence=4, hp=20),
    item("item.copper.legs", "Copper Leggings", "leggings", "tier.copper", defence=3, hp=15),
    item("item.copper.boots", "Copper Boots", "boots", "tier.copper", defence=2, hp=10),
    item("item.copper.ring", "Copper Ring", "accessory", "tier.copper", hp=12, critBp=300),
    item("item.copper.pickaxe", "Copper Pickaxe", "pickaxe", "tier.copper", efficiencyBp=3000),
    item("item.copper.axe", "Copper Axe", "axe", "tier.copper", efficiencyBp=4500),
    item("item.copper.hammer", "Copper Hammer", "hammer", "tier.copper", efficiencyBp=4500),
]


def I(*pairs):
    return [{"resourceId": r, "qty": L(q)} for r, q in pairs]


def craft(id, itemId, smith, inputs, recover, exp, consumes=False):
    d = {"id": id, "kind": "item", "itemId": itemId, "smithingLevel": L(smith), "inputs": I(*inputs), "recoverable": I(*recover), "exp": L(exp)}
    if consumes:
        d["consumesLowerTierSameSlot"] = True
    return d


P, B, G, F, S, LOG, ORE = "res.mat.plank", "res.mat.copper_bar", "res.mat.slime_gel", "res.mat.wolf_fang", "res.mat.goblin_scrap", "res.mat.log", "res.mat.copper_ore"
recipes = [
    {"id": "recipe.plank", "kind": "timed", "smithingLevel": L(1), "unitMs": L(4000), "inputs": I((LOG, 2)), "outputs": I((P, 1)), "exp": L(3)},
    {"id": "recipe.copper_bar", "kind": "timed", "smithingLevel": L(2), "unitMs": L(6000), "inputs": I((ORE, 2)), "outputs": I((B, 1)), "exp": L(5)},
    craft("recipe.wood.club", "item.wood.club", 1, [(P, 2)], [(P, 2)], 4),
    craft("recipe.wood.sword", "item.wood.sword", 1, [(P, 2), (G, 2)], [(P, 2)], 5),
    craft("recipe.wood.bow", "item.wood.bow", 1, [(P, 2), (G, 2)], [(P, 2)], 5),
    craft("recipe.wood.staff", "item.wood.staff", 1, [(P, 2), (G, 2)], [(P, 2)], 5),
    craft("recipe.wood.helmet", "item.wood.helmet", 1, [(P, 2)], [(P, 2)], 4),
    craft("recipe.wood.chest", "item.wood.chest", 1, [(P, 4)], [(P, 4)], 6),
    craft("recipe.wood.legs", "item.wood.legs", 1, [(P, 3)], [(P, 3)], 5),
    craft("recipe.wood.boots", "item.wood.boots", 1, [(P, 2)], [(P, 2)], 4),
    craft("recipe.wood.charm", "item.wood.charm", 1, [(P, 1), (G, 4)], [(P, 1)], 4),
    craft("recipe.wood.pickaxe", "item.wood.pickaxe", 1, [(P, 3)], [(P, 3)], 5),
    craft("recipe.wood.axe", "item.wood.axe", 1, [(P, 2)], [(P, 2)], 4),
    craft("recipe.wood.hammer", "item.wood.hammer", 1, [(P, 2)], [(P, 2)], 4),
    craft("recipe.copper.sword", "item.copper.sword", 3, [(B, 3), (F, 2)], [(B, 3)], 10, True),
    craft("recipe.copper.bow", "item.copper.bow", 3, [(B, 3), (F, 2)], [(B, 3)], 10, True),
    craft("recipe.copper.staff", "item.copper.staff", 3, [(B, 3), (F, 2)], [(B, 3)], 10, True),
    craft("recipe.copper.helmet", "item.copper.helmet", 3, [(B, 2), (F, 1)], [(B, 2)], 8, True),
    craft("recipe.copper.chest", "item.copper.chest", 3, [(B, 4), (F, 2)], [(B, 4)], 12, True),
    craft("recipe.copper.legs", "item.copper.legs", 3, [(B, 3), (F, 1)], [(B, 3)], 10, True),
    craft("recipe.copper.boots", "item.copper.boots", 3, [(B, 2), (F, 1)], [(B, 2)], 8, True),
    craft("recipe.copper.ring", "item.copper.ring", 3, [(B, 2), (S, 2)], [(B, 2)], 8, True),
    craft("recipe.copper.pickaxe", "item.copper.pickaxe", 3, [(B, 3), (LOG, 2)], [(B, 3)], 10, True),
    craft("recipe.copper.axe", "item.copper.axe", 3, [(B, 2), (LOG, 2)], [(B, 2)], 8, True),
    craft("recipe.copper.hammer", "item.copper.hammer", 3, [(B, 2), (LOG, 2)], [(B, 2)], 8, True),
]


def node(id, name, zone, prof, res, ms, yld, lvl, tool, exp):
    return {"id": id, "name": name, "zoneOrder": zone, "profession": prof, "resourceId": res, "actionMs": L(ms), "baseYieldMilli": L(yld), "levelReq": L(lvl), "tool": tool, "expPerAction": L(exp)}


pick = {"slot": "pickaxe", "minTierOrder": 1}
nodes = [
    node("node.w1.01.oak", "Meadow Oak", 1, "woodcutting", LOG, 3000, 1000, 1, None, 3),
    node("node.w1.02.oak", "Wolfwood Oak", 2, "woodcutting", LOG, 3000, 1500, 3, None, 4),
    node("node.w1.02.copper", "Wolfwood Copper Vein", 2, "mining", ORE, 3500, 1000, 1, pick, 4),
    node("node.w1.03.copper", "Encampment Copper Vein", 3, "mining", ORE, 3500, 1500, 5, pick, 6),
]
pack = {
    "schemaVersion": 1, "contentId": "w1-slice-s3", "contentVersion": "0.3.0", "status": "candidate",
    "note": "S3 extension: professions, gathering nodes, Wood and Copper equipment, recipes, enhancement, salvage. Every value is a candidate (planning/S3_RESOLUTIONS.md). Tiers 3-6 are identifiers only.",
    "basePack": {"path": "content/w1-slice-s2.candidate.v0.2.0.json", "sha256": "0" * 64},
    "resources": [
        {"id": LOG, "kind": "material", "testOnly": False, "note": "Woodcutting (Bible section 6)"},
        {"id": ORE, "kind": "material", "testOnly": False, "note": "Mining"},
        {"id": P, "kind": "material", "testOnly": False, "note": "timed component (Smithing)"},
        {"id": B, "kind": "material", "testOnly": False, "note": "timed bar (Smithing)"},
    ],
    "tiers": [{"id": t, "order": i + 1, "hasContent": i < 2} for i, t in enumerate(["tier.wood", "tier.copper", "tier.iron", "tier.steel", "tier.gold", "tier.mithril"])],
    "professions": {"efficiencyPerLevelBp": L(400), "affinityBp": L(2500), "affinities": {"warrior": "mining", "archer": "smithing", "mage": "woodcutting"}},
    "nodes": nodes,
    "items": items,
    "recipes": recipes,
    "enhancement": {"stepBp": L(1000), "goldBase": L(20), "materialByTier": {"tier.wood": P, "tier.copper": B}},
    "salvage": {"returnBp": L(5000)},
    "inheritance": {"mode": "none", "note": "O09 default; the variant half keeps floor(level / 2)"},
    "heroAdvantage": {"baseAttackBp": L(0), "abilityMultBp": L(0), "abilityCooldownBp": L(0), "exclusiveWeaponBp": L(0), "note": "S3 directions A-D variant hooks; all 0 in the control"},
}
with open("content/w1-slice-s3.candidate.v0.3.0.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(pack, f, indent=2)
    f.write("\n")
print("written", len(items), "items,", len(recipes), "recipes,", len(nodes), "nodes")
