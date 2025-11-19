-- Migration script to change task_assignments.assignee and task_requests.applicant from UUID to username
-- WARNING: This is a complex migration that requires careful execution
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT

-- Step 1: Add new columns for username references
ALTER TABLE task_requests ADD COLUMN applicant_username TEXT REFERENCES profiles(username);
ALTER TABLE task_assignments ADD COLUMN assignee_username TEXT REFERENCES profiles(username);

-- Step 2: Populate the new columns with username values based on existing UUID references
UPDATE task_requests 
SET applicant_username = p.username
FROM profiles p
WHERE task_requests.applicant = p.id;

UPDATE task_assignments 
SET assignee_username = p.username
FROM profiles p
WHERE task_assignments.assignee = p.id;

-- Step 3: Add NOT NULL constraints to the new columns
ALTER TABLE task_requests ALTER COLUMN applicant_username SET NOT NULL;
ALTER TABLE task_assignments ALTER COLUMN assignee_username SET NOT NULL;

-- Step 4: Update indexes
DROP INDEX IF EXISTS idx_task_requests_applicant;
DROP INDEX IF EXISTS idx_task_assignments_assignee;
CREATE INDEX idx_task_requests_applicant_username ON task_requests(applicant_username);
CREATE INDEX idx_task_assignments_assignee_username ON task_assignments(assignee_username);

-- Step 5: Update RLS policies to use username instead of UUID
-- Task requests policies
DROP POLICY IF EXISTS "Applicants can view their own requests" ON task_requests;
CREATE POLICY "Applicants can view their own requests" ON task_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.username = applicant_username
    )
  );

DROP POLICY IF EXISTS "Applicants can insert their own requests" ON task_requests;
CREATE POLICY "Applicants can insert their own requests" ON task_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.username = applicant_username
    )
  );

-- Task assignments policies
DROP POLICY IF EXISTS "Assignees can view their own assignments" ON task_assignments;
CREATE POLICY "Assignees can view their own assignments" ON task_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.username = assignee_username
    )
  );

DROP POLICY IF EXISTS "Task creators can view assignments for their tasks" ON task_assignments;
CREATE POLICY "Task creators can view assignments for their tasks" ON task_assignments
  FOR SELECT USING (
    task IN (SELECT id FROM tasks WHERE creator = auth.uid())
  );

DROP POLICY IF EXISTS "Task creators can insert assignments for their tasks" ON task_assignments;
CREATE POLICY "Task creators can insert assignments for their tasks" ON task_assignments
  FOR INSERT WITH CHECK (
    task IN (SELECT id FROM tasks WHERE creator = auth.uid())
  );

-- Update other related policies that reference assignee
DROP POLICY IF EXISTS "Assignees can insert submissions for their assigned tasks" ON submissions;
CREATE POLICY "Assignees can insert submissions for their assigned tasks" ON submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitter AND 
    task IN (
      SELECT task FROM task_assignments ta
      JOIN profiles p ON p.username = ta.assignee_username
      WHERE p.id = auth.uid()
    )
  );

-- Step 6: Update foreign key references in related tables if needed
-- (In this case, we're keeping the existing UUID references for backward compatibility)

-- Step 7: Add a note about the migration
COMMENT ON COLUMN task_requests.applicant_username IS 'Username reference to profiles table (migrated from applicant UUID)';
COMMENT ON COLUMN task_assignments.assignee_username IS 'Username reference to profiles table (migrated from assignee UUID)';

-- IMPORTANT: After running this script, you need to:
-- 1. Update all application code to use the new username columns
-- 2. Test thoroughly to ensure all functionality works correctly
-- 3. Once confirmed working, you can optionally remove the old UUID columns (applicant, assignee)
--    but only after ensuring no code still references them

-- Sample query to verify the migration worked:
-- SELECT tr.id, tr.task, tr.applicant_username, p.username as profile_username
-- FROM task_requests tr
-- JOIN profiles p ON p.username = tr.applicant_username
-- LIMIT 10;