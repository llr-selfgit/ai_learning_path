from __future__ import annotations

from typing import Sequence

import numpy as np
import pandas as pd

from .schemas import CausalEstimateResult, ToolWarning
from .utils import clean_frame, fit_linear_predict, is_binary, validate_columns


def estimate_t_learner_uplift(
    df: pd.DataFrame,
    treatment: str,
    outcome: str,
    covariates: Sequence[str],
    top_fraction: float = 0.2
) -> dict:
    warnings = validate_columns(df, treatment, outcome, covariates)
    if warnings:
        return _blocked_result("t_learner_uplift", warnings)
    data = clean_frame(df, treatment, outcome, covariates)
    if not is_binary(data[treatment]):
        warnings.append(ToolWarning("non_binary_treatment", "T-learner uplift expects binary treatment.", "blocker"))
        return _blocked_result("t_learner_uplift", warnings)

    treated = data[treatment].astype(float).to_numpy() == 1
    if treated.sum() < 20 or (~treated).sum() < 20:
        warnings.append(ToolWarning("small_group", "Need at least 20 rows per treatment group for a stable uplift ranking."))

    x = data.loc[:, covariates].astype(float).to_numpy()
    y = data[outcome].astype(float).to_numpy()
    pred_t = fit_linear_predict(x[treated], y[treated], x)
    pred_c = fit_linear_predict(x[~treated], y[~treated], x)
    ite = pred_t - pred_c
    diagnostics = _uplift_diagnostics(data, treatment, outcome, ite, top_fraction)
    avg_uplift = float(np.mean(ite))
    return CausalEstimateResult(
        method="t_learner_uplift",
        estimand="ite_ranking",
        effect=avg_uplift,
        uncertainty={"std_error": None, "ci_95": [None, None]},
        diagnostics=diagnostics,
        warnings=warnings,
        causal_claim_allowed=False,
        report_summary=(
            f"T-learner estimates average ITE {avg_uplift:.4f}. "
            "Use this as heterogeneous effect ranking, not as a standalone causal proof."
        ),
        metadata={"top_rows": diagnostics["top_rows"]}
    ).to_dict()


def estimate_s_learner_uplift(
    df: pd.DataFrame,
    treatment: str,
    outcome: str,
    covariates: Sequence[str],
    top_fraction: float = 0.2
) -> dict:
    warnings = validate_columns(df, treatment, outcome, covariates)
    if warnings:
        return _blocked_result("s_learner_uplift", warnings)
    data = clean_frame(df, treatment, outcome, covariates)
    if not is_binary(data[treatment]):
        warnings.append(ToolWarning("non_binary_treatment", "S-learner uplift expects binary treatment.", "blocker"))
        return _blocked_result("s_learner_uplift", warnings)

    x_base = data.loc[:, covariates].astype(float).to_numpy()
    t = data[treatment].astype(float).to_numpy().reshape(-1, 1)
    y = data[outcome].astype(float).to_numpy()
    x_train = np.column_stack([x_base, t])
    x_treated = np.column_stack([x_base, np.ones(len(data))])
    x_control = np.column_stack([x_base, np.zeros(len(data))])
    pred_t = fit_linear_predict(x_train, y, x_treated)
    pred_c = fit_linear_predict(x_train, y, x_control)
    ite = pred_t - pred_c
    diagnostics = _uplift_diagnostics(data, treatment, outcome, ite, top_fraction)
    avg_uplift = float(np.mean(ite))
    return CausalEstimateResult(
        method="s_learner_uplift",
        estimand="ite_ranking",
        effect=avg_uplift,
        uncertainty={"std_error": None, "ci_95": [None, None]},
        diagnostics=diagnostics,
        warnings=warnings,
        causal_claim_allowed=False,
        report_summary=(
            f"S-learner estimates average ITE {avg_uplift:.4f}. "
            "Use this ranking with validation and business guardrails."
        ),
        metadata={"top_rows": diagnostics["top_rows"]}
    ).to_dict()


def _uplift_diagnostics(data, treatment, outcome, ite, top_fraction):
    ranked = data.copy()
    ranked["_estimated_ite"] = ite
    ranked = ranked.sort_values("_estimated_ite", ascending=False)
    top_n = max(1, int(len(ranked) * top_fraction))
    top = ranked.head(top_n)
    rest = ranked.iloc[top_n:]
    top_lift = _treated_control_diff(top, treatment, outcome)
    rest_lift = _treated_control_diff(rest, treatment, outcome) if len(rest) else None
    return {
        "n": int(len(data)),
        "top_fraction": float(top_fraction),
        "top_n": int(top_n),
        "avg_estimated_ite_top": float(top["_estimated_ite"].mean()),
        "observed_top_treated_control_diff": top_lift,
        "observed_rest_treated_control_diff": rest_lift,
        "top_rows": ranked.loc[:, [treatment, outcome, "_estimated_ite"]].head(10).to_dict(orient="records")
    }


def _treated_control_diff(frame, treatment, outcome):
    treated = frame[frame[treatment].astype(float) == 1]
    control = frame[frame[treatment].astype(float) == 0]
    if len(treated) == 0 or len(control) == 0:
        return None
    return float(treated[outcome].mean() - control[outcome].mean())


def _blocked_result(method, warnings):
    return CausalEstimateResult(
        method=method,
        estimand="ite_ranking",
        effect=None,
        uncertainty={"std_error": None, "ci_95": [None, None]},
        diagnostics={},
        warnings=warnings,
        causal_claim_allowed=False,
        report_summary="Analysis blocked. Uplift prerequisites are not satisfied."
    ).to_dict()
