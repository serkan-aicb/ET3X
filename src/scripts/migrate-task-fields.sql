-- Migration script to replace goal, context, and deliverables with description field

-- Add the new description column
ALTER TABLE tasks ADD COLUMN description TEXT;

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
WHERE goal IS NOT NULL OR context IS NOT NULL OR deliverables IS NOT NULL;

-- Remove the old columns
ALTER TABLE tasks DROP COLUMN goal;
ALTER TABLE tasks DROP COLUMN context;
ALTER TABLE tasks DROP COLUMN deliverables;