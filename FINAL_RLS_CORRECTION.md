# Final RLS Policy Correction

This document describes the final correction for all Row Level Security (RLS) policy issues in the Talent3X platform that were causing 500 Internal Server Errors when users tried to access their profiles.

## Problem Description

Users were encountering a 500 Internal Server Error when attempting to access their own profiles:
```
GET https://xgxuzuadnahqagzqtwqf.supabase.co/rest/v1/profiles?select=matriculation_number&id=eq.USER_ID
500 (Internal Server Error)
```

This prevented users from logging in and accessing their student number information.

## Root Causes Analysis

Based on the corrected table structure information, the issues were:

1. **Missing NULL Checks**: Policies didn't properly handle cases where `auth.uid()` was NULL
2. **Circular References**: Some policies were causing infinite recursion through JOIN operations
3. **Incomplete Policy Coverage**: Essential policies were missing or incorrectly configured

## Corrected Table Structure

The profiles table has the following structure:
- `id` (uuid, primary key)
- `role` (text, type user_role - values: student, educator)
- `username` (text, unique)
- `did` (text, unique - DID string like did:web:talent3x.io:...)
- `email_ciphertext` (text - encrypted email)
- `email_digest` (text, unique - hashed email)
- `matriculation_number` (text or null)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Note: There is only one role field (`role`), not separate `role` and `user_role` fields.

## Solution

The final correction addresses all issues through:

1. **Complete Policy Reset**: All existing policies are dropped to eliminate conflicts
2. **Proper Policy Recreation**: Policies are recreated with optimized implementations
3. **Recursion Prevention**: Educator policies use subqueries instead of joins to avoid circular references
4. **Enhanced Error Handling**: Added comprehensive NULL checking and proper validation conditions
5. **Full Coverage**: All necessary policies for all tables are implemented

## Key Improvements

### 1. Profiles Table Policies
- Enhanced "Users can view their own profile" policy with explicit NULL checking:
  ```sql
  CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (
      auth.uid() IS NOT NULL AND auth.uid() = id
    );
  ```
- Optimized educator policies using subqueries to prevent infinite recursion
- Proper separation of concerns for different access patterns

### 2. All Table Policies
- Ensured RLS is enabled on all tables
- Implemented consistent policy naming and structure
- Added proper INSERT, UPDATE, and SELECT policies where needed

### 3. Circular Reference Prevention
- Replaced JOIN-based educator policies with subquery-based implementations:
  ```sql
  CREATE POLICY "Educators can view profiles of students who requested their tasks" ON profiles
    FOR SELECT USING (
      id IN (
        SELECT DISTINCT tr.applicant
        FROM task_requests tr
        INNER JOIN tasks t ON tr.task = t.id
        WHERE t.creator = auth.uid()
          AND tr.applicant IS NOT NULL
      )
    );
  ```

## Implementation

To apply the fix:

1. Execute the SQL script `src/scripts/final-rps-correction.sql` on your Supabase database
2. Verify successful execution by checking the output of the verification query at the end of the script

## Verification

After applying the fix, users should be able to:

1. Log in without encountering 500 errors
2. Access their profile data, including student number
3. Navigate to all application features without authentication issues
4. Experience improved performance due to optimized policies

## Prevention

To prevent similar issues in the future:

1. Always test RLS policies with various authentication states
2. Use subqueries instead of joins in complex policies to avoid recursion
3. Include comprehensive NULL checking in all policy conditions
4. Maintain consistent policy naming and structure across all tables
5. Regularly audit policies when making schema changes
6. Monitor application logs for RLS-related errors

## Rollback Plan

If issues occur after applying this fix:

1. Restore the database from backup
2. Apply the previous known-good RLS policy configuration
3. Contact the development team for assistance