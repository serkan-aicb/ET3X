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
  stars: number;  // Added for average rating calculation
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

  // Skills total is always 168 (static)
  const skillsTotal = 168;

  // Note: Total skill ratings will be calculated from selected tasks only after we have the task list

  // ── Q3: ALL skill rating rows with task_id — paginated ─────
  // Need to join via task_ratings to filter by task_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skillRatingsWithTask = await fetchAllRows<any>(
    (from, to) =>
      supabase
        .from("task_rating_skills")
        .select("skill_id, rating_id, created_at, stars, task_ratings!inner(task_id, rated_user_id)")
        .range(from, to)
  );
  
  // Flatten the nested structure from the join
  type SkillRatingWithTask = SkillRatingRow & { task_id: string; rated_user_id: string };
  const skillRatings: SkillRatingWithTask[] = skillRatingsWithTask.map((row: {
    skill_id: number;
    rating_id: string;
    created_at: string;
    stars: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task_ratings: any;
  }) => {
    const taskInfo = Array.isArray(row.task_ratings) ? row.task_ratings[0] : row.task_ratings;
    return {
      skill_id: row.skill_id,
      rating_id: row.rating_id,
      created_at: row.created_at,
      stars: row.stars,
      task_id: taskInfo?.task_id ?? '',
      rated_user_id: taskInfo?.rated_user_id ?? '',
    };
  });

  // ── Q4: ALL rating sessions — full table, paginated ────────
  // Fetch all for potential use, but we'll filter to Oulu tasks
  const allRatingSessions = await fetchAllRows<RatingSessionRow>(
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
  
  // ── Filter ALL data to only the 4 selected Oulu tasks ──────
  const filteredSkillRatings = skillRatings.filter((r) => ouluTaskIds.has(r.task_id));
  const filteredRatingSessions = allRatingSessions.filter((s) => ouluTaskIds.has(s.task_id));

  // ── Build lookup maps ──────────────────────────────────────
  const sessionMap = new Map<string, RatingSessionRow>(
    filteredRatingSessions.map((s) => [s.id, s])
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
    // For Average Rating Heatmap
    taskStarsSum: Map<string, number>;   // sum of stars per task
    taskStarsCount: Map<string, number>; // count of ratings per task
    // For Skill Density Heatmap
    taskSkillIds: Map<string, Set<number>>; // unique skill IDs per task
  };
  const domainBuckets = new Map<string, DomainBucket>();
  for (const dk of DOMAIN_KEYS) {
    domainBuckets.set(dk, {
      ratingCount: 0,
      skillIds: new Set(),
      lastDate: "",
      taskCounts: new Map(),
      ratedStudentIds: new Set(),
      taskStarsSum: new Map(),
      taskStarsCount: new Map(),
      taskSkillIds: new Map(),
    });
  }

  // Per-student domain tracking (for competence distribution)
  const studentDomainMap = new Map<string, Set<string>>();

  // Global executive metric accumulators
  const allActivatedSkillIds = new Set<number>();
  const allDomainsInRatings = new Set<string>();

  // Distinct sessions / rated students from filtered task_ratings (selected tasks only)
  const allRatingSessionIds = new Set<string>(filteredRatingSessions.map((s) => s.id));
  const allRatedUserIds = new Set<string>(filteredRatingSessions.map((s) => s.rated_user_id));

  // ── Single-pass aggregation — SKILL-LEVEL ─────────────────
  // Each iteration = 1 task_rating_skills row = 1 skill assessment.
  // Domain tile "assessments" and heatmap cells both count skill rows.
  // ONLY using filtered data from the 4 selected Oulu tasks.
  for (const row of filteredSkillRatings) {
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
          
          // Average Rating Heatmap: accumulate stars
          bucket.taskStarsSum.set(
            session.task_id,
            (bucket.taskStarsSum.get(session.task_id) ?? 0) + row.stars
          );
          bucket.taskStarsCount.set(
            session.task_id,
            (bucket.taskStarsCount.get(session.task_id) ?? 0) + 1
          );
          
          // Skill Density Heatmap: track unique skills per task
          if (!bucket.taskSkillIds.has(session.task_id)) {
            bucket.taskSkillIds.set(session.task_id, new Set());
          }
          bucket.taskSkillIds.get(session.task_id)!.add(row.skill_id);
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

  // ── Executive metrics (from selected tasks only) ───────────
  const activatedSubSkills = allActivatedSkillIds.size;
  const genericDomainsCovered = `${allDomainsInRatings.size}/6`;
  
  // Participating students = distinct rated users within selected tasks
  const participatingStudents = new Set(filteredRatingSessions.map((s) => s.rated_user_id)).size;
  
  // Total skill ratings = count of skill rating rows from selected tasks
  const totalSkillRatingsSelected = filteredSkillRatings.length;
  
  // Avg assessments per student = total sessions / distinct students (1 decimal)
  const avgRaw =
    participatingStudents > 0
      ? filteredRatingSessions.length / participatingStudents
      : 0;
  const avgAssessmentsPerStudent = avgRaw > 0 ? avgRaw.toFixed(1) : "—";

  // ── Calculate actual skill counts per domain from database ─────────
  // This is the SOURCE OF TRUTH - count skills by their oulu_domain assignment
  const domainSkillCounts = new Map<string, number>();
  for (const dk of DOMAIN_KEYS) {
    domainSkillCounts.set(dk, 0);
  }
  for (const skill of allSkills) {
    if (skill.oulu_domain && domainSkillCounts.has(skill.oulu_domain)) {
      domainSkillCounts.set(skill.oulu_domain, domainSkillCounts.get(skill.oulu_domain)! + 1);
    }
  }

  // ── Per-domain stats ───────────────────────────────────────
  // Calculate total ratings across all domains for share calculation
  const totalRatingsAllDomains = DOMAIN_KEYS.reduce(
    (sum, dk) => sum + (domainBuckets.get(dk)?.ratingCount ?? 0),
    0
  );
  
  const domainStats = DOMAIN_KEYS.map((dk) => {
    const bucket = domainBuckets.get(dk)!;
    // Domain share = (domain ratings / total ratings from selected tasks) * 100
    const domainSharePercent =
      totalRatingsAllDomains > 0
        ? Math.round((bucket.ratingCount / totalRatingsAllDomains) * 100)
        : 0;
    // taskMatrix: skill rows per Oulu task, aligned to tasks[] order
    const taskMatrix = tasks.map((t) => bucket.taskCounts.get(t.id) ?? 0);
    // Get the ACTUAL skill count for this domain from the database
    const actualSkillCount = domainSkillCounts.get(dk) ?? 0;
    return {
      domainKey: dk,
      activatedSubSkills: actualSkillCount,  // REAL count from skills table
      totalRatings: bucket.ratingCount,
      coveragePercent: domainSharePercent, // Now represents domain share %
      lastAssessmentDate: bucket.lastDate,
      taskMatrix,
    };
  });

  // ── Average Rating Matrix (for Average Rating Heatmap) ───────
  // Rows = domains, Columns = tasks, Cell = average stars
  const averageRatingMatrix = DOMAIN_KEYS.map((dk) => {
    const bucket = domainBuckets.get(dk)!;
    const taskRatings = tasks.map((t) => {
      const sum = bucket.taskStarsSum.get(t.id) ?? 0;
      const count = bucket.taskStarsCount.get(t.id) ?? 0;
      // Return average with 2 decimal precision, or 0 if no ratings
      return count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
    });
    return {
      domainKey: dk,
      taskRatings,
    };
  });

  // ── Skill Density Matrix (for Skill Density Heatmap) ──────────
  // Rows = tasks, Columns = domains, Cell = unique skill count
  const skillDensityMatrix = tasks.map((t) => {
    const domainSkillCounts = DOMAIN_KEYS.map((dk) => {
      const bucket = domainBuckets.get(dk)!;
      const skillSet = bucket.taskSkillIds.get(t.id);
      return skillSet ? skillSet.size : 0;
    });
    return {
      taskId: t.id,
      domainSkillCounts,
    };
  });

  // ── Competence distribution (from selected tasks only) ─────
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
          totalSkillRatings: totalSkillRatingsSelected,
          activatedSubSkills,
          sessionsCount: filteredRatingSessions.length,
          ratedStudentsCount: participatingStudents,
          skillRatingRowsFetched: filteredSkillRatings.length,
          domainStatsSummary: domainStats.map((d) => ({
            domain: d.domainKey.slice(0, 30),
            activated: d.activatedSubSkills,
            ratings: d.totalRatings,
            domainShare: `${d.coveragePercent}%`,
            matrix: d.taskMatrix,
          })),
          sumDomainRatings: domainStats.reduce((s, d) => s + d.totalRatings, 0),
          sumDomainShares: domainStats.reduce((s, d) => s + d.coveragePercent, 0),
        }
      : undefined;

  // Server-side console output for quick DB validation in dev
  if (process.env.NODE_ENV !== "production" && __debug) {
    console.log("[GovernanceDashboard]", JSON.stringify(__debug, null, 2));
  }

  return {
    participatingStudents,
    totalSkillRatings: totalSkillRatingsSelected,
    skillsTotal,
    activatedSubSkills,
    genericDomainsCovered,
    avgAssessmentsPerStudent,
    tasks,
    domainStats,
    averageRatingMatrix,
    skillDensityMatrix,
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
