"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

type Task = Tables<'tasks'>;

export default function StudentTaskDetail() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchTask = async () => {
      const supabase = createClient();
      
      // Get task details
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('status', 'open') // Only show open tasks
        .single();
      
      if (!error && data) {
        setTask(data);
      }
      
      setLoading(false);
    };
    
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const handleRequestTask = async () => {
    setRequesting(true);
    setMessage("");
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("You must be logged in to request a task.");
        setRequesting(false);
        return;
      }
      
      // Check if user already requested this task
      const { data: existingRequests } = await supabase
        .from('task_requests')
        .select('id')
        .eq('task', taskId)
        .eq('applicant', user.id);
      
      if (existingRequests && existingRequests.length > 0) {
        setMessage("You have already requested this task.");
        setRequesting(false);
        return;
      }
      
      // Create task request
      const { error } = await supabase
        .from('task_requests')
        .insert({
          task: taskId,
          applicant: user.id,
          status: 'requested'
        });
      
      if (error) {
        throw error;
      }
      
      // Show success message
      setMessage("Task requested successfully! The educator will review your request.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("An unknown error occurred while requesting the task.");
      }
    } finally {
      setRequesting(false);
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
              <Button variant="outline" onClick={() => router.push("/s/tasks")}>
                Browse Tasks
              </Button>
              <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-6">
            <Skeleton className="h-10 w-32" />
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
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
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

  if (!task) {
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
              <Button variant="outline" onClick={() => router.push("/s/tasks")}>
                Browse Tasks
              </Button>
              <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Task not found or not available.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/s/tasks")}
              >
                Browse Tasks
              </Button>
            </CardContent>
          </Card>
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
            <Button variant="outline" onClick={() => router.push("/s/tasks")}>
              Browse Tasks
            </Button>
            <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-6">
          <Button variant="outline" className="border-gray-600 text-gray-600 hover:bg-gray-50" onClick={() => router.push("/s/tasks")}>
            ← Back to Tasks
          </Button>
        </div>
        
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-gray-900">{task.title}</CardTitle>
                {task.module && (
                  <CardDescription className="text-gray-600">{task.module}</CardDescription>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Open
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {task.goal && (
              <div>
                <h3 className="font-medium mb-2 text-gray-900">Goal</h3>
                <p className="text-gray-600">{task.goal}</p>
              </div>
            )}
            
            {task.context && (
              <div>
                <h3 className="font-medium mb-2 text-gray-900">Context</h3>
                <p className="text-gray-600">{task.context}</p>
              </div>
            )}
            
            {task.deliverables && (
              <div>
                <h3 className="font-medium mb-2 text-gray-900">Deliverables</h3>
                <p className="text-gray-600">{task.deliverables}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Skill Level</h3>
                <p className="mt-1">{task.skill_level || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">License</h3>
                <p className="mt-1">{task.license || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Recurrence</h3>
                <p className="mt-1 capitalize">{task.recurrence || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Participants</h3>
                <p className="mt-1">{task.seats} participant{task.seats !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            {/* Message display - this is already present but let's make sure it's styled properly */}
            {message && (
              <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-gray-50">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleRequestTask}
              disabled={requesting}
            >
              {requesting ? "Requesting..." : "Request Task"}
            </Button>
          </CardFooter>
        </Card>
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