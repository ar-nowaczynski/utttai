from typing import Tuple

import torch
import torch.nn as nn


class PolicyValueNetwork(nn.Module):

    DELETED_PARAMETERS = [
        "policy_head_values.0.weight",
        "policy_head_values.0.bias",
        "policy_head_values.2.weight",
        "policy_head_values.2.bias",
    ]

    def __init__(self, in_channels: int = 4, num_planes: int = 256):
        super(PolicyValueNetwork, self).__init__()

        # encoder
        self.conv_block_1 = nn.Sequential(
            nn.Conv2d(in_channels, num_planes // 2, kernel_size=3, stride=3, padding=0, bias=True),
            nn.ELU(),
        )
        self.conv_block_2 = nn.Sequential(
            nn.Conv2d(num_planes // 2, num_planes // 2, kernel_size=1, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(num_planes // 2),
            nn.ELU(),
            nn.Conv2d(num_planes // 2, num_planes, kernel_size=1, stride=1, padding=0, bias=True),
            nn.ReLU(),
        )
        self.conv_block_3a = nn.Sequential(
            nn.Conv2d(num_planes, num_planes * 2, kernel_size=1, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(num_planes * 2),
            nn.ELU(),
            nn.Conv2d(num_planes * 2, num_planes * 2, kernel_size=3, stride=1, padding=0, groups=num_planes * 2, bias=False),
            nn.BatchNorm2d(num_planes * 2),
            nn.ELU(),
            nn.ConvTranspose2d(num_planes * 2, num_planes, kernel_size=3, stride=1, padding=0, bias=True),
        )
        self.conv_block_3b = nn.Sequential(
            nn.Conv2d(num_planes, num_planes * 2, kernel_size=1, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(num_planes * 2),
            nn.ELU(),
            nn.Conv2d(num_planes * 2, num_planes * 2, kernel_size=3, stride=1, padding=0, groups=num_planes * 2, bias=False),
            nn.BatchNorm2d(num_planes * 2),
            nn.ELU(),
            nn.ConvTranspose2d(num_planes * 2, num_planes, kernel_size=3, stride=1, padding=0, bias=True),
        )
        self.conv_block_3c = nn.Sequential(
            nn.Conv2d(num_planes, num_planes * 2, kernel_size=1, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(num_planes * 2),
            nn.ELU(),
            nn.Conv2d(num_planes * 2, num_planes * 2, kernel_size=3, stride=1, padding=0, groups=num_planes * 2, bias=False),
            nn.BatchNorm2d(num_planes * 2),
            nn.ELU(),
            nn.ConvTranspose2d(num_planes * 2, num_planes, kernel_size=3, stride=1, padding=0, bias=True),
        )

        # policy head
        self.policy_head_conv = nn.Sequential(
            nn.Conv2d(5 * num_planes // 2, num_planes, kernel_size=1, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(num_planes),
            nn.ELU(),
        )
        self.policy_head_upsampling = nn.Sequential(
            nn.ConvTranspose2d(num_planes, num_planes, kernel_size=3, stride=3, padding=0, bias=True),
            nn.ELU(),
        )
        self.policy_head_logits = nn.Sequential(
            nn.Conv2d(in_channels + num_planes, 128, kernel_size=1, stride=1, padding=0, bias=True),
            nn.ELU(),
            nn.Conv2d(128, 1, kernel_size=1, stride=1, padding=0, bias=True),
        )

        # value head
        self.value_head_conv1 = nn.Sequential(
            nn.Conv2d(num_planes, num_planes, kernel_size=1, stride=1, padding=0, bias=True),
            nn.Conv2d(num_planes, num_planes, kernel_size=3, stride=1, padding=0, groups=num_planes, bias=False),
            nn.BatchNorm2d(num_planes),
            nn.ELU(),
        )
        self.value_head_conv2 = nn.Sequential(
            nn.Conv2d(num_planes, num_planes, kernel_size=1, stride=1, padding=0, bias=True),
            nn.Conv2d(num_planes, num_planes, kernel_size=3, stride=1, padding=0, groups=num_planes, bias=False),
            nn.BatchNorm2d(num_planes),
            nn.ELU(),
        )
        self.value_head_fc = nn.Sequential(
            nn.Linear(2 * num_planes, 128, bias=True),
            nn.ELU(),
            nn.Linear(128, 1, bias=True),
            nn.Tanh(),
        )

        self.in_channels = in_channels
        self.num_planes = num_planes

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        batch_size = x.size(0)

        x1 = self.conv_block_1(x)
        x2 = self.conv_block_2(x1)
        x3 = torch.relu(self.conv_block_3a(x2) + x2)
        x3 = torch.relu(self.conv_block_3b(x3) + x3)
        x3 = torch.relu(self.conv_block_3c(x3) + x3)

        p = torch.cat([x1, x2, x3], dim=1)
        p = self.policy_head_conv(p)
        p = self.policy_head_upsampling(p)
        p = torch.cat([x, p], dim=1)
        pl = self.policy_head_logits(p)
        pl = pl.clamp(-32, 32)
        pl = pl.squeeze(1)

        v1 = self.value_head_conv1(x2).view(batch_size, self.num_planes)
        v2 = self.value_head_conv2(x3).view(batch_size, self.num_planes)
        v = torch.cat([v1, v2], dim=1)
        sv = self.value_head_fc(v)
        sv = sv.squeeze(1)

        # policy_logits, state_value
        return pl, sv
