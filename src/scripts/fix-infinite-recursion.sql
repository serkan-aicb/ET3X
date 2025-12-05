-- Fix Infinite Recursion in RLS Policies
-- This script specifically addresses the infinite recursion error in policy for relation "tasks"
-- that occurs when trying to update profiles or access task-related data

-- The issue is caused by circular references between policies:
-- tasks -> task_assignments -> tasks -> task_assignments -> ...

-- 1. First, drop the problematic policies that cause circular references
DROP POLICY IF EXISTS "Task creators can view requests for their tasks" ON task_requests;
DROP POLICY IF EXISTS "Task creators can view assignments for their tasks" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can insert assignments for their tasks" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can view submissions for their tasks" ON submissions;
DROP POLICY IF EXISTS "Task creators can view ratings for their tasks" ON ratings;

-- 2. Recreate these policies using subqueries to avoid circular references

-- Task requests policies - avoid circular reference by using direct comparison
CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (
    task IN (
      SELECT t.id 
      FROM tasks t 
      WHERE t.creator = auth.uid()
    )
  );

-- Task assignments policies - avoid circular reference by using direct comparison
CREATE POLICY "Task creators can view assignments for their tasks" ON task_assignments
  FOR SELECT USING (
    task IN (
      SELECT t.id 
      FROM tasks t 
      WHERE t.creator = auth.uid()
    )
  );

CREATE POLICY "Task creators can insert assignments for their tasks" ON task_assignments
  FOR INSERT WITH CHECK (
    task IN (
      SELECT t.id 
      FROM tasks t 
      WHERE t.creator = auth.uid()
    )
  );

-- Submissions policies - avoid circular reference by using direct comparison
CREATE POLICY "Task creators can view submissions for their tasks" ON submissions
  FOR SELECT USING (
    task IN (
      SELECT t.id 
      FROM tasks t 
      WHERE t.creator = auth.uid()
    )
  );

-- Ratings policies - avoid circular reference by using direct comparison
CREATE POLICY "Task creators can view ratings for their tasks" ON ratings
  FOR SELECT USING (
    task IN (
      SELECT t.id 
      FROM tasks t 
      WHERE t.creator = auth.uid()
    )
  );

-- 3. Add comments for documentation
COMMENT ON POLICY "Task creators can view requests for their tasks" ON task_requests
IS 'Allows task creators to view requests for their tasks - fixed to avoid infinite recursion';

COMMENT ON POLICY "Task creators can view assignments for their tasks" ON task_assignments
IS 'Allows task creators to view assignments for their tasks - fixed to avoid infinite recursion';

COMMENT ON POLICY "Task creators can insert assignments for their tasks" ON task_assignments
IS 'Allows task creators to insert assignments for their tasks - fixed to avoid infinite recursion';

COMMENT ON POLICY "Task creators can view submissions for their tasks" ON submissions
IS 'Allows task creators to view submissions for their tasks - fixed to avoid infinite recursion';

COMMENT ON POLICY "Task creators can view ratings for their tasks" ON ratings
IS 'Allows task creators to view ratings for their tasks - fixed to avoid infinite recursion';

-- 4. Verify policies were created successfully
SELECT polname, relname 
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
WHERE cls.relname IN ('task_requests', 'task_assignments', 'submissions', 'ratings')
ORDER BY cls.relname, polname;