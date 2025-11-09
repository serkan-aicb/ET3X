"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingForm } from "@/components/tasks/rating-form";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';

type Task = Tables<'tasks'>;
type Assignment = Tables<'task_assignments'> & {
  profiles: {
    id: string;
    username: string;
  } | null;
};
type Skill = Tables<'skills'>;

export default function RateTask() {
  const [task, setTask] = useState<Task | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (taskError) {
        console.error("Error fetching task:", taskError);
        router.push("/e/tasks");
        return;
      }
      
      setTask(taskData);
      
      // Get task assignments with student profiles
      const { data: assignmentsData } = await supabase
        .from('task_assignments')
        .select(`
          *,
          profiles(id, username)
        `)
        .eq('task', taskId);
      
      if (assignmentsData) {
        setAssignments(assignmentsData);
      }
      
      // Get skills
      const { data: skillsData } = await supabase
        .from('skills')
        .select('*');
      
      if (skillsData) {
        setSkills(skillsData);
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
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full mt-6" />
              <Skeleton className="h-32 w-full mt-6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Task not found.</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push("/e/tasks")}
            >
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const students = assignments
    .map(assignment => ({
      id: assignment.assignee,
      username: assignment.profiles?.username || assignment.assignee
    }))
    .filter(student => student.username);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push(`/e/tasks/${taskId}`)}>
          ← Back to Task
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Rate Task: {task.title}</CardTitle>
          <CardDescription>
            Provide ratings for each assigned student
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No students assigned to this task.
            </p>
          ) : (
            <RatingForm 
              taskId={taskId} 
              students={students} 
              skills={skills.map(s => ({ id: s.id, label: s.label }))} 
              task={task}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}