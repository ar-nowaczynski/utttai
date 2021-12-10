#include "utttcpp/game/ultimateTicTacToe.hpp"

namespace utttcpp {

UltimateTicTacToe::UltimateTicTacToe() {
    state = new unsigned char[STATE_SIZE]();
    state[NEXT_SYMBOL_STATE_INDEX] = X_STATE_VALUE;
    state[CONSTRAINT_STATE_INDEX] = UNCONSTRAINED_STATE_VALUE;
}

UltimateTicTacToe *UltimateTicTacToe::clone() const {
    UltimateTicTacToe *uttt = new UltimateTicTacToe();
    uttt->setState(getState());
    return uttt;
}

UltimateTicTacToe::~UltimateTicTacToe() { delete[] state; }

void UltimateTicTacToe::setState(const unsigned char *newState) {
    for (int i = 0; i < STATE_SIZE; i++) {
        state[i] = newState[i];
    }
}

bool UltimateTicTacToe::isEqualTo(const UltimateTicTacToe *queryUttt) const {
    const unsigned char *queryState = queryUttt->getState();
    for (int i = 0; i < STATE_SIZE; i++) {
        if (state[i] != queryState[i]) {
            return false;
        }
    }
    return true;
}

void UltimateTicTacToe::execute(const Action &action) {
    state[action.index] = action.symbol;
    updateSupergameResult(action.symbol, action.index);
    toggleNextSymbol();
    setNextConstraint(action.index);
}

std::vector<Action> UltimateTicTacToe::getLegalActions() const {
    if (isTerminated()) {
        return std::vector<Action>(0);
    }
    int *legalIndexes;
    int numLegalIndexes;
    if (isUnconstrained()) {
        legalIndexes = new int[81];
        numLegalIndexes = findLegalIndexesNoConstraint(legalIndexes);
    } else {
        legalIndexes = new int[9];
        numLegalIndexes = findLegalIndexesWithConstraint(legalIndexes);
    }
    std::vector<Action> legalActions(numLegalIndexes);
    for (int i = 0; i < numLegalIndexes; i++) {
        legalActions[i] = Action(getNextSymbol(), legalIndexes[i]);
    }
    delete[] legalIndexes;
    return legalActions;
}

int UltimateTicTacToe::findLegalIndexes(int *array) const {
    if (isTerminated()) {
        return 0;
    }
    if (isUnconstrained()) {
        return findLegalIndexesNoConstraint(array);
    } else {
        return findLegalIndexesWithConstraint(array);
    }
}

std::string UltimateTicTacToe::toString() const {
    std::string utttString = "UltimateTicTacToe(\n";
    auto symbolToString = [](unsigned char s) {
        if (s == X_STATE_VALUE) {
            return "X";
        } else if (s == O_STATE_VALUE) {
            return "O";
        } else if (s == DRAW_STATE_VALUE) {
            return "=";
        } else if (s == 0) {
            return "-";
        }
        return "?";
    };
    std::string subgames[81];
    for (int i = 0; i < 81; i++) {
        subgames[i] = symbolToString(state[i]);
    }
    std::string supergame[9];
    for (int i = 0; i < 9; i++) {
        supergame[i] = symbolToString(state[81 + i]);
    }
    if (!isTerminated()) {
        int *legalIndexes = new int[81];
        int numLegalIndexes = findLegalIndexes(legalIndexes);
        for (int i = 0; i < numLegalIndexes; i++) {
            subgames[legalIndexes[i]] = "•";
        }
        if (isConstrained()) {
            supergame[getConstraint()] = "•";

        } else if (isUnconstrained()) {
            for (int i = 0; i < 9; i++) {
                if (supergame[i] == "-") {
                    supergame[i] = "•";
                }
            }
        }
        delete[] legalIndexes;
    }
    utttString += "  subgames:\n";
    utttString += "    0 1 2   3 4 5   6 7 8\n";
    utttString += "  0 " + subgames[0] + " " + subgames[1] + " " + subgames[2] + " │ ";
    utttString += subgames[9] + " " + subgames[10] + " " + subgames[11] + " │ ";
    utttString += subgames[18] + " " + subgames[19] + " " + subgames[20] + "\n";
    utttString += "  1 " + subgames[3] + " " + subgames[4] + " " + subgames[5] + " │ ";
    utttString += subgames[12] + " " + subgames[13] + " " + subgames[14] + " │ ";
    utttString += subgames[21] + " " + subgames[22] + " " + subgames[23] + "\n";
    utttString += "  2 " + subgames[6] + " " + subgames[7] + " " + subgames[8] + " │ ";
    utttString += subgames[15] + " " + subgames[16] + " " + subgames[17] + " │ ";
    utttString += subgames[24] + " " + subgames[25] + " " + subgames[26] + "\n";
    utttString += "    —————————————————————\n";
    utttString += "  3 " + subgames[27] + " " + subgames[28] + " " + subgames[29] + " │ ";
    utttString += subgames[36] + " " + subgames[37] + " " + subgames[38] + " │ ";
    utttString += subgames[45] + " " + subgames[46] + " " + subgames[47] + "\n";
    utttString += "  4 " + subgames[30] + " " + subgames[31] + " " + subgames[32] + " │ ";
    utttString += subgames[39] + " " + subgames[40] + " " + subgames[41] + " │ ";
    utttString += subgames[48] + " " + subgames[49] + " " + subgames[50] + "\n";
    utttString += "  5 " + subgames[33] + " " + subgames[34] + " " + subgames[35] + " │ ";
    utttString += subgames[42] + " " + subgames[43] + " " + subgames[44] + " │ ";
    utttString += subgames[51] + " " + subgames[52] + " " + subgames[53] + "\n";
    utttString += "    —————————————————————\n";
    utttString += "  6 " + subgames[54] + " " + subgames[55] + " " + subgames[56] + " │ ";
    utttString += subgames[63] + " " + subgames[64] + " " + subgames[65] + " │ ";
    utttString += subgames[72] + " " + subgames[73] + " " + subgames[74] + "\n";
    utttString += "  7 " + subgames[57] + " " + subgames[58] + " " + subgames[59] + " │ ";
    utttString += subgames[66] + " " + subgames[67] + " " + subgames[68] + " │ ";
    utttString += subgames[75] + " " + subgames[76] + " " + subgames[77] + "\n";
    utttString += "  8 " + subgames[60] + " " + subgames[61] + " " + subgames[62] + " │ ";
    utttString += subgames[69] + " " + subgames[70] + " " + subgames[71] + " │ ";
    utttString += subgames[78] + " " + subgames[79] + " " + subgames[80] + "\n";
    if (!isTerminated()) {
        std::string nextSymbol = symbolToString(getNextSymbol());
        utttString += "  next_symbol: " + nextSymbol + "\n";
        std::string constraint = isUnconstrained() ? "None" : std::to_string(getConstraint());
        utttString += "  constraint: " + constraint + "\n";
    }
    utttString += "  supergame:\n";
    utttString += "  " + supergame[0] + " " + supergame[1] + " " + supergame[2] + "\n";
    utttString += "  " + supergame[3] + " " + supergame[4] + " " + supergame[5] + "\n";
    utttString += "  " + supergame[6] + " " + supergame[7] + " " + supergame[8] + "\n";
    std::string result = "None";
    if (isResultX()) {
        result = "X_WON";
    } else if (isResultO()) {
        result = "O_WON";
    } else if (isResultDraw()) {
        result = "DRAW";
    }
    utttString += "  result: " + result + "\n";
    utttString += ")";
    return utttString;
}

int UltimateTicTacToe::findLegalIndexesNoConstraint(int *array) const {
    int i = 0;
    for (int subgame = 0; subgame < 9; subgame++) {
        if (state[81 + subgame] == 0) {
            const int offset = subgame * 9;
            for (int j = 0; j < 9; j++) {
                if (state[offset + j] == 0) {
                    array[i++] = offset + j;
                }
            }
        }
    }
    return i;
}

int UltimateTicTacToe::findLegalIndexesWithConstraint(int *array) const {
    int i = 0;
    const int offset = getConstraint() * 9;
    for (int j = 0; j < 9; j++) {
        if (state[offset + j] == 0) {
            array[i++] = offset + j;
        }
    }
    return i;
}

bool UltimateTicTacToe::isWinningPosition(const unsigned char symbol, const int subgame) const {
    const int offset = subgame * 9;
    return (((symbol == state[offset + 4]) &&
             ((symbol == state[offset + 0] && symbol == state[offset + 8]) ||
              (symbol == state[offset + 2] && symbol == state[offset + 6]) ||
              (symbol == state[offset + 1] && symbol == state[offset + 7]) ||
              (symbol == state[offset + 3] && symbol == state[offset + 5]))) ||
            ((symbol == state[offset + 0]) &&
             ((symbol == state[offset + 1] && symbol == state[offset + 2]) ||
              (symbol == state[offset + 3] && symbol == state[offset + 6]))) ||
            ((symbol == state[offset + 8]) &&
             ((symbol == state[offset + 2] && symbol == state[offset + 5]) ||
              (symbol == state[offset + 6] && symbol == state[offset + 7]))));
}

bool UltimateTicTacToe::isFull(const int subgame) const {
    const int offset = subgame * 9;
    for (int i = offset; i < offset + 9; i++) {
        if (state[i] == 0) {
            return false;
        }
    }
    return true;
}

void UltimateTicTacToe::updateSupergameResult(const unsigned char symbol, const int index) {
    bool subgameUpdated = false;
    const int subgame = index / 9;
    if (isWinningPosition(symbol, subgame)) {
        state[81 + subgame] = symbol;
        subgameUpdated = true;
    } else if (isFull(subgame)) {
        state[81 + subgame] = DRAW_STATE_VALUE;
        subgameUpdated = true;
    }
    if (subgameUpdated) {
        if (isWinningPosition(symbol, 9)) {
            state[UTTT_RESULT_STATE_INDEX] = symbol;
        } else if (isFull(9)) {
            state[UTTT_RESULT_STATE_INDEX] = DRAW_STATE_VALUE;
        }
    }
}

void UltimateTicTacToe::toggleNextSymbol() {
    if (isNextSymbolX()) {
        state[NEXT_SYMBOL_STATE_INDEX] = O_STATE_VALUE;
    } else if (isNextSymbolO()) {
        state[NEXT_SYMBOL_STATE_INDEX] = X_STATE_VALUE;
    }
}

void UltimateTicTacToe::setNextConstraint(const int index) {
    const int nextSubgame = index % 9;
    if (state[81 + nextSubgame]) {
        state[CONSTRAINT_STATE_INDEX] = UNCONSTRAINED_STATE_VALUE;
    } else {
        state[CONSTRAINT_STATE_INDEX] = (unsigned char)nextSubgame;
    }
}

}  // namespace utttcpp
