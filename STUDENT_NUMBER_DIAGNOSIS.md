# Student Number Diagnosis

This document explains how to diagnose issues with the student number feature in the Talent3X platform.

## Common Issues

1. "Error fetching student number" when logging in
2. Student number not displayed in educator views
3. Validation errors when saving student numbers

## Diagnosis Script

The `src/scripts/diagnose-student-number.js` script can help identify issues with the student number feature:

### Running the Script

1. Make sure you have Node.js installed
2. Set the required environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Run the script:
   ```
   node src/scripts/diagnose-student-number.js
   ```

### What the Script Checks

1. **Profiles Table Structure**
   - Verifies the `profiles` table exists
   - Checks for the `matriculation_number` field
   - Confirms RLS policies allow access

2. **Task Requests Table Structure**
   - Verifies the `task_requests` table exists
   - Checks for the `applicant_matriculation_number` field

3. **Task Assignments Table Structure**
   - Verifies the `task_assignments` table exists
   - Checks for the `assignee_matriculation_number` field

4. **RLS Policies**
   - Checks that Row Level Security policies are correctly configured

## Troubleshooting Steps

### 1. Check Database Schema

Run the consistency script to ensure all fields are properly defined:
```
psql -d your_database -f src/scripts/fix-matriculation-number-consistency.sql
```

### 2. Verify RLS Policies

Check that the following policies exist:
- Users can view their own profile
- Educators can view profiles of students who requested their tasks
- Educators can view profiles of students assigned to their tasks

### 3. Check Application Logs

Look for error messages in:
- Browser developer console
- Next.js server logs
- Supabase logs

## Expected Behavior

- Student numbers should be displayed as "Student Number: u234123" in educator views
- The field should be optional and allow NULL values
- Validation should enforce 5-20 alphanumeric characters when provided
- Users should be redirected to the collection page if they don't have a student number

## Contact Support

If issues persist after running the diagnosis script, contact the development team with:
1. Output from the diagnosis script
2. Relevant error messages
3. Steps to reproduce the issue