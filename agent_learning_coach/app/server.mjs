import http from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const appDir = path.dirname(__filename);
const rootDir = path.resolve(appDir, "..");
const publicDir = path.join(appDir, "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function safePath(...parts) {
  const resolved = path.resolve(rootDir, ...parts);
  if (!resolved.startsWith(rootDir)) {
    throw new Error("Path escapes learning coach root");
  }
  return resolved;
}

async function readJson(relativePath) {
  const raw = await readFile(safePath(relativePath), "utf8");
  return JSON.parse(raw);
}

async function readJsonIfExists(relativePath, fallback) {
  try {
    return await readJson(relativePath);
  } catch {
    return fallback;
  }
}

async function writeJson(relativePath, value) {
  const fullPath = safePath(relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readText(relativePath) {
  return readFile(safePath(relativePath), "utf8");
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, value) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(value, null, 2));
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": contentType });
  res.end(text);
}

function masteryState(score) {
  if (score >= 90) return "可迁移";
  if (score >= 80) return "可实现";
  if (score >= 60) return "可解释";
  if (score >= 40) return "初学";
  return "未掌握";
}

function byId(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function isPastDate(value) {
  if (!value) return false;
  const today = new Date().toISOString().slice(0, 10);
  return value < today;
}

function buildLessonAccuracy(lesson, sourceRegistry, claimsRegistry) {
  const sourcesById = byId(sourceRegistry.sources || []);
  const claimsById = byId(claimsRegistry.claims || []);
  const sourceIds = lesson.sourceIds || [];
  const claimIds = lesson.claimIds || [];
  const sources = sourceIds.map((id) => sourcesById.get(id)).filter(Boolean);
  const claims = claimIds.map((id) => claimsById.get(id)).filter(Boolean);
  const missingSourceIds = sourceIds.filter((id) => !sourcesById.has(id));
  const missingClaimIds = claimIds.filter((id) => !claimsById.has(id));
  const claimMissingSourceIds = claims.flatMap((claim) =>
    (claim.sourceIds || []).filter((id) => !sourcesById.has(id)).map((id) => ({ claimId: claim.id, sourceId: id }))
  );
  const expiredSourceIds = sources.filter((source) => isPastDate(source.refreshAfter)).map((source) => source.id);
  const lessonRefreshExpired = isPastDate(lesson.needsRefreshAfter);
  const status = missingSourceIds.length || missingClaimIds.length || claimMissingSourceIds.length
    ? "source_missing"
    : lesson.contentStatus === "verified" && !lessonRefreshExpired && expiredSourceIds.length === 0
      ? "verified"
      : lesson.contentStatus === "verified"
        ? "needs_refresh"
        : "draft";

  return {
    contentStatus: lesson.contentStatus || "draft",
    status,
    verifiedAt: lesson.verifiedAt || null,
    stability: lesson.stability || "changing",
    needsRefreshAfter: lesson.needsRefreshAfter || null,
    lessonRefreshExpired,
    sourceIds,
    claimIds,
    sources,
    claims,
    missingSourceIds,
    missingClaimIds,
    claimMissingSourceIds,
    expiredSourceIds,
    unverifiedNotes: lesson.unverifiedNotes || []
  };
}

function defaultLessonProgress() {
  return {
    phase: "preview",
    startedAt: null,
    completedReadingAt: null,
    quizUnlocked: false,
    quizScore: null,
    practiceStatus: "not_started",
    assignmentScore: null,
    masteryStatus: "not_started",
    evidence: {
      explanation: null,
      practicePath: null,
      transfer: null,
      mistakeRepair: null
    },
    weakPoints: []
  };
}

function ensureLessonProgress(progress, lessonId) {
  progress.lessonProgress = progress.lessonProgress || {};
  progress.lessonProgress[lessonId] = {
    ...defaultLessonProgress(),
    ...(progress.lessonProgress[lessonId] || {}),
    evidence: {
      ...defaultLessonProgress().evidence,
      ...(progress.lessonProgress[lessonId]?.evidence || {})
    }
  };
  return progress.lessonProgress[lessonId];
}

function addProgressEvent(progress, event) {
  progress.events = [event, ...(progress.events || [])].slice(0, 50);
}

function normalizeAnswer(answer) {
  if (Array.isArray(answer)) return [...answer].sort();
  if (answer == null) return [];
  return [String(answer)];
}

function isCorrect(question, answer) {
  const expected = question.options.filter((option) => option.correct).map((option) => option.id).sort();
  const actual = normalizeAnswer(answer);
  return JSON.stringify(expected) === JSON.stringify(actual);
}

async function gradeQuiz(payload) {
  const { lessonId, answers } = payload;
  const questionSet = await readJson(`questions/${lessonId}.json`);
  const progress = await readJson("progress/state.json");
  const plan = await readJson("curriculum/plan.json");
  const lesson = plan.lessons.find((item) => item.id === lessonId);
  const lessonProgress = ensureLessonProgress(progress, lessonId);

  const questionResults = questionSet.questions.map((question) => {
    const correct = isCorrect(question, answers?.[question.id]);
    return {
      id: question.id,
      correct,
      prompt: question.prompt,
      yourAnswer: normalizeAnswer(answers?.[question.id]),
      correctAnswer: question.options.filter((option) => option.correct).map((option) => option.id),
      knowledgeTags: question.knowledgeTags || [],
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        correct: option.correct,
        explanation: option.explanation
      }))
    };
  });

  const score = Math.round(
    (questionResults.filter((item) => item.correct).length / Math.max(questionResults.length, 1)) * 100
  );
  const now = new Date().toISOString();
  const mistakes = questionResults.filter((item) => !item.correct);

  for (const question of questionResults) {
    for (const tag of question.knowledgeTags || []) {
      if (!progress.knowledgeMastery[tag]) {
        progress.knowledgeMastery[tag] = { score: 0, state: "未学", recentMistakes: [], reviewDue: null };
      }
      const oldScore = Number(progress.knowledgeMastery[tag].score || 0);
      const nextScore = question.correct
        ? Math.max(oldScore, Math.round(oldScore * 0.65 + score * 0.35))
        : Math.round(oldScore * 0.75 + Math.min(score, 50) * 0.25);
      progress.knowledgeMastery[tag].score = nextScore;
      progress.knowledgeMastery[tag].state = masteryState(nextScore);
      if (!question.correct) {
        progress.knowledgeMastery[tag].recentMistakes = [
          {
            lessonId,
            questionId: question.id,
            prompt: question.prompt,
            at: now
          },
          ...(progress.knowledgeMastery[tag].recentMistakes || [])
        ].slice(0, 5);
        progress.knowledgeMastery[tag].reviewDue = now.slice(0, 10);
      }
    }
  }

  if (score >= 80) {
    progress.lessonStatuses[lessonId] = "review";
    lessonProgress.phase = "assignment";
    lessonProgress.masteryStatus = lessonProgress.practiceStatus === "completed" ? "pending_codex_review" : "needs_practice";
  } else if (score >= 70) {
    progress.lessonStatuses[lessonId] = "review";
    lessonProgress.phase = "quiz";
    lessonProgress.masteryStatus = "needs_review";
  } else {
    progress.lessonStatuses[lessonId] = "available";
    lessonProgress.phase = "quiz";
    lessonProgress.masteryStatus = "needs_relearn";
  }
  lessonProgress.quizUnlocked = true;
  lessonProgress.quizScore = score;

  addProgressEvent(progress, {
    type: "objective_quiz_graded",
    lessonId,
    title: lesson?.title || lessonId,
    score,
    at: now,
    mistakes: mistakes.map((item) => item.id)
  });

  const grade = {
    type: "objective_quiz",
    lessonId,
    lessonTitle: lesson?.title || lessonId,
    score,
    status: score >= 80 ? "passed" : score >= 70 ? "review" : "repeat",
    gradedAt: now,
    results: questionResults
  };
  const stamp = now.replace(/[:.]/g, "-");
  await writeJson(`grades/${stamp}-${lessonId}-objective.json`, grade);
  await writeJson("progress/state.json", progress);
  return grade;
}

async function saveSubmission(payload) {
  const now = new Date().toISOString();
  const lessonId = payload.lessonId || "general";
  const kind = payload.kind || "subjective";
  const safeLessonId = lessonId.replace(/[^a-zA-Z0-9-_]/g, "_");
  const stamp = now.replace(/[:.]/g, "-");
  const content = [
    `# Submission: ${safeLessonId}`,
    "",
    `- Type: ${kind}`,
    `- Created At: ${now}`,
    "",
    "## Answer",
    "",
    payload.content || "",
    "",
    "## Codex Review Prompt",
    "",
    "请基于本课程的评分标准追问、评分，并更新学习计划。"
  ].join("\n");
  const relativePath = `submissions/${stamp}-${safeLessonId}-${kind}.md`;
  await mkdir(safePath("submissions"), { recursive: true });
  await writeFile(safePath(relativePath), content, "utf8");

  const progress = await readJson("progress/state.json");
  const lessonProgress = ensureLessonProgress(progress, lessonId);
  if (kind === "practice") {
    lessonProgress.practiceStatus = "completed";
    lessonProgress.phase = lessonProgress.quizScore >= 80 ? "assignment" : lessonProgress.phase;
    lessonProgress.evidence.practicePath = relativePath;
    lessonProgress.masteryStatus = lessonProgress.quizScore >= 80 ? "pending_codex_review" : "practice_done";
  } else {
    lessonProgress.evidence.explanation = relativePath;
  }
  addProgressEvent(progress, { type: "submission_saved", lessonId, kind, path: relativePath, at: now });
  await writeJson("progress/state.json", progress);

  return { ok: true, path: relativePath, createdAt: now };
}

async function updateLessonPhase(payload, nextPhase) {
  const lessonId = payload.lessonId;
  const progress = await readJson("progress/state.json");
  const lessonProgress = ensureLessonProgress(progress, lessonId);
  const now = new Date().toISOString();

  if (nextPhase === "learning") {
    lessonProgress.phase = "learning";
    lessonProgress.startedAt = lessonProgress.startedAt || now;
    progress.lessonStatuses[lessonId] = "available";
  } else if (nextPhase === "quiz") {
    lessonProgress.phase = "quiz";
    lessonProgress.completedReadingAt = lessonProgress.completedReadingAt || now;
    lessonProgress.quizUnlocked = true;
  } else if (nextPhase === "preview") {
    progress.lessonProgress[lessonId] = defaultLessonProgress();
  } else {
    lessonProgress.phase = nextPhase;
  }

  addProgressEvent(progress, { type: "lesson_phase_changed", lessonId, phase: nextPhase, at: now });
  await writeJson("progress/state.json", progress);
  return { ok: true, lessonId, progress: ensureLessonProgress(progress, lessonId) };
}

function git(args) {
  return new Promise((resolve) => {
    execFile("git", args, { cwd: rootDir }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

async function gitStatus() {
  const isRepo = await git(["rev-parse", "--is-inside-work-tree"]);
  if (!isRepo.ok) {
    return {
      isRepo: false,
      message: "当前目录还不是 Git 仓库。将此目录放入 GitHub repo 后即可同步。"
    };
  }
  const branch = await git(["branch", "--show-current"]);
  const status = await git(["status", "--short"]);
  const remote = await git(["remote", "-v"]);
  return {
    isRepo: true,
    branch: branch.stdout,
    dirty: status.stdout.length > 0,
    status: status.stdout,
    remote: remote.stdout
  };
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/plan") {
    return sendJson(res, 200, await readJson("curriculum/plan.json"));
  }
  if (req.method === "GET" && url.pathname === "/api/progress") {
    return sendJson(res, 200, await readJson("progress/state.json"));
  }
  if (req.method === "GET" && url.pathname === "/api/sources") {
    const radar = await readJson("sources/radar.json");
    const sourceRegistry = await readJsonIfExists("sources/source_registry.json", { sources: [], tiers: [] });
    const claimsRegistry = await readJsonIfExists("sources/claims.json", { claims: [] });
    return sendJson(res, 200, { radar, sourceRegistry, claimsRegistry });
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/lesson/")) {
    const lessonId = decodeURIComponent(url.pathname.split("/").pop());
    const plan = await readJson("curriculum/plan.json");
    const lesson = plan.lessons.find((item) => item.id === lessonId);
    if (!lesson) return sendJson(res, 404, { error: "lesson_not_found" });
    const sourceRegistry = await readJsonIfExists("sources/source_registry.json", { sources: [], tiers: [] });
    const claimsRegistry = await readJsonIfExists("sources/claims.json", { claims: [] });
    return sendJson(res, 200, {
      lesson,
      markdown: await readText(lesson.lessonFile),
      accuracy: buildLessonAccuracy(lesson, sourceRegistry, claimsRegistry),
      lessonProgress: ensureLessonProgress(await readJson("progress/state.json"), lessonId)
    });
  }
  if (req.method === "GET" && url.pathname === "/api/accuracy") {
    const plan = await readJson("curriculum/plan.json");
    const sourceRegistry = await readJsonIfExists("sources/source_registry.json", { sources: [], tiers: [] });
    const claimsRegistry = await readJsonIfExists("sources/claims.json", { claims: [] });
    return sendJson(res, 200, {
      generatedAt: new Date().toISOString(),
      lessons: plan.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        accuracy: buildLessonAccuracy(lesson, sourceRegistry, claimsRegistry)
      }))
    });
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/questions/")) {
    const lessonId = decodeURIComponent(url.pathname.split("/").pop());
    try {
      return sendJson(res, 200, await readJson(`questions/${lessonId}.json`));
    } catch {
      return sendJson(res, 200, { lessonId, questions: [] });
    }
  }
  if (req.method === "POST" && url.pathname === "/api/quiz/grade") {
    return sendJson(res, 200, await gradeQuiz(await parseBody(req)));
  }
  if (req.method === "POST" && url.pathname === "/api/lesson/start") {
    return sendJson(res, 200, await updateLessonPhase(await parseBody(req), "learning"));
  }
  if (req.method === "POST" && url.pathname === "/api/lesson/complete") {
    return sendJson(res, 200, await updateLessonPhase(await parseBody(req), "quiz"));
  }
  if (req.method === "POST" && url.pathname === "/api/lesson/reset-phase") {
    return sendJson(res, 200, await updateLessonPhase(await parseBody(req), "preview"));
  }
  if (req.method === "POST" && url.pathname === "/api/submissions") {
    return sendJson(res, 200, await saveSubmission(await parseBody(req)));
  }
  if (req.method === "GET" && url.pathname === "/api/git/status") {
    return sendJson(res, 200, await gitStatus());
  }
  return sendJson(res, 404, { error: "api_not_found" });
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(publicDir, `.${pathname}`);
  if (!filePath.startsWith(publicDir)) {
    return sendText(res, 403, "Forbidden");
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not file");
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "content-type": contentType });
    createReadStream(filePath).pipe(res);
  } catch {
    sendText(res, 404, "Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
    } else {
      await serveStatic(req, res, url);
    }
  } catch (error) {
    sendJson(res, 500, { error: "internal_error", message: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Agent Learning Coach running at http://${host}:${port}`);
});
