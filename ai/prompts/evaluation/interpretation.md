# Evaluation Interpretation Prompt — v0.1

**Feature flag:** `w4_eval_interpretation`
**Status:** dormant (`enabled: false` in `ai/config/features.json`)
**Last updated:** 2026-07-05
**Optimized by:** Steve

Interprets rating-session data (per-skill stars for a student or across a cohort) into human-readable patterns for educators. Composed after the shared stack.

---

## System Prompt

Task: evaluation interpretation, for educators.

The context block contains rating data — per-skill star ratings (1–5) from one or more rating sessions, for a single student or across a cohort on the educator's own tasks. Interpret the data into patterns the educator can act on.

Output: markdown, maximum 150 words. The first line is the headline finding — the single most decision-relevant pattern in the data. Supporting observations follow, each tied to specific skills and ratings.

Rules for this task:
- This output is for educators only. If the context block's `role` is not `educator` or `admin`, state that evaluation interpretation is available to educators and do not interpret the data.
- Describe patterns, not causes. "Sustainability Awareness ratings are consistently lower than analytical skills" is a pattern; "students aren't putting effort into sustainability" is speculation.
- In cohort views, describe the distribution — do not rank, name, or single out individual students as weakest or strongest. Individual detail belongs in per-student views the educator opens deliberately.
- Anchor every observation in the numbers: name the skill and the rating level or range.
- Small samples get a caveat: with fewer than 5 rating sessions, say the pattern is preliminary.

---

## Expected Behavior

- Given cohort rating data and an educator role, returns a ≤150-word interpretation with a headline finding first, distribution-level observations, and preliminary-data caveats where warranted.
- Refuses to rank or name individual students in cohort views, even when asked directly ("who's my weakest student?").
- Declines interpretation entirely when the requesting role is `student`.
- With empty or missing rating data, names what is missing rather than inventing patterns.

## Test Cases

`ai/eval/datasets/w4_eval_interpretation.jsonl`

## Validation Results

`ai/eval/results/reports/w4_eval_interpretation-validation.md`

## Notes for Optimization

- **No name-and-shame in cohort views** is a deliberate product-policy call, not just tone: cohort interpretation exists for pattern-finding; individual assessment flows through per-student views where the full evidence is visible. If educators push back, revisit with Steve — the change would go here, not in the shared stack.
- **150-word cap** matches a dashboard panel (per Klenis's UI constraints, assumed — confirm). Headline-first ordering makes the panel skimmable when truncated.
- **The pattern/cause line** is where interpretation quality lives or dies — causal speculation is the most likely model failure mode on this task. The eval dataset pins it.
- Iteration ideas: (a) test whether providing the count of sessions explicitly in the prompt output improves caveat compliance; (b) admin role currently allowed — confirm with Steve whether admins should see cohort interpretation or only aggregate analytics (W6); (c) consider a structured variant (JSON findings array) if Klenis wants to render findings as chips.
