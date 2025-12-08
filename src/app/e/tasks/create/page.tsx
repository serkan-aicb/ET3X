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
  // Removed seats state as it's no longer needed in the new flow
  const [skillLevel, setSkillLevel] = useState<"Novice" | "Skilled" | "Expert" | "Master">("Novice");
  const [license, setLicense] = useState<"CC BY 4.0" | "CC0 1.0">("CC BY 4.0");
  // Removed taskMode state as it's no longer needed in the new flow
  const [skills, setSkills] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  
  // New state for assigned usernames (part of the new bulk assignment flow)
  const [assignedUsernames, setAssignedUsernames] = useState("");
  // State for displaying missing usernames
  const [missingUsernames, setMissingUsernames] = useState<string[]>([]);
  
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

  // Process assigned usernames: trim, remove duplicates, filter empty
  // This is part of the new bulk assignment flow
  const processAssignedUsernames = (): string[] => {
    if (!assignedUsernames.trim()) {
      return [];
    }
    
    // Split by newlines, trim each line, filter out empty lines, remove duplicates
    const usernames = assignedUsernames
      .split('\n')
      .map(username => username.trim())
      .filter(username => username.length > 0);
    
    // Remove duplicates while preserving order
    return Array.from(new Set(usernames));
  };

  // Main submission handler for the new flow
  // This replaces the old request/submission flow with direct assignment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMissingUsernames([]);
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      console.log("Creating task for user:", user.id);
      
      // Process assigned usernames
      const processedUsernames = processAssignedUsernames();
      
      // Check for extremely large lists
      if (processedUsernames.length > 5000) {
        setMessage("Warning: You are trying to assign a very large number of students. This may take a while to process.");
      }
      
      // Create task - remove seats and task_mode since they're no longer needed
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          creator: user.id,
          title,
          module,
          description, // Use description instead of goal, context, deliverables
          // Removed seats
          skill_level: skillLevel,
          license,
          skills,
          due_date: dueDate || null,
          status: 'open',
          // Removed task_mode
        })
        .select()
        .single();
      
      console.log("Task creation result:", taskError);
      
      if (taskError) throw taskError;
      
      // If we have assigned usernames, call the RPC function
      // This is the core of the new bulk assignment flow
      if (processedUsernames.length > 0) {
        console.log("Calling RPC with usernames:", processedUsernames);
        
        // Call the RPC function to assign usernames to the task
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('assign_task_to_usernames', {
            task_id: taskData.id,
            usernames: processedUsernames
          });
        
        console.log("RPC result:", rpcData, rpcError);
        
        // Handle RPC errors specifically
        if (rpcError) {
          // Delete the created task since the assignment failed
          await supabase
            .from('tasks')
            .delete()
            .eq('id', taskData.id);
          
          // Provide a more specific error message based on the error
          if (rpcError.message.includes('assigned_by')) {
            setMessage("There was an issue with the assignment system. Please contact support. (Error: Column 'assigned_by' not found)");
          } else {
            setMessage(`Failed to assign task to students: ${rpcError.message}`);
          }
          setLoading(false);
          return;
        }
        
        // Check if there were any missing usernames
        if (rpcData.missing_usernames && rpcData.missing_usernames.length > 0) {
          // Set missing usernames to display to the user
          setMissingUsernames(rpcData.missing_usernames);
          
          // Delete the created task since some usernames were invalid
          await supabase
            .from('tasks')
            .delete()
            .eq('id', taskData.id);
          
          setMessage(`The following usernames do not exist: ${rpcData.missing_usernames.join(', ')}. Task was not created.`);
          setLoading(false);
          return;
        }
        
        // Success - task created and assigned
        setMessage(`Task created and assigned to ${rpcData.assigned_usernames.length} students.`);
      } else {
        // Success - task created without assignments
        setMessage("Task created successfully!");
      }
      
      // Redirect to tasks page after a short delay
      setTimeout(() => {
        router.push("/e/tasks");
      }, 2000);
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
        
        {/* 
          NEW TALENT3X UNIVERSITY FLOW:
          This form implements the new direct assignment flow where educators
          assign tasks directly to students by pasting usernames during task creation.
          
          DEPRECATED FEATURES (can be removed later):
          - Number of Participants field (was seats)
          - Task Mode field (was single/multi assignment)
          - Student request system
          - Student submission system
        */}
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
              {/* Removed Number of Participants field - deprecated in new flow */}
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              
              {/* Removed Task Mode field - deprecated in new flow */}
              
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
            
            {/* New Assigned Usernames field for direct assignment */}
            <div className="space-y-2">
              <Label htmlFor="assignedUsernames">Assigned Usernames (optional)</Label>
              <Textarea
                id="assignedUsernames"
                value={assignedUsernames}
                onChange={(e) => setAssignedUsernames(e.target.value)}
                placeholder="Paste one username per line (e.g. stud12345)&#10;stud12345&#10;stud67890&#10;stud99999"
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                You can paste a full column from Google Sheets. Each line will be treated as one username.
              </p>
              
              {/* Display missing usernames if any */}
              {missingUsernames.length > 0 && (
                <div className="mt-2 p-3 bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg">
                  <p className="font-medium">The following usernames do not exist:</p>
                  <ul className="list-disc list-inside mt-1">
                    {missingUsernames.map((username, index) => (
                      <li key={index}>{username}</li>
                    ))}
                  </ul>
                </div>
              )}
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
              <div className={`p-3 rounded-lg ${message.includes("successfully") || message.includes("assigned to") ? "bg-green-900/30 text-green-400 border border-green-800/50" : "bg-red-900/30 text-red-400 border border-red-800/50"}`}>
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

// Export the username processing function for testing
export const processAssignedUsernames = (assignedUsernames: string): string[] => {
  if (!assignedUsernames.trim()) {
    return [];
  }
  
  // Split by newlines, trim each line, filter out empty lines, remove duplicates
  const usernames = assignedUsernames
    .split('\n')
    .map(username => username.trim())
    .filter(username => username.length > 0);
  
  // Remove duplicates while preserving order
  return Array.from(new Set(usernames));
};

// Simple test function for the username processing logic
export const testProcessAssignedUsernames = () => {
  const testCases = [
    {
      input: "user1\nuser2\nuser3",
      expected: ["user1", "user2", "user3"],
      description: "Basic case with multiple usernames"
    },
    {
      input: " user1 \n user2 \n user3 ",
      expected: ["user1", "user2", "user3"],
      description: "Usernames with extra whitespace"
    },
    {
      input: "user1\n\nuser2\n\n\nuser3",
      expected: ["user1", "user2", "user3"],
      description: "Empty lines between usernames"
    },
    {
      input: "user1\nuser1\nuser2",
      expected: ["user1", "user2"],
      description: "Duplicate usernames"
    },
    {
      input: "",
      expected: [],
      description: "Empty input"
    },
    {
      input: "   \n  \n  ",
      expected: [],
      description: "Only whitespace"
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ input, expected, description }) => {
    const result = processAssignedUsernames(input);
    const success = JSON.stringify(result) === JSON.stringify(expected);
    
    if (success) {
      console.log(`✓ ${description}`);
      passed++;
    } else {
      console.log(`✗ ${description}`);
      console.log(`  Expected: ${JSON.stringify(expected)}`);
      console.log(`  Got:      ${JSON.stringify(result)}`);
      failed++;
    }
  });
  
  console.log(`\nTests: ${passed} passed, ${failed} failed`);
  return failed === 0;
};
