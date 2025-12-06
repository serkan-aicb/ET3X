"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
    description: string;
  }[];
};

export default function StudentTaskDetail() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    // Add a safety check to prevent infinite loops
    let isMounted = true;
    
    const fetchTask = async () => {
      const supabase = createClient();
      
      console.log("Fetching task details for:", taskId);
      
      if (!taskId) {
        console.log("No task ID provided");
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log("No user logged in");
          if (isMounted) setLoading(false);
          return;
        }
        
        console.log("Current user:", user);
        
        // Always fetch with RLS - will automatically allow access if:
        // 1. task is open, OR
        // 2. student is assignee
        const { data: taskData, error } = await supabase
          .from('tasks')
          .select(`
            *
          `)
          .eq('id', taskId)
          .single();
        
        console.log("Task fetch result:", { taskData, error });
        
        // If we successfully fetched the task, also fetch the skills data separately
        if (isMounted) {
          if (taskData && taskData.skills && Array.isArray(taskData.skills) && taskData.skills.length > 0) {
            console.log("Fetching skills data for skill IDs:", taskData.skills);
            const { data: skillsData, error: skillsError } = await supabase
              .from('skills')
              .select('id, label, description')
              .in('id', taskData.skills);
            
            console.log("Skills data fetch result:", { skillsData, skillsError });
            
            if (!skillsError && skillsData) {
              taskData.skills_data = skillsData;
            }
          }
          if (!error && taskData) {
            setTask(taskData);
          } else {
            console.log("Task not accessible or not found");
            // Set task to null to show error UI, but don't redirect automatically
            setTask(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error fetching task:", error);
        if (isMounted) {
          setTask(null);
          setLoading(false);
        }
      }
    };
    
    if (taskId) {
      fetchTask();
    } else {
      setLoading(false);
    }
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
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
      
      // Get the username for the current user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profileData) {
        setMessage("Error fetching your profile information.");
        setRequesting(false);
        return;
      }
      
      const applicantUsername = profileData.username;
      
      console.log("Requesting task for user:", { user, taskId, applicantUsername });
      
      // Check if user already requested this task
      const { data: existingRequests, error: checkError } = await supabase
        .from('task_requests')
        .select('id')
        .eq('task', taskId)
        .eq('applicant', user.id);
      
      console.log("Existing requests check:", { existingRequests, checkError });
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingRequests && existingRequests.length > 0) {
        setMessage("You have already requested this task.");
        setRequesting(false);
        return;
      }
      
      // Create task request using both UUID and username for compatibility
      const { data: requestData, error: insertError } = await supabase
        .from('task_requests')
        .insert({
          task: taskId,
          applicant: user.id,
          applicant_username: applicantUsername
        })
        .select();
      
      console.log("Task request creation result:", { requestData, insertError });
      
      if (insertError) {
        throw insertError;
      }
      
      // Verify the request was created
      if (requestData && requestData.length > 0) {
        const createdRequest = requestData[0];
        console.log("Created request:", createdRequest);
        
        // Verify the request can be fetched
        const { data: verifyData, error: verifyError } = await supabase
          .from('task_requests')
          .select('*')
          .eq('id', createdRequest.id)
          .single();
        
        console.log("Verification fetch result:", { verifyData, verifyError });
      }
      
      // Show success message
      setMessage("Task requested successfully! The educator will review your request.");
    } catch (error: unknown) {
      console.error("Error requesting task:", error);
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("An unexpected error occurred while requesting the task.");
      }
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/s/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-foreground">Talent3X</span>
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
        
        <footer className="py-6 px-4 bg-card border-t mt-auto">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
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
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/s/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-foreground">Talent3X</span>
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
              <p className="text-muted-foreground">Task not found or not available.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push("/s/tasks")}
              >
                Browse Tasks
              </Button>
            </CardContent>
          </Card>
        </main>
        
        <footer className="py-6 px-4 bg-card border-t mt-auto">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/s/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Talent3X</span>
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
          <Button variant="outline" onClick={() => router.push("/s/tasks")}>
            ← Back to Tasks
          </Button>
        </div>
        
        <Card className="shadow-lg rounded-xl overflow-hidden border">
          <CardHeader className="bg-card">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-foreground">{task.title}</CardTitle>
                {task.module && (
                  <CardDescription className="text-muted-foreground">{task.module}</CardDescription>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                Open
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {task.description && (
              <div>
                <h3 className="font-medium mb-2 text-foreground">Description</h3>
                <p className="text-muted-foreground">{task.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Skill Level</h3>
                <p className="mt-1 text-foreground">{task.skill_level || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-sm font-medium text-muted-foreground">License</h3>
                <p className="mt-1 text-foreground">{task.license || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Task Type</h3>
                <p className="mt-1 text-foreground">
                  {task.task_mode === 'single' ? 'Single Assignment' : 'Multi-Assignment'}
                </p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className="mt-1 text-foreground capitalize">
                  {task.status || "Not specified"}
                </p>
              </div>
            </div>

            {/* Required Skills Section */}
            {task.skills_data && task.skills_data.length > 0 && (
              <div className="pt-6">
                <h3 className="font-medium mb-3 text-foreground">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {task.skills_data.map((skill) => (
                    <span 
                      key={skill.id} 
                      className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground"
                      title={skill.description}
                    >
                      {skill.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Message display - this is already present but let's make sure it's styled properly */}
            {message && (
              <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-900/30 text-green-400 border border-green-800/50" : "bg-red-900/30 text-red-400 border border-red-800/50"}`}>
                {message}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-card">
            <Button 
              onClick={handleRequestTask}
              disabled={requesting}
            >
              {requesting ? "Requesting..." : "Request Task"}
            </Button>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-card border-t mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}