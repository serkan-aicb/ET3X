-- Migration: Talent3X Platform Overhaul
-- This migration adds columns needed for the new task sharing, request, and file upload flow

-- 1. Add share_code column to tasks (unique short code for public task links)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;
-- Add index for share_code lookups
CREATE INDEX IF NOT EXISTS idx_tasks_share_code ON tasks(share_code);

-- 2. Add is_active column to tasks (controls whether public request link is active)
-- is_requestable already exists from prior migration, but is_active controls the toggle after creation
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add real_name column to profiles (editable display name)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS real_name TEXT;

-- 4. Add submission_files table for file metadata
CREATE TABLE IF NOT EXISTS submission_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission UUID REFERENCES submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on submission_files
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for submission_files
DROP POLICY IF EXISTS "Submitters can view their own submission files" ON submission_files;
CREATE POLICY "Submitters can view their own submission files" ON submission_files
  FOR SELECT USING (
    submission IN (SELECT id FROM submissions WHERE submitter = auth.uid())
  );

DROP POLICY IF EXISTS "Task creators can view submission files for their tasks" ON submission_files;
CREATE POLICY "Task creators can view submission files for their tasks" ON submission_files
  FOR SELECT USING (
    submission IN (SELECT id FROM submissions s WHERE s.task IN (SELECT id FROM tasks WHERE creator = auth.uid()))
  );

DROP POLICY IF EXISTS "Submitters can insert their own submission files" ON submission_files;
CREATE POLICY "Submitters can insert their own submission files" ON submission_files
  FOR INSERT WITH CHECK (
    submission IN (SELECT id FROM submissions WHERE submitter = auth.uid())
  );

-- 7. Update task_requests RLS: allow task creators to update request status
DROP POLICY IF EXISTS "Task creators can update requests for their tasks" ON task_requests;
CREATE POLICY "Task creators can update requests for their tasks" ON task_requests
  FOR UPDATE USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));

-- 8. Ensure task_requests also allow viewing by task creators for requests on requestable tasks
-- (This already exists but let's verify)
-- "Task creators can view requests for their tasks" already covers SELECT

-- 9. Add RLS policy for unauthenticated users to view requestable+active tasks by share_code
-- This is needed so the public task request page can load task info without being logged in
-- We'll handle this via a server-side API route instead of direct Supabase access from the client

-- 10. Update the "Public can view open tasks" policy to also include requestable+active tasks
DROP POLICY IF EXISTS "Public can view open tasks" ON tasks;
CREATE POLICY "Public can view open tasks" ON tasks
  FOR SELECT USING (status = 'open' AND is_active = true AND is_requestable = true);

-- 11. Create index on submission_files
CREATE INDEX IF NOT EXISTS idx_submission_files_submission ON submission_files(submission);