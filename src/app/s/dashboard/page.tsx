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
        .select('username, did')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push("/stud");
        return;
      }
      
      setUser({
        id: user.id,
        email: user.email,
        username: profile.username,
        did: profile.did
      });
      
      // Get task statistics
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('task')
        .eq('assignee', user.id);
      
      if (!assignmentsError && assignments) {
        const taskIds = assignments.map(a => a.task);
        
        if (taskIds.length > 0) {
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('status')
            .in('id', taskIds);
          
          if (!tasksError && tasks) {
            const completedTasks = tasks.filter(t => t.status === 'rated').length;
            const pendingTasks = tasks.filter(t => t.status !== 'rated').length;
            
            setStats({
              totalTasks: tasks.length,
              completedTasks,
              pendingTasks
            });
          }
        }
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
                <Skeleton className="h-32 w-full" />
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
        
        <div className="grid gap-6 md:grid-cols-2">
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