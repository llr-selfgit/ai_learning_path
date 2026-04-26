# 因果算法的 Agent 工具化定位

## 学习目标

你不需要把 PSM/DML/ITE 作为新算法从头学一遍。你的目标是把已有算法能力封装成 Agent 可安全调用、可诊断、可解释、可评测的业务工具。

## 直觉版

因果工具对 Agent 来说像数据库对 BI Agent 一样：模型不应该“凭感觉估计效果”，而应该调用工具。更重要的是，工具不只返回一个数字，还要返回诊断、风险和是否允许做因果结论。

## 工程版

一个合格工具输出应该包含：

```json
{
  "method": "psm",
  "estimand": "att",
  "effect": 12.7,
  "uncertainty": {"std_error": 3.1, "ci_95": [6.6, 18.8]},
  "diagnostics": {
    "common_support_ok": true,
    "max_abs_smd_after": 0.07,
    "matched_sample_rate": 0.82
  },
  "warnings": [],
  "causal_claim_allowed": true,
  "report_summary": "在当前可观测协变量与匹配质量下，活动对 30 日 LTV 的 ATT 估计为 12.7。"
}
```

## Agent 必须会判断

- 数据缺字段：阻塞。
- 样本不足：降级为探索性分析。
- common support 差：不能给强因果结论。
- 协变量平衡差：需要换方法、加特征或报告风险。
- 用户要求“证明活动有效”：必须拒绝过度归因。

## 深度作业

设计一个 `estimate_causal_effect` 工具 schema，要求同时支持 PSM、DML、ITE/uplift，并能表达“不适合做因果结论”的返回。
