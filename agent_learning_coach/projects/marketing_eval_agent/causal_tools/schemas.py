from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ToolWarning:
    code: str
    message: str
    severity: str = "warning"

    def to_dict(self) -> Dict[str, str]:
        return {"code": self.code, "message": self.message, "severity": self.severity}


@dataclass
class CausalEstimateResult:
    method: str
    estimand: str
    effect: Optional[float]
    uncertainty: Dict[str, Any]
    diagnostics: Dict[str, Any]
    warnings: List[ToolWarning] = field(default_factory=list)
    causal_claim_allowed: bool = False
    report_summary: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "method": self.method,
            "estimand": self.estimand,
            "effect": self.effect,
            "uncertainty": self.uncertainty,
            "diagnostics": self.diagnostics,
            "warnings": [warning.to_dict() for warning in self.warnings],
            "causal_claim_allowed": self.causal_claim_allowed,
            "report_summary": self.report_summary,
            "metadata": self.metadata
        }
