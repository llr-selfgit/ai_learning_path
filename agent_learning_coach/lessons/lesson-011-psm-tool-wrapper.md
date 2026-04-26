# PSM 工具封装、诊断与降级

## 学习目标

把 PSM 封装成一个 Agent 工具：它的重点不是算法炫技，而是输入校验、诊断、风险提示和业务报告。

## 工具边界

PSM 工具至少处理：

- propensity score 估计。
- nearest matching 或 weighting。
- common support 检查。
- SMD 平衡性诊断。
- ATT/ATE 估计。
- 风险提示。

## Agent 使用策略

适合 PSM 的场景：

- 二元 treatment。
- 有足够预处理协变量。
- treatment assignment 可以被观测协变量较好解释。
- common support 还可以。

不适合强因果结论的场景：

- 关键混杂变量缺失。
- treatment/control 几乎不可比。
- 样本量太小。
- treatment 是连续强度且未做合适建模。

## 代码题

阅读 `projects/marketing_eval_agent/causal_tools/psm.py`，补一个 bad case 测试：当 treatment 组和 control 组 propensity score 几乎无重叠时，工具必须返回 warning，并把 `causal_claim_allowed` 置为 `false`。
