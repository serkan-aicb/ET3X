# Student Number Feature Implementation

This document describes the implementation of the student number feature for the Talent3X platform.

## Overview

The student number feature allows students to provide their university student numbers for identification purposes. This information is collected during the signup process and can be viewed by educators when managing tasks. The field is optional.

## Implementation Details

### 1. Database Changes

- Added a `matriculation_number` column to the `profiles` table
- Added `applicant_matriculation_number` column to the `task_requests` table
- Added `assignee_matriculation_number` column to the `task_assignments` table
- Added a UNIQUE constraint to ensure each student number is unique
- Added validation constraints to ensure student numbers:
  - Are between 5-20 characters long
  - Contain only alphanumeric characters (letters and numbers)
  - Can be NULL for users who haven't provided one yet (optional field)

### 2. Signup Flow

- New students are redirected to a student number collection page after email verification
- Existing users who don't have a student number are also redirected to this page when accessing their dashboard
- The collection page allows users to enter their student number before proceeding to the main dashboard
- Student number is now optional, so users can skip this step if they wish

### 3. Profile Management

- Students can view and edit their student number in their profile page
- Validation is performed both on the frontend and backend to ensure proper formatting
- Since the field is optional, users can leave it blank

### 4. Educator Views

- Educators can see student numbers in task detail pages
- Student Numbers are displayed alongside student usernames in both task requests and assignments sections
- The label has been changed from "Matriculation:" to "Student Number:" for clarity
- When a student doesn't have a student number, this information is simply not displayed

## Files Modified/Added

### Database Schema
- `src/scripts/supabase-schema.sql` - Added student number columns
- `src/scripts/add-matriculation-number-column.sql` - Migration script for existing databases
- `src/scripts/add-matriculation-validation.sql` - Validation constraints and triggers
- `src/scripts/fix-matriculation-number-consistency.sql` - Consistency script for all tables

### Frontend Pages
- `src/app/s/profile/page.tsx` - Updated student profile page to display/edit student number
- `src/app/s/collect-matriculation/page.tsx` - New page for collecting student numbers
- `src/app/s/dashboard/page.tsx` - Updated to redirect users without student numbers
- `src/app/e/tasks/[taskId]/page.tsx` - Updated to display student numbers as "Student Number:"
- `src/app/auth/callback/route.ts` - Updated to redirect new students to student number collection page

### Type Definitions
- `src/lib/supabase/types.ts` - Updated to include new student number fields in all tables

## Validation Rules

Student numbers must follow these rules:
1. Length: 5-20 characters
2. Characters: Letters (A-Z, a-z) and numbers (0-9) only
3. Uniqueness: Each student number must be unique across the platform
4. Optional: Can be NULL for users who haven't provided one yet

## User Experience

### For New Students
1. Enter email on student login page
2. Receive magic link via email
3. Click magic link to verify email
4. Redirected to student number collection page
5. Can optionally enter student number and save
6. Proceed to dashboard

### For Existing Students (without student number)
1. Attempt to access dashboard
2. Automatically redirected to student number collection page
3. Can optionally enter student number and save
4. Proceed to dashboard

### For Students (with student number)
1. View and edit student number in profile page
2. Validation ensures proper formatting

### For Educators
1. View student numbers in task detail pages
2. Student Numbers displayed as "Student Number: u234123" when present
3. If a student hasn't provided a student number, it's simply not shown

## Error Handling

- Clear error messages for invalid student number formats
- Proper handling of duplicate student numbers
- Graceful handling of database errors
- User-friendly validation feedback

## Security Considerations

- Student numbers are stored securely in the database
- Access controls ensure only authorized users can view student numbers
- Educators can only see student numbers of students in their tasks
- Students can only see/edit their own student number