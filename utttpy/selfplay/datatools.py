import pathlib
import re
from typing import Dict, List

import numpy as np
from tqdm import tqdm


def load_mcts_dataset(dirpath: pathlib.Path) -> Dict[str, List[dict]]:
    dataset = {}
    paths = sorted(list(dirpath.glob("depth*txt")))
    for path in tqdm(paths, desc="loading mcts dataset"):
        key = path.stem
        datapoints = load_mcts_datapoints(path)
        dataset[key] = datapoints
    num_datapoints = sum(len(datapoints) for datapoints in dataset.values())
    print(f"mcts dataset containing {num_datapoints} datapoints loaded successfully!")
    return dataset


def load_nmcts_dataset(dirpath: pathlib.Path) -> Dict[str, List[dict]]:
    dataset = {}
    paths = sorted(list(dirpath.glob("depth*txt")))
    for path in tqdm(paths, desc="loading nmcts dataset"):
        key = path.stem
        datapoints = load_nmcts_datapoints(path)
        dataset[key] = datapoints
    num_datapoints = sum(len(datapoints) for datapoints in dataset.values())
    print(f"nmcts dataset containing {num_datapoints} datapoints loaded successfully!")
    return dataset


def load_mcts_datapoints(path: pathlib.Path) -> List[dict]:
    with open(path, "r") as f:
        content = f.read()
    content = content.rstrip()
    if content:
        lines = content.split("\n")
    else:
        lines = []
    datapoints = [parse_mcts_datapoint(line) for line in lines]
    return datapoints


def load_nmcts_datapoints(path: pathlib.Path) -> List[dict]:
    with open(path, "r") as f:
        content = f.read()
    content = content.rstrip()
    if content:
        lines = content.split("\n")
    else:
        lines = []
    datapoints = [parse_nmcts_datapoint(line) for line in lines]
    return datapoints


def parse_mcts_datapoint(line: str) -> dict:
    match = re.match("evaluatedState{(.*?)}", line)
    if match is None:
        raise RuntimeError("cannot parse datapoint")
    evaluated_state_string = match.group(1)
    evaluated_state_values = evaluated_state_string.split(" ")
    state = bytearray(map(int, evaluated_state_values[0]))
    num_visits = int(evaluated_state_values[1])
    num_wins = int(evaluated_state_values[2])
    num_losses = int(evaluated_state_values[4])
    value = (num_wins - num_losses) / num_visits
    match = re.match(".*evaluatedActions{(.*?)}", line)
    if match is None:
        raise RuntimeError("cannot parse datapoint")
    evaluated_actions_string = match.group(1)
    evaluated_actions_values = evaluated_actions_string.split(",")
    num_actions = len(evaluated_actions_values)
    actions_index = np.zeros(num_actions, dtype=np.int32)
    actions_probability = np.zeros(num_actions, dtype=np.float32)
    actions_value = np.zeros(num_actions, dtype=np.float32)
    for i, evaluated_action_values in enumerate(evaluated_actions_values):
        evaluated_action_values = list(map(int, evaluated_action_values.split(" ")))
        action_index = evaluated_action_values[1]
        action_num_visits = evaluated_action_values[2]
        action_num_wins = evaluated_action_values[3]
        action_num_losses = evaluated_action_values[5]
        action_value = (action_num_wins - action_num_losses) / action_num_visits
        actions_index[i] = action_index
        actions_probability[i] = action_num_visits
        actions_value[i] = action_value
    actions_probability = actions_probability / actions_probability.sum()
    actions = (actions_index, actions_probability, actions_value)
    return {
        "state": state,
        "value": value,
        "actions": actions,
    }


def parse_nmcts_datapoint(line: str) -> dict:
    match = re.match("evaluatedState{(.*?)}", line)
    if match is None:
        raise RuntimeError("cannot parse datapoint")
    evaluated_state_string = match.group(1)
    evaluated_state_values = evaluated_state_string.split(" ")
    state = bytearray(map(int, evaluated_state_values[0]))
    value = float(evaluated_state_values[2])
    match = re.match(".*evaluatedActions{(.*?)}", line)
    if match is None:
        raise RuntimeError("cannot parse datapoint")
    evaluated_actions_string = match.group(1)
    evaluated_actions_values = evaluated_actions_string.split(",")
    num_actions = len(evaluated_actions_values)
    actions_index = np.zeros(num_actions, dtype=np.int32)
    actions_probability = np.zeros(num_actions, dtype=np.float32)
    actions_value = np.zeros(num_actions, dtype=np.float32)
    for i, evaluated_action_values in enumerate(evaluated_actions_values):
        evaluated_action_values = evaluated_action_values.split(" ")
        action_index = int(evaluated_action_values[1])
        action_visit_count = int(evaluated_action_values[2])
        action_value = float(evaluated_action_values[3])
        actions_index[i] = action_index
        actions_probability[i] = action_visit_count
        actions_value[i] = action_value
    actions_probability = actions_probability / actions_probability.sum()
    actions = (actions_index, actions_probability, actions_value)
    return {
        "state": state,
        "value": value,
        "actions": actions,
    }


def merge_endgame_depths_inplace(dataset: Dict[str, List[dict]]) -> None:
    dataset["depth55+56"] = dataset["depth55"] + dataset["depth56"]
    dataset["depth57+58+59"] = dataset["depth57"] + dataset["depth58"] + dataset["depth59"]
    dataset["depth60+"] = []
    for d in range(60, 81):
        dataset["depth60+"].extend(dataset[f"depth{d:02}"])
    for d in range(55, 81):
        del dataset[f"depth{d:02}"]
