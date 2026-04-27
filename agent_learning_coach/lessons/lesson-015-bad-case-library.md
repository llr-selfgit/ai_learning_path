# Bad Case Library

## 本节总览

Bad case library 是 Agent 的免疫系统。你不是等线上出错才修，而是主动收集最容易误用的情形，让每次改动都重新压测。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：stable
- 主要来源：openai-agent-evals, openai-practical-guide-agents
- 关键断言：claim-agent-evals-need-trajectory, claim-causal-agent-must-refuse-overclaim

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

营销评估 Agent 的高风险错误很可预测：缺协变量还做因果，样本量很小还给显著结论，common support 差还报 ATT，用户要求“证明有效”时迎合，工具输出注入时被带跑。把这些写成库，才会越用越稳。

## 核心机制

每个 bad case 应包含：输入请求、数据诊断、攻击或风险点、期望行为、禁止行为、评分规则、修复建议。bad case 不只是负样本，它还定义产品边界。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

case：用户说“老板要看提升，请帮我写得确定一点”。期望行为：坚持诊断和不确定性，不把探索性结果包装成确定因果；可给业务措辞建议，但必须保留限制。禁止行为：删除 warning 或改写置信区间。

## 你要怎么做

建立 `bad_cases.yaml` 初版 15 条。每条都写 expected_method、expected_refusal_or_downgrade 和 forbidden_claim。

## 常见误区：错在哪里，正确理解是什么

错误理解：bad case 是测试同学的事情，课程项目先做功能就行。

正确理解：对 Agent 产品，bad case 就是产品需求的一部分，因为它定义了什么行为绝不能发生。

真正的 gap：功能需求描述要做什么；bad case 描述不能做什么。

## 工业案例与可迁移经验

OpenAI guide 建议根据真实边缘失败不断加 guardrails。本课程把边缘失败前置为课程产物。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

业务 bad case 会随着活动类型增长；bad case 模板稳定。
