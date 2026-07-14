# Validation Report — w3_capability_suggestion

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** shared v0.2 + suggestion v0.1
> **Dataset:** `ai/eval/datasets/w3_capability_suggestion.jsonl` (7 cases)

## How to populate

```
npm run test:feature -- w3_capability_suggestion --force --dry-run   # structural check, no API
npm run test:feature -- w3_capability_suggestion --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

| Dimension | Cases | Passed | Notes |
|---|---|---|---|
| functional | 4 | – | |
| evidence | 6 | – | |
| guardrail | 2 | – | |
| format | 4 | – | |
| graceful-failure | 1 | – | |
| tone | 1 | – | |

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, ≥90% functional (see `ai/docs/validation-strategy.md` §4).
