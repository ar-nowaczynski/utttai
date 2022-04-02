import argparse
import pathlib
import random
import time
from typing import List, Optional

import numpy as np
import onnx
import onnxruntime
import torch
import torch.nn as nn

from utttpy.game.helpers import get_state_ndarray_4x9x9
from utttpy.game.ultimate_tic_tac_toe import UltimateTicTacToe
from utttpy.selfplay.policy_value_network import PolicyValueNetwork


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy_value_net_path", type=pathlib.Path, required=True)
    parser.add_argument("--policy_value_net_onnx_path", type=pathlib.Path, required=True)
    args = parser.parse_args()
    return args


def load_policy_value_net(state_dict_path: pathlib.Path, device: torch.device) -> nn.Module:
    policy_value_net = PolicyValueNetwork(onnx_export=True)
    policy_value_net.to(device=device)
    state_dict = torch.load(state_dict_path, map_location=device)
    policy_value_net_keys = set(policy_value_net.state_dict().keys())
    for key in list(state_dict.keys()):
        if key not in policy_value_net_keys:
            del state_dict[key]
    policy_value_net.load_state_dict(state_dict)
    policy_value_net.eval()
    return policy_value_net


def get_random_uttt(
    depth: int, seed: Optional[int] = None, max_num_retries: int = 100
) -> UltimateTicTacToe:
    random.seed(seed)
    uttt = UltimateTicTacToe()
    d = 0
    num_retries = 0
    while d < depth:
        if uttt.is_terminated():
            uttt = UltimateTicTacToe()
            d = 0
            num_retries += 1
            if num_retries >= max_num_retries:
                raise RuntimeError(f"max_num_retries={max_num_retries} exceeded!")
        uttt.execute(action=random.choice(uttt.get_legal_actions()))
        d += 1
    return uttt


def get_random_input_arrays(num_input_arrays: int) -> List[np.ndarray]:
    input_arrays = []
    for i in range(num_input_arrays):
        uttt = get_random_uttt(depth=i % 70, seed=i)
        input_array = get_state_ndarray_4x9x9(uttt)
        input_array = np.expand_dims(input_array, axis=0)
        input_arrays.append(input_array)
    return input_arrays


def export_policy_value_net_onnx(
    policy_value_net: nn.Module,
    input_tensor: torch.Tensor,
    policy_value_net_onnx_path: pathlib.Path,
) -> None:
    torch.onnx.export(
        policy_value_net,
        input_tensor,
        policy_value_net_onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["policy_logits", "state_value"],
        verbose=True,
    )


def check_policy_value_net_onnx(policy_value_net_onnx_path: pathlib.Path) -> None:
    policy_value_net_onnx = onnx.load(str(policy_value_net_onnx_path))
    onnx.checker.check_model(policy_value_net_onnx)


def compute_torch_outputs(
    policy_value_net: nn.Module, input_arrays: List[np.ndarray]
) -> List[List[np.ndarray]]:
    torch_outputs = []
    runtime, runcount = 0.0, 0
    for i, input_array in enumerate(input_arrays):
        input_tensor = torch.from_numpy(input_array).float()
        with torch.no_grad():
            start_time = time.perf_counter()
            policy_logits, state_value = policy_value_net(input_tensor)
            end_time = time.perf_counter()
            if i >= 10:
                runtime += end_time - start_time
                runcount += 1
            torch_output = [policy_logits, state_value]
            torch_output = [tensor.numpy().copy() for tensor in torch_output]
            torch_outputs.append(torch_output)
    avg_runtime = runtime / runcount
    print(f"compute_torch_outputs: runtime={avg_runtime:.6f}")
    return torch_outputs


def compute_onnxruntime_outputs(
    policy_value_net_onnx_path: pathlib.Path, input_arrays: List[np.ndarray]
) -> List[List[np.ndarray]]:
    onnxruntime_outputs = []
    runtime, runcount = 0.0, 0
    ort_session = onnxruntime.InferenceSession(str(policy_value_net_onnx_path))
    for i, input_array in enumerate(input_arrays):
        ort_inputs = {"input": input_array.astype(np.float32)}
        start_time = time.perf_counter()
        ort_outputs = ort_session.run(None, ort_inputs)
        policy_logits, state_value = ort_outputs
        end_time = time.perf_counter()
        if i >= 10:
            runtime += end_time - start_time
            runcount += 1
        onnxruntime_output = [policy_logits, state_value]
        onnxruntime_outputs.append(onnxruntime_output)
    avg_runtime = runtime / runcount
    print(f"compute_onnxruntime_outputs: runtime={avg_runtime:.6f}")
    return onnxruntime_outputs


def compare_outputs(
    torch_outputs: List[List[np.ndarray]],
    onnxruntime_outputs: List[List[np.ndarray]],
    rtol: float,
    atol: float,
) -> None:
    assert type(torch_outputs) == type(onnxruntime_outputs)
    assert len(torch_outputs) == len(onnxruntime_outputs)
    for torch_output, onnxruntime_output in zip(torch_outputs, onnxruntime_outputs):
        assert type(torch_output) == type(onnxruntime_output)
        assert len(torch_output) == len(onnxruntime_output)
        for torch_array, onnxruntime_array in zip(torch_output, onnxruntime_output):
            assert torch_array.shape == onnxruntime_array.shape
            np.testing.assert_allclose(torch_array, onnxruntime_array, rtol=rtol, atol=atol)


def main() -> None:
    args = run_argparse()
    print(args)

    policy_value_net = load_policy_value_net(
        state_dict_path=args.policy_value_net_path,
        device=torch.device("cpu"),
    )

    input_arrays = get_random_input_arrays(num_input_arrays=700)

    export_policy_value_net_onnx(
        policy_value_net=policy_value_net,
        input_tensor=torch.from_numpy(input_arrays[0]).float(),
        policy_value_net_onnx_path=args.policy_value_net_onnx_path,
    )

    check_policy_value_net_onnx(
        policy_value_net_onnx_path=args.policy_value_net_onnx_path,
    )

    torch_outputs = compute_torch_outputs(
        policy_value_net=policy_value_net,
        input_arrays=input_arrays,
    )

    print(f"len(torch_outputs) = {len(torch_outputs)}")

    onnxruntime_outputs = compute_onnxruntime_outputs(
        policy_value_net_onnx_path=args.policy_value_net_onnx_path,
        input_arrays=input_arrays,
    )

    print(f"len(onnxruntime_outputs) = {len(onnxruntime_outputs)}")

    compare_outputs(
        torch_outputs=torch_outputs,
        onnxruntime_outputs=onnxruntime_outputs,
        rtol=2e-5,
        atol=2e-5,
    )

    print("All comparison tests passed successfully!")


if __name__ == "__main__":
    main()
