# Frontend Build Handover — Weeks 1–4

**Owner:** Klenis (frontend/UX) · **Date:** 22 July 2026
**Branch:** `feature/fe-w3-action-creation` (carries all of Weeks 1–4)
**Aligned to:** handover **v1.6** (14 July) + its ingestion file (260713 xlsx).

## What this is
A record of everything built for Weeks 1–4 and how it's wired. The guiding
constraint (team ownership, v1.6 §13): **the frontend owns the UI only** — it consumes
backend APIs; it never computes scores or owns schema. So Weeks 2–4 are built as a
**frozen frontend**: real UI, real framework data, but persistence + services are
**stubs** (localStorage + a local catalogue) that swap for the backend/AI APIs
with no UI change.

## Real vs stubbed (read this first)
- **Real:** every screen, the theme/design system, the 119/497/714 framework data
  (ingested verbatim from the handover file), client-side validation (react-hook-form
  + zod), SHA-256 evidence hashing, routing + auth guards.
- **Stubbed (localStorage / mock route):** CV/LinkedIn extraction, persistence of
  profiles / actions / evaluations, single-use invite tokens, and score computation.
  Each stub is commented with a `TODO(cyprian|nivin)` seam.

---

## Week 1 — UI Foundation / Theme  ✅
The design system, frozen (decisions captured in the frontend team's internal notes).
- **Tokens only** in `src/app/globals.css`: warm-paper canvas `#F6F5F1`, white cards,
  steel-blue primary `#3B6EA8` (logo-derived, AA), bluish-green success `#0D9488`,
  brand ink `#081B30`, semantic + `-soft` pairs, category-badge pairs, elevation tokens.
- **Recipes:** border-led hybrid surface (`shadow-card`), 8/6/4 spacing, depth-graded
  radius (xl→lg→md→full), **ink chrome** (navy top bars + workspace sidebar),
  icons + brand-tint spot-art imagery (never behind data).
- **Shared components:** `ui/button.tsx` (incl. `ink` / `inverse` / `inverse-outline`),
  `ui/card.tsx`, `ui/top-bar.tsx`, `layout/focused-flow-shell.tsx` (ink bar + sticky
  stepper — hosts every wizard).
- **Contract + samples:** `/design-system` (the visual contract), `/design-lab`
  (workspace archetype), `/profile-studio-preview` (public projection),
  `/onboarding-preview` (original focused-flow mock).

## Foundation for W2–4 — the catalogue  ✅
`src/lib/catalogue/` — ingested from the 260713 xlsx: **119 capabilities, 497 skills,
714 rubric anchors, 9 enums, scoring_policy, 10 packages** (CI counts match). Stub for
the future `GET /api/catalogue`.
- Accessors: `searchSkills` (typeahead), `resolveCapability`, `getRubric` (6 anchors),
  `getEnum`, `getScoreScale`, `getDifficultyLevels`, `getEvaluatorRoles`, `prettyEnum`,
  non-dormant filtering (R7). Replaced the old `mock-config.ts` (deleted).

## Week 2 — Profile Onboarding  ✅
- **Route:** `/s/onboarding` (auth-guarded). New students auto-route here after signup;
  `/s/dashboard` shows a soft "Finish your profile" prompt (no hard gate).
- **Flow:** Welcome → Import (CV drag-drop / LinkedIn) → Review → Done.
- **Import** calls stub `POST /api/onboarding/extract` → returns education/experience +
  **catalogue skill_ids**. Review uses the **governed skill typeahead** ("counts toward
  <capability>", no free text) + RHF/zod on name/headline. Persist to localStorage.
- v1.6 note: onboarding isn't in v1.6 §7 but confirmed still in scope.

## Week 3 — Action Creation  ✅
- **Routes:** `/s/actions/create` (wizard), `/s/actions` (My Actions list).
- **Wizard:** Details → Skills (typeahead, snapshots `capability_id_resolved`, R4) →
  About the work (**ai_involvement required** R5 + creator-declared difficulty) →
  Evidence (note/link/files + **Store / Hash Only / External** mode + **org_visibility**
  consent R10) → Review.
- **Hash-Only** computes a SHA-256 client-side; the raw file never leaves the browser.
- No action categories (removed in v1.6). Evaluator selection is NOT here (Week 4).
- Persist to localStorage.

## Week 4 — Evaluation  ✅
- **Request:** `/s/actions/request/[actionId]` — generates a **single-use token**, shows
  the invite **link + QR** (`qrcode.react`), self-eval warning. Wired to the My Actions card.
- **Evaluator:** `/evaluate/[token]` — **public, token-reached** (no account, pending
  André). Context & role → Difficulty confirm/correct → **Score each capability against
  its six rubric anchors** (+ evidence_quality 0–5, comment required at 0/1/5) → Review →
  Done. Writes one evaluation per capability; consumes the token.
- All R6/R9 rules encoded (capability-level holistic 0–5, role + relationship,
  `rubric_version`/`scoring_version` stored, no self-eval).

---

## Route map
| Route | Week | Access |
| --- | --- | --- |
| `/design-system` `/design-lab` `/profile-studio-preview` `/onboarding-preview` | 1 | public |
| `/s/onboarding` | 2 | student (guarded) |
| `/s/dashboard` (onboarding prompt) | 2 | student (guarded) |
| `/s/actions` · `/s/actions/create` | 3 | student (guarded) |
| `/s/actions/request/[actionId]` | 4 | student (guarded) |
| `/evaluate/[token]` | 4 | public (token-gated) |

## Pending / open (blocks nothing now)
- **Backend (Cyprian) API contracts:** evaluation submission, single-use invite tokens,
  score computation/display, evaluator verification tier.
- **Product (André):** (1) evaluator account vs tokenised-link only (affects routing);
  (2) Hash-Only / evidence-storage modes aren't in the v1.6 enums — keep as a local
  constant?; (3) onboarding omitted from v1.6 §7 — confirmed in scope.

## How to run / verify
`npm run dev` → http://localhost:3000. Sign in as a student, then walk the loop:
onboarding → create action → My Actions → Request evaluation → open the `/evaluate/<token>`
link (same browser) → score → submit. `npm run lint` + `npx tsc --noEmit` both clean.
Note: the token demo only resolves in the browser that created it (localStorage stub).

## Git state
All of Weeks 1–4 are committed on `feature/fe-w3-action-creation` and opened as a
**draft PR** against `main` for team visibility (not yet ready to merge).
