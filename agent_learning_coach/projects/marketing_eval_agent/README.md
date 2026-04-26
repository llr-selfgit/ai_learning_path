# Marketing Evaluation Agent

This project is the capstone business Agent.

The causal inference layer is intentionally implemented as transparent tools instead of using `econml` or `doubleml`.

Allowed foundation packages:

- `numpy`
- `pandas`
- `scikit-learn` may be used later, but the first implementation avoids it so the core logic stays visible.

## Tool Contract

Every causal tool should return:

- `method`
- `estimand`
- `effect`
- `uncertainty`
- `diagnostics`
- `warnings`
- `causal_claim_allowed`
- `report_summary`

The Agent should never turn a weak diagnostic result into a strong causal claim.
