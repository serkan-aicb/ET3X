import { createClient } from '@/lib/supabase/client';

async function testTasksQuery() {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("Error fetching user:", userError);
    return;
  }
  
  if (!user) {
    console.log("No user found");
    return;
  }
  
  console.log("Fetching tasks for user:", user.id);
  
  // Test the query that's used in the Educator Tasks page
  const { data: tasksWithDetails, error: tasksError } = await supabase
    .from('tasks')
    .select(`
      *,
      profiles!tasks_creator_fkey(username),
      task_assignments(*),
      ratings(*)
    `)
    .eq('creator', user.id)
    .order('created_at', { ascending: false });
  
  console.log("Tasks fetch result:", { 
    tasksWithDetails: tasksWithDetails ? tasksWithDetails.length : 0, 
    tasksError,
    sampleTask: tasksWithDetails && tasksWithDetails.length > 0 ? {
      id: tasksWithDetails[0].id,
      title: tasksWithDetails[0].title,
      task_assignments: tasksWithDetails[0].task_assignments,
      ratings: tasksWithDetails[0].ratings,
    } : null
  });
}

testTasksQuery();