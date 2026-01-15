"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

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

// No pagination - show all submissions

// Define sort options
const SORT_OPTIONS = [
  { label: "Newest first", value: "submitted_at_desc" },
  { label: "Oldest first", value: "submitted_at_asc" }
];

export default function ViewSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("submitted_at_desc");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        // Get submissions with student profiles that don't have ratings from this educator yet
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select(`
            *,
            profiles!submissions_submitter_fkey(username)
          `)
          .eq('task', taskId);

        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError);
          router.push(`/e/tasks/${taskId}`);
          return;
        }

        if (!submissionsData) {
          setSubmissions([]);
          setLoading(false);
          return;
        }

        // Get IDs of students who have already been rated by this educator for this task
        const { data: existingRatings, error: ratingsError } = await supabase
          .from('task_ratings')
          .select('rated_user_id')
          .eq('task_id', taskId)
          .eq('rater_id', user.id);

        if (ratingsError) {
          console.error("Error fetching ratings:", ratingsError);
          setSubmissions(submissionsData);
          setLoading(false);
          return;
        }

        // Filter out submissions from students who have already been rated
        const ratedUserIds = existingRatings?.map(rating => rating.rated_user_id) || [];
        const pendingSubmissions = submissionsData.filter(
          submission => !ratedUserIds.includes(submission.submitter)
        );

        setSubmissions(pendingSubmissions);
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push(`/e/tasks/${taskId}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (taskId) {
      fetchData();
    }
  }, [taskId, router]);

  // Apply filtering and sorting
  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(submission => 
        (submission.profiles?.username || '').toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      
      if (sortOption === "submitted_at_desc") {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });
    
    return result;
  }, [submissions, searchTerm, sortOption]);
  
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
        </div>
        
        <SharedCard>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Task Submissions</h2>
            <p className="text-xs uppercase text-muted-foreground">
              View all submissions for this task
            </p>
          </div>
          
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Table for submissions */}
          {filteredAndSortedSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                {submissions.length === 0 ? "No submissions yet" : "No submissions match your search"}
              </h3>
              <p className="text-muted-foreground">
                {submissions.length === 0 
                  ? "Students will appear here once they submit work for this task."
                  : "Try adjusting your search criteria."
                }
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground">Student</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSubmissions.map((submission) => (
                    <TableRow key={submission.id} className="border-b-border/20 hover:bg-muted/10">
                      <TableCell className="py-4">
                        <div>
                          <div className="font-medium">
                            {submission.profiles?.username ? 
                             submission.profiles.username : 
                             `User ${submission.submitter?.substring(0, 8) || submission.id.substring(0, 8)}...`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Submitted: {submission.created_at ? new Date(submission.created_at).toLocaleDateString() : '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button 
                          onClick={() => router.push(`/e/tasks/${taskId}/submissions/${submission.id}/rate`)}
                          className="whitespace-nowrap"
                        >
                          Rate Student
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          

        </SharedCard>
      </div>
    </AppLayout>
  );
}