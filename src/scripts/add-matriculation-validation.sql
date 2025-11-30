-- Add validation and constraints for matriculation numbers
-- This migration adds validation constraints to ensure matriculation numbers are properly formatted

-- Add a check constraint to ensure matriculation numbers are valid
-- This constraint ensures matriculation numbers are:
-- 1. Not empty when provided
-- 2. Contain only alphanumeric characters (no special characters)
-- 3. Have a reasonable length (between 5 and 20 characters)

ALTER TABLE profiles 
ADD CONSTRAINT valid_matriculation_number 
CHECK (
  matriculation_number IS NULL OR (
    LENGTH(TRIM(matriculation_number)) BETWEEN 5 AND 20 AND
    matriculation_number ~ '^[A-Za-z0-9]+$'
  )
);

-- Add a comment to describe the constraint
COMMENT ON CONSTRAINT valid_matriculation_number ON profiles 
IS 'Ensures matriculation numbers are between 5-20 alphanumeric characters';

-- Create a function to validate matriculation numbers before insert/update
-- This provides more detailed error messages
CREATE OR REPLACE FUNCTION validate_matriculation_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation if matriculation_number is NULL
  IF NEW.matriculation_number IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Trim whitespace
  NEW.matriculation_number = TRIM(NEW.matriculation_number);
  
  -- Check if empty after trimming
  IF LENGTH(NEW.matriculation_number) = 0 THEN
    RAISE EXCEPTION 'Matriculation number cannot be empty';
  END IF;
  
  -- Check length
  IF LENGTH(NEW.matriculation_number) < 5 OR LENGTH(NEW.matriculation_number) > 20 THEN
    RAISE EXCEPTION 'Matriculation number must be between 5 and 20 characters';
  END IF;
  
  -- Check for valid characters (alphanumeric only)
  IF NEW.matriculation_number !~ '^[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Matriculation number can only contain letters and numbers';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate matriculation numbers on insert/update
DROP TRIGGER IF EXISTS validate_matriculation_number_trigger ON profiles;
CREATE TRIGGER validate_matriculation_number_trigger
  BEFORE INSERT OR UPDATE OF matriculation_number ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_matriculation_number();

-- Add a comment to describe the trigger
COMMENT ON TRIGGER validate_matriculation_number_trigger ON profiles 
IS 'Validates matriculation numbers before insert or update';