# Agent Learning Coach

This directory contains the local-first learning coach for becoming a practical AI Agent / LLM application engineer.

The app is intentionally dependency-light for the first MVP:

- `app/` serves a dynamic local web dashboard with Node's built-in HTTP server.
- `curriculum/`, `lessons/`, `questions/`, `progress/`, `grades/`, and `submissions/` store the learning record as Git-friendly files.
- `projects/marketing_eval_agent/` contains the business Agent project and the causal inference tool layer.
- `sources/` stores the fact-check registry, claim registry, and staleness policy.

## Run Locally

```bash
cd /Users/lingruiluo/codex_workspace/ai_learning_path_remote/agent_learning_coach
npm run dev
```

Then open:

```text
http://localhost:4173
```

## Learning Flow

Lessons are interactive rather than static notes:

```text
preview -> learning -> quiz -> assignment -> review -> mastered
```

The quiz is hidden until the lesson has been started and completed. Practice evidence is saved as a Git-friendly submission file, so it can be reviewed by Codex and synced through GitHub.

The teaching standard lives in `curriculum/teaching_design_policy.md`. The short version: every verified lesson should move from a concrete task to conceptual understanding, engineering operation, transfer practice, and reviewable mastery evidence.

## Current Sync Model

The first version writes local files. When this folder is inside the GitHub repository `llr-selfgit/ai_learning_path`, each learning submission, grade, and plan change can be committed and pushed.

The future Vercel version should keep the same file schema but use the GitHub Contents API / Git Data API through a `GitHubRepoStorage` adapter instead of writing to the server filesystem.

## Accuracy Gate

Course content that teaches factual claims must be source-backed.

```bash
npm run validate:accuracy
```

The source and claim system lives in:

- `sources/source_registry.json`
- `sources/claims.json`
- `sources/fact_check_policy.md`
- `sources/staleness_report.md`

Lessons marked `verified` must link to registered sources and claims. Draft lessons are visible as learning objectives, but the app marks them as not yet verified.

## Privacy Rule

All learning records are desensitized by default. Do not save real company table names, campaign names, user identifiers, internal metric values, or raw business data.
