"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Camera,
  Mail,
  Copy,
  Check,
  User,
  Loader2,
} from "lucide-react";
import { Tables } from "@/lib/supabase/types";

type Profile = Tables<"profiles">;

interface ProfilePageProps {
  userRole: "student" | "educator";
}

export function ProfilePage({ userRole }: ProfilePageProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [realName, setRealName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  // Track changes
  const [initialValues, setInitialValues] = useState({
    realName: "",
    headline: "",
    bio: "",
  });

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Public profile
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasChanges = useCallback(() => {
    return (
      realName !== initialValues.realName ||
      headline !== initialValues.headline ||
      bio !== initialValues.bio
    );
  }, [realName, headline, bio, initialValues]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setRealName(profileData.real_name || "");
      setHeadline(profileData.headline || "");
      setBio(profileData.bio || "");
      setAvatarUrl(profileData.avatar_url || null);
      setPublicSlug(profileData.public_slug || null);
      setInitialValues({
        realName: profileData.real_name || "",
        headline: profileData.headline || "",
        bio: profileData.bio || "",
      });
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Remove old avatar if exists
      if (avatarUrl) {
        // Try to remove old file - extract path from URL or use known pattern
        const oldPaths = ["jpg", "jpeg", "png", "webp"].map(ext => `${userId}/avatar.${ext}`);
        for (const oldPath of oldPaths) {
          await supabase.storage.from("profile-avatars").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload image: " + uploadError.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError);
        toast.error("Failed to save avatar: " + updateError.message);
        return;
      }

      setAvatarUrl(newAvatarUrl);
      setProfile((prev) => prev ? { ...prev, avatar_url: newAvatarUrl } : prev);
      toast.success("Profile picture updated");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Ensure public_slug exists
  const ensurePublicSlug = async (supabase: ReturnType<typeof createClient>): Promise<string> => {
    if (publicSlug) return publicSlug;

    // Generate slug from real_name or email prefix
    let proposedSlug = realName
      ? realName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim()
      : userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (!proposedSlug) {
      proposedSlug = "user-" + Math.random().toString(36).substring(2, 8);
    }

    // Check uniqueness and add suffix if needed
    let finalSlug = proposedSlug;
    let counter = 1;
    let exists = true;

    while (exists) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("public_slug", finalSlug)
        .limit(1);

      if (!data || data.length === 0 || (data.length === 1 && data[0].id === userId)) {
        exists = false;
      } else {
        finalSlug = proposedSlug + "-" + counter;
        counter++;
      }
    }

    // Save the slug
    const { error } = await supabase
      .from("profiles")
      .update({ public_slug: finalSlug })
      .eq("id", userId);

    if (!error) {
      setPublicSlug(finalSlug);
      setProfile((prev) => prev ? { ...prev, public_slug: finalSlug } : prev);
    }

    return finalSlug;
  };

  // Save profile
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Ensure public_slug exists
      await ensurePublicSlug(supabase);

      // Only update fields that exist in the database
      const updates: Record<string, string | null> = {
        real_name: realName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) {
        console.error("Save error:", error);
        toast.error("Failed to save profile: " + error.message);
        return;
      }

      // Update local state
      setProfile((prev) => prev ? { ...prev, ...updates } : prev);
      setInitialValues({ realName, headline, bio });
      toast.success("Profile saved successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRealName(initialValues.realName);
    setHeadline(initialValues.headline);
    setBio(initialValues.bio);
  };

  // Copy public profile link
  const handleCopyLink = async () => {
    const slug = publicSlug || (await ensurePublicSlug(createClient()));
    const url = `https://talent3x.com/p/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const displayName = realName || userEmail.split("@")[0] || profile?.username || "User";

  if (loading) {
    return (
      <AppLayout userRole={userRole}>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const publicProfileUrl = publicSlug
    ? `https://talent3x.com/p/${publicSlug}`
    : null;

  return (
    <AppLayout userRole={userRole}>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">
            Manage your Talent3X profile information.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar card */}
          <SharedCard>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage
                    src={avatarUrl || undefined}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="Change profile picture"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">{displayName}</p>
                <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Click the camera icon to upload a profile picture (JPG, PNG, WebP, max 5 MB)
              </p>
            </div>
          </SharedCard>

          {/* Personal information card */}
          <div className="lg:col-span-2 space-y-6">
            <SharedCard title="Personal information" description="Your basic profile details">
              <div className="space-y-6">
                {/* Email (read-only) */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{userEmail}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed here. Contact support if needed.
                  </p>
                </div>

                {/* Real name */}
                <div>
                  <Label htmlFor="realName" className="text-xs uppercase text-muted-foreground">
                    Real Name
                  </Label>
                  <Input
                    id="realName"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="Enter your real name"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is how others will see you on Talent3X.
                  </p>
                </div>

                {/* Headline */}
                <div>
                  <Label htmlFor="headline" className="text-xs uppercase text-muted-foreground">
                    Headline
                  </Label>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Data Analyst | Computer Science Student"
                    className="mt-1"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A short professional tagline. Optional.
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio" className="text-xs uppercase text-muted-foreground">
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief description about yourself..."
                    rows={4}
                    maxLength={500}
                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A brief description about yourself. Optional.
                  </p>
                </div>

                {/* Role (read-only) */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Role</Label>
                  <p className="font-medium text-foreground capitalize mt-1">{profile?.role}</p>
                </div>

                {/* Save / Cancel buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  {hasChanges() && (
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </SharedCard>

            {/* Public profile card */}
            <SharedCard title="Public profile" description="Your profile is visible to others at this URL">
              <div className="space-y-4">
                {publicProfileUrl ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm text-foreground bg-muted px-2 py-1 rounded flex-1 overflow-hidden">
                      {publicProfileUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Save your profile to generate a public profile link.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your public profile shows your name, headline, bio, and avatar. 
                  It does not expose your email, DID, or private data.
                </p>
              </div>
            </SharedCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}