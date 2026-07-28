"use client";

/**
 * Governed skill typeahead (handover v1.6 §7). Search the 497-label catalogue
 * (case-insensitive), show "counts toward <capability>" on every result and
 * every selection, and log zero-match searches for monthly label additions.
 * There is NO free-text entry — a selection is always a real catalogue skill_id
 * (R1/R2). Shared by onboarding (Week 2) and action creation (Week 3).
 */

import { useState } from "react";
import { Search, X } from "lucide-react";

import {
  getSkill,
  resolveCapability,
  searchSkills,
  logFailedSkillSearch,
} from "@/lib/catalogue";

export function SkillPicker({
  selectedIds,
  onChange,
  placeholder = "Search skills — e.g. problem solving, report writing",
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? searchSkills(query, 8).filter((s) => !selectedIds.includes(s.skill_id))
    : [];
  const noMatch = query.trim().length > 1 && results.length === 0;

  const add = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
    setQuery("");
  };
  const remove = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  return (
    <div>
      {selectedIds.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">
          Search the catalogue below to add the skills your work demonstrates.
        </p>
      ) : (
        <ul className="space-y-2">
          {selectedIds.map((id) => {
            const skill = getSkill(id);
            const cap = resolveCapability(id);
            if (!skill) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {skill.label}
                  </div>
                  {cap && (
                    <div className="truncate text-xs text-muted-foreground/70">
                      counts toward{" "}
                      <span className="font-medium text-primary">{cap.name}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${skill.label}`}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 hover:bg-danger/10 hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="relative mt-3">
        <div className="flex items-center gap-2 rounded-lg border px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="size-4 text-muted-foreground/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (results[0]) add(results[0].skill_id);
                else if (noMatch) logFailedSkillSearch(query.trim());
              }
            }}
            placeholder={placeholder}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-card shadow-overlay">
            {results.map((s) => {
              const cap = resolveCapability(s.skill_id);
              return (
                <li key={s.skill_id}>
                  <button
                    type="button"
                    onClick={() => add(s.skill_id)}
                    className="row-interactive flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left"
                  >
                    <span className="text-sm font-medium text-foreground">{s.label}</span>
                    {cap && (
                      <span className="text-xs text-muted-foreground/70">
                        counts toward {cap.name}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {noMatch && (
          <p className="mt-2 text-xs text-muted-foreground/70">
            No matching skill in the catalogue. Press Enter to flag &ldquo;{query.trim()}&rdquo; for review.
          </p>
        )}
      </div>
    </div>
  );
}
