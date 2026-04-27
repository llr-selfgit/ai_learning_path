# Trace Debugging

## 本节总览

Trace 是 Agent 的黑匣子记录仪。没有 trace，你只能猜模型为什么错；有 trace，你可以把错误定位到某一轮、某个工具、某个参数或某条规则。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：openai-agents-sdk-tracing, claude-code-agent-loop, bytedance-trae-agent
- 关键断言：claim-agent-evals-need-trajectory, claim-claude-code-loop, claim-trae-agent-software-engineering

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

LLM 应用的失败常常不是单点错误，而是连锁：上下文少了字段 -> 模型选错工具 -> 工具返回 warning -> 报告忽略 warning。trace debugging 的目标是找到最早的可修复原因，而不是只改最后一句话。

## 核心机制

trace 至少记录：run_id、step_id、input context summary、model action、tool name、tool args、tool result、warnings、decision rationale、final output。debug 时按顺序问：任务理解对吗？上下文够吗？工具该调用吗？参数对吗？结果被正确解释了吗？输出有没有越界？

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

Agent 报告说 DML 估计有效。trace 显示 method_router 看到 `treatment_type='continuous_discount'` 却调用了二元 PSM，根因不是报告模板，而是 router 没有区分二元处理和连续处理。

## 你要怎么做

拿一个故意失败的 case，写五行复盘：symptom、first_bad_step、root_cause、fix、new_regression_case。

## 常见误区：错在哪里，正确理解是什么

错误理解：trace 只是调试日志，等上线稳定后可以关掉。

正确理解：trace 是评测、审计、复盘和用户信任的一部分。尤其是内部算法 Agent，结论需要可追溯。

真正的 gap：日志记录系统发生了什么；高质量 trace 记录为什么这样决策以及依据是什么。

## 工业案例与可迁移经验

Trae Agent README 强调 trajectory recording；Claude Code loop 强调执行后验证。工业 coding agent 都把轨迹作为调试和研究基础。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

具体 trace 平台字段会变；step/action/observation/result 的追踪结构稳定。
