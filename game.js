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

// ---------------------------------------------------------------------------
// Browser game controller
// ---------------------------------------------------------------------------

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const MAX_DEPTH = 20;
    const elements = {
      setup: document.querySelector("#setup-overlay"),
      startButtons: document.querySelectorAll("[data-start]"),
      humanRole: document.querySelector("#human-role"),
      humanRoleBoard: document.querySelector("#human-role-board"),
      computerRole: document.querySelector("#computer-role"),
      turn: document.querySelector("#turn-display"),
      level: document.querySelector("#level-display"),
      moves: document.querySelector("#moves-display"),
      status: document.querySelector("#status-message"),
      humanHands: document.querySelectorAll('[data-owner="human"]'),
      computerHands: document.querySelectorAll('[data-owner="computer"]'),
      redistribute: document.querySelector("#redistribute-button"),
      analysisToggle: document.querySelector("#analysis-toggle"),
      analysisPanel: document.querySelector("#analysis-panel"),
      analysisMode: document.querySelector("#analysis-mode"),
      analysisState: document.querySelector("#analysis-state"),
      analysisRole: document.querySelector("#analysis-role"),
      analysisOutcome: document.querySelector("#analysis-outcome"),
      analysisMoves: document.querySelector("#analysis-moves"),
      analysisExplanation: document.querySelector("#analysis-explanation"),
      redistributionPanel: document.querySelector("#redistribution-panel"),
      redistributionOptions: document.querySelector("#redistribution-options"),
      restart: document.querySelector("#restart-button"),
      humanTurnDot: document.querySelector("#human-turn-dot"),
      computerTurnDot: document.querySelector("#computer-turn-dot"),
    };

    let state = { playerA: [1, 1], playerB: [1, 1], level: 0 };
    let humanPlayer = null;
    let computerPlayer = null;
    let selectedHand = null;
    let minimaxTable = null;
    let gameActive = false;
    let computerThinking = false;
    let computerTimer = null;
    let latestAnalysis = null;

    function handsFor(player) {
      return player === "A" ? state.playerA : state.playerB;
    }

    function isHumanTurn() {
      return gameActive && !computerThinking && currentPlayer(state) === humanPlayer;
    }

    function setMessage(message) {
      elements.status.textContent = message;
    }

    function tupleState(value) {
      return `((${value.playerA.join(",")}),(${value.playerB.join(",")}),${value.level})`;
    }

    function valueLabel(value) {
      return value > 0 ? `+${value}` : String(value);
    }

    function outcomeLabel(value) {
      if (value === 1) return "Player A can force a win";
      if (value === -1) return "Player A will lose";
      return "Tie within the search limit";
    }

    function moveLabel(move) {
      if (move.type === "attack") {
        return `Attack: ${move.source} hand → ${move.target} hand`;
      }
      return `Redistribute → (${move.hands[0]}, ${move.hands[1]})`;
    }

    function renderAnalysis(analysis) {
      latestAnalysis = analysis;
      elements.analysisMode.textContent = `${analysis.mode} player`;
      elements.analysisState.textContent = tupleState(analysis.state);
      elements.analysisRole.textContent = `Player ${analysis.player} — ${analysis.mode}`;
      elements.analysisOutcome.textContent = outcomeLabel(analysis.selectedValue);
      elements.analysisMoves.replaceChildren();

      analysis.moves.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = `analysis-move${item.selected ? " selected" : ""}`;

        const number = document.createElement("span");
        number.className = "move-number";
        number.textContent = `Move ${index + 1}`;

        const description = document.createElement("span");
        description.className = "move-description";
        description.textContent = moveLabel(item.move);

        const value = document.createElement("span");
        value.className = "move-value";
        value.textContent = `Value ${valueLabel(item.value)}`;
        if (item.selected) {
          const marker = document.createElement("span");
          marker.className = "selected-marker";
          marker.textContent = "SELECTED";
          value.append(marker);
        }

        row.append(number, description, value);
        elements.analysisMoves.append(row);
      });

      const action = analysis.mode === "MAX" ? "largest" : "smallest";
      elements.analysisExplanation.textContent =
        `As Player ${analysis.player}, the computer is the ${analysis.mode} player. ` +
        `It selected the ${action} successor value, ${valueLabel(analysis.selectedValue)}, ` +
        `measured from Player A's perspective.`;
      elements.analysisToggle.disabled = false;
    }

    function setHandDisplay(owner, hand, value) {
      document.querySelector(`#${owner}-${hand}`).textContent = value;
      document.querySelector(`#${owner}-${hand}-pips`).textContent = "●".repeat(value);
      const button = document.querySelector(`[data-owner="${owner}"][data-hand="${hand}"]`);
      button.classList.toggle("inactive", value === 0);
    }

    function clearSelection() {
      selectedHand = null;
      elements.humanHands.forEach(button => button.classList.remove("selected"));
      elements.computerHands.forEach(button => button.classList.remove("valid-target"));
      elements.redistributionPanel.hidden = true;
    }

    function render() {
      const humanHands = humanPlayer ? handsFor(humanPlayer) : [1, 1];
      const computerHands = computerPlayer ? handsFor(computerPlayer) : [1, 1];

      setHandDisplay("human", "left", humanHands[0]);
      setHandDisplay("human", "right", humanHands[1]);
      setHandDisplay("computer", "left", computerHands[0]);
      setHandDisplay("computer", "right", computerHands[1]);

      elements.level.textContent = `${state.level} / ${MAX_DEPTH}`;
      elements.moves.textContent = Math.max(0, MAX_DEPTH - state.level);

      if (humanPlayer) {
        const active = currentPlayer(state);
        const humanTurn = active === humanPlayer;
        elements.turn.textContent = humanTurn ? "Your turn" : "Computer's turn";
        elements.humanTurnDot.classList.toggle("active", humanTurn && gameActive);
        elements.computerTurnDot.classList.toggle("active", !humanTurn && gameActive);
      }

      const canAct = isHumanTurn();
      elements.humanHands.forEach((button, index) => {
        button.disabled = !canAct || humanHands[index] === 0;
      });
      elements.computerHands.forEach(button => {
        button.disabled = !canAct || !button.classList.contains("valid-target");
      });

      const hasRedistribution = canAct && generateLegalMoves(state).some(
        move => move.type === "redistribute"
      );
      elements.redistribute.disabled = !hasRedistribution;
    }

    function gameResult() {
      if (state.playerA[0] === 0 && state.playerA[1] === 0) return "B";
      if (state.playerB[0] === 0 && state.playerB[1] === 0) return "A";
      if (state.level >= MAX_DEPTH) return "tie";
      return null;
    }

    function finishIfNeeded() {
      const result = gameResult();
      if (result === null) return false;

      gameActive = false;
      computerThinking = false;
      if (computerTimer !== null) window.clearTimeout(computerTimer);
      computerTimer = null;
      clearSelection();

      if (result === "tie") {
        setMessage("The search limit was reached. The game is a tie.");
      } else if (result === humanPlayer) {
        setMessage(`Game over — you win as Player ${humanPlayer}!`);
      } else {
        setMessage(`Game over — the computer wins as Player ${computerPlayer}.`);
      }

      render();
      return true;
    }

    function applyMove(move) {
      if (!move || !gameActive) return false;
      const legal = generateLegalMoves(state).some(candidate =>
        candidate.type === move.type && stateKey(candidate.nextState) === stateKey(move.nextState)
      );
      if (!legal) return false;

      state = cloneState(move.nextState);
      clearSelection();
      render();
      return true;
    }

    function computerTurn() {
      if (!gameActive || currentPlayer(state) !== computerPlayer) return;
      computerThinking = true;
      setMessage("The computer is evaluating the minimax table…");
      render();

      const expectedLevel = state.level;
      computerTimer = window.setTimeout(() => {
        computerTimer = null;
        if (
          !gameActive ||
          state.level !== expectedLevel ||
          currentPlayer(state) !== computerPlayer
        ) {
          return;
        }
        const analysis = window.ChopsticksAI.analyzePosition(state, minimaxTable);
        renderAnalysis(analysis);
        const move = window.ChopsticksAI.chooseOptimalMove(state, minimaxTable);
        computerThinking = false;

        if (!move || !applyMove(move)) {
          setMessage("The computer could not find a legal move.");
          gameActive = false;
          render();
          return;
        }

        if (!finishIfNeeded()) {
          setMessage("Your turn. Select one of your active hands.");
          render();
        }
      }, 550);
    }

    function afterHumanMove() {
      if (!finishIfNeeded()) {
        setMessage("Computer's turn…");
        render();
        computerTurn();
      }
    }

    function selectHumanHand(handName) {
      if (!isHumanTurn()) return;
      const legalAttacks = generateLegalMoves(state).filter(
        move => move.type === "attack" && move.source === handName
      );
      if (legalAttacks.length === 0) {
        setMessage("That hand cannot make a legal attack.");
        return;
      }

      clearSelection();
      selectedHand = handName;
      document.querySelector(`[data-owner="human"][data-hand="${handName}"]`).classList.add("selected");
      for (const move of legalAttacks) {
        document.querySelector(`[data-owner="computer"][data-hand="${move.target}"]`).classList.add("valid-target");
      }
      setMessage("Now select an active computer hand to attack.");
      render();
    }

    function attackComputerHand(target) {
      if (!isHumanTurn() || selectedHand === null) {
        setMessage("Select one of your active hands first.");
        return;
      }

      const move = generateLegalMoves(state).find(candidate =>
        candidate.type === "attack" &&
        candidate.source === selectedHand &&
        candidate.target === target
      );

      if (!move) {
        setMessage("That attack is not legal.");
        return;
      }

      if (applyMove(move)) afterHumanMove();
    }

    function showRedistributions() {
      if (!isHumanTurn()) return;
      clearSelection();
      const moves = generateLegalMoves(state).filter(move => move.type === "redistribute");
      elements.redistributionOptions.replaceChildren();

      for (const move of moves) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "redistribution-option";
        button.textContent = `Left ${move.hands[0]} · Right ${move.hands[1]}`;
        button.addEventListener("click", () => {
          if (applyMove(move)) afterHumanMove();
        });
        elements.redistributionOptions.append(button);
      }

      elements.redistributionPanel.hidden = moves.length === 0;
      setMessage(moves.length ? "Choose one legal redistribution." : "No redistributions are available.");
    }

    function startGame(order) {
      if (computerTimer !== null) window.clearTimeout(computerTimer);
      computerTimer = null;
      humanPlayer = order === "first" ? "A" : "B";
      computerPlayer = humanPlayer === "A" ? "B" : "A";
      state = { playerA: [1, 1], playerB: [1, 1], level: 0 };
      selectedHand = null;
      computerThinking = false;
      gameActive = true;

      if (minimaxTable === null) {
      minimaxTable = window.ChopsticksAI.buildMinimaxTable(MAX_DEPTH);
      }

      elements.humanRole.textContent = `Player ${humanPlayer}`;
      elements.humanRoleBoard.textContent = `(Player ${humanPlayer})`;
      elements.computerRole.textContent = `(Player ${computerPlayer})`;
      elements.setup.hidden = true;
      latestAnalysis = null;
      elements.analysisPanel.hidden = true;
      elements.analysisToggle.disabled = true;
      elements.analysisToggle.textContent = "Show AI analysis";
      clearSelection();
      render();

      if (humanPlayer === "A") {
        setMessage("Your turn. Select one of your active hands.");
      } else {
        setMessage("The computer goes first as Player A.");
        computerTurn();
      }
    }

    elements.startButtons.forEach(button => {
      button.addEventListener("click", () => startGame(button.dataset.start));
    });
    elements.humanHands.forEach(button => {
      button.addEventListener("click", () => selectHumanHand(button.dataset.hand));
    });
    elements.computerHands.forEach(button => {
      button.addEventListener("click", () => attackComputerHand(button.dataset.hand));
    });
    elements.redistribute.addEventListener("click", showRedistributions);
    elements.analysisToggle.addEventListener("click", () => {
      if (latestAnalysis === null) return;
      const willShow = elements.analysisPanel.hidden;
      elements.analysisPanel.hidden = !willShow;
      elements.analysisToggle.textContent = willShow ? "Hide AI analysis" : "Show AI analysis";
    });
    elements.restart.addEventListener("click", () => {
      if (computerTimer !== null) window.clearTimeout(computerTimer);
      computerTimer = null;
      gameActive = false;
      computerThinking = false;
      humanPlayer = null;
      computerPlayer = null;
      state = { playerA: [1, 1], playerB: [1, 1], level: 0 };
      latestAnalysis = null;
      elements.analysisPanel.hidden = true;
      elements.analysisToggle.disabled = true;
      elements.analysisToggle.textContent = "Show AI analysis";
      clearSelection();
      elements.humanRole.textContent = "—";
      elements.humanRoleBoard.textContent = "";
      elements.computerRole.textContent = "";
      elements.turn.textContent = "Choose a side";
      setMessage("Choose whether you want to move first or second.");
      elements.setup.hidden = false;
      render();
    });

    render();
  });
}
