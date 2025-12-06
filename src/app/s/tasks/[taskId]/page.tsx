"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { SharedPill } from "@/components/shared-pill";

type Task = Tables<'tasks'> & {
  skills_data?: {
    id: number;
    label: string;
    description: string;
  }[];
};

export default function StudentTaskDetail() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    // Add a safety check to prevent infinite loops
    let isMounted = true;
    
    const fetchTask = async () => {
      const supabase = createClient();
      
      console.log("Fetching task details for:", taskId);
      
      if (!taskId) {
        console.log("No task ID provided");
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log("No user logged in");
          if (isMounted) setLoading(false);
          return;
        }
        
        console.log("Current user:", user);
        
        // Always fetch with RLS - will automatically allow access if:
        // 1. task is open, OR
        // 2. student is assignee
        const { data: taskData, error } = await supabase
          .from('tasks')
          .select(`
            *
          `)
          .eq('id', taskId)
          .single();
        
        console.log("Task fetch result:", { taskData, error });
        
        // If we successfully fetched the task, also fetch the skills data separately
        if (isMounted) {
          if (taskData && taskData.skills && Array.isArray(taskData.skills) && taskData.skills.length > 0) {
            console.log("Fetching skills data for skill IDs:", taskData.skills);
            const { data: skillsData, error: skillsError } = await supabase
              .from('skills')
              .select('id, label, description')
              .in('id', taskData.skills);
            
            console.log("Skills data fetch result:", { skillsData, skillsError });
            
            if (!skillsError && skillsData) {
              taskData.skills_data = skillsData;
            }
          }
          if (!error && taskData) {
            setTask(taskData);
          } else {
            console.log("Task not accessible or not found");
            // Set task to null to show error UI, but don't redirect automatically
            setTask(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error fetching task:", error);
        if (isMounted) {
          setTask(null);
          setLoading(false);
        }
      }
    };
    
    if (taskId) {
      fetchTask();
    } else {
      setLoading(false);
    }
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [taskId]);

  const handleRequestTask = async () => {
    setRequesting(true);
    setMessage("");
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("You must be logged in to request a task.");
        setRequesting(false);
        return;
      }
      
      // Get the username for the current user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profileData) {
        setMessage("Error fetching your profile information.");
        setRequesting(false);
        return;
      }
      
      const applicantUsername = profileData.username;
      
      console.log("Requesting task for user:", { user, taskId, applicantUsername });
      
      // Check if user already requested this task
      const { data: existingRequests, error: checkError } = await supabase
        .from('task_requests')
        .select('id')
        .eq('task', taskId)
        .eq('applicant', user.id);
      
      console.log("Existing requests check:", { existingRequests, checkError });
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingRequests && existingRequests.length > 0) {
        setMessage("You have already requested this task.");
        setRequesting(false);
        return;
      }
      
      // Create task request using both UUID and username for compatibility
      const { data: requestData, error: insertError } = await supabase
        .from('task_requests')
        .insert({
          task: taskId,
          applicant: user.id,
          applicant_username: applicantUsername
        })
        .select();
      
      console.log("Task request creation result:", { requestData, insertError });
      
      if (insertError) {
        throw insertError;
      }
      
      // Verify the request was created
      if (requestData && requestData.length > 0) {
        const createdRequest = requestData[0];
        console.log("Created request:", createdRequest);
        
        // Verify the request can be fetched
        const { data: verifyData, error: verifyError } = await supabase
          .from('task_requests')
          .select('*')
          .eq('id', createdRequest.id)
          .single();
        
        console.log("Verification fetch result:", { verifyData, verifyError });
      }
      
      // Show success message
      setMessage("Task requested successfully! The educator will review your request.");
    } catch (error: unknown) {
      console.error("Error requesting task:", error);
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("An unexpected error occurred while requesting the task.");
      }
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout userRole="student">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <SharedCard>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full mt-6" />
              <Skeleton className="h-32 w-full mt-6" />
            </div>
            <Skeleton className="h-10 w-full" />
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout userRole="student">
        <SharedCard>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Task not found or not available.</p>
            <Button 
              className="mt-4"
              onClick={() => router.push("/s/tasks")}
            >
              Browse Tasks
            </Button>
          </div>
        </SharedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="student">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push("/s/tasks")}>
          ← Back to Tasks
        </Button>
        
        <SharedCard>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{task.title}</h2>
              {task.module && (
                <p className="text-sm text-muted-foreground">{task.module}</p>
              )}
            </div>
            <SharedPill variant="primary">
              Open
            </SharedPill>
          </div>
          
          <div className="space-y-6">
            {task.description && (
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Description</h3>
                <p className="text-foreground">{task.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">Skill Level</h3>
                <p className="mt-1 text-foreground">{task.skill_level || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">License</h3>
                <p className="mt-1 text-foreground">{task.license || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">Task Type</h3>
                <p className="mt-1 text-foreground">
                  {task.task_mode === 'single' ? 'Single Assignment' : 'Multi-Assignment'}
                </p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">Status</h3>
                <p className="mt-1 text-foreground capitalize">
                  {task.status || "Not specified"}
                </p>
              </div>
            </div>

            {/* Required Skills Section */}
            {task.skills_data && task.skills_data.length > 0 && (
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Required Skills</h3>
                <div className="flex flex-wrap gap-2 pt-2">
                  {task.skills_data.map((skill) => (
                    <SharedPill 
                      key={skill.id} 
                      title={skill.description}
                    >
                      {skill.label}
                    </SharedPill>
                  ))}
                </div>
              </div>
            )}
            
            {/* Message display */}
            {message && (
              <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-900/30 text-green-400 border border-green-800/50" : "bg-red-900/30 text-red-400 border border-red-800/50"}`}>
                {message}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleRequestTask}
              disabled={requesting}
            >
              {requesting ? "Requesting..." : "Request Task"}
            </Button>
          </div>
        </SharedCard>
      </div>
    </AppLayout>
  );
}