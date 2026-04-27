# Agent Loop From Scratch

## 本节总览

这一节是课程的第一根主梁。你先不用 LangGraph、Agents SDK 或 Qwen-Agent，而是用 Python 基础包把 loop 写出来；等你知道每一环负责什么，再去看框架才不会被抽象吞掉。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：openai-swarm, claude-code-agent-loop, claude-code-how-works
- 关键断言：claim-swarm-core-loop, claim-claude-code-loop, claim-agent-needs-loop-state-tools-evals

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

很多人学 Agent 会先装框架，结果只学会了框架配置，不知道工具结果是怎么进入下一轮、为什么需要 max_steps、为什么 tool error 要回传给模型、为什么 trace 必须记录参数和返回值。手搓 loop 的价值不是造轮子，而是把轮子的受力点摸清楚。

## 核心机制

最小 loop 只有五件事：第一，保存 messages/state；第二，调用模型得到 action；第三，如果 action 是 final 就停止；第四，如果 action 是 tool_call，就验证工具名和参数，执行工具，记录 trace；第五，把工具结果追加为 observation 并继续。所有复杂 Agent 最后都会回到这五件事，只是多了权限、并发、记忆、检索、human handoff 和评测。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

mock model 第一步调用 calculator 计算 `120*0.08`，runner 执行工具得到 9.6；第二步模型基于 observation 输出 final。这个例子很小，但已经包含了 Agent 的关键闭环：模型不会自己算也不会自己执行，它提出可执行意图；runner 执行并把证据还给模型。

## 你要怎么做

本仓库会生成 `projects/mini_agent/mini_agent.py`。你要读懂 `MiniAgent.run()`：它如何验证工具、如何把工具错误作为 observation、如何在 max_steps 后停止。然后你要加一个 `mock_dataset_inspector` 工具，让它能返回字段缺失、样本不足和 common support 风险。

## 常见误区：错在哪里，正确理解是什么

错误理解：Agent loop 就是 ReAct prompt 里写几行 Thought/Action/Observation。

正确理解：ReAct 是一种提示/轨迹格式；真正的 loop 是应用代码控制的状态机，负责调用模型、执行工具、更新状态和停止。

真正的 gap：prompt 格式靠模型自觉；runtime loop 靠代码约束。生产 Agent 必须让关键边界落在代码和测试里。

## 工业案例与可迁移经验

Swarm 用非常轻的 client-side loop 展示工具执行和 handoff；Claude Code 文档把 loop 拆成上下文收集、行动、验证。两者共同说明：Agent 的核心不是神秘框架，而是反复把观察转为下一步行动。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

具体 SDK 名称和工具事件格式会变；loop 的控制流和失败分支是稳定工程基础。
