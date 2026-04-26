# Agent Learning Coach

This directory contains the local-first learning coach for becoming a practical AI Agent / LLM application engineer.

The app is intentionally dependency-light for the first MVP:

- `app/` serves a dynamic local web dashboard with Node's built-in HTTP server.
- `curriculum/`, `lessons/`, `questions/`, `progress/`, `grades/`, and `submissions/` store the learning record as Git-friendly files.
- `projects/marketing_eval_agent/` contains the business Agent project and the causal inference tool layer.

## Run Locally

```bash
cd /Users/lingruiluo/codex_workspace/ai_learning_path/agent_learning_coach
npm run dev
```

Then open:

```text
http://localhost:4173
```

## Current Sync Model

The first version writes local files. When this folder is inside the GitHub repository `llr-selfgit/ai_learning_path`, each learning submission, grade, and plan change can be committed and pushed.

The future Vercel version should keep the same file schema but use the GitHub Contents API / Git Data API through a `GitHubRepoStorage` adapter instead of writing to the server filesystem.

## Privacy Rule

All learning records are desensitized by default. Do not save real company table names, campaign names, user identifiers, internal metric values, or raw business data.
