"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type UserWithProfile = {
  id: string;
  email: string | undefined;
  username: string;
  did: string;
  matriculation_number?: string | null;
};

type Task = {
  id: string;
  status: string;
};

type AssignmentWithTask = {
  id: string;
  task: string;
  status: string;
  tasks: Task | Task[] | null;
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
        router.push("/stud");
        return;
      }
      
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, did, matriculation_number')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push("/stud");
        return;
      }
      
      // If user doesn't have a matriculation number, redirect to collection page
      if (!profile.matriculation_number) {
        router.push("/s/collect-matriculation");
        return;
      }
      
      setUser({
        id: user.id,
        email: user.email,
        username: profile.username,
        did: profile.did,
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
              .from('ratings')
              .select('id')
              .eq('task', assignment.task)
              .eq('rated_user', user.id)
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
            Welcome back, <span className="font-semibold">@{user?.username}</span>
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
          <SharedCard title="Your DID" description="Decentralized Identifier">
            <div className="font-mono text-sm break-all p-4 bg-muted rounded-lg border">
              {user?.did}
            </div>
          </SharedCard>
          
          <SharedCard title="Quick Actions" description="Navigate to key sections">
            <div className="flex flex-col gap-4">
              <Button onClick={() => router.push("/s/tasks")} className="w-full">
                Browse Tasks
              </Button>
              <Button onClick={() => router.push("/s/my-tasks")} variant="outline" className="w-full">
                My Tasks
              </Button>
              <Button onClick={() => router.push("/s/profile")} variant="outline" className="w-full">
                View Profile
              </Button>
            </div>
          </SharedCard>
        </div>
        
        {/* Educational Blockchain and IPFS Visualizations */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">How Your Data is Protected and Verified</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Rating Process Visualization */}
            <SharedCard>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-foreground">Rating Process</h3>
              </div>
              <p className="text-sm text-muted-foreground">How your work gets rated</p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <p className="ml-3 text-foreground">You complete and submit a task</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <p className="ml-3 text-foreground">Your educator reviews and rates your work</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <p className="ml-3 text-foreground">Your rating becomes a verifiable credential</p>
                </div>
              </div>
            </SharedCard>
            
            {/* Blockchain Verification Visualization */}
            <SharedCard>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-semibold text-foreground">Blockchain Verification</h3>
              </div>
              <p className="text-sm text-muted-foreground">How your credentials are secured</p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-500 font-bold text-sm">1</span>
                  </div>
                  <p className="ml-3 text-foreground">Your rating is stored as a Content Identifier (CID)</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-500 font-bold text-sm">2</span>
                  </div>
                  <p className="ml-3 text-foreground">The CID is anchored to the Polygon blockchain</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-500 font-bold text-sm">3</span>
                  </div>
                  <p className="ml-3 text-foreground">Your credential is permanently verifiable</p>
                </div>
              </div>
            </SharedCard>
            
            {/* IPFS Storage Visualization */}
            <SharedCard>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <h3 className="text-lg font-semibold text-foreground">Decentralized Storage</h3>
              </div>
              <p className="text-sm text-muted-foreground">How your data is stored securely</p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 font-bold text-sm">1</span>
                  </div>
                  <p className="ml-3 text-foreground">Your rating data is stored on IPFS</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 font-bold text-sm">2</span>
                  </div>
                  <p className="ml-3 text-foreground">Content is identified by a unique CID</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 font-bold text-sm">3</span>
                  </div>
                  <p className="ml-3 text-foreground">Data is distributed across multiple nodes</p>
                </div>
              </div>
            </SharedCard>
          </div>
          
          <div className="p-6 bg-muted rounded-xl border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">Why This Matters</h3>
            <p className="text-foreground">
              Your skills and achievements are stored securely using blockchain technology and IPFS. 
              This means your credentials are:
            </p>
            <ul className="mt-2 list-disc list-inside text-foreground space-y-1">
              <li><span className="font-semibold">Tamper-proof</span> - Cannot be altered once recorded</li>
              <li><span className="font-semibold">Permanent</span> - Available anytime, anywhere</li>
              <li><span className="font-semibold">Verifiable</span> - Anyone can confirm their authenticity</li>
              <li><span className="font-semibold">Portable</span> - You own and control your credentials</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}