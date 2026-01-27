"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";


type Profile = Tables<'profiles'> & {
  matriculation_number?: string | null;
};
// Removed old Rating type since we're using the new schema directly
type Skill = Tables<'skills'>;
type AggregatedTaskRating = {
  taskId: string;
  taskTitle: string;
  avgRating: number;
  ratingCount: number;
  taskDifficulty: "Novice" | "Skilled" | "Expert" | "Master" | null;
};

// Type for aggregated skill ratings
type AggregatedSkillRating = {
  skillId: number;
  weightedAverage: number;
  ratingCount: number;
};

// Type for task ratings from the new schema
type TaskRating = {
  id: string;
  task_id: string;
  stars_avg: number;
  xp: number;
  created_at: string;
  tasks: {
    title: string;
  } | null;
};

// Type for skill ratings from the new schema
type SkillRating = {
  id: string;
  skill_id: number;
  stars: number;
  tx_hash: string | null;
  on_chain: boolean;
  created_at: string;
  task_ratings: {
    task_id: string;
    created_at: string;
    on_chain: boolean;
    tx_hash: string | null;
    tasks: {
      title: string;
    } | null;
  } | null;
};

export default function StudentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matriculationNumber, setMatriculationNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [aggregatedTaskRatings, setAggregatedTaskRatings] = useState<AggregatedTaskRating[]>([]);
  const [skillRatings, setSkillRatings] = useState<AggregatedSkillRating[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/stud");
        return;
      }
      
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push("/stud");
        return;
      }
      
      setProfile(profileData);
      setMatriculationNumber(profileData.matriculation_number || '');
      
      // Get skills data
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*');
      
      if (!skillsError && skillsData) {
        setSkills(skillsData);
      }
      
      // Get aggregated task ratings (grouped by task_id)
      // We need to join task_ratings with tasks to get the task title and skill_level
      const { data: taskRatingsData, error: taskRatingsError } = await supabase
        .from('task_ratings')
        .select(`
          *,
          tasks!task_ratings_task_id_fkey(title, skill_level)
        `)
        .eq('rated_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!taskRatingsError && taskRatingsData) {
        // Group ratings by task_id and calculate averages
        const taskRatingsMap = new Map<string, {
          taskId: string;
          taskTitle: string;
          ratings: number[];
          taskDifficulty: "Novice" | "Skilled" | "Expert" | "Master" | null;
        }>();
        
        taskRatingsData.forEach(rating => {
          const taskId = rating.task_id;
          
          if (!taskRatingsMap.has(taskId)) {
            taskRatingsMap.set(taskId, {
              taskId,
              taskTitle: rating.tasks?.title || "Unknown Task",
              ratings: [],
              taskDifficulty: (rating.tasks?.skill_level as "Novice" | "Skilled" | "Expert" | "Master" | null) ?? null
            });
          }
          
          const taskEntry = taskRatingsMap.get(taskId)!;
          taskEntry.ratings.push(rating.stars_avg);
          
          // Set task difficulty from the first rating's task (assuming all ratings for a task have same difficulty)
          const skillLevel = (rating.tasks?.skill_level as "Novice" | "Skilled" | "Expert" | "Master" | null) ?? null;
          if (!taskEntry.taskDifficulty && skillLevel) {
            taskEntry.taskDifficulty = skillLevel;
          }
        });
        
        // Calculate averages and create final array
        const aggregatedRatings: AggregatedTaskRating[] = Array.from(taskRatingsMap.values()).map(task => {
          const avgRating = task.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / task.ratings.length;
          return {
            taskId: task.taskId,
            taskTitle: task.taskTitle,
            avgRating: parseFloat(avgRating.toFixed(1)),
            ratingCount: task.ratings.length,
            taskDifficulty: task.taskDifficulty
          };
        });
        
        setAggregatedTaskRatings(aggregatedRatings.slice(0, 5)); // Show only last 5
      }
      
      // Get individual skill ratings for all ratings (to calculate average and show all skills)
      // We need to join with the new task_rating_skills table to get on-chain status and task difficulty
      const { data: allSkillRatings, error: allSkillsError } = await supabase
        .from('task_rating_skills')
        .select(`
          *,
          task_ratings!inner(
            task_id,
            rated_user_id,
            created_at,
            tasks!task_ratings_task_id_fkey(title, skill_level)
          )
        `)
        .eq('task_ratings.rated_user_id', user.id);

      if (allSkillsError) {
        console.error('Skill ratings query error:', allSkillsError);
      }

      if (!allSkillsError && allSkillRatings) {
        // Extract individual skill ratings with task difficulty
        const rawSkillRatings = allSkillRatings.map(rating => ({
          skillId: rating.skill_id,
          skillValue: rating.stars,
          taskId: rating.task_ratings?.task_id,
          taskTitle: rating.task_ratings?.tasks?.title || "Unknown Task",
          taskDifficulty: (rating.task_ratings?.tasks?.skill_level as "Novice" | "Skilled" | "Expert" | "Master" | null) || null,
          onChain: rating.on_chain,
          txHash: rating.tx_hash
        }));
        
        // Group by skill to calculate weighted averages
        const skillRatingsMap = new Map<number, {
          skillId: number;
          ratings: { value: number; difficulty: "Novice" | "Skilled" | "Expert" | "Master" | null }[];
        }>();
        
        rawSkillRatings.forEach(rating => {
          if (!skillRatingsMap.has(rating.skillId)) {
            skillRatingsMap.set(rating.skillId, {
              skillId: rating.skillId,
              ratings: []
            });
          }
          
          const skillEntry = skillRatingsMap.get(rating.skillId)!;
          skillEntry.ratings.push({
            value: rating.skillValue,
            difficulty: rating.taskDifficulty
          });
        });
        
        // Calculate weighted averages for each skill
        const aggregatedSkillRatings: { skillId: number; weightedAverage: number; ratingCount: number }[] = 
          Array.from(skillRatingsMap.values()).map(skill => {
            // Difficulty weights mapping
            const difficultyWeights: Record<string, number> = {
              "Novice": 0.5,
              "Skilled": 1.25,
              "Expert": 2.0,
              "Master": 3.0
            };
            
            let weightedSum = 0;
            let totalWeight = 0;
            
            skill.ratings.forEach(rating => {
              const weight = rating.difficulty ? difficultyWeights[rating.difficulty] : 1;
              weightedSum += rating.value * weight;
              totalWeight += weight;
            });
            
            const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
            
            return {
              skillId: skill.skillId,
              weightedAverage: parseFloat(weightedAverage.toFixed(2)),
              ratingCount: skill.ratings.length
            };
          });
        
        setSkillRatings(aggregatedSkillRatings);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [router]);

  // Calculate weighted average rating across all skills
  const calculateOverallWeightedAverage = (): string => {
    if (skillRatings.length === 0) return "—";
    
    const totalWeightedSum = skillRatings.reduce((sum, skill) => sum + skill.weightedAverage, 0);
    const average = totalWeightedSum / skillRatings.length;
    return average.toFixed(2);
  };

  const overallWeightedAverage = calculateOverallWeightedAverage();

  // Get skill name by ID
  const getSkillName = (skillId: number) => {
    const skill = skills.find(s => s.id === skillId);
    return skill ? skill.label : `Skill #${skillId}`;
  };

  const handleSaveMatriculationNumber = async () => {
    if (!profile) return;
    
    // Validate student number format
    if (matriculationNumber) {
      const trimmedNumber = matriculationNumber.trim();
      
      if (trimmedNumber.length > 0 && (trimmedNumber.length < 5 || trimmedNumber.length > 20)) {
        alert("Student number must be between 5 and 20 characters.");
        return;
      }
      
      // Check if it contains only letters and numbers
      if (!/^[a-zA-Z0-9]+$/.test(trimmedNumber)) {
        alert("Student number can only contain letters and numbers.");
        return;
      }
    }
    
    setSaving(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          matriculation_number: matriculationNumber || null
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      // Update local state
      setProfile({ ...profile, matriculation_number: matriculationNumber || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving student number:', error);
      alert('Failed to save student number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout userRole="student">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <SharedCard>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-32 w-full" />
              </SharedCard>
            </div>
            
            <div className="lg:col-span-2">
              <SharedCard>
                <Skeleton className="h-8 w-48" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg border-border">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              </SharedCard>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">
            View your profile and completed task ratings
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SharedCard title="Profile Information">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs uppercase text-muted-foreground">Username</h3>
                  <p className="font-medium text-foreground">@{profile?.username}</p>
                </div>
                
                <div>
                  <h3 className="text-xs uppercase text-muted-foreground">DID</h3>
                  <p className="font-mono text-sm break-all bg-muted p-2 rounded border border-border">
                    {profile?.did}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xs uppercase text-muted-foreground">Role</h3>
                  <p className="font-medium text-foreground capitalize">{profile?.role}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase text-muted-foreground">Student Number</h3>
                    {isEditing ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <Input
                        type="text"
                        value={matriculationNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatriculationNumber(e.target.value)}
                        placeholder="e.g., 123456 or STUD2023001"
                      />
                      <p className="text-sm text-muted-foreground">5-20 characters, letters and numbers only</p>
                      <Button 
                        size="sm" 
                        onClick={handleSaveMatriculationNumber}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium text-foreground">
                      {profile?.matriculation_number || 'Not available'}
                    </p>
                  )}
                </div>

                {/* Stats Section */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs uppercase text-muted-foreground mb-2">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Rating</span>
                      <span className="font-medium text-foreground">{overallWeightedAverage}/5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </SharedCard>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {/* Aggregated Task Ratings */}
            <SharedCard title="Task Performance" description="Your performance across different tasks">
              {aggregatedTaskRatings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  You haven{'t'} received any ratings yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {aggregatedTaskRatings.map((taskRating) => (
                    <div key={taskRating.taskId} className="flex items-center justify-between p-4 border rounded-lg border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {taskRating.taskTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {taskRating.ratingCount} rating{taskRating.ratingCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Average</p>
                          <p className="font-medium text-foreground">{taskRating.avgRating}/5</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Level</p>
                          <p className="font-medium text-foreground">
                            {taskRating.taskDifficulty || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SharedCard>
            
            {/* Full Skill Ratings Section */}
            <SharedCard title="Skill Ratings" description="Your weighted average ratings across all skills">
              {skillRatings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No skill ratings available yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {skillRatings.map((skill) => (
                    <div key={skill.skillId} className="flex items-center justify-between p-4 border rounded-lg border-border">
                      <div className="space-y-1">
                        <h4 className="font-medium">{getSkillName(skill.skillId)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {skill.ratingCount} rating{skill.ratingCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">{skill.weightedAverage}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SharedCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}