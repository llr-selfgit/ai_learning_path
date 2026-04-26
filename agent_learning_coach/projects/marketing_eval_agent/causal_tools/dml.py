from __future__ import annotations

from typing import Sequence

import numpy as np
import pandas as pd

from .schemas import CausalEstimateResult, ToolWarning
from .utils import clean_frame, fit_linear_predict, fit_logistic_predict, is_binary, normal_ci, validate_columns


def estimate_dml(
    df: pd.DataFrame,
    treatment: str,
    outcome: str,
    covariates: Sequence[str],
    estimand: str = "ate",
    n_folds: int = 3,
    min_sample_size: int = 120
) -> dict:
    """A compact partially linear DML implementation with cross-fitting."""
    warnings = validate_columns(df, treatment, outcome, covariates)
    if warnings:
        return _blocked_result("dml", estimand, warnings)

    data = clean_frame(df, treatment, outcome, covariates)
    if len(data) < min_sample_size:
        warnings.append(ToolWarning("small_sample", f"Only {len(data)} usable rows; DML is unstable with small samples."))

    n_folds = max(2, min(n_folds, len(data)))
    rng = np.random.default_rng(20260427)
    indices = np.arange(len(data))
    rng.shuffle(indices)
    folds = np.array_split(indices, n_folds)

    x = data.loc[:, covariates].astype(float).to_numpy()
    t = data[treatment].astype(float).to_numpy()
    y = data[outcome].astype(float).to_numpy()
    binary_treatment = is_binary(t)

    y_hat = np.zeros(len(data))
    t_hat = np.zeros(len(data))
    for fold in folds:
        train = np.setdiff1d(indices, fold)
        y_hat[fold] = fit_linear_predict(x[train], y[train], x[fold])
        if binary_treatment:
            t_hat[fold] = fit_logistic_predict(x[train], t[train], x[fold])
        else:
            t_hat[fold] = fit_linear_predict(x[train], t[train], x[fold])

    y_res = y - y_hat
    t_res = t - t_hat
    denom = float(t_res @ t_res)
    if denom < 1e-10:
        warnings.append(ToolWarning("weak_treatment_residual", "Treatment residual variance is too small.", "blocker"))
        return _blocked_result("dml", estimand, warnings)

    theta = float((t_res @ y_res) / denom)
    residual = y_res - theta * t_res
    sigma2 = float((residual @ residual) / max(len(data) - 1, 1))
    std_error = float(np.sqrt(sigma2 / denom))
    causal_claim_allowed = not any(warning.severity == "blocker" for warning in warnings) and len(data) >= 80

    return CausalEstimateResult(
        method="dml",
        estimand=estimand,
        effect=theta,
        uncertainty=normal_ci(theta, std_error),
        diagnostics={
            "n": int(len(data)),
            "n_folds": int(n_folds),
            "binary_treatment": bool(binary_treatment),
            "treatment_residual_variance": float(np.var(t_res)),
            "outcome_residual_variance": float(np.var(y_res))
        },
        warnings=warnings,
        causal_claim_allowed=causal_claim_allowed,
        report_summary=f"DML {estimand.upper()} estimate is {theta:.4f}; causal claim allowed: {causal_claim_allowed}."
    ).to_dict()


def _blocked_result(method, estimand, warnings):
    return CausalEstimateResult(
        method=method,
        estimand=estimand,
        effect=None,
        uncertainty={"std_error": None, "ci_95": [None, None]},
        diagnostics={},
        warnings=warnings,
        causal_claim_allowed=False,
        report_summary="Analysis blocked. DML prerequisites are not satisfied."
    ).to_dict()
