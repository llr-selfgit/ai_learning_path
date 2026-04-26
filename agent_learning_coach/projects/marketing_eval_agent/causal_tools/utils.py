from __future__ import annotations

from typing import Iterable, List, Sequence, Tuple

import numpy as np
import pandas as pd

from .schemas import ToolWarning


def validate_columns(
    df: pd.DataFrame,
    treatment: str,
    outcome: str,
    covariates: Sequence[str]
) -> List[ToolWarning]:
    warnings: List[ToolWarning] = []
    required = [treatment, outcome, *covariates]
    missing = [column for column in required if column not in df.columns]
    if missing:
      warnings.append(
          ToolWarning(
              code="missing_columns",
              message=f"Missing required columns: {', '.join(missing)}",
              severity="blocker"
          )
      )
    return warnings


def clean_frame(
    df: pd.DataFrame,
    treatment: str,
    outcome: str,
    covariates: Sequence[str]
) -> pd.DataFrame:
    required = [treatment, outcome, *covariates]
    return df.loc[:, required].dropna().copy()


def is_binary(values: Iterable[float]) -> bool:
    unique = set(pd.Series(values).dropna().astype(float).unique().tolist())
    return unique.issubset({0.0, 1.0}) and len(unique) == 2


def standardize_matrix(x: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    mean = x.mean(axis=0)
    std = x.std(axis=0)
    std = np.where(std < 1e-8, 1.0, std)
    return (x - mean) / std, mean, std


def add_intercept(x: np.ndarray) -> np.ndarray:
    return np.column_stack([np.ones(x.shape[0]), x])


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))


def fit_logistic_predict(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_predict: np.ndarray,
    lr: float = 0.08,
    max_iter: int = 2500,
    l2: float = 0.1
) -> np.ndarray:
    x_train_std, mean, std = standardize_matrix(x_train)
    x_predict_std = (x_predict - mean) / std
    design = add_intercept(x_train_std)
    coef = np.zeros(design.shape[1])
    for _ in range(max_iter):
        pred = sigmoid(design @ coef)
        grad = (design.T @ (pred - y_train)) / len(y_train)
        grad[1:] += l2 * coef[1:] / len(y_train)
        coef -= lr * grad
    return np.clip(sigmoid(add_intercept(x_predict_std) @ coef), 1e-4, 1 - 1e-4)


def fit_linear_predict(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_predict: np.ndarray,
    ridge: float = 1e-6
) -> np.ndarray:
    x_train_std, mean, std = standardize_matrix(x_train)
    x_predict_std = (x_predict - mean) / std
    design = add_intercept(x_train_std)
    penalty = np.eye(design.shape[1]) * ridge
    penalty[0, 0] = 0.0
    coef = np.linalg.pinv(design.T @ design + penalty) @ design.T @ y_train
    return add_intercept(x_predict_std) @ coef


def standardized_mean_difference(
    df: pd.DataFrame,
    treatment: str,
    covariates: Sequence[str],
    weights: np.ndarray | None = None
) -> dict:
    treated = df[treatment].astype(float).to_numpy() == 1
    result = {}
    if weights is None:
        weights = np.ones(len(df))
    for column in covariates:
        x = df[column].astype(float).to_numpy()
        wt = weights[treated]
        wc = weights[~treated]
        xt = x[treated]
        xc = x[~treated]
        mt = np.average(xt, weights=wt)
        mc = np.average(xc, weights=wc)
        vt = np.average((xt - mt) ** 2, weights=wt)
        vc = np.average((xc - mc) ** 2, weights=wc)
        pooled = np.sqrt((vt + vc) / 2.0)
        result[column] = float((mt - mc) / pooled) if pooled > 1e-12 else 0.0
    return result


def normal_ci(effect: float, std_error: float) -> dict:
    if std_error is None or not np.isfinite(std_error):
        return {"std_error": None, "ci_95": [None, None]}
    delta = 1.96 * std_error
    return {
        "std_error": float(std_error),
        "ci_95": [float(effect - delta), float(effect + delta)]
    }
