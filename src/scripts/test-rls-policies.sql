-- Test RLS policies for task assignments
-- This script will help us verify if students can see their assigned tasks

-- First, let's check what policies exist
\dt task_assignments
\dt tasks

-- Check RLS status
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname IN ('task_assignments', 'tasks');

-- Check policies
SELECT polname, polrelid::regclass, polcmd, polqual, polwithcheck
FROM pg_policy
WHERE polrelid IN (
    SELECT oid FROM pg_class WHERE relname IN ('task_assignments', 'tasks')
);

-- Test query as a student user (you'll need to replace 'student-user-id' with an actual user ID)
-- SET LOCAL "request.jwt.claim.sub" = 'student-user-id';
-- SELECT * FROM task_assignments WHERE assignee = 'student-user-id';