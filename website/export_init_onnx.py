import argparse
import pathlib

import torch
import torch.nn as nn


def run_argparse() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--init_onnx_path", type=pathlib.Path, required=True)
    args = parser.parse_args()
    return args


class InitONNX(nn.Module):

    def __init__(self):
        super(InitONNX, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(16, 4),
            nn.Linear(4, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        y = self.layers(x)
        return y


def main() -> None:
    args = run_argparse()
    torch.manual_seed(123)
    init_onnx = InitONNX()
    input_tensor = torch.randn(1, 16)
    torch.onnx.export(
        init_onnx,
        input_tensor,
        args.init_onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=["x"],
        output_names=["y"],
        verbose=False,
    )


if __name__ == "__main__":
    main()
