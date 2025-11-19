-- Check current RLS policies for task_requests and task_assignments tables

-- Check if RLS is enabled
SELECT tablename, relrowsecurity 
FROM pg_tables 
WHERE tablename IN ('task_requests', 'task_assignments');

-- Check policies for task_requests
SELECT 
    polname AS policy_name,
    polrelid::regclass AS table_name,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'task_requests'::regclass;

-- Check policies for task_assignments
SELECT 
    polname AS policy_name,
    polrelid::regclass AS table_name,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'task_assignments'::regclass;

-- Check if current user can see any task_requests
SELECT COUNT(*) as total_requests FROM task_requests;

-- Check if current user can see any task_assignments
SELECT COUNT(*) as total_assignments FROM task_assignments;