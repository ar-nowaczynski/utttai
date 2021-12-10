#ifndef UTTTCPP_SELFPLAY_NEURALMONTECARLOTREESEARCHWORKER_HPP_
#define UTTTCPP_SELFPLAY_NEURALMONTECARLOTREESEARCHWORKER_HPP_

#include <torch/torch.h>

#include <atomic>
#include <chrono>
#include <random>
#include <string>

#include "utttcpp/game/action.hpp"
#include "utttcpp/game/ultimateTicTacToe.hpp"

namespace utttcpp {

struct EvaluatedState {
    unsigned char *state;
    int visitCount;
    double stateValueMean;
};

const std::string serializeEvaluatedState(EvaluatedState *evaluatedState);

struct EvaluatedAction {
    unsigned char symbol;
    int index;
    int visitCount;
    double stateValueMean;
};

const std::string serializeEvaluatedActions(EvaluatedAction **evaluatedActions,
                                            int numEvaluatedActions);

class Node {
  public:
    const UltimateTicTacToe *uttt;
    const Action action;
    double actionProbability;
    Node **childNodes;
    int childNodesLength;
    int visitCount;
    double stateValue;
    double stateValueSum;
    double stateValueMean;

    Node(const UltimateTicTacToe *uttt, const Action action);
    ~Node();

    bool isLeaf() const { return childNodes == nullptr; }
    bool isTerminal() const { return uttt->isTerminated(); }

    void expand();

    EvaluatedState *getEvaluatedState() const;
    EvaluatedAction **getEvaluatedActions() const;

    std::string toString() const;
};

class Tree {
  public:
    Node *root;

    explicit Tree(Node *root);
    ~Tree();

    int getSize() const { return bfsCountNodes(root); }
    int getHeight() const { return dfsMaxDepth(root, 0); }

    void synchronize(const UltimateTicTacToe *uttt);

    std::string toString() const;

  private:
    int bfsCountNodes(Node *node) const;
    int dfsMaxDepth(Node *node, int depth) const;
};

class NeuralMonteCarloTreeSearchWorker {
  public:
    Tree *tree;
    int numSimulations;
    double explorationStrength;
    const int workerId;
    std::atomic_bool *predictionQueryFlag;
    torch::Tensor utttStateTensor;
    torch::Tensor policyLogitsTensor;
    torch::Tensor stateValueTensor;
    std::chrono::milliseconds sleepDuration;
    std::mt19937 *pseudoRandomNumberGenerator;

    NeuralMonteCarloTreeSearchWorker(UltimateTicTacToe *uttt,
                                     int numSimulations,
                                     double explorationStrength,
                                     const int workerId,
                                     std::atomic_bool *predictionQueryFlag,
                                     torch::Tensor utttStateTensor,
                                     torch::Tensor policyLogitsTensor,
                                     torch::Tensor stateValueTensor,
                                     std::chrono::milliseconds sleepDuration,
                                     std::mt19937 *pseudoRandomNumberGenerator);
    ~NeuralMonteCarloTreeSearchWorker();

    void run();
    EvaluatedState *getEvaluatedState() const { return tree->root->getEvaluatedState(); }
    EvaluatedAction **getEvaluatedActions() const { return tree->root->getEvaluatedActions(); }
    int getNumEvaluatedActions() const { return tree->root->childNodesLength; }
    Action selectAction(EvaluatedAction **evaluatedActions,
                        int numEvaluatedActions,
                        const std::string selectionMethod) const;
    void synchronize(const UltimateTicTacToe *uttt) { tree->synchronize(uttt); }

    std::string toString() const;

  private:
    int selectedPathLength;
    Node *selectedPath[128];
    int topScoreIndices[128];
    int fillLegalIndexes[128];
    void simulate();
    void selectLeafNode();
    double Q(const Node *node) const;
    double U(const Node *node, const int parentVisitCount) const;
    void evaluate(Node *node, const double softmaxTemperature);
    void backprop(const double stateValue);
    void fillUtttStateTensor(const UltimateTicTacToe *uttt);
};

}  // namespace utttcpp

#endif  // UTTTCPP_SELFPLAY_NEURALMONTECARLOTREESEARCHWORKER_HPP_
