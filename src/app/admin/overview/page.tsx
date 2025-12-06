"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    openTasks: 0,
    assignedTasks: 0,
    deliveredTasks: 0,
    ratedTasks: 0,
    totalUsers: 0,
    students: 0,
    educators: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin code is present
    const adminCode = localStorage.getItem('admin_code');
    if (!adminCode) {
      router.push('/admin-talent3x');
      return;
    }
    
    const fetchData = async () => {
      const supabase = createClient();
      
      // Fetch task statistics
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const { count: openTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      const { count: inProgressTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');
      
      const { count: submittedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');
      
      const { count: gradedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'graded');
      
      // Get user statistics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: students } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      
      const { count: educators } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'educator');
      
      setStats({
        totalTasks: totalTasks || 0,
        openTasks: openTasks || 0,
        assignedTasks: inProgressTasks || 0,
        deliveredTasks: submittedTasks || 0,
        ratedTasks: gradedTasks || 0,
        totalUsers: totalUsers || 0,
        students: students || 0,
        educators: educators || 0,
      });
      
      setLoading(false);
    };
    
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-foreground">Talent3X</span>
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-lg border">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-lg border">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        
        <footer className="py-6 px-4 bg-card border-t">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/overview" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem('admin_code');
                router.push("/");
              }}
              className="border border-primary text-primary hover:bg-primary/20"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground">
            Platform analytics and statistics
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Total Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">All tasks on the platform</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.totalTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Open Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Available for students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.openTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Assigned Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Assigned to students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.assignedTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Completed Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Rated and finalized</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.ratedTasks}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Total Users</CardTitle>
              <CardDescription className="text-muted-foreground">All registered users</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Students</CardTitle>
              <CardDescription className="text-muted-foreground">Registered students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.students}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Educators</CardTitle>
              <CardDescription className="text-muted-foreground">Registered educators</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.educators}</div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-card border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
