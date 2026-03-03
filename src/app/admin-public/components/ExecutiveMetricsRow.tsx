"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  accent?: boolean;
}

function MetricCard({ title, value, accent }: MetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
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
    { title: "Participating Students", value: participatingStudents },
    { title: "Total Skill Ratings", value: totalSkillRatings.toLocaleString(), accent: true },
    { title: "Activated Sub-Skills", value: activatedSubSkills },
    { title: "Generic Domains Covered", value: genericDomainsCovered, accent: true },
    { title: "Avg. Assessments / Student", value: avgAssessmentsPerStudent },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <MetricCard key={m.title} title={m.title} value={m.value} accent={m.accent} />
      ))}
    </div>
  );
}
