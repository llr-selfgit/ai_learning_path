# Context Packet Engineering

## 本节总览

Context packet 是每轮给模型的“任务工作台”。它不是把所有材料塞进去，而是把当前决策所需的证据、规则和状态按优先级摆好。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：anthropic-long-context-tips, anthropic-prompting-best-practices, google-adk-state, mcp-specification
- 关键断言：claim-context-engineering-not-token-stuffing, claim-adk-state-memory-runner, claim-mcp-security-permission

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

长上下文的危险不只是贵，而是把无关信息、旧结论、工具错误、用户诱导和历史草稿一起交给模型。噪声包括：与当前决策无关的信息、来源不明的结论、过期状态、互相冲突的规则、未验证的工具输出、重复内容和会诱导模型的自然语言。上下文工程要做的是选择、排序、标注和压缩。

## 核心机制

一个 context packet 通常包括七块：task 说明这轮要做什么；policy 给不可违背规则；business context 给营销活动背景；data state 给字段、样本、质量；tool state 给可用工具和上次结果；trace state 给已做过的步骤；output contract 规定这轮输出。每块都要有来源和新鲜度。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

用户问“继续上次活动评估”。坏上下文是把上次完整聊天记录塞进去。好 context packet 是：活动 A、目标 90d GTV、已确认 treatment/outcome、缺少 pre_30d_frequency、上次工具诊断为 common support poor、当前任务是向用户请求补数或降级为相关性分析。

## 你要怎么做

为 mini-agent 写 `build_context_packet(task, policy, data_state, tool_state, trace)`，输出固定 JSON。然后拿同一个用户问题做对比：一个版本塞长历史，一个版本用 packet，观察模型或 mock model 的决策是否更稳定。

## 常见误区：错在哪里，正确理解是什么

错误理解：模型上下文窗口变长后，RAG 和上下文工程就不重要了。

正确理解：长窗口只是容量变大，不等于相关性、优先级、来源边界和状态一致性自动变好。

真正的 gap：容量解决“放不放得下”；上下文工程解决“该放什么、放在哪里、模型应该如何使用”。

## 工业案例与可迁移经验

Anthropic long-context tips 建议结构化长文档、使用 metadata 和引用定位；ADK 把 session.state 作为 scratchpad 管理动态状态。二者都说明上下文要被组织，而不是堆叠。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

不同模型的长上下文表现和最佳 prompt 布局会变；噪声、优先级和状态一致性的原则稳定。
