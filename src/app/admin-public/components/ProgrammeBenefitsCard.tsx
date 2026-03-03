"use client";

interface ProgrammeBenefitsCardProps {
  benefits: string[];
}

const ICONS = ["◈", "◉", "◈", "◉"];

export function ProgrammeBenefitsCard({ benefits }: ProgrammeBenefitsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
        Potential Programme-Level Benefits
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Operational value for curriculum and quality assurance teams
      </p>
      <ul className="space-y-3">
        {benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-blue-400 text-base leading-5 shrink-0">{ICONS[i % ICONS.length]}</span>
            <span className="text-sm text-foreground leading-snug">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
