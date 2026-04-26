const state = {
  plan: null,
  progress: null,
  sources: null,
  view: "today",
  selectedLessonId: null
};

const content = document.querySelector("#content");
const pageTitle = document.querySelector("#pageTitle");
const syncCard = document.querySelector("#syncCard");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  if (!response.ok) {
    throw new Error(`API failed: ${response.status}`);
  }
  return response.json();
}

async function loadState() {
  state.plan = await api("/api/plan");
  state.progress = await api("/api/progress");
  state.sources = await api("/api/sources");
  state.selectedLessonId = state.selectedLessonId || state.progress.currentLessonId;
  await loadGitStatus();
}

async function loadGitStatus() {
  const status = await api("/api/git/status");
  if (!status.isRepo) {
    syncCard.innerHTML = `<strong>Git 同步</strong><br>${status.message}`;
    return;
  }
  syncCard.innerHTML = `<strong>Git 同步</strong><br>分支：${status.branch || "unknown"}<br>${
    status.dirty ? "有未提交改动" : "工作区干净"
  }`;
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  render();
}

function statusLabel(status) {
  return {
    locked: "锁定",
    available: "可学习",
    submitted: "待复核",
    passed: "已通过",
    review: "需复习"
  }[status] || status;
}

function effectiveLessonStatus(lesson) {
  return state.progress.lessonStatuses[lesson.id] || lesson.status || "locked";
}

function markdownToHtml(markdown) {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`)
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><h/g, "<h")
    .replace(/<\/h([1-3])><\/p>/g, "</h$1>")
    .replace(/<p><ul>/g, "<ul>")
    .replace(/<\/ul><\/p>/g, "</ul>")
    .replace(/<p><pre>/g, "<pre>")
    .replace(/<\/pre><\/p>/g, "</pre>");
}

function renderToday() {
  pageTitle.textContent = "今日学习";
  const current = state.plan.lessons.find((lesson) => lesson.id === state.progress.currentLessonId);
  const events = state.progress.events || [];
  content.innerHTML = `
    <div class="grid two">
      <section class="panel">
        <p class="eyebrow">当前推荐</p>
        <h3>${current?.title || "未选择课程"}</h3>
        <p class="muted">建议投入 ${current?.durationMinutes || 60} 分钟。工作日只做一节，优先完成测验和一个短提交。</p>
        <button class="primary-button" id="openCurrent">进入当前课程</button>
      </section>
      <section class="panel">
        <p class="eyebrow">监督规则</p>
        <p>客观题即时评分；主观题和代码题保存为提交记录，再交给 Codex 追问、评分、改计划。</p>
        <p class="muted">80+ 通过，70-79 加练，70 以下重学核心内容。</p>
      </section>
    </div>
    <section class="panel">
      <h3>最近学习事件</h3>
      ${
        events.length
          ? events.map((event) => `<p><strong>${event.type}</strong> · ${event.lessonId || ""} · ${event.at || ""}</p>`).join("")
          : "<p class=\"muted\">还没有学习事件。完成一次测验或提交后会显示在这里。</p>"
      }
    </section>
  `;
  document.querySelector("#openCurrent")?.addEventListener("click", () => {
    state.selectedLessonId = current.id;
    setView("lessons");
  });
}

function renderLessons() {
  pageTitle.textContent = "课程";
  const grouped = state.plan.weeks
    .map((week) => {
      const cards = week.lessons
        .map((lessonId) => state.plan.lessons.find((lesson) => lesson.id === lessonId))
        .filter(Boolean)
        .map((lesson) => {
          const status = effectiveLessonStatus(lesson);
          return `
            <article class="lesson-card">
              <span class="status ${status}">${statusLabel(status)}</span>
              <h3>${lesson.title}</h3>
              <p class="muted">知识点：${lesson.knowledgeTags.join(" / ")}</p>
              <button class="${status === "locked" ? "secondary-button" : "primary-button"}" data-lesson-id="${lesson.id}">
                ${status === "locked" ? "查看目标" : "开始学习"}
              </button>
            </article>
          `;
        })
        .join("");
      return `
        <section class="panel">
          <p class="eyebrow">第 ${week.week} 周</p>
          <h3>${week.theme}</h3>
          <p class="muted">${week.goal}</p>
          <div class="lesson-list">${cards}</div>
        </section>
      `;
    })
    .join("");

  content.innerHTML = `<div class="grid two"><div>${grouped}</div><div id="lessonDetail"></div></div>`;
  content.querySelectorAll("[data-lesson-id]").forEach((button) => {
    button.addEventListener("click", () => openLesson(button.dataset.lessonId));
  });
  openLesson(state.selectedLessonId || state.progress.currentLessonId);
}

async function openLesson(lessonId) {
  state.selectedLessonId = lessonId;
  const lessonResponse = await api(`/api/lesson/${encodeURIComponent(lessonId)}`);
  const questionSet = await api(`/api/questions/${encodeURIComponent(lessonId)}`);
  const status = effectiveLessonStatus(lessonResponse.lesson);
  const detail = document.querySelector("#lessonDetail");
  detail.innerHTML = `
    <div class="lesson-layout">
      <section class="panel markdown">
        <span class="status ${status}">${statusLabel(status)}</span>
        ${status === "locked" ? `<h2>${lessonResponse.lesson.title}</h2><p class="muted">这节课还未解锁。你可以先看目标，但建议按当前路径推进。</p>` : markdownToHtml(lessonResponse.markdown)}
      </section>
      <aside class="panel">
        <h3>即时测验</h3>
        <div id="quiz"></div>
        <h3>深度提交</h3>
        <p class="muted">主观题、设计题、代码题先保存，再贴给 Codex 复核。</p>
        <textarea id="submissionText" placeholder="写下你的答案、设计、代码路径或问题..."></textarea>
        <button class="primary-button" id="saveSubmission">保存提交</button>
        <div id="submissionResult"></div>
      </aside>
    </div>
  `;
  renderQuiz(questionSet);
  document.querySelector("#saveSubmission")?.addEventListener("click", async () => {
    const value = document.querySelector("#submissionText").value.trim();
    if (!value) return;
    const result = await api("/api/submissions", {
      method: "POST",
      body: JSON.stringify({ lessonId, kind: "subjective", content: value })
    });
    document.querySelector("#submissionResult").innerHTML = `<p class="result good">已保存：${result.path}</p>`;
    await loadState();
  });
}

function renderQuiz(questionSet) {
  const quiz = document.querySelector("#quiz");
  if (!questionSet.questions?.length) {
    quiz.innerHTML = `<p class="muted">这节课暂无客观题。</p>`;
    return;
  }
  quiz.innerHTML = `
    <form id="quizForm">
      ${questionSet.questions
        .map((question, index) => {
          const inputType = question.type === "multiple_choice" ? "checkbox" : "radio";
          return `
            <div class="question">
              <strong>${index + 1}. ${question.prompt}</strong>
              ${question.options
                .map(
                  (option) => `
                    <label class="option">
                      <input type="${inputType}" name="${question.id}" value="${option.id}" />
                      <span>${option.id}. ${option.text}</span>
                    </label>
                  `
                )
                .join("")}
            </div>
          `;
        })
        .join("")}
      <button type="submit" class="primary-button">提交测验</button>
    </form>
    <div id="quizResult"></div>
  `;
  document.querySelector("#quizForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const answers = {};
    for (const question of questionSet.questions) {
      const values = form.getAll(question.id);
      answers[question.id] = question.type === "multiple_choice" ? values : values[0];
    }
    const grade = await api("/api/quiz/grade", {
      method: "POST",
      body: JSON.stringify({ lessonId: questionSet.lessonId, answers })
    });
    await loadState();
    renderQuizResult(grade);
  });
}

function renderQuizResult(grade) {
  const result = document.querySelector("#quizResult");
  result.innerHTML = `
    <div class="result ${grade.score >= 80 ? "good" : "bad"}">
      <strong>得分：${grade.score}</strong> · ${grade.status}
    </div>
    ${grade.results
      .map(
        (question) => `
          <div class="question">
            <strong>${question.correct ? "正确" : "需要复习"}：${question.prompt}</strong>
            ${question.options
              .map(
                (option) => `
                  <p><strong>${option.id}. ${option.correct ? "正确项" : "干扰项"}</strong> ${option.explanation}</p>
                `
              )
              .join("")}
          </div>
        `
      )
      .join("")}
  `;
}

function renderMastery() {
  pageTitle.textContent = "知识点掌握度";
  const cards = Object.entries(state.progress.knowledgeMastery)
    .map(([id, item]) => {
      const area = state.plan.knowledgeAreas.find((knowledge) => knowledge.id === id);
      return `
        <article class="mastery-card">
          <h3>${area?.name || id}</h3>
          <p class="muted">${area?.description || ""}</p>
          <div class="bar"><span style="width:${item.score || 0}%"></span></div>
          <p><strong>${item.score || 0}</strong> / 100 · ${item.state}</p>
          ${
            item.recentMistakes?.length
              ? `<p class="muted">最近错题：${item.recentMistakes.map((mistake) => mistake.questionId).join(", ")}</p>`
              : `<p class="muted">暂无错题。</p>`
          }
        </article>
      `;
    })
    .join("");
  content.innerHTML = `<div class="grid three">${cards}</div>`;
}

function renderSources() {
  pageTitle.textContent = "案例雷达";
  content.innerHTML = `
    <section class="panel">
      <h3>可信度分层</h3>
      ${state.sources.tiers.map((tier) => `<p><strong>${tier.tier} 类：${tier.name}</strong><br><span class="muted">${tier.usage}</span></p>`).join("")}
    </section>
    <div class="grid two">
      ${state.sources.items
        .map(
          (item) => `
            <article class="source-card">
              <span class="status">${item.tier} 类</span>
              <h3>${item.title}</h3>
              <p class="muted">${item.whyRepresentative}</p>
              <p>${item.transferToProject}</p>
              <a href="${item.url}" target="_blank" rel="noreferrer">打开来源</a>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderProject() {
  pageTitle.textContent = "Marketing Evaluation Agent";
  content.innerHTML = `
    <section class="panel">
      <h3>项目定位</h3>
      <p>因果推断不是重学主线，而是 Agent 的业务工具层。核心训练目标是 schema、前置检查、异常返回、诊断解释、bad case 评测和业务报告。</p>
    </section>
    <div class="grid two">
      <section class="panel">
        <h3>当前已生成</h3>
        <p><code>projects/marketing_eval_agent/causal_tools/</code>：轻量 PSM / DML / ITE 工具骨架。</p>
        <p><code>projects/marketing_eval_agent/tests/</code>：基础测试。</p>
      </section>
      <section class="panel">
        <h3>下一步</h3>
        <p>完成第 4 周课程后，把这些工具接入 Agent loop：先 inspect，再 select method，再 estimate，最后 write report。</p>
      </section>
    </div>
  `;
}

function render() {
  if (state.view === "today") return renderToday();
  if (state.view === "lessons") return renderLessons();
  if (state.view === "mastery") return renderMastery();
  if (state.view === "sources") return renderSources();
  if (state.view === "project") return renderProject();
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});
document.querySelector("#refreshButton").addEventListener("click", async () => {
  await loadState();
  render();
});

await loadState();
render();
