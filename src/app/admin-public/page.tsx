import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import GovernanceDashboardContent, {
  GovernanceLiveData,
} from "./dashboard-content";

// ── Exact oulu_domain TEXT values as stored in public.skills ─
const DOMAIN_KEYS = [
  "Analytical, Critical & Creative Thinking",
  "Sustainability, Responsibility & Ethics",
  "Communication, Interaction & Digital",
  "International & Multicultural",
  "Well-being & Self-Development",
  "Multidisciplinary & Interdisciplinary",
] as const;

// ── Oulu task creator UUID ───────────────────────────────────
// ONLY tasks created by this profile ID are shown in the heatmap.
// Column name in DB is `creator` (FK to profiles.id).
const OULU_CREATOR_UUID = "1a5917c5-fac4-4426-a3e0-cd046dc6a625";
const EXPECTED_OULU_TASK_COUNT = 4;

// ── Local row shapes ─────────────────────────────────────────
type SkillRatingRow = {
  skill_id: number;
  rating_id: string;
  created_at: string;
};

type RatingSessionRow = {
  id: string;
  rated_user_id: string;
  task_id: string;
};

type SkillRow = {
  id: number;
  oulu_domain: string | null;
};

type TaskRow = {
  id: string;
  title: string;
};

// ── Paginated fetcher — bypasses Supabase's default 1000-row cap ─
// Supabase query builders are PromiseLike (thenable), not full Promise
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: { message: string } | null }>, pageSize = 1000): Promise<T[]> {
  const results: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    results.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return results;
}

// ── Server-side data function ────────────────────────────────
async function getGovernanceLiveData(): Promise<GovernanceLiveData> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Q1: Exact student count (no row fetch) ─────────────────
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");
  const totalStudents = studentCount ?? 0;

  // ── Q2: Exact total skill ratings (no row fetch) ───────────
  // Source of truth: COUNT(*) FROM task_rating_skills
  const { count: skillRatingCount, error: countError } = await supabase
    .from("task_rating_skills")
    .select("*", { count: "exact", head: true });
  if (countError) throw new Error(`task_rating_skills count: ${countError.message}`);

  // ── Q3: ALL skill rating rows — paginated ──────────────────
  // Each row = 1 skill assessment. All aggregation is skill-level.
  const skillRatings = await fetchAllRows<SkillRatingRow>(
    (from, to) =>
      supabase
        .from("task_rating_skills")
        .select("skill_id, rating_id, created_at")
        .range(from, to)
  );

  // ── Q4: ALL rating sessions — full table, paginated ────────
  const ratingSessions = await fetchAllRows<RatingSessionRow>(
    (from, to) =>
      supabase
        .from("task_ratings")
        .select("id, rated_user_id, task_id")
        .range(from, to)
  );

  // ── Q5: All 168 skills with TEXT oulu_domain ──────────────
  const { data: rawSkills, error: skillsError } = await supabase
    .from("skills")
    .select("id, oulu_domain");
  if (skillsError) throw new Error(`skills: ${skillsError.message}`);
  const allSkills = (rawSkills ?? []) as SkillRow[];

  // ── Q6: Oulu tasks — locked to single creator UUID ──────────
  // Fetch ALL tasks by this creator, ordered by creation time.
  // Dedup by id, then cap at EXPECTED_OULU_TASK_COUNT.
  const { data: rawOuluTasks, error: ouluTasksError } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("creator", OULU_CREATOR_UUID)
    .order("created_at", { ascending: true });
  if (ouluTasksError) throw new Error(`oulu tasks: ${ouluTasksError.message}`);

  // Deduplicate by id using a Map (order-preserving)
  const uniqueTasks: TaskRow[] = Array.from(
    new Map((rawOuluTasks ?? []).map((t) => [t.id, t as TaskRow])).values()
  );

  if (uniqueTasks.length > EXPECTED_OULU_TASK_COUNT) {
    console.warn(
      `[GovernanceDashboard] WARNING: ${uniqueTasks.length} Oulu tasks found, expected ${EXPECTED_OULU_TASK_COUNT}. Capping at ${EXPECTED_OULU_TASK_COUNT}.`
    );
  } else if (process.env.NODE_ENV !== "production" && uniqueTasks.length < EXPECTED_OULU_TASK_COUNT) {
    console.error(
      `[GovernanceDashboard] ERROR: only ${uniqueTasks.length} Oulu tasks found, expected ${EXPECTED_OULU_TASK_COUNT}.`
    );
  }

  // Hard cap at 4
  const tasks: TaskRow[] = uniqueTasks.slice(0, EXPECTED_OULU_TASK_COUNT);
  const ouluTaskIds = new Set(tasks.map((t) => t.id));

  // ── Build lookup maps ──────────────────────────────────────
  const sessionMap = new Map<string, RatingSessionRow>(
    ratingSessions.map((s) => [s.id, s])
  );
  const skillDomainMap = new Map<number, string | null>(
    allSkills.map((s) => [s.id, s.oulu_domain])
  );

  // ── Per-domain buckets (TEXT-keyed) ───────────────────────
  type DomainBucket = {
    ratingCount: number;             // COUNT(task_rating_skills rows) in domain
    skillIds: Set<number>;           // DISTINCT skill_id in domain
    lastDate: string;
    taskCounts: Map<string, number>; // skill rows per Oulu task_id (heatmap)
    ratedStudentIds: Set<string>;    // distinct students assessed in domain
  };
  const domainBuckets = new Map<string, DomainBucket>();
  for (const dk of DOMAIN_KEYS) {
    domainBuckets.set(dk, {
      ratingCount: 0,
      skillIds: new Set(),
      lastDate: "",
      taskCounts: new Map(),
      ratedStudentIds: new Set(),
    });
  }

  // Per-student domain tracking (for competence distribution)
  const studentDomainMap = new Map<string, Set<string>>();

  // Global executive metric accumulators
  const allActivatedSkillIds = new Set<number>();
  const allDomainsInRatings = new Set<string>();

  // Distinct sessions / rated students from ALL task_ratings (global avg)
  const allRatingSessionIds = new Set<string>(ratingSessions.map((s) => s.id));
  const allRatedUserIds = new Set<string>(ratingSessions.map((s) => s.rated_user_id));

  // ── Single-pass aggregation — SKILL-LEVEL ─────────────────
  // Each iteration = 1 task_rating_skills row = 1 skill assessment.
  // Domain tile "assessments" and heatmap cells both count skill rows.
  for (const row of skillRatings) {
    const session = sessionMap.get(row.rating_id);
    const domain = skillDomainMap.get(row.skill_id);

    allActivatedSkillIds.add(row.skill_id);
    if (domain) allDomainsInRatings.add(domain);

    if (session) {
      if (domain && domainBuckets.has(domain)) {
        const bucket = domainBuckets.get(domain)!;

        // Domain tile: count skill rows
        bucket.ratingCount++;
        bucket.skillIds.add(row.skill_id);
        bucket.ratedStudentIds.add(session.rated_user_id);
        if (!bucket.lastDate || row.created_at > bucket.lastDate) {
          bucket.lastDate = row.created_at;
        }

        // Heatmap: count skill rows per (domain, Oulu task) only
        if (session.task_id && ouluTaskIds.has(session.task_id)) {
          bucket.taskCounts.set(
            session.task_id,
            (bucket.taskCounts.get(session.task_id) ?? 0) + 1
          );
        }
      }

      if (domain) {
        if (!studentDomainMap.has(session.rated_user_id)) {
          studentDomainMap.set(session.rated_user_id, new Set());
        }
        studentDomainMap.get(session.rated_user_id)!.add(domain);
      }
    }
  }

  // ── Executive metrics ──────────────────────────────────────
  const activatedSubSkills = allActivatedSkillIds.size;
  const genericDomainsCovered = `${allDomainsInRatings.size}/6`;
  // Avg = total distinct sessions / distinct rated students (1 decimal)
  const avgRaw =
    allRatedUserIds.size > 0
      ? allRatingSessionIds.size / allRatedUserIds.size
      : 0;
  const avgAssessmentsPerStudent = avgRaw > 0 ? avgRaw.toFixed(1) : "—";

  // ── Per-domain stats ───────────────────────────────────────
  const domainStats = DOMAIN_KEYS.map((dk) => {
    const bucket = domainBuckets.get(dk)!;
    // cohortPercent per domain = students assessed in domain / ALL rated students.
    // Denominator = allRatedUserIds (students with any task_rating), NOT total profiles.
    // This ensures each domain gets its own independent per-domain percentage.
    const cohortPercent =
      allRatedUserIds.size > 0
        ? Math.round((bucket.ratedStudentIds.size / allRatedUserIds.size) * 100)
        : 0;
    // taskMatrix: skill rows per Oulu task, aligned to tasks[] order
    const taskMatrix = tasks.map((t) => bucket.taskCounts.get(t.id) ?? 0);
    return {
      domainKey: dk,
      activatedSubSkills: bucket.skillIds.size,
      totalRatings: bucket.ratingCount,
      coveragePercent: cohortPercent,
      lastAssessmentDate: bucket.lastDate,
      taskMatrix,
    };
  });

  // ── Competence distribution ────────────────────────────────
  let fourDomains = 0;
  let fiveDomains = 0;
  let sixDomains = 0;
  for (const [, domainSet] of studentDomainMap) {
    if (domainSet.size === 4) fourDomains++;
    else if (domainSet.size === 5) fiveDomains++;
    else if (domainSet.size >= 6) sixDomains++;
  }
  const studentsWithFourPlus = fourDomains + fiveDomains + sixDomains;
  const percentStudentsWith4PlusDomains =
    studentDomainMap.size > 0
      ? Math.round((studentsWithFourPlus / studentDomainMap.size) * 100)
      : 0;

  // ── Dev-only debug snapshot ────────────────────────────────
  const __debug =
    process.env.NODE_ENV !== "production"
      ? {
          selectedTaskIds: tasks.map((t) => t.id),
          selectedTaskCount: tasks.length,
          totalSkillRatings: skillRatingCount ?? 0,
          activatedSubSkills,
          sessionsCount: allRatingSessionIds.size,
          ratedStudentsCount: allRatedUserIds.size,
          skillRatingRowsFetched: skillRatings.length,
          domainStatsSummary: domainStats.map((d) => ({
            domain: d.domainKey.slice(0, 30),
            activated: d.activatedSubSkills,
            ratings: d.totalRatings,
            cohort: `${d.coveragePercent}%`,
            matrix: d.taskMatrix,
          })),
          sumDomainRatings: domainStats.reduce((s, d) => s + d.totalRatings, 0),
        }
      : undefined;

  // Server-side console output for quick DB validation in dev
  if (process.env.NODE_ENV !== "production" && __debug) {
    console.log("[GovernanceDashboard]", JSON.stringify(__debug, null, 2));
  }

  return {
    participatingStudents: totalStudents,
    totalSkillRatings: skillRatingCount ?? 0,
    activatedSubSkills,
    genericDomainsCovered,
    avgAssessmentsPerStudent,
    tasks,
    domainStats,
    competenceDistribution: {
      averageAssessmentsPerStudent: Math.round(avgRaw),
      percentStudentsWith4PlusDomains,
      distributionAcross456Domains: { fourDomains, fiveDomains, sixDomains },
    },
    __debug,
  };
}

export default async function GovernanceDashboardPage() {
  const liveData = await getGovernanceLiveData();
  return <GovernanceDashboardContent liveData={liveData} />;
}
