"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Camera,
  Mail,
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

  const dataPoints = skills.map((s, i) => pt(i, (s.score / 100) * maxR));
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

  const handleExportPDF = useCallback(() => {
    const name = (realName || userEmail.split("@")[0] || "profile")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const original = document.title;
    document.title = `Talent3X_Profile_${name}`;
    window.print();
    setTimeout(() => { document.title = original; }, 500);
  }, [realName, userEmail]);

  const displayName = realName || userEmail.split("@")[0] || profile?.username || "User";
  const activeProofs = userRole === "student" ? proofs : educatorEvaluations;
  const isLoading = loading || skillsLoading || skillRatingsLoading || proofsLoading;

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
    <AppLayout userRole={userRole} fullWidth>
      <div className="bg-white print:bg-white">
        <div className="w-full overflow-hidden print:shadow-none">

          {/* ── Top action bar ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-10 py-3 border-b border-slate-100 bg-white sticky top-0 z-20 print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-[9px] leading-none">T</span>
              </div>
              <span className="text-slate-400 text-[11px] font-medium tracking-widest uppercase">Profile Studio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditing(!editing)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {editing ? "Cancel" : "Edit"}
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg bg-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                Share
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* ── Profile Header ─────────────────────────────────────────── */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-10 pt-9 pb-9 print:py-6">
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />

            <div className="relative flex items-center gap-7">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="relative h-[88px] w-[88px] rounded-2xl overflow-hidden bg-white/20 border-2 border-white/30 shadow-xl">
                  {avatarUrl
                    ? <Image src={avatarUrl} alt={displayName} fill sizes="88px" className="object-cover" unoptimized />
                    : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold tracking-tight">{getInitials(displayName)}</div>
                  }
                </div>
                {avatarUploading ? (
                  <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-white/90 hover:bg-white border border-white/50 rounded-full flex items-center justify-center shadow-md print:hidden transition-colors"
                  >
                    <Camera className="h-3 w-3 text-slate-500" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h1 className="text-[1.85rem] font-bold text-white leading-none tracking-tight drop-shadow-sm">{displayName}</h1>
                    {headline && (
                      <p className="text-[15px] text-blue-100 font-medium mt-2 leading-none">{headline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="inline-flex items-center text-[11px] font-semibold text-white/80 bg-white/15 border border-white/20 px-2.5 py-0.5 rounded-full capitalize">
                        {profile?.role}
                      </span>
                      {trustMetrics.verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-900/30 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                          <Shield className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    {bio && (
                      <p className="mt-3.5 text-sm text-blue-100/80 leading-relaxed max-w-xl italic">&ldquo;{bio}&rdquo;</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden lg:flex items-center shrink-0 pr-1 divide-x divide-white/20">
                    {[
                      { value: taskStats.total, label: "Tasks" },
                      { value: trustMetrics.total_evaluations, label: "Evaluations" },
                      { value: topSkills.length, label: "Skills" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center px-8 first:pl-0 last:pr-0">
                        <p className="text-3xl font-bold text-white leading-none tabular-nums">{stat.value}</p>
                        <p className="text-[11px] text-blue-200 font-medium mt-1.5 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

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

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="border-t border-slate-100">

            {/* Row 1: Radar + Contributions */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

              {/* Radar chart */}
              <div className="px-10 py-8">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Capability based on evaluated work
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-400 text-[9px] cursor-default font-bold">i</span>
                </p>
                <RadarChart skills={radarSkills} />
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 justify-center">
                  {[
                    { label: "1 – Foundational", color: "bg-slate-300" },
                    { label: "2 – Developing",   color: "bg-blue-200" },
                    { label: "3 – Proficient",   color: "bg-blue-400" },
                    { label: "4 – Advanced",     color: "bg-blue-600" },
                    { label: "5 – Expert",       color: "bg-blue-800" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${l.color}`} />
                      <span className="text-[10px] text-slate-500">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Evaluated Contributions */}
              <div className="px-10 py-8 bg-slate-50/30">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Top Evaluated Contributions</p>
                {activeProofs.length > 0 ? (
                  <div className="space-y-3">
                    {activeProofs
                      .slice()
                      .sort((a, b) => b.evaluation_score - a.evaluation_score)
                      .slice(0, 3)
                      .map((p, idx) => (
                        <div key={p.proof_id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${idx === 0 ? "bg-white border-blue-100 shadow-sm" : "bg-white border-slate-100"}`}>
                          <div className="flex gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100 flex items-center justify-center shrink-0">
                              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 leading-snug">{p.title}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Stars score={p.evaluation_score} />
                                <span className="text-sm font-bold text-slate-800">{p.evaluation_score.toFixed(1)}</span>
                                <span className="text-xs text-slate-400">/ 5</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(p.timestamp).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                            </span>
                            {p.on_chain && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                                <Shield className="h-2.5 w-2.5" />
                                On-Chain Verified
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    {activeProofs.length > 3 && (
                      <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium pt-1 transition-colors">
                        View all {activeProofs.length} contributions <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">No contributions yet</p>
                    <p className="text-xs text-slate-300 mt-1">Complete tasks to build your profile</p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100" />

            {/* Row 2: Capabilities + Timeline + Key Skills */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

              {/* Top Verified Capabilities */}
              <div className="px-10 py-8">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Top Verified Capabilities</p>
                {topSkills.length > 0 ? (
                  <div className="space-y-2.5">
                    {topSkills.slice(0, 5).map(s => (
                      <div key={s.skill_id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:border-blue-200 transition-colors">
                          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">based on {s.evidence_count} evaluation{s.evidence_count !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-slate-800 leading-none">{s.score.toFixed(1)}</p>
                          <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide mt-0.5">Avg</p>
                        </div>
                      </div>
                    ))}
                    {topSkills.length > 5 && (
                      <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium pt-1 transition-colors">
                        View all capabilities <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 text-center py-8">No verified capabilities yet</p>
                )}
              </div>

              {/* Evaluation Timeline */}
              <div className="px-10 py-8">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Evaluation Timeline</p>
                {activeProofs.length > 0 ? (
                  <div className="space-y-1">
                    {activeProofs.slice(0, 7).map((p, idx) => (
                      <div key={p.proof_id} className="flex items-center gap-4 py-2 group">
                        <span className="text-[10px] text-slate-400 w-16 shrink-0 text-right font-medium tabular-nums">
                          {new Date(p.timestamp).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                        </span>
                        <div className="relative flex flex-col items-center shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full z-10 ring-2 ring-white ${p.on_chain ? "bg-emerald-500" : "bg-blue-500"}`} />
                          {idx < activeProofs.slice(0, 7).length - 1 && (
                            <div className="absolute top-2.5 w-px h-8 bg-slate-100" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <p className="text-xs text-slate-700 truncate group-hover:text-slate-900 transition-colors">{p.title}</p>
                          <span className="text-xs font-bold text-slate-600 shrink-0 ml-3 tabular-nums">{p.evaluation_score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                    {activeProofs.length > 7 && (
                      <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium pt-2 transition-colors">
                        View full history <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 text-center py-8">No evaluations recorded yet</p>
                )}
              </div>

              {/* Key Skills */}
              <div className="px-10 py-8">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Key Skills (from evaluations)</p>
                {topSkills.length > 0 ? (
                  <div className="space-y-3.5">
                    {topSkills.slice(0, 7).map(s => (
                      <div key={s.skill_id} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-700 font-medium truncate group-hover:text-slate-900 transition-colors">{s.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2 tabular-nums font-semibold">{s.score.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                            style={{ width: `${Math.min(s.score, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {topSkills.length > 7 && (
                      <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium pt-1 transition-colors">
                        View all skills <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 text-center py-8">No skill data yet</p>
                )}
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
