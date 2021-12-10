#include "utttcpp/selfplay/neuralMonteCarloTreeSearchWorker.hpp"

#include <algorithm>
#include <cmath>
#include <deque>
#include <stdexcept>
#include <thread>

#include "utttcpp/game/constants.hpp"
#include "utttcpp/helpers/doubleToString.hpp"

namespace utttcpp {

const std::string serializeEvaluatedState(EvaluatedState *evaluatedState) {
    std::string serializedEvaluatedState = "evaluatedState{";
    for (int i = 0; i < STATE_SIZE; i++) {
        serializedEvaluatedState += std::to_string(static_cast<int>(evaluatedState->state[i]));
    }
    serializedEvaluatedState += " ";
    serializedEvaluatedState += std::to_string(evaluatedState->visitCount);
    serializedEvaluatedState += " ";
    serializedEvaluatedState += doubleToString(evaluatedState->stateValueMean, 6);
    serializedEvaluatedState += "}";
    return serializedEvaluatedState;
}

const std::string serializeEvaluatedActions(EvaluatedAction **evaluatedActions,
                                            int numEvaluatedActions) {
    std::string serializedEvaluatedActions = "evaluatedActions{";
    for (int i = 0; i < numEvaluatedActions; i++) {
        if (i > 0) {
            serializedEvaluatedActions += ",";
        }
        serializedEvaluatedActions += std::to_string(static_cast<int>(evaluatedActions[i]->symbol));
        serializedEvaluatedActions += " ";
        serializedEvaluatedActions += std::to_string(evaluatedActions[i]->index);
        serializedEvaluatedActions += " ";
        serializedEvaluatedActions += std::to_string(evaluatedActions[i]->visitCount);
        serializedEvaluatedActions += " ";
        serializedEvaluatedActions += doubleToString(evaluatedActions[i]->stateValueMean, 6);
    }
    serializedEvaluatedActions += "}";
    return serializedEvaluatedActions;
}

Node::Node(const UltimateTicTacToe *uttt, const Action action) : uttt(uttt), action(action) {
    actionProbability = 0.0;
    childNodes = nullptr;
    childNodesLength = 0;
    visitCount = 0;
    stateValue = 0.0;
    stateValueSum = 0.0;
    stateValueMean = 0.0;
}

Node::~Node() {
    if (childNodes != nullptr) {
        for (int i = 0; i < childNodesLength; i++) {
            delete childNodes[i];
        }
        delete[] childNodes;
    }
    delete uttt;
}

void Node::expand() {
    if (!isLeaf()) {
        return;
    }
    if (isTerminal()) {
        return;
    }
    std::vector<Action> legalActions = uttt->getLegalActions();
    childNodesLength = legalActions.size();
    childNodes = new Node *[childNodesLength];
    for (int i = 0; i < childNodesLength; i++) {
        Action childAction = legalActions[i];
        UltimateTicTacToe *childUttt = uttt->clone();
        childUttt->execute(childAction);
        Node *childNode = new Node(childUttt, childAction);
        childNodes[i] = childNode;
    }
}

EvaluatedState *Node::getEvaluatedState() const {
    EvaluatedState *evaluatedState = new EvaluatedState{
        new unsigned char[STATE_SIZE],
        visitCount,
        stateValueMean,
    };
    const unsigned char *utttState = uttt->getState();
    for (int i = 0; i < STATE_SIZE; i++) {
        evaluatedState->state[i] = utttState[i];
    }
    return evaluatedState;
}

EvaluatedAction **Node::getEvaluatedActions() const {
    if (isLeaf()) {
        throw std::runtime_error("cannot get evaluated actions from a leaf node");
    }
    if (isTerminal()) {
        throw std::runtime_error("cannot get evaluated actions from a terminal node");
    }
    EvaluatedAction **evaluatedActions = new EvaluatedAction *[childNodesLength];
    for (int i = 0; i < childNodesLength; i++) {
        EvaluatedAction *evaluatedAction = new EvaluatedAction{
            childNodes[i]->action.symbol,
            childNodes[i]->action.index,
            childNodes[i]->visitCount,
            -childNodes[i]->stateValueMean,
        };
        evaluatedActions[i] = evaluatedAction;
    }
    return evaluatedActions;
}

std::string Node::toString() const {
    std::string nodeString = "Node(\n";
    nodeString += "  action: " + action.toString() + "\n";
    nodeString += "  action_probability: " + std::to_string(actionProbability) + "\n";
    nodeString += "  uttt: ";
    std::string utttString = uttt->toString();
    for (std::string::size_type i = 0, j = 0; j < utttString.length(); j++) {
        if (utttString[j] == '\n') {
            nodeString += utttString.substr(i, 1 + j - i);
            nodeString += "  ";
            i = j + 1;
        } else if (j + 1 == utttString.length()) {
            nodeString += utttString.substr(i, 1 + j - i);
        }
    }
    nodeString += "\n";
    nodeString += "  num_children: " + std::to_string(childNodesLength) + "\n";
    nodeString += "  visit_count: " + std::to_string(visitCount) + "\n";
    nodeString += "  state_value: " + std::to_string(stateValue) + "\n";
    nodeString += "  state_value_sum: " + std::to_string(stateValueSum) + "\n";
    nodeString += "  state_value_mean: " + std::to_string(stateValueMean) + "\n";
    nodeString += ")";
    return nodeString;
}

Tree::Tree(Node *node) : root(node) {}

Tree::~Tree() { delete root; }

void Tree::synchronize(const UltimateTicTacToe *uttt) {
    int nextRootIndex = -1;
    for (int i = 0; i < root->childNodesLength; i++) {
        Node *childNode = root->childNodes[i];
        if (uttt->isEqualTo(childNode->uttt)) {
            nextRootIndex = i;
            break;
        }
    }
    Node *prevRoot = root;
    if (nextRootIndex != -1) {
        root = root->childNodes[nextRootIndex];
        for (int i = 0; i < prevRoot->childNodesLength; i++) {
            if (i != nextRootIndex) {
                delete prevRoot->childNodes[i];
            }
            prevRoot->childNodes[i] = nullptr;
        }
        delete[] prevRoot->childNodes;
        prevRoot->childNodes = nullptr;
    } else {
        root = new Node(uttt->clone(), Action());
    }
    delete prevRoot;
}

std::string Tree::toString() const {
    std::string treeString = "Tree(\n";
    treeString += "  root: ";
    std::string rootString = root->toString();
    for (std::string::size_type i = 0, j = 0; j < rootString.length(); j++) {
        if (rootString[j] == '\n') {
            treeString += rootString.substr(i, 1 + j - i);
            treeString += "  ";
            i = j + 1;
        } else if (j + 1 == rootString.length()) {
            treeString += rootString.substr(i, 1 + j - i);
        }
    }
    treeString += "\n";
    treeString += "  size: " + std::to_string(getSize()) + "\n";
    treeString += "  height: " + std::to_string(getHeight()) + "\n";
    treeString += ")";
    return treeString;
}

int Tree::bfsCountNodes(Node *node) const {
    int cnt = 0;
    std::deque<Node *> nodes = {node};
    while (!nodes.empty()) {
        Node *node = nodes.front();
        nodes.pop_front();
        cnt += 1;
        for (int i = 0; i < node->childNodesLength; i++) {
            nodes.push_back(node->childNodes[i]);
        }
    }
    return cnt;
}

int Tree::dfsMaxDepth(Node *node, int depth) const {
    if (node->childNodesLength == 0) {
        return depth;
    }
    int maxDepth = depth;
    for (int i = 0; i < node->childNodesLength; i++) {
        maxDepth = std::max(maxDepth, dfsMaxDepth(node->childNodes[i], depth + 1));
    }
    return maxDepth;
}

NeuralMonteCarloTreeSearchWorker::NeuralMonteCarloTreeSearchWorker(
    UltimateTicTacToe *uttt,
    int numSimulations,
    double explorationStrength,
    const int workerId,
    std::atomic_bool *predictionQueryFlag,
    torch::Tensor utttStateTensor,
    torch::Tensor policyLogitsTensor,
    torch::Tensor stateValueTensor,
    std::chrono::milliseconds sleepDuration,
    std::mt19937 *pseudoRandomNumberGenerator)
    : tree(new Tree(new Node(uttt, Action()))),
      numSimulations(numSimulations),
      explorationStrength(explorationStrength),
      workerId(workerId),
      predictionQueryFlag(predictionQueryFlag),
      utttStateTensor(utttStateTensor),
      policyLogitsTensor(policyLogitsTensor),
      stateValueTensor(stateValueTensor),
      sleepDuration(sleepDuration),
      pseudoRandomNumberGenerator(pseudoRandomNumberGenerator) {}

NeuralMonteCarloTreeSearchWorker::~NeuralMonteCarloTreeSearchWorker() { delete tree; }

void NeuralMonteCarloTreeSearchWorker::run() {
    const int numRunSimulations = numSimulations - tree->root->visitCount;
    for (int i = 0; i < numRunSimulations; i++) {
        simulate();
    }
}

Action NeuralMonteCarloTreeSearchWorker::selectAction(
    EvaluatedAction **evaluatedActions,
    int numEvaluatedActions,
    const std::string selectionMethod) const {
    if (!(numEvaluatedActions > 0)) {
        throw std::runtime_error("numEvaluatedActions should be > 0");
    }
    EvaluatedAction *selectedEvaluatedAction = nullptr;
    if (selectionMethod == "argmax") {
        int *bestIndices = new int[numEvaluatedActions];
        int bestIndicesLength = 0;
        int bestScore = 0;
        for (int i = 0; i < numEvaluatedActions; i++) {
            if (evaluatedActions[i]->visitCount > bestScore) {
                bestIndicesLength = 0;
                bestIndices[bestIndicesLength++] = i;
                bestScore = evaluatedActions[i]->visitCount;
            } else if (evaluatedActions[i]->visitCount == bestScore) {
                bestIndices[bestIndicesLength++] = i;
            }
        }
        if (bestIndicesLength == 1) {
            selectedEvaluatedAction = evaluatedActions[bestIndices[0]];
        } else {
            std::uniform_int_distribution<int> distribution(0, bestIndicesLength - 1);
            selectedEvaluatedAction =
                evaluatedActions[bestIndices[distribution(*pseudoRandomNumberGenerator)]];
        }
        delete[] bestIndices;
    } else if (selectionMethod == "sample") {
        int totalVisitCount = 0;
        for (int i = 0; i < numEvaluatedActions; i++) {
            totalVisitCount += evaluatedActions[i]->visitCount;
        }
        if (!(totalVisitCount > 0)) {
            throw std::runtime_error("totalVisitCount should be > 0");
        }
        std::uniform_int_distribution<int> distribution(1, totalVisitCount);
        const int randomThreshold = distribution(*pseudoRandomNumberGenerator);
        int cumulativeVisitCount = 0;
        for (int i = 0; i < numEvaluatedActions; i++) {
            cumulativeVisitCount += evaluatedActions[i]->visitCount;
            if (randomThreshold <= cumulativeVisitCount) {
                selectedEvaluatedAction = evaluatedActions[i];
                break;
            }
        }
        if (selectedEvaluatedAction == nullptr) {
            throw std::runtime_error("selectedEvaluatedAction should be defined here");
        }
    } else if (selectionMethod == "random") {
        std::uniform_int_distribution<int> distribution(0, numEvaluatedActions - 1);
        const int randomIndex = distribution(*pseudoRandomNumberGenerator);
        selectedEvaluatedAction = evaluatedActions[randomIndex];
    } else {
        throw std::runtime_error("unknown selectionMethod");
    }
    return Action(selectedEvaluatedAction->symbol, selectedEvaluatedAction->index);
}

std::string NeuralMonteCarloTreeSearchWorker::toString() const {
    std::string nmctswString = "NeuralMonteCarloTreeSearchWorker(\n";
    nmctswString += "  worker_id: " + std::to_string(workerId) + "\n";
    nmctswString += "  tree: ";
    std::string treeString = tree->toString();
    for (std::string::size_type i = 0, j = 0; j < treeString.length(); j++) {
        if (treeString[j] == '\n') {
            nmctswString += treeString.substr(i, 1 + j - i);
            nmctswString += "  ";
            i = j + 1;
        } else if (j + 1 == treeString.length()) {
            nmctswString += treeString.substr(i, 1 + j - i);
        }
    }
    nmctswString += "\n";
    nmctswString += "  num_simulations: " + std::to_string(numSimulations) + "\n";
    nmctswString += "  exploration_strength: " + std::to_string(explorationStrength) + "\n";
    nmctswString += ")";
    return nmctswString;
}

void NeuralMonteCarloTreeSearchWorker::simulate() {
    selectLeafNode();
    Node *leafNode = selectedPath[selectedPathLength - 1];
    leafNode->expand();
    evaluate(leafNode, 1.0);
    backprop(leafNode->stateValue);
}

void NeuralMonteCarloTreeSearchWorker::selectLeafNode() {
    Node *node = tree->root;
    int topScoreIndicesLength, topChildNodeIndex;
    double score, topScore;
    selectedPathLength = 0;
    while (!node->isLeaf()) {
        selectedPath[selectedPathLength++] = node;
        topScoreIndicesLength = 0;
        topScore = -1e9;
        for (int i = 0; i < node->childNodesLength; i++) {
            score = Q(node->childNodes[i]) + U(node->childNodes[i], node->visitCount);
            if (score > topScore) {
                topScoreIndicesLength = 0;
                topScoreIndices[topScoreIndicesLength++] = i;
                topScore = score;
            } else if (score == topScore) {
                topScoreIndices[topScoreIndicesLength++] = i;
            }
        }
        if (topScoreIndicesLength == 1) {
            topChildNodeIndex = topScoreIndices[0];
        } else if (topScoreIndicesLength > 1) {
            std::uniform_int_distribution<int> distribution(0, topScoreIndicesLength - 1);
            topChildNodeIndex = topScoreIndices[distribution(*pseudoRandomNumberGenerator)];
        } else {
            throw std::runtime_error("topScoreIndicesLength is not determined");
        }
        node = node->childNodes[topChildNodeIndex];
    }
    selectedPath[selectedPathLength++] = node;
}

double NeuralMonteCarloTreeSearchWorker::Q(const Node *node) const {
    return -node->stateValueMean;
}

double NeuralMonteCarloTreeSearchWorker::U(const Node *node, const int parentVisitCount) const {
    return explorationStrength * std::max(0.01, node->actionProbability) *
           std::sqrt(static_cast<double>(parentVisitCount)) / (node->visitCount + 1);
}

void NeuralMonteCarloTreeSearchWorker::evaluate(Node *node, const double softmaxTemperature) {
    if (node->isTerminal()) {
        if (node->uttt->isResultDraw()) {
            node->stateValue = 0.0;
        } else {
            node->stateValue = -1.0;
        }
        return;
    }
    fillUtttStateTensor(node->uttt);
    predictionQueryFlag->store(true);
    do {
        std::this_thread::sleep_for(sleepDuration);
    } while (predictionQueryFlag->load());
    torch::Tensor policyLogits = torch::zeros({node->childNodesLength});
    for (int i = 0; i < node->childNodesLength; i++) {
        int actionIndex = node->childNodes[i]->action.index;
        policyLogits[i] = policyLogitsTensor.index({ROW_INDEX[actionIndex], COL_INDEX[actionIndex]});
    }
    torch::Tensor policyProbas = torch::softmax(policyLogits.div(softmaxTemperature), 0);
    for (int i = 0; i < node->childNodesLength; i++) {
        double actionProbability = policyProbas.index({i}).item<double>();
        node->childNodes[i]->actionProbability = actionProbability;
    }
    double stateValue = stateValueTensor.item<double>();
    node->stateValue = stateValue;
}

void NeuralMonteCarloTreeSearchWorker::backprop(const double stateValue) {
    int sign = 1;
    for (int i = selectedPathLength - 1; i >= 0; i--) {
        selectedPath[i]->visitCount += 1;
        selectedPath[i]->stateValueSum += sign * stateValue;
        selectedPath[i]->stateValueMean = selectedPath[i]->stateValueSum / selectedPath[i]->visitCount;
        sign *= -1;
    }
}

void NeuralMonteCarloTreeSearchWorker::fillUtttStateTensor(const UltimateTicTacToe *uttt) {
    utttStateTensor.fill_(0);
    // default values for X:
    int xi = 0;
    int oi = 1;
    char fillValue = 1;
    if (uttt->isNextSymbolO()) {
        // change values for O:
        xi = 1;
        oi = 0;
        fillValue = -1;
    }
    const unsigned char *state = uttt->getState();
    for (int si = 0; si < 81; si++) {
        if (state[si] == X_STATE_VALUE) {
            utttStateTensor.index_put_({xi, ROW_INDEX[si], COL_INDEX[si]}, 1);
        } else if (state[si] == O_STATE_VALUE) {
            utttStateTensor.index_put_({oi, ROW_INDEX[si], COL_INDEX[si]}, 1);
        }
    }
    utttStateTensor.index_put_({2}, fillValue);
    int numLegalIndexes = uttt->findLegalIndexes(fillLegalIndexes);
    for (int i = 0, li; i < numLegalIndexes; i++) {
        li = fillLegalIndexes[i];
        utttStateTensor.index_put_({3, ROW_INDEX[li], COL_INDEX[li]}, 1);
    }
}

}  // namespace utttcpp
