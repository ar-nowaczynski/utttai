#include <cstdint>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>

#include "utttcpp/game/action.hpp"
#include "utttcpp/game/constants.hpp"
#include "utttcpp/game/ultimateTicTacToe.hpp"
#include "utttcpp/helpers/prngMersenneTwister.hpp"
#include "utttcpp/selfplay/monteCarloTreeSearch.hpp"

using utttcpp::Action;

using utttcpp::STATE_SIZE;

using utttcpp::UltimateTicTacToe;

using utttcpp::InitializeMersenneTwisterPRNG;

using utttcpp::MonteCarloTreeSearch;
using utttcpp::EvaluatedState;
using utttcpp::serializeEvaluatedState;
using utttcpp::EvaluatedAction;
using utttcpp::serializeEvaluatedActions;

int parseInt(char *argv) {
    int number;
    std::stringstream stream(argv);
    stream >> number;
    return number;
}

double parseDouble(char *argv) {
    double number;
    std::stringstream stream(argv);
    stream >> number;
    return number;
}

std::string parseString(char *argv) {
    return std::string(argv);
}

uint32_t parseUInt32(char *argv) {
    uint32_t number;
    std::stringstream stream(argv);
    stream >> number;
    return number;
}

UltimateTicTacToe *parseUttt(char *argv) {
    unsigned char *state = new unsigned char[STATE_SIZE];
    std::string utttState = parseString(argv);
    int stateValue;
    for (int i = 0; i < STATE_SIZE; i++) {
        stateValue = utttState[i] - '0';
        if (stateValue < 0 || stateValue > 9) {
            throw std::runtime_error("invalid state value");
        }
        state[i] = (unsigned char)stateValue;
    }
    UltimateTicTacToe *uttt = new UltimateTicTacToe();
    uttt->setState(state);
    delete[] state;
    return uttt;
}

int main(int argc, char *argv[]) {
    if (argc != 6) {
        throw std::runtime_error(
            "required arguments: "
            "utttState, numSimulations, explorationStrength, prngSeed, outputPath");
    }

    std::cout << "utttState: " << argv[1] << std::endl;
    UltimateTicTacToe *uttt = parseUttt(argv[1]);
    std::cout << uttt->toString() << std::endl;

    const int numSimulations = parseInt(argv[2]);
    std::cout << "numSimulations: " << numSimulations << std::endl;

    const double explorationStrength = parseDouble(argv[3]);
    std::cout << "explorationStrength: " << explorationStrength << std::endl;

    const uint32_t prngSeed = parseUInt32(argv[4]);
    std::cout << "prngSeed: " << prngSeed << std::endl;
    InitializeMersenneTwisterPRNG(prngSeed);

    const std::string outputPath = parseString(argv[5]);
    std::cout << "outputPath: " << outputPath << std::endl;

    std::string evaluationsString = "";

    MonteCarloTreeSearch *mcts =
        new MonteCarloTreeSearch(uttt->clone(), numSimulations, explorationStrength);

    while (!uttt->isTerminated()) {
        mcts->run();
        // std::cout << mcts->toString() << std::endl;

        EvaluatedState *evaluatedState = mcts->getEvaluatedState();
        std::string evaluatedStateString = serializeEvaluatedState(evaluatedState);

        EvaluatedAction **evaluatedActions = mcts->getEvaluatedActions();
        int numEvaluatedActions = mcts->getNumEvaluatedActions();
        std::string evaluatedActionsString =
            serializeEvaluatedActions(evaluatedActions, numEvaluatedActions);

        std::string evaluationString = evaluatedStateString + " " + evaluatedActionsString;
        // std::cout << evaluationString << std::endl;
        evaluationsString += evaluationString + "\n";

        Action selectedAction = mcts->selectAction(evaluatedActions, numEvaluatedActions, "sample");
        std::cout << "selected " << selectedAction.toString() << std::endl;
        uttt->execute(selectedAction);
        mcts->synchronize(uttt);

        for (int i = 0; i < numEvaluatedActions; i++) {
            delete evaluatedActions[i];
        }
        delete[] evaluatedActions;
        delete[] evaluatedState->state;
        delete evaluatedState;
    }

    std::cout << mcts->toString() << std::endl;

    std::ofstream ofs(outputPath);
    ofs << evaluationsString;
    ofs.close();

    std::cout << "evaluations saved to " << outputPath << " successfully!" << std::endl;

    delete mcts;
    delete uttt;

    return 0;
}
