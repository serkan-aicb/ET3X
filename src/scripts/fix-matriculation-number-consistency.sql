-- Fix student number consistency across tables
-- This script ensures that all student number fields are properly defined and consistent

-- Add matriculation_number column to profiles table if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS matriculation_number TEXT UNIQUE;

-- Add applicant_matriculation_number column to task_requests table if not exists
ALTER TABLE task_requests 
ADD COLUMN IF NOT EXISTS applicant_matriculation_number TEXT;

-- Add assignee_matriculation_number column to task_assignments table if not exists
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS assignee_matriculation_number TEXT;

-- Update task_requests with student numbers from profiles
UPDATE task_requests tr
SET applicant_matriculation_number = p.matriculation_number
FROM profiles p
WHERE tr.applicant = p.id
AND tr.applicant_matriculation_number IS NULL;

-- Update task_assignments with student numbers from profiles
UPDATE task_assignments ta
SET assignee_matriculation_number = p.matriculation_number
FROM profiles p
WHERE ta.assignee = p.id
AND ta.assignee_matriculation_number IS NULL;

-- Ensure the constraint for student numbers exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_student_number' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT valid_student_number 
    CHECK (
      matriculation_number IS NULL OR (
        LENGTH(TRIM(matriculation_number)) BETWEEN 5 AND 20 AND
        matriculation_number ~ '^[A-Za-z0-9]+$'
      )
    );
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_matriculation_number ON profiles(matriculation_number);
CREATE INDEX IF NOT EXISTS idx_task_requests_applicant_matriculation_number ON task_requests(applicant_matriculation_number);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee_matriculation_number ON task_assignments(assignee_matriculation_number);

-- Add comments to describe the columns
COMMENT ON COLUMN profiles.matriculation_number IS 'Student number for identification';
COMMENT ON COLUMN task_requests.applicant_matriculation_number IS 'Student number of the applicant at the time of request';
COMMENT ON COLUMN task_assignments.assignee_matriculation_number IS 'Student number of the assignee at the time of assignment';