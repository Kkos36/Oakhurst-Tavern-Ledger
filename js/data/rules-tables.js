// ---- Rules data (mirrors docs/game-rules.md §2) ----------------------
export const RACE_TABLE = { 1: "Dwarf", 2: "Elf", 3: "Gnome", 4: "Half-elf", 5: "Half-orc", 6: "Halfling", 7: "Human" };
export const BASE_RACES = [1, 2, 3, 4, 5, 6, 7].map(function (k) { return RACE_TABLE[k]; });

export const CLASS_TABLE = { 1: "Barbarian", 2: "Bard", 3: "Cleric", 4: "Druid", 5: "Fighter", 6: "Monk", 7: "Paladin", 8: "Ranger", 9: "Rogue", 10: "Sorcerer", 11: "Wizard" };
export const BASE_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { return CLASS_TABLE[k]; });

// 3.5e SRD hit die by class, for HP/HD generation
export const HIT_DICE = {
  Barbarian: 12, Bard: 6, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8,
  Paladin: 10, Ranger: 8, Rogue: 6, Sorcerer: 4, Wizard: 4
};

// Derived combat stats: mechanical formulas from class/level/ability scores you've
// already rolled — not new randomness. Alignment/skills/equipment stay player-chosen
// per docs/game-rules.md "The Rest".
export const BAB_RATE = {
  Barbarian: 1, Fighter: 1, Paladin: 1, Ranger: 1,
  Bard: 0.75, Cleric: 0.75, Druid: 0.75, Monk: 0.75, Rogue: 0.75,
  Sorcerer: 0.5, Wizard: 0.5
};
export const SAVE_PROGRESSION = {
  Barbarian: { fort: "good", ref: "poor", will: "poor" },
  Bard: { fort: "poor", ref: "good", will: "good" },
  Cleric: { fort: "good", ref: "poor", will: "good" },
  Druid: { fort: "good", ref: "poor", will: "good" },
  Fighter: { fort: "good", ref: "poor", will: "poor" },
  Monk: { fort: "good", ref: "good", will: "good" },
  Paladin: { fort: "good", ref: "poor", will: "poor" },
  Ranger: { fort: "good", ref: "good", will: "poor" },
  Rogue: { fort: "poor", ref: "good", will: "poor" },
  Sorcerer: { fort: "poor", ref: "poor", will: "good" },
  Wizard: { fort: "poor", ref: "poor", will: "good" }
};
export const RACE_SPEED = { Human: 30, Elf: 30, "Half-elf": 30, "Half-orc": 30, Dwarf: 20, Gnome: 20, Halfling: 20 };

export const DEFAULT_PLAYERS = ["Kraig", "JJ", "Shayne", "Jeremy", "Christian", "Kirk", "Aiden", "Pepe"];
