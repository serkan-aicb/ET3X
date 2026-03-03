"use client";

import type { DomainData } from "@/lib/oulgovernance-data";

const TASKS = ["Task 1", "Task 2", "Task 3", "Task 4"];

const DOMAIN_SHORT = [
  "Analytical & Critical",
  "Sustainability & Ethics",
  "Communication & Digital",
  "International & Cultural",
  "Well-being & Self-Dev.",
  "Multidisciplinary",
];

const DOMAIN_ACCENTS = [
  "#60a5fa", // blue
  "#34d399", // emerald
  "#a78bfa", // violet
  "#fbbf24", // amber
  "#f472b6", // pink
  "#22d3ee", // cyan
];

function getHeatColor(value: number): string {
  // value 0–100 → dark navy → bright accent
  const intensity = value / 100;
  const r = Math.round(17 + intensity * (59 - 17));
  const g = Math.round(24 + intensity * (130 - 24));
  const b = Math.round(39 + intensity * (246 - 39));
  return `rgb(${r},${g},${b})`;
}

function getTextColor(value: number): string {
  return value > 50 ? "#fff" : "#94a3b8";
}

interface TaskSkillHeatmapProps {
  domains: DomainData[];
}

export function TaskSkillHeatmap({ domains }: TaskSkillHeatmapProps) {
  const maxVal = Math.max(...domains.flatMap((d) => d.taskMatrix));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Course Task Mapping to Oulu Generic Skill Domains
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-44 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 pr-3">
                Domain
              </th>
              {TASKS.map((t) => (
                <th
                  key={t}
                  className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 px-1"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domains.map((domain, idx) => (
              <tr key={domain.id}>
                <td className="pr-3 py-1">
                  <span
                    className="text-xs font-medium"
                    style={{ color: DOMAIN_ACCENTS[idx] }}
                  >
                    {DOMAIN_SHORT[idx]}
                  </span>
                </td>
                {domain.taskMatrix.map((val, tIdx) => {
                  const norm = Math.round((val / maxVal) * 100);
                  return (
                    <td key={tIdx} className="px-1 py-1">
                      <div
                        className="flex h-10 w-full items-center justify-center rounded-md text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: getHeatColor(norm),
                          color: getTextColor(norm),
                        }}
                        title={`${domain.title} / ${TASKS[tIdx]}: ${val} assessments`}
                      >
                        {val}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Low</span>
        <div className="flex h-3 flex-1 overflow-hidden rounded-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: getHeatColor(i * 5) }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">High</span>
        <span className="ml-2 text-xs text-muted-foreground">= Assessment volume</span>
      </div>
    </div>
  );
}
