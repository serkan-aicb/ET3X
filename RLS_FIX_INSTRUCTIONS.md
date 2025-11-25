# RLS Policy Fix for Infinite Recursion Error

## Problem
The application is experiencing an "infinite recursion detected in policy for relation 'tasks'" error when users try to log in. This is caused by circular references in the Row Level Security (RLS) policies.

## Root Cause
The issue occurs because the profiles table policies reference task_requests and task_assignments tables, which in turn reference the tasks table, which then references the profiles table again, creating a circular dependency.

## Solution
We've created SQL scripts to fix the RLS policies and eliminate the circular references:

1. `src/scripts/apply-critical-fix.sql` - Applies only the critical fix for the immediate issue
2. `src/scripts/fix-infinite-recursion-rls.sql` - A more targeted fix for the specific problem
3. `src/scripts/fix-all-rls-policies.sql` - A comprehensive fix for all RLS policies

## How to Apply the Fix

1. **Using the Supabase SQL Editor:**
   - Copy the contents of `src/scripts/apply-critical-fix.sql`
   - Paste and run it in your Supabase SQL Editor

2. **Using the Supabase CLI (if installed):**
   ```bash
   supabase sql -f src/scripts/apply-critical-fix.sql
   ```

## Verification
After applying the fix, try logging in again. The infinite recursion error should be resolved.

## Additional Notes
- The fix maintains the same security model but uses subqueries that don't create circular references
- All existing functionality should remain intact
- If you continue to experience issues, you may need to apply the comprehensive fix in `fix-all-rls-policies.sql`