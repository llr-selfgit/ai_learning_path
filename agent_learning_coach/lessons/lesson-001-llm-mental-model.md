# LLM 应用工程心智模型

## 学习目标

学完这一节，你应该能把 LLM 应用拆成五个层次：模型、上下文、工具、运行环境、评测闭环。后续所有 Agent 工程问题，都可以先放进这个框架里定位。

## 直觉版

传统算法系统里，模型只是系统的一部分。你不会只训练一个 LTV 模型就说产品完成了，还要有特征、样本、校验、监控、报表和业务动作。LLM 也是一样。

一个 Agent 不是“一个大模型”。它更像一个会调用工具的运行系统：

- 模型负责理解、推理和生成。
- 上下文负责告诉模型现在该扮演谁、知道什么、能做什么。
- 工具负责连接外部世界，比如 SQL、Python、文档、浏览器、业务 API。
- Harness 负责让工具调用可执行、可观察、可控制。
- Evals 负责判断它是不是稳定可靠，而不是碰巧答对。

## 正式版

LLM 应用的核心输入不是单条 prompt，而是一组结构化运行条件：

- Instructions：system/developer 级规则。
- User messages：用户当前意图。
- Retrieved context：检索到的知识、数据字典、业务口径。
- Tool definitions：模型能调用哪些工具、每个工具需要什么参数。
- Runtime state：当前任务状态、历史步骤、权限、预算、超时。
- Output schema：最终答案或工具参数必须满足的结构。

这就是为什么现在越来越多人讲 context engineering 和 harness engineering：工程质量取决于你如何组织运行环境，而不仅是某一句 prompt 写得漂亮。

## 工程版

一个最小 Agent 运行记录可以长这样：

```json
{
  "task": "评估会员活动 A 对 30 日 LTV 的影响",
  "instructions": "不要在因果假设不足时给确定性结论",
  "tools": ["inspect_dataset", "estimate_psm", "write_report"],
  "steps": [
    {"type": "plan", "text": "检查处理组、对照组、协变量和 outcome"},
    {"type": "tool_call", "name": "inspect_dataset"},
    {"type": "observation", "summary": "样本量足够，但 common support 可能较差"},
    {"type": "tool_call", "name": "estimate_psm"},
    {"type": "final", "text": "给出带风险提示的评估报告"}
  ]
}
```

## 产品版

好产品不是让模型自由发挥，而是让用户觉得：

- 它知道自己的边界。
- 它会问关键澄清问题。
- 它能调用正确工具。
- 它能解释为什么这样做。
- 它失败时能降级，而不是胡说。

## 工业案例

- OpenAI Agents SDK 强调 tools、handoffs、guardrails、traces，本质是让 Agent 运行过程可组合、可追踪。
- Anthropic 的 workflow vs agent 思路强调：能用确定性 workflow 解决的，不要一开始就放任 Agent 自主规划。
- Google ADK 把 Agent、tool、deployment、eval 组织成框架，适合企业级工程化。

## 迁移练习

把“营销活动评估”拆成这五层：

1. 模型：负责理解业务问题和生成报告。
2. 上下文：活动口径、指标定义、因果假设、工具说明。
3. 工具：拉数、PSM/DML/ITE/LTV 预测、平衡性诊断。
4. Harness：权限、沙箱、trace、超时、降级。
5. Evals：方法选择是否正确、工具参数是否正确、报告是否过度归因。

## 深度作业

用 300-500 字解释：为什么“会调 LLM API”不等于“会做 Agent 产品”？请必须包含 context、tools、evals 三个词。
