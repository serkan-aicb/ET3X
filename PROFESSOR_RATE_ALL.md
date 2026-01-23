# Professor Rate All Page

## Overview
A protected page that displays a list of student DIDs with 4 task-rating columns (0-5) and a Submit button that shows a success message.

## Route
`/professor/ratings-mock`

## Features
- **Protected Access**: Only accessible to authenticated educators
- **DID Management**: Displays 74 hardcoded DIDs with editable ratings
- **Task Ratings**: 4 task columns with rating inputs (0-5 scale)
- **Search Functionality**: Filter DIDs by search term
- **Validation**: Ensures ratings are between 0-5
- **Visual Feedback**: Highlighted cells for modified ratings
- **Actions**: Submit (shows success toast) and Reset (clears all ratings)

## Technical Details
- Built with Next.js App Router
- Uses existing Supabase authentication
- Implements Sonner toast notifications
- Responsive table design with sticky DID column
- Client-side state management for ratings

## Data Structure
- **DIDs**: 74 hardcoded DID strings (can be easily replaced)
- **Tasks**: 4 predefined tasks (Task 1-4)
- **Ratings**: Number values 0-5 per DID per task

## Usage
1. Navigate to `/professor/ratings-mock` as an authenticated educator
2. Edit ratings in the table cells (0-5 only)
3. Use search to filter DIDs
4. Click "Submit" to show success message
5. Click "Reset" to clear all ratings to 0

## Customization
To use real DIDs, replace the `HARDCODED_DIDS` array in `ProfessorRatingsMockTable.tsx` with actual DID values.