import * as React from "react"

import { cn } from "@/lib/utils"

export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  /** Right-aligned slot for buttons or filters. */
  actions?: React.ReactNode
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
)
SectionHeader.displayName = "SectionHeader"

export { SectionHeader }
