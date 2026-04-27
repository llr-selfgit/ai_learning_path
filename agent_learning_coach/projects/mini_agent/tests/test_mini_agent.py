import unittest

from projects.mini_agent.cli import run_scenario
from projects.mini_agent.mini_agent import MiniAgent, MockModel, default_tools


class MiniAgentTests(unittest.TestCase):
    def test_happy_path_tool_then_final(self):
        agent = MiniAgent(
            model=MockModel([
                {"type": "tool_call", "tool": "calculator", "args": {"expression": "2 + 3 * 4"}},
                {"type": "final", "content": "The result is 14."},
            ]),
            tools=default_tools(),
        )
        result = agent.run("calculate")
        self.assertEqual(result["stopped_reason"], "final")
        self.assertEqual(result["trace"][0]["tool_result"]["value"], 14)

    def test_unknown_tool_is_returned_as_observation(self):
        agent = MiniAgent(
            model=MockModel([
                {"type": "tool_call", "tool": "magic_tool", "args": {}},
                {"type": "final", "content": "I cannot use that tool."},
            ]),
            tools=default_tools(),
        )
        result = agent.run("use bad tool")
        self.assertEqual(result["trace"][0]["tool_error"]["code"], "unknown_tool")
        self.assertEqual(result["stopped_reason"], "final")

    def test_bad_args_are_reported(self):
        agent = MiniAgent(
            model=MockModel([
                {"type": "tool_call", "tool": "calculator", "args": {}},
                {"type": "final", "content": "The calculator call missed expression."},
            ]),
            tools=default_tools(),
        )
        result = agent.run("bad args")
        self.assertEqual(result["trace"][0]["tool_error"]["code"], "bad_args")

    def test_tool_failure_is_recoverable(self):
        agent = MiniAgent(
            model=MockModel([
                {"type": "tool_call", "tool": "calculator", "args": {"expression": "1 / 0"}},
                {"type": "final", "content": "The tool failed, so I should explain the failure."},
            ]),
            tools=default_tools(),
        )
        result = agent.run("divide by zero")
        self.assertEqual(result["trace"][0]["tool_error"]["code"], "tool_failure")
        self.assertEqual(result["stopped_reason"], "final")

    def test_max_steps_stop(self):
        agent = MiniAgent(
            model=MockModel([
                {"type": "tool_call", "tool": "calculator", "args": {"expression": "1+1"}},
                {"type": "tool_call", "tool": "calculator", "args": {"expression": "2+2"}},
            ]),
            tools=default_tools(),
            max_steps=2,
        )
        result = agent.run("never final")
        self.assertEqual(result["stopped_reason"], "max_steps")
        self.assertEqual(result["steps"], 2)

    def test_diagnostic_downgrade_from_dataset_inspection(self):
        agent = MiniAgent(
            model=MockModel([
                {
                    "type": "tool_call",
                    "tool": "inspect_dataset",
                    "args": {
                        "dataset": "coupon_bad",
                        "required_columns": ["received_coupon", "gtv_90d", "pre_30d_gtv"],
                    },
                },
                {"type": "final", "content": "Downgrade: causal claim is not allowed until missing fields and support issues are fixed."},
            ]),
            tools=default_tools(),
        )
        result = agent.run("inspect bad dataset")
        diagnostics = result["trace"][0]["tool_result"]
        self.assertFalse(diagnostics["causal_claim_allowed"])
        self.assertIn("missing_required_columns", diagnostics["warnings"])
        self.assertIn("poor_common_support", diagnostics["warnings"])

    def test_cli_calculator_scenario(self):
        result = run_scenario("calculator")
        self.assertEqual(result["stopped_reason"], "final")
        self.assertEqual(result["trace"][0]["tool_result"]["value"], 9.6)

    def test_cli_coupon_good_scenario(self):
        result = run_scenario("coupon_good")
        self.assertTrue(result["diagnostics"]["causal_claim_allowed"])
        self.assertEqual(result["diagnostics"]["warnings"], [])

    def test_cli_coupon_bad_scenario(self):
        result = run_scenario("coupon_bad")
        self.assertFalse(result["diagnostics"]["causal_claim_allowed"])
        self.assertIn("missing_required_columns", result["diagnostics"]["warnings"])


if __name__ == "__main__":
    unittest.main()
