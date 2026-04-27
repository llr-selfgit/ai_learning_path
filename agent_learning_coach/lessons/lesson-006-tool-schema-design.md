# Tool Schema Design：让模型稳定调用工具

## 总览

这节课解决的问题是：为什么 Agent 明明知道该调用工具，却还是经常传错参数、漏字段、或者把工具结果解释错？

工具 schema 是模型和业务系统之间的契约。它不仅描述“工具能做什么”，还要描述：

```text
必须输入什么
允许输入什么
禁止输入什么
工具会返回什么
失败会怎么返回
哪些 warning 会限制最终报告
```

在营销评估 Agent 里，schema 设计得不好，比 prompt 写得差更危险。因为模型可能会调用一个看似正确的 `estimate_effect`，但把 outcome 填成活动后活跃天数，把 treatment 填成渠道字段，最后输出一份很像真的错误报告。

## 任务开场

用户说：

```text
帮我评估活动 A 对 30 日 LTV 的影响。
```

一个模糊工具设计可能是：

```json
{
  "name": "estimate_effect",
  "description": "评估活动效果",
  "parameters": {
    "data": "活动数据",
    "metric": "LTV"
  }
}
```

这几乎没有约束。模型不知道 treatment、outcome、covariates、estimand、诊断阈值、降级策略应该怎么填。

更好的 schema 要把业务边界暴露出来：

```json
{
  "method": "auto",
  "estimand": "ATT",
  "treatment": "received_coupon",
  "outcome": "ltv_30d",
  "covariates": ["pre_ltv_30d", "member_level", "city_tier", "channel"],
  "diagnostic_policy": {
    "min_sample_size": 500,
    "require_common_support": true,
    "max_abs_smd_after": 0.2
  },
  "fallback_policy": {
    "missing_required_fields": "analysis_blocked",
    "weak_diagnostics": "downgrade_to_exploratory"
  }
}
```

这个 schema 不只是为了让工具跑起来，而是为了让 Agent 不乱归因。

## 拆开解释

一个好工具 schema 通常有五个部分。

第一，能力边界。工具到底做什么，不做什么。比如 `estimate_effect` 做因果估计和诊断，不负责从数据库随便猜字段。

第二，输入约束。哪些字段必填，哪些字段是 enum，哪些字段必须来自数据字典或 inspect 工具结果。

第三，输出结构。不要只返回 `effect=0.12`，还要返回 uncertainty、diagnostics、warnings、causal_claim_allowed、report_summary。

第四，错误结构。工具失败不是异常文本，而是机器可读状态：`missing_field`、`insufficient_sample`、`poor_common_support`、`unbalanced_covariates`。

第五，报告策略。工具要告诉 Agent 结果能不能支持强因果结论。如果不能，Agent 必须降级。

## 工程落地：四个工具

Marketing Evaluation Agent 的最小工具组可以这样设计：

```text
inspect_dataset
  输入：dataset_ref、required_fields、privacy_policy
  输出：字段存在性、缺失率、样本量、字段类型、基础分布、warnings

select_method
  输入：task_goal、data_profile、available_fields、causal_policy
  输出：recommended_method、why、blocked_reasons、fallback_method

estimate_effect
  输入：method、treatment、outcome、covariates、estimand、diagnostic_policy
  输出：effect、uncertainty、diagnostics、warnings、causal_claim_allowed

write_report
  输入：business_goal、method_result、report_policy、audience
  输出：summary、method、diagnostics、limitations、next_actions
```

注意顺序：不要让 `estimate_effect` 直接承担所有职责。先 inspect，再 select，再 estimate，再 report，错误会更早暴露。

## Request / Response / Error 三件套

不要只设计成功输入。一个工具契约至少要包含三件套：

```json
{
  "request": {
    "method": "PSM",
    "treatment": "received_coupon",
    "outcome": "ltv_30d",
    "covariates": ["pre_ltv_30d", "member_level"],
    "estimand": "ATT"
  },
  "response": {
    "status": "ok",
    "effect": 12.4,
    "uncertainty": {"ci95": [3.1, 21.7]},
    "diagnostics": {"max_abs_smd_after": 0.08, "common_support": "acceptable"},
    "warnings": [],
    "causal_claim_allowed": true
  },
  "error": {
    "status": "blocked",
    "code": "missing_required_field",
    "message": "outcome field ltv_30d is missing",
    "allowed_next_action": "ask_user_or_run_data_mapping"
  }
}
```

如果没有 error schema，模型很容易把失败当作“没有问题”，继续写报告。

## 图解

```text
用户自然语言
  ↓
context packet
  ↓
tool schema constrains model arguments
  ↓
tool execution
  ↓
response/error schema
  ↓
report policy constrains final answer
```

schema 同时约束工具调用前和工具调用后。前面约束参数，后面约束报告边界。

## 工业视角

OpenAI function calling / tools 文档把工具调用描述为模型请求使用应用提供的工具、应用执行工具、再把工具输出交回模型的多步流程。这里的可迁移点是：工具调用不是模型自己执行真实世界动作，而是应用在中间接管执行和校验。

OpenAI structured outputs 文档强调 JSON Schema 对结构化输出的约束价值。这里要注意一个边界：schema 能约束形状和字段，不自动保证业务语义正确。比如 `outcome` 字段符合字符串类型，不代表它就是正确指标。

MCP 的 tools/resources 思路说明了另一件事：当外部能力被协议化，schema、权限和安全边界会变成 Agent 产品的核心设计材料。

## 你来操作

为 `estimate_effect` 写完整契约。至少包含：

```text
1. request schema
2. response schema
3. error schema
4. diagnostic policy
5. report policy
6. 3 个 bad case
```

Bad case 例子：

```text
缺 treatment：必须 blocked，不能估计。
common support 差：允许探索性描述，但 causal_claim_allowed=false。
用户要求“帮我证明活动有效”：必须保持中立，不能把目标改成证明。
```

## 常见误区

第一个误区是 schema 只写字段类型，不写业务语义。`metric: string` 没有用，`outcome must be one of inspected outcome fields` 才有约束力。

第二个误区是没有错误返回。真实工具最常见的输出不是成功，而是缺字段、样本不足、诊断失败、权限不足。

第三个误区是工具返回摘要太自然语言化。自然语言摘要可以有，但诊断和策略必须机器可读，否则 Agent 很难稳定遵守。

第四个误区是 schema 过度复杂。一次性把所有方法、所有业务、所有异常塞进一个巨大 schema，会让模型更难填对。先覆盖最关键的边界。

## 迁移练习

把 `estimate_effect` 的 schema 思想迁移到 `run_sql`：

```text
request：query_intent、tables、columns、filters、limit、permission_scope
response：rows、schema、row_count、execution_time、warnings
error：permission_denied、ambiguous_metric、query_timeout、sensitive_column_blocked
report_policy：是否允许展示明细、是否需要脱敏、是否需要口径说明
```

你会发现，schema 设计不是“为了 JSON 好看”，而是把产品边界和安全规则交给系统执行。

## 总结回扣

Tool schema 是 Agent 产品的接口设计。它决定模型如何把意图变成动作，也决定工具结果如何约束最终回答。

对营销评估 Agent 来说，schema 的关键不是多返回一个 effect，而是让字段缺失、诊断失败、方法不适用这些情况被机器读懂。只有这样，Agent 才能在该拒绝时拒绝，该降级时降级，该报告时有边界地报告。

## 掌握检查

你真正掌握本课，要能完成三件事：

- 写出 `estimate_effect` 的 request / response / error schema。
- 解释 schema 能防什么错误，不能防什么错误。
- 用 bad case 检查 schema 是否能阻止 Agent 过度归因。
