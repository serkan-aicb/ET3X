-- Script to deprecate old columns in the ratings table
-- This script should be run after the migration is complete and verified

-- First, rename the old columns to mark them as deprecated
ALTER TABLE ratings RENAME COLUMN skills TO skills_deprecated;
ALTER TABLE ratings RENAME COLUMN cid TO cid_deprecated;

-- Add a comment to indicate these columns are deprecated
COMMENT ON COLUMN ratings.skills_deprecated IS 'Deprecated: Use task_rating_skills table instead';
COMMENT ON COLUMN ratings.cid_deprecated IS 'Deprecated: Not used in new system';

-- Note: We're not dropping these columns yet to preserve historical data
-- They can be dropped later after confirming the migration is successful