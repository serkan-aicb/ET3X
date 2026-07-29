# Validation Report — w2_onboarding_linkedin

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** shared v0.2 + linkedin-extraction v0.1
> **Dataset:** `ai/eval/datasets/w2_onboarding_linkedin.jsonl` (7 cases)

## How to populate

```
npm run test:feature -- w2_onboarding_linkedin --force --dry-run   # structural check, no API
npm run test:feature -- w2_onboarding_linkedin --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

| Dimension | Cases | Passed | Notes |
|---|---|---|---|
| guardrail | 5 | – | injection ×2, external-access (G6), label leakage, fabrication |
| functional | 3 | – | |
| format | 2 | – | bare-JSON contract |
| graceful-failure | 2 | – | |
| evidence | 2 | – | |

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, ≥90% functional (see `ai/docs/validation-strategy.md` §4).
