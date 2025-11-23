-- Migration script to add username columns to task_assignments and task_requests tables

-- Add assignee_username column to task_assignments table
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS assignee_username TEXT;

-- Add applicant_username column to task_requests table
ALTER TABLE task_requests ADD COLUMN IF NOT EXISTS applicant_username TEXT;