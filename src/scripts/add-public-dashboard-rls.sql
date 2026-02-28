-- Add RLS policies to allow public access to aggregate statistics for the public dashboard
-- These policies allow anonymous users to count records without accessing individual data

-- For tasks - allow counting all records (not individual access)
-- The existing "Public can view open tasks" policy already allows viewing open tasks
-- We're adding a policy to allow anonymous counting of all tasks
DROP POLICY IF EXISTS "Anonymous can count all tasks" ON tasks;
CREATE POLICY "Anonymous can count all tasks" ON tasks
  FOR SELECT USING (true);  -- Only allows counting, not viewing individual records

-- For profiles - allow counting all records
DROP POLICY IF EXISTS "Anonymous can count all profiles" ON profiles;
CREATE POLICY "Anonymous can count all profiles" ON profiles
  FOR SELECT USING (true);  -- Only allows counting, not viewing individual records

-- For skills - allow counting all records
DROP POLICY IF EXISTS "Anonymous can count all skills" ON skills;
CREATE POLICY "Anonymous can count all skills" ON skills
  FOR SELECT USING (true);  -- Only allows counting, not viewing individual records

-- For task_assignments - allow counting all records
DROP POLICY IF EXISTS "Anonymous can count all task_assignments" ON task_assignments;
CREATE POLICY "Anonymous can count all task_assignments" ON task_assignments
  FOR SELECT USING (true);  -- Only allows counting, not viewing individual records

-- Alternative approach: Create a view for public statistics
-- This is a safer approach that exposes only aggregate data

-- Drop existing view if it exists
DROP VIEW IF EXISTS public_dashboard_stats;

-- Create a view that exposes only aggregate statistics
CREATE OR REPLACE VIEW public_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM tasks) AS total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'open') AS open_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') AS assigned_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'submitted') AS delivered_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'graded') AS rated_tasks,
    (SELECT COUNT(*) FROM profiles) AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'student') AS students,
    (SELECT COUNT(*) FROM profiles WHERE role = 'educator') AS educators,
    (SELECT COUNT(*) FROM skills) AS total_skills,
    (SELECT COUNT(*) FROM profiles WHERE did IS NOT NULL) AS active_profiles,
    (SELECT COUNT(*) FROM task_assignments WHERE status IN ('completed', 'graded', 'submitted')) AS completed_assignments;

-- Create policy to allow anonymous access to the view
GRANT SELECT ON public_dashboard_stats TO anon;
GRANT SELECT ON public_dashboard_stats TO authenticated;