import argparse
import pathlib
import queue
import random
from collections import deque
from multiprocessing.queues import Queue
from typing import List

import torch
import torch.nn as nn

from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.policy_value_network import PolicyValueNetwork
from utttpy.selfplay.neural_monte_carlo_tree_search import (
    NeuralMonteCarloTreeSearchWorker,
    serialize_evaluated_state,
    serialize_evaluated_actions,
)


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy_value_net_path", type=pathlib.Path, required=True)
    parser.add_argument("--task_list_path", type=pathlib.Path, required=True)
    parser.add_argument("--num_workers", type=int, required=True)
    parser.add_argument("--device", type=torch.device, default="cuda")
    args = parser.parse_args()
    return args


def load_policy_value_net(state_dict_path: pathlib.Path, device: torch.device) -> nn.Module:
    policy_value_net = PolicyValueNetwork()
    policy_value_net.to(device=device)
    state_dict = torch.load(state_dict_path, map_location=device)
    policy_value_net.load_state_dict(state_dict)
    policy_value_net.eval()
    return policy_value_net


def load_tasks(task_list_path: pathlib.Path) -> List[str]:
    with open(task_list_path, "r") as f:
        task_list = f.read().strip().split("\n")
    return task_list


def nmcts_worker(
    worker_id: int,
    task_queue: Queue,
    input_queue: Queue,
    prediction_queue: Queue,
    idle_queue: Queue,
) -> None:
    idle_queue.put(worker_id)
    while True:
        task = task_queue.get()
        print(f"nmcts_worker[{worker_id}]: received task {repr(task)}")
        if task is None:
            return

        task_args = task.split()
        uttt_state_str = task_args[0]
        num_simulations = int(task_args[1])
        exploration_strength = float(task_args[2])
        random_seed = int(task_args[3])
        output_path = task_args[4]

        random.seed(random_seed)
        uttt = UltimateTicTacToe(state=bytearray(map(int, uttt_state_str)))
        nmctsw = NeuralMonteCarloTreeSearchWorker(
            uttt=uttt.clone(),
            num_simulations=num_simulations,
            exploration_strength=exploration_strength,
            worker_id=worker_id,
            input_queue=input_queue,
            prediction_queue=prediction_queue,
        )
        evaluations_str = ""
        while not uttt.is_terminated():
            nmctsw.run(progress_bar=False)
            evaluated_state = nmctsw.get_evaluated_state()
            evaluated_actions = nmctsw.get_evaluated_actions()
            evaluated_state_str = serialize_evaluated_state(evaluated_state=evaluated_state)
            evaluated_actions_str = serialize_evaluated_actions(evaluated_actions=evaluated_actions)
            evaluation_str = f"{evaluated_state_str} {evaluated_actions_str}"
            evaluations_str += f"{evaluation_str}\n"
            selected_action = nmctsw.select_action(evaluated_actions=evaluated_actions, selection_method="sample")
            uttt.execute(action=selected_action)
            nmctsw.synchronize(uttt=uttt)
        with open(output_path, "w") as f:
            f.write(evaluations_str)
        print(f"nmcts_worker[{worker_id}]: evaluations saved to {output_path} successfully!")

        idle_queue.put(worker_id)


def nmcts_generate_parallel(
    policy_value_net: nn.Module, tasks: List[str], num_workers: int
) -> None:
    task_queues = [torch.multiprocessing.Queue() for i in range(num_workers)]
    input_queue = torch.multiprocessing.Queue()
    prediction_queues = [torch.multiprocessing.Queue() for i in range(num_workers)]
    idle_queue = torch.multiprocessing.Queue()
    processes = {}
    for worker_id in range(num_workers):
        process = torch.multiprocessing.Process(
            target=nmcts_worker,
            args=(
                worker_id,
                task_queues[worker_id],
                input_queue,
                prediction_queues[worker_id],
                idle_queue,
            ),
        )
        process.start()
        processes[worker_id] = process

    tasks = deque(tasks)
    while len(processes) > 0:

        while not idle_queue.empty():
            worker_id = idle_queue.get_nowait()
            if len(tasks) > 0:
                task = tasks.popleft()
                task_queues[worker_id].put(task)
            else:
                task_queues[worker_id].put(None)
                print(f"process[worker_id={worker_id}] joining...")
                processes[worker_id].join()
                print(f"process[worker_id={worker_id}] closing...")
                processes[worker_id].close()
                print(f"process[worker_id={worker_id}] closed successfully!")
                del processes[worker_id]
                print(f"process[worker_id={worker_id}] deleted successfully!")

        batch_size = len(processes)
        input_tensors = []
        input_worker_ids = []
        while len(input_tensors) < batch_size:
            try:
                worker_input = input_queue.get(timeout=0.001)
                input_worker_id, input_tensor = worker_input
                input_tensors.append(input_tensor)
                input_worker_ids.append(input_worker_id)
            except queue.Empty:
                batch_size = len(input_tensors)

        if batch_size == 0:
            continue

        inputs = torch.stack(input_tensors).to(device=policy_value_net.device)
        del input_tensors
        with torch.no_grad():
            policy_logits, action_values, state_value = policy_value_net(inputs)
        del inputs, action_values
        policy_logits = policy_logits.cpu()
        state_value = state_value.cpu()
        for i in range(batch_size):
            prediction_queues[input_worker_ids[i]].put(
                (policy_logits[i], state_value[i].item())
            )
        del policy_logits, state_value, input_worker_ids

    print("nmcts_generate_parallel has finished successfully!")


def main() -> None:
    args = run_argparse()
    print(args)

    policy_value_net = load_policy_value_net(
        state_dict_path=args.policy_value_net_path,
        device=args.device,
    )

    tasks = load_tasks(task_list_path=args.task_list_path)

    nmcts_generate_parallel(
        policy_value_net=policy_value_net,
        tasks=tasks,
        num_workers=args.num_workers,
    )


if __name__ == "__main__":
    main()
