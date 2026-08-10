import { RACE_TABLE, BASE_RACES, CLASS_TABLE, BASE_CLASSES, HIT_DICE } from "../data/rules-tables.js";
import { rollDie, roll4d6DropLowest } from "./dice.js";
import { computeHP, computeDerived } from "./derived.js";

// Resolves one "roll a table, but N/12 (or guaranteed/unlocked options) means
// the player chooses instead" field. Mirrors the original buildChoiceField's
// selection logic exactly, split from its DOM-rendering half:
//  - a guaranteed-pool entry always wins as the default, even over a valid
//    table roll (this is a deliberate priority quirk in the existing rules
//    wiring, not a bug — preserved as-is)
//  - the offered options are basePool+unlockedPool only, so a guaranteed-only
//    entry can be the selected default yet not appear as a pickable option
function resolveChoiceField(rollResult, dieText, tableEntry, basePool, guaranteedPool, unlockedPool, logLabel) {
  var needsChoice = tableEntry === null || guaranteedPool.length > 0;
  if (needsChoice) {
    var pool = basePool.concat(unlockedPool).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    var initialValue = guaranteedPool.length ? guaranteedPool[0] : (tableEntry || pool[0]);
    var logLine = logLabel + ": " + (tableEntry === null ? dieText + "→" + rollResult + " (choice)" : "town's choice");
    return { needsChoice: true, options: pool, initialValue: initialValue, logLine: logLine };
  }
  var logLine2 = logLabel + ": " + dieText + "→" + rollResult;
  return { needsChoice: false, options: null, initialValue: tableEntry, logLine: logLine2 };
}

// Recomputes everything derived from race/class/level/ability scores. Called
// once at generation time and again whenever a field choice changes — never
// re-rolls anything, just re-derives.
function applyDerivedStats(character) {
  var cls = character.classes[0].name;
  var level = character.classes[0].level;
  if (cls) {
    character.combat.hp = {
      total: computeHP(cls, level, character.abilityScores.con),
      wounds: 0,
      die: HIT_DICE[cls] || 8
    };
  }
  if (character.race.name && cls) {
    var d = computeDerived(character);
    character.combat.ac = d.ac;
    character.combat.initiative = d.init;
    character.combat.speed = d.speed;
    character.combat.bab = d.bab;
    character.saves.fort = d.fort;
    character.saves.ref = d.ref;
    character.saves.will = d.will;
  }
}

// Pure: rolls a fresh character for `playerName` under `progression`. Always
// resolves race/class to a concrete default value (even when the roll landed
// on "player's choice"), matching the original behavior where a <select>
// only ever *overrides* an already-picked default rather than deferring the
// pick. Returns { character, editableFields } — editableFields.race/class is
// null when no dropdown is needed, or { options } when the player may choose.
export function generateCharacter(playerName, progression) {
  var p = progression;
  var scores = [0, 1, 2, 3, 4, 5].map(function () { return roll4d6DropLowest(); });

  var raceRoll = rollDie(8);
  var raceEntry = (raceRoll === 8) ? null : RACE_TABLE[raceRoll];
  var raceChoice = resolveChoiceField(raceRoll, "1d8", raceEntry, BASE_RACES, p.guaranteedRaces, p.unlockedRaces, "Race");

  var classRoll = rollDie(12);
  var classEntry = (classRoll === 12) ? null : CLASS_TABLE[classRoll];
  var classChoice = resolveChoiceField(classRoll, "1d12", classEntry, BASE_CLASSES, p.guaranteedClasses, p.unlockedClasses, "Class");

  var rollLog = [raceChoice.logLine, classChoice.logLine];
  if (p.startingLevel > 1 || p.bonusXP > 0) {
    rollLog.push("Starts at level " + p.startingLevel + (p.bonusXP ? " (" + p.bonusXP + " XP)" : ""));
  }

  var character = {
    identity: { player: playerName, name: "" },
    race: { name: raceChoice.initialValue },
    classes: [{ name: classChoice.initialValue, level: p.startingLevel }],
    abilityScores: { str: scores[0], dex: scores[1], con: scores[2], int: scores[3], wis: scores[4], cha: scores[5] },
    combat: {},
    saves: {},
    skills: [], feats: [], equipment: [], spells: [], traits: {},
    metadata: { xp: p.bonusXP, rollLog: rollLog }
  };
  applyDerivedStats(character);

  return {
    character: character,
    editableFields: {
      race: raceChoice.needsChoice ? { options: raceChoice.options } : null,
      class: classChoice.needsChoice ? { options: classChoice.options } : null
    }
  };
}

// Pure: applies a player's dropdown pick (race or class) to an already-
// generated character and re-derives combat/saves/hp. Never re-rolls.
export function applyFieldChoice(character, field, value) {
  if (field === "race") character.race.name = value;
  else if (field === "class") character.classes[0].name = value;
  applyDerivedStats(character);
  return character;
}
