"use client";

import type { DomainData } from "@/lib/oulgovernance-data";

const DOMAIN_ACCENTS = [
  "text-blue-400",
  "text-emerald-400",
  "text-violet-400",
  "text-amber-400",
  "text-pink-400",
  "text-cyan-400",
];

const DOMAIN_BULLETS = [
  "bg-blue-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-amber-400",
  "bg-pink-400",
  "bg-cyan-400",
];

interface LearningOutcomeAlignmentCardProps {
  domains: DomainData[];
}

export function LearningOutcomeAlignmentCard({ domains }: LearningOutcomeAlignmentCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 h-full">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
        Learning Outcome Alignment
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Bachelor Level — University of Oulu Framework</p>

      <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1">
        {domains.map((domain, idx) => (
          <div key={domain.id}>
            <p className={`text-xs font-semibold mb-1.5 ${DOMAIN_ACCENTS[idx]}`}>
              {domain.title}
            </p>
            <ul className="space-y-1">
              {domain.learningOutcomes.slice(0, 2).map((outcome, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOMAIN_BULLETS[idx]}`} />
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
