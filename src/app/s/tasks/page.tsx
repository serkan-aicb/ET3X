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
            .in('status', ['pending', 'accepted']);
          
          if (requestError) {
            console.error("Error checking requests:", requestError);
            continue;
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
          <h1 className="text-3xl font-bold text-gray-900">Available Tasks</h1>
          <p className="text-gray-600">
            Browse and request tasks to work on
          </p>
        </div>
        
        {tasks.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">No tasks available at the moment.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/s/dashboard")}
              >
                Back to Dashboard
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
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleViewTask(task.id)}
                  >
                    View Details
                  </Button>
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