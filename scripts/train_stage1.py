import argparse
import pathlib

import torch

from utttpy.paths import UTTT_DATASET_STAGE1_PATH
from utttpy.selfplay.datatools import load_mcts_dataset, merge_endgame_depths_inplace
from utttpy.selfplay.policy_value_network import PolicyValueNetwork
from utttpy.selfplay.training import train_policy_value_net


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--training_dirpath", type=pathlib.Path, required=True)
    parser.add_argument("--device", type=torch.device, default="cuda")
    args = parser.parse_args()
    return args


def main() -> None:
    args = run_argparse()

    print(f"training_dirpath: {repr(args.training_dirpath)}")
    args.training_dirpath.mkdir(parents=True, exist_ok=False)

    dataset = load_mcts_dataset(UTTT_DATASET_STAGE1_PATH)
    merge_endgame_depths_inplace(dataset)

    policy_value_net = PolicyValueNetwork()
    policy_value_net.to(device=args.device)

    train_policy_value_net(
        policy_value_net=policy_value_net,
        dataset=dataset,
        training_dirpath=args.training_dirpath,
        num_train_iters=100000,
        batch_size=2048,
        policy_loss_type="kl_divergence",
        policy_loss_weight=1.0,
        action_values_loss_weight=1.0,
        state_value_loss_weight=3.0,
        lr_schedule={
            0: 5e-5,
            1000: 1e-4,
            2000: 2e-4,
            3000: 3e-4,
            50000: 1e-4,
            85000: 3e-5,
        },
        bnm_schedule={
            95000: 0.02,
        },
        print_loss_iters=100,
        save_checkpoint_iters=10000,
        automatic_mixed_precision=True,
    )


if __name__ == "__main__":
    main()
