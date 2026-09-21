"use strict";

const assert = require("node:assert/strict");
const game = require("./game.js");
const ai = require("./ai.js");

assert.equal(ai.terminalValue({ playerA: [0, 0], playerB: [1, 1], level: 2 }), -1);
assert.equal(ai.terminalValue({ playerA: [1, 1], playerB: [0, 0], level: 2 }), 1);
assert.equal(ai.terminalValue({ playerA: [0, 0], playerB: [0, 0], level: 2 }), 0);
assert.equal(ai.terminalValue({ playerA: [1, 1], playerB: [1, 1], level: 2 }), null);

const depth = 4;
const table = ai.buildMinimaxTable(depth);
assert.equal(table.size, 625 * (depth + 1));

const limitState = { playerA: [1, 1], playerB: [1, 1], level: depth };
assert.equal(table.get(game.stateKey(limitState)).value, 0);
assert.equal(table.get(game.stateKey(limitState)).nextState, null);

const earlyALoss = { playerA: [0, 0], playerB: [1, 1], level: 2 };
const earlyBLoss = { playerA: [1, 1], playerB: [0, 0], level: 3 };
assert.equal(table.get(game.stateKey(earlyALoss)).value, -1);
assert.equal(table.get(game.stateKey(earlyBLoss)).value, 1);

// Verify the minimax recurrence for every nonterminal state before the limit.
for (const [key, entry] of table) {
  const parts = key.split("|");
  const level = Number(parts[2]);
  if (level >= depth || entry.nextState === null) continue;

  const playerA = parts[0].split(",").map(Number);
  const playerB = parts[1].split(",").map(Number);
  const state = { playerA, playerB, level };
  const successors = game.uniqueSuccessorStates(state);
  const values = successors.map(
    successor => table.get(game.stateKey(successor)).value
  );
  const expected = level % 2 === 0 ? Math.max(...values) : Math.min(...values);

  assert.equal(entry.value, expected);
  assert.ok(
    successors.some(
      successor => game.stateKey(successor) === game.stateKey(entry.nextState)
    )
  );
}

const initial = { playerA: [1, 1], playerB: [1, 1], level: 0 };
const optimalMove = ai.chooseOptimalMove(initial, table);
assert.ok(optimalMove);
assert.ok(
  game.generateLegalMoves(initial).some(
    move => game.stateKey(move.nextState) === game.stateKey(optimalMove.nextState)
  )
);

const fullTable = ai.buildMinimaxTable(20);
assert.equal(fullTable.size, 625 * 21);

console.log("All AI tests passed.");
