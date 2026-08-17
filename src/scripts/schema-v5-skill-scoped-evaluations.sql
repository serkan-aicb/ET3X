-- =============================================================================
-- Talent3X — Schema v5: evaluations becomes SKILL-scoped (R1/R6/R9, v1.10)
-- =============================================================================
-- Resolves the R1 contradiction Cyprian escalated before writing the
-- evaluation-submission endpoint. André's answer (b), confirmed in writing,
-- built against DEV Handover v1.10 / Action Flow Spec v10 / diagram (labelled
-- v9, content matches v10):
--
--   - Skills DO get scored. `evaluations` moves from one row per
--     (action, evaluator, capability) to one row per (action, evaluator,
--     skill) — skill_id is now required, capability_id stays as a
--     DENORMALIZED snapshot of that skill's resolved capability at scoring
--     time (same snapshot principle as R4 / action_skills.capability_id_resolved
--     — never re-look-up skill->capability live).
--   - R1 itself narrows, it doesn't disappear: still no score column on the
--     skills CATALOGUE table, still no per-skill rubric. The Evaluator judges
--     every Skill against its Capability's rubric anchors — there is no
--     skill-specific rubric, so the 497-shadow-rubric risk R1 exists to
--     prevent still holds.
--   - session_id groups every skill-row an Evaluator submits together for one
--     action into one atomic submission — the unit the 10-min cooldown /
--     one-evaluation-per-evaluator-per-action rule applies to (R6).
--   - Comment-mandatory-at-0/1/5 (R6) needed NO change here — it was already
--     a per-ROW CHECK constraint, and a row now means "one skill", so it's
--     automatically correct under the new model.
--
-- ⚠️ FLAGGED, NOT SILENTLY RESOLVED — one open item: André's own emailed
-- clarification says the R9 Confirmed threshold counts DISTINCT SESSIONS
-- (citing Handover v1.9 as final), but the v1.10 documents attached in the
-- same message explicitly supersede that exact rule with a raw ROW COUNT
-- ("session and evaluator irrelevant... this replaces the v1.9 rule").
-- This migration does not encode that threshold at all — it's an
-- application-layer decision (see src/lib/scoring/capability-engine.ts),
-- built against v1.10 (row count) pending a one-line confirmation from
-- André, given this exact line has now reversed twice.
--
-- Assumes zero existing rows in `evaluations` — the evaluation-submission
-- endpoint has been blocked on this exact question the whole time this table
-- has existed, so there should be nothing to backfill. The guard below turns
-- that assumption into a hard failure instead of a silent data-loss risk if
-- it's wrong.
-- =============================================================================

DO $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM evaluations;
  IF existing_count > 0 THEN
    RAISE EXCEPTION
      'evaluations has % existing row(s) — this migration assumes the table is empty (the endpoint has been blocked pending this exact decision). Do not run blind; write a backfill for skill_id/session_id first, or confirm these rows are safe to discard.',
      existing_count;
  END IF;
END $$;

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS skill_id   TEXT REFERENCES skills(skill_id),
  ADD COLUMN IF NOT EXISTS session_id UUID NOT NULL DEFAULT uuid_generate_v4();

-- skill_id is required going forward; added nullable above only so the
-- ALTER doesn't choke if this ever runs against a non-empty table despite
-- the guard, then tightened immediately since the guard above already
-- confirmed the table is empty.
ALTER TABLE evaluations
  ALTER COLUMN skill_id SET NOT NULL;

-- Old model: one row per (action, evaluator, capability). New model: one row
-- per (action, evaluator, skill) — a capability now accrues multiple rows
-- (one per rated skill under it), which is the entire point of the change.
ALTER TABLE evaluations
  DROP CONSTRAINT IF EXISTS unique_evaluator_action_capability;

ALTER TABLE evaluations
  ADD CONSTRAINT unique_evaluator_action_skill UNIQUE (action_id, evaluator_id, skill_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_skill ON evaluations(skill_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_session ON evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_capability ON evaluations(capability_id);

COMMENT ON TABLE evaluations IS
  'v1.10 — SKILL-scoped: one row per Skill rated (skill_id required), not one row per Capability. capability_id is DENORMALIZED from the Skill''s resolved capability at scoring time (same snapshot principle as R4) — the Evaluator always judges against that Capability''s rubric anchors, never a skill-specific rubric (R1 still holds in narrowed form). session_id groups every Skill-row an Evaluator submits together for one action into one atomic submission — the unit R6''s 10-min cooldown / one-evaluation-per-evaluator-per-action rule applies to. R9''s Provisional/Confirmed threshold counts rows resolving to a capability — see capability-engine.ts for the exact count and the open row-vs-session flag.';

COMMENT ON COLUMN evaluations.skill_id IS
  'R1/R6 (v1.10): the specific Skill this row scores. Judged against skill_id''s resolved Capability rubric (capability_id below), never a skill-specific rubric — none exists, by design.';

COMMENT ON COLUMN evaluations.session_id IS
  'R6: groups every Skill-row one Evaluator submits together, in one sitting, for one action. This — not evaluation_id — is the unit the 10-minute cooldown and "one evaluation per evaluator per action" rule apply to.';

COMMENT ON COLUMN evaluations.capability_id IS
  'DENORMALIZED snapshot of skill_id''s resolved capability at scoring time (same principle as action_skills.capability_id_resolved, R4) — never re-derive live from the skills table when reading historical rows.';
