import argparse
import pathlib
import pickle
import random
import re
import subprocess
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from tqdm import tqdm

from utttpy.game.action import Action
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.evaluation_uttt_states import EVALUATION_UTTT_STATES
from utttpy.selfplay.policy_value_network import PolicyValueNetwork
from utttpy.selfplay.neural_monte_carlo_tree_search import NeuralMonteCarloTreeSearch


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--nmcts_policy_value_net_path", type=pathlib.Path, required=True)
    parser.add_argument("--nmcts_num_simulations", type=int, default=10_000)
    parser.add_argument("--nmcts_exploration_strength", type=float, default=2.0)
    parser.add_argument("--mcts_evaluate_path", type=pathlib.Path, required=True)
    parser.add_argument("--mcts_evaluate_output", type=pathlib.Path, required=True)
    parser.add_argument("--mcts_num_simulations", type=int, default=10_000_000)
    parser.add_argument("--mcts_exploration_strength", type=float, default=2.0)
    parser.add_argument("--mcts_random_seed", type=int, default=20212223)
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


def read_mcts_evaluated_state(evaluate_output: pathlib.Path) -> dict:
    with open(evaluate_output, "r") as f:
        content = f.read().strip()
    match = re.match("evaluatedState{(.*?)}", content)
    if match is None:
        raise RuntimeError(f"cannot parse evaluated state from {evaluate_output}")
    evaluated_state_string = match.group(1)
    evaluated_state_values = evaluated_state_string.split(" ")
    evaluated_state = {}
    evaluated_state["state"] = bytearray(map(int, evaluated_state_values[0]))
    evaluated_state["num_visits"] = int(evaluated_state_values[1])
    evaluated_state["num_wins"] = int(evaluated_state_values[2])
    evaluated_state["num_draws"] = int(evaluated_state_values[3])
    evaluated_state["num_losses"] = int(evaluated_state_values[4])
    return evaluated_state


def read_mcts_evaluated_actions(evaluate_output: pathlib.Path) -> List[dict]:
    with open(evaluate_output, "r") as f:
        content = f.read().strip()
    match = re.match(".*evaluatedActions{(.*?)}", content)
    if match is None:
        raise RuntimeError(f"cannot parse evaluated actions from {evaluate_output}")
    evaluated_actions_string = match.group(1)
    evaluated_actions_values = evaluated_actions_string.split(",")
    evaluated_actions = []
    for evaluated_action_values in evaluated_actions_values:
        evaluated_action_values = list(map(int, evaluated_action_values.split(" ")))
        evaluated_action = {
            "symbol": evaluated_action_values[0],
            "index": evaluated_action_values[1],
            "num_visits": evaluated_action_values[2],
            "num_wins": evaluated_action_values[3],
            "num_draws": evaluated_action_values[4],
            "num_losses": evaluated_action_values[5],
        }
        evaluated_actions.append(evaluated_action)
    return evaluated_actions


def mcts_run(
    uttt: UltimateTicTacToe,
    evaluate_path: pathlib.Path,
    evaluate_output: pathlib.Path,
    num_simulations: int,
    exploration_strength: float,
    random_seed: int,
) -> Tuple[dict, List[dict]]:
    if not evaluate_path.is_file():
        raise RuntimeError(f"{evaluate_path} does not exist!")
    evaluate_command = [
        str(evaluate_path),
        "".join(map(str, uttt.state)),
        str(num_simulations),
        str(exploration_strength),
        str(random_seed),
        str(evaluate_output),
    ]
    returncode = subprocess.call(args=evaluate_command, stdout=subprocess.DEVNULL)
    if returncode:
        raise RuntimeError(f"returncode = {returncode}")
    evaluated_state = read_mcts_evaluated_state(evaluate_output)
    evaluated_actions = read_mcts_evaluated_actions(evaluate_output)
    return evaluated_state, evaluated_actions


def mcts_select_action(evaluated_actions: List[dict]) -> Action:
    max_num_visits = max(
        evaluated_action["num_visits"] for evaluated_action in evaluated_actions
    )
    top_evaluated_actions = [
        evaluated_action
        for evaluated_action in evaluated_actions
        if evaluated_action["num_visits"] >= max_num_visits
    ]
    selected_evaluated_action = random.choice(top_evaluated_actions)
    return Action(
        symbol=selected_evaluated_action["symbol"],
        index=selected_evaluated_action["index"],
    )


def play_nmctsX_vs_mctsO(
    initial_uttt_state: str,
    nmctsX_policy_value_net: PolicyValueNetwork,
    nmctsX_num_simulations: int,
    nmctsX_exploration_strength: float,
    mctsO_evaluate_path: pathlib.Path,
    mctsO_evaluate_output: pathlib.Path,
    mctsO_num_simulations: int,
    mctsO_exploration_strength: float,
    mctsO_random_seed: int,
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
    while not uttt.is_terminated():
        if uttt.is_next_symbol_X():
            nmctsX.run(progress_bar=False)
            evaluated_state = nmctsX.get_evaluated_state()
            evaluated_actions = nmctsX.get_evaluated_actions()
            selected_action = nmctsX.select_action(evaluated_actions, "argmax")
        elif uttt.is_next_symbol_O():
            evaluated_state, evaluated_actions = mcts_run(
                uttt=uttt,
                evaluate_path=mctsO_evaluate_path,
                evaluate_output=mctsO_evaluate_output,
                num_simulations=mctsO_num_simulations,
                exploration_strength=mctsO_exploration_strength,
                random_seed=mctsO_random_seed,
            )
            selected_action = mcts_select_action(evaluated_actions)
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
    gameline.append({
        "state": uttt.state.copy(),
    })
    return gameline


def play_nmctsO_vs_mctsX(
    initial_uttt_state: str,
    nmctsO_policy_value_net: PolicyValueNetwork,
    nmctsO_num_simulations: int,
    nmctsO_exploration_strength: float,
    mctsX_evaluate_path: pathlib.Path,
    mctsX_evaluate_output: pathlib.Path,
    mctsX_num_simulations: int,
    mctsX_exploration_strength: float,
    mctsX_random_seed: int,
    python_random_seed: int,
) -> List[dict]:
    gameline = []
    random.seed(python_random_seed)
    uttt = UltimateTicTacToe(state=bytearray(map(int, initial_uttt_state)))
    nmctsO = NeuralMonteCarloTreeSearch(
        uttt=uttt.clone(),
        num_simulations=nmctsO_num_simulations,
        exploration_strength=nmctsO_exploration_strength,
        policy_value_net=nmctsO_policy_value_net,
    )
    while not uttt.is_terminated():
        if uttt.is_next_symbol_O():
            nmctsO.run(progress_bar=False)
            evaluated_state = nmctsO.get_evaluated_state()
            evaluated_actions = nmctsO.get_evaluated_actions()
            selected_action = nmctsO.select_action(evaluated_actions, "argmax")
        elif uttt.is_next_symbol_X():
            evaluated_state, evaluated_actions = mcts_run(
                uttt=uttt,
                evaluate_path=mctsX_evaluate_path,
                evaluate_output=mctsX_evaluate_output,
                num_simulations=mctsX_num_simulations,
                exploration_strength=mctsX_exploration_strength,
                random_seed=mctsX_random_seed,
            )
            selected_action = mcts_select_action(evaluated_actions)
        gameline.append({
            "evaluated_state": evaluated_state,
            "evaluated_actions": evaluated_actions,
            "selected_action": {
                "symbol": selected_action.symbol,
                "index": selected_action.index,
            },
        })
        uttt.execute(action=selected_action)
        nmctsO.synchronize(uttt=uttt)
    gameline.append({
        "state": uttt.state.copy(),
    })
    return gameline


def print_gamelines_summary(gamelines: Dict[str, List[dict]]) -> None:
    # nmctsX vs mctsO:
    num_winsX, num_drawsX, num_lossesX = 0, 0, 0
    for gameline in gamelines["nmctsX_vs_mctsO"]:
        uttt = UltimateTicTacToe(state=gameline[-1]["state"])
        if uttt.is_result_X():
            num_winsX += 1
        elif uttt.is_result_draw():
            num_drawsX += 1
        elif uttt.is_result_O():
            num_lossesX += 1
    num_gamesX = len(gamelines["nmctsX_vs_mctsO"])
    print(f"nmctsX_vs_mctsO ({num_gamesX}): {num_winsX} {num_drawsX} {num_lossesX}")
    # nmctsO vs mctsX:
    num_winsO, num_drawsO, num_lossesO = 0, 0, 0
    for gameline in gamelines["nmctsO_vs_mctsX"]:
        uttt = UltimateTicTacToe(state=gameline[-1]["state"])
        if uttt.is_result_O():
            num_winsO += 1
        elif uttt.is_result_draw():
            num_drawsO += 1
        elif uttt.is_result_X():
            num_lossesO += 1
    num_gamesO = len(gamelines["nmctsO_vs_mctsX"])
    print(f"nmctsO_vs_mctsX ({num_gamesO}): {num_winsO} {num_drawsO} {num_lossesO}")
    num_games = num_gamesX + num_gamesO
    num_wins = num_winsX + num_winsO
    num_draws = num_drawsX + num_drawsO
    num_losses = num_lossesX + num_lossesO
    # nmcts vs mcts:
    print(f"nmcts_vs_mcts ({num_games}): {num_wins} {num_draws} {num_losses}")


def play_nmcts_vs_mcts(
    nmcts_policy_value_net: PolicyValueNetwork,
    nmcts_num_simulations: int,
    nmcts_exploration_strength: float,
    mcts_evaluate_path: pathlib.Path,
    mcts_evaluate_output: pathlib.Path,
    mcts_num_simulations: int,
    mcts_exploration_strength: float,
    mcts_random_seed: float,
    python_random_seed: int,
    gamelines_output_path: pathlib.Path,
) -> None:
    gamelines = {
        "nmctsX_vs_mctsO": [],
        "nmctsO_vs_mctsX": [],
    }
    for evaluation_uttt_state in tqdm(EVALUATION_UTTT_STATES):
        # nmctsX vs mctsO:
        gameline = play_nmctsX_vs_mctsO(
            initial_uttt_state=evaluation_uttt_state,
            nmctsX_policy_value_net=nmcts_policy_value_net,
            nmctsX_num_simulations=nmcts_num_simulations,
            nmctsX_exploration_strength=nmcts_exploration_strength,
            mctsO_evaluate_path=mcts_evaluate_path,
            mctsO_evaluate_output=mcts_evaluate_output,
            mctsO_num_simulations=mcts_num_simulations,
            mctsO_exploration_strength=mcts_exploration_strength,
            mctsO_random_seed=mcts_random_seed,
            python_random_seed=python_random_seed,
        )
        gamelines["nmctsX_vs_mctsO"].append(gameline)
        # nmctsO vs mctsX:
        gameline = play_nmctsO_vs_mctsX(
            initial_uttt_state=evaluation_uttt_state,
            nmctsO_policy_value_net=nmcts_policy_value_net,
            nmctsO_num_simulations=nmcts_num_simulations,
            nmctsO_exploration_strength=nmcts_exploration_strength,
            mctsX_evaluate_path=mcts_evaluate_path,
            mctsX_evaluate_output=mcts_evaluate_output,
            mctsX_num_simulations=mcts_num_simulations,
            mctsX_exploration_strength=mcts_exploration_strength,
            mctsX_random_seed=mcts_random_seed,
            python_random_seed=python_random_seed,
        )
        gamelines["nmctsO_vs_mctsX"].append(gameline)
        # print and save gamelines:
        print_gamelines_summary(gamelines)
        with open(gamelines_output_path, "wb") as f:
            pickle.dump(gamelines, f)


def main() -> None:
    args = run_argparse()
    print(args)

    if args.gamelines_output_path.exists():
        raise RuntimeError(f"{args.gamelines_output_path} already exists!")

    nmcts_policy_value_net = load_policy_value_net(
        state_dict_path=args.nmcts_policy_value_net_path,
        device=args.device,
    )

    play_nmcts_vs_mcts(
        nmcts_policy_value_net=nmcts_policy_value_net,
        nmcts_num_simulations=args.nmcts_num_simulations,
        nmcts_exploration_strength=args.nmcts_exploration_strength,
        mcts_evaluate_path=args.mcts_evaluate_path,
        mcts_evaluate_output=args.mcts_evaluate_output,
        mcts_num_simulations=args.mcts_num_simulations,
        mcts_exploration_strength=args.mcts_exploration_strength,
        mcts_random_seed=args.mcts_random_seed,
        python_random_seed=args.python_random_seed,
        gamelines_output_path=args.gamelines_output_path,
    )


if __name__ == "__main__":
    main()
