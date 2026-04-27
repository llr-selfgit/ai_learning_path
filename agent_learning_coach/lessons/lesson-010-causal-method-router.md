# Causal Method Router

## 本节总览

因果推断在这门课里不是让你重学算法，而是把你的专业能力变成 Agent 的方法选择器。真正难的是让 Agent 知道什么时候不要用算法。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：stable
- 主要来源：openai-practical-guide-agents, anthropic-building-effective-agents
- 关键断言：claim-causal-agent-must-refuse-overclaim, claim-causal-tools-agent-contract

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

业务方常常问“活动是不是有效”，但数据可能只支持相关性、预测或描述。Agent 如果只学会调用 PSM/DML/ITE，会把专业工具变成过度归因机器。method router 的任务是先判断问题类型和数据条件，再允许或禁止工具调用。

## 核心机制

PSM 适合处理变量二元、可观测混杂较完整、需要匹配或加权且 common support 尚可的场景；DML 适合高维协变量、需要正交化并估计平均处理效应的场景；ITE/uplift 适合关注人群异质性和策略排序的场景。若缺少处理前协变量、样本不足、干预和结果时间顺序不清、强选择偏差无法解释，就应降级。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

优惠券活动如果有领取前消费、活跃度、渠道、会员等级等协变量，且领取和未领取人群重叠，可以考虑 PSM；如果协变量高维、模型灵活且目标是 ATE，可以考虑 DML；如果目标是下一轮定向投放人群排序，考虑 uplift。但若只有活动后购买额和是否会员，不能声称活动导致提升。

## 你要怎么做

写 `select_method(task_goal, data_diagnostics)` 的路由表。返回 `method, reason, required_checks, causal_claim_allowed, downgrade_path`。至少覆盖五个拒绝条件。

## 常见误区：错在哪里，正确理解是什么

错误理解：Agent 只要知道 PSM/DML/ITE 的定义，就能自动选对方法。

正确理解：方法选择依赖业务目标、数据生成过程、识别假设和诊断指标。定义只是入口，不是决策。

真正的 gap：概念知识回答“这是什么”；路由能力回答“此刻该不该用”。

## 工业案例与可迁移经验

这里的公司来源是 agent 可靠性和 guardrail 原则；具体因果规则是课程基于你的业务背景做出的工程推论，因此会在 claim 中标为 inference，而不是冒充某公司实践。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

公司工具 API 会变；因果识别边界和诊断优先原则稳定。
