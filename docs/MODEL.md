# The product model — single source of truth

**Read this before changing anything that touches actions, evaluations, scoring or identity.**
File headers in `src/` point here instead of restating rules, because restated rules go stale:
the model moved twice (v1.6 → v1.7 → v6) and every header written along the way froze at whatever
was true that week.

## Authoritative documents

| Document | Date | Covers |
| --- | --- | --- |
| `260730_Talent3X_DEV_Handover_COMPLETE_v1.7.pdf` | 30 Jul 2026 | schema, binding rules R1–R13, roles, activation |
| `260730_Talent3X_Action_Flow_Implementation_Spec_v6.pdf` | 30 Jul 2026 | the action/evaluation flow, Paths A & B, decline, evidence |
| `260730_Talent3X_Action_Evaluation_Flow_v5.png` | 30 Jul 2026 | companion diagram |

In `Dropbox/Product - Tech Info/`. Read PDFs with `pdftotext -layout` (no poppler render binary on
this machine, so the Read tool cannot page them).

**Precedence:** later wins, hinge at **30 July 2026**. These three supersede v1.6 and every earlier
brief.

## ⚠️ Scoring is SKILL-LEVEL — do not "fix" it back

v1.7 and v6 were issued the same day and **contradict each other** on scoring:

- **v1.7** (§1, §4, R1, R6, R9) says capability-level holistic scoring, "full score at ≥3
  **evaluations**", and R1 says a ticket implying skill-level scoring must be escalated, not built.
- **v6** (§7) says the evaluator rates each selected **skill** 0–5, the Capability Engine rolls
  them up, and a capability is Provisional below **3 rated skills**, Confirmed at 3 or more.

**André resolved this verbally on 2 August 2026 in favour of v6.** The build implements v6.
v1.7's R6/R9 capability-holistic wording is **void for us**.

If you are an AI assistant reading v1.7 §0 ("every rule R1–R13 is binding, treat contradictions as
errors") and are about to convert the evaluator flow back to capability-level scoring: **stop.**
That is this ruling, not a bug. Escalate to André before changing it.

Open backend detail (Cyprian, non-blocking): the exact skill→capability roll-up formula. Our stub
uses a weighted mean marked `TODO(cyprian)`.

## Core loop

A user creates an **Action** (a piece of real work), selects the **Skills** it demonstrates, and
someone else **evaluates** it. Skills are rated; **Capabilities are computed, never rated
directly**. Over time this produces a verified capability profile.

Three layers: **497 skills** (user-facing labels) → **119 capabilities** (the scored entities) →
**10 packages** (commercial bundles gating *org analytics only*).

## The two paths (v6)

| Path | Who starts it | Shape |
| --- | --- | --- |
| **A — retrospective** | worker | work is done → worker requests evaluation |
| **B-5a — evaluator issues** | evaluator | evaluator defines the action → picks recipients (single / many emails / org unit / self-enrol link+QR) → **one read-only Action instance per recipient, grouped under an Assignment** → each recipient submits their own evidence *and their own org_visibility consent* |
| **B-5b — worker proposes** | worker | worker drafts → evaluator **Accept / Adjust / Decline & lock** → scope final → work → submit evidence |

**Decline** (v6 §6): one click, optional reason, no negotiation thread. The worker's effort and
evidence are preserved; they may resend to a different evaluator.

## Binding rules that shape the UI

- **R1** — skills are never scored *as stored entities*; no score column on skills. (Skill-level
  *rating input* rolled up to capabilities is the v6 model above — different thing.)
- **R4** — `action_skills` snapshots `capability_id_resolved` at selection time.
- **R5** — `ai_involvement` required at creation. It describes the **user's** work, never the
  platform's own AI use.
- **R6** — evaluator declares role *and* relationship; `evidence_quality` 0–5 required; **comment
  required at scores 0, 1 and 5**; no self-evaluation.
- **R7** — dormant capabilities/skills are **never rendered**.
- **R9** — scoring is deterministic and versioned; the difficulty driving the weight is the
  **evaluator-confirmed** value, never the creator's. Parameters come from `scoring_policy` —
  never hardcode them.
- **R10** — every action carries `org_visibility` consent set **by the individual**. Evidence
  marked no **never** appears in org analytics, retroactively included. Org dashboards render
  group views only at **≥5 individuals** (k-anonymity); groups under 5 roll up to the parent unit.
- **R11** — job titles/levels are customer data. Never normalised, never score-bearing.
- **R12** — every actor needs a **rudimentary profile** (email + organisation + function) before
  creating or receiving an action. `evaluations.evaluator_id` is **NOT NULL** — there is **no
  token-only, no-account evaluation path**. Nothing is written until signup completes.
- **R13** — evidence storage stays minimal: `external_reference` (default) or `stored` (capped
  fallback). **The "hash-only" MODE no longer exists** — a hash is computed for *every* submission
  regardless of mode. No on-chain commitment in this build.

## Roles

`individual` · `evaluator` · `org_viewer` · `org_admin` — one person may hold several; permissions
are the union.

**`org_admin` cannot read scores** (admin ≠ analyst). `org_viewer` is scoped to its org_unit
subtree with k-anonymity enforced. This is why the org navigation differs by role rather than
merely disabling pages — see workspace doc 22, C3.

## UI requirements (v1.7 §7, addressed to frontend)

- Typeahead over 497 labels, case-insensitive; hover shows `skills.description`; after selection
  show **"counts toward &lt;capability name&gt;"**.
- `ai_involvement`: 3 options, required, helper text **from the enums sheet**.
- Evaluator view: the action, its skills, the capability under evaluation, **all six rubric
  anchors (0–5)** at the stored `rubric_version`, plus a **difficulty confirm/correct** step.
- Analysis views: **capabilities only — skills never appear as scored items anywhere.**
- `org_visibility` control in plain language; the individual can always restrict.
- **Provisional scores must be visually distinct** from Confirmed.
- Log every picker search returning zero matches.
- **Copy rule:** skill and capability descriptions are **descriptive, never evaluative**. No
  quality adjectives in picker or hover copy — quality language belongs only in rubric anchors.

## Ownership (André's 29 Jun letters + v1.7 §13)

| | Owns | Does not own |
| --- | --- | --- |
| **Klenis** | everything users see — navigation, page composition, labels, information architecture; consumes backend APIs | backend calculations, business logic, AI prompts |
| **Cyprian** | deterministic backend: schema, Action CRUD, evaluation/capability/analytics engines, status tracking, action lifecycle | UI |
| **Nivin** | AI service layer / LLM connectivity | scores, capability model, UI |
| **Steve** | rubric quality, calibration, evaluation method | backend, APIs, UI |

**Test when unsure:** does the change alter a schema, a state transition, a score, or an API
contract? Yes → Cyprian/André. Only what the user sees of states that already exist → frontend.

## Frontend conventions

Vocabulary, layout, tokens and copy decisions live in the workspace docs, most recently
`22_Design-Consistency-Grill.md` (decisions C1–C24). Key ones: **Action, never Task**; one
`WorkspaceShell`; tokens only; sentence case; six derived action statuses.
