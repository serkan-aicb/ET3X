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

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CreateTask() {
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Novice" | "Skilled" | "Expert" | "Master">("Novice");
  const [license, setLicense] = useState<"CC BY 4.0" | "CC0 1.0">("CC BY 4.0");
  const [skills, setSkills] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const router = useRouter();

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Generate a unique share code
      const shareCode = generateShareCode();

      // Create task with share_code and is_requestable=true (students request via public link)
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          creator: user.id,
          title,
          module,
          description,
          skill_level: skillLevel,
          license,
          skills,
          due_date: dueDate || null,
          status: 'open',
          is_requestable: true,
          is_active: true,
          share_code: shareCode,
        })
        .select()
        .single();

      if (taskError) {
        // If share_code collision, retry with a new code
        if (taskError.code === '23505' && taskError.message.includes('share_code')) {
          const newShareCode = generateShareCode();
          const { data: retryData, error: retryError } = await supabase
            .from('tasks')
            .insert({
              creator: user.id,
              title,
              module,
              description,
              skill_level: skillLevel,
              license,
              skills,
              due_date: dueDate || null,
              status: 'open',
              is_requestable: true,
              is_active: true,
              share_code: newShareCode,
            })
            .select()
            .single();

          if (retryError) throw retryError;
          // Redirect to share page
          router.push(`/e/tasks/share/${retryData.id}`);
          return;
        }
        throw taskError;
      }

      // Redirect to the share page
      router.push(`/e/tasks/share/${taskData.id}`);
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
            Define a new task. After creation, you&apos;ll get a shareable link and QR code.
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
                  <div key={skill.id} className="flex items-start space-x-2 skill-checkbox">
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
              <div className={`p-3 rounded-lg ${message.includes("successfully") || message.includes("assigned to") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message}
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </SharedCard>
      </div>
    </AppLayout>
  );
}