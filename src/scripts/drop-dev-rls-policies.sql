-- Remove permissive development RLS policies from production-like Supabase projects.
-- Review in the Supabase SQL editor, then run after confirming no local demo flow depends on them.

DROP POLICY IF EXISTS "dev_allow_all_insert_ratings" ON public.ratings;
DROP POLICY IF EXISTS "dev_allow_all_select_ratings" ON public.ratings;
DROP POLICY IF EXISTS "dev_allow_all_insert_task_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "dev_allow_all_select_task_assignments" ON public.task_assignments;
