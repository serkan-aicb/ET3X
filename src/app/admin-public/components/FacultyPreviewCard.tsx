"use client";

import type { DomainData } from "@/lib/oulgovernance-data";

const DOMAIN_ACCENTS: Record<number, string> = {
  0: "#60a5fa",
  1: "#34d399",
  2: "#a78bfa",
  3: "#fbbf24",
  4: "#f472b6",
  5: "#22d3ee",
};

// Neutral green-grey academic heat scale (avoids "flashy" blue glow)
function heatBg(val: number, max: number): string {
  const t = max > 0 ? val / max : 0;
  // Slate-800 (low) → teal-700 (mid) → teal-500 (high)
  const r = Math.round(30 + t * (20 - 30));
  const g = Math.round(41 + t * (100 - 41));
  const b = Math.round(59 + t * (90 - 59));
  return `rgb(${r},${g},${b})`;
}

function heatText(val: number, max: number): string {
  return val / max > 0.45 ? "#f1f5f9" : "#94a3b8";
}

function coveragePct(val: number, students: number): number {
  return Math.min(100, Math.round((val / students) * 100));
}

interface ProgrammeOversightModuleProps {
  totalStudents: number;
  totalRatings: number;
  domainsCovered: string;
  avgAssessmentsPerStudent: string;
  domains: DomainData[];
  tasks?: { id: string; title: string }[];
}

export function FacultyPreviewCard({
  totalStudents,
  totalRatings,
  domainsCovered,
  avgAssessmentsPerStudent,
  domains,
  tasks = [],
}: ProgrammeOversightModuleProps) {
  const courseLabels = tasks.length > 0
    ? tasks.map((t) => t.title)
    : ["Course 1", "Course 2", "Course 3", "Course 4"];
  const coursesCount = courseLabels.length;
  const maxCellVal = Math.max(...domains.flatMap((d) => d.taskMatrix));

  function handleExport(type: "PDF" | "CSV") {
    alert(
      `Export as ${type} — structured report generation available in production deployment.`
    );
  }

  // Scalability projections
  const projections = [
    { label: "Current pilot", courses: coursesCount, students: totalStudents, assessments: totalRatings },
    { label: "5-course expansion", courses: 5, students: Math.round(totalStudents * 1.4), assessments: Math.round(totalRatings * 1.4) },
    { label: "10-course expansion", courses: 10, students: Math.round(totalStudents * 2.8), assessments: Math.round(totalRatings * 2.8) },
  ];

  return (
    <div className="space-y-6">
      {/* ── Section header ────────────────────────────── */}
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-foreground">
          Programme-Level Generic Skills Oversight
          <span className="ml-2 text-sm font-normal text-muted-foreground">(Bachelor Level)</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-3xl">
          Structured documentation aligned with the University of Oulu Common Generic Skills Framework
          (2026–2027 integration mandate). All data is systematically peer-assessed and domain-mapped.
        </p>
      </div>

      {/* ── 1. Institutional Coverage Summary ─────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Institutional Coverage Summary
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Participating Students", value: totalStudents },
            { label: "Documented Assessments", value: totalRatings.toLocaleString() },
            { label: "Generic Domains Activated", value: domainsCovered },
            { label: "Avg. Assessments / Student", value: avgAssessmentsPerStudent },
            { label: "Courses in Programme", value: coursesCount },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-border bg-card px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
                {m.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Domain Coverage Matrix ─────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Domain Coverage Matrix — Programme Level
        </p>
        <p className="mb-4 text-[10px] text-muted-foreground">
          Assessment volume and cohort coverage per domain and course. Colour intensity indicates
          relative assessment volume (Low → High).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-56 border border-border bg-muted/30 px-3 py-2 text-left font-semibold text-muted-foreground">
                  Generic Skill Domain
                </th>
                {courseLabels.map((c) => (
                  <th
                    key={c}
                    className="border border-border bg-muted/30 px-3 py-2 text-center font-semibold text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
                <th className="border border-border bg-muted/30 px-3 py-2 text-center font-semibold text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain, idx) => {
                const rowTotal = domain.taskMatrix.reduce((a, b) => a + b, 0);
                return (
                  <tr key={domain.id}>
                    <td className="border border-border px-3 py-2.5 font-medium" style={{ color: DOMAIN_ACCENTS[idx] }}>
                      {domain.title}
                    </td>
                    {domain.taskMatrix.map((val, ci) => {
                      const pct = coveragePct(val, totalStudents);
                      return (
                        <td
                          key={ci}
                          className="border border-border px-2 py-2 text-center"
                          style={{
                            backgroundColor: heatBg(val, maxCellVal),
                            color: heatText(val, maxCellVal),
                          }}
                        >
                          <span className="block font-semibold tabular-nums">{val}</span>
                          <span className="block text-[10px] opacity-80">{pct}% cov.</span>
                        </td>
                      );
                    })}
                    <td className="border border-border px-3 py-2 text-center font-bold text-foreground tabular-nums">
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="border border-border bg-muted/20 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Course Total
                </td>
                {courseLabels.map((_, ci) => {
                  const colTotal = domains.reduce((s, d) => s + (d.taskMatrix[ci] ?? 0), 0);
                  return (
                    <td key={ci} className="border border-border bg-muted/20 px-3 py-2 text-center font-bold text-foreground tabular-nums">
                      {colTotal}
                    </td>
                  );
                })}
                <td className="border border-border bg-muted/20 px-3 py-2 text-center font-bold text-foreground tabular-nums">
                  {domains.reduce((s, d) => s + d.taskMatrix.reduce((a, b) => a + b, 0), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">Low</span>
          <div className="flex h-2 flex-1 overflow-hidden rounded-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: heatBg(i * 6, 95) }} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">High — Assessment volume per cell</span>
        </div>
      </div>

      {/* ── 3. Learning Outcome Alignment ─────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Learning Outcome Alignment
        </p>
        <p className="mb-4 text-[10px] text-muted-foreground">
          Aligned with University of Oulu Learning Outcomes (Bachelor Level). Two example mapped
          outcomes per domain are shown below.
        </p>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain, idx) => (
            <div key={domain.id} className="space-y-1.5">
              <p className="text-[11px] font-semibold" style={{ color: DOMAIN_ACCENTS[idx] }}>
                {domain.title}
              </p>
              {domain.learningOutcomes.slice(0, 2).map((o, i) => (
                <p key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-border" />
                  {o}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Accreditation & Reporting ──────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Accreditation &amp; Reporting Readiness
        </p>
        <p className="mb-4 text-[10px] text-muted-foreground">
          Structured documentation exports available for programme review, quality assurance
          and accreditation processes.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => handleExport("PDF")}
            className="inline-flex items-center gap-2 rounded border border-border bg-muted/20 px-4 py-2 text-xs font-medium text-foreground hover:border-muted-foreground transition-colors"
          >
            <span>↓</span> Export Programme Report (PDF)
          </button>
          <button
            onClick={() => handleExport("CSV")}
            className="inline-flex items-center gap-2 rounded border border-border bg-muted/20 px-4 py-2 text-xs font-medium text-foreground hover:border-muted-foreground transition-colors"
          >
            <span>↓</span> Export Curriculum Mapping (CSV)
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
          Accreditation-ready structured documentation available upon programme request.
          All exports follow the University of Oulu reporting standards and include domain-level breakdowns.
        </p>
      </div>

      {/* ── 5. Scalability Projection ─────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Scalability Projection Panel
        </p>
        <p className="mb-4 text-[10px] text-muted-foreground">
          Projected institutional impact of expanding the generic skills documentation
          framework beyond the current pilot cohort.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Scenario", "Courses", "Est. Students", "Est. Assessments", "Cross-Course Comparison"].map((h) => (
                  <th key={h} className="border border-border bg-muted/30 px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projections.map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-muted/10" : ""}>
                  <td className="border border-border px-4 py-2.5 text-xs font-medium text-foreground">
                    {row.label}
                    {i === 0 && (
                      <span className="ml-2 rounded bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="border border-border px-4 py-2.5 text-xs text-center font-semibold text-foreground tabular-nums">
                    {row.courses}
                  </td>
                  <td className="border border-border px-4 py-2.5 text-xs text-center text-foreground tabular-nums">
                    {row.students.toLocaleString()}
                  </td>
                  <td className="border border-border px-4 py-2.5 text-xs text-center text-foreground tabular-nums">
                    {row.assessments.toLocaleString()}
                  </td>
                  <td className="border border-border px-4 py-2.5 text-xs text-center text-muted-foreground">
                    {i === 0 ? "—" : "Enabled"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Projections are based on current assessment density ({avgAssessmentsPerStudent} assessments/student)
          and assume consistent framework adoption. Cross-course comparison enables programme-level
          tracking of transversal competence development.
        </p>
      </div>
    </div>
  );
}
