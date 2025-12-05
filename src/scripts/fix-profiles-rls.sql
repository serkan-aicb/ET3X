-- Fix RLS policies for profiles table to resolve "error fetching student number" issue
-- This script addresses the 500 Internal Server Error when users try to access their own profiles

-- First, ensure RLS is enabled on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students who requested their tasks" ON profiles;
DROP POLICY IF EXISTS "Educators can view profiles of students assigned to their tasks" ON profiles;

-- Recreate the essential policies with proper error handling

-- 1. Users can view their own profile (this was causing the 500 error)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (
    -- Allow access if the user is authenticated and the profile ID matches their auth UID
    (auth.uid() IS NOT NULL AND auth.uid() = id)
  );

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
  );

-- 3. Users can insert their own profile (needed for initial profile creation)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- 4. Educators can view profiles of students who requested their tasks
CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_requests tr
      JOIN tasks t ON tr.task = t.id
      WHERE t.creator = auth.uid() AND tr.applicant = profiles.id
    )
  );

-- 5. Educators can view profiles of students assigned to their tasks
CREATE POLICY "Educators can view profiles of students assigned to their tasks" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      JOIN tasks t ON ta.task = t.id
      WHERE t.creator = auth.uid() AND ta.assignee = profiles.id
    )
  );

-- Add a comment to document the policies
COMMENT ON POLICY "Users can view their own profile" ON profiles 
IS 'Allows authenticated users to view their own profile data';

-- Verify that the policies were created successfully
SELECT polname, relname 
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
WHERE cls.relname = 'profiles';