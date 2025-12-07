"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { SharedPill } from "@/components/shared-pill";

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
  ratings?: {
    task: string;
    rated_user: string;
    stars_avg: number | null;
    xp: number | null;
  }[];
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
            profiles!task_requests_applicant_fkey(username, did, matriculation_number)
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

        // Fetch assignments with ratings
        const { data: assignmentsData } = await supabase
          .from('task_assignments')
          .select(`
            *,
            profiles!task_assignments_assignee_fkey(username, did, matriculation_number),
            ratings(task, rated_user, stars_avg, xp)
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
          profiles!task_assignments_assignee_fkey(username, did, matriculation_number),
          ratings(task, rated_user, stars_avg, xp)
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
      const { data: assignmentData, error: assignError } = await supabase
        .from('task_assignments')
        .insert({
          task: taskId,
          assignee: applicantId,
          assignee_username: applicantUsername,
          status: 'in_progress'
        })
        .select(`
          *,
          profiles!task_assignments_assignee_fkey(username, did, matriculation_number)
        `)
        .single();

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

      // Add the new assignment to the local assignments state so it appears in the right list
      if (assignmentData) {
        setAssignments(prev => [...prev, assignmentData]);
      }

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
      <AppLayout userRole="educator">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-32" />
          </div>
          <SharedCard>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full mt-6" />
              <Skeleton className="h-32 w-full mt-6" />
            </div>
            <Skeleton className="h-10 w-full" />
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (errorMessage) {
    return (
      <AppLayout userRole="educator">
        <SharedCard title="Error" description={errorMessage}>
          <Button 
            onClick={() => router.push("/e/tasks")}
          >
            Back to Tasks
          </Button>
        </SharedCard>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout userRole="educator">
        <SharedCard>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Task not found or not available.</p>
            <Button 
              className="mt-4"
              onClick={() => router.push("/e/tasks")}
            >
              My Tasks
            </Button>
          </div>
        </SharedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push("/e/tasks")}>
          ← Back to Tasks
        </Button>
        
        {/* Display messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <SharedCard>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{task.title}</h2>
              {task.module && (
                <p className="text-sm text-muted-foreground">{task.module}</p>
              )}
            </div>
            <div className="flex space-x-2">
              {task.status === 'draft' && (
                <>
                  <Button onClick={() => router.push(`/e/tasks/${taskId}/edit`)} variant="outline">
                    Edit Task
                  </Button>
                  <Button onClick={handleDuplicateTask}>
                    Duplicate Task
                  </Button>
                  <Button onClick={handlePublishTask}>
                    Publish Task
                  </Button>
                </>
              )}
              {task.status === 'open' && (
                <>
                  <Button onClick={() => router.push(`/e/tasks/${taskId}/edit`)} variant="outline">
                    Edit Task
                  </Button>
                  <Button onClick={handleDuplicateTask}>
                    Duplicate Task
                  </Button>
                  <Button onClick={handleUnpublishTask} variant="outline">
                    Unpublish Task
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {task.description && (
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Description</h3>
                <p className="text-foreground">{task.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">Skill Level</h3>
                <p className="mt-1 text-foreground">{task.skill_level || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">Task Type</h3>
                <p className="mt-1 text-foreground">
                  {task.task_mode === 'single' ? 'Single Assignment' : 'Multi-Assignment'}
                </p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">License</h3>
                <p className="mt-1 text-foreground">{task.license || "Not specified"}</p>
              </div>
              
              <div className="border rounded-lg p-4 border-border">
                <h3 className="text-xs uppercase text-muted-foreground">Status</h3>
                <p className="mt-1 text-foreground capitalize">
                  {task.status || "Not specified"}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Status</h3>
              <SharedPill variant={task.status === 'draft' ? 'default' : task.status === 'open' ? 'primary' : 'default'}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </SharedPill>
            </div>
            
            {/* Required Skills Section */}
            {task.skills_data && task.skills_data.length > 0 && (
              <div>
                <h3 className="text-xs uppercase text-muted-foreground mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {task.skills_data.map((skill) => (
                    <span 
                      key={skill.id} 
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white text-black border border-gray-200"
                      title={skill.description || undefined}
                    >
                      {skill.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            {(task.status === 'submitted' || submissions.length > 0) && (
              <>
                <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}/submissions`)}>
                  View Submissions
                </Button>
                {task.status === 'submitted' && (
                  <Button onClick={() => router.push(`/e/tasks/${taskId}/rate`)}>
                    Rate Submissions
                  </Button>
                )}
              </>
            )}
          </div>
        </SharedCard>
        
        <div className="grid gap-6 md:grid-cols-2">
          <SharedCard title="Task Requests" description="Students who requested this task">
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No requests for this task yet.
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg border-border">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          Username: {request.profiles?.username ? request.profiles.username : 
                           request.applicant_username ? request.applicant_username :
                           `User ${request.applicant?.substring(0, 8) || request.id.substring(0, 8)}...`}
                        </span>
                        {request.profiles?.matriculation_number && (
                          <span className="text-sm text-muted-foreground">Student Number: {request.profiles.matriculation_number}</span>
                        )}
                        {request.profiles === null && (
                          <span className="text-sm text-muted-foreground">Profile loading failed</span>
                        )}
                        {!request.profiles && !request.applicant_username && (
                          <span className="text-sm text-muted-foreground">Loading profile...</span>
                        )}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        size="sm"
                        onClick={() => handleAssignTask(request.applicant)}
                      >
                        Assign
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
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
          </SharedCard>
          
          <SharedCard title="Assigned Students" description="Students currently working on this task">
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No students assigned to this task yet.
              </p>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg border-border">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        Username: {assignment.profiles?.username ? assignment.profiles.username : 
                         assignment.profiles?.did ? assignment.profiles.did : 
                         `User ${assignment.assignee.substring(0, 8)}...`}
                      </span>
                      {assignment.profiles?.matriculation_number && (
                        <span className="text-sm text-muted-foreground">Student Number: {assignment.profiles.matriculation_number}</span>
                      )}
                      {/* Show rating information if available */}
                      {assignment.ratings && assignment.ratings.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-green-600">
                            Rated: {assignment.ratings[0].stars_avg?.toFixed(1) || 'N/A'} stars, 
                            XP: {assignment.ratings[0].xp || 0}
                          </span>
                        </div>
                      )}
                      {assignment.profiles === null && (
                        <span className="text-sm text-muted-foreground">Profile loading failed</span>
                      )}
                      {!assignment.profiles && (
                        <span className="text-sm text-muted-foreground">Loading profile...</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Assigned
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SharedCard>
        </div>
      </div>
    </AppLayout>
  );
}
