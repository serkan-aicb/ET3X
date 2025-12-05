-- Add matriculation_number column to profiles table
-- This migration adds the matriculation_number column to store student numbers

-- Add the column with UNIQUE constraint
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS matriculation_number TEXT UNIQUE;

-- Add a comment to describe the column
COMMENT ON COLUMN profiles.matriculation_number IS 'Student number for identification';

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_matriculation_number ON profiles(matriculation_number);