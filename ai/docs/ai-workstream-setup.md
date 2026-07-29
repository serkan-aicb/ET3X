# AI Behavior Workstream — Setup Brief

> Persisted from session brief, 2026-07-04.
> Reference this file at the start of any new Claude Code session to restore full context without re-explaining scope.

---

## Context: Steve's Role

Steve owns the **AI Behavior / Language Intelligence** workstream on the Talent3X platform (an enterprise SaaS product for capability-based talent management).

**In scope:**
- System prompts and prompt architecture
- Behavior rules and guardrails
- Prompt test datasets and output validation strategy
- AI quality validation across every feature area (onboarding, capability, evaluation, analytics, reporting)

**Out of scope (owned by teammates):**
- **Cyprian** — deterministic business logic / calculations
- **Nivin** — AI service layer (app ↔ LLM technical bridge)
- **Klenis** — UI

Deliverables are prompts, prompt configs, validation datasets, test harnesses, and documentation — not application infrastructure code. Any integration code is scoped to prompt testing/validation tooling only, never the production service layer.

---

## 8-Week Roadmap

| Week | Feature Focus |
|---|---|
| 1 | AI Behavior Framework — system prompt, prompt architecture, behavior rules, guardrails, prompt test dataset, output validation strategy |
| 2 | Profile onboarding AI validation — CV extraction quality, LinkedIn extraction quality, prompt improvements |
| 3 | Capability intelligence prompts — suggestion, validation, explanation, prompt testing |
| 4 | Evaluation intelligence prompts — interpretation, feedback generation, explanation prompts, prompt QA |
| 5 | Capability intelligence design — capability explanations, evidence explanations, growth recommendations, prompt QA |
| 6 | Analytics intelligence — analytics prompts, insight generation, summary validation, prompt library maintenance |
| 7 | Reporting intelligence — executive summaries, recommendations, report explanations, prompt QA |
| 8 | Final AI QA — prompt optimization, end-to-end AI testing, validation report, production sign-off |

---

## Directory Layout

```
ai/
  prompts/
    shared/          ← system prompt, behavior rules, guardrails (cross-feature)
    onboarding/      ← W2
    capability/      ← W3, W5
    evaluation/      ← W4
    analytics/       ← W6
    reporting/       ← W7
  eval/
    datasets/        ← test cases per feature (JSON)
    results/
      runs/          ← gitignored scratch iteration output
      reports/       ← committed final validation deliverables per week
    scripts/         ← harnesses to run prompts against test datasets
  docs/
    behavior-framework.md
    guardrails.md
    validation-strategy.md
    ai-workstream-setup.md   ← this file
```

---

## Branch Naming Convention

Base branch: `main`
Prefix: `feature/ai-` for all AI workstream branches

| Deliverable | Branch |
|---|---|
| System prompt + prompt architecture | `feature/ai-w1-system-prompt` |
| Behavior rules | `feature/ai-w1-behavior-rules` |
| Guardrails spec | `feature/ai-w1-guardrails` |
| Prompt test dataset + validation strategy | `feature/ai-w1-validation-strategy` |
| CV extraction validation | `feature/ai-w2-cv-extraction` |
| LinkedIn extraction validation | `feature/ai-w2-linkedin-extraction` |
| Capability suggestion prompt | `feature/ai-w3-capability-suggestion` |
| Capability validation + explanation prompts | `feature/ai-w3-capability-validation` |
| Evaluation interpretation prompt | `feature/ai-w4-eval-interpretation` |
| Evaluation feedback generation prompt | `feature/ai-w4-feedback-generation` |
| Capability explanations + growth recs | `feature/ai-w5-capability-explanations` |
| Analytics prompts + insight generation | `feature/ai-w6-analytics-insights` |
| Analytics summary validation | `feature/ai-w6-summary-validation` |
| Executive summary + report prompts | `feature/ai-w7-reporting` |
| Final QA + validation report | `feature/ai-w8-final-qa` |

---

## Workflow

When Steve says **"let's start Week N, feature X":**

1. Pull latest `main` and create the correctly named branch.
2. Scaffold the relevant files (prompt file, test dataset stub, validation notes) — nothing outside the AI workstream scope.
3. Do the work for that feature only — no scope-creep into backend, UI, or infrastructure.
4. When done: summarize what changed and suggest a commit message + PR description.
5. **Wait for Steve's confirmation before pushing or opening a PR.**

Commit style: conventional commits — `feat:`, `test:`, `docs:`, `fix:`.
