import { createClient } from '@/lib/supabase/client';

async function debugEnums() {
  console.log("Debugging enum values...");
  
  try {
    const supabase = createClient();
    
    // Try to query the task_requests table with different status values
    console.log("Testing query with 'pending' status...");
    const { data: pendingData, error: pendingError } = await supabase
      .from('task_requests')
      .select('id')
      .limit(1);
    
    console.log("Pending query result:", { pendingData, pendingError });
    
    if (pendingError) {
      console.log("Error details:", pendingError);
    }
    
    // Try to get enum values directly
    console.log("Attempting to get enum values...");
    // This won't work as there's no RPC function, let's try a different approach
    
    // Try a simple query to see what's in the table
    console.log("Getting sample task_requests...");
    const { data: sampleRequests, error: sampleError } = await supabase
      .from('task_requests')
      .select('*')
      .limit(5);
    
    console.log("Sample requests:", { sampleRequests, sampleError });
    
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

debugEnums();