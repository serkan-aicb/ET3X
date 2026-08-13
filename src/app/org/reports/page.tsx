"use client";

/**
 * Org Reports (v1.7 §12 org_viewer). A reporting hub over the governed org data:
 * pick a report type, preview it live from the same package-gated / k-anon-safe
 * aggregates, and Export PDF (client-side print). Frozen build — "generate",
 * "schedule" and the recent-reports list are illustrative.
 * admin ≠ analyst: administrators are restricted (reports contain scores).
 */

import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  PieChart,
  Users,
  User,
  TrendingUp,
  ClipboardCheck,
  ChevronRight,
  CalendarClock,
  Layers,
  Star,
  Share2,
  Sparkles,
  Lock,
} from "lucide-react";

import { OrgShell } from "@/components/org/org-shell";
import { StatTile, BarList, Donut, Legend, MultiLine } from "@/components/org/charts";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import type { LocalSession } from "@/lib/auth/local-session";
import { getCapabilityIdsInPackages } from "@/lib/catalogue";
import { getOrgDataset, ORG_DEFAULT_ACTIVATED } from "@/lib/org/org-data";
import {
  orgKpis,
  capabilityAverages,
  capabilityGrowth,
  capabilityTeamMap,
  maturityDistribution,
} from "@/lib/org/org-analytics";

const MATURITY_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];
const NO_SESSION: LocalSession | null = null;

const REPORT_TYPES = [
  { key: "overview", name: "Capability Overview", desc: "Organisation capability health", icon: PieChart },
  { key: "team", name: "Team Capability Report", desc: "Team comparison & gaps", icon: Users },
  { key: "contributor", name: "Contributor Report", desc: "Individual development", icon: User },
  { key: "growth", name: "Growth Report", desc: "Capability evolution over time", icon: TrendingUp },
  { key: "evaluation", name: "Evaluation Report", desc: "Evaluation activity & quality", icon: ClipboardCheck },
] as const;
type ReportKey = (typeof REPORT_TYPES)[number]["key"];

const RECENT = [
  { name: "Capability Overview – April 2026", type: "Overview", scope: "Organisation", by: "Dr. Michael Lee", date: "Today, 10:30 AM" },
  { name: "Team Capability Report – Q2", type: "Team Report", scope: "5 Teams", by: "Dr. Sarah Brown", date: "May 1, 2026" },
  { name: "Growth Report – Q1 2026", type: "Growth", scope: "Organisation", by: "David Kim", date: "Apr 30, 2026" },
  { name: "Evaluation Summary – April 2026", type: "Evaluation", scope: "Organisation", by: "Lisa Chen", date: "Apr 29, 2026" },
  { name: "Contributor Report – Top 50", type: "Contributor", scope: "Top Contributors", by: "Tom Williams", date: "Apr 28, 2026" },
];

export default function OrgReportsPage() {
  const session = useLocalDraft<LocalSession | null>(DRAFT_KEYS.session, NO_SESSION);
  const isAdmin = session?.role === "org_admin";
  const [selected, setSelected] = useState<ReportKey>("overview");

  const view = useMemo(() => {
    const ds = getOrgDataset();
    const activated = ORG_DEFAULT_ACTIVATED;
    const gate = getCapabilityIdsInPackages(activated);
    const caps = capabilityAverages(ds, activated);
    const map = capabilityTeamMap(ds, activated);
    const teamAverages = map.units
      .map((u, j) => {
        const vals = map.rows.map((r) => r.cells[j]).filter((c) => !c.masked).map((c) => c.value as number);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { name: u.name, value: Math.round(avg * 10) / 10 };
      })
      .sort((a, b) => b.value - a.value);
    const topContributors = ds.members
      .map((m) => {
        const vis = m.capabilities.filter((c) => c.visibility === "yes" && gate.has(c.capability_id));
        const avg = vis.length ? vis.reduce((s, c) => s + c.score, 0) / vis.length : 0;
        return { name: m.name, value: Math.round(avg * 10) / 10, n: vis.length };
      })
      .filter((x) => x.n >= 3)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return {
      kpis: orgKpis(ds, activated),
      top: caps.slice(0, 5),
      maturity: maturityDistribution(ds, activated),
      growth: capabilityGrowth(ds, activated, 5),
      teamAverages,
      topContributors,
    };
  }, []);

  if (isAdmin) {
    return (
      <OrgShell active="reports">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="size-6" />
            </span>
            <h1 className="mt-4 text-lg font-semibold text-foreground">Reports are restricted</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Reports contain capability scores, so they&apos;re available to analytics viewers only
              (admin ≠ analyst).
            </p>
          </div>
        </div>
      </OrgShell>
    );
  }

  const { kpis } = view;
  const activeType = REPORT_TYPES.find((r) => r.key === selected)!;

  return (
    <OrgShell active="reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create data-driven reports from verified evaluations and capabilities.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">Apr 1 – Apr 30, 2026</span>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 print:hidden">
          <StatTile icon={<FileText className="size-5" />} label="Reports Generated" value={428} />
          <StatTile icon={<CalendarClock className="size-5" />} label="Scheduled Reports" value={18} />
          <StatTile icon={<Layers className="size-5" />} label="Active Templates" value={12} />
          <StatTile icon={<Users className="size-5" />} label="Total Contributors" value={kpis.contributors} />
          <StatTile icon={<Star className="size-5" />} label="Avg Capability Score" value={kpis.avgScore.toFixed(1)} suffix="/ 5" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr_260px]">
          {/* Report types */}
          <section className="space-y-2 rounded-xl border bg-card p-4 shadow-card print:hidden">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Report types</h2>
            {REPORT_TYPES.map((r) => {
              const on = r.key === selected;
              return (
                <button
                  key={r.key}
                  onClick={() => setSelected(r.key)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    on ? "border-primary bg-primary-soft" : "bg-card hover:bg-muted"
                  }`}
                >
                  <span className={`flex size-8 items-center justify-center rounded-lg ${on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <r.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{r.name}</span>
                    <span className="block text-xs text-muted-foreground">{r.desc}</span>
                  </span>
                  <ChevronRight className={`size-4 ${on ? "text-primary" : "text-muted-foreground/50"}`} />
                </button>
              );
            })}
          </section>

          {/* Live preview */}
          <section id="report-print" className="rounded-xl border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{activeType.name} Report</h2>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted print:hidden"
              >
                <Download className="size-4" /> Export PDF
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Contributors" value={kpis.contributors} />
              <MiniStat label="Evaluations" value={kpis.evaluations.toLocaleString()} />
              <MiniStat label="Coverage" value={`${kpis.coverage}%`} />
              <MiniStat label="Avg Score" value={`${kpis.avgScore.toFixed(1)} / 5`} />
            </div>

            <div className="mt-6">
              <ReportBody type={selected} view={view} />
            </div>
          </section>

          {/* Quick actions + AI */}
          <aside className="space-y-4 print:hidden">
            <section className="rounded-xl border bg-card p-4 shadow-card">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Quick actions</h2>
              <ul className="space-y-1.5">
                {[
                  { icon: FileText, label: "Executive summary" },
                  { icon: Download, label: "Download all (ZIP)" },
                  { icon: Share2, label: "Share with stakeholders" },
                  { icon: CalendarClock, label: "Schedule report" },
                ].map((q) => (
                  <li key={q.label} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground">
                    <q.icon className="size-4 text-primary" /> {q.label}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-primary-border bg-primary-soft p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="size-4 text-primary" /> AI Insights
              </div>
              {view.top.length >= 1 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {view.top[0].name} is the strongest capability across the organisation. Evaluation
                  coverage is {kpis.coverage}% — high data reliability. All figures respect visibility
                  consent and activated packages.
                </p>
              )}
            </section>
          </aside>
        </div>

        {/* Recent reports */}
        <section className="rounded-xl border bg-card p-5 shadow-card print:hidden">
          <h2 className="mb-3 text-base font-semibold text-foreground">Recent reports</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Report</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Scope</th>
                  <th className="px-3 py-2">Generated by</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Format</th>
                </tr>
              </thead>
              <tbody>
                {RECENT.map((r) => (
                  <tr key={r.name} className="border-t">
                    <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                    <td className="px-3 py-2"><span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{r.type}</span></td>
                    <td className="px-3 py-2 text-muted-foreground">{r.scope}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.by}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.date}</td>
                    <td className="px-3 py-2 text-muted-foreground">PDF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </OrgShell>
  );
}

type View = {
  kpis: ReturnType<typeof orgKpis>;
  top: { name: string; value: number }[];
  maturity: { label: string; count: number; percent: number }[];
  growth: { capability_id: string; name: string; points: { label: string; value: number }[] }[];
  teamAverages: { name: string; value: number }[];
  topContributors: { name: string; value: number; n: number }[];
};

function ReportBody({ type, view }: { type: ReportKey; view: View }) {
  if (type === "growth") {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Capability growth over time</h3>
        <MultiLine series={view.growth.map((g) => ({ name: g.name, points: g.points }))} />
      </div>
    );
  }
  if (type === "team") {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Team comparison — average capability score</h3>
        <BarList items={view.teamAverages} />
        <p className="mt-3 text-[11px] text-muted-foreground/80">Teams below the k-anonymity threshold are excluded.</p>
      </div>
    );
  }
  if (type === "contributor") {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Top contributors — by average capability score</h3>
        <BarList items={view.topContributors.map((c) => ({ name: c.name, value: c.value }))} />
        <p className="mt-3 text-[11px] text-muted-foreground/80">Only visible, package-gated capabilities count; contributors with ≥3 rated capabilities.</p>
      </div>
    );
  }
  if (type === "evaluation") {
    const pending = Math.max(0, view.kpis.evaluations - view.kpis.verified);
    return (
      <div className="flex flex-wrap items-center gap-6">
        <Donut
          segments={[
            { label: "Verified", value: view.kpis.verified, color: "#22c55e" },
            { label: "Pending", value: pending, color: "#f59e0b" },
          ]}
          centerValue={`${view.kpis.coverage}%`}
          centerLabel="Coverage"
        />
        <div className="flex-1">
          <Legend
            items={[
              { label: "Verified", value: view.kpis.verified.toLocaleString(), color: "#22c55e" },
              { label: "Pending", value: pending.toLocaleString(), color: "#f59e0b" },
            ]}
          />
        </div>
      </div>
    );
  }
  // overview (default)
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Top 5 strengths</h3>
        <BarList items={view.top} />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Capability maturity</h3>
        <div className="flex items-center gap-4">
          <Donut
            segments={view.maturity.map((b, i) => ({ label: b.label, value: b.count, color: MATURITY_COLORS[i] }))}
            centerValue={`${view.kpis.avgScore.toFixed(1)}`}
            centerLabel="out of 5"
          />
          <div className="flex-1">
            <Legend items={view.maturity.map((b, i) => ({ label: b.label, value: `${b.percent}%`, color: MATURITY_COLORS[i] }))} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
