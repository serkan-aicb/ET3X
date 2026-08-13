"use client";

/**
 * Proposals — tracking for actions a worker has PROPOSED to an evaluator
 * (Path B-5b, v6 §5b). Shows each proposal and its status through the lifecycle:
 *   proposed → locked (or declined) → submitted → evaluated.
 * When locked, the worker adds evidence here; that materialises a scoreable action
 * + an evaluation link the evaluator uses to score it.
 *
 * Frozen build: reads/writes the localStorage proposals store.
 * TODO(cyprian): proposals + submission + evaluation-link API.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  Lock,
  Plus,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { getCapability, resolveCapability } from "@/lib/catalogue";
import { sha256Hex } from "@/lib/evidence/hash";
import { DRAFT_KEYS, readDraft, useLocalDraft, writeDraft } from "@/lib/local-draft";
import type {
  ActionRecord,
  ActionSkill,
  EvaluationInvite,
  Evidence,
  Proposal,
  ProposalStatus,
} from "@/lib/actions/types";

const EMPTY: Proposal[] = [];
const NO_INVITES: EvaluationInvite[] = [];
type EvidenceFile = { name: string; size: number; hash?: string };

const EVIDENCE_MODES = [
  { value: "external_reference", label: "External link" },
  { value: "stored", label: "Upload file" },
] as const;

function newToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tok_${Date.now().toString(36)}`;
}

export default function ProposalsPage() {
  const router = useRouter();
  const proposals = useLocalDraft<Proposal[]>(DRAFT_KEYS.proposals, EMPTY);

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Proposals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Work you&apos;ve proposed to an evaluator to lock, then complete and be evaluated on.
            </p>
          </div>
          <Button onClick={() => router.push("/s/actions/propose")}>
            <Plus /> Propose an Action
          </Button>
        </div>

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center shadow-card">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lightbulb className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">No proposals yet</p>
            <p className="mt-1 max-w-[400px] text-sm text-muted-foreground">
              Propose a piece of work to an evaluator. They lock the scope before you start, so
              there are no surprises when it&apos;s assessed.
            </p>
            <Button className="mt-5" onClick={() => router.push("/s/actions/propose")}>
              <Plus /> Propose your first Action
            </Button>
          </div>
        ) : (
          <ul className="space-y-6">
            {proposals.map((p) => (
              <ProposalCard key={p.proposal_id} proposal={p} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

function ProposalCard({ proposal: p }: { proposal: Proposal }) {
  const router = useRouter();
  const invites = useLocalDraft<EvaluationInvite[]>(DRAFT_KEYS.evaluationInvites, NO_INVITES);
  const caps = distinctCapabilityNames(p.action_skills);
  const created = new Date(p.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const proposeLink =
    typeof window !== "undefined" ? `${window.location.origin}/propose/${p.token}` : "";
  const evalInvite = invites.find((i) => i.proposal_id === p.proposal_id);
  const evalLink =
    typeof window !== "undefined" && evalInvite
      ? `${window.location.origin}/evaluate/${evalInvite.token}`
      : "";

  return (
    <li className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{p.title}</h2>
          {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
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
        <StatusBadge status={p.status} />
      </div>

      {/* proposed → share the evaluator link */}
      {p.status === "proposed" && (
        <Row>
          <span className="text-sm text-muted-foreground">
            Send this to your evaluator to lock the scope.
          </span>
          <CopyButton value={proposeLink} label="Evaluator link" />
        </Row>
      )}

      {/* declined → reason + propose again */}
      {p.status === "declined" && (
        <Row>
          <span className="text-sm text-muted-foreground">
            Declined{p.decline_reason ? `: “${p.decline_reason}”` : ""}. You can revise and resend.
          </span>
          <Button size="sm" variant="outline" onClick={() => router.push("/s/actions/propose")}>
            Propose again
          </Button>
        </Row>
      )}

      {/* locked → add evidence & request evaluation */}
      {p.status === "locked" && <LockedActions proposal={p} />}

      {/* submitted → hand the evaluation link to the evaluator (or open it here) */}
      {p.status === "submitted" && (
        <Row>
          <span className="text-sm text-muted-foreground">
            Evidence submitted. Send the evaluation link to your evaluator to score it.
          </span>
          <div className="flex gap-2">
            {evalLink && <CopyButton value={evalLink} label="Evaluation link" />}
            {evalInvite && (
              <Button size="sm" onClick={() => router.push(`/evaluate/${evalInvite.token}`)}>
                Open evaluator view
              </Button>
            )}
          </div>
        </Row>
      )}

      {/* evaluated → done */}
      {p.status === "evaluated" && (
        <Row>
          <span className="text-sm text-muted-foreground">
            Evaluated — the capability now counts on your profile.
          </span>
          <Button size="sm" variant="outline" onClick={() => router.push("/s/profile")}>
            View profile
          </Button>
        </Row>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground/70">
        Proposed {created}
        {p.status !== "proposed" && p.adjusted ? " · scope adjusted by the evaluator" : ""}
      </p>
    </li>
  );
}

function LockedActions({ proposal: p }: { proposal: Proposal }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("external_reference");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
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
    const now = new Date().toISOString();

    // Materialise a scoreable action from the locked scope + this evidence.
    const actionId = `act_${p.proposal_id}`;
    const action: ActionRecord = {
      action_id: actionId,
      title: p.title,
      description: p.description,
      expected_outcome: "",
      action_skills: p.action_skills,
      ai_involvement: "none",
      difficulty_declared: "INTERMEDIATE",
      evidence,
      org_visibility: p.org_visibility,
      created_at: now,
    };
    const actions = readDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts) ?? [];
    if (!actions.some((a) => a.action_id === actionId)) {
      writeDraft(DRAFT_KEYS.actionsDrafts, [action, ...actions]);
    }

    // Evaluation link back to the same evaluator, tied to this proposal.
    const invite: EvaluationInvite = {
      token: newToken(),
      action_id: actionId,
      action_title: p.title,
      created_at: now,
      status: "pending",
      proposal_id: p.proposal_id,
    };
    const invites = readDraft<EvaluationInvite[]>(DRAFT_KEYS.evaluationInvites) ?? [];
    writeDraft(DRAFT_KEYS.evaluationInvites, [invite, ...invites]);

    // Advance the proposal.
    const list = readDraft<Proposal[]>(DRAFT_KEYS.proposals) ?? [];
    writeDraft(
      DRAFT_KEYS.proposals,
      list.map((x) =>
        x.proposal_id === p.proposal_id
          ? { ...x, status: "submitted" as const, evidence, submitted_at: now }
          : x
      )
    );
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-start gap-2 rounded-lg bg-primary-soft px-4 py-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Scope locked by {p.locked_by ?? "the evaluator"}
          {p.adjusted ? " (adjusted)" : ""}. Do the work, then add your evidence.
        </span>
      </div>

      {!open ? (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={() => setOpen(true)}>
            Add evidence &amp; request evaluation
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
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
              </button>
            ))}
          </div>

          {mode === "external_reference" ? (
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-6 text-center hover:border-primary">
                <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                {hashing ? (
                  <span className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="size-4 animate-spin" /> Processing…
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Upload className="size-4 text-primary" /> Drop files or{" "}
                    <span className="text-primary">browse</span>
                  </span>
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

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Note for the evaluator (optional)."
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!hasEvidence}>
              <CheckCircle2 /> Submit evidence
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      {children}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };
  return (
    <Button size="sm" variant="outline" onClick={copy}>
      {copied ? <Check /> : <Copy />} {copied ? "Copied" : label}
    </Button>
  );
}

function StatusBadge({ status }: { status: ProposalStatus }) {
  const map = {
    proposed: ["Awaiting evaluator", "bg-muted text-muted-foreground"],
    locked: ["Scope locked", "bg-primary-soft text-primary"],
    submitted: ["Evidence submitted", "bg-warning/15 text-warning-foreground"],
    evaluated: ["Evaluated", "bg-success/15 text-success"],
    declined: ["Declined", "bg-danger/10 text-danger"],
  } as const;
  const [label, cls] = map[status];
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
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
