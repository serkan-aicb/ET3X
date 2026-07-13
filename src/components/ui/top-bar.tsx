import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Ink top bar — the one app-chrome bar recipe (theme grill S6/S7, 13 July).
 * T1 amended: app chrome (top bars + workspace sidebar) is ink home #4.
 * h-16, sticky, navy #081B30 via bg-ink, white wordmark. Public projection
 * and focused flow use this bar; workspace pages use the ink sidebar instead.
 * Buttons inside the bar: `inverse` (single hero CTA) / `inverse-outline`.
 */
function TopBar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-ink px-8 text-ink-foreground",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
}

/** Logo + white wordmark (+ optional muted context label) for ink bars. */
function TopBarBrand({ context }: { context?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/pics/logo-mark.png"
        alt="Talent3X"
        width={32}
        height={32}
        className="size-8"
      />
      <span className="text-[15px] font-semibold tracking-tight text-white">
        Talent3X
      </span>
      {context && (
        <span className="ml-1 text-sm font-medium text-white/60">
          {context}
        </span>
      )}
    </div>
  )
}

export { TopBar, TopBarBrand }
