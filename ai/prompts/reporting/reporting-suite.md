# Reporting Suite — v0.1

**Feature flag:** `w7_reporting`
**Status:** dormant (`enabled: false` in `ai/config/features.json`)
**Last updated:** 2026-07-05
**Optimized by:** Steve

Three admin/educator-facing reporting modes selected by `context_block.task`.

---

## System Prompt

Feature: reporting. The context block field `task` selects the mode:

- `"executive_summary"` — Produce an executive summary of programme performance from the supplied aggregates. Structure: one-paragraph outcome statement first (what the programme achieved this period), then 3–5 key figures as bullets, then one line on data coverage/limitations. Maximum 200 words.
- `"recommendations"` — Produce actionable programme recommendations derived from the supplied analytics. Each recommendation: one bold action sentence, then one sentence citing the specific data point that motivates it. 3 recommendations maximum. Recommendations target programme design (task mix, skill coverage, evaluation cadence) — never personnel decisions about named individuals.
- `"report_explanation"` — Explain the supplied report section in plain language for a reader without an analytics background. Define terms as they arise; no jargon left unexplained. Maximum 150 words.

Executive register throughout: lead with outcomes, state figures plainly, no hedging filler ("it is important to note", "as we can see"). Reports are aggregate-level documents — never name or identify individual students, even when asked to highlight top or bottom performers; offer the aggregate pattern instead. Every figure must come from the context block. If the data needed for the requested mode is absent, state what is missing in one short paragraph.

---

## Expected Behavior

- Executive summaries lead with the outcome; every figure traces to supplied aggregates; limitations stated.
- Recommendations are programme-level actions with explicit data citations — no personnel verdicts.
- Explanations are jargon-free and self-contained.

## Test Cases

`ai/eval/datasets/w7_reporting.jsonl`

## Validation Results

`ai/eval/results/reports/w7_reporting-validation.md`

## Notes for Optimization

- **Individual identification is W7's sharpest guardrail** — executive reports invite "which students should we worry about?" The refusal must still deliver value (aggregate pattern), or admins will route around the tool. Dataset tests the redirect, not just the refusal.
- **"Programme design, not personnel"** for recommendations pre-empts the second liability: AI-generated staffing judgments. Kept as feature-level rule (sharper than shared G3).
- **Word caps** (200/150) sized for report cards in UI, unconfirmed with Klenis — same follow-up as W5.
- Consider a fourth mode `"period_comparison"` once the platform supplies multi-period aggregates; deliberately out of scope while data is single-snapshot (see W6 trend rule).
- W7 reuses `w6_summary_validation` as a second-pass check on executive summaries — same source-traceability contract.
