"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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

type ActionAssistResponse = {
  titleSuggestions: string[];
  skillSuggestions: { id: number; label: string; reason: string }[];
};

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
  const [assistLoading, setAssistLoading] = useState<"title" | "skills" | null>(null);
  const [message, setMessage] = useState("");
  const [assistMessage, setAssistMessage] = useState("");
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<ActionAssistResponse["skillSuggestions"]>([]);
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

  const requestActionAssist = async (mode: "title" | "skills") => {
    setAssistLoading(mode);
    setAssistMessage("");
    setMessage("");

    try {
      const response = await fetch("/api/tasks/action-assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          module: module || undefined,
          description,
          skillLevel,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Action assist failed");
      }

      const assist = payload as ActionAssistResponse;
      setTitleSuggestions(assist.titleSuggestions || []);
      setSkillSuggestions(assist.skillSuggestions || []);

      if (mode === "title" && assist.titleSuggestions[0]) {
        setTitle(assist.titleSuggestions[0]);
        setAssistMessage("Title suggestion applied.");
      } else if (mode === "skills") {
        const suggestedIds = (assist.skillSuggestions || []).map((skill) => skill.id);
        setSkills((prev) => Array.from(new Set([...prev, ...suggestedIds])).slice(0, 12));
        setAssistMessage(
          suggestedIds.length > 0 ? "Skill suggestions applied." : "No matching existing skills found.",
        );
      }
    } catch (error: unknown) {
      setAssistMessage(error instanceof Error ? error.message : "Action assist failed");
    } finally {
      setAssistLoading(null);
    }
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
          task_mode: 'multi',
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
              task_mode: 'multi',
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
          <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
          <p className="text-muted-foreground">
            Define a new task. After creation, you&apos;ll get a shareable link and QR code.
          </p>
        </div>

        <SharedCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="title">Task Title</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => requestActionAssist("title")}
                  disabled={assistLoading !== null || description.trim().length < 20}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {assistLoading === "title" ? "Generating..." : "Generate"}
                </Button>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
              {titleSuggestions.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {titleSuggestions.slice(1).map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTitle(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
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
                <div className="flex items-center justify-between gap-3">
                  <Label>Skills (Select up to 12)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => requestActionAssist("skills")}
                    disabled={assistLoading !== null || description.trim().length < 20}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {assistLoading === "skills" ? "Suggesting..." : "Suggest"}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Selected: {skills.length}/12
                </div>
              </div>

              {skillSuggestions.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border bg-muted p-3">
                  {skillSuggestions.map((skill) => (
                    <div key={skill.id} className="text-sm">
                      <span className="font-medium text-foreground">{skill.label}</span>
                      <span className="text-muted-foreground"> - {skill.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 border rounded-lg border-border bg-muted">
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

            {assistMessage && (
              <div className={`p-3 rounded-lg ${assistMessage.includes("applied") || assistMessage.includes("No matching") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {assistMessage}
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
