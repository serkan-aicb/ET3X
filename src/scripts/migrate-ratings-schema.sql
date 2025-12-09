-- Migration script for new normalized ratings schema
-- This script creates the new tables for skill-level ratings and migrates existing data

-- Create the new task_ratings table (one row per rating session)
CREATE TABLE IF NOT EXISTS task_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stars_avg NUMERIC,
  xp INTEGER,
  rating_session_hash TEXT,
  task_id_hash TEXT,
  subject_id_hash TEXT,
  on_chain BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create the new task_rating_skills table (one row per skill rating within a session)
CREATE TABLE IF NOT EXISTS task_rating_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rating_id UUID NOT NULL REFERENCES task_ratings(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL,
  stars SMALLINT NOT NULL,
  tx_hash TEXT,
  on_chain BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_ratings_task_id ON task_ratings(task_id);
CREATE INDEX IF NOT EXISTS idx_task_ratings_rater_id ON task_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_task_ratings_rated_user_id ON task_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_task_ratings_on_chain ON task_ratings(on_chain);

CREATE INDEX IF NOT EXISTS idx_task_rating_skills_rating_id ON task_rating_skills(rating_id);
CREATE INDEX IF NOT EXISTS idx_task_rating_skills_skill_id ON task_rating_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_task_rating_skills_on_chain ON task_rating_skills(on_chain);

-- Add RLS policies for task_ratings table
ALTER TABLE task_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own task ratings" ON task_ratings;
CREATE POLICY "Users can view their own task ratings" ON task_ratings
  FOR SELECT USING (auth.uid() = rated_user_id);

DROP POLICY IF EXISTS "Raters can view task ratings they created" ON task_ratings;
CREATE POLICY "Raters can view task ratings they created" ON task_ratings
  FOR SELECT USING (auth.uid() = rater_id);

DROP POLICY IF EXISTS "Task creators can view task ratings for their tasks" ON task_ratings;
CREATE POLICY "Task creators can view task ratings for their tasks" ON task_ratings
  FOR SELECT USING (task_id IN (SELECT id FROM tasks WHERE creator = auth.uid()));

// Add INSERT policy for task_ratings
DROP POLICY IF EXISTS "Raters can insert task ratings they create" ON task_ratings;
CREATE POLICY "Raters can insert task ratings they create" ON task_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

// Add UPDATE policy for task_ratings (needed for relayer to update on_chain status)
DROP POLICY IF EXISTS "Raters can update their own task ratings" ON task_ratings;
CREATE POLICY "Raters can update their own task ratings" ON task_ratings
  FOR UPDATE USING (auth.uid() = rater_id);

-- Add RLS policies for task_rating_skills table
ALTER TABLE task_rating_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view skills for their own task ratings" ON task_rating_skills;
CREATE POLICY "Users can view skills for their own task ratings" ON task_rating_skills
  FOR SELECT USING (EXISTS (SELECT 1 FROM task_ratings WHERE task_ratings.id = task_rating_skills.rating_id AND task_ratings.rated_user_id = auth.uid()));

DROP POLICY IF EXISTS "Raters can view skills for task ratings they created" ON task_rating_skills;
CREATE POLICY "Raters can view skills for task ratings they created" ON task_rating_skills
  FOR SELECT USING (EXISTS (SELECT 1 FROM task_ratings WHERE task_ratings.id = task_rating_skills.rating_id AND task_ratings.rater_id = auth.uid()));

DROP POLICY IF EXISTS "Task creators can view skills for task ratings on their tasks" ON task_rating_skills;
CREATE POLICY "Task creators can view skills for task ratings on their tasks" ON task_rating_skills
  FOR SELECT USING (EXISTS (SELECT 1 FROM task_ratings tr JOIN tasks t ON tr.task_id = t.id WHERE tr.id = task_rating_skills.rating_id AND t.creator = auth.uid()));

// Add INSERT policy for task_rating_skills
DROP POLICY IF EXISTS "Raters can insert skills for their own task ratings" ON task_rating_skills;
CREATE POLICY "Raters can insert skills for their own task ratings" ON task_rating_skills
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM task_ratings WHERE task_ratings.id = task_rating_skills.rating_id AND task_ratings.rater_id = auth.uid()));

// Add UPDATE policy for task_rating_skills (needed for relayer to update on_chain status and tx_hash)
DROP POLICY IF EXISTS "Raters can update skills for their own task ratings" ON task_rating_skills;
CREATE POLICY "Raters can update skills for their own task ratings" ON task_rating_skills
  FOR UPDATE USING (EXISTS (SELECT 1 FROM task_ratings WHERE task_ratings.id = task_rating_skills.rating_id AND task_ratings.rater_id = auth.uid()));
