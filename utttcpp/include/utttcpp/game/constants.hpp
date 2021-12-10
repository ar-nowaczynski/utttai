#ifndef UTTTCPP_GAME_CONSTANTS_HPP_
#define UTTTCPP_GAME_CONSTANTS_HPP_

namespace utttcpp {

// state length:
const int STATE_SIZE = 93;

// state indices:
const int NEXT_SYMBOL_STATE_INDEX = 90;
const int CONSTRAINT_STATE_INDEX = 91;
const int UTTT_RESULT_STATE_INDEX = 92;

// state values:
const unsigned char X_STATE_VALUE = 1;
const unsigned char O_STATE_VALUE = 2;
const unsigned char DRAW_STATE_VALUE = 3;
const unsigned char UNCONSTRAINED_STATE_VALUE = 9;

// row index (0, 1, ... 8) on the 9x9 board from the state index (0, 1, ... 80):
const int ROW_INDEX[81] = {
    0, 0, 0, 1, 1, 1, 2, 2, 2,
    0, 0, 0, 1, 1, 1, 2, 2, 2,
    0, 0, 0, 1, 1, 1, 2, 2, 2,
    3, 3, 3, 4, 4, 4, 5, 5, 5,
    3, 3, 3, 4, 4, 4, 5, 5, 5,
    3, 3, 3, 4, 4, 4, 5, 5, 5,
    6, 6, 6, 7, 7, 7, 8, 8, 8,
    6, 6, 6, 7, 7, 7, 8, 8, 8,
    6, 6, 6, 7, 7, 7, 8, 8, 8,
};

// col index (0, 1, ... 8) on the 9x9 board from the state index (0, 1, ... 80):
const int COL_INDEX[81] = {
    0, 1, 2, 0, 1, 2, 0, 1, 2,
    3, 4, 5, 3, 4, 5, 3, 4, 5,
    6, 7, 8, 6, 7, 8, 6, 7, 8,
    0, 1, 2, 0, 1, 2, 0, 1, 2,
    3, 4, 5, 3, 4, 5, 3, 4, 5,
    6, 7, 8, 6, 7, 8, 6, 7, 8,
    0, 1, 2, 0, 1, 2, 0, 1, 2,
    3, 4, 5, 3, 4, 5, 3, 4, 5,
    6, 7, 8, 6, 7, 8, 6, 7, 8,
};

}  // namespace utttcpp

#endif  // UTTTCPP_GAME_CONSTANTS_HPP_
