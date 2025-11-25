-- Migration script to update existing data for task mode refactoring
-- This script updates existing tasks and assignments to work with the new system

-- Add task_mode column to tasks table if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_mode TEXT DEFAULT 'single';

-- Add status column to task_assignments table if it doesn't exist
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS grade INTEGER;

-- Add applicant_username column to task_requests table if it doesn't exist
ALTER TABLE task_requests ADD COLUMN IF NOT EXISTS applicant_username TEXT;

-- First, check what enum values currently exist
-- We'll use a more careful approach to avoid errors

-- Update task statuses from old values to new values only if the target values exist
-- Use a DO block to handle potential enum value errors
DO $$
BEGIN
    -- Only attempt updates if the target enum values exist
    IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'task_status' AND e.enumlabel = 'in_progress') THEN
        UPDATE tasks SET status = 'in_progress' WHERE status = 'assigned';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'task_status' AND e.enumlabel = 'submitted') THEN
        UPDATE tasks SET status = 'submitted' WHERE status = 'delivered';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'task_status' AND e.enumlabel = 'graded') THEN
        UPDATE tasks SET status = 'graded' WHERE status = 'rated';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If there are any errors, continue with the rest of the script
    RAISE NOTICE 'Skipping task status updates due to enum issues: %', SQLERRM;
END $$;

-- Update task request statuses from old values to new values
DO $$
BEGIN
    -- Only attempt updates if the target enum values exist
    IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'request_status' AND e.enumlabel = 'pending') THEN
        UPDATE task_requests SET status = 'pending' WHERE status = 'requested';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'request_status' AND e.enumlabel = 'accepted') THEN
        UPDATE task_requests SET status = 'accepted' WHERE status = 'approved';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'request_status' AND e.enumlabel = 'declined') THEN
        UPDATE task_requests SET status = 'declined' WHERE status = 'rejected';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If there are any errors, continue with the rest of the script
    RAISE NOTICE 'Skipping task request status updates due to enum issues: %', SQLERRM;
END $$;

-- Set task_mode based on seats for existing tasks
-- Tasks with seats = 1 are single tasks
-- Tasks with seats > 1 are multi tasks
UPDATE tasks SET task_mode = 'single' WHERE seats = 1 OR seats IS NULL;
UPDATE tasks SET task_mode = 'multi' WHERE seats > 1;

-- Set default task_mode for any tasks that still don't have it
UPDATE tasks SET task_mode = 'single' WHERE task_mode IS NULL;

-- Set applicant_username for existing task_requests if not set
UPDATE task_requests 
SET applicant_username = p.username
FROM profiles p
WHERE task_requests.applicant_username IS NULL 
AND task_requests.applicant = p.id;

-- Set assignee_username for existing task_assignments if not set
UPDATE task_assignments 
SET assignee_username = p.username
FROM profiles p
WHERE task_assignments.assignee_username IS NULL 
AND task_assignments.assignee = p.id;

-- Set status for existing task_assignments if not set
UPDATE task_assignments 
SET status = 'in_progress' 
WHERE status IS NULL;

-- Add unique constraints if they don't exist
-- Since the constraints are already defined in the schema, we don't need to add them again
-- The constraints unique_task_applicant and unique_task_assignee already exist from the schema

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_tasks_task_mode ON tasks(task_mode);
CREATE INDEX IF NOT EXISTS idx_task_requests_status ON task_requests(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);