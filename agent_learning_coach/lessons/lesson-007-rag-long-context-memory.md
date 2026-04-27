# RAG, Long Context, and Memory

## 本节总览

RAG、长上下文和记忆不是互相替代的三种名词，而是三种不同的知识供给方式。Agent 的关键能力是知识路由：这条信息应该固定进 policy、直接放上下文、检索、记忆，还是人工确认。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：anthropic-long-context-tips, openai-practical-guide-agents, google-adk-memory, qwen-agent-github
- 关键断言：claim-context-engineering-not-token-stuffing, claim-adk-state-memory-runner, claim-qwen-agent-ecosystem

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

营销评估 Agent 会面对活动规则、数据字典、指标口径、用户偏好、历史 bad case、模型选择策略。把所有东西都放进 prompt 会污染决策；把所有东西都检索会漏掉关键政策；把所有东西都记忆会带来隐私和过期风险。

## 核心机制

direct context 适合当前任务必需且体量小的信息；RAG 适合外部知识库中按需查找的材料；long context 适合少量大文档需要整体阅读；short-term state 适合本次任务过程；long-term memory 适合跨会话偏好、项目常识和可复用经验。每种都要有 freshness、source、confidence 和 delete/update 机制。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

公司指标口径文档适合 RAG；本次活动的字段检查结果适合 short-term state；你偏好“先给诊断再给建议”可进入 long-term memory；因果结论边界应固定进 system/developer policy；某个 Excel 原始表不应无脑长期记忆。

## 你要怎么做

为 Marketing Evaluation Agent 写一张知识路由表：信息类型、来源、生命周期、进入方式、更新机制、误用风险。把“活动规则”“数据字典”“上次评估结论”“用户偏好”“bad case”分别放进去。

## 常见误区：错在哪里，正确理解是什么

错误理解：RAG 只是给模型加资料，越多越好。

正确理解：RAG 是有召回、排序、引用、压缩和拒答边界的检索系统；错误召回会制造更有依据的幻觉。

真正的 gap：资料数量提升覆盖；知识路由提升相关性和可信度。

## 工业案例与可迁移经验

ADK memory 文档把完成 session 加入 memory，再通过工具召回；Qwen-Agent 同时覆盖 RAG、code interpreter 和 MCP。这说明记忆和检索应作为可控工具进入 Agent，而不是不可见背景魔法。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

各平台 RAG 工具、向量库能力、记忆 API 会变；知识生命周期和路由原则稳定。
