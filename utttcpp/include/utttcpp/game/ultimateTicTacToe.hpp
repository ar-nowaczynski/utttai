#ifndef UTTTCPP_GAME_ULTIMATETICTACTOE_HPP_
#define UTTTCPP_GAME_ULTIMATETICTACTOE_HPP_

#include <string>
#include <vector>

#include "utttcpp/game/action.hpp"
#include "utttcpp/game/constants.hpp"

namespace utttcpp {

class UltimateTicTacToe {
  public:
    UltimateTicTacToe();
    UltimateTicTacToe *clone() const;
    ~UltimateTicTacToe();

    const unsigned char *getState() const { return state; }
    void setState(const unsigned char *newState);
    bool isEqualTo(const UltimateTicTacToe *queryUttt) const;

    void execute(const Action &action);
    std::vector<Action> getLegalActions() const;
    int findLegalIndexes(int *array) const;

    unsigned char getNextSymbol() const { return state[NEXT_SYMBOL_STATE_INDEX]; }
    unsigned char getConstraint() const { return state[CONSTRAINT_STATE_INDEX]; }
    unsigned char getResult() const { return state[UTTT_RESULT_STATE_INDEX]; }
    bool isNextSymbolX() const { return getNextSymbol() == X_STATE_VALUE; }
    bool isNextSymbolO() const { return getNextSymbol() == O_STATE_VALUE; }
    bool isConstrained() const { return getConstraint() < 9; }
    bool isUnconstrained() const { return getConstraint() == UNCONSTRAINED_STATE_VALUE; }
    bool isTerminated() const { return getResult() != 0; }
    bool isResultX() const { return getResult() == X_STATE_VALUE; }
    bool isResultO() const { return getResult() == O_STATE_VALUE; }
    bool isResultDraw() const { return getResult() == DRAW_STATE_VALUE; }

    std::string toString() const;

  private:
    unsigned char *state;

    int findLegalIndexesNoConstraint(int *array) const;
    int findLegalIndexesWithConstraint(int *array) const;
    bool isWinningPosition(const unsigned char symbol, const int subgame) const;
    bool isFull(const int subgame) const;
    void updateSupergameResult(const unsigned char symbol, const int index);
    void toggleNextSymbol();
    void setNextConstraint(const int index);
};

}  // namespace utttcpp

#endif  // UTTTCPP_GAME_ULTIMATETICTACTOE_HPP_
