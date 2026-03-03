"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

// Skill type aligned with DB schema including oulu_domain
type Skill = {
  id: number;
  label: string;
  description: string | null;
  oulu_domain: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  skills: number[] | null;
};

export default function RateTaskPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("You must be logged in to view this page.");
          setLoading(false);
          return;
        }

        // Get task details
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .eq("creator", user.id)
          .single();

        if (taskError) {
          console.error("Error fetching task:", taskError);
          setError(
            "You don't have permission to rate this task or the task doesn't exist."
          );
          setLoading(false);
          return;
        }

        setTask(taskData);

        // Get skills data with oulu_domain included
        const { data: skillsData, error: skillsError } = await supabase
          .from("skills")
          .select("id, label, description, oulu_domain")
          .order("label", { ascending: true });

        if (skillsError) {
          console.error("Error fetching skills:", skillsError);
        } else {
          setSkills(skillsData ?? []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
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
            <Button variant="outline" onClick={() => router.push(`/e/tasks`)}>
              ← Back to Tasks
            </Button>
          </div>

          <SharedCard>
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push(`/e/tasks`)}>
              ← Back to Tasks
            </Button>
          </div>

          <SharedCard>
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
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
          <Button variant="outline" onClick={() => router.push(`/e/tasks`)}>
            ← Back to Tasks
          </Button>
        </div>

        <SharedCard>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{task?.title}</h1>
            <p className="text-muted-foreground">{task?.description}</p>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Skills</h2>
              {skills.length > 0 ? (
                <div className="grid gap-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{skill.label}</p>
                        {skill.description && (
                          <p className="text-sm text-muted-foreground">
                            {skill.description}
                          </p>
                        )}
                      </div>
                      {skill.oulu_domain && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {skill.oulu_domain}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skills available.</p>
              )}
            </div>
          </div>
        </SharedCard>
      </div>
    </AppLayout>
  );
}
