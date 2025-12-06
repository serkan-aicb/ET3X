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
type Rating = Tables<'ratings'> & {
  tasks: {
    title: string;
  } | null;
};
type Skill = Tables<'skills'>;
type AggregatedTaskRating = {
  taskId: string;
  taskTitle: string;
  avgRating: number;
  totalXP: number;
  ratingCount: number;
};
type IndividualSkillRating = {
  skillId: number;
  skillValue: number;
  taskId: string;
  taskTitle: string;
  createdAt: string;
};

export default function StudentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matriculationNumber, setMatriculationNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [aggregatedTaskRatings, setAggregatedTaskRatings] = useState<AggregatedTaskRating[]>([]);
  const [skillRatings, setSkillRatings] = useState<IndividualSkillRating[]>([]);
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
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          *,
          tasks(title)
        `)
        .eq('rated_user', user.id)
        .order('created_at', { ascending: false });
      
      if (!ratingsError && ratingsData) {
        // Group ratings by task_id and calculate averages
        const taskRatingsMap = new Map<string, {
          taskId: string;
          taskTitle: string;
          ratings: number[];
          totalXP: number;
        }>();
        
        ratingsData.forEach(rating => {
          const taskId = rating.task;
          if (!taskRatingsMap.has(taskId)) {
            taskRatingsMap.set(taskId, {
              taskId,
              taskTitle: rating.tasks?.title || "Unknown Task",
              ratings: [],
              totalXP: 0
            });
          }
          
          const taskEntry = taskRatingsMap.get(taskId)!;
          taskEntry.ratings.push(rating.stars_avg);
          taskEntry.totalXP += rating.xp;
        });
        
        // Calculate averages and create final array
        const aggregatedRatings: AggregatedTaskRating[] = Array.from(taskRatingsMap.values()).map(task => {
          const avgRating = task.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / task.ratings.length;
          return {
            taskId: task.taskId,
            taskTitle: task.taskTitle,
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalXP: task.totalXP,
            ratingCount: task.ratings.length
          };
        });
        
        setAggregatedTaskRatings(aggregatedRatings.slice(0, 5)); // Show only last 5
      }
      
      // Get individual skill ratings for all ratings (to calculate average and show last 5)
      const { data: allRatings, error: allRatingsError } = await supabase
        .from('ratings')
        .select(`
          *,
          tasks(title)
        `)
        .eq('rated_user', user.id)
        .order('created_at', { ascending: false });
      
      if (!allRatingsError && allRatings) {
        // Extract individual skill ratings
        const individualSkillRatings: IndividualSkillRating[] = [];
        allRatings.forEach(rating => {
          if (rating.skills) {
            Object.entries(rating.skills).forEach(([skillId, skillValue]) => {
              individualSkillRatings.push({
                skillId: parseInt(skillId),
                skillValue: typeof skillValue === 'number' ? skillValue : 0,
                taskId: rating.task,
                taskTitle: rating.tasks?.title || "Unknown Task",
                createdAt: rating.created_at
              });
            });
          }
        });
        
        // Sort by date and take last 5
        individualSkillRatings.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSkillRatings(individualSkillRatings.slice(0, 5));
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [router]);

  // Calculate average skill rating and total XP
  const ratingStats = aggregatedTaskRatings.reduce((acc, taskRating) => {
    acc.totalRatings += taskRating.ratingCount;
    acc.sumOfRatings += taskRating.avgRating * taskRating.ratingCount;
    acc.totalXP += taskRating.totalXP;
    return acc;
  }, { totalRatings: 0, sumOfRatings: 0, totalXP: 0 });

  const averageSkillRating = ratingStats.totalRatings > 0 
    ? (ratingStats.sumOfRatings / ratingStats.totalRatings).toFixed(1) 
    : "0.0";

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
                      {profile?.matriculation_number || 'Not provided'}
                    </p>
                  )}
                </div>
                
                {/* Stats Section */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs uppercase text-muted-foreground mb-2">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Rating</span>
                      <span className="font-medium text-foreground">{averageSkillRating}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total XP</span>
                      <span className="font-medium text-foreground">{ratingStats.totalXP}</span>
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
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Average</p>
                          <p className="font-medium text-foreground">{taskRating.avgRating}/5</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">XP</p>
                          <p className="font-medium text-foreground">{taskRating.totalXP}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SharedCard>
            
            {/* Last 5 Individual Skill Ratings */}
            <SharedCard title="Recent Skill Ratings" description="Your most recent individual skill ratings">
              {skillRatings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No skill ratings available yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {skillRatings.map((skillRating, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {getSkillName(skillRating.skillId)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {skillRating.taskTitle} • {new Date(skillRating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <p className="font-medium text-foreground">{skillRating.skillValue}/5</p>
                        </div>
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