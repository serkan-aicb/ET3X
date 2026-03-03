"use client";

interface FacultyPreviewCardProps {
  totalStudents: number;
  totalRatings: number;
  domainsCovered: string;
}

export function FacultyPreviewCard({
  totalStudents,
  totalRatings,
  domainsCovered,
}: FacultyPreviewCardProps) {
  function handleExport(type: "PDF" | "CSV") {
    // Stub — no backend needed
    alert(`Export as ${type} — feature available in production deployment.`);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Faculty Dashboard Preview
          </h3>
          <p className="text-xs text-muted-foreground">
            Reduces reporting burden — ready for department-level oversight
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleExport("PDF")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-blue-400 hover:text-blue-400 transition-colors"
          >
            ↓ PDF
          </button>
          <button
            onClick={() => handleExport("CSV")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-emerald-400 hover:text-emerald-400 transition-colors"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      {/* Course skill coverage summary */}
      <div className="mb-5 rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Course Skill Coverage Summary
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Students</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-400">{totalRatings.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Assessments</p>
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-400">{domainsCovered}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Domains</p>
          </div>
        </div>
      </div>

      {/* Cohort heatmap placeholder */}
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Cohort Heatmap (Programme View)
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {[94, 88, 91, 85, 89, 82, 72, 78, 65, 71, 68, 59, 85, 62, 78, 56, 71, 52, 68, 58, 54, 49, 68, 47].map(
            (v, i) => (
              <div
                key={i}
                className="h-6 rounded"
                style={{
                  backgroundColor: `rgba(96, 165, 250, ${v / 100})`,
                }}
                title={`${v}%`}
              />
            )
          )}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          Illustrative — 24-cell cohort coverage grid (6 domains × 4 tasks)
        </p>
      </div>

      <p className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
        ✦ Accreditation-ready exports available upon programme request.
        Full faculty dashboard accessible via institutional access.
      </p>
    </div>
  );
}
