"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';

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
      <div className="container py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
          ← Back to Task
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Task Submissions</CardTitle>
          <CardDescription>
            View all submissions for this task
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No submissions for this task yet.
            </p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">@{submission.profiles?.username || submission.submitter}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(submission.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {submission.note && (
                    <div className="mt-3 p-3 bg-muted rounded">
                      <p className="text-sm">{submission.note}</p>
                    </div>
                  )}
                  
                  {submission.link && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Link:</p>
                      <a 
                        href={submission.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {submission.link}
                      </a>
                    </div>
                  )}
                  
                  {submission.files && typeof submission.files === 'object' && Array.isArray(submission.files) && submission.files.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Files:</p>
                      <div className="mt-2 space-y-2">
                        {(submission.files as SubmissionFile[]).map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}