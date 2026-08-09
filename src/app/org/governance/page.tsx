"use client";

/**
 * Org Governance (v1.7 §12 org_admin). The rules that bound what analytics can
 * ever show: activated packages (commercial_scope), the k-anonymity threshold,
 * the visibility policy (R10) and the role matrix (admin != analyst). Read-only
 * display in the frozen build — the real toggles are backend-owned.
 */

import { useMemo } from "react";
import { Package as PackageIcon, ShieldCheck, EyeOff, Users, Check } from "lucide-react";

import { OrgShell } from "@/components/org/org-shell";
import { getPackages } from "@/lib/catalogue";
import { getOrgDataset, ORG_PACKAGES, ORG_DEFAULT_ACTIVATED } from "@/lib/org/org-data";
import { minGroupSize } from "@/lib/org/org-analytics";

export default function OrgGovernancePage() {
  const { packages, min, smallTeams } = useMemo(() => {
    const ds = getOrgDataset();
    const min = minGroupSize();
    const counts = new Map<string, number>();
    for (const m of ds.members) counts.set(m.unit_id, (counts.get(m.unit_id) ?? 0) + 1);
    return {
      packages: getPackages().filter((p) => ORG_PACKAGES.includes(p.package_id)),
      min,
      smallTeams: ds.units.filter((u) => (counts.get(u.id) ?? 0) < min).map((u) => u.name),
    };
  }, []);

  return (
    <OrgShell active="governance">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Governance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The rules that bound every analytics view. These protect individuals and enforce what
            your organisation is entitled to see.
          </p>
        </div>

        {/* Packages */}
        <Section icon={<PackageIcon className="size-4 text-primary" />} title="Activated packages" subtitle="Analytics only ever show capabilities inside activated packages (commercial_scope).">
          <div className="space-y-2">
            {packages.map((p) => {
              const active = ORG_DEFAULT_ACTIVATED.includes(p.package_id);
              return (
                <div key={p.package_id} className="flex items-center justify-between rounded-lg border bg-background px-4 py-2.5">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{p.package_id}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{p.name}</span>
                  </div>
                  {active ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                      <Check className="size-3" /> Active
                    </span>
                  ) : (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Available</span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* k-anonymity */}
        <Section icon={<Users className="size-4 text-primary" />} title="k-anonymity" subtitle="Group views are only shown at or above the minimum group size.">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border bg-background px-5 py-3 text-center">
              <div className="text-3xl font-semibold text-primary">{min}</div>
              <div className="text-xs text-muted-foreground">min group size</div>
            </div>
            <p className="flex-1 text-sm text-muted-foreground">
              Any team or capability cell with fewer than {min} contributors is hidden, and small
              teams are rolled up to the parent.
              {smallTeams.length > 0 && (
                <>
                  {" "}Currently rolled up:{" "}
                  <span className="font-medium text-foreground">{smallTeams.join(", ")}</span>.
                </>
              )}
            </p>
          </div>
        </Section>

        {/* Visibility */}
        <Section icon={<EyeOff className="size-4 text-primary" />} title="Individual visibility (R10)" subtitle="Every contributor controls whether their evidence is visible to organisations.">
          <p className="text-sm text-muted-foreground">
            Evidence a contributor marks private is <span className="font-medium text-foreground">never</span> included
            in any org aggregate — not even retroactively when a package is activated. Consent is set by
            the individual, per action, and cannot be overridden.
          </p>
        </Section>

        {/* Roles */}
        <Section icon={<ShieldCheck className="size-4 text-primary" />} title="Roles" subtitle="Separation of duties — admin ≠ analyst.">
          <div className="grid gap-3 sm:grid-cols-2">
            <RoleCard
              role="Org admin"
              can={["Manage members & teams", "Govern packages & policy", "See participation counts"]}
              cannot={["Read capability scores", "Open the analytics views"]}
            />
            <RoleCard
              role="Org viewer"
              can={["See capability analytics & scores", "Scoped to their org-unit subtree"]}
              cannot={["Manage members", "Change governance"]}
            />
          </div>
        </Section>
      </div>
    </OrgShell>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5">{icon}</span>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function RoleCard({ role, can, cannot }: { role: string; can: string[]; cannot: string[] }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-sm font-semibold text-foreground">{role}</div>
      <ul className="mt-2 space-y-1">
        {can.map((c) => (
          <li key={c} className="flex items-start gap-1.5 text-xs text-foreground">
            <Check className="mt-0.5 size-3 shrink-0 text-success" /> {c}
          </li>
        ))}
        {cannot.map((c) => (
          <li key={c} className="flex items-start gap-1.5 text-xs text-muted-foreground line-through decoration-danger/40">
            <span className="mt-0.5 size-3 shrink-0" /> {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
