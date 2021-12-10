from utttpy.game.constants import X_STATE_VALUE, O_STATE_VALUE


class Action:

    def __init__(self, symbol: int, index: int):
        self.symbol = symbol  # X_STATE_VALUE or O_STATE_VALUE
        self.index = index  # int from 0 to 80

    def is_symbol_X(self) -> bool:
        return self.symbol == X_STATE_VALUE

    def is_symbol_O(self) -> bool:
        return self.symbol == O_STATE_VALUE

    def __str__(self):
        output = '{cls}(symbol={symbol}, index={index})'
        output = output.format(
            cls=self.__class__.__name__,
            symbol={X_STATE_VALUE: 'X', O_STATE_VALUE: 'O'}[self.symbol],
            index=self.index,
        )
        return output
