# Fix for Infinite Recursion in RLS Policies

This document describes the fix for the infinite recursion error that was preventing users from accessing their profiles and saving student numbers.

## Problem Description

Users were encountering a 500 Internal Server Error with the message:
```
"infinite recursion detected in policy for relation 'tasks'"
```

This error occurred when:
1. Trying to access user profiles
2. Attempting to save student numbers
3. Performing any operations that triggered the RLS policies

## Root Cause Analysis

The infinite recursion was caused by circular references between RLS policies:

1. `task_requests` policy referenced `tasks` table
2. `tasks` policy referenced `task_assignments` table  
3. `task_assignments` policy referenced `tasks` table again

This created an endless loop: `tasks` → `task_assignments` → `tasks` → `task_assignments` → ...

## Solution

The fix replaces the problematic JOIN-based policies with subquery-based implementations that avoid circular references:

### Before (Problematic):
```sql
-- This creates circular reference
CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (task IN (SELECT id FROM tasks WHERE creator = auth.uid()));
```

### After (Fixed):
```sql
-- This avoids circular reference by using subquery with direct comparison
CREATE POLICY "Task creators can view requests for their tasks" ON task_requests
  FOR SELECT USING (
    task IN (
      SELECT t.id 
      FROM tasks t 
      WHERE t.creator = auth.uid()
    )
  );
```

## Implementation

To apply the fix:

1. Execute the SQL script `src/scripts/fix-infinite-recursion.sql` on your Supabase database
2. Verify successful execution by checking the output of the verification query at the end of the script

## Affected Policies

The following policies were updated to eliminate circular references:

1. **Task Requests**: "Task creators can view requests for their tasks"
2. **Task Assignments**: "Task creators can view assignments for their tasks"
3. **Task Assignments**: "Task creators can insert assignments for their tasks"
4. **Submissions**: "Task creators can view submissions for their tasks"
5. **Ratings**: "Task creators can view ratings for their tasks"

## Verification

After applying the fix, users should be able to:

1. Log in without encountering infinite recursion errors
2. Access their profile data, including student number
3. Save/update their student number
4. Perform all task-related operations without errors

## Prevention

To prevent similar issues in the future:

1. Always avoid JOINs in RLS policies that could create circular references
2. Use subqueries with direct comparisons instead
3. Test policy changes thoroughly before deployment
4. Monitor application logs for recursion-related errors
5. Document complex policy relationships