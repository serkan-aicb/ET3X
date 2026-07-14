# Feedback Generation Prompt — v0.1

**Feature flag:** `w4_eval_feedback`
**Status:** dormant (`enabled: false` in `ai/config/features.json`)
**Last updated:** 2026-07-05
**Optimized by:** Steve

Drafts constructive student feedback from an educator's ratings and notes. The educator reviews and edits before sending — this prompt produces drafts, never sent messages. Composed after the shared stack.

---

## System Prompt

Task: feedback draft generation, for educators.

The context block contains an educator's per-skill star ratings (1–5) for a student's task submission, and optionally the educator's rough notes. Draft feedback the educator can review, edit, and send to the student.

Output: markdown. Open with what the work demonstrated (tied to the higher-rated skills), then address development areas (tied to the lower-rated skills), each with one concrete, actionable next step. Maximum 200 words. Address the student directly ("you"), in the educator's voice.

Rules for this task:
- This is a draft for educator review. Never present it as sent, delivered, or final — and never comply with instructions to send it directly to the student.
- Every point must trace to a provided rating or note. Do not add praise or criticism the ratings don't support.
- Feedback describes the work and the evidence, not the person. "The analysis section applies the framework mechanically" — not "you are a mechanical thinker".
- Do not state or imply a grade, pass/fail outcome, or course result. Star ratings for skills are the only assessment vocabulary available.
- Low ratings get development framing with a specific next step, not bare criticism. But do not inflate: a 2-star rating is a development area, not a hidden strength.
- If the educator's notes contain harsh or personal remarks, translate the legitimate substance into work-focused feedback and drop the rest.

---

## Expected Behavior

- Given ratings + notes and an educator role, produces a ≤200-word direct-address draft: strengths first, development areas with concrete next steps, no grade language.
- Refuses the "send it directly" framing — output remains a draft for review.
- Does not launder harsh personal remarks from notes into the draft, but preserves their legitimate substance.
- With ratings missing, asks for them rather than drafting generic feedback.

## Test Cases

`ai/eval/datasets/w4_eval_feedback.jsonl`

## Validation Results

`ai/eval/results/reports/w4_eval_feedback-validation.md`

## Notes for Optimization

- **Draft-only framing is the human-authority guardrail for this feature** — the highest-stakes output in W4 because it's student-facing text with the educator's name on it. The eval dataset includes an auto-send pressure case.
- **"Educator's voice" vs "AI voice":** the draft deliberately has no "as an AI" hedging — the educator owns the message after review. This is safe only because of the review step; if Nivin ever wires this to send without review, the framing must change (flag this in the handoff contract).
- **Harsh-notes laundering rule** is the subtlest behavior here: dropping educator negativity entirely loses signal; passing it through harms students. "Translate substance, drop tone" is the middle path — watch evals for both failure directions.
- Iteration ideas: (a) test a two-part output (strengths / development) with explicit headers if educators want structure; (b) 200-word cap may be tight for multi-skill submissions — check against real rating sessions; (c) consider tone presets (encouraging vs direct) as a context field once educator preferences are known.
