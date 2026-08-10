import { computeDerived } from "../generator/derived.js";

// ---- Fantasy Grounds XML export -----------------------------------------
export function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]; });
}

// Takes the canonical nested character object (js/generator/character-generator.js).
export function buildFgXml(character) {
  var name = character.identity.name || "Unnamed Adventurer of Oakhurst";
  var cls = character.classes[0];
  var scores = character.abilityScores;
  var d = computeDerived(character);
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<root version="4.1" dataversion="20210302" release="8|CoreRPG:4">',
    '  <character>',
    '    <name type="string">' + xmlEscape(name) + '</name>',
    '    <race type="string">' + xmlEscape(character.race.name) + '</race>',
    '    <level type="number">' + cls.level + '</level>',
    '    <exp type="number">' + character.metadata.xp + '</exp>',
    '    <hp>',
    '      <total type="number">' + character.combat.hp.total + '</total>',
    '      <wounds type="number">0</wounds>',
    '    </hp>',
    '    <ac><total type="number">' + d.ac + '</total></ac>',
    '    <initiative><misc type="number">' + d.init + '</misc></initiative>',
    '    <speed><base type="number">' + parseInt(d.speed, 10) + '</base></speed>',
    '    <attackbase><base type="number">' + d.bab + '</base></attackbase>',
    '    <saves>',
    '      <fortitude><total type="number">' + d.fort + '</total></fortitude>',
    '      <reflex><total type="number">' + d.ref + '</total></reflex>',
    '      <will><total type="number">' + d.will + '</total></will>',
    '    </saves>',
    '    <classes>',
    '      <id-00001>',
    '        <name type="string">' + xmlEscape(cls.name) + '</name>',
    '        <level type="number">' + cls.level + '</level>',
    '      </id-00001>',
    '    </classes>',
    '    <abilities>',
    '      <strength><score type="number">' + scores.str + '</score></strength>',
    '      <dexterity><score type="number">' + scores.dex + '</score></dexterity>',
    '      <constitution><score type="number">' + scores.con + '</score></constitution>',
    '      <intelligence><score type="number">' + scores.int + '</score></intelligence>',
    '      <wisdom><score type="number">' + scores.wis + '</score></wisdom>',
    '      <charisma><score type="number">' + scores.cha + '</score></charisma>',
    '    </abilities>',
    '  </character>',
    '</root>',
    ''
  ].join("\n");
}

export function safeFileStem(character) {
  var base = (character.identity.name || "unnamed-adventurer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base || "adventurer";
}
