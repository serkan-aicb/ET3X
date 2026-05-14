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
      {/* Page wrapper — landscape document feel */}
      <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:py-0 print:px-0">
        {/* Document card */}
        <div className="max-w-[1200px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-0">

          {/* ── Document Header ─────────────────────────────────────── */}
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
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs print:hidden">
                <Printer className="h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} className="gap-1.5 text-xs">
                {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </div>

          {/* ── Edit Panel (collapsible) ─────────────────────────────── */}
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

          {/* ── Main 3-Column Body ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

            {/* ── LEFT: Identity Sidebar ──────────────────────────────── */}
            <div className="p-6 flex flex-col gap-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-slate-200">
                    <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                    {avatarUrl && (
                      <AvatarFallback>
                        <img src={avatarUrl} alt={displayName} className="object-cover w-full h-full rounded-full" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {avatarUploading ? (
                    <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow"
                    >
                      <Camera className="h-3 w-3 text-white" />
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
                </div>

                <div className="text-center">
                  <h2 className="font-bold text-slate-900 text-base leading-tight">{displayName}</h2>
                  {headline && <p className="text-xs text-blue-600 font-medium mt-0.5">{headline}</p>}
                  <Badge variant="secondary" className="mt-1.5 text-xs capitalize">{profile?.role}</Badge>
                </div>
              </div>

              {/* Bio */}
              {bio && (
                <div className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-blue-200 pl-3">
                  "{bio}"
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-slate-900">{taskStats.total}</p>
                  <p className="text-[10px] text-slate-500">Tasks</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-slate-900">{trustMetrics.total_evaluations}</p>
                  <p className="text-[10px] text-slate-500">Evals</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-slate-900">{topSkills.length}</p>
                  <p className="text-[10px] text-slate-500">Skills</p>
                </div>
              </div>

              {/* Activity timeline */}
              {activeYears.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Activity</p>
                  <div className="relative pl-2">
                    <div className="absolute left-1 top-2 bottom-2 w-px bg-slate-200" />
                    <div className="space-y-2">
                      {activeYears.map(y => (
                        <TimelineDot key={y} year={y} active={y === currentYear} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Public profile link */}
              <div className="mt-auto pt-2 space-y-2">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={handleCopyLink}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Profile Link
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 print:hidden" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" />
                  Export as PDF
                </Button>
              </div>
            </div>

            {/* ── CENTER: Capabilities ─────────────────────────────────── */}
            <div className="p-6 space-y-6">
              {/* Radar chart */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Capability based on evaluated work</p>
                <RadarChart skills={radarSkills} />

                {/* Level legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                  {[
                    { label: "1 – Foundational", color: "bg-slate-300" },
                    { label: "2 – Developing", color: "bg-blue-200" },
                    { label: "3 – Proficient", color: "bg-blue-400" },
                    { label: "4 – Advanced", color: "bg-blue-600" },
                    { label: "5 – Expert", color: "bg-blue-800" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${l.color}`} />
                      <span className="text-[10px] text-slate-500">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Verified Capabilities */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Verified Capabilities</p>
                {topSkills.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {topSkills.slice(0, 6).map(s => (
                      <div key={s.skill_id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(s.score / 5) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 shrink-0">{s.score.toFixed(1)}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${LEVEL_COLORS[s.level] || "bg-slate-100 text-slate-600"}`}>
                          {s.level}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No verified capabilities yet</p>
                )}
              </div>

              {/* Evaluation Timeline */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Evaluation Timeline</p>
                {activeProofs.length > 0 ? (
                  <div className="space-y-2">
                    {activeProofs.slice(0, 6).map(p => (
                      <div key={p.proof_id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="shrink-0">
                          {p.on_chain
                            ? <Shield className="h-4 w-4 text-emerald-500" />
                            : <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-blue-600" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{p.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Stars score={p.evaluation_score} />
                            <span className="text-[10px] text-slate-400">
                              {new Date(p.timestamp).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                        {p.task_difficulty && (
                          <Badge variant="outline" className="text-[10px] shrink-0">{p.task_difficulty}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No evaluations recorded yet</p>
                )}
              </div>
            </div>

            {/* ── RIGHT: Contributions + Key Skills ───────────────────── */}
            <div className="p-6 space-y-6">
              {/* Top Evaluated Contributions */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Evaluated Contributions</p>
                {activeProofs.length > 0 ? (
                  <div className="space-y-3">
                    {activeProofs
                      .slice()
                      .sort((a, b) => b.evaluation_score - a.evaluation_score)
                      .slice(0, 4)
                      .map((p, idx) => (
                        <div key={p.proof_id} className={`p-3 rounded-xl border ${idx === 0 ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50"}`}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-xs font-semibold text-slate-800 leading-tight">{p.title}</p>
                            <div className="flex gap-0.5 shrink-0">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`h-3 w-3 ${i <= Math.round(p.evaluation_score) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                              ))}
                            </div>
                          </div>
                          {p.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {p.skills.map((s, i) => (
                                <span key={i} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{s}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {new Date(p.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="text-[10px] font-bold text-blue-700">{p.evaluation_score.toFixed(1)}/5</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No contributions yet</p>
                )}
              </div>

              {/* Key Skills bar chart */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Skills (from evaluations)</p>
                {topSkills.length > 0 ? (
                  <div className="space-y-2.5">
                    {topSkills.slice(0, 8).map(s => (
                      <div key={s.skill_id}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-slate-700 font-medium truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">{s.score.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-700 transition-all"
                            style={{ width: `${(s.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No skill data yet</p>
                )}
              </div>

              {/* View all link */}
              {activeProofs.length > 4 && (
                <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                  View all {activeProofs.length} evaluations <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* ── Verification Footer ──────────────────────────────────── */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                trustMetrics.verified
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                <Shield className="h-3.5 w-3.5" />
                {trustMetrics.verified ? "Independently Verifiable" : "Evaluations are independently verifiable"}
              </div>
              {trustMetrics.total_proofs > 0 && (
                <span className="text-xs text-slate-400">{trustMetrics.total_proofs} proof{trustMetrics.total_proofs !== 1 ? "s" : ""} recorded</span>
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
