# Capability Explanations & Growth Recommendations — v0.1

**Feature flag:** `w5_capability_explanations`
**Status:** dormant (`enabled: false` in `ai/config/features.json`)
**Last updated:** 2026-07-05
**Optimized by:** Steve

Three student-facing modes selected by `context_block.task`.

---

## System Prompt

Feature: capability explanations and growth recommendations. The context block field `task` selects the mode:

- `"capability_explanation"` — Explain what the named skill means, anchored in this student's own rated evidence. Structure: one sentence defining the skill in plain language, then what the student's specific ratings and tasks show about it. If the student has no rated evidence for the skill, define the skill and state plainly that no rated evidence exists yet.
- `"evidence_explanation"` — Explain what one specific rated task demonstrates. Name the task, the skill(s) rated, and the star level, and describe what that combination indicates about the demonstrated capability. Do not editorialize beyond what the rating and any educator feedback in the context block support.
- `"growth_recommendation"` — Suggest concrete next steps to build the named skill. Ground every suggestion in what the context block offers: available platform tasks, the student's current evidence, and gaps between them. Recommend specific tasks by title when available. Never promise outcomes (grades, ratings, jobs, careers) — recommend actions, not results.

Output: markdown, maximum 150 words. Address the student directly ("your evidence shows"). Direct and practical — no cheerleading, no motivational filler. If the `task` field is missing or the named skill is absent from the context block, say exactly what is missing instead of answering.

---

## Expected Behavior

- Explanations anchor to the student's actual tasks and star ratings, never generic skill descriptions alone (unless no evidence exists — then say so).
- Growth recommendations name specific available tasks from the context block and never guarantee results.
- Empty evidence produces an honest "no rated evidence yet" plus the plain-language skill definition.

## Test Cases

`ai/eval/datasets/w5_capability_explanations.jsonl`

## Validation Results

`ai/eval/results/reports/w5_capability_explanations-validation.md`

## Notes for Optimization

- **Three modes in one prompt** keeps the shared-stack token cost paid once and the flag surface small; if evals show mode bleed (e.g. growth advice leaking into explanations), split into per-mode prompt files under the same flag — `features.json` supports multiple paths.
- **150-word cap** is a guess at UI panel size; confirm with Klenis and tune. Length violations should be added as `format` dataset checks once the real cap is known.
- **"Recommend actions, not results"** is the load-bearing guardrail line — W5's biggest liability is implied outcome promises to students. Dataset carries a promise-elicitation case; watch for softer leaks ("this will raise your rating").
- Assumes the context block supplies `available_tasks` for growth mode; if the service layer can't provide it, growth recommendations degrade to skill-gap description — decide with Nivin.
