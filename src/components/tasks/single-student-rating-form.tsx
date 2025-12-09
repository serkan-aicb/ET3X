"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { SkillScore, Level, computeXP } from "@/lib/utils/xp";
import { Tables } from '@/lib/supabase/types';

type Task = Tables<'tasks'>;

export function SingleStudentRatingForm({ 
  taskId, 
  submissionId,
  student, 
  skills,
  task,
  onSuccess
}: { 
  taskId: string; 
  submissionId: string;
  student: { id: string; username: string }; 
  skills: number[]; // Array of skill IDs
  task: Task;
  onSuccess: () => void;
}) {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  
  // Fetch skill details
  const [skillDetails, setSkillDetails] = useState<{ id: number; label: string; description: string }[]>([]);
  
  useEffect(() => {
    const fetchSkills = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('skills')
        .select('id, label, description')
        .in('id', skills);
      
      if (!error && data) {
        setSkillDetails(data);
      }
    };
    
    if (skills.length > 0) {
      fetchSkills();
    }
  }, [skills]);

  const handleRatingChange = (skillId: number, value: number) => {
    // Only allow values 1-5
    if (value >= 1 && value <= 5) {
      setRatings(prev => ({
        ...prev,
        [skillId]: value
      }));
    } else if (value === 0) {
      // Remove the rating if 0 is entered (treat as unrated)
      const newRatings = { ...ratings };
      delete newRatings[skillId];
      setRatings(newRatings);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage("");
    
    try {
      // Validate that all skills have ratings
      const missingRatings = skillDetails.filter(skill => !ratings[skill.id]);
      if (missingRatings.length > 0) {
        setMessage(`Please provide ratings for all skills: ${missingRatings.map(s => s.label).join(', ')}`);
        setSubmitting(false);
        return;
      }
      
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
      
      // Prepare skill scores for XP calculation
      const skillScores: SkillScore[] = Object.entries(ratings).map(([skillId, stars]) => ({
        skillId: parseInt(skillId),
        stars: stars as 1|2|3|4|5
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
      const skillEntries = Object.entries(ratings);
      const taskRatingSkillsData = skillEntries.map(([skillId, stars]) => ({
        rating_id: taskRatingData.id,
        skill_id: parseInt(skillId),
        stars: stars
      }));
      
      const { error: skillsInsertError } = await supabase
        .from('task_rating_skills')
        .insert(taskRatingSkillsData);
      
      if (skillsInsertError) throw skillsInsertError;
      
      setMessage("Rating submitted successfully! It will be anchored to the blockchain shortly.");
      
      // Call onSuccess callback after a short delay
      setTimeout(() => {
        onSuccess();
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
      <div className="space-y-4">
        {skillDetails.map((skill) => (
          <div key={skill.id} className="space-y-3">
            <div>
              <Label htmlFor={`rating-${skill.id}`} className="font-medium">
                {skill.label}
              </Label>
              {/* Display skill description */}
              <p className="text-sm text-muted-foreground mt-1">
                {skill.description}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {ratings[skill.id] || '-'}/5
              </span>
              {/* Rating input field for rating (1-5) */}
              <Input
                id={`rating-${skill.id}`}
                type="number"
                min="1"
                max="5"
                value={ratings[skill.id] || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                  handleRatingChange(skill.id, value);
                }}
                placeholder="1-5"
                className="w-24"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Rating"}
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