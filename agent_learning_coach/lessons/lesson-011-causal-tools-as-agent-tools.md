# Causal Tools as Agent Tools

## 本节总览

算法工具化不是把函数暴露出去，而是把算法的适用条件、诊断结果和解释边界一起暴露出去。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：stable
- 主要来源：openai-practical-guide-agents, openai-agent-evals
- 关键断言：claim-causal-tools-agent-contract, claim-tool-schema-shape-not-semantics

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

如果工具只返回 `effect=0.12`，Agent 会天然倾向写“提升 12%”。如果工具同时返回 `poor_common_support=true`、`max_smd_after=0.31`、`causal_claim_allowed=false`，Agent 才有证据写“当前不能给出可信因果结论，最多作为探索性相关信号”。

## 核心机制

一个因果工具应有三层输出：估计层给 ATT/ATE/CATE 或 uplift；诊断层给 balance、support、overlap、sample、model residual 或 top-k lift；政策层给 warnings 和 allowed flags。runner 不应把工具输出直接交给业务，而要让 report writer 读取政策层决定措辞。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

PSM 工具输出 `ate=18.2, ci=[2.1,34.3], max_smd_after=0.07, common_support='ok'` 时可以写弱因果结论；若 `max_smd_after=0.28, common_support='poor'`，数字仍可展示为探索性结果，但最终结论必须降级。

## 你要怎么做

阅读现有 `projects/marketing_eval_agent/causal_tools`。补一层统一 wrapper：所有工具都返回同一个外层 schema。注意这不是工业级完整库，而是 Agent 工具契约练习。

## 常见误区：错在哪里，正确理解是什么

错误理解：工具输出越简洁，Agent 越容易用。

正确理解：工具输出要对模型友好，但不能丢掉限制条件。少字段会让模型少看见风险。

真正的 gap：简洁报告服务人类阅读；工具契约服务机器决策。二者要分层。

## 工业案例与可迁移经验

OpenAI guide 强调工具要标准化、可测试、可复用；本节把这个原则迁移到 PSM/DML/uplift 的专业算法产品化。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

你未来可替换更强算法实现；统一工具契约和诊断边界应保持。
