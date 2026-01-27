-- Create RPC function for auto-submitting tasks for students
-- This function automatically creates submissions for assigned students when a task is created
-- Used in the new Talent3X university flow where professors rate students directly

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS auto_submit_task_for_students(uuid, text[]);

-- Create the RPC function
CREATE OR REPLACE FUNCTION auto_submit_task_for_students(
  p_task_id uuid,
  p_usernames text[]
)
RETURNS TABLE (
  submitted_usernames text[],
  missing_usernames text[]
)
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  valid_usernames text[] := ARRAY[]::text[];
  invalid_usernames text[] := ARRAY[]::text[];
  profile_ids uuid[] := ARRAY[]::uuid[];
  current_username text;
  assignment_record RECORD;
BEGIN
  -- Validate input
  IF p_task_id IS NULL THEN
    RAISE EXCEPTION 'p_task_id cannot be null';
  END IF;
  
  IF p_usernames IS NULL OR array_length(p_usernames, 1) IS NULL THEN
    -- Return empty arrays if no usernames provided
    RETURN QUERY SELECT ARRAY[]::text[] AS submitted_usernames, ARRAY[]::text[] AS missing_usernames;
    RETURN;
  END IF;

  -- Loop through DISTINCT, trimmed usernames
  FOR current_username IN
    SELECT DISTINCT trim(u)
    FROM unnest(p_usernames) AS t(u)
    WHERE trim(u) <> ''
  LOOP
    -- Look up profile by username
    SELECT id INTO profile_record
    FROM profiles
    WHERE username = current_username
    LIMIT 1;
    
    IF FOUND THEN
      valid_usernames := array_append(valid_usernames, current_username);
      profile_ids := array_append(profile_ids, profile_record.id);
    ELSE
      invalid_usernames := array_append(invalid_usernames, current_username);
    END IF;
  END LOOP;

  -- For each valid profile, create a submission record
  FOR i IN array_lower(profile_ids, 1)..array_upper(profile_ids, 1) LOOP
    -- Check if assignment already exists
    SELECT * INTO assignment_record
    FROM task_assignments
    WHERE task = p_task_id AND assignee = profile_ids[i];
    
    -- If no assignment exists, create one
    IF NOT FOUND THEN
      INSERT INTO task_assignments (
        task,
        assignee,
        assignee_username,
        assigned_by,
        status,
        submitted_at
      ) VALUES (
        p_task_id,
        profile_ids[i],
        valid_usernames[i],
        auth.uid(), -- The educator creating the task
        'submitted',
        NOW()
      );
    ELSE
      -- If assignment exists, update its status to submitted
      UPDATE task_assignments
      SET status = 'submitted',
          submitted_at = NOW()
      WHERE task = p_task_id AND assignee = profile_ids[i];
    END IF;
  END LOOP;

  -- Return the results
  RETURN QUERY SELECT valid_usernames AS submitted_usernames, invalid_usernames AS missing_usernames;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_submit_task_for_students(uuid, text[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION auto_submit_task_for_students(uuid, text[]) IS 
'Automatically creates task assignments with submitted status for given usernames. 
Used in the Talent3X university flow where educators assign tasks directly to students.';
