// ---- Player progression (metaprogression unlocks) --------------------
// Maintained by Claude. Update an entry whenever a player buys an ATT/TPO,
// then push. Everyone starts here — current campaign state is default for
// all players, so every array is empty and startingLevel is 1.
export function defaultProgression() {
  return {
    startingLevel: 1,
    bonusXP: 0,
    guaranteedRaces: [],
    guaranteedClasses: [],
    unlockedRaces: [],
    unlockedClasses: []
  };
}

export var PROGRESSION = {
  Kraig: defaultProgression(), JJ: defaultProgression(), Shayne: defaultProgression(),
  Jeremy: defaultProgression(), Christian: defaultProgression(), Kirk: defaultProgression(),
  Aiden: defaultProgression(), Pepe: defaultProgression()
};

export function progressionFor(name) {
  if (!PROGRESSION[name]) PROGRESSION[name] = defaultProgression();
  return PROGRESSION[name];
}
