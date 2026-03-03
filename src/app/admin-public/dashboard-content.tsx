"use client";

import Link from "next/link";
import { OULU_DOMAIN_FRAMEWORK, DomainData, PROGRAMME_BENEFITS } from "@/lib/oulgovernance-data";
import { ExecutiveMetricsRow } from "./components/ExecutiveMetricsRow";
import { DomainTilesGrid } from "./components/DomainTilesGrid";
import { TaskSkillHeatmap } from "./components/TaskSkillHeatmap";
import { CompetenceDistributionCard } from "./components/CompetenceDistributionCard";
import { LearningOutcomeAlignmentCard } from "./components/LearningOutcomeAlignmentCard";
import { ProgrammeBenefitsCard } from "./components/ProgrammeBenefitsCard";

// ── Live data shape injected from server component ───────────
export interface GovernanceLiveData {
  participatingStudents: number;
  totalSkillRatings: number;
  activatedSubSkills: number;
  genericDomainsCovered: string;
  avgAssessmentsPerStudent: string;
  /** Top-4 tasks by session count — used as heatmap columns */
  tasks: { id: string; title: string }[];
  domainStats: {
    domainKey: string;         // exact oulu_domain TEXT value from public.skills
    activatedSubSkills: number;
    totalRatings: number;
    coveragePercent: number;
    lastAssessmentDate: string;
    taskMatrix: number[];      // assessment counts aligned to tasks[]
  }[];
  competenceDistribution: {
    averageAssessmentsPerStudent: number;
    percentStudentsWith4PlusDomains: number;
    distributionAcross456Domains: {
      fourDomains: number;
      fiveDomains: number;
      sixDomains: number;
    };
  };
  /** Dev-only debug snapshot — undefined in production */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __debug?: Record<string, any>;
}

interface GovernanceDashboardContentProps {
  liveData: GovernanceLiveData;
}

export default function GovernanceDashboardContent({
  liveData,
}: GovernanceDashboardContentProps) {
  // Merge static framework text + live numeric stats, matched by exact DB TEXT key
  const domains: DomainData[] = OULU_DOMAIN_FRAMEWORK.map((framework) => {
    const stats = liveData.domainStats.find(
      (s) => s.domainKey === framework.domainKey
    ) ?? {
      domainKey: framework.domainKey,
      activatedSubSkills: 0,
      totalRatings: 0,
      coveragePercent: 0,
      lastAssessmentDate: "",
      taskMatrix: liveData.tasks.map(() => 0),
    };
    return {
      id: framework.id,
      title: framework.title,
      subSkills: framework.subSkills,
      learningOutcomes: framework.learningOutcomes,
      activatedSubSkills: stats.activatedSubSkills,
      totalRatings: stats.totalRatings,
      coveragePercent: stats.coveragePercent,
      lastAssessmentDate: stats.lastAssessmentDate,
      taskMatrix: stats.taskMatrix,
    };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">

          {/* Left: Talent3X logo + dashboard title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white tracking-tight">T3X</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground tracking-tight truncate">
                Talent3X Pilot Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Generic Skills Observatory — Programme-level governance view
              </p>
            </div>
          </div>

          {/* Right: Pilot institutions block */}
          <div className="shrink-0 hidden sm:block text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">
              Pilot Institutions
            </p>
            <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">
              University of Oulu × University of East London
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              2026–2027 Integration
            </p>
          </div>
        </div>
      </header>

      {/* ── Mandate Banner ─────────────────────────────────── */}
      <div className="bg-blue-950/60 border-b border-blue-800/40">
        <div className="container mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-blue-200 leading-relaxed max-w-3xl">
            2026–2027 mandate: This pilot operationalises the common generic skills framework
            at course level — enabling systematic, peer-assessed documentation across all
            6 Bachelor-level domains.
          </p>
          <span className="shrink-0 rounded-full border border-blue-500/40 bg-blue-600/25 px-3 py-1 text-xs font-semibold text-blue-200 whitespace-nowrap">
            Active Pilot · Oulu × UEL
          </span>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-6 py-8 space-y-8">

        {/* Section 1 — Executive Metrics */}
        <section>
          <ExecutiveMetricsRow
            participatingStudents={liveData.participatingStudents}
            totalSkillRatings={liveData.totalSkillRatings}
            activatedSubSkills={liveData.activatedSubSkills}
            genericDomainsCovered={liveData.genericDomainsCovered}
            avgAssessmentsPerStudent={liveData.avgAssessmentsPerStudent}
          />
        </section>

        {/* Section 2 — Domain Tiles */}
        <section>
          <DomainTilesGrid domains={domains} />
        </section>

        {/* Section 3 — Course Task Heatmap */}
        <section>
          <TaskSkillHeatmap domains={domains} tasks={liveData.tasks} />
        </section>

        {/* Section 4 — Competence Distribution + Learning Outcome Alignment */}
        <section className="grid gap-6 md:grid-cols-2">
          <CompetenceDistributionCard
            averageAssessmentsPerStudent={liveData.competenceDistribution.averageAssessmentsPerStudent}
            percentStudentsWith4PlusDomains={liveData.competenceDistribution.percentStudentsWith4PlusDomains}
            distributionAcross456Domains={liveData.competenceDistribution.distributionAcross456Domains}
            totalStudents={liveData.participatingStudents}
          />
          <LearningOutcomeAlignmentCard domains={domains} />
        </section>

        {/* Section 5 — Programme Benefits */}
        <section>
          <ProgrammeBenefitsCard benefits={PROGRAMME_BENEFITS} />
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Talent3X · Generic Skills Documentation Framework
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
