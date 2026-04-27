# Harness Engineering

## 本节总览

Harness 是 Agent 的运行环境。模型负责提出下一步，harness 负责让下一步在可控、可暂停、可恢复、可审计的环境里发生。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：google-adk-overview, google-adk-state, langgraph-durable-execution, openai-agents-sdk-tracing
- 关键断言：claim-adk-state-memory-runner, claim-langgraph-durable-execution, claim-agent-evals-need-trajectory

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

当 Agent 从 toy 变成内部工具，问题会从“模型会不会”变成“系统能不能”：工具超时怎么办、运行中断怎么办、人类审批后怎么继续、状态存在哪里、trace 怎么关联、成本怎么限制、失败后是否重试。harness engineering 正是这些问题的集合。

## 核心机制

runner 接收任务并驱动 loop；state 保存当前任务和跨轮变量；event 记录每个动作；tool executor 执行外部函数；retry/timeout 处理不稳定工具；human handoff 在高风险或不确定时暂停；checkpoint 让长任务可恢复。框架只是提供这些组件的不同实现。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

一个 DML 估计运行 3 分钟，中途 API 断开。没有 harness，用户只看到失败；有 durable state，系统可恢复到 estimate 前后，保留已完成的 inspect 和 method selection，并把失败作为 trace 事件。

## 你要怎么做

为 Marketing Evaluation Agent 画 runtime 草图：Runner、StateStore、ToolExecutor、TraceStore、HumanApproval、EvalRunner。每个模块写输入输出。

## 常见误区：错在哪里，正确理解是什么

错误理解：harness engineering 是框架作者才需要懂的底层细节。

正确理解：应用工程师即使用框架，也要懂 harness 职责，否则无法做权限、恢复、评测和排障。

真正的 gap：会用框架能跑 demo；懂 harness 才能负责生产行为。

## 工业案例与可迁移经验

ADK 暴露 sessions/state/events/runner，LangGraph 强调 durable execution，OpenAI SDK 暴露 tracing。这些都是 harness 的不同切面。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

框架 API 会变；runner/state/event/tool/handoff 的职责稳定。
