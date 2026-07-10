-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ENUMERATIONS
-- =============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_difficulty') THEN
    -- Corrected per Week 1 feedback: Expert -> Exceptional
    CREATE TYPE action_difficulty AS ENUM ('Foundational', 'Intermediate', 'Advanced', 'Exceptional');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN
    CREATE TYPE action_status AS ENUM ('Draft', 'Shared', 'Submitted', 'Evaluated', 'Verified');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confidence_level') THEN
    CREATE TYPE confidence_level AS ENUM ('Low', 'Medium', 'High');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluation_status') THEN
    CREATE TYPE evaluation_status AS ENUM ('Completed', 'Verified');
  END IF;
END $$;

-- =============================================================================
-- 2. BASE TABLES (Profiles & Master Capabilities)
-- =============================================================================

-- Profiles (canonical — linked to Supabase auth, mirrors the live schema's pattern)
-- Decision: profiles.id references auth.users, matching the existing live table.
-- Flag in PR review if this should be decoupled instead.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'Contributor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Capability Framework
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. ACTION & EVIDENCE TABLES
-- =============================================================================

-- Actions (Universal Object / Evidence Trigger)
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_title TEXT NOT NULL,
  description TEXT,
  expected_outcome TEXT,
  difficulty action_difficulty,
  status action_status DEFAULT 'Draft',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action Capabilities (Mapping Actions to Capabilities)
CREATE TABLE IF NOT EXISTS action_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  ai_suggested BOOLEAN DEFAULT FALSE,
  user_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_action_capability UNIQUE (action_id, capability_id)
);

-- Evaluator Assignments
CREATE TABLE IF NOT EXISTS evaluator_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  evaluator_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluator_role TEXT, -- selected value only; allowed set supplied per vertical
  invitation_status TEXT DEFAULT 'Sent',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_evaluator_assignment UNIQUE (action_id, evaluator_profile_id)
);

-- Submissions (The Evidence)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  contributor_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evidence_storage_mode TEXT, -- Store / Hash Only / External
  evidence_hash TEXT,
  status TEXT DEFAULT 'Submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. EVALUATION TABLES
-- =============================================================================

-- Evaluations (The Assessment Session)
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  evaluator_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluator_role TEXT, -- selected value only; allowed set supplied per vertical

  evaluator_familiarity confidence_level, -- renamed from confidence_level per Week 1 feedback

  -- Written by the verification layer (external API, owned by André/Serkan).
  -- The engine consumes these as inputs — it does not compute them.
  -- Keep evaluation_weight (credibility) and difficulty_multiplier (achievement value)
  -- as separate fields; do not merge them into one number.
  verification_tier TEXT,
  evaluation_weight NUMERIC CHECK (evaluation_weight >= 0 AND evaluation_weight <= 1), -- credibility, 0-1, never exceeds 1
  difficulty_multiplier NUMERIC, -- achievement value, ~0.8-1.4, can exceed 1
  verification_reference TEXT,

  status evaluation_status DEFAULT 'Completed',
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluation Scores (Per-Capability Rating)
CREATE TABLE IF NOT EXISTS evaluation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5), -- corrected: integer, 0-5
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_evaluation_capability UNIQUE (evaluation_id, capability_id)
);

-- =============================================================================
-- 5. CAPABILITY RECORD & HISTORY TABLES
-- =============================================================================

-- Profile Capability Scores (The Central Intelligence Record)
CREATE TABLE IF NOT EXISTS profile_capability_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  average_score NUMERIC NOT NULL DEFAULT 0, -- kept as NUMERIC per feedback
  confidence confidence_level,
  evaluation_count INTEGER NOT NULL DEFAULT 0,
  highest_difficulty action_difficulty,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_profile_capability_score UNIQUE (profile_id, capability_id)
);

-- Capability History (Audit Log)
CREATE TABLE IF NOT EXISTS capability_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_capability_score_id UUID NOT NULL REFERENCES profile_capability_scores(id) ON DELETE CASCADE,
  previous_score NUMERIC,
  new_score NUMERIC,
  previous_confidence confidence_level,
  new_confidence confidence_level,
  evidence_id_added UUID REFERENCES evaluations(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_capability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 6.1 Policies — profiles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 6.2 Policies — capabilities (public read, admin-managed writes)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Capabilities are publicly readable" ON capabilities;
CREATE POLICY "Capabilities are publicly readable" ON capabilities
  FOR SELECT USING (active = true);

-- -----------------------------------------------------------------------------
-- 6.3 Policies — actions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Creators can view their own actions" ON actions;
CREATE POLICY "Creators can view their own actions" ON actions
  FOR SELECT USING (auth.uid() = creator_profile_id);

DROP POLICY IF EXISTS "Creators can insert their own actions" ON actions;
CREATE POLICY "Creators can insert their own actions" ON actions
  FOR INSERT WITH CHECK (auth.uid() = creator_profile_id);

DROP POLICY IF EXISTS "Creators can update their own actions" ON actions;
CREATE POLICY "Creators can update their own actions" ON actions
  FOR UPDATE USING (auth.uid() = creator_profile_id);

-- -----------------------------------------------------------------------------
-- 6.4 Policies — action_capabilities (follow parent action visibility)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Visible if parent action is visible" ON action_capabilities;
CREATE POLICY "Visible if parent action is visible" ON action_capabilities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actions WHERE actions.id = action_capabilities.action_id
            AND actions.creator_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Creators can manage capabilities on their own actions" ON action_capabilities;
CREATE POLICY "Creators can manage capabilities on their own actions" ON action_capabilities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM actions WHERE actions.id = action_capabilities.action_id
            AND actions.creator_profile_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 6.5 Policies — evaluator_assignments
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 6.6 Policies — submissions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Contributors can view their own submissions" ON submissions;
CREATE POLICY "Contributors can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = contributor_profile_id);

DROP POLICY IF EXISTS "Action creators can view submissions to their actions" ON submissions;
CREATE POLICY "Action creators can view submissions to their actions" ON submissions
  FOR SELECT USING (action_id IN (SELECT id FROM actions WHERE creator_profile_id = auth.uid()));

DROP POLICY IF EXISTS "Contributors can insert their own submissions" ON submissions;
CREATE POLICY "Contributors can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = contributor_profile_id);

-- -----------------------------------------------------------------------------
-- 6.7 Policies — evaluations
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Evaluators can view evaluations they created" ON evaluations;
CREATE POLICY "Evaluators can view evaluations they created" ON evaluations
  FOR SELECT USING (auth.uid() = evaluator_profile_id);

DROP POLICY IF EXISTS "Contributors can view evaluations on their actions" ON evaluations;
CREATE POLICY "Contributors can view evaluations on their actions" ON evaluations
  FOR SELECT USING (action_id IN (SELECT id FROM actions WHERE creator_profile_id = auth.uid()));

DROP POLICY IF EXISTS "Evaluators can insert their own evaluations" ON evaluations;
CREATE POLICY "Evaluators can insert their own evaluations" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() = evaluator_profile_id);

DROP POLICY IF EXISTS "Evaluators can update their own evaluations" ON evaluations;
CREATE POLICY "Evaluators can update their own evaluations" ON evaluations
  FOR UPDATE USING (auth.uid() = evaluator_profile_id);

-- -----------------------------------------------------------------------------
-- 6.8 Policies — evaluation_scores (follow parent evaluation visibility)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Visible if parent evaluation is visible" ON evaluation_scores;
CREATE POLICY "Visible if parent evaluation is visible" ON evaluation_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM evaluations WHERE evaluations.id = evaluation_scores.evaluation_id
            AND evaluations.evaluator_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Evaluators can insert scores for their own evaluations" ON evaluation_scores;
CREATE POLICY "Evaluators can insert scores for their own evaluations" ON evaluation_scores
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM evaluations WHERE evaluations.id = evaluation_scores.evaluation_id
            AND evaluations.evaluator_profile_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 6.9 Policies — profile_capability_scores (read-only for owner; engine writes)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles can view their own capability scores" ON profile_capability_scores;
CREATE POLICY "Profiles can view their own capability scores" ON profile_capability_scores
  FOR SELECT USING (auth.uid() = profile_id);

-- No INSERT/UPDATE policy for regular users — these rows are written by the
-- Capability Engine (service role), not by end users directly.

-- -----------------------------------------------------------------------------
-- 6.10 Policies — capability_history (read-only for owner; engine writes)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles can view their own capability history" ON capability_history;
CREATE POLICY "Profiles can view their own capability history" ON capability_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profile_capability_scores pcs
            WHERE pcs.id = capability_history.profile_capability_score_id
            AND pcs.profile_id = auth.uid())
  );

-- No INSERT/UPDATE policy for regular users — engine-written, same as above.
