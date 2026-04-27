# Tool Registry and Guardrails

## 本节总览

工具注册表是 Agent 的“可行动边界”。没有注册表，模型看到的是一堆函数；有注册表，系统知道每个工具的用途、风险、权限、参数、超时和失败返回。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：changing
- 主要来源：openai-practical-guide-agents, openai-agents-sdk-guardrails, mcp-specification
- 关键断言：claim-tool-schema-shape-not-semantics, claim-guardrails-layered, claim-mcp-security-permission

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

营销评估工具里有读数据、跑估计、生成报告、可能写入看板或发消息。读字段和发正式结论的风险完全不同。如果所有工具都以同样方式暴露给模型，Agent 会缺少行动分级：低风险工具可自动执行，高风险工具需要确认，危险工具在测试环境禁用。

## 核心机制

一个工具注册表至少包含：tool name、description、input schema、output schema、risk level、permission、timeout、retry policy、handler、guardrails。runner 不直接执行任意函数，而是只按注册表查找。unknown tool、bad args、permission denied、timeout、handler error 都要变成结构化 observation。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

`inspect_dataset` 是 read-only low risk，可自动执行；`estimate_dml` 是 medium risk，因为会消耗计算资源且可能被误读；`publish_report_to_dashboard` 是 high risk，必须人类确认。注册表把这种差异写进代码，而不是寄希望于模型自己谨慎。

## 你要怎么做

在 mini-agent 里增加 `ToolSpec(risk, required, handler)`。先写单测再改代码：未知工具应返回 `tool_error:unknown_tool`；缺参数应返回 `bad_args`；handler 抛异常应记录失败但允许模型下一轮降级。

## 常见误区：错在哪里，正确理解是什么

错误理解：工具越多，Agent 越强。

正确理解：工具越多，选择空间、误用风险和上下文噪声也越大。工具要可发现、可区分、可测试、可授权。

真正的 gap：堆工具提升潜在能力；工具治理提升可靠能力。真正可用的 Agent 重视后者。

## 工业案例与可迁移经验

OpenAI guide 把工具按 data/action/orchestration 分类，并建议对工具风险分级；MCP 规范强调用户同意、数据隐私和工具安全。你的注册表会把这些原则落进本地代码。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

MCP 字段和 SDK guardrail API 会变化；工具风险分级和集中注册是稳定模式。
