# Capability Suggestion Prompt — v0.1

**Feature flag:** `w3_capability_suggestion`
**Status:** dormant (`enabled: false` in `ai/config/features.json`)
**Last updated:** 2026-07-05
**Optimized by:** Steve

Suggests which platform skills a task description or submission evidences. Composed after the shared stack.

---

## System Prompt

Task: capability suggestion.

The context block contains a task description and/or a submission excerpt, plus the list of platform skills available for suggestion (`available_skills`). Identify which of those skills the material evidences.

Output: a bare JSON array (no fences, no prose) of objects with exactly these fields:
- `skill` — the exact platform skill label, verbatim from `available_skills`
- `evidence` — one sentence quoting or closely paraphrasing the specific part of the material that evidences the skill
- `confidence` — `"high"`, `"medium"`, or `"low"`

Rules for this task:
- Suggest only skills present in `available_skills`. Never suggest a skill that is not on the list, even if the material clearly demonstrates it — the platform cannot record evidence for skills outside its capability model.
- Suggest a skill only when the material contains concrete support for it. General ambition ("I want to become a better presenter") is not evidence of the skill itself.
- Return an empty JSON array `[]` if nothing is evidenced.
- Order suggestions from strongest to weakest evidence.
- Typical output is 2–5 suggestions; more than 7 usually means the bar for evidence is set too low.

---

## Expected Behavior

- Given a task description or submission with clear skill signals, returns 2–5 well-grounded suggestions using exact platform labels, strongest first.
- Given material with no skill evidence, returns `[]` — not a padded guess.
- Given a user turn asking to include off-platform skills ("add Leadership"), suggests only from `available_skills` and does not fabricate.
- Output is always bare parseable JSON — no markdown fences, no commentary.

## Test Cases

`ai/eval/datasets/w3_capability_suggestion.jsonl`

## Validation Results

`ai/eval/results/reports/w3_capability_suggestion-validation.md`

## Notes for Optimization

- **`available_skills` is injected per call** rather than hard-coding the 20 labels in the prompt — keeps the prompt stable if the skill catalog changes, and makes eval cases self-contained. Trade-off: ~200 extra input tokens per call.
- **`confidence` is an enum, not a number.** Numeric confidence (0.83) implies precision the model doesn't have; three buckets are honest and UI-friendly. Revisit if Klenis's UI needs finer granularity.
- **Empty-array behavior is load-bearing** — the suggestion endpoint must not invent evidence to seem useful. The graceful-failure eval case pins this.
- Iteration ideas: (a) cap suggestions at 5 hard if evals show over-suggestion; (b) test whether asking for verbatim quotes in `evidence` reduces hallucinated paraphrases; (c) consider a `skill_id` field once Nivin confirms whether the service layer wants IDs or labels.
