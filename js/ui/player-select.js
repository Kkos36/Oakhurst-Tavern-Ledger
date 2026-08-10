import { progressionFor } from "../data/progression.js";
import { allPlayers, removePlayer, loadList, saveList, ADD_KEY, REMOVE_KEY } from "../data/roster-storage.js";

export function unlockSummaryText(name) {
  var p = progressionFor(name);
  var pieces = [];
  if (p.startingLevel > 1) pieces.push("starts at level " + p.startingLevel);
  if (p.bonusXP > 0) pieces.push("+" + p.bonusXP + " XP");
  if (p.guaranteedRaces.length) pieces.push("guaranteed race: " + p.guaranteedRaces.join(", "));
  if (p.guaranteedClasses.length) pieces.push("guaranteed class: " + p.guaranteedClasses.join(", "));
  if (p.unlockedRaces.length) pieces.push("+" + p.unlockedRaces.length + " race option" + (p.unlockedRaces.length > 1 ? "s" : ""));
  if (p.unlockedClasses.length) pieces.push("+" + p.unlockedClasses.length + " class option" + (p.unlockedClasses.length > 1 ? "s" : ""));
  return pieces.length ? pieces.join(", ") : "";
}

export function unlockSummaryHtml(name) {
  var p = progressionFor(name);
  var pieces = [];
  if (p.startingLevel > 1) pieces.push('<span class="badge">Starts at level ' + p.startingLevel + '</span>');
  if (p.bonusXP > 0) pieces.push('<span class="badge">+' + p.bonusXP + ' XP</span>');
  if (p.guaranteedRaces.length) pieces.push('<span class="badge">Guaranteed race: ' + p.guaranteedRaces.join(", ") + '</span>');
  if (p.guaranteedClasses.length) pieces.push('<span class="badge">Guaranteed class: ' + p.guaranteedClasses.join(", ") + '</span>');
  if (p.unlockedRaces.length) pieces.push('<span class="badge">+' + p.unlockedRaces.length + ' race option' + (p.unlockedRaces.length > 1 ? "s" : "") + '</span>');
  if (p.unlockedClasses.length) pieces.push('<span class="badge">+' + p.unlockedClasses.length + ' class option' + (p.unlockedClasses.length > 1 ? "s" : "") + '</span>');
  return pieces.length ? pieces.join(" ") : "No unlocks yet &mdash; rolling on the base tables.";
}

// Wires the ledger-list player picker and the "add a new adventurer's
// player" form. `onChoosePlayer(name)` is called both when an existing
// player is tapped and right after a new one is added. Returns
// { renderPlayerList } so the caller can re-render after leaving the book
// (roster may have changed) or independent of the add/remove flows here.
export function initPlayerSelect({ playerListEl, addPlayerForm, addPlayerInput, onChoosePlayer }) {
  function renderPlayerList() {
    playerListEl.innerHTML = "";
    allPlayers().forEach(function (name) {
      var row = document.createElement("div");
      row.className = "ledger-entry";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ledger-entry-btn";
      var nameSpan = document.createElement("span");
      nameSpan.className = "ledger-entry-name";
      nameSpan.textContent = name;
      var hintSpan = document.createElement("span");
      hintSpan.className = "ledger-entry-hint";
      var summary = unlockSummaryText(name);
      hintSpan.textContent = summary || "tap to continue their story";
      btn.appendChild(nameSpan);
      btn.appendChild(hintSpan);
      btn.addEventListener("click", function () { onChoosePlayer(name); });

      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "ledger-entry-remove";
      rm.setAttribute("aria-label", "Remove " + name);
      rm.textContent = "×";
      rm.addEventListener("click", function (e) {
        e.stopPropagation();
        removePlayer(name);
        renderPlayerList();
      });

      row.appendChild(btn);
      row.appendChild(rm);
      playerListEl.appendChild(row);
    });
  }

  addPlayerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = addPlayerInput.value.trim();
    if (!name) return;
    var custom = loadList(ADD_KEY);
    var removed = loadList(REMOVE_KEY).filter(function (p) { return p !== name; });
    saveList(REMOVE_KEY, removed);
    if (allPlayers().indexOf(name) === -1 && custom.indexOf(name) === -1) custom.push(name);
    saveList(ADD_KEY, custom);
    addPlayerInput.value = "";
    renderPlayerList();
    onChoosePlayer(name);
  });

  return { renderPlayerList: renderPlayerList };
}
