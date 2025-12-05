# Student Number Refactoring

This document describes the refactoring of the matriculation number feature to rename it to "Student Number" and make it optional.

## Changes Made

### 1. Database Schema Updates

- Added `matriculation_number` column to `profiles` table (already existed)
- Added `applicant_matriculation_number` column to `task_requests` table
- Added `assignee_matriculation_number` column to `task_assignments` table
- Ensured all student number fields are optional (NULLABLE)
- Added proper constraints and validation for student numbers
- Created indexes for better performance

### 2. Type Definitions

Updated `src/lib/supabase/types.ts` to include the new fields:
- `matriculation_number` in `profiles` table definition
- `applicant_matriculation_number` in `task_requests` table definition
- `assignee_matriculation_number` in `task_assignments` table definition

### 3. UI Updates

Changed the display text from "Matriculation:" to "Student Number:" in the educator task detail view:
- In the task requests section
- In the assigned students section

### 4. Data Migration

Created a script to populate the new columns with existing student numbers from the profiles table:
- Updated `task_requests` with applicant student numbers
- Updated `task_assignments` with assignee student numbers

## Implementation Details

### Making Student Number Optional

The student number field is now optional in all tables:
- Allows NULL values
- Updated validation constraints to permit NULL values
- Frontend handles cases where student number is not present

### Renaming to Student Number

All user-facing references have been updated from "Matriculation Number" to "Student Number":
- Display labels in educator views
- Maintains backward compatibility with existing data

## SQL Scripts

### fix-matriculation-number-consistency.sql

This script ensures consistency across all tables and includes:
- Column creation with IF NOT EXISTS checks
- Data population from existing profiles
- Constraint validation
- Index creation for performance
- Column comments for documentation

## Validation

The system validates student numbers to ensure:
- Length between 5-20 characters
- Contains only alphanumeric characters
- NULL values are permitted (making it optional)

## Testing

After applying these changes, verify that:
1. Student Number is displayed as "Student Number: u234123" when present
2. Student Number field is optional and doesn't prevent profile creation/update
3. Educators can still view task requests and assignments correctly
4. All existing functionality continues to work as expected