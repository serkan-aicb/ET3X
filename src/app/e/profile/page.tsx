"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { toast } from "sonner";

type Profile = Tables<'profiles'>;

export default function EducatorProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [realName, setRealName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      
      setUserEmail(user.email);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push("/auth");
        return;
      }
      
      setProfile(profileData);
      setRealName(profileData.real_name || "");
      setLoading(false);
    };
    
    fetchData();
  }, [router]);

  const handleSaveRealName = async () => {
    if (!profile) return;
    setSaving(true);
    
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ real_name: realName })
      .eq('id', profile.id);

    if (error) {
      toast.error("Failed to save name: " + error.message);
    } else {
      setProfile({ ...profile, real_name: realName });
      toast.success("Name saved successfully");
    }
    setSaving(false);
  };

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
            View and update your profile information
          </p>
        </div>
        
        <SharedCard title="Profile Information" description="Your account details">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs uppercase text-muted-foreground">Username</h3>
              <p className="font-medium text-foreground">@{profile?.username}</p>
            </div>

            <div>
              <h3 className="text-xs uppercase text-muted-foreground">Email</h3>
              <p className="font-medium text-foreground">{userEmail}</p>
            </div>
            
            <div>
              <Label htmlFor="realName" className="text-xs uppercase text-muted-foreground">Real Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="realName"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="Enter your real name"
                />
                <Button onClick={handleSaveRealName} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
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