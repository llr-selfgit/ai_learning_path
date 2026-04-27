# Hermes Skills, Memory, and Cron

## 本节总览

Hermes 的价值在于展示一个 Agent 如何跨会话成长：记住经验、沉淀技能、定时运行、通过多个入口交互。但成长能力越强，治理要求越高。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：fast-changing
- 主要来源：hermes-agent-github, google-adk-memory
- 关键断言：claim-hermes-memory-skills-cron, claim-adk-state-memory-runner

本节包含快速变化项目、模型或 API。学习时按当前课程理解架构动机，具体版本和字段以后必须复核。

## 为什么学

你的学习督导台也需要记忆：哪些知识点薄弱、哪些作业做错、哪些概念需要复习。Marketing Evaluation Agent 也需要沉淀 bad case 和报告模板。Hermes 的 memory/skills/cron 可以给这些设计启发，但自动创建或修改技能必须有审查。

## 核心机制

memory 解决跨会话 recall；skills 把重复过程固化成可复用程序化知识；cron 让 Agent 主动在未来时间执行；gateway 让不同渠道接入同一 Agent；subagents 支持并行或隔离任务。每项能力都需要权限、版本和回滚。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

学习督导台可以每天根据错题生成复习提醒，这是 cron 的正面用法；但如果 Agent 自动修改评分规则或课程内容，就必须走 human review，因为这会改变学习路径本身。

## 你要怎么做

为学习督导台写 memory policy：可记忆什么、不可记忆什么、何时过期、如何查看和删除、哪些技能可自动创建、哪些必须人工确认。

## 常见误区：错在哪里，正确理解是什么

错误理解：Agent 自己学会新技能一定是好事。

正确理解：技能沉淀能提高效率，但也可能固化错误、扩大权限或污染后续行为。自改进必须可审计、可回滚。

真正的 gap：记忆让系统更懂你；治理让系统不会错误地“太懂你”。

## 工业案例与可迁移经验

Hermes README 描述 persistent memory、skills、cron、gateway 和 subagents。我们把它作为可迁移模式库，而不是无条件推荐全量引入。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

Hermes 项目变化很快；记忆、技能和计划任务的产品治理问题稳定。
