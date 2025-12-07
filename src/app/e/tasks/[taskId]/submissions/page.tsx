"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type SubmissionFile = {
  name: string;
  size: number;
  type: string;
  url: string;
};

type Submission = Tables<'submissions'> & {
  profiles: {
    username: string;
  } | null;
};

export default function ViewSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get submissions with student profiles
      const { data: submissionsData, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles!submissions_submitter_fkey(username)
        `)
        .eq('task', taskId);
      
      if (error) {
        console.error("Error fetching submissions:", error);
        router.push(`/e/tasks/${taskId}`);
        return;
      }
      
      if (submissionsData) {
        setSubmissions(submissionsData);
      }
      
      setLoading(false);
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
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
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
          <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
            ← Back to Task
          </Button>
          {submissions.length > 0 && (
            <Button 
              onClick={() => router.push(`/e/tasks/${taskId}/rate`)}
            >
              Rate Submissions
            </Button>
          )}
        </div>
        
        <SharedCard>
          <div>
            <h2 className="text-2xl font-semibold">Task Submissions</h2>
            <p className="text-xs uppercase text-muted-foreground">
              View all submissions for this task
            </p>
          </div>
          
          {submissions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No submissions yet</h3>
              <p className="text-muted-foreground">Students haven&#39;t submitted anything for this task yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <SharedCard key={submission.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {submission.profiles?.username ? 
                         submission.profiles.username : 
                         `User ${submission.submitter?.substring(0, 8) || submission.id.substring(0, 8)}...`}
                      </h3>
                      
                      {submission.link && (
                        <a 
                          href={submission.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Submission Link
                        </a>
                      )}
                      
                      {submission.note && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Note:</p>
                          <p className="text-foreground">{submission.note}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </SharedCard>
              ))}
            </div>
          )}
        </SharedCard>
      </div>
    </AppLayout>
  );
}