"use client";

/**
 * Finished-task view (v1.10 §7 step 8 / flow-v9). ONE evaluated action, shown to
 * the worker (and evaluator on that action). This is the ONLY worker-facing
 * surface that shows SKILL-LEVEL ratings + comments — the profile and org
 * dashboards stay Capability-only (R1 / v1.10 §7). Reads localStorage; the real
 * fetch-by-id is Cyprian's. TODO(cyprian): GET action + its evaluations by id.
 */

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { getCapability, getSkill, resolveCapability, SCORE_MAX } from "@/lib/catalogue";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import type { ActionRecord, Evaluation, SkillScore } from "@/lib/actions/types";

const NO_ACTIONS: ActionRecord[] = [];
const NO_EVALS: Evaluation[] = [];

const titleCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function FinishedTaskPage() {
  const router = useRouter();
  const { actionId } = useParams<{ actionId: string }>();
  const actions = useLocalDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts, NO_ACTIONS);
  const evaluations = useLocalDraft<Evaluation[]>(DRAFT_KEYS.evaluations, NO_EVALS);

  const action = actions.find((a) => a.action_id === actionId);
  const evals = evaluations
    .filter((e) => e.action_id === actionId && Array.isArray(e.skill_scores))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (!action) {
    return (
      <AppLayout userRole="student">
        <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShieldAlert className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-foreground">Action not found</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We couldn&apos;t find that action in this browser.
          </p>
          <Button className="mt-5" variant="outline" onClick={() => router.push("/s/actions")}>
            <ArrowLeft /> Back to My Actions
          </Button>
        </div>
      </AppLayout>
    );
  }

  const ev = action.evidence;

  return (
    <AppLayout userRole="student">
      <div className="space-y-6">
        <button
          onClick={() => router.push("/s/actions")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> My Actions
        </button>

        {/* Action detail */}
        <section className="rounded-xl border bg-card p-6 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{action.title}</h1>
          {action.description && (
            <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
          )}
          {action.expected_outcome && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Expected outcome:</span>{" "}
              {action.expected_outcome}
            </p>
          )}

          {(ev?.link || (ev?.files?.length ?? 0) > 0 || ev?.note) && (
            <div className="mt-4 border-t pt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Evidence
              </h2>
              {ev?.link && (
                <a
                  href={ev.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" /> {ev.link}
                </a>
              )}
              {ev?.files?.map((f, i) => (
                <div key={i} className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-3.5" /> {f.name}
                  {f.hash && <span className="font-mono text-[10px]">{f.hash.slice(0, 10)}…</span>}
                </div>
              ))}
              {ev?.note && <p className="mt-2 text-sm text-muted-foreground">{ev.note}</p>}
            </div>
          )}
        </section>

        {/* Evaluations — skill-level feedback (this action only) */}
        {evals.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-12 text-center shadow-card">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CheckCircle2 className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">Not evaluated yet</p>
            <p className="mt-1 max-w-[380px] text-sm text-muted-foreground">
              Once an evaluator scores this action, their skill-level feedback shows here.
            </p>
            <Button className="mt-5" onClick={() => router.push(`/s/actions/request/${action.action_id}`)}>
              Request an evaluation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Evaluation feedback{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (skill-level — visible on this action only)
              </span>
            </h2>
            {evals.map((e) => (
              <EvaluationCard key={e.evaluation_id} evaluation={e} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function EvaluationCard({ evaluation: e }: { evaluation: Evaluation }) {
  const groups = groupByCapability(e.skill_scores);
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {titleCase(e.evaluator_role)} · {titleCase(e.evaluator_relationship.replace(/_/g, " "))} ·
          difficulty {titleCase(e.difficulty_confirmed)} · evidence quality {e.evidence_quality}/{SCORE_MAX}
        </span>
        <span>{fmtDate(e.created_at)}</span>
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.name}>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {g.name}
            </div>
            <ul className="mt-2 space-y-2">
              {g.items.map((it) => (
                <li key={it.label} className="border-b border-muted pb-2 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-foreground">{it.label}</span>
                    <span className="shrink-0 rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                      {it.score}/{SCORE_MAX}
                    </span>
                  </div>
                  {it.comment && (
                    <p className="mt-1 text-xs text-muted-foreground">“{it.comment}”</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

type Grouped = { name: string; items: { label: string; score: number; comment?: string }[] };

function groupByCapability(skillScores: SkillScore[]): Grouped[] {
  const map = new Map<string, Grouped>();
  for (const ss of skillScores) {
    const capId = ss.capability_id_resolved ?? resolveCapability(ss.skill_id)?.capability_id ?? "unknown";
    const name = getCapability(capId)?.name ?? "Capability";
    if (!map.has(capId)) map.set(capId, { name, items: [] });
    map.get(capId)!.items.push({
      label: getSkill(ss.skill_id)?.label ?? ss.skill_id,
      score: ss.score,
      comment: ss.comment,
    });
  }
  return [...map.values()];
}
