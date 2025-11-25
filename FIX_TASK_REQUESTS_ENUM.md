# Fix for Task Requests Enum Issue

## Problem Description

Students are unable to see published tasks in the Talent3X platform. The issue is caused by an enum value mismatch in the database.

Error message:
```
invalid input value for enum request_status: "pending"
```

This error occurs when the frontend tries to query task requests with status values that don't match what's defined in the database enum.

## Root Cause

The issue is caused by inconsistent enum values between:
1. The database schema definition
2. The actual enum values stored in the database
3. The frontend code making queries

The [request_status](file:///C:/Users/preda/unitalent3x/src/lib/supabase/types.ts#L354-L354) enum should have values: `pending`, `accepted`, `declined`

However, the database might contain old values like: `requested`, `approved`, `rejected`

## Solution Implemented

### 1. Frontend Code Fixes

Updated the frontend code to handle enum errors gracefully and use the correct enum values:

1. **Student Tasks Page** ([src/app/s/tasks/page.tsx](file:///C:/Users/preda/unitalent3x/src/app/s/tasks/page.tsx)):
   - Added error handling for enum validation errors
   - Implemented fallback queries when enum errors occur
   - Used `.or('status.eq.pending,status.eq.accepted')` instead of `.in('status', ['pending', 'accepted'])`

2. **Educator Task Detail Page** ([src/app/e/tasks/[taskId]/page.tsx](file:///C:/Users/preda/unitalent3x/src/app/e/tasks/%5BtaskId%5D/page.tsx)):
   - Fixed incorrect enum values:
     - `approved` → `accepted`
     - `rejected` → `declined`
   - Added error handling for enum validation errors
   - Implemented fallback queries when enum errors occur

### 2. Database Fix Script

Created a SQL script ([src/scripts/fix-request-status-enum.sql](file:///C:/Users/preda/unitalent3x/src/scripts/fix-request-status-enum.sql)) to fix the database enum values:

```sql
-- Recreate the enum with correct values
DROP TYPE IF EXISTS request_status CASCADE;
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');

-- Map old values to new ones
UPDATE task_requests 
SET status = CASE 
    WHEN temp_status = 'requested' THEN 'pending'
    WHEN temp_status = 'approved' THEN 'accepted'
    WHEN temp_status = 'rejected' THEN 'declined'
    WHEN temp_status = 'pending' THEN 'pending'
    WHEN temp_status = 'accepted' THEN 'accepted'
    WHEN temp_status = 'declined' THEN 'declined'
    ELSE 'pending'
END;
```

## How to Apply the Fix

### Option 1: Quick Fix (Frontend Only)
The frontend changes will allow the application to work even with incorrect database enum values by using fallback queries.

### Option 2: Complete Fix (Database + Frontend)
1. Run the database fix script in your Supabase SQL editor
2. Apply the frontend code changes

## Verification

After applying the fix, students should be able to:
1. See published tasks in the "Available Tasks" list
2. Request tasks without encountering enum errors
3. View task details properly

Educators should be able to:
1. View task requests with correct status filtering
2. Approve/decline requests without enum errors
3. Assign tasks properly

## Prevention

To prevent similar issues in the future:
1. Always use consistent enum values across schema, database, and frontend code
2. Implement proper database migration scripts when changing enum values
3. Add comprehensive error handling for database queries
4. Test enum changes thoroughly in development before deploying to production