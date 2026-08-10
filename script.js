(function () {
  "use strict";

  // ---- Rules data (mirrors docs/game-rules.md §2) ----------------------
  var RACE_TABLE = { 1: "Dwarf", 2: "Elf", 3: "Gnome", 4: "Half-elf", 5: "Half-orc", 6: "Halfling", 7: "Human" };
  var BASE_RACES = [1, 2, 3, 4, 5, 6, 7].map(function (k) { return RACE_TABLE[k]; });

  var CLASS_TABLE = { 1: "Barbarian", 2: "Bard", 3: "Cleric", 4: "Druid", 5: "Fighter", 6: "Monk", 7: "Paladin", 8: "Ranger", 9: "Rogue", 10: "Sorcerer", 11: "Wizard" };
  var BASE_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { return CLASS_TABLE[k]; });

  // 3.5e SRD hit die by class, for HP/HD generation
  var HIT_DICE = {
    Barbarian: 12, Bard: 6, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8,
    Paladin: 10, Ranger: 8, Rogue: 6, Sorcerer: 4, Wizard: 4
  };

  // Derived combat stats: mechanical formulas from class/level/ability scores you've
  // already rolled — not new randomness. Alignment/skills/equipment stay player-chosen
  // per docs/game-rules.md "The Rest".
  var BAB_RATE = {
    Barbarian: 1, Fighter: 1, Paladin: 1, Ranger: 1,
    Bard: 0.75, Cleric: 0.75, Druid: 0.75, Monk: 0.75, Rogue: 0.75,
    Sorcerer: 0.5, Wizard: 0.5
  };
  var SAVE_PROGRESSION = {
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
  var RACE_SPEED = { Human: 30, Elf: 30, "Half-elf": 30, "Half-orc": 30, Dwarf: 20, Gnome: 20, Halfling: 20 };

  function abilityMod(score) { return Math.floor((score - 10) / 2); }
  function fmtMod(n) { return (n >= 0 ? "+" : "") + n; }

  // Level 1 takes max hit die + Con mod; each level after that takes the average
  // (die/2 rounded up + 1) + Con mod, per the standard 3.5e "take average" rule.
  function computeHP(cls, level, conScore) {
    var die = HIT_DICE[cls] || 8;
    var mod = abilityMod(conScore);
    var hp = die + mod;
    for (var lvl = 2; lvl <= level; lvl++) {
      hp += Math.floor(die / 2) + 1 + mod;
    }
    return Math.max(1, hp);
  }

  function saveBase(kind, level) { return kind === "good" ? (2 + Math.floor(level / 2)) : Math.floor(level / 3); }

  function computeDerived(ch) {
    var dexMod = abilityMod(ch.dex), conMod = abilityMod(ch.con), wisMod = abilityMod(ch.wis);
    var sp = SAVE_PROGRESSION[ch.class] || { fort: "poor", ref: "poor", will: "poor" };
    return {
      ac: 10 + dexMod,
      init: dexMod,
      speed: (RACE_SPEED[ch.race] || 30) + " ft",
      bab: Math.floor(ch.level * (BAB_RATE[ch.class] || 0.75)),
      fort: saveBase(sp.fort, ch.level) + conMod,
      ref: saveBase(sp.ref, ch.level) + dexMod,
      will: saveBase(sp.will, ch.level) + wisMod
    };
  }

  var DEFAULT_PLAYERS = ["Kraig", "JJ", "Shayne", "Jeremy", "Christian", "Kirk", "Aiden", "Pepe"];

  // ---- Player progression (metaprogression unlocks) --------------------
  // Maintained by Claude. Update an entry whenever a player buys an ATT/TPO,
  // then push. Everyone starts here — current campaign state is default for
  // all players, so every array is empty and startingLevel is 1.
  function defaultProgression() {
    return {
      startingLevel: 1,
      bonusXP: 0,
      guaranteedRaces: [],
      guaranteedClasses: [],
      unlockedRaces: [],
      unlockedClasses: []
    };
  }

  var PROGRESSION = {
    Kraig: defaultProgression(), JJ: defaultProgression(), Shayne: defaultProgression(),
    Jeremy: defaultProgression(), Christian: defaultProgression(), Kirk: defaultProgression(),
    Aiden: defaultProgression(), Pepe: defaultProgression()
  };

  function progressionFor(name) {
    if (!PROGRESSION[name]) PROGRESSION[name] = defaultProgression();
    return PROGRESSION[name];
  }

  // ---- Local roster storage (custom + removed players) --------------------
  var ADD_KEY = "oakhurst-tavern-ledger-players";
  var REMOVE_KEY = "oakhurst-tavern-ledger-removed";

  function loadList(key) {
    try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  function saveList(key, list) {
    try { window.localStorage.setItem(key, JSON.stringify(list)); } catch (e) {}
  }
  function allPlayers() {
    var custom = loadList(ADD_KEY);
    var removed = loadList(REMOVE_KEY);
    var combined = DEFAULT_PLAYERS.concat(custom.filter(function (p) { return DEFAULT_PLAYERS.indexOf(p) === -1; }));
    return combined.filter(function (p) { return removed.indexOf(p) === -1; });
  }
  function removePlayer(name) {
    var removed = loadList(REMOVE_KEY);
    if (removed.indexOf(name) === -1) removed.push(name);
    saveList(REMOVE_KEY, removed);
    var custom = loadList(ADD_KEY).filter(function (p) { return p !== name; });
    saveList(ADD_KEY, custom);
  }

  function escHtml(s) {
    return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  }

  // ---- Dice ---------------------------------------------------------------
  function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }
  function roll4d6DropLowest() {
    var rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
    rolls.sort(function (a, b) { return a - b; });
    return rolls[1] + rolls[2] + rolls[3];
  }

  var reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // =========================================================================
  // Landing scene: hotspots + lean-in transition + rules modal
  // =========================================================================
  var landing = document.getElementById("landing");
  var bookScene = document.getElementById("bookScene");
  var hotspotLabel = document.getElementById("hotspotLabel");
  var rulesModal = document.getElementById("rulesModal");

  function positionLabel(el, text) {
    var box = el.getBoundingClientRect();
    hotspotLabel.style.left = (box.left + box.width / 2) + "px";
    hotspotLabel.style.top = box.top + "px";
    hotspotLabel.textContent = text;
    hotspotLabel.classList.add("show");
  }
  function hideLabel() { hotspotLabel.classList.remove("show"); }

  var bartenderHotspot = document.getElementById("hotspotBartender");
  var bookHotspot = document.getElementById("hotspotBook");

  bartenderHotspot.addEventListener("mouseenter", function () { positionLabel(bartenderHotspot, "Ask about the rules"); });
  bartenderHotspot.addEventListener("mouseleave", hideLabel);
  bartenderHotspot.addEventListener("focus", function () { positionLabel(bartenderHotspot, "Ask about the rules"); });
  bartenderHotspot.addEventListener("blur", hideLabel);

  bookHotspot.addEventListener("mouseenter", function () { positionLabel(bookHotspot, "Open the ledger"); });
  bookHotspot.addEventListener("mouseleave", hideLabel);
  bookHotspot.addEventListener("focus", function () { positionLabel(bookHotspot, "Open the ledger"); });
  bookHotspot.addEventListener("blur", hideLabel);

  function activate(el, fn) {
    el.addEventListener("click", fn);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
  }

  activate(bartenderHotspot, openRulesModal);
  activate(bookHotspot, openBook);

  function openRulesModal() {
    rulesModal.hidden = false;
    document.getElementById("rulesClose").focus();
  }
  function closeRulesModal() { rulesModal.hidden = true; }
  document.getElementById("rulesClose").addEventListener("click", closeRulesModal);
  document.getElementById("rulesBackdrop").addEventListener("click", closeRulesModal);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !rulesModal.hidden) closeRulesModal(); });

  function setLeanOrigin() {
    var box = bookHotspot.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var cx = ((box.left + box.width / 2) / vw * 100).toFixed(1) + "%";
    var cy = ((box.top + box.height / 2) / vh * 100).toFixed(1) + "%";
    landing.style.setProperty("--zoom-x", cx);
    landing.style.setProperty("--zoom-y", cy);
  }

  function openBook() {
    setLeanOrigin();
    if (reducedMotion()) {
      landing.hidden = true;
      showBookScene();
      return;
    }
    landing.classList.add("zooming");
    window.setTimeout(function () {
      landing.hidden = true;
      showBookScene();
    }, 720);
  }

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
      closeBook();
    }
  });

  function closeBook() {
    if (reducedMotion()) {
      bookScene.hidden = true;
      landing.hidden = false;
      return;
    }
    setLeanOrigin();
    landing.classList.remove("returning");
    landing.classList.add("on-top");
    landing.hidden = false;
    landing.classList.add("zooming");
    void landing.offsetWidth;
    landing.classList.remove("zooming");
    landing.classList.add("returning");
    window.setTimeout(function () {
      bookScene.hidden = true;
      landing.classList.remove("returning", "on-top");
    }, 900);
  }

  // =========================================================================
  // Book overlay: keeps a percentage-positioned layer matched to the
  // object-fit:cover crop rectangle of book-bg, at any viewport size.
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
  var playerListEl = document.getElementById("playerList");
  var currentPlayer = null;

  function unlockSummaryText(name) {
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

  function unlockSummaryHtml(name) {
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
      btn.addEventListener("click", function () { choosePlayer(name); });

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

  document.getElementById("addPlayerForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = document.getElementById("addPlayerInput");
    var name = input.value.trim();
    if (!name) return;
    var custom = loadList(ADD_KEY);
    var removed = loadList(REMOVE_KEY).filter(function (p) { return p !== name; });
    saveList(REMOVE_KEY, removed);
    if (allPlayers().indexOf(name) === -1 && custom.indexOf(name) === -1) custom.push(name);
    saveList(ADD_KEY, custom);
    input.value = "";
    renderPlayerList();
    choosePlayer(name);
  });

  function resetPlayerRoster() {
    currentPlayer = null;
    renderPlayerList();
  }

  function choosePlayer(name) {
    currentPlayer = name;
    document.getElementById("generateFor").textContent = "Rolling for " + name;
    document.getElementById("unlockSummaryGen").innerHTML = unlockSummaryHtml(name);
    resetGenerator();
    goToSpread("generate");
  }

  // =========================================================================
  // Spread two: generator + export
  // =========================================================================
  var nameInput = document.getElementById("nameInput");
  var portraitFrame = document.getElementById("portraitFrame");
  var portraitImg = document.getElementById("portraitImg");
  var raceField = document.getElementById("raceField");
  var classField = document.getElementById("classField");
  var statFields = {
    str: document.getElementById("statStr"), dex: document.getElementById("statDex"), con: document.getElementById("statCon"),
    int: document.getElementById("statInt"), wis: document.getElementById("statWis"), cha: document.getElementById("statCha")
  };
  var derivedFields = {
    ac: document.getElementById("derivedAc"), init: document.getElementById("derivedInit"), speed: document.getElementById("derivedSpeed"),
    bab: document.getElementById("derivedBab"), fort: document.getElementById("derivedFort"), ref: document.getElementById("derivedRef"),
    will: document.getElementById("derivedWill")
  };
  var rollLogEl = document.getElementById("rollLog");
  var hpField = document.getElementById("hpField");
  var hdField = document.getElementById("hdField");
  var exportBtn = document.getElementById("exportBtn");
  var copyBtn = document.getElementById("copyBtn");

  var STAT_NAMES = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
  var STAT_KEYS = ["str", "dex", "con", "int", "wis", "cha"];
  var currentCharacter = null;

  function resetGenerator() {
    currentCharacter = null;
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
    setStatus("", "");
  }

  // New quill-sketch set: transparent-background webp, same race_class naming.
  function portraitPath(race, cls) {
    var slug = function (s) { return s.toLowerCase().replace(/\s+/g, "-"); };
    return "docs/AI_Artwork/dnd35_quill_sketches_webp/dnd35_quill_sketches_webp/" + slug(race) + "_" + slug(cls) + ".webp";
  }

  function writeIn(el, delayMs) {
    el.classList.remove("write-in");
    void el.offsetWidth;
    el.style.animationDelay = delayMs + "ms";
    el.classList.add("write-in");
  }

  function renderStats(scores) {
    STAT_KEYS.forEach(function (k, i) {
      var el = statFields[k];
      el.textContent = scores[i];
      writeIn(el, i * 110);
    });
  }

  var rollLogParts = [];

  function buildChoiceField(container, delayMs, dieText, rollResult, tableEntry, basePool, guaranteedPool, unlockedPool, logLabel, onChange) {
    container.innerHTML = "";
    var needsChoice = tableEntry === null || guaranteedPool.length > 0;

    if (needsChoice) {
      var pool = basePool.concat(unlockedPool).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
      var select = document.createElement("select");
      select.className = "gen-choice";
      pool.forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt; o.textContent = opt;
        select.appendChild(o);
      });
      var initial = guaranteedPool.length ? guaranteedPool[0] : (tableEntry || pool[0]);
      select.value = initial;
      select.addEventListener("change", function () { onChange(select.value); });
      container.appendChild(select);
      rollLogParts.push(logLabel + ": " + (tableEntry === null ? dieText + "→" + rollResult + " (choice)" : "town's choice"));
      onChange(initial);
    } else {
      container.textContent = tableEntry;
      rollLogParts.push(logLabel + ": " + dieText + "→" + rollResult);
      onChange(tableEntry);
    }
    writeIn(container, delayMs);
  }

  // Src is assigned inside the same delayed callback as the reveal, so nothing
  // is ever loaded/paintable before the moment it's meant to fade in (fixes the
  // portrait flashing briefly on roll, then disappearing).
  function updatePortrait() {
    if (!currentCharacter || !currentCharacter.race || !currentCharacter.class) return;
    var race = currentCharacter.race, cls = currentCharacter.class;
    window.setTimeout(function () {
      if (!currentCharacter || currentCharacter.race !== race || currentCharacter.class !== cls) return;
      portraitImg.src = portraitPath(race, cls);
      portraitImg.alt = race + " " + cls + " portrait";
      portraitFrame.classList.add("show");
    }, 700);
  }

  function updateHP() {
    if (!currentCharacter || !currentCharacter.class) return;
    var die = HIT_DICE[currentCharacter.class] || 8;
    currentCharacter.hp = computeHP(currentCharacter.class, currentCharacter.level, currentCharacter.con);
    hpField.textContent = currentCharacter.hp;
    hdField.textContent = currentCharacter.level + "d" + die;
    writeIn(hpField, 900);
    writeIn(hdField, 950);
  }

  function updateDerived() {
    if (!currentCharacter || !currentCharacter.race || !currentCharacter.class) return;
    var d = computeDerived(currentCharacter);
    derivedFields.ac.textContent = d.ac;
    derivedFields.init.textContent = fmtMod(d.init);
    derivedFields.speed.textContent = d.speed;
    derivedFields.bab.textContent = fmtMod(d.bab);
    derivedFields.fort.textContent = fmtMod(d.fort);
    derivedFields.ref.textContent = fmtMod(d.ref);
    derivedFields.will.textContent = fmtMod(d.will);
    var i = 0;
    Object.keys(derivedFields).forEach(function (k) { writeIn(derivedFields[k], 1000 + (i++) * 50); });
  }

  function rollCharacter() {
    if (!currentPlayer) return;
    resetGenerator();
    var p = progressionFor(currentPlayer);
    var scores = STAT_NAMES.map(function () { return roll4d6DropLowest(); });
    currentCharacter = {
      player: currentPlayer,
      str: scores[0], dex: scores[1], con: scores[2], int: scores[3], wis: scores[4], cha: scores[5],
      race: null, class: null, level: p.startingLevel, xp: p.bonusXP, name: ""
    };

    renderStats(scores);
    rollLogParts = [];

    var raceRoll = rollDie(8);
    var raceEntry = (raceRoll === 8) ? null : RACE_TABLE[raceRoll];
    buildChoiceField(raceField, 700, "1d8", raceRoll, raceEntry, BASE_RACES, p.guaranteedRaces, p.unlockedRaces, "Race", function (val) {
      currentCharacter.race = val; updatePortrait(); updateDerived();
    });

    var classRoll = rollDie(12);
    var classEntry = (classRoll === 12) ? null : CLASS_TABLE[classRoll];
    buildChoiceField(classField, 800, "1d12", classRoll, classEntry, BASE_CLASSES, p.guaranteedClasses, p.unlockedClasses, "Class", function (val) {
      currentCharacter.class = val; updatePortrait(); updateHP(); updateDerived();
    });

    if (p.startingLevel > 1 || p.bonusXP > 0) {
      rollLogParts.push("Starts at level " + p.startingLevel + (p.bonusXP ? " (" + p.bonusXP + " XP)" : ""));
    }
    rollLogEl.textContent = rollLogParts.join("  ·  ");
    setStatus("", "");
  }

  document.getElementById("rollBtn").addEventListener("click", rollCharacter);
  document.getElementById("rerollBtn").addEventListener("click", rollCharacter);
  nameInput.addEventListener("input", function () { if (currentCharacter) currentCharacter.name = nameInput.value.trim(); });

  // ---- Fantasy Grounds XML export -----------------------------------------
  function xmlEscape(s) {
    return String(s).replace(/[<>&'"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]; });
  }

  function buildFgXml(ch) {
    var name = ch.name || "Unnamed Adventurer of Oakhurst";
    var d = computeDerived(ch);
    return [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<root version="4.1" dataversion="20210302" release="8|CoreRPG:4">',
      '  <character>',
      '    <name type="string">' + xmlEscape(name) + '</name>',
      '    <race type="string">' + xmlEscape(ch.race) + '</race>',
      '    <level type="number">' + ch.level + '</level>',
      '    <exp type="number">' + ch.xp + '</exp>',
      '    <hp>',
      '      <total type="number">' + ch.hp + '</total>',
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
      '        <name type="string">' + xmlEscape(ch.class) + '</name>',
      '        <level type="number">' + ch.level + '</level>',
      '      </id-00001>',
      '    </classes>',
      '    <abilities>',
      '      <strength><score type="number">' + ch.str + '</score></strength>',
      '      <dexterity><score type="number">' + ch.dex + '</score></dexterity>',
      '      <constitution><score type="number">' + ch.con + '</score></constitution>',
      '      <intelligence><score type="number">' + ch.int + '</score></intelligence>',
      '      <wisdom><score type="number">' + ch.wis + '</score></wisdom>',
      '      <charisma><score type="number">' + ch.cha + '</score></charisma>',
      '    </abilities>',
      '  </character>',
      '</root>',
      ''
    ].join("\n");
  }

  function setStatus(text, kind) {
    var el = document.getElementById("statusLine");
    el.textContent = text;
    el.className = "status-line" + (kind ? " " + kind : "");
  }

  function safeFileStem(ch) {
    var base = (ch.name || "unnamed-adventurer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return base || "adventurer";
  }

  exportBtn.addEventListener("click", function () {
    if (!currentCharacter || !currentCharacter.race || !currentCharacter.class) { setStatus("Roll a character first.", "err"); return; }
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
    if (!currentCharacter || !currentCharacter.race || !currentCharacter.class) { setStatus("Roll a character first.", "err"); return; }
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
})();
