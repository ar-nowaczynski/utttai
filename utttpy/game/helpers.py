from functools import lru_cache

import numpy as np

from utttpy.game.constants import X_STATE_VALUE, O_STATE_VALUE
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe


@lru_cache(maxsize=128)
def row_index(s_i: int) -> int:
    """row index [0, 1, ... 8] on the 9x9 board from the state index [0, 1, ... 80]"""
    return 3 * (s_i // 27) + (s_i % 9) // 3


@lru_cache(maxsize=128)
def col_index(s_i: int) -> int:
    """col index [0, 1, ... 8] on the 9x9 board from the state index [0, 1, ... 80]"""
    return 3 * ((s_i // 9) % 3) + s_i % 3


def get_state_ndarray_4x9x9(uttt: UltimateTicTacToe) -> np.ndarray:
    array = np.zeros(shape=(4, 9, 9), dtype=np.int8)

    # 0: current player's symbols
    # 1: opponent's symbols
    if uttt.is_next_symbol_X():
        x_i, o_i = 0, 1
    elif uttt.is_next_symbol_O():
        x_i, o_i = 1, 0
    for s_i, s_v in enumerate(uttt.state[0:81]):
        if s_v == X_STATE_VALUE:
            array[x_i, row_index(s_i), col_index(s_i)] = 1
        elif s_v == O_STATE_VALUE:
            array[o_i, row_index(s_i), col_index(s_i)] = 1

    # 2: fill 1 or -1 depending on the current player's symbol (X or O)
    if uttt.is_next_symbol_X():
        array[2].fill(1)
    elif uttt.is_next_symbol_O():
        array[2].fill(-1)

    # 3: current player's legal moves
    for l_i in uttt.get_legal_indexes():
        array[3, row_index(l_i), col_index(l_i)] = 1

    return array
