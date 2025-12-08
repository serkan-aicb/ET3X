"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { SingleStudentRatingForm } from "@/components/tasks/single-student-rating-form";

type Submission = Tables<'submissions'> & {
  profiles: {
    username: string;
  } | null;
};

type Task = Tables<'tasks'> & {
  skills_data?: {
    id: number;
    label: string;
    description: string;
  }[];
};

export default function RateSingleStudent() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const submissionId = params.submissionId as string;

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
        
        // Get submission with student profile
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select(`
            *,
            profiles!submissions_submitter_fkey(username)
          `)
          .eq('id', submissionId)
          .eq('task', taskId)
          .single();
        
        if (submissionError) {
          console.error("Error fetching submission:", submissionError);
          setError("Submission not found or you don't have permission to access it.");
          setLoading(false);
          return;
        }
        
        setSubmission(submissionData);
        
        // Get task details
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
        
        // Check if this student has already been rated by this educator
        const { data: existingRating, error: ratingError } = await supabase
          .from('ratings')
          .select('id')
          .eq('task', taskId)
          .eq('rated_user', submissionData.submitter)
          .eq('rater', user.id)
          .limit(1)
          .maybeSingle();
        
        if (ratingError) {
          console.error("Error checking existing rating:", ratingError);
        } else if (existingRating) {
          // Redirect back to submissions list if already rated
          router.push(`/e/tasks/${taskId}/submissions`);
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };
    
    if (taskId && submissionId) {
      fetchData();
    }
  }, [taskId, submissionId, router]);

  if (loading) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}/submissions`)}>
              ← Back to Submissions
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
                onClick={() => router.push(`/e/tasks/${taskId}/submissions`)}
              >
                Back to Submissions
              </Button>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (!submission || !task) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <SharedCard>
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Submission or task not found.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push(`/e/tasks/${taskId}/submissions`)}
              >
                Back to Submissions
              </Button>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}/submissions`)}>
            ← Back to Submissions
          </Button>
        </div>
        
        <SharedCard>
          <div>
            <h2 className="text-2xl font-semibold">Rate Task: {task.title}</h2>
            <p className="text-xs uppercase text-muted-foreground">
              Rating submission from @{submission.profiles?.username || submission.submitter}
            </p>
          </div>
          
          <SingleStudentRatingForm 
            taskId={taskId}
            submissionId={submissionId}
            student={{
              id: submission.submitter,
              username: submission.profiles?.username || submission.submitter
            }}
            skills={task.skills || []}
            task={task}
            onSuccess={() => router.push(`/e/tasks/${taskId}/submissions`)}
          />
        </SharedCard>
      </div>
    </AppLayout>
  );
}