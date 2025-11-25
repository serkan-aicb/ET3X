"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

type Task = Tables<'tasks'> & {
  task_assignments: {
    id: string;
  }[];
};

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
          .select('task')
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
          // Extract task IDs
          const taskIds = assignments.map(assignment => assignment.task);
          console.log("Task IDs to fetch:", taskIds);
          
          // Get tasks with these IDs and relevant statuses
          // Updated to use new status values
          console.log("Fetching tasks with new status values ['in_progress', 'submitted', 'graded']");
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .in('id', taskIds)
            .in('status', ['in_progress', 'submitted', 'graded'])
            .order('created_at', { ascending: false });
          
          console.log("Tasks data:", { tasksData, tasksError });
          
          if (!tasksError && tasksData && isMounted) {
            console.log("Setting tasks:", tasksData.length);
            setTasks(tasksData);
          } else if (isMounted) {
            console.log("No tasks found or error occurred");
            // Try a different approach - fetch using a different query structure
            const { data: alternativeTasksData, error: alternativeTasksError } = await supabase
              .from('task_assignments')
              .select(`
                tasks!inner(*)
              `)
              .eq('assignee', user.id)
              .in('tasks.status', ['in_progress', 'submitted', 'graded']);
            
            console.log("Alternative tasks fetch:", { alternativeTasksData, alternativeTasksError });
            
            if (!alternativeTasksError && alternativeTasksData && isMounted) {
              // Log the structure to understand it better
              console.log("Alternative tasks data structure:", JSON.stringify(alternativeTasksData, null, 2));
              
              // Extract tasks from the joined result - simplified approach
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const extractedTasks: any[] = [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              alternativeTasksData.forEach((item: any) => {
                if (item.tasks) {
                  extractedTasks.push(item.tasks);
                }
              });
              console.log("Setting tasks from alternative query:", extractedTasks.length);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setTasks(extractedTasks as any);
            } else {
              setTasks([]);
            }
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
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Draft</span>;
      case 'open':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Open</span>;
      case 'in_progress':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">In Progress</span>;
      case 'submitted':
        return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Submitted</span>;
      case 'graded':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Graded</span>;
      case 'closed':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Closed</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/s/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </Link>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
        
        <footer className="py-6 px-4 bg-white border-t">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/s/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">
            Tasks assigned to you
          </p>
        </div>
        
        {tasks.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">You don{'\''}t have any assigned tasks yet.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/s/tasks")}
              >
                Browse Available Tasks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card key={task.id} className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105">
                <CardHeader className="bg-white">
                  <CardTitle className="text-lg text-gray-900">{task.title}</CardTitle>
                  {task.module && (
                    <CardDescription className="text-gray-600">{task.module}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {task.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {getStatusBadge(task.status)}
                    {task.skill_level && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {task.skill_level}
                      </span>
                    )}
                    {task.license && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {task.license}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {task.status === 'in_progress' && (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push(`/submit/${task.id}`)}
                    >
                      Submit Work
                    </Button>
                  )}
                  {task.status === 'submitted' && (
                    <Button 
                      variant="outline"
                      className="w-full border-gray-600 text-gray-600 hover:bg-gray-50"
                      disabled
                    >
                      Awaiting Rating
                    </Button>
                  )}
                  {task.status === 'graded' && (
                    <Button 
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() => router.push(`/rating/${task.id}`)}
                    >
                      View Rating
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-white border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}