# Frontend Changelog — Talent3X

Frontend workstream (Klenis). Branch `feature/fe-w3-action-creation` → draft PR #3.
Aligned to handover **v1.6**. Build is a **frozen frontend**: real UI + real framework
data, persistence/services stubbed (localStorage + local catalogue) pending the backend.

---

## Week 5 — Final Profile Studio · 23 Jul 2026
**`c41969c` feat(profile): Week 5 Final Profile Studio (v1.6, capabilities-driven)**
- One `<CapabilityProfile>` drives owner `/s/profile` (Edit / avatar upload / Share /
  Export PDF) and public `/p/[slug]` (read-only); supersedes the pre-v1.6 student profile.
- R9 scoring **stub** (`lib/profile/capability-scores.ts`) computes per-capability scores
  from `scoring_policy` and emits Cyprian's `profile_capability_scores` shape (full ≥3 /
  provisional 1–2) — drop-in swap.
- View-model assembler (`use-profile-view.ts`) reads localStorage; provisional badges,
  verified contributions, capability radar, growth sparkline, empty states.
- Lifted onboarding types to `lib/profile/profile-types.ts`; retired the dead
  `components/profile-studio/*` (12 files).

## Weeks 3 + 4 — Action Creation + Evaluation · 22 Jul 2026
**`1b82ecf` feat(actions+evaluation): Week 3 Action Creation + Week 4 Evaluation UI**
- W3 `/s/actions/create` wizard (details → governed skill typeahead "counts toward
  capability" → ai_involvement required + difficulty → evidence incl. Hash-Only +
  org_visibility → review) and `/s/actions` list.
- W4 request-evaluation (single-use token + invite link/QR) + `/evaluate/[token]` evaluator
  flow (role/relationship, difficulty confirm, per-capability scoring vs 6 rubric anchors,
  evidence_quality, comment at 0/1/5).
- Catalogue `src/lib/catalogue` ingested from the v1.6 xlsx (119 caps / 497 skills / 714
  rubrics / enums / scoring_policy); migrated design-system + profile off the deleted
  `mock-config.ts`; shared SkillPicker + evidence SHA-256 hash + action/evaluation types.

**`c61dc6c` docs: add Weeks 1–4 frontend build handover**

## Week 2 — Profile Onboarding · 21 Jul 2026
**`a730750` feat(onboarding): Week 2 profile onboarding, v1.6-aligned**
- `/s/onboarding` (Welcome → Import → Review → Done); stub `POST /api/onboarding/extract`;
  governed skill typeahead; react-hook-form + zod; localStorage persistence + soft
  post-signup entry.

## Theme system (grill 4 → warm-paper) · 13–21 Jul 2026
- **`a0a70d6` feat(theme): warm-paper neutral field (grill 5 — palette reopened)**
- **`184b6d4` feat(layout): extract archetype shells (Week-3 §1)** — FocusedFlowShell etc.
- **`c090175` feat(profile): identity enrichment + score-list-first layout (variant B)**
- **`d531a05` feat(theme): post-review palette round** (steel-blue primary, bluish-green
  success, sky→later warm canvas).
- **`a28bc3a` feat(theme): global theme system per 13-July grill (doc 14, S1–S7)** — surface
  recipe, 8/6/4 spacing, depth radius, ink chrome, imagery policy.
- **`8b6d5fb` / `35e800b` fix(copy)** — public label "Profile"; outcome-first Action copy.

## Week 1 — UI Foundation · 8–9 Jul 2026
- **`93c203b` feat(design): apply 9-July page-level grill decisions (grill 3)**
- **`0682790` feat(previews): rebuild all three previews on the decided theme system**
- **`d37a4ac` feat(theme): apply 8-July theme-grill decisions** — brand palette, DM Sans,
  button rework.
- **`b4fdd88` fix(previews): apply 8-July design-grill decisions**
- **`050b9fc` feat(previews): port Profile Studio, Onboarding, Design Lab preview pages**
- **`1aba158` feat(design-system): Week 1 UI foundation** — reusable components +
  `/design-system` reference page.
- **`ef763b8` chore: ignore local screenshots folder**

---

## Routes at a glance
| Route | Week | Access |
| --- | --- | --- |
| `/design-system` `/design-lab` `/profile-studio-preview` `/onboarding-preview` | 1 | public |
| `/s/onboarding` · `/s/dashboard` | 2 | student |
| `/s/actions` · `/s/actions/create` | 3 | student |
| `/s/actions/request/[actionId]` · `/evaluate/[token]` | 4 | student / public-token |
| `/s/profile` · `/p/[slug]` | 5 | student / public |

## Pending (backend, not blocking the UI)
Cyprian: evaluation-submission API, single-use invite tokens, R9 score computation +
read (owner + public by `public_slug`), evaluator verification tier. See the frontend
workspace "Cyprian API asks" note.
