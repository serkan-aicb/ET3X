-- Fix infinite recursion in RLS policies by simplifying the profiles policies
-- The issue is that profiles policies reference task_requests and task_assignments,
-- which in turn reference tasks and profiles, creating a circular dependency.

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;

-- Create simplified policies that don't create circular references
-- Educators can view profiles of students who requested their tasks
-- Using a simpler approach that doesn't join back to profiles table
CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT tr.applicant 
      FROM task_requests tr
      JOIN tasks t ON tr.task = t.id
      WHERE t.creator = auth.uid()
    )
  );

-- Educators can view profiles of students assigned to their tasks
-- Using a simpler approach that doesn't join back to profiles table
CREATE POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT ta.assignee 
      FROM task_assignments ta
      JOIN tasks t ON ta.task = t.id
      WHERE t.creator = auth.uid()
    )
  );