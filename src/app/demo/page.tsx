"use client";

/**
 * /demo — frozen-build demo control panel (not in nav).
 * Seed one coherent profile for live demos, or wipe everything for a clean slate.
 */

import Link from "next/link";
import { Sparkles, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import { seedDemoProfile, clearAllData, DEMO_PERSONA } from "@/lib/demo/seed";
import type { LocalSession } from "@/lib/auth/local-session";
import type { ActionRecord, Evaluation } from "@/lib/actions/types";

const NO_SESSION: LocalSession | null = null;
const NO_ACTIONS: ActionRecord[] = [];
const NO_EVALS: Evaluation[] = [];

export default function DemoPage() {
  const session = useLocalDraft<LocalSession | null>(DRAFT_KEYS.session, NO_SESSION);
  const actions = useLocalDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts, NO_ACTIONS);
  const evaluations = useLocalDraft<Evaluation[]>(DRAFT_KEYS.evaluations, NO_EVALS);

  const loadDemo = () => {
    const dest = seedDemoProfile();
    window.location.assign(dest);
  };

  const clearData = () => {
    clearAllData();
    window.location.assign("/demo");
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Demo controls</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Frozen build — everything lives in this browser. Use this to set the app up for a
            live walkthrough, or reset it.
          </p>
        </div>

        {/* Current state */}
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current state
          </p>
          {session ? (
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-foreground">
                Signed in as <span className="font-semibold">{session.name}</span>{" "}
                <span className="text-muted-foreground">({session.email})</span>
              </p>
              <p className="text-muted-foreground">
                {actions.length} action{actions.length === 1 ? "" : "s"} ·{" "}
                {evaluations.length} evaluation{evaluations.length === 1 ? "" : "s"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Not signed in · no data.</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={loadDemo} className="w-full" size="lg">
            <Sparkles /> Load demo profile ({DEMO_PERSONA.name})
          </Button>
          <p className="px-1 text-xs text-muted-foreground">
            Seeds a signed-in individual with 3 evaluated actions → a profile showing Confirmed
            and Provisional capabilities. Takes you straight to the profile.
          </p>

          <Button onClick={clearData} variant="outline" className="w-full" size="lg">
            <Trash2 /> Clear all data (clean slate)
          </Button>
          <p className="px-1 text-xs text-muted-foreground">
            Wipes localStorage and signs out — the app returns to a first-run state.
          </p>
        </div>

        {/* Quick links */}
        {session && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/s/profile"
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Profile <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/s/dashboard"
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Dashboard <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
