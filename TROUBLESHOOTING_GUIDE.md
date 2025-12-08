# Troubleshooting Guide for Bulk Assignment Feature

## Current Issue
Error: "Cannot read properties of undefined (reading 'length')"
This occurs when entering a single student number like "stud38590452593"

## Possible Causes and Solutions

### 1. RPC Function Return Value Issue
**Problem**: The RPC function might not be returning data in the expected format.

**Solution**: 
- Check the browser console logs for the exact structure of the RPC response
- Ensure the database function is properly deployed
- Verify that the function returns both `assigned_usernames` and `missing_usernames` arrays

### 2. Database Schema Mismatch
**Problem**: The RPC function in the database might be outdated.

**Solution**:
- Apply the latest SQL script from `src/scripts/bulk-assign-task-usernames.sql`
- Verify that the function exists in the database
- Check that the function signature matches what the frontend expects

### 3. Single Username Processing
**Problem**: The processing logic might not handle single usernames correctly.

**Debugging Steps**:
1. Check the console logs to see what `processedUsernames` contains
2. Verify that the username exists in the profiles table
3. Ensure the username format is correct

### 4. Error Handling Improvements
The frontend code has been updated with better error handling:
- Added null checks for `rpcData`
- Added logging to inspect the structure of returned data
- Improved error messages for different failure scenarios

## Debugging Steps

### Step 1: Check Browser Console
Look for the following log messages:
- "Calling RPC with usernames:"
- "RPC result:"
- "RPC data structure:"

### Step 2: Verify Database Function
Run this query in your Supabase SQL editor to check if the function exists:
```sql
SELECT proname, proargnames, prorettype 
FROM pg_proc 
WHERE proname = 'assign_task_to_usernames';
```

### Step 3: Test the Function Directly
Test the function with a simple call:
```sql
SELECT * FROM assign_task_to_usernames('some-uuid-here', ARRAY['stud38590452593']);
```

### Step 4: Check Username Existence
Verify that the username exists in the profiles table:
```sql
SELECT * FROM profiles WHERE username = 'stud38590452593';
```

## Common Issues and Fixes

### Issue: Function Not Found
**Error**: "Function assign_task_to_usernames(uuid, text[]) does not exist"

**Fix**: 
1. Apply the SQL script from `src/scripts/bulk-assign-task-usernames.sql`
2. Refresh the database connection

### Issue: Column Not Found
**Error**: "Column 'assigned_by' of relation 'task_assignments' does not exist"

**Fix**:
1. Use the simplified version of the function that only inserts essential fields
2. Ensure the database schema matches the function expectations

### Issue: Empty Response from RPC
**Symptom**: `rpcData` is null or undefined

**Fix**:
1. Check database logs for errors
2. Verify that the user has proper permissions
3. Ensure the task_id is valid

## Validation Checklist

- [ ] Database function is deployed and up-to-date
- [ ] Username exists in the profiles table
- [ ] User has proper permissions to create tasks and assignments
- [ ] Task creation succeeds before attempting assignment
- [ ] RPC function returns properly structured data
- [ ] Frontend handles all possible response scenarios

## Next Steps

1. Apply the updated SQL function
2. Test with a known valid username
3. Check browser console for detailed error information
4. Verify database records are created correctly