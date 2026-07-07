import * as React from "react"

import { cn } from "@/lib/utils"
import type { ScoreStep } from "@/lib/verification/mock-config"

// Renders the evaluation score scale exactly as supplied by the verification
// layer. The steps are never hardcoded here; pass config.scoreScale.
export interface ScoreScaleProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: ScoreStep[]
  /** Highlight a selected score (display-only). */
  selected?: number
}

const ScoreScale = React.forwardRef<HTMLDivElement, ScoreScaleProps>(
  ({ className, steps, selected, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
      {steps.map((step) => {
        const isSelected = selected === step.value
        return (
          <div
            key={step.value}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.value}
            </span>
            <span className="font-medium text-foreground">{step.label}</span>
            {step.requiresComment && (
              <span className="ml-auto text-xs text-muted-foreground">
                comment required
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
)
ScoreScale.displayName = "ScoreScale"

export { ScoreScale }
