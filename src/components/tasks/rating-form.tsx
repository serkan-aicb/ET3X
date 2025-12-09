"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { SkillScore, Level, computeXP } from "@/lib/utils/xp";
import { Tables } from '@/lib/supabase/types';

type Task = Tables<'tasks'>;

// Update the props to include skill details with descriptions
export function RatingForm({ 
  taskId, 
  students, 
  skills,
  task
}: { 
  taskId: string; 
  students: { id: string; username: string }[]; 
  skills: { id: number; label: string; description: string }[]; 
  task: Task;
}) {
  const [ratings, setRatings] = useState<Record<string, Record<number, number>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Load existing ratings when component mounts
  useEffect(() => {
    // This effect is no longer needed as we're using the new normalized schema
    // The old code that loaded existing ratings from the 'ratings' table has been removed
  }, [students, taskId]);

  const handleRatingChange = (studentId: string, skillId: number, value: number) => {
    // Only allow values 1-5
    if (value >= 1 && value <= 5) {
      setRatings(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [skillId]: value
        }
      }));
    } else if (value === 0) {
      // Remove the rating if 0 is entered (treat as unrated)
      const newRatings = { ...ratings };
      if (newRatings[studentId]) {
        delete newRatings[studentId][skillId];
        // If no ratings left for this student, remove the student entry
        if (Object.keys(newRatings[studentId]).length === 0) {
          delete newRatings[studentId];
        }
      }
      setRatings(newRatings);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage("");
    
    try {
      const supabase = createClient();
      
      // Get current user (educator)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      // Get educator profile for DID
      const { data: educatorProfile, error: educatorError } = await supabase
        .from('profiles')
        .select('did')
        .eq('id', user.id)
        .single();
      
      if (educatorError) throw educatorError;
      
      // Create or update ratings for each student
      for (const student of students) {
        const studentRatings = ratings[student.id] || {};
        
        // Skip if no ratings provided for this student
        if (Object.keys(studentRatings).length === 0) {
          continue;
        }
        
        // Prepare skill scores for XP calculation
        const skillScores: SkillScore[] = Object.entries(studentRatings).map(([skillId, stars]) => ({
          skillId: parseInt(skillId),
          stars: Math.max(1, Math.min(5, Math.round(stars))) as 1|2|3|4|5
        }));
        
        // Calculate XP using the provided formula
        const { starsAvg, xp } = computeXP({
          scores: skillScores,
          level: (task.skill_level as Level) || "Novice",
          submittedAt: new Date(),
          dueAt: task.due_date ? new Date(task.due_date) : null
        });
        
        // Create new task rating record in the normalized schema
        const { data: taskRatingData, error: insertError } = await supabase
          .from('task_ratings')
          .insert({
            task_id: taskId,
            rater_id: user.id,
            rated_user_id: student.id,
            stars_avg: starsAvg,
            xp: xp
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Create task rating skills records
        const skillEntries = Object.entries(studentRatings);
        const taskRatingSkillsData = skillEntries.map(([skillId, stars]) => ({
          rating_id: taskRatingData.id,
          skill_id: parseInt(skillId),
          stars: stars
        }));
        
        const { error: skillsInsertError } = await supabase
          .from('task_rating_skills')
          .insert(taskRatingSkillsData);
        
        if (skillsInsertError) throw skillsInsertError;
      }
      
      setMessage("Ratings submitted successfully! They will be anchored to the blockchain shortly.");
      
      // Redirect back to the task detail page after successful submission
      setTimeout(() => {
        router.push(`/e/tasks/${taskId}`);
      }, 1000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("An unknown error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {students.map((student) => (
        <Card key={student.id}>
          <CardHeader>
            <CardTitle>Rate @{student.username}</CardTitle>
            <CardDescription>
              Provide ratings for each skill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="space-y-3">
                  <div>
                    <Label htmlFor={`rating-${student.id}-${skill.id}`} className="font-medium">
                      {skill.label}
                    </Label>
                    {/* Display skill description */}
                    <p className="text-sm text-muted-foreground mt-1">
                      {skill.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {ratings[student.id]?.[skill.id] || '-'}/5
                    </span>
                    {/* Rating input field for rating (1-5) */}
                    <Input
                      id={`rating-${student.id}-${skill.id}`}
                      type="number"
                      min="1"
                      max="5"
                      value={ratings[student.id]?.[skill.id] || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                        handleRatingChange(student.id, skill.id, value);
                      }}
                      placeholder="1-5"
                      className="w-24"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Ratings"}
        </Button>
      </div>
      
      {message && (
        <div className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </div>
      )}
    </div>
  );
}