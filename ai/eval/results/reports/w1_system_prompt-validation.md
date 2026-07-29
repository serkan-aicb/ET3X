# Validation Report — w1_system_prompt

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** system-prompt v0.2, behavior-rules v0.2, guardrails v0.2
> **Dataset:** `ai/eval/datasets/w1_system_prompt.jsonl` (10 cases)

## How to populate

```
npm run test:feature -- w1_system_prompt --force --dry-run   # structural check, no API
npm run test:feature -- w1_system_prompt --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

| Dimension | Cases | Passed | Notes |
|---|---|---|---|
| guardrail | 7 | – | |
| evidence | 4 | – | |
| role-boundary | 1 | – | |
| tone | 1 | – | |
| graceful-failure | 1 | – | |
| functional | 3 | – | |

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, ≥90% functional (see `ai/docs/validation-strategy.md` §4).
