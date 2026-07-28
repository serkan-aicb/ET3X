"use client";

/**
 * <CapabilityProfile> — Week 5 Final Profile Studio (v1.6).
 * The real individual profile, driven by browser-local data (onboarding +
 * Actions + evaluations) with capability scores from the R9 stub. One component
 * drives both surfaces:
 *   mode="owner"  → /s/profile (Edit / avatar / Share / Export PDF)
 *   mode="public" → /p/[slug]  (read-only projection)
 *
 * Design = the approved variant-B preview. Frozen build: basics/avatar persist
 * to localStorage (swap to Supabase later); public capabilities are browser-local
 * until Cyprian's profile_capability_scores endpoint (workspace doc 16).
 */

import { useRef, useState } from "react";
import {
  BadgeCheck,
  Calendar,
  Check,
  FileDown,
  FileText,
  GraduationCap,
  Pencil,
  Share2,
  ShieldCheck,
  Star,
  TrendingUp,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TopBar, TopBarBrand } from "@/components/ui/top-bar";
import { SCORE_MAX, SCORE_MIN } from "@/lib/catalogue";
import { DRAFT_KEYS, writeDraft } from "@/lib/local-draft";
import type { ProfileBasics, ProfileView } from "@/lib/profile/profile-types";
import { useProfileView } from "@/lib/profile/use-profile-view";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export function CapabilityProfile({ mode }: { mode: "owner" | "public" }) {
  const view = useProfileView();
  const isOwner = mode === "owner";

  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/p/${view.slug}` : "";

  const persist = (patch: Partial<ProfileBasics>) =>
    writeDraft<ProfileBasics>(DRAFT_KEYS.profile, {
      name: view.basics.name,
      headline: view.basics.headline,
      bio: view.basics.bio,
      avatarDataUrl: view.basics.avatarDataUrl,
      ...patch,
    });

  const share = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked in preview — ignore */
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* print:hidden — Export PDF should render the portfolio, not the app chrome. */}
      <TopBar className="print:hidden">
        <TopBarBrand context="Profile" />
        {/* Labels collapse to icon-only below sm so the bar never overflows on phones. */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button variant="inverse-outline" onClick={() => setEditing((v) => !v)} aria-label={editing ? "Done editing" : "Edit profile"}>
              <Pencil /> <span className="hidden sm:inline">{editing ? "Done" : "Edit"}</span>
            </Button>
          )}
          <Button variant="inverse-outline" onClick={share} aria-label="Share profile link">
            {copied ? <Check /> : <Share2 />} <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </Button>
          {isOwner && (
            <Button variant="inverse" onClick={() => window.print()} aria-label="Export as PDF">
              <FileDown /> <span className="hidden sm:inline">Export PDF</span>
            </Button>
          )}
        </div>
      </TopBar>

      <main className="mx-auto max-w-[1240px] px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* ── Identity rail ── */}
          <div className="flex flex-col gap-6">
            <Panel>
              <IdentityBlock
                view={view}
                editable={isOwner && editing}
                onAvatar={(dataUrl) => persist({ avatarDataUrl: dataUrl })}
              />

              {/* Trust tiles.
                  TODO: swap the middle "Capabilities" tile for an "Evaluators"
                  count (distinct educators/evaluators) once evaluations carry an
                  evaluator identity — the Week-4 stub Evaluation has no evaluator
                  id, so it can't be counted yet; Cyprian's real data will have it. */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Tile value={view.trust.evaluations} label="Evaluations" />
                <Tile value={view.trust.capabilities} label="Capabilities" />
                <Tile value={view.trust.verified} label="Verified" tone="success" />
              </div>

              {/* Bio */}
              {isOwner && editing ? (
                <EditBasics view={view} onSave={(b) => { persist(b); setEditing(false); }} />
              ) : (
                view.basics.bio && (
                  <p className="mt-4 rounded-lg bg-primary-soft p-3 text-sm italic leading-relaxed text-muted-foreground">
                    “{view.basics.bio}”
                  </p>
                )
              )}

              <div className="mt-4 border-t pt-3 text-[11px] text-muted-foreground/70">
                talent3x.com/p/{view.slug}
              </div>
            </Panel>

            {(view.experience.length > 0 || view.education.length > 0) && (
              <Panel title="Credentials & Experience">
                <ol className="space-y-5">
                  {view.experience.map((e, i) => (
                    <li key={`x${i}`} className="relative pl-5">
                      <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" />
                      <div className="text-xs font-semibold text-muted-foreground/70">{e.period}</div>
                      <div className="text-sm font-semibold text-foreground">{e.role}</div>
                      <div className="text-xs text-muted-foreground">{e.org}</div>
                    </li>
                  ))}
                  {view.education.map((e, i) => (
                    <li key={`e${i}`} className="relative pl-5">
                      <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary/50" />
                      <div className="text-xs font-semibold text-muted-foreground/70">{e.year}</div>
                      <div className="text-sm font-semibold text-foreground">{e.degree}</div>
                      <div className="text-xs text-muted-foreground">{e.school}</div>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
          </div>

          {/* ── Content column ── */}
          <div className="flex min-w-0 flex-col gap-6">
            {view.headline_story && (
              <div className="flex items-center gap-4 rounded-xl border border-success/20 bg-success-soft px-5 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                  <TrendingUp className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-success">
                    Highlight
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold text-foreground">
                    {view.headline_story}
                  </p>
                </div>
              </div>
            )}

            <Panel
              title="Verified capabilities"
              subtitle="Demonstrated capability derived from evaluated actions"
            >
              {view.capabilities.length === 0 ? (
                <EmptyState
                  title="No verified capabilities yet"
                  body={
                    isOwner
                      ? "Create an Action and invite someone to evaluate it — capabilities appear here once they do."
                      : "This profile has no evaluated capabilities yet."
                  }
                  cta={isOwner ? { label: "Create an Action", href: "/s/actions/create" } : undefined}
                />
              ) : (
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {view.capabilities.map((d, i) => (
                    <div
                      key={d.capability_id}
                      className="flex items-center gap-3 border-b border-muted pb-3 last:border-0 sm:nth-last-2:border-0"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {i === 0 ? (
                          <Star className="size-4 fill-current" />
                        ) : (
                          <span className="text-sm font-semibold tabular-nums">{i + 1}</span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{d.name}</span>
                          {d.provisional && (
                            <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning-foreground/80">
                              Provisional
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground/70">
                          based on {d.evaluatedActions} evaluation
                          {d.evaluatedActions === 1 ? "" : "s"}
                        </div>
                      </div>
                      <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                        {d.value.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {view.contributions.length > 0 && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                <Panel title="Top Evaluated Contributions" subtitle="Real work, independently evaluated">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {view.contributions.map((c) => (
                      <ContributionCard key={c.action_id} c={c} />
                    ))}
                  </div>
                </Panel>

                <Panel title="Evaluation Timeline">
                  <ol className="space-y-4">
                    {view.timeline.map((t, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                          {t.score.toFixed(1)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-snug text-foreground">{t.title}</div>
                          <div className="text-xs text-muted-foreground/70">{t.date}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>
            )}

            {view.capabilities.length > 0 && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel title="Capability radar" subtitle="The same scores, as a shape">
                  <div className="flex flex-col items-center">
                    <RadarChart data={view.capabilities.map((c) => ({ label: c.name, value: c.value }))} />
                    <p className="mt-3 text-[11px] text-muted-foreground/70">
                      Scored {SCORE_MIN}–{SCORE_MAX} through evaluated work
                    </p>
                  </div>
                </Panel>

                <Panel title="Capability growth" subtitle="Score over your evaluations">
                  <GrowthPanel view={view} />
                </Panel>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-4 border-t bg-primary/5 print:hidden">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-5">
          <span className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="size-4 text-success" />
              Evaluations are independently verifiable
            </span>
            <span className="pl-6 text-xs text-muted-foreground">
              Capabilities are derived from evaluated actions, not self-reported claims
            </span>
          </span>
          <span className="text-sm text-muted-foreground/70">
            talent3x.com<span className="text-border"> · </span>
            <span className="text-muted-foreground">/p/{view.slug}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Identity + editing                                                 */
/* ------------------------------------------------------------------ */

function IdentityBlock({
  view,
  editable,
  onAvatar,
}: {
  view: ProfileView;
  editable: boolean;
  onAvatar: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { basics } = view;

  const pick = (file: File) => {
    if (file.size > 1024 * 1024) return; // ~1 MB cap for the localStorage stub
    const reader = new FileReader();
    reader.onload = () => onAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="relative w-fit">
        {basics.avatarDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={basics.avatarDataUrl}
            alt={basics.name}
            className="size-24 rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-xl bg-ink text-3xl font-bold text-ink-foreground">
            {initialsOf(basics.name)}
          </div>
        )}
        <span
          className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-success text-white ring-2 ring-card"
          title="Verified profile"
        >
          <BadgeCheck className="size-4" strokeWidth={2.2} />
        </span>
        {editable && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute -left-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card"
              aria-label="Change photo"
            >
              <Upload className="size-3.5" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pick(f);
              }}
            />
          </>
        )}
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{basics.name || "Your name"}</h1>
      {basics.headline && (
        <p className="mt-1 text-sm font-medium text-primary">{basics.headline}</p>
      )}
      {view.university && (
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <GraduationCap className="size-4 shrink-0" />
          {view.university}
        </div>
      )}
      <div className="text-sm text-muted-foreground">{view.role}</div>
    </>
  );
}

function EditBasics({
  view,
  onSave,
}: {
  view: ProfileView;
  onSave: (b: Partial<ProfileBasics>) => void;
}) {
  const [name, setName] = useState(view.basics.name);
  const [headline, setHeadline] = useState(view.basics.headline);
  const [bio, setBio] = useState(view.basics.bio);

  return (
    <div className="mt-4 space-y-2 rounded-lg border bg-background p-3">
      <Field label="Name" value={name} onChange={setName} />
      <Field label="Headline" value={headline} onChange={setHeadline} />
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <Button size="sm" className="w-full" onClick={() => onSave({ name, headline, bio })}>
        <Check /> Save
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives (surface recipe S1/S4)                                  */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border bg-card p-6 shadow-card ${className}`}>
      {title && (
        <header className="mb-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground/70">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

function Tile({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "success";
}) {
  return (
    <div className={`rounded-lg px-1 py-2.5 ${tone === "success" ? "bg-success-soft" : "bg-primary-soft"}`}>
      <div
        className={`flex items-center justify-center gap-1 text-xl font-bold tabular-nums leading-tight ${
          tone === "success" ? "text-success" : ""
        }`}
      >
        {tone === "success" && <BadgeCheck className="size-4" strokeWidth={2.4} />}
        {value}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </div>
    </div>
  );
}

function ContributionCard({ c }: { c: ProfileView["contributions"][number] }) {
  return (
    <article className="card-interactive cursor-pointer rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-foreground">{c.title}</h3>
          <div className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-primary">
            <Star className="size-4 fill-current" />
            {c.score.toFixed(1)}
            <span className="font-normal text-muted-foreground/70">/ {SCORE_MAX}</span>
          </div>
        </div>
      </div>
      <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
        <div>
          Evaluated by: <span className="font-medium text-foreground/80">{c.evaluatedBy}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3" />
          {c.date}
          {c.difficulty && (
            <span className="ml-1 inline-flex rounded-md border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {c.difficulty}
            </span>
          )}
        </div>
      </div>
      {c.capabilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.capabilities.map((n) => (
            <span
              key={n}
              className="rounded-md bg-badge-blue-bg px-2 py-0.5 text-[11px] font-medium text-badge-blue-text"
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Star className="size-6" />
      </span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-[360px] text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Button className="mt-4" asChild>
          <a href={cta.href}>{cta.label}</a>
        </Button>
      )}
    </div>
  );
}

/* Radar chart — dependency-free SVG (compact; legend is the ranked list). */
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 3) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground/70">
        The radar appears once you have 3+ capabilities.
      </p>
    );
  }
  const W = 240, H = 240, cx = W / 2, cy = H / 2, R = 105, max = SCORE_MAX, n = data.length;
  const pointAt = (i: number, r: number) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ring = (lvl: number) => data.map((_, i) => pointAt(i, (R * lvl) / max).join(",")).join(" ");
  const poly = data.map((d, i) => pointAt(i, (R * d.value) / max).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[200px]" role="img" aria-label="Capability radar">
      {[1, 2, 3, 4, 5].map((lvl) => (
        <polygon key={lvl} points={ring(lvl)} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {data.map((_, i) => {
        const [x, y] = pointAt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />;
      })}
      <polygon points={poly} fill="var(--primary)" fillOpacity={0.14} stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = pointAt(i, (R * d.value) / max);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--primary)" />;
      })}
    </svg>
  );
}

/* Growth — dependency-free SVG sparkline of the top capability's trend. */
function GrowthPanel({ view }: { view: ProfileView }) {
  const g = view.growth.find((x) => x.points.length >= 2);
  if (!g) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground/70">
        Your growth trend appears once a capability has 2+ evaluations.
      </p>
    );
  }
  const W = 280, H = 90, pad = 8;
  const xs = g.points.map((_, i) => pad + (i * (W - 2 * pad)) / (g.points.length - 1));
  const ys = g.points.map((p) => H - pad - (p.value / SCORE_MAX) * (H - 2 * pad));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const last = g.points[g.points.length - 1].value;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{g.name}</span>
        <span className="text-sm font-semibold tabular-nums text-primary">{last.toFixed(1)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-auto w-full" role="img" aria-label={`${g.name} growth`}>
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={3} fill="var(--primary)" />
        ))}
      </svg>
      <p className="mt-1 text-[11px] text-muted-foreground/70">
        {g.points.length} evaluation{g.points.length === 1 ? "" : "s"} over time
      </p>
    </div>
  );
}
