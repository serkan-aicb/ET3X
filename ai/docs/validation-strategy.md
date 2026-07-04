# Talent3X AI Output Validation Strategy

> **Status:** STUB — to be completed in W1 (branch: feature/ai-w1-validation-strategy)
> **Owner:** AI Behavior workstream
> **Last updated:** 2026-07-04

---

## Purpose

This document defines how AI prompt output is validated across all feature areas. It covers test dataset structure, harness design, pass/fail criteria, and the process for promoting results to committed validation reports.

---

## 1. Validation Approach

> To be defined — expected coverage of: functional correctness, tone/style compliance, guardrail adherence, role boundary enforcement, output format conformance.

---

## 2. Test Dataset Structure

Datasets live in `ai/eval/datasets/`. Each file covers one prompt or prompt variant.

Naming convention: `w{N}-{feature-slug}-cases.json`

Expected schema per test case:

```json
{
  "id": "tc-001",
  "description": "Brief description of what this case tests",
  "prompt_file": "ai/prompts/shared/system-prompt.md",
  "context_block": {},
  "user_turn": "...",
  "expected_output": {
    "must_contain": [],
    "must_not_contain": [],
    "format": "markdown | json | plain"
  },
  "tags": ["guardrail", "role-boundary", "tone"],
  "pass_criteria": "..."
}
```

---

## 3. Eval Harness

Scripts in `ai/eval/scripts/` run test cases against a prompt and write results to `ai/eval/results/runs/` (gitignored scratch output).

Validated, final results are promoted to `ai/eval/results/reports/` and committed as weekly deliverables.

---

## 4. Pass/Fail Criteria

> To be defined per feature area. At minimum:
> - Output contains required fields / sections
> - No guardrail violations
> - Tone matches standards in `behavior-framework.md`
> - Role-appropriate content only

---

## 5. Validation Report Template

> To be defined — structure of the weekly `ai/eval/results/reports/wN-validation-report.md`.

---

## 6. Integration with Nivin's AI Service Layer

The validation harness calls prompts directly (not through the production service). Coordination points with Nivin:
- [ ] Agree on context block schema so test harness can inject realistic data
- [ ] Confirm which model(s) are used per feature area
- [ ] Define how prompt versions are referenced in production
