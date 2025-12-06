"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <header className="bg-card shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={getDashboardLink()} className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">T</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{title}</span>
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