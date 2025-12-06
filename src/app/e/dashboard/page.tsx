"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

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
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <SharedCard key={i}>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-16" />
              </SharedCard>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <SharedCard>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </SharedCard>
            
            <SharedCard>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </SharedCard>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Educator Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold">@{user?.username}</span>
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Total Tasks</h3>
            <p className="text-sm text-muted-foreground">All created tasks</p>
            <div className="text-3xl font-semibold text-primary">{stats.totalTasks}</div>
          </SharedCard>
          
          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Open Tasks</h3>
            <p className="text-sm text-muted-foreground">Tasks available for students</p>
            <div className="text-3xl font-semibold text-primary">{stats.openTasks}</div>
          </SharedCard>
          
          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Assigned Tasks</h3>
            <p className="text-sm text-muted-foreground">Tasks with assigned students</p>
            <div className="text-3xl font-semibold text-primary">{stats.assignedTasks}</div>
          </SharedCard>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <SharedCard title="Your DID" description="Decentralized Identifier">
            <div className="font-mono text-sm break-all p-4 bg-muted rounded-lg border">
              {user?.did}
            </div>
          </SharedCard>
          
          <SharedCard title="Quick Actions" description="Navigate to key sections">
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => router.push("/e/tasks")} 
              >
                View All Tasks
              </Button>
              <Button 
                onClick={() => router.push("/e/tasks/create")} 
                variant="outline" 
                className="w-full"
              >
                Create New Task
              </Button>
              <Button 
                onClick={() => router.push("/e/my-tasks")} 
                variant="outline" 
                className="w-full"
              >
                My Tasks
              </Button>
              <Button 
                onClick={() => router.push("/e/profile")} 
                variant="outline" 
                className="w-full"
              >
                View Profile
              </Button>
            </div>
          </SharedCard>
        </div>
        
        {/* Educational Blockchain and IPFS Visualizations */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">How Student Data is Protected and Verified</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Rating Process Visualization */}
            <SharedCard>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-foreground">Student Rating Process</h3>
              </div>
              <div className="space-y-4 pt-4">
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
            </SharedCard>

            {/* IPFS Storage Visualization */}
            <SharedCard>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <h3 className="text-lg font-semibold text-foreground">Work Storage (IPFS)</h3>
              </div>
              <div className="space-y-4 pt-4">
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
            </SharedCard>

            {/* Decentralization Benefits */}
            <SharedCard>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <h3 className="text-lg font-semibold text-foreground">Decentralized Benefits</h3>
              </div>
              <div className="space-y-4 pt-4">
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
            </SharedCard>
          </div>
          
          <div className="p-6 bg-card border border-primary/30 rounded-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Why This Matters for Educators</h3>
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
      </div>
    </AppLayout>
  );
}