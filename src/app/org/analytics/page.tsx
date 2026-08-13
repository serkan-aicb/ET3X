"use client";

/**
 * Org Analytics (v1.7 §12 org_viewer only). The capability × team heatmap is the
 * governance showcase: cells are package-gated, org_visibility-filtered and
 * k-anonymised (any team/cell below min_group_size is hidden or rolled up).
 * The package toggles demonstrate commercial_scope gating — activating a package
 * reveals its capabilities, retroactively (intended behaviour).
 */

import { useMemo, useState } from "react";
import {
  Download,
  Lock,
  Package as PackageIcon,
  Users,
  ClipboardCheck,
  ShieldCheck,
  PieChart,
  Star,
} from "lucide-react";

import { OrgShell } from "@/components/org/org-shell";
import { StatTile, Donut, Legend, BarList } from "@/components/org/charts";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import type { LocalSession } from "@/lib/auth/local-session";
import { getPackages } from "@/lib/catalogue";
import { getOrgDataset, ORG_PACKAGES, ORG_DEFAULT_ACTIVATED } from "@/lib/org/org-data";
import {
  orgKpis,
  capabilityTeamMap,
  scoreDistribution,
  capabilityAverages,
  minGroupSize,
} from "@/lib/org/org-analytics";

const BAND_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];
const NO_SESSION: LocalSession | null = null;

// Score 1..5 → red→amber→green pastel background (dark, readable text on top).
function cellColor(v: number): string {
  const t = Math.max(0, Math.min(1, (v - 1) / 4));
  return `hsl(${Math.round(t * 140)} 65% 86%)`;
}

export default function OrgAnalyticsPage() {
  const session = useLocalDraft<LocalSession | null>(DRAFT_KEYS.session, NO_SESSION);
  const isAdmin = session?.role === "org_admin";

  const [activated, setActivated] = useState<string[]>(ORG_DEFAULT_ACTIVATED);
  const packages = useMemo(
    () => getPackages().filter((p) => ORG_PACKAGES.includes(p.package_id)),
    []
  );
  const ds = useMemo(() => getOrgDataset(), []);
  const view = useMemo(
    () => ({
      kpis: orgKpis(ds, activated),
      map: capabilityTeamMap(ds, activated),
      dist: scoreDistribution(ds, activated),
      top: capabilityAverages(ds, activated).slice(0, 6),
      min: minGroupSize(),
    }),
    [ds, activated]
  );

  const toggle = (pkg: string) =>
    setActivated((a) => (a.includes(pkg) ? a.filter((x) => x !== pkg) : [...a, pkg]));

  if (isAdmin) {
    return (
      <OrgShell active="analytics">
        <Restriction />
      </OrgShell>
    );
  }

  const { kpis, map, dist, top, min } = view;

  return (
    <OrgShell active="analytics">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">Insights into capabilities, performance and growth.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Download className="size-4" /> Export
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatTile icon={<Users className="size-5" />} label="Contributors" value={kpis.contributors} />
          <StatTile icon={<ClipboardCheck className="size-5" />} label="Evaluations" value={kpis.evaluations.toLocaleString()} />
          <StatTile icon={<ShieldCheck className="size-5" />} label="Verified" value={kpis.verified.toLocaleString()} />
          <StatTile icon={<PieChart className="size-5" />} label="Coverage" value={`${kpis.coverage}%`} />
          <StatTile icon={<Star className="size-5" />} label="Avg Score" value={kpis.avgScore.toFixed(1)} suffix="/ 5" />
        </div>

        {/* Package activation — commercial_scope gating */}
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <PackageIcon className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Activated packages</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Org analytics only ever show capabilities inside your activated packages. Toggle one to
            see the map change — retroactively, by design.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packages.map((p) => {
              const on = activated.includes(p.package_id);
              return (
                <button
                  key={p.package_id}
                  onClick={() => toggle(p.package_id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    on ? "border-primary bg-primary-soft text-primary" : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p.package_id} · {p.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Capability × team heatmap */}
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Capability Map</h2>
            <span className="text-xs text-muted-foreground">Average score by team</span>
          </div>
          {map.rows.length === 0 || map.units.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No capabilities are visible under the current packages. Activate a package above.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th className="w-44 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Capability
                    </th>
                    {map.units.map((u) => (
                      <th key={u.id} className="px-2 text-center text-xs font-medium text-muted-foreground">
                        {u.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {map.rows.map((r) => (
                    <tr key={r.capability_id}>
                      <td className="py-1 pr-2 text-sm font-medium text-foreground">{r.name}</td>
                      {r.cells.map((c, i) =>
                        c.masked ? (
                          <td
                            key={i}
                            className="rounded-md bg-muted text-center text-[11px] text-muted-foreground"
                            title={`Hidden — fewer than ${min} contributors (k-anonymity)`}
                          >
                            <span className="inline-flex items-center gap-0.5">
                              <Lock className="size-3" /> &lt;{min}
                            </span>
                          </td>
                        ) : (
                          <td
                            key={i}
                            className="rounded-md text-center font-semibold"
                            style={{ backgroundColor: cellColor(c.value as number), color: "#0f172a" }}
                          >
                            {(c.value as number).toFixed(1)}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            Cells with fewer than {min} contributors are hidden (k-anonymity), and teams below {min}{" "}
            members are rolled up and not shown as columns. Evidence marked private is never counted (R10).
          </p>
        </section>

        {/* Distribution + top capabilities */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 text-base font-semibold text-foreground">Capability Score Distribution</h2>
            <div className="flex items-center gap-5">
              <Donut
                segments={dist.map((b, i) => ({ label: b.label, value: b.count, color: BAND_COLORS[i] }))}
                centerValue={kpis.contributors}
                centerLabel="Contributors"
              />
              <div className="flex-1">
                <Legend items={dist.map((b, i) => ({ label: b.label, value: `${b.percent}%`, color: BAND_COLORS[i] }))} />
              </div>
            </div>
          </section>
          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 text-base font-semibold text-foreground">Top Capabilities</h2>
            {top.length ? (
              <BarList items={top.map((c) => ({ name: c.name, value: c.value }))} />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing visible under the current packages.</p>
            )}
          </section>
        </div>
      </div>
    </OrgShell>
  );
}

function Restriction() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="size-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-foreground">Analytics is restricted</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Admin ≠ analyst — capability scores and analytics are visible only to analytics viewers.
          As an administrator you manage members and governance instead.
        </p>
      </div>
    </div>
  );
}
