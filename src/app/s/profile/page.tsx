"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile, useSkills, useSkillRatings, useTaskRatings } from '@/hooks';
import {
  ProfileStudioLayout,
  ProfileIdentityCard,
  ProfileStatsCard,
  ShareProfileCard,
  TopSkillsCard,
  FeaturedProofsCard,
  VaultCard
} from '@/components/profile-studio';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function StudentProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile(userId);
  const { skillsMap, loading: skillsLoading } = useSkills();
  const { topSkills, loading: skillsRatingsLoading } = useSkillRatings(userId, skillsMap);
  const { proofs, trustMetrics, loading: proofsLoading } = useTaskRatings(userId, skillsMap);

  const isLoading = profileLoading || skillsLoading || skillsRatingsLoading || proofsLoading || !isAuthenticated;

  const handlePreview = () => {
    // Navigate to public profile page
    if (profile?.username) {
      window.open(`/p/${profile.username}`, '_blank');
    } else {
      toast.error('Profile not ready for preview');
    }
  };

  const handleSave = async (profileData: { 
    fullName?: string;
    headline?: string;
    institution?: string;
    location?: string;
    classYear?: string;
    avatarUrl?: string;
  }) => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      const updates: Record<string, string | null> = {};
      if (profileData.fullName !== undefined) updates.full_name = profileData.fullName;
      if (profileData.headline !== undefined) updates.headline = profileData.headline;
      if (profileData.institution !== undefined) updates.institution = profileData.institution;
      if (profileData.location !== undefined) updates.location = profileData.location;
      if (profileData.classYear !== undefined) updates.class_year = profileData.classYear;
      if (profileData.avatarUrl !== undefined) updates.avatar_url = profileData.avatarUrl;
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      await refetchProfile();
      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenVault = () => {
    router.push('/s/vault');
  };

  // Loading state
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#000000] flex">
        <div className="hidden lg:block w-64 h-screen bg-[#0a0a0a] border-r border-[#1f1f1f]" />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-40 w-full bg-[#111111]" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-80 w-full bg-[#111111]" />
                <Skeleton className="h-80 w-full bg-[#111111]" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48 w-full bg-[#111111]" />
                <Skeleton className="h-64 w-full bg-[#111111]" />
                <Skeleton className="h-48 w-full bg-[#111111]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topSkillNames = topSkills.slice(0, 5).map(s => s.name);

  return (
    <ProfileStudioLayout
      userName={profile.username}
      userDid={profile.did}
      onPreview={handlePreview}
      onSave={() => {}}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Top Section: Identity + Stats + Share */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Identity Card - Takes 7 columns */}
          <div className="xl:col-span-7">
            <ProfileIdentityCard
              userId={userId!}
              userName={profile.username}
              did={profile.did}
              avatarUrl={profile.avatar_url || undefined}
              headline={profile.headline || undefined}
              institution={profile.institution || undefined}
              location={profile.location || undefined}
              classYear={profile.class_year || undefined}
              topSkills={topSkillNames}
              isVerified={trustMetrics.verified}
              onProfileUpdate={handleSave}
            />
          </div>

          {/* Right Column - Stats + Share + Vault */}
          <div className="xl:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ProfileStatsCard
                evaluations={trustMetrics.total_evaluations}
                skills={topSkills.length}
                proofs={trustMetrics.total_proofs}
                isVerified={trustMetrics.verified}
                isPublished={trustMetrics.total_proofs > 0}
              />
              <ShareProfileCard userName={profile.username} />
            </div>
            <VaultCard onOpenVault={handleOpenVault} />
          </div>
        </div>

        {/* Bottom Section: Skills + Proofs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSkillsCard 
            skills={topSkills} 
            loading={skillsRatingsLoading}
            totalSkills={topSkills.length}
          />
          <FeaturedProofsCard 
            proofs={proofs} 
            loading={proofsLoading}
            totalProofs={trustMetrics.total_proofs}
          />
        </div>
      </div>
    </ProfileStudioLayout>
  );
}
