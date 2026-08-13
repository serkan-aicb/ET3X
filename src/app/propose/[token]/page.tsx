"use client";

/**
 * Review a proposed Action — Path B-5b evaluator side (v6 §5b). A worker sent this
 * link. The invite resolves publicly, but acting on it needs a rudimentary profile
 * (R12) — gated in-page. The evaluator can Accept & lock (as-is), Adjust & lock
 * (edit the scope first) or Decline (one click, optional reason, no negotiation).
 * Once LOCKED the scope is final on both sides.
 *
 * Frozen build: reads/writes the localStorage proposals store.
 * TODO(cyprian): proposal lock / adjust / decline API.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock, Pencil, ShieldAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountGate } from "@/components/account/account-gate";
import { FocusedFlowShell } from "@/components/layout/focused-flow-shell";
import { SkillPicker } from "@/components/catalogue/skill-picker";
import { getCapability, getSkill, resolveCapability } from "@/lib/catalogue";
import { DRAFT_KEYS, readDraft, useLocalDraft, writeDraft } from "@/lib/local-draft";
import type { Proposal, RudimentaryProfile } from "@/lib/actions/types";

const NO_PROPOSALS: Proposal[] = [];

export default function ProposeReviewPage() {
  const { token } = useParams<{ token: string }>();
  const proposals = useLocalDraft<Proposal[]>(DRAFT_KEYS.proposals, NO_PROPOSALS);
  const proposal = proposals.find((p) => p.token === token);

  if (!proposal) return <Notice />;
  if (proposal.status !== "proposed") return <Notice handled status={proposal.status} />;

  return (
    <AccountGate
      title="Sign in to review this proposal"
      subtitle="Someone asked you to evaluate their work. Add a minimal profile — email, organisation and your role — then lock the scope or decline."
    >
      <Reviewer proposal={proposal} />
    </AccountGate>
  );
}

function Reviewer({ proposal }: { proposal: Proposal }) {
  const proposals = useLocalDraft<Proposal[]>(DRAFT_KEYS.proposals, NO_PROPOSALS);
  const [outcome, setOutcome] = useState<"locked" | "declined" | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [title, setTitle] = useState(proposal.title);
  const [description, setDescription] = useState(proposal.description);
  const [skillIds, setSkillIds] = useState<string[]>(
    proposal.action_skills.map((s) => s.skill_id)
  );
  const [reason, setReason] = useState("");

  const me = () => readDraft<RudimentaryProfile>(DRAFT_KEYS.rudimentaryProfile)?.email ?? "Evaluator";

  const patch = (changes: Partial<Proposal>) =>
    writeDraft(
      DRAFT_KEYS.proposals,
      proposals.map((p) => (p.proposal_id === proposal.proposal_id ? { ...p, ...changes } : p))
    );

  const lock = (adjusted: boolean) => {
    const scope = adjusted
      ? {
          title: title.trim(),
          description: description.trim(),
          action_skills: skillIds.map((id) => ({
            skill_id: id,
            capability_id_resolved: resolveCapability(id)?.capability_id ?? null,
          })),
        }
      : {};
    patch({
      ...scope,
      status: "locked",
      adjusted,
      locked_by: me(),
      locked_at: new Date().toISOString(),
    });
    setOutcome("locked");
  };

  const decline = () => {
    patch({ status: "declined", decline_reason: reason.trim() || undefined, locked_by: me() });
    setOutcome("declined");
  };

  const STEPS = ["Review", "Decision"];

  if (outcome) {
    return (
      <FocusedFlowShell steps={STEPS} currentStep={STEPS.length} saveExitLabel="">
        <Confirmation outcome={outcome} />
      </FocusedFlowShell>
    );
  }

  const groups = groupSkills(proposal.action_skills);

  return (
    <FocusedFlowShell steps={STEPS} currentStep={0} saveExitLabel="">
      <div>
        <StepHeading
          title="A proposed Action for you to evaluate"
          subtitle={`Proposed by ${proposal.proposed_by}. Lock the scope so it's fixed for both of you, adjust it first, or decline.`}
        />

        {!adjusting ? (
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="text-base font-semibold text-foreground">{proposal.title}</h2>
            {proposal.description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{proposal.description}</p>
            )}
            <div className="mt-4 space-y-3">
              {groups.map((g) => (
                <div key={g.name}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.name}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {g.skills.map((s) => (
                      <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground/80">
              Organisation visibility is the worker&apos;s choice
              {proposal.org_visibility === "yes" ? " (visible to organisations)" : " (kept private)"} —
              you can&apos;t change it.
            </p>
          </section>
        ) : (
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-primary">
              <Pencil className="size-4" /> Adjusting the scope before locking
            </div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">Skills</label>
            <SkillPicker selectedIds={skillIds} onChange={setSkillIds} />
          </section>
        )}

        {declining && (
          <section className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-5">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Reason <span className="font-normal text-muted-foreground/70">(optional — no back-and-forth)</span>
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Out of scope for what I can assess."
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDeclining(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={decline}>
                Confirm decline
              </Button>
            </div>
          </section>
        )}

        {!declining && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeclining(true)}>
              <X /> Decline
            </Button>
            <div className="flex gap-2">
              {!adjusting ? (
                <>
                  <Button variant="outline" onClick={() => setAdjusting(true)}>
                    <Pencil /> Adjust
                  </Button>
                  <Button onClick={() => lock(false)}>
                    <Lock /> Accept &amp; lock
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setAdjusting(false)}>
                    <ArrowLeft /> Cancel
                  </Button>
                  <Button onClick={() => lock(true)} disabled={title.trim().length < 3 || skillIds.length === 0}>
                    <Lock /> Save &amp; lock
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </FocusedFlowShell>
  );
}

function Confirmation({ outcome }: { outcome: "locked" | "declined" }) {
  const locked = outcome === "locked";
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span
        className={`flex size-16 items-center justify-center rounded-full ${
          locked ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        {locked ? <Lock className="size-9" /> : <X className="size-9" />}
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        {locked ? "Scope locked" : "Proposal declined"}
      </h1>
      <p className="mt-2 max-w-[440px] text-[15px] leading-relaxed text-muted-foreground">
        {locked
          ? "The scope is now fixed for both of you. The worker will do the work and submit their evidence, then you'll score it. This link is used."
          : "You declined this proposal. The worker keeps their draft and can revise and resend. This link is used."}
      </p>
    </div>
  );
}

function Notice({ handled, status }: { handled?: boolean; status?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-[420px] rounded-xl border bg-card p-8 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {handled ? <CheckCircle2 className="size-6" /> : <ShieldAlert className="size-6" />}
        </span>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          {handled ? "This proposal has already been handled" : "Invalid or expired link"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {handled
            ? status === "declined"
              ? "It was declined. The worker may send a revised proposal."
              : "The scope is locked. Nothing more to do here."
            : "We couldn't find a proposal for this link. Check the URL, or ask for a new one."}
        </p>
      </div>
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function groupSkills(action_skills: Proposal["action_skills"]) {
  const map = new Map<string, { name: string; skills: string[] }>();
  for (const s of action_skills) {
    const cap = s.capability_id_resolved ? getCapability(s.capability_id_resolved) : resolveCapability(s.skill_id);
    const skill = getSkill(s.skill_id);
    if (!cap || !skill) continue;
    if (!map.has(cap.capability_id)) map.set(cap.capability_id, { name: cap.name, skills: [] });
    map.get(cap.capability_id)!.skills.push(skill.label);
  }
  return [...map.values()];
}
