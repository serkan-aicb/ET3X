"use client";

import type { DomainData } from "@/lib/oulgovernance-data";


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
  tasks?: { id: string; title: string }[];
}

/** Extract a short display label from a task title.
 *  "OBS Strategic Marketing Management - Task 3" → "Task 3"
 *  Falls back to last segment after " - ", then truncates. */
function shortTaskLabel(title: string): string {
  const matchTask = title.match(/Task\s*\d+/i);
  if (matchTask) return matchTask[0];
  const idx = title.lastIndexOf(" - ");
  if (idx !== -1) return title.slice(idx + 3).trim().slice(0, 20);
  return title.slice(0, 20);
}

export function TaskSkillHeatmap({ domains, tasks = [] }: TaskSkillHeatmapProps) {
  const taskLabels = tasks.length > 0
    ? tasks.map((t) => shortTaskLabel(t.title))
    : ["Task 1", "Task 2", "Task 3", "Task 4"];
  const taskKeys = tasks.length > 0 ? tasks.map((t) => t.id) : taskLabels;
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
              {taskLabels.map((label, i) => (
                <th
                  key={taskKeys[i]}
                  className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 px-1"
                >
                  {label}
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
                        title={`${domain.title} / ${taskLabels[tIdx] ?? `Task ${tIdx + 1}`}: ${val} assessments`}
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
