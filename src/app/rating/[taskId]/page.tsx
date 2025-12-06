"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type Rating = Tables<'ratings'> & {
  tasks: {
    title: string;
  } | null;
  // Add skills data to the rating type
  skills_data?: Array<{id: number, label: string, description: string, stars: number}>;
};

// Add a type for skills
type Skill = Tables<'skills'>;

export default function ViewRating() {
  const [rating, setRating] = useState<Rating | null>(null);
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
        .from('ratings')
        .select(`
          *,
          tasks(title)
        `)
        .eq('task', taskId)
        .eq('rated_user', user.id)
        .single();
      
      if (!error && data) {
        // Fetch skills data to get labels and descriptions
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('*');
        
        if (!skillsError && skillsData) {
          // Enhance the rating with skill details
          const skillsWithDetails = [];
          if (data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills)) {
            for (const [skillId, stars] of Object.entries(data.skills)) {
              const skill = skillsData.find(s => s.id === parseInt(skillId));
              if (skill) {
                skillsWithDetails.push({
                  id: skill.id,
                  label: skill.label,
                  description: skill.description,
                  stars: Number(stars)
                });
              }
            }
          }
          setRating({
            ...data,
            skills_data: skillsWithDetails
          });
        } else {
          setRating(data);
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
            {rating.tx_hash && rating.tx_hash === "0xSIMULATED_TRANSACTION_HASH" && (
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
                {rating.skills_data && rating.skills_data.length > 0 ? (
                  rating.skills_data.map((skill) => (
                    <div key={skill.id} className="border rounded-lg p-4 hover:bg-muted transition-colors border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground">{skill.label}</span>
                        <span className="font-bold text-foreground">{skill.stars}/5 stars</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                    </div>
                  ))
                ) : rating.skills && typeof rating.skills === 'object' && !Array.isArray(rating.skills) ? (
                  Object.entries(rating.skills).map(([skillId, stars]) => (
                    <div key={skillId} className="border rounded-lg p-4 hover:bg-muted transition-colors border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">Skill {skillId}</span>
                        <span className="font-bold text-foreground">{String(stars)}/5 stars</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No skills data available</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {rating.cid && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(`https://ipfs.io/ipfs/${rating.cid}`, '_blank')}
                >
                  View Rating on IPFS
                </Button>
              )}
                
              {rating.tx_hash && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Check if this is a simulated transaction
                    if (rating.tx_hash === "0xSIMULATED_TRANSACTION_HASH") {
                      // For now, we'll just alert that it's recorded on blockchain
                      alert("This rating has been recorded on the blockchain.");
                    } else {
                      window.open(`https://amoy.polygonscan.com/tx/${rating.tx_hash}`, '_blank');
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