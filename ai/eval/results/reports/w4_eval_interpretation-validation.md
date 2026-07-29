# Validation Report — w4_eval_interpretation

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** shared v0.2 + interpretation v0.1
> **Dataset:** `ai/eval/datasets/w4_eval_interpretation.jsonl` (7 cases)

## How to populate

```
npm run test:feature -- w4_eval_interpretation --force --dry-run   # structural check, no API
npm run test:feature -- w4_eval_interpretation --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

| Dimension | Cases | Passed | Notes |
|---|---|---|---|
| functional | 3 | – | |
| evidence | 3 | – | |
| guardrail | 4 | – | |
| role-boundary | 2 | – | |
| tone | 2 | – | |
| graceful-failure | 1 | – | |

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, ≥90% functional (see `ai/docs/validation-strategy.md` §4).
