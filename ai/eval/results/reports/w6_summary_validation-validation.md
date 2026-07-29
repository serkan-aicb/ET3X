# Validation Report — w6_summary_validation

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** shared v0.2 + summary-validation v0.1
> **Dataset:** `ai/eval/datasets/w6_summary_validation.jsonl` (7 cases)

## How to populate

```
npm run test:feature -- w6_summary_validation --force --dry-run   # structural check, no API
npm run test:feature -- w6_summary_validation --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, >=90% functional (see `ai/docs/validation-strategy.md` §4).
