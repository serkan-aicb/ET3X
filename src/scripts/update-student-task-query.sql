-- This script shows the updated query logic for fetching available tasks for students
-- It should be implemented in the student tasks browsing endpoint

-- Example query for fetching available tasks for students:
-- SELECT t.* FROM tasks t 
-- WHERE t.is_requestable = true 
--   AND t.status = 'open'
--   AND NOT EXISTS (
--     SELECT 1 FROM task_assignments ta 
--     WHERE ta.task = t.id AND ta.assignee = auth.uid()
--   );

-- This ensures that:
-- 1. Only requestable tasks are shown (directly assigned tasks are excluded)
-- 2. Only open tasks are shown
-- 3. Tasks already assigned to the current user are excluded