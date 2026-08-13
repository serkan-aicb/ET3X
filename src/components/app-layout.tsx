"use client";

import { Footer } from "@/components/footer";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import { getSession, signOut, type LocalSession } from "@/lib/auth/local-session";

const NO_SESSION: LocalSession | null = null;

export function AppLayout({
  children,
  userRole,
  fullWidth = false,
}: {
  children: React.ReactNode;
  userRole: "student" | "educator" | "admin";
  fullWidth?: boolean;
}) {
  const session = useLocalDraft<LocalSession | null>(DRAFT_KEYS.session, NO_SESSION);
  const router = useRouter();

  // Frozen build: the demo session stands in for auth. The proxy already gates
  // protected routes at request time; this is a client-side backstop.
  useEffect(() => {
    if (!getSession()) router.push("/auth");
  }, [router]);

  const handleLogout = () => {
    signOut();
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

  const displayName =
    session?.name || (session?.email ? session.email.split("@")[0] : "");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Unified Header */}
      <header className="bg-background border-b backdrop-blur py-4 px-6 print:hidden">
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
            {displayName && (
              <span className="text-muted-foreground hidden sm:block">
                Welcome, <span className="font-semibold text-foreground">{displayName}</span>
              </span>
            )}

            <div className="flex space-x-2">
              {userRole === "student" && (
                <Button variant="outline" onClick={() => router.push("/s/profile")}>
                  Profile
                </Button>
              )}

              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Unified Wrapper */}
      <main className={fullWidth ? "grow" : "mx-auto max-w-6xl px-6 py-10 grow"}>
        {children}
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}
