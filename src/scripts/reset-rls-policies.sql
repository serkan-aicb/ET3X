-- Reset RLS policies to correct versions using proper UUID relationships

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

-- Reset profiles policies for educators
DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;

CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_requests tr
      JOIN tasks t ON tr.task = t.id
      WHERE t.creator = auth.uid() AND tr.applicant = profiles.id
    )
  );

CREATE POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      JOIN tasks t ON ta.task = t.id
      WHERE t.creator = auth.uid() AND ta.assignee = profiles.id
    )
  );