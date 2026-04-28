"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export function Header({
  title = "Talent3X",
  userRole = "student",
  username,
  realName,
  email
}: {
  title?: string;
  userRole?: "student" | "educator" | "admin";
  username?: string;
  realName?: string | null;
  email?: string;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
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
            src="/pics/logo-transparent.png"
            alt="Talent3X Logo"
            width={300}
            height={60}
            className="h-10 w-auto"
            priority
            quality={100}
          />
        </Link>

        <div className="flex items-center space-x-4">
          {(username || realName || email) && (
            <span className="text-muted-foreground hidden sm:block">
              Welcome, <span className="font-semibold text-foreground">{realName || (email ? email.split('@')[0] : `@${username}`)}</span>
            </span>
          )}

          <div className="flex space-x-2">
            {userRole === "educator" && (
              <Button variant="outline" onClick={() => router.push("/e/tasks/create")}>
                Create Task
              </Button>
            )}

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