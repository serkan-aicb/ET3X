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

export default function EducatorDashboard() {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    openTasks: 0,
    assignedTasks: 0,
    deliveredTasks: 0,
    ratedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/edu");
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
        router.push("/edu");
        return;
      }
      
      setUser({
        id: user.id,
        email: user.email,
        username: profile.username,
        did: profile.did
      });
      
      // Get task statistics
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status')
        .eq('creator', user.id);
      
      if (!tasksError && tasks) {
        // Calculate task statistics
        const totalTasks = tasks.length;
        const openTasks = tasks.filter(t => t.status === 'open').length;
        const assignedTasks = tasks.filter(t => t.status === 'in_progress').length;
        const deliveredTasks = tasks.filter(t => t.status === 'submitted').length;
        const ratedTasks = tasks.filter(t => t.status === 'graded').length;
        
        setStats({
          totalTasks,
          openTasks,
          assignedTasks,
          deliveredTasks,
          ratedTasks,
        });
      }
      
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
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg border">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
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
          <Link href="/e/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/e/my-tasks")}>
              My Tasks
            </Button>
            <Button variant="outline" onClick={() => router.push("/e/profile")}>
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
          <h1 className="text-3xl font-bold text-foreground">Educator Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold">@{user?.username}</span>
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Total Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">All created tasks</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.totalTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Open Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Tasks available for students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.openTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Assigned Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Tasks with assigned students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.assignedTasks}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg rounded-xl overflow-hidden border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Your DID</CardTitle>
              <CardDescription className="text-muted-foreground">Decentralized Identifier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm break-all p-4 bg-muted rounded-lg border">
                {user?.did}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">Navigate to key sections</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button 
                onClick={() => router.push("/e/tasks")} 
              >
                View All Tasks
              </Button>
              <Button 
                onClick={() => router.push("/e/tasks/create")} 
                variant="outline" 
                className="w-full border border-primary text-primary hover:bg-primary/20 py-3"
              >
                Create New Task
              </Button>
              <Button 
                onClick={() => router.push("/e/my-tasks")} 
                variant="outline" 
                className="w-full border border-muted-foreground text-muted-foreground hover:bg-muted/20 py-3"
              >
                My Tasks
              </Button>
              <Button 
                onClick={() => router.push("/e/profile")} 
                variant="outline" 
                className="w-full border border-muted-foreground text-muted-foreground hover:bg-muted/20 py-3"
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Educational Blockchain and IPFS Visualizations */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">How Student Data is Protected and Verified</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Rating Process Visualization */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-primary/50 border-2">
              <CardHeader className="bg-card">
                <CardTitle className="text-foreground flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Student Rating Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">1</span>
                    </div>
                    <p className="ml-3 text-muted-foreground">Student completes assignment</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">2</span>
                    </div>
                    <p className="ml-3 text-muted-foreground">Educator rates the work</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">3</span>
                    </div>
                    <p className="ml-3 text-muted-foreground">Rating is cryptographically signed</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">4</span>
                    </div>
                    <p className="ml-3 text-muted-foreground">Record is stored permanently on blockchain</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IPFS Storage Visualization */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-primary/50 border-2">
              <CardHeader className="bg-card">
                <CardTitle className="text-foreground flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  Work Storage (IPFS)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">1</span>
                    </div>
                    <p className="ml-3 text-muted-foreground">Work is uploaded to IPFS</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">2</span>
                    </div>
                    <p className="ml-3 text-muted-foreground">Content gets unique CID hash</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">3</span>
                    </div>
                    <p className="ml-3 text-muted-foreground">CID is stored on blockchain</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">4</span>
                    </div>
                    <div>
                      <p className="ml-3 text-muted-foreground">Anyone can verify:</p>
                      <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground ml-3">
                        <li>Content integrity</li>
                        <li>Timestamp</li>
                        <li>Educator signature</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decentralization Benefits */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-primary/50 border-2">
              <CardHeader className="bg-card">
                <CardTitle className="text-foreground flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Decentralized Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="ml-3 text-muted-foreground">Data is distributed across multiple nodes</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="ml-3 text-muted-foreground">No single point of failure</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="ml-3 text-muted-foreground">Permanent storage with cryptographic proof</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="ml-3 text-muted-foreground">Data is distributed across multiple nodes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-card border border-primary/30 rounded-xl">
            <h3 className="text-lg font-bold text-foreground mb-2">Why This Matters for Educators</h3>
            <p className="text-muted-foreground">
              This decentralized system ensures that student achievements are:
            </p>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li><span className="font-semibold">Tamper-proof</span> - Cannot be altered once recorded</li>
              <li><span className="font-semibold">Permanent</span> - Available anytime, anywhere</li>
              <li><span className="font-semibold">Verifiable</span> - Anyone can confirm their authenticity</li>
              <li><span className="font-semibold">Portable</span> - Students own and control their credentials</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              As an educator, you play a crucial role in anchoring student achievements to this secure, decentralized system.
            </p>
          </div>
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