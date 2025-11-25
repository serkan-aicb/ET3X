# Task Mode Refactoring Summary

## Overview
This document summarizes the changes made to refactor the task system to support two task types: single and multi assignments, replacing the old participant count-based system.

## Database Schema Changes

### Tasks Table
- Added `task_mode` column (TEXT) with default value 'single'
- Removed reliance on `seats` column for assignment logic
- Updated status values to: 'draft', 'open', 'closed', 'in_progress', 'submitted', 'graded'

### Task Requests Table
- Added unique constraint on (task, applicant) to prevent duplicate requests
- Updated status enum to: 'pending', 'accepted', 'declined'

### Task Assignments Table
- Added unique constraint on (task, assignee) to prevent duplicate assignments
- Added status column with values: 'in_progress', 'submitted', 'graded'
- Added optional fields: submitted_at, grade

## Frontend Changes

### Task Creation
- Added task mode selection (Single Assignment / Multi-Assignment)
- Removed seats input field
- Updated form validation and submission logic

### Professor Task Detail Page
- Updated assignment logic to respect task_mode
- Single tasks: Close task after first assignment
- Multi tasks: Keep task open for multiple assignments
- Removed group assignment logic based on seats
- Updated UI to show task mode instead of participant count

### Student Task Listing
- Implemented new availability logic:
  - Tasks with status = 'open'
  - Student has no assignment for the task
  - Student has no pending/accepted request for the task
  - For single tasks: no one else has been assigned

### Student Task Detail Page
- Updated request logic to prevent duplicate requests
- Removed references to participant counts
- Updated UI to show task mode

### Student "My Tasks" Page
- Updated to fetch tasks with new status values
- Updated UI to show appropriate actions based on new statuses

## Backend Changes

### RLS Policies
- Updated policies to work with new table structures
- Maintained existing access controls

### XP Calculation
- Removed group dampening logic based on participant counts
- Simplified XP calculation to not consider group size

## Type Definitions
- Updated all TypeScript types to match new schema
- Updated status enums for all relevant tables

## Removed Logic
- All references to seats/participant counts removed
- Old group assignment logic based on seat limits removed
- Participant count-based XP dampening removed

## Testing
All functionality has been updated to ensure consistency with the new task mode system.