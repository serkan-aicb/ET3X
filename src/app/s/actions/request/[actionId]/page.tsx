"use client";

/**
 * Request an evaluation — Week 4 (frozen build). From one of the user's Actions,
 * generate a SINGLE-USE invite token and show the link + QR to share with an
 * evaluator (someone other than the creator — self-evaluation is forbidden, R6).
 *
 * The token + validation are Cyprian's in production (see workspace doc 15);
 * here the invite is a localStorage stub the evaluator screen reads by token.
 * TODO(cyprian): POST request-evaluation → real single-use token + consume API.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Check, Copy, Link2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { getCapability, resolveCapability } from "@/lib/catalogue";
import { DRAFT_KEYS, useLocalDraft, writeDraft } from "@/lib/local-draft";
import type { ActionRecord, EvaluationInvite } from "@/lib/actions/types";

const NO_ACTIONS: ActionRecord[] = [];
const NO_INVITES: EvaluationInvite[] = [];

export default function RequestEvaluationPage() {
  const { actionId } = useParams<{ actionId: string }>();
  const actions = useLocalDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts, NO_ACTIONS);
  const invites = useLocalDraft<EvaluationInvite[]>(DRAFT_KEYS.evaluationInvites, NO_INVITES);
  const [copied, setCopied] = useState(false);

  const action = actions.find((a) => a.action_id === actionId);
  const invite = invites.find((i) => i.action_id === actionId && i.status === "pending");

  const capabilityNames = action
    ? [
        ...new Set(
          action.action_skills
            .map((s) =>
              s.capability_id_resolved
                ? getCapability(s.capability_id_resolved)?.name
                : resolveCapability(s.skill_id)?.name
            )
            .filter((n): n is string => Boolean(n))
        ),
      ]
    : [];

  const link =
    invite && typeof window !== "undefined"
      ? `${window.location.origin}/evaluate/${invite.token}`
      : "";

  const createInvite = () => {
    if (!action) return;
    const token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `tok_${Date.now().toString(36)}`;
    const record: EvaluationInvite = {
      token,
      action_id: action.action_id,
      action_title: action.title,
      created_at: new Date().toISOString(),
      status: "pending",
    };
    writeDraft(DRAFT_KEYS.evaluationInvites, [record, ...invites]);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore in preview */
    }
  };

  return (
    <AppLayout userRole="student">
      <div className="mx-auto max-w-[720px] space-y-6">
        <a
          href="/s/actions"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> My Actions
        </a>

        {!action ? (
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <p className="text-sm font-semibold text-foreground">Action not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This Action doesn&apos;t exist in your list.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Request an evaluation</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground">
                Share a single-use link. Whoever opens it scores this Action against the
                capability rubrics.
              </p>
            </div>

            <section className="rounded-xl border bg-card p-6 shadow-card">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                {action.title}
              </h2>
              {action.description && (
                <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {capabilityNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-md bg-badge-blue-bg px-2 py-0.5 text-xs font-medium text-badge-blue-text ring-1 ring-badge-blue-text/15"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </section>

            {/* Self-evaluation is forbidden (R6) */}
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                Send this to <strong>someone other than you</strong> — you can&apos;t evaluate
                your own work. Evaluators declare their role and relationship when they open it.
              </span>
            </div>

            {!invite ? (
              <div className="rounded-xl border bg-card p-6 text-center shadow-card">
                <p className="text-sm text-muted-foreground">
                  Generate a single-use link to send to your evaluator.
                </p>
                <Button className="mt-4" onClick={createInvite}>
                  <Link2 /> Create invite link
                </Button>
              </div>
            ) : (
              <section className="rounded-xl border bg-card p-6 shadow-card">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="rounded-lg border bg-white p-3">
                    <QRCodeSVG value={link} size={132} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Invite link</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Single-use · becomes invalid once an evaluation is submitted.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        readOnly
                        value={link}
                        className="h-9 min-w-0 flex-1 truncate rounded-lg border bg-background px-3 text-sm text-muted-foreground"
                      />
                      <Button variant="outline" size="sm" onClick={copy}>
                        {copied ? <Check /> : <Copy />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/70">
                      Demo note: the evaluator opens this in the same browser (localStorage
                      stub). In production the token is validated server-side.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
