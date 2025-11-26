"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import Link from "next/link";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/e/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/e/tasks")}>
              View Tasks
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600">
            Define a new task for students to complete
          </p>
        </div>
        
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-800">Task Details</CardTitle>
            <CardDescription className="text-gray-600">
              Fill in the information below to create a new task
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                  className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="module">Module (Optional)</Label>
                <Input
                  id="module"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  placeholder="Enter module name"
                  className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                  className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                    className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-sm text-gray-500">
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
                    className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Task Mode</Label>
                  <Select value={taskMode} onValueChange={(value: "single" | "multi") => setTaskMode(value)}>
                    <SelectTrigger className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Select task mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Assignment</SelectItem>
                      <SelectItem value="multi">Multi-Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    {taskMode === "single" 
                      ? "Only one student can be assigned to this task" 
                      : "Multiple students can be assigned to this task"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select value={skillLevel} onValueChange={(value: "Novice" | "Skilled" | "Expert" | "Master") => setSkillLevel(value)}>
                    <SelectTrigger className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
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
                    <SelectTrigger className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-4 border-2 border-gray-200 rounded-lg">
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
                <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50">
              <Button type="button" variant="outline" className="border-gray-600 text-gray-600 hover:bg-gray-50 py-3" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 py-3">
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
            </CardFooter>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-white border-t mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}