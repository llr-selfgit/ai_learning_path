from __future__ import annotations

import argparse
import json
from typing import Any, Dict, List

from projects.mini_agent.mini_agent import MiniAgent, MockModel, default_tools


SCENARIOS = {
    "calculator": {
        "user_input": "帮我计算 120 * 0.08，并解释这个工具调用是怎么发生的。",
        "actions": [
            {"type": "tool_call", "tool": "calculator", "args": {"expression": "120 * 0.08"}},
            {"type": "final", "content": "calculator 工具返回 9.6；这说明模型提出动作，程序负责执行。"},
        ],
    },
    "coupon_good": {
        "user_input": "检查会员券活动数据是否具备进入因果估计的基本字段。",
        "actions": [
            {
                "type": "tool_call",
                "tool": "inspect_dataset",
                "args": {
                    "dataset": "coupon_good",
                    "required_columns": [
                        "received_coupon",
                        "gtv_90d",
                        "pre_30d_gtv",
                        "pre_30d_frequency",
                    ],
                },
            },
            {"type": "final", "content": "字段、样本量和 common support 初步通过，可以进入估计前的进一步诊断。"},
        ],
    },
    "coupon_bad": {
        "user_input": "检查会员券活动数据，如果不适合做因果结论就降级。",
        "actions": [
            {
                "type": "tool_call",
                "tool": "inspect_dataset",
                "args": {
                    "dataset": "coupon_bad",
                    "required_columns": [
                        "received_coupon",
                        "gtv_90d",
                        "pre_30d_gtv",
                        "pre_30d_frequency",
                    ],
                },
            },
            {"type": "final", "content": "当前缺少处理前特征、样本量不足且 common support 差；只能请求补数或降级为描述性分析。"},
        ],
    },
}


def first_diagnostics(trace: List[Dict[str, Any]]) -> Dict[str, Any]:
    for event in trace:
        result = event.get("tool_result")
        if isinstance(result, dict) and "warnings" in result:
            return result
    return {}


def run_scenario(name: str) -> Dict[str, Any]:
    scenario = SCENARIOS[name]
    agent = MiniAgent(model=MockModel(scenario["actions"]), tools=default_tools())
    result = agent.run(scenario["user_input"])
    return {
        "scenario": name,
        "input": scenario["user_input"],
        "final": result["final"],
        "stopped_reason": result["stopped_reason"],
        "steps": result["steps"],
        "diagnostics": first_diagnostics(result["trace"]),
        "trace": result["trace"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a deterministic mini-agent learning scenario.")
    parser.add_argument("--scenario", choices=sorted(SCENARIOS), required=True)
    parser.add_argument("--json", action="store_true", help="Print the full machine-readable result.")
    args = parser.parse_args()

    result = run_scenario(args.scenario)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    print(f"Scenario: {result['scenario']}")
    print(f"Input: {result['input']}")
    print(f"Final: {result['final']}")
    print(f"Stopped reason: {result['stopped_reason']}")
    if result["diagnostics"]:
        print(f"Diagnostics: {json.dumps(result['diagnostics'], ensure_ascii=False)}")


if __name__ == "__main__":
    main()
