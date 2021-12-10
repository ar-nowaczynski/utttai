from __future__ import annotations

import math
import random
from collections import deque
from typing import List, Optional, Tuple

from tqdm import tqdm

from utttpy.game.action import Action
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe


class MonteCarloTreeSearch:

    def __init__(
        self,
        uttt: UltimateTicTacToe,
        num_simulations: int,
        exploration_strength: float,
    ):
        self.tree = Tree(root=Node(uttt=uttt))
        self.num_simulations = num_simulations
        self.exploration_strength = exploration_strength

    def run(self, progress_bar: bool = False) -> None:
        num_run_simulations = self.num_simulations - self.tree.root.num_visits
        for i in tqdm(range(num_run_simulations), disable=not progress_bar):
            simulate(
                node=self.tree.root,
                exploration_strength=self.exploration_strength,
            )

    def get_evaluated_state(self) -> dict:
        return self.tree.root.get_evaluated_state()

    def get_evaluated_actions(self) -> List[dict]:
        return self.tree.root.get_evaluated_actions()

    def select_action(
        self, evaluated_actions: List[dict], selection_method: str
    ) -> Action:
        if selection_method == "argmax":
            max_num_visits = max(
                evaluated_action["num_visits"] for evaluated_action in evaluated_actions
            )
            top_evaluated_actions = [
                evaluated_action
                for evaluated_action in evaluated_actions
                if evaluated_action["num_visits"] >= max_num_visits
            ]
            selected_evaluated_action = random.choice(top_evaluated_actions)
        elif selection_method == "sample":
            num_visits_list = [
                evaluated_action["num_visits"] for evaluated_action in evaluated_actions
            ]
            total_num_visits = sum(num_visits_list)
            weights = [num_visits / total_num_visits for num_visits in num_visits_list]
            selected_evaluated_action = random.choices(evaluated_actions, weights=weights, k=1)[0]
        elif selection_method == "random":
            selected_evaluated_action = random.choice(evaluated_actions)
        else:
            raise ValueError(f"unknown selection_method={repr(selection_method)}")
        return Action(
            symbol=selected_evaluated_action["symbol"],
            index=selected_evaluated_action["index"],
        )

    def synchronize(self, uttt: UltimateTicTacToe) -> None:
        self.tree.synchronize(uttt=uttt)

    def __str__(self):
        output = (
            '{cls}(\n'
            '  tree: {tree}\n'
            '  num_simulations: {num_simulations}\n'
            '  exploration_strength: {exploration_strength}\n)'
        )
        output = output.format(
            cls=self.__class__.__name__,
            tree=str(self.tree).replace('\n', '\n  '),
            num_simulations=self.num_simulations,
            exploration_strength=self.exploration_strength,
        )
        return output


class Tree:

    def __init__(self, root: Node):
        self.root = root

    @property
    def size(self) -> int:
        return bfs_count_nodes(node=self.root)

    @property
    def height(self) -> int:
        return dfs_max_depth(node=self.root, depth=0)

    def synchronize(self, uttt: UltimateTicTacToe) -> None:
        for child_node in self.root.child_nodes:
            if uttt.is_equal_to(child_node.uttt):
                self.root = child_node
                return
        self.root = Node(uttt=uttt.clone())

    def __str__(self):
        output = (
            '{cls}(\n'
            '  root: {root}\n'
            '  size: {size}\n'
            '  height: {height}\n)'
        )
        output = output.format(
            cls=self.__class__.__name__,
            root=str(self.root).replace('\n', '\n  '),
            size=self.size,
            height=self.height,
        )
        return output


class Node:

    def __init__(self, uttt: UltimateTicTacToe, action: Optional[Action] = None):
        self.uttt = uttt
        self.action = action
        self.child_nodes = []
        self.num_visits = 0
        self.num_X_wins = 0
        self.num_O_wins = 0
        self.num_draws = 0

    def is_leaf(self) -> bool:
        return len(self.child_nodes) == 0

    def is_terminal(self) -> bool:
        return self.uttt.is_terminated()

    def expand(self) -> None:
        if not self.is_leaf():
            return
        if self.is_terminal():
            return
        legal_actions = self.uttt.get_legal_actions()
        if len(legal_actions) == 0:
            raise MonteCarloTreeSearchError("expanding node with no legal actions")
        for legal_action in legal_actions:
            uttt = self.uttt.clone()
            uttt.execute(action=legal_action, verify=False)
            child_node = Node(uttt=uttt, action=legal_action)
            self.child_nodes.append(child_node)

    def get_evaluated_state(self) -> dict:
        if self.uttt.is_next_symbol_X():
            num_wins = self.num_X_wins
            num_losses = self.num_O_wins
        else:
            num_wins = self.num_O_wins
            num_losses = self.num_X_wins
        return {
            "state": self.uttt.state.copy(),
            "num_visits": self.num_visits,
            "num_wins": num_wins,
            "num_draws": self.num_draws,
            "num_losses": num_losses,
        }

    def get_evaluated_actions(self) -> List[dict]:
        if self.is_leaf():
            raise MonteCarloTreeSearchError("node is a leaf")
        if self.num_visits == 0:
            raise MonteCarloTreeSearchError("node was not visited")
        evaluated_actions = []
        for child_node in self.child_nodes:
            if child_node.action.is_symbol_X():
                num_wins = child_node.num_X_wins
                num_losses = child_node.num_O_wins
            else:
                num_wins = child_node.num_O_wins
                num_losses = child_node.num_X_wins
            evaluated_action = {
                "symbol": child_node.action.symbol,
                "index": child_node.action.index,
                "num_visits": child_node.num_visits,
                "num_wins": num_wins,
                "num_draws": child_node.num_draws,
                "num_losses": num_losses,
            }
            evaluated_actions.append(evaluated_action)
        return evaluated_actions

    def __str__(self):
        output = (
            '{cls}(\n'
            '  action: {action}\n'
            '  uttt: {uttt}\n'
            '  num_children: {num_children}\n'
            '  num_visits: {num_visits}\n'
            '  num_X_wins: {num_X_wins}\n'
            '  num_O_wins: {num_O_wins}\n'
            '  num_draws: {num_draws}\n)'
        )
        output = output.format(
            cls=self.__class__.__name__,
            action=self.action,
            uttt=str(self.uttt).replace('\n', '\n  '),
            num_children=len(self.child_nodes),
            num_visits=self.num_visits,
            num_X_wins=self.num_X_wins,
            num_O_wins=self.num_O_wins,
            num_draws=self.num_draws,
        )
        return output


def simulate(node: Node, exploration_strength: float) -> None:
    selected_path = select_leaf_node(node=node, exploration_strength=exploration_strength)
    if len(selected_path) == 0:
        raise MonteCarloTreeSearchError("selected path is empty")
    leaf_node = selected_path[-1]
    leaf_node.expand()
    stats = playout(node=leaf_node)
    backprop(selected_path=selected_path, stats=stats)


def select_leaf_node(node: Node, exploration_strength: float) -> List[Node]:
    selected_path = []
    while not node.is_leaf():
        selected_path.append(node)
        scores = [
            UCT(
                node=child_node,
                parent_num_visits=node.num_visits,
                exploration_strength=exploration_strength,
            )
            for child_node in node.child_nodes
        ]
        top_score = max(scores)
        top_score_indices = [i for i, score in enumerate(scores) if score >= top_score]
        top_child_node_index = random.choice(top_score_indices)
        node = node.child_nodes[top_child_node_index]
    selected_path.append(node)
    return selected_path


def UCT(node: Node, parent_num_visits: int, exploration_strength: float) -> float:
    if node.num_visits == 0:
        return float("inf")
    exploitation_score = value_function(node)
    exploration_score = exploration_strength * math.sqrt(
        math.log(parent_num_visits) / node.num_visits
    )
    UCT_value = exploitation_score + exploration_score
    return UCT_value


def value_function(node: Node) -> float:
    if node.action.is_symbol_X():
        num_wins = node.num_X_wins
        num_losses = node.num_O_wins
    elif node.action.is_symbol_O():
        num_wins = node.num_O_wins
        num_losses = node.num_X_wins
    return (num_wins - num_losses) / node.num_visits


def playout(node: Node) -> Tuple[int, int, int]:
    num_X_wins = 0
    num_O_wins = 0
    num_draws = 0
    uttt = node.uttt.clone()
    while not uttt.is_terminated():
        actions = uttt.get_legal_actions()
        action = random.choice(actions)
        uttt.execute(action, verify=False)
    if uttt.is_result_X():
        num_X_wins += 1
    elif uttt.is_result_O():
        num_O_wins += 1
    elif uttt.is_result_draw():
        num_draws += 1
    return num_X_wins, num_O_wins, num_draws


def backprop(selected_path: List[Node], stats: Tuple[int, int, int]) -> None:
    num_X_wins, num_O_wins, num_draws = stats
    for node in selected_path:
        node.num_visits += 1
        node.num_X_wins += num_X_wins
        node.num_O_wins += num_O_wins
        node.num_draws += num_draws


def bfs_count_nodes(node: Node) -> int:
    cnt = 0
    nodes = deque([node])
    while len(nodes) > 0:
        node = nodes.popleft()
        cnt += 1
        nodes.extend(node.child_nodes)
    return cnt


def dfs_max_depth(node: Node, depth: int) -> int:
    if len(node.child_nodes) == 0:
        return depth
    max_depth = depth
    for child_node in node.child_nodes:
        max_depth = max(max_depth, dfs_max_depth(node=child_node, depth=depth + 1))
    return max_depth


def serialize_evaluated_state(evaluated_state: dict) -> str:
    state = "".join(map(str, evaluated_state["state"]))
    num_visits = str(evaluated_state["num_visits"])
    num_wins = str(evaluated_state["num_wins"])
    num_draws = str(evaluated_state["num_draws"])
    num_losses = str(evaluated_state["num_losses"])
    evaluated_state_str = f"evaluatedState{{{state} {num_visits} {num_wins} {num_draws} {num_losses}}}"
    return evaluated_state_str


def serialize_evaluated_actions(evaluated_actions: List[dict]) -> str:
    evaluated_actions_str = "evaluatedActions{"
    for i, evaluated_action in enumerate(evaluated_actions):
        if i > 0:
            evaluated_actions_str += ","
        symbol = str(evaluated_action["symbol"])
        index = str(evaluated_action["index"])
        num_visits = str(evaluated_action["num_visits"])
        num_wins = str(evaluated_action["num_wins"])
        num_draws = str(evaluated_action["num_draws"])
        num_losses = str(evaluated_action["num_losses"])
        evaluated_action_str = f"{symbol} {index} {num_visits} {num_wins} {num_draws} {num_losses}"
        evaluated_actions_str += evaluated_action_str
    evaluated_actions_str += "}"
    return evaluated_actions_str


class MonteCarloTreeSearchError(Exception):
    pass
