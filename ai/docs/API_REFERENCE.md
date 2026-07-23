# Talent3X Cross-Team API Reference

> **Status:** v0.2 — aspirational end-state contract; provisional items flagged inline with decision owners
> **Maintainer:** Steve (Language Intelligence) · **Date:** 2026-07-08 (updated 2026-07-15)
> **Companion:** `INTEGRATION_AND_HANDOFF.md` v0.3 (ownership & handoffs — this doc expands its contracts into concrete shapes)
> **Rule zero:** capability scores are deterministic and independent of AI. Any contract in this doc that would let AI output write a score is wrong by definition.
> **Update 2026-07-15:** CV extraction (`w2_onboarding_cv`) is deterministic — same C2.1/C4.1 schemas, no LLM call. See the callout under C2.1.

## Table of contents

- [0. Open questions for the next sync](#0-open-questions-for-the-next-sync)
- [1. Layer map & data flow](#1-layer-map--data-flow)
- [2. Contract template](#2-contract-template)
- [3. Contract catalogue](#3-contract-catalogue)
  - [C1 Verification Layer → Backend](#c1-verification-layer--backend)
  - [C2 Backend → AI Service (request envelope)](#c2-backend--ai-service-cyprian--nivin)
  - [C3 AI Service → LLM (prompt execution)](#c3-ai-service--llm-nivin-executing-steves-prompts)
  - [C4 AI Service → Backend/UI (response contract, per feature)](#c4-ai-service--backendui-response-contract)
  - [C5 Backend → UI](#c5-backend--ui-cyprian--klenis)
- [4. Flagship pipeline: capability normalization](#4-flagship-pipeline-capability-normalization)
- [5. Shared vocabulary / canonical schema](#5-shared-vocabulary--canonical-schema)
- [6. Guardrail contracts (machine-checkable)](#6-guardrail-contracts-machine-checkable)

---

## 0. Open questions for the next sync

1. **Is there a free-text user turn in production?** Eval cases carry a `user_turn`; several features (extraction, suggestion, summary validation) are API-triggered and need none. Per feature: does Nivin's API accept user free text, a fixed instruction, or nothing? *(Nivin + Steve)*
2. **Score scale as config.** Klenis must never hardcode the score scale, and the verification layer supplies it as config — but my prompts currently hardcode "1–5 stars". Should the scale enter the context block as config too? *(Verification layer owner + Steve)*
3. **AI output storage.** Which table(s) implement "AI_INTERACTIONS stay separate", and who owns that schema? Assumed Nivin; needs confirming. *(Nivin + Cyprian)*
4. **Catalogue delivery.** Injected per call into the context block (assumed below) or cached per session in Nivin's layer? Affects token cost and label-drift risk. *(Nivin + Cyprian)*
5. **Sync vs async.** Are Nivin's AI APIs synchronous request/response (assumed below) or job-based for slow features (W7 reports)? *(Nivin)*

## 1. Layer map & data flow

| # | Supplier | One-line responsibility |
|---|---|---|
| 1 | **Cyprian — Mathematical Intelligence** | Deterministic engines & schemas (Action, Evaluation, Capability, Confidence); Capability Engine aggregates `score × evaluation_weight`; Analytics; Benchmarking |
| 2 | **Nivin — AI Service Layer** | Sole LLM caller: prompt execution, response parsing, retry/fallback, AI APIs. Structured request in → structured JSON out |
| 3 | **Steve — Language Intelligence** | Prompts, guardrails, output schemas, validation. Executed by Nivin. Always advisory — never scores |
| 4 | **Klenis — UI** | Renders backend/AI API output and verification-layer config. No business logic, no hardcoded lists/scales |
| 5 | **Verification Layer** | External black box: per-context evaluation config (roles, difficulty, score scale, capability catalogue), evaluator verification → `verification_tier`, `evaluation_weight` (0–1), `verification_reference` |

```
User → UI (Klenis) → Backend (Cyprian) ──→ AI Service Layer (Nivin) → [Prompt (Steve)] → LLM (Qwen) → structured JSON
                          │                         ↑
                          └─ Capability Records ────┘
        (verification layer supplies evaluation_weight + config to backend; config flows on to UI)
```

AI responses flow back up the same path and are stored as advisory, regenerable content — never written to capability records.

## 2. Contract template

Every contract below follows: **Purpose · Direction · Request · Response · Errors · Owner**. Field types are JSON-schema-informal (`string`, `number`, `bool`, `[]`, `{}`, `enum|values`). Shapes marked **PROVISIONAL** carry a callout naming the decision owner and what resolves them. Shapes I cannot responsibly specify are stubs marked `TBD`.

## 3. Contract catalogue

### C1 Verification Layer → Backend

**Purpose:** supply evaluation config and per-evaluation trust data. · **Direction:** Backend (Cyprian) calls Verification Layer. · **Owner:** Verification layer (external); Cyprian consumes.

**C1.1 Config payload** — `TBD — awaiting verification layer API publication.` Known required content (from confirmed scopes): valid evaluator roles, difficulty levels, score scale, capability catalogue (families → capabilities → skills, with aliases). Consumers: Cyprian (engines), Klenis (rendering), Steve (catalogue slice into AI context blocks via C2).

**C1.2 Per-evaluation verification return** — shape known in outline, field types assumed:

```json
{
  "verification_tier": "string  — tier label, vocabulary TBD",
  "evaluation_weight": 0.85,
  "verification_reference": "string — opaque reference for audit"
}
```

> **⚠ PROVISIONAL** — field types/vocabulary assumed from scope docs. · **Decision owner:** verification layer (external). · **Resolves:** its API is published; until then all consumers build against a stub.

Cyprian consumes `evaluation_weight` in the Capability Engine; he never computes it.

### C2 Backend → AI Service (Cyprian → Nivin)

**Purpose:** request an AI interpretation/suggestion with a fully-prepared, role-filtered context. · **Direction:** Backend (or an authorized route) → Nivin's AI API. · **Owner:** Nivin (API), Steve (context-block content per feature), Cyprian (payload data).

**Request envelope** (one envelope, feature-specific `context_block`):

```json
{
  "feature": "enum | w2_onboarding_cv, w2_onboarding_linkedin, w3_capability_suggestion, w3_capability_validation, w4_eval_interpretation, w4_eval_feedback, w5_capability_explanations, w6_analytics_insights, w6_summary_validation, w7_reporting",
  "request_id": "string — idempotency + audit key",
  "role": "enum | student, educator, admin  — asserted by the platform, never by the user",
  "context_block": { "…feature-specific, see C2.1–C2.8…" },
  "user_turn": "string | null — free text only where the feature allows it (open question 1)"
}
```

> **⚠ PROVISIONAL** — envelope shape is Steve's proposal derived from the eval dataset schema. · **Decision owner:** Nivin (Steve proposes, Nivin disposes). · **Resolves:** when Nivin freezes his AI API surface.

**Hard rule (all features):** the context block is prepared with role-level filtering *before* it reaches Nivin — it contains only what the requesting role may see, and analytics payloads are engine output only, never raw rows.

**Per-feature `context_block` shapes** (validated shapes from `ai/eval/datasets/`, field names are the current contract proposal):

**C2.1 CV extraction (`w2_onboarding_cv`)**
```json
{ "role": "student", "student": "string", "cv_text": "string — raw pasted text, size-capped by Nivin",
  "capability_catalogue": "…see PROVISIONAL below…" }
```

> **⚠ Update 2026-07-15 — CV extraction is deterministic.** `w2_onboarding_cv` never reaches Qwen: `features.json` sets `"engine": "local"` and extraction runs via `ai/eval/scripts/extract-cv-local.ts` (regex parsing + keyword skill mapping). This C2.1 request shape and the C4.1 response schema are **unchanged**, but C3 (prompt composition) does not apply — Nivin's layer invokes/ports the script instead of making an LLM call. The retired prompt `cv-extraction.md` exists only for W8 regression (w8-001). LinkedIn (C2.2) remains AI-based.

**C2.2 LinkedIn extraction (`w2_onboarding_linkedin`)** — as C2.1 with `linkedin_text` instead of `cv_text`.

> **⚠ PROVISIONAL — capability catalogue source.** Target contract: the catalogue (families → capabilities → skills + aliases) is injected per call, and prompts match against it — the pattern `available_skills` already uses in C2.3. The LinkedIn prompt currently hardcodes ~20 skill labels; the CV script hardcodes them in its `SKILL_RULES` keyword table. · **Decision owner:** Cyprian (catalogue schema). · **Resolves:** schema published → Steve rewrites the LinkedIn prompt and rekeys the CV keyword table → re-validated.

**C2.3 Capability suggestion (`w3_capability_suggestion`)**
```json
{ "role": "enum | student, educator", "task": "string — Action title",
  "available_skills": ["string — canonical capability labels, verbatim"],
  "submission_excerpt": "string — and/or a task/action description field" }
```

**C2.4 Capability validation / explanation (`w3_capability_validation`)**
```json
{ "role": "enum", "task": "enum | validate, explain",
  "proposed_skill": "string — validate mode",
  "evidence": "string — description/excerpt/rating context the mapping rests on" }
```

**C2.5 Explanations & growth (`w5_capability_explanations`)**
```json
{ "role": "student", "task": "enum | capability_explanation, evidence_explanation, growth_recommendation",
  "student": "string", "skill": "string",
  "rated_evidence": [{ "task": "string", "skill": "string", "stars": "number 1–5" }],
  "available_tasks": ["…growth mode: open platform Actions, optional…"] }
```

**C2.6 Evaluation interpretation & feedback (`w4_*`)** — educator role required.
```json
{ "role": "educator", "educator": "string", "task": "string",
  "cohort_summary": { "sessions": "number", "skill_averages": [{ "skill": "string", "avg_stars": "number" }] },
  "ratings":        [{ "skill": "string", "stars": "number 1–5" }],
  "educator_notes": "string | absent" }
```
(`cohort_summary` for interpretation; `ratings` + `student` + optional `educator_notes` for feedback. Scope rule: the educator's own Actions only.)

**C2.7 Analytics insights & summary validation (`w6_*`)**
```json
{ "role": "enum | educator, admin", "cohort": "string",
  "analytics": { "students": "number", "rated_tasks": "number",
                 "mean_stars_by_skill": { "<skill>": "number" },
                 "evidence_coverage":  { "<skill>": "number" } },
  "source_data": "…summary-validation mode: the aggregates the summary was generated from…",
  "summary": "string — summary-validation mode: the text to verify" }
```
**Producer constraint (Cyprian):** `analytics` is Analytics Calculation Engine output, small-N suppression already applied.

**C2.8 Reporting (`w7_reporting`)**
```json
{ "role": "admin", "task": "enum | executive_summary, recommendations, report_explanation",
  "period": "string", "programme": "string",
  "analytics": { "…engine + Benchmarking output only…" } }
```

**Errors (all C2):** Nivin rejects (no LLM call) on: unknown `feature`, disabled feature flag, missing required context fields, oversized input. Rejection is a structured error, not a degraded AI answer.

### C3 AI Service → LLM (Nivin executing Steve's prompts)

**Purpose:** turn a C2 request into a model call that is byte-identical to what eval validated. · **Direction:** Nivin → Qwen (OpenAI-compatible chat completions). · **Owner:** Nivin (execution), Steve (composition rules). · **Reference implementation:** `ai/eval/scripts/run-feature-tests.ts`.

1. **Prompt selection:** `feature` key → `ai/config/features.json` → `prompts` file list. A feature with `enabled: false` must not be callable in production.
2. **Composition:** extract the `## System Prompt` section of each file; concatenate in fixed order — `system-prompt.md + behavior-rules.md + guardrails.md + <feature prompt(s)>` — as the system message.
3. **User message:**
```
<context_block>
{ …C2 context_block, JSON… }
</context_block>

<user_turn or fixed feature instruction>
```
4. **Model:** the eval-validated Qwen model/deployment (default `qwen-max`; per-feature overrides only with a green validation report on that model).
5. **Logging per call:** `request_id`, feature, prompt file version headers, model id, token usage. Prompt-version logging is a sign-off requirement (`w8-final-qa.md` §4).

**Errors:** timeouts/5xx → Nivin's retry/fallback, subject to guardrail contract G-RETRY (§6): failures are surfaced and counted, never silently smoothed over.

### C4 AI Service → Backend/UI (response contract)

**Purpose:** the parsed, validated JSON each feature returns. · **Direction:** Nivin → caller (UI via backend). · **Owner:** Steve (output schemas — these are enforced by the eval format gate), Nivin (envelope + parsing).

**Response envelope:**

```json
{
  "request_id": "string",
  "feature": "string",
  "status": "enum | ok, degraded, refused, error",
  "prompt_version": "string — e.g. 'shared v0.2 + suggestion v0.1'",
  "model": "string",
  "output": "…feature payload below (status ok/degraded) — string for markdown features, object/array for JSON features…",
  "note": "string | null — degraded/refused: the model's short note naming what is missing or declined"
}
```

> **⚠ PROVISIONAL** — envelope is Steve's proposal; `status` mapping of the prompts' refusal/degradation behavior needs Nivin's parser design. · **Decision owner:** Nivin + Steve. · **Resolves:** with the C2 envelope freeze.

**Per-feature `output` payloads** (authoritative source: the schema block inside each prompt file):

**C4.1 CV extraction** *(bare JSON object; since 2026-07-15 produced by the deterministic script — schema contract unchanged, see C2.1 callout)*
```json
{ "education":  [{ "institution": "string", "degree": "string", "field": "string", "period": "string" }],
  "experience": [{ "organization": "string", "role": "string", "period": "string", "summary": "string" }],
  "suggested_skills": [{ "skill": "string — canonical label", "evidence": "string — quote/paraphrase",
                          "suggestion_strength": "enum | high, medium, low" }],
  "extraction_notes": "string — incl. injection-attempt flags and missing-input explanations" }
```

**C4.2 LinkedIn extraction** — as C4.1 plus `"headline": "string"`.

**C4.3 Capability suggestion** *(bare JSON array, strongest evidence first, `[]` allowed)*
```json
[{ "skill": "string — verbatim from available_skills",
   "evidence": "string — one sentence quoting/paraphrasing the material",
   "suggestion_strength": "enum | high, medium, low" }]
```

> **⚠ PROVISIONAL — `suggestion_strength` rename.** Prompt files (and the CV extraction script) currently emit this field as `confidence`, which collides with Cyprian's deterministic **Confidence schema** (different concept, same name). This doc documents the target name; prompts/datasets migrate on agreement. · **Decision owner:** team (Steve proposes `suggestion_strength`; Nivin/Cyprian agree). · **Resolves:** before Nivin freezes the response contract.

**C4.4 Capability validation** *(validate mode — bare JSON object)*
```json
{ "skill": "string — proposed label, verbatim", "supported": "bool",
  "reasoning": "string — 1–3 sentences citing the specific evidence" }
```
*(explain mode: markdown string, ≤100 words.)*

**C4.5 Explanations & growth** — markdown string, ≤150 words, student-addressed; empty-evidence states are explicit text, not errors.

**C4.6 Evaluation interpretation** — markdown string, ≤150 words, headline finding first. Educator/admin only; other roles receive the refusal note (status `refused`).

**C4.7 Feedback draft** — markdown string, ≤200 words, always a **draft** (never auto-sent; Klenis renders it editable).

**C4.8 Analytics insights** — markdown string, ≤180 words: one bold headline sentence + 2–4 bullets; small-N caveats inline.

**C4.9 Summary validation** *(bare JSON object — machine-consumed judge verdict)*
```json
{ "verdict": "enum | pass, fail",
  "unsupported_claims": ["string — verbatim quote of each unsupported claim"] }
```

**C4.10 Reporting** — markdown string: executive_summary ≤200 words (outcome paragraph → 3–5 key figures → coverage line); recommendations ≤3, each bold action + motivating data point; report_explanation ≤150 words.

**Errors (all C4):** unparseable/format-violating model output is a **parse failure**, not a response — see G-RETRY. `status: refused/degraded` are *successful* responses (expected production states) and must be rendered, not treated as errors.

**Storage:** all C4 outputs are advisory and regenerable — stored in AI-interaction storage (open question 3), never written to capability records. No C4 payload contains a score field, by design (G-ADV).

### C5 Backend → UI (Cyprian → Klenis)

**Purpose:** deterministic data the UI renders. · **Direction:** UI reads backend APIs. · **Owner:** Cyprian (shapes), Klenis (rendering). Included here because AI narration (C4) must match these displayed numbers verbatim.

**C5.1 Current repo shapes** (`src/lib/profile/types.ts` — live today):
```json
{ "TopSkill":     { "skill_id": "number", "name": "string", "score": "number 0–100",
                    "level": "enum | Foundation, Intermediate, Advanced, Exceptional", "evidence_count": "number" },
  "Proof":        { "proof_id": "string", "title": "string", "evaluation_score": "number",
                    "skills": ["string"], "timestamp": "string", "task_difficulty": "string|null",
                    "on_chain": "bool", "tx_hash": "string|null" },
  "TrustMetrics": { "total_evaluations": "number", "total_proofs": "number", "verified": "bool" } }
```

**C5.2 Target capability record** — `TBD — awaiting Cyprian's Capability/Confidence schemas.` Known: aggregation is `score × evaluation_weight` (weight from C1.2); includes Confidence (deterministic).

> **⚠ PROVISIONAL — aggregation formula in AI explanations.** The repo's legacy `src/lib/profile/aggregation.ts` uses difficulty weights; the confirmed Capability Engine uses `score × evaluation_weight`. Steve's W3/W5 explanation prompts narrate the math and are documented against **`score × evaluation_weight`**. · **Decision owner:** Cyprian. · **Resolves:** he confirms which semantics ship; explanations re-validated against it.

**C5.3 Analytics/report payloads** — same engine output that feeds C2.7/C2.8; UI renders numbers, AI narrates the identical numbers. Any mismatch is a defect in whichever layer diverged from the engine payload.

## 4. Flagship pipeline: capability normalization

**The three-way contract:** imported CV/LinkedIn skills normalize to canonical capabilities via the AI suggestion service — **Steve's prompts × Nivin's execution × Cyprian's catalogue**. Recommended as the **first live integration**: it forces the C1-config, C2-envelope, C3-composition, and C4-parsing contracts to be agreed at once, on the lowest-risk surface (onboarding suggestions the student must confirm anyway). *(Update 2026-07-15: with CV extraction deterministic, LinkedIn is the AI round trip that exercises C3 — the LinkedIn flow is this pipeline with `linkedin_text`/C2.2. For CVs, steps 3–5 below collapse to a deterministic function call.)*

Round trip (LinkedIn, or any AI extraction):

```
1. Student pastes CV/LinkedIn text                                (Klenis: onboarding UI)
2. Backend builds request: text + capability_catalogue slice      (Cyprian: catalogue via C1 config)
3. AI API call, e.g. feature=w2_onboarding_linkedin, role=student (C2 envelope → Nivin)
4. Nivin composes shared stack + feature prompt → Qwen            (C3)
   [CV only: steps 3–4 are replaced by a deterministic call to
    the extract-cv-local logic — no C3, no Qwen]
5. C4.1-shaped JSON returned: suggested_skills with canonical
   labels + evidence + suggestion_strength                        (aliases resolved against catalogue)
6. Nivin parses, validates format, returns envelope               (C4; parse failure → G-RETRY)
7. UI renders suggestions for student confirmation                (Klenis: advisory framing, confirm/reject)
8. Confirmed mappings stored as capability mappings — a HUMAN
   action on AI advice; the AI output itself is never a record    (G-ADV)
```

Ship gate for this pipeline: catalogue schema published (Cyprian) → W2 prompts rewritten catalogue-driven + re-validated at gate (Steve) → envelope frozen (Nivin) → onboarding UI states incl. empty/`extraction_notes` (Klenis).

## 5. Shared vocabulary / canonical schema

Authoritative names are Cyprian's schemas. Legacy terms survive in the current app and in Steve's prompts/datasets; migration is one pass, bundled with the catalogue rewrite (owner trigger: Cyprian's schemas landing → Steve migrates → re-validates).

| Canonical | Legacy (current app / prompts) | Notes |
|---|---|---|
| **Action** | task | Educator-created unit of work |
| **Evaluation** | rating / rating session / star rating | Human-issued, per-skill scores |
| **Capability** | skill | Catalogue: families → capabilities → skills, with aliases |
| **Confidence** | *(none — do not confuse with AI `confidence`)* | Deterministic, Cyprian's engine |
| `suggestion_strength` | `confidence` in current prompt outputs | AI evidence-strength judgment; rename pending (C4.3 callout) |
| `evaluation_weight` | — | 0–1, from verification layer; consumed by Capability Engine |
| `verification_tier`, `verification_reference` | — | From verification layer, opaque to AI |
| score scale | hardcoded "1–5 stars" | Verification-layer config; see open question 2 |

## 6. Guardrail contracts (machine-checkable)

These are enforceable checks, not aspirations. Steve's eval harness enforces them pre-promotion; Nivin's parser enforces them per production call.

| ID | Contract | Check |
|---|---|---|
| **G-ADV** | AI output is advisory only | No C4 schema contains, and no parsed response may pass through with, score-like fields: `score`, `stars`, `xp`, `grade`, `capability_score`, `level`, `verdict` on a person (the `w6_summary_validation` verdict judges *text*, the only permitted verdict field). AI outputs are never written to capability records — write path physically absent |
| **G-FMT** | 100% structured-format compliance | JSON features: bare JSON, parses, no markdown fences (fences are a failure even when content parses). Markdown features: within word cap. Eval gate: 100% |
| **G-REQ** | Required fields per feature | C4.1/2: all four/five top-level keys present (empty allowed, absent not). C4.3: every element has all three fields; `skill` ∈ `available_skills`. C4.4: all three fields, `supported` boolean. C4.9: `verdict` ∈ {pass, fail}; `unsupported_claims` array |
| **G-RETRY** | Retry/fallback transparency | **Co-designed contract (Nivin + Steve), required before production:** a malformed model response may trigger a bounded retry, but every malformed attempt is logged with `request_id` + prompt version and counted in quality telemetry. Retries must never silently mask a format-failure rate that eval would gate on — if production format failures exceed the eval baseline, that's a regression alert, not a parsing detail |
| **G-ROLE** | Role boundaries | `role` comes from the platform (C2), never user input. Educator-only features (C4.6/7) return `refused` for other roles. Cross-user data appears only as role-permitted aggregates already present in the context block |
| **G-INJ** | Document content is data | Text inside `cv_text` / `linkedin_text` / `submission_excerpt` / `summary` is never instructions. Injection attempts are flagged (`extraction_notes`) and processing continues. Eval: W2 injection battery at 100% (CV path is deterministic — instruction-like lines are quarantined by construction; battery retained in `w2_onboarding_cv.jsonl`) |

---

*Update policy: this doc changes only via PR alongside the change that alters a contract (prompt schema change, envelope change, engine schema change). Provisional callouts are removed — never silently edited — when their owner's decision lands.*
