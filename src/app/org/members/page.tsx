"use client";

/**
 * Org Members (v1.7 §12 org_admin). Administrators manage who is in the org and
 * see participation counts — but NEVER capability scores (admin ≠ analyst). No
 * score column appears anywhere on this page.
 */

import { useMemo } from "react";
import { Users, Building2, ClipboardCheck } from "lucide-react";

import { OrgShell } from "@/components/org/org-shell";
import { StatTile } from "@/components/org/charts";
import { getOrgDataset } from "@/lib/org/org-data";
import { minGroupSize } from "@/lib/org/org-analytics";

export default function OrgMembersPage() {
  const { units, members, totals, min, unitNames } = useMemo(() => {
    const ds = getOrgDataset();
    const min = minGroupSize();
    const byUnit = new Map<string, { name: string; count: number; evaluations: number; verified: number }>();
    for (const u of ds.units) byUnit.set(u.id, { name: u.name, count: 0, evaluations: 0, verified: 0 });
    for (const m of ds.members) {
      const row = byUnit.get(m.unit_id);
      if (!row) continue;
      row.count += 1;
      row.evaluations += m.evaluations;
      row.verified += m.verified;
    }
    const totals = {
      members: ds.members.length,
      teams: ds.units.length,
      evaluations: ds.members.reduce((s, m) => s + m.evaluations, 0),
    };
    return {
      units: [...byUnit.values()],
      members: ds.members,
      totals,
      min,
      unitNames: new Map(ds.units.map((u) => [u.id, u.name])),
    };
  }, []);

  return (
    <OrgShell active="members">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Who&apos;s in {" "}
            <span className="font-medium text-foreground">your organisation</span> and how active they
            are. Capability scores are not shown here — those are for analytics viewers.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile icon={<Users className="size-5" />} label="Members" value={totals.members} />
          <StatTile icon={<Building2 className="size-5" />} label="Teams" value={totals.teams} />
          <StatTile icon={<ClipboardCheck className="size-5" />} label="Evaluations" value={totals.evaluations.toLocaleString()} />
        </div>

        {/* Teams */}
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-foreground">Teams</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((u) => (
              <div key={u.name} className="rounded-lg border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{u.name}</span>
                  {u.count < min && (
                    <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                      k-anon
                    </span>
                  )}
                </div>
                <div className="mt-2 text-2xl font-semibold text-primary">{u.count}</div>
                <div className="text-xs text-muted-foreground">
                  {u.evaluations} evaluations · {u.verified} verified
                </div>
                {u.count < min && (
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    Below {min} members — hidden from analytics group views.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Member list (no scores) */}
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-base font-semibold text-foreground">All members</h2>
          <div className="max-h-[420px] overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Member</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2 text-right">Evaluations</th>
                  <th className="px-3 py-2 text-right">Verified</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2 text-foreground">{m.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {unitNames.get(m.unit_id) ?? m.unit_id}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{m.evaluations}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{m.verified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            No capability scores are shown — administrators manage membership, not assessment (admin ≠ analyst).
          </p>
        </section>
      </div>
    </OrgShell>
  );
}
