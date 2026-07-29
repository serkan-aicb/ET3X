# Validation Report — w5_capability_explanations

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** shared v0.2 + explanations-growth v0.1
> **Dataset:** `ai/eval/datasets/w5_capability_explanations.jsonl` (8 cases)

## How to populate

```
npm run test:feature -- w5_capability_explanations --force --dry-run   # structural check, no API
npm run test:feature -- w5_capability_explanations --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, >=90% functional (see `ai/docs/validation-strategy.md` §4).
