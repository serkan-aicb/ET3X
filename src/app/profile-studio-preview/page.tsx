/**
 * Profile — Desktop View (design preview)
 * ------------------------------------------------------------------
 * Week-1 proof that the frozen UI system can render the Week-5 hero
 * surface. Mock data; NOT wired to Supabase yet.
 *
 * Layout follows the 260501 mockup (9-July grill Q1): identity lives in
 * the LEFT RAIL (avatar → name → trust tiles → bio → credentials →
 * profile facts); the content column runs the 13-July prototype WINNER
 * (variant B): ranked score-list leads, contributions + timeline next,
 * capability radar demoted to a small supporting card at the bottom.
 * The rail's Share/Export quick actions were dropped — they duplicate
 * the top-bar actions. Deviation from the 260501 mockup's radar-hero
 * hierarchy — flag to André with the other Thursday items.
 *
 * Other decisions encoded (workspace docs 10–12): tokens only;
 * public-projection archetype; score scale from verification config;
 * motion on clickable cards only.
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
  Star,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TopBar, TopBarBrand } from "@/components/ui/top-bar";
import { SCORE_MIN, SCORE_MAX } from "@/lib/catalogue";

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

// "Profile facts" rail card (13-July review; MovHR label/value inspiration)
const profileFacts = [
  { label: "Last evaluated", value: "Apr 2026" },
  { label: "Evaluating org", value: "Quinnipiac University" },
  { label: "Actions scored", value: "8 of 12" },
  { label: "Public link", value: `/p/klenis-arapaj`, link: true },
];

// The verified Capabilities (scored 0–5, per config.scoreScale) with
// evidence counts (18-June §5). Rendered as the ranked score list AND
// as the radar shape.
const capabilities = [
  { label: "Strategy Dev.", value: 4.6, evaluatedActions: 3 },
  { label: "Communication", value: 4.5, evaluatedActions: 2 },
  { label: "Implementation", value: 4.0, evaluatedActions: 2 },
  { label: "Problem Solving", value: 3.8, evaluatedActions: 2 },
  { label: "Analytical Thinking", value: 4.2, evaluatedActions: 4 },
  { label: "Leadership", value: 3.6, evaluatedActions: 2 },
];

// Was "Key Skills (from evaluations)" — legacy skills map to capabilities,
// so this is the complete evidence-backed capability list.
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

// Score bounds come from the catalogue (scoring_policy) — never hardcoded.

const rankedCapabilities = [...capabilities].sort((a, b) => b.value - a.value);

/* ------------------------------------------------------------------ */
/* Primitives (surface recipe S1/S4: rounded-xl, border, whisper shadow) */
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
    <section className={`rounded-xl border bg-card p-6 shadow-card ${className}`}>
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

/* Contribution card — mockup treatment (P2): ★ score, attribution,
   difficulty badge, verified seal, outline View Work */
function ContributionCard({
  contribution: c,
}: {
  contribution: (typeof contributions)[number];
}) {
  return (
    <article className="card-interactive cursor-pointer rounded-lg border bg-card p-4">
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
          <span className="font-medium text-foreground/80">{c.evaluatedBy}</span>
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
  );
}

/* ------------------------------------------------------------------ */
/* Radar chart (dependency-free SVG, compact: legend lives outside)   */
/* ------------------------------------------------------------------ */

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  // Compact treatment (13-July review): no in-chart labels — the ranked
  // score list carries them — and a tight viewBox so the shape stays calm.
  const W = 240;
  const H = 240;
  const cx = W / 2;
  const cy = H / 2;
  const R = 105;
  const max = SCORE_MAX;
  const n = data.length;

  const pointAt = (i: number, r: number) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const ringPolygon = (level: number) =>
    data.map((_, i) => pointAt(i, (R * level) / max).join(",")).join(" ");

  const valuePolygon = data
    .map((d, i) => pointAt(i, (R * d.value) / max).join(","))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full max-w-[200px]"
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
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfileStudioPreview() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar — public-projection chrome (D4, S6/S7): ink bar, no sidebar */}
      <TopBar>
        {/* Public-facing label is "Profile" (13-July review); "Profile Studio"
            remains the internal feature name in team docs (André, Week 5). */}
        <TopBarBrand context="Profile" />
        <div className="flex items-center gap-2.5">
          <Button variant="inverse-outline">
            <Pencil /> Edit
          </Button>
          <Button variant="inverse-outline">
            <Share2 /> Share
          </Button>
          {/* single hero CTA — inverse (white) now that the bar itself is ink */}
          <Button variant="inverse">
            <FileDown /> Export PDF
          </Button>
        </div>
      </TopBar>

      <main className="mx-auto max-w-[1240px] px-8 py-8">
        {/* 260501 layout: identity rail | content column */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* ── Left rail: identity → trust → bio → credentials → facts ── */}
          <div className="flex flex-col gap-6">
            <Panel>
              {/* Identity moment (13-July review): larger avatar with the
                  verified chip ON it, bigger name — the person leads. */}
              <div className="relative w-fit">
                <div className="flex size-24 items-center justify-center rounded-xl bg-ink text-3xl font-bold text-ink-foreground">
                  {profile.initials}
                </div>
                <span
                  className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-success text-white ring-2 ring-card"
                  title="Verified profile"
                >
                  <BadgeCheck className="size-4" strokeWidth={2.2} />
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                {profile.name}
              </h1>
              <p className="mt-1 text-sm font-medium text-primary">
                {profile.title}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <GraduationCap className="size-4 shrink-0" />
                {profile.university}
              </div>
              <div className="text-sm text-muted-foreground">{profile.role}</div>

              {/* Trust counts (Rule 3) — semantic stat tiles: the receipts
                  read as credentials, verified carries the trust green */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-primary-soft px-1 py-2.5">
                  <div className="text-xl font-bold tabular-nums leading-tight">
                    {profile.evaluations}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    Evaluations
                  </div>
                </div>
                <div className="rounded-lg bg-primary-soft px-1 py-2.5">
                  <div className="text-xl font-bold tabular-nums leading-tight">
                    {profile.educators}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    Educators
                  </div>
                </div>
                <div className="rounded-lg bg-success-soft px-1 py-2.5">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold tabular-nums leading-tight text-success">
                    <BadgeCheck className="size-4" strokeWidth={2.4} />
                    {profile.verifiedContributions}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    Verified
                  </div>
                </div>
              </div>

              {/* Bio quote — light-blue box per 260501 */}
              <p className="mt-4 rounded-lg bg-primary-soft p-3 text-sm italic leading-relaxed text-muted-foreground">
                “{profile.bio}”
              </p>

              {/* Badge footer (MovHR detail): membership + public address */}
              <div className="mt-4 border-t pt-3 text-[11px] text-muted-foreground/70">
                Member since 2026 · talent3x.com/p/{profile.slug}
              </div>
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

            {/* Profile facts — label/value rows balance the rail height.
                (Share/Export quick actions removed 13 July: they duplicate
                the top-bar actions.) */}
            <Panel title="Profile facts">
              <dl className="space-y-3.5">
                {profileFacts.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <dt className="shrink-0 text-xs text-muted-foreground">
                      {f.label}
                    </dt>
                    <dd
                      className={`min-w-0 truncate text-sm font-medium ${
                        f.link ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>

          {/* ── Content column — prototype winner B: score list leads ── */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Rule 4 — headline story as a Highlight card */}
            <div className="flex items-center gap-4 rounded-xl border border-success/20 bg-success-soft px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                <TrendingUp className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-success">
                  Highlight · last 90 days
                </p>
                <p className="mt-0.5 text-[15px] font-semibold text-foreground">
                  {profile.headlineStory}
                </p>
              </div>
            </div>

            {/* Ranked score list — 260501's badge-pill row treatment,
                promoted to the lead panel (prototype winner) */}
            <Panel
              title="Verified capabilities"
              subtitle="Demonstrated capability derived from evaluated actions"
              action="View all"
            >
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {rankedCapabilities.map((d, i) => (
                  <div
                    key={d.label}
                    /* border under every row except the grid's last two
                       (= the visual last row on sm+); on mobile only the
                       true last child drops it */
                    className="flex items-center gap-3 border-b border-muted pb-3 last:border-0 sm:nth-last-2:border-0"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {i === 0 ? (
                        <Star className="size-4 fill-current" />
                      ) : (
                        <span className="text-sm font-semibold tabular-nums">
                          {i + 1}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{d.label}</div>
                      <div className="text-[11px] text-muted-foreground/70">
                        based on {d.evaluatedActions} evaluated{" "}
                        {d.evaluatedActions === 1 ? "action" : "actions"}
                      </div>
                    </div>
                    <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                      {d.value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Work + history */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
              <Panel
                title="Top Evaluated Contributions"
                subtitle="Real work, independently evaluated"
                action="View all"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {contributions.map((c) => (
                    <ContributionCard key={c.title} contribution={c} />
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
            </div>

            {/* Supporting row: the radar survives as a small optional view */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel title="Capability radar" subtitle="The same scores, as a shape">
                <div className="flex flex-col items-center">
                  <RadarChart data={capabilities} />
                  <p className="mt-3 text-[11px] text-muted-foreground/70">
                    Scored {SCORE_MIN}–{SCORE_MAX} through evaluated work
                  </p>
                </div>
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
