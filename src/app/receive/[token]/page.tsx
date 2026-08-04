"use client";

/**
 * Receive an issued Action — Path B recipient side (v6 §5a). A worker opens the
 * single-use link from an evaluator's assignment. The invite resolves publicly,
 * but taking part requires a rudimentary profile (R12) — gated in-page. The
 * action definition (title / description / skills) is READ-ONLY; the recipient
 * submits their OWN evidence and sets their OWN org_visibility consent (§5c).
 *
 * Frozen build: reads/writes the localStorage assignments store.
 * TODO(cyprian): per-recipient action instance + submission API.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountGate } from "@/components/account/account-gate";
import { FocusedFlowShell } from "@/components/layout/focused-flow-shell";
import { getCapability, getEnum, getSkill, resolveCapability } from "@/lib/catalogue";
import { sha256Hex } from "@/lib/evidence/hash";
import { DRAFT_KEYS, useLocalDraft, writeDraft } from "@/lib/local-draft";
import type { Assignment, AssignmentRecipient, Evidence } from "@/lib/actions/types";

const NO_ASSIGNMENTS: Assignment[] = [];
type EvidenceFile = { name: string; size: number; hash?: string };

const EVIDENCE_MODES = [
  { value: "external_reference", label: "External link", meaning: "Link to evidence hosted elsewhere. Preferred." },
  { value: "stored", label: "Upload file", meaning: "Capped fallback. Hashed at submission." },
] as const;

export default function ReceivePage() {
  const { token } = useParams<{ token: string }>();
  const assignments = useLocalDraft<Assignment[]>(DRAFT_KEYS.assignments, NO_ASSIGNMENTS);

  const assignment = assignments.find((a) => a.recipients.some((r) => r.token === token));
  const recipient = assignment?.recipients.find((r) => r.token === token);

  if (!assignment || !recipient) return <Notice />;
  if (recipient.status === "submitted") return <Notice submitted />;
  if (recipient.status === "evaluated") return <Notice evaluated />;

  return (
    <AccountGate
      title="Sign in to start your task"
      subtitle="You've been assigned an Action. Add a minimal profile — email, organisation and role — then submit your work."
    >
      <Receiver assignment={assignment} recipient={recipient} />
    </AccountGate>
  );
}

function Receiver({
  assignment,
  recipient,
}: {
  assignment: Assignment;
  recipient: AssignmentRecipient;
}) {
  const assignments = useLocalDraft<Assignment[]>(DRAFT_KEYS.assignments, NO_ASSIGNMENTS);
  const groups = groupSkills(assignment.action_skills);
  const visibilityOptions = getEnum("org_visibility");

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [mode, setMode] = useState("external_reference");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [orgVisibility, setOrgVisibility] = useState("yes"); // recipient's own consent (§5c)
  const [hashing, setHashing] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    setHashing(true);
    const next: EvidenceFile[] = [];
    for (const f of Array.from(list)) {
      const hash = await sha256Hex(f); // hash every file (R13)
      next.push({ name: f.name, size: f.size, hash });
    }
    setFiles((prev) => [...prev, ...next]);
    setHashing(false);
  };

  const hasEvidence = mode === "external_reference" ? link.trim() !== "" : files.length > 0;

  const submit = () => {
    const evidence: Evidence = { note: note.trim(), link: link.trim(), mode, files };
    const updated = assignments.map((a) =>
      a.assignment_id !== assignment.assignment_id
        ? a
        : {
            ...a,
            recipients: a.recipients.map((r) =>
              r.token !== recipient.token
                ? r
                : {
                    ...r,
                    status: "submitted" as const,
                    evidence,
                    org_visibility: orgVisibility,
                    submitted_at: new Date().toISOString(),
                  }
            ),
          }
    );
    writeDraft(DRAFT_KEYS.assignments, updated);
    setDone(true);
  };

  const STEPS = ["Your task", "Submit"];

  if (done) {
    return (
      <FocusedFlowShell steps={STEPS} currentStep={STEPS.length} saveExitLabel="">
        <Confirmation />
      </FocusedFlowShell>
    );
  }

  return (
    <FocusedFlowShell steps={STEPS} currentStep={step} saveExitLabel="">
      {step === 0 ? (
        <div>
          <StepHeading
            title="You've been assigned an Action"
            subtitle={`Issued by ${assignment.issued_by}. Do the work, then submit your evidence. The task itself can't be changed.`}
          />
          {recipient.status === "declined" && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                Your previous submission was declined
                {recipient.decline_reason ? `: “${recipient.decline_reason}”` : ""}. Update your
                evidence and resubmit.
              </span>
            </div>
          )}
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="text-base font-semibold text-foreground">{assignment.title}</h2>
            {assignment.description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{assignment.description}</p>
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
          </section>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary-soft px-4 py-3 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>The title, description and skills are fixed by whoever assigned this. You add the evidence.</span>
          </div>
          <div className="mt-8 flex justify-end">
            <Button onClick={() => setStep(1)}>
              Continue <ArrowRight />
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <StepHeading title="Submit your evidence" subtitle="Proof of your work, and who may see it." />

          <section className="rounded-xl border bg-card p-6 shadow-card">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">How should evidence be stored?</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {EVIDENCE_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    mode === m.value ? "border-primary bg-primary-soft" : "bg-card hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {m.value === "stored" && <Lock className="size-3.5 text-primary" />}
                    {m.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground/80">{m.meaning}</span>
                </button>
              ))}
            </div>

            {mode === "external_reference" ? (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Evidence link</label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ) : (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Files <span className="font-normal text-primary">· hashed at submission</span>
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-8 text-center hover:border-primary">
                  <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                  {hashing ? (
                    <span className="flex items-center gap-2 text-sm text-primary">
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </span>
                  ) : (
                    <>
                      <Upload className="mb-2 size-6 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        Drop files or <span className="text-primary">browse</span>
                      </span>
                    </>
                  )}
                </label>
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        {f.hash && (
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                            {f.hash.slice(0, 10)}…
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, x) => x !== i))}
                          className="text-muted-foreground/70 hover:text-danger"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">
              Note <span className="font-normal text-muted-foreground/70">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Anything the evaluator should know."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </section>

          {/* Each recipient sets their OWN org_visibility consent (§5c, R10) */}
          <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Organisation visibility</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your choice — whoever assigned this can&apos;t set it for you. You can restrict it.
            </p>
            <div className="mt-3 space-y-2">
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

          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={submit} disabled={!hasEvidence}>
              <CheckCircle2 /> Submit work
            </Button>
          </div>
        </div>
      )}
    </FocusedFlowShell>
  );
}

function Confirmation() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Work submitted</h1>
      <p className="mt-2 max-w-[440px] text-[15px] leading-relaxed text-muted-foreground">
        Thanks — your evidence has been sent back to whoever assigned this. They&apos;ll evaluate it
        against the rubric. This link is now used.
      </p>
    </div>
  );
}

function Notice({ submitted, evaluated }: { submitted?: boolean; evaluated?: boolean }) {
  const done = submitted || evaluated;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-[420px] rounded-xl border bg-card p-8 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {done ? <CheckCircle2 className="size-6" /> : <ShieldAlert className="size-6" />}
        </span>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          {evaluated
            ? "This has been evaluated"
            : submitted
              ? "You've already submitted this"
              : "Invalid or expired link"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {evaluated
            ? "The evaluator scored your submission — check the profile for the result."
            : submitted
              ? "Your work is in. You'll hear back once the evaluator scores it."
              : "We couldn't find an assigned Action for this link. Check the URL, or ask for a new one."}
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

function groupSkills(action_skills: Assignment["action_skills"]) {
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
