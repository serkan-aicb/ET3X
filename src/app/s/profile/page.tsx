"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile, useSkills, useSkillRatings, useTaskRatings } from '@/hooks';
import {
  ProfileStudioLayout,
  ProfileHeader,
  TrustMetricsCard,
  ShareCard,
  TopSkillsCard,
  FeaturedProofsCard,
  VaultCard,
  PublicProfilePreview,
  MobilePreview
} from '@/components/profile-studio';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/stud');
        return;
      }
      
      setUserId(user.id);
      setIsAuthenticated(true);
    };
    
    checkAuth();
  }, [router]);

  // Fetch data using hooks
  const { profile, loading: profileLoading } = useProfile(userId);
  const { skillsMap, loading: skillsLoading } = useSkills();
  const { topSkills, loading: skillsRatingsLoading } = useSkillRatings(userId, skillsMap);
  const { proofs, trustMetrics, loading: proofsLoading } = useTaskRatings(userId, skillsMap);

  const isLoading = profileLoading || skillsLoading || skillsRatingsLoading || proofsLoading || !isAuthenticated;

  const handlePreview = () => {
    // TODO: Open public profile in new tab
    console.log('Preview public profile');
  };

  const handleSave = () => {
    // TODO: Save profile changes
    console.log('Save changes');
  };

  // Loading state
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topSkillNames = topSkills.slice(0, 4).map(s => s.name);

  return (
    <ProfileStudioLayout
      userName={profile.username}
      userDid={profile.did}
      onPreview={handlePreview}
      onSave={handleSave}
    >
      <div className="space-y-6">
        {/* Identity Section */}
        <ProfileHeader
          userName={profile.username}
          did={profile.did}
          topSkills={topSkillNames}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Skills & Proofs */}
          <div className="lg:col-span-2 space-y-6">
            <TopSkillsCard 
              skills={topSkills} 
              loading={skillsRatingsLoading} 
            />
            <FeaturedProofsCard 
              proofs={proofs} 
              loading={proofsLoading} 
            />
          </div>

          {/* Right Column - Metrics & Vault */}
          <div className="space-y-6">
            <TrustMetricsCard metrics={trustMetrics} />
            <ShareCard userName={profile.username} />
            <VaultCard />
          </div>
        </div>

        {/* Preview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PublicProfilePreview
            userName={profile.username}
            did={profile.did}
            topSkills={topSkills}
            proofs={proofs}
            metrics={trustMetrics}
          />
          <MobilePreview
            userName={profile.username}
            topSkills={topSkills}
            proofs={proofs}
            metrics={trustMetrics}
          />
        </div>
      </div>
    </ProfileStudioLayout>
  );
}
