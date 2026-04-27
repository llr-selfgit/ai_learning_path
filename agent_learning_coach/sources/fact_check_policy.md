# Fact Check Policy

The learning coach treats factual accuracy as a release gate, not a cleanup task.

## Source Tiers

- A: Official documentation, company engineering blogs, papers, protocol specifications, and technical reports.
- B: High-quality open source projects, Hugging Face/GitHub courseware, and implementation guides.
- C: University or research lab lectures, papers, and long-form technical notes.
- D: Community posts, Zhihu, CSDN, X, Bilibili, YouTube, and personal blogs.

D-tier sources are useful for discovering trends, but they cannot be the sole support for a core learning conclusion.

## Claim Rules

Every lesson-level factual claim about a company, API, framework, protocol, model capability, paper result, or industrial pattern must be recorded in `claims.json`.

Each claim must include:

- `statement`
- `sourceIds`
- `confidence`
- `verifiedAt`
- `stability`
- `scope`

If a claim cannot be verified, mark it as an unverified note in the lesson metadata. Do not present it as a formal conclusion.

## Stability Rules

- `stable`: Foundational theory or durable engineering pattern. Review every 6-12 months.
- `changing`: Product, framework, or best-practice guidance. Review every 3 months.
- `fast-changing`: Current model, API, protocol draft, pricing, or platform capability. Review every 1-2 months.

## Writing Rules

- Distinguish fact, inference, best practice, opinion, and teaching analogy.
- Avoid absolute statements such as "Company X always does Y" unless directly supported.
- If a source supports a narrower claim, do not broaden it.
- Mark tradeoffs as tradeoffs, not as universal rules.
- For latest/current model or API behavior, refresh against official docs before publishing.

## Learner Risk Check

Before marking a lesson verified, ask: "If this is wrong, what wrong habit would the learner form?"

If the risk is high, add stronger sources, narrower wording, or an explicit caveat.
