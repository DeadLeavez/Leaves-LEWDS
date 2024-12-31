# Leaves Low End Weapon-spawn Drop-rate Searcher

Finds those pesky weapon spawns with like 0.0002 spawn chance and raises them to a user-set floor. Makes weapons spawns actually work in current spt.


The config is simple
```json
"probabilityFloor": 0.05,
"onlyWeapons": true
```
probabilityFloor is the minimum chance for a weapon spawn to spawn. If a weapon spawn below this value is found, it will be raised to this value. 0.05 = 5% chance

KEEP IN MIND THIS IS MULTIPLIED BY OTHER MODS LIKE SVM LOOSE LOOT MULTIPLIERS, SPT'S DEFAULT MULTIPLIERS, AND BY MY OWN LOOTFUCKERY MOD.

If you want to use this along my LootFuckery mod, it should be loaded BEFORE that mod. But do what you want, I can't tell you what to do.


onlyWeapons limits the search to only weapons. Duh! If switched off, it will apply to ANY loot point that has a probability lower than the floor. This CAN and WILL have massive unintended consequences, so I recommend not touching it.

## 1.0.0
Initial Release

## 1.0.1
Once again, the fires are lit, and the need for this mod returns. 
- Updated to 3.10.x
