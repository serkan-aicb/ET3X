"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, FileText, ClipboardCheck, Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedCard } from "@/components/shared-card";
import { AppLayout } from "@/components/app-layout";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import type { LocalSession } from "@/lib/auth/local-session";
import type {
  ActionRecord,
  Assignment,
  Evaluation,
  RudimentaryProfile,
} from "@/lib/actions/types";

// Stable fallbacks (useLocalDraft requires a stable reference).
const NO_SESSION: LocalSession | null = null;
const NO_PROFILE: RudimentaryProfile | null = null;
const NO_ACTIONS: ActionRecord[] = [];
const NO_EVALUATIONS: Evaluation[] = [];
const NO_ASSIGNMENTS: Assignment[] = [];

export default function StudentDashboard() {
  const router = useRouter();

  const session = useLocalDraft<LocalSession | null>(DRAFT_KEYS.session, NO_SESSION);
  const rudimentary = useLocalDraft<RudimentaryProfile | null>(
    DRAFT_KEYS.rudimentaryProfile,
    NO_PROFILE
  );
  const actions = useLocalDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts, NO_ACTIONS);
  const evaluations = useLocalDraft<Evaluation[]>(DRAFT_KEYS.evaluations, NO_EVALUATIONS);
  const assignments = useLocalDraft<Assignment[]>(DRAFT_KEYS.assignments, NO_ASSIGNMENTS);

  // Soft onboarding prompt (Week 2): localStorage-only completeness signal.
  const onboardingComplete = useLocalDraft<boolean>(DRAFT_KEYS.onboardingComplete, false);
  const needsOnboarding = !onboardingComplete;

  const displayName =
    session?.name || (session?.email ? session.email.split("@")[0] : "there");
  const evaluatedActionCount = new Set(evaluations.map((e) => e.action_id)).size;

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your workspace</h1>
          <p className="text-muted-foreground">
            Welcome back,{" "}
            <span className="font-semibold text-foreground">{displayName}</span>
          </p>
        </div>

        {/* Soft onboarding prompt (Week 2) — shown until the flow is completed;
            no hard gate. Uses the localStorage completeness flag. */}
        {needsOnboarding && (
          <button
            onClick={() => router.push("/s/onboarding")}
            className="card-interactive flex w-full items-center gap-4 rounded-xl border border-primary-border bg-primary-soft px-5 py-4 text-left"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Finish your profile
              </span>
              <span className="block text-sm text-muted-foreground">
                Import your CV or LinkedIn and turn your skills into verified capabilities.
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-primary" />
          </button>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Actions</h3>
            <p className="text-sm text-muted-foreground">Real work you&apos;ve logged</p>
            <div className="text-3xl font-semibold text-primary">{actions.length}</div>
          </SharedCard>

          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Evaluated</h3>
            <p className="text-sm text-muted-foreground">Actions with an evaluation</p>
            <div className="text-3xl font-semibold text-green-500">{evaluatedActionCount}</div>
          </SharedCard>

          <SharedCard>
            <h3 className="text-lg font-semibold text-foreground">Assignments</h3>
            <p className="text-sm text-muted-foreground">Actions you&apos;ve issued</p>
            <div className="text-3xl font-semibold text-amber-500">{assignments.length}</div>
          </SharedCard>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SharedCard title="Your profile" description="The minimum we hold to let you take part">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Name: <span className="text-foreground font-medium">{session?.name || "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Email: <span className="text-foreground font-medium">{session?.email || "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Organisation:{" "}
                <span className="text-foreground font-medium">
                  {rudimentary?.organisation || "—"}
                </span>
              </p>
            </div>
          </SharedCard>

          <SharedCard title="Quick actions" description="Jump to the core flows">
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push("/s/actions/create")} className="w-full">
                <FileText /> Create an Action
              </Button>
              <Button onClick={() => router.push("/s/actions")} variant="outline" className="w-full">
                <ClipboardCheck /> My Actions
              </Button>
              <Button onClick={() => router.push("/s/assignments")} variant="outline" className="w-full">
                <Send /> Assignments
              </Button>
              <Button onClick={() => router.push("/s/proposals")} variant="outline" className="w-full">
                <Lightbulb /> Proposals
              </Button>
              <Button onClick={() => router.push("/s/profile")} variant="outline" className="w-full">
                View profile
              </Button>
            </div>
          </SharedCard>
        </div>
      </div>
    </AppLayout>
  );
}
