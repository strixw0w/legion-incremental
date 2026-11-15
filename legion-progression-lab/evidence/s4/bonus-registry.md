# S4 bonus registry (compiled control content)

Content `w1-slice-s4` v0.4.0, SHA-256 `c1115512b72d4d7b4abfed652469dfe7bea614013190d732c4df0bb56eff319e`; formula `perm-v1`; Monument pooling `category`; starter weapon granted: false.

Every value is a candidate. Scope is account-wide (once per owned character). Rewards are granted at most once each, in ascending ID order (S4-R05, R07).

## Monuments

| ID | Name | Target | Discovery | Max level | Gold to level 1 | Gold to max (cumulative) | Total bonus bp at max |
|---|---|---|---|---|---|---|---|
| `monument.power` | Monument of Power | attack | first-recruit quest | 30 | 40 | 18440 | 3500 |
| `monument.vitality` | Monument of Vitality | maxHp | zoneVisited zone 2 | 30 | 30 | 14757 | 5250 |
| `monument.industry` | Monument of Industry | efficiency | gateCompleted zone 2 | 30 | 60 | 27120 | 5250 |

Material milestones (consumed when the level is entered):

- `monument.power`: level 5: 10 res.mat.slime_gel; level 10: 10 res.mat.wolf_fang; level 15: 10 res.mat.goblin_scrap; level 20: 25 res.mat.wolf_fang + 5 res.mat.copper_bar; level 25: 25 res.mat.goblin_scrap; level 30: 50 res.mat.slime_gel + 10 res.mat.copper_bar
- `monument.vitality`: level 5: 15 res.mat.slime_gel; level 10: 10 res.mat.plank; level 15: 15 res.mat.wolf_fang; level 20: 20 res.mat.goblin_scrap + 20 res.mat.plank; level 25: 40 res.mat.slime_gel; level 30: 40 res.mat.wolf_fang + 10 res.mat.copper_bar
- `monument.industry`: level 5: 10 res.mat.plank; level 10: 10 res.mat.copper_bar; level 15: 30 res.mat.plank + 20 res.mat.slime_gel; level 20: 25 res.mat.copper_bar; level 25: 50 res.mat.plank + 30 res.mat.wolf_fang; level 30: 50 res.mat.copper_bar + 30 res.mat.goblin_scrap

## Entitlements

50 rewards.

| # | Reward ID | System | Target | bp | Earned when |
|---|---|---|---|---|---|
| 1 | `bestiary:enemy.w1.goblin:bronze` | bestiary | maxHp | 200 | 25 accepted kills of `enemy.w1.goblin` |
| 2 | `bestiary:enemy.w1.goblin:gold` | bestiary | abilityPower | 500 | 600 accepted kills of `enemy.w1.goblin` |
| 3 | `bestiary:enemy.w1.goblin:silver` | bestiary | attack | 200 | 150 accepted kills of `enemy.w1.goblin` |
| 4 | `bestiary:enemy.w1.green_slime:bronze` | bestiary | attack | 100 | 25 accepted kills of `enemy.w1.green_slime` |
| 5 | `bestiary:enemy.w1.green_slime:gold` | bestiary | attack | 200 | 600 accepted kills of `enemy.w1.green_slime` |
| 6 | `bestiary:enemy.w1.green_slime:silver` | bestiary | maxHp | 200 | 150 accepted kills of `enemy.w1.green_slime` |
| 7 | `bestiary:enemy.w1.wolf:bronze` | bestiary | critChance | 50 | 25 accepted kills of `enemy.w1.wolf` |
| 8 | `bestiary:enemy.w1.wolf:gold` | bestiary | maxHp | 300 | 600 accepted kills of `enemy.w1.wolf` |
| 9 | `bestiary:enemy.w1.wolf:silver` | bestiary | attack | 150 | 150 accepted kills of `enemy.w1.wolf` |
| 10 | `class:archer:10` | class | critChance | 150 | highest archer level >= 10 |
| 11 | `class:archer:20` | class | attack | 300 | highest archer level >= 20 |
| 12 | `class:archer:5` | class | critChance | 100 | highest archer level >= 5 |
| 13 | `class:mage:10` | class | gatherEfficiency | 300 | highest mage level >= 10 |
| 14 | `class:mage:20` | class | smithEfficiency | 500 | highest mage level >= 20 |
| 15 | `class:mage:5` | class | abilityPower | 500 | highest mage level >= 5 |
| 16 | `class:warrior:10` | class | attack | 200 | highest warrior level >= 10 |
| 17 | `class:warrior:20` | class | maxHp | 500 | highest warrior level >= 20 |
| 18 | `class:warrior:5` | class | maxHp | 300 | highest warrior level >= 5 |
| 19 | `emblem:enemy.w1.goblin` | emblem | attack | 200 | first emblem of `enemy.w1.goblin` |
| 20 | `emblem:enemy.w1.green_slime` | emblem | gatherEfficiency | 200 | first emblem of `enemy.w1.green_slime` |
| 21 | `emblem:enemy.w1.wolf` | emblem | critChance | 100 | first emblem of `enemy.w1.wolf` |
| 22 | `feat:feat.combat.gold:1` | feat | attack | 50 | lifetime `goldEarned` >= 1000 |
| 23 | `feat:feat.combat.gold:2` | feat | maxHp | 100 | lifetime `goldEarned` >= 10000 |
| 24 | `feat:feat.combat.kills:1` | feat | attack | 50 | lifetime `accountKills` >= 100 |
| 25 | `feat:feat.combat.kills:2` | feat | maxHp | 100 | lifetime `accountKills` >= 500 |
| 26 | `feat:feat.combat.kills:3` | feat | attack | 100 | lifetime `accountKills` >= 2000 |
| 27 | `feat:feat.combat.kills:4` | feat | attack | 150 | lifetime `accountKills` >= 5000 |
| 28 | `feat:feat.conquest.boss:1` | feat | attack | 200 | lifetime `bossCleared` >= 1 |
| 29 | `feat:feat.conquest.gates:1` | feat | attack | 50 | lifetime `gatesCompleted` >= 1 |
| 30 | `feat:feat.conquest.gates:2` | feat | maxHp | 150 | lifetime `gatesCompleted` >= 2 |
| 31 | `feat:feat.craft.items:1` | feat | maxHp | 50 | lifetime `itemsCrafted` >= 1 |
| 32 | `feat:feat.craft.items:2` | feat | attack | 100 | lifetime `itemsCrafted` >= 10 |
| 33 | `feat:feat.craft.items:3` | feat | attack | 100 | lifetime `itemsCrafted` >= 30 |
| 34 | `feat:feat.equip.enhance:1` | feat | critChance | 50 | lifetime `enhancements` >= 1 |
| 35 | `feat:feat.equip.enhance:2` | feat | attack | 100 | lifetime `enhancements` >= 10 |
| 36 | `feat:feat.explore.zones:1` | feat | maxHp | 100 | lifetime `zonesVisited` >= 2 |
| 37 | `feat:feat.explore.zones:2` | feat | attack | 100 | lifetime `zonesVisited` >= 3 |
| 38 | `feat:feat.gather.units:1` | feat | gatherEfficiency | 100 | lifetime `gatheredUnits` >= 200 |
| 39 | `feat:feat.gather.units:2` | feat | gatherEfficiency | 200 | lifetime `gatheredUnits` >= 2000 |
| 40 | `feat:feat.prod.units:1` | feat | smithEfficiency | 200 | lifetime `unitsCompleted` >= 20 |
| 41 | `feat:feat.prod.units:2` | feat | smithEfficiency | 300 | lifetime `unitsCompleted` >= 100 |
| 42 | `feat:feat.prof.levels:1` | feat | gatherEfficiency | 200 | lifetime `professionLevelsHigh` >= 20 |
| 43 | `feat:feat.prof.levels:2` | feat | smithEfficiency | 300 | lifetime `professionLevelsHigh` >= 40 |
| 44 | `feat:feat.roster.levels:1` | feat | maxHp | 100 | lifetime `rosterLevelsHigh` >= 25 |
| 45 | `feat:feat.roster.levels:2` | feat | attack | 100 | lifetime `rosterLevelsHigh` >= 60 |
| 46 | `feat:feat.roster.levels:3` | feat | attack | 150 | lifetime `rosterLevelsHigh` >= 120 |
| 47 | `region:region.w1.slice:completion` | region | attack | 200 | every species of `region.w1.slice` discovered (enemy.w1.green_slime, enemy.w1.wolf, enemy.w1.goblin) |
| 48 | `region:region.w1.slice:mastery` | region | attack | 500 | region `region.w1.slice` mastery (enemy.w1.green_slime 600, enemy.w1.wolf 600, enemy.w1.goblin 600) |
| 49 | `roster:roster.recruits:1` | roster | attack | 100 | lifetime `recruitsAcquired` >= 2 |
| 50 | `roster:roster.recruits:2` | roster | maxHp | 200 | lifetime `recruitsAcquired` >= 3 |

By system: bestiary 9, class 9, emblem 3, feat 25, region 2, roster 2.
