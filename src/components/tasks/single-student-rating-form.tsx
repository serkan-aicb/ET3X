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
      
      // Check if a rating already exists for this student on this task
      const { data: existingRating, error: checkError } = await supabase
        .from('ratings')
        .select('id')
        .eq('task', taskId)
        .eq('rated_user', student.id)
        .eq('rater', user.id)
        .limit(1)
        .maybeSingle();
      
      let ratingData;
      if (existingRating && !checkError) {
        // Update existing rating
        const { data, error: updateError } = await supabase
          .from('ratings')
          .update({
            skills: ratings,
            stars_avg: starsAvg,
            xp: xp,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        ratingData = data;
      } else {
        // Create new rating record
        const { data, error: insertError } = await supabase
          .from('ratings')
          .insert({
            task: taskId,
            rater: user.id,
            rated_user: student.id,
            skills: ratings,
            stars_avg: starsAvg,
            xp: xp
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        ratingData = data;
      }
      
      // Handle IPFS and blockchain anchoring
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
            // Prepare rating data for IPFS
            const ratingDocument = {
              ratingId: ratingData.id,
              taskId: taskId,
              taskTitle: task.title,
              student: {
                id: student.id,
                username: student.username,
                did: studentProfile.did
              },
              educator: {
                id: user.id,
                did: educatorProfile.did
              },
              skills: ratings,
              starsAvg: starsAvg,
              xp: xp,
              createdAt: new Date().toISOString()
            };
            
            console.log('Would pin rating to IPFS:', ratingDocument);
            // In a real implementation, you would pin to IPFS here
            // const cid = await pinJSONToIPFS(ratingDocument);
            
            // Update rating with CID if we got one
            // if (cid) {
            //   await supabase
            //     .from('ratings')
            //     .update({ ipfs_cid: cid })
            //     .eq('id', ratingData.id);
            // }
          }
        } catch (pinError) {
          console.warn('Warning: Failed to pin rating to IPFS:', pinError);
          // Don't throw here as we still want to complete the rating process
        }
        
        try {
          // Simulate blockchain anchoring
          console.log('SIMULATION: Would anchor rating to blockchain');
          // In a real implementation, you would anchor to blockchain here
          // const txHash = await anchorRating(ratingData.id, cid || '');
          
          // Update rating with simulated transaction hash
          // await supabase
          //   .from('ratings')
          //   .update({ blockchain_tx: txHash })
          //   .eq('id', ratingData.id);
        } catch (anchorError) {
          console.error('Error anchoring rating:', anchorError);
          // Don't throw here as we still want to complete the rating process
        }
      }
      
      setMessage("Rating submitted successfully!");
      
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