"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

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
      
      // Get educator profile for DID
      const { data: educatorProfile, error: educatorError } = await supabase
        .from('profiles')
        .select('did')
        .eq('id', user.id)
        .single();
      
      if (educatorError) throw educatorError;
      
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
                notes: notes[student.id] || "",
                createdAt: new Date().toISOString()
              };
              
              // Pin rating to IPFS
              try {
                const cid = await pinJSONToIPFS(ratingDocument);
                console.log('Rating pinned to IPFS with CID:', cid);
                
                // Update rating with CID if we got one
                if (cid) {
                  await supabase
                    .from('ratings')
                    .update({ cid: cid })
                    .eq('id', ratingData.id);
                }
                
                // Simulate blockchain anchoring
                // Instead of calling anchorRating, we'll just log the simulation
                console.log('SIMULATION: Would anchor rating to blockchain with:', {
                  cid: cid,
                  taskId: taskId,
                  studentDID: studentProfile.did,
                  educatorDID: educatorProfile.did
                });
                
                // In a real implementation, this would be:
                // const txHash = await anchorRating(
                //   cid,
                //   taskId,
                //   studentProfile.did,
                //   educatorProfile.did
                // );
                
                // For simulation, we'll use a fake transaction hash
                const txHash = "0xSIMULATED_TRANSACTION_HASH";
                
                // Update rating with simulated transaction hash
                await supabase
                  .from('ratings')
                  .update({ tx_hash: txHash })
                  .eq('id', ratingData.id);
              } catch (pinError) {
                console.warn('Warning: Failed to pin rating to IPFS:', pinError);
                // Continue with the process even if IPFS pinning fails
                
                // Simulate blockchain anchoring even if IPFS fails
                console.log('SIMULATION: Would anchor rating to blockchain without CID');
                
                // For simulation, we'll use a fake transaction hash
                const txHash = "0xSIMULATED_TRANSACTION_HASH";
                
                // Update rating with simulated transaction hash
                await supabase
                  .from('ratings')
                  .update({ tx_hash: txHash })
                  .eq('id', ratingData.id);
              }
            }
          } catch (anchorError) {
            console.error('Error anchoring rating:', anchorError);
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
      
      // Redirect back to the educator dashboard after successful submission
      setTimeout(() => {
        router.push("/e/dashboard");
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
                <div key={skill.id} className="space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <Label htmlFor={`rating-${student.id}-${skill.id}`}>
                        {skill.label}
                      </Label>
                      {/* Display skill description */}
                      <p className="text-sm text-muted-foreground mt-1">
                        {skill.description}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {ratings[student.id]?.[skill.id] || 0}/5
                    </span>
                  </div>
                  {/* Replace Slider with Input field for rating (1-5) */}
                  <Input
                    id={`rating-${student.id}-${skill.id}`}
                    type="number"
                    min="1"
                    max="5"
                    value={ratings[student.id]?.[skill.id] || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      // Validate input to ensure it's between 1-5
                      if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 5)) {
                        handleRatingChange(student.id, skill.id, value === "" ? 0 : parseInt(value));
                      }
                    }}
                    placeholder="1-5"
                    className="w-24"
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