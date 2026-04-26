from __future__ import annotations

from typing import Sequence

import numpy as np
import pandas as pd

from .schemas import CausalEstimateResult, ToolWarning
from .utils import (
    clean_frame,
    fit_logistic_predict,
    is_binary,
    normal_ci,
    standardized_mean_difference,
    validate_columns
)


def estimate_psm(
    df: pd.DataFrame,
    treatment: str,
    outcome: str,
    covariates: Sequence[str],
    estimand: str = "att",
    caliper: float = 0.08,
    min_sample_size: int = 80
) -> dict:
    """Estimate a lightweight PSM ATT with transparent diagnostics.

    This is deliberately a teachable tool wrapper, not a full causal inference library.
    """
    warnings = validate_columns(df, treatment, outcome, covariates)
    if warnings:
        return _blocked_result("psm", estimand, warnings)

    data = clean_frame(df, treatment, outcome, covariates)
    if len(data) < min_sample_size:
        warnings.append(ToolWarning("small_sample", f"Only {len(data)} usable rows after dropping missing values."))
    if not is_binary(data[treatment]):
        warnings.append(ToolWarning("non_binary_treatment", "PSM wrapper expects binary treatment.", "blocker"))
        return _blocked_result("psm", estimand, warnings)

    treated_mask = data[treatment].astype(float).to_numpy() == 1
    control_mask = ~treated_mask
    if treated_mask.sum() < 10 or control_mask.sum() < 10:
        warnings.append(ToolWarning("insufficient_groups", "Need at least 10 treated and 10 control rows.", "blocker"))
        return _blocked_result("psm", estimand, warnings)

    x = data.loc[:, covariates].astype(float).to_numpy()
    t = data[treatment].astype(float).to_numpy()
    y = data[outcome].astype(float).to_numpy()
    propensity = fit_logistic_predict(x, t, x)
    data = data.assign(_propensity=propensity)

    treated_scores = propensity[treated_mask]
    control_scores = propensity[control_mask]
    support_low = max(float(treated_scores.min()), float(control_scores.min()))
    support_high = min(float(treated_scores.max()), float(control_scores.max()))
    common_support_ok = support_low < support_high
    if not common_support_ok:
        warnings.append(ToolWarning("no_common_support", "Treated and control propensity ranges do not overlap."))

    control_indices = np.where(control_mask)[0]
    diffs = []
    matched_rows = []
    for treated_idx in np.where(treated_mask)[0]:
        distances = np.abs(propensity[control_indices] - propensity[treated_idx])
        best_position = int(np.argmin(distances))
        best_distance = float(distances[best_position])
        if best_distance <= caliper:
            control_idx = int(control_indices[best_position])
            diffs.append(y[treated_idx] - y[control_idx])
            matched_rows.extend([treated_idx, control_idx])

    matched_count = len(diffs)
    matched_rate = matched_count / max(int(treated_mask.sum()), 1)
    if matched_rate < 0.5:
        warnings.append(
            ToolWarning(
                "low_matched_rate",
                f"Only {matched_rate:.1%} of treated rows were matched under caliper={caliper}."
            )
        )

    if matched_count == 0:
        warnings.append(ToolWarning("no_matches", "No treated rows found a control match.", "blocker"))
        return _blocked_result(
            "psm",
            estimand,
            warnings,
            diagnostics={
                "common_support_ok": common_support_ok,
                "support_range": [support_low, support_high],
                "matched_sample_rate": matched_rate
            }
        )

    effect = float(np.mean(diffs))
    std_error = float(np.std(diffs, ddof=1) / np.sqrt(matched_count)) if matched_count > 1 else None

    matched_data = data.iloc[sorted(set(matched_rows))].copy()
    smd_before = standardized_mean_difference(data, treatment, covariates)
    smd_after = standardized_mean_difference(matched_data, treatment, covariates)
    max_abs_smd_after = max(abs(value) for value in smd_after.values()) if smd_after else None
    if max_abs_smd_after is not None and max_abs_smd_after > 0.2:
        warnings.append(ToolWarning("poor_balance_after_matching", f"Max abs SMD after matching is {max_abs_smd_after:.3f}."))

    severe_warning = any(warning.severity == "blocker" for warning in warnings)
    causal_claim_allowed = (
        not severe_warning
        and common_support_ok
        and matched_rate >= 0.5
        and (max_abs_smd_after is None or max_abs_smd_after <= 0.2)
    )

    summary = (
        f"PSM {estimand.upper()} estimate is {effect:.4f}. "
        f"Matched {matched_count} treated rows ({matched_rate:.1%}); "
        f"causal claim allowed: {causal_claim_allowed}."
    )
    return CausalEstimateResult(
        method="psm",
        estimand=estimand,
        effect=effect,
        uncertainty=normal_ci(effect, std_error),
        diagnostics={
            "common_support_ok": common_support_ok,
            "support_range": [support_low, support_high],
            "treated_count": int(treated_mask.sum()),
            "control_count": int(control_mask.sum()),
            "matched_treated_count": matched_count,
            "matched_sample_rate": matched_rate,
            "max_abs_smd_before": max(abs(value) for value in smd_before.values()) if smd_before else None,
            "max_abs_smd_after": max_abs_smd_after,
            "smd_before": smd_before,
            "smd_after": smd_after
        },
        warnings=warnings,
        causal_claim_allowed=causal_claim_allowed,
        report_summary=summary
    ).to_dict()


def _blocked_result(method, estimand, warnings, diagnostics=None):
    return CausalEstimateResult(
        method=method,
        estimand=estimand,
        effect=None,
        uncertainty={"std_error": None, "ci_95": [None, None]},
        diagnostics=diagnostics or {},
        warnings=warnings,
        causal_claim_allowed=False,
        report_summary="Analysis blocked. Required data or diagnostics are not sufficient for a causal claim."
    ).to_dict()
