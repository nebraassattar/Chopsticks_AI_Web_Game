"use strict";

const assert = require("node:assert/strict");
const game = require("./game.js");
const ai = require("./ai.js");

const DEPTH = 20;
const table = ai.buildMinimaxTable(DEPTH);

function terminal(state) {
  return game.isTerminal(state) || state.level === DEPTH;
}

function assertValidState(state, previousLevel) {
  assert.equal(state.level, previousLevel + 1);
  for (const value of [...state.playerA, ...state.playerB]) {
    assert.ok(Number.isInteger(value));
    assert.ok(value >= 0 && value <= 4);
  }
}

function simulateMatch(humanPlayer) {
  let state = { playerA: [1, 1], playerB: [1, 1], level: 0 };
  const computerPlayer = humanPlayer === "A" ? "B" : "A";

  while (!terminal(state)) {
    const oldLevel = state.level;
    const activePlayer = game.currentPlayer(state);
    const move = activePlayer === computerPlayer
      ? ai.chooseOptimalMove(state, table)
      : game.generateLegalMoves(state)[0];

    assert.ok(move, `Player ${activePlayer} should have a legal move`);
    assert.ok(game.generateLegalMoves(state).some(
      candidate => game.stateKey(candidate.nextState) === game.stateKey(move.nextState)
    ));
    state = game.cloneState(move.nextState);
    assertValidState(state, oldLevel);
  }

  assert.ok(game.isTerminal(state) || state.level === DEPTH);
  return state;
}

const asAResult = simulateMatch("A");
const asBResult = simulateMatch("B");
assert.ok(asAResult.level <= DEPTH);
assert.ok(asBResult.level <= DEPTH);

for (const [key, entry] of table) {
  const [aText, bText, levelText] = key.split("|");
  const state = {
    playerA: aText.split(",").map(Number),
    playerB: bText.split(",").map(Number),
    level: Number(levelText),
  };

  if (entry.nextState === null) continue;
  const successors = game.uniqueSuccessorStates(state);
  assert.ok(successors.some(next => game.stateKey(next) === game.stateKey(entry.nextState)));

  const values = successors.map(next => table.get(game.stateKey(next)).value);
  const expected = state.level % 2 === 0 ? Math.max(...values) : Math.min(...values);
  assert.equal(entry.value, expected);
}

console.log("Complete integration tests passed.");
