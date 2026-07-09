/**
 * Design Lab — workspace archetype sample (theme demonstration)
 * ------------------------------------------------------------------
 * Replaces the rejected "aurora" exploration. This page demonstrates the
 * FROZEN theme (workspace docs 10–11) on the one archetype no other page
 * shows: the enterprise workspace (D4 archetype #1) — sidebar, header,
 * KPI row, table with status pills, AI Insight band.
 *
 * Mock data; nothing wired. Theme rules on display:
 *  - Three-tier color budget: monochrome chrome, strict semantics
 *    (status pills), decorative tier only in icon chips / category badges.
 *  - Vocabulary: Actions (not Tasks) in nav, titles and copy.
 *  - No overall-score KPI (7-July rule; pending team decision Thursday).
 *  - AI signature: sparkle + light-blue band, never purple.
 *  - Motion: .card-interactive / .row-interactive on clickable things only.
 */

import Image from "next/image";
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Plus,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */

const NAV = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Profiles", icon: Users, active: false },
  { label: "Actions", icon: ClipboardList, active: false },
  { label: "Evaluations", icon: Star, active: false },
  { label: "Analytics", icon: BarChart3, active: false },
  { label: "Reports", icon: FileText, active: false },
];

// Decorative tier in action: icon chips may use the categorical palette;
// meaning never rides on these colors (that's what status pills are for).
const topCapabilities = [
  { label: "Communication", value: 4.4, chip: "bg-chart-1/10 text-chart-1" },
  { label: "Leadership", value: 4.2, chip: "bg-chart-2/10 text-chart-2" },
  { label: "Problem Solving", value: 4.1, chip: "bg-chart-3/10 text-chart-3" },
  { label: "Strategic Thinking", value: 3.9, chip: "bg-tint-steel/10 text-tint-steel" },
];

// Category badges: tinted from the categorical palette (decorative tier,
// 9-July grill Q6). rounded-md distinguishes them from round status pills.
const CATEGORY_TINTS: Record<string, string> = {
  Assessment: "bg-chart-1/10 text-chart-1 ring-chart-1/20",
  Project: "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  Research: "bg-chart-3/10 text-chart-3 ring-chart-3/20",
  Presentation: "bg-tint-steel/10 text-tint-steel ring-tint-steel/20",
  Other: "bg-chart-5/10 text-chart-5 ring-chart-5/20",
};

const actions = [
  {
    title: "AI Ethics Case Study",
    category: "Assessment",
    owner: "Sarah Johnson",
    status: { label: "Completed", tone: "success" as const },
    due: "Apr 28, 2026",
    evaluations: "22 / 24",
  },
  {
    title: "System Design Challenge",
    category: "Project",
    owner: "David Kim",
    status: { label: "In Progress", tone: "warning" as const },
    due: "May 10, 2026",
    evaluations: "8 / 18",
  },
  {
    title: "User Research Project",
    category: "Research",
    owner: "Lisa Chen",
    status: { label: "Invite sent", tone: "info" as const },
    due: "May 2, 2026",
    evaluations: "0 / 15",
  },
  {
    title: "Team Strategy Presentation",
    category: "Presentation",
    owner: "Tom Williams",
    status: { label: "Overdue", tone: "destructive" as const },
    due: "Apr 25, 2026",
    evaluations: "2 / 5",
  },
];

const activity = [
  { text: "New evaluation completed — Strategy Paper, Sarah Johnson", when: "10 min ago" },
  { text: "Contributor joined — David Kim, Product Team", when: "2 hr ago" },
  { text: "New contribution verified — AI Assessment, Tom Williams", when: "3 hr ago" },
  { text: "Capability improved — Lisa Chen, AI Literacy to 3.8", when: "5 hr ago" },
];

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function DesignLab() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar — workspace chrome (light, per mockups; navy is NOT chrome) */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r bg-sidebar px-3 py-5">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <Image
            src="/pics/logo-mark.png"
            alt="Talent3X"
            width={32}
            height={32}
            className="size-8"
          />
          <span className="text-[15px] font-semibold tracking-tight">Talent3X</span>
        </div>

        <nav className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <button className="row-interactive flex w-full items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-left">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-muted-foreground/70">Organization</span>
              <span className="block truncate text-sm font-medium">Quinnipiac University</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground/70" />
          </button>
          <button className="row-interactive flex w-full items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-left">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-ink-foreground">
              ML
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">Dr. Michael Lee</span>
              <span className="block text-[11px] text-muted-foreground/70">Administrator</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-8 py-8">
          {/* Header row: title + subtitle + ONE primary CTA */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Key insights from your Talent3X ecosystem.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="outline">
                <Calendar /> Apr 1 – Apr 30, 2026
              </Button>
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell />
              </Button>
              <Button>
                <Plus /> Create Action
              </Button>
            </div>
          </div>

          {/* KPI row — value + trend + story. Deliberately NO overall
              capability score (7-July rule; Thursday question). */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Contributors"
              value="198"
              deltaPercent={12}
              caption="vs. last 30 days"
              icon={<Users />}
            />
            <KpiCard
              label="Evaluations"
              value="1,821"
              deltaPercent={15}
              caption="vs. last 30 days"
              icon={<Star />}
            />
            <KpiCard
              label="Verified contributions"
              value="1,642"
              deltaPercent={18}
              caption="vs. last 30 days"
              icon={<ClipboardList />}
            />
            <KpiCard
              label="Evaluation coverage"
              value="91%"
              deltaPercent={8}
              caption="of completed actions"
              icon={<BarChart3 />}
            />
          </div>

          {/* Card grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Top Capabilities</CardTitle>
                <button className="text-xs font-medium text-primary hover:underline">
                  View all
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCapabilities.map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${c.chip}`}
                    >
                      <Star className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{c.label}</span>
                        <span className="text-sm font-semibold tabular-nums">
                          {c.value.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(c.value / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <button className="text-xs font-medium text-primary hover:underline">
                  View all
                </button>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {activity.map((a) => (
                    <li
                      key={a.text}
                      className="row-interactive flex items-start justify-between gap-3 rounded-lg px-2 py-1.5"
                    >
                      <span className="text-sm text-foreground/90">{a.text}</span>
                      <span className="shrink-0 text-xs text-muted-foreground/70">
                        {a.when}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Actions table — status pills carry meaning (semantic tier) */}
          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Actions</CardTitle>
              <button className="text-xs font-medium text-primary hover:underline">
                View all
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Due</th>
                    <th className="px-6 py-2 text-right font-medium">Evaluations</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr key={a.title} className="row-interactive cursor-pointer border-b last:border-0">
                      <td className="px-6 py-3 font-medium">{a.title}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${CATEGORY_TINTS[a.category] ?? CATEGORY_TINTS.Other}`}
                        >
                          {a.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{a.owner}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={a.status.tone}>{a.status.label}</StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{a.due}</td>
                      <td className="px-6 py-3 text-right tabular-nums">{a.evaluations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* AI Insight band — the sanctioned AI signature: sparkle + light
              blue + explicit label. Never purple. AI explains, never scores. */}
          <div className="mt-6 flex items-center gap-4 rounded-xl border border-primary/15 bg-primary/5 px-6 py-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">AI Insight</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Communication and Leadership remain your strongest capabilities.
                AI Literacy shows the highest growth (+24%) but is still below
                average — consider targeted development.
              </p>
            </div>
            <Button variant="tint" className="shrink-0">
              View full insight
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
