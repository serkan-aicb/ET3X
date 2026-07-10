-- =============================================================================
-- Talent3X — One-time migration: legacy v1 tables -> canonical schema
-- =============================================================================
-- Source: tasks, task_ratings, task_rating_skills, skills, profiles (live v1)
-- Target: actions, evaluations, evaluation_scores, capabilities, profiles (new)
--
-- Per feedback:
--   - Live v1 tables are READ-ONLY source data for this single migration.
--   - This script does not modify or drop any legacy table.
--   - Run only against a COPY first. Verify row counts + score integrity.
--     Nothing runs against production without Serkan's schema+migration PR review.
--
-- ID STRATEGY: tasks/task_ratings/task_rating_skills/profiles are already UUID,
-- so this migration reuses the original IDs directly on the new tables —
-- no mapping table needed for those. `skills` is SERIAL INTEGER -> capabilities
-- is UUID, so a temporary bridge column is used for that one join and dropped
-- at the end.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 0. PRE-FLIGHT CHECKS — run these manually first, do not skip
-- =============================================================================
-- Expect these to return the row counts you'll compare against post-migration.
--   SELECT COUNT(*) FROM tasks;
--   SELECT COUNT(*) FROM task_ratings;
--   SELECT COUNT(*) FROM task_rating_skills;
--   SELECT COUNT(*) FROM skills;
--   SELECT COUNT(*) FROM profiles;
--
-- CONFIRM BEFORE PROCEEDING: the legacy `ratings` table (pre-normalization,
-- superseded by task_ratings/task_rating_skills per migrate-ratings-schema.sql)
-- is not migrated by this script. Verify it's genuinely inactive:
--   SELECT COUNT(*) FROM ratings;
--   SELECT MAX(created_at) FROM ratings;
-- If this table has recent/non-trivial data, STOP and confirm with the team
-- before proceeding — this script assumes it is fully superseded.

-- =============================================================================
-- 1. skills -> capabilities
-- =============================================================================
-- Temporary bridge column to join legacy integer skill IDs to new UUID capability IDs.
ALTER TABLE capabilities ADD COLUMN IF NOT EXISTS legacy_skill_id INTEGER;

INSERT INTO capabilities (name, description, category, active, legacy_skill_id)
SELECT
  label,               -- label -> name, per feedback Q3
  description,
  oulu_domain,         -- best available current mapping for "category"
  TRUE,                -- no "active" flag on legacy skills; default active
  id
FROM skills
ON CONFLICT (name) DO NOTHING;

-- Sanity check: every legacy skill should now have a capability row.
-- SELECT COUNT(*) FROM skills s
--   WHERE NOT EXISTS (SELECT 1 FROM capabilities c WHERE c.legacy_skill_id = s.id);
-- Expect 0.

-- =============================================================================
-- 2. tasks -> actions
-- =============================================================================
-- Status mapping is a best-effort guess for two values (`closed`, `in_progress`)
-- that don't have a clean 1:1 target in the new action_status enum.
-- FLAG FOR CONFIRMATION during dry-run review — do not treat as final:
--   draft        -> Draft
--   open         -> Shared        (task is live/shared for requests)
--   in_progress  -> Shared        (best guess — still active, no better match)
--   submitted    -> Submitted
--   graded       -> Evaluated
--   closed       -> Draft         (best guess — ambiguous; "closed" could mean
--                                   cancelled/archived rather than completed.
--                                   Confirm actual intended semantics before
--                                   trusting this mapping on real data.)
--
-- difficulty is intentionally NULL for all migrated actions — skill_level is
-- NOT difficulty (different concept/scale) and is not mapped, per feedback.

INSERT INTO actions (
  id, creator_profile_id, action_title, description, expected_outcome,
  difficulty, status, due_date, created_at
)
SELECT
  t.id,                -- reuse original UUID
  t.creator,
  t.title,
  t.description,
  NULL,                -- expected_outcome did not exist in legacy tasks
  NULL,                -- difficulty = NULL for all migrated legacy actions
  CASE t.status
    WHEN 'draft'       THEN 'Draft'
    WHEN 'open'        THEN 'Shared'
    WHEN 'in_progress' THEN 'Shared'
    WHEN 'submitted'   THEN 'Submitted'
    WHEN 'graded'      THEN 'Evaluated'
    WHEN 'closed'      THEN 'Draft'
    ELSE 'Draft'
  END::action_status,
  t.due_date,
  t.created_at
FROM tasks t
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. tasks.skills (INTEGER[]) -> action_capabilities
-- =============================================================================
-- The legacy array of skill IDs on each task becomes join-table rows.
-- ai_suggested/user_confirmed default to FALSE/TRUE since these were
-- creator-selected at task creation, not AI-suggested.

INSERT INTO action_capabilities (action_id, capability_id, ai_suggested, user_confirmed, created_at)
SELECT
  t.id,
  c.id,
  FALSE,
  TRUE,
  t.created_at
FROM tasks t
CROSS JOIN LATERAL unnest(t.skills) AS legacy_skill_id
JOIN capabilities c ON c.legacy_skill_id = legacy_skill_id
WHERE t.skills IS NOT NULL
ON CONFLICT (action_id, capability_id) DO NOTHING;

-- =============================================================================
-- 4. task_ratings -> evaluations
-- =============================================================================
-- KNOWN GAPS in legacy data — flagged, not silently guessed around:
--
--   submission_id: task_ratings has NO submission_id column in the live schema.
--     This migration infers it via best-effort match: the most recent
--     submission for the same task+contributor at or before the evaluation
--     timestamp. This is a HEURISTIC, not a guaranteed-correct linkage.
--     Verify manually for any task with multiple submissions per user.
--
--   evaluator_role: task_ratings does not store this at all. Migrated rows
--     will have evaluator_role = NULL. If this is needed for reporting on
--     historical data, it cannot be backfilled from existing data and would
--     need a separate decision (e.g. leave NULL vs. infer from task role).
--
--   verification_tier / evaluation_weight / difficulty_multiplier /
--   verification_reference: these are new concepts that did not exist before
--     the verification layer. Set to NULL for all migrated rows.
--     DECISION (Cyprian): leave NULL. Historical evaluations will NOT
--     contribute to profile_capability_scores once the Capability Engine
--     runs, unless explicitly backfilled later. The platform effectively
--     starts capability scoring from zero at migration time; only
--     evaluations created after go-live (with real verification-layer
--     weights) count. This is a product-visible behavior change — flag it
--     in the migration PR so Serkan/the team see it explicitly rather than
--     discovering it after the fact.
--
--   status: task_ratings has no status field; existence of the row implies
--     a completed evaluation session, so this maps to 'Completed'.

INSERT INTO evaluations (
  id, action_id, submission_id, evaluator_profile_id, evaluator_role,
  evaluator_familiarity, verification_tier, evaluation_weight,
  difficulty_multiplier, verification_reference, status, evaluated_at
)
SELECT
  tr.id,               -- reuse original UUID
  tr.task_id,
  (
    SELECT s.id FROM submissions s
    WHERE s.action_id = tr.task_id
      AND s.contributor_profile_id = tr.rated_user_id
      AND s.submitted_at <= tr.created_at
    ORDER BY s.submitted_at DESC
    LIMIT 1
  ),                   -- best-effort inferred submission_id — verify manually
  tr.rater_id,
  NULL,                -- evaluator_role: not present in legacy data
  NULL,                -- evaluator_familiarity: no equivalent legacy field
  NULL,                -- verification_tier: new concept, not in legacy data
  NULL,                -- evaluation_weight: NULL by decision, see comment above
  NULL,                -- difficulty_multiplier: NULL by decision, see comment above
  NULL,                -- verification_reference: on-chain hash fields intentionally
                        -- NOT carried over (verification layer's domain, per feedback)
  'Completed',
  tr.created_at
FROM task_ratings tr
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. task_rating_skills -> evaluation_scores
-- =============================================================================
-- stars (1-5) -> score (kept as-is; new column allows 0-5, legacy values are 1-5).
-- comment is NULL — legacy data has no per-skill feedback text field.
-- tx_hash / on_chain intentionally NOT carried over (verification layer's domain).

INSERT INTO evaluation_scores (id, evaluation_id, capability_id, score, comment, created_at)
SELECT
  trs.id,              -- reuse original UUID
  trs.rating_id,
  c.id,
  trs.stars,
  NULL,
  trs.created_at
FROM task_rating_skills trs
JOIN capabilities c ON c.legacy_skill_id = trs.skill_id
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. Intentionally NOT migrated by this script
-- =============================================================================
-- profile_capability_scores: this is a DERIVED/computed table, not a raw copy.
--   Its population is the Capability Engine's job (Week 4/5), using the
--   deterministic aggregation formula from André/Serkan's engine spec.
--   Do not backfill this table with a naive average in this migration —
--   run the real engine against the migrated evaluation_scores once the
--   formula (and the evaluation_weight backfill decision above) is settled.
--
-- capability_history: starts empty going forward. There is no reliable
--   historical event log in the legacy schema to reconstruct past score
--   changes from, so history begins accumulating only from this point on.
--
-- Legacy `ratings` table: not migrated (see pre-flight check above) —
--   assumed fully superseded by task_ratings/task_rating_skills.
--
-- xp columns (ratings.xp, task_ratings.xp): not migrated anywhere, per
--   explicit instruction to drop XP everywhere.
--
-- on-chain / hash fields (rating_session_hash, task_id_hash, subject_id_hash,
--   tx_hash, on_chain): not carried into the app schema — verification
--   layer's domain, not the Capability Engine's.

COMMIT;

-- =============================================================================
-- 7. Post-migration verification queries — run after COMMIT
-- =============================================================================
-- Row counts should match source counts from the pre-flight checks:
--   SELECT COUNT(*) FROM actions;              -- compare to COUNT(*) FROM tasks
--   SELECT COUNT(*) FROM evaluations;           -- compare to COUNT(*) FROM task_ratings
--   SELECT COUNT(*) FROM evaluation_scores;     -- compare to COUNT(*) FROM task_rating_skills
--   SELECT COUNT(*) FROM capabilities;          -- compare to COUNT(*) FROM skills
--
-- Score integrity spot-check — legacy stars vs migrated score should be identical:
--   SELECT trs.stars, es.score FROM task_rating_skills trs
--     JOIN evaluation_scores es ON es.id = trs.id
--     WHERE trs.stars != es.score;
--   Expect 0 rows.
--
-- Submission-linkage coverage — how many evaluations got a submission_id match:
--   SELECT
--     COUNT(*) AS total_evaluations,
--     COUNT(submission_id) AS matched_submissions,
--     COUNT(*) - COUNT(submission_id) AS unmatched
--   FROM evaluations;
--   Investigate the unmatched rows manually before trusting this data downstream.
--
-- Action-capability coverage — every legacy task.skills entry should have
-- produced a join row:
--   SELECT t.id, array_length(t.skills, 1) AS legacy_skill_count,
--          COUNT(ac.id) AS migrated_join_rows
--   FROM tasks t
--   LEFT JOIN action_capabilities ac ON ac.action_id = t.id
--   WHERE t.skills IS NOT NULL
--   GROUP BY t.id, t.skills
--   HAVING array_length(t.skills, 1) != COUNT(ac.id);
--   Expect 0 rows.
--
-- Once verified, the temporary bridge column can be dropped:
--   ALTER TABLE capabilities DROP COLUMN legacy_skill_id;
-- (Keep it until you're fully confident no further migration re-runs are needed —
-- it's harmless to leave temporarily, same caution the team used for
-- ratings.skills_deprecated / ratings.cid_deprecated.)
