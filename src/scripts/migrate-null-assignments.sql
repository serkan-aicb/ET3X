-- Migration script to repair old task_assignments with NULL assignee values
-- This script should be run after applying the migrate-username-fields.sql script

-- Update task_assignments where assignee is NULL but assignee_username is set
-- This will populate the assignee field based on the assignee_username field

UPDATE task_assignments ta
SET assignee = p.id
FROM profiles p
WHERE ta.assignee IS NULL
  AND ta.assignee_username = p.username;

-- Verify the migration
-- This query should return 0 rows after the migration is complete
SELECT COUNT(*) as remaining_null_assignees
FROM task_assignments
WHERE assignee IS NULL;

-- Add a constraint to prevent future NULL assignee values
-- Note: Only run this after verifying that all NULL values have been fixed
-- ALTER TABLE task_assignments ALTER COLUMN assignee SET NOT NULL;