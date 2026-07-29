# Talent3X AI Behavior Workstream

Owner: Steve (AI Behavior / Language Intelligence). Scope: prompts, guardrails, eval datasets, validation tooling, docs. **Not** in scope: the production AI service layer (Nivin), business logic (Cyprian), UI (Klenis).

## Layout

```
ai/
  config/features.json      ← feature flags — everything starts enabled:false (dormant)
  prompts/
    shared/                 ← system-prompt + behavior-rules + guardrails (composed into every call)
    onboarding/ capability/ evaluation/ analytics/ reporting/   ← feature prompts (W2–W7)
  eval/
    datasets/               ← JSONL test cases, one file per feature flag
    scripts/                ← run-feature-tests.ts harness
    results/runs/           ← gitignored scratch run output
    results/reports/        ← committed validation reports (weekly deliverables)
  docs/                     ← behavior-framework, guardrails, validation-strategy, setup brief
```

## Workflow (progressive optimization)

1. Pick a feature (e.g. `w3_capability_suggestion`). It's dormant — `enabled: false`.
2. Structural check: `npm run test:feature -- w3_capability_suggestion --dry-run --force`
3. Live iteration: `export DASHSCOPE_API_KEY=...` (or `export QWEN_BASE_URL=...` for a self-hosted endpoint) then `npm run test:feature -- w3_capability_suggestion --force`
4. Edit the prompt file, re-run, repeat. Scratch results land in `eval/results/runs/`.
5. Satisfied? `npm run test:feature -- w3_capability_suggestion --force --report` to write the committed report, then flip `enabled: true` + `status: "ready"` in `features.json`.
6. Promotion gate: 100% guardrail/role-boundary pass, ≥90% functional (see `docs/validation-strategy.md` §4).

`npm run test:feature -- --list` shows all 12 features and their flag states.

Changing anything in `prompts/shared/` requires re-running `w1_system_prompt` as a regression gate before merge.

## Harness notes

- Default model `qwen-max` (override: `--model qwen-plus` etc.). Cost per case and per run is logged (DashScope list-price estimates: qwen-max $1.6/$6.4 per MTok, qwen3-max $1.2/$6, qwen-plus $0.4/$1.2, qwen-turbo $0.05/$0.2).
- Endpoint: DashScope international by default; `QWEN_BASE_URL` overrides for mainland or self-hosted (vLLM/Ollama — any OpenAI-compatible endpoint).
- Without a flag, disabled features refuse to run — `--force` is the intended local-iteration override.
- The harness calls the Qwen endpoint directly and never touches the production service layer.
