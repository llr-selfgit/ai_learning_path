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
- Marketing Evaluation Agent project skeleton.
- Transparent PSM / DML / uplift tool layer without `econml` or `doubleml`.
- Unit tests for causal tools.

## Not Yet Implemented

- Full verified 24-lesson content.
- Automatic lesson unlocking beyond the current static subset.
- In-browser code runner.
- GitHub push automation.
- Vercel `GitHubRepoStorage` implementation.
- Codex review import flow for subjective/code grading.

## Next Build Slice

1. Expand lesson metadata from 6 concrete lessons to all 24 lesson files.
2. Add a review import page so Codex feedback can be pasted back into `grades/`.
3. Add Git sync commands once GitHub access is available.
4. Convert the local server API to a Next.js/Vercel adapter when deployment is ready.

## Accuracy Gate

Before a lesson is marked `verified`, its core claims must exist in `sources/claims.json`, each claim must link to registered sources in `sources/source_registry.json`, and `npm run validate:accuracy` must pass.
