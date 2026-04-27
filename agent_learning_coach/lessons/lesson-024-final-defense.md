# Final Defense

## 本节总览

最终答辩不是考你背了多少概念，而是证明你能把模型、工具、上下文、harness、因果工具、eval 和产品判断连成一个可运行系统。

这节课要解决的不是“记住一个名词”，而是让你在真实项目里知道该把这个能力放在哪一层、怎样写成接口、怎样验证它没有被误用。你学完后要能把它迁移到 Marketing Evaluation Agent，而不是只在题目里答对定义。

## 准确性与来源

- 核验日期：2026-04-28
- 稳定性：stable
- 主要来源：openai-practical-guide-agents, openai-agent-evals, anthropic-building-effective-agents
- 关键断言：claim-agent-needs-loop-state-tools-evals, claim-agent-evals-need-trajectory, claim-causal-agent-must-refuse-overclaim

本节主要是架构和工程方法，具体平台实现仍需按来源复核。

## 为什么学

一个真正懂 Agent 的工程师，应该能同时讲清三层：代码怎么跑，方法为什么可靠，产品边界在哪里。只会代码，不够；只会架构图，不够；只会业务话术，也不够。

## 核心机制

答辩材料包括：系统架构图、核心 loop、工具 registry、context packet、method router、causal tool output、trace 示例、eval 结果、bad case 失败复盘、产品方案、风险边界、下一步路线。每个结论都要有证据。

```text
user/task
  -> context packet
  -> model decision
  -> tool/action or final
  -> observation + trace
  -> next decision or stop
```

## 业务例子

当评委问“为什么不用 DeerFlow 直接做”时，你应回答：初版任务短、工具少、状态简单，手搓 loop 更可控；未来若出现长任务、多角色并行、复杂沙箱和 gateway 需求，再参考 DeerFlow/Hermes 的设计。

## 你要怎么做

准备一次 15 分钟答辩：5 分钟 demo，5 分钟架构和 trace，3 分钟 eval/bad case，2 分钟风险和路线。提交源码路径和答辩稿。

## 常见误区：错在哪里，正确理解是什么

错误理解：最终项目只要能跑通一次就算完成。

正确理解：最终项目要能解释、复现、评测、拒绝、降级和迭代。一次跑通只能证明 demo 存在。

真正的 gap：能跑是工程起点；可证据化才是交付标准。

## 工业案例与可迁移经验

整门课的工业案例都要回到同一个问题：这些公司/项目为什么这么设计，哪些设计能迁移到你的业务，哪些因为复杂度或风险暂不引入。

注意：如果这里出现公司、框架、模型或产品能力，均以本节准确性面板绑定来源为准。对未核验的营销口径、社区热帖和传闻，不写成事实。

## 操作检查点

完成本节前，请留下一个可复核产物：

- 解释：用 5-8 句话说明本节机制如何服务 Marketing Evaluation Agent。
- 实操：完成课程预览区的 practice task，并写明产物路径或设计文本。
- 迁移：说明同一机制还能迁移到哪个 Agent 场景。

## 本节最容易过期的内容

答辩中引用的项目版本需按来源复核；交付证据结构稳定。
