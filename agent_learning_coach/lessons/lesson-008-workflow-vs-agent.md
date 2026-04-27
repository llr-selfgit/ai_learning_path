# Workflow vs Agent

## 本节总览

不是所有自动化都应该 Agent 化。好的产品往往是 workflow 和 Agent 的混合：确定性强、风险高的地方用固定流程；信息不完整、路径多变的地方让模型决策。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：stable
- 主要来源：anthropic-building-effective-agents, openai-practical-guide-agents
- 关键断言：claim-workflow-agent-distinction, claim-simplest-agentic-design-first

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

营销评估有些环节不该让模型自由发挥：字段检查、样本量阈值、SMD 计算、common support 诊断、报告结构都应固定。模型适合做的是澄清需求、选择候选方法、解释诊断、生成面向业务的自然语言报告和提出补数建议。

## 核心机制

workflow 是预定义路径，优势是可控、可测、可合规；Agent 是动态路径，优势是处理歧义、异常和自然语言。Anthropic 的 patterns 可以看作复杂度阶梯：prompt chaining 适合线性拆分；routing 适合分类分流；parallelization 适合独立子任务；orchestrator-workers 适合动态分解；evaluator-optimizer 适合迭代改进。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

Marketing Evaluation Agent 可以固定 `inspect -> method_router -> estimate -> diagnose -> report`，但在 method_router 内让模型根据业务目标和诊断选择 PSM/DML/ITE/拒绝因果结论。这样既避免全自由，也不把复杂判断写死成脆弱规则。

## 你要怎么做

画一张两列图：左列是 deterministic workflow，右列是 model decision。把每一步标注为什么固定或为什么交给模型，并写一条失败时的 fallback。

## 常见误区：错在哪里，正确理解是什么

错误理解：越 autonomous 越高级。

正确理解：越贴近业务风险，越要把关键路径固定和评测；autonomy 应服务效果，不是产品装饰。

真正的 gap：自治程度是成本和风险，不是荣誉徽章。好的 Agent 只在需要判断的地方自主。

## 工业案例与可迁移经验

Anthropic 明确建议先用最简单可行方案，再增加 agentic complexity。OpenAI guide 也强调要验证用例是否真的适合 Agent。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

具体 pattern 名称可能流行变化；workflow/agent 的工程取舍稳定。
