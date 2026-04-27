# Model and Framework Selection

## 本节总览

模型和框架选择不是宗教问题，而是约束优化：质量、稳定性、工具调用、上下文、成本、延迟、部署、数据合规、可观测性和团队熟悉度共同决定。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：fast-changing
- 主要来源：openai-practical-guide-agents, qwen-agent-github, kimi-k2-github, glm-45-overview, glm-function-calling, deepseek-function-calling, xai-function-calling
- 关键断言：claim-model-selection-eval-first, claim-qwen-agent-ecosystem, claim-kimi-k2-agentic, claim-glm-agent-function-calling, claim-tool-schema-shape-not-semantics

本节包含快速变化项目、模型或 API。学习时按当前课程理解架构动机，具体版本和字段以后必须复核。

## 为什么学

如果你先选框架，再找问题适配，很容易被框架能力牵着走。更好的方式是先建立自己的 eval set 和 runtime 需求：工具多少、是否长任务、是否需沙箱、是否需私有化、是否要国产模型、是否要低成本批量运行。

## 核心机制

模型选择先用强模型建立质量上限，再尝试便宜/快/可私有化模型替换；框架选择先看你是否需要 durable execution、多 agent、MCP、UI 编排、沙箱、企业权限。手搓适合理解和小项目；框架适合复杂状态和协作；产品平台适合快速集成和运营。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

Marketing Evaluation Agent 初版用手搓 loop 最清楚；若后续需要长任务和可恢复状态，可看 LangGraph；若主要用 Qwen 生态和本地工具，可看 Qwen-Agent；若要复杂 SuperAgent，可研究 DeerFlow；若要个人长期记忆和 gateway，可研究 Hermes。

## 你要怎么做

写一张选择矩阵：候选模型/框架、工具调用支持、上下文、部署、成本、可观测性、安全、生态、适合本项目程度、验证计划。

## 常见误区：错在哪里，正确理解是什么

错误理解：排行榜第一的模型就是 Agent 最佳模型。

正确理解：Agent 模型要看工具调用可靠性、长上下文处理、指令遵循、成本延迟和在你的 eval set 上的表现。

真正的 gap：通用 benchmark 评估模型能力；项目 eval 评估产品适配。

## 工业案例与可迁移经验

Kimi K2、GLM-4.5、DeepSeek、xAI、Qwen-Agent 等资料说明国产和全球模型/框架都在强化 tool calling 和 agentic 能力。课程会标注核验日期，不写永久结论。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

模型版本、价格、上下文长度、API 支持变化极快；eval-first 的选择流程稳定。
