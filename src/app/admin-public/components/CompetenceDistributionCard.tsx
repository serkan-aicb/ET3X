"use client";

const DOMAIN_COLORS = [
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#fbbf24",
  "#f472b6",
  "#22d3ee",
];

interface CompetenceDistributionCardProps {
  averageAssessmentsPerStudent: number;
  percentStudentsWith4PlusDomains: number;
  distributionAcross456Domains: {
    fourDomains: number;
    fiveDomains: number;
    sixDomains: number;
  };
  totalStudents: number;
}

// SVG donut chart (pure — no external library)
function DonutChart({
  slices,
}: {
  slices: { value: number; color: string; label: string }[];
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const r = 60;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  // Pre-compute cumulative offsets outside render
  const cumulativeOffsets = slices.reduce<number[]>((acc, sl) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : 0;
    return [...acc, last + sl.value / total];
  }, []);

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {slices.map((sl, i) => {
          const pct = sl.value / total;
          const dashArray = `${pct * circumference} ${circumference}`;
          const cumulativePct = i === 0 ? 0 : cumulativeOffsets[i - 1];
          const offset = cumulativePct * circumference;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={sl.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset + circumference * 0.25}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f8fafc" fontSize="18" fontWeight="bold">
          87%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="9">
          ≥4 domains
        </text>
      </svg>
      <div className="space-y-2 text-xs">
        {slices.map((sl) => (
          <div key={sl.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: sl.color }} />
            <span className="text-muted-foreground">{sl.label}</span>
            <span className="ml-auto font-semibold text-foreground">{sl.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompetenceDistributionCard({
  averageAssessmentsPerStudent,
  percentStudentsWith4PlusDomains,
  distributionAcross456Domains,
  totalStudents,
}: CompetenceDistributionCardProps) {
  const slices = [
    {
      value: distributionAcross456Domains.sixDomains,
      color: DOMAIN_COLORS[0],
      label: "6 domains covered",
    },
    {
      value: distributionAcross456Domains.fiveDomains,
      color: DOMAIN_COLORS[2],
      label: "5 domains covered",
    },
    {
      value: distributionAcross456Domains.fourDomains,
      color: DOMAIN_COLORS[4],
      label: "4 domains covered",
    },
    {
      value:
        totalStudents -
        distributionAcross456Domains.sixDomains -
        distributionAcross456Domains.fiveDomains -
        distributionAcross456Domains.fourDomains,
      color: "#475569",
      label: "< 4 domains",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 h-full">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
        Competence Distribution
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Bachelor Level</p>

      <DonutChart slices={slices} />

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {averageAssessmentsPerStudent}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            Avg. assessments<br />per student
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {percentStudentsWith4PlusDomains}%
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            Students with<br />≥4 domains
          </p>
        </div>
      </div>
    </div>
  );
}
