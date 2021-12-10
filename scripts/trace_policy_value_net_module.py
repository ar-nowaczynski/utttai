import argparse
import pathlib

import numpy as np
import torch

from utttpy.game.helpers import get_state_ndarray_4x9x9
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.policy_value_network import PolicyValueNetwork


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy_value_net_path", type=pathlib.Path, required=True)
    parser.add_argument("--device", type=torch.device, default="cpu")
    args = parser.parse_args()
    return args


def main() -> None:
    args = run_argparse()

    policy_value_net = PolicyValueNetwork()
    policy_value_net.to(device=args.device)

    state_dict = torch.load(args.policy_value_net_path, map_location=args.device)
    policy_value_net.load_state_dict(state_dict)

    policy_value_net.eval()

    uttt = UltimateTicTacToe()
    input_array_4x9x9 = get_state_ndarray_4x9x9(uttt=uttt)
    input_array_1x4x9x9 = np.expand_dims(input_array_4x9x9, axis=0)
    input_tensor_1x4x9x9 = torch.from_numpy(input_array_1x4x9x9)
    input_tensor_1x4x9x9 = input_tensor_1x4x9x9.to(device=args.device, dtype=torch.float32)

    traced_module = torch.jit.trace(policy_value_net, input_tensor_1x4x9x9)

    traced_module_output_name = f"{args.policy_value_net_path.stem}_traced{args.policy_value_net_path.suffix}"
    traced_module_output_path = args.policy_value_net_path.parent / traced_module_output_name

    torch.jit.save(traced_module, traced_module_output_path)
    print(f"traced PolicyValueNetwork module saved to {traced_module_output_path} successfully!")


if __name__ == "__main__":
    main()
