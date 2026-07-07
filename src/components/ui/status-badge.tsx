import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Generic status badge. The label always comes from the caller (e.g. a
// verification tier or invitation status returned by the verification layer);
// only the visual tone is chosen here.
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        destructive: "border-red-200 bg-red-50 text-red-700",
        info: "border-blue-200 bg-blue-50 text-blue-700",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

const dotVariants = cva("h-1.5 w-1.5 shrink-0 rounded-full", {
  variants: {
    tone: {
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      destructive: "bg-red-500",
      info: "bg-blue-500",
      neutral: "bg-slate-400",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
})

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Hide the leading dot for a quieter badge. */
  showDot?: boolean
}

function StatusBadge({
  className,
  tone,
  showDot = true,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      {showDot && <span className={dotVariants({ tone })} aria-hidden="true" />}
      {children}
    </span>
  )
}

export { StatusBadge, statusBadgeVariants }
