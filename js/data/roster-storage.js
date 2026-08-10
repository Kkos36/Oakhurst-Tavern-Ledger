import { DEFAULT_PLAYERS } from "./rules-tables.js";

// ---- Local roster storage (custom + removed players) --------------------
export var ADD_KEY = "oakhurst-tavern-ledger-players";
export var REMOVE_KEY = "oakhurst-tavern-ledger-removed";

export function loadList(key) {
  try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}
export function saveList(key, list) {
  try { window.localStorage.setItem(key, JSON.stringify(list)); } catch (e) {}
}
export function allPlayers() {
  var custom = loadList(ADD_KEY);
  var removed = loadList(REMOVE_KEY);
  var combined = DEFAULT_PLAYERS.concat(custom.filter(function (p) { return DEFAULT_PLAYERS.indexOf(p) === -1; }));
  return combined.filter(function (p) { return removed.indexOf(p) === -1; });
}
export function removePlayer(name) {
  var removed = loadList(REMOVE_KEY);
  if (removed.indexOf(name) === -1) removed.push(name);
  saveList(REMOVE_KEY, removed);
  var custom = loadList(ADD_KEY).filter(function (p) { return p !== name; });
  saveList(ADD_KEY, custom);
}
