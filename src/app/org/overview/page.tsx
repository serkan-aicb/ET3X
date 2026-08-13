"use client";

/**
 * Org Overview (v1.7 §12 org_viewer). Governed aggregates over the mock org —
 * package-gated, org_visibility-filtered, k-anon-safe (see lib/org/org-analytics).
 * Frozen build: all numbers come from the local mock; swaps to GET /api/org/*.
 */

import { useMemo } from "react";
import { Users, ClipboardCheck, ShieldCheck, PieChart, Star, Download, Sparkles, Lock } from "lucide-react";

import { OrgShell } from "@/components/org/org-shell";
import { StatTile, BarList, Donut, Legend, MultiLine, CHART_COLORS } from "@/components/org/charts";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import type { LocalSession } from "@/lib/auth/local-session";
import { getOrgDataset, ORG_DEFAULT_ACTIVATED } from "@/lib/org/org-data";
import {
  orgKpis,
  capabilityAverages,
  scoreDistribution,
  capabilityGrowth,
} from "@/lib/org/org-analytics";

const GAP_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#3b82f6"];
const BAND_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];
const NO_SESSION: LocalSession | null = null;

export default function OrgOverviewPage() {
  const session = useLocalDraft<LocalSession | null>(DRAFT_KEYS.session, NO_SESSION);
  const isAdmin = session?.role === "org_admin";

  const view = useMemo(() => {
    const ds = getOrgDataset();
    const activated = ORG_DEFAULT_ACTIVATED;
    const caps = capabilityAverages(ds, activated);
    return {
      kpis: orgKpis(ds, activated),
      top: caps.slice(0, 5),
      gaps: [...caps].reverse().slice(0, 5),
      dist: scoreDistribution(ds, activated),
      growth: capabilityGrowth(ds, activated, 5),
    };
  }, []);

  const { kpis, top, gaps, dist, growth } = view;

  return (
    <OrgShell active="overview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">Key insights from your Talent3X ecosystem.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">Apr 1 – Apr 30, 2026</span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Download className="size-4" /> Export
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatTile icon={<Users className="size-5" />} label="Contributors" value={kpis.contributors} />
          <StatTile icon={<ClipboardCheck className="size-5" />} label="Evaluations" value={kpis.evaluations.toLocaleString()} />
          <StatTile icon={<ShieldCheck className="size-5" />} label="Verified Contributions" value={kpis.verified.toLocaleString()} />
          <StatTile icon={<PieChart className="size-5" />} label="Evaluation Coverage" value={`${kpis.coverage}%`} />
          {!isAdmin && (
            <StatTile icon={<Star className="size-5" />} label="Avg Capability Score" value={kpis.avgScore.toFixed(1)} suffix="/ 5" />
          )}
        </div>

        {/* admin ≠ analyst: administrators do not see capability scores (v1.7 §12) */}
        {isAdmin && (
          <div className="flex items-start gap-4 rounded-xl border bg-card px-5 py-4 shadow-card">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Lock className="size-5" />
            </span>
            <div className="text-sm text-foreground">
              <div className="font-semibold">Capability scores are restricted</div>
              <p className="mt-0.5 text-muted-foreground">
                You&apos;re signed in as an administrator. Admin ≠ analyst — capability scores and the
                analytics views are visible only to analytics viewers. You can manage members and
                governance (packages, k-anonymity) from the sidebar.
              </p>
            </div>
          </div>
        )}

        {/* Capabilities + distribution (analytics viewers only) */}
        {!isAdmin && (
        <>
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Top Capabilities" subtitle="By average score">
            <BarList items={top.map((c) => ({ name: c.name, value: c.value }))} />
          </Panel>
          <Panel title="Capability Gaps" subtitle="Lowest scoring capabilities">
            <BarList items={gaps.map((c, i) => ({ name: c.name, value: c.value, color: GAP_COLORS[i % GAP_COLORS.length] }))} />
          </Panel>
          <Panel title="Score Distribution" subtitle="Across all capabilities">
            <div className="flex items-center gap-5">
              <Donut
                segments={dist.map((b, i) => ({ label: b.label, value: b.count, color: BAND_COLORS[i] }))}
                centerValue={kpis.contributors}
                centerLabel="Contributors"
              />
              <div className="flex-1">
                <Legend
                  items={dist.map((b, i) => ({
                    label: b.label,
                    value: `${b.percent}%`,
                    color: BAND_COLORS[i],
                  }))}
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* Growth */}
        <Panel title="Capability Growth Over Time" subtitle="Average capability score over time">
          <MultiLine series={growth.map((g) => ({ name: g.name, points: g.points }))} />
          <div className="mt-3 flex flex-wrap gap-4">
            {growth.map((g, i) => (
              <span key={g.capability_id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {g.name}
              </span>
            ))}
          </div>
        </Panel>

        {/* AI insight */}
        {top.length >= 2 && gaps.length >= 1 && (
          <div className="flex items-start gap-4 rounded-xl border border-primary-border bg-primary-soft px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="text-sm text-foreground">
              <div className="font-semibold">AI Insight</div>
              <p className="mt-0.5 text-muted-foreground">
                {top[0].name} and {top[1].name} remain your strongest capabilities. {gaps[0].name} is the
                lowest at {gaps[0].value.toFixed(1)} — consider targeted development. Figures respect each
                contributor&apos;s visibility consent and your activated packages.
              </p>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </OrgShell>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
