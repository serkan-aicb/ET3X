-- Add is_requestable column to tasks table
-- This column determines whether a task can be requested by students browsing tasks
-- Tasks with assigned usernames should have is_requestable = false
-- Tasks without assigned usernames should have is_requestable = true (default)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_requestable boolean NOT NULL DEFAULT true;

-- Add a comment to document the column
COMMENT ON COLUMN tasks.is_requestable IS 'Determines if a task can be requested by students. False for tasks with direct assignments, true for browseable tasks.';

-- Create an index for better performance when querying by is_requestable
CREATE INDEX IF NOT EXISTS idx_tasks_is_requestable ON tasks(is_requestable);