# Talent3X AI Output Validation Strategy

> **Status:** v0.2 DRAFT — W1 deliverable, in review
> **Owner:** AI Behavior workstream (Steve)
> **Last updated:** 2026-07-05

How AI prompt output is validated across all feature areas: dataset structure, harness, pass/fail criteria, and promotion of results to committed reports.

---

## 1. Validation Approach

Five quality dimensions, each tagged in datasets so results can be sliced:

| Dimension | Tag | What it catches |
|---|---|---|
| Functional correctness | `functional` | Wrong extraction, wrong interpretation, missed evidence |
| Guardrail adherence | `guardrail` | Fabrication, injection, decisions, data leakage (G1–G6) |
| Role boundary enforcement | `role-boundary` | Student seeing educator rationale, cross-cohort leakage |
| Tone & style compliance | `tone` | Over-praise, filler, hedging failures, template-speak |
| Format conformance | `format` | Broken JSON, fences around JSON, length violations |

Validation is **feature-flagged and isolated**: each feature's dataset runs against that feature's prompt composed with the frozen shared stack. Shared-stack changes trigger the W1 dataset as a regression gate (see `behavior-framework.md` §6).

## 2. Test Dataset Structure

Datasets are JSONL — one test case per line — in `ai/eval/datasets/`, named `<feature_key>.jsonl` (matching `features.json`).

Case schema:

```json
{
  "id": "w3-sug-004",
  "description": "Suggests skills only from the platform's 20-skill list",
  "prompt": null,
  "context_block": { "role": "student", "...": "..." },
  "user_turn": "...",
  "expected": {
    "must_contain": ["Critical Thinking"],
    "must_not_contain": ["Leadership", "```"],
    "format": "json"
  },
  "tags": ["functional", "format"]
}
```

- `prompt` — optional path to override which feature prompt file the case exercises; `null` uses the feature's default from `features.json` (empty prompt list = shared stack only, e.g. W1).
- `must_contain` / `must_not_contain` — case-insensitive substring checks against the raw model output.
- `format` — `json` (must parse; W8 also asserts *no* fences), `markdown`, or `plain`.

**Design guidance:** prefer `must_not_contain` for guardrail cases (robust) over long `must_contain` lists (brittle). Every feature dataset carries ≥ 1 case per applicable dimension.

## 3. Eval Harness

`ai/eval/scripts/run-feature-tests.ts` (TypeScript, calls Qwen over the OpenAI-compatible chat completions API — DashScope cloud or self-hosted). Run via:

```
npm run test:feature -- <feature_key> [--force] [--dry-run] [--model <id>] [--report]
npm run test:feature -- --list
```

- **Respects feature flags:** disabled features refuse to run (per spec). `--force` overrides for local iteration *before* enabling — this is the expected inner loop while optimizing a dormant feature.
- **`--dry-run`:** validates dataset parse + prompt-section extraction with zero API calls (no key needed). Run this first, always.
- **Model:** defaults to `qwen-max`; override with `--model qwen-plus` etc. **Endpoint:** DashScope international by default; `QWEN_BASE_URL` overrides for mainland or self-hosted (vLLM/Ollama).
- **Cost logging:** per-case input/output tokens and cost estimate; per-feature totals. Full run JSON → `ai/eval/results/runs/<feature>-<timestamp>.json` (gitignored scratch).
- **`--report`:** additionally writes/updates `ai/eval/results/reports/<feature>-validation.md` (committed deliverable).
- Requires `DASHSCOPE_API_KEY` in the environment (not `.env.local` — keep AI eval credentials separate from app credentials). Self-hosted endpoints set `QWEN_BASE_URL` instead; the key is then optional.

## 4. Pass/Fail Criteria

A case passes when all `must_contain` present, no `must_not_contain` present, and format check passes. A feature is **promotable** (flag → `enabled: true`) when:

- 100% of `guardrail` and `role-boundary` cases pass — no exceptions
- ≥ 90% of `functional` cases pass, with every failure triaged in the report
- 100% of `format` cases pass
- `tone` failures documented with a prompt-iteration note (advisory until W8, blocking at W8 sign-off)

## 5. Validation Report Template

Each `ai/eval/results/reports/<feature>-validation.md` contains: run metadata (date, model, prompt versions), pass/fail table by dimension, per-failure triage (case id → root cause → prompt change or dataset fix), token/cost totals, and a promotion recommendation (enable / iterate / block).

## 6. Integration with Nivin's AI Service Layer

The harness calls the Qwen endpoint directly — it never touches the production service layer. **Eval must run against the same Qwen model/deployment production will use** for validation results to count toward promotion. Coordination contract:

- [ ] Context block schema per feature (harness datasets define the proposal; Nivin confirms)
- [ ] Qwen model size and deployment per feature area in production (eval default is `qwen-max` via DashScope; decide DashScope cloud vs self-hosted — affects cost accounting and data residency)
- [ ] Prompt version referencing: production calls should log the prompt file version header so outputs are traceable to a prompt version
- [ ] Handoff format: enabled features in `features.json` + the referenced prompt files are the deliverable Nivin consumes
