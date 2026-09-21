"use strict";

/*
 * Shared Chopsticks game engine.
 * The browser interface and the minimax player will both use these functions.
 */

function overflowSum(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 4 || b > 4) {
    throw new RangeError("Hand values must be integers from 0 through 4.");
  }
  return a + b >= 5 ? 0 : a + b;
}

function cloneState(state) {
  return {
    playerA: [...state.playerA],
    playerB: [...state.playerB],
    level: state.level,
  };
}

function currentPlayer(state) {
  return state.level % 2 === 0 ? "A" : "B";
}

function isTerminal(state) {
  return state.playerA.every(value => value === 0) ||
    state.playerB.every(value => value === 0);
}

function generateLegalMoves(state) {
  if (isTerminal(state)) {
    return [];
  }

  const player = currentPlayer(state);
  const opponent = player === "A" ? "B" : "A";
  const ownKey = player === "A" ? "playerA" : "playerB";
  const opponentKey = opponent === "A" ? "playerA" : "playerB";
  const ownHands = state[ownKey];
  const opponentHands = state[opponentKey];
  const handNames = ["left", "right"];
  const moves = [];

  // Attacks: every active hand may attack either active opposing hand.
  for (let source = 0; source < 2; source += 1) {
    if (ownHands[source] === 0) continue;

    for (let target = 0; target < 2; target += 1) {
      if (opponentHands[target] === 0) continue;

      const nextState = cloneState(state);
      nextState[opponentKey][target] = overflowSum(
        ownHands[source],
        opponentHands[target]
      );
      nextState.level += 1;

      moves.push({
        type: "attack",
        player,
        source: handNames[source],
        target: handNames[target],
        nextState,
      });
    }
  }

  // Redistributions: transfer fingers in either direction without overflow.
  for (let from = 0; from < 2; from += 1) {
    const to = 1 - from;

    for (let amount = 1; amount <= ownHands[from]; amount += 1) {
      if (ownHands[to] + amount >= 5) continue;

      const redistributed = [...ownHands];
      redistributed[from] -= amount;
      redistributed[to] += amount;

      // The Python starter excludes a move that only swaps the two hands.
      if (
        redistributed[0] === ownHands[1] &&
        redistributed[1] === ownHands[0]
      ) {
        continue;
      }

      const nextState = cloneState(state);
      nextState[ownKey] = redistributed;
      nextState.level += 1;

      moves.push({
        type: "redistribute",
        player,
        from: handNames[from],
        to: handNames[to],
        amount,
        hands: [...redistributed],
        nextState,
      });
    }
  }

  return moves;
}

function stateKey(state) {
  return `${state.playerA.join(",")}|${state.playerB.join(",")}|${state.level}`;
}

// Minimax cares about successor states, not which equivalent click produced one.
function uniqueSuccessorStates(state) {
  const unique = new Map();
  for (const move of generateLegalMoves(state)) {
    unique.set(stateKey(move.nextState), move.nextState);
  }
  return [...unique.values()];
}

const ChopsticksEngine = {
  overflowSum,
  cloneState,
  currentPlayer,
  isTerminal,
  generateLegalMoves,
  stateKey,
  uniqueSuccessorStates,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ChopsticksEngine;
}

if (typeof window !== "undefined") {
  window.ChopsticksEngine = ChopsticksEngine;
}
