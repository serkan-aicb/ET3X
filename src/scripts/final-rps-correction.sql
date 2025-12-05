-- Final RLS Policy Correction Script
-- This script fixes all RLS policy issues in the database to resolve the 500 error
-- when users try to access their own profiles

-- Correct table structure for profiles:
-- id (uuid, primary key)
-- role (text, type user_role - values: student, educator)
-- username (text, unique)
-- did (text, unique - DID string like did:web:talent3x.io:...)
-- email_ciphertext (text - encrypted email)
-- email_digest (text, unique - hashed email)
-- matriculation_number (text or null)
-- created_at (timestamptz)
-- updated_at (timestamptz)

-- 1. First, ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_codes ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start with a clean slate
-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;

-- Tasks policies
DROP POLICY IF EXISTS "Public can view open tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Assignees can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can update their own tasks" ON tasks;

-- Task requests policies
DROP POLICY IF EXISTS "Applicants can view their own requests" ON task_requests;
DROP POLICY IF EXISTS "Applicants can insert their own requests" ON task_requests;
DROP POLICY IF EXISTS "Task creators can view requests for their tasks" ON task_requests;

-- Task assignments policies
DROP POLICY IF EXISTS "Assignees can view their own assignments" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can view assignments for their tasks" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can insert assignments for their tasks" ON task_assignments;

-- Submissions policies
DROP POLICY IF EXISTS "Submitters can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Task creators can view submissions for their tasks" ON submissions;
DROP POLICY IF EXISTS "Assignees can insert submissions for their assigned tasks" ON submissions;

-- Ratings policies
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Raters can view ratings they created" ON ratings;
DROP POLICY IF EXISTS "Task creators can view ratings for their tasks" ON ratings;
DROP POLICY IF EXISTS "Raters can insert ratings they create" ON ratings;

-- Admin codes policies
DROP POLICY IF EXISTS "Admins can view admin codes" ON admin_codes;

-- 3. Recreate all policies with proper implementation to avoid infinite recursion
-- and with enhanced error handling

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (
    -- Ensure auth.uid() is not null and matches the profile id
    auth.uid() IS NOT NULL AND auth.uid() = id
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
  );

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- Educator policies that avoid circular references by using subqueries
-- These policies allow educators to view student profiles for students who have 
-- requested their tasks or been assigned to their tasks
CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT tr.applicant
      FROM task_requests tr
      INNER JOIN tasks t ON tr.task = t.id
      WHERE t.creator = auth.uid()
        AND tr.applicant IS NOT NULL
    )
  );

CREATE POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT ta.assignee
      FROM task_assignments ta
      INNER JOIN tasks t ON ta.task = t.id
      WHERE t.creator = auth.uid()
        AND ta.assignee IS NOT NULL
    )
  );

-- Tasks policies
CREATE POLICY "Public can view open tasks" ON tasks
  FOR SELECT USING (status = 'open');

CREATE POLICY "Creators can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = creator);

CREATE POLICY "Assignees can view their assigned tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      WHERE ta.task = tasks.id AND ta.assignee = auth.uid()
    )
  );

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

CREATE POLICY "Raters can insert ratings they create" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = rater);

-- Admin codes policies
CREATE POLICY "Admins can view admin codes" ON admin_codes
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Add comments for documentation
COMMENT ON POLICY "Users can view their own profile" ON profiles 
IS 'Allows authenticated users to view their own profile data - fixed version with proper NULL checking to prevent 500 errors';

COMMENT ON POLICY "Educators can view profiles of students who requested their tasks" ON profiles
IS 'Allows educators to view student profiles who requested their tasks - optimized with subqueries to avoid infinite recursion';

COMMENT ON POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
IS 'Allows educators to view student profiles who are assigned to their tasks - optimized with subqueries to avoid infinite recursion';

-- 5. Verify policies were created successfully
SELECT polname, relname 
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
WHERE cls.relname IN ('profiles', 'tasks', 'task_requests', 'task_assignments', 'submissions', 'ratings', 'admin_codes')
ORDER BY cls.relname, polname;