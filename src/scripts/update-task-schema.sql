-- Update script to modify tasks table structure
-- This script assumes the ENUM types already exist

-- First, check if the description column already exists
-- If not, add it
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;

-- Copy data from the old fields to the new description field
-- We'll combine the three fields with some formatting
UPDATE tasks 
SET description = CONCAT(
  COALESCE(goal, ''), 
  CASE WHEN goal IS NOT NULL AND (context IS NOT NULL OR deliverables IS NOT NULL) THEN E'\n\n' ELSE '' END,
  COALESCE(context, ''),
  CASE WHEN context IS NOT NULL AND deliverables IS NOT NULL THEN E'\n\n' ELSE '' END,
  COALESCE(deliverables, '')
)
WHERE description IS NULL AND (goal IS NOT NULL OR context IS NOT NULL OR deliverables IS NOT NULL);

-- Now remove the old columns only if they exist
ALTER TABLE tasks DROP COLUMN IF EXISTS goal;
ALTER TABLE tasks DROP COLUMN IF EXISTS context;
ALTER TABLE tasks DROP COLUMN IF EXISTS deliverables;