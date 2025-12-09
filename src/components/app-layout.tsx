"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type ProfileData = {
  username: string;
  did: string;
  matriculation_number?: string | null;
};

type UserWithProfile = {
  id: string;
  email: string | undefined;
  username: string;
  did: string;
  matriculation_number?: string | null;
};
export function AppLayout({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole: "student" | "educator" | "admin";
}) {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/");
        return;
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, did, matriculation_number')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push("/");
        return;
      }
      
      // NOTE: Removed forced redirect to /s/collect-matriculation for students
      // Student number is now optional and users can proceed without it
      
      setUser({
        id: user.id,
        email: user.email,
        username: profile.username,
        did: profile.did,
        ...(userRole === "student" ? { matriculation_number: profile.matriculation_number } : {})
      });
    };
    
    fetchUserData();
  }, [router, userRole]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const getDashboardLink = () => {
    switch (userRole) {
      case "student": return "/s/dashboard";
      case "educator": return "/e/dashboard";
      case "admin": return "/admin/overview";
      default: return "/";
    }
  };

  const getMyTasksLink = () => {
    switch (userRole) {
      case "student": return "/s/my-tasks";
      case "educator": return "/e/my-tasks";
      default: return "#";
    }
  };

  const getProfileLink = () => {
    switch (userRole) {
      case "student": return "/s/profile";
      case "educator": return "/e/profile";
      default: return "#";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Unified Header */}
      <header className="bg-background border-b backdrop-blur py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href={getDashboardLink()} className="flex items-center space-x-2">
            <Image 
              src="/pics/LOGO-blank.png" 
              alt="Talent3X Logo" 
              width={120} 
              height={120} 
              className="h-10 w-auto"
            />
          </Link>
          
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-muted-foreground hidden sm:block">
                Welcome, <span className="font-semibold">@{user.username}</span>
              </span>
            )}
            
            <div className="flex space-x-2">
              {userRole !== "admin" && (
                <Button variant="outline" onClick={() => router.push(getMyTasksLink())}>
                  My Tasks
                </Button>
              )}
              
              <Button variant="outline" onClick={() => router.push(getProfileLink())}>
                Profile
              </Button>
              
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Unified Wrapper */}
      <main className="mx-auto max-w-6xl px-6 py-10 flex-grow">
        {children}
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}