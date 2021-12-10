import argparse
import pathlib
import pickle
import random
from typing import Dict, List

import torch
import torch.nn as nn
from tqdm import tqdm

from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.evaluation_uttt_states import EVALUATION_UTTT_STATES
from utttpy.selfplay.policy_value_network import PolicyValueNetwork
from utttpy.selfplay.neural_monte_carlo_tree_search import NeuralMonteCarloTreeSearch


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--nmcts1_policy_value_net_path", type=pathlib.Path, required=True)
    parser.add_argument("--nmcts1_num_simulations", type=int, default=10_000)
    parser.add_argument("--nmcts1_exploration_strength", type=float, default=2.0)
    parser.add_argument("--nmcts2_policy_value_net_path", type=pathlib.Path, required=True)
    parser.add_argument("--nmcts2_num_simulations", type=int, default=10_000)
    parser.add_argument("--nmcts2_exploration_strength", type=float, default=2.0)
    parser.add_argument("--python_random_seed", type=int, default=10111213)
    parser.add_argument("--gamelines_output_path", type=pathlib.Path, required=True)
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


def play_nmctsX_vs_nmctsO(
    initial_uttt_state: str,
    nmctsX_policy_value_net: PolicyValueNetwork,
    nmctsX_num_simulations: int,
    nmctsX_exploration_strength: float,
    nmctsO_policy_value_net: PolicyValueNetwork,
    nmctsO_num_simulations: int,
    nmctsO_exploration_strength: float,
    python_random_seed: int,
) -> List[dict]:
    gameline = []
    random.seed(python_random_seed)
    uttt = UltimateTicTacToe(state=bytearray(map(int, initial_uttt_state)))
    nmctsX = NeuralMonteCarloTreeSearch(
        uttt=uttt.clone(),
        num_simulations=nmctsX_num_simulations,
        exploration_strength=nmctsX_exploration_strength,
        policy_value_net=nmctsX_policy_value_net,
    )
    nmctsO = NeuralMonteCarloTreeSearch(
        uttt=uttt.clone(),
        num_simulations=nmctsO_num_simulations,
        exploration_strength=nmctsO_exploration_strength,
        policy_value_net=nmctsO_policy_value_net,
    )
    while not uttt.is_terminated():
        if uttt.is_next_symbol_X():
            nmctsX.run(progress_bar=False)
            evaluated_state = nmctsX.get_evaluated_state()
            evaluated_actions = nmctsX.get_evaluated_actions()
            selected_action = nmctsX.select_action(evaluated_actions, "argmax")
        elif uttt.is_next_symbol_O():
            nmctsO.run(progress_bar=False)
            evaluated_state = nmctsO.get_evaluated_state()
            evaluated_actions = nmctsO.get_evaluated_actions()
            selected_action = nmctsO.select_action(evaluated_actions, "argmax")
        gameline.append({
            "evaluated_state": evaluated_state,
            "evaluated_actions": evaluated_actions,
            "selected_action": {
                "symbol": selected_action.symbol,
                "index": selected_action.index,
            },
        })
        uttt.execute(action=selected_action)
        nmctsX.synchronize(uttt=uttt)
        nmctsO.synchronize(uttt=uttt)
    gameline.append({
        "state": uttt.state.copy(),
    })
    return gameline


def print_gamelines_summary(gamelines: Dict[str, List[dict]]) -> None:
    # nmcts1X vs nmcts2O:
    num_winsX, num_drawsX, num_lossesX = 0, 0, 0
    for gameline in gamelines["nmcts1X_vs_nmcts2O"]:
        uttt = UltimateTicTacToe(state=gameline[-1]["state"])
        if uttt.is_result_X():
            num_winsX += 1
        elif uttt.is_result_draw():
            num_drawsX += 1
        elif uttt.is_result_O():
            num_lossesX += 1
    num_gamesX = len(gamelines["nmcts1X_vs_nmcts2O"])
    print(f"nmcts1X_vs_nmcts2O ({num_gamesX}): {num_winsX} {num_drawsX} {num_lossesX}")
    # nmcts1O vs nmcts2X:
    num_winsO, num_drawsO, num_lossesO = 0, 0, 0
    for gameline in gamelines["nmcts1O_vs_nmcts2X"]:
        uttt = UltimateTicTacToe(state=gameline[-1]["state"])
        if uttt.is_result_O():
            num_winsO += 1
        elif uttt.is_result_draw():
            num_drawsO += 1
        elif uttt.is_result_X():
            num_lossesO += 1
    num_gamesO = len(gamelines["nmcts1O_vs_nmcts2X"])
    print(f"nmcts1O_vs_nmcts2X ({num_gamesO}): {num_winsO} {num_drawsO} {num_lossesO}")
    num_games = num_gamesX + num_gamesO
    num_wins = num_winsX + num_winsO
    num_draws = num_drawsX + num_drawsO
    num_losses = num_lossesX + num_lossesO
    # nmcts1 vs nmcts2:
    print(f"nmcts1_vs_nmcts2 ({num_games}): {num_wins} {num_draws} {num_losses}")


def play_nmcts1_vs_nmcts2(
    nmcts1_policy_value_net: PolicyValueNetwork,
    nmcts1_num_simulations: int,
    nmcts1_exploration_strength: float,
    nmcts2_policy_value_net: PolicyValueNetwork,
    nmcts2_num_simulations: int,
    nmcts2_exploration_strength: float,
    python_random_seed: int,
    gamelines_output_path: pathlib.Path,
) -> None:
    gamelines = {
        "nmcts1X_vs_nmcts2O": [],
        "nmcts1O_vs_nmcts2X": [],
    }
    for evaluation_uttt_state in tqdm(EVALUATION_UTTT_STATES):
        # nmcts1X vs nmcts2O:
        gameline = play_nmctsX_vs_nmctsO(
            initial_uttt_state=evaluation_uttt_state,
            nmctsX_policy_value_net=nmcts1_policy_value_net,
            nmctsX_num_simulations=nmcts1_num_simulations,
            nmctsX_exploration_strength=nmcts1_exploration_strength,
            nmctsO_policy_value_net=nmcts2_policy_value_net,
            nmctsO_num_simulations=nmcts2_num_simulations,
            nmctsO_exploration_strength=nmcts2_exploration_strength,
            python_random_seed=python_random_seed,
        )
        gamelines["nmcts1X_vs_nmcts2O"].append(gameline)
        # nmcts1O vs nmcts2X:
        gameline = play_nmctsX_vs_nmctsO(
            initial_uttt_state=evaluation_uttt_state,
            nmctsX_policy_value_net=nmcts2_policy_value_net,
            nmctsX_num_simulations=nmcts2_num_simulations,
            nmctsX_exploration_strength=nmcts2_exploration_strength,
            nmctsO_policy_value_net=nmcts1_policy_value_net,
            nmctsO_num_simulations=nmcts1_num_simulations,
            nmctsO_exploration_strength=nmcts1_exploration_strength,
            python_random_seed=python_random_seed,
        )
        gamelines["nmcts1O_vs_nmcts2X"].append(gameline)
        # print and save gamelines:
        print_gamelines_summary(gamelines)
        with open(gamelines_output_path, "wb") as f:
            pickle.dump(gamelines, f)


def main() -> None:
    args = run_argparse()
    print(args)

    if args.gamelines_output_path.exists():
        raise RuntimeError(f"{args.gamelines_output_path} already exists!")

    nmcts1_policy_value_net = load_policy_value_net(
        state_dict_path=args.nmcts1_policy_value_net_path,
        device=args.device,
    )
    nmcts2_policy_value_net = load_policy_value_net(
        state_dict_path=args.nmcts2_policy_value_net_path,
        device=args.device,
    )

    play_nmcts1_vs_nmcts2(
        nmcts1_policy_value_net=nmcts1_policy_value_net,
        nmcts1_num_simulations=args.nmcts1_num_simulations,
        nmcts1_exploration_strength=args.nmcts1_exploration_strength,
        nmcts2_policy_value_net=nmcts2_policy_value_net,
        nmcts2_num_simulations=args.nmcts2_num_simulations,
        nmcts2_exploration_strength=args.nmcts2_exploration_strength,
        python_random_seed=args.python_random_seed,
        gamelines_output_path=args.gamelines_output_path,
    )


if __name__ == "__main__":
    main()
