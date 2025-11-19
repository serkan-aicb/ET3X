-- Correct RLS policies for profiles table
-- Ensure proper access controls for profile data

-- Drop existing policies that might be incorrect
DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;

-- Recreate policies with proper logic
-- Educators can view profiles of students who requested their tasks
CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_requests tr
      JOIN tasks t ON tr.task = t.id
      WHERE t.creator = auth.uid() AND tr.applicant = profiles.id
    )
  );

-- Educators can view profiles of students assigned to their tasks
CREATE POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      JOIN tasks t ON ta.task = t.id
      WHERE t.creator = auth.uid() AND ta.assignee = profiles.id
    )
  );