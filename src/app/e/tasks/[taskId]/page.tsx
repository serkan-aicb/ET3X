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
type Request = Tables<'task_requests'> & {
  profiles: {
    username: string;
    did: string;
    matriculation_number?: string | null;
  } | null;
};
type Assignment = Tables<'task_assignments'> & {
  profiles: {
    username: string;
    did: string;
    matriculation_number?: string | null;
  } | null;
};
type Submission = Tables<'submissions'>;

export default function EducatorTaskDetail() {
  const [task, setTask] = useState<Task | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const fetchData = async () => {
      if (!taskId) {
        if (isMounted) {
          setErrorMessage("No task ID provided");
          setLoading(false);
        }
        return;
      }

      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        const user = userData?.user ?? null;
        if (userErr || !user) {
          if (isMounted) {
            setErrorMessage("You must be logged in to view this page.");
            setLoading(false);
          }
          return;
        }

        // Check educator role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          if (isMounted) {
            setErrorMessage("Error fetching user profile.");
            setLoading(false);
          }
          return;
        }
        if (profileData.role !== 'educator') {
          if (isMounted) {
            setErrorMessage("You must be an educator to view this page.");
            setLoading(false);
          }
          return;
        }

        // Fetch task (prefer only educator's own tasks)
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .eq('creator', user.id)
          .single();

        const finalTask = taskData;
        if (!finalTask) {
          // try without creator filter to give clearer message if it exists
          const { data: anyTaskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();
          if (anyTaskData) {
            setErrorMessage("You don't have permission to view this task. This task belongs to another educator.");
            setTask(null);
            setLoading(false);
            return;
          } else {
            setErrorMessage("Task not found.");
            setTask(null);
            setLoading(false);
            return;
          }
        }

        // If task has skills, fetch skill details
        if (finalTask.skills && Array.isArray(finalTask.skills) && finalTask.skills.length > 0) {
          const { data: skillsData } = await supabase
            .from('skills')
            .select('id, label, description')
            .in('id', finalTask.skills);
          if (skillsData) {
            finalTask.skills_data = skillsData;
          }
        }

        if (isMounted) {
          setTask(finalTask);
        }

        // Fetch requests (only pending requests)
        const { data: requestsData, error: requestsError } = await supabase
          .from('task_requests')
          .select(`
            *,
            profiles!task_requests_applicant_fkey(username, did)
          `)
          .eq('task', taskId)
          .eq('status', 'pending');

        // Handle enum errors for requests
        let finalRequestsData = requestsData;
        if (requestsError && requestsError.code === '22P02' && requestsError.message.includes('invalid input value for enum')) {
          console.warn("Enum error encountered in educator task requests, trying alternative query method");
          // Try querying without the enum filter and filter in memory
          const { data: allRequestsData, error: allRequestsError } = await supabase
            .from('task_requests')
            .select(`
              *,
              profiles!task_requests_applicant_fkey(username, did)
            `)
            .eq('task', taskId);
          
          if (!allRequestsError) {
            // Filter in memory for pending status
            finalRequestsData = allRequestsData?.filter(req => req.status === 'pending') || [];
          }
        }

        const requestsWithProfiles: Request[] = (finalRequestsData || []).map((r) => {
          // if join provided profiles use it, otherwise leave null (we handle fetching later if needed)
          return r;
        });

        if (isMounted) setRequests(requestsWithProfiles);

        // Fetch assignments
        const { data: assignmentsData } = await supabase
          .from('task_assignments')
          .select(`
            *,
            profiles!task_assignments_assignee_fkey(username, did)
          `)
          .eq('task', taskId);

        if (isMounted) setAssignments(assignmentsData || []);

        // Fetch submissions
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*')
          .eq('task', taskId);

        if (isMounted) setSubmissions(submissionsData || []);
      } catch (e: unknown) {
        if (isMounted) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          setErrorMessage(`Unexpected error: ${errorMessage}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [taskId, router]);

  // Utility to refresh assignments/requests/submissions
  const verifyAssignments = async () => {
    const supabase = createClient();
    try {
      const { data: currentAssignments } = await supabase
        .from('task_assignments')
        .select(`
          *,
          profiles!task_assignments_assignee_fkey(username, did, matriculation_number)
        `)
        .eq('task', taskId);

      setAssignments(currentAssignments || []);

      const { data: requestsData, error: requestsError } = await supabase
        .from('task_requests')
        .select(`
          *,
          profiles!task_requests_applicant_fkey(username, did, matriculation_number)
        `)
        .eq('task', taskId)
        .eq('status', 'pending');

      // Handle enum errors for requests
      let finalRequestsData = requestsData;
      if (requestsError && requestsError.code === '22P02' && requestsError.message.includes('invalid input value for enum')) {
        console.warn("Enum error encountered in educator task requests (verify), trying alternative query method");
        // Try querying without the enum filter and filter in memory
        const { data: allRequestsData, error: allRequestsError } = await supabase
          .from('task_requests')
          .select(`
            *,
            profiles!task_requests_applicant_fkey(username, did, matriculation_number)
          `)
          .eq('task', taskId);
        
        if (!allRequestsError) {
          // Filter in memory for pending status
          finalRequestsData = allRequestsData?.filter(req => req.status === 'pending') || [];
        }
      }

      setRequests(finalRequestsData || []);

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('task', taskId);

      setSubmissions(submissionsData || []);
    } catch (e) {
      console.error("verifyAssignments error:", e);
    }
  };

// ... existing code ...

  const handleAssignTask = async (applicantId: string) => {
    const supabase = createClient();
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setMessage("You must be logged in to assign tasks.");
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      // Check if already assigned
      const { data: existingAssignments, error: checkError } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task', taskId)
        .eq('assignee', applicantId);

      if (checkError) throw checkError;
      if (existingAssignments && existingAssignments.length > 0) {
        setMessage("This student is already assigned to this task.");
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      // Get task info
      const { data: taskData, error: taskInfoError } = await supabase
        .from('tasks')
        .select('task_mode, status, seats')
        .eq('id', taskId)
        .single();

      if (taskInfoError) throw taskInfoError;

      const taskMode = taskData?.task_mode || 'single';

      if (taskMode === 'single') {
        const { data: currentAssignments, error: singleCheckError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        if (singleCheckError) throw singleCheckError;
        if (currentAssignments && currentAssignments.length > 0) {
          setMessage("This single task already has an assigned student.");
          setTimeout(() => setMessage(""), 5000);
          return;
        }
      } else if (taskData?.seats) {
        const { data: currentAssignments, error: seatsCheckError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        if (seatsCheckError) throw seatsCheckError;
        const currentCount = currentAssignments ? currentAssignments.length : 0;
        if (taskData.seats <= currentCount) {
          setMessage("No seats available for this task.");
          setTimeout(() => setMessage(""), 5000);
          return;
        }
      }

      // Get applicant username (best effort)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', applicantId)
        .single();
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn("Error fetching applicant profile:", profileError);
      }
      const applicantUsername = profileData?.username || null;

      // Insert assignment
      const { error: assignError } = await supabase
        .from('task_assignments')
        .insert({
          task: taskId,
          assignee: applicantId,
          assignee_username: applicantUsername,
          status: 'in_progress'
        });

      if (assignError) throw assignError;

      // Update request status to accepted (if exists)
      const { error: updateReqError } = await supabase
        .from('task_requests')
        .update({ status: 'accepted' })
        .eq('task', taskId)
        .eq('applicant', applicantId);

      if (updateReqError) {
        throw updateReqError;
      }

      // Remove this student from the local requests state so they disappear from the left list
      setRequests(prev => prev.filter(req => req.applicant !== applicantId));

      // If single, close task
      if (taskMode === 'single') {
        const { error: closeError } = await supabase
          .from('tasks')
          .update({ status: 'closed' })
          .eq('id', taskId);
        if (closeError) throw closeError;
        setMessage("Task assigned successfully! The task is now closed.");
      } else {
        setMessage("Task assigned successfully!");
      }

      setTimeout(() => setMessage(""), 5000);

      await verifyAssignments();
      router.refresh();
    } catch (e: unknown) {
      console.error("Error assigning task:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setMessage(`Error assigning task: ${errorMessage}`);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleUnassignTask = async (assigneeId: string) => {
    const supabase = createClient();
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setMessage("You must be logged in to unassign tasks.");
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      await supabase
        .from('task_assignments')
        .delete()
        .eq('task', taskId)
        .eq('assignee', assigneeId);

      setMessage("Unassigned successfully.");
      setTimeout(() => setMessage(""), 5000);
      await verifyAssignments();
      router.refresh();
    } catch (e: unknown) {
      console.error("Error unassigning:", e);
      setMessage("Unexpected error.");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('task_requests')
        .update({ status: 'accepted' })
        .eq('task', taskId)
        .eq('id', requestId);

      if (error) {
        setMessage(`Error approving request: ${error.message}`);
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      setRequests(prev => prev.filter(req => req.id !== requestId));
      setMessage("Request approved successfully");
      setTimeout(() => setMessage(""), 5000);
      await verifyAssignments();
      router.refresh();
    } catch (e: unknown) {
      console.error("Unexpected error approving request:", e);
      setMessage("Unexpected error.");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('task_requests')
        .update({ status: 'declined' })
        .eq('task', taskId)
        .eq('id', requestId);

      if (error) {
        setMessage(`Error rejecting request: ${error.message}`);
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      setRequests(prev => prev.filter(req => req.id !== requestId));
      setMessage("Request rejected successfully");
      setTimeout(() => setMessage(""), 5000);
      await verifyAssignments();
      router.refresh();
    } catch (e: unknown) {
      console.error("Unexpected error rejecting request:", e);
      setMessage("Unexpected error.");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleDeclineRequest = async (applicantId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('task_requests')
        .update({ status: 'declined' })
        .eq('task', taskId)
        .eq('applicant', applicantId);

      if (error) {
        setMessage(`Error declining request: ${error.message}`);
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      setRequests(prev => prev.filter(req => req.applicant !== applicantId));
      setMessage("Request declined successfully");
      setTimeout(() => setMessage(""), 5000);
      await verifyAssignments();
      router.refresh();
    } catch (e: unknown) {
      console.error("Unexpected error declining request:", e);
      setMessage("Unexpected error.");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handlePublishTask = async () => {
    const supabase = createClient();
    await supabase.from('tasks').update({ status: 'open' }).eq('id', taskId);
    await verifyAssignments();
    router.refresh();
  };

  const handleUnpublishTask = async () => {
    const supabase = createClient();
    await supabase.from('tasks').update({ status: 'draft' }).eq('id', taskId);
    await verifyAssignments();
    router.refresh();
  };

  const handleDuplicateTask = async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user || !task) return;

    await supabase.from('tasks').insert({
      creator: user.id,
      module: task.module || null,
      title: `${task.title} (Copy)`,
      description: task.description || null,
      seats: task.seats || null,
      skill_level: task.skill_level || null,
      license: task.license || null,
      skills: task.skills || null,
      due_date: task.due_date || null,
      status: 'draft'
    });

    router.push('/e/tasks');
  };

  if (loading) {
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

  if (errorMessage) {
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
          <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{errorMessage}</p>
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

  if (!task) {
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
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Task not found or not available.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/e/tasks")}
              >
                My Tasks
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
          <Button variant="outline" className="border-gray-600 text-gray-600 hover:bg-gray-50" onClick={() => router.push("/e/tasks")}>
            ← Back to Tasks
          </Button>
        </div>
        
        {/* Display messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

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
            {task.description && (
              <div>
                <h3 className="font-medium mb-2 text-gray-900">Description</h3>
                <p className="text-gray-600">{task.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Skill Level</h3>
                <p className="mt-1">{task.skill_level || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Task Type</h3>
                <p className="mt-1">
                  {task.task_mode === 'single' ? 'Single Assignment' : 'Multi-Assignment'}
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">License</h3>
                <p className="mt-1">{task.license || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 capitalize">
                  {task.status || "Not specified"}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                task.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                task.status === 'open' ? 'bg-blue-100 text-blue-800' :
                task.status === 'closed' ? 'bg-purple-100 text-purple-800' :
                task.status === 'submitted' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
            
            {/* Required Skills Section */}
            {task.skills_data && task.skills_data.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {task.skills_data.map((skill) => (
                    <span 
                      key={skill.id} 
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                      title={skill.description}
                    >
                      {skill.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-gray-50">
            {(task.status === 'submitted' || submissions.length > 0) && (
              <>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => router.push(`/e/tasks/${taskId}/submissions`)}>
                  View Submissions
                </Button>
                {task.status === 'submitted' && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/e/tasks/${taskId}/rate`)}>
                    Rate Submissions
                  </Button>
                )}
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
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {request.profiles?.username ? request.profiles.username : 
                             request.applicant_username ? request.applicant_username :
                             `User ${request.applicant?.substring(0, 8) || request.id.substring(0, 8)}...`}
                          </span>
                          {request.profiles?.matriculation_number && (
                            <span className="text-sm text-gray-500">Matriculation: {request.profiles.matriculation_number}</span>
                          )}
                          {request.profiles?.did && (
                            <span className="text-sm text-gray-500">{request.profiles.did}</span>
                          )}
                          {request.profiles === null && (
                            <span className="text-sm text-gray-500">Profile loading failed</span>
                          )}
                          {!request.profiles && !request.applicant_username && (
                            <span className="text-sm text-gray-500">Loading profile...</span>
                          )}
                        </div>
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
                  {/* Add group assignment button when multiple students are selected */}
                  {/* Removed group assignment functionality as per requirements */}
                  
                  {/* Add button to assign all applicants in groups of 5 */}
                  {/* Removed "Assign All in Groups of 5" button as per requirements */}
                  
                  {/* Show grouping suggestion */}
                  {/* Removed grouping suggestion text as per requirements */}
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
                        <span className="font-medium">
                          {assignment.profiles?.username ? assignment.profiles.username : 
                           assignment.profiles?.did ? assignment.profiles.did : 
                           `User ${assignment.assignee.substring(0, 8)}...`}
                        </span>
                        {assignment.profiles?.matriculation_number && (
                          <span className="text-sm text-gray-500">Matriculation: {assignment.profiles.matriculation_number}</span>
                        )}
                        {assignment.profiles?.did && (
                          <span className="text-sm text-gray-500">{assignment.profiles.did}</span>
                        )}
                        {assignment.profiles === null && (
                          <span className="text-sm text-gray-500">Profile loading failed</span>
                        )}
                        {!assignment.profiles && (
                          <span className="text-sm text-gray-500">Loading profile...</span>
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