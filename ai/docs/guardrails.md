# Talent3X AI Guardrails

> **Status:** STUB — to be completed in W1 (branch: feature/ai-w1-guardrails)
> **Owner:** AI Behavior workstream
> **Last updated:** 2026-07-04

---

## Purpose

This document defines the hard constraints that apply to all AI output in Talent3X — things the AI must never do regardless of prompt instructions or user requests. Guardrails are enforced at the system prompt level and validated in every prompt QA cycle.

---

## Hard Stops (never do)

> To be defined. Examples of the kinds of constraints to specify:
> - Fabricating capability evidence not present in the context block
> - Surfacing one user's data in another user's session
> - Producing definitive pass/fail grading decisions
> - Generating content that could be used to impersonate platform output
> - Ignoring role boundaries when role is specified in the context block

---

## Soft Constraints (prefer not to do, but context-dependent)

> To be defined.

---

## Guardrail Test Cases

All guardrails must have corresponding adversarial test cases in `ai/eval/datasets/`. Each test case must document:
- The guardrail being tested
- The adversarial input
- The expected refusal or safe output pattern
- Pass/fail criteria

---

## Review Cadence

Guardrails are reviewed at the end of each week's prompt QA cycle and updated when new feature areas are introduced.
