"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type UserWithProfile = {
  id: string;
  email: string | undefined;
  username: string;
  real_name?: string | null;
  matriculation_number?: string | null;
};

type Task = {
  id: string;
  status: string;
};

export default function StudentDashboard() {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, real_name, matriculation_number')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push("/auth");
        return;
      }
      
      setUser({
        id: user.id,
        email: user.email,
        username: profile.username,
        real_name: profile.real_name,
        matriculation_number: profile.matriculation_number
      });
      
      // Get task statistics - FIXED IMPLEMENTATION
      console.log("Fetching task assignments for user:", user.id);
      
      // Fetch all assignments for the user with task details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select(`
          id,
          task,
          status,
          tasks (
            id,
            status
          )
        `)
        .eq('assignee', user.id);
      
      console.log("Assignments data:", { assignments, assignmentsError });
      
      if (!assignmentsError && assignments) {
        // Count tasks by status
        const totalTasks = assignments.length;
        let completedTasks = 0; // Tasks with ratings (graded status)
        let pendingTasks = 0;   // Tasks not yet submitted or not fully rated
        
        // For each assignment, check if there's a submission and rating
        for (const assignment of assignments) {
          // Check if task has graded status
          // Handle both array and object cases for tasks
          let taskStatus = '';
          if (assignment.tasks) {
            if (Array.isArray(assignment.tasks)) {
              if (assignment.tasks.length > 0) {
                taskStatus = assignment.tasks[0].status;
              }
            } else {
              const taskObj = assignment.tasks as Task;
              taskStatus = taskObj.status;
            }
          }
          
          if (taskStatus === 'graded') {
            completedTasks++;
          } else {
            // Check if there's a submission for this assignment
            const { data: submissions } = await supabase
              .from('submissions')
              .select('id')
              .eq('task', assignment.task)
              .eq('submitter', user.id)
              .limit(1);
            
            // Check if there's a rating for this assignment
            const { data: ratings } = await supabase
              .from('task_ratings')
              .select('id')
              .eq('task_id', assignment.task)
              .eq('rated_user_id', user.id)
              .limit(1);
            
            // If submitted but not rated, it's pending
            // If not submitted at all, it's also pending
            if ((submissions && submissions.length > 0) && (!ratings || ratings.length === 0)) {
              pendingTasks++;
            } else if (!submissions || submissions.length === 0) {
              pendingTasks++;
            }
          }
        }
        
        console.log("Task statistics:", { totalTasks, completedTasks, pendingTasks });
        
        setStats({
          totalTasks,
          completedTasks,
          pendingTasks
        });
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <AppLayout userRole="student">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <SharedCard key={i}>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-16" />
              </SharedCard>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <SharedCard>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </SharedCard>
            
            <SharedCard>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </SharedCard>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{user?.real_name || (user?.email ? user?.email.split('@')[0] : `@${user?.username}`)}</span>
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Total Tasks</h3>
            <p className="text-sm text-muted-foreground">All assigned tasks</p>
            <div className="text-3xl font-semibold text-primary">{stats.totalTasks}</div>
          </SharedCard>
          
          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Completed</h3>
            <p className="text-sm text-muted-foreground">Tasks with ratings</p>
            <div className="text-3xl font-semibold text-green-500">{stats.completedTasks}</div>
          </SharedCard>
          
          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Pending</h3>
            <p className="text-sm text-muted-foreground">Tasks awaiting submission/rating</p>
            <div className="text-3xl font-semibold text-amber-500">{stats.pendingTasks}</div>
          </SharedCard>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <SharedCard title="Your Profile" description="Account information">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email: <span className="text-foreground font-medium">{user?.email}</span></p>
              <p className="text-sm text-muted-foreground">Name: <span className="text-foreground font-medium">{user?.real_name || user?.username}</span></p>
            </div>
          </SharedCard>
          
          <SharedCard title="Quick Actions" description="Navigate to key sections">
            <div className="flex flex-col gap-4">
              <Button onClick={() => router.push("/s/my-tasks")} className="w-full">
                My Tasks
              </Button>
              <Button onClick={() => router.push("/s/profile")} variant="outline" className="w-full">
                View Profile
              </Button>
            </div>
          </SharedCard>
        </div>
        
      </div>
    </AppLayout>
  );
}
