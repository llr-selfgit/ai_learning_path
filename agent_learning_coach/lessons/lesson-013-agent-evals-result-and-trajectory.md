# Agent Evals: Result and Trajectory

## 本节总览

Agent 评测不是问“最后答案像不像”，而是问“它是怎样得到这个答案的”。路径错但答案碰巧对，在生产里仍然危险。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：openai-agent-evals, openai-agents-sdk-tracing, anthropic-building-effective-agents
- 关键断言：claim-agent-evals-need-trajectory, claim-workflow-agent-distinction

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

营销评估 Agent 可能最终写出一段看似合理的报告，但中间用错 treatment、忽略 common support、把 warning 当作普通信息、或在工具失败后编造结论。只看 final answer 会放过这些错误。trajectory eval 要检查每一步工具选择、参数、观察、降级和最终措辞是否一致。

## 核心机制

最小评测集应包含四层：result correctness 看报告结论是否正确；tool selection 看方法是否该选；tool args 看字段和参数是否对；policy compliance 看是否过度因果归因。每条 case 都要存输入、期望工具轨迹、期望输出边界和评分规则。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

case：缺少 treatment 前协变量。期望轨迹不是调用 PSM，而是 inspect 后拒绝或请求补数。如果 Agent 最终报告写了“无法判断”，但中间仍调用 PSM 并把结果隐藏起来，也应扣分，因为它没有遵守方法门禁。

## 你要怎么做

写 10 个 eval cases：3 个 happy path、4 个 bad data、2 个 prompt injection、1 个工具失败。每个 case 写 expected_trace 和 expected_report_policy。

## 常见误区：错在哪里，正确理解是什么

错误理解：让另一个 LLM 给报告打分就等于 Agent eval。

正确理解：LLM judge 可作为一层，但关键工具轨迹、参数和政策边界应有结构化断言。

真正的 gap：自然语言评分看表面质量；轨迹断言看行为可靠性。

## 工业案例与可迁移经验

OpenAI agent evals 和 tracing 文档强调可复现评测和 trace 评分。本课程把这个思路迁移到方法选择和业务报告。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

评测平台会变；结果+轨迹双评测原则稳定。
