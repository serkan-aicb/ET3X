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

type TaskAssignment = Tables<'task_assignments'> & {
  tasks: Tables<'tasks'> | null;
};

type Task = Tables<'tasks'>;

export default function StudentMyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Make fetchTasks a module-level function so it can be called from elsewhere
  useEffect(() => {
    let isMounted = true;
    
    const fetchTasks = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error getting user:", userError);
        if (isMounted) {
          router.push("/stud");
        }
        return;
      }
      
      console.log("Current user:", user);
      
      try {
        console.log("Fetching task assignments for user:", user.id);
        // Students can only see assignments where task_assignments.assignee = auth.uid()
        const { data: assignments, error: assignmentsError } = await supabase
          .from('task_assignments')
          .select(`
            *,
            tasks(*)
          `)
          .eq('assignee', user.id);
        
        console.log("Assignments:", { assignments, assignmentsError });
        
        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
          if (isMounted) {
            setTasks([]);
          }
          return;
        }
        
        console.log("Number of assignments found:", assignments?.length || 0);
        
        if (assignments && assignments.length > 0) {
          // Extract tasks from assignments - this includes all assigned tasks regardless of task status
          const extractedTasks = assignments
            .map(assignment => assignment.tasks)
            .filter((task): task is Task => task !== null);
          
          console.log("Setting tasks from assignments:", extractedTasks.length);
          if (isMounted) {
            setTasks(extractedTasks);
          }
        } else if (isMounted) {
          console.log("No assignments found for user");
          setTasks([]);
        }
      } catch (error) {
        console.error("Unexpected error fetching tasks:", error);
        if (isMounted) {
          setTasks([]);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };
    
    fetchTasks();
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <SharedPill variant="default">Draft</SharedPill>;
      case 'open':
        return <SharedPill variant="primary">Open</SharedPill>;
      case 'in_progress':
        return <SharedPill variant="primary">In Progress</SharedPill>;
      case 'submitted':
        return <SharedPill variant="primary">Submitted</SharedPill>;
      case 'graded':
        return <SharedPill variant="primary">Graded</SharedPill>;
      case 'closed':
        return <SharedPill variant="default">Closed</SharedPill>;
      default:
        return <SharedPill variant="default">{status}</SharedPill>;
    }
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
          <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground">
            Tasks assigned to you
          </p>
        </div>
        
        {tasks.length === 0 ? (
          <SharedCard>
            <div className="py-8 text-center">
              <p className="text-muted-foreground">You don{'\''}t have any assigned tasks yet.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push("/s/tasks")}
              >
                Browse Available Tasks
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
                  {getStatusBadge(task.status)}
                  {task.skill_level && (
                    <SharedPill>{task.skill_level}</SharedPill>
                  )}
                  {task.license && (
                    <SharedPill>{task.license}</SharedPill>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* Allow submission for any assigned task, not just those with 'in_progress' status */}
                  {(task.status === 'in_progress' || task.status === 'open') && (
                    <Button 
                      className="w-full"
                      onClick={() => router.push(`/submit/${task.id}`)}
                    >
                      Submit Work
                    </Button>
                  )}
                  {task.status === 'submitted' && (
                    <Button 
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Awaiting Rating
                    </Button>
                  )}
                  {task.status === 'graded' && (
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/rating/${task.id}`)}
                    >
                      View Rating
                    </Button>
                  )}
                </div>
              </SharedCard>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}