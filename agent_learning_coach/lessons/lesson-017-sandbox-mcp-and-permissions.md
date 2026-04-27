# Sandbox, MCP, and Permissions

## 本节总览

一旦 Agent 能读文件、跑命令、打开浏览器或连 MCP，安全问题就从“回答错了”升级为“真的做错事”。权限和沙箱不是附加功能，而是 Agent 能否被信任的前提。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：fast-changing
- 主要来源：mcp-specification, claude-code-how-works, openhands-github, bytedance-deerflow-github, hermes-agent-github
- 关键断言：claim-mcp-security-permission, claim-claude-code-loop, claim-openhands-software-agent, claim-deerflow-superagent-2, claim-hermes-memory-skills-cron

本节包含快速变化项目、模型或 API。学习时按当前课程理解架构动机，具体版本和字段以后必须复核。

## 为什么学

Marketing Evaluation Agent 可能读取敏感业务数据，coding agent 可能修改代码和运行命令，personal agent 可能访问邮箱和日历。工具越强，权限边界越重要。MCP 让工具生态更丰富，也让工具信任链更长。

## 核心机制

权限矩阵至少分 read、write、execute、network、secret、publish。沙箱限制工具可访问的文件和命令；MCP server 以协议形式暴露工具、资源和 prompts；runner 负责在调用前检查权限，在调用后记录 trace。高风险动作要 human confirmation。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

读取脱敏 CSV 是 read-only；运行 Python 分析是 execute；把报告发到飞书是 publish；读取 API key 是 secret。前三者可以分别设置不同确认门槛，secret 默认不应暴露给模型上下文。

## 你要怎么做

为本项目写一个权限表：dataset inspector、psm estimator、dml estimator、uplift estimator、report writer、publish dashboard、bash、filesystem、browser。标注是否允许自动执行。

## 常见误区：错在哪里，正确理解是什么

错误理解：本地运行就安全。

正确理解：本地运行只减少第三方托管风险，但本地 Agent 仍可能被 prompt injection、恶意文件、恶意工具或泄漏凭证影响。

真正的 gap：部署位置解决数据在哪里；权限和沙箱解决 Agent 能做什么。

## 工业案例与可迁移经验

Claude Code、OpenHands、DeerFlow、Hermes 都围绕文件、命令、浏览器、沙箱或终端后端做设计。它们的共同点是：强 Agent 必须有强环境边界。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

MCP 规范和各产品权限模型变化快；权限分级、最小权限和沙箱隔离稳定。
