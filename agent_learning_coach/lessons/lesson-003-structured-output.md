# Structured Output 与工具契约

## 总览

这节课解决的是“模型怎么从会说话变成能做事”。自然语言适合解释，结构化输出适合执行。Agent 要调用工具，就不能只说“我会用 PSM 评估一下”，而要稳定地产生工具能理解的参数。

在营销评估 Agent 中，structured output 的价值非常直接：它让模型的意图变成可校验、可执行、可评测的对象。

## 为什么重要

用户会这样说：

```text
帮我看看会员活动对 60 日 GTV 有没有提升。
```

人能理解这句话，但工具不能。工具需要知道：

```text
treatment 是哪个字段？
outcome 是哪个字段？
时间窗口是什么？
协变量有哪些？
目标是 ATT、ATE，还是 uplift ranking？
缺字段时应该阻塞还是降级？
```

如果没有 structured output，模型可能在自然语言里写得很漂亮，但工具调用参数是错的，最后报告也会错。

## 先做一遍

把用户问题转换成一个工具请求：

```json
{
  "task_type": "causal_evaluation",
  "business_goal": "evaluate_campaign_effect",
  "method_hint": "auto",
  "metric_window": "gtv_60d",
  "required_fields": {
    "treatment": "is_treated",
    "outcome": "gtv_60d",
    "unit_id": "user_id",
    "time_column": "event_date"
  },
  "covariates": ["pre_gtv_30d", "member_tenure_days", "city_tier"],
  "diagnostic_policy": {
    "require_common_support": true,
    "max_abs_smd_after": 0.2,
    "min_sample_size": 500
  },
  "fallback_policy": {
    "missing_required_fields": "analysis_blocked",
    "weak_diagnostics": "downgrade_to_exploratory"
  }
}
```

这个 JSON 不是为了好看，而是为了让系统能检查、执行和评测。

## 拆开解释

Structured output 有三个作用。

第一，它把模型意图变成工具契约。工具不需要猜“用户说的 LTV 是哪个字段”，而是读取 `outcome`。

第二，它让错误提前暴露。如果 `treatment` 缺失，系统可以在调用估计工具前阻塞，而不是等报告写完才发现。

第三，它让评测变得可能。你可以检查 `method_hint` 是否合理，`covariates` 是否遗漏关键字段，`fallback_policy` 是否允许过度归因。

## 工程落地

一个可用的工具契约通常包括四类字段：

```text
Task
  用户到底要做什么任务：预测、因果评估、分群 uplift、BI 查询。

Inputs
  工具必须读取哪些字段：treatment、outcome、covariates、time window。

Diagnostics
  工具必须返回哪些诊断：样本量、缺失率、common support、SMD、置信区间。

Fallback
  工具失败或诊断不达标时，Agent 应该阻塞、降级、请求补充，还是继续探索性分析。
```

对营销评估 Agent 来说，最关键的是 fallback。因为你不能让 Agent 在诊断失败时继续输出强因果结论。

## 图解

```text
用户自然语言
  ↓
意图识别 JSON
  ↓
工具请求 JSON
  ↓
工具返回 JSON
  ↓
报告 JSON / Markdown
```

每一步都可以检查。自然语言负责沟通，JSON 负责执行和验证。

## 工业视角

OpenAI tools guide 把 function calling、内置工具、tool search 和 remote MCP 作为扩展模型能力的方式。这里的关键不是某个具体 API 名称，而是一个工程趋势：模型越来越多地通过明确工具接口连接外部能力。

MCP 规范也体现了类似方向：让模型应用通过协议连接外部 context、resources、prompts 和 tools。协议细节会变化，所以本课不要求你记字段，而是掌握思想：工具边界要机器可读，能力描述要明确，调用结果要可验证。

## 你来操作

设计一个 `estimate_effect` 工具的 request 和 response。它要支持 PSM、DML、ITE/uplift 的方法选择，但不要求你在这里实现算法。

Request 至少包含：

```text
task_type
method
treatment
outcome
covariates
estimand
diagnostic_policy
fallback_policy
```

Response 至少包含：

```text
method
effect
uncertainty
diagnostics
warnings
causal_claim_allowed
report_summary
```

写完后，请回答：

```text
哪些字段缺失时必须阻塞？
哪些诊断失败时必须降级？
哪些字段是给 Agent 读的，哪些字段是给用户报告读的？
```

## 常见误区

第一个误区是只约束最终答案，不约束工具参数。这样报告格式看似稳定，工具调用仍然可能错。

第二个误区是 schema 过细，导致模型难以稳定填充。schema 应该约束关键边界，而不是把所有业务可能性一次性塞进去。

第三个误区是没有降级字段。`causal_claim_allowed` 这种字段非常重要，因为它把工具诊断转成 Agent 可执行的报告策略。

## 迁移练习

把 `estimate_effect` 的思想迁移到 BI Agent 的 `run_metric_query`：

```text
Request：metric、date_range、filters、group_by、grain、permission_scope
Response：query_summary、result_table_ref、metric_definition、warnings、can_answer
Fallback：口径缺失时 ask_clarification，权限不足时 reject
```

你会发现，structured output 不是因果评估专用能力，而是所有 Agent 工具化的基础。

## 总结回扣

Structured output 是模型和工程系统之间的接口。没有它，模型只能“说”；有了它，模型才能稳定地“调用、检查、执行、复盘”。

本课的重点不是记住某个 JSON 模板，而是理解工具契约：输入要清楚，输出要可诊断，失败要可降级，评测要能检查。

## 掌握检查

你真正掌握本课，应该能做到：

- 把一个自然语言营销评估需求转成工具请求 JSON。
- 设计一个带诊断和降级策略的工具返回 JSON。
- 解释为什么 `causal_claim_allowed` 这类机器可读字段对 Agent 很重要。
