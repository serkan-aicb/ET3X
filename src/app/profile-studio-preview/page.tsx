/**
 * Profile Studio — Desktop View (design preview)
 * ------------------------------------------------------------------
 * Week-1 proof that the frozen UI system can render the Week-5 hero
 * surface. Mock data; NOT wired to Supabase yet.
 *
 * Layout follows the 260501 mockup (9-July grill Q1): identity lives in
 * the LEFT RAIL (avatar → name → trust counts → bio → credentials →
 * Share/Export list buttons); the content column carries the headline
 * story banner, radar + contributions, and the three capability panels.
 *
 * Other decisions encoded (workspace docs 10–12):
 *  - Tokens only; public-projection archetype; ink hero CTA.
 *  - Contribution cards: ★ score, "Evaluated by:", outline View Work
 *    button (mockup treatment) + difficulty badge + verified seal.
 *  - Score scale 0–5 from verification-layer config, never hardcoded.
 *  - Motion on clickable cards only.
 */

import Image from "next/image";
import {
  BadgeCheck,
  Calendar,
  ExternalLink,
  FileDown,
  FileText,
  GraduationCap,
  Pencil,
  Share2,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { mockEvaluationConfig } from "@/lib/verification/mock-config";

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */

const profile = {
  name: "Klenis Arapaj",
  title: "Blockchain Strategy & Implementation",
  university: "Quinnipiac University",
  role: "Student / Analyst",
  initials: "KA",
  slug: "klenis-arapaj",
  bio: "Focused on strategy, implementation, and evaluation of blockchain systems.",
  // Rule 3 — trust at a glance
  evaluations: 12,
  educators: 4,
  verifiedContributions: 8,
  // Rule 4 — the one story line that frames the data
  headlineStory: "Strategy Development improved 18% over the last 90 days.",
};

// Radar axes — the verified Capabilities (scored 0–5, per config.scoreScale)
const radar = [
  { label: "Strategy Dev.", value: 4.6 },
  { label: "Communication", value: 4.5 },
  { label: "Implementation", value: 4.0 },
  { label: "Problem Solving", value: 3.8 },
  { label: "Analytical Thinking", value: 4.2 },
  { label: "Leadership", value: 3.6 },
];

// Evidence counts per the 18-June Profile Studio adjustments (§5).
const topCapabilities = [
  { label: "Strategy Development", value: 4.6, evaluatedActions: 3 },
  { label: "Communication", value: 4.5, evaluatedActions: 2 },
  { label: "Analytical Thinking", value: 4.2, evaluatedActions: 4 },
];

// Was "Key Skills (from evaluations)" — legacy skills map to capabilities,
// so this is the complete evidence-backed capability list (top panel = top 3).
const demonstratedCapabilities = [
  { label: "Strategic Planning", value: 4.5, evaluatedActions: 2 },
  { label: "Data Analysis", value: 4.3, evaluatedActions: 3 },
  { label: "Blockchain Technology", value: 4.6, evaluatedActions: 2 },
  { label: "Financial Modeling", value: 4.1, evaluatedActions: 1 },
  { label: "Project Management", value: 3.9, evaluatedActions: 2 },
];

// Difficulty labels come from config.difficultyLevels in the real build.
const contributions = [
  {
    title: "Blockchain Strategic Implementation White Paper",
    evaluatedBy: "Quinnipiac University",
    date: "Apr 2026",
    score: 4.5,
    difficulty: "Advanced",
  },
  {
    title: "Strategy Presentation & Defense",
    evaluatedBy: "Quinnipiac University",
    date: "Apr 2026",
    score: 4.4,
    difficulty: "Intermediate",
  },
];

const timeline = [
  { date: "Apr 2026", title: "Blockchain Strategic Implementation White Paper", score: 4.5 },
  { date: "Mar 2026", title: "Market Analysis Project", score: 4.3 },
  { date: "Feb 2026", title: "Financial Modeling Assignment", score: 4.2 },
];

const experience = [
  {
    year: "2026",
    role: "Blockchain Strategy Intern",
    org: "Chainlabs Research",
    note: "Advanced research, analysis and implementation projects.",
  },
  {
    year: "2025",
    role: "Finance & Strategy Internship",
    org: "XYZ Capital Partners",
    note: "Market analysis, financial modeling and strategy reporting.",
  },
  {
    year: "2024",
    role: "Business Foundations",
    org: "Quinnipiac University",
    note: "Business strategy, accounting and data analysis.",
  },
];

// Score bounds derive from the verification-layer config — never hardcoded.
const scoreValues = mockEvaluationConfig.scoreScale.map((s) => s.value);
const SCORE_MIN = Math.min(...scoreValues);
const SCORE_MAX = Math.max(...scoreValues);

/* ------------------------------------------------------------------ */
/* Primitives (frozen look: rounded-xl, flat bordered card)           */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border bg-card p-6 ${className}`}>
      {title && (
        <header className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h2>
            {action && (
              <button className="shrink-0 whitespace-nowrap text-xs font-medium text-primary hover:underline">
                {action}
              </button>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

function ScoreBar({
  label,
  value,
  evaluatedActions,
}: {
  label: string;
  value: number;
  evaluatedActions?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(value / SCORE_MAX) * 100}%` }}
        />
      </div>
      {evaluatedActions !== undefined && (
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          based on {evaluatedActions} evaluated{" "}
          {evaluatedActions === 1 ? "action" : "actions"}
        </p>
      )}
    </div>
  );
}

/* Verified seal — the green trust mark (D1: green carries verification) */
function VerifiedSeal({ label = "Verified" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success ring-1 ring-success/25">
      <BadgeCheck className="size-3.5" strokeWidth={2.2} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Radar chart (dependency-free SVG)                                  */
/* ------------------------------------------------------------------ */

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  // viewBox is wider than the plot so axis labels always fit (never clip).
  const W = 480;
  const H = 380;
  const cx = W / 2;
  const cy = H / 2;
  const R = 108;
  const labelR = R + 20;
  const lineH = 13;
  const max = SCORE_MAX;
  const n = data.length;

  const pointAt = (i: number, r: number) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const ringPolygon = (level: number) =>
    data
      .map((_, i) => pointAt(i, (R * level) / max).join(","))
      .join(" ");

  const valuePolygon = data
    .map((d, i) => pointAt(i, (R * d.value) / max).join(","))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full max-w-[440px]"
      role="img"
      aria-label="Capability radar based on evaluated work"
    >
      {/* grid rings */}
      {[1, 2, 3, 4, 5].map((level) => (
        <polygon
          key={level}
          points={ringPolygon(level)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {/* axes */}
      {data.map((_, i) => {
        const [x, y] = pointAt(i, R);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth={1}
          />
        );
      })}
      {/* value polygon */}
      <polygon
        points={valuePolygon}
        fill="var(--primary)"
        fillOpacity={0.14}
        stroke="var(--primary)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* value dots */}
      {data.map((d, i) => {
        const [x, y] = pointAt(i, (R * d.value) / max);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--primary)" />;
      })}
      {/* labels — placed inside the viewBox; long ones wrap to 2 lines */}
      {data.map((d, i) => {
        const [x, y] = pointAt(i, labelR);
        const anchor =
          Math.abs(x - cx) < 12 ? "middle" : x > cx ? "start" : "end";
        const words = d.label.split(" ");
        const startY = y - ((words.length - 1) * lineH) / 2;
        return (
          <text
            key={i}
            x={x}
            y={startY}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={11}
            fontWeight={500}
          >
            {words.map((w, wi) => (
              <tspan key={wi} x={x} dy={wi === 0 ? 0 : lineH}>
                {w}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfileStudioPreview() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar — public-projection chrome (D4): real logo, no app sidebar */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/90 px-8 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Image
            src="/pics/logo-mark.png"
            alt="Talent3X"
            width={32}
            height={32}
            className="size-8"
          />
          <span className="text-[15px] font-semibold tracking-tight">
            Talent3X
          </span>
          <span className="ml-1 text-sm font-medium text-muted-foreground/70">
            Profile Studio
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline">
            <Pencil /> Edit
          </Button>
          <Button variant="outline">
            <Share2 /> Share
          </Button>
          {/* single ink hero CTA — the one sanctioned navy button (T4) */}
          <Button variant="ink">
            <FileDown /> Export PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-8 py-8">
        {/* 260501 layout: identity rail | content column */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* ── Left rail: identity → trust → bio → credentials → actions ── */}
          <div className="flex flex-col gap-6">
            <Panel>
              <div className="flex size-20 items-center justify-center rounded-2xl bg-ink text-2xl font-bold text-ink-foreground">
                {profile.initials}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  {profile.name}
                </h1>
                <VerifiedSeal />
              </div>
              <p className="mt-1 text-sm font-medium text-primary">
                {profile.title}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <GraduationCap className="size-4 shrink-0" />
                {profile.university}
              </div>
              <div className="text-sm text-muted-foreground">{profile.role}</div>

              {/* Trust counts (Rule 3) — compact rail row */}
              <div className="mt-4 grid grid-cols-3 divide-x rounded-lg border bg-background py-2.5 text-center">
                {[
                  { label: "Evaluations", value: profile.evaluations },
                  { label: "Educators", value: profile.educators },
                  { label: "Verified", value: profile.verifiedContributions },
                ].map((s) => (
                  <div key={s.label} className="px-1">
                    <div className="text-lg font-bold tabular-nums leading-tight">
                      {s.value}
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bio quote — light-blue box per 260501 */}
              <p className="mt-4 rounded-lg bg-primary/5 p-3 text-sm italic leading-relaxed text-muted-foreground">
                “{profile.bio}”
              </p>
            </Panel>

            {/* Credentials & Experience — informational only, never scored,
                never in the radar (18-June adjustments §1). */}
            <Panel title="Credentials & Experience">
              <ol className="space-y-5">
                {experience.map((e) => (
                  <li key={e.year} className="relative pl-5">
                    <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" />
                    <div className="text-xs font-semibold text-muted-foreground/70">
                      {e.year}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {e.role}
                    </div>
                    <div className="text-xs text-muted-foreground">{e.org}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">
                      {e.note}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>

            {/* Rail-bottom quick actions per 260501 */}
            <Panel className="p-2">
              <button className="row-interactive flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-primary">
                <Share2 className="size-4" /> Share Profile
              </button>
              <button className="row-interactive flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-primary">
                <FileDown className="size-4" /> Export as PDF
              </button>
            </Panel>
          </div>

          {/* ── Content column ── */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Rule 4 — headline story banner */}
            <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
              <TrendingUp className="size-4 shrink-0" />
              {profile.headlineStory}
            </div>

            {/* Radar + contributions */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
              <Panel
                title="Capability based on evaluated work"
                subtitle="Demonstrated capability derived from evaluated actions"
                action="View all"
              >
                <div className="flex flex-col items-center">
                  <RadarChart data={radar} />
                  <p className="mt-4 text-[11px] text-muted-foreground/70">
                    Scored {SCORE_MIN}–{SCORE_MAX} through evaluated work
                  </p>
                </div>
              </Panel>

              <Panel title="Top Evaluated Contributions" action="View all">
                <div className="space-y-3">
                  {contributions.map((c) => (
                    <article
                      key={c.title}
                      className="card-interactive cursor-pointer rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold leading-snug text-foreground">
                            {c.title}
                          </h3>
                          {/* ★ score — 260501 treatment */}
                          <div className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-primary">
                            <Star className="size-4 fill-current" />
                            {c.score.toFixed(1)}
                            <span className="font-normal text-muted-foreground/70">
                              / {SCORE_MAX}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                        <div>
                          Evaluated by:{" "}
                          <span className="font-medium text-foreground/80">
                            {c.evaluatedBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3" />
                          {c.date}
                          {/* Difficulty badge (18-June §3); label from config.difficultyLevels */}
                          <span className="ml-1 inline-flex rounded-md border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {c.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <VerifiedSeal />
                        <Button variant="outline" size="sm">
                          View Work <ExternalLink />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Bottom row: three views of verified capability */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Panel title="Top Verified Capabilities" action="View all">
                <div className="space-y-4">
                  {topCapabilities.map((c) => (
                    <ScoreBar key={c.label} {...c} />
                  ))}
                </div>
              </Panel>

              <Panel title="Evaluation Timeline" action="View all">
                <ol className="space-y-4">
                  {timeline.map((t) => (
                    <li key={t.title} className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                        {t.score.toFixed(1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-snug text-foreground">
                          {t.title}
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                          {t.date}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel title="Demonstrated Capabilities" action="View all">
                <div className="space-y-4">
                  {demonstratedCapabilities.map((c) => (
                    <ScoreBar key={c.label} {...c} />
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </main>

      {/* Footer — trust anchor (Rule 3): light-blue band per T8/260501 */}
      <footer className="mt-4 border-t bg-primary/5">
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
          <span className="flex flex-col items-end gap-0.5">
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Learn more about verification <ExternalLink className="size-3" />
            </button>
            <span className="text-sm text-muted-foreground/70">
              talent3x.com<span className="text-border"> · </span>
              <span className="text-muted-foreground">/p/{profile.slug}</span>
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
