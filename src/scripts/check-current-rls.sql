-- Check current RLS policies for task_requests, task_assignments, and profiles tables

-- Check task_requests policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
WHERE relname = 'task_requests';

-- Check task_assignments policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
WHERE relname = 'task_assignments';

-- Check profiles policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
WHERE relname = 'profiles';

-- Check if RLS is enabled on these tables
SELECT tablename, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname IN ('task_requests', 'task_assignments', 'profiles');