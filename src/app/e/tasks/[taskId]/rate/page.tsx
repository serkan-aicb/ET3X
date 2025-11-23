"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingForm } from "@/components/tasks/rating-form";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

type Task = Tables<'tasks'> & {
  skills_data?: {
    id: number;
    label: string;
    description: string;
  }[];
};
type Assignment = Tables<'task_assignments'> & {
  profiles: {
    id: string;
    username: string;
  } | null;
};
type Skill = Tables<'skills'>;

export default function RateTask() {
  const [task, setTask] = useState<Task | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("You must be logged in to view this page.");
          setLoading(false);
          return;
        }
        
        // Get task details with creator check
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .eq('creator', user.id) // Ensure the user is the creator
          .single();
        
        if (taskError) {
          console.error("Error fetching task:", taskError);
          setError("You don't have permission to rate this task or the task doesn't exist.");
          setLoading(false);
          return;
        }
        
        setTask(taskData);
        
        // Get task assignments with student profiles
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('task_assignments')
          .select(`
            *,
            profiles!task_assignments_assignee_fkey(id, username)
          `)
          .eq('task', taskId);
        
        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
          setError("Error fetching assigned students.");
          setLoading(false);
          return;
        }
        
        if (assignmentsData) {
          setAssignments(assignmentsData);
        }
        
        // If we successfully fetched the task, also fetch the skills data separately
        // But only for the skills that are selected for this task
        if (taskData && taskData.skills && Array.isArray(taskData.skills) && taskData.skills.length > 0) {
          console.log("Fetching skills data for skill IDs:", taskData.skills);
          const { data: skillsData, error: skillsError } = await supabase
            .from('skills')
            .select('id, label, description')
            .in('id', taskData.skills);
          
          console.log("Skills data fetch result:", { skillsData, skillsError });
          
          if (skillsError) {
            console.error("Error fetching skills:", skillsError);
            setError("Error fetching task skills.");
            setLoading(false);
            return;
          }
          
          if (skillsData) {
            setSkills(skillsData);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };
    
    if (taskId) {
      fetchData();
    }
  }, [taskId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/e/tasks")}>
                My Tasks
              </Button>
              <Button variant="outline" onClick={() => router.push("/e/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
              ← Back to Task
            </Button>
          </div>
          
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-20 w-full mt-6" />
                <Skeleton className="h-32 w-full mt-6" />
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 bg-white border-t mt-auto">
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/e/tasks")}>
                My Tasks
              </Button>
              <Button variant="outline" onClick={() => router.push("/e/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
              ← Back to Task
            </Button>
          </div>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{error}</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push(`/e/tasks/${taskId}`)}
              >
                Back to Task
              </Button>
            </CardContent>
          </Card>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 bg-white border-t mt-auto">
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

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/e/tasks")}>
                My Tasks
              </Button>
              <Button variant="outline" onClick={() => router.push("/e/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
              ← Back to Task
            </Button>
          </div>
          
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Task not found.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/e/tasks")}
              >
                Back to Tasks
              </Button>
            </CardContent>
          </Card>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 bg-white border-t mt-auto">
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

  const students = assignments
    .map(assignment => ({
      id: assignment.assignee,
      username: assignment.profiles?.username || assignment.assignee
    }))
    .filter(student => student.username);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/e/tasks")}>
              My Tasks
            </Button>
            <Button variant="outline" onClick={() => router.push("/e/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
            ← Back to Task
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rate Task: {task.title}</h1>
          <p className="text-gray-600">Provide ratings for each assigned student</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Rate Task: {task.title}</CardTitle>
            <CardDescription>
              Provide ratings for each assigned student
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No students assigned</h3>
                <p className="text-gray-500 mb-4">There are no students assigned to this task yet.</p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/e/tasks/${taskId}`)}
                >
                  Back to Task
                </Button>
              </div>
            ) : (
              <RatingForm 
                taskId={taskId} 
                students={students} 
                skills={skills.map(s => ({ 
                  id: s.id, 
                  label: s.label,
                  description: s.description || ""
                }))} 
                task={task}
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-white border-t mt-auto">
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