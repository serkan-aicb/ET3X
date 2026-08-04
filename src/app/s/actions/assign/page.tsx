"use client";

/**
 * Assign an Action — Path B, evaluator-issued (v6 §5a). An evaluator defines the
 * action (title / description / skills) once and issues it to one or many
 * recipients (class/team broadcast). The system creates one Assignment holding a
 * single-use receive link per recipient; recipients open theirs, submit their own
 * evidence and set their own visibility. Recipients can't edit the definition.
 *
 * Frozen build: the Assignment is a localStorage record; recipients receive via
 * /receive/<token>. TODO(cyprian): assignments + per-recipient instances API.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FocusedFlowShell } from "@/components/layout/focused-flow-shell";
import { SkillPicker } from "@/components/catalogue/skill-picker";
import { getSkill, resolveCapability } from "@/lib/catalogue";
import { DRAFT_KEYS, readDraft, writeDraft } from "@/lib/local-draft";
import type { Assignment, AssignmentRecipient, RudimentaryProfile } from "@/lib/actions/types";

const STEPS = ["Details", "Skills", "Recipients", "Review"];

function parseEmails(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s))
    ),
  ];
}
function newToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tok_${Date.now().toString(36)}`;
}

export default function AssignActionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [recipientsRaw, setRecipientsRaw] = useState("");

  const emails = parseEmails(recipientsRaw);

  const issue = () => {
    const issuer = readDraft<RudimentaryProfile>(DRAFT_KEYS.rudimentaryProfile);
    const assignment: Assignment = {
      assignment_id: `asg_${newToken()}`,
      title: title.trim(),
      description: description.trim(),
      action_skills: skillIds.map((id) => ({
        skill_id: id,
        capability_id_resolved: resolveCapability(id)?.capability_id ?? null,
      })),
      issued_by: issuer?.email ?? "You",
      created_at: new Date().toISOString(),
      recipients: emails.map<AssignmentRecipient>((email) => ({
        token: newToken(),
        email,
        status: "assigned",
      })),
    };
    const list = readDraft<Assignment[]>(DRAFT_KEYS.assignments) ?? [];
    writeDraft(DRAFT_KEYS.assignments, [assignment, ...list]);
    router.push("/s/assignments");
  };

  return (
    <FocusedFlowShell steps={STEPS} currentStep={step} onSaveExit={() => router.push("/s/assignments")}>
      {step === 0 && (
        <div>
          <StepHeading
            title="Assign an Action"
            subtitle="Define the work once, then issue it to one or many people. They do it and submit their own evidence."
          />
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Case study: market entry analysis"
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">
              Description <span className="font-normal text-muted-foreground/70">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What should they do?"
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
            title="Which skills does it demonstrate?"
            subtitle="Fixed for everyone you assign it to — recipients can't change them."
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
            title="Who's it for?"
            subtitle="Add recipients by email — one person or a whole class. Each gets their own private copy."
          />
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Recipient emails</label>
            <textarea
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              rows={5}
              placeholder="anna@uni.fi, ben@uni.fi, chris@uni.fi…"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" /> {emails.length} valid recipient{emails.length === 1 ? "" : "s"}
            </p>
            <p className="mt-3 text-[11px] text-muted-foreground/70">
              Org-unit and self-enrol link / QR options come later — email issue for now.
            </p>
          </div>
          <NavRow onBack={() => setStep(1)}>
            <Button onClick={() => setStep(3)} disabled={emails.length === 0}>
              Continue <ArrowRight />
            </Button>
          </NavRow>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeading
            title="Review & issue"
            subtitle="Each recipient gets a private, read-only copy to complete."
          />
          <div className="space-y-4">
            <Card title="Action">
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
            <Card title={`Recipients (${emails.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {emails.map((e) => (
                  <span key={e} className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    {e}
                  </span>
                ))}
              </div>
            </Card>
          </div>
          <NavRow onBack={() => setStep(2)}>
            <Button onClick={issue}>
              <Send /> Issue to {emails.length} {emails.length === 1 ? "person" : "people"}
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
