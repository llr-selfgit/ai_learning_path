# Tool Calling and Structured Output

## 本节总览

工具调用是把模型的“想做什么”变成机器能执行的契约；结构化输出是把模型的“要说什么”变成机器能解析的契约。二者都很重要，但都不能自动保证业务正确。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：fast-changing
- 主要来源：openai-tools-guide, openai-structured-outputs, deepseek-function-calling, xai-function-calling, glm-function-calling
- 关键断言：claim-tool-schema-shape-not-semantics, claim-structured-output-json-not-business-truth, claim-glm-agent-function-calling

本节包含快速变化项目、模型或 API。学习时按当前课程理解架构动机，具体版本和字段以后必须复核。

## 为什么学

你的业务里最危险的不是 JSON 格式错，而是 JSON 很漂亮但语义错：把 treatment 填成了 coupon_amount，把 outcome 填成了活动期内 GMV，把 PSM 误用于没有 common support 的样本。schema 能拦住缺字段和类型错，但拦不住错误方法选择，所以工具必须返回 diagnostics 和 warnings，Agent 还必须做前置检查。

## 核心机制

tool schema 通常包括 name、description、parameters 和 required 字段。模型看到 schema 后生成 tool_call，runner 负责解析参数、校验参数、执行函数、把 tool result 作为 tool message 返回。structured output 则让模型最终输出符合 JSON schema 的对象。它们共同形成闭环：工具调用负责拿证据，结构化输出负责交付可读可评测的结论。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

一个 `estimate_psm` 工具不能只要求 `data_path,treatment,outcome,covariates`。它还应接受 `estimand`、`business_goal`、`min_sample_size`，返回 `effect`、`uncertainty`、`smd_before_after`、`common_support`、`warnings`、`causal_claim_allowed`。这样 Agent 不会只拿一个 ATT 数字就写“活动显著有效”。

## 你要怎么做

把工具当产品接口设计：先写“什么时候不允许调用”，再写参数 schema，最后写返回 schema。返回值必须包括成功态和失败态。失败态不要只返回 exception，要返回可行动诊断，例如 `missing_columns:['pre_30d_gtv']` 或 `common_support:'poor'`。

## 常见误区：错在哪里，正确理解是什么

错误理解：只要开启 strict JSON schema，模型输出就是可靠结论。

正确理解：strict schema 只提升可解析性，不能替你判断字段选择、因果假设、样本质量和业务解释是否成立。

真正的 gap：格式约束解决“机器能不能读”；业务语义解决“这个东西该不该信”。高质量 Agent 必须同时做参数校验、工具前置检查、输出诊断和评测。

## 工业案例与可迁移经验

OpenAI、DeepSeek、xAI、Z.AI 都把 function calling 描述为模型请求外部函数、由应用本地执行再回传结果的流程。不同平台字段细节会变，但“模型提议、应用执行、结果回传”的责任边界是稳定的。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

各家 API 的字段、strict schema 支持范围、tool_choice 行为会快速变化；schema 不能保证语义正确这个边界相对稳定。
