/**
 * Profile Studio — Desktop View (design preview)
 * ------------------------------------------------------------------
 * Week-1 proof that the frozen UI system can render the Week-5 hero
 * surface. Mock data (André Pager); NOT wired to Supabase yet.
 *
 * Applies the resolved decisions:
 *  - D1  Brand = blue #2563EB (chrome only). Green #10B981 = verified/trust.
 *        Purple reserved for AI (not used here). NB: authored with the
 *        FIXED button look (blue solid / blue outline), not the broken
 *        purple-gradient default variant.
 *  - D2  Light-only. No .dark dependency.
 *  - D3  Vocabulary: "Capabilities" (one noun), "Evaluations", "Actions";
 *        "Contribution" = evaluated work as displayed on a profile.
 *        The old "Key Skills" panel is now "Demonstrated Capabilities"
 *        (legacy skills map to capabilities per the 25-June feedback doc).
 *  - D4  Public-projection archetype: chromeless top bar, no app sidebar.
 *  - D5  Consumer-light density (pride-first), one component set.
 *
 * Trust (Rule 3) is made visible: verified seal, evaluation/educator
 * counts, "independently verifiable" footer.
 * Data tells a story (Rule 4): narrative line, not bare numbers.
 */

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
  TrendingUp,
} from "lucide-react";

import { mockEvaluationConfig } from "@/lib/verification/mock-config";

/* ------------------------------------------------------------------ */
/* Mock data (Klenis Arapaj — from the Desktop View mockup)             */
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
    org: "Quinnipiac University",
    date: "Apr 2026",
    score: 4.5,
    difficulty: "Advanced",
  },
  {
    title: "Strategy Presentation & Defense",
    org: "Quinnipiac University",
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
// (The old "1 Foundational … 5 Expert" legend conflated difficulty labels
// with scores and predates the 0–5 scale; public-facing display labels are
// an open question for the verification layer.)
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
    <section
      className={`rounded-xl border border-[#E2E8F0] bg-white p-6 ${className}`}
    >
      {title && (
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
              {title}
            </h2>
            {action && (
              <button className="text-xs font-medium text-[#2563EB] hover:underline">
                {action}
              </button>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-[#94A3B8]">{subtitle}</p>
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
        <span className="text-sm font-medium text-[#111827]">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-[#111827]">
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
        <div
          className="h-full rounded-full bg-[#2563EB]"
          style={{ width: `${(value / SCORE_MAX) * 100}%` }}
        />
      </div>
      {evaluatedActions !== undefined && (
        <p className="mt-1 text-[11px] text-[#94A3B8]">
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
    <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-semibold text-[#059669] ring-1 ring-[#A7F3D0]">
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
          stroke="#E2E8F0"
          strokeWidth={1}
        />
      ))}
      {/* axes */}
      {data.map((_, i) => {
        const [x, y] = pointAt(i, R);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E2E8F0" strokeWidth={1} />
        );
      })}
      {/* value polygon */}
      <polygon
        points={valuePolygon}
        fill="#2563EB"
        fillOpacity={0.14}
        stroke="#2563EB"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* value dots */}
      {data.map((d, i) => {
        const [x, y] = pointAt(i, (R * d.value) / max);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#2563EB" />;
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
            className="fill-[#475569]"
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      {/* Top bar — public-projection chrome (D4): no app sidebar */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/90 px-8 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-[#22B8CF] to-[#2563EB] text-sm font-bold text-white">
            X
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Talent3X
          </span>
          <span className="ml-1 text-sm font-medium text-[#94A3B8]">
            Profile Studio
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC]">
            <Pencil className="size-4" /> Edit
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC]">
            <Share2 className="size-4" /> Share
          </button>
          {/* primary action — the FROZEN blue button (D1 fix) */}
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]">
            <FileDown className="size-4" /> Export PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-8 py-8">
        {/* Hero row: identity + headline story (Rule 4 + Rule 3) */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-5">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#2563EB] to-[#1E40AF] text-2xl font-bold text-white">
              {profile.initials}
            </div>
            <div className="pt-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.name}
                </h1>
                <VerifiedSeal />
              </div>
              <p className="mt-0.5 text-[15px] font-medium text-[#2563EB]">
                {profile.title}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-[#64748B]">
                <GraduationCap className="size-4" />
                {profile.university}
                <span className="mx-1 text-[#CBD5E1]">·</span>
                {profile.role}
              </div>
              {/* Rule 4 — story, not a bare number */}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#ECFDF5] px-3 py-1.5 text-sm font-medium text-[#047857]">
                <TrendingUp className="size-4" />
                {profile.headlineStory}
              </div>
            </div>
          </div>

          {/* Trust counts (Rule 3) */}
          <div className="flex items-center gap-8 rounded-xl border border-[#E2E8F0] bg-white px-7 py-4">
            {[
              { label: "Evaluations", value: profile.evaluations },
              { label: "Educators", value: profile.educators },
              { label: "Verified", value: profile.verifiedContributions },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main grid: left rail / radar / contributions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr_320px]">
          {/* Left rail: bio + experience */}
          <div className="flex flex-col gap-6">
            <Panel>
              <p className="border-l-2 border-[#2563EB] pl-3 text-sm italic leading-relaxed text-[#475569]">
                “{profile.bio}”
              </p>
            </Panel>
            {/* Credentials & Experience — informational only, never scored,
                never in the radar (18-June adjustments §1). */}
            <Panel title="Credentials & Experience">
              <ol className="space-y-5">
                {experience.map((e) => (
                  <li key={e.year} className="relative pl-5">
                    <span className="absolute left-0 top-1.5 size-2 rounded-full bg-[#2563EB]" />
                    <div className="text-xs font-semibold text-[#94A3B8]">
                      {e.year}
                    </div>
                    <div className="text-sm font-semibold text-[#111827]">
                      {e.role}
                    </div>
                    <div className="text-xs text-[#64748B]">{e.org}</div>
                    <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                      {e.note}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          {/* Center: radar */}
          <Panel
            title="Capability based on evaluated work"
            subtitle="Demonstrated capability derived from evaluated actions"
            action="View all"
          >
            <div className="flex flex-col items-center">
              <RadarChart data={radar} />
              <p className="mt-4 text-[11px] text-[#94A3B8]">
                Scored {SCORE_MIN}–{SCORE_MAX} through evaluated work
              </p>
            </div>
          </Panel>

          {/* Right: top evaluated contributions */}
          <Panel title="Top Evaluated Contributions" action="View all">
            <div className="space-y-3">
              {contributions.map((c) => (
                <article
                  key={c.title}
                  className="rounded-lg border border-[#E2E8F0] p-4 transition-colors hover:border-[#2563EB]/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug text-[#111827]">
                        {c.title}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B]">
                        <Calendar className="size-3" />
                        {c.date}
                        <span className="text-[#CBD5E1]">·</span>
                        {c.org}
                      </div>
                      {/* Difficulty badge (18-June adjustments §3); label from config.difficultyLevels */}
                      <span className="mt-1.5 inline-flex rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">
                        {c.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111827]">
                      {c.score.toFixed(1)}
                      <span className="text-xs font-normal text-[#94A3B8]">
                        / 5
                      </span>
                    </span>
                    <VerifiedSeal />
                  </div>
                  <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline">
                    View work <ExternalLink className="size-3" />
                  </button>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        {/* Bottom row: three views of verified capability */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-semibold text-[#2563EB]">
                    {t.score.toFixed(1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug text-[#111827]">
                      {t.title}
                    </div>
                    <div className="text-xs text-[#94A3B8]">{t.date}</div>
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
      </main>

      {/* Footer — trust anchor (Rule 3) */}
      <footer className="mt-4 border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-5">
          <span className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#475569]">
              <ShieldCheck className="size-4 text-[#10B981]" />
              Evaluations are independently verifiable
            </span>
            <span className="pl-6 text-xs text-[#94A3B8]">
              Capabilities are derived from evaluated actions, not self-reported claims
            </span>
          </span>
          <span className="text-sm text-[#94A3B8]">
            talent3x.com<span className="text-[#CBD5E1]"> · </span>
            <span className="text-[#64748B]">/p/{profile.slug}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
