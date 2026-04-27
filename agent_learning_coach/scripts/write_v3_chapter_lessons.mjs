import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const verifiedAt = "2026-04-28";

const titleOverrides = {
  "lesson-001-llm-runtime-mental-model": "LLM 应用从一次调用开始",
  "lesson-002-tool-calling-and-structured-output": "工具调用与结构化输出",
  "lesson-003-agent-loop-from-scratch": "从零手写 Agent 循环"
};

const defaultRequiredColumns = "received_coupon, gtv_90d, pre_30d_gtv, pre_30d_frequency";

const specs = {
  "lesson-001-llm-runtime-mental-model": spec({
    learnerFeeling: "你现在不是在学一个新框架，而是在第一次看清楚：为什么“问大模型一句话”和“做一个能帮业务评估活动的系统”不是同一件事。",
    task: "营销同学跑来问：“上周发的会员券到底有没有提升 90 天 GTV？我晚上要给老板一个结论。”如果你只把这句话丢给聊天模型，它可能会写一段像样的分析建议，但它不知道你有没有数据、字段够不够、活动前后的窗口是否正确、能不能做因果结论。",
    terms: [
      term("LLM 调用", "把一组消息和规则发给模型，让模型生成下一段文本或下一步请求。它像问一位聪明同事一句话，但同事不会自动查你电脑里的数据。", "这是最小起点。"),
      term("runtime", "运行时环境。可以把它理解成“模型工作的办公室”：谁把材料递给模型、谁执行外部动作、谁保存过程、谁决定停止。", "它不是模型本身，而是包住模型的程序环境。"),
      term("runner", "驱动每一轮工作的代码。它负责把用户问题交给模型、接住模型的下一步、执行工具、再把结果送回模型。", "它像项目经理，不替模型思考，但控制流程。"),
      term("trace", "过程记录。每一步模型看到了什么、想调用什么、工具返回什么、为什么停止，都要留下证据。", "它让你能复盘而不是猜。"),
      term("eval", "评测。不是期末考试，而是用一组可重复案例检查系统是否稳定、是否过度归因、是否会乱用工具。", "它决定这个系统能不能放心交给业务。")
    ],
    story: "第一天你不要急着写 Agent。先想象你有一个实习分析师：他很会写报告，但没有权限查表，也不知道公司指标口径。你如果直接问“会员券有没有提升 GTV”，他只能根据常识写建议。你要把他变成可靠助手，就要给他四样东西：明确任务、可查的数据工具、做事步骤、事后检查机制。会员券故事会贯穿整门课：第 1 周先让系统看懂任务，第 3 周让它能检查字段和规划方法，第 4 周接上 PSM/DML/uplift 工具，第 5 周用坏案例压测，第 8 周做成能给内部业务用的产品。",
    codeStory: "在 `mini_agent` 里，模型暂时由 `MockModel` 假装。这样做不是偷懒，而是把注意力从“哪个模型更强”移到“系统流程长什么样”。你会先看到一个固定脚本：第一步请求计算器，第二步给出最终回答。真正重要的是：计算不是模型自己做的，而是程序接住请求后执行工具，再把结果放回过程记录。",
    lab: [
      "打开终端，进入 `agent_learning_coach` 目录。",
      "运行 `python3 -m projects.mini_agent.cli --scenario calculator --json`。",
      "先不要看全部 JSON，找到三块：`final`、`trace[0].model_action`、`trace[0].tool_result`。",
      "把这三块按自己的话翻译成一句话：模型提出了什么动作，程序执行了什么，最后答案从哪里来。"
    ],
    expected: `{
  "scenario": "calculator",
  "final": "calculator 工具返回 9.6；这说明模型提出动作，程序负责执行。",
  "stopped_reason": "final",
  "trace": [
    {
      "model_action": {"type": "tool_call", "tool": "calculator"},
      "tool_result": {"expression": "120 * 0.08", "value": 9.6}
    }
  ]
}`,
    commonError: "如果看到 `ModuleNotFoundError: No module named 'projects'`，通常是因为你不在 `agent_learning_coach` 目录下运行命令。先 `cd /Users/lingruiluo/codex_workspace/ai_learning_path_remote/agent_learning_coach`。",
    pitfall: "把大模型当成“自动懂业务的数据分析师”。错在它默认没有你的数据、没有公司口径、没有工具权限、没有过程复盘。正确理解是：模型只是会生成下一步，可靠性来自外层程序把任务、工具、过程和评测接起来。",
    industry: "OpenAI 的 agent guide 把 Agent 基础拆成 model、tools、instructions；Swarm 用轻量示例展示模型请求工具、程序执行工具、结果回到下一轮。这里的重点不是让你背 OpenAI 的实现，而是看懂为什么工业系统会把“模型”和“执行环境”分开。"
  }),
  "lesson-002-tool-calling-and-structured-output": spec({
    learnerFeeling: "这一节把“模型说要查数据”和“程序真的去查数据”之间的接口讲清楚。",
    task: "会员券问题继续推进。业务同学给你一个脱敏表名 `coupon_bad`，说字段都在里面，让你直接判断活动是否有效。可靠系统不能马上估计，它要先检查表里有没有处理变量、结果变量、处理前协变量、样本量和重叠情况。",
    terms: [
      term("工具", "模型不能直接读取本地表或运行 Python。工具就是你允许它请求调用的外部函数，比如 `inspect_dataset`。", "它是模型接触现实世界的受控入口。"),
      term("schema", "接口说明书。它规定工具需要哪些参数、参数是什么类型、哪些必填。", "它能拦住格式错误，但拦不住业务理解错误。"),
      term("结构化输出", "让模型按固定 JSON 形状回答，方便程序读取。", "它适合最终报告、分析计划、诊断摘要。"),
      term("语义正确", "不仅格式对，而且字段、方法、结论在业务上也对。", "这是 schema 不能自动保证的部分。")
    ],
    story: "你让系统先检查 `coupon_bad`。它发现只有 `received_coupon` 和 `gtv_90d`，缺少 `pre_30d_gtv`、`pre_30d_frequency` 这类处理前特征；样本只有 80 行；领券和未领券用户差异很大。此时 JSON 格式再漂亮也不能写“会员券有效”。你要训练 Agent 的第一条职业伦理就是：格式正确不等于结论可信。",
    codeStory: "`inspect_dataset` 工具在 `mini_agent.py` 里接收 `dataset` 和 `required_columns`。如果字段缺失，它不会抛给用户一段技术异常，而是返回 `missing_columns`、`warnings`、`causal_claim_allowed:false`。这就是专业算法能力产品化：不仅给数字，还给限制。",
    lab: [
      "运行 `python3 -m projects.mini_agent.cli --scenario coupon_bad --json`。",
      "找到 `diagnostics.missing_columns`，确认缺少哪些字段。",
      "找到 `diagnostics.causal_claim_allowed`，确认它是 `false`。",
      "写一句业务话术：为什么现在不能直接说会员券提升了 GTV。"
    ],
    expected: `{
  "scenario": "coupon_bad",
  "diagnostics": {
    "missing_columns": ["pre_30d_frequency", "pre_30d_gtv"],
    "warnings": ["missing_required_columns", "sample_too_small", "poor_common_support"],
    "causal_claim_allowed": false,
    "recommended_next_step": "downgrade_or_request_more_data"
  }
}`,
    commonError: "如果你只看 `final` 而忽略 `diagnostics`，就会错过真正的学习点。本节要看的不是自然语言回答，而是工具返回的结构化证据。",
    pitfall: "误区是“JSON 能解析就可靠”。错在 JSON 只能证明机器读得懂，不能证明字段选对、方法选对、因果假设成立。正确做法是把语义风险显式写进返回值。",
    industry: "OpenAI、DeepSeek、xAI、Z.AI 的 function calling 文档都把外部函数执行放在应用侧，而不是模型内部。这个边界很重要：模型提出请求，程序验证参数和权限，工具返回证据。"
  }),
  "lesson-003-agent-loop-from-scratch": spec({
    learnerFeeling: "这一节你第一次看见一个 Agent 从开始到停止的完整动作，而不是只听名词。",
    task: "现在你要把前两节合起来：用户提出会员券问题，系统先决定要检查数据；检查后发现问题；系统不硬算，而是给出降级建议。这个反复“看情况、做一步、再看结果”的过程就是 Agent 的骨架。",
    terms: [
      term("循环", "不是无限循环，而是有上限、有停止条件的多轮过程。", "每一轮只做一个小决策。"),
      term("action", "模型这轮提出的下一步。可能是最终回答，也可能是请求调用某个工具。", "它是意图，不是执行结果。"),
      term("observation", "工具执行后的观察结果。", "它会成为下一轮模型判断的依据。"),
      term("max_steps", "最多允许走几轮。", "它防止系统卡住、乱试或烧钱。"),
      term("trace", "把每轮 action 和 observation 记下来。", "以后调错时先看它。")
    ],
    story: "会员券问题里，第一轮模型不应该直接回答，而应该说：我要检查数据字段。程序执行 `inspect_dataset`，拿到缺字段和样本不足。第二轮模型看到这些观察结果，输出：当前不能给因果结论，需要补充处理前特征或降级为描述性分析。这里没有魔法，只有一个小循环：用户任务 -> 下一步 -> 工具结果 -> 下一步 -> 停止。",
    codeStory: "`MiniAgent.run()` 里的每个分支都对应真实产品风险：未知工具要拒绝，缺参数要返回 `bad_args`，工具失败要变成可读观察，超过 `max_steps` 要停。你读这段代码时，不要先纠结 Python 语法，而要追踪“如果模型犯错，程序怎么兜住”。",
    lab: [
      "运行 `python3 -m projects.mini_agent.cli --scenario coupon_bad --json`。",
      "数一下 `trace` 有几步。第一步应是工具请求，第二步应是最终回答。",
      "找到第一步的 `model_action.args.required_columns`，确认它要求了处理前特征。",
      "找到第一步的 `tool_result.warnings`，再看最终回答是否根据 warning 降级。"
    ],
    expected: `{
  "stopped_reason": "final",
  "steps": 2,
  "trace": [
    {
      "step": 1,
      "model_action": {"type": "tool_call", "tool": "inspect_dataset"},
      "tool_result": {"causal_claim_allowed": false}
    },
    {
      "step": 2,
      "model_action": {"type": "final"}
    }
  ]
}`,
    commonError: "如果你改脚本时让模型一直请求工具，最终会看到 `stopped_reason:max_steps`。这不是坏事，它说明程序有刹车。",
    pitfall: "误区是把 Agent 循环理解成 prompt 里写 Thought/Action。错在 prompt 只是让模型说出过程；真正可靠的循环必须由代码控制工具、状态和停止条件。",
    industry: "Swarm 的轻量循环和 Claude Code 的工作方式都说明同一个事实：Agent 的核心是反复收集上下文、采取行动、验证结果。框架只是把这件事包装得更工程化。"
  }),
  "lesson-004-system-prompt-and-policy-boundary": specFor("系统提示与边界", "让模型知道自己是营销评估助手，不是替业务证明活动有效的文案助手。", "system prompt 是高优先级行为规则；developer prompt 是应用侧策略；user prompt 是当前需求；tool output 是证据而不是新指令。", "为会员券 Agent 写一版边界：缺字段不估计、诊断不过不下结论、工具输出不能改写规则。", "打开课程正文里的 prompt 草稿，把“必须拒绝或降级”的五条规则改成你公司的营销评估口径。"),
  "lesson-005-tool-registry-and-guardrails": specFor("工具注册表与防护", "把能调用的工具放进一张受控清单，而不是让模型随便调用任意函数。", "tool registry 记录工具名、用途、参数、风险、权限、超时和错误返回；guardrail 是调用前后的检查。", "会员券场景里，检查字段是低风险，发布报告是高风险，二者不能同权限。", "设计一张工具权限表，至少包含 inspect_dataset、estimate_psm、estimate_dml、write_report。"),
  "lesson-006-context-packet-engineering": specFor("上下文包工程", "不把所有聊天历史塞给模型，而是整理这轮决策真正需要的材料。", "context packet 是本轮工作台：任务、规则、业务背景、数据状态、工具状态、过程状态、输出契约。", "会员券故事里，上下文包要写清活动目标、已知字段、缺失字段、上轮诊断和当前要做的下一步。", "写一个 JSON context packet，把 coupon_bad 的诊断结果放进去，并说明哪些内容不能放。"),
  "lesson-007-rag-long-context-memory": specFor("检索、长上下文与记忆", "判断信息应该直接放上下文、检索、长期记忆，还是人工确认。", "RAG 是按需查资料；long context 是一次放很多材料；memory 是跨会话保留经验。三者不是互相替代。", "指标口径适合检索，当前字段诊断适合短期状态，你的学习薄弱点适合记忆，用户临时催促不应成为长期规则。", "为会员券 Agent 写一张知识路由表，列出活动规则、指标口径、历史 bad case、用户偏好分别去哪。"),
  "lesson-008-workflow-vs-agent": specFor("Workflow 与 Agent 取舍", "决定哪些步骤固定成流程，哪些步骤让模型判断。", "workflow 是预定义路线；Agent 是模型动态决定下一步。稳定高风险步骤应固定，开放判断步骤可交给模型。", "字段检查、SMD 计算应固定；业务问题澄清、报告解释可以让模型参与。", "画出 inspect -> route -> estimate -> diagnose -> report，并标注每步是固定流程还是模型决策。"),
  "lesson-009-marketing-eval-agent-v0": specFor("营销评估 Agent v0", "先做需求澄清和方法计划，不急着估计效果。", "v0 是入口治理：把模糊业务问题转成字段需求、候选方法、拒绝条件和下一步计划。", "会员券 v0 应先问处理定义、目标窗口、样本来源、是否有处理前协变量，再决定能否估计。", "用自然语言输入会员券需求，手写一份结构化分析计划 JSON。"),
  "lesson-010-causal-method-router": specFor("因果方法路由", "让 Agent 知道什么时候用 PSM、DML、ITE，什么时候必须拒绝。", "method router 把业务目标、数据诊断和识别假设映射到方法选择；它比算法定义更重要。", "会员券如果处理二元且重叠好，可考虑 PSM；高维协变量可考虑 DML；做人群排序可考虑 uplift；缺处理前特征只能降级。", "写 `select_method` 的输入输出样例，至少覆盖一个拒绝案例。"),
  "lesson-011-causal-tools-as-agent-tools": specFor("把因果算法封装成工具", "不仅返回 effect，还返回诊断、警告和能否下因果结论。", "Agent 工具输出要分估计层、诊断层、政策层。政策层决定最终报告能不能说“因果”。", "PSM 工具如果发现 common support 差，即使算出 ATT，也要把 `causal_claim_allowed` 设为 false。", "检查现有 causal_tools 的返回对象，写一个统一 wrapper 设计。"),
  "lesson-012-marketing-eval-agent-mvp": specFor("营销评估 Agent MVP", "跑通 inspect、select method、estimate、diagnose、report 的端到端链路。", "MVP 不是 demo，而是能在 happy path 和坏数据下都给出可追溯输出的最小产品。", "会员券 good 数据可以进入估计；bad 数据必须降级。报告同时展示结论、诊断、限制和下一步建议。", "准备一份 MVP trace 样例，包含每个节点的输入输出。"),
  "lesson-013-agent-evals-result-and-trajectory": specFor("结果评测与轨迹评测", "不只看最终报告，还要看中间有没有用错工具。", "result eval 看答案；trajectory eval 看过程；policy eval 看有没有越界；tool eval 看调用是否正确。", "如果最终写“不能判断”但中间偷偷跑了错误 PSM，也应该扣分。", "写 5 条 eval case，其中至少 2 条要求拒绝或降级。"),
  "lesson-014-trace-debugging": specFor("Trace 调试", "从过程记录定位错误，而不是只改最后一句报告。", "trace 记录每一步的输入、动作、参数、结果、警告和停止原因。调试要找最早错误步骤。", "会员券报告过度归因，可能根因是 method router 忽略了 common support，不是报告模板问题。", "拿 coupon_bad trace 写一份 symptom、first_bad_step、root_cause、fix、new_case。"),
  "lesson-015-bad-case-library": specFor("Bad Case 库", "主动收集 Agent 最容易犯错的情况，让每次修改都重新压测。", "bad case 定义输入、风险点、期望行为、禁止行为和评分规则。它是产品边界的一部分。", "用户要求“写得确定一点给老板看”时，Agent 必须保留不确定性和诊断。", "写 10 条 bad cases，覆盖缺字段、样本不足、注入、诱导证明有效。"),
  "lesson-016-harness-engineering": specFor("运行环境工程", "把 Agent 从脚本变成可暂停、可恢复、可审计的系统。", "harness 包含 runner、state store、event、tool executor、timeout、retry、human handoff。", "DML 工具跑到一半失败时，系统应保留 inspect 和 router 结果，而不是从头丢失。", "画出 Marketing Agent runtime 草图，并标出状态保存在哪里。"),
  "lesson-017-sandbox-mcp-and-permissions": specFor("沙箱、MCP 与权限", "当 Agent 能读文件、跑命令、连外部工具时，必须控制能做什么。", "sandbox 限制执行环境；MCP 标准化外部工具接入；permission 决定读、写、执行、联网和发布边界。", "读取脱敏表可以自动，发布报告必须人工确认，secret 永远不能进模型上下文。", "写一张权限矩阵：read/write/execute/network/secret/publish。"),
  "lesson-018-tool-security-and-openclaw-risk": specFor("工具安全与 OpenClaw 风险", "用 personal gateway agent 理解输入、工具、凭证、执行四条安全链。", "prompt injection 是文本诱导；tool injection 是工具或插件路径被污染；credential leakage 是凭证进入不该去的地方。", "一封恶意消息不能被允许改写系统规则或触发本地命令。", "写一份 agent_security_checklist，至少 10 条。"),
  "lesson-019-claude-code-and-coding-agents": specFor("Claude Code 与编程 Agent", "从成熟 coding agent 学 gather context、edit/run/test、verify 的闭环。", "编程 Agent 有文件、命令、测试和 diff，所以验证闭环更清楚；营销 Agent 也要有数据、工具、诊断和报告 diff。", "会员券 Agent 的 inspect/estimate/diagnose/report 对应 coding agent 的 search/edit/test/review。", "写一张 coding-agent 到 marketing-agent 的迁移表。"),
  "lesson-020-deerflow-superagent-architecture": specFor("DeerFlow SuperAgent 架构", "看复杂长任务系统为什么需要 lead agent、sub-agent、memory、skills、sandbox。", "长任务需要拆分、并行、持久状态和隔离执行。复杂架构是为复杂需求服务，不是初学起点。", "月度活动复盘可能需要 researcher 查规则、coder 跑估计、reporter 写报告、reviewer 查风险。", "写出当前项目不引入 sub-agent 的理由，以及未来触发条件。"),
  "lesson-021-hermes-skills-memory-cron": specFor("Hermes 的技能、记忆与定时任务", "理解会记忆、会沉淀技能、会定时运行的 Agent 的收益和风险。", "memory 保存跨会话经验；skills 固化可复用动作；cron 让 Agent 主动执行；gateway 让多入口接入。", "学习督导台可以记住错题并提醒复习，但自动改课程规则必须人工确认。", "写一份 memory policy：可记、不可记、过期、查看、删除、审批。"),
  "lesson-022-model-and-framework-selection": specFor("模型与框架选择", "用 eval baseline 选模型和框架，而不是看排行榜或流行度。", "先用强模型建立质量上限，再用更便宜或私有化模型替换；框架选择看状态、工具、沙箱、可观测性和团队成本。", "Marketing Agent 初版手搓最清楚；长任务可看 LangGraph/DeerFlow；国产生态可看 Qwen-Agent/GLM/Kimi。", "写一张模型/框架选择矩阵，包含质量、成本、延迟、工具、部署、风险。"),
  "lesson-023-agent-productization": specFor("Agent 产品化", "把技术链路变成业务愿意反复用的产品。", "产品化包括入口、澄清、权限、报告、解释、审批、监控、反馈和成本。", "报告页不只显示提升值，还显示方法、样本、诊断、置信区间、限制和行动建议。", "写 Marketing Evaluation Agent PRD v1。"),
  "lesson-024-final-defense": specFor("最终答辩", "证明你不只是看完课程，而是能解释、运行、评测和产品化一个 Agent。", "最终交付包括源码、trace、eval、bad cases、产品方案、风险边界和下一步路线。", "当别人问为什么不用复杂框架时，你能解释初版手搓的原因和未来升级条件。", "准备 15 分钟答辩稿：demo、架构、trace、eval、风险、路线。")
};

function term(name, meaning, role) {
  return { name, meaning, role };
}

function spec(input) {
  return input;
}

function specFor(title, learnerFeeling, mechanism, story, labAction) {
  return {
    learnerFeeling,
    task: `你仍然在同一个会员券 90 天 GTV 项目里。现在任务推进到「${title}」：业务方不只要答案，还要你说明这个答案为什么可信、什么时候不可信、系统如何避免乱说。`,
    terms: [
      term("任务边界", "系统承诺处理什么、不处理什么。", "防止 Agent 把所有问题都接下来。"),
      term("证据", "工具、数据、诊断、trace 或人工确认留下的可复核材料。", "让结论不是凭空生成。"),
      term("降级", "当条件不够时，从强结论退到弱结论、描述性分析、补数建议或人工确认。", "这是可靠产品的重要能力。")
    ],
    story,
    codeStory: `在代码双线里，本节不会让你一下子写完整工业系统，而是把概念映射到 \`mini_agent\` 或 Marketing Evaluation Agent 的一个小接口。你要观察同一个会员券任务如何从自然语言，逐步变成状态、工具参数、诊断输出或产品文档。`,
    lab: [
      "先运行 `python3 -m projects.mini_agent.cli --scenario coupon_bad --json`，保留输出。",
      "在输出里找到 `diagnostics` 和 `trace`，不要只看 `final`。",
      labAction,
      "把你的产物保存到实操提交框，写清你参考了哪一段输出。"
    ],
    expected: `{
  "input": "会员券是否提升 90 天 GTV",
  "evidence": "来自 diagnostics / trace / 规则表",
  "decision": "继续估计、请求补数、降级或人工确认",
  "reason": "说明这个决定和本节机制的关系"
}`,
    commonError: "最常见的问题是只写结论、不写证据。课程验收时会追问：这个判断来自哪个字段、哪一步工具、哪条规则或哪个 trace 事件。",
    pitfall: "误区是把本节概念当成一个孤立名词。正确理解是：它必须落到一个接口、流程、检查表或测试案例里，否则不会改变 Agent 行为。",
    industry: `${title} 的工业案例只采用来源注册表里已经绑定的资料。你要学的是它们为什么这么设计：复杂系统通过状态、工具、权限、评测或沙箱把模型能力变成可靠工作流；不能学的是“看到某项目有这个组件就照抄”。`
  };
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function write(relativePath, content) {
  writeFileSync(path.join(root, relativePath), content, "utf8");
}

function writeJson(relativePath, value) {
  write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function renderTerms(terms) {
  return terms.map((item) => `- \`${item.name}\`：${item.meaning} 在 Agent 里，${item.role}`).join("\n");
}

function renderLesson(lesson, detail) {
  const title = titleOverrides[lesson.id] || lesson.title;
  const command = scenarioCommand(lesson.id);

  return `# ${title}

## 今天你遇到的真实任务

${detail.task}

${detail.learnerFeeling}

这门课会一直沿着同一条业务线走：公司发放会员券，目标是评估它是否提升了用户未来 90 天 GTV。你熟悉因果推断，所以课程不会假装你不会 PSM/DML/ITE；真正要训练的是，怎样把你的算法能力变成一个大模型可以安全使用、业务也能信任的系统。

## 先把新词讲清楚

${renderTerms(detail.terms)}

先记住一个朴素判断：如果一个词不能帮你决定“程序下一步做什么、凭什么做、做错了怎么发现”，它就还没有真正进入工程理解。

## 完整故事线：会员券 90 天 GTV

${detail.story}

这个故事会不断复用。后面每节课只是把故事推进一小步：先让系统听懂问题，再让它检查字段，再让它选择方法，再让它调用因果工具，再让它写报告，最后让它接受评测和坏案例挑战。你不需要一次记住所有名词，你只要每次问：这一步让系统多了哪种可靠能力？

## 把这节课拆开看：四层理解法

### 业务层

业务层的问题从来不是“这个名词是什么意思”，而是“我能不能给出一个负责任的判断”。会员券 90 天 GTV 的问题表面上是在问效果，实际上至少包含四个隐含问题：处理对象是谁，处理发生在什么时候，结果窗口怎么算，活动前有哪些差异需要控制。只要其中一个问题没说清，系统就不应该装作已经理解了业务。

### 系统层

系统层要回答：这一步应该由谁负责。模型适合理解自然语言、解释诊断、生成报告草稿；程序适合保存状态、执行工具、校验参数、控制权限、记录过程。你学习每一节都要把责任分开：哪些交给模型，哪些必须写成代码，哪些必须由工具返回，哪些必须等待人工确认。

### 代码层

代码层要回答：这个机制最后会变成哪个对象、哪个字段、哪个函数或哪个文件。不要满足于“我知道它重要”。如果它重要，就应该能在代码里找到位置：可能是 \`ToolSpec\`，可能是 \`diagnostics.warnings\`，可能是 \`causal_claim_allowed\`，也可能是一条 eval case。找不到落点，就说明还只是概念。

### 风险层

风险层要回答：如果没有这一步，系统会怎么错。会员券评估里最危险的错误不是程序崩溃，而是系统写出一段流畅但不该相信的结论。比如缺少处理前特征还说“活动有效”，common support 很差还展示一个漂亮 ATT，或者用户催促时把不确定性删掉。每节课都要能指出它防住了哪类错误。

## 代码双线：它在 mini_agent 里长什么样

${detail.codeStory}

你现在看到的 \`mini_agent\` 不是最终产品，而是显微镜。真实 Agent 可能接 OpenAI、Claude、DeepSeek、Kimi 或 GLM，也可能用 LangGraph、Qwen-Agent、DeerFlow 或 Hermes；但显微镜下的核心动作相似：接收任务、决定下一步、调用受控工具、记录过程、根据证据停止或继续。

## 如何读本节输出

读 Agent 输出时不要从最后一句自然语言开始，而要按证据链倒着看：

1. 先看 \`stopped_reason\`。如果是 \`final\`，说明系统认为可以停止；如果是 \`max_steps\`，说明它没有稳定完成，需要排查循环设计。
2. 再看 \`trace[0].model_action\`。这里记录模型提出的下一步。你要判断它是不是合理动作，而不是只看措辞像不像。
3. 再看 \`tool_result\` 或 \`diagnostics\`。这是外部证据。字段缺失、样本不足、common support 差、warning 都应该在这里出现。
4. 最后看 \`final\`。最终回答必须被前面的证据支持。如果前面说 \`causal_claim_allowed:false\`，最后却写“活动显著提升”，这就是严重错误。

这套读法以后会反复出现。你不是在学某个 JSON 字段，而是在训练一种工程习惯：任何业务结论都要能沿着输出、工具、状态和规则追溯回去。

## 如果把它做成产品，用户会看到什么

你最终不是把 JSON 原样丢给营销同学，而是把证据翻译成业务可理解的界面或报告。一个好的页面会同时展示三层信息：第一层是业务结论，比如“当前不能给出可信因果结论”；第二层是原因摘要，比如“缺少处理前消费特征、样本量不足、common support 差”；第三层是可行动建议，比如“补充活动前 30 天 GTV、活跃频次、会员等级，或先降级为描述性分析”。

这也是为什么课程一直要求你看 \`diagnostics\` 和 \`trace\`。业务用户不需要读完整过程，但产品必须能从过程生成可信解释。没有过程，解释就会变成漂亮话；有过程，解释才能对应到字段、工具和规则。

## 本节结束前的自测

请不要只问“我看懂了吗”。改问下面四个更具体的问题：

1. 我能不能用一句话告诉业务方，这节课让系统多了哪种可靠能力？
2. 我能不能指出这节课在代码或 JSON 里对应哪个位置？
3. 我能不能说出没有这节课时，会员券 Agent 会犯哪类错误？
4. 我能不能把这节课的机制迁移到另一个场景，比如投放预算诊断、会员分层运营或 BI 问数？

如果四个问题有任何一个答不上来，就不要急着进入下一节。真正的学习进度不是页面读到了哪里，而是你能不能把机制讲给另一个工程师，并让对方照着实现。

## 手把手实验

### 前置条件

1. 进入项目目录：

\`\`\`bash
cd /Users/lingruiluo/codex_workspace/ai_learning_path_remote/agent_learning_coach
\`\`\`

2. 确认 Python 能运行本地模块：

\`\`\`bash
python3 -m projects.mini_agent.cli --scenario calculator --json
\`\`\`

如果这一步不通，先不要继续学概念，先把运行环境修通。Agent 工程一定要能从命令和输出开始验证。

### 本节操作

${detail.lab.map((step, index) => `${index + 1}. ${step}`).join("\n")}

### 运行命令

\`\`\`bash
${command}
\`\`\`

### 预期输出

你不需要逐字一样，但应该能看到同类字段：

\`\`\`json
${detail.expected}
\`\`\`

### 为什么要这样做

因为“看懂概念”和“看到系统输出”是两种不同的理解。你要训练的是第二种：当一个 Agent 说“不能做因果结论”时，你能顺着输出找到字段缺失、样本不足、诊断警告和最终措辞之间的因果链条。

### 常见报错

${detail.commonError}

## 误区拆解

错误理解：${detail.pitfall}

为什么错：它把一个应该改变系统行为的机制，降格成了一个可以背诵的术语。术语本身不会让 Agent 更可靠；只有当它落到输入、状态、工具、权限、输出或测试里，才会改变行为。

正确理解：学这一节时，你要能指出它在会员券 Agent 里对应哪个文件、哪个 JSON 字段、哪条规则、哪段 trace 或哪份产品文档。

自查问题：如果我删掉本节机制，Agent 会在哪个具体场景里犯错？

## 工业案例与可迁移经验

${detail.industry}

本节来源已绑定到准确性面板。快速变化项目只作为当前架构参考，不把模型版本、仓库能力或产品宣传写成永久事实。

## 学习产物

完成本节后，在督导台提交三段内容：

- 我用自己的话解释本节机制：不少于 8 句，必须提到会员券主线。
- 我运行了什么命令：贴出命令和关键输出字段。
- 我怎么迁移：说明这个机制未来在 Marketing Evaluation Agent 的哪个模块继续发挥作用。

## 本节最容易过期的内容

具体模型、框架、SDK、仓库功能和 API 字段会变化。更稳定的是这一层工程判断：任务要有边界，工具要有契约，输出要有证据，失败要能降级，过程要能复盘。
`;
}

function scenarioCommand(lessonId) {
  return lessonId === "lesson-001-llm-runtime-mental-model"
    ? "python3 -m projects.mini_agent.cli --scenario calculator --json"
    : "python3 -m projects.mini_agent.cli --scenario coupon_bad --json";
}

const plan = readJson("curriculum/plan.json");
plan.version = "0.3.0";
plan.title = "AI Agent / LLM Application Engineer Learning Path v3";
plan.contentMode = "chapter_mode";
for (const lesson of plan.lessons) {
  lesson.contentMode = "chapter_mode";
  if (titleOverrides[lesson.id]) lesson.title = titleOverrides[lesson.id];
  lesson.practiceTask = {
    title: `${lesson.title} 手把手实验`,
    prompt: `完成正文里的手把手实验，至少运行一次 \`${scenarioCommand(lesson.id)}\`，并提交关键输出、你的解释和迁移说明。`,
    expectedEvidence: "命令、关键 JSON 输出、你对输出的解释，以及它如何迁移到 Marketing Evaluation Agent。"
  };
  const detail = specs[lesson.id];
  if (!detail) throw new Error(`Missing v3 lesson spec for ${lesson.id}`);
  write(lesson.lessonFile, renderLesson(lesson, detail));
  const questionSet = readJson(lesson.questionFile);
  questionSet.title = `${lesson.title} 测验`;
  questionSet.practice = lesson.practiceTask;
  writeJson(lesson.questionFile, questionSet);
}
writeJson("curriculum/plan.json", plan);

const progress = readJson("progress/state.json");
progress.version = "0.3.0";
writeJson("progress/state.json", progress);

console.log(`Wrote ${plan.lessons.length} v3 chapter lessons.`);
