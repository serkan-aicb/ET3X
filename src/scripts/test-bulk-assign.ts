import { createClient } from '@/lib/supabase/client';

async function testBulkAssign() {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("Error fetching user:", userError);
    return;
  }
  
  if (!user) {
    console.log("No user found - please login first");
    return;
  }
  
  console.log("Testing bulk assign function for user:", user.id);
  
  // First, create a test task
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .insert({
      creator: user.id,
      title: "Test Bulk Assign Task",
      description: "Task for testing bulk assignment functionality",
      skill_level: "Novice",
      license: "CC BY 4.0",
      skills: [],
      status: 'open',
    })
    .select()
    .single();
  
  if (taskError) {
    console.error("Error creating test task:", taskError);
    return;
  }
  
  console.log("Created test task:", taskData.id);
  
  // Test the bulk assign function with some sample usernames
  // Note: These usernames need to exist in the profiles table
  const testUsernames = ['testuser1', 'testuser2', 'nonexistentuser'];
  
  console.log("Calling RPC with usernames:", testUsernames);
  
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('assign_task_to_usernames', {
      task_id: taskData.id,
      usernames: testUsernames
    });
  
  console.log("RPC result:", { 
    rpcData, 
    rpcError 
  });
  
  // Clean up - delete the test task
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskData.id);
  
  if (deleteError) {
    console.error("Error cleaning up test task:", deleteError);
  } else {
    console.log("Cleaned up test task");
  }
}

testBulkAssign();