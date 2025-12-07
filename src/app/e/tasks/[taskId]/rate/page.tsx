"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingForm } from "@/components/tasks/rating-form";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

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
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
              ← Back to Task
            </Button>
          </div>
          
          <SharedCard>
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="space-y-4 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-20 w-full mt-6" />
                <Skeleton className="h-32 w-full mt-6" />
              </div>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <SharedCard>
            <div className="py-8 text-center">
              <p className="text-red-400">{error}</p>
              <Button 
                className="mt-4"
                onClick={() => router.push(`/e/tasks/${taskId}`)}
              >
                Back to Task
              </Button>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <SharedCard>
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Task not found.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push("/e/tasks")}
              >
                My Tasks
              </Button>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  // Prepare students data for RatingForm
  const studentsData = assignments
    .filter(assignment => assignment.profiles)
    .map(assignment => ({
      id: assignment.assignee,
      username: assignment.profiles!.username
    }));

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
            ← Back to Task
          </Button>
        </div>
        
        <SharedCard>
          <div>
            <h2 className="text-2xl font-semibold">Rate Task: {task.title}</h2>
            <p className="text-xs uppercase text-muted-foreground">
              Rate submissions for this task
            </p>
          </div>
          
          {assignments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No students have been assigned to this task yet.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push(`/e/tasks/${taskId}`)}
              >
                Back to Task
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <RatingForm 
                taskId={taskId} 
                students={studentsData}
                skills={skills.map(skill => ({
                  ...skill,
                  description: skill.description || ''
                }))}
                task={task}
              />
            </div>
          )}
        </SharedCard>
      </div>
    </AppLayout>
  );
}