# LLM Runtime Mental Model

## 本节总览

第一节课先给你一张能长期复用的地图：Agent = LLM + 状态 + 工具 + 循环 + 评测。后面所有 prompt、RAG、MCP、框架和工业案例都只是这张地图上的不同实现。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：openai-practical-guide-agents, openai-swarm, google-adk-overview
- 关键断言：claim-agent-needs-loop-state-tools-evals, claim-swarm-core-loop, claim-adk-state-memory-runner

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

如果没有 runtime 心智模型，你会很容易把问题都归因到 prompt 或模型能力：答错了就加长 prompt，工具用错了就换模型，报告过度归因就怪大模型幻觉。真正的工程诊断要先问：模型看到的上下文是否正确，工具是否有清晰契约，runner 是否限制了循环和权限，trace 是否能复盘，eval 是否覆盖了坏情况。

## 核心机制

一次 LLM 调用只是在 messages、instructions 和工具定义的条件下生成下一步。Agent 则把这一步放进一个 runner：runner 把用户任务、系统规则、工具列表、短期状态和历史观察送给模型；模型返回 final 或 tool_call；runner 执行工具、记录 trace、把 tool result 作为新观察追加回上下文；然后继续下一轮。这个循环让模型不只是回答，而是逐步获取信息、行动、验证。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

营销同学问“会员券是不是提升了 90 天 GTV”。普通聊天模型可能直接给一段建议；Agent 应该先把任务变成状态：目标是因果评估，处理变量是是否领券，结果变量是 90d GTV，需要协变量和活动规则。然后调用字段检查工具，发现缺少曝光前消费特征，就不能直接做 PSM/DML，而要返回缺字段诊断和补数建议。

## 你要怎么做

今天的操作是画出一个最小运行时：输入 user request；模型只允许输出两类结构：final 或 tool_call；tool_call 进入工具注册表；工具结果写入 trace；超过 max_steps 必须停止。你不需要接真实模型，先用 mock model，因为你要学的是控制流，不是 API 调用语法。

## 常见误区：错在哪里，正确理解是什么

错误理解：会调 Chat Completions 或 Responses API 就等于会做 Agent。

正确理解：API 调用是 Agent 的一个器官，不是 Agent 本身。Agent 的可靠性来自“模型决策 + 工具执行 + 状态更新 + 可观测性 + 评测”的组合。

真正的 gap：两者的 gap 在失败处理。只会调 API 的系统没有地方表达工具失败、权限不足、诊断降级和 max_steps；Agent runtime 必须把这些变成显式状态和 trace。

## 工业案例与可迁移经验

OpenAI 的 practical guide 把 agent foundation 拆成 model、tools、instructions；Swarm README 展示了 completion -> execute tool calls -> append results -> handoff/context update -> return 的循环。这两个来源合起来说明：理解 Agent 最快的路不是背框架名，而是先手搓这个循环。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

平台 API、模型名和 SDK 细节会过期；model/tools/instructions/state/evals 这个架构拆法相对稳定。
