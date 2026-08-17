-- =============================================================================
-- Talent3X — Migration: legacy v1 tables -> canonical schema v3
-- =============================================================================
-- Revised per v1.6 DEV Handover (14 July 2026). Run schema-v3-handover-aligned.sql
-- BEFORE this file.
--
-- ==================== CRITICAL CHANGE FROM THE PRIOR MIGRATION ====================
-- The previous migration (v1 -> v2) populated `capabilities` and `skills` by
-- migrating the legacy repo's `skills` table 1:1. That is NO LONGER VALID.
--
-- The handover specifies capabilities (119 rows, immutable string IDs like
-- T3X-ACT-01) and skills (497 rows, SK-001..SK-549) as a FIXED, AUTHORITATIVE
-- set sourced ONLY from 260713_Talent3X_DEV_Handover_Ingestion.xlsx. There is
-- currently NO defined mapping from the legacy repo's integer skill IDs/labels
-- to the new capability_id/skill_id namespace.
--
-- CONSEQUENCE: sections 1-3 below (capabilities, skills, action_skills,
-- evaluation capability-linkage) CANNOT RUN as originally designed. They are
-- included below in a DISABLED, clearly-marked state so the intended logic is
-- visible for review, but must not be executed until a legacy-skill ->
-- new-capability/skill mapping is provided (either by André, or derived
-- manually by matching legacy skill labels to the new skill labels — NOT to
-- be guessed by this script).
-- =====================================================================================

BEGIN;

-- =============================================================================
-- 0. PRE-FLIGHT CHECKS — unchanged from the prior migration, still required
-- =============================================================================
--   SELECT COUNT(*) FROM tasks;
--   SELECT COUNT(*) FROM task_ratings;
--   SELECT COUNT(*) FROM task_rating_skills;
--   SELECT COUNT(*) FROM skills;
--   SELECT COUNT(*) FROM profiles;
--
-- Additionally, confirm the ingestion file has already been loaded and
-- counts match section 10 of the handover before running anything below:
--   SELECT COUNT(*) FROM capabilities;              -- expect 119
--   SELECT COUNT(*) FROM skills;                     -- expect 497
--   SELECT COUNT(*) FROM packages;                   -- expect 10
--   SELECT COUNT(*) FROM package_capabilities;       -- expect 124
--   SELECT COUNT(*) FROM rubrics;                    -- expect 714
-- If these do not match, STOP — do not proceed with any step below.

-- =============================================================================
-- 1. capabilities / skills — DO NOT RUN FROM LEGACY DATA
-- =============================================================================
-- REMOVED. The prior migration's `INSERT INTO capabilities SELECT ... FROM
-- skills` step (and the equivalent for the new `skills` table) is DELETED,
-- not just disabled — that data path is categorically wrong now. Both
-- tables are populated exclusively by ingesting the handover .xlsx (see
-- section 3 of the handover, sheets 1-2). Nothing in this migration script
-- should ever write to `capabilities` or `skills`.

-- =============================================================================
-- 2. tasks -> actions
-- =============================================================================
-- Largely unchanged from the prior migration, with THREE additions required
-- by the handover's new NOT NULL fields on `actions`. None of these have a
-- legacy source, so each needs an explicit decision — flagged, not guessed:
--
--   ai_involvement (NOT NULL, R5): no legacy equivalent exists. Every
--     migrated row needs SOME value to satisfy the NOT NULL constraint.
--     OPEN QUESTION for André: what should migrated legacy actions default
--     to? Setting all historical actions to a specific enum value (e.g.
--     'none') is a real data decision, not a technical default — do not
--     silently pick one. Placeholder below uses NULL and will FAIL the
--     NOT NULL constraint on purpose, so this cannot be run un-reviewed.
--
--   org_visibility (NOT NULL, R10): same issue — no legacy consent was ever
--     captured for these actions. Retroactively assigning consent on
--     someone's behalf is a privacy-sensitive decision, not just a schema
--     backfill. OPEN QUESTION for André/legal: should migrated actions
--     default to the MORE restrictive value (org_visibility = 'no', i.e.
--     excluded from org analytics) until the affected individuals are asked?
--     Placeholder below defaults to 'no' as the conservative choice, but
--     this is a suggestion, not a decision — confirm before running.
--
--   difficulty_declared: unchanged from before — legacy skill_level is a
--     different concept and is NOT mapped. NULL for all migrated rows.
--
-- STATUS mapping (action_status) is UNCONFIRMED (flagged item B in the
-- schema file) — the CASE mapping below is carried over from the prior
-- migration as a best-effort placeholder only, pending confirmation.

-- DISABLED — uncomment only after ai_involvement/org_visibility decisions
-- are confirmed with André:
--
-- INSERT INTO actions (
--   id, creator_profile_id, action_title, description, expected_outcome,
--   ai_involvement, difficulty_declared, org_visibility, status, due_date, created_at
-- )
-- SELECT
--   t.id,
--   t.creator,
--   t.title,
--   t.description,
--   NULL,                -- expected_outcome did not exist in legacy tasks
--   NULL,                -- ai_involvement: OPEN QUESTION, see above — will fail NOT NULL until decided
--   NULL,                -- difficulty_declared: not mapped from legacy skill_level
--   'no',                -- org_visibility: conservative placeholder, confirm before running
--   CASE t.status
--     WHEN 'draft'       THEN 'Draft'
--     WHEN 'open'        THEN 'Shared'
--     WHEN 'in_progress' THEN 'Shared'
--     WHEN 'submitted'   THEN 'Submitted'
--     WHEN 'graded'      THEN 'Evaluated'
--     WHEN 'closed'      THEN 'Draft'
--     ELSE 'Draft'
--   END::action_status,
--   t.due_date,
--   t.created_at
-- FROM tasks t
-- ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. tasks.skills (INTEGER[]) -> action_skills — BLOCKED
-- =============================================================================
-- This step is entirely blocked. The legacy `tasks.skills` array holds
-- integer IDs into the LEGACY `skills` table (arbitrary labels like
-- "Python" or "Public Speaking"). The new `action_skills` table needs
-- `skill_id` (format SK-001) and `capability_id_resolved` (format
-- T3X-ACT-01) from the FIXED 497-row canonical skills set.
--
-- There is currently NO mapping between these two namespaces. Producing one
-- requires either:
--   (a) André/the team supplying an explicit legacy-label -> new-skill_id
--       crosswalk, or
--   (b) a manual/fuzzy-matched reconciliation pass against the 497 canonical
--       labels, reviewed by a human before being trusted.
--
-- Do NOT attempt automatic fuzzy-matching in this script — a wrong
-- legacy-to-new skill mapping silently corrupts historical capability
-- evidence, which is exactly the failure mode R4 (snapshotting) exists to
-- prevent. This step stays unimplemented until that crosswalk exists.

-- =============================================================================
-- 4. task_ratings + task_rating_skills — ARCHIVE ONLY, CONFIRMED (not migrated)
-- =============================================================================
-- RESOLVED (feedback received 20 July 2026): legacy task_ratings and
-- task_rating_skills are archived read-only and explicitly EXCLUDED from
-- scoring under the new model. They are NOT migrated into `evaluations`.
-- Two independent reasons, both confirmed:
--   1. They carry skill-level scores, which R1 categorically prohibits under
--      the new model (no score-typed column on skills, ever).
--   2. They use the old, incompatible legacy taxonomy — there is no valid
--      mapping into the new fixed capability_id/skill_id namespace.
-- Kept for reference only. This step now RUNS (previously commented out
-- pending this decision).

CREATE TABLE IF NOT EXISTS legacy_evaluations_archive AS
SELECT
  tr.*,
  trs.skill_id AS legacy_skill_id,
  trs.stars AS legacy_stars
FROM task_ratings tr
LEFT JOIN task_rating_skills trs ON trs.rating_id = tr.id;

COMMENT ON TABLE legacy_evaluations_archive IS
  'Read-only historical archive of pre-handover task_ratings/task_rating_skills. Excluded from scoring under the new model (R1: legacy data carries skill-level scores; also uses the incompatible old taxonomy). Reference only — never join this into profile_capability_scores or any live scoring path.';

-- No RLS policies are added here deliberately — this table is not intended
-- to be queried by the application at all, only kept for historical
-- reference/audit. Restrict access at the database role level if needed.

-- =============================================================================
-- 5. Not migrated (unchanged reasoning from prior migration)
-- =============================================================================
-- profile_capability_scores: Capability Engine's job, not a raw copy.
-- Legacy `ratings` table: not migrated, superseded by task_ratings.
-- xp columns: not migrated anywhere, per explicit instruction.
-- on-chain/hash fields: verification layer's domain, not carried into app schema.
-- packages / package_capabilities / rubrics / enum_reference / scoring_policy:
--   ingested from the handover .xlsx only, never from legacy data (new in
--   this revision, restating section 1 above for completeness).

COMMIT;

-- =============================================================================
-- 6. What is actually safe to run right now
-- =============================================================================
-- UPDATED per feedback received 20 July 2026:
--   - Step 4 (legacy_evaluations_archive) is now CONFIRMED and safe to run —
--     it's a straight read-only copy, no transformation, no NOT NULL
--     conflicts, since it doesn't write into the new `evaluations` table.
--   - Steps 1-3 (capabilities/skills ingestion, actions migration, and the
--     tasks.skills -> action_skills mapping) remain BLOCKED for the same
--     reasons as before: capabilities/skills must come from the ingestion
--     .xlsx only, and the ai_involvement/org_visibility defaults for
--     migrated actions are still unconfirmed, as is the legacy skill_id ->
--     new skill_id/capability_id crosswalk needed for action_skills.
-- Practical order: run step 4 (archive) whenever convenient — it's isolated
-- and low-risk. Do not run steps 1-3 until their respective open items are
-- resolved. Flag this file's status explicitly in the PR: archive step is
-- ready to run; actions/action_skills migration is still not ready.