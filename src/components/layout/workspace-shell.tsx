import * as React from "react";
import Image from "next/image";
import { Building2, ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { MobileWorkspaceChrome } from "@/components/layout/workspace-drawer";

/**
 * Workspace archetype shell (docs 14 S6/S7 — André confirmed ink chrome).
 * 240px ink sidebar is the chrome: brand, nav, org switcher + user card.
 * No top bar on desktop; content column caps at max-w-7xl px-8 py-8 (S3).
 * Below lg the rail becomes a drawer behind an ink mobile bar (T6) — that
 * part is a client island; this shell stays a SERVER component so real
 * pages (/actions, Analytics, Reports) can fetch data server-side.
 *
 * Extracted from /design-lab (Week-3 §1) so workspace screens assemble
 * instead of re-building chrome.
 */

export type WorkspaceNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

export type WorkspaceOrg = { name: string };
export type WorkspaceUser = { name: string; role: string; initials: string };

function SidebarContent({
  nav,
  org,
  user,
}: {
  nav: WorkspaceNavItem[];
  org?: WorkspaceOrg;
  user?: WorkspaceUser;
}) {
  return (
    <>
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <Image
          src="/pics/logo-mark.png"
          alt="Talent3X"
          width={32}
          height={32}
          className="size-8"
        />
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Talent3X
        </span>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        {org && (
          <button className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent">
            <Building2 className="size-4 text-sidebar-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-sidebar-foreground/70">
                Organization
              </span>
              <span className="block truncate text-sm font-medium text-white">
                {org.name}
              </span>
            </span>
            <ChevronDown className="size-4 text-sidebar-foreground/70" />
          </button>
        )}
        {user && (
          <button className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint-sky text-xs font-semibold text-ink">
              {user.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                {user.name}
              </span>
              <span className="block text-[11px] text-sidebar-foreground/70">
                {user.role}
              </span>
            </span>
          </button>
        )}
      </div>
    </>
  );
}

export function WorkspaceShell({
  nav,
  org,
  user,
  children,
}: {
  nav: WorkspaceNavItem[];
  org?: WorkspaceOrg;
  user?: WorkspaceUser;
  children: React.ReactNode;
}) {
  const sidebar = <SidebarContent nav={nav} org={org} user={user} />;

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* Mobile chrome + drawer (client island; sidebar arrives pre-rendered) */}
      <MobileWorkspaceChrome sidebar={sidebar} />

      {/* Rail (desktop) — the ink chrome */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
        {sidebar}
      </aside>

      {/* Content column (S3 rhythm) */}
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

/** In-content title block (S6): 3xl title + why-it-matters + ONE primary CTA. */
export function WorkspaceHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}
