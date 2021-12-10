from __future__ import annotations

import math
import random
from collections import deque
from multiprocessing.queues import Queue
from typing import List, Optional

import numpy as np
import torch
from tqdm import tqdm

from utttpy.game.action import Action
from utttpy.game.helpers import row_index, col_index, get_state_ndarray_4x9x9
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.policy_value_network import PolicyValueNetwork


class NeuralMonteCarloTreeSearch:

    def __init__(
        self,
        uttt: UltimateTicTacToe,
        num_simulations: int,
        exploration_strength: float,
        policy_value_net: PolicyValueNetwork,
    ):
        self.tree = Tree(root=Node(uttt=uttt))
        self.num_simulations = num_simulations
        self.exploration_strength = exploration_strength
        self.policy_value_net = policy_value_net

    def run(self, progress_bar: bool = False) -> None:
        num_run_simulations = self.num_simulations - self.tree.root.visit_count
        for i in tqdm(range(num_run_simulations), disable=not progress_bar):
            self._simulate()

    def get_evaluated_state(self) -> dict:
        return self.tree.root.get_evaluated_state()

    def get_evaluated_actions(self) -> List[dict]:
        return self.tree.root.get_evaluated_actions()

    def select_action(
        self, evaluated_actions: List[dict], selection_method: str
    ) -> Action:
        if selection_method == "argmax":
            max_visit_count = max(
                evaluated_action["visit_count"] for evaluated_action in evaluated_actions
            )
            top_evaluated_actions = [
                evaluated_action
                for evaluated_action in evaluated_actions
                if evaluated_action["visit_count"] >= max_visit_count
            ]
            selected_evaluated_action = random.choice(top_evaluated_actions)
        elif selection_method == "sample":
            visit_count_list = [
                evaluated_action["visit_count"] for evaluated_action in evaluated_actions
            ]
            total_visit_count = sum(visit_count_list)
            weights = [visit_count / total_visit_count for visit_count in visit_count_list]
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

    def _simulate(self) -> None:
        selected_path = self._select_leaf_node()
        if len(selected_path) == 0:
            raise NeuralMonteCarloTreeSearchError("selected path is empty")
        leaf_node = selected_path[-1]
        leaf_node.expand()
        self._evaluate(node=leaf_node, softmax_temperature=1.0)
        self._backprop(selected_path=selected_path, state_value=leaf_node.state_value)

    def _select_leaf_node(self) -> List[Node]:
        selected_path = []
        node = self.tree.root
        while not node.is_leaf():
            selected_path.append(node)
            scores = [
                self._Q(child_node) + self._U(child_node, node.visit_count)
                for child_node in node.child_nodes
            ]
            top_score = max(scores)
            top_score_indices = [i for i, score in enumerate(scores) if score >= top_score]
            top_child_node_index = random.choice(top_score_indices)
            node = node.child_nodes[top_child_node_index]
        selected_path.append(node)
        return selected_path

    def _Q(self, node: Node) -> float:
        return -node.state_value_mean

    def _U(self, node: Node, parent_visit_count: int) -> float:
        return (
            self.exploration_strength * max(0.01, node.action_probability) * math.sqrt(parent_visit_count)
            / (node.visit_count + 1)
        )

    def _evaluate(self, node: Node, softmax_temperature: float) -> None:
        if node.is_terminal():
            if node.uttt.is_result_draw():
                node.state_value = 0.0
            else:
                node.state_value = -1.0
            return
        input_4x9x9 = get_state_ndarray_4x9x9(uttt=node.uttt)
        input_1x4x9x9 = np.expand_dims(input_4x9x9, axis=0)
        input_1x4x9x9 = torch.from_numpy(input_1x4x9x9)
        input_1x4x9x9 = input_1x4x9x9.to(device=self.policy_value_net.device, dtype=torch.float32)
        with torch.no_grad():
            policy_logits, action_values, state_value = self.policy_value_net(input_1x4x9x9)
        policy_logits_tensor = policy_logits[0].cpu()
        policy_logits_list = []
        for child_node in node.child_nodes:
            action_index = child_node.action.index
            action_logit = policy_logits_tensor[row_index(action_index), col_index(action_index)].item()
            policy_logits_list.append(action_logit)
        policy_logits_tensor = torch.tensor(policy_logits_list)
        policy_probas_tensor = torch.softmax(policy_logits_tensor / softmax_temperature, dim=0)
        for i, child_node in enumerate(node.child_nodes):
            child_node.action_probability = policy_probas_tensor[i].item()
        state_value = state_value[0].item()
        node.state_value = state_value

    def _backprop(self, selected_path: List[Node], state_value: float) -> None:
        sign = 1
        for node in reversed(selected_path):
            node.visit_count += 1
            node.state_value_sum += sign * state_value
            node.state_value_mean = node.state_value_sum / node.visit_count
            sign *= -1

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


class NeuralMonteCarloTreeSearchWorker(NeuralMonteCarloTreeSearch):

    def __init__(
        self,
        uttt: UltimateTicTacToe,
        num_simulations: int,
        exploration_strength: float,
        worker_id: int,
        input_queue: Queue,
        prediction_queue: Queue,
    ):
        self.tree = Tree(root=Node(uttt=uttt))
        self.num_simulations = num_simulations
        self.exploration_strength = exploration_strength
        self.worker_id = worker_id
        self.input_queue = input_queue
        self.prediction_queue = prediction_queue

    def _evaluate(self, node: Node, softmax_temperature: float) -> None:
        if node.is_terminal():
            if node.uttt.is_result_draw():
                node.state_value = 0.0
            else:
                node.state_value = -1.0
            return
        input_4x9x9 = get_state_ndarray_4x9x9(uttt=node.uttt)
        input_4x9x9 = torch.from_numpy(input_4x9x9).to(dtype=torch.float32)
        self.input_queue.put((self.worker_id, input_4x9x9))
        prediction = self.prediction_queue.get()
        policy_logits_tensor, state_value = prediction
        policy_logits_list = []
        for child_node in node.child_nodes:
            action_index = child_node.action.index
            action_logit = policy_logits_tensor[row_index(action_index), col_index(action_index)].item()
            policy_logits_list.append(action_logit)
        policy_logits_tensor = torch.tensor(policy_logits_list)
        policy_probas_tensor = torch.softmax(policy_logits_tensor / softmax_temperature, dim=0)
        for i, child_node in enumerate(node.child_nodes):
            child_node.action_probability = policy_probas_tensor[i].item()
        node.state_value = state_value

    def __str__(self):
        output = (
            '{cls}(\n'
            '  worker_id: {worker_id}\n'
            '  tree: {tree}\n'
            '  num_simulations: {num_simulations}\n'
            '  exploration_strength: {exploration_strength}\n)'
        )
        output = output.format(
            cls=self.__class__.__name__,
            worker_id=self.worker_id,
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
        return self._bfs_count_nodes(node=self.root)

    @property
    def height(self) -> int:
        return self._dfs_max_depth(node=self.root, depth=0)

    def synchronize(self, uttt: UltimateTicTacToe) -> None:
        for child_node in self.root.child_nodes:
            if uttt.is_equal_to(child_node.uttt):
                self.root = child_node
                return
        self.root = Node(uttt=uttt.clone())

    def _bfs_count_nodes(self, node: Node) -> int:
        cnt = 0
        nodes = deque([node])
        while len(nodes) > 0:
            node = nodes.popleft()
            cnt += 1
            nodes.extend(node.child_nodes)
        return cnt

    def _dfs_max_depth(self, node: Node, depth: int) -> int:
        if len(node.child_nodes) == 0:
            return depth
        max_depth = depth
        for child_node in node.child_nodes:
            max_depth = max(
                max_depth, self._dfs_max_depth(node=child_node, depth=depth + 1)
            )
        return max_depth

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
        self.action_probability = None
        self.child_nodes = []
        self.visit_count = 0
        self.state_value = None
        self.state_value_sum = 0.0
        self.state_value_mean = 0.0

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
            raise NeuralMonteCarloTreeSearchError("expanding node with no legal actions")
        for legal_action in legal_actions:
            uttt = self.uttt.clone()
            uttt.execute(action=legal_action, verify=False)
            child_node = Node(uttt=uttt, action=legal_action)
            self.child_nodes.append(child_node)

    def get_evaluated_state(self) -> dict:
        return {
            "state": self.uttt.state.copy(),
            "visit_count": self.visit_count,
            "state_value_mean": self.state_value_mean,
        }

    def get_evaluated_actions(self) -> List[dict]:
        if self.is_leaf():
            raise NeuralMonteCarloTreeSearchError("node is a leaf")
        if self.visit_count == 0:
            raise NeuralMonteCarloTreeSearchError("node was not visited")
        evaluated_actions = []
        for child_node in self.child_nodes:
            evaluated_action = {
                "symbol": child_node.action.symbol,
                "index": child_node.action.index,
                "visit_count": child_node.visit_count,
                "state_value_mean": -child_node.state_value_mean,
            }
            evaluated_actions.append(evaluated_action)
        return evaluated_actions

    def __str__(self):
        output = (
            '{cls}(\n'
            '  action: {action}\n'
            '  action_probability: {action_probability}\n'
            '  uttt: {uttt}\n'
            '  num_children: {num_children}\n'
            '  visit_count: {visit_count}\n'
            '  state_value: {state_value}\n'
            '  state_value_sum: {state_value_sum}\n'
            '  state_value_mean: {state_value_mean}\n)'
        )
        output = output.format(
            cls=self.__class__.__name__,
            uttt=str(self.uttt).replace('\n', '\n  '),
            action=self.action,
            action_probability=self.action_probability,
            num_children=len(self.child_nodes),
            visit_count=self.visit_count,
            state_value=self.state_value,
            state_value_sum=self.state_value_sum,
            state_value_mean=self.state_value_mean,
        )
        return output


def serialize_evaluated_state(evaluated_state: dict) -> str:
    state = "".join(map(str, evaluated_state["state"]))
    visit_count = str(evaluated_state["visit_count"])
    state_value_mean = str(round(evaluated_state["state_value_mean"], 6))
    evaluated_state_str = f"evaluatedState{{{state} {visit_count} {state_value_mean}}}"
    return evaluated_state_str


def serialize_evaluated_actions(evaluated_actions: List[dict]) -> str:
    evaluated_actions_str = "evaluatedActions{"
    for i, evaluated_action in enumerate(evaluated_actions):
        if i > 0:
            evaluated_actions_str += ","
        symbol = str(evaluated_action["symbol"])
        index = str(evaluated_action["index"])
        visit_count = str(evaluated_action["visit_count"])
        state_value_mean = str(round(evaluated_action["state_value_mean"], 6))
        evaluated_action_str = f"{symbol} {index} {visit_count} {state_value_mean}"
        evaluated_actions_str += evaluated_action_str
    evaluated_actions_str += "}"
    return evaluated_actions_str


class NeuralMonteCarloTreeSearchError(Exception):
    pass
