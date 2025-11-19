-- Fix RLS policies for task_assignments table
-- Ensure both assignees and task creators can view assignments

-- Drop existing policies
DROP POLICY IF EXISTS "Assignees can view their own assignments" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can view assignments for their tasks" ON task_assignments;
DROP POLICY IF EXISTS "Task creators can insert assignments for their tasks" ON task_assignments;

-- Recreate policies with proper logic
-- Assignees can view their own assignments (using username)
CREATE POLICY "Assignees can view their own assignments" ON task_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.username = assignee_username
    )
  );

-- Task creators can view assignments for their tasks
CREATE POLICY "Task creators can view assignments for their tasks" ON task_assignments
  FOR SELECT USING (
    task IN (SELECT id FROM tasks WHERE creator = auth.uid())
  );

-- Task creators can insert assignments for their tasks
CREATE POLICY "Task creators can insert assignments for their tasks" ON task_assignments
  FOR INSERT WITH CHECK (
    task IN (SELECT id FROM tasks WHERE creator = auth.uid())
  );