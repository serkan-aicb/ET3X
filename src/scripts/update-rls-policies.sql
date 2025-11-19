-- Optional RLS policy updates for better task visibility

-- Ensure students can see open tasks
CREATE POLICY "Students can see open tasks" ON tasks
  FOR SELECT USING (status = 'open');

-- Note: assigned tasks are automatically visible only to assignees through existing policies
-- The existing policy "Assignees can view their assigned tasks" already handles this:
-- CREATE POLICY "Assignees can view their assigned tasks" ON tasks
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM task_assignments ta
--       WHERE ta.task = tasks.id AND ta.assignee = auth.uid()
--     )
--   );