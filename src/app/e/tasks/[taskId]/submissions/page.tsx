"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </div>
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
            <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
              ← Back to Task
            </Button>
          </div>
          
          <Card className="shadow-lg">
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
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </div>
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
          <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
            ← Back to Task
          </Button>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Submissions</h1>
            <p className="text-gray-600">View all submissions for this task</p>
          </div>
          {submissions.length > 0 && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push(`/e/tasks/${taskId}/rate`)}
            >
              Rate Submissions
            </Button>
          )}
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Task Submissions</CardTitle>
            <CardDescription>
              View all submissions for this task
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions yet</h3>
                                <p className="text-gray-500">Students haven&#39;t submitted anything for this task yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            <span className="font-medium">@{submission.profiles?.username || submission.submitter}</span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Submitted on {new Date(submission.created_at).toLocaleString()}
                          </p>
                        </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                  Completed
                                                </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {submission.note && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Submission Notes</h4>
                          <div className="p-3 bg-blue-50 rounded text-sm">
                            {submission.note}
                          </div>
                        </div>
                      )}
                      
                      {submission.link && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">External Link</h4>
                          <a 
                            href={submission.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {submission.link}
                          </a>
                        </div>
                      )}
                      
                      {submission.files && typeof submission.files === 'object' && Array.isArray(submission.files) && submission.files.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Attached Files</h4>
                          <div className="space-y-2">
                            {(submission.files as SubmissionFile[]).map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                                  </div>
                                </div>
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          {submissions.length > 0 && (
            <CardFooter className="bg-gray-50">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push(`/e/tasks/${taskId}/rate`)}
              >
                Rate All Submissions
              </Button>
            </CardFooter>
          )}
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