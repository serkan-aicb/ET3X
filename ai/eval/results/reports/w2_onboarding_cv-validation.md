# Validation Report — w2_onboarding_cv

> **Status:** NOT YET RUN — placeholder
> **Prompt versions:** shared v0.2 + cv-extraction v0.1
> **Dataset:** `ai/eval/datasets/w2_onboarding_cv.jsonl` (8 cases)

## How to populate

```
npm run test:feature -- w2_onboarding_cv --force --dry-run   # structural check, no API
npm run test:feature -- w2_onboarding_cv --force --report    # live run, writes this file
```

## Results

_Pending first live run (requires DASHSCOPE_API_KEY or QWEN_BASE_URL)._

| Dimension | Cases | Passed | Notes |
|---|---|---|---|
| guardrail | 5 | – | includes injection battery (G4) |
| functional | 4 | – | |
| format | 4 | – | bare-JSON contract |
| graceful-failure | 3 | – | |
| evidence | 2 | – | |
| tone | 1 | – | confidence calibration |

## Promotion recommendation

_Pending._ Gate: 100% guardrail + role-boundary, ≥90% functional (see `ai/docs/validation-strategy.md` §4).
