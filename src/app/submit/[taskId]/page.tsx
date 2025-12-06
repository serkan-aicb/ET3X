"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type Task = Tables<'tasks'>;

export default function SubmitTask() {
  const [task, setTask] = useState<Task | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchTask = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/stud");
        return;
      }
      
      // Check if user is assigned to this task
      const { data: assignment, error: assignmentError } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task', taskId)
        .eq('assignee', user.id)
        .single();
      
      if (assignmentError || !assignment) {
        // User is not assigned to this task
        router.push("/s/my-tasks");
        return;
      }
      
      // Get task details
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (!error && data) {
        setTask(data);
      }
      
      setLoading(false);
    };
    
    if (taskId) {
      fetchTask();
    }
  }, [taskId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      // Create submission
      const { error: submitError } = await supabase
        .from('submissions')
        .insert({
          task: taskId,
          submitter: user.id,
          link: link || null,
          note: note || null
        });

      if (submitError) throw submitError;

      setMessage("Task submitted successfully!");
      
      // Update task status to 'delivered' if all assignees have submitted
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task', taskId);
      
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('task', taskId);
      
      if (assignments && submissions && submissions.length >= assignments.length) {
        await supabase
          .from('tasks')
          .update({ status: 'delivered' })
          .eq('id', taskId);
      }
      
      // Redirect to my tasks page
      setTimeout(() => {
        router.push("/s/my-tasks");
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message || "An error occurred while submitting the task.");
      } else {
        setMessage("An unknown error occurred while submitting the task.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout userRole="student">
        <div className="space-y-8">
          <SharedCard>
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="space-y-4 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full mt-4" />
                <Skeleton className="h-20 w-full mt-4" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout userRole="student">
        <SharedCard>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Task not found.</p>
            <Button 
              className="mt-4"
              onClick={() => router.push("/s/my-tasks")}
            >
              Back to My Tasks
            </Button>
          </div>
        </SharedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <SharedCard>
          <div>
            <h2 className="text-2xl font-semibold">Submit Task: {task.title}</h2>
            <p className="text-xs uppercase text-muted-foreground">
              Complete and submit your work for this task
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com/your-work"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional, max 300 characters)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any notes about your submission"
                rows={3}
                maxLength={300}
              />
              <div className="text-right text-sm text-muted-foreground">
                {note.length}/300 characters
              </div>
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-900/30 text-green-400 border border-green-800/50" : "bg-red-900/30 text-red-400 border border-red-800/50"}`}>
                {message}
              </div>
            )}
            
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Task"}
              </Button>
            </div>
          </form>
        </SharedCard>
      </div>
    </AppLayout>
  );
}