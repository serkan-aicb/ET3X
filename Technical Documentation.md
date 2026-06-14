# Talent3X Technical Documentation

Date: 13 June 2026  


## Quick Technical Overview

Talent3X is a full-stack TypeScript web application. The frontend and backend are both implemented with Next.js. Supabase provides authentication, the Postgres database, Row Level Security, and storage integration. Optional blockchain anchoring is implemented with Solidity smart contracts and an ethers.js relayer.

### Programming Languages And File Types

| Language / Format | Used For | Main Locations |
| --- | --- | --- |
| TypeScript | Application logic, server routes, Supabase clients, scripts, hooks, utility functions. | `src/app`, `src/components`, `src/lib`, `src/hooks`, `src/scripts` |
| TSX | React UI components and Next.js pages. | `src/app`, `src/components` |
| SQL | Supabase schema, RLS policies, migrations, cleanup scripts, diagnostic scripts. | `src/scripts/*.sql` |
| Solidity | Optional Polygon smart contract for skill rating anchoring. | `contracts/Talent3XSkillRatings.sol` |
| CSS / Tailwind | Global styling and component styling. | `src/app/globals.css`, component class names |
| JavaScript | Contract deployment/setup scripts and a few database helper scripts. | `contracts/*.js`, selected `src/scripts/*.js` |
| Markdown | Project and handover documentation. | `README.md`, `Technical Documentation.md`, `contracts/*.md` |
| JSON | Package metadata and generated deployment artifacts. | `package.json`, `package-lock.json`, generated `contracts/*.json` |

### Main Technologies

| Area | Technology |
| --- | --- |
| Web framework | Next.js 16 App Router |
| UI framework | React 19 |
| Primary language | TypeScript / TSX |
| Styling | Tailwind CSS 4 and local UI components |
| Authentication | Supabase Auth |
| Database | Supabase Postgres |
| Authorization | Supabase Row Level Security plus route-level checks |
| File handling | Supabase Storage plus `submission_files` metadata |
| Optional blockchain | Solidity, ethers.js, Polygon PoS |
| Testing | Jest and ts-jest |
| Runtime/tooling | Node.js, npm, ESLint, TypeScript |

### How The Main Parts Work Together

1. Users open Talent3X in the browser.
2. Next.js renders public, student, educator, admin, profile, and task pages.
3. React client components handle forms, dashboards, rating UI, profile UI, and task interactions.
4. Supabase Auth manages login sessions.
5. The browser uses the Supabase anon key for normal user operations.
6. Supabase Row Level Security controls which rows each user may read or write.
7. Next.js API routes handle sensitive server-side work, for example signup/profile creation checks, public profile allowlisting, DID documents, and file upload/download.
8. Educator-created tasks are stored in `tasks`.
9. Student requests are stored in `task_requests`.
10. Accepted work is stored in `task_assignments`.
11. Student submissions are stored in `submissions`; uploaded file metadata is stored in `submission_files`.
12. Educator evaluations are stored as normalized rating sessions in `task_ratings` and individual skill scores in `task_rating_skills`.
13. Profile pages aggregate rating data into visible student skill evidence.
14. The optional relayer can later read unanchored rating rows and anchor them to Polygon.

## Purpose

Talent3X is a university-oriented platform for turning student work into structured, reusable evidence of capability. Students request and submit tasks. Educators create tasks, assign students, evaluate submissions per skill, and publish capability evidence through public profiles. The application stores operational data in Supabase and can optionally anchor normalized skill ratings to Polygon through a dedicated relayer.

## Current State

- The application is built with Next.js 16, React 19, TypeScript, Supabase, and ethers.js.
- Supabase is the source of truth for users, profiles, tasks, requests, assignments, submissions, files, skills, and ratings.
- Ratings use the normalized `task_ratings` and `task_rating_skills` model.
- The old direct `TalentRating` Polygon/IPFS flow has been removed from the codebase.
- The relayer has been taken offline for security reasons and is disabled by default in code. It must be recreated and explicitly enabled.
- Local `.env` files, Claude settings, generated contract deployment artifacts, build output, and dependency folders are ignored by Git.

## Tech Stack

| Layer | Technology | Main Files / Notes |
| --- | --- | --- |
| Programming language | TypeScript / TSX | Main application code in `src/app`, `src/components`, `src/lib`, and `src/hooks`. |
| Frontend framework | React 19 | Client components, forms, dashboards, profile views, and interactive UI. |
| Application framework | Next.js 16 App Router | Routing, layouts, server-rendered pages, API routes, and production build. |
| Styling | Tailwind CSS 4 plus local UI components | Global styles in `src/app/globals.css`; shared components in `src/components/ui`. |
| Backend/API layer | Next.js API routes | Server-side routes in `src/app/api`. Used for signup, public profiles, DID documents, file upload/download, task lookup, and health checks. |
| Database | Supabase Postgres | Tables, constraints, indexes, RLS policies, and SQL scripts in `src/scripts`. |
| Authentication | Supabase Auth | User sessions, auth callback, password reset, and role-linked profile records. |
| Authorization | Supabase Row Level Security plus route-level checks | RLS protects database access; Next.js pages and APIs add role/session checks. |
| Storage | Supabase Storage plus metadata tables | File metadata is stored in `submission_files`; storage access is handled by server routes and policies. |
| Blockchain integration | Solidity, ethers.js, Polygon PoS | Optional anchoring through `contracts/Talent3XSkillRatings.sol` and `src/blockchain/relayer.ts`. |
| Tests | Jest, ts-jest | Unit tests for XP calculation and username parsing. |
| Tooling/runtime | Node.js, npm, ESLint, TypeScript | Scripts are defined in `package.json`. |

Additional file formats used by the project:

- SQL for Supabase schema, RLS, migrations, and cleanup scripts.
- Markdown for project documentation.
- JSON for package metadata and generated deployment artifacts.
- CSS/Tailwind utility classes for styling.

## Architecture

```text
Browser
  -> Next.js App Router pages and client components
  -> Supabase client with anon key and RLS

Next.js server/API routes
  -> Supabase server client for authenticated operations
  -> Supabase service-role client only for controlled server-side operations
  -> DID/public profile endpoints

Supabase
  -> Auth users
  -> Postgres public schema
  -> Row Level Security
  -> Storage buckets for submissions and avatars

Optional blockchain layer
  -> src/blockchain/relayer.ts
  -> contracts/Talent3XSkillRatings.sol
  -> Polygon PoS mainnet
```

## How The System Fits Together

Talent3X is organized around Supabase as the central data layer and Next.js as the application layer.

1. The browser renders Next.js pages and React client components.
2. Client components use the Supabase anon client for normal user actions such as reading allowed tasks, submitting requests, editing own profile fields, and viewing own assignments.
3. Supabase Row Level Security decides which rows the current user can read or write.
4. Next.js API routes handle operations that must not run directly in the browser, such as public profile allowlisting, DID document generation, signup/profile creation checks, and file upload/download.
5. Server-side routes use the service-role key only where RLS bypass is necessary and safe.
6. Educator task work flows from `tasks` to `task_requests`, then to `task_assignments`, then to `submissions`.
7. Educator evaluations are stored as one `task_ratings` session plus multiple `task_rating_skills` rows.
8. Profile pages aggregate `task_ratings` and `task_rating_skills` into visible skill evidence.
9. The optional relayer reads unanchored normalized rating rows, writes hashes, sends Polygon transactions, and stores transaction hashes back in Supabase.

## Main Application Areas

### Public

- `/`: marketing/home page.
- `/students`, `/stud`: student-oriented landing pages.
- `/edu`, `/partners`, `/universities`, `/how-it-works`: informational pages.
- `/t/[shareCode]`: public task request entry point.
- `/p/[slug]`: public capability profile.
- `/admin-public`: public analytics/governance dashboard.

### Authentication

- `/auth`: sign in and sign up.
- `/auth/callback`: Supabase callback handling.
- `/auth/reset-password`, `/auth/update-password`: password recovery.
- `/api/auth/signup`: creates profile rows after verifying the authenticated Supabase user.

### Student

- `/s/dashboard`: student overview.
- `/s/tasks`: open tasks.
- `/s/tasks/[taskId]`: task detail and request flow.
- `/s/my-tasks`: assigned work.
- `/submit/[taskId]`: submission flow.
- `/rating/[taskId]`: rating/proof view.
- `/s/profile`: private profile view.

### Educator

- `/e/dashboard`: educator overview.
- `/e/tasks`: educator task list.
- `/e/tasks/create`: task creation.
- `/e/tasks/[taskId]`: task detail.
- `/e/tasks/[taskId]/edit`: task editing.
- `/e/tasks/share/[taskId]`: share link and QR code.
- `/e/tasks/manage/[taskId]`: request and assignment management.
- `/e/tasks/[taskId]/submissions`: submission list.
- `/e/tasks/[taskId]/submissions/[submissionId]/rate`: single-submission rating.
- `/e/profile`: educator profile.

### API Routes

- `/api/auth/signup`: profile creation guard for authenticated signup.
- `/api/profiles/public/[slug]`: public-safe profile payload.
- `/api/did/web/[...path]`: DID web document endpoint.
- `/api/tasks/public-info`: task lookup by share code.
- `/api/files/upload`: submission file upload.
- `/api/files/download`: controlled file download.
- `/api/health`: health check.

## Core Data Flows

### Registration

1. A user authenticates through Supabase Auth.
2. The signup API checks that the request matches the authenticated user ID and email.
3. The server creates a `profiles` row.
4. Email is stored as encrypted ciphertext and digest, not as plain profile data.
5. Role-based navigation separates student, educator, and admin areas.

### Task Lifecycle

1. An educator creates a row in `tasks`.
2. Required skill IDs are stored in `tasks.skills`.
3. Tasks can be shared by `share_code`.
4. Students create `task_requests`.
5. Educators accept requests and create `task_assignments`.
6. Assigned students submit via `submissions` and optional `submission_files`.

### Rating Lifecycle

1. Educator rates a student per task skill.
2. One `task_ratings` row stores the rating session.
3. One `task_rating_skills` row stores each skill score.
4. XP and average stars are computed in application code.
5. The relayer can later anchor pending skill rows on-chain.

### Public Profile Aggregation

1. The profile layer reads normalized task ratings.
2. Skill ratings are weighted by task difficulty and aggregated into skill scores.
3. Public profile APIs expose only public-safe fields.
4. Email ciphertext, email digest, matriculation data, service keys, and private keys must never be exposed.

## Supabase Table Summary

The live Supabase export contains 11 public tables.

| Table | RLS | Purpose | Important Columns |
| --- | --- | --- | --- |
| `admin_codes` | enabled | Admin access codes. | `code`, `purpose`, `valid_from`, `valid_to` |
| `profiles` | enabled | App profile for each auth user. | `id`, `role`, `username`, `did`, `email_ciphertext`, `email_digest`, `matriculation_number`, `real_name`, `headline`, `bio`, `avatar_url`, `public_slug`, timestamps |
| `skills` | disabled | Skill catalogue. | `id`, `label`, `description`, `oulu_domain` |
| `tasks` | enabled | Educator-created tasks. | `id`, `creator`, `module`, `title`, `description`, `seats`, `skill_level`, `license`, `skills`, `due_date`, `status`, `task_mode`, `is_requestable`, `share_code`, `is_active`, timestamps |
| `task_requests` | enabled | Student requests to join tasks. | `id`, `task`, `applicant`, `created_at`, `status`, `applicant_username`, `applicant_matriculation_number` |
| `task_assignments` | enabled | Accepted/assigned task work. | `id`, `task`, `assignee`, `created_at`, `assignee_username`, `status`, `submitted_at`, `grade`, `assignee_matriculation_number` |
| `submissions` | enabled | Submitted work metadata. | `id`, `task`, `submitter`, `link`, `note`, `files`, `created_at` |
| `submission_files` | enabled | File metadata linked to submissions. | `id`, `submission`, `file_name`, `file_size`, `file_type`, `storage_path`, `created_at` |
| `task_ratings` | enabled | Normalized rating session. | `id`, `task_id`, `rater_id`, `rated_user_id`, `stars_avg`, `xp`, hashes, `on_chain`, `created_at` |
| `task_rating_skills` | enabled | Skill-level rating rows. | `id`, `rating_id`, `skill_id`, `stars`, `tx_hash`, `on_chain`, `created_at` |
| `ratings` | enabled | Legacy compatibility table from the old rating model. | `id`, `task`, `rater`, `rated_user`, `skills`, `stars_avg`, `xp`, `cid`, `tx_hash`, `created_at` |

## Database Relationships

- `profiles.id` references `auth.users.id`.
- `tasks.creator` references `profiles.id`.
- `task_requests.task` references `tasks.id`.
- `task_requests.applicant` references `profiles.id`.
- `task_assignments.task` references `tasks.id`.
- `task_assignments.assignee` references `profiles.id`.
- `submissions.task` references `tasks.id`.
- `submissions.submitter` references `profiles.id`.
- `submission_files.submission` references `submissions.id`.
- `task_ratings.task_id` references `tasks.id`.
- `task_ratings.rater_id` and `task_ratings.rated_user_id` reference `profiles.id`.
- `task_rating_skills.rating_id` references `task_ratings.id`.
- `task_rating_skills.skill_id` references `skills.id`.

## Important Constraints And Indexes

- `profiles.username`, `profiles.did`, `profiles.email_digest`, `profiles.matriculation_number`, and `profiles.public_slug` are unique.
- `tasks.share_code` is unique and indexed.
- `submissions` has a unique task/submitter constraint in the live database.
- `task_rating_skills` has a unique rating/skill constraint in the live database.
- Core foreign-key columns are indexed for task, assignment, request, submission, and rating lookups.
- The live export still contains permissive `dev_allow_all_*` policies on `ratings` and `task_assignments`; use `src/scripts/drop-dev-rls-policies.sql` after review before a production handover.

## Supabase Schema Refresh Query

Use this when the database changes and the documentation needs to be refreshed:

```sql
WITH table_list AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
columns AS (
  SELECT table_schema, table_name,
    jsonb_agg(jsonb_build_object(
      'position', ordinal_position,
      'name', column_name,
      'data_type', data_type,
      'udt_name', udt_name,
      'nullable', is_nullable,
      'default', column_default
    ) ORDER BY ordinal_position) AS columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
  GROUP BY table_schema, table_name
),
indexes AS (
  SELECT schemaname AS table_schema, tablename AS table_name,
    jsonb_agg(jsonb_build_object('name', indexname, 'definition', indexdef) ORDER BY indexname) AS indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
),
policies AS (
  SELECT schemaname AS table_schema, tablename AS table_name,
    jsonb_agg(jsonb_build_object(
      'name', policyname,
      'command', cmd,
      'roles', roles,
      'permissive', permissive,
      'using', qual,
      'with_check', with_check
    ) ORDER BY policyname) AS policies
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
),
rls AS (
  SELECT n.nspname AS table_schema, c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
)
SELECT jsonb_pretty(jsonb_build_object(
  'generated_at', now(),
  'tables', jsonb_agg(jsonb_build_object(
    'schema', tl.schema_name,
    'table', tl.table_name,
    'rls_enabled', rls.rls_enabled,
    'rls_forced', rls.rls_forced,
    'columns', COALESCE(columns.columns, '[]'::jsonb),
    'indexes', COALESCE(indexes.indexes, '[]'::jsonb),
    'policies', COALESCE(policies.policies, '[]'::jsonb)
  ) ORDER BY tl.table_name)
)) AS schema_summary
FROM table_list tl
LEFT JOIN columns ON columns.table_schema = tl.schema_name AND columns.table_name = tl.table_name
LEFT JOIN indexes ON indexes.table_schema = tl.schema_name AND indexes.table_name = tl.table_name
LEFT JOIN policies ON policies.table_schema = tl.schema_name AND policies.table_name = tl.table_name
LEFT JOIN rls ON rls.table_schema = tl.schema_name AND rls.table_name = tl.table_name;
```

## Relayer Status And Reconfiguration

The old relayer is offline and must not be reused. The runtime now refuses to run unless `RELAYER_ENABLED=true` is set.

Required reconfiguration:

1. Create a new relayer wallet. Do not reuse the previous private key.
2. Keep the owner/deployer wallet separate from the relayer wallet.
3. Fund the relayer wallet only with the operational MATIC required for anchoring.
4. Deploy or select the active `Talent3XSkillRatings` contract.
5. Set `RELAYER_ADDRESS` to the new relayer wallet.
6. Run `node contracts/setRelayer.js` with the owner/deployer wallet.
7. Configure the runtime with `POLYGON_RPC_URL`, `RELAYER_PRIVATE_KEY`, `T3X_SKILL_RATINGS_CONTRACT_ADDRESS`, and `RELAYER_ENABLED=true`.
8. Remove `RELAYER_DEPLOYER_PRIVATE_KEY` from the runtime environment after contract setup.

Generated deployment artifacts under `contracts/*.json` are ignored by Git because they are environment-specific.

## Environment Variables

| Variable | Required | Scope | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | browser/server | Public Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser/server | Public anon key protected by RLS. |
| `NEXT_PUBLIC_SITE_URL` | yes | browser/server | Base URL for auth redirects. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for server APIs/scripts | server only | Bypasses RLS. Never expose to client code. |
| `ENVELOPE_MASTER_KEY` | yes for signup/profile encryption | server only | Used for encrypted email envelopes. |
| `SITE_BASE` | deployment-dependent | server/scripts | Public site base URL. |
| `POLYGON_RPC_URL` | relayer only | server/relayer | Polygon RPC endpoint. |
| `RELAYER_ENABLED` | relayer only | server/relayer | Must be `true` before anchoring. Defaults to disabled. |
| `RELAYER_PRIVATE_KEY` | relayer only | server/relayer | New relayer wallet private key. |
| `RELAYER_DEPLOYER_PRIVATE_KEY` | setup only | local setup | Owner/deployer key. Do not keep in runtime. |
| `RELAYER_ADDRESS` | setup only | local setup | Public address of the new relayer wallet. |
| `T3X_SKILL_RATINGS_CONTRACT_ADDRESS` | relayer only | server/relayer | Active skill ratings contract address. |

## Security Rules

- Never commit `.env`, `.env.*`, `.env.backup`, `.claude/`, `.Claude/`, `.vercel/`, `.next/`, `node_modules/`, or generated contract JSON artifacts.
- Treat service-role keys, private keys, RPC secrets, JWTs, email ciphertext, email digests, and matriculation data as sensitive.
- Use service-role Supabase clients only in server-only code paths.
- Public APIs must return allowlisted fields only.
- RLS policies must be reviewed whenever client-side Supabase queries change.
- Before a production-style handover, review and run `src/scripts/drop-dev-rls-policies.sql`.

## Verification

Current project checks:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

At the time of this documentation update, the previous baseline had passing tests and production build. Re-run all checks after every schema or UI change.

