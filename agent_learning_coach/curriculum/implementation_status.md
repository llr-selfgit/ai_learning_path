# Implementation Status

Updated: 2026-04-28

## Implemented

- Dynamic local web dashboard with course tree, lesson workbench, phase flow, quiz grading, practice submission, mastery tracking, Git status, source radar, and lesson accuracy panel.
- v3 chapter-mode curriculum: 24 lessons, 8 weeks, stable v2 lesson IDs, deep chapter markdown, and reset progress state.
- Agent loop moved into Week 1 as `lesson-003-agent-loop-from-scratch`.
- All 24 lessons now have verified metadata, source IDs, claim IDs, refresh dates, mastery outcomes, practice tasks, transfer tasks, and common pitfalls.
- All 24 lesson markdown files were rebuilt in chapter mode with real task opening, first-use terminology explanation,会员券 90 天 GTV story line, mini-agent code line, hand-held lab, expected output, common errors, misconception gap, industrial case, and staleness note.
- All 24 question files now include at least 2 objective questions with per-option explanations plus a practice task reference.
- Source registry rebuilt with 31 sources, including OpenAI, Anthropic, Claude Code, Google ADK, LangGraph, MCP, Qwen-Agent, DeepSeek, xAI, Kimi K2, GLM-4.5, DeerFlow, Trae Agent, OpenHands, Hermes, OpenClaw, MiniMax docs, and OpenCVE/TechRadar risk references.
- Claim registry rebuilt with 25 source-backed claims and explicit confidence/stability/scope.
- Accuracy validation now checks lesson files, question files, practice tasks, question count, option explanations, sources, claims, and verified metadata.
- Content-depth validation checks chapter sections, terminology area, lab instructions, expected output, misconception section, source section, and first-week term ordering.
- `projects/mini_agent/` added for Week 1 hand-rolled Agent loop practice.
- Mini-agent CLI added for `calculator`, `coupon_good`, and `coupon_bad` scenarios.
- Mini-agent tests cover happy path, unknown tool, bad args, tool failure, max iteration, diagnostic downgrade, and CLI scenarios.
- Marketing Evaluation Agent causal tools remain in place, with bundled-runtime tests passing.
- `npm run write:v3-lessons`, `npm run validate:content-depth`, `npm run test:mini-agent`, and `npm run test:all` scripts added.

## Still Not Implemented

- Automatic mastery-based lesson unlocking after Codex review scores.
- In-browser code runner.
- GitHub/Vercel storage adapter for multi-device hosted progress.
- Codex review import flow for subjective/code grading.
- Rich visual lesson diagrams beyond current text diagrams, chapter table of contents, and术语速查.

## Next Build Slice

1. Add mastery-based unlock logic once review scores exist.
2. Add review import so Codex feedback can update `grades/` and `progress/state.json`.
3. Add a richer diagram component for lesson mechanism views.
4. Design Vercel storage adapter for GitHub-backed or database-backed progress sync.

## Accuracy Gate

Before a lesson is marked `verified`, its core claims must exist in `sources/claims.json`, each claim must link to registered sources in `sources/source_registry.json`, and `npm run validate:accuracy` must pass.

## Mastery Gate

A lesson is not treated as mastered just because it was opened or read. The intended gate is:

```text
read lesson -> score 80+ on objective quiz -> submit practice evidence -> Codex review score 80+
```

Until review import is implemented, the dashboard records practice evidence and marks the lesson as waiting for Codex review.
