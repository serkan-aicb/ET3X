"use client";

import { Users, BarChart3, Layers, Grid2X2, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  accent?: boolean;
  icon: LucideIcon;
}

function MetricCard({ title, value, accent, icon: Icon }: MetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground leading-snug">
          {title}
        </p>
        <Icon
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40"
          strokeWidth={1.5}
        />
      </div>
      <p
        className={`mt-3 text-4xl font-bold tabular-nums ${
          accent ? "text-blue-400" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface ExecutiveMetricsRowProps {
  participatingStudents: number;
  totalSkillRatings: number;
  activatedSubSkills: number;
  genericDomainsCovered: string;
  avgAssessmentsPerStudent: string;
}

export function ExecutiveMetricsRow({
  participatingStudents,
  totalSkillRatings,
  activatedSubSkills,
  genericDomainsCovered,
  avgAssessmentsPerStudent,
}: ExecutiveMetricsRowProps) {
  const metrics = [
    { title: "Participating Students", value: participatingStudents, icon: Users },
    { title: "Total Skill Ratings", value: totalSkillRatings.toLocaleString(), accent: true, icon: BarChart3 },
    { title: "Activated Sub-Skills", value: activatedSubSkills, icon: Layers },
    { title: "Generic Domains Covered", value: genericDomainsCovered, accent: true, icon: Grid2X2 },
    { title: "Avg. Assessments / Student", value: avgAssessmentsPerStudent, icon: Activity },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <MetricCard
          key={m.title}
          title={m.title}
          value={m.value}
          accent={m.accent}
          icon={m.icon}
        />
      ))}
    </div>
  );
}
