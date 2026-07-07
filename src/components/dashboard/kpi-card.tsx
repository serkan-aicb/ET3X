import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short metric name, e.g. "Active Contributors". */
  label: string
  /** The headline value, already formatted, e.g. "248" or "4.2". */
  value: string
  /** Signed percentage change; positive renders green/up, negative red/down. */
  deltaPercent?: number
  /** Plain-language context, e.g. "vs. last 30 days". Numbers must tell a story. */
  caption?: string
  icon?: React.ReactNode
}

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ className, label, value, deltaPercent, caption, icon, ...props }, ref) => {
    const direction =
      deltaPercent === undefined || deltaPercent === 0
        ? "flat"
        : deltaPercent > 0
          ? "up"
          : "down"

    return (
      <Card ref={ref} className={cn("min-w-0", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {icon && (
              <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
                {icon}
              </span>
            )}
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {(deltaPercent !== undefined || caption) && (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-xs">
              {deltaPercent !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    direction === "up" && "text-emerald-600",
                    direction === "down" && "text-red-600",
                    direction === "flat" && "text-muted-foreground"
                  )}
                >
                  {direction === "up" && <ArrowUpRight className="h-3 w-3" />}
                  {direction === "down" && <ArrowDownRight className="h-3 w-3" />}
                  {direction === "flat" && <Minus className="h-3 w-3" />}
                  {direction === "up" ? "+" : ""}
                  {deltaPercent}%
                </span>
              )}
              {caption && <span className="text-muted-foreground">{caption}</span>}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }
)
KpiCard.displayName = "KpiCard"

export { KpiCard }
