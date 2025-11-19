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
  const [message, setMessage] = useState(""); // Add this state for messages
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      console.log("Fetching task data for:", taskId);
      
      if (!taskId) {
        console.log("No task ID provided");
        router.push("/e/tasks");
        return;
      }
      
      try {
        // Try multiple approaches to fetch the task
        // Approach 1: Direct fetch with creator check
        const { data: taskData1, error: taskError1 } = await supabase
          .from('tasks')
          .select(`
            *,
            skills_data:skills(id, label, description)
          `)
          .eq('id', taskId)
          .single();
        
        console.log("Approach 1 - Direct fetch:", { taskData1, taskError1 });
        
        if (taskError1) {
          console.error("Error fetching task:", taskError1);
          router.push("/e/tasks");
          return;
        }
        
        if (!taskData1) {
          console.log("No task data found");
          router.push("/e/tasks");
          return;
        }
        
        setTask(taskData1);
        
        // Get task requests with properly joined profile data
        const { data: requestsData, error: requestsError } = await supabase
          .from('task_requests')
          .select(`
            *,
            profiles(username, did)
          `)
          .eq('task', taskId);
        
        console.log("Requests data:", { requestsData, requestsError });
        
        if (requestsError) {
          console.error("Error fetching task requests:", requestsError);
        }
        
        if (requestsData) {
          console.log("Requests data:", requestsData);
          // If profiles are not loaded, fetch them separately
          const requestsWithProfiles = await Promise.all(requestsData.map(async (request) => {
            if (!request.profiles) {
              console.log("Fetching profile for request applicant:", request.applicant);
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, did')
                .eq('id', request.applicant)
                .single();
              
              if (!profileError && profileData) {
                console.log("Profile data fetched:", profileData);
                return { ...request, profiles: profileData };
              } else {
                console.log("Profile fetch error:", profileError);
                // Even if we can't get the full profile, we should at least show the username
                // Let's try to get just the username
                const { data: usernameData, error: usernameError } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('id', request.applicant)
                  .single();
                
                if (!usernameError && usernameData) {
                  return { ...request, profiles: { username: usernameData.username, did: '' } };
                }
              }
            }
            return request;
          }));
          setRequests(requestsWithProfiles);
        }
        
        // Get task assignments with properly joined profile data
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('task_assignments')
          .select(`
            *,
            profiles(username, did)
          `)
          .eq('task', taskId);
        
        console.log("Assignments data:", { assignmentsData, assignmentsError });
        
        if (assignmentsError) {
          console.error("Error fetching task assignments:", assignmentsError);
        }
        
        if (assignmentsData) {
          console.log("Assignments data:", assignmentsData);
          // If profiles are not loaded, fetch them separately
          const assignmentsWithProfiles = await Promise.all(assignmentsData.map(async (assignment) => {
            if (!assignment.profiles) {
              console.log("Fetching profile for assignment assignee:", assignment.assignee);
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, did')
                .eq('id', assignment.assignee)
                .single();
              
              if (!profileError && profileData) {
                console.log("Profile data fetched:", profileData);
                return { ...assignment, profiles: profileData };
              } else {
                console.log("Profile fetch error:", profileError);
                // Even if we can't get the full profile, we should at least show the username
                // Let's try to get just the username
                const { data: usernameData, error: usernameError } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('id', assignment.assignee)
                  .single();
                
                if (!usernameError && usernameData) {
                  return { ...assignment, profiles: { username: usernameData.username, did: '' } };
                }
              }
            }
            return assignment;
          }));
          setAssignments(assignmentsWithProfiles);
        }
        
        // Get submissions
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select(`
            *,
            profiles(username)
          `)
          .eq('task', taskId);
        
        console.log("Submissions data:", { submissionsData, submissionsError });
        
        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError);
        } else if (submissionsData) {
          setSubmissions(submissionsData);
        }
      } catch (error) {
        console.error("Unexpected error fetching task data:", error);
        router.push("/e/tasks");
      }
      
      setLoading(false);
    };
    
    if (taskId) {
      fetchData();
    }
  }, [taskId, router]);

  // Add verification after assignment operations
  const verifyAssignments = async () => {
    const supabase = createClient();
    
    // Get current assignments for this task with profile data
    const { data: currentAssignments, error } = await supabase
      .from('task_assignments')
      .select(`
        *,
        profiles(username, did)
      `)
      .eq('task', taskId);
    
    console.log("Verification - Current assignments:", { currentAssignments, error });
    
    if (!error) {
      // If profiles are not loaded, fetch them separately
      const assignmentsWithProfiles = await Promise.all(currentAssignments.map(async (assignment) => {
        if (!assignment.profiles) {
          console.log("Fetching profile for verification assignee:", assignment.assignee);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, did')
            .eq('id', assignment.assignee)
            .single();
          
          if (!profileError && profileData) {
            console.log("Profile data fetched for verification:", profileData);
            return { ...assignment, profiles: profileData };
          } else {
            console.log("Profile fetch error for verification:", profileError);
            // Even if we can't get the full profile, we should at least show the username
            // Let's try to get just the username
            const { data: usernameData, error: usernameError } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', assignment.assignee)
              .single();
            
            if (!usernameError && usernameData) {
              return { ...assignment, profiles: { username: usernameData.username, did: '' } };
            }
          }
        }
        return assignment;
      }));
      setAssignments(assignmentsWithProfiles);
    }
  };

  // Add verification after assignment operations
  const handleAssignTask = async (applicantId: string) => {
    const supabase = createClient();
    
    try {
      console.log("Assigning task to applicant:", { taskId, applicantId });
      
      // First, get the username for the applicant
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', applicantId)
        .single();
      
      if (profileError || !profileData) {
        throw new Error(`Error fetching applicant username: ${profileError?.message || 'Profile not found'}`);
      }
      
      const applicantUsername = profileData.username;
      
      // First, check if this is a single-person task and if there's already an assignment
      if (task && task.seats === 1) {
        // Check if there's already an assignment for this task
        const { data: existingAssignments, error: checkError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        
        if (checkError) {
          throw new Error(`Error checking existing assignments: ${checkError.message}`);
        }
        
        if (existingAssignments && existingAssignments.length > 0) {
          setMessage("This single-person task already has an assigned student.");
          setTimeout(() => setMessage(""), 5000);
          return;
        }
      }
      
      // Create task assignment using both UUID and username for compatibility
      const { error: assignError, data: assignmentData } = await supabase
        .from('task_assignments')
        .insert({
          task: taskId,
          assignee: applicantId, // Keep UUID for backward compatibility and RLS policies
          assignee_username: applicantUsername // Add username for new approach
        })
        .select();
      
      console.log("Assignment result:", { assignError, assignmentData });
      
      if (assignError) {
        throw new Error(`Error assigning task: ${assignError.message}`);
      }
      
      // Update task status to 'assigned' if all seats are filled or if it's a single-person task
      if (task) {
        let shouldUpdateStatus = false;
        
        if (task.seats === 1) {
          // For single-person tasks, update status immediately
          shouldUpdateStatus = true;
        } else if (task.seats && task.seats > 1) {
          // For group tasks, check if all seats are filled
          const { data: currentAssignments, error: countError } = await supabase
            .from('task_assignments')
            .select('id')
            .eq('task', taskId);
          
          console.log("Current assignments for group task:", { currentAssignments, countError });
          
          if (!countError && currentAssignments && currentAssignments.length >= task.seats) {
            shouldUpdateStatus = true;
          }
        }
        
        if (shouldUpdateStatus) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ status: 'assigned' })
            .eq('id', taskId);
          
          console.log("Task status update result:", updateError);
        }
      }
      
      setMessage("Task assigned successfully!");
      
      // Update request status
      const { error: requestError } = await supabase
        .from('task_requests')
        .update({ status: 'selected' })
        .eq('task', taskId)
        .eq('applicant', applicantId);
      
      console.log("Request status update result:", requestError);
      
      // Verify assignments after a short delay
      setTimeout(() => {
        verifyAssignments();
        router.refresh();
      }, 500);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error assigning task:", error);
      setMessage(`Error assigning task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Add a new function to handle group assignment
  const handleAssignGroupTask = async (applicantIds: string[]) => {
    const supabase = createClient();
    
    try {
      console.log("Assigning task to group:", { taskId, applicantIds });
      
      // First, check if this is a single-person task
      if (task && task.seats === 1) {
        setMessage("This is a single-person task. You can only assign it to one student.");
        setTimeout(() => setMessage(""), 5000);
        return;
      }
      
      // Get usernames for all applicants
      const usernames = await Promise.all(applicantIds.map(async (applicantId) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', applicantId)
          .single();
        
        if (profileError || !profileData) {
          throw new Error(`Error fetching username for applicant ${applicantId}: ${profileError?.message || 'Profile not found'}`);
        }
        
        return { id: applicantId, username: profileData.username };
      }));
      
      // For group tasks, check if we're trying to assign more students than available seats
      if (task && task.seats && task.seats > 1) {
        // Get current assignments for this task
        const { data: currentAssignments, error: countError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        
        if (countError) {
          throw new Error(`Error checking current assignments: ${countError.message}`);
        }
        
        const currentCount = currentAssignments ? currentAssignments.length : 0;
        const availableSeats = task.seats - currentCount;
        
        if (applicantIds.length > availableSeats) {
          setMessage(`You're trying to assign ${applicantIds.length} students, but only ${availableSeats} seats are available.`);
          setTimeout(() => setMessage(""), 5000);
          return;
        }
      }
      
      // Create task assignments for all selected students using usernames
      const assignments = usernames.map(({ id, username }) => ({
        task: taskId,
        assignee: id, // Keep UUID for backward compatibility
        assignee_username: username // Add username for new approach
      }));
      
      const { error: assignError, data: assignmentData } = await supabase
        .from('task_assignments')
        .insert(assignments)
        .select();
      
      console.log("Group assignment result:", { assignError, assignmentData });
      
      if (assignError) {
        throw new Error(`Error assigning task to group: ${assignError.message}`);
      }
      
      // For group tasks, check if all seats are filled
      if (task && task.seats && task.seats > 1) {
        // Get current assignments for this task
        const { data: currentAssignments, error: countError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        
        console.log("Current assignments for group task:", { currentAssignments, countError });
        
        // If all seats are filled, update task status to 'assigned'
        if (currentAssignments && currentAssignments.length >= task.seats) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ status: 'assigned' })
            .eq('id', taskId);
          
          console.log("Task status update result:", updateError);
          
          setMessage(`Task assigned successfully to ${applicantIds.length} students! All ${task.seats} seats filled.`);
        } else {
          // Task still has available seats
          const assignedCount = currentAssignments ? currentAssignments.length : 0;
          const remainingSeats = task.seats - assignedCount;
          setMessage(`Task assigned successfully to ${applicantIds.length} students! ${remainingSeats} seats still available.`);
        }
      } else {
        // For individual tasks or if all seats filled, update status
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ status: 'assigned' })
          .eq('id', taskId);
        
        console.log("Task status update result:", updateError);
        
        setMessage(`Task assigned successfully to ${applicantIds.length} students!`);
      }
      
      // Update request status for all selected students
      const { error: requestError } = await supabase
        .from('task_requests')
        .update({ status: 'selected' })
        .eq('task', taskId)
        .in('applicant', applicantIds);
      
      console.log("Request status update result:", requestError);
      
      // Verify assignments after a short delay
      setTimeout(() => {
        verifyAssignments();
        router.refresh();
      }, 500);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error assigning group task:", error);
      setMessage(`Error assigning group task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Function to group applicants into groups of specified size
  const groupApplicants = (applicants: TaskRequest[], groupSize: number) => {
    const groups = [];
    for (let i = 0; i < applicants.length; i += groupSize) {
      groups.push(applicants.slice(i, i + groupSize));
    }
    return groups;
  };

  // Function to assign a group of applicants to the task
  const handleAssignGroupOfApplicants = async (group: TaskRequest[]) => {
    const supabase = createClient();
    
    try {
      console.log("Assigning group of applicants:", { taskId, group });
      
      // First, check if this is a single-person task
      if (task && task.seats === 1) {
        setMessage("This is a single-person task. You can only assign it to one student.");
        setTimeout(() => setMessage(""), 5000);
        return;
      }
      
      // Get usernames for all applicants in the group
      const usernames = await Promise.all(group.map(async (applicant) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', applicant.applicant)
          .single();
        
        if (profileError || !profileData) {
          throw new Error(`Error fetching username for applicant ${applicant.applicant}: ${profileError?.message || 'Profile not found'}`);
        }
        
        return { id: applicant.applicant, username: profileData.username };
      }));
      
      // For group tasks, check if we're trying to assign more students than available seats
      if (task && task.seats && task.seats > 1) {
        // Get current assignments for this task
        const { data: currentAssignments, error: countError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        
        if (countError) {
          throw new Error(`Error checking current assignments: ${countError.message}`);
        }
        
        const currentCount = currentAssignments ? currentAssignments.length : 0;
        const availableSeats = task.seats - currentCount;
        
        if (group.length > availableSeats) {
          setMessage(`You're trying to assign ${group.length} students, but only ${availableSeats} seats are available.`);
          setTimeout(() => setMessage(""), 5000);
          return;
        }
      }
      
      // Create task assignments for all students in the group using usernames
      const assignments = usernames.map(({ id, username }) => ({
        task: taskId,
        assignee: id, // Keep UUID for backward compatibility
        assignee_username: username // Add username for new approach
      }));
      
      const { error: assignError, data: assignmentData } = await supabase
        .from('task_assignments')
        .insert(assignments)
        .select();
      
      console.log("Group assignment result:", { assignError, assignmentData });
      
      if (assignError) {
        throw new Error(`Error assigning task to group: ${assignError.message}`);
      }
      
      // Update task status if all seats are filled
      let message = "";
      if (task && task.seats) {
        // Get current assignments for this task
        const { data: currentAssignments, error: countError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        
        console.log("Current assignments:", { currentAssignments, countError });
        
        // If all seats are filled, update task status to 'assigned'
        if (currentAssignments && currentAssignments.length >= task.seats) {
          const { data: updateData, error: updateError } = await supabase
            .from('tasks')
            .update({ status: 'assigned' })
            .eq('id', taskId)
            .select();
          
          console.log("Task status update result:", { updateData, updateError });
          
          message = `Group of ${group.length} students assigned successfully! All ${task.seats} seats filled.`;
        } else {
          // Task still has available seats
          const assignedCount = currentAssignments ? currentAssignments.length : 0;
          const remainingSeats = task.seats - assignedCount;
          message = `Group of ${group.length} students assigned successfully! ${remainingSeats} seats still available.`;
        }
      } else {
        message = `Group of ${group.length} students assigned successfully!`;
      }
      
      // Update request status for all students in the group
      const applicantIds = group.map(applicant => applicant.applicant);
      const { error: requestError } = await supabase
        .from('task_requests')
        .update({ status: 'selected' })
        .eq('task', taskId)
        .in('applicant', applicantIds);
      
      console.log("Request status update result:", requestError);
      
      // Set success message
      setMessage(message);
      
      // Verify assignments after a short delay
      setTimeout(() => {
        verifyAssignments();
        router.refresh();
      }, 500);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error assigning group of applicants:", error);
      setMessage(`Error assigning group: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Function to assign all applicants in groups of specified size
  const handleAssignAllInGroups = async () => {
    const supabase = createClient();
    
    try {
      console.log("Assigning all applicants in groups");
      
      // First, check if this is a single-person task
      if (task && task.seats === 1) {
        setMessage("This is a single-person task. You can only assign it to one student.");
        setTimeout(() => setMessage(""), 5000);
        return;
      }
      
      // Filter to only requested applicants
      const requestedApplicants = requests.filter(req => req.status === 'requested');
      
      // Group applicants into groups of 5 or based on available seats
      let groupSize = 5;
      
      // If task has limited seats, adjust group size accordingly
      if (task && task.seats) {
        // Get current assignments for this task
        const { data: currentAssignments, error: countError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task', taskId);
        
        if (countError) {
          throw new Error(`Error checking current assignments: ${countError.message}`);
        }
        
        const currentCount = currentAssignments ? currentAssignments.length : 0;
        const availableSeats = task.seats - currentCount;
        
        // Adjust group size to not exceed available seats
        groupSize = Math.min(groupSize, availableSeats);
        
        if (groupSize <= 0) {
          setMessage("All available seats for this task have been filled.");
          setTimeout(() => setMessage(""), 5000);
          return;
        }
      }
      
      const groups = groupApplicants(requestedApplicants, groupSize);
      
      // Process each group
      let successCount = 0;
      let errorCount = 0;
      
      for (const group of groups) {
        try {
          const result = await handleAssignGroupOfApplicants(group);
          successCount++;
        } catch (error) {
          console.error("Error assigning group:", error);
          errorCount++;
        }
      }
      
      if (errorCount === 0) {
        setMessage(`Successfully assigned all applicants in ${successCount} group(s)!`);
      } else {
        setMessage(`Assigned ${successCount} group(s) successfully, but ${errorCount} group(s) failed.`);
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error assigning all applicants in groups:", error);
      setMessage(`Error assigning all applicants: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Add state for group selection
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  
  // Function to toggle applicant selection
  const toggleApplicantSelection = (applicantId: string) => {
    setSelectedApplicants(prev => {
      if (prev.includes(applicantId)) {
        return prev.filter(id => id !== applicantId);
      } else {
        return [...prev, applicantId];
      }
    });
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
    
    if (error) {
      console.error("Error duplicating task:", error);
      // Show error message to user
      setMessage("Error duplicating task. Please try again.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    // Show success message
    setMessage("Task duplicated successfully!");
    setTimeout(() => setMessage(""), 3000);
    
    // Redirect to tasks page after a short delay
    setTimeout(() => {
      router.push("/e/tasks");
    }, 1000);
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
        
        {/* Add message display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes("successfully") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
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
                <h3 className="text-sm font-medium text-gray-500">Participants</h3>
                <p className="mt-1">
                  {task.seats} participant{task.seats !== 1 ? 's' : ''}
                  {task.seats && task.seats > 1 && (
                    <>
                      <br />
                      <span className="text-xs text-gray-500">
                        {/* Show assigned count */}
                        {assignments.length > 0 ? `${assignments.length} assigned` : "0 assigned"}
                      </span>
                    </>
                  )}
                </p>
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
                task.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                task.status === 'delivered' ? 'bg-green-100 text-green-800' :
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
                        <div className="flex items-center space-x-3">
                          {/* Add checkbox for group selection */}
                          <input
                            type="checkbox"
                            checked={selectedApplicants.includes(request.applicant)}
                            onChange={() => toggleApplicantSelection(request.applicant)}
                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {request.profiles?.username ? request.profiles.username : 
                               request.applicant_username ? request.applicant_username :
                               `User ${request.applicant?.substring(0, 8) || request.id.substring(0, 8)}...`}
                            </span>
                            {request.profiles?.did && (
                              <span className="text-sm text-gray-500">{request.profiles.did}</span>
                            )}
                            {request.profiles === undefined && request.applicant_username === undefined && (
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
                  {selectedApplicants.length > 1 && (
                    <div className="pt-4">
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAssignGroupTask(selectedApplicants)}
                      >
                        Assign to {selectedApplicants.length} Selected Students
                      </Button>
                    </div>
                  )}
                  
                  {/* Add button to assign all applicants in groups of 5 */}
                  {requests.filter(req => req.status === 'requested').length > 5 && (
                    <div className="pt-4">
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={handleAssignAllInGroups}
                      >
                        Assign All in Groups of 5
                      </Button>
                    </div>
                  )}
                  
                  {/* Show grouping suggestion */}
                  {requests.filter(req => req.status === 'requested').length > 0 && (
                    <div className="pt-4">
                      <p className="text-sm text-gray-600">
                        Tip: You can select multiple students and assign them as a group, or use the &quot;Assign All in Groups of 5&quot; button to automatically group all applicants.
                      </p>
                    </div>
                  )}

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
                        {assignment.profiles?.did && (
                          <span className="text-sm text-gray-500">{assignment.profiles.did}</span>
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