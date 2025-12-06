"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type Task = Tables<'tasks'>;

export default function EducatorMyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get tasks created by this educator
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setTasks(data);
      }
      
      setLoading(false);
    };
    
    fetchTasks();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Draft</span>;
      case 'open':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Open</span>;
      case 'assigned':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Assigned</span>;
      case 'delivered':
        return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Delivered</span>;
      case 'rated':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Rated</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SharedCard key={i}>
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </SharedCard>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">My Tasks</h1>
            <p className="text-xs uppercase text-muted-foreground">
              Tasks you{`'`}ve created
            </p>
          </div>
          <Button onClick={() => router.push("/e/tasks/create")}>
            Create New Task
          </Button>
        </div>
        
        {tasks.length === 0 ? (
          <SharedCard>
            <div className="py-8 text-center">
              <p className="text-muted-foreground">You haven{`'`}t created any tasks yet.</p>
              <Button 
                onClick={() => router.push("/e/tasks/create")}
                className="mt-4"
              >
                Create Your First Task
              </Button>
            </div>
          </SharedCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <SharedCard key={task.id}>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    {task.module && (
                      <p className="text-sm text-muted-foreground">{task.module}</p>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(task.status)}
                    {task.skill_level && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {task.skill_level}
                      </span>
                    )}
                    {task.license && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {task.license}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">
                      {task.task_mode === 'single' ? 'Single' : 'Multi'} Assignment
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/e/tasks/${task.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </SharedCard>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}