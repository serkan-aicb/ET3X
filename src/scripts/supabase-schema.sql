-- Create tables for Talent3X

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'educator', 'admin');
CREATE TYPE request_status AS ENUM ('requested', 'declined', 'selected');
CREATE TYPE skill_level AS ENUM ('Novice', 'Skilled', 'Expert', 'Master');
CREATE TYPE license_type AS ENUM ('CC BY 4.0', 'CC0 1.0');
CREATE TYPE recurrence_type AS ENUM ('oneoff', 'recurring');
CREATE TYPE task_status AS ENUM ('draft', 'open', 'assigned', 'delivered', 'rated');

-- Create skills table
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL,
  username TEXT UNIQUE NOT NULL,
  did TEXT UNIQUE NOT NULL,
  email_ciphertext TEXT NOT NULL,
  email_digest TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module TEXT,
  title TEXT NOT NULL,
  goal TEXT,
  context TEXT,
  deliverables TEXT,
  seats INTEGER,
  skill_level skill_level,
  license license_type,
  recurrence recurrence_type,
  skills INTEGER[],
  due_date TIMESTAMP WITH TIME ZONE,
  status task_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_requests table
CREATE TABLE task_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task UUID REFERENCES tasks(id) ON DELETE CASCADE,
  applicant UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status request_status DEFAULT 'requested'
);

-- Create task_assignments table
CREATE TABLE task_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assignee UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task UUID REFERENCES tasks(id) ON DELETE CASCADE,
  submitter UUID REFERENCES profiles(id) ON DELETE CASCADE,
  link TEXT,
  note TEXT,
  files JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE ratings (
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

-- Create admin_codes table
CREATE TABLE admin_codes (
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

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_requests tr
      JOIN tasks t ON tr.task = t.id
      WHERE t.creator = auth.uid() AND tr.applicant = profiles.id
    )
  );

CREATE POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      JOIN tasks t ON ta.task = t.id
      WHERE t.creator = auth.uid() AND ta.assignee = profiles.id
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Public can view open tasks" ON tasks
  FOR SELECT USING (status = 'open');

CREATE POLICY "Creators can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = creator);

CREATE POLICY "Creators can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = creator);

CREATE POLICY "Creators can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = creator);

-- Task requests policies
CREATE POLICY "Applicants can view their own requests" ON task_requests
  FOR SELECT USING (auth.uid() = applicant);

CREATE POLICY "Applicants can insert their own requests" ON task_requests
  FOR INSERT WITH CHECK (auth.uid() = applicant);

CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Task assignments policies
CREATE POLICY "Assignees can view their own assignments" ON task_assignments
  FOR SELECT USING (auth.uid() = assignee);

CREATE POLICY "Task creators can view assignments for their tasks" ON task_assignments
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

CREATE POLICY "Task creators can insert assignments for their tasks" ON task_assignments
  FOR INSERT WITH CHECK (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Submissions policies
CREATE POLICY "Submitters can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = submitter);

CREATE POLICY "Task creators can view submissions for their tasks" ON submissions
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

CREATE POLICY "Assignees can insert submissions for their assigned tasks" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = submitter AND task IN (SELECT task FROM task_assignments WHERE assignee = auth.uid()));

-- Ratings policies
CREATE POLICY "Users can view their own ratings" ON ratings
  FOR SELECT USING (auth.uid() = rated_user);

CREATE POLICY "Raters can view ratings they created" ON ratings
  FOR SELECT USING (auth.uid() = rater);

CREATE POLICY "Task creators can view ratings for their tasks" ON ratings
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Admin codes policies
CREATE POLICY "Admins can view admin codes" ON admin_codes
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_did ON profiles(did);
CREATE INDEX idx_profiles_email_digest ON profiles(email_digest);
CREATE INDEX idx_tasks_creator ON tasks(creator);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_requests_task ON task_requests(task);
CREATE INDEX idx_task_requests_applicant ON task_requests(applicant);
CREATE INDEX idx_task_assignments_task ON task_assignments(task);
CREATE INDEX idx_task_assignments_assignee ON task_assignments(assignee);
CREATE INDEX idx_submissions_task ON submissions(task);
CREATE INDEX idx_submissions_submitter ON submissions(submitter);
CREATE INDEX idx_ratings_task ON ratings(task);
CREATE INDEX idx_ratings_rater ON ratings(rater);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user);

-- Create function to handle new user creation
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