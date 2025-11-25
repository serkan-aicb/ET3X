-- Critical fix for infinite recursion error in RLS policies
-- This specifically addresses the profiles table policies that cause circular references

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;

-- Create new policies that avoid circular references by using subqueries 
-- that don't reference the profiles table itself
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