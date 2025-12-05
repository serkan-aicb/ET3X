-- Fix Student Task Visibility
-- This script addresses the issue where students cannot see available tasks after RLS policy corrections

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Public can view open tasks" ON tasks;
DROP POLICY IF EXISTS "Students can see open tasks" ON tasks;
DROP POLICY IF EXISTS "Assignees can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Task creators can view assignments for their tasks" ON task_assignments;
DROP POLICY IF EXISTS "Students can view their task assignments" ON task_assignments;

-- Create proper policies for student task visibility

-- 1. Students can view open tasks (this is the key policy for the task browsing page)
CREATE POLICY "Students can view open tasks" ON tasks
  FOR SELECT USING (status = 'open');

-- 2. Students can view their assigned tasks (for the "My Tasks" page)
CREATE POLICY "Students can view their task assignments" ON task_assignments
  FOR SELECT USING (assignee = auth.uid());

-- 3. Students can view their own task requests
CREATE POLICY "Students can view their task requests" ON task_requests
  FOR SELECT USING (applicant = auth.uid());

-- 4. Assignees can view their assigned tasks (this enables the join in the frontend)
CREATE POLICY "Assignees can view their assigned tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      WHERE ta.task = tasks.id AND ta.assignee = auth.uid()
    )
  );

-- 5. Task creators can view assignments for their tasks (for educators)
CREATE POLICY "Task creators can view assignments for their tasks" ON task_assignments
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Ensure educators can still view their own tasks
DROP POLICY IF EXISTS "Creators can view their own tasks" ON tasks;
CREATE POLICY "Creators can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = creator);

-- Add comments for documentation
COMMENT ON POLICY "Students can view open tasks" ON tasks 
IS 'Allows students to browse open tasks';

COMMENT ON POLICY "Students can view their task assignments" ON task_assignments
IS 'Allows students to see their assigned tasks';

COMMENT ON POLICY "Assignees can view their assigned tasks" ON tasks
IS 'Allows students to view full task details for tasks they are assigned to';

-- Verify policies were created successfully
SELECT polname, relname 
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
WHERE cls.relname IN ('tasks', 'task_assignments', 'task_requests')
ORDER BY cls.relname, polname;