"use client";

import Link from "next/link";
import { ouluGovernanceData } from "@/lib/oulgovernance-data";
import { ExecutiveMetricsRow } from "./components/ExecutiveMetricsRow";
import { DomainTilesGrid } from "./components/DomainTilesGrid";
import { TaskSkillHeatmap } from "./components/TaskSkillHeatmap";
import { CompetenceDistributionCard } from "./components/CompetenceDistributionCard";
import { LearningOutcomeAlignmentCard } from "./components/LearningOutcomeAlignmentCard";
import { ProgrammeBenefitsCard } from "./components/ProgrammeBenefitsCard";
import { FacultyPreviewCard } from "./components/FacultyPreviewCard";

// Live data props (injected from server component)
interface LiveStats {
  participatingStudents: number;
  totalSkillRatings: number;
}

interface GovernanceDashboardContentProps {
  liveStats?: LiveStats;
}

export default function GovernanceDashboardContent({ liveStats }: GovernanceDashboardContentProps) {
  // Merge live data over mock defaults where available
  const data = {
    ...ouluGovernanceData,
    participatingStudents: liveStats?.participatingStudents ?? ouluGovernanceData.participatingStudents,
    totalSkillRatings: liveStats?.totalSkillRatings ?? ouluGovernanceData.totalSkillRatings,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-white font-bold text-base">T</span>
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-tight">
                  Talent3X Pilot Dashboard
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Systematic Documentation of Oulu&rsquo;s Generic Skill Domains (Bachelor Level)
                </p>
              </div>
            </Link>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              University of Oulu
            </p>
            <p className="text-[10px] text-muted-foreground">
              2026–2027 Generic Skills Integration
            </p>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="container mx-auto px-6 py-8 flex-1 space-y-10">

        {/* Mandate Banner */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 px-5 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">2026–2027 mandate:</span> This pilot operationalises
            Oulu&rsquo;s common generic skill framework at course level — providing systematic,
            peer-assessed documentation across all 6 Bachelor-level domains.
          </p>
          <span className="shrink-0 rounded-full border border-blue-500/40 px-3 py-1 text-xs font-semibold text-blue-400">
            Active Pilot
          </span>
        </div>

        {/* Section 1 — Executive Metrics */}
        <section>
          <ExecutiveMetricsRow
            participatingStudents={data.participatingStudents}
            totalSkillRatings={data.totalSkillRatings}
            activatedSubSkills={data.activatedSubSkills}
            genericDomainsCovered={data.genericDomainsCovered}
            avgAssessmentsPerStudent={data.avgAssessmentsPerStudent}
          />
        </section>

        {/* Section 2 — Domain Tiles (dominant above-the-fold element) */}
        <section>
          <DomainTilesGrid domains={data.domains} />
        </section>

        {/* Section 3 — Heatmap + right panels (2/3 + 1/3) */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Heatmap (spans 2 cols) */}
          <div className="lg:col-span-2">
            <TaskSkillHeatmap domains={data.domains} />
          </div>

          {/* Right column: Competence Distribution */}
          <div>
            <CompetenceDistributionCard
              averageAssessmentsPerStudent={data.competenceDistribution.averageAssessmentsPerStudent}
              percentStudentsWith4PlusDomains={data.competenceDistribution.percentStudentsWith4PlusDomains}
              distributionAcross456Domains={data.competenceDistribution.distributionAcross456Domains}
              totalStudents={data.participatingStudents}
            />
          </div>
        </section>

        {/* Section 4 — Learning Outcomes + Benefits (side by side) */}
        <section className="grid gap-6 lg:grid-cols-2">
          <LearningOutcomeAlignmentCard domains={data.domains} />
          <ProgrammeBenefitsCard benefits={data.programmeBenefits} />
        </section>

        {/* Section 5 — Faculty Preview */}
        <section>
          <FacultyPreviewCard
            totalStudents={data.participatingStudents}
            totalRatings={data.totalSkillRatings}
            domainsCovered={data.genericDomainsCovered}
          />
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Talent3X · University of Oulu Pilot ·
            Generic Skills Documentation Framework
          </p>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Use</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
