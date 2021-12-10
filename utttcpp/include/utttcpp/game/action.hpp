#ifndef UTTTCPP_GAME_ACTION_HPP_
#define UTTTCPP_GAME_ACTION_HPP_

#include <string>

#include "utttcpp/game/constants.hpp"

namespace utttcpp {

class Action {
  public:
    unsigned char symbol;
    int index;

    Action();
    Action(unsigned char symbol, int index);
    ~Action();

    bool isSymbolX() const { return symbol == X_STATE_VALUE; }
    bool isSymbolO() const { return symbol == O_STATE_VALUE; }

    std::string toString() const;
};

}  // namespace utttcpp

#endif  // UTTTCPP_GAME_ACTION_HPP_
