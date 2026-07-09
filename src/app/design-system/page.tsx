"use client";

import { Users, Star, ClipboardList, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { CapabilityScore } from "@/components/evaluation/capability-score";
import { ScoreScale } from "@/components/evaluation/score-scale";
import { mockEvaluationConfig } from "@/lib/verification/mock-config";

const COLOR_TOKENS = [
  { name: "primary", cssVar: "--primary", note: "interactive blue · buttons, links, focus" },
  { name: "ink", cssVar: "--ink", note: "brand navy (logo) · ink CTA, auth panel, PDF chrome ONLY" },
  { name: "tint-sky", cssVar: "--tint-sky", note: "logo sky · decorative tier only" },
  { name: "tint-steel", cssVar: "--tint-steel", note: "logo steel · decorative tier only" },
  { name: "background", cssVar: "--background", note: "canvas · light blue-gray, cards sit white on top" },
  { name: "foreground", cssVar: "--foreground", note: "headings, body text" },
  { name: "muted-foreground", cssVar: "--muted-foreground", note: "secondary text" },
  { name: "muted / secondary", cssVar: "--muted", note: "subtle surfaces" },
  { name: "border", cssVar: "--border", note: "borders, dividers" },
  { name: "destructive", cssVar: "--destructive", note: "errors, rejected" },
  { name: "chart-1", cssVar: "--chart-1", note: "charts · blue" },
  { name: "chart-2", cssVar: "--chart-2", note: "charts · teal" },
  { name: "chart-3", cssVar: "--chart-3", note: "charts · amber" },
  { name: "chart-4", cssVar: "--chart-4", note: "charts · sky" },
  { name: "chart-5", cssVar: "--chart-5", note: "charts · slate" },
];

const TYPE_SCALE = [
  { cls: "text-3xl font-semibold tracking-tight", label: "text-3xl · page titles, KPI values" },
  { cls: "text-2xl font-semibold tracking-tight", label: "text-2xl · card titles" },
  { cls: "text-xl font-semibold tracking-tight", label: "text-xl · section titles" },
  { cls: "text-base", label: "text-base · long-form body" },
  { cls: "text-sm", label: "text-sm · default UI text" },
  { cls: "text-xs text-muted-foreground", label: "text-xs · captions, metadata" },
];

function DesignSystemSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const config = mockEvaluationConfig;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background px-6 py-4 print:hidden">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Talent3X Design System
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Week 1 · UI foundation reference. Product lists (roles, difficulty,
            score scale, capabilities) render from verification-layer config —
            currently a stub, never hardcoded.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        {/* ── Page archetypes ────────────────────────────────────── */}
        <DesignSystemSection
          title="Page archetypes"
          description="Every screen declares exactly one archetype — no hybrids."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                name: "Workspace",
                spec: "240px sidebar · content ≤1280px",
                use: "Dashboards & management (Overview, Analytics, Reports). Sidebar nav, org switcher, one primary CTA per screen. Desktop-first, ≥1024px.",
                demo: "/design-lab",
              },
              {
                name: "Public projection",
                spec: "chromeless top bar · ≤1240px",
                use: "Profile Studio — the pride-first public surface. No sidebar; single ink hero CTA; trust footer. Mobile-first at 375px.",
                demo: "/profile-studio-preview",
              },
              {
                name: "Focused flow",
                spec: "stepper · single 760px column",
                use: "Onboarding, evaluation. Minimal chrome, Save & exit, one decision per screen, Back never loses data. Mobile-first at 375px.",
                demo: "/onboarding-preview",
              },
            ].map((a) => (
              <Card key={a.name}>
                <CardHeader>
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  <CardDescription>{a.spec}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{a.use}</p>
                  <a href={a.demo} className="text-xs font-medium text-primary hover:underline">
                    Live example: {a.demo}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </DesignSystemSection>

        {/* ── Tokens ─────────────────────────────────────────────── */}
        <DesignSystemSection
          title="Color tokens"
          description="Defined in globals.css. Always reference tokens, never raw hex, so a future theme change is one edit."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_TOKENS.map((token) => (
              <div key={token.name} className="rounded-lg border p-3">
                <div
                  className="h-10 w-full rounded-md border"
                  style={{ backgroundColor: `var(${token.cssVar})` }}
                />
                <p className="mt-2 text-sm font-medium">{token.name}</p>
                <p className="text-xs text-muted-foreground">{token.note}</p>
              </div>
            ))}
          </div>
        </DesignSystemSection>

        <DesignSystemSection
          title="Color tiers"
          description="Three tiers, one rule: a decorative color never appears on a button, status badge, or chrome element."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1 · Chrome — monochrome</CardTitle>
                <CardDescription>surfaces, borders, text, one blue</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["--background", "--card", "--border", "--muted-foreground", "--foreground", "--primary", "--ink"].map((v) => (
                  <span
                    key={v}
                    className="size-8 rounded-md border"
                    title={v}
                    style={{ backgroundColor: `var(${v})` }}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2 · Semantic — meaning only</CardTitle>
                <CardDescription>green = verified/trust, never decoration</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["--success", "--warning", "--danger", "--info"].map((v) => (
                  <span
                    key={v}
                    className="size-8 rounded-md border"
                    title={v}
                    style={{ backgroundColor: `var(${v})` }}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3 · Decorative — bounded</CardTitle>
                <CardDescription>chips, category badges, charts, bands ONLY</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--tint-sky", "--tint-steel"].map((v) => (
                  <span
                    key={v}
                    className="size-8 rounded-md border"
                    title={v}
                    style={{ backgroundColor: `var(${v})` }}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </DesignSystemSection>

        <DesignSystemSection
          title="Typography"
          description="DM Sans everywhere (closest real match to the approved mockups). Weights: 400 body · 500 labels · 600 headings. Scores and KPI numerals always tabular-nums."
        >
          <Card>
            <CardContent className="space-y-3 p-6">
              {TYPE_SCALE.map((t) => (
                <div key={t.label} className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <p className={t.cls}>Capability intelligence</p>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </DesignSystemSection>

        {/* ── Primitives ─────────────────────────────────────────── */}
        <DesignSystemSection
          title="Buttons & badges"
          description="One primary CTA per screen. Hierarchy: primary (blue) → outline (neutral) → tint (tertiary, in-card). Ink is reserved for the single hero CTA on public-projection pages."
        >
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="tint">Tint · tertiary</Button>
                <Button variant="ink">Ink · public CTA</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
                <Button size="sm">Small</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
        </DesignSystemSection>

        <DesignSystemSection
          title="Status badges"
          description="Canonical mapping: Completed/Verified = success · In Progress = warning · Pending/Invited = info · Overdue/Rejected = danger · Draft = neutral. Labels come from data, never hardcoded in the component."
        >
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-6">
              <StatusBadge tone="success">Completed</StatusBadge>
              <StatusBadge tone="success">Verified</StatusBadge>
              <StatusBadge tone="warning">In Progress</StatusBadge>
              <StatusBadge tone="info">Invite sent</StatusBadge>
              <StatusBadge tone="destructive">Overdue</StatusBadge>
              <StatusBadge tone="neutral">Draft</StatusBadge>
            </CardContent>
          </Card>
        </DesignSystemSection>

        <DesignSystemSection
          title="Category badges"
          description="Decorative tier: categories may carry categorical color for scannability. rounded-md tints — visually distinct from round status pills with dots, so color never reads as status."
        >
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-6">
              {[
                ["Assessment", "bg-chart-1/10 text-chart-1 ring-chart-1/20"],
                ["Project", "bg-chart-2/10 text-chart-2 ring-chart-2/20"],
                ["Research", "bg-chart-3/10 text-chart-3 ring-chart-3/20"],
                ["Presentation", "bg-tint-steel/10 text-tint-steel ring-tint-steel/20"],
                ["Other", "bg-chart-5/10 text-chart-5 ring-chart-5/20"],
              ].map(([label, cls]) => (
                <span
                  key={label}
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}
                >
                  {label}
                </span>
              ))}
              <span className="mx-2 text-xs text-muted-foreground">vs. status:</span>
              <StatusBadge tone="warning">In Progress</StatusBadge>
            </CardContent>
          </Card>
        </DesignSystemSection>

        <DesignSystemSection
          title="Forms"
          description="react-hook-form + zod in real screens; these are the visual primitives."
        >
          <Card>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ds-title">Action title</Label>
                <Input id="ds-title" placeholder="e.g. Market analysis for X" />
              </div>
              <div className="space-y-2">
                <Label>Difficulty (from config)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.difficultyLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ds-desc">Description</Label>
                <Textarea id="ds-desc" placeholder="Describe the work…" rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ds-hash" />
                <Label htmlFor="ds-hash" className="font-normal">
                  Hash-only evidence (NDA work)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Input states (T7). Mark OPTIONAL fields, not required ones. */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Input states</CardTitle>
              <CardDescription>
                validate on blur, live after first error · submit-level summary for screen readers
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 pt-0 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Focused</Label>
                <div className="flex h-10 items-center rounded-lg border border-primary px-3 text-sm ring-2 ring-primary/20">
                  Editing…
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-danger">With error</Label>
                <div className="flex h-10 items-center rounded-lg border border-danger px-3 text-sm text-muted-foreground ring-2 ring-danger/15">
                  bad@value
                </div>
                <p className="text-sm text-danger">Enter a valid email address.</p>
              </div>
              <div className="space-y-2">
                <Label>
                  Nickname{" "}
                  <span className="font-normal text-muted-foreground/70">(optional)</span>
                </Label>
                <Input disabled placeholder="Disabled state" />
              </div>
            </CardContent>
          </Card>
        </DesignSystemSection>

        <DesignSystemSection
          title="Empty states"
          description="Pattern: muted icon → what's missing → why it matters → ONE call to action. Action vocabulary, never a dead end."
        >
          <Card>
            <CardContent className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ClipboardList className="size-6" />
              </span>
              <p className="mt-4 text-sm font-semibold">No evaluated actions yet</p>
              <p className="mt-1 max-w-[360px] text-sm text-muted-foreground">
                Evaluations turn your work into verified capabilities.
              </p>
              <Button className="mt-5">Create your first Action</Button>
            </CardContent>
          </Card>
        </DesignSystemSection>

        {/* ── Dashboard patterns ─────────────────────────────────── */}
        <DesignSystemSection
          title="KPI cards"
          description="Numbers must tell a story: value + trend + plain-language caption, never a bare number."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Active contributors"
              value="248"
              deltaPercent={12}
              caption="vs. last 30 days"
              icon={<Users />}
            />
            <KpiCard
              label="Evaluations completed"
              value="1,432"
              deltaPercent={8}
              caption="vs. last 30 days"
              icon={<Star />}
            />
            <KpiCard
              label="Open actions"
              value="37"
              deltaPercent={-5}
              caption="vs. last 30 days"
              icon={<ClipboardList />}
            />
            <KpiCard
              label="Avg. capability growth"
              value="+0.4"
              caption="across all contributors, 90 days"
              icon={<TrendingUp />}
            />
          </div>
        </DesignSystemSection>

        <DesignSystemSection
          title="Table"
          description="Standard data table for lists (profiles, actions, evaluations)."
        >
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Sarah Johnson</TableCell>
                    <TableCell>Market Analysis Project</TableCell>
                    <TableCell>
                      <StatusBadge tone="success">
                        {config.verificationTiers[0].label}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">4.3</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Deniz Aksoy</TableCell>
                    <TableCell>Research Sustainability Review</TableCell>
                    <TableCell>
                      <StatusBadge tone="warning">Pending</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </DesignSystemSection>

        {/* ── Product patterns from verification-layer config ────── */}
        <DesignSystemSection
          title="Evaluation score scale (from config)"
          description="Fixed 0–5 scale rendered from the verification-layer stub. Scores 1 and 5 auto-require a comment."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scale reference</CardTitle>
                <CardDescription>config.scoreScale, unselected</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreScale steps={config.scoreScale} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">With a selection</CardTitle>
                <CardDescription>display-only selected state (4 · Strong)</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreScale steps={config.scoreScale} selected={4} />
              </CardContent>
            </Card>
          </div>
        </DesignSystemSection>

        <DesignSystemSection
          title="Per-capability scores"
          description="Computed by the capability engine (score × evaluation_weight). Deliberately no overall score."
        >
          <Card>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
              <CapabilityScore
                label="Strategic Thinking"
                score={4.6}
                caption="based on 3 evaluated actions"
              />
              <CapabilityScore
                label="Communication"
                score={4.3}
                caption="based on 2 evaluations"
              />
              <CapabilityScore
                label="Problem Solving"
                score={3.8}
                caption="based on 4 evaluated actions"
              />
              <CapabilityScore
                label="Leadership"
                score={2.9}
                caption="based on 1 evaluation · low familiarity"
              />
            </CardContent>
          </Card>
        </DesignSystemSection>

        <DesignSystemSection
          title="Config-driven lists (verification-layer stub)"
          description="Everything below renders from mock-config.ts and will switch to the live API without UI changes."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluator roles</CardTitle>
                <CardDescription>context: {config.context}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {config.evaluatorRoles.map((role) => (
                  <Badge key={role.id} variant="secondary">
                    {role.label}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Difficulty levels</CardTitle>
                <CardDescription>fixed in every context</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {config.difficultyLevels.map((level) => (
                  <Badge key={level.id} variant="outline">
                    {level.label}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capability catalogue</CardTitle>
                <CardDescription>families → capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.capabilityCatalogue.map((family) => (
                  <div key={family.id}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {family.label}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {family.capabilities.map((capability) => (
                        <Badge key={capability.id} variant="secondary">
                          {capability.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </DesignSystemSection>

        <DesignSystemSection
          title="Motion"
          description="Only interactive elements move — motion is an affordance signal. Use .card-interactive on clickable cards and .row-interactive on clickable rows; never on static content. Respects prefers-reduced-motion."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="card-interactive cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Clickable card</CardTitle>
                <CardDescription>
                  hover me — lifts 2px, soft ink shadow, blue border hint
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Static card</CardTitle>
                <CardDescription>
                  not clickable, so it does not move
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </DesignSystemSection>

        <DesignSystemSection
          title="Progress & loading"
          description="Progress for multi-step flows (onboarding, evaluation); skeletons while data loads."
        >
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Step 2 of 4 · Capabilities</span>
                  <span className="font-medium">50%</span>
                </div>
                <Progress value={50} />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </DesignSystemSection>
      </main>
    </div>
  );
}
