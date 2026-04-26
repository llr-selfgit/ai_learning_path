import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np
import pandas as pd

from causal_tools import estimate_dml, estimate_psm, estimate_s_learner_uplift, estimate_t_learner_uplift


def make_overlap_data(n=260, seed=7):
    rng = np.random.default_rng(seed)
    x1 = rng.normal(0, 1, n)
    x2 = rng.normal(0, 1, n)
    logits = 0.6 * x1 - 0.4 * x2
    p = 1 / (1 + np.exp(-logits))
    treatment = rng.binomial(1, p)
    outcome = 2.0 * treatment + 1.2 * x1 - 0.8 * x2 + rng.normal(0, 1, n)
    return pd.DataFrame({"t": treatment, "y": outcome, "x1": x1, "x2": x2})


def make_no_overlap_data(n=220, seed=11):
    rng = np.random.default_rng(seed)
    treatment = np.r_[np.ones(n // 2), np.zeros(n // 2)]
    x1 = np.r_[rng.normal(4, 0.2, n // 2), rng.normal(-4, 0.2, n // 2)]
    x2 = rng.normal(0, 1, n)
    outcome = 1.0 * treatment + x1 + rng.normal(0, 1, n)
    return pd.DataFrame({"t": treatment, "y": outcome, "x1": x1, "x2": x2})


class CausalToolTests(unittest.TestCase):
    def test_psm_returns_effect_and_diagnostics(self):
        result = estimate_psm(make_overlap_data(), "t", "y", ["x1", "x2"], caliper=0.2)
        self.assertEqual(result["method"], "psm")
        self.assertIsNotNone(result["effect"])
        self.assertIn("matched_sample_rate", result["diagnostics"])
        self.assertIn("causal_claim_allowed", result)

    def test_psm_flags_no_overlap(self):
        result = estimate_psm(make_no_overlap_data(), "t", "y", ["x1", "x2"], caliper=0.05)
        warning_codes = {warning["code"] for warning in result["warnings"]}
        self.assertTrue({"no_common_support", "low_matched_rate", "no_matches"} & warning_codes)
        self.assertFalse(result["causal_claim_allowed"])

    def test_dml_returns_crossfit_diagnostics(self):
        result = estimate_dml(make_overlap_data(), "t", "y", ["x1", "x2"])
        self.assertEqual(result["method"], "dml")
        self.assertIsNotNone(result["effect"])
        self.assertIn("treatment_residual_variance", result["diagnostics"])

    def test_uplift_tools_return_rankings(self):
        data = make_overlap_data()
        t_result = estimate_t_learner_uplift(data, "t", "y", ["x1", "x2"])
        s_result = estimate_s_learner_uplift(data, "t", "y", ["x1", "x2"])
        self.assertEqual(t_result["method"], "t_learner_uplift")
        self.assertEqual(s_result["method"], "s_learner_uplift")
        self.assertIn("top_rows", t_result["metadata"])
        self.assertIn("top_rows", s_result["metadata"])


if __name__ == "__main__":
    unittest.main()
