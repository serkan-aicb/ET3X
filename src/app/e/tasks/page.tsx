"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { SharedPill } from "@/components/shared-pill";

type TaskAssignment = Tables<"task_assignments">;
type Rating = Tables<"ratings">;

type Task = Tables<"tasks"> & {
  profiles?: {
    username: string;
  } | null;
  skills_data?: {
    id: number;
    label: string;
    description: string | null;
  }[];
  task_assignments?: TaskAssignment[];
  ratings?: Rating[];
};

export default function EducatorTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        setError("Failed to fetch user data");
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.log("No user found");
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      
      console.log("Fetching tasks for user:", user.id);
      
      // Fetch task with creator profile and full relational data
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
      
      console.log("Tasks fetch result:", { tasksWithDetails, tasksError });
      
      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        setError(`Failed to fetch tasks: ${tasksError.message}`);
        setLoading(false);
        return;
      }
      
      // If we have tasks, fetch skills data for each task
      if (tasksWithDetails && tasksWithDetails.length > 0) {
        // Get all unique skill IDs from all tasks
        const allSkillIds = [...new Set(tasksWithDetails.flatMap((task: Task) => 
          task.skills && Array.isArray(task.skills) ? task.skills : []
        ))].filter((id): id is number => id !== undefined && id !== null);
        
        console.log("All skill IDs to fetch:", allSkillIds);
        
        if (allSkillIds.length > 0) {
          const { data: skillsData, error: skillsError } = await supabase
            .from('skills')
            .select('id, label, description')
            .in('id', allSkillIds);
          
          console.log("Skills data fetch result:", { skillsData, skillsError });
          
          if (skillsError) {
            console.error("Error fetching skills:", skillsError);
          } else if (skillsData) {
            // Create a map of skill ID to skill data
            const skillsMap: Record<number, { id: number; label: string; description: string | null }> = {};
            skillsData.forEach((skill) => {
              skillsMap[skill.id] = skill;
            });
            
            // Add skills_data to each task
            tasksWithDetails.forEach((task: Task) => {
              if (task.skills && Array.isArray(task.skills)) {
                task.skills_data = task.skills.map((skillId: number) => skillsMap[skillId]).filter(Boolean);
              }
            });
          }
        }
      }
      
      setTasks(tasksWithDetails || []);
      setLoading(false);
    };
    
    fetchTasks();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <SharedPill variant="default">Draft</SharedPill>;
      case 'open':
        return <SharedPill variant="primary">Open</SharedPill>;
      case 'assigned':
        return <SharedPill variant="primary">Assigned</SharedPill>;
      case 'delivered':
        return <SharedPill variant="primary">Delivered</SharedPill>;
      case 'rated':
        return <SharedPill variant="primary">Rated</SharedPill>;
      default:
        return <SharedPill variant="default">{status}</SharedPill>;
    }
  };

  if (loading) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SharedCard key={i}>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </SharedCard>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout userRole="educator">
        <SharedCard title="Error Loading Tasks">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </SharedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Tasks</h1>
            <p className="text-muted-foreground">
              View all tasks in the system
            </p>
          </div>
          <Button onClick={() => router.push("/e/tasks/create")}>
            Create New Task
          </Button>
        </div>
        
        {tasks.length === 0 ? (
          <SharedCard>
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No tasks found in the system.</p>
            </div>
          </SharedCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <SharedCard key={task.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                    {task.module && (
                      <p className="text-sm text-muted-foreground">{task.module}</p>
                    )}
                  </div>
                  {getStatusBadge(task.status)}
                </div>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                {/* Meta info row */}
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {task.profiles?.username || 'Unknown'}
                  </span>
                  <span className="inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {task.task_assignments?.length || 0} assigned
                  </span>
                  <span className="inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {task.ratings?.length || 0} rated
                  </span>
                </div>
                
                {/* Skills display */}
                {task.skills_data && task.skills_data.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {task.skills_data.slice(0, 4).map((skill) => (
                      <SharedPill key={skill.id}>
                        {skill.label}
                      </SharedPill>
                    ))}
                    {task.skills_data.length > 4 && (
                      <SharedPill variant="default">
                        +{task.skills_data.length - 4} more
                      </SharedPill>
                    )}
                  </div>
                )}
                
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/e/tasks/${task.id}`)}
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