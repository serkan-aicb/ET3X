import * as React from "react"

import { cn } from "@/lib/utils"

// Displays one per-capability score computed by the capability engine.
// There is deliberately no "overall score" component: the product shows
// per-capability scores only.
export interface CapabilityScoreProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  /** Score on the configured scale, e.g. 4.3. */
  score: number
  /** Upper bound of the scale (from verification-layer config). */
  max?: number
  /** Plain-language evidence line, e.g. "based on 3 evaluated actions". */
  caption?: string
}

const CapabilityScore = React.forwardRef<HTMLDivElement, CapabilityScoreProps>(
  ({ className, label, score, max = 5, caption, ...props }, ref) => {
    const percent = Math.max(0, Math.min(100, (score / max) * 100))

    return (
      <div ref={ref} className={cn("min-w-0", className)} {...props}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {score.toFixed(1)}
            <span className="font-normal text-muted-foreground"> / {max}</span>
          </p>
        </div>
        <div
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label}: ${score.toFixed(1)} out of ${max}`}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
        {caption && (
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        )}
      </div>
    )
  }
)
CapabilityScore.displayName = "CapabilityScore"

export { CapabilityScore }
