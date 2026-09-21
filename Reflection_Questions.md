Why does Player A maximize while Player B minimizes?
    All minimax values are defined from Player A's perspective. A value of +1 means Player A wins, 0 means a tie within the search limit, and -1 means Player A loses. Therefore, Player A chooses the highest available value. Player B tries to produce the worst result for Player A, so Player B chooses the lowest value.

Why is the DP table built from the deepest level toward level 0?
    The value of a state depends on the values of its possible successor states. A successor is always one level deeper than its parent. By starting at the maximum depth and working backward, the algorithm guarantees that every successor value is already stored when its parent is evaluated. This allows each state to be calculated using a simple table lookup.

Why can dynamic programming be substantially faster than recursively exploring the complete game tree?
    Different sequences of moves can reach the same finger configuration at the same level. A basic recursive search may evaluate that repeated state every time it appears in the game tree. Dynamic programming evaluates each state-level combination once, stores the result, and reuses it. With five possible values for each of four hands, there are at most 625 configurations per level and 13,125 state-level combinations through depth 20. This is much smaller than the number of paths that could appear in the complete game tree.

Why should the UI obtain legal moves from the game engine rather than independently implementing the rules?
    Using the game engine as the single source of truth prevents the UI and AI from following different versions of the rules. The interface only displays attacks and redistributions returned by generateLegalMoves(). If the rules are corrected or changed, they only need to be updated in one place. This also prevents illegal selections from changing the game state and makes the program easier to test and maintain.

What part of the project did the AI assistant help with the most?
    The AI assistant helped me the most with translating the dynamic-programming and minimax ideas from Python into organized JavaScript. It helped me separate the game engine, AI logic, and interface while preserving the behavior of the Python reference. It was also useful for proposing tests that compared legal moves, checked terminal states, verified MAX and MIN decisions, and validated the complete depth-20 table.

What AI-generated suggestion did I have to verify, modify, or reject?
    I had to verify the suggested minimax implementation instead of assuming it was correct. In particular, I confirmed that terminal states must be evaluated at every level, not only at the maximum depth, because a player can lose before the search limit is reached. I also modified the browser controller to cancel a pending computer timer when restarting. Without that change, a delayed move from the previous game could affect a newly started game. These examples showed me why AI-generated code still needs targeted tests and manual review.
