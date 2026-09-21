"use strict";

/*
 * Bottom-up dynamic-programming/minimax player.
 * All legal successors come from game.js; no game rules are repeated here.
 */

const GameEngine = typeof module !== "undefined" && module.exports
  ? require("./game.js")
  : window.ChopsticksEngine;

function terminalValue(state) {
  const aLost = state.playerA[0] === 0 && state.playerA[1] === 0;
  const bLost = state.playerB[0] === 0 && state.playerB[1] === 0;

  if (aLost && bLost) return 0;
  if (aLost) return -1;
  if (bLost) return 1;
  return null;
}

function allFingerConfigurations(callback) {
  for (let aLeft = 0; aLeft < 5; aLeft += 1) {
    for (let aRight = 0; aRight < 5; aRight += 1) {
      for (let bLeft = 0; bLeft < 5; bLeft += 1) {
        for (let bRight = 0; bRight < 5; bRight += 1) {
          callback([aLeft, aRight], [bLeft, bRight]);
        }
      }
    }
  }
}

function buildMinimaxTable(depth) {
  if (!Number.isInteger(depth) || depth < 0 || depth % 2 !== 0) {
    throw new RangeError("Search depth must be a nonnegative even integer.");
  }

  const table = new Map();

  // At the search limit, terminal states retain their win/loss values.
  // Every other position is scored as a depth-limited tie.
  allFingerConfigurations((playerA, playerB) => {
    const state = { playerA, playerB, level: depth };
    table.set(GameEngine.stateKey(state), {
      value: terminalValue(state) ?? 0,
      nextState: null,
    });
  });

  // Work backward so every successor at level + 1 is already known.
  for (let level = depth - 1; level >= 0; level -= 1) {
    allFingerConfigurations((playerA, playerB) => {
      const state = { playerA, playerB, level };
      const key = GameEngine.stateKey(state);
      const finishedValue = terminalValue(state);

      if (finishedValue !== null) {
        table.set(key, { value: finishedValue, nextState: null });
        return;
      }

      const successors = GameEngine.uniqueSuccessorStates(state);
      let chosenState = successors[0];
      let chosenValue = table.get(GameEngine.stateKey(chosenState)).value;

      for (let index = 1; index < successors.length; index += 1) {
        const candidateState = successors[index];
        const candidateValue = table.get(
          GameEngine.stateKey(candidateState)
        ).value;

        const isBetter = level % 2 === 0
          ? candidateValue > chosenValue
          : candidateValue < chosenValue;

        if (isBetter) {
          chosenState = candidateState;
          chosenValue = candidateValue;
        }
      }

      table.set(key, {
        value: chosenValue,
        nextState: chosenState,
      });
    });
  }

  return table;
}

function chooseOptimalMove(state, table) {
  const entry = table.get(GameEngine.stateKey(state));
  if (!entry) {
    throw new Error("The state is not present in the minimax table.");
  }
  if (entry.nextState === null) return null;

  const selectedKey = GameEngine.stateKey(entry.nextState);
  return GameEngine.generateLegalMoves(state).find(
    move => GameEngine.stateKey(move.nextState) === selectedKey
  ) ?? null;
}

const ChopsticksAI = {
  terminalValue,
  buildMinimaxTable,
  chooseOptimalMove,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ChopsticksAI;
}

if (typeof window !== "undefined") {
  window.ChopsticksAI = ChopsticksAI;
}
