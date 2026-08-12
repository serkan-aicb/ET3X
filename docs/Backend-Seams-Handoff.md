# Backend seams — handoff (frozen frontend → real backend)

The frontend is a **frozen build**: real UI, real framework data, but persistence/services are
localStorage stubs marked `TODO(cyprian)`. This doc lists exactly what the backend must expose so
the swap is a drop-in with no UI change. Flip `NEXT_PUBLIC_USE_SUPABASE=true` (see `DEPLOY.md`) to
activate the real client (`src/lib/supabase/client.ts`).

Model is authoritative per **Handover v1.10 + Action-Flow Spec v10 + Flow v9** (10 Aug 2026).

## 1. Catalogue — `GET /api/catalogue`
Frontend reads `src/lib/catalogue` (local JSON) today. Endpoint returns the 7 keys, counts:
`capabilities` 119 · `skills` 497 · `enums` · `scoringPolicy` · `packages` 10 ·
`packageCapabilities` 124 · `rubrics` 714. **Enum values must match** the ingestion sheet
(schema-v3 still had `PLACEHOLDER`s): `ai_involvement` none/ai_assisted/ai_delegated;
`difficulty` FOUNDATIONAL/INTERMEDIATE/ADVANCED/EXCEPTIONAL (uppercase); `evidence_storage_mode`
external_reference/stored; `evaluator_role`/`evaluator_relationship` per sheet; `org_visibility`
yes/no. **R1: no score column on `skills`, ever.**

## 2. Identity / account gate (R12)
Rudimentary profile = email + organisation + function, created before create OR receive OR
evaluate. `evaluations.evaluator_id` is **NOT NULL** → `profiles(id)`. Frontend stamps the
evaluator's email as `evaluator_id` at submit (`src/app/evaluate/[token]/page.tsx`). No token-only
path. Create the real `profiles` row on rudimentary signup (`src/components/account/account-gate.tsx`).

## 3. Core shapes (localStorage keys → tables)
Types: `src/lib/actions/types.ts`, `src/lib/profile/profile-types.ts`. Keys in `src/lib/local-draft.ts`:
- `actionsDrafts` → actions (`ActionRecord`: action_id, title, description, **expected_outcome**,
  action_skills[{skill_id, capability_id_resolved (R4 snapshot)}], ai_involvement, difficulty_declared,
  evidence{note,link,mode,files[{name,size,hash}]}, org_visibility, created_at).
- `evaluations` → **Skill-scoped in your schema: ONE row per rated skill + a `session_id`** grouping
  the atomic submission (v1.10 §4/§7). Our `Evaluation` object = one `session_id` (its `evaluation_id`),
  carrying `skill_scores[{skill_id, capability_id (denormalized R4 snapshot), score 0–5, comment?}]` —
  **comment is per-skill, required at 0/1/5** (R6, v1.10) — plus evaluator_id, evidence_quality,
  difficulty_confirmed, evaluator_role/relationship/verification_tier, rubric_version, scoring_version.
  Map each `skill_scores[]` entry → one `evaluations` row; the object → one session.
- `assignments` → Path B-5a evaluator-issued (`Assignment` + `AssignmentRecipient` per-recipient token/status/evidence/org_visibility).
- `proposals` → Path B-5b worker-proposed (`Proposal`: proposed→locked|declined→submitted→evaluated; adjusted; locked_by).
- `evaluationInvites` → single-use invite tokens (link back via `assignment_id`+`recipient_token` or `proposal_id`).
- `rudimentaryProfile`, `profile` (basics), `onboardingDraft`.

## 4. The three cross-device flows (must move server-side)
These are single-device stubs today — a second actor on another device can't resolve them:
- **Evaluate-by-token** `/evaluate/[token]` — resolve token→action, fetch action, write evaluation
  readable by the creator, consume token.
- **Receive-by-token** `/receive/[token]` — per-recipient action instance + submission (Path B-5a).
  Plus **proposal-by-token** `/propose/[token]` (Path B-5b): lock / adjust / decline, then submit.
- **Public profile** `/p/[slug]` — fetch public profile + capability scores by `public_slug`.
  (An `/api/profiles/public/[slug]` route exists but returns identity only and isn't wired.)

## 4b. Display rule (v1.10 §7 / UI assertion §10)
Skill-level scores + comments appear ONLY on the **finished-task view** (`/s/actions/[actionId]`,
worker/evaluator on that action) and the evaluator's in-progress scoring form. The **profile and
org dashboards are Capability-only** — no other surface renders a skill next to a score. Preserve
that boundary when wiring real data.

## 5. Scoring — `profile_capability_scores`
Row shape (drop-in): `capability_id, capability_score, rated_skill_count, display_status
(confirmed / provisional), scoring_version`. **R9 (v1.10) now specifies the formula exactly** —
`capability_score = Σ(score·w)/Σw`, `w = difficulty_weight × (0.5 + 0.1·evidence_quality)`, difficulty =
evaluator-confirmed — and our stub (`src/lib/profile/capability-scores.ts`) implements it verbatim.
**Confirmed threshold = ≥3 skill-level rows resolving to the capability, raw `COUNT(*)`** — session
and evaluator identity are irrelevant (v1.10, reverting v1.9's distinct-sessions rule). Our
`rated_skill_count` is exactly that count.

## 6. Org analytics — `GET /api/org/*`
Frontend has a governed rules engine (`src/lib/org/org-analytics.ts`) applying **package-gating**
(commercial_scope), **org_visibility R10** (private evidence never aggregated, even retroactively)
and **k-anonymity** (`min_group_size`, small groups hidden/rolled up). Endpoints should return
already-governed aggregates (or raw data the frontend governs). **admin ≠ analyst**: `org_admin`
must not receive scores. Mock data lives in `src/lib/org/org-data.ts`.

## 7. Still open / not ours
rubric-anchor calibration to skill level (Steve/André) · verification-layer ruling (André) ·
AI CV/LinkedIn extraction (Nivin) · on-chain evidence-hash commitment (deferred, v1.10 §14). The
skill→capability roll-up formula is now specified in R9 (§5 above) — no longer an open item.
