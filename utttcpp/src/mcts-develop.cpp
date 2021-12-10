#include <cstdint>
#include <iostream>
#include <vector>

#include "utttcpp/game/action.hpp"
#include "utttcpp/game/constants.hpp"
#include "utttcpp/game/ultimateTicTacToe.hpp"
#include "utttcpp/helpers/doubleToString.hpp"
#include "utttcpp/helpers/getTimestamp.hpp"
#include "utttcpp/helpers/prngMersenneTwister.hpp"
#include "utttcpp/selfplay/monteCarloTreeSearch.hpp"

using utttcpp::Action;

using utttcpp::STATE_SIZE;
using utttcpp::NEXT_SYMBOL_STATE_INDEX;
using utttcpp::CONSTRAINT_STATE_INDEX;
using utttcpp::UTTT_RESULT_STATE_INDEX;
using utttcpp::X_STATE_VALUE;
using utttcpp::O_STATE_VALUE;
using utttcpp::DRAW_STATE_VALUE;
using utttcpp::UNCONSTRAINED_STATE_VALUE;

using utttcpp::UltimateTicTacToe;

using utttcpp::doubleToString;

using utttcpp::getTimestamp;

using utttcpp::InitializeMersenneTwisterPRNG;
using utttcpp::randInt;
using utttcpp::randDouble;

using utttcpp::MonteCarloTreeSearch;
using utttcpp::Tree;
using utttcpp::Node;
using utttcpp::EvaluatedState;
using utttcpp::serializeEvaluatedState;
using utttcpp::EvaluatedAction;
using utttcpp::serializeEvaluatedActions;


void testRandInt(int a, int b, int n) {
    std::cout << "testRandInt:" << std::endl;
    for (int i = 0; i < n; i++) {
        int intValue = randInt(a, b);
        std::cout << "randInt = " << intValue << std::endl;
    }
}

void testRandDouble(double a, double b, int n) {
    std::cout << "testRandDouble:" << std::endl;
    for (int i = 0; i < n; i++) {
        double doubleValue = randDouble(a, b);
        std::cout << "randDouble = " << doubleValue << std::endl;
    }
}

void testDoubleToString() {
    std::cout << "testDoubleToString:" << std::endl;
    std::cout << doubleToString(1.0 / 2.0, 12) << std::endl;
    std::cout << doubleToString(1.0 / 3.0, 12) << std::endl;
    std::cout << doubleToString(1.0 / 4.0, 12) << std::endl;
    std::cout << doubleToString(1.0 / 6.0, 12) << std::endl;
    std::cout << doubleToString(1.0 / 7.0, 12) << std::endl;
    std::cout << doubleToString(1.0 / 13.0, 12) << std::endl;
}

void testGetTimestamp() {
    std::cout << "testGetTimestamp:" << std::endl;
    const uint64_t timestamp = getTimestamp();
    std::cout << timestamp << std::endl;
    std::cout << (__uint32_t)timestamp << std::endl;
}

void testConstants() {
    std::cout << "testConstants:" << std::endl;
    std::cout << "STATE_SIZE = " << STATE_SIZE << std::endl;
    std::cout << "NEXT_SYMBOL_STATE_INDEX = " << NEXT_SYMBOL_STATE_INDEX << std::endl;
    std::cout << "CONSTRAINT_STATE_INDEX = " << CONSTRAINT_STATE_INDEX << std::endl;
    std::cout << "UTTT_RESULT_STATE_INDEX = " << UTTT_RESULT_STATE_INDEX << std::endl;
    std::cout << "X_STATE_VALUE = " << static_cast<int>(X_STATE_VALUE) << std::endl;
    std::cout << "O_STATE_VALUE = " << static_cast<int>(O_STATE_VALUE) << std::endl;
    std::cout << "DRAW_STATE_VALUE = " << static_cast<int>(DRAW_STATE_VALUE) << std::endl;
    std::cout << "UNCONSTRAINED_STATE_VALUE = " << static_cast<int>(UNCONSTRAINED_STATE_VALUE)
              << std::endl;
}

void testAction() {
    std::cout << "testAction:" << std::endl;
    Action action1 = Action(X_STATE_VALUE, 42);
    Action action2 = Action(O_STATE_VALUE, 59);
    std::cout << "action1 = " << action1.toString() << std::endl;
    std::cout << "action2 = " << action2.toString() << std::endl;
}

void printLegalActions(const std::vector<Action> &legalActions) {
    std::cout << "legalActions(" << legalActions.size() << ") = [" << std::endl;
    for (std::vector<Action>::size_type i = 0; i != legalActions.size(); i++) {
        std::cout << "  " << legalActions[i].toString() << std::endl;
    }
    std::cout << "]" << std::endl;
}

void testUltimateTicTacToe() {
    std::cout << "testUltimateTicTacToe:" << std::endl;
    UltimateTicTacToe *uttt = new UltimateTicTacToe();
    std::cout << uttt->toString() << std::endl;
    while (!uttt->isTerminated()) {
        std::vector<Action> legalActions = uttt->getLegalActions();
        printLegalActions(legalActions);
        Action action = legalActions[randInt(0, legalActions.size() - 1)];
        std::cout << "selectedAction: " << action.toString() << std::endl;
        uttt->execute(action);
        std::cout << uttt->toString() << std::endl;
    }
    delete uttt;
}

void testNode() {
    std::cout << "testNode:" << std::endl;
    UltimateTicTacToe *uttt = new UltimateTicTacToe();
    Node *node1 = new Node(uttt->clone(), Action());
    Action action = Action(X_STATE_VALUE, 40);
    uttt->execute(action);
    Node *node2 = new Node(uttt, action);
    std::cout << node1->toString() << std::endl;
    std::cout << node2->toString() << std::endl;
    delete node2;
    delete node1;
}

void testNodeExpand() {
    std::cout << "testNodeExpand:" << std::endl;
    Node *node = new Node(new UltimateTicTacToe(), Action());
    std::cout << node->toString() << std::endl;
    node->expand();
    std::cout << node->toString() << std::endl;
    delete node;
}

void testNodeEvaluatedState() {
    std::cout << "testNodeEvaluatedState:" << std::endl;
    Node *node = new Node(new UltimateTicTacToe(), Action());
    EvaluatedState *evaluatedState = node->getEvaluatedState();
    std::cout << serializeEvaluatedState(evaluatedState) << std::endl;
    delete[] evaluatedState->state;
    delete evaluatedState;
    delete node;
}

void testNodeEvaluatedActions() {
    std::cout << "testNodeEvaluatedActions:" << std::endl;
    Node *node = new Node(new UltimateTicTacToe(), Action());
    node->expand();
    EvaluatedAction **evaluatedActions = node->getEvaluatedActions();
    int numEvaluatedActions = node->childNodesLength;
    std::cout << serializeEvaluatedActions(evaluatedActions, numEvaluatedActions) << std::endl;
    for (int i = 0; i < numEvaluatedActions; i++) {
        delete evaluatedActions[i];
    }
    delete[] evaluatedActions;
    delete node;
}

void testTree() {
    std::cout << "testTree:" << std::endl;
    Tree *tree = new Tree(new Node(new UltimateTicTacToe(), Action()));
    std::cout << tree->toString() << std::endl;
    delete tree;
}

void testMonteCarloTreeSearch() {
    std::cout << "testMonteCarloTreeSearch:" << std::endl;
    UltimateTicTacToe *uttt = new UltimateTicTacToe();
    MonteCarloTreeSearch *mcts = new MonteCarloTreeSearch(uttt->clone(), 10000, 2.0);
    while (!uttt->isTerminated()) {
        std::cout << "mcts->run()" << std::endl;
        mcts->run();
        std::cout << mcts->toString() << std::endl;

        EvaluatedState *evaluatedState = mcts->getEvaluatedState();
        std::cout << serializeEvaluatedState(evaluatedState) << std::endl;

        EvaluatedAction **evaluatedActions = mcts->getEvaluatedActions();
        int numEvaluatedActions = mcts->getNumEvaluatedActions();
        std::cout << serializeEvaluatedActions(evaluatedActions, numEvaluatedActions) << std::endl;

        Action selectedAction = mcts->selectAction(evaluatedActions, numEvaluatedActions, "argmax");
        std::cout << "selected " << selectedAction.toString() << std::endl;
        uttt->execute(selectedAction);
        mcts->synchronize(uttt);
        std::cout << mcts->toString() << std::endl;

        for (int i = 0; i < numEvaluatedActions; i++) {
            delete evaluatedActions[i];
        }
        delete[] evaluatedActions;
        delete[] evaluatedState->state;
        delete evaluatedState;
    }
    delete mcts;
    delete uttt;
}

int main() {
    InitializeMersenneTwisterPRNG(2021);
    InitializeMersenneTwisterPRNG((__uint32_t)time(NULL));  // via seconds
    InitializeMersenneTwisterPRNG((__uint32_t)(getTimestamp() / 1000));  // via milliseconds
    InitializeMersenneTwisterPRNG((__uint32_t)getTimestamp());  // via microseconds
    testRandInt(0, 80, 5);
    testRandDouble(0, 1, 5);
    testDoubleToString();
    testGetTimestamp();
    testConstants();
    testAction();
    testUltimateTicTacToe();
    testNode();
    testNodeExpand();
    testNodeEvaluatedState();
    testNodeEvaluatedActions();
    testTree();
    testMonteCarloTreeSearch();
    return 0;
}
