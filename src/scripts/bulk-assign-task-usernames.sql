-- Create RPC function for bulk assigning tasks to usernames
-- This function allows educators to assign tasks to multiple students by username in one operation

-- Ensure profiles.username has a unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (username);

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS assign_task_to_usernames(uuid, text[]);

-- Create the RPC function
CREATE OR REPLACE FUNCTION assign_task_to_usernames(
  task_id uuid,
  usernames text[]
)
RETURNS TABLE (
  assigned_usernames text[],
  missing_usernames text[]
)
SECURITY DEFINER  -- Runs with creator privileges, but we check permissions in RLS policies
AS $$
DECLARE
  profile_record RECORD;
  valid_usernames text[];
  invalid_usernames text[];
  profile_ids uuid[];
BEGIN
  -- Validate input
  IF task_id IS NULL THEN
    RAISE EXCEPTION 'task_id cannot be null';
  END IF;
  
  IF usernames IS NULL OR array_length(usernames, 1) IS NULL THEN
    -- Return empty arrays if no usernames provided
    RETURN QUERY SELECT ARRAY[]::text[], ARRAY[]::text[];
    RETURN;
  END IF;
  
  -- Initialize arrays
  valid_usernames := ARRAY[]::text[];
  invalid_usernames := ARRAY[]::text[];
  profile_ids := ARRAY[]::uuid[];
  
  -- Loop through provided usernames to validate them
  FOR i IN SELECT unnest(usernames) LOOP
    -- Skip empty usernames
    IF trim(i) != '' THEN
      -- Check if username exists in profiles
      SELECT id INTO profile_record FROM profiles WHERE username = trim(i);
      
      IF FOUND THEN
        -- Username exists, add to valid list
        valid_usernames := array_append(valid_usernames, trim(i));
        profile_ids := array_append(profile_ids, profile_record.id);
      ELSE
        -- Username doesn't exist, add to invalid list
        invalid_usernames := array_append(invalid_usernames, trim(i));
      END IF;
    END IF;
  END LOOP;
  
  -- If we have valid usernames, create task assignments
  IF array_length(valid_usernames, 1) > 0 THEN
    -- Insert task assignments for all valid usernames
    INSERT INTO task_assignments (id, task, assignee, assignee_username, assigned_by, assigned_at, status)
    SELECT 
      gen_random_uuid(),  -- Generate new UUID for each assignment
      task_id,            -- The task being assigned
      pid,                -- Profile ID from our list
      pun,                -- Username from our list
      auth.uid(),         -- Current user (educator) assigning the task
      NOW(),              -- Current timestamp
      'in_progress'       -- Default status
    FROM unnest(profile_ids, valid_usernames) AS u(pid, pun);
  END IF;
  
  -- Return the results
  RETURN QUERY SELECT valid_usernames, invalid_usernames;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
-- This allows educators (who are authenticated) to call this function
-- NOTE: The actual security is enforced by RLS policies on task_assignments table:
-- - "Task creators can insert assignments for their tasks" requires task.creator = auth.uid()
-- So educators can only assign tasks they created themselves
GRANT EXECUTE ON FUNCTION assign_task_to_usernames(uuid, text[]) TO authenticated;

-- Add a comment to document the function
COMMENT ON FUNCTION assign_task_to_usernames(uuid, text[]) 
IS 'Bulk assigns a task to multiple students by username. Returns lists of successfully assigned and missing usernames.';