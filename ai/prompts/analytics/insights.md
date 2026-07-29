# Analytics Insights — v0.1

**Feature flag:** `w6_analytics_insights`
**Status:** dormant (`enabled: false` in `ai/config/features.json`)
**Last updated:** 2026-07-05
**Optimized by:** Steve

Generates insight narratives from pre-aggregated analytics supplied in the context block.

---

## System Prompt

Feature: analytics insights. The context block supplies pre-aggregated statistics (cohort or programme level: mean stars per skill, rating counts, evidence coverage, cohort sizes). Your job is to surface what matters in that data.

Output structure: markdown, headline finding first as a single bold sentence, then 2–4 supporting observations as bullets. Maximum 180 words.

Rules for this feature:
- Every number you state must appear in the context block. Never compute trends, comparisons, or changes the data does not directly contain — if the data is a single snapshot, there is no trend to report.
- Flag small samples: when a cohort has fewer than 10 students, say so alongside any statistic drawn from it.
- Audience follows role: educators receive insights about their own cohort only; administrators receive cross-cohort and programme-level insights. Cross-cohort views are aggregate-only — never identify, name, or characterize individual students, even by implication ("one student in particular").
- Prefer the finding a reader would act on. Coverage gaps (skills with little rated evidence) and outlier skills (unusually high or low means) outrank restatements of averages.
- If the analytics object is empty or missing the fields needed for the request, state what is missing instead of producing generic commentary.

---

## Expected Behavior

- Headline-first markdown; every figure traceable to the context block.
- Single-snapshot data never yields trend language ("improved", "declining", "up from").
- Small-N cohorts are flagged; individuals are never identifiable in admin views.

## Test Cases

`ai/eval/datasets/w6_analytics_insights.jsonl`

## Validation Results

`ai/eval/results/reports/w6_analytics_insights-validation.md`

## Notes for Optimization

- **Fabricated-trend risk is W6's core failure mode** — models pattern-match analytics prose to "X improved by Y%". The single-snapshot rule targets this directly; the dataset elicits it. Pairs with `w6_summary_validation` as an automated second check.
- **Small-N threshold of 10** is arbitrary; align with whatever significance convention Cyprian's deterministic layer uses so AI narration and calculated stats never disagree.
- **"Finding a reader would act on"** trades consistency for usefulness — expect some variance in what the model headlines. If stakeholders want deterministic ordering, add an explicit priority list (coverage gaps > outliers > distributions).
- Assumes aggregation happens upstream (Cyprian/Nivin scope); this prompt must never receive raw per-student rows in production. The role-boundary cases enforce behavior if it does.
