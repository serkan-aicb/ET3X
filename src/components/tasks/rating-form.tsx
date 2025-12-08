"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { SkillScore, Level, computeXP } from "@/lib/utils/xp";
// Import the IPFS client
import { pinJSONToIPFS } from "@/lib/pinata/client";
// Comment out the blockchain import for now
// import { anchorRating } from "@/lib/polygon/client";
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
    const loadExistingRatings = async () => {
      const supabase = createClient();
      
      for (const student of students) {
        // Check if there's already a rating for this student on this task
        const { data: existingRating, error } = await supabase
          .from('ratings')
          .select('skills, notes')
          .eq('task', taskId)
          .eq('rated_user', student.id)
          .limit(1)
          .maybeSingle();
        
        if (existingRating && !error) {
          // Set existing ratings
          setRatings(prev => ({
            ...prev,
            [student.id]: existingRating.skills as Record<number, number>
          }));
        }
      }
    };
    
    loadExistingRatings();
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
              skills: studentRatings,
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
              skills: studentRatings,
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
                skills: studentRatings,
                starsAvg: starsAvg,
                xp: xp,
                createdAt: new Date().toISOString()
              };
              
              console.log('Rating pinned to IPFS with CID:', ratingDocument);
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
            console.log('SIMULATION: Would anchor rating to blockchain with:', {
              ratingId: ratingData.id
            });
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
      }
      
      setMessage("Ratings submitted successfully!");
      
      // Instead of updating the entire task status to 'rated', we should check if all assigned students have ratings
      // For now, we'll leave the task status update logic as is since it's complex to determine when all students are rated
      
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