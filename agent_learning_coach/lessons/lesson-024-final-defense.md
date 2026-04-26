# 最终答辩：Marketing Evaluation Agent v1

## 验收目标

你需要展示一个可运行的营销评估 Agent，并解释它如何把大模型工程、因果推断工具化、评测与产品体验连接起来。

## 必须交付

- Agent demo。
- 至少 50 条评测 case。
- 工具 schema 与 trace 样例。
- bad case 分析。
- 技术设计文档。
- 模型/Agent 优化路线。

## 答辩问题

1. 你的 system prompt 如何防止过度归因？
2. Agent 如何判断应该用 PSM、DML、ITE 还是预测？
3. 如果工具返回 common support 差，报告如何降级？
4. 你如何评测 Agent 的方法选择是否正确？
5. 下一步你会先优化 prompt、工具、RAG、模型还是微调？为什么？
