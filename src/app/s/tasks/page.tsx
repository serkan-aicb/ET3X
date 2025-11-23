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
      
      // Get open tasks
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
      
      // Get assigned tasks with more than 1 seat (group tasks)
      const { data: groupTasks, error: groupError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'assigned')
        .gt('seats', 1)
        .order('created_at', { ascending: false });
      
      console.log("Assigned group tasks:", { groupTasks, groupError });
      
      if (groupError) {
        console.error("Error fetching group tasks:", groupError);
        setTasks(openTasks || []);
        setLoading(false);
        return;
      }
      
      // For each assigned group task, check if it has available seats
      const enriched = [];
      
      for (const t of groupTasks || []) {
        const { data: count, error: countError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', t.id);
        
        console.log("Assignments for task", t.id, ":", { count, countError });
        
        if (!countError && (count?.length ?? 0) < t.seats) {
          enriched.push(t);
        }
      }
      
      console.log("Tasks with available seats:", enriched);
      
      // Combine open tasks with assigned group tasks that have available seats
      const allTasks = [...(openTasks || []), ...enriched];
      
      // Fetch skills data for all tasks
      if (allTasks.length > 0) {
        // Get all unique skill IDs from all tasks
        const allSkillIds = [...new Set(allTasks.flatMap((task: Task) => 
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
            allTasks.forEach((task: Task) => {
              if (task.skills && Array.isArray(task.skills)) {
                task.skills_data = task.skills.map((skillId: number) => skillsMap[skillId]).filter(Boolean);
              }
            });
          }
        }
      }
      
      setTasks(allTasks);
      setLoading(false);
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