# Bulk Assignment Feature for Talent3X University Flow

## Overview

This feature implements the new Talent3X university flow where educators assign tasks directly to students by pasting usernames during task creation. Students no longer request tasks or submit results through the platform; professors rate them directly.

## Key Changes

### 1. Database Changes

- Created a new RPC function `assign_task_to_usernames(task_id uuid, usernames text[])` that:
  - Validates usernames against the `profiles.username` table
  - Creates task assignments for valid usernames
  - Returns lists of successfully assigned and missing usernames
  - Ensures security through RLS policies

### 2. UI Changes

- Modified the "Create Task" form to:
  - Remove deprecated fields:
    - "Number of Participants" (seats)
    - "Task Mode" (Single Assignment / Multi Assignment)
  - Add new "Assigned Usernames" textarea for bulk assignment
  - Include validation and error handling for username validation

### 3. Workflow Changes

- New flow:
  1. Educator creates a task
  2. During creation, they paste student usernames (one per line)
  3. System validates all usernames
  4. If all valid, creates task and assignments
  5. If any invalid, shows error and prevents task creation
  6. Students no longer submit work; professors rate directly

## Implementation Details

### SQL Migration

The SQL migration file is located at `src/scripts/bulk-assign-task-usernames.sql` and includes:

1. Ensuring a unique index on `profiles.username`
2. Creating the `assign_task_to_usernames` RPC function
3. Setting appropriate security with `SECURITY DEFINER`
4. Granting execute permissions to authenticated users
5. Adding documentation comments

### Frontend Implementation

The Create Task page (`src/app/e/tasks/create/page.tsx`) has been updated to:

1. Remove deprecated form fields
2. Add the new "Assigned Usernames" textarea
3. Implement username processing logic (trimming, deduplication)
4. Add validation for large username lists
5. Implement the new submission workflow with RPC calls
6. Add proper error handling and user feedback
7. Include extensive comments for future maintenance

## Security

The implementation maintains security through:

1. RLS policies on the `task_assignments` table that ensure educators can only assign their own tasks
2. The RPC function uses `SECURITY DEFINER` but still respects underlying table policies
3. Input validation for all user-provided data
4. Authentication checks before any database operations

## Future Cleanup

Deprecated features that can be removed in future iterations:

1. Task request system (`task_requests` table and related UI)
2. Student submission system (`submissions` table and related UI)
3. "Number of Participants" field
4. "Task Mode" field

Comments have been added throughout the codebase to facilitate this cleanup.

## Usage Instructions

1. Navigate to the "Create Task" page as an educator
2. Fill in the task details (title, description, etc.)
3. In the "Assigned Usernames" field, paste student usernames (one per line)
4. Click "Create Task"
5. The system will validate usernames and either:
   - Create the task and assignments if all usernames are valid
   - Show an error with invalid usernames if any don't exist

## Error Handling

The system handles various error conditions:

- Invalid usernames: Shows a list of missing usernames
- Network errors: Displays generic error messages
- Large username lists: Shows a warning but allows proceeding
- Database errors: Provides appropriate error feedback to users