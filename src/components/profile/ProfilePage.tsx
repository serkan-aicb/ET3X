"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Camera,
  Mail,
  Copy,
  Check,
  Loader2,
  Star,
  Shield,
  Share2,
  Printer,
  Pencil,
  X,
  ChevronRight,
} from "lucide-react";
import { Tables } from "@/lib/supabase/types";
import { useSkills, useSkillRatings, useTaskRatings } from "@/hooks";
import { TopSkill, Proof } from "@/lib/profile/types";

type Profile = Tables<"profiles">;

interface ProfilePageProps {
  userRole: "student" | "educator";
}

// ─── Radar Chart (pure SVG) ──────────────────────────────────────────────────
function RadarChart({ skills }: { skills: TopSkill[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 100;
  const levels = [1, 2, 3, 4, 5];
  const n = skills.length;

  if (n < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] text-slate-400 text-sm">
        <p>Not enough skills rated yet</p>
        <p className="text-xs mt-1">Complete tasks to build your radar</p>
      </div>
    );
  }

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  const dataPoints = skills.map((s, i) => pt(i, (s.score / 5) * maxR));
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid circles */}
      {levels.map((lvl) => (
        <polygon
          key={lvl}
          points={Array.from({ length: n }, (_, i) => {
            const p = pt(i, (lvl / 5) * maxR);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* Spokes */}
      {skills.map((_, i) => {
        const outer = pt(i, maxR);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {/* Data fill */}
      <path d={dataPath} fill="#2563EB" fillOpacity={0.18} stroke="#2563EB" strokeWidth={2} />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#2563EB" />
      ))}

      {/* Labels */}
      {skills.map((s, i) => {
        const labelR = maxR + 22;
        const p = pt(i, labelR);
        const anchor =
          Math.abs(p.x - cx) < 5 ? "middle" : p.x < cx ? "end" : "start";
        return (
          <text
            key={i}
            x={p.x}
            y={p.y + 4}
            textAnchor={anchor}
            fontSize="10"
            fill="#475569"
            fontFamily="inherit"
          >
            {s.name.length > 14 ? s.name.slice(0, 13) + "…" : s.name}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.round(score) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Timeline year dot ────────────────────────────────────────────────────────
function TimelineDot({ year, active }: { year: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full border-2 ${active ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`} />
      <span className={`text-xs ${active ? "text-blue-700 font-semibold" : "text-slate-400"}`}>{year}</span>
    </div>
  );
}

// ─── Score level label ────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  Exceptional: "bg-purple-100 text-purple-700",
  Advanced: "bg-blue-100 text-blue-700",
  Intermediate: "bg-emerald-100 text-emerald-700",
  Foundation: "bg-slate-100 text-slate-600",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfilePage({ userRole }: ProfilePageProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [realName, setRealName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [initialValues, setInitialValues] = useState({ realName: "", headline: "", bio: "" });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { skillsMap, loading: skillsLoading } = useSkills();
  const { topSkills, loading: skillRatingsLoading } = useSkillRatings(userId, skillsMap);
  const { proofs, trustMetrics, loading: proofsLoading } = useTaskRatings(userId, skillsMap);

  const [educatorEvaluations, setEducatorEvaluations] = useState<Proof[]>([]);

  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 });

  const hasChanges = useCallback(() => {
    return realName !== initialValues.realName || headline !== initialValues.headline || bio !== initialValues.bio;
  }, [realName, headline, bio, initialValues]);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data: profileData, error } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();

      if (error) { toast.error("Failed to load profile"); setLoading(false); return; }

      setProfile(profileData);
      setRealName(profileData.real_name || "");
      setHeadline(profileData.headline || "");
      setBio(profileData.bio || "");
      setAvatarUrl(profileData.avatar_url || null);
      setPublicSlug(profileData.public_slug || null);
      setInitialValues({ realName: profileData.real_name || "", headline: profileData.headline || "", bio: profileData.bio || "" });

      if (userRole === "student") {
        const { data: assignments } = await supabase
          .from("task_assignments").select("task, status, tasks(status)").eq("assignee", user.id);
        if (assignments?.length) {
          const total = assignments.length;
          const completed = assignments.filter(a => {
            const t = Array.isArray(a.tasks) ? a.tasks[0] : a.tasks;
            return t && (t as { status: string }).status === "graded";
          }).length;
          setTaskStats({ total, completed, pending: total - completed });
        }
      } else {
        const { data: tasks } = await supabase.from("tasks").select("status").eq("creator", user.id);
        if (tasks?.length) {
          const total = tasks.length;
          const completed = tasks.filter(t => t.status === "graded").length;
          setTaskStats({ total, completed, pending: total - completed });
        }
      }

      setLoading(false);
    };
    fetchProfile();
  }, [router, userRole]);

  useEffect(() => {
    if (!userId || userRole !== "educator") return;
    const fetch = async () => {
      try {
        const supabase = createClient();
        const { data: ratingsData } = await supabase
          .from("task_ratings")
          .select(`id, task_id, stars_avg, created_at, on_chain, tx_hash, tasks!task_ratings_task_id_fkey(title, description, skill_level)`)
          .eq("rater_id", userId).order("created_at", { ascending: false });

        const ratings = ratingsData || [];
        if (ratings.length > 0) {
          const ratingIds = ratings.map(r => r.id);
          const { data: skillRatingsData } = await supabase
            .from("task_rating_skills").select("rating_id, skill_id").in("rating_id", ratingIds);
          const skillMap = new Map<string, number[]>();
          skillRatingsData?.forEach(sr => {
            if (!skillMap.has(sr.rating_id)) skillMap.set(sr.rating_id, []);
            skillMap.get(sr.rating_id)!.push(sr.skill_id);
          });
          const evalProofs: Proof[] = ratings.slice(0, 5).map(rating => {
            const rawTask = rating.tasks as unknown;
            const taskObj = Array.isArray(rawTask) ? rawTask[0] : rawTask;
            const taskData = taskObj as { title: string; description: string | null; skill_level: string | null } | null;
            const skills = (skillMap.get(rating.id) || []).map(id => skillsMap.get(id) || `Skill #${id}`);
            return {
              proof_id: rating.id, title: taskData?.title || "Unknown Task", description: taskData?.description || null,
              evaluation_score: rating.stars_avg, skills: skills.slice(0, 3), timestamp: rating.created_at,
              task_difficulty: taskData?.skill_level || null, on_chain: rating.on_chain, tx_hash: rating.tx_hash,
            };
          });
          setEducatorEvaluations(evalProofs);
        }
      } catch { /* silent */ }
    };
    fetch();
  }, [userId, userRole, skillsMap]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name.slice(0, 2) || "U").toUpperCase();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("JPG, PNG, or WebP only"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB for avatar"); return; }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      await supabase.storage.from("profile-avatars").upload(path, file, { upsert: true });
      const { data: urlData } = supabase.storage.from("profile-avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
      setAvatarUrl(urlData.publicUrl);
      toast.success("Profile picture updated");
    } catch { toast.error("Failed to upload image"); }
    finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const ensurePublicSlug = async (supabase: ReturnType<typeof createClient>): Promise<string> => {
    if (publicSlug) return publicSlug;
    let base = realName
      ? realName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim()
      : userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (!base) base = "user-" + Math.random().toString(36).substring(2, 8);
    let slug = base, counter = 1, exists = true;
    while (exists) {
      const { data } = await supabase.from("profiles").select("id").eq("public_slug", slug).limit(1);
      if (!data?.length || (data.length === 1 && data[0].id === userId)) exists = false;
      else { slug = base + "-" + counter; counter++; }
    }
    const { error } = await supabase.from("profiles").update({ public_slug: slug }).eq("id", userId);
    if (!error) { setPublicSlug(slug); setProfile(prev => prev ? { ...prev, public_slug: slug } : prev); }
    return slug;
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await ensurePublicSlug(supabase);
      const updates = { real_name: realName.trim() || null, headline: headline.trim() || null, bio: bio.trim() || null };
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) { toast.error("Failed to save: " + error.message); return; }
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
      setInitialValues({ realName, headline, bio });
      setEditing(false);
      toast.success("Profile saved");
    } catch { toast.error("Failed to save profile"); }
    finally { setSaving(false); }
  };

  const handleCopyLink = async () => {
    const slug = publicSlug || (await ensurePublicSlug(createClient()));
    const url = `https://www.talent3x.com/p/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy"); }
  };

  const displayName = realName || userEmail.split("@")[0] || profile?.username || "User";
  const activeProofs = userRole === "student" ? proofs : educatorEvaluations;
  const isLoading = loading || skillsLoading || skillRatingsLoading || proofsLoading;

  // Derive active years from proofs
  const activeYears = Array.from(
    new Set(activeProofs.map(p => new Date(p.timestamp).getFullYear().toString()))
  ).sort();
  const currentYear = new Date().getFullYear().toString();
  if (!activeYears.includes(currentYear)) activeYears.push(currentYear);

  // Top skills for radar (max 6)
  const radarSkills = topSkills.slice(0, 6);

  if (isLoading) {
    return (
      <AppLayout userRole={userRole}>
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-56" />
          <div className="grid grid-cols-[240px_1fr_280px] gap-6">
            <div className="space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-32 w-full" /></div>
            <div className="space-y-4"><Skeleton className="h-72 w-full" /><Skeleton className="h-48 w-full" /></div>
            <div className="space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={userRole}>
      <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:py-0 print:px-0">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-0">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="text-slate-500 text-sm font-medium">Profile Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                Share
              </Button>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white print:hidden">
                <Printer className="h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} className="gap-1.5 text-xs">
                {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </div>

          {/* ── Edit Panel ──────────────────────────────────────────────── */}
          {editing && (
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-200">
              <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Name</Label>
                  <Input value={realName} onChange={e => setRealName(e.target.value)} placeholder="Your full name" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Headline</Label>
                  <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Data Analyst · TU Berlin" className="mt-1 h-8 text-sm" maxLength={120} />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Email</Label>
                  <div className="flex items-center gap-2 mt-1 h-8 px-3 border rounded-md bg-white text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-xs text-slate-500 uppercase">Bio</Label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="A short description about yourself..."
                    rows={2}
                    maxLength={500}
                    className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges()}>
                  {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</> : <><Check className="h-3.5 w-3.5 mr-1.5" />Save</>}
                </Button>
              </div>
            </div>
          )}

          {/* ── Body: Left sidebar + Right content ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

            {/* ── LEFT: Identity ──────────────────────────────────────── */}
            <div className="p-6 flex flex-col gap-6">
              {/* Avatar + name */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={displayName} className="object-cover w-full h-full rounded-full" />
                      : <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">{getInitials(displayName)}</AvatarFallback>
                    }
                  </Avatar>
                  {avatarUploading ? (
                    <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md border-2 border-white"
                    >
                      <Camera className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
                </div>

                <div className="text-center space-y-1">
                  <h2 className="font-bold text-slate-900 text-lg leading-tight">{displayName}</h2>
                  {headline && <p className="text-sm text-blue-600 font-semibold">{headline}</p>}
                  <Badge variant="secondary" className="text-xs capitalize mt-1">{profile?.role}</Badge>
                </div>
              </div>

              {/* Bio */}
              {bio && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 italic leading-relaxed">"{bio}"</p>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { value: taskStats.total, label: "Tasks" },
                  { value: trustMetrics.total_evaluations, label: "Evals" },
                  { value: topSkills.length, label: "Skills" },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 rounded-xl py-3 border border-slate-100">
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Activity timeline */}
              {activeYears.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Activity</p>
                  <div className="relative pl-3">
                    <div className="absolute left-1 top-1.5 bottom-1.5 w-px bg-slate-200" />
                    <div className="space-y-3">
                      {activeYears.map(y => (
                        <TimelineDot key={y} year={y} active={y === currentYear} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-auto pt-2 space-y-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-colors text-sm text-slate-700 font-medium"
                >
                  <div className="flex items-center gap-2">
                    {copied ? <Check className="h-4 w-4 text-blue-600" /> : <Share2 className="h-4 w-4 text-slate-400" />}
                    Share Profile
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-colors text-sm text-slate-700 font-medium print:hidden"
                >
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-slate-400" />
                    Export as PDF
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* ── RIGHT: Content area ─────────────────────────────────── */}
            <div className="flex flex-col divide-y divide-slate-100">

              {/* Top row: Radar chart + Top Contributions */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                {/* Radar chart */}
                <div className="p-6">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    Capability based on evaluated work
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[8px] cursor-default">i</span>
                  </p>
                  <RadarChart skills={radarSkills} />
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
                    {[
                      { label: "1 – Foundational", color: "bg-slate-300" },
                      { label: "2 – Developing",   color: "bg-blue-200" },
                      { label: "3 – Proficient",   color: "bg-blue-400" },
                      { label: "4 – Advanced",     color: "bg-blue-600" },
                      { label: "5 – Expert",       color: "bg-blue-800" },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${l.color}`} />
                        <span className="text-[10px] text-slate-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Evaluated Contributions */}
                <div className="p-6">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Top Evaluated Contributions</p>
                  {activeProofs.length > 0 ? (
                    <div className="space-y-3">
                      {activeProofs
                        .slice()
                        .sort((a, b) => b.evaluation_score - a.evaluation_score)
                        .slice(0, 3)
                        .map(p => (
                          <div key={p.proof_id} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-sm transition-all">
                            <div className="flex gap-3 mb-2">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 leading-snug">{p.title}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Stars score={p.evaluation_score} />
                                  <span className="text-xs font-bold text-slate-700">{p.evaluation_score.toFixed(1)} / 5</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                              <span className="text-[10px] text-slate-400">
                                {new Date(p.timestamp).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                              </span>
                              {p.on_chain && (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                                  <Shield className="h-3 w-3" />
                                  Verified
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      {activeProofs.length > 3 && (
                        <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline pt-1">
                          View all contributions ({activeProofs.length}) <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">No contributions yet</p>
                  )}
                </div>
              </div>

              {/* Bottom row: Capabilities + Timeline + Key Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                {/* Top Verified Capabilities */}
                <div className="p-6">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Top Verified Capabilities</p>
                  {topSkills.length > 0 ? (
                    <div className="space-y-2.5">
                      {topSkills.slice(0, 4).map(s => (
                        <div key={s.skill_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-100 transition-colors bg-white">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">→ based on {s.evidence_count} evaluation{s.evidence_count !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-slate-800">{s.score.toFixed(1)}</p>
                            <p className="text-[9px] text-emerald-600 font-semibold">Avg Score</p>
                          </div>
                        </div>
                      ))}
                      {topSkills.length > 4 && (
                        <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline pt-1">
                          View all capabilities <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No verified capabilities yet</p>
                  )}
                </div>

                {/* Evaluation Timeline */}
                <div className="p-6">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Evaluation Timeline</p>
                  {activeProofs.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-22 top-2 bottom-2 w-px bg-slate-100" />
                      <div className="space-y-3">
                        {activeProofs.slice(0, 6).map(p => (
                          <div key={p.proof_id} className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 w-20 shrink-0 text-right">
                              {new Date(p.timestamp).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                            </span>
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 z-10 border-2 ${p.on_chain ? "bg-emerald-500 border-emerald-300" : "bg-blue-500 border-blue-300"}`} />
                            <div className="flex-1 flex items-center justify-between min-w-0">
                              <p className="text-xs text-slate-700 truncate">{p.title}</p>
                              <span className="text-xs font-bold text-slate-700 shrink-0 ml-2">{p.evaluation_score.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {activeProofs.length > 6 && (
                        <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-3">
                          View full history <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No evaluations recorded yet</p>
                  )}
                </div>

                {/* Key Skills */}
                <div className="p-6">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Skills (from evaluations)</p>
                  {topSkills.length > 0 ? (
                    <div className="space-y-3">
                      {topSkills.slice(0, 6).map(s => (
                        <div key={s.skill_id} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-700 font-medium truncate">{s.name}</span>
                          <div className="flex items-end gap-0.5 shrink-0">
                            {[1, 2, 3].map(i => (
                              <div
                                key={i}
                                className={`w-1 rounded-sm ${
                                  s.score >= i * 1.67
                                    ? "bg-blue-600"
                                    : "bg-slate-200"
                                }`}
                                style={{ height: `${i * 4 + 4}px` }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      {topSkills.length > 6 && (
                        <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                          View all skills <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No skill data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-white border-slate-200 text-slate-600">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                Evaluations are independently verifiable
              </div>
              {trustMetrics.total_proofs > 0 && (
                <span className="text-xs text-slate-400">{trustMetrics.total_proofs} proof{trustMetrics.total_proofs !== 1 ? "s" : ""}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>talent3x.com</span>
              {publicSlug && (
                <>
                  <span>·</span>
                  <span className="font-mono text-slate-500">p/{publicSlug}</span>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
