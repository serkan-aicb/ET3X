"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type Profile = Tables<'profiles'>;

export default function EducatorProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/edu");
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
        router.push("/edu");
        return;
      }
      
      setProfile(profileData);
      setLoading(false);
    };
    
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <SharedCard>
            <Skeleton className="h-8 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">
            View your profile information
          </p>
        </div>
        
        <SharedCard title="Profile Information" description="Your account details and DID">
          <div className="space-y-6">
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
          </div>
        </SharedCard>
      </div>
    </AppLayout>
  );
}