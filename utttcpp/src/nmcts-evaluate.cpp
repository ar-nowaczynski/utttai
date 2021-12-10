#include <torch/script.h>
#include <torch/torch.h>

#include <cstdint>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>

#include "utttcpp/game/constants.hpp"
#include "utttcpp/game/ultimateTicTacToe.hpp"
#include "utttcpp/helpers/prngMersenneTwister.hpp"
#include "utttcpp/selfplay/neuralMonteCarloTreeSearch.hpp"

using utttcpp::X_STATE_VALUE;
using utttcpp::O_STATE_VALUE;
using utttcpp::STATE_SIZE;
using utttcpp::ROW_INDEX;
using utttcpp::COL_INDEX;

using utttcpp::UltimateTicTacToe;

using utttcpp::InitializeMersenneTwisterPRNG;

using utttcpp::NeuralMonteCarloTreeSearch;
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
    if (argc != 7) {
        throw std::runtime_error(
            "required arguments: "
            "policyValueNetPath, utttState, "
            "numSimulations, explorationStrength, prngSeed, outputPath");
    }

    const std::string policyValueNetPath = parseString(argv[1]);
    std::cout << "policyValueNetPath: " << policyValueNetPath << std::endl;

    std::cout << "utttState: " << argv[2] << std::endl;
    UltimateTicTacToe *uttt = parseUttt(argv[2]);
    std::cout << uttt->toString() << std::endl;

    const int numSimulations = parseInt(argv[3]);
    std::cout << "numSimulations: " << numSimulations << std::endl;

    const double explorationStrength = parseDouble(argv[4]);
    std::cout << "explorationStrength: " << explorationStrength << std::endl;

    const uint32_t prngSeed = parseUInt32(argv[5]);
    std::cout << "prngSeed: " << prngSeed << std::endl;
    InitializeMersenneTwisterPRNG(prngSeed);

    const std::string outputPath = parseString(argv[6]);
    std::cout << "outputPath: " << outputPath << std::endl;

    torch::jit::script::Module policyValueNet;
    policyValueNet = torch::jit::load(policyValueNetPath);
    policyValueNet.to(torch::kCUDA);
    policyValueNet.eval();

    NeuralMonteCarloTreeSearch *nmcts =
        new NeuralMonteCarloTreeSearch(uttt, numSimulations, explorationStrength, policyValueNet);
    nmcts->run();
    std::cout << nmcts->toString() << std::endl;

    EvaluatedState *evaluatedState = nmcts->getEvaluatedState();
    std::string evaluatedStateString = serializeEvaluatedState(evaluatedState);

    EvaluatedAction **evaluatedActions = nmcts->getEvaluatedActions();
    int numEvaluatedActions = nmcts->getNumEvaluatedActions();
    std::string evaluatedActionsString =
        serializeEvaluatedActions(evaluatedActions, numEvaluatedActions);

    std::string evaluationString = evaluatedStateString + " " + evaluatedActionsString;
    std::cout << evaluationString << std::endl;

    std::ofstream ofs(outputPath);
    ofs << evaluationString << std::endl;
    ofs.close();

    std::cout << "evaluation saved to " << outputPath << " successfully!" << std::endl;

    for (int i = 0; i < numEvaluatedActions; i++) {
        delete evaluatedActions[i];
    }
    delete[] evaluatedActions;
    delete[] evaluatedState->state;
    delete evaluatedState;
    delete nmcts;

    return 0;
}
