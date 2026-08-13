"use client";

/**
 * My Actions — Week 3 (frozen build). Lists the Actions created by the
 * individual, read from the localStorage draft store. Each Action shows the
 * capabilities its skills count toward, AI involvement, declared difficulty
 * and visibility. Creating/scoring live elsewhere; this is the home surface.
 *
 * Persistence is localStorage only; real data is Cyprian's API later.
 */

import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Lock,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { getCapability, prettyEnum, resolveCapability } from "@/lib/catalogue";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import type { ActionRecord } from "@/lib/actions/types";

const EMPTY: ActionRecord[] = [];
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export default function MyActionsPage() {
  const router = useRouter();
  const actions = useLocalDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts, EMPTY);

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Actions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real work you can get evaluated into verified capabilities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/s/assignments")}>
              <Users /> Assignments
            </Button>
            <Button onClick={() => router.push("/s/actions/create")}>
              <Plus /> Create Action
            </Button>
          </div>
        </div>

        {actions.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center shadow-card">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ClipboardList className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">No Actions yet</p>
            <p className="mt-1 max-w-[360px] text-sm text-muted-foreground">
              An Action is a piece of real work. Create one, then invite someone to evaluate it —
              that&apos;s how skills become verified capabilities.
            </p>
            <Button className="mt-5" onClick={() => router.push("/s/actions/create")}>
              <Plus /> Create your first Action
            </Button>
          </div>
        ) : (
          <ul className="grid gap-6 lg:grid-cols-2">
            {actions.map((a) => (
              <ActionCard key={a.action_id} action={a} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

function ActionCard({ action: a }: { action: ActionRecord }) {
  const capabilities = distinctCapabilityNames(a.action_skills);
  const aiLabel = prettyEnum(a.ai_involvement);
  const created = new Date(a.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className="card-interactive flex flex-col rounded-xl border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold leading-snug text-foreground">{a.title}</h2>
        {a.org_visibility === "no" && (
          <span
            className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            title="Private — excluded from organisation analytics"
          >
            <Lock className="size-3" /> Private
          </span>
        )}
      </div>

      {a.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {capabilities.map((name) => (
          <span
            key={name}
            className="rounded-md bg-badge-blue-bg px-2 py-0.5 text-xs font-medium text-badge-blue-text ring-1 ring-badge-blue-text/15"
          >
            {name}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3.5" /> {aiLabel}
        </span>
        <span>{titleCase(a.difficulty_declared)}</span>
        <span className="ml-auto text-muted-foreground/70">Created {created}</span>
      </div>

      {/* View skill-level feedback (finished-task view) + request an evaluation. */}
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={`/s/actions/${a.action_id}`}>View feedback</a>
        </Button>
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={`/s/actions/request/${a.action_id}`}>Request evaluation</a>
        </Button>
      </div>
    </li>
  );
}

function distinctCapabilityNames(
  skills: { skill_id: string; capability_id_resolved: string | null }[]
): string[] {
  const names = new Set<string>();
  for (const s of skills) {
    // Prefer the snapshotted capability id (R4); fall back to a live resolve.
    const cap = s.capability_id_resolved
      ? getCapability(s.capability_id_resolved)
      : resolveCapability(s.skill_id);
    if (cap) names.add(cap.name);
  }
  return [...names];
}
