"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";

interface PublicProfileData {
  username: string;
  real_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  public_slug: string;
  role: string;
  updated_at: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profiles/public/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Profile not found");
          } else {
            setError("Failed to load profile");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setProfile(data);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  const displayName = profile?.real_name || profile?.username || "User";

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-background border-b py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center space-x-2">
            <Image
              src="/pics/LOGO-blank.png"
              alt="Talent3X Logo"
              width={120}
              height={120}
              className="h-10 w-auto"
            />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10 flex-grow">
          <div className="flex flex-col items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-background border-b py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/pics/LOGO-blank.png"
                alt="Talent3X Logo"
                width={120}
                height={120}
                className="h-10 w-auto"
              />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10 flex-grow">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The profile you are looking for does not exist or is not public."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Back to Talent3X
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Clean header */}
      <header className="bg-background border-b py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/pics/LOGO-blank.png"
              alt="Talent3X Logo"
              width={120}
              height={120}
              className="h-10 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Profile content */}
      <main className="mx-auto max-w-4xl px-6 py-10 flex-grow w-full">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage
              src={profile.avatar_url || undefined}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          {/* Name and headline */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            {profile.headline && (
              <p className="text-muted-foreground mt-1">{profile.headline}</p>
            )}
            <p className="text-sm text-muted-foreground capitalize mt-1">{profile.role}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="max-w-lg w-full rounded-xl border bg-card p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">About</h2>
              <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Talent3X branding */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Profile on Talent3X &middot; Skills verified on blockchain
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-card border-t mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Talent3X.
          </p>
        </div>
      </footer>
    </div>
  );
}