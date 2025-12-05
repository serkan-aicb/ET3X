"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type UserWithProfile = {
  id: string;
  email: string | undefined;
  username: string;
  did: string;
  matriculation_number?: string | null;
};

type Task = {
  id: string;
  status: string;
};

type AssignmentWithTask = {
  id: string;
  task: string;
  status: string;
  tasks: Task | Task[] | null;
};

export default function StudentDashboard() {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/stud");
        return;
      }
      
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, did, matriculation_number')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push("/stud");
        return;
      }
      
      // If user doesn't have a matriculation number, redirect to collection page
      if (!profile.matriculation_number) {
        router.push("/s/collect-matriculation");
        return;
      }
      
      setUser({
        id: user.id,
        email: user.email,
        username: profile.username,
        did: profile.did,
        matriculation_number: profile.matriculation_number
      });
      
      // Get task statistics - FIXED IMPLEMENTATION
      console.log("Fetching task assignments for user:", user.id);
      
      // Fetch all assignments for the user with task details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select(`
          id,
          task,
          status,
          tasks (
            id,
            status
          )
        `)
        .eq('assignee', user.id);
      
      console.log("Assignments data:", { assignments, assignmentsError });
      
      if (!assignmentsError && assignments) {
        // Count tasks by status
        const totalTasks = assignments.length;
        let completedTasks = 0; // Tasks with ratings (graded status)
        let pendingTasks = 0;   // Tasks not yet submitted or not fully rated
        
        // For each assignment, check if there's a submission and rating
        for (const assignment of assignments) {
          // Check if task has graded status
          // Handle both array and object cases for tasks
          let taskStatus = '';
          if (assignment.tasks) {
            if (Array.isArray(assignment.tasks)) {
              if (assignment.tasks.length > 0) {
                taskStatus = assignment.tasks[0].status;
              }
            } else {
              const taskObj = assignment.tasks as Task;
              taskStatus = taskObj.status;
            }
          }
          
          if (taskStatus === 'graded') {
            completedTasks++;
          } else {
            // Check if there's a submission for this assignment
            const { data: submissions } = await supabase
              .from('submissions')
              .select('id')
              .eq('task', assignment.task)
              .eq('submitter', user.id)
              .limit(1);
            
            // Check if there's a rating for this assignment
            const { data: ratings } = await supabase
              .from('ratings')
              .select('id')
              .eq('task', assignment.task)
              .eq('rated_user', user.id)
              .limit(1);
            
            // If submitted but not rated, it's pending
            // If not submitted at all, it's also pending
            if ((submissions && submissions.length > 0) && (!ratings || ratings.length === 0)) {
              pendingTasks++;
            } else if (!submissions || submissions.length === 0) {
              pendingTasks++;
            }
          }
        }
        
        console.log("Task statistics:", { totalTasks, completedTasks, pendingTasks });
        
        setStats({
          totalTasks,
          completedTasks,
          pendingTasks
        });
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-332 w-full" />
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
        
        <footer className="py-6 px-4 bg-white border-t">
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
          <Link href="/s/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/s/my-tasks")}>
              My Tasks
            </Button>
            <Button variant="outline" onClick={() => router.push("/s/profile")}>
              Profile
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold">@{user?.username}</span>
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">Total Tasks</CardTitle>
              <CardDescription className="text-blue-600">All assigned tasks</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-blue-600">{stats.totalTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Completed</CardTitle>
              <CardDescription className="text-green-600">Tasks with ratings</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-green-600">{stats.completedTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105">
            <CardHeader className="bg-amber-50">
              <CardTitle className="text-amber-800">Pending</CardTitle>
              <CardDescription className="text-amber-600">Tasks awaiting submission/rating</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-amber-600">{stats.pendingTasks}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-800">Your DID</CardTitle>
              <CardDescription className="text-gray-600">Decentralized Identifier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm break-all p-4 bg-gray-100 rounded-lg border border-gray-200">
                {user?.did}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-800">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">Navigate to key sections</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={() => router.push("/s/tasks")} className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                Browse Tasks
              </Button>
              <Button onClick={() => router.push("/s/my-tasks")} variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3">
                My Tasks
              </Button>
              <Button onClick={() => router.push("/s/profile")} variant="outline" className="w-full border-gray-600 text-gray-600 hover:bg-gray-50 py-3">
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Educational Blockchain and IPFS Visualizations */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How Your Data is Protected and Verified</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Rating Process Visualization */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-blue-200 border-2">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Rating Process
                </CardTitle>
                <CardDescription className="text-blue-600">How your work gets rated</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-800 font-bold text-sm">1</span>
                    </div>
                    <p className="ml-3 text-gray-700">You complete and submit a task</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-800 font-bold text-sm">2</span>
                    </div>
                    <p className="ml-3 text-gray-700">Your educator reviews and rates your work</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-800 font-bold text-sm">3</span>
                    </div>
                    <p className="ml-3 text-gray-700">Your rating becomes a verifiable credential</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Blockchain Verification Visualization */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-purple-200 border-2">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Blockchain Verification
                </CardTitle>
                <CardDescription className="text-purple-600">How your credentials are secured</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-800 font-bold text-sm">1</span>
                    </div>
                    <p className="ml-3 text-gray-700">Your rating is stored as a Content Identifier (CID)</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-800 font-bold text-sm">2</span>
                    </div>
                    <p className="ml-3 text-gray-700">The CID is anchored to the Polygon blockchain</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-800 font-bold text-sm">3</span>
                    </div>
                    <p className="ml-3 text-gray-700">Your credential is permanently verifiable</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* IPFS Storage Visualization */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-green-200 border-2">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  Decentralized Storage
                </CardTitle>
                <CardDescription className="text-green-600">How your data is stored securely</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-800 font-bold text-sm">1</span>
                    </div>
                    <p className="ml-3 text-gray-700">Your rating data is stored on IPFS</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-800 font-bold text-sm">2</span>
                    </div>
                    <p className="ml-3 text-gray-700">Content is identified by a unique CID</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-800 font-bold text-sm">3</span>
                    </div>
                    <p className="ml-3 text-gray-700">Data is distributed across multiple nodes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Why This Matters</h3>
            <p className="text-gray-700">
              Your skills and achievements are stored securely using blockchain technology and IPFS. 
              This means your credentials are:
            </p>
            <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
              <li><span className="font-semibold">Tamper-proof</span> - Cannot be altered once recorded</li>
              <li><span className="font-semibold">Permanent</span> - Available anytime, anywhere</li>
              <li><span className="font-semibold">Verifiable</span> - Anyone can confirm their authenticity</li>
              <li><span className="font-semibold">Portable</span> - You own and control your credentials</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-white border-t">
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