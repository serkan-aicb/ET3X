"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

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
    
    // Validate matriculation number format
    if (matriculationNumber) {
      const trimmedNumber = matriculationNumber.trim();
      
      if (trimmedNumber.length > 0 && (trimmedNumber.length < 5 || trimmedNumber.length > 20)) {
        alert("Matriculation number must be between 5 and 20 characters.");
        return;
      }
      
      if (trimmedNumber.length > 0 && !/^[A-Za-z0-9]+$/.test(trimmedNumber)) {
        alert("Matriculation number can only contain letters and numbers.");
        return;
      }
    }
    
    setSaving(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ matriculation_number: matriculationNumber || null })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      // Update local state
      setProfile({ ...profile, matriculation_number: matriculationNumber || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving matriculation number:', error);
      alert('Failed to save matriculation number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/s/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </Link>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <footer className="py-6 px-4 bg-white border-t">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/s/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">
            View your profile and completed task ratings
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-gray-800">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Username</h3>
                  <p className="font-medium">@{profile?.username}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">DID</h3>
                  <p className="font-mono text-sm break-all bg-gray-100 p-2 rounded border border-gray-200">
                    {profile?.did}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  <p className="font-medium capitalize">{profile?.role}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500">Matriculation Number</h3>
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
                    <div className="flex space-x-2 mt-2">
                      <Input
                        type="text"
                        value={matriculationNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatriculationNumber(e.target.value)}
                        placeholder="e.g., 123456 or STUD2023001"
                        className="flex-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">5-20 characters, letters and numbers only</p>
                      <Button 
                        size="sm" 
                        onClick={handleSaveMatriculationNumber}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium">
                      {profile?.matriculation_number || 'Not provided'}
                    </p>
                  )}
                </div>
                
                {/* Stats Section */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Rating</span>
                      <span className="font-medium">{averageSkillRating}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total XP</span>
                      <span className="font-medium">{ratingStats.totalXP}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {/* Aggregated Task Ratings */}
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-gray-800">Task Performance</CardTitle>
                <CardDescription className="text-gray-600">
                  Your performance across different tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aggregatedTaskRatings.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">
                    You haven{`'`}t received any ratings yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {aggregatedTaskRatings.map((taskRating) => (
                      <div key={taskRating.taskId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {taskRating.taskTitle}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {taskRating.ratingCount} rating{taskRating.ratingCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Average</p>
                            <p className="font-medium">{taskRating.avgRating}/5</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">XP</p>
                            <p className="font-medium">{taskRating.totalXP}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Last 5 Individual Skill Ratings */}
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-gray-800">Recent Skill Ratings</CardTitle>
                <CardDescription className="text-gray-600">
                  Your most recent individual skill ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skillRatings.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">
                    No skill ratings available yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {skillRatings.map((skillRating, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {getSkillName(skillRating.skillId)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {skillRating.taskTitle} • {new Date(skillRating.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Rating</p>
                            <p className="font-medium">{skillRating.skillValue}/5</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-white border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}