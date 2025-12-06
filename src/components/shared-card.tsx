import * as React from "react"
import { cn } from "@/lib/utils"

interface SharedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

function SharedCard({ 
  className, 
  title, 
  description, 
  children, 
  ...props 
}: SharedCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 space-y-3",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export { SharedCard }