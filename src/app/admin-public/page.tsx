import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import GovernanceDashboardContent from "./dashboard-content";

async function getLiveStats() {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Participating students
    const { count: students } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    // Total skill ratings from task_rating_skills
    const { count: skillRatings } = await supabase
      .from("task_rating_skills")
      .select("*", { count: "exact", head: true });

    return {
      participatingStudents: students ?? 0,
      totalSkillRatings: skillRatings ?? 0,
    };
  } catch (err) {
    console.error("Could not fetch live stats:", err);
    return null; // fall back to mock data in dashboard-content
  }
}

export default async function GovernanceDashboardPage() {
  const liveStats = await getLiveStats();
  return <GovernanceDashboardContent liveStats={liveStats ?? undefined} />;
}
