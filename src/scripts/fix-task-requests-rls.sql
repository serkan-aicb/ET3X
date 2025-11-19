-- Fix RLS policies for task_requests table
-- Ensure both applicants and task creators can view requests

-- Drop existing policies
DROP POLICY IF EXISTS "Applicants can view their own requests" ON task_requests;
DROP POLICY IF EXISTS "Task creators can view requests for their tasks" ON task_requests;
DROP POLICY IF EXISTS "Applicants can insert their own requests" ON task_requests;

-- Recreate policies with proper logic
-- Applicants can view their own requests (using username)
CREATE POLICY "Applicants can view their own requests" ON task_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.username = applicant_username
    )
  );

-- Task creators can view requests for their tasks
CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (
    task IN (SELECT id FROM tasks WHERE creator = auth.uid())
  );

-- Applicants can insert their own requests (using username)
CREATE POLICY "Applicants can insert their own requests" ON task_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.username = applicant_username
    )
  );