import torch
import torch.nn.functional as F


def policy_value_loss_function(
    policy_logits_predictions: torch.Tensor,
    action_values_predictions: torch.Tensor,
    state_value_predictions: torch.Tensor,
    policy_proba_targets: torch.Tensor,
    action_values_targets: torch.Tensor,
    state_value_targets: torch.Tensor,
    policy_mask: torch.Tensor,
    policy_loss_type: str = "cross_entropy",
    policy_loss_weight: float = 1.0,
    action_values_loss_weight: float = 1.0,
    state_value_loss_weight: float = 1.0,
) -> torch.Tensor:
    assert policy_logits_predictions.size() == policy_proba_targets.size()
    assert action_values_predictions.size() == action_values_targets.size()
    assert state_value_predictions.size() == state_value_targets.size()
    assert policy_logits_predictions.size() == policy_mask.size()
    assert policy_logits_predictions.size() == action_values_predictions.size()
    assert policy_logits_predictions.size(0) == state_value_predictions.size(0)
    batch_size = policy_logits_predictions.size(0)
    policy_logits_predictions = policy_logits_predictions.view(batch_size, -1)
    policy_proba_targets = policy_proba_targets.view(batch_size, -1)
    action_values_predictions = action_values_predictions.view(batch_size, -1)
    action_values_targets = action_values_targets.view(batch_size, -1)
    policy_mask = policy_mask.view(batch_size, -1)
    policy_predictions_log_softmax = masked_log_softmax(
        logits=policy_logits_predictions,
        mask=policy_mask,
    )
    if policy_loss_type == "cross_entropy":
        policy_loss = -torch.sum(policy_proba_targets * policy_predictions_log_softmax, dim=1)
    elif policy_loss_type == "kl_divergence":
        kl_div = F.kl_div(policy_predictions_log_softmax, policy_proba_targets, reduction="none")
        policy_loss = torch.sum(kl_div, dim=1)
    else:
        raise ValueError(f"unknown policy_loss_type={repr(policy_loss_type)}")
    masked_squared_loss = torch.pow((action_values_targets - action_values_predictions) * policy_mask, 2)
    action_values_loss = torch.sum(masked_squared_loss, dim=1)
    state_value_loss = torch.pow((state_value_targets - state_value_predictions), 2)
    policy_value_loss = (
        policy_loss * policy_loss_weight
        + action_values_loss * action_values_loss_weight
        + state_value_loss_weight * state_value_loss
    )
    mean_policy_value_loss = torch.mean(policy_value_loss)
    return mean_policy_value_loss


def masked_log_softmax(
    logits: torch.Tensor,
    mask: torch.Tensor,
    dim: int = 1,
    zero_fill_value: float = 1e-32,
) -> torch.Tensor:
    assert logits.size() == mask.size()
    logits_mask = torch.ones_like(logits)
    logits_mask[~mask] = zero_fill_value
    logits = logits + torch.log(logits_mask)
    return F.log_softmax(logits, dim=dim)
