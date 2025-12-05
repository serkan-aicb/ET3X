"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

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
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
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
      
      // If we have tasks, fetch skills data for each task
      if (!tasksError && tasksWithDetails && tasksWithDetails.length > 0) {
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
          
          if (!skillsError && skillsData) {
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
      
      if (!tasksError && tasksWithDetails) {
        setTasks(tasksWithDetails);
      }
      
      setLoading(false);
    };
    
    fetchTasks();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Draft</span>;
      case 'open':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Open</span>;
      case 'assigned':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Assigned</span>;
      case 'delivered':
        return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Delivered</span>;
      case 'rated':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Rated</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/e/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </Link>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/e/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
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
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-10 w-24" />
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
          <Link href="/e/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/e/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
            <p className="text-gray-600">
              View all tasks in the system
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/e/tasks/create")}>
            Create New Task
          </Button>
        </div>
        
        {tasks.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">No tasks found in the system.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card key={task.id} className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-900">{task.title}</CardTitle>
                    {task.module && (
                      <CardDescription className="text-gray-600">{task.module}</CardDescription>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {task.profiles?.username || 'Unknown'}
                      </span>
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {task.task_assignments?.length || 0} assigned
                      </span>
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {task.ratings?.length || 0} rated
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/e/tasks/${task.id}`)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    View Details
                  </Button>
                </div>
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