"use client";

import { useState } from "react";
import { Brain, Leaf, MessageSquare, Globe, Heart, Network } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DomainData } from "@/lib/oulgovernance-data";

const DOMAIN_ICONS: LucideIcon[] = [
  Brain,        // Analytical, Critical & Creative Thinking
  Leaf,         // Sustainability, Responsibility & Ethics
  MessageSquare,// Communication, Interaction & Digital
  Globe,        // International & Multicultural
  Heart,        // Well-being & Self-Development
  Network,      // Multidisciplinary & Interdisciplinary
];

const DOMAIN_COLORS = [
  "border-blue-500/60 hover:border-blue-400",
  "border-emerald-500/60 hover:border-emerald-400",
  "border-violet-500/60 hover:border-violet-400",
  "border-amber-500/60 hover:border-amber-400",
  "border-pink-500/60 hover:border-pink-400",
  "border-cyan-500/60 hover:border-cyan-400",
];

const DOMAIN_ACCENTS = [
  "text-blue-400",
  "text-emerald-400",
  "text-violet-400",
  "text-amber-400",
  "text-pink-400",
  "text-cyan-400",
];

const DOMAIN_BG = [
  "bg-blue-500/10",
  "bg-emerald-500/10",
  "bg-violet-500/10",
  "bg-amber-500/10",
  "bg-pink-500/10",
  "bg-cyan-500/10",
];

interface DomainTileProps {
  domain: DomainData;
  colorIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function DomainTile({ domain, colorIndex, isExpanded, onToggle }: DomainTileProps) {
  const borderClass = DOMAIN_COLORS[colorIndex];
  const accentClass = DOMAIN_ACCENTS[colorIndex];
  const bgClass = DOMAIN_BG[colorIndex];
  const DomainIcon = DOMAIN_ICONS[colorIndex];

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className={`w-full text-left rounded-xl border-2 bg-card p-5 transition-all duration-200 ${borderClass} ${
          isExpanded ? "rounded-b-none border-b-0" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <DomainIcon
              className={`mt-0.5 h-4 w-4 shrink-0 ${accentClass}`}
              strokeWidth={1.5}
            />
            <span className={`text-sm font-semibold leading-snug ${accentClass}`}>
              {domain.title}
            </span>
          </div>
          <span className="mt-0.5 shrink-0 text-muted-foreground text-xs">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className={`text-2xl font-bold ${accentClass}`}>28</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sub-Skills</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${accentClass}`}>{domain.totalRatings.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ratings</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${accentClass}`}>{domain.coveragePercent}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Domain Share</p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className={`rounded-b-xl border-2 ${borderClass.split(" ")[0]} border-t-0 ${bgClass} px-5 pb-5 pt-4`}>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Activated Sub-Skills
            </p>
            <ul className="space-y-1">
              {domain.subSkills.map((skill) => (
                <li key={skill} className="flex items-center gap-2 text-sm text-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${accentClass.replace("text-", "bg-")}`} />
                  {skill}
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-3 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Bachelor-Level Learning Outcomes
            </p>
            <ul className="space-y-1.5">
              {domain.learningOutcomes.map((outcome, i) => (
                <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                  • {outcome}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Last assessment:{" "}
              <span className="text-foreground">
                {new Date(domain.lastAssessmentDate).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            </p>
            <button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
              View documentation →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DomainTilesGridProps {
  domains: DomainData[];
}

export function DomainTilesGrid({ domains }: DomainTilesGridProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Generic Skill Domain Alignment
        </h2>
        <span className="text-xs text-muted-foreground">
          Bachelor Level Framework
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain, idx) => (
          <DomainTile
            key={domain.id}
            domain={domain}
            colorIndex={idx}
            isExpanded={expandedId === domain.id}
            onToggle={() =>
              setExpandedId(expandedId === domain.id ? null : domain.id)
            }
          />
        ))}
      </div>
    </div>
  );
}
