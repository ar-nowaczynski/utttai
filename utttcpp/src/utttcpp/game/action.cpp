#include "utttcpp/game/action.hpp"

namespace utttcpp {

Action::Action() {
    symbol = 0;
    index = -1;
}
Action::Action(unsigned char symbol, int index) : symbol(symbol), index(index) {}

Action::~Action() {}

std::string Action::toString() const {
    std::string symbolString = "None";
    if (isSymbolX()) {
        symbolString = "X";
    } else if (isSymbolO()) {
        symbolString = "O";
    }
    std::string indexString = "None";
    if (index != -1) {
        indexString = std::to_string(index);
    }
    std::string actionString = ("Action(symbol=" + symbolString + ", index=" + indexString + ")");
    return actionString;
}

}  // namespace utttcpp
