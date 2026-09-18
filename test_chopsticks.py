from chopsticks import overflow_sum, next_moves, best_move_dp

def test_overflow_sum():
    assert overflow_sum(1, 2) == 3
    assert overflow_sum(2, 2) == 4
    assert overflow_sum(3, 2) == 0
    assert overflow_sum(4, 4) == 0

def test_initial_moves():
    state = ((1, 1), (1, 1), 0)

    expected = {
        ((1, 1), (1, 1), 1),
        ((1, 1), (1, 2), 1),
        ((0, 2), (1, 1), 1),
        ((2, 0), (1, 1), 1),
    }

    assert set(next_moves(state)) == expected

    def test_game_over_has_no_moves():
        assert next_moves(((0, 0), (1, 1), 1)) == []
        assert next_moves(((1, 1), (0, 0), 5)) == []

    def test_depth_limit_values():
        table = best_move_dp

        assert table[((0, 0), (1, 1), 4)][0] == -1
        assert table[((1, 1), (0, 0), 4)][0] == 1
        assert table[((1, 1), (1, 1), 4)][0] == 0

    def test_terminal_states_before_depth_limit():
        table = best_move_dp(4)

        assert table[((0, 0), (1, 1), 2)][0] == -1
        assert table[((1, 1,), (0, 0), 3)][0] == 1

    def test_table_size():
        depth = 20
        table = best_move_dp(depth)

        assert len(table) == 625 * (depth + 1)

    def test_selected_moves_are_legal():
        depth = 6
        table = best_move_dp(depth)

        for state, (_, chosen_move) in table.items():
            level = state[2]
            a_hands = state[0]
            b_hands = state[1]

            terminal = a_hands == (0, 0) or b_hands == (0, 0)

            if level < depth and not terminal:
                assert chosen_move in next_moves(state)