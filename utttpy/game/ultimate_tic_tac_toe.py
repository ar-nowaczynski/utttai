from __future__ import annotations

from typing import List, Optional

from utttpy.game.action import Action
from utttpy.game.constants import (
    STATE_SIZE,
    NEXT_SYMBOL_STATE_INDEX,
    CONSTRAINT_STATE_INDEX,
    UTTT_RESULT_STATE_INDEX,
    X_STATE_VALUE,
    O_STATE_VALUE,
    DRAW_STATE_VALUE,
    UNCONSTRAINED_STATE_VALUE,
)


class UltimateTicTacToe:

    def __init__(self, state: Optional[bytearray] = None):
        if state:
            self.state = state
        else:
            self.state = bytearray(STATE_SIZE)
            self.state[NEXT_SYMBOL_STATE_INDEX] = X_STATE_VALUE
            self.state[CONSTRAINT_STATE_INDEX] = UNCONSTRAINED_STATE_VALUE

    def clone(self) -> UltimateTicTacToe:
        return UltimateTicTacToe(state=self.state.copy())

    def is_equal_to(self, uttt: UltimateTicTacToe) -> bool:
        return self.state == uttt.state

    def execute(self, action: Action, verify: bool = True) -> None:
        if verify:
            if self.is_terminated():
                raise UltimateTicTacToeError("supergame is terminated")
            self._verify_state()
            self._verify_action(action=action)
        self.state[action.index] = action.symbol
        self._update_supergame_result(symbol=action.symbol, index=action.index)
        self._toggle_next_symbol()
        self._set_next_constraint(index=action.index)
        if verify:
            self._verify_state()

    def get_legal_actions(self) -> List[Action]:
        return [
            Action(symbol=self.next_symbol, index=legal_index)
            for legal_index in self.get_legal_indexes()
        ]

    def get_legal_indexes(self) -> List[int]:
        if self.is_terminated():
            return []
        if self.is_unconstrained():
            indexes = []
            for i, s in enumerate(self.state[81:90]):
                if not s:
                    indexes.extend(self._get_empty_indexes(subgame=i))
        else:
            indexes = self._get_empty_indexes(subgame=self.constraint)
        return indexes

    @property
    def next_symbol(self) -> int:
        return self.state[NEXT_SYMBOL_STATE_INDEX]

    @property
    def constraint(self) -> int:
        return self.state[CONSTRAINT_STATE_INDEX]

    @property
    def result(self) -> int:
        return self.state[UTTT_RESULT_STATE_INDEX]

    def is_next_symbol_X(self) -> bool:
        return self.next_symbol == X_STATE_VALUE

    def is_next_symbol_O(self) -> bool:
        return self.next_symbol == O_STATE_VALUE

    def is_constrained(self) -> bool:
        return 0 <= self.constraint < 9

    def is_unconstrained(self) -> bool:
        return self.constraint == UNCONSTRAINED_STATE_VALUE

    def is_terminated(self) -> bool:
        return bool(self.result)

    def is_result_X(self) -> bool:
        return self.result == X_STATE_VALUE

    def is_result_O(self) -> bool:
        return self.result == O_STATE_VALUE

    def is_result_draw(self) -> bool:
        return self.result == DRAW_STATE_VALUE

    def _get_empty_indexes(self, subgame: int) -> List[int]:
        offset = subgame * 9
        return [
            i + offset for i, s in enumerate(self.state[offset : offset + 9]) if not s
        ]

    def _is_winning_position(self, symbol: int, subgame: int) -> bool:
        state = self.state
        offset = subgame * 9
        return (
            (
                symbol == state[offset + 4] and
                (
                    symbol == state[offset + 0] == state[offset + 8] or
                    symbol == state[offset + 2] == state[offset + 6] or
                    symbol == state[offset + 1] == state[offset + 7] or
                    symbol == state[offset + 3] == state[offset + 5]
                )
            )
            or
            (
                symbol == state[offset + 0] and
                (
                    symbol == state[offset + 1] == state[offset + 2] or
                    symbol == state[offset + 3] == state[offset + 6]
                )
            )
            or
            (
                symbol == state[offset + 8] and
                (
                    symbol == state[offset + 2] == state[offset + 5] or
                    symbol == state[offset + 6] == state[offset + 7]
                )
            )
        )

    def _is_full(self, subgame: int) -> bool:
        offset = subgame * 9
        return all(self.state[offset : offset + 9])

    def _update_supergame_result(self, symbol: int, index: int) -> None:
        supergame_updated = False
        subgame = index // 9
        if self._is_winning_position(symbol=symbol, subgame=subgame):
            self.state[81 + subgame] = symbol
            supergame_updated = True
        elif self._is_full(subgame=subgame):
            self.state[81 + subgame] = DRAW_STATE_VALUE
            supergame_updated = True
        if supergame_updated:
            if self._is_winning_position(symbol=symbol, subgame=9):
                self.state[UTTT_RESULT_STATE_INDEX] = symbol
            elif self._is_full(subgame=9):
                self.state[UTTT_RESULT_STATE_INDEX] = DRAW_STATE_VALUE

    def _toggle_next_symbol(self) -> None:
        if self.is_next_symbol_X():
            self.state[NEXT_SYMBOL_STATE_INDEX] = O_STATE_VALUE
        elif self.is_next_symbol_O():
            self.state[NEXT_SYMBOL_STATE_INDEX] = X_STATE_VALUE

    def _set_next_constraint(self, index: int) -> None:
        next_subgame = index % 9
        if self.state[81 + next_subgame]:
            self.state[CONSTRAINT_STATE_INDEX] = UNCONSTRAINED_STATE_VALUE
        else:
            self.state[CONSTRAINT_STATE_INDEX] = next_subgame

    def _verify_state(self) -> None:
        self._verify_supergame()
        self._verify_subgames()
        self._verify_constraint()

    def _verify_supergame(self) -> None:
        x_w = self._is_winning_position(symbol=X_STATE_VALUE, subgame=9)
        o_w = self._is_winning_position(symbol=O_STATE_VALUE, subgame=9)
        full = self._is_full(subgame=9)
        if x_w and o_w:
            raise UltimateTicTacToeError("X and O have winning positions on supergame")
        if x_w and not self.is_result_X():
            raise UltimateTicTacToeError("X won supergame, but result is not updated")
        if o_w and not self.is_result_O():
            raise UltimateTicTacToeError("O won supergame, but result is not updated")
        if full and not self.is_result_draw() and not (x_w or o_w):
            raise UltimateTicTacToeError("DRAW on supergame, but result is not updated")

    def _verify_subgames(self) -> None:
        for subgame in range(0, 9):
            x_w = self._is_winning_position(symbol=X_STATE_VALUE, subgame=subgame)
            o_w = self._is_winning_position(symbol=O_STATE_VALUE, subgame=subgame)
            full = self._is_full(subgame=subgame)
            if x_w and o_w:
                raise UltimateTicTacToeError(f"X and O have winning positions on subgame={subgame}")
            if x_w and self.state[81 + subgame] != X_STATE_VALUE:
                raise UltimateTicTacToeError(f"X won subgame={subgame}, but supergame is not updated")
            if o_w and self.state[81 + subgame] != O_STATE_VALUE:
                raise UltimateTicTacToeError(f"O won subgame={subgame}, but supergame is not updated")
            if full and self.state[81 + subgame] != DRAW_STATE_VALUE and not (x_w or o_w):
                raise UltimateTicTacToeError(f"DRAW on subgame={subgame}, but supergame is not updated")

    def _verify_constraint(self) -> None:
        if not (self.is_constrained() or self.is_unconstrained()):
            raise UltimateTicTacToeError(f"invalid constraint={self.constraint}")
        if self.is_constrained() and self.state[81 + self.constraint]:
            raise UltimateTicTacToeError(f"constraint={self.constraint} points to terminated subgame")

    def _verify_action(self, action: Action) -> None:
        illegal_action = f"Illegal {action} - "
        if self.is_next_symbol_X() and not action.is_symbol_X():
            raise UltimateTicTacToeError(illegal_action + "next move belongs to X")
        if self.is_next_symbol_O() and not action.is_symbol_O():
            raise UltimateTicTacToeError(illegal_action + "next move belongs to O")
        if not (0 <= action.index < 81):
            raise UltimateTicTacToeError(illegal_action + "index outside the valid range")
        if self.is_constrained() and self.constraint != action.index // 9:
            raise UltimateTicTacToeError(illegal_action + f"violated constraint={self.constraint}")
        if self.state[81 + action.index // 9]:
            raise UltimateTicTacToeError(illegal_action + "index from terminated subgame")
        if self.state[action.index]:
            raise UltimateTicTacToeError(illegal_action + "index is already taken")

    def __str__(self):
        state_values_map = {
            X_STATE_VALUE: 'X',
            O_STATE_VALUE: 'O',
            DRAW_STATE_VALUE: '=',
            0: '-',
        }
        subgames = [state_values_map[s] for s in self.state[0:81]]
        supergame = [state_values_map[s] for s in self.state[81:90]]
        if not self.is_terminated():
            for legal_index in self.get_legal_indexes():
                subgames[legal_index] = '•'
            if self.is_constrained():
                supergame[self.constraint] = '•'
            elif self.is_unconstrained():
                supergame = ['•' if s == '-' else s for s in supergame]
        sb = lambda l, r: ' '.join(subgames[l : r + 1])
        sp = lambda l, r: ' '.join(supergame[l : r + 1])
        subgames = [
            '    0 1 2   3 4 5   6 7 8',
            '  0 ' + sb(0, 2) + ' │ ' + sb(9, 11) + ' │ ' + sb(18, 20),
            '  1 ' + sb(3, 5) + ' │ ' + sb(12, 14) + ' │ ' + sb(21, 23),
            '  2 ' + sb(6, 8) + ' │ ' + sb(15, 17) + ' │ ' + sb(24, 26),
            '    ' + '—' * 21,
            '  3 ' + sb(27, 29) + ' │ ' + sb(36, 38) + ' │ ' + sb(45, 47),
            '  4 ' + sb(30, 32) + ' │ ' + sb(39, 41) + ' │ ' + sb(48, 50),
            '  5 ' + sb(33, 35) + ' │ ' + sb(42, 44) + ' │ ' + sb(51, 53),
            '    ' + '—' * 21,
            '  6 ' + sb(54, 56) + ' │ ' + sb(63, 65) + ' │ ' + sb(72, 74),
            '  7 ' + sb(57, 59) + ' │ ' + sb(66, 68) + ' │ ' + sb(75, 77),
            '  8 ' + sb(60, 62) + ' │ ' + sb(69, 71) + ' │ ' + sb(78, 80),
        ]
        supergame = [
            '  ' + sp(0, 2),
            '  ' + sp(3, 5),
            '  ' + sp(6, 8),
        ]
        subgames = '\n'.join(subgames)
        supergame = '\n'.join(supergame)
        next_symbol = state_values_map[self.next_symbol]
        constraint = 'None' if self.is_unconstrained() else str(self.constraint)
        result = 'None'
        if self.is_result_X():
            result = 'X_WON'
        elif self.is_result_O():
            result = 'O_WON'
        elif self.is_result_draw():
            result = 'DRAW'
        output = '{cls}(\n'
        output += '  subgames:\n{subgames}\n'
        if not self.is_terminated():
            output += '  next_symbol: {next_symbol}\n'
            output += '  constraint: {constraint}\n'
        output += '  supergame:\n{supergame}\n'
        output += '  result: {result}\n)'
        output = output.format(
            cls=self.__class__.__name__,
            subgames=subgames,
            supergame=supergame,
            next_symbol=next_symbol,
            constraint=constraint,
            result=result,
        )
        return output


class UltimateTicTacToeError(Exception):
    pass
