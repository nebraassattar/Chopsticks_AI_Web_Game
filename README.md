# Chopsticks

## Project Overview

This project transforms the provided command-line Python version of Chopsticks
into a single-page browser game. A human player competes against a computer that
uses a depth-limited, bottom-up dynamic-programming/minimax strategy. The game
runs entirely in HTML, CSS, and JavaScript and does not require a server or
database.

The interface supports direct hand-to-hand attacks, legal redistributions,
first- or second-player selection, turn and level information, restart, game
results, and a show/hide panel explaining the computer's minimax decision.

## How to Run the Game

1. Download or copy the complete `chopsticks` folder.
2. Keep all project files in the same folder.
3. Open `index.html` in a modern browser such as Chrome, Edge, or Firefox.
4. Choose **Go first** to play as Player A or **Go second** to play as Player B.

No installation, build process, backend, or database is required. The game may
also be opened through a simple static web server.

## Game Rules

- Player A and Player B each have a left and right hand.
- Every hand contains a value from 0 through 4.
- The initial state is `((1,1),(1,1),0)`.
- A hand with value 0 is inactive and cannot attack or be attacked.
- During an attack, the attacking hand's value is added to the targeted hand.
- If the sum is 5 or greater, the targeted hand becomes 0. Otherwise, it takes
  the value of the sum.
- A player may redistribute fingers between their own hands when the resulting
  state is legal under the Python reference rules.
- A redistribution cannot make a hand reach 5 and cannot simply swap the two
  hand values.
- A player loses when both of their hands are 0.
- If neither player loses before level 20, the depth-limited game is a tie.

To attack in the web game, select one of your active hands and then select an
active computer hand. To redistribute, press **Redistribute** and select one of
the legal states displayed by the game engine.

## State Representation

The conceptual representation follows the Python program:

```text
((A_left, A_right), (B_left, B_right), level)
```

For example:

```text
((1, 4), (3, 0), 8)
```

The JavaScript version stores the same information in an object:

```javascript
{
  playerA: [1, 4],
  playerB: [3, 0],
  level: 8
}
```

An even level means it is Player A's turn. An odd level means it is Player B's
turn. Including the level is important because the same finger configuration
can have a different depth-limited value at a different point in the search.

## Legal-Move Generation: `generateLegalMoves()`

`generateLegalMoves()` in `game.js` is the JavaScript version of the Python
`next_moves()` function. It is the single source of truth for both the user
interface and the AI.

The function first returns an empty list for a terminal state. It determines the
active player from the parity of `level`, then generates:

1. Every attack from an active current-player hand to an active opponent hand.
2. Every legal transfer of fingers from one current-player hand to the other.

Each generated move contains its type, interaction details, and complete next
state. Every next state has `level + 1`. The interface filters these move
objects to determine which hands and redistribution buttons can be used. It
does not implement a separate set of game rules.

Different clicks can sometimes produce the same successor state. The interface
keeps those attacks independently clickable, while `uniqueSuccessorStates()`
deduplicates identical successors for minimax, matching the Python use of a
set.

## Minimax

Every position is evaluated from Player A's perspective:

- `+1`: Player A can force a win.
- `0`: Neither player can force a win before the depth limit.
- `-1`: Player A will lose if both players play optimally.

Player A is the maximizing player. On an even level, the algorithm chooses the
successor with the largest value. Player B is the minimizing player. On an odd
level, it chooses the successor with the smallest value. This means the AI uses
the same algorithm whether the computer is Player A or Player B; only the
MAX/MIN decision changes.

The AI analysis panel displays the pre-move state, computer role, MAX/MIN mode,
distinct successors, stored value of each successor, selected move, and
predicted outcome from Player A's perspective.

## Dynamic-Programming Table

`buildMinimaxTable(depth)` in `ai.js` constructs the table from the maximum
depth back to level 0. At the maximum depth:

- A with `(0,0)` receives `-1`.
- B with `(0,0)` receives `+1`.
- A nonterminal state receives `0`.

Terminal states found before the maximum depth receive the same fixed win/loss
values. For every other state, all successors are already stored at
`level + 1`, so the algorithm selects their maximum or minimum without making a
recursive call.

Each table entry stores both pieces of information needed by the game:

```text
state key -> { value, nextState }
```

Each of the four hands has five possible values, so there are at most
`5^4 = 625` finger configurations per level. At depth 20, the full table has at
most `625 * 21 = 13,125` state-level entries. Storing these results prevents
different game-tree paths from repeatedly evaluating the same position.

## Software Organization

```text
chopsticks/
├── index.html
├── style.css
├── game.js
├── ai.js
├── README.md
├── VIBE_LOG.md
├── test_game.js
├── test_ai.js
└── test_complete.js
```

- `index.html` contains the semantic page structure and controls.
- `style.css` contains the layout, responsive rules, and visual feedback.
- `game.js` contains state mechanics, legal moves, terminal detection, safe
  move application, and the browser controller.
- `ai.js` contains terminal evaluation, bottom-up table construction, minimax
  selection, and analysis data.
- `VIBE_LOG.md` records selected AI-assisted development interactions.
- The three test files verify the engine, AI, and complete integration.

The HTML does not contain attack, redistribution, or minimax rules.

## Testing Performed

Run all automated tests from the project folder:

```bash
node test_game.js
node test_ai.js
node test_complete.js
```

The tests verify:

- normal addition and overflow-to-zero behavior;
- initial legal successors for both A and B turns;
- terminal states producing no legal moves;
- attack and redistribution generation;
- hand values remaining between 0 and 4;
- every move increasing the level by exactly 1;
- terminal minimax values;
- MAX selection for A and MIN selection for B;
- exactly one selected move in the AI analysis;
- table size of 13,125 at depth 20;
- every chosen successor being legal;
- the minimax recurrence across the complete depth-20 table;
- complete simulated games with the human assigned to A and B.

Manual testing should cover direct attacks, redistributions, playing first and
second, game-over messages, restart during computer thinking, the analysis
toggle, browser-console errors, and desktop/mobile widths.

## Known Limitations

- The AI searches only to level 20. A nonterminal position at that level is
  reported as a tie even if unlimited play would eventually produce a winner.
- Equal-valued optimal moves use deterministic first-move tie-breaking rather
  than preferring the fastest win or longest loss.
- The computer uses one fixed search depth and has no difficulty settings.
- Game progress is not saved after the page is closed or refreshed.
- The application is local single-player only and has no online multiplayer.

## Possible Extensions

- Add selectable search depths or difficulty modes.
- Prefer faster wins and delay unavoidable losses when values are tied.
- Add move history, undo, replay, or step-through game-tree visualization.
- Animate the attacking hand toward its target while keeping delays short.
- Save preferences and match statistics with browser local storage.
- Add sound, keyboard controls, and additional accessibility options.
- Add a local two-human mode or online multiplayer.
