"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { SkillScore, Level, computeXP } from "@/lib/utils/xp";
import { anchorRating } from "@/lib/polygon/client";
import { Tables } from '@/lib/supabase/types';

type Task = Tables<'tasks'>;

export function RatingForm({ 
  taskId, 
  students, 
  skills,
  task
}: { 
  taskId: string; 
  students: { id: string; username: string }[]; 
  skills: { id: number; label: string }[]; 
  task: Task;
}) {
  const [ratings, setRatings] = useState<Record<string, Record<number, number>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleRatingChange = (studentId: string, skillId: number, value: number) => {
    setRatings(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [skillId]: value
      }
    }));
  };

  const handleNoteChange = (studentId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage("");
    
    try {
      const supabase = createClient();
      
      // Get current user (educator)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      // Create ratings for each student
      for (const student of students) {
        const studentRatings = ratings[student.id] || {};
        
        // Prepare skill scores for XP calculation
        const skillScores: SkillScore[] = Object.entries(studentRatings).map(([skillId, stars]) => ({
          skillId: parseInt(skillId),
          stars: Math.max(1, Math.min(5, Math.round(stars))) as 1|2|3|4|5
        }));
        
        // Calculate XP using the provided formula
        const { starsAvg, xp } = computeXP({
          scores: skillScores,
          level: (task.skill_level as Level) || "Novice",
          seats: task.seats || 1,
          isRecurring: task.recurrence === "recurring",
          submittedAt: new Date(),
          dueAt: task.due_date ? new Date(task.due_date) : null
        });
        
        // Create rating record
        const { data: ratingData, error: insertError } = await supabase
          .from('ratings')
          .insert({
            task: taskId,
            rater: user.id,
            rated_user: student.id,
            skills: studentRatings,
            stars_avg: starsAvg,
            xp: xp
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Anchor rating to blockchain
        if (ratingData) {
          try {
            // Get student profile to get DID
            const { data: studentProfile, error: profileError } = await supabase
              .from('profiles')
              .select('did')
              .eq('id', student.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching student profile:', profileError);
            } else if (studentProfile?.did) {
              // Anchor to blockchain
              const txHash = await anchorRating(
                ratingData.id, // Using rating ID as CID for now
                taskId,
                studentProfile.did
              );
              
              // Update rating with transaction hash
              await supabase
                .from('ratings')
                .update({ tx_hash: txHash })
                .eq('id', ratingData.id);
            }
          } catch (anchorError) {
            console.error('Error anchoring rating to blockchain:', anchorError);
            // Don't throw here as we still want to complete the rating process
          }
        }
      }
      
      setMessage("Ratings submitted successfully!");
      
      // Update task status to 'rated'
      await supabase
        .from('tasks')
        .update({ status: 'rated' })
        .eq('id', taskId);
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
                <div key={skill.id} className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor={`rating-${student.id}-${skill.id}`}>
                      {skill.label}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {ratings[student.id]?.[skill.id] || 0}/5
                    </span>
                  </div>
                  <Slider
                    id={`rating-${student.id}-${skill.id}`}
                    min={1}
                    max={5}
                    step={1}
                    value={[ratings[student.id]?.[skill.id] || 0]}
                    onValueChange={(value: number[]) => handleRatingChange(student.id, skill.id, value[0])}
                  />
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`note-${student.id}`}>Notes (Optional)</Label>
              <Textarea
                id={`note-${student.id}`}
                value={notes[student.id] || ""}
                onChange={(e) => handleNoteChange(student.id, e.target.value)}
                placeholder="Add any additional notes about this student's work"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-end">
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