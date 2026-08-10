import { fmtMod } from "../generator/derived.js";

// The only DOM-painting layer for the character sheet. Reads a fully-formed
// { character, editableFields } result (see js/generator/character-generator.js)
// and paints it — it never calculates game state itself.

const STAT_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

var nameInput, portraitFrame, portraitImg, raceField, classField, statFields,
  derivedFields, rollLogEl, hpField, hdField;

var renderCounter = 0;

function writeIn(el, delayMs) {
  el.classList.remove("write-in");
  void el.offsetWidth;
  el.style.animationDelay = delayMs + "ms";
  el.classList.add("write-in");
}

// New quill-sketch set: transparent-background webp, same race_class naming.
function portraitPath(race, cls) {
  var slug = function (s) { return s.toLowerCase().replace(/\s+/g, "-"); };
  return "docs/AI_Artwork/dnd35_quill_sketches_webp/dnd35_quill_sketches_webp/" + slug(race) + "_" + slug(cls) + ".webp";
}

export function initGeneratorView(refs) {
  nameInput = refs.nameInput;
  portraitFrame = refs.portraitFrame;
  portraitImg = refs.portraitImg;
  raceField = refs.raceField;
  classField = refs.classField;
  statFields = refs.statFields;
  derivedFields = refs.derivedFields;
  rollLogEl = refs.rollLogEl;
  hpField = refs.hpField;
  hdField = refs.hdField;
}

// Clears the sheet back to blank — used when switching players, before any
// character has been rolled for them yet.
export function clearCharacterView() {
  renderCounter++; // invalidate any in-flight portrait reveal from a prior character
  nameInput.value = "";
  STAT_KEYS.forEach(function (k) { statFields[k].textContent = ""; });
  raceField.innerHTML = "&nbsp;";
  classField.innerHTML = "&nbsp;";
  hpField.textContent = "";
  hdField.textContent = "";
  Object.keys(derivedFields).forEach(function (k) { derivedFields[k].textContent = ""; });
  rollLogEl.textContent = "";
  portraitFrame.classList.remove("show");
  portraitImg.removeAttribute("src");
}

function renderStats(scores) {
  STAT_KEYS.forEach(function (k, i) {
    var el = statFields[k];
    el.textContent = scores[k];
    writeIn(el, i * 110);
  });
}

// Renders a race/class field as either plain text or a <select> (when
// editableField is non-null), wiring the select's change event to `onChange`.
function renderChoiceField(container, delayMs, currentValue, editableField, onChange) {
  container.innerHTML = "";
  if (editableField) {
    var select = document.createElement("select");
    select.className = "gen-choice";
    editableField.options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt; o.textContent = opt;
      select.appendChild(o);
    });
    select.value = currentValue;
    select.addEventListener("change", function () { onChange(select.value); });
    container.appendChild(select);
  } else {
    container.textContent = currentValue;
  }
  writeIn(container, delayMs);
}

function renderHP(character) {
  hpField.textContent = character.combat.hp.total;
  hdField.textContent = character.classes[0].level + "d" + character.combat.hp.die;
  writeIn(hpField, 900);
  writeIn(hdField, 950);
}

function renderDerived(character) {
  derivedFields.ac.textContent = character.combat.ac;
  derivedFields.init.textContent = fmtMod(character.combat.initiative);
  derivedFields.speed.textContent = character.combat.speed;
  derivedFields.bab.textContent = fmtMod(character.combat.bab);
  derivedFields.fort.textContent = fmtMod(character.saves.fort);
  derivedFields.ref.textContent = fmtMod(character.saves.ref);
  derivedFields.will.textContent = fmtMod(character.saves.will);
  var i = 0;
  Object.keys(derivedFields).forEach(function (k) { writeIn(derivedFields[k], 1000 + (i++) * 50); });
}

// Src is assigned inside the same delayed callback as the reveal, so nothing
// is ever loaded/paintable before the moment it's meant to fade in (avoids
// the portrait flashing briefly on a fast reroll, then disappearing). Guarded
// by a render-nonce rather than comparing race/class strings, since a stale
// render is now "an older render happened" rather than "the character
// object mutated mid-flight" (generation is synchronous/pure now).
function schedulePortrait(character, myRenderId) {
  var race = character.race.name, cls = character.classes[0].name;
  window.setTimeout(function () {
    if (myRenderId !== renderCounter) return;
    portraitImg.src = portraitPath(race, cls);
    portraitImg.alt = race + " " + cls + " portrait";
    portraitFrame.classList.add("show");
  }, 700);
}

// Repaints only the fields that depend on race/class/derived stats, without
// touching ability scores or restarting the whole entrance stagger — used
// after the player picks a different race/class from a dropdown.
function renderDependentFields(character, myRenderId) {
  renderHP(character);
  renderDerived(character);
  schedulePortrait(character, myRenderId);
}

// Full initial paint of a freshly generated character. `onFieldChange(field,
// value)` is called when the player picks a different race/class from a
// dropdown; it must apply the change and return the updated character so
// this view can repaint the fields that depend on it.
export function renderCharacter(result, opts) {
  renderCounter++;
  var myRenderId = renderCounter;
  var character = result.character;
  var editableFields = result.editableFields;
  var onFieldChange = opts.onFieldChange;

  nameInput.value = character.identity.name || "";
  renderStats(character.abilityScores);

  renderChoiceField(raceField, 700, character.race.name, editableFields.race, function (value) {
    var updated = onFieldChange("race", value);
    renderDependentFields(updated, myRenderId);
  });
  renderChoiceField(classField, 800, character.classes[0].name, editableFields.class, function (value) {
    var updated = onFieldChange("class", value);
    renderDependentFields(updated, myRenderId);
  });

  renderHP(character);
  renderDerived(character);
  schedulePortrait(character, myRenderId);

  rollLogEl.textContent = character.metadata.rollLog.join("  ·  ");
}
