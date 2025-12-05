# Fix for Profiles RLS Issue

This document describes the fix for the "error fetching student number" issue that was causing a 500 Internal Server Error when users tried to access their own profiles.

## Problem Description

The error occurred when the application attempted to fetch a user's profile with the following request:
```
GET https://xgxuzuadnahqagzqtwqf.supabase.co/rest/v1/profiles?select=matriculation_number&id=eq.USER_ID
```

This resulted in a 500 Internal Server Error, preventing users from accessing their profile data, including their student number.

## Root Cause

The issue was caused by improper Row Level Security (RLS) policies on the `profiles` table. Specifically, the "Users can view their own profile" policy was not correctly handling cases where:

1. The user was not properly authenticated
2. The `auth.uid()` function returned NULL
3. There was a mismatch between the authentication context and the policy conditions

## Solution

The fix involves recreating the RLS policies on the `profiles` table with more robust error handling:

1. **Enhanced User Profile Policy**: The "Users can view their own profile" policy now includes explicit NULL checking to prevent errors when `auth.uid()` is not available.

2. **Clean Policy Recreation**: All existing policies are dropped and recreated to ensure a clean state without conflicting or outdated policies.

3. **Improved Error Handling**: The policies now include better safeguards against edge cases that could cause internal server errors.

## Implementation

To apply the fix:

1. Run the SQL script `src/scripts/fix-profiles-rls.sql` on your Supabase database
2. Verify that the policies were created successfully by checking the output of the verification query at the end of the script

## Verification

After applying the fix, users should be able to:

1. Log in without encountering the "error fetching student number" message
2. Access their profile data, including their student number
3. Navigate to the student number collection page if they don't have one set
4. Update their student number in their profile settings

## Prevention

To prevent similar issues in the future:

1. Always test RLS policies with various authentication states
2. Include NULL checking in policy conditions
3. Regularly review and update RLS policies when making schema changes
4. Monitor application logs for RLS-related errors