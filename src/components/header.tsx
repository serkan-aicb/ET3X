"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export function Header({ 
  title = "Talent3X",
  userRole = "student",
  username
}: {
  title?: string;
  userRole?: "student" | "educator" | "admin";
  username?: string;
}) {
  const router = useRouter();

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
          {username && (
            <span className="text-muted-foreground hidden sm:block">
              Welcome, <span className="font-semibold">@{username}</span>
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
  );
}