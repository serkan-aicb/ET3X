"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

// Define custom types for the new normalized schema
type TaskRating = {
  id: string;
  task_id: string;
  rater_id: string;
  rated_user_id: string;
  stars_avg: number;
  xp: number;
  rating_session_hash: string | null;
  task_id_hash: string | null;
  subject_id_hash: string | null;
  on_chain: boolean;
  created_at: string;
  tasks: {
    title: string;
  } | null;
  task_rating_skills: Array<{
    skill_id: number;
    stars: number;
    tx_hash: string | null;
    on_chain: boolean;
    label: string;
    description: string;
  }>;
};

// Add a type for skills
type Skill = Tables<'skills'>;

export default function ViewRating() {
  const [rating, setRating] = useState<TaskRating | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchRating = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/stud");
        return;
      }
      
      // Get rating for this task and user along with skills data
      const { data, error } = await supabase
        .from('task_ratings')
        .select(`
          *,
          tasks(title)
        `)
        .eq('task_id', taskId)
        .eq('rated_user_id', user.id)
        .single();
      
      if (!error && data) {
        // Fetch task rating skills with skill details
        const { data: taskRatingSkills, error: skillsError } = await supabase
          .from('task_rating_skills')
          .select(`
            *,
            skills(label, description)
          `)
          .eq('rating_id', data.id);
        
        if (!skillsError && taskRatingSkills) {
          // Enhance the rating with skill details
          const skillsWithDetails = taskRatingSkills.map(ratingSkill => ({
            ...ratingSkill,
            label: ratingSkill.skills?.label || `Skill ${ratingSkill.skill_id}`,
            description: ratingSkill.skills?.description || ''
          }));
          
          setRating({
            ...data,
            task_rating_skills: skillsWithDetails
          });
        } else {
          setRating({
            ...data,
            task_rating_skills: []
          });
        }
      }
      
      setLoading(false);
    };
    
    if (taskId) {
      fetchRating();
    }
  }, [taskId, router]);

  if (loading) {
    return (
      <AppLayout userRole="student">
        <div className="space-y-8">
          <SharedCard>
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="space-y-4 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-10 w-32 mt-6" />
              </div>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (!rating) {
    return (
      <AppLayout userRole="student">
        <SharedCard>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Rating not found for this task.</p>
            <Button 
              className="mt-4"
              onClick={() => router.push("/s/my-tasks")}
            >
              Back to My Tasks
            </Button>
          </div>
        </SharedCard>
      </AppLayout>
    );
  }

  // Check if all skills are on-chain
  const allSkillsOnChain = rating.task_rating_skills.every(skill => skill.on_chain);
  const anySkillsOnChain = rating.task_rating_skills.some(skill => skill.on_chain);

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <SharedCard>
          <div>
            <h2 className="text-2xl font-semibold">Task Rating</h2>
            <p className="text-xs uppercase text-muted-foreground">
              Rating for: {rating.tasks?.title || "Task"}
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Blockchain confirmation */}
            {allSkillsOnChain && (
              <div className="bg-green-900/30 border-l-4 border-green-800/50 p-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-400">
                      This rating has been recorded on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!allSkillsOnChain && anySkillsOnChain && (
              <div className="bg-yellow-900/30 border-l-4 border-yellow-800/50 p-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-400">
                      Some skills are being recorded on the blockchain. This may take a few minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 text-center bg-card border-border">
                <h3 className="text-lg font-medium mb-2 text-foreground">Average Stars</h3>
                <p className="text-3xl font-bold text-primary">{rating.stars_avg.toFixed(1)}/5</p>
              </div>
              
              <div className="border rounded-lg p-6 text-center bg-card border-border">
                <h3 className="text-lg font-medium mb-2 text-foreground">XP Earned</h3>
                <p className="text-3xl font-bold text-primary">{rating.xp}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-foreground">Skills Rated</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rating.task_rating_skills && rating.task_rating_skills.length > 0 ? (
                  rating.task_rating_skills.map((skill) => (
                    <div key={skill.skill_id} className="border rounded-lg p-4 hover:bg-muted transition-colors border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground">{skill.label}</span>
                        <span className="font-bold text-foreground">{skill.stars}/5 stars</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                      {skill.on_chain ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                          On-chain
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                          Processing
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No skills data available</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {anySkillsOnChain && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Find the first skill with a transaction hash
                    const skillWithTx = rating.task_rating_skills.find(skill => skill.tx_hash);
                    if (skillWithTx?.tx_hash) {
                      window.open(`https://polygonscan.com/tx/${skillWithTx.tx_hash}`, '_blank');
                    }
                  }}
                >
                  View Blockchain Transaction
                </Button>
              )}
            </div>
          </div>
        </SharedCard>
      </div>
    </AppLayout>
  );
}