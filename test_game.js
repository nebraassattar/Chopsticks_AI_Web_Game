"use strict";

const assert = require("node:assert/strict");
const engine = require("./game.js");

function keys(states) {
  return new Set(states.map(engine.stateKey));
}

assert.equal(engine.overflowSum(1, 2), 3);
assert.equal(engine.overflowSum(2, 2), 4);
assert.equal(engine.overflowSum(3, 2), 0);
assert.equal(engine.overflowSum(4, 4), 0);

const initial = { playerA: [1, 1], playerB: [1, 1], level: 0 };
const initialSuccessors = engine.uniqueSuccessorStates(initial);
const expectedInitial = [
  { playerA: [1, 1], playerB: [2, 1], level: 1 },
  { playerA: [1, 1], playerB: [1, 2], level: 1 },
  { playerA: [0, 2], playerB: [1, 1], level: 1 },
  { playerA: [2, 0], playerB: [1, 1], level: 1 },
];
assert.deepEqual(keys(initialSuccessors), keys(expectedInitial));

const bTurn = { playerA: [1, 1], playerB: [1, 1], level: 1 };
const bSuccessors = engine.uniqueSuccessorStates(bTurn);
const expectedB = [
  { playerA: [2, 1], playerB: [1, 1], level: 2 },
  { playerA: [1, 2], playerB: [1, 1], level: 2 },
  { playerA: [1, 1], playerB: [0, 2], level: 2 },
  { playerA: [1, 1], playerB: [2, 0], level: 2 },
];
assert.deepEqual(keys(bSuccessors), keys(expectedB));

assert.deepEqual(
  engine.generateLegalMoves({ playerA: [0, 0], playerB: [1, 1], level: 4 }),
  []
);
assert.deepEqual(
  engine.generateLegalMoves({ playerA: [1, 1], playerB: [0, 0], level: 5 }),
  []
);

const attacks = engine.generateLegalMoves(initial).filter(move => move.type === "attack");
const redistributions = engine.generateLegalMoves(initial).filter(
  move => move.type === "redistribute"
);
assert.equal(attacks.length, 4);
assert.equal(redistributions.length, 2);

for (const move of engine.generateLegalMoves(initial)) {
  for (const value of [...move.nextState.playerA, ...move.nextState.playerB]) {
    assert.ok(value >= 0 && value <= 4);
  }
  assert.equal(move.nextState.level, initial.level + 1);
}

console.log("All game-engine tests passed.");
