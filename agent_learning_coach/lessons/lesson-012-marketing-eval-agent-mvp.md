# Marketing Evaluation Agent MVP

## 本节总览

MVP 的目标不是做一个漂亮 demo，而是跑通一条可信链路：每个结论都能追到字段、工具、诊断和限制。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：stable
- 主要来源：openai-practical-guide-agents, openai-agent-evals
- 关键断言：claim-causal-agent-must-refuse-overclaim, claim-causal-tools-agent-contract, claim-agent-evals-need-trajectory

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

内部业务真正需要的是能减少沟通成本、降低误用风险、提升分析交付质量的 Agent。一个只会生成自然语言报告的系统不够；一个只会跑算法的系统也不够。MVP 要把二者接起来，并把不可做的情况明确说出来。

## 核心机制

MVP 分五个节点：inspect 读取数据结构和质量；select method 依据任务与诊断选择方法；estimate 调用对应工具；diagnose 判断输出是否允许因果结论；report 把技术结果翻译成业务结论、行动建议和风险边界。trace 贯穿全程。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

当 uplift top10% 显著高于平均，但整体 ATE 不显著时，报告不能写“活动整体有效”，而应写“整体效果证据不足，但存在可用于下一轮定向触达的人群异质性信号；建议做小流量验证”。

## 你要怎么做

用 mock 数据跑一条完整链路。提交时给三样东西：最终报告、trace JSON、工具输出 JSON。没有 trace 的报告不算完成。

## 常见误区：错在哪里，正确理解是什么

错误理解：MVP 只要能回答一个 happy path 就够。

正确理解：Agent MVP 必须先覆盖拒绝、降级和工具失败，否则 happy path 只是演示脚本。

真正的 gap：demo 展示能力；MVP 展示边界和恢复能力。

## 工业案例与可迁移经验

OpenAI agent evals 和 tracing 思路会在后续用于评估这条链路。现在先让 MVP 的每一步都可观测。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

报告模板会随业务反馈调整；inspect/select/estimate/diagnose/report 的链路稳定。
