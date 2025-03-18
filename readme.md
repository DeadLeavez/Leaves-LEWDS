# Leaves Low End Weapon-spawn Drop-rate Searcher

Finds those pesky spawns with like 0.0002 spawn chance and raises them to a user-set floor. Makes rarer spawns actually work in current spt.


The config is simple
```json
    "5447bedf4bdc2d87278b4568": 0.05, //GrenadeLauncher
```
The left string is the category, and the number next to it is the new floor value.

KEEP IN MIND THIS IS MULTIPLIED BY OTHER MODS LIKE SVM LOOSE LOOT MULTIPLIERS, SPT'S DEFAULT MULTIPLIERS, AND BY MY OWN LOOTFUCKERY MOD.

If you want to use this along my LootFuckery mod, it should be loaded BEFORE that mod. But do what you want, I can't tell you what to do.

## 1.0.0
Initial Release

## 1.0.1
Once again, the fires are lit, and the need for this mod returns. 
- Updated to 3.10.x

## 1.1.0
Rework
- Changed to target any item parent specified in the config. By default this is weapons and mechanical keys.
- Add the option to also target specific items.
- Added the feature to dump to point file to use with CJ's DebugPlus. To let you visually explore loot spawn points on maps.
- Updated compat to 3.11 (this release still works on 3.10)