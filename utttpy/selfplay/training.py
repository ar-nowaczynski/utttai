import json
import pathlib
import random
from collections import deque
from typing import Dict, Iterator, List

import numpy as np
import torch

from utttpy.game.helpers import row_index, col_index, get_state_ndarray_4x9x9
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.policy_value_network import PolicyValueNetwork


def train_policy_value_net(
    policy_value_net: PolicyValueNetwork,
    dataset: Dict[str, List[dict]],
    training_dirpath: pathlib.Path,
    num_train_iters: int,
    batch_size: int,
    policy_loss_type: str,
    policy_loss_weight: float,
    action_values_loss_weight: float,
    state_value_loss_weight: float,
    lr_schedule: Dict[int, float],
    bnm_schedule: Dict[int, float],
    print_loss_iters: int,
    save_checkpoint_iters: int,
    automatic_mixed_precision: bool,
) -> None:
    policy_value_net.train()

    optimizer = torch.optim.Adam(params=policy_value_net.parameters(), lr=lr_schedule[0])

    if automatic_mixed_precision:
        scaler = torch.cuda.amp.GradScaler()

    train_batch_iterator = train_batch_generator(dataset, batch_size, policy_value_net.device)
    loss_values = deque(maxlen=print_loss_iters)
    loss_history = []

    for iteration in range(1, num_train_iters + 1):

        train_batch = next(train_batch_iterator)

        optimizer.zero_grad()

        with torch.cuda.amp.autocast(enabled=automatic_mixed_precision):
            loss = policy_value_net.forward_loss(
                train_batch=train_batch,
                policy_loss_type=policy_loss_type,
                policy_loss_weight=policy_loss_weight,
                action_values_loss_weight=action_values_loss_weight,
                state_value_loss_weight=state_value_loss_weight,
            )
        if automatic_mixed_precision:
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()

        loss_value = loss.item()
        loss_values.append(loss_value)

        if iteration % print_loss_iters == 0:
            mean_loss_value = sum(loss_values) / len(loss_values)
            std_loss_value = float(np.std(loss_values))
            max_loss_value = max(loss_values)
            min_loss_value = min(loss_values)
            print(
                f"train_loss_value(iteration={iteration}):"
                f" mean={mean_loss_value:.6f}"
                f" std={std_loss_value:.6f}"
                f" max={max_loss_value:.6f}"
                f" min={min_loss_value:.6f}"
            )
            loss_history.append({
                "iteration": iteration,
                "mean_loss_value": mean_loss_value,
                "std_loss_value": std_loss_value,
                "max_loss_value": max_loss_value,
                "min_loss_value": min_loss_value,
            })
            with open(training_dirpath / "loss_history.json", "w") as f:
                json.dump(loss_history, f, indent=4)

        if iteration % save_checkpoint_iters == 0:
            policy_value_net_savepath = training_dirpath / f"policy_value_net_{iteration}.pt"
            torch.save(policy_value_net.state_dict(), policy_value_net_savepath)
            print(f"policy_value_net saved to {policy_value_net_savepath} successfully!")

        if iteration in lr_schedule:
            set_learning_rate(optimizer, lr_value=lr_schedule[iteration])

        if iteration in bnm_schedule:
            set_batch_norm_momentum(policy_value_net, bnm_value=bnm_schedule[iteration])


def train_batch_generator(
    dataset: Dict[str, List[dict]], batch_size: int, device: torch.device
) -> Iterator[dict]:
    sample_datapoint_iterator = sample_datapoint_generator(dataset=dataset)
    while True:
        datapoints = [next(sample_datapoint_iterator) for i in range(batch_size)]
        datapoints = [preprocessing(datapoint) for datapoint in datapoints]
        for datapoint in datapoints:
            random_orientation_inplace(datapoint)
        yield make_batch(datapoints, device=device)


def sample_datapoint_generator(dataset: Dict[str, List[dict]]) -> Iterator[dict]:
    keys = list(dataset.keys())
    for key in keys:
        random.shuffle(dataset[key])
    idxs = {key: 0 for key in keys}
    while True:
        random.shuffle(keys)
        for key in keys:
            yield dataset[key][idxs[key]]
            idxs[key] += 1
            if idxs[key] >= len(dataset[key]):
                random.shuffle(dataset[key])
                idxs[key] = 0


def preprocessing(datapoint: dict) -> dict:
    uttt = UltimateTicTacToe(state=datapoint["state"])
    input_4x9x9 = get_state_ndarray_4x9x9(uttt=uttt)
    state_value = datapoint["value"]
    actions_index = datapoint["actions"][0]
    actions_probability = datapoint["actions"][1]
    actions_value = datapoint["actions"][2]
    policy_mask_9x9 = np.zeros(shape=(9, 9), dtype=bool)
    policy_targets_9x9 = np.zeros(shape=(9, 9), dtype=np.float32)
    action_values_9x9 = np.zeros(shape=(9, 9), dtype=np.float32)
    for i, action_index in enumerate(actions_index):
        r_i = row_index(action_index)
        c_i = col_index(action_index)
        policy_mask_9x9[r_i, c_i] = True
        policy_targets_9x9[r_i, c_i] = actions_probability[i]
        action_values_9x9[r_i, c_i] = actions_value[i]
    return {
        "input": input_4x9x9,
        "target": {
            "policy_mask": policy_mask_9x9,
            "policy_targets": policy_targets_9x9,
            "action_values": action_values_9x9,
            "state_value": state_value,
        },
    }


def random_orientation_inplace(datapoint: dict) -> None:
    if random.randint(0, 1):
        datapoint["input"] = np.flip(datapoint["input"], 1)
        datapoint["target"]["policy_mask"] = np.flip(datapoint["target"]["policy_mask"], 0)
        datapoint["target"]["policy_targets"] = np.flip(datapoint["target"]["policy_targets"], 0)
        datapoint["target"]["action_values"] = np.flip(datapoint["target"]["action_values"], 0)
    if random.randint(0, 1):
        datapoint["input"] = np.flip(datapoint["input"], 2)
        datapoint["target"]["policy_mask"] = np.flip(datapoint["target"]["policy_mask"], 1)
        datapoint["target"]["policy_targets"] = np.flip(datapoint["target"]["policy_targets"], 1)
        datapoint["target"]["action_values"] = np.flip(datapoint["target"]["action_values"], 1)
    if random.randint(0, 1):
        datapoint["input"] = np.rollaxis(datapoint["input"], 2, 1)
        datapoint["target"]["policy_mask"] = np.rollaxis(datapoint["target"]["policy_mask"], 1, 0)
        datapoint["target"]["policy_targets"] = np.rollaxis(datapoint["target"]["policy_targets"], 1, 0)
        datapoint["target"]["action_values"] = np.rollaxis(datapoint["target"]["action_values"], 1, 0)


def make_batch(datapoints: List[dict], device: torch.device) -> dict:
    inputs = np.stack([datapoint["input"] for datapoint in datapoints])
    policy_mask = np.stack([datapoint["target"]["policy_mask"] for datapoint in datapoints])
    policy_targets = np.stack([datapoint["target"]["policy_targets"] for datapoint in datapoints])
    action_values = np.stack([datapoint["target"]["action_values"] for datapoint in datapoints])
    state_value = np.array([datapoint["target"]["state_value"] for datapoint in datapoints], dtype=np.float32)
    inputs = torch.from_numpy(inputs).to(device=device, dtype=torch.float32)
    policy_mask = torch.from_numpy(policy_mask).to(device=device)
    policy_targets = torch.from_numpy(policy_targets).to(device=device)
    action_values = torch.from_numpy(action_values).to(device=device)
    state_value = torch.from_numpy(state_value).to(device=device)
    return {
        "inputs": inputs,
        "targets": {
            "policy_mask": policy_mask,
            "policy_targets": policy_targets,
            "action_values": action_values,
            "state_value": state_value,
        },
    }


def set_learning_rate(optimizer: torch.optim.Optimizer, lr_value: float) -> None:
    print(f"set_learning_rate({lr_value})")
    for param_group in optimizer.param_groups:
        param_group["lr"] = lr_value


def set_batch_norm_momentum(nn_module: torch.nn.Module, bnm_value: float) -> None:
    print(f"set_batch_norm_momentum({bnm_value})")
    for name, module in nn_module.named_modules():
        if str(module).startswith("BatchNorm"):
            module.momentum = bnm_value
