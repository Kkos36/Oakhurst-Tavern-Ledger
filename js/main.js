import { progressionFor } from "./data/progression.js";
import { buildFgXml, safeFileStem } from "./export/fantasy-grounds.js";
import { reducedMotion, initLandingScene } from "./ui/landing-scene.js";
import { initPlayerSelect, unlockSummaryHtml } from "./ui/player-select.js";
import { generateCharacter, applyFieldChoice } from "./generator/character-generator.js";
import { initGeneratorView, renderCharacter, clearCharacterView } from "./ui/generator-view.js";

function escHtml(s) {
  return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
}

// =========================================================================
// Landing scene: hotspots + lean-in transition + rules modal
// =========================================================================
var landing = document.getElementById("landing");
var bookScene = document.getElementById("bookScene");
var rulesModal = document.getElementById("rulesModal");

var landingScene = initLandingScene({
  landing: landing,
  bookScene: bookScene,
  hotspotsSvg: document.getElementById("landingHotspots"),
  rulesModal: rulesModal,
  onShowBookScene: function () { showBookScene(); }
});

function showBookScene() {
  bookScene.hidden = false;
  layoutBookOverlay();
  resetPlayerRoster();
  showSpread("player", false);
}

document.getElementById("backBtn").addEventListener("click", function () {
  if (currentSpread === "generate") {
    goToSpread("player");
  } else {
    landingScene.closeBook();
  }
});

// =========================================================================
// Book overlay: keeps a percentage-positioned layer matched to the
// object-fit:contain letterbox rectangle of book-bg, at any viewport size.
// =========================================================================
var bookOverlay = document.getElementById("bookOverlay");
var BOOK_NAT_W = 1672, BOOK_NAT_H = 941;

function layoutBookOverlay() {
  var vw = window.innerWidth, vh = window.innerHeight;
  var scale = Math.min(vw / BOOK_NAT_W, vh / BOOK_NAT_H);
  var dispW = BOOK_NAT_W * scale, dispH = BOOK_NAT_H * scale;
  var offX = (vw - dispW) / 2, offY = (vh - dispH) / 2;
  bookOverlay.style.left = offX + "px";
  bookOverlay.style.top = offY + "px";
  bookOverlay.style.width = dispW + "px";
  bookOverlay.style.height = dispH + "px";
}
window.addEventListener("resize", function () { if (!bookScene.hidden) layoutBookOverlay(); });

// =========================================================================
// Spread navigation (player select <-> generator), with a physical page turn
// =========================================================================
var spreadPlayer = document.getElementById("spreadPlayer");
var spreadGenerate = document.getElementById("spreadGenerate");
var genControls = document.getElementById("genControls");
var genStatusStrip = document.getElementById("genStatusStrip");
var pageFlap = document.getElementById("pageFlap");
var backBtn = document.getElementById("backBtn");
var currentSpread = "player";

function showSpread(name) {
  currentSpread = name;
  if (name === "player") {
    spreadPlayer.hidden = false; spreadGenerate.hidden = true; genControls.hidden = true; genStatusStrip.hidden = true;
    backBtn.textContent = "‹ Close the ledger";
  } else {
    spreadPlayer.hidden = true; spreadGenerate.hidden = false; genControls.hidden = false; genStatusStrip.hidden = false;
    backBtn.textContent = "‹ Back to player select";
  }
}

function goToSpread(name) {
  if (name === currentSpread) return;
  var reverse = (currentSpread === "generate" && name === "player");
  if (reducedMotion()) { showSpread(name); return; }

  pageFlap.classList.remove("turning", "reverse");
  void pageFlap.offsetWidth;
  pageFlap.classList.add("turning");
  if (reverse) pageFlap.classList.add("reverse");

  window.setTimeout(function () { showSpread(name); }, 440);
  window.setTimeout(function () { pageFlap.classList.remove("turning", "reverse"); }, 900);
}

// =========================================================================
// Spread one: select player (ledger list across both pages)
// =========================================================================
var currentPlayer = null;

var playerSelect = initPlayerSelect({
  playerListEl: document.getElementById("playerList"),
  addPlayerForm: document.getElementById("addPlayerForm"),
  addPlayerInput: document.getElementById("addPlayerInput"),
  onChoosePlayer: function (name) { choosePlayer(name); }
});

function resetPlayerRoster() {
  currentPlayer = null;
  playerSelect.renderPlayerList();
}

function choosePlayer(name) {
  currentPlayer = name;
  document.getElementById("generateFor").textContent = "Rolling for " + name;
  document.getElementById("unlockSummaryGen").innerHTML = unlockSummaryHtml(name);
  clearCharacterView();
  setStatus("", "");
  goToSpread("generate");
}

// =========================================================================
// Spread two: generator + export
// =========================================================================
var nameInput = document.getElementById("nameInput");
var exportBtn = document.getElementById("exportBtn");
var copyBtn = document.getElementById("copyBtn");
var currentCharacter = null;

initGeneratorView({
  nameInput: nameInput,
  portraitFrame: document.getElementById("portraitFrame"),
  portraitImg: document.getElementById("portraitImg"),
  raceField: document.getElementById("raceField"),
  classField: document.getElementById("classField"),
  statFields: {
    str: document.getElementById("statStr"), dex: document.getElementById("statDex"), con: document.getElementById("statCon"),
    int: document.getElementById("statInt"), wis: document.getElementById("statWis"), cha: document.getElementById("statCha")
  },
  derivedFields: {
    ac: document.getElementById("derivedAc"), init: document.getElementById("derivedInit"), speed: document.getElementById("derivedSpeed"),
    bab: document.getElementById("derivedBab"), fort: document.getElementById("derivedFort"), ref: document.getElementById("derivedRef"),
    will: document.getElementById("derivedWill")
  },
  rollLogEl: document.getElementById("rollLog"),
  hpField: document.getElementById("hpField"),
  hdField: document.getElementById("hdField")
});

function rollCharacter() {
  if (!currentPlayer) return;
  clearCharacterView();
  var result = generateCharacter(currentPlayer, progressionFor(currentPlayer));
  currentCharacter = result.character;
  renderCharacter(result, {
    onFieldChange: function (field, value) {
      return applyFieldChoice(currentCharacter, field, value);
    }
  });
  setStatus("", "");
}

document.getElementById("rollBtn").addEventListener("click", rollCharacter);
document.getElementById("rerollBtn").addEventListener("click", rollCharacter);
nameInput.addEventListener("input", function () { if (currentCharacter) currentCharacter.identity.name = nameInput.value.trim(); });

function setStatus(text, kind) {
  var el = document.getElementById("statusLine");
  el.textContent = text;
  el.className = "status-line" + (kind ? " " + kind : "");
}

function hasRolledCharacter() {
  return !!(currentCharacter && currentCharacter.race.name && currentCharacter.classes[0].name);
}

exportBtn.addEventListener("click", function () {
  if (!hasRolledCharacter()) { setStatus("Roll a character first.", "err"); return; }
  var xml = buildFgXml(currentCharacter);
  var blob = new Blob([xml], { type: "application/xml" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = safeFileStem(currentCharacter) + ".xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setStatus("Saved " + a.download + " — import it in Fantasy Grounds.", "ok");
});

copyBtn.addEventListener("click", function () {
  if (!hasRolledCharacter()) { setStatus("Roll a character first.", "err"); return; }
  var xml = buildFgXml(currentCharacter);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(xml).then(function () {
      setStatus("Copied! Paste into a text file and save it with a .xml extension.", "ok");
    }).catch(function () { setStatus("Couldn't copy automatically — try Export instead.", "err"); });
  } else {
    setStatus("Clipboard isn't available here — try Export instead.", "err");
  }
});

// ---- Rules modal content (mirrors docs/game-rules.md) --------------------
document.getElementById("rulesBody").innerHTML =
  '<h1 id="rulesTitle">Oakhurst West Marches</h1>' +
  '<p class="src-note">Mirrored from the campaign rules doc.</p>' +
  '<h2>1. The Concept</h2>' +
  '<p>Each player controls an abstract group of randomly generated adventurers in their own version of Oakhurst. There is no limit to how many characters one player can have. Character generation is randomized: all characters start at level one with random stats, race, and class.</p>' +
  '<p>The town starts as a small thorp and grows into a sprawling metropolis through metaprogression, purchased using treasure and connections gathered on adventures.</p>' +
  '<h2>2. Character Creation</h2>' +
  '<h3>Generating Statistics</h3>' +
  '<p>Roll 4d6, drop the lowest die. Stats are placed in order: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma. They cannot be rearranged after rolling, and there is no minimum or maximum. This will generate non-viable characters on purpose — work with what you rolled, within reason.</p>' +
  '<h3>Race (1d8)</h3>' +
  '<table><tr><th>Roll</th><th>Race</th></tr><tr><td>1</td><td>Dwarf</td></tr><tr><td>2</td><td>Elf</td></tr><tr><td>3</td><td>Gnome</td></tr><tr><td>4</td><td>Half-elf</td></tr><tr><td>5</td><td>Half-orc</td></tr><tr><td>6</td><td>Halfling</td></tr><tr><td>7</td><td>Human</td></tr><tr><td>8</td><td>Player&rsquo;s choice</td></tr></table>' +
  '<p>Subraces can be chosen if unlocked. Which races are &ldquo;free&rdquo; is set by the DM.</p>' +
  '<h3>Class (1d12)</h3>' +
  '<table><tr><th>Roll</th><th>Class</th></tr><tr><td>1</td><td>Barbarian</td></tr><tr><td>2</td><td>Bard</td></tr><tr><td>3</td><td>Cleric</td></tr><tr><td>4</td><td>Druid</td></tr><tr><td>5</td><td>Fighter</td></tr><tr><td>6</td><td>Monk</td></tr><tr><td>7</td><td>Paladin</td></tr><tr><td>8</td><td>Ranger</td></tr><tr><td>9</td><td>Rogue</td></tr><tr><td>10</td><td>Sorcerer</td></tr><tr><td>11</td><td>Wizard</td></tr><tr><td>12</td><td>Player&rsquo;s choice</td></tr></table>' +
  '<p>You must play the rolled class at level 1, but may multiclass afterward if you qualify.</p>' +
  '<h3>The Rest</h3>' +
  '<p>Background, feats, spells, skills, and equipment are chosen by the player. AC/Initiative/Speed/Saves/BAB shown in the ledger are mechanical results of your class, level, and ability scores — not extra randomness.</p>' +
  '<h2>3. Town Progression</h2>' +
  '<p>Metaprogression Modifiers (MM) come in two types:</p>' +
  '<p><strong>Adventurer Trait Tokens (ATT)</strong> — single-use, apply to one new character whenever desired.</p>' +
  '<p><strong>Town Progression Options (TPO)</strong> — permanent upgrades that apply to all future characters for that player.</p>' +
  '<blockquote>Full worked examples and pricing guidance live in the source rules doc — ask your DM for details on a specific purchase.</blockquote>' +
  '<h2>4. Buildings</h2>' +
  '<p>Class buildings (Temple, Mages Guild, Wilderness Enclave, Tavern, Training Yard) can unlock guaranteed class choices at character creation. Race buildings (e.g. a Creature Dwelling) work the same way for races.</p>';
