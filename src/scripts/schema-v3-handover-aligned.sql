-- =============================================================================
-- Talent3X — Canonical Schema v3 (revised per v1.6 DEV Handover, 14 July 2026)
-- =============================================================================
-- Supersedes schema-v2-capability-engine.sql. This revision incorporates the
-- authoritative handover: 119 fixed capabilities, 497 fixed skills, packages,
-- rubrics, scoring_policy-as-config, activation logic, org hierarchy, and
-- binding rules R1-R11.
--
-- ==================== STATUS OF THIS REVISION ====================
-- All 4 blocking items from the prior review are RESOLVED (feedback received
-- 20 July 2026). This revision applies those decisions directly rather than
-- leaving them flagged:
--   (A) RESOLVED — R9 is the sole, authoritative scoring mechanism. The
--       earlier verification-layer weighting inputs (evaluation_weight,
--       difficulty_multiplier as separate scoring factors) are the
--       DEPRECATED model and must not be implemented. evaluator_verification_tier
--       is still stored on every evaluation, but is explicitly weight-neutral —
--       it does not feed into the score.
--   (B) RESOLVED — actions.status is Draft -> Submitted -> Evaluated -> Verified.
--       'Shared' is dropped entirely; sharing/visibility is handled separately
--       via org_visibility consent, not via a status value.
--   (C) RESOLVED — one action can span multiple capabilities. Evaluation is
--       per capability: one evaluation row per (action, evaluator, capability).
--       This matches what was already built — no structural change needed here.
--
-- Non-blocking items also addressed:
--   - evaluator_role and evaluator_relationship enum values are CONFIRMED
--     directly from handover section 12 (not placeholders): evaluator_role
--     describes standing (PROFESSOR/COMPANY/MENTOR/CLIENT/PEER),
--     evaluator_relationship is MANAGER/PEER/DIRECT_REPORT/EXTERNAL/OTHER.
--   - Remaining enums (ai_involvement, evaluator_verification_tier, tier,
--     activation_scope) still need the actual `enums` sheet from the
--     ingestion .xlsx — counts/prose in the handover text are not sufficient
--     to finalize these. Still marked PLACEHOLDER below.
--   - Delete/edit conservative assumptions CONFIRMED correct: lock skill
--     selection after Draft, action_skills immutable once a first evaluation
--     exists, hard-delete only allowed for Draft-only actions.
--   - Share link / QR generation: confirmed OUT OF SCOPE for now. Invite
--     record + token is sufficient.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ENUMERATIONS
-- =============================================================================
-- Per section 3, sheet 6 ("enums"): ai_involvement (3), activation_scope (3),
-- tier (2), difficulty (4), evaluator_role (5 incl. CLIENT/PEER),
-- evaluator_verification_tier (4), org_visibility (2).
-- Exact value lists are NOT given in this handover text — only counts and
-- names. These are placeholders using the values implied elsewhere in the
-- doc; CONFIRM against the actual `enums` sheet in the ingestion file before
-- treating as final. Loading enums as literal Postgres ENUM types is a
-- judgment call for stability/indexing — the handover says "load as config"
-- for scoring_policy specifically, not enums; flag if enums should also be
-- config-driven rather than DB-level ENUM types.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_difficulty') THEN
    CREATE TYPE action_difficulty AS ENUM ('Foundational', 'Intermediate', 'Advanced', 'Exceptional');
  END IF;

  -- CONFIRMED from handover section 12 (not a placeholder): describes the
  -- evaluator's standing.
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluator_role') THEN
    CREATE TYPE evaluator_role AS ENUM ('PROFESSOR', 'COMPANY', 'MENTOR', 'CLIENT', 'PEER');
  END IF;

  -- CONFIRMED from handover section 12 (not a placeholder).
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluator_relationship') THEN
    CREATE TYPE evaluator_relationship AS ENUM ('MANAGER', 'PEER', 'DIRECT_REPORT', 'EXTERNAL', 'OTHER');
  END IF;

  -- PLACEHOLDER — confirm exact 4 values against the enums sheet.
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluator_verification_tier') THEN
    CREATE TYPE evaluator_verification_tier AS ENUM ('unverified', 'self_attested', 'verified', 'certified');
  END IF;

  -- PLACEHOLDER — confirm exact 3 values against the enums sheet.
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_involvement') THEN
    CREATE TYPE ai_involvement AS ENUM ('none', 'assisted', 'primary');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activation_scope') THEN
    CREATE TYPE activation_scope AS ENUM ('validated_pilot', 'launch_unvalidated', 'dormant');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'capability_tier') THEN
    CREATE TYPE capability_tier AS ENUM ('core', 'advanced'); -- PLACEHOLDER, tier has 2 values per sheet 6
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_visibility') THEN
    CREATE TYPE org_visibility AS ENUM ('yes', 'no');
  END IF;

  -- CONFIRMED: Draft -> Submitted -> Evaluated -> Verified. 'Shared' dropped —
  -- sharing/visibility is handled by org_visibility consent, not by status.
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN
    CREATE TYPE action_status AS ENUM ('Draft', 'Submitted', 'Evaluated', 'Verified');
  END IF;
END $$;

-- =============================================================================
-- 2. INGESTED REFERENCE TABLES (sheets 1-7 of the ingestion .xlsx)
-- =============================================================================
-- These tables are populated ONLY from 260713_Talent3X_DEV_Handover_Ingestion.xlsx,
-- ingested in sheet order, with a hard failure on any count mismatch
-- (capabilities=119, skills=497, packages=10, package_capabilities=124,
-- rubrics=714, enums=23, scoring_policy=23). Never ingest from any other file.

-- 2.1 capabilities — the scored entities (R1: the only thing that gets scored)
CREATE TABLE IF NOT EXISTS capabilities (
  capability_id    TEXT PRIMARY KEY,            -- immutable string, e.g. T3X-ACT-01
  name             TEXT UNIQUE NOT NULL,
  family           TEXT,
  tier             capability_tier,
  description      TEXT,                        -- hover text for analysis views
  activation_scope activation_scope NOT NULL,
  oulu_validated   BOOLEAN NOT NULL DEFAULT FALSE,
  version          TEXT,
  status           TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE capabilities IS
  'Populated only from the ingestion .xlsx (sheet 1, 119 rows). Never derived from the legacy app repo skills table. capability_id is immutable — capability rows change only via a new framework version from André (R3).';

-- 2.2 skills — unscored, user-facing aliases (R1, R2, R8)
CREATE TABLE IF NOT EXISTS skills (
  skill_id      TEXT PRIMARY KEY,                -- SK-001..SK-549, gaps intentional (R8: never renumbered)
  label         TEXT UNIQUE NOT NULL,             -- case-insensitive uniqueness enforced below (R2)
  capability_id TEXT NOT NULL REFERENCES capabilities(capability_id),
  description   TEXT,                             -- hover text at action creation + evaluator view
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- R1: NO score-typed column is permitted on this table, ever. A ticket
  -- implying skill-level scoring is escalated to André, not built.
);

-- R2: case-insensitive uniqueness on label, enforced at DB level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_label_ci ON skills (LOWER(label));

COMMENT ON TABLE skills IS
  'Populated only from the ingestion .xlsx (sheet 2, 497 rows). R1: no score column ever. R8: skill_id values are never renumbered, even if rows are later deprecated.';

-- 2.3 packages — commercial bundles, gate ORG analytics only (never individual evidence-building)
CREATE TABLE IF NOT EXISTS packages (
  package_id  TEXT PRIMARY KEY,   -- U1-U3, E1-E7
  name        TEXT NOT NULL,
  segment     TEXT,
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 package_capabilities — composite PK, many-to-many
CREATE TABLE IF NOT EXISTS package_capabilities (
  package_id    TEXT NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
  capability_id TEXT NOT NULL REFERENCES capabilities(capability_id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, capability_id)
);

-- 2.5 rubrics — anchor text per capability per level, versioned
CREATE TABLE IF NOT EXISTS rubrics (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capability_id  TEXT NOT NULL REFERENCES capabilities(capability_id) ON DELETE CASCADE,
  level          SMALLINT NOT NULL CHECK (level >= 0 AND level <= 5),
  anchor_text    TEXT NOT NULL,
  rubric_version TEXT NOT NULL,   -- e.g. '0.9-draft', bumps to '1.0' after calibration
  CONSTRAINT unique_rubric_version UNIQUE (capability_id, level, rubric_version)
);

COMMENT ON TABLE rubrics IS
  'All 119 capabilities x levels 0-5 = 714 rows expected. Scores for paying customers must reference rubric_version 1.0 or later (see section 9). anchor_text must never describe effort, potential or personality — evidence quality only.';

-- 2.6 enums — reference/lookup data from sheet 6 (informational; see also
-- section 1 above where the same enums are additionally materialized as
-- Postgres ENUM types for FK/constraint use — keep both in sync manually
-- until confirmed whether enums should be config-driven instead).
CREATE TABLE IF NOT EXISTS enum_reference (
  enum_name TEXT NOT NULL,
  value     TEXT NOT NULL,
  meaning   TEXT,
  PRIMARY KEY (enum_name, value)
);

-- 2.7 scoring_policy — loaded as config, NEVER hardcoded in application code
CREATE TABLE IF NOT EXISTS scoring_policy (
  parameter TEXT PRIMARY KEY,
  value     TEXT NOT NULL,
  notes     TEXT
);

COMMENT ON TABLE scoring_policy IS
  'Scales, confidence formula constants, difficulty weights, aggregation rules, display thresholds, evaluator rules, privacy (consent, k-anonymity), freemium unit. Application code reads these as config — never hardcode a weight or threshold (section 3, section 10 CI check).';

-- =============================================================================
-- 3. PROFILES / USERS
-- =============================================================================
-- profiles.id continues to reference auth.users, matching the live repo's
-- existing pattern. `free_actions_submitted` added per section 4 — counts
-- ACTIONS SUBMITTED FOR EVALUATION only (never evaluations received).
-- Paywall enforcement stays behind a feature flag, OFF at launch — this
-- migration adds only the counter column, no enforcement logic.

CREATE TABLE IF NOT EXISTS profiles (
  id                       UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role                     TEXT NOT NULL DEFAULT 'Contributor',
  free_actions_submitted   INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN profiles.free_actions_submitted IS
  'Increments on action submission only (N=10 threshold per section 4). Paywall behind feature flag, OFF at launch — do not wire up enforcement yet.';

-- =============================================================================
-- 4. ACTIONS + ACTION_SKILLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS actions (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_title        TEXT NOT NULL,
  description         TEXT,
  expected_outcome    TEXT,
  ai_involvement      ai_involvement NOT NULL,       -- R5: required at creation, always
  difficulty_declared action_difficulty,               -- creator-declared; confirmed value lives on evaluations (R9)
  org_visibility      org_visibility NOT NULL,        -- R10: individual consent, set at creation
  status              action_status DEFAULT 'Draft',  -- STATUS OPEN (B) — enum values unconfirmed
  due_date            TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN actions.org_visibility IS
  'R10: consent set by the individual at creation. Evidence with org_visibility=no NEVER appears in org analytics regardless of package activation, including retroactively. Enforce this filter at every org-facing query, not just at write time.';
COMMENT ON COLUMN actions.difficulty_declared IS
  'Creator-declared only. R9: the DIFFICULTY DRIVING THE SCORING WEIGHT is the evaluator-confirmed value (evaluations.difficulty_confirmed), never this one — anti-gaming. Do not use this column in any scoring calculation.';

-- action_skills — replaces the earlier action_capabilities design (R4).
-- Users select SKILLS; the capability is resolved and SNAPSHOTTED at
-- selection time. Later remaps to the skill->capability mapping must never
-- rewrite this history.
CREATE TABLE IF NOT EXISTS action_skills (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_id              UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  skill_id               TEXT NOT NULL REFERENCES skills(skill_id),
  capability_id_resolved TEXT NOT NULL REFERENCES capabilities(capability_id),
  created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_action_skill UNIQUE (action_id, skill_id)
);

COMMENT ON COLUMN action_skills.capability_id_resolved IS
  'R4: snapshot of skill->capability mapping at selection time. If the mapping changes in a future framework version, THIS VALUE DOES NOT CHANGE — historical evidence keeps the mapping true at creation time.';

-- =============================================================================
-- 5. SUBMISSIONS (unchanged concept from earlier schema; not redefined by
--    the handover, which explicitly puts detailed evidence-artifact schemas
--    out of scope — "will be provided by André when that module is scoped")
-- =============================================================================

CREATE TABLE IF NOT EXISTS submissions (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_id              UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  contributor_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evidence_storage_mode  TEXT,   -- Store / Hash Only / External
  evidence_hash          TEXT,
  status                 TEXT DEFAULT 'Submitted',
  submitted_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. EVALUATIONS (RESOLVED — R9 confirmed as sole scoring mechanism, see top of file)
-- =============================================================================
-- Collapses the earlier two-table (evaluations + evaluation_scores) design
-- into one capability-scoped table, matching section 4's entity list
-- literally. This is a structural change from the prior PR — flagged for
-- explicit review, not silently decided.

CREATE TABLE IF NOT EXISTS evaluations (
  evaluation_id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_id                   UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  submission_id                UUID REFERENCES submissions(id) ON DELETE SET NULL,
  evaluator_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluator_role               evaluator_role NOT NULL,
  evaluator_relationship        evaluator_relationship NOT NULL,   -- snapshotted at creation
  evaluator_verification_tier  evaluator_verification_tier,        -- stored on every evaluation; weight-NEUTRAL in v1.1 per R9
  capability_id                TEXT NOT NULL REFERENCES capabilities(capability_id),
  score                        SMALLINT NOT NULL CHECK (score >= 0 AND score <= 5),
  evidence_quality             SMALLINT NOT NULL CHECK (evidence_quality >= 0 AND evidence_quality <= 5),
  difficulty_confirmed         action_difficulty NOT NULL,   -- R9: THIS drives the scoring weight, never difficulty_declared
  comment                      TEXT,
  rubric_version                TEXT NOT NULL,
  scoring_version                TEXT NOT NULL,
  created_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- R6: comment required at scores 0, 1 and 5.
  CONSTRAINT comment_required_at_extremes CHECK (
    (score NOT IN (0, 1, 5)) OR (comment IS NOT NULL AND length(trim(comment)) > 0)
  ),

  -- R6/R9: one evaluation per evaluator per action per subject (capability).
  -- The 10-minute cooldown between evaluation attempts is a TIME-based rule
  -- and cannot be expressed as a static UNIQUE constraint — enforce at the
  -- application layer (or via a trigger checking recent rows), not here.
  CONSTRAINT unique_evaluator_action_capability UNIQUE (action_id, evaluator_id, capability_id)
);

COMMENT ON TABLE evaluations IS
  'CONFIRMED: one row per (action, evaluator, capability) — this is the sole model, not a placeholder pending a decision. R9 is the sole, authoritative scoring mechanism (capability_score = sum(score*w)/sum(w), w = difficulty_weight * confidence_weight, computed from evidence_quality and evaluator-confirmed difficulty). The earlier verification-layer weighting inputs (evaluation_weight, difficulty_multiplier as separate scoring factors) are the DEPRECATED model and must not be implemented. evaluator_verification_tier is stored on every evaluation but is explicitly weight-neutral — it never feeds into the score.';
COMMENT ON COLUMN evaluations.difficulty_confirmed IS
  'R9: the difficulty value that DRIVES THE SCORING WEIGHT. Always the evaluator-confirmed value, never actions.difficulty_declared — this is an explicit anti-gaming measure.';

-- R6: no self-evaluation (evaluator_id != action creator). Enforced via
-- trigger since it requires a cross-table check not expressible as a plain
-- CHECK constraint.
CREATE OR REPLACE FUNCTION prevent_self_evaluation() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM actions a
    WHERE a.id = NEW.action_id AND a.creator_profile_id = NEW.evaluator_id
  ) THEN
    RAISE EXCEPTION 'R6 violation: evaluator_id must not equal the action creator (no self-evaluation)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_self_evaluation ON evaluations;
CREATE TRIGGER trg_prevent_self_evaluation
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION prevent_self_evaluation();

-- =============================================================================
-- 6a. EVALUATOR_ASSIGNMENTS (Week 2 addition — NOT specified by the handover)
-- =============================================================================
-- The handover describes evaluations happening and evaluator_role/
-- evaluator_relationship being captured, but does not define an assignment/
-- invitation entity. This table restores that piece (needed for Week 2's
-- "evaluator workflow" deliverable: invite, track acceptance, completion)
-- using the same shape as the pre-handover schema. FLAG FOR REVIEW: confirm
-- with André this doesn't conflict with anything planned for the
-- evaluation-request flow he references in section 12 ("request evaluations").
-- STILL OPEN — not addressed by the 20 July feedback round.
--
-- Compatible with the confirmed multi-capability model: one assignment per
-- (action, evaluator) here, with the evaluator then submitting one
-- evaluation row per capability under that single assignment (see the
-- evaluations table above). No change needed to this table for that item.

CREATE TABLE IF NOT EXISTS evaluator_assignments (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_id            UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  evaluator_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,   -- nullable: invitee may not have an account yet
  evaluator_email      TEXT,                                              -- for invites to non-users
  evaluator_role       evaluator_role,
  evaluator_relationship evaluator_relationship,
  invitation_status    TEXT NOT NULL DEFAULT 'Sent',   -- Sent / Opened / Accepted / Completed / Declined
  invitation_token     TEXT UNIQUE,
  invited_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at         TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_evaluator_assignment UNIQUE (action_id, evaluator_profile_id)
);

ALTER TABLE evaluator_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evaluators can view their own assignments" ON evaluator_assignments;
CREATE POLICY "Evaluators can view their own assignments" ON evaluator_assignments
  FOR SELECT USING (auth.uid() = evaluator_profile_id);

DROP POLICY IF EXISTS "Action creators can view assignments on their actions" ON evaluator_assignments;
CREATE POLICY "Action creators can view assignments on their actions" ON evaluator_assignments
  FOR SELECT USING (action_id IN (SELECT id FROM actions WHERE creator_profile_id = auth.uid()));

DROP POLICY IF EXISTS "Action creators can create assignments on their actions" ON evaluator_assignments;
CREATE POLICY "Action creators can create assignments on their actions" ON evaluator_assignments
  FOR INSERT WITH CHECK (action_id IN (SELECT id FROM actions WHERE creator_profile_id = auth.uid()));

DROP POLICY IF EXISTS "Evaluators can update their own assignment status" ON evaluator_assignments;
CREATE POLICY "Evaluators can update their own assignment status" ON evaluator_assignments
  FOR UPDATE USING (auth.uid() = evaluator_profile_id);

CREATE INDEX IF NOT EXISTS idx_evaluator_assignments_action ON evaluator_assignments(action_id);
CREATE INDEX IF NOT EXISTS idx_evaluator_assignments_evaluator ON evaluator_assignments(evaluator_profile_id);

-- =============================================================================
-- 7. OBSERVATIONS — unscored, never adjust the evaluated capability score
-- =============================================================================

CREATE TABLE IF NOT EXISTS observations (
  observation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id  UUID NOT NULL REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
  capability_id  TEXT NOT NULL REFERENCES capabilities(capability_id),
  note           TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE observations IS
  'Unscored cross-capability observations. Must never feed into or adjust the evaluated capability score for any capability, including the one under evaluation.';

-- =============================================================================
-- 8. PROFILE CAPABILITY SCORES — canonical output, per R9's formula
-- =============================================================================

CREATE TABLE IF NOT EXISTS profile_capability_scores (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  capability_id          TEXT NOT NULL REFERENCES capabilities(capability_id) ON DELETE CASCADE,
  capability_score       NUMERIC,           -- R9: sum(score*w)/sum(w)
  evaluation_count       INTEGER NOT NULL DEFAULT 0,
  display_status         TEXT,              -- 'full' at >=3 evaluations, 'provisional' at 1-2 (section 5)
  scoring_version        TEXT,
  last_updated           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_profile_capability_score UNIQUE (profile_id, capability_id)
);

COMMENT ON TABLE profile_capability_scores IS
  'R9: capability_score = sum(score*w)/sum(w), w = difficulty_weight * confidence_weight, confidence_weight = 0.5 + 0.1*evidence_quality. difficulty_weight comes from scoring_policy, keyed by evaluations.difficulty_confirmed. No median fallback. All raw evaluation inputs must remain queryable so weights can be re-fitted under a new scoring_version. display_status must be provisional (clearly marked) below 3 evaluations, full at >=3 — never silently show a full-looking score below that threshold.';

-- =============================================================================
-- 9. ORGANISATION STRUCTURE, CONTRACTS, ACTIVATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS org_contracts (
  contract_id TEXT PRIMARY KEY,
  org_id      UUID NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_contract_packages (
  org_id       UUID NOT NULL,
  contract_id  TEXT NOT NULL REFERENCES org_contracts(contract_id) ON DELETE CASCADE,
  package_id   TEXT NOT NULL REFERENCES packages(package_id),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (contract_id, package_id)
);

COMMENT ON TABLE org_contract_packages IS
  'Drives commercial_scope filtering (section 6, Check 2): org analytics endpoints filter capabilities through org_contract_packages JOIN package_capabilities. Individual evidence outside activated packages still exists and is visible on the individual''s own profile (Check 1) — it is simply never returned by ORG-facing endpoints. Activating a new package makes existing matching evidence visible in org analytics retroactively — this is intended, not a bug.';

CREATE TABLE IF NOT EXISTS org_units (
  unit_id        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id         UUID NOT NULL,
  parent_unit_id UUID REFERENCES org_units(unit_id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_unit_members (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id    UUID NOT NULL REFERENCES org_units(unit_id) ON DELETE CASCADE,
  job_level  TEXT,   -- R11: customer data, free-text, org-defined — NEVER normalised across orgs, NEVER weight-bearing
  member_from DATE,
  member_to   DATE
);

COMMENT ON COLUMN org_unit_members.job_level IS
  'R11: corporate titles/levels are CUSTOMER DATA, not Talent3X ontology. Used only for dashboard slicing and sampling matrices. Must never appear in any scoring formula — add a schema/code assertion for this per section 10''s CI checklist.';

-- =============================================================================
-- 10. ROW LEVEL SECURITY
-- =============================================================================
-- NOTE: this section carries over the RLS approach from schema-v2, adapted
-- to the new/renamed tables. New tables introduced by this revision
-- (capabilities, skills, packages, package_capabilities, rubrics,
-- enum_reference, scoring_policy, observations, org_contracts,
-- org_contract_packages, org_units, org_unit_members) need policies added —
-- drafted below where the access pattern is unambiguous from the handover's
-- role table (section 12); flagged where it isn't.

ALTER TABLE profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE capabilities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_capabilities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_policy             ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_skills              ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_capability_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_units                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_unit_members           ENABLE ROW LEVEL SECURITY;

-- Public reference data — readable by any authenticated user (R7: dormant
-- rows excluded from every picker/individual-facing view).
DROP POLICY IF EXISTS "Non-dormant capabilities are readable" ON capabilities;
CREATE POLICY "Non-dormant capabilities are readable" ON capabilities
  FOR SELECT USING (activation_scope != 'dormant');

DROP POLICY IF EXISTS "Skills of non-dormant capabilities are readable" ON skills;
CREATE POLICY "Skills of non-dormant capabilities are readable" ON skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM capabilities c WHERE c.capability_id = skills.capability_id AND c.activation_scope != 'dormant')
  );

DROP POLICY IF EXISTS "Rubrics are readable" ON rubrics;
CREATE POLICY "Rubrics are readable" ON rubrics
  FOR SELECT USING (TRUE);

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- actions — Check 1 (profile_scope) applies at the application layer when
-- selecting skills; RLS here governs row visibility only.
DROP POLICY IF EXISTS "Creators can view their own actions" ON actions;
CREATE POLICY "Creators can view their own actions" ON actions
  FOR SELECT USING (auth.uid() = creator_profile_id);

DROP POLICY IF EXISTS "Creators can insert their own actions" ON actions;
CREATE POLICY "Creators can insert their own actions" ON actions
  FOR INSERT WITH CHECK (auth.uid() = creator_profile_id);

DROP POLICY IF EXISTS "Creators can update their own actions" ON actions;
CREATE POLICY "Creators can update their own actions" ON actions
  FOR UPDATE USING (auth.uid() = creator_profile_id);

-- action_skills
DROP POLICY IF EXISTS "Visible if parent action is visible" ON action_skills;
CREATE POLICY "Visible if parent action is visible" ON action_skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actions WHERE actions.id = action_skills.action_id AND actions.creator_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Creators can manage skills on their own actions" ON action_skills;
CREATE POLICY "Creators can manage skills on their own actions" ON action_skills
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM actions WHERE actions.id = action_skills.action_id AND actions.creator_profile_id = auth.uid())
  );

-- evaluations — evaluator owns their own evaluation rows; action creator can
-- see evaluations on their own actions EXCEPT this must respect "evaluator
-- sees only the action under evaluation, not the subject's full profile"
-- (section 12) — that constraint is about the EVALUATOR's visibility of the
-- CONTRIBUTOR's profile, not about this table directly; flagged for
-- follow-up at the API layer, not purely RLS.
DROP POLICY IF EXISTS "Evaluators can view evaluations they created" ON evaluations;
CREATE POLICY "Evaluators can view evaluations they created" ON evaluations
  FOR SELECT USING (auth.uid() = evaluator_id);

DROP POLICY IF EXISTS "Contributors can view evaluations on their actions" ON evaluations;
CREATE POLICY "Contributors can view evaluations on their actions" ON evaluations
  FOR SELECT USING (action_id IN (SELECT id FROM actions WHERE creator_profile_id = auth.uid()));

DROP POLICY IF EXISTS "Evaluators can insert their own evaluations" ON evaluations;
CREATE POLICY "Evaluators can insert their own evaluations" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() = evaluator_id);

-- profile_capability_scores — owner read-only; engine writes (service role)
DROP POLICY IF EXISTS "Profiles can view their own capability scores" ON profile_capability_scores;
CREATE POLICY "Profiles can view their own capability scores" ON profile_capability_scores
  FOR SELECT USING (auth.uid() = profile_id);

-- org_units / org_unit_members / org_contract_packages: FLAGGED — full
-- org_viewer / org_admin policy set depends on how org membership maps to
-- auth.uid() (no org-role table defined yet in this schema). Needs its own
-- design pass once that mapping is confirmed; do not treat the absence of
-- policies here as accidental — it is an explicit gap, not a silent one
-- (avoids the "RLS enabled, no policy = deny-all" trap called out in the
-- Week 1 feedback, since these tables have no data path yet regardless).

-- =============================================================================
-- 11. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_capabilities_activation_scope ON capabilities(activation_scope);
CREATE INDEX IF NOT EXISTS idx_skills_capability_id ON skills(capability_id);
CREATE INDEX IF NOT EXISTS idx_package_capabilities_capability ON package_capabilities(capability_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_capability_id ON rubrics(capability_id);

CREATE INDEX IF NOT EXISTS idx_actions_creator ON actions(creator_profile_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_action_skills_action ON action_skills(action_id);
CREATE INDEX IF NOT EXISTS idx_action_skills_skill ON action_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_action_skills_capability_resolved ON action_skills(capability_id_resolved);

CREATE INDEX IF NOT EXISTS idx_evaluations_action ON evaluations(action_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_capability ON evaluations(capability_id);

CREATE INDEX IF NOT EXISTS idx_profile_capability_scores_profile ON profile_capability_scores(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_capability_scores_capability ON profile_capability_scores(capability_id);

CREATE INDEX IF NOT EXISTS idx_org_units_parent ON org_units(parent_unit_id);
CREATE INDEX IF NOT EXISTS idx_org_unit_members_unit ON org_unit_members(unit_id);
CREATE INDEX IF NOT EXISTS idx_org_unit_members_profile ON org_unit_members(profile_id);

-- =============================================================================
-- 12. CI / ACCEPTANCE ASSERTIONS (section 10) — sketch only, run on ingest + nightly
-- =============================================================================
-- These are the schema-expressible checks from section 10. Full CI
-- (counts, scope distribution, freemium counter behaviour, etc.) still
-- needs to be wired into the actual ingest + nightly job — this section is
-- a starting reference, not a complete implementation.

-- Assertion: no numeric score/level column exists on skills (R1).
-- Run as a CI query, not a DB constraint:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'skills' AND data_type IN ('integer','numeric','smallint','bigint');
--   Expect 0 rows.

-- Assertion: job_level never appears in any scoring formula (R11) — this is
-- a CODE assertion (grep/review), not something the schema alone can
-- guarantee. Flag in review checklist.