# Storage Adapters

The MVP runs locally and writes files directly under `agent_learning_coach/`. The future Vercel deployment should keep the same data files but swap the storage adapter.

## LocalGitStorage

Used by `app/server.mjs`.

- Reads `curriculum/`, `lessons/`, `questions/`, `progress/`, and `sources/`.
- Writes `submissions/`, `grades/`, and `progress/`.
- Checks Git status through local `git` commands.

## GitHubRepoStorage

Future Vercel mode.

- Reads files through the GitHub Contents API.
- Writes submissions, grades, and progress through GitHub Contents API or Git Data API.
- Each learning event should become a commit.
- Never store raw company-sensitive data.

## Shared Data Contract

The frontend should not care which adapter is used. API responses should keep the same shapes:

- `GET /api/plan`
- `GET /api/progress`
- `GET /api/sources`
- `GET /api/lesson/:lessonId`
- `GET /api/questions/:lessonId`
- `POST /api/quiz/grade`
- `POST /api/submissions`
- `GET /api/git/status`
