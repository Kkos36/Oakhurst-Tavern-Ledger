// ---- Dice ---------------------------------------------------------------
export function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }
export function roll4d6DropLowest() {
  var rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
  rolls.sort(function (a, b) { return a - b; });
  return rolls[1] + rolls[2] + rolls[3];
}
