"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Award,
  ClipboardList,
  FileCheck,
  Star,
  Link2,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Tables } from "@/lib/supabase/types";
import { useSkills, useSkillRatings, useTaskRatings } from "@/hooks";
import { TopSkill, Proof } from "@/lib/profile/types";

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

  // Skills, ratings, proofs
  const { skillsMap, loading: skillsLoading } = useSkills();
  const { topSkills, loading: skillRatingsLoading } = useSkillRatings(userId, skillsMap);
  const { proofs, trustMetrics, loading: proofsLoading } = useTaskRatings(userId, skillsMap);

  // Task assignments for students / tasks created for educators
  const [taskStats, setTaskStats] = useState<{ total: number; completed: number; pending: number }>({
    total: 0,
    completed: 0,
    pending: 0,
  });

  const hasChanges = useCallback(() => {
    return (
      realName !== initialValues.realName ||
      headline !== initialValues.headline ||
      bio !== initialValues.bio
    );
  }, [realName, headline, bio, initialValues]);

  // Fetch profile + task stats
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

      // Fetch task stats
      if (userRole === "student") {
        const { data: assignments } = await supabase
          .from("task_assignments")
          .select("task, status, tasks(status)")
          .eq("assignee", user.id);

        if (assignments && assignments.length > 0) {
          const total = assignments.length;
          let completed = 0;
          let pending = 0;
          for (const a of assignments) {
            const taskData = Array.isArray(a.tasks) ? a.tasks[0] : a.tasks;
            if (taskData && (taskData as { status: string }).status === "graded") {
              completed++;
            } else {
              pending++;
            }
          }
          setTaskStats({ total, completed, pending });
        }
      } else {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("status")
          .eq("creator", user.id);

        if (tasks && tasks.length > 0) {
          const total = tasks.length;
          const completed = tasks.filter(t => t.status === "graded").length;
          const pending = tasks.filter(t => t.status !== "graded").length;
          setTaskStats({ total, completed, pending });
        }
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router, userRole]);

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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      if (avatarUrl) {
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

      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const ensurePublicSlug = async (supabase: ReturnType<typeof createClient>): Promise<string> => {
    if (publicSlug) return publicSlug;

    let proposedSlug = realName
      ? realName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim()
      : userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (!proposedSlug) {
      proposedSlug = "user-" + Math.random().toString(36).substring(2, 8);
    }

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

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const supabase = createClient();
      await ensurePublicSlug(supabase);

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

  const publicProfileUrl = publicSlug
    ? `https://talent3x.com/p/${publicSlug}`
    : null;

  // Skill level color
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "Exceptional": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Advanced": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Intermediate": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Foundation": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Star display for proofs
  const renderStars = (score: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i <= Math.round(score) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout userRole={userRole}>
        <div className="space-y-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={userRole}>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">
            Manage your Talent3X profile and view your achievements.
          </p>
        </div>

        {/* Top row: Avatar + Stats + Quick Info */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Avatar card + Stats */}
          <div className="space-y-6">
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
                  {headline && (
                    <p className="text-sm text-muted-foreground mt-0.5">{headline}</p>
                  )}
                  <Badge variant="secondary" className="mt-2 capitalize">{profile?.role}</Badge>
                </div>
              </div>
            </SharedCard>

            {/* Stats card */}
            <SharedCard>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
                  <div className="text-xs text-blue-600/70">{userRole === "student" ? "Tasks" : "Created"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-600">{taskStats.completed}</div>
                  <div className="text-xs text-emerald-600/70">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-2xl font-bold text-amber-600">{trustMetrics.total_evaluations}</div>
                  <div className="text-xs text-amber-600/70">Evaluations</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">{trustMetrics.total_proofs}</div>
                  <div className="text-xs text-purple-600/70">Proofs</div>
                </div>
              </div>
            </SharedCard>

            {/* Public profile card */}
            <SharedCard>
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Public Profile</h3>
              </div>
              {publicProfileUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-foreground bg-muted px-2 py-1 rounded flex-1 overflow-hidden truncate">
                      {publicProfileUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shows your name, headline, bio, and avatar. No email or DID exposed.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Save your profile to generate a public link.
                </p>
              )}
            </SharedCard>
          </div>

          {/* Right column: Personal info + Skills + Proofs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal information card */}
            <SharedCard title="Personal information" description="Your basic profile details">
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Email (read-only) */}
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-foreground text-sm">{userEmail}</p>
                    </div>
                  </div>

                  {/* Role (read-only) */}
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Role</Label>
                    <p className="font-medium text-foreground capitalize mt-1">{profile?.role}</p>
                  </div>
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
                    rows={3}
                    maxLength={500}
                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Save / Cancel buttons */}
                <div className="flex gap-3 pt-1">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges()}
                    size="sm"
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
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </SharedCard>

            {/* Top Skills card */}
            <SharedCard>
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Top Skills</h3>
              </div>
              {skillRatingsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : topSkills.length > 0 ? (
                <div className="space-y-3">
                  {topSkills.slice(0, 8).map((skill: TopSkill) => (
                    <div key={skill.skill_id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{skill.name}</span>
                          <Badge variant="outline" className={`text-xs ${getSkillLevelColor(skill.level)}`}>
                            {skill.level}
                          </Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all"
                            style={{ width: `${(skill.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground w-10 text-right">{skill.score.toFixed(1)}</span>
                    </div>
                  ))}
                  {topSkills.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Based on {topSkills[0].evidence_count}+ rating{topSkills[0].evidence_count !== 1 ? "s" : ""} across evaluated tasks
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No skill ratings yet</p>
                  <p className="text-xs">Complete and get rated on tasks to see your skills here</p>
                </div>
              )}
            </SharedCard>

            {/* Recent Proofs / Evaluations card */}
            <SharedCard>
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  {userRole === "student" ? "Proofs & Evaluations" : "Student Evaluations"}
                </h3>
              </div>
              {proofsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : proofs.length > 0 ? (
                <div className="space-y-3">
                  {proofs.slice(0, 5).map((proof: Proof) => (
                    <div
                      key={proof.proof_id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {proof.on_chain ? (
                          <Shield className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">{proof.title}</p>
                          {proof.task_difficulty && (
                            <Badge variant="outline" className="text-xs">{proof.task_difficulty}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {renderStars(proof.evaluation_score)}
                          <span className="text-xs text-muted-foreground">{proof.evaluation_score.toFixed(1)}/5</span>
                          {proof.on_chain && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1">
                              <Shield className="h-3 w-3" /> On-chain
                            </span>
                          )}
                        </div>
                        {proof.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proof.skills.slice(0, 3).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                            {proof.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{proof.skills.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No evaluations yet</p>
                  <p className="text-xs">
                    {userRole === "student"
                      ? "Submit tasks and get rated to see your proofs here"
                      : "Rate student submissions to see evaluations here"}
                  </p>
                </div>
              )}
            </SharedCard>

            {/* Verification status card */}
            {trustMetrics.verified && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Verified Profile</p>
                  <p className="text-xs text-emerald-600">Your credentials have been anchored to the blockchain and are permanently verifiable</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}