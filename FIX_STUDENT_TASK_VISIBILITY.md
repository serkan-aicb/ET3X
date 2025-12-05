# Fix for Student Task Visibility Issue

## Problem Description

After fixing the infinite recursion issue in RLS policies, students reported that they can no longer see available tasks in the system. This prevents them from browsing and requesting new tasks to work on.

## Root Cause Analysis

The issue is caused by improperly configured RLS policies for the `tasks` table. Specifically:

1. The policy that allows students to view open tasks was either missing or not functioning correctly
2. The complex client-side filtering in the frontend requires multiple data sources that weren't all accessible due to RLS restrictions
3. After the infinite recursion fix, some policies were dropped but not properly recreated

## Solution

The fix involves recreating the essential RLS policies with the correct permissions:

### Key Policies Created

1. **"Students can view open tasks"** - Allows students to browse open tasks (critical for the main task listing page)
2. **"Students can view their task assignments"** - Allows students to see their assigned tasks (for the "My Tasks" page)
3. **"Students can view their task requests"** - Allows students to see their own requests
4. **"Assignees can view their assigned tasks"** - Enables the join functionality needed by the frontend
5. **"Task creators can view assignments for their tasks"** - Maintains educator functionality

## Implementation

To apply the fix:

1. Execute the SQL script `src/scripts/fix-student-task-visibility.sql` on your Supabase database
2. Verify successful execution by checking the output of the verification query at the end of the script

## Technical Details

The frontend task browsing logic in `src/app/s/tasks/page.tsx` implements a complex algorithm that:

1. Fetches all open tasks from the database
2. Filters tasks based on:
   - Tasks the student is already assigned to
   - Tasks the student has pending/accepted requests for
   - For single tasks: whether someone else is already assigned
3. Enriches tasks with skills data

This requires the backend to have proper RLS policies to allow access to:
- The tasks table (for open tasks)
- The task_assignments table (to check existing assignments)
- The task_requests table (to check existing requests)

## Verification

After applying the fix, students should be able to:

1. See available tasks on the main task browsing page (`/s/tasks`)
2. View their assigned tasks on the "My Tasks" page (`/s/my-tasks`)
3. Request new tasks without permission errors
4. Access all task details without 500 errors

## Prevention

To prevent similar issues in the future:

1. Always test RLS policy changes with all user roles
2. Ensure that frontend logic has the necessary backend permissions
3. Document complex permission requirements
4. Create integration tests that verify cross-table access patterns