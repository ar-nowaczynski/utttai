import random
from typing import Tuple

import pytest

from utttpy.game.action import Action
from utttpy.game.constants import X_STATE_VALUE, O_STATE_VALUE, CONSTRAINT_STATE_INDEX
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe, UltimateTicTacToeError


def test_uttt_exceptions() -> None:
    uttt = UltimateTicTacToe()

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=-1), verify=True)
    assert str(e.value) == "Illegal Action(symbol=X, index=-1) - index outside the valid range"

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=81), verify=True)
    assert str(e.value) == "Illegal Action(symbol=X, index=81) - index outside the valid range"

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=40), verify=True)
    assert str(e.value) == "Illegal Action(symbol=O, index=40) - next move belongs to X"

    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=40), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=36), verify=True)
    assert str(e.value) == "Illegal Action(symbol=X, index=36) - next move belongs to O"

    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=36), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=8), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=80), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=80), verify=True)
    assert str(e.value) == "Illegal Action(symbol=X, index=80) - index is already taken"

    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=76), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=40), verify=True)
    assert str(e.value) == "Illegal Action(symbol=O, index=40) - index is already taken"

    uttt.state[CONSTRAINT_STATE_INDEX] = 10
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=42), verify=True)
    assert str(e.value) == "invalid constraint=10"
    uttt.state[CONSTRAINT_STATE_INDEX] = 4

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=35), verify=True)
    assert str(e.value) == "Illegal Action(symbol=O, index=35) - violated constraint=4"

    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=39), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=30), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=31), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=42), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=58), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=38), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=20), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=27), verify=True)
    assert str(e.value) == "Illegal Action(symbol=X, index=27) - violated constraint=2"

    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=26), verify=True)

    uttt.state[CONSTRAINT_STATE_INDEX] = 4
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=44), verify=True)
    assert str(e.value) == "constraint=4 points to terminated subgame"
    uttt.state[CONSTRAINT_STATE_INDEX] = 8

    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=77), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=53), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=74), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=22), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=44), verify=True)
    assert str(e.value) == "Illegal Action(symbol=O, index=44) - index from terminated subgame"

    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=60), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=55), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=13), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=76), verify=True)
    assert str(e.value) == "Illegal Action(symbol=X, index=76) - index from terminated subgame"

    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=50), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=47), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=23), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=46), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=11), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=18), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=0), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=4), verify=True)

    uttt.state[21] = X_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=49), verify=True)
    assert str(e.value) == "X won subgame=2, but supergame is not updated"
    uttt.state[21] = 0

    uttt.state[56] = O_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=49), verify=True)
    assert str(e.value) == "O won subgame=6, but supergame is not updated"
    uttt.state[56] = 0

    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=49), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=62), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=59), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=51), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=56), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=24), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=57), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=34), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=69), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=61), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=70), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=71), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=2), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=19), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=9), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=5), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=40), verify=True)
    assert str(e.value) == "Illegal Action(symbol=O, index=40) - next move belongs to X"

    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=45), verify=True)
    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=6), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=66), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=27), verify=True)
    assert str(e.value) == "Illegal Action(symbol=X, index=27) - next move belongs to O"

    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=29), verify=True)
    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=63), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=10), verify=True)
    assert str(e.value) == "Illegal Action(symbol=O, index=10) - violated constraint=0"

    uttt.execute(action=Action(symbol=O_STATE_VALUE, index=1), verify=True)

    uttt.state[3] = X_STATE_VALUE
    uttt.state[7] = X_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=10), verify=True)
    assert str(e.value) == "DRAW on subgame=0, but supergame is not updated"
    uttt.state[3] = 0
    uttt.state[7] = 0

    uttt.state[65] = O_STATE_VALUE
    uttt.state[68] = O_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=10), verify=True)
    assert str(e.value) == "X and O have winning positions on subgame=7"
    uttt.state[65] = 0
    uttt.state[68] = 0

    uttt.state[82] = X_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=10), verify=True)
    assert str(e.value) == "X won supergame, but result is not updated"
    uttt.state[82] = 0

    uttt.state[81] = O_STATE_VALUE
    uttt.state[82] = O_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=10), verify=True)
    assert str(e.value) == "O won supergame, but result is not updated"
    uttt.state[81] = 0
    uttt.state[82] = 0

    uttt.state[81] = X_STATE_VALUE
    uttt.state[82] = O_STATE_VALUE
    uttt.state[84] = O_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=10), verify=True)
    assert str(e.value) == "DRAW on supergame, but result is not updated"
    uttt.state[81] = 0
    uttt.state[82] = 0
    uttt.state[84] = 0

    uttt.state[81] = O_STATE_VALUE
    uttt.state[82] = X_STATE_VALUE
    uttt.state[84] = O_STATE_VALUE
    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=X_STATE_VALUE, index=10), verify=True)
    assert str(e.value) == "X and O have winning positions on supergame"
    uttt.state[81] = 0
    uttt.state[82] = 0
    uttt.state[84] = 0

    uttt.execute(action=Action(symbol=X_STATE_VALUE, index=10), verify=True)

    with pytest.raises(UltimateTicTacToeError) as e:
        uttt.execute(action=Action(symbol=O_STATE_VALUE, index=33), verify=True)
    assert str(e.value) == "supergame is terminated"


def test_uttt(seed: int = 0, verbose: bool = False) -> Tuple[bool, bool, bool]:
    random.seed(seed)

    uttt = UltimateTicTacToe()
    assert not uttt.is_terminated()

    if verbose:
        print(uttt)

    symbol = X_STATE_VALUE

    while not uttt.is_terminated():

        if symbol == X_STATE_VALUE:
            assert symbol == uttt.next_symbol
            assert uttt.is_next_symbol_X()
        elif symbol == O_STATE_VALUE:
            assert symbol == uttt.next_symbol
            assert uttt.is_next_symbol_O()
        else:
            raise ValueError(f"unknown symbol={symbol}")

        legal_actions = uttt.get_legal_actions()
        if verbose:
            print(f"legal_actions({len(legal_actions)}) = [")
            for legal_action in legal_actions:
                print(f"  {legal_action},")
            print("]")
        assert len(legal_actions) > 0
        for legal_action in legal_actions:
            assert symbol == legal_action.symbol

        selected_action = random.choice(legal_actions)
        if verbose:
            print(f"selected_action: {selected_action}")
        _uttt_before = uttt.clone()
        uttt.execute(action=selected_action, verify=True)
        assert not all(b == a for b, a in zip(_uttt_before.state, uttt.state))

        if verbose:
            print(uttt)

        symbol = X_STATE_VALUE if symbol == O_STATE_VALUE else O_STATE_VALUE

    assert uttt.is_terminated()
    results = (uttt.is_result_X(), uttt.is_result_O(), uttt.is_result_draw())
    assert sum(results) == 1

    return results


def test_uttts(num_iters: int = 200, verbose: bool = False) -> None:
    num_X_wins = 0
    num_O_wins = 0
    num_draws = 0

    for i in range(num_iters):
        results = test_uttt(seed=i)
        num_X_wins += int(results[0])
        num_O_wins += int(results[1])
        num_draws += int(results[2])

    if verbose:
        print(f"num_X_wins = {num_X_wins}")
        print(f"num_O_wins = {num_O_wins}")
        print(f"num_draws  = {num_draws}")

    assert (num_X_wins + num_O_wins + num_draws) == num_iters


if __name__ == "__main__":
    test_uttt_exceptions()
    test_uttt(seed=123456, verbose=True)
    test_uttts(num_iters=1000, verbose=True)
