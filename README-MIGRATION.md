# Username-based Assignment Migration

This document describes the migration process to change `task_assignments.assignee` and `task_requests.applicant` from UUID references to username references.

## Overview

The current implementation uses UUIDs to reference users in the `task_assignments` and `task_requests` tables. This migration adds username-based references to improve readability and simplify some queries.

## Migration Steps

### 1. Database Schema Changes

Run the migration script `src/scripts/migrate-username-fields.sql` to:

1. Add new columns `applicant_username` and `assignee_username` to the respective tables
2. Populate these columns with username values based on existing UUID references
3. Update indexes and RLS policies to support the new columns
4. Keep existing UUID columns for backward compatibility

### 2. Application Code Changes

The application code has been updated to:

1. Use both UUID and username references when creating new records
2. Prefer username-based queries when possible
3. Fall back to UUID-based queries when username-based queries fail
4. Maintain backward compatibility with existing data

### 3. Implementation Details

#### New Columns

- `task_requests.applicant_username` - Username reference to profiles table
- `task_assignments.assignee_username` - Username reference to profiles table

#### Updated Queries

All queries that previously used UUID-based references have been updated to:

1. First try username-based queries
2. Fall back to UUID-based queries if needed
3. Populate both UUID and username fields when creating new records

#### Backward Compatibility

The migration maintains backward compatibility by:

1. Keeping existing UUID columns
2. Updating application code to work with both approaches
3. Providing fallback mechanisms in queries

## Testing

After running the migration:

1. Verify that existing assignments and requests still work
2. Test that new assignments and requests use username references
3. Confirm that all UI displays work correctly
4. Ensure that RLS policies work with the new approach

## Future Improvements

Once the migration is confirmed to be working correctly:

1. Update all queries to use username-based references exclusively
2. Consider removing UUID columns after confirming no code references them
3. Update RLS policies to use username-based references exclusively

## Rollback

If issues are encountered:

1. Revert the RLS policy changes
2. Drop the new username columns
3. Restore the original application code

## Sample Verification Query

```sql
-- Verify the migration worked correctly
SELECT 
    tr.id, 
    tr.task, 
    tr.applicant_username, 
    p.username as profile_username
FROM task_requests tr
JOIN profiles p ON p.username = tr.applicant_username
LIMIT 10;
```