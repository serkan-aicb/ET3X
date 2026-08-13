"use client";

/**
 * Org dashboard shell — sidebar + content, matching the Enterprise design.
 * Nav adapts to the role: org_viewer sees analytics/scores; org_admin does NOT
 * (admin ≠ analyst — v1.7 §12), so it gets governance surfaces instead.
 */

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  ClipboardList,
  Building2,
} from "lucide-react";

import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import { signOut, type LocalSession } from "@/lib/auth/local-session";
import { ORG_NAME } from "@/lib/org/org-data";

const NO_SESSION: LocalSession | null = null;

type NavItem = { key: string; label: string; href?: string; icon: typeof LayoutDashboard; soon?: boolean };

const VIEWER_NAV: NavItem[] = [
  { key: "overview", label: "Overview", href: "/org/overview", icon: LayoutDashboard },
  { key: "analytics", label: "Analytics", href: "/org/analytics", icon: BarChart3 },
  { key: "reports", label: "Reports", href: "/org/reports", icon: FileText },
  { key: "profiles", label: "Profiles", icon: Users, soon: true },
  { key: "evaluations", label: "Evaluations", icon: ClipboardList, soon: true },
];

const ADMIN_NAV: NavItem[] = [
  { key: "overview", label: "Overview", href: "/org/overview", icon: LayoutDashboard },
  { key: "members", label: "Members", href: "/org/members", icon: Users },
  { key: "governance", label: "Governance", href: "/org/governance", icon: ShieldCheck },
];

const ROLE_LABEL: Record<string, string> = {
  org_viewer: "Analytics viewer",
  org_admin: "Administrator",
};

export function OrgShell({ active, children }: { active: string; children: React.ReactNode }) {
  const router = useRouter();
  const session = useLocalDraft<LocalSession | null>(DRAFT_KEYS.session, NO_SESSION);
  const isAdmin = session?.role === "org_admin";
  const nav = isAdmin ? ADMIN_NAV : VIEWER_NAV;

  const logout = () => {
    signOut();
    router.push("/auth");
  };

  const name = session?.name || "Org user";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card px-4 py-5 md:flex print:hidden">
        <Link href="/org/overview" className="mb-6 flex items-center gap-2 px-2">
          <Image src="/pics/logo-transparent.png" alt="Talent3X" width={160} height={36} className="h-8 w-auto" priority />
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map((it) => {
            const isActive = it.key === active;
            const cls = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
              isActive ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`;
            const inner = (
              <>
                <it.icon className="size-4" />
                <span className="flex-1">{it.label}</span>
                {it.soon && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">soon</span>}
              </>
            );
            return it.href && !it.soon ? (
              <Link key={it.key} href={it.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <span key={it.key} className={`${cls} cursor-default opacity-70`}>
                {inner}
              </span>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3 border-t pt-4">
          <div className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Building2 className="size-3.5" /> Organisation
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{ORG_NAME}</div>
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">{name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {ROLE_LABEL[session?.role ?? ""] ?? "Org user"}
              </div>
            </div>
            <button onClick={logout} title="Sign out" className="text-muted-foreground hover:text-danger">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
