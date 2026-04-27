# Marketing Evaluation Agent v0

## 本节总览

v0 不追求完整估计，而是训练 Agent 的“业务入口能力”：把模糊营销问题变成可执行、可拒绝、可复核的分析计划。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：stable
- 主要来源：openai-practical-guide-agents, anthropic-building-effective-agents
- 关键断言：claim-causal-agent-must-refuse-overclaim, claim-agent-needs-loop-state-tools-evals

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

内部算法服务的瓶颈常常不是模型不会算，而是需求入口混乱：活动目标不清、指标口径不清、处理变量不清、数据窗口不清、是否能做因果不清。Agent v0 的价值是让每个需求先通过同一套结构化门禁。

## 核心机制

v0 的 loop 包含四步：clarify intent，inspect fields，select candidate method，produce analysis plan。它只输出计划，不输出最终因果结论。method selection 先由规则和诊断约束，再让模型解释为什么。缺关键字段、样本不足或目标不是因果问题时，v0 必须拒绝估计并给补充清单。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

用户说“评估会员体系 ROI”。v0 应追问：会员权益上线时间、目标人群、处理定义、结果窗口、成本口径、是否有实验或准实验设计。字段检查发现只有会员状态和购买额，没有上线前协变量，就输出“当前只能做描述或预测，不能做可信因果结论”。

## 你要怎么做

把 mini-agent 接一个 mock dataset inspector。输入自然语言需求，输出 JSON：`task_goal, required_fields, missing_fields, candidate_methods, refusal_or_next_step, report_outline`。

## 常见误区：错在哪里，正确理解是什么

错误理解：v0 必须能跑出估计值才有价值。

正确理解：v0 的价值是需求澄清和方法门禁。错误估计比没有估计更危险。

真正的 gap：估计工具回答“数字是多少”；v0 回答“这个问题能不能被这样估计”。

## 工业案例与可迁移经验

OpenAI guide 强调 agent 适合复杂决策和不完整信息下的工作流；营销评估 v0 正是把这种能力用于分析入口治理。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

业务字段名会变；需求澄清、字段门禁和拒绝过度归因的流程稳定。
