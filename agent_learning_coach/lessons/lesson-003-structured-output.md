# Structured Output 与工具契约

## 学习目标

理解为什么 Agent 不能只输出自然语言。你要能把业务意图、工具参数和最终报告约束成结构化 schema。

## 核心观点

自然语言适合解释，结构化输出适合执行。一个 Agent 如果要调用 PSM 工具，就必须稳定给出 treatment、outcome、covariates、estimand、diagnostic_policy，而不是在报告里随口描述。

## 例子

```json
{
  "task_type": "causal_evaluation",
  "method": "psm",
  "data_requirements": {
    "treatment": "is_treated",
    "outcome": "ltv_30d",
    "covariates": ["pre_spend_30d", "member_tenure", "city_tier"]
  },
  "safety_policy": {
    "allow_causal_claim": false,
    "required_diagnostics": ["common_support", "smd_balance"]
  }
}
```

## 练习

把“评估会员活动对 60 日 GTV 的影响”转成工具调用 JSON，并说明哪些字段缺失时必须阻塞分析。
