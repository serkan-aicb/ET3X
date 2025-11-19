-- Correct RLS policies for task_requests table
-- Ensure both applicants and task creators can view requests using proper UUID relationships

-- Drop existing policies
DROP POLICY IF EXISTS "Applicants can view their own requests" ON task_requests;
DROP POLICY IF EXISTS "Task creators can view requests for their tasks" ON task_requests;
DROP POLICY IF EXISTS "Applicants can insert their own requests" ON task_requests;

-- Recreate policies with proper logic
-- Applicants can view their own requests (using UUID)
CREATE POLICY "Applicants can view their own requests" ON task_requests
  FOR SELECT USING (auth.uid() = applicant);

-- Task creators can view requests for their tasks
CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- Applicants can insert their own requests (using UUID)
CREATE POLICY "Applicants can insert their own requests" ON task_requests
  FOR INSERT WITH CHECK (auth.uid() = applicant);