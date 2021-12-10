#include "utttcpp/selfplay/monteCarloTreeSearch.hpp"

#include <algorithm>
#include <cmath>
#include <deque>
#include <stdexcept>

#include "utttcpp/game/constants.hpp"
#include "utttcpp/helpers/prngMersenneTwister.hpp"

namespace utttcpp {

const std::string serializeEvaluatedState(EvaluatedState *evaluatedState) {
    std::string serializedEvaluatedState = "evaluatedState{";
    for (int i = 0; i < STATE_SIZE; i++) {
        serializedEvaluatedState += std::to_string(static_cast<int>(evaluatedState->state[i]));
    }
    serializedEvaluatedState += " ";
    serializedEvaluatedState += std::to_string(evaluatedState->numVisits);
    serializedEvaluatedState += " ";
    serializedEvaluatedState += std::to_string(evaluatedState->numWins);
    serializedEvaluatedState += " ";
    serializedEvaluatedState += std::to_string(evaluatedState->numDraws);
    serializedEvaluatedState += " ";
    serializedEvaluatedState += std::to_string(evaluatedState->numLosses);
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
        serializedEvaluatedActions += std::to_string(evaluatedActions[i]->numVisits);
        serializedEvaluatedActions += " ";
        serializedEvaluatedActions += std::to_string(evaluatedActions[i]->numWins);
        serializedEvaluatedActions += " ";
        serializedEvaluatedActions += std::to_string(evaluatedActions[i]->numDraws);
        serializedEvaluatedActions += " ";
        serializedEvaluatedActions += std::to_string(evaluatedActions[i]->numLosses);
    }
    serializedEvaluatedActions += "}";
    return serializedEvaluatedActions;
}

Node::Node(const UltimateTicTacToe *uttt, const Action action) : uttt(uttt), action(action) {
    childNodes = nullptr;
    childNodesLength = 0;
    numVisits = 0;
    numWinsX = 0;
    numWinsO = 0;
    numDraws = 0;
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
    int numWins, numLosses;
    if (uttt->isNextSymbolX()) {
        numWins = numWinsX;
        numLosses = numWinsO;
    } else {
        numWins = numWinsO;
        numLosses = numWinsX;
    }
    EvaluatedState *evaluatedState = new EvaluatedState{
        new unsigned char[STATE_SIZE],
        numVisits,
        numWins,
        numDraws,
        numLosses,
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
    int numWins, numLosses;
    for (int i = 0; i < childNodesLength; i++) {
        if (childNodes[i]->action.isSymbolX()) {
            numWins = childNodes[i]->numWinsX;
            numLosses = childNodes[i]->numWinsO;
        } else {
            numWins = childNodes[i]->numWinsO;
            numLosses = childNodes[i]->numWinsX;
        }
        EvaluatedAction *evaluatedAction = new EvaluatedAction{
            childNodes[i]->action.symbol,
            childNodes[i]->action.index,
            childNodes[i]->numVisits,
            numWins,
            childNodes[i]->numDraws,
            numLosses,
        };
        evaluatedActions[i] = evaluatedAction;
    }
    return evaluatedActions;
}

std::string Node::toString() const {
    std::string nodeString = "Node(\n";
    nodeString += "  action: " + action.toString() + "\n";
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
    nodeString += "  num_visits: " + std::to_string(numVisits) + "\n";
    nodeString += "  num_X_wins: " + std::to_string(numWinsX) + "\n";
    nodeString += "  num_O_wins: " + std::to_string(numWinsO) + "\n";
    nodeString += "  num_draws: " + std::to_string(numDraws) + "\n";
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

MonteCarloTreeSearch::MonteCarloTreeSearch(UltimateTicTacToe *uttt,
                                           int numSimulations,
                                           double explorationStrength)
    : tree(new Tree(new Node(uttt, Action()))),
      numSimulations(numSimulations),
      explorationStrength(explorationStrength) {}

MonteCarloTreeSearch::~MonteCarloTreeSearch() { delete tree; }

void MonteCarloTreeSearch::run() {
    const int numRunSimulations = numSimulations - tree->root->numVisits;
    for (int i = 0; i < numRunSimulations; i++) {
        simulate();
    }
}

Action MonteCarloTreeSearch::selectAction(EvaluatedAction **evaluatedActions,
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
            if (evaluatedActions[i]->numVisits > bestScore) {
                bestIndicesLength = 0;
                bestIndices[bestIndicesLength++] = i;
                bestScore = evaluatedActions[i]->numVisits;
            } else if (evaluatedActions[i]->numVisits == bestScore) {
                bestIndices[bestIndicesLength++] = i;
            }
        }
        if (bestIndicesLength == 1) {
            selectedEvaluatedAction = evaluatedActions[bestIndices[0]];
        } else {
            selectedEvaluatedAction =
                evaluatedActions[bestIndices[randInt(0, bestIndicesLength - 1)]];
        }
        delete[] bestIndices;
    } else if (selectionMethod == "sample") {
        int totalNumVisits = 0;
        for (int i = 0; i < numEvaluatedActions; i++) {
            totalNumVisits += evaluatedActions[i]->numVisits;
        }
        if (!(totalNumVisits > 0)) {
            throw std::runtime_error("totalNumVisits should be > 0");
        }
        const int randomThreshold = randInt(1, totalNumVisits);
        int cumulativeNumVisits = 0;
        for (int i = 0; i < numEvaluatedActions; i++) {
            cumulativeNumVisits += evaluatedActions[i]->numVisits;
            if (randomThreshold <= cumulativeNumVisits) {
                selectedEvaluatedAction = evaluatedActions[i];
                break;
            }
        }
        if (selectedEvaluatedAction == nullptr) {
            throw std::runtime_error("selectedEvaluatedAction should be defined here");
        }
    } else if (selectionMethod == "random") {
        const int randomIndex = randInt(0, numEvaluatedActions - 1);
        selectedEvaluatedAction = evaluatedActions[randomIndex];
    } else {
        throw std::runtime_error("unknown selectionMethod");
    }
    return Action(selectedEvaluatedAction->symbol, selectedEvaluatedAction->index);
}

std::string MonteCarloTreeSearch::toString() const {
    std::string mctsString = "MonteCarloTreeSearch(\n";
    mctsString += "  tree: ";
    std::string treeString = tree->toString();
    for (std::string::size_type i = 0, j = 0; j < treeString.length(); j++) {
        if (treeString[j] == '\n') {
            mctsString += treeString.substr(i, 1 + j - i);
            mctsString += "  ";
            i = j + 1;
        } else if (j + 1 == treeString.length()) {
            mctsString += treeString.substr(i, 1 + j - i);
        }
    }
    mctsString += "\n";
    mctsString += "  num_simulations: " + std::to_string(numSimulations) + "\n";
    mctsString += "  exploration_strength: " + std::to_string(explorationStrength) + "\n";
    mctsString += ")";
    return mctsString;
}

void MonteCarloTreeSearch::simulate() {
    selectLeafNode();
    Node *leafNode = selectedPath[selectedPathLength - 1];
    // leafNode->expand(); (leaf node is not expanded here to improve memory efficiency)
    playoutBackprop(leafNode);
}

void MonteCarloTreeSearch::selectLeafNode() {
    Node *node = tree->root;
    int topScoreIndicesLength, topChildNodeIndex;
    double score, topScore;
    selectedPathLength = 0;
    // while (!node->isLeaf()) { (original version)
    while (node->numVisits != 0 && !node->isTerminal()) {  // accommodate for unexpanded leaf node
        if (node->numVisits == 1) {  // detect unexpanded leaf node
            node->expand();  // expand only when node's children are needed
        }
        selectedPath[selectedPathLength++] = node;
        topScoreIndicesLength = 0;
        topScore = -1e9;
        for (int i = 0; i < node->childNodesLength; i++) {
            score = UCT(node->childNodes[i], node->numVisits);
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
            topChildNodeIndex = topScoreIndices[randInt(0, topScoreIndicesLength - 1)];
        } else {
            throw std::runtime_error("topScoreIndicesLength is not determined");
        }
        node = node->childNodes[topChildNodeIndex];
    }
    selectedPath[selectedPathLength++] = node;
}

double MonteCarloTreeSearch::UCT(const Node *node, const int parentNumVisits) const {
    if (node->numVisits == 0) {
        return 1e9;
    }
    double exploitationScore = valueFunction(node);
    double explorationScore = explorationStrength *
        std::sqrt(std::log(static_cast<double>(parentNumVisits)) / node->numVisits);
    return exploitationScore + explorationScore;
}

double MonteCarloTreeSearch::valueFunction(const Node *node) const {
    if (node->action.isSymbolX()) {
        return static_cast<double>(node->numWinsX - node->numWinsO) /
               static_cast<double>(node->numVisits);
    } else if (node->action.isSymbolO()) {
        return static_cast<double>(node->numWinsO - node->numWinsX) /
               static_cast<double>(node->numVisits);
    }
    throw std::runtime_error("unknown action symbol");
}

void MonteCarloTreeSearch::playoutBackprop(const Node *node) {
    UltimateTicTacToe *uttt = node->uttt->clone();
    while (!uttt->isTerminated()) {
        unsigned char nextSymbol = uttt->getNextSymbol();
        int numLegalIndexes = uttt->findLegalIndexes(playoutLegalIndexes);
        int selectedIndex = playoutLegalIndexes[randInt(0, numLegalIndexes - 1)];
        uttt->execute(Action(nextSymbol, selectedIndex));
    }
    if (uttt->isResultX()) {
        for (int i = 0; i < selectedPathLength; i++) {
            selectedPath[i]->numVisits += 1;
            selectedPath[i]->numWinsX += 1;
        }
    } else if (uttt->isResultO()) {
        for (int i = 0; i < selectedPathLength; i++) {
            selectedPath[i]->numVisits += 1;
            selectedPath[i]->numWinsO += 1;
        }
    } else if (uttt->isResultDraw()) {
        for (int i = 0; i < selectedPathLength; i++) {
            selectedPath[i]->numVisits += 1;
            selectedPath[i]->numDraws += 1;
        }
    } else {
        throw std::runtime_error("unknown uttt result");
    }
    delete uttt;
}

}  // namespace utttcpp
