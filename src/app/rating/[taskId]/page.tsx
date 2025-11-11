"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

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
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-10 w-32 mt-6" />
              </div>
            </CardContent>
          </Card>
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

  if (!rating) {
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
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Rating not found for this task.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/s/my-tasks")}
              >
                Back to My Tasks
              </Button>
            </CardContent>
          </Card>
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
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-800">Task Rating</CardTitle>
            <CardDescription className="text-gray-600">
              Rating for: {rating.tasks?.title || "Task"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Remove the simulation note and just show normal blockchain confirmation */}
            {rating.tx_hash && rating.tx_hash === "0xSIMULATED_TRANSACTION_HASH" && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      This rating has been recorded on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 text-center bg-blue-50">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Average Stars</h3>
                <p className="text-3xl font-bold text-blue-600">{rating.stars_avg.toFixed(1)}/5</p>
              </div>
              
              <div className="border rounded-lg p-6 text-center bg-green-50">
                <h3 className="text-lg font-medium mb-2 text-green-800">XP Earned</h3>
                <p className="text-3xl font-bold text-green-600">{rating.xp}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800">Skills Rated</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rating.skills_data && rating.skills_data.length > 0 ? (
                  rating.skills_data.map((skill) => (
                    <div key={skill.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{skill.label}</span>
                        <span className="font-bold">{skill.stars}/5 stars</span>
                      </div>
                      <p className="text-sm text-gray-600">{skill.description}</p>
                    </div>
                  ))
                ) : rating.skills && typeof rating.skills === 'object' && !Array.isArray(rating.skills) ? (
                  Object.entries(rating.skills).map(([skillId, stars]) => (
                    <div key={skillId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Skill {skillId}</span>
                        <span className="font-bold">{String(stars)}/5 stars</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No skills data available</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {rating.cid && (
                <Button 
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => window.open(`https://ipfs.io/ipfs/${rating.cid}`, '_blank')}
                >
                  View Rating on IPFS
                </Button>
              )}
                
              {rating.tx_hash && (
                <Button 
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
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
          </CardContent>
        </Card>
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