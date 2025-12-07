"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateTask() {
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");
  const [seats, setSeats] = useState(1);
  const [skillLevel, setSkillLevel] = useState<"Novice" | "Skilled" | "Expert" | "Master">("Novice");
  const [license, setLicense] = useState<"CC BY 4.0" | "CC0 1.0">("CC BY 4.0");
  const [taskMode, setTaskMode] = useState<"single" | "multi">("single"); // New state for task mode
  const [skills, setSkills] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const router = useRouter();

  // Fetch skills on component mount
  useEffect(() => {
    const fetchSkills = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('label');
      
      if (error) {
        console.error('Error fetching skills:', error);
        setMessage("Error loading skills");
      } else {
        setAvailableSkills(data || []);
      }
    };
    
    fetchSkills();
  }, []);

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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      console.log("Creating task for user:", user.id);
      
      // Create task - remove recurrence since we removed the column
      const { error } = await supabase
        .from('tasks')
        .insert({
          creator: user.id,
          title,
          module,
          description, // Use description instead of goal, context, deliverables
          seats,
          skill_level: skillLevel,
          license,
          skills,
          due_date: dueDate || null,
          status: 'open',
          task_mode: taskMode // Add task_mode to the insert
        });
      
      console.log("Task creation result:", error);
      
      if (error) throw error;
      
      setMessage("Task created and published successfully!");
      router.push("/e/tasks");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message || "An error occurred while creating the task.");
      } else {
        setMessage("An unknown error occurred while creating the task.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Create New Task</h1>
          <p className="text-xs uppercase text-muted-foreground">
            Define a new task for students to complete
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
                <Label>Task Mode</Label>
                <Select value={taskMode} onValueChange={(value: "single" | "multi") => setTaskMode(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Assignment</SelectItem>
                    <SelectItem value="multi">Multi-Assignment</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {taskMode === "single" 
                    ? "Only one student can be assigned to this task" 
                    : "Multiple students can be assigned to this task"}
                </p>
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
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : "Create Task"}
              </Button>
            </div>
          </form>
        </SharedCard>
      </div>
    </AppLayout>
  );
}