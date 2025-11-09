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
type TaskRequest = Tables<'task_requests'> & {
  profiles: {
    username: string;
    did: string;
  } | null;
};
type TaskAssignment = Tables<'task_assignments'> & {
  profiles: {
    username: string;
    did: string;
  } | null;
};
type Submission = Tables<'submissions'> & {
  profiles: {
    username: string;
  } | null;
};

export default function TaskDetail() {
  const [task, setTask] = useState<Task | null>(null);
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (taskError) {
        console.error("Error fetching task:", taskError);
        router.push("/e/tasks");
        return;
      }
      
      setTask(taskData);
      
      // Get task requests
      const { data: requestsData } = await supabase
        .from('task_requests')
        .select(`
          *,
          profiles(username, did)
        `)
        .eq('task', taskId);
      
      if (requestsData) {
        setRequests(requestsData);
      }
      
      // Get task assignments
      const { data: assignmentsData } = await supabase
        .from('task_assignments')
        .select(`
          *,
          profiles(username, did)
        `)
        .eq('task', taskId);
      
      if (assignmentsData) {
        setAssignments(assignmentsData);
      }
      
      // Get submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles(username)
        `)
        .eq('task', taskId);
      
      if (submissionsData) {
        setSubmissions(submissionsData);
      }
      
      setLoading(false);
    };
    
    if (taskId) {
      fetchData();
    }
  }, [taskId, router]);

  const handleAssignTask = async (applicantId: string) => {
    const supabase = createClient();
    
    // Create task assignment
    const { error: assignError } = await supabase
      .from('task_assignments')
      .insert({
        task: taskId,
        assignee: applicantId
      });
    
    if (assignError) {
      console.error("Error assigning task:", assignError);
      return;
    }
    
    // Update task status to 'assigned' if needed
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('id')
      .eq('task', taskId);
    
    if (assignments && assignments.length > 0) {
      await supabase
        .from('tasks')
        .update({ status: 'assigned' })
        .eq('id', taskId);
    }
    
    // Update request status
    await supabase
      .from('task_requests')
      .update({ status: 'selected' })
      .eq('task', taskId)
      .eq('applicant', applicantId);
    
    // Refresh data
    router.refresh();
  };

  const handleDeclineRequest = async (applicantId: string) => {
    const supabase = createClient();
    
    // Update request status
    await supabase
      .from('task_requests')
      .update({ status: 'declined' })
      .eq('task', taskId)
      .eq('applicant', applicantId);
    
    // Refresh data
    router.refresh();
  };

  const handlePublishTask = async () => {
    const supabase = createClient();
    
    // Update task status to 'open'
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'open' })
      .eq('id', taskId);
    
    if (!error) {
      // Refresh data
      router.refresh();
    }
  };

  const handleUnpublishTask = async () => {
    const supabase = createClient();
    
    // Update task status to 'draft'
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'draft' })
      .eq('id', taskId);
    
    if (!error) {
      // Refresh data
      router.refresh();
    }
  };

  const handleDuplicateTask = async () => {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Create a new task with the same details but as a draft
    const { error } = await supabase
      .from('tasks')
      .insert({
        creator: user.id,
        module: task?.module || null,
        title: `${task?.title} (Copy)`,
        goal: task?.goal || null,
        context: task?.context || null,
        deliverables: task?.deliverables || null,
        seats: task?.seats || 1,
        skill_level: task?.skill_level || null,
        license: task?.license || null,
        recurrence: task?.recurrence || null,
        skills: task?.skills || null,
        due_date: task?.due_date || null,
        status: 'draft' // New task starts as draft
      });
    
    if (!error) {
      // Redirect to tasks page
      router.push("/e/tasks");
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
              <Button variant="outline" onClick={() => router.push("/e/tasks")}>
                View Tasks
              </Button>
              <Button variant="outline" onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/");
              }}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Card>
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
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/e/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </Link>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/e/tasks")}>
                View Tasks
              </Button>
              <Button variant="outline" onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/");
              }}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Task not found.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700" 
                onClick={() => router.push("/e/tasks")}
              >
                Back to Tasks
              </Button>
            </CardContent>
          </Card>
        </main>
        
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
            <Button variant="outline" onClick={() => router.push("/e/tasks")}>
              View Tasks
            </Button>
            <Button variant="outline" onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/");
            }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-6">
          <Button variant="outline" className="border-gray-600 text-gray-600 hover:bg-gray-50" onClick={() => router.push("/e/tasks")}>
            ← Back to Tasks
          </Button>
        </div>
        
        <Card className="shadow-lg rounded-xl overflow-hidden mb-8">
          <CardHeader className="bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-gray-900">{task.title}</CardTitle>
                {task.module && (
                  <CardDescription className="text-gray-600">{task.module}</CardDescription>
                )}
              </div>
              <div className="flex space-x-2">
                {task.status === 'draft' && (
                  <>
                    <Button onClick={() => router.push(`/e/tasks/${taskId}/edit`)} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                      Edit Task
                    </Button>
                    <Button onClick={handleDuplicateTask} className="bg-blue-600 hover:bg-blue-700">
                      Duplicate Task
                    </Button>
                    <Button onClick={handlePublishTask} className="bg-green-600 hover:bg-green-700">
                      Publish Task
                    </Button>
                  </>
                )}
                {task.status === 'open' && (
                  <>
                    <Button onClick={() => router.push(`/e/tasks/${taskId}/edit`)} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                      Edit Task
                    </Button>
                    <Button onClick={handleDuplicateTask} className="bg-blue-600 hover:bg-blue-700">
                      Duplicate Task
                    </Button>
                    <Button onClick={handleUnpublishTask} variant="outline" className="border-yellow-600 text-yellow-600 hover:bg-yellow-50">
                      Unpublish Task
                    </Button>
                  </>
                )}
              </div>
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
            
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                task.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                task.status === 'open' ? 'bg-blue-100 text-blue-800' :
                task.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                task.status === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-gray-50">
            {task.status === 'delivered' && (
              <>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => router.push(`/e/tasks/${taskId}/submissions`)}>
                  View Submissions
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/e/tasks/${taskId}/rate`)}>
                  Rate Submissions
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-900">Task Requests</CardTitle>
              <CardDescription className="text-gray-600">
                Students who requested this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No requests for this task yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {requests
                    .filter(req => req.status === 'requested')
                    .map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">@{request.profiles?.username || request.applicant}</span>
                          {request.profiles?.did && (
                            <span className="text-sm text-gray-500">{request.profiles.did}</span>
                          )}
                        </div>
                        <div className="space-x-2">
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleAssignTask(request.applicant)}
                          >
                            Assign
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-600 hover:bg-gray-50"
                            onClick={() => handleDeclineRequest(request.applicant)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-900">Assigned Students</CardTitle>
              <CardDescription className="text-gray-600">
                Students currently working on this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No students assigned to this task yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium">@{assignment.profiles?.username || assignment.assignee}</span>
                        {assignment.profiles?.did && (
                          <span className="text-sm text-gray-500">{assignment.profiles.did}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        Assigned
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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