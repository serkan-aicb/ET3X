"use client";

/**
 * Assignments — tracking for actions an evaluator has ISSUED (Path B, v6 §5a).
 * Shows each Assignment, its recipients and their status, with the single-use
 * receive link per recipient. Recipients complete their copy via /receive/<token>.
 *
 * Frozen build: reads the localStorage assignments store.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardList, Copy, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { getCapability, resolveCapability } from "@/lib/catalogue";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import type { Assignment, ActionSkill } from "@/lib/actions/types";

const EMPTY: Assignment[] = [];

export default function AssignmentsPage() {
  const router = useRouter();
  const assignments = useLocalDraft<Assignment[]>(DRAFT_KEYS.assignments, EMPTY);

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Actions you&apos;ve issued to others to complete and be evaluated on.
            </p>
          </div>
          <Button onClick={() => router.push("/s/actions/assign")}>
            <Plus /> Assign an Action
          </Button>
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center shadow-card">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ClipboardList className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">No assignments yet</p>
            <p className="mt-1 max-w-[380px] text-sm text-muted-foreground">
              Issue an Action to a person or a whole class. Each recipient gets a private copy to
              complete, then you evaluate their submitted work.
            </p>
            <Button className="mt-5" onClick={() => router.push("/s/actions/assign")}>
              <Plus /> Assign your first Action
            </Button>
          </div>
        ) : (
          <ul className="space-y-6">
            {assignments.map((a) => (
              <AssignmentCard key={a.assignment_id} assignment={a} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

function AssignmentCard({ assignment: a }: { assignment: Assignment }) {
  const caps = distinctCapabilityNames(a.action_skills);
  const submitted = a.recipients.filter((r) => r.status === "submitted").length;
  const created = new Date(a.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{a.title}</h2>
          {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {caps.map((name) => (
              <span
                key={name}
                className="rounded-md bg-badge-blue-bg px-2 py-0.5 text-xs font-medium text-badge-blue-text ring-1 ring-badge-blue-text/15"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
          <Users className="size-3.5" /> {submitted}/{a.recipients.length} submitted
        </span>
      </div>

      <div className="mt-4 border-t pt-3">
        <ul className="divide-y divide-muted">
          {a.recipients.map((r) => (
            <RecipientRow key={r.token} email={r.email} token={r.token} status={r.status} />
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground/70">Issued {created}</p>
    </li>
  );
}

function RecipientRow({
  email,
  token,
  status,
}: {
  email: string;
  token: string;
  status: "assigned" | "submitted";
}) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/receive/${token}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{email}</span>
      {status === "submitted" ? (
        <span className="shrink-0 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success">
          Submitted
        </span>
      ) : (
        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned
        </span>
      )}
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Link"}
      </Button>
    </li>
  );
}

function distinctCapabilityNames(skills: ActionSkill[]): string[] {
  const names = new Set<string>();
  for (const s of skills) {
    const cap = s.capability_id_resolved
      ? getCapability(s.capability_id_resolved)
      : resolveCapability(s.skill_id);
    if (cap) names.add(cap.name);
  }
  return [...names];
}
