# Additional Requirements Implementation

## Overview

This document outlines the implementation of the additional requirements you requested:

1. Adding `is_requestable` column to the Supabase schema
2. Updating the Available Tasks Query to exclude non-requestable tasks
3. Fixing skill checkbox visibility in dark mode

## Implementation Details

### 1. `is_requestable` Column

- **Location**: `src/scripts/add-is-requestable-column.sql`
- **Function**: Added a boolean column `is_requestable` to the `tasks` table with a default value of `true`
- **Logic**: 
  - When creating a task with assigned usernames, `is_requestable` is set to `false`
  - When creating a task without assigned usernames, `is_requestable` remains `true`

### 2. Updated Available Tasks Query

- **Location**: `src/scripts/update-student-task-query.sql`
- **Function**: Sample SQL query showing how to fetch available tasks for students
- **Logic**:
  - Only fetch tasks where `is_requestable = true`
  - Exclude tasks already assigned to the current user
  - Only show open tasks

### 3. Skill Checkbox Visibility Fix

- **Location**: `src/app/globals.css`
- **Function**: Added CSS rules to make checkboxes visible in dark mode
- **Implementation**:
  - White border for unchecked checkboxes
  - Purple fill for checked checkboxes
  - Applied globally through the `.skill-checkbox` class

## Files Modified

1. `src/app/e/tasks/create/page.tsx` - Added logic to set `is_requestable` based on username assignments
2. `src/app/globals.css` - Added CSS for checkbox visibility
3. `src/scripts/add-is-requestable-column.sql` - Migration script for adding the column
4. `src/scripts/update-student-task-query.sql` - Example query for student task browsing

## Next Steps

To fully implement these changes:

1. Apply the database migration script to add the `is_requestable` column
2. Update the student task browsing endpoint to use the new query logic
3. Deploy the frontend changes

## Validation Criteria

- [ ] Tasks with assigned usernames should ONLY appear in 'My Tasks'
- [ ] Browse Tasks page must not show these tasks anymore
- [ ] Skill checkboxes must clearly appear white/unfilled in dark mode and visibly purple when selected