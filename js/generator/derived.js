import { HIT_DICE, BAB_RATE, SAVE_PROGRESSION, RACE_SPEED } from "../data/rules-tables.js";

export function abilityMod(score) { return Math.floor((score - 10) / 2); }
export function fmtMod(n) { return (n >= 0 ? "+" : "") + n; }

// Level 1 takes max hit die + Con mod; each level after that takes the average
// (die/2 rounded up + 1) + Con mod, per the standard 3.5e "take average" rule.
export function computeHP(cls, level, conScore) {
  var die = HIT_DICE[cls] || 8;
  var mod = abilityMod(conScore);
  var hp = die + mod;
  for (var lvl = 2; lvl <= level; lvl++) {
    hp += Math.floor(die / 2) + 1 + mod;
  }
  return Math.max(1, hp);
}

export function saveBase(kind, level) { return kind === "good" ? (2 + Math.floor(level / 2)) : Math.floor(level / 3); }

// Takes the canonical nested character object (js/generator/character-generator.js);
// returns a flat {ac, init, speed, bab, fort, ref, will} — keeping this return
// shape flat (rather than also nesting it) keeps every call site's diff small
// and easy to verify against the old flat-character version.
export function computeDerived(character) {
  var scores = character.abilityScores;
  var dexMod = abilityMod(scores.dex), conMod = abilityMod(scores.con), wisMod = abilityMod(scores.wis);
  var cls = character.classes[0].name;
  var level = character.classes[0].level;
  var sp = SAVE_PROGRESSION[cls] || { fort: "poor", ref: "poor", will: "poor" };
  return {
    ac: 10 + dexMod,
    init: dexMod,
    speed: (RACE_SPEED[character.race.name] || 30) + " ft",
    bab: Math.floor(level * (BAB_RATE[cls] || 0.75)),
    fort: saveBase(sp.fort, level) + conMod,
    ref: saveBase(sp.ref, level) + dexMod,
    will: saveBase(sp.will, level) + wisMod
  };
}
