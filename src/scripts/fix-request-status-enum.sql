-- Script to fix the request_status enum values
-- This script will ensure the enum has the correct values: 'pending', 'accepted', 'declined'

-- First, let's check what enum values currently exist
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'request_status' 
ORDER BY e.enumsortorder;

-- Check current data in task_requests table
SELECT DISTINCT status FROM task_requests ORDER BY status;

-- If the enum doesn't have the correct values, we need to recreate it
-- But first, we need to drop any dependencies

-- Add a temporary column to store the current status values
ALTER TABLE task_requests ADD COLUMN temp_status TEXT;

-- Copy current status values to the temporary column
UPDATE task_requests SET temp_status = status;

-- Drop the status column
ALTER TABLE task_requests DROP COLUMN status;

-- Recreate the enum with correct values
DROP TYPE IF EXISTS request_status CASCADE;
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');

-- Add the status column back with the correct enum type
ALTER TABLE task_requests ADD COLUMN status request_status DEFAULT 'pending';

-- Restore the status values from the temporary column
-- Map any old values to the new ones
UPDATE task_requests 
SET status = CASE 
    WHEN temp_status = 'requested' THEN 'pending'
    WHEN temp_status = 'approved' THEN 'accepted'
    WHEN temp_status = 'rejected' THEN 'declined'
    WHEN temp_status = 'pending' THEN 'pending'
    WHEN temp_status = 'accepted' THEN 'accepted'
    WHEN temp_status = 'declined' THEN 'declined'
    ELSE 'pending'  -- default fallback
END;

-- Drop the temporary column
ALTER TABLE task_requests DROP COLUMN temp_status;

-- Verify the fix worked
SELECT DISTINCT status FROM task_requests ORDER BY status;