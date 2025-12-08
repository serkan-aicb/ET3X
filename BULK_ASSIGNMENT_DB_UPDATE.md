# Database Update for Bulk Assignment Feature

## Issue Identified

There was an error when trying to use the bulk assignment feature:
```
column "assigned_by" of relation "task_assignments" does not exist
```

This error suggests that the RPC function in the database is outdated and doesn't match the current schema.

## Solution

The updated SQL function has been saved in `src/scripts/bulk-assign-task-usernames.sql`. You need to apply this to your database.

## How to Apply the Update

Since the Supabase CLI is not available, you'll need to manually apply the SQL script through the Supabase dashboard:

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `src/scripts/bulk-assign-task-usernames.sql`
4. Paste it into the SQL Editor
5. Run the script

## Alternative Method

If you have direct database access, you can run the SQL script directly against your database.

## Verification

After applying the update, you can verify the function works by:

1. Creating a new task in the educator interface
2. Adding valid student usernames in the "Assigned Usernames" field
3. Checking that the task is created and assignments are made correctly

## Troubleshooting

If you continue to experience issues:

1. Verify that the `task_assignments` table has the `assigned_by` column
2. Check that the `pgcrypto` extension is enabled in your database
3. Ensure that the function was applied without errors

## Contact Support

If you continue to have issues after applying this update, please contact the development team for assistance.