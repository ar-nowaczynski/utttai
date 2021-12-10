import argparse
import pathlib
import random

import torch
import torch.nn as nn

from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.policy_value_network import PolicyValueNetwork
from utttpy.selfplay.neural_monte_carlo_tree_search import (
    NeuralMonteCarloTreeSearch,
    serialize_evaluated_state,
    serialize_evaluated_actions,
)


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy_value_net_path", type=pathlib.Path, required=True)
    parser.add_argument("--uttt_state", type=str, required=True)
    parser.add_argument("--num_simulations", type=int, required=True)
    parser.add_argument("--exploration_strength", type=float, required=True)
    parser.add_argument("--random_seed", type=int, required=True)
    parser.add_argument("--output_path", type=pathlib.Path, required=True)
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


def main() -> None:
    args = run_argparse()
    print(args)

    random.seed(args.random_seed)

    policy_value_net = load_policy_value_net(
        state_dict_path=args.policy_value_net_path,
        device=args.device,
    )

    uttt = UltimateTicTacToe(state=bytearray(map(int, args.uttt_state)))

    nmcts = NeuralMonteCarloTreeSearch(
        uttt=uttt,
        num_simulations=args.num_simulations,
        exploration_strength=args.exploration_strength,
        policy_value_net=policy_value_net,
    )
    nmcts.run(progress_bar=True)
    print(nmcts)

    evaluated_state = nmcts.get_evaluated_state()
    evaluated_actions = nmcts.get_evaluated_actions()

    evaluated_state_str = serialize_evaluated_state(evaluated_state=evaluated_state)
    evaluated_actions_str = serialize_evaluated_actions(evaluated_actions=evaluated_actions)

    evaluation_str = f"{evaluated_state_str} {evaluated_actions_str}"
    print(evaluation_str)

    with open(args.output_path, "w") as f:
        f.write(evaluation_str + "\n")

    print(f"evaluation saved to {args.output_path} successfully!")


if __name__ == "__main__":
    main()
