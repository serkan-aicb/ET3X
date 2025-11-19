"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DebugTest() {
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const runDebug = async () => {
      const supabase = createClient();
      
      let info = "Debug test for taskId: " + taskId + "\n";
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      info += "Current user: " + JSON.stringify({ user, userError }, null, 2) + "\n";
      
      if (!user) {
        setDebugInfo(info + "Error: No user logged in");
        setLoading(false);
        return;
      }
      
      // Fetch task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      info += "Task data: " + JSON.stringify({ taskData, taskError }, null, 2) + "\n";
      
      // Fetch all task requests for this task
      const { data: requestsData, error: requestsError } = await supabase
        .from('task_requests')
        .select('*')
        .eq('task', taskId);
      
      info += "Requests data: " + JSON.stringify({ requestsData, requestsError }, null, 2) + "\n";
      
      // Fetch all task assignments for this task
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('task', taskId);
      
      info += "Assignments data: " + JSON.stringify({ assignmentsData, assignmentsError }, null, 2) + "\n";
      
      // Fetch all task requests (no filter)
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('task_requests')
        .select('*');
      
      info += "All requests: " + JSON.stringify({ allRequests, allRequestsError }, null, 2) + "\n";
      
      // Fetch all task assignments (no filter)
      const { data: allAssignments, error: allAssignmentsError } = await supabase
        .from('task_assignments')
        .select('*');
      
      info += "All assignments: " + JSON.stringify({ allAssignments, allAssignmentsError }, null, 2) + "\n";
      
      setDebugInfo(info);
      setLoading(false);
    };
    
    if (taskId) {
      runDebug();
    }
  }, [taskId]);
  
  if (loading) {
    return <div>Loading debug info...</div>;
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      <h2>Debug Information</h2>
      <button onClick={() => window.location.reload()}>Refresh</button>
      <div>{debugInfo}</div>
    </div>
  );
}