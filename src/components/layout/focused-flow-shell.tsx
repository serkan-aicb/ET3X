"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { TopBar, TopBarBrand } from "@/components/ui/top-bar";

/**
 * Focused-flow archetype shell (docs 14 S6/S7): ink top bar + light stepper
 * row traveling as ONE sticky unit (T8: progress always visible), single
 * 760px column, Save & exit in the bar, one decision per screen.
 *
 * Extracted from /onboarding-preview (Week-3 §1) — the Action-creation
 * wizard and the evaluation flow assemble on this same shell.
 */

export function FocusedFlowShell({
  steps,
  currentStep,
  onSaveExit,
  saveExitLabel = "Save & exit",
  children,
}: {
  steps: string[];
  currentStep: number;
  onSaveExit?: () => void;
  saveExitLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="sticky top-0 z-20">
        <TopBar className="static">
          <TopBarBrand />
          {onSaveExit ? (
            <button
              onClick={onSaveExit}
              className="text-sm font-medium text-white/70 hover:text-white"
            >
              {saveExitLabel}
            </button>
          ) : (
            <span className="text-sm font-medium text-white/70">
              {saveExitLabel}
            </span>
          )}
        </TopBar>
        <Stepper steps={steps} current={currentStep} />
      </div>

      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}

/** Progress stepper (Rule 1) — light row under the ink bar. */
function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="border-b bg-card">
      <ol className="mx-auto flex max-w-[760px] items-center gap-2 px-6 py-4">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={label}
              className="flex flex-1 items-center gap-2 last:flex-none"
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-success text-success-foreground"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground/70"
                }`}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-foreground" : "text-muted-foreground/70"
                }`}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={`mx-1 h-px flex-1 ${done ? "bg-success" : "bg-border"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
