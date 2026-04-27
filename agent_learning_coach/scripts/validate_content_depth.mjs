import { readFileSync } from "node:fs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const plan = readJson("curriculum/plan.json");
const errors = [];

const requiredSections = [
  "## 今天你遇到的真实任务",
  "## 先把新词讲清楚",
  "## 完整故事线",
  "## 代码双线",
  "## 手把手实验",
  "### 前置条件",
  "### 运行命令",
  "### 预期输出",
  "### 常见报错",
  "## 误区拆解",
  "## 工业案例与可迁移经验",
  "## 学习产物",
];

const bannedBeforeDefinition = ["runtime", "runner", "eval", "trace", "tool call"];
const strictLessons = new Set([
  "lesson-001-llm-runtime-mental-model",
  "lesson-002-tool-calling-and-structured-output",
  "lesson-003-agent-loop-from-scratch",
]);

if (plan.version !== "0.3.0") errors.push(`plan version should be 0.3.0, got ${plan.version}`);
if (plan.contentMode !== "chapter_mode") errors.push("plan.contentMode should be chapter_mode");

for (const lesson of plan.lessons) {
  const markdown = readFileSync(lesson.lessonFile, "utf8");
  if (lesson.contentMode !== "chapter_mode") {
    errors.push(`${lesson.id} missing contentMode=chapter_mode`);
  }
  for (const section of requiredSections) {
    if (!markdown.includes(section)) errors.push(`${lesson.id} missing section: ${section}`);
  }
  if (markdown.length < 4200) {
    errors.push(`${lesson.id} is too short for chapter mode: ${markdown.length} chars`);
  }
  if (!markdown.includes("```bash") || !markdown.includes("```json")) {
    errors.push(`${lesson.id} must include bash and json code fences`);
  }
  const expectedIndex = markdown.indexOf("### 预期输出");
  if (expectedIndex >= 0) {
    const expectedBlock = markdown.slice(expectedIndex, expectedIndex + 1400);
    if (!expectedBlock.includes("```json")) {
      errors.push(`${lesson.id} expected output section must include json example`);
    }
  }
  if (strictLessons.has(lesson.id)) {
    const definitionIndex = markdown.indexOf("## 先把新词讲清楚");
    const prefix = markdown.slice(0, definitionIndex).toLowerCase();
    for (const term of bannedBeforeDefinition) {
      if (prefix.includes(term)) {
        errors.push(`${lesson.id} uses "${term}" before the definition section`);
      }
    }
  }
}

if (errors.length) {
  console.error("Content-depth validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Content-depth validation passed: ${plan.lessons.length} chapter-mode lessons.`);
