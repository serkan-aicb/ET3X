# Validation Report — w8_final_qa

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** shared v0.2 + shared stack v0.2 + per-case overrides
> **Dataset:** `ai/eval/datasets/w8_final_qa.jsonl` (10 cases)

## How to populate

```
npm run test:feature -- w8_final_qa --force --dry-run   # structural check, no API
npm run test:feature -- w8_final_qa --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, >=90% functional (see `ai/docs/validation-strategy.md` §4).
