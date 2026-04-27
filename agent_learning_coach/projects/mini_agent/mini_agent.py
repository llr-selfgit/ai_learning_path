from __future__ import annotations

import ast
import operator
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Iterable, List, Optional


class ToolValidationError(ValueError):
    pass


@dataclass
class ToolSpec:
    name: str
    description: str
    required: Iterable[str]
    handler: Callable[[Dict[str, Any]], Dict[str, Any]]
    risk: str = "low"

    def validate(self, args: Dict[str, Any]) -> None:
        missing = [key for key in self.required if key not in args or args[key] in (None, "")]
        if missing:
            raise ToolValidationError(f"missing required args: {', '.join(missing)}")


@dataclass
class MockModel:
    """Scripted model for learning and deterministic tests."""

    actions: List[Dict[str, Any]]
    calls: int = 0

    def __call__(self, messages: List[Dict[str, Any]], tools: List[ToolSpec], state: Dict[str, Any]) -> Dict[str, Any]:
        if self.calls >= len(self.actions):
            return {"type": "final", "content": "No more scripted actions."}
        action = self.actions[self.calls]
        self.calls += 1
        return action


@dataclass
class MiniAgent:
    model: Callable[[List[Dict[str, Any]], List[ToolSpec], Dict[str, Any]], Dict[str, Any]]
    tools: Dict[str, ToolSpec]
    max_steps: int = 6
    trace: List[Dict[str, Any]] = field(default_factory=list)

    def run(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        state = {"context": context or {}, "step": 0}
        messages: List[Dict[str, Any]] = [{"role": "user", "content": user_input}]
        self.trace = []

        for step in range(1, self.max_steps + 1):
            state["step"] = step
            action = self.model(messages, list(self.tools.values()), state)
            event = {"step": step, "model_action": action}

            if action.get("type") == "final":
                event["stop"] = "final"
                self.trace.append(event)
                return {
                    "final": action.get("content", ""),
                    "trace": self.trace,
                    "steps": step,
                    "stopped_reason": "final",
                }

            if action.get("type") != "tool_call":
                event["tool_error"] = {"code": "bad_action", "message": "model action must be final or tool_call"}
                messages.append({"role": "tool", "content": event["tool_error"]})
                self.trace.append(event)
                continue

            tool_name = action.get("tool")
            args = action.get("args") or {}
            tool = self.tools.get(tool_name)
            if tool is None:
                observation = {"ok": False, "error": {"code": "unknown_tool", "message": f"unknown tool: {tool_name}"}}
                event["tool_error"] = observation["error"]
                messages.append({"role": "tool", "name": tool_name or "unknown", "content": observation})
                self.trace.append(event)
                continue

            try:
                tool.validate(args)
                result = tool.handler(args)
                observation = {"ok": True, "tool": tool_name, "result": result}
                event["tool_result"] = result
            except ToolValidationError as exc:
                observation = {"ok": False, "tool": tool_name, "error": {"code": "bad_args", "message": str(exc)}}
                event["tool_error"] = observation["error"]
            except Exception as exc:  # intentionally catches tool failures and returns them as observations
                observation = {"ok": False, "tool": tool_name, "error": {"code": "tool_failure", "message": str(exc)}}
                event["tool_error"] = observation["error"]

            messages.append({"role": "tool", "name": tool_name, "content": observation})
            self.trace.append(event)

        return {
            "final": "Stopped because max_steps was reached before a final answer.",
            "trace": self.trace,
            "steps": self.max_steps,
            "stopped_reason": "max_steps",
        }


def safe_calculator(args: Dict[str, Any]) -> Dict[str, Any]:
    expression = str(args["expression"])
    tree = ast.parse(expression, mode="eval")
    value = _eval_math(tree.body)
    return {"expression": expression, "value": value}


def _eval_math(node: ast.AST) -> float:
    operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
    }
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in operators:
        return operators[type(node.op)](_eval_math(node.left), _eval_math(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in operators:
        return operators[type(node.op)](_eval_math(node.operand))
    raise ValueError("unsupported expression")


MOCK_DATASETS = {
    "coupon_good": {
        "columns": ["user_id", "received_coupon", "gtv_90d", "pre_30d_gtv", "pre_30d_frequency", "member_level"],
        "rows": 5000,
        "common_support": "ok",
    },
    "coupon_bad": {
        "columns": ["user_id", "received_coupon", "gtv_90d"],
        "rows": 80,
        "common_support": "poor",
    },
}


def inspect_dataset(args: Dict[str, Any]) -> Dict[str, Any]:
    dataset = MOCK_DATASETS.get(args["dataset"])
    if dataset is None:
        raise ValueError(f"dataset not found: {args['dataset']}")

    required = set(args.get("required_columns") or [])
    columns = set(dataset["columns"])
    missing = sorted(required - columns)
    warnings = []
    if missing:
        warnings.append("missing_required_columns")
    if dataset["rows"] < 200:
        warnings.append("sample_too_small")
    if dataset["common_support"] != "ok":
        warnings.append("poor_common_support")

    causal_claim_allowed = not warnings
    return {
        "dataset": args["dataset"],
        "rows": dataset["rows"],
        "columns": dataset["columns"],
        "missing_columns": missing,
        "common_support": dataset["common_support"],
        "warnings": warnings,
        "causal_claim_allowed": causal_claim_allowed,
        "recommended_next_step": "estimate" if causal_claim_allowed else "downgrade_or_request_more_data",
    }


def default_tools() -> Dict[str, ToolSpec]:
    return {
        "calculator": ToolSpec(
            name="calculator",
            description="Evaluate a simple arithmetic expression.",
            required=["expression"],
            handler=safe_calculator,
            risk="low",
        ),
        "inspect_dataset": ToolSpec(
            name="inspect_dataset",
            description="Inspect mock marketing evaluation datasets and return diagnostics.",
            required=["dataset", "required_columns"],
            handler=inspect_dataset,
            risk="low",
        ),
    }


if __name__ == "__main__":
    model = MockModel([
        {"type": "tool_call", "tool": "calculator", "args": {"expression": "120 * 0.08"}},
        {"type": "final", "content": "The lift estimate is 9.6 in the calculator example."},
    ])
    agent = MiniAgent(model=model, tools=default_tools())
    print(agent.run("Calculate a simple example."))
