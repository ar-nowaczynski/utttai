#ifndef UTTTCPP_SELFPLAY_MONTECARLOTREESEARCH_HPP_
#define UTTTCPP_SELFPLAY_MONTECARLOTREESEARCH_HPP_

#include <string>

#include "utttcpp/game/action.hpp"
#include "utttcpp/game/ultimateTicTacToe.hpp"

namespace utttcpp {

struct EvaluatedState {
    unsigned char *state;
    int numVisits;
    int numWins;
    int numDraws;
    int numLosses;
};

const std::string serializeEvaluatedState(EvaluatedState *evaluatedState);

struct EvaluatedAction {
    unsigned char symbol;
    int index;
    int numVisits;
    int numWins;
    int numDraws;
    int numLosses;
};

const std::string serializeEvaluatedActions(EvaluatedAction **evaluatedActions,
                                            int numEvaluatedActions);

class Node {
  public:
    const UltimateTicTacToe *uttt;
    const Action action;
    Node **childNodes;
    int childNodesLength;
    int numVisits;
    int numWinsX;
    int numWinsO;
    int numDraws;

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

class MonteCarloTreeSearch {
  public:
    Tree *tree;
    int numSimulations;
    double explorationStrength;

    MonteCarloTreeSearch(UltimateTicTacToe *uttt, int numSimulations, double explorationStrength);
    ~MonteCarloTreeSearch();

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
    int playoutLegalIndexes[128];
    void simulate();
    void selectLeafNode();
    double UCT(const Node *node, const int parentNumVisits) const;
    double valueFunction(const Node *node) const;
    void playoutBackprop(const Node *node);
};

}  // namespace utttcpp

#endif  // UTTTCPP_SELFPLAY_MONTECARLOTREESEARCH_HPP_
