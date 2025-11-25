-- Comprehensive fix for all RLS policies to prevent infinite recursion
-- This script resets all policies with safer alternatives that avoid circular references

-- Reset task_requests policies
DROP POLICY IF EXISTS "Applicants can view their own requests" ON task_requests;
DROP POLICY IF EXISTS "Task creators can view requests for their tasks" ON task_requests;
DROP POLICY IF EXISTS "Applicants can insert their own requests" ON task_requests;

CREATE POLICY "Applicants can view their own requests" ON task_requests
  FOR SELECT USING (auth.uid() = applicant);

CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

CREATE POLICY "Applicants can insert their own requests" ON task_requests
  FOR INSERT WITH CHECK (auth.uid() = applicant);

-- Reset task_assignments policies
DROP POLICY IF EXISTS "Assignees can view their own assignments" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can view assignments for their tasks" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can insert assignments for their tasks" ON task_assignments;

CREATE POLICY "Assignees can view their own assignments" ON task_assignments
  FOR SELECT USING (auth.uid() = assignee);

CREATE POLICY "Task creators can view assignments for their tasks" ON task_assignments
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

CREATE POLICY "Task creators can insert assignments for their tasks" ON task_assignments
  FOR INSERT WITH CHECK (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Reset profiles policies for educators - FIXED VERSION
-- The key change is avoiding subqueries that reference the profiles table itself
DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;

-- Educators can view profiles of students who requested their tasks
-- Using a subquery that selects only the applicant ID, not joining back to profiles
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

-- Educators can view profiles of students assigned to their tasks
-- Using a subquery that selects only the assignee ID, not joining back to profiles
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

-- Ensure other profiles policies exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Reset tasks policies
DROP POLICY IF EXISTS "Public can view open tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Assignees can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can update their own tasks" ON tasks;

CREATE POLICY "Public can view open tasks" ON tasks
  FOR SELECT USING (status = 'open');

CREATE POLICY "Creators can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = creator);

CREATE POLICY "Assignees can view their assigned tasks" ON tasks
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT ta.task
      FROM task_assignments ta
      WHERE ta.assignee = auth.uid()
        AND ta.task IS NOT NULL
    )
  );

CREATE POLICY "Creators can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = creator);

CREATE POLICY "Creators can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = creator);

-- Reset submissions policies
DROP POLICY IF EXISTS "Submitters can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Task creators can view submissions for their tasks" ON submissions;
DROP POLICY IF EXISTS "Assignees can insert submissions for their assigned tasks" ON submissions;

CREATE POLICY "Submitters can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = submitter);

CREATE POLICY "Task creators can view submissions for their tasks" ON submissions
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

CREATE POLICY "Assignees can insert submissions for their assigned tasks" ON submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitter 
    AND task IN (
      SELECT task 
      FROM task_assignments 
      WHERE assignee = auth.uid()
    )
  );

-- Reset ratings policies
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Raters can view ratings they created" ON ratings;
DROP POLICY IF EXISTS "Task creators can view ratings for their tasks" ON ratings;
DROP POLICY IF EXISTS "Raters can insert ratings they create" ON ratings;

CREATE POLICY "Users can view their own ratings" ON ratings
  FOR SELECT USING (auth.uid() = rated_user);

CREATE POLICY "Raters can view ratings they created" ON ratings
  FOR SELECT USING (auth.uid() = rater);

CREATE POLICY "Task creators can view ratings for their tasks" ON ratings
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

CREATE POLICY "Raters can insert ratings they create" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = rater);

-- Reset admin codes policies
DROP POLICY IF EXISTS "Admins can view admin codes" ON admin_codes;
CREATE POLICY "Admins can view admin codes" ON admin_codes
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));