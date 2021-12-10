import random

from utttpy.game.action import Action
from utttpy.game.constants import X_STATE_VALUE, O_STATE_VALUE


def get_random_symbol() -> int:
    return random.choice([X_STATE_VALUE, O_STATE_VALUE])


def get_random_index() -> int:
    return random.randint(0, 80)


def test_action(seed: int = 0, verbose: bool = False) -> None:
    random.seed(seed)

    symbol = get_random_symbol()
    index = get_random_index()
    action = Action(symbol=symbol, index=index)

    if verbose:
        print(action)

    assert action.symbol == symbol
    assert action.index == index
    assert action.symbol in set([X_STATE_VALUE, O_STATE_VALUE])
    assert 0 <= action.index < 81


def test_actions(num_iters: int = 1000, verbose: bool = False) -> None:
    for i in range(num_iters):
        test_action(seed=i, verbose=verbose)


if __name__ == "__main__":
    test_actions(num_iters=20, verbose=True)
