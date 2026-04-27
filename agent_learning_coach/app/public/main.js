const state = {
  plan: null,
  progress: null,
  sources: null,
  view: "today",
  selectedLessonId: null,
  forcePreviewLessonId: null
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
    review: "需练习/复核"
  }[status] || status;
}

function effectiveLessonStatus(lesson) {
  return state.progress.lessonStatuses[lesson.id] || lesson.status || "locked";
}

function accuracyLabel(status) {
  return {
    verified: "已核验",
    draft: "草稿/待验证",
    needs_refresh: "需要复核",
    source_missing: "来源缺失"
  }[status] || status;
}

function stabilityLabel(stability) {
  return {
    stable: "稳定知识",
    changing: "变化中",
    "fast-changing": "快速变化"
  }[stability] || stability || "未标注";
}

function renderAccuracyPanel(accuracy) {
  if (!accuracy) {
    return `<section class="accuracy-panel warning"><h3>准确性</h3><p>没有准确性元数据。本节不能作为正式学习结论。</p></section>`;
  }
  const warnings = [
    ...(accuracy.missingSourceIds || []).map((id) => `缺失来源：${id}`),
    ...(accuracy.missingClaimIds || []).map((id) => `缺失 claim：${id}`),
    ...(accuracy.expiredSourceIds || []).map((id) => `来源需要复核：${id}`),
    ...(accuracy.lessonRefreshExpired ? ["本课已过建议复核日期"] : []),
    ...(accuracy.unverifiedNotes || [])
  ];
  return `
    <section class="accuracy-panel ${accuracy.status}">
      <div class="accuracy-head">
        <div>
          <p class="eyebrow">准确性面板</p>
          <h3>${accuracyLabel(accuracy.status)}</h3>
        </div>
        <span class="status ${accuracy.status === "verified" ? "passed" : accuracy.status === "draft" ? "locked" : "review"}">
          ${stabilityLabel(accuracy.stability)}
        </span>
      </div>
      <p class="muted">核验日期：${accuracy.verifiedAt || "未核验"} · 建议复核：${accuracy.needsRefreshAfter || "未设置"}</p>
      ${
        warnings.length
          ? `<div class="accuracy-warning">${warnings.map((item) => `<p>${item}</p>`).join("")}</div>`
          : `<p class="accuracy-ok">本课关键断言已绑定来源和 claim。仍需按复核日期更新快速变化内容。</p>`
      }
      <details>
        <summary>查看来源与断言</summary>
        <div class="source-mini-list">
          ${
            accuracy.sources?.length
              ? accuracy.sources
                  .map(
                    (source) => `
                      <a class="source-mini" href="${source.url}" target="_blank" rel="noreferrer">
                        <strong>${source.tier} · ${source.title}</strong>
                        <span>${source.publisher} · checked ${source.checkedAt} · refresh ${source.refreshAfter}</span>
                      </a>
                    `
                  )
                  .join("")
              : `<p class="muted">暂无来源。</p>`
          }
        </div>
        <div class="claim-list">
          ${
            accuracy.claims?.length
              ? accuracy.claims
                  .map(
                    (claim) => `
                      <article class="claim-card">
                        <strong>${claim.scope} · ${claim.confidence}</strong>
                        <p>${claim.statement}</p>
                        <span>${stabilityLabel(claim.stability)} · verified ${claim.verifiedAt}</span>
                      </article>
                    `
                  )
                  .join("")
              : `<p class="muted">暂无 claim。</p>`
          }
        </div>
      </details>
    </section>
  `;
}

function markdownToHtml(markdown) {
  let headingCount = 0;
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`)
    .replace(/^# (.*)$/gm, (_, text) => `<h1 id="${headingId(text, headingCount++)}">${text}</h1>`)
    .replace(/^## (.*)$/gm, (_, text) => `<h2 id="${headingId(text, headingCount++)}">${text}</h2>`)
    .replace(/^### (.*)$/gm, (_, text) => `<h3 id="${headingId(text, headingCount++)}">${text}</h3>`)
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

function headingId(text, index = 0) {
  const slug = String(text)
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return slug || `section-${index}`;
}

function extractLessonToc(markdown) {
  const items = [];
  const pattern = /^(##|###) (.+)$/gm;
  let match;
  while ((match = pattern.exec(markdown)) && items.length < 14) {
    const level = match[1] === "##" ? 2 : 3;
    const text = match[2].trim();
    items.push({ level, text, id: headingId(text) });
  }
  return items;
}

function extractTermCards(markdown) {
  const start = markdown.indexOf("## 先把新词讲清楚");
  if (start < 0) return [];
  const next = markdown.indexOf("\n## ", start + 4);
  const block = markdown.slice(start, next > 0 ? next : undefined);
  return [...block.matchAll(/^- `([^`]+)`：(.+)$/gm)].slice(0, 8).map((match) => ({
    term: match[1],
    text: match[2]
  }));
}

function renderReadingTools(markdown) {
  const toc = extractLessonToc(markdown);
  const terms = extractTermCards(markdown);
  return `
    <section class="panel reading-tools">
      <div class="lesson-toc">
        <p class="eyebrow">本节目录</p>
        ${toc.map((item) => `<a class="toc-level-${item.level}" href="#${item.id}">${item.text}</a>`).join("")}
      </div>
      <div class="term-quick">
        <p class="eyebrow">术语速查</p>
        ${
          terms.length
            ? terms.map((item) => `<p><strong>${item.term}</strong><span>${item.text}</span></p>`).join("")
            : `<p class="muted">本节没有抽取到术语卡片。</p>`
        }
      </div>
    </section>
  `;
}

function phaseLabel(phase) {
  return {
    preview: "预览",
    learning: "学习中",
    checkpoint: "自查",
    quiz: "测验",
    assignment: "实操提交",
    review: "复核",
    mastered: "已掌握"
  }[phase] || phase || "预览";
}

function renderLessonStepper(phase) {
  const steps = [
    ["preview", "预览"],
    ["learning", "学习"],
    ["quiz", "测验"],
    ["assignment", "实操"],
    ["review", "复核"]
  ];
  const activeIndex = Math.max(0, steps.findIndex(([id]) => id === phase));
  return `
    <div class="lesson-stepper">
      ${steps
        .map(
          ([id, label], index) => `
            <span class="${index <= activeIndex ? "active" : ""} ${id === phase ? "current" : ""}">
              ${index + 1}. ${label}
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function renderMasteryChecklist(lesson, lessonProgress) {
  const evidence = lessonProgress?.evidence || {};
  const items = [
    ["阅读主线", Boolean(lessonProgress?.completedReadingAt)],
    ["客观题 >= 80", Number(lessonProgress?.quizScore || 0) >= 80],
    ["实操作业", lessonProgress?.practiceStatus === "completed"],
    ["Codex 复核", Number(lessonProgress?.assignmentScore || 0) >= 80]
  ];
  return `
    <div class="mastery-evidence">
      <h3>掌握证据</h3>
      <p class="muted">本课不是看完就算过，需要留下会解释、会操作、会迁移的证据。</p>
      ${items
        .map(([label, done]) => `<p class="${done ? "done" : ""}"><span>${done ? "✓" : "·"}</span>${label}</p>`)
        .join("")}
      <h3>本课能力目标</h3>
      <ul>
        ${(lesson.masteryOutcomes || []).map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <h3>当前阶段</h3>
      <p><strong>${phaseLabel(lessonProgress?.phase)}</strong></p>
      ${evidence.practicePath ? `<p class="muted">实操记录：${evidence.practicePath}</p>` : ""}
    </div>
  `;
}

function renderPreview(lesson, accuracy, options = {}) {
  const locked = lesson.status === "locked";
  const actionLabel = options.actionLabel || "开始学习";
  return `
    <section class="panel lesson-hero">
      <span class="status ${lesson.status}">${statusLabel(lesson.status)}</span>
      <p class="eyebrow">课程预览</p>
      <h2>${lesson.title}</h2>
      <p>这节课的目标不是“看过”，而是让你能解释、识别、操作、迁移。开始学习后，页面会切换到正式内容；读完后才会解锁测验和实操。</p>
      <div class="sketch-flow">
        <span>任务</span><i></i><span>例子</span><i></i><span>解释</span><i></i><span>操作</span><i></i><span>迁移</span>
      </div>
      <h3>学完你要能做到</h3>
      <ul>${(lesson.masteryOutcomes || []).map((item) => `<li>${item}</li>`).join("")}</ul>
      <h3>本课实操</h3>
      <p><strong>${lesson.practiceTask?.title || "实操任务"}</strong></p>
      <p>${lesson.practiceTask?.prompt || ""}</p>
      ${
        locked
          ? `<p class="result">这节课还未解锁。你可以先看目标，但建议按当前路径推进。</p>`
          : `<button class="primary-button" id="startLesson">${actionLabel}</button>`
      }
    </section>
    ${renderAccuracyPanel(accuracy)}
  `;
}

function renderLearning(lessonResponse, showComplete = true) {
  return `
    ${renderReadingTools(lessonResponse.markdown)}
    <section class="panel markdown lesson-reading">
      ${markdownToHtml(lessonResponse.markdown)}
      ${
        showComplete
          ? `<div class="lesson-actions">
              <button class="primary-button" id="completeLesson">我已完成学习，进入自查与测验</button>
            </div>`
          : ""
      }
    </section>
    ${renderAccuracyPanel(lessonResponse.accuracy)}
  `;
}

function renderAssignmentBox(lesson, lessonProgress) {
  return `
    <section class="panel practice-panel">
      <p class="eyebrow">你来操作</p>
      <h3>${lesson.practiceTask?.title || "本课实操任务"}</h3>
      <p>${lesson.practiceTask?.prompt || ""}</p>
      <p class="muted">验收证据：${lesson.practiceTask?.expectedEvidence || "提交一个可复用产物。"}</p>
      <textarea id="practiceText" placeholder="在这里写你的实操作业、设计、代码路径、trace 或 schema..."></textarea>
      <button class="primary-button" id="savePractice">保存实操证据</button>
      <div id="practiceResult">${lessonProgress?.evidence?.practicePath ? `<p class="result good">已保存：${lessonProgress.evidence.practicePath}</p>` : ""}</div>
    </section>
  `;
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
        <p class="muted">建议投入 ${current?.durationMinutes || 60} 分钟。工作日只做一节：先学主线，再自查测验，最后留下一个实操证据。</p>
        <button class="primary-button" id="openCurrent">进入当前课程</button>
      </section>
      <section class="panel">
        <p class="eyebrow">监督规则</p>
        <p>读完不等于掌握。每节课都要完成解释、测验、实操和 Codex 复核，才能算真正过关。</p>
        <p class="muted">测验 80+ 只是进入实操；主观题和代码题会继续由 Codex 复核。</p>
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
          const lessonIndex = state.plan.lessons.findIndex((item) => item.id === lesson.id) + 1;
          const active = state.selectedLessonId === lesson.id;
          return `
            <button type="button" class="lesson-row ${active ? "active" : ""}" data-lesson-id="${lesson.id}">
              <span class="lesson-number">${String(lessonIndex).padStart(2, "0")}</span>
              <span class="lesson-row-main">
                <strong>${lesson.title}</strong>
                <small>${lesson.knowledgeTags.slice(0, 2).join(" / ")}</small>
              </span>
              <span class="status ${status}">${statusLabel(status)}</span>
            </button>
          `;
        })
        .join("");
      return `
        <section class="week-group">
          <p class="eyebrow">第 ${week.week} 周</p>
          <h3>${week.theme}</h3>
          <p class="muted">${week.goal}</p>
          <div class="lesson-list">${cards}</div>
        </section>
      `;
    })
    .join("");

  content.innerHTML = `<div class="lesson-shell"><aside class="lesson-index">${grouped}</aside><div id="lessonDetail" class="lesson-detail"></div></div>`;
  content.querySelectorAll("[data-lesson-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.forcePreviewLessonId = null;
      openLesson(button.dataset.lessonId);
    });
  });
  openLesson(state.selectedLessonId || state.progress.currentLessonId);
}

async function openLesson(lessonId) {
  state.selectedLessonId = lessonId;
  content.querySelectorAll("[data-lesson-id]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lessonId === lessonId);
  });
  const lessonResponse = await api(`/api/lesson/${encodeURIComponent(lessonId)}`);
  const questionSet = await api(`/api/questions/${encodeURIComponent(lessonId)}`);
  const status = effectiveLessonStatus(lessonResponse.lesson);
  const lessonProgress = lessonResponse.lessonProgress || { phase: "preview", quizUnlocked: false };
  const phase = status === "locked" ? "preview" : lessonProgress.phase || "preview";
  const forcePreview = state.forcePreviewLessonId === lessonId;
  const detail = document.querySelector("#lessonDetail");
  const mainContent = status === "locked"
    ? renderPreview({ ...lessonResponse.lesson, status }, lessonResponse.accuracy)
    : phase === "preview" || forcePreview
      ? renderPreview(
          { ...lessonResponse.lesson, status },
          lessonResponse.accuracy,
          { actionLabel: phase === "preview" ? "开始学习" : "继续当前阶段" }
        )
      : phase === "learning"
        ? renderLearning(lessonResponse)
        : `
          ${renderLearning(lessonResponse, false)}
          <section class="panel checkpoint-panel">
            <p class="eyebrow">阶段自查</p>
            <h3>现在先别急着点题</h3>
            <p>请先在脑子里回答：这节课解决什么问题？如果把它迁移到你的营销评估 Agent，它落在哪个模块？它最容易被误用在哪里？</p>
          </section>
          <section class="panel">
            <h3>即时测验</h3>
            <div id="quiz"></div>
          </section>
          ${renderAssignmentBox(lessonResponse.lesson, lessonProgress)}
        `;
  detail.innerHTML = `
    <div class="lesson-workbench">
      <section class="lesson-main">
        <div class="lesson-topline">
          ${renderLessonStepper(forcePreview ? "preview" : phase)}
          ${
            phase !== "preview"
              ? `<button type="button" class="ghost-button" id="showLessonPreview">${forcePreview ? "继续当前阶段" : "查看本课目标"}</button>`
              : ""
          }
        </div>
        ${mainContent}
      </section>
      <aside class="panel lesson-side">
        ${renderMasteryChecklist(lessonResponse.lesson, lessonProgress)}
        <div class="review-box">
          <h3>给 Codex 的深度提交</h3>
          <p class="muted">如果你想让我追问、评分或讲解卡点，把答案保存在这里，再贴给我。</p>
          <textarea id="submissionText" placeholder="写下你的解释、疑问、设计、代码路径或复盘..."></textarea>
          <button class="secondary-button" id="saveSubmission">保存深度提交</button>
          <div id="submissionResult"></div>
        </div>
      </aside>
    </div>
  `;
  if (!forcePreview && phase !== "preview" && phase !== "learning") {
    renderQuiz(questionSet);
  }
  document.querySelector("#showLessonPreview")?.addEventListener("click", () => {
    state.forcePreviewLessonId = forcePreview ? null : lessonId;
    openLesson(lessonId);
  });
  document.querySelector("#startLesson")?.addEventListener("click", async () => {
    state.forcePreviewLessonId = null;
    if (lessonProgress.phase && lessonProgress.phase !== "preview") {
      openLesson(lessonId);
      return;
    }
    await api("/api/lesson/start", {
      method: "POST",
      body: JSON.stringify({ lessonId })
    });
    await loadState();
    openLesson(lessonId);
  });
  document.querySelector("#completeLesson")?.addEventListener("click", async () => {
    await api("/api/lesson/complete", {
      method: "POST",
      body: JSON.stringify({ lessonId })
    });
    await loadState();
    openLesson(lessonId);
  });
  document.querySelector("#savePractice")?.addEventListener("click", async () => {
    const value = document.querySelector("#practiceText").value.trim();
    if (!value) return;
    const result = await api("/api/submissions", {
      method: "POST",
      body: JSON.stringify({ lessonId, kind: "practice", content: value })
    });
    document.querySelector("#practiceResult").innerHTML = `<p class="result good">已保存：${result.path}</p>`;
    await loadState();
    openLesson(lessonId);
  });
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
  const radar = state.sources.radar || state.sources;
  const sourceRegistry = state.sources.sourceRegistry || { tiers: [], sources: [] };
  const claimsRegistry = state.sources.claimsRegistry || { claims: [] };
  content.innerHTML = `
    <section class="panel">
      <h3>可信度分层</h3>
      ${sourceRegistry.tiers.map((tier) => `<p><strong>${tier.tier} 类：${tier.name}</strong><br><span class="muted">${tier.allowedUse}</span></p>`).join("")}
    </section>
    <section class="panel">
      <h3>来源注册表</h3>
      <div class="grid two">
        ${sourceRegistry.sources
          .map(
            (source) => `
              <article class="source-card">
                <span class="status">${source.tier} 类 · ${stabilityLabel(source.stability)}</span>
                <h3>${source.title}</h3>
                <p class="muted">${source.publisher} · ${source.type}</p>
                <p>${source.whyTrusted}</p>
                <p class="muted">Checked: ${source.checkedAt} · Refresh: ${source.refreshAfter}</p>
                <a href="${source.url}" target="_blank" rel="noreferrer">打开来源</a>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
    <section class="panel">
      <h3>关键断言</h3>
      <div class="claim-list">
        ${claimsRegistry.claims
          .map(
            (claim) => `
              <article class="claim-card">
                <strong>${claim.scope} · ${claim.confidence} · ${stabilityLabel(claim.stability)}</strong>
                <p>${claim.statement}</p>
                <span>verified ${claim.verifiedAt} · sources: ${claim.sourceIds.join(", ")}</span>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
    <div class="grid two">
      ${radar.items
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
        <p><code>projects/mini_agent/</code>：第 1 周使用的手搓 Agent loop，覆盖工具调用、trace、错误和 max step。</p>
        <p><code>projects/marketing_eval_agent/causal_tools/</code>：轻量 PSM / DML / ITE 工具骨架。</p>
        <p><code>projects/marketing_eval_agent/tests/</code>：基础测试。</p>
      </section>
      <section class="panel">
        <h3>下一步</h3>
        <p>先完成第 1 周 mini-agent，再在第 3-4 周把因果工具接入业务 Agent：inspect、select method、estimate、diagnose、report。</p>
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
