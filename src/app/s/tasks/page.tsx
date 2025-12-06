"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type Task = Tables<'tasks'> & {
  skills_data?: {
    id: number;
    label: string;
    description: string | null;
  }[];
};

export default function StudentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Add safety check to prevent state updates on unmounted component
    let isMounted = true;
    
    const fetchTasks = async () => {
      const supabase = createClient();
      
      console.log("Fetching available tasks for student");
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("No user logged in");
          setLoading(false);
          return;
        }
        
        console.log("Current user:", user);
        
        // Get available tasks using the new logic:
        // SELECT t.*
        // FROM tasks t
        // WHERE t.status = 'open'
        //   -- Student has no assignment for this task
        //   AND NOT EXISTS (
        //     SELECT 1
        //     FROM task_assignments a
        //     WHERE a.task_id = t.id
        //       AND a.student_id = :current_student_id
        //   )
        //   -- Student has no pending or accepted request
        //   AND NOT EXISTS (
        //     SELECT 1
        //     FROM task_requests r
        //     WHERE r.task_id = t.id
        //       AND r.student_id = :current_student_id
        //       AND r.status IN ('pending', 'accepted')
        //   )
        //   -- Single-task specific: no one else has been assigned
        //   AND NOT (
        //     t.task_mode = 'single'
        //     AND EXISTS (
        //       SELECT 1
        //       FROM task_assignments a2
        //       WHERE a2.task_id = t.id
        //     )
        //   );
        
        // First, get all open tasks
        const { data: openTasks, error: openError } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });
        
        console.log("Open tasks:", { openTasks, openError });
        
        if (openError) {
          console.error("Error fetching open tasks:", openError);
          setLoading(false);
          return;
        }
        
        // Filter tasks based on the new logic
        const availableTasks = [];
        
        for (const task of openTasks || []) {
          // Check if student already has an assignment for this task
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('task_assignments')
            .select('id')
            .eq('task', task.id)
            .eq('assignee', user.id);
          
          if (assignmentError) {
            console.error("Error checking assignments:", assignmentError);
            continue;
          }
          
          // If student already has an assignment, skip this task
          if (assignmentData && assignmentData.length > 0) {
            console.log("Student already assigned to task:", task.id);
            continue;
          }
          
          // Check if student already has a pending or accepted request for this task
          const { data: requestData, error: requestError } = await supabase
            .from('task_requests')
            .select('id')
            .eq('task', task.id)
            .eq('applicant', user.id)
            // Handle the case where the enum values might be different in the database
            .or('status.eq.pending,status.eq.accepted');
          
          if (requestError) {
            // If we get an enum error, try a more general query
            if (requestError.code === '22P02' && requestError.message.includes('invalid input value for enum')) {
              console.warn("Enum error encountered, trying alternative query method");
              // Try querying without the enum filter and filter in memory
              const { data: allRequestData, error: allRequestError } = await supabase
                .from('task_requests')
                .select('id, status')
                .eq('task', task.id)
                .eq('applicant', user.id);
              
              if (allRequestError) {
                console.error("Error checking requests (fallback):", allRequestError);
                continue;
              }
              
              // Filter in memory for pending or accepted status
              const filteredRequests = allRequestData?.filter(req => 
                req.status === 'pending' || req.status === 'accepted'
              ) || [];
              
              if (filteredRequests.length > 0) {
                console.log("Student already has request for task (fallback):", task.id);
                continue;
              }
            } else {
              console.error("Error checking requests:", requestError);
              continue;
            }
          }
          
          // If student already has a pending or accepted request, skip this task
          if (requestData && requestData.length > 0) {
            console.log("Student already has request for task:", task.id);
            continue;
          }
          
          // For single tasks, check if anyone else has been assigned
          if (task.task_mode === 'single') {
            const { data: anyAssignmentData, error: anyAssignmentError } = await supabase
              .from('task_assignments')
              .select('id')
              .eq('task', task.id);
            
            if (anyAssignmentError) {
              console.error("Error checking any assignments:", anyAssignmentError);
              continue;
            }
            
            // If someone else is already assigned to a single task, skip this task
            if (anyAssignmentData && anyAssignmentData.length > 0) {
              console.log("Single task already assigned to someone else:", task.id);
              continue;
            }
          }
          
          // If we reach here, the task is available to the student
          availableTasks.push(task);
        }
        
        console.log("Available tasks after filtering:", availableTasks);
        
        // Fetch skills data for available tasks
        if (availableTasks.length > 0) {
          // Get all unique skill IDs from available tasks
          const allSkillIds = [...new Set(availableTasks.flatMap((task: Task) => 
            task.skills && Array.isArray(task.skills) ? task.skills : []
          ))].filter((id): id is number => id !== undefined && id !== null);
          
          console.log("All skill IDs to fetch:", allSkillIds);
          
          if (allSkillIds.length > 0) {
            const { data: skillsData, error: skillsError } = await supabase
              .from('skills')
              .select('id, label, description')
              .in('id', allSkillIds);
            
            console.log("Skills data fetch result:", { skillsData, skillsError });
            
            if (!skillsError && skillsData) {
              // Create a map of skill ID to skill data
              const skillsMap: Record<number, { id: number; label: string; description: string | null }> = {};
              skillsData.forEach((skill) => {
                skillsMap[skill.id] = skill;
              });
              
              // Add skills_data to each task
              availableTasks.forEach((task: Task) => {
                if (task.skills && Array.isArray(task.skills)) {
                  task.skills_data = task.skills.map((skillId: number) => skillsMap[skillId]).filter(Boolean);
                }
              });
            }
          }
        }
        
        if (isMounted) {
          setTasks(availableTasks);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        if (isMounted) {
          setTasks([]);
          setLoading(false);
        }
      }
    };
    
    fetchTasks();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewTask = (taskId: string) => {
    console.log("Navigating to task:", taskId);
    router.push(`/s/tasks/${taskId}`);
  };

  if (loading) {
    return (
      <AppLayout userRole="student">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SharedCard key={i}>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full" />
              </SharedCard>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Tasks</h1>
          <p className="text-muted-foreground">
            Browse and request tasks to work on
          </p>
        </div>
        
        {tasks.length === 0 ? (
          <SharedCard>
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No tasks available at the moment.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push("/s/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </SharedCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <SharedCard key={task.id}>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                  {task.module && (
                    <p className="text-sm text-muted-foreground">{task.module}</p>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {task.skill_level && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {task.skill_level}
                    </span>
                  )}
                  {task.license && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {task.license}
                    </span>
                  )}
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleViewTask(task.id)}
                >
                  View Details
                </Button>
              </SharedCard>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}