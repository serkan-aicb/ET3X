"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

import { TopBar, TopBarBrand } from "@/components/ui/top-bar";

/**
 * Client island for the workspace shell's below-lg chrome: ink mobile bar
 * with a drawer trigger. Receives the sidebar as ALREADY-RENDERED JSX so
 * the shell (and pages using it) can stay server components — icon
 * component functions never cross the server→client boundary.
 */
export function MobileWorkspaceChrome({ sidebar }: { sidebar: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TopBar className="lg:hidden">
        <TopBarBrand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex size-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
        >
          <Menu className="size-5" />
        </button>
      </TopBar>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 flex size-8 items-center justify-center rounded-lg text-white hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}
