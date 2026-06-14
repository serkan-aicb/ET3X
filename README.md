# Talent3X

Talent3X is a student capability platform for universities. It connects real task work, educator evaluations, skill-level ratings, public profiles, and optional blockchain anchoring into one workflow.

The main technical handover is in [Technical Documentation.md](./Technical%20Documentation.md).

## What Talent3X Does

Talent3X helps students collect credible evidence of what they can do. Instead of reducing student achievement to a static grade, the platform lets educators define tasks, map them to concrete skills, review submitted work, and rate each student per skill. Those ratings are then aggregated into a profile that can be shared publicly.

The current application supports:

- Student registration and profile creation.
- Educator registration and role-based dashboards.
- Task creation with modules, deadlines, skill levels, licenses, share links, QR codes, and required skills.
- Public task request flows through share codes.
- Student task requests and educator approval.
- Assignment management for accepted students.
- Submission metadata and file metadata.
- Skill-level ratings through the normalized `task_ratings` and `task_rating_skills` tables.
- Public student capability profiles.
- Public analytics/governance views for selected skill/domain metrics.
- Optional Polygon anchoring through a dedicated relayer.

## Current Security Note

The previous relayer was taken offline. It is intentionally disabled by default.

Do not reuse any old relayer key. To enable anchoring again, create a new relayer wallet, set it on the `Talent3XSkillRatings` contract, configure the new runtime secrets, and set:

```env
RELAYER_ENABLED=true
```

The app will refuse to run the relayer while `RELAYER_ENABLED` is not set to `true`.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres with Row Level Security
- Supabase Storage metadata for submitted files and avatars
- Jest and ts-jest
- ethers.js
- Solidity contract for optional Polygon PoS anchoring

## Repository Structure

```text
src/
  app/                  Next.js App Router pages and API routes
  app/api/              Server API routes
  components/           Shared UI and feature components
  hooks/                Client-side data hooks
  lib/                  Supabase clients, crypto, DID helpers, profile aggregation, utilities
  blockchain/           Optional Polygon relayer
  scripts/              Supabase schema, migration, seed, diagnostic, and cleanup scripts

contracts/
  Talent3XSkillRatings.sol
  deploySkillRatings.js
  setRelayer.js
  Talent3XSkillRatings-README.md

public/
  Static assets and images

supabase/
  Local Supabase CLI configuration
```

Generated contract deployment JSON files are ignored by Git because they belong to a concrete environment and should be recreated per deployment.

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- Supabase SQL Editor access
- Optional for anchoring: Polygon RPC endpoint, deployer wallet, new relayer wallet, and MATIC for gas

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the required Supabase and encryption values in `.env`.

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Use `.env.example` as the template. Never commit `.env` or any file containing real secrets.

| Variable | Required | Used By | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | browser/server | Supabase project URL. Public by design. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser/server | Supabase anon key. Security depends on RLS. |
| `NEXT_PUBLIC_SITE_URL` | yes | browser/server | Base URL for auth redirects. Use `http://localhost:3000` locally. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for server APIs/scripts | server only | Bypasses RLS. Never import into client code. |
| `ENVELOPE_MASTER_KEY` | yes | server only | Encrypts email envelope data before profile storage. |
| `SITE_BASE` | deployment-dependent | server/scripts | Public site base URL for generated links. |
| `POLYGON_RPC_URL` | only for relayer | relayer/setup | Polygon PoS RPC endpoint. |
| `RELAYER_ENABLED` | only for relayer | relayer | Defaults to `false`. Must be `true` before anchoring. |
| `RELAYER_PRIVATE_KEY` | only for relayer | relayer | New relayer wallet key. Do not reuse old keys. |
| `RELAYER_DEPLOYER_PRIVATE_KEY` | setup only | contract scripts | Owner/deployer key. Remove from runtime after setup. |
| `RELAYER_ADDRESS` | setup only | contract scripts | Public address of the new relayer wallet. |
| `T3X_SKILL_RATINGS_CONTRACT_ADDRESS` | only for relayer | relayer/setup | Active `Talent3XSkillRatings` contract address. |

## Database Setup

The baseline schema lives in:

```text
src/scripts/supabase-schema.sql
```

The live Supabase export from 14 June 2026 contains these public tables:

- `admin_codes`
- `profiles`
- `skills`
- `tasks`
- `task_requests`
- `task_assignments`
- `submissions`
- `submission_files`
- `task_ratings`
- `task_rating_skills`
- `ratings` as a legacy compatibility table

For a fresh Supabase project:

1. Open the Supabase SQL Editor.
2. Run `src/scripts/supabase-schema.sql`.
3. Run relevant migration or fix scripts from `src/scripts/` if your environment already has older tables.
4. Run the skill seed:

```bash
npm run seed
```

5. Re-run the schema export query from [Technical Documentation.md](./Technical%20Documentation.md) and compare the result.

Recommended security cleanup before production-style handover:

```sql
-- Review first, then run in Supabase SQL Editor
-- src/scripts/drop-dev-rls-policies.sql
```

## Storage

The app expects storage support for:

- Submitted task files.
- Public profile/avatar assets.

File metadata is stored in `submission_files`. RLS and storage policies must stay aligned: students should access their own submissions, and educators should access submissions for tasks they own.

## Roles

Talent3X uses three application roles:

- `student`: requests tasks, submits work, receives ratings, manages profile.
- `educator`: creates tasks, manages requests and assignments, reviews submissions, rates skills.
- `admin`: accesses admin-oriented views and admin-code functionality.

The role is stored in `profiles.role` and enforced through routing, page logic, Supabase RLS, and server APIs where needed.

## Main Workflows

### Student

1. Sign up or sign in.
2. Complete profile information.
3. Browse open tasks or open a task share link.
4. Request a task.
5. Submit work after assignment.
6. View ratings and profile evidence after educator evaluation.

### Educator

1. Sign up or sign in as educator.
2. Create a task with required skills and task metadata.
3. Share the task link or QR code.
4. Review student requests.
5. Assign students.
6. Review submissions.
7. Rate students per skill.
8. Ratings become part of the student's capability profile.

### Optional Anchoring

1. Ratings are written to `task_ratings` and `task_rating_skills`.
2. The relayer reads rows where `on_chain=false`.
3. The relayer computes canonical hashes.
4. The relayer calls `anchorSingleSkillRating(...)` on `Talent3XSkillRatings`.
5. Transaction hashes are written back to `task_rating_skills.tx_hash`.
6. Fully anchored sessions are marked on `task_ratings.on_chain=true`.

## Relayer Rebuild Checklist

The relayer is offline and must be recreated before use:

1. Create a new relayer wallet.
2. Fund it with only the MATIC needed for operations.
3. Keep the deployer/owner wallet separate.
4. Deploy a fresh contract if needed:

```bash
node contracts/deploySkillRatings.js
```

5. Set the new relayer:

```bash
node contracts/setRelayer.js
```

6. Configure the runtime environment.
7. Set `RELAYER_ENABLED=true`.
8. Run manually first:

```bash
npm run relayer
```

9. Only then automate it through a scheduler or worker.

## Useful Scripts

```bash
npm run dev          # Start local development server
npm run build        # Create production build
npm run start        # Run production build
npm run lint         # ESLint
npm test             # Jest tests
npm run seed         # Seed base skills
npm run relayer      # Run optional Polygon relayer, disabled unless RELAYER_ENABLED=true
```

Useful SQL and maintenance files:

- `src/scripts/supabase-schema.sql`: baseline schema.
- `src/scripts/fix-profiles-email-ciphertext.sql`: adds expected encrypted email column.
- `src/scripts/fix-submissions-created-at.sql`: aligns submission timestamps.
- `src/scripts/drop-dev-rls-policies.sql`: removes permissive development RLS policies after review.
- `src/scripts/migrate-ratings-schema.sql`: normalized rating table migration.
- `src/scripts/update-task-ratings-on-chain-function.sql`: helper for rating on-chain status.

## Development Guidelines

- Prefer the existing Supabase table names and local helper functions.
- Keep all client-side Supabase queries compatible with RLS.
- Use server routes for operations requiring service-role access.
- Do not expose service-role keys, private keys, email ciphertext, email digests, or matriculation data.
- Keep public APIs explicitly allowlisted.
- After database changes, update `src/lib/supabase/types.ts`, `src/scripts/supabase-schema.sql`, and the technical documentation.
- After UI changes, check both student and educator flows.

## Verification

Run before committing:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

Expected current baseline:

- Tests pass.
- Production build passes.
- Lint runs without errors. Some warnings may remain from existing unused variables/imports and UI cleanup work.

## Git And Secret Hygiene

Do not commit:

- `.env`
- `.env.*`
- `.env.backup`
- `.claude/`
- `.Claude/`
- `.vercel/`
- `.next/`
- `node_modules/`
- generated `contracts/*.json`
- private keys, JWTs, service-role keys, RPC secrets, or exported production data

`.env.example` is safe to commit because it contains placeholders only.

## Current Handover Notes

This handover cleaned up the old direct `TalentRating` blockchain flow, removed unused IPFS/Polygon client code, switched visible educator rating counts to the normalized rating tables, aligned assignment management with the live Supabase schema, disabled the relayer by default, and expanded the documentation for student continuation work.
