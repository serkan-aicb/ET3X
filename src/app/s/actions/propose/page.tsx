"use client";

/**
 * Propose an Action — Path B, worker-proposed (v6 §5b). The worker drafts the
 * scope (title / description / skills) and sets their OWN org_visibility consent,
 * then sends it to an evaluator who Accepts & locks / Adjusts & locks / Declines.
 * Once locked the scope is final on both sides — no negotiation.
 *
 * Frozen build: the Proposal is a localStorage record; the evaluator reviews it at
 * /propose/<token>. TODO(cyprian): proposals + lock/decline API.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FocusedFlowShell } from "@/components/layout/focused-flow-shell";
import { SkillPicker } from "@/components/catalogue/skill-picker";
import { getEnum, getSkill, resolveCapability } from "@/lib/catalogue";
import { DRAFT_KEYS, readDraft, writeDraft } from "@/lib/local-draft";
import type { Proposal, RudimentaryProfile } from "@/lib/actions/types";

const STEPS = ["Details", "Skills", "Consent", "Review"];

function newToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tok_${Date.now().toString(36)}`;
}

export default function ProposeActionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [orgVisibility, setOrgVisibility] = useState("yes");

  const visibilityOptions = getEnum("org_visibility");

  const send = () => {
    const me = readDraft<RudimentaryProfile>(DRAFT_KEYS.rudimentaryProfile);
    const proposal: Proposal = {
      proposal_id: `prp_${newToken()}`,
      token: newToken(),
      title: title.trim(),
      description: description.trim(),
      action_skills: skillIds.map((id) => ({
        skill_id: id,
        capability_id_resolved: resolveCapability(id)?.capability_id ?? null,
      })),
      org_visibility: orgVisibility,
      proposed_by: me?.email ?? "You",
      status: "proposed",
      created_at: new Date().toISOString(),
    };
    const list = readDraft<Proposal[]>(DRAFT_KEYS.proposals) ?? [];
    writeDraft(DRAFT_KEYS.proposals, [proposal, ...list]);
    router.push("/s/proposals");
  };

  return (
    <FocusedFlowShell steps={STEPS} currentStep={step} onSaveExit={() => router.push("/s/proposals")}>
      {step === 0 && (
        <div>
          <StepHeading
            title="Propose an Action to an evaluator"
            subtitle="Suggest the work you want assessed. An evaluator locks the scope before you start, so there are no surprises at the end."
          />
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build and test a demand-forecasting model"
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">
              Description <span className="font-normal text-muted-foreground/70">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What you plan to do, and what 'done' looks like."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="mt-8 flex justify-end">
            <Button onClick={() => setStep(1)} disabled={title.trim().length < 3}>
              Continue <ArrowRight />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <StepHeading
            title="Which skills will it demonstrate?"
            subtitle="The evaluator can adjust these before locking — this is your proposal."
          />
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <SkillPicker selectedIds={skillIds} onChange={setSkillIds} />
          </div>
          <NavRow onBack={() => setStep(0)}>
            <Button onClick={() => setStep(2)} disabled={skillIds.length === 0}>
              Continue <ArrowRight />
            </Button>
          </NavRow>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeading
            title="Organisation visibility"
            subtitle="Your choice — set now, and it stays yours. The evaluator can't change it."
          />
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <div className="space-y-2">
              {visibilityOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOrgVisibility(o.value)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    orgVisibility === o.value ? "border-primary bg-primary-soft" : "bg-card hover:bg-muted"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      orgVisibility === o.value ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {orgVisibility === o.value && <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {o.value === "yes" ? "Visible to organisations" : "Keep private"}
                    </span>
                    <span className="block text-xs text-muted-foreground/80">{o.meaning}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <NavRow onBack={() => setStep(1)}>
            <Button onClick={() => setStep(3)}>
              Continue <ArrowRight />
            </Button>
          </NavRow>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeading
            title="Review & send"
            subtitle="This goes to an evaluator to accept, adjust or decline. You'll get a link to send them."
          />
          <div className="space-y-4">
            <Card title="Proposed action">
              <div className="text-sm font-semibold text-foreground">{title}</div>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </Card>
            <Card title="Skills">
              <div className="flex flex-wrap gap-1.5">
                {skillIds.map((id) => {
                  const s = getSkill(id);
                  return s ? (
                    <span key={id} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">
                      {s.label}
                    </span>
                  ) : null;
                })}
              </div>
            </Card>
            <Card title="Organisation visibility">
              <div className="text-sm text-foreground">
                {orgVisibility === "yes" ? "Visible to organisations" : "Kept private"}
              </div>
            </Card>
          </div>
          <NavRow onBack={() => setStep(2)}>
            <Button onClick={send}>
              <Send /> Send to an evaluator
            </Button>
          </NavRow>
        </div>
      )}
    </FocusedFlowShell>
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

function NavRow({ onBack, children }: { onBack: () => void; children?: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
