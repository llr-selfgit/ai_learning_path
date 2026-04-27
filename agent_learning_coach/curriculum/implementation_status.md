# Implementation Status

## Implemented

- Local dynamic web dashboard with no external JS dependencies.
- Course tree with visible route and locked/available states.
- Lesson detail view with markdown content.
- Objective quiz grading with per-option explanations.
- Knowledge mastery scoring and recent mistake tracking.
- Subjective submission save flow.
- Git status panel.
- Source radar.
- Source registry, claim registry, fact-check policy, and staleness report.
- Lesson accuracy metadata with verified/draft status, source IDs, claim IDs, stability, and refresh dates.
- Accuracy panel on lesson pages.
- Accuracy validation script.
- Mastery-oriented teaching policy: total-part-total lessons, task-first explanation, engineering landing, transfer practice, and mastery evidence.
- Lesson phase flow: preview -> learning -> quiz -> assignment -> review, so quizzes and practice appear only after learning starts.
- Per-lesson progress state with started/completed timestamps, quiz unlock, quiz score, practice status, assignment score, mastery status, evidence paths, and weak points.
- Practice submission flow that saves operational evidence separately from deeper subjective submissions.
- All 24 lessons now have lesson-specific mastery outcomes, practice tasks, transfer tasks, and common pitfalls in `curriculum/plan.json`.
- Week 1 first three lessons rewritten into deeper task-led content with examples, diagrams, industrial context, operation guidance, pitfalls, transfer exercises, and mastery checks.
- Lesson 003 structured-output quiz added.
- Marketing Evaluation Agent project skeleton.
- Transparent PSM / DML / uplift tool layer without `econml` or `doubleml`.
- Unit tests for causal tools.

## Not Yet Implemented

- Full deep prose rewrite of all 24 lesson markdown files. The framework and first 3 lessons are upgraded; remaining lessons now have concrete metadata but still need the same content-depth pass.
- Automatic lesson unlocking based on reviewed mastery, beyond the current static subset.
- In-browser code runner.
- GitHub push automation.
- Vercel `GitHubRepoStorage` implementation.
- Codex review import flow for subjective/code grading.

## Next Build Slice

1. Deep rewrite lessons 004-006 with the same teaching design and source-backed claims.
2. Add a review import page so Codex feedback can be pasted back into `grades/`.
3. Add mastery-based unlocking once review scores exist.
4. Add Git sync commands once GitHub access is available.
5. Convert the local server API to a Next.js/Vercel adapter when deployment is ready.

## Accuracy Gate

Before a lesson is marked `verified`, its core claims must exist in `sources/claims.json`, each claim must link to registered sources in `sources/source_registry.json`, and `npm run validate:accuracy` must pass.

## Mastery Gate

A lesson is not treated as mastered just because it was opened or read. The intended gate is:

```text
read lesson -> score 80+ on objective quiz -> submit practice evidence -> Codex review score 80+
```

Until review import is implemented, the dashboard records practice evidence and marks the lesson as waiting for Codex review.
