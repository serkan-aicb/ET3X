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
  profile_record   RECORD;
  valid_usernames  text[] := ARRAY[]::text[];
  invalid_usernames text[] := ARRAY[]::text[];
  profile_ids      uuid[] := ARRAY[]::uuid[];
  current_username text;
BEGIN
  -- Validate input
  IF task_id IS NULL THEN
    RAISE EXCEPTION 'task_id cannot be null';
  END IF;
  
  IF usernames IS NULL OR array_length(usernames, 1) IS NULL THEN
    RETURN QUERY SELECT ARRAY[]::text[], ARRAY[]::text[];
    RETURN;
  END IF;

  -- Loop through DISTINCT, trimmed usernames
  FOR current_username IN
    SELECT DISTINCT trim(u)
    FROM unnest(usernames) AS t(u)
    WHERE trim(u) <> ''
  LOOP
    -- Check if username exists in profiles
    SELECT id INTO profile_record
    FROM profiles
    WHERE username = current_username;
    
    IF FOUND THEN
      valid_usernames := array_append(valid_usernames, current_username);
      profile_ids     := array_append(profile_ids, profile_record.id);
    ELSE
      invalid_usernames := array_append(invalid_usernames, current_username);
    END IF;
  END LOOP;
  
  -- If we have valid usernames, create task assignments
  IF array_length(valid_usernames, 1) > 0 THEN
    INSERT INTO task_assignments (
      id,
      task,
      assignee,
      assignee_username,
      assigned_by,
      assigned_at,
      status
    )
    SELECT 
      gen_random_uuid(),   -- requires pgcrypto extension
      task_id,
      pid,
      pun,
      auth.uid(),
      NOW(),
      'in_progress'
    FROM unnest(profile_ids, valid_usernames) AS u(pid, pun);
  END IF;
  
  RETURN QUERY SELECT valid_usernames, invalid_usernames;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION assign_task_to_usernames(uuid, text[]) TO authenticated;

COMMENT ON FUNCTION assign_task_to_usernames(uuid, text[]) 
IS 'Bulk assigns a task to multiple students by username. Returns lists of successfully assigned and missing usernames.';