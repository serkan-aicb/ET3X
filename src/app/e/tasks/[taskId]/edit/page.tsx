"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type Skill = Tables<'skills'>;
type Task = Tables<'tasks'>;

export default function EditTask() {
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");
  // Removed goal, context, and deliverables states
  const [seats, setSeats] = useState(1);
  const [skillLevel, setSkillLevel] = useState<"Novice" | "Skilled" | "Expert" | "Master">("Novice");
  const [license, setLicense] = useState<"CC BY 4.0" | "CC0 1.0">("CC BY 4.0");
  const [skills, setSkills] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  // Fetch skills and task data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('label');
      
      if (skillsError) {
        console.error('Error fetching skills:', skillsError);
        setMessage("Error loading skills");
      } else {
        setAvailableSkills(skillsData || []);
      }
      
      // Fetch task data
      if (taskId) {
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();
        
        if (taskError) {
          console.error('Error fetching task:', taskError);
          setMessage("Error loading task");
        } else if (taskData) {
          setTask(taskData);
          setTitle(taskData.title || "");
          setModule(taskData.module || "");
          setDescription(taskData.description || "");
          // Removed goal, context, and deliverables
          setSeats(taskData.seats || 1);
          setSkillLevel(taskData.skill_level as "Novice" | "Skilled" | "Expert" | "Master" || "Novice");
          setLicense(taskData.license as "CC BY 4.0" | "CC0 1.0" || "CC BY 4.0");
          setSkills(taskData.skills || []);
          setDueDate(taskData.due_date || "");
        }
      }
    };
    
    fetchData();
  }, [taskId]);

  const handleSkillToggle = (skillId: number) => {
    setSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else {
        // Limit to 12 skills
        if (prev.length >= 12) {
          setMessage("You can select up to 12 skills only");
          return prev;
        }
        return [...prev, skillId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      
      // Update task - remove recurrence since we removed the column
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          module,
          description, // Use description instead of goal, context, deliverables
          seats,
          skill_level: skillLevel,
          license,
          skills,
          due_date: dueDate || null
        })
        .eq('id', taskId);

      if (error) throw error;

      setMessage("Task updated successfully!");
      router.push(`/e/tasks/${taskId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message || "An error occurred while updating the task.");
      } else {
        setMessage("An unknown error occurred while updating the task.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!task && taskId) {
    return (
      <AppLayout userRole="educator">
        <SharedCard title="Task Not Found" description="The requested task could not be found.">
          <p className="text-muted-foreground">
            The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.
          </p>
          <Button 
            className="mt-4"
            onClick={() => router.push("/e/tasks")}
          >
            Back to Tasks
          </Button>
        </SharedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Edit Task</h1>
          <p className="text-xs uppercase text-muted-foreground">
            Modify the task details below
          </p>
        </div>
        
        <SharedCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="module">Module (Optional)</Label>
              <Input
                id="module"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="Enter module name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task"
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="seats">Number of Participants</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  max="999"
                  value={seats}
                  onChange={(e) => setSeats(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
                />
                <p className="text-sm text-muted-foreground">
                  Enter 1 for individual tasks, or more for group tasks
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Skill Level</Label>
                <Select value={skillLevel} onValueChange={(value: "Novice" | "Skilled" | "Expert" | "Master") => setSkillLevel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novice">Novice</SelectItem>
                    <SelectItem value="Skilled">Skilled</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>License</Label>
                <Select value={license} onValueChange={(value: "CC BY 4.0" | "CC0 1.0") => setLicense(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC BY 4.0">CC BY 4.0</SelectItem>
                    <SelectItem value="CC0 1.0">CC0 1.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Skills (Select up to 12)</Label>
                <div className="text-sm text-muted-foreground">
                  Selected: {skills.length}/12
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-4 border rounded-lg border-border bg-muted">
                {availableSkills.map((skill) => (
                  <div key={skill.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`skill-${skill.id}`}
                      checked={skills.includes(skill.id)}
                      onCheckedChange={() => handleSkillToggle(skill.id)}
                      className="mt-1"
                    />
                    <div className="flex flex-col">
                      <Label 
                        htmlFor={`skill-${skill.id}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {skill.label}
                      </Label>
                      {skill.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {skill.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {skills.length >= 12 && (
                <div className="text-sm text-yellow-600">
                  You have reached the maximum of 12 skills.
                </div>
              )}
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-900/30 text-green-400 border border-green-800/50" : "bg-red-900/30 text-red-400 border border-red-800/50"}`}>
                {message}
              </div>
            )}
            
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Task"}
              </Button>
            </div>
          </form>
        </SharedCard>
      </div>
    </AppLayout>
  );
}