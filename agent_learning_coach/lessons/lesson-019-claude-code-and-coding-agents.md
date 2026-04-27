# Claude Code and Coding Agents

## 本节总览

Coding agent 是最成熟的 Agent 形态之一，因为代码任务天然有可执行工具、可验证测试和可追踪 diff。它们是学习 Agent runtime 的好教材。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：fast-changing
- 主要来源：claude-code-how-works, claude-code-agent-loop, openhands-github, bytedance-trae-agent
- 关键断言：claim-claude-code-loop, claim-openhands-software-agent, claim-trae-agent-software-engineering

本节包含快速变化项目、模型或 API。学习时按当前课程理解架构动机，具体版本和字段以后必须复核。

## 为什么学

你要做的 Marketing Evaluation Agent 也需要类似能力：读项目上下文、调用工具、生成产物、运行测试、检查结果、修复失败。coding agent 的 loop 可以迁移成 analytics agent 的 loop：inspect data -> run estimator -> validate diagnostics -> write report -> run eval。

## 核心机制

coding agent 通常先搜索文件和约束，形成上下文；再编辑或运行命令；然后用测试、lint、截图或日志验证；失败则继续循环。关键不是“会写代码”，而是每一步都有环境反馈。没有验证，Agent 只是文本生成器。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

Claude Code 修改代码后会运行测试验证；Trae Agent 记录 trajectories；OpenHands 强调能修改代码、运行命令、浏览和调用 API。这些能力对营销评估同样对应：生成分析计划后必须运行诊断和回归测试。

## 你要怎么做

写一张迁移表：coding agent 的 file search、edit、bash、test、diff、PR review 分别对应 Marketing Agent 的 dataset inspect、method route、estimate、diagnostics、report diff、human review。

## 常见误区：错在哪里，正确理解是什么

错误理解：coding agent 的经验只适用于写代码。

正确理解：coding agent 之所以有效，是因为它有可执行环境和验证闭环；任何可工具化、可验证的知识工作都能迁移这套结构。

真正的 gap：领域不同，控制流相似。学习工业案例要抽取结构，而不是照抄界面。

## 工业案例与可迁移经验

Claude Code 文档明确描述 agentic loop；OpenHands 和 Trae Agent 开源仓库展示了软件工程 agent 的工具和轨迹设计。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

产品能力变化快；gather/action/verify 的闭环稳定。
