# Teaching Design Policy

This file is the content quality contract for the Agent Learning Coach. Accuracy is the release gate; mastery-oriented teaching is the learning gate.

## Goal

Every lesson should help the learner become able to explain, operate, debug, and transfer the concept. A lesson is not finished when it has definitions. It is finished when it gives the learner enough structure and practice to use the idea in the Marketing Evaluation Agent project or an adjacent Agent product.

## Lesson Shape

Each formal lesson should use a total-part-total structure:

1. Overview: what problem this lesson solves and why it matters.
2. Task opening: a concrete business or engineering task before abstract vocabulary.
3. First attempt: a small worked example or decision exercise.
4. Concept breakdown: definitions, mechanisms, boundaries, and tradeoffs.
5. Engineering landing: schema, code, trace, prompt, eval, or workflow guidance.
6. Visual explanation: flow chart, state diagram, table, or interaction sketch.
7. Industrial view: source-backed company, framework, paper, or protocol examples.
8. Learner operation: something the learner must write, implement, inspect, or debug.
9. Common pitfalls: where the concept is usually misused.
10. Transfer practice: how the same idea maps to another Agent or AI product.
11. Mastery check: what evidence proves the learner understands it.

The lesson can be concise, but it should not be shallow. "Simple" means using examples and progressive explanation, not removing the important technical content.

## Interaction Flow

The web coach must avoid showing tests before learning has started. A lesson moves through these phases:

```text
preview -> learning -> quiz -> assignment -> review -> mastered
```

- Preview shows goals, practice task, and accuracy metadata.
- Learning shows the complete lesson content and hides the quiz until reading is completed.
- Quiz checks self-understanding and unlocks the practice stage when the learner scores high enough.
- Assignment captures operational evidence such as a schema, prompt, trace, code path, or bad-case design.
- Review is where Codex grades the subjective or code evidence and updates the next plan.
- Mastered requires quiz performance, practice evidence, and review score.

## Mastery Evidence

Each lesson should define:

- `masteryOutcomes`: concrete abilities the learner should gain.
- `practiceTask`: a hands-on task with expected evidence.
- `transferTask`: a nearby task that tests generalization.
- `commonPitfalls`: mistakes the lesson should prevent.

The dashboard tracks these as learning evidence instead of treating a page view as completion.

## Writing Rules

- Start with a realistic task whenever possible.
- Explain new terms the first time they appear.
- Prefer one reusable mental model over many disconnected labels.
- Tie abstract ideas back to the Marketing Evaluation Agent.
- Show at least one failure mode for important design choices.
- Do not turn company examples into unsourced claims. Bind claims to `sources/claims.json`.
- Mark unstable facts and platform behavior with refresh dates.

## Review Checklist

Before a lesson becomes `verified`, check:

- Is the main problem clear before terminology appears?
- Can the learner perform a concrete operation after reading?
- Are examples sufficient to support the claims?
- Are boundaries and failure modes visible?
- Are industrial cases source-backed?
- Is there a practice task that produces reviewable evidence?
- If this lesson is wrong, what harmful misunderstanding would the learner carry into work?
