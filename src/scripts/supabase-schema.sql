-- Create tables for Talent3X

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types with DO blocks to handle existing types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'educator', 'admin');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_level') THEN
    CREATE TYPE skill_level AS ENUM ('Novice', 'Skilled', 'Expert', 'Master');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_type') THEN
    CREATE TYPE license_type AS ENUM ('CC BY 4.0', 'CC0 1.0');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('draft', 'open', 'closed', 'in_progress', 'submitted', 'graded');
  END IF;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email_digest TEXT UNIQUE,
  username TEXT UNIQUE,
  role user_role DEFAULT 'student',
  did TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  label TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module TEXT,
  title TEXT NOT NULL,
  description TEXT,
  seats INTEGER,
  skill_level skill_level,
  license license_type,
  skills INTEGER[], -- Array of skill IDs
  due_date TIMESTAMP WITH TIME ZONE,
  status task_status DEFAULT 'draft',
  task_mode TEXT DEFAULT 'single', -- New column for task mode ('single' or 'multi')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task UUID REFERENCES tasks(id) ON DELETE CASCADE,
  applicant UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applicant_username TEXT,
  CONSTRAINT unique_task_applicant UNIQUE (task, applicant) -- Unique constraint to prevent duplicate requests
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assignee UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_username TEXT, -- Store username for compatibility
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'in_progress', -- New status field for assignments
  submitted_at TIMESTAMP WITH TIME ZONE,
  grade INTEGER,
  CONSTRAINT unique_task_assignee UNIQUE (task, assignee) -- Unique constraint to prevent duplicate assignments
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task UUID REFERENCES tasks(id) ON DELETE CASCADE,
  submitter UUID REFERENCES profiles(id) ON DELETE CASCADE,
  link TEXT,
  note TEXT,
  files JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task UUID REFERENCES tasks(id) ON DELETE CASCADE,
  rater UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rated_user UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skills JSONB,
  stars_avg NUMERIC,
  xp INTEGER,
  cid TEXT,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_codes (
  code TEXT PRIMARY KEY,
  purpose TEXT,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_requests tr
      JOIN tasks t ON tr.task = t.id
      WHERE t.creator = auth.uid() AND tr.applicant = profiles.id
    )
  );

DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;
CREATE POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      JOIN tasks t ON ta.task = t.id
      WHERE t.creator = auth.uid() AND ta.assignee = profiles.id
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
DROP POLICY IF EXISTS "Public can view open tasks" ON tasks;
CREATE POLICY "Public can view open tasks" ON tasks
  FOR SELECT USING (status = 'open');

DROP POLICY IF EXISTS "Creators can view their own tasks" ON tasks;
CREATE POLICY "Creators can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = creator);

DROP POLICY IF EXISTS "Assignees can view their assigned tasks" ON tasks;
CREATE POLICY "Assignees can view their assigned tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      WHERE ta.task = tasks.id AND ta.assignee = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Creators can insert their own tasks" ON tasks;
CREATE POLICY "Creators can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = creator);

DROP POLICY IF EXISTS "Creators can update their own tasks" ON tasks;
CREATE POLICY "Creators can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = creator);

-- Task requests policies
DROP POLICY IF EXISTS "Applicants can view their own requests" ON task_requests;
CREATE POLICY "Applicants can view their own requests" ON task_requests
  FOR SELECT USING (auth.uid() = applicant);

DROP POLICY IF EXISTS "Applicants can insert their own requests" ON task_requests;
CREATE POLICY "Applicants can insert their own requests" ON task_requests
  FOR INSERT WITH CHECK (auth.uid() = applicant);

DROP POLICY IF EXISTS "Task creators can view requests for their tasks" ON task_requests;
CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Task assignments policies
DROP POLICY IF EXISTS "Assignees can view their own assignments" ON task_assignments;
CREATE POLICY "Assignees can view their own assignments" ON task_assignments
  FOR SELECT USING (auth.uid() = assignee);

DROP POLICY IF EXISTS "Task creators can view assignments for their tasks" ON task_assignments;
CREATE POLICY "Task creators can view assignments for their tasks" ON task_assignments
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

DROP POLICY IF EXISTS "Task creators can insert assignments for their tasks" ON task_assignments;
CREATE POLICY "Task creators can insert assignments for their tasks" ON task_assignments
  FOR INSERT WITH CHECK (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Submissions policies
DROP POLICY IF EXISTS "Submitters can view their own submissions" ON submissions;
CREATE POLICY "Submitters can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = submitter);

DROP POLICY IF EXISTS "Task creators can view submissions for their tasks" ON submissions;
CREATE POLICY "Task creators can view submissions for their tasks" ON submissions
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

DROP POLICY IF EXISTS "Assignees can insert submissions for their assigned tasks" ON submissions;
CREATE POLICY "Assignees can insert submissions for their assigned tasks" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = submitter AND task IN (SELECT task FROM task_assignments WHERE assignee = auth.uid()));

-- Ratings policies
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
CREATE POLICY "Users can view their own ratings" ON ratings
  FOR SELECT USING (auth.uid() = rated_user);

DROP POLICY IF EXISTS "Raters can view ratings they created" ON ratings;
CREATE POLICY "Raters can view ratings they created" ON ratings
  FOR SELECT USING (auth.uid() = rater);

DROP POLICY IF EXISTS "Task creators can view ratings for their tasks" ON ratings;
CREATE POLICY "Task creators can view ratings for their tasks" ON ratings
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

DROP POLICY IF EXISTS "Raters can insert ratings they create" ON ratings;
CREATE POLICY "Raters can insert ratings they create" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = rater);

-- Admin codes policies
DROP POLICY IF EXISTS "Admins can view admin codes" ON admin_codes;
CREATE POLICY "Admins can view admin codes" ON admin_codes
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_did ON profiles(did);
CREATE INDEX IF NOT EXISTS idx_profiles_email_digest ON profiles(email_digest);
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_requests_task ON task_requests(task);
CREATE INDEX IF NOT EXISTS idx_task_requests_applicant ON task_requests(applicant);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee ON task_assignments(assignee);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON submissions(submitter);
CREATE INDEX IF NOT EXISTS idx_ratings_task ON ratings(task);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user);

-- Create function to handle new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by the auth callback in the application
  -- The application will handle creating the profile with encrypted email
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user creation
-- Note: In this application, profile creation is handled in the auth callback route
-- This trigger is just a placeholder
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();