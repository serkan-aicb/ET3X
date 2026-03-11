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

// Color scale for assessment volume (dark navy → bright blue)
function getHeatColor(value: number): string {
  const intensity = value / 100;
  const r = Math.round(17 + intensity * (59 - 17));
  const g = Math.round(24 + intensity * (130 - 24));
  const b = Math.round(39 + intensity * (246 - 39));
  return `rgb(${r},${g},${b})`;
}

// Color scale for average rating (low rating = darker, high rating = lighter)
function getRatingColor(value: number, maxVal: number): string {
  if (maxVal === 0) return "rgb(17,24,39)";
  const intensity = value / maxVal;
  // Low rating (1) = darker blue, High rating (5) = lighter blue
  const r = Math.round(17 + intensity * (96 - 17));
  const g = Math.round(24 + intensity * (165 - 24));
  const b = Math.round(39 + intensity * (250 - 39));
  return `rgb(${r},${g},${b})`;
}

// Color scale for skill density (low = dark, high = bright)
function getDensityColor(value: number, maxVal: number): string {
  if (maxVal === 0) return "rgb(17,24,39)";
  const intensity = value / maxVal;
  const r = Math.round(17 + intensity * (34 - 17));
  const g = Math.round(24 + intensity * (211 - 24));
  const b = Math.round(39 + intensity * (238 - 39));
  return `rgb(${r},${g},${b})`;
}

function getTextColor(value: number): string {
  return value > 50 ? "#fff" : "#94a3b8";
}

function getTextColorForValue(value: number, maxVal: number): string {
  if (maxVal === 0) return "#94a3b8";
  return (value / maxVal) > 0.5 ? "#fff" : "#94a3b8";
}

// Format number to exactly 2 decimal places
function formatRating(value: number): string {
  return value.toFixed(2);
}

interface TaskSkillHeatmapProps {
  domains: DomainData[];
  tasks?: { id: string; title: string }[];
  averageRatingMatrix?: {
    domainKey: string;
    taskRatings: number[];
  }[];
  skillDensityMatrix?: {
    taskId: string;
    domainSkillCounts: number[];
  }[];
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

export function TaskSkillHeatmap({ 
  domains, 
  tasks = [],
  averageRatingMatrix = [],
  skillDensityMatrix = [],
}: TaskSkillHeatmapProps) {
  const taskLabels = tasks.length > 0
    ? tasks.map((t) => shortTaskLabel(t.title))
    : ["Task 1", "Task 2", "Task 3", "Task 4"];
  const taskKeys = tasks.length > 0 ? tasks.map((t) => t.id) : taskLabels;
  
  // Calculate max values for normalization
  const maxVal = Math.max(...domains.flatMap((d) => d.taskMatrix), 1);
  const maxRating = Math.max(...averageRatingMatrix.flatMap((d) => d.taskRatings), 5);
  const maxDensity = Math.max(...skillDensityMatrix.flatMap((t) => t.domainSkillCounts), 1);

  return (
    <div className="space-y-6">
      {/* ── Heatmap 1: Skill Mapping (Assessment Volume) ─────────────────── */}
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

      {/* ── Heatmap 2: Average Rating ───────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Average Rating per Task and Skill Domain
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
              {averageRatingMatrix.map((domainRow, idx) => (
                <tr key={domainRow.domainKey}>
                  <td className="pr-3 py-1">
                    <span
                      className="text-xs font-medium"
                      style={{ color: DOMAIN_ACCENTS[idx] }}
                    >
                      {DOMAIN_SHORT[idx]}
                    </span>
                  </td>
                  {domainRow.taskRatings.map((rating, tIdx) => {
                    return (
                      <td key={tIdx} className="px-1 py-1">
                        <div
                          className="flex h-10 w-full items-center justify-center rounded-md text-xs font-semibold transition-colors"
                          style={{
                            backgroundColor: getRatingColor(rating, maxRating),
                            color: getTextColorForValue(rating, maxRating),
                          }}
                          title={`${DOMAIN_SHORT[idx]} / ${taskLabels[tIdx] ?? `Task ${tIdx + 1}`}: ${formatRating(rating)} avg rating`}
                        >
                          {rating > 0 ? formatRating(rating) : "—"}
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
                style={{ backgroundColor: getRatingColor((i * 5 / 100) * maxRating, maxRating) }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
          <span className="ml-2 text-xs text-muted-foreground">= Average Rating</span>
        </div>
      </div>

      {/* ── Heatmap 3: Skill Density ────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Average Number of Skills per Task
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-44 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 pr-3">
                  Task
                </th>
                {DOMAIN_SHORT.map((label, i) => (
                  <th
                    key={i}
                    className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 px-1"
                  >
                    <span style={{ color: DOMAIN_ACCENTS[i] }}>{label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skillDensityMatrix.map((taskRow, idx) => (
                <tr key={taskRow.taskId}>
                  <td className="pr-3 py-1">
                    <span className="text-xs font-medium text-foreground">
                      {taskLabels[idx] ?? `Task ${idx + 1}`}
                    </span>
                  </td>
                  {taskRow.domainSkillCounts.map((count, dIdx) => {
                    return (
                      <td key={dIdx} className="px-1 py-1">
                        <div
                          className="flex h-10 w-full items-center justify-center rounded-md text-xs font-semibold transition-colors"
                          style={{
                            backgroundColor: getDensityColor(count, maxDensity),
                            color: getTextColorForValue(count, maxDensity),
                          }}
                          title={`${taskLabels[idx] ?? `Task ${idx + 1}`} / ${DOMAIN_SHORT[dIdx]}: ${count} unique skills`}
                        >
                          {count}
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
                style={{ backgroundColor: getDensityColor((i * 5 / 100) * maxDensity, maxDensity) }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
          <span className="ml-2 text-xs text-muted-foreground">= Skill Density</span>
        </div>
      </div>
    </div>
  );
}
