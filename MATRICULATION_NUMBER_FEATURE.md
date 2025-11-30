# Matriculation Number Feature Implementation

This document describes the implementation of the matriculation number feature for the Talent3X platform.

## Overview

The matriculation number feature allows students to provide their university matriculation numbers for identification purposes. This information is collected during the signup process and can be viewed by educators when managing tasks.

## Implementation Details

### 1. Database Changes

- Added a `matriculation_number` column to the `profiles` table
- Added a UNIQUE constraint to ensure each matriculation number is unique
- Added validation constraints to ensure matriculation numbers:
  - Are between 5-20 characters long
  - Contain only alphanumeric characters (letters and numbers)
  - Can be NULL for users who haven't provided one yet

### 2. Signup Flow

- New students are redirected to a matriculation number collection page after email verification
- Existing users who don't have a matriculation number are also redirected to this page when accessing their dashboard
- The collection page requires users to enter their matriculation number before proceeding to the main dashboard

### 3. Profile Management

- Students can view and edit their matriculation number in their profile page
- Validation is performed both on the frontend and backend to ensure proper formatting

### 4. Educator Views

- Educators can see student matriculation numbers in task detail pages
- Matriculation numbers are displayed alongside student usernames and DIDs in both task requests and assignments sections

## Files Modified/Added

### Database Schema
- `src/scripts/supabase-schema.sql` - Added matriculation_number column
- `src/scripts/add-matriculation-number-column.sql` - Migration script for existing databases
- `src/scripts/add-matriculation-validation.sql` - Validation constraints and triggers

### Frontend Pages
- `src/app/s/profile/page.tsx` - Updated student profile page to display/edit matriculation number
- `src/app/s/collect-matriculation/page.tsx` - New page for collecting matriculation numbers
- `src/app/s/dashboard/page.tsx` - Updated to redirect users without matriculation numbers
- `src/app/e/tasks/[taskId]/page.tsx` - Updated to display student matriculation numbers
- `src/app/auth/callback/route.ts` - Updated to redirect new students to matriculation collection page

## Validation Rules

Matriculation numbers must follow these rules:
1. Length: 5-20 characters
2. Characters: Letters (A-Z, a-z) and numbers (0-9) only
3. Uniqueness: Each matriculation number must be unique across the platform
4. Optional: Can be NULL for users who haven't provided one yet

## User Experience

### For New Students
1. Enter email on student login page
2. Receive magic link via email
3. Click magic link to verify email
4. Redirected to matriculation number collection page
5. Enter matriculation number and save
6. Proceed to dashboard

### For Existing Students (without matriculation number)
1. Attempt to access dashboard
2. Automatically redirected to matriculation number collection page
3. Enter matriculation number and save
4. Proceed to dashboard

### For Students (with matriculation number)
1. View and edit matriculation number in profile page
2. Validation ensures proper formatting

### For Educators
1. View student matriculation numbers in task detail pages
2. Matriculation numbers displayed alongside username and DID

## Error Handling

- Clear error messages for invalid matriculation number formats
- Proper handling of duplicate matriculation numbers
- Graceful handling of database errors
- User-friendly validation feedback

## Security Considerations

- Matriculation numbers are stored securely in the database
- Access controls ensure only authorized users can view matriculation numbers
- Educators can only see matriculation numbers of students in their tasks
- Students can only see/edit their own matriculation number