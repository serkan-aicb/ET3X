-- Migration script to remove the recurrence column and recurrence_type ENUM from the database

-- First, drop the column from the tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS recurrence;

-- Then, drop the ENUM type (this will only work if no other tables reference it)
DROP TYPE IF EXISTS recurrence_type;